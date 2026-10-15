import pool from "../config/postgres.js";
import {
    getPlanCreditLimit
} from "../config/planLimits.js";
export const insertSubscription = async ({
    attemptId,
    shop,
    subscriptionId,
    name,
    status,
    price,
    currency,
    interval,
    trialDays,
    test,
    confirmationUrl,
    planCode,
    creditCount = 0,
    creditLimit = 0,
    isUnlimited = false,
}) => {
    const query = `
        INSERT INTO app_subscriptions (
         attempt_id,
            shop,
            shopify_subscription_id,
            name,
            status,
            price,
            currency,
            billing_interval,
            trial_days,
            is_test,
            confirmation_url,
            plan_code,
            credit_count,
            credit_limit,
            is_unlimited
            
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10,$11,$12,$13,$14,$15)
        ON CONFLICT (shopify_subscription_id)
        DO UPDATE SET
            status = EXCLUDED.status,
            confirmation_url = EXCLUDED.confirmation_url,
            updated_at = CURRENT_TIMESTAMP
        RETURNING *;
    `;

    const values = [
        attemptId,
        shop,
        subscriptionId,
        name,
        status || "PENDING",
        price,
        currency || "USD",
        interval || "EVERY_30_DAYS",
        trialDays ?? 0,
        test ?? false,
        confirmationUrl ?? null,
        planCode,
        creditCount ?? 0,
        creditLimit ?? 0,
        isUnlimited,
    ];

    const {
        rows
    } = await pool.query(query, values);

    return rows[0];
};

export const ensureFreePlan = async (shop) => {
    // 1. Check whether this shop already has a Free Plan
    const existingPlanQuery = `
        SELECT id, shop, plan_code, status
        FROM app_subscriptions
        WHERE shop = $1
          AND plan_code = 'FREE'
        LIMIT 1;
    `;

    const {
        rows
    } = await pool.query(existingPlanQuery, [shop]);

    // 2. If Free Plan exists, reactivate it if inactive
    if (rows.length > 0) {
        if (rows[0].status !== "ACTIVE") {
            const reactivateQuery = `
                UPDATE app_subscriptions
                SET status = 'ACTIVE',
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $1
                RETURNING *;
            `;

            const {
                rows: updatedRows
            } = await pool.query(
                reactivateQuery,
                [rows[0].id]
            );

            console.log(`Free plan reactivated for shop: ${shop}`);

            return updatedRows[0];
        }

        console.log(`Free plan already active for shop: ${shop}`);
        return rows[0];
    }

    // 3. Create Free Plan only if it does not exist

    const insertQuery = `
    INSERT INTO app_subscriptions (
        shop,
        shopify_subscription_id,
        name,
        status,
        price,
        currency,
        billing_interval,
        trial_days,
        is_test,
        confirmation_url,
        plan_code,
        credit_count,
        credit_limit
    )
    VALUES (
        $1,
        NULL,
        'Free Plan',
        'ACTIVE',
        0,
        'USD',
        'FREE',
        0,
        FALSE,
        NULL,
        'FREE',
        0,
        $2
    )
    RETURNING *;
`;

    const {
        rows: insertedRows
    } = await pool.query(
        insertQuery,
        [shop, getPlanCreditLimit("FREE")]
    );

    console.log(`Free plan created for shop: ${shop}`);

    return insertedRows[0];

};


export const cancelActiveSubscription = async (shop, newSubscriptionId) => {
    const query = `
        UPDATE app_subscriptions
        SET status = 'CANCELLED',
            updated_at = CURRENT_TIMESTAMP
        WHERE shop = $1
          AND status = 'ACTIVE'
          AND shopify_subscription_id != $2
        RETURNING shopify_subscription_id, name, status;
    `;

    const {
        rows
    } = await pool.query(query, [
        shop,
        newSubscriptionId
    ]);

    return rows;
};


export const deactivateFreePlan = async (shop) => {
    const query = `
        UPDATE app_subscriptions
        SET status = 'INACTIVE',
            updated_at = CURRENT_TIMESTAMP
        WHERE shop = $1
          AND plan_code = 'FREE'
          AND status = 'ACTIVE'
        RETURNING *;
    `;

    const {
        rows
    } = await pool.query(query, [shop]);

    console.log(`Free plan deactivated for shop: ${shop}`);

    return rows[0] ?? null;
};


export const deactivateActiveSubscriptionOnUninstall = async (shop) => {
    const query = `
        UPDATE app_subscriptions
        SET status = 'INACTIVE',
            updated_at = CURRENT_TIMESTAMP
        WHERE shop = $1
          AND status = 'ACTIVE'
          AND plan_code IS DISTINCT FROM 'FREE'
        RETURNING *;
    `;

    const {
        rows
    } = await pool.query(query, [shop]);

    console.log(
        `Active paid subscriptions deactivated for ${shop}:`,
        rows.length
    );

    return rows;
};



export const consumeBannerViewCredit = async (shop, sessionId) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        // 1. Check whether this storefront session already consumed a credit.
        const existingSession = await client.query(
            `SELECT subscription_id
             FROM storefront_credit_sessions
             WHERE shop = $1 AND session_id = $2`,
            [shop, sessionId]
        );

        if (existingSession.rows.length > 0) {
            // Already counted for this session: don't increment again.
            const subscriptionResult = await client.query(
                `SELECT credit_count, credit_limit, is_unlimited, plan_code
                 FROM app_subscriptions
                 WHERE id = $1`,
                [existingSession.rows[0].subscription_id]
            );

            await client.query("COMMIT");

            if (subscriptionResult.rows.length === 0) {
                return {
                    allowed: false,
                    reason: "SUBSCRIPTION_NOT_FOUND",
                };
            }

            const subscription = subscriptionResult.rows[0];

            return {
                allowed: true,
                alreadyCounted: true,
                creditCount: Number(subscription.credit_count),
                creditLimit: Number(subscription.credit_limit),
                planCode: subscription.plan_code,
            };
        }

        // 2. Lock the effective active subscription.
        const planResult = await client.query(
            `SELECT id, credit_count, credit_limit,is_unlimited, plan_code
             FROM app_subscriptions
             WHERE shop = $1 AND status = 'ACTIVE'
             ORDER BY
                 CASE
                     WHEN plan_code IS DISTINCT FROM 'FREE' THEN 0
                     ELSE 1
                 END,
                 updated_at DESC
             LIMIT 1
             FOR UPDATE`,
            [shop]
        );

        if (planResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return {
                allowed: false,
                reason: "NO_ACTIVE_PLAN",
            };
        }

        const plan = planResult.rows[0];

        // 3. Check the credit limit.
        const creditCount = Number(plan.credit_count ?? 0);
        const isUnlimited = plan.is_unlimited === true;
        const creditLimit = plan.credit_limit === null ?
            null :
            Number(plan.credit_limit);

        if (!isUnlimited && creditCount >= creditLimit) {
            await client.query("ROLLBACK");

            return {
                allowed: false,
                reason: "CREDITS_EXHAUSTED",
                creditCount,
                creditLimit,
                isUnlimited,
                planCode: plan.plan_code,
            };
        }

        // 4. Consume one credit for this session.
        const updatedResult = await client.query(
            `UPDATE app_subscriptions
             SET credit_count = COALESCE(credit_count, 0) + 1,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $1
             RETURNING credit_count, credit_limit,is_unlimited, plan_code`,
            [plan.id]
        );

        // 5. Remember this session. subscription_id is BIGINT to match app_subscriptions.id.
        await client.query(
            `INSERT INTO storefront_credit_sessions
                (shop, session_id, subscription_id)
             VALUES ($1, $2, $3)
             ON CONFLICT (shop, session_id) DO NOTHING`,
            [shop, sessionId, plan.id]
        );

        await client.query("COMMIT");

        const updated = updatedResult.rows[0];

        return {
            allowed: true,
            alreadyCounted: false,
            creditCount: Number(updated.credit_count),
            creditLimit: Number(updated.credit_limit),
            isUnlimited: updated.is_unlimited,
            planCode: updated.plan_code,
        };
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};