import shopify from "../shopify.js";
import {
    cancelActiveSubscription,
    deactivateFreePlan,
    insertSubscription
} from "../repositories/subscription.repository.js";
import {
    randomUUID
} from "node:crypto";
import pool from "../config/postgres.js";
import {
    getShopifyClient
} from "../utils/token.js";
import {
    getPlanCreditLimit
} from "../config/planLimits.js";


export const createAppSubscription = async (req, res) => {
    try {


        const {
            name,
            lineItems,
            planCode: selectedPlanCode,
            returnUrl,
            test = false,
            trialDays = 7
        } = req.body;

        // Validate request body
        if (!name || typeof name !== "string") {
            return res.status(400).json({
                success: false,
                message: "Subscription name is required"
            });
        }

        if (!Array.isArray(lineItems) || lineItems.length === 0) {
            return res.status(400).json({
                success: false,
                message: "At least one subscription line item is required"
            });
        }

        if (!returnUrl || typeof returnUrl !== "string") {
            return res.status(400).json({
                success: false,
                message: "Return URL is required"
            });
        }

        if (
            !Number.isInteger(trialDays) ||
            trialDays < 0
        ) {
            return res.status(400).json({
                success: false,
                message: "trialDays must be a non-negative integer"
            });
        }

        if (typeof test !== "boolean") {
            return res.status(400).json({
                success: false,
                message: "test must be a boolean"
            });
        }
        console.log("Subscription request:", {
            shop: res.locals.shopify?.session?.shop,
            hasSession: Boolean(res.locals.shopify?.session),
            name: req.body?.name,
            lineItems: req.body?.lineItems,
            returnUrl: req.body?.returnUrl,
            test: req.body?.test,
            trialDays: req.body?.trialDays,
        });
        const shop = res.locals.shopify.session.shop;
        const client = await getShopifyClient(shopify, shop)
        // Check whether this shop has ever had a paid subscription record
        const {
            rows: existingPaidSubscriptions
        } = await pool.query(
            `
    SELECT id
    FROM app_subscriptions
    WHERE shop = $1
      AND plan_code IN ('STARTER', 'ESSENTIAL', 'PROFESSIONAL')
    LIMIT 1
    `,
            [shop]
        );

        // First paid subscription gets a 7-day trial.
        // Existing paid subscription record means no trial.
        const effectiveTrialDays =
            existingPaidSubscriptions.length === 0 ? 7 : 0;

        console.log("Trial test result:", {
            shop,
            existingPaidSubscriptions: existingPaidSubscriptions.length,
            effectiveTrialDays,
        });
        const attemptId = randomUUID();

        const callbackUrl = new URL(returnUrl);
        callbackUrl.searchParams.set("subscriptionAttemptId", attemptId);

        const mutation = `
            mutation AppSubscriptionCreate(
                $name: String!
                $lineItems: [AppSubscriptionLineItemInput!]!
                $returnUrl: URL!
                $trialDays: Int!
                $test: Boolean!
            ) {
                appSubscriptionCreate(
                    name: $name
                    lineItems: $lineItems
                    returnUrl: $returnUrl
                    trialDays: $trialDays
                    test: $test
                ) {
                    appSubscription {
                        id
                        name
                        status
                        test
                        trialDays
                        returnUrl
                        lineItems {
                            id
                        }
                    }
                    confirmationUrl
                    userErrors {
                        field
                        message
                    }
                }
            }
        `;

        const response = await client.request(mutation, {
            variables: {
                name,
                lineItems,
                returnUrl: callbackUrl.toString(),
                test,
                trialDays: effectiveTrialDays,
            }
        });

        const result = response.data?.appSubscriptionCreate;

        if (!result) {
            return res.status(502).json({
                success: false,
                message: "Invalid response from Shopify"
            });
        }

        // Handle Shopify validation errors
        if (result.userErrors?.length > 0) {
            return res.status(422).json({
                success: false,
                message: "Failed to create subscription",
                errors: result.userErrors
            });
        }


        if (!result.appSubscription || !result.confirmationUrl) {
            return res.status(502).json({
                success: false,
                message: "Shopify did not return a subscription confirmation URL"
            });
        }

        // 1. Get subscription details returned by Shopify
        const subscription = result.appSubscription;
        const session = res.locals.shopify.session;

        // 2. Get pricing details from the request
        const pricing = lineItems[0]?.plan?.appRecurringPricingDetails;

        // 3.  Cancel the existing active subscription in the database
        try {
            const cancelledSubscriptions = await cancelActiveSubscription(
                session.shop,
                subscription.id
            );
            console.log("Selected plan code:", selectedPlanCode);
            console.log(
                "Previous active subscriptions cancelled:",
                cancelledSubscriptions
            );

            // 4. Insert subscription into PostgreSQL

            const allowedPlanCodes = [
                "starter",
                "essential",
                "professional",
            ];

            if (!allowedPlanCodes.includes(selectedPlanCode)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid plan code",
                });
            }

            const creditLimit = getPlanCreditLimit(
                selectedPlanCode.toUpperCase()
            );

            const isUnlimited = creditLimit === "Unlimited";


            const subscriptionData = {
                attemptId,
                shop: session.shop,
                subscriptionId: subscription.id,
                name: subscription.name,
                status: subscription.status,
                price: pricing?.price?.amount,
                currency: pricing?.price?.currencyCode,
                interval: pricing?.interval,
                trialDays: effectiveTrialDays,
                test,
                confirmationUrl: result.confirmationUrl,
                planCode: selectedPlanCode.toUpperCase(),
                creditCount: 0,
                creditLimit: isUnlimited ? null : creditLimit,
                isUnlimited,
            };

            // Find and reuse an inactive record for this same plan
            const {
                rows: inactiveRows
            } = await pool.query(
                `SELECT id
                FROM app_subscriptions
                WHERE shop = $1
                AND name = $2
                AND status = 'INACTIVE'
                AND plan_code IS DISTINCT FROM 'FREE'
                ORDER BY updated_at DESC
                LIMIT 1`,
                [session.shop, subscription.name]
            );

            let savedSubscription;

            if (inactiveRows.length > 0) {
                // Reuse the old database row with the new Shopify subscription details

                const {
                    rows
                } = await pool.query(
                    `UPDATE app_subscriptions
                    SET shopify_subscription_id = $1,
                        attempt_id = $2,
                        status = $3,
                        price = $4,
                        currency = $5,
                        billing_interval = $6,
                        trial_days = $7,
                        is_test = $8,
                        confirmation_url = $9,
                        plan_code = $10,
                        credit_count = $11,
                        credit_limit = $12,
                        is_unlimited = $13,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = $13
                    RETURNING *`,
                    [
                        subscriptionData.subscriptionId,
                        subscriptionData.attemptId,
                        subscriptionData.status,
                        subscriptionData.price,
                        subscriptionData.currency,
                        subscriptionData.interval,
                        subscriptionData.trialDays,
                        subscriptionData.test,
                        subscriptionData.confirmationUrl,
                        subscriptionData.planCode,
                        subscriptionData.creditCount,
                        subscriptionData.creditLimit,
                        subscriptionData.isUnlimited,
                        inactiveRows[0].id,
                    ]
                );

                savedSubscription = rows[0];


                console.log("Reused inactive subscription record:", savedSubscription.id);
            } else {
                // No reusable inactive record exists, so insert a new one
                savedSubscription = await insertSubscription(subscriptionData);

                console.log("Inserted new subscription record:", savedSubscription.id);
            }


            console.log(
                "Subscription saved to database:",
                savedSubscription.shopify_subscription_id
            );
        } catch (error) {
            // Shopify already created the subscription.
            // Don't prevent the merchant from receiving the confirmation URL.
            console.error(
                "Database subscription insert failed:",
                error.message
            );
        }

        // 4. Return the existing response to the frontend
        return res.status(201).json({
            success: true,
            message: "Subscription created successfully",
            data: {
                subscription,
                confirmationUrl: result.confirmationUrl

            },
        });





    } catch (error) {
        console.error("========== SUBSCRIPTION ERROR ==========");
        console.error("Message:", error.message);
        console.error("========================================");

        return res.status(500).json({
            success: false,
            message: "Failed to create subscription",
        });
    }


};

export const syncSubscriptionStatus = async (req, res) => {
    try {
        const session = res.locals.shopify?.session;
        const {
            attemptId
        } = req.body;

        if (!session?.shop) {
            return res.status(401).json({
                success: false,
                message: "Shopify session not found",
            });
        }

        if (!attemptId) {
            return res.status(400).json({
                success: false,
                message: "Subscription attempt ID is required",
            });
        }

        // Find this subscription for the authenticated shop
        const {
            rows
        } = await pool.query(
            `SELECT shopify_subscription_id
             FROM app_subscriptions
             WHERE attempt_id = $1 AND shop = $2`,
            [attemptId, session.shop]
        );

        if (!rows.length) {
            return res.status(404).json({
                success: false,
                message: "Subscription not found",
            });
        }

        const subscriptionId = rows[0].shopify_subscription_id;

        const shop = session?.shop;
        const client = await getShopifyClient(shopify, shop)

        const response = await client.request(
            `query GetAppSubscription($id: ID!) {
                node(id: $id) {
                    ... on AppSubscription {
                        id
                        status
                    }
                }
            }`, {
                variables: {
                    id: subscriptionId
                },
            }
        );

        const subscription = response.data?.node;

        console.log("Sync Subscription Shopify GraphQl Api :", subscription);


        if (!subscription?.status) {
            return res.status(502).json({
                success: false,
                message: "Unable to retrieve subscription status from Shopify",
            });
        }

        // Store the verified Shopify status
        await pool.query(
            `UPDATE app_subscriptions
             SET status = $1, updated_at = CURRENT_TIMESTAMP
             WHERE attempt_id = $2 AND shop = $3`,
            [subscription.status, attemptId, session.shop]
        );

        // Deactivate the Free Plan when the paid plan is ACTIVE
        if (subscription.status === "ACTIVE") {
            await deactivateFreePlan(session.shop);

            console.log(
                `Free Plan deactivated for shop: ${session.shop}`
            );
        }


        return res.status(200).json({
            success: true,
            status: subscription.status,
        });
    } catch (error) {
        console.error("Subscription status sync failed:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to sync subscription status",
        });
    }
};


export const getCurrentSubscription = async (req, res) => {
    try {
        const session = res.locals.shopify?.session;

        if (!session?.shop) {
            return res.status(401).json({
                success: false,
                message: "Shopify session not found",
            });
        }

        const shop = session.shop;
        const client = await getShopifyClient(shopify, shop);

        // 1. Fetch active subscriptions from Shopify
        const query = `
            query GetCurrentSubscription {
                currentAppInstallation {
                    activeSubscriptions {
                        id
                        name
                        createdAt
                        status
                        test
                        trialDays
                        currentPeriodEnd
                    }
                }
            }
        `;

        const response = await client.request(query);

        const activeSubscriptions =
            response.data?.currentAppInstallation
            ?.activeSubscriptions ?? [];

        const activeSubscription = activeSubscriptions.find(
            (subscription) => subscription.status === "ACTIVE"
        );

        // 2. If a paid subscription is active, fetch its credit details
        // from PostgreSQL using the Shopify subscription ID.
        if (activeSubscription) {
            const {
                rows
            } = await pool.query(
                `
                SELECT
                    id AS "databaseId",
                    plan_code AS "planCode",
                    credit_count,
                    credit_limit,
                    is_unlimited,
                    price,
                    currency,
                    billing_interval AS "billingInterval"
                FROM app_subscriptions
                WHERE shop = $1
                  AND shopify_subscription_id = $2
                ORDER BY updated_at DESC
                LIMIT 1
                `,
                [shop, activeSubscription.id]
            );

            const databaseSubscription = rows[0];

            if (!databaseSubscription) {
                console.error(
                    "Active Shopify subscription has no matching database record:",
                    activeSubscription.id
                );

                return res.status(500).json({
                    success: false,
                    message: "Subscription exists in Shopify but its database record was not found",
                });
            }

            return res.status(200).json({
                success: true,
                data: {
                    activeSubscription: {
                        ...activeSubscription,
                        ...databaseSubscription,
                        credit_count: Number(
                            databaseSubscription.credit_count ?? 0
                        ),
                        credit_limit: databaseSubscription.credit_limit === null ?
                            null : Number(databaseSubscription.credit_limit),

                        is_unlimited: databaseSubscription.is_unlimited,
                    },
                    source: "shopify+database",
                },
            });
        }

        // 3. No active paid subscription: fetch the Free plan
        const {
            rows
        } = await pool.query(
            `
            SELECT
                id AS "databaseId",
                shop,
                name,
                status,
                plan_code AS "planCode",
                price,
                currency,
                billing_interval AS "billingInterval",
                trial_days AS "trialDays",
                created_at AS "createdAt",
                updated_at AS "updatedAt",
                credit_count,
                credit_limit
            FROM app_subscriptions
            WHERE shop = $1
              AND plan_code = 'FREE'
              AND status = 'ACTIVE'
            ORDER BY updated_at DESC
            LIMIT 1
            `,
            [shop]
        );

        return res.status(200).json({
            success: true,
            data: {
                activeSubscription: rows[0] ? {
                    ...rows[0],
                    credit_count: Number(
                        rows[0].credit_count ?? 0
                    ),
                    credit_limit: Number(
                        rows[0].credit_limit ?? 0
                    ),
                } : null,
                source: "database",
            },
        });
    } catch (error) {
        console.error(
            "Get current subscription error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: "Failed to fetch current subscription",
        });
    }
};