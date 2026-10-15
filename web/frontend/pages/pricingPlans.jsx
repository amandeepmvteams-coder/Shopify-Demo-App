import React, { useEffect, useState } from 'react'

const activePlan = {
    id: "1111",
    planType: "free",
    name: "Free",
    views: 1000,
    perks: [
        "Unlimited Top-bar boosters",
        "Unlimited Product page boosters"
    ]
};

const plans = [
    {
        id: "101",
        planType: "starter",
        name: "Starter",
        views: 10000,
        perks: [
            "Everything in Free",
            "Geolocation targeting",
            "Exclude products"
        ],
        currency: "USD",
        price: {
            monthly: 9.99,
            yearly: 100
        },
        trialDays: 7
    },
    {
        id: "102",
        planType: "essential",
        name: "Essential",
        views: 50000,
        perks: [
            "Everything in Starter",
            "Unlimited cart page boosters",
            "Add upsell products",
            "Translations",
            "Adding booster using product tags",
            "Analytics"
        ],
        currency: "USD",
        price: {
            monthly: 14.99,
            yearly: 140
        },
        trialDays: 7
    },
    {
        id: "103",
        planType: "professional",
        name: "Professional",
        views: "Unlimited",
        perks: [
            "All premium features",
            "Unlimited product boosters",
            "Unlimited top bar boosters",
            "Unlimited cart page boosters",
            "Upsells & Analytics"
        ],
        currency: "USD",
        price: {
            monthly: 29.99,
            yearly: 300
        },
        trialDays: 7
    }
];
const PricingPlans = () => {
    const [billingInterval, setBillingInterval] =
        useState("monthly");

    const formatPrice = (plan) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: plan.currency
        }).format(plan.price[billingInterval]);
    };

    const [currentSubscription, setCurrentSubscription] = useState(null);
    const [subscriptionLoading, setSubscriptionLoading] = useState(true);

    const fetchCurrentSubscription = async () => {
        try {
            const response = await fetch("/api/subscription/current", {
                credentials: "include",
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message || "Failed to fetch current subscription"
                );
            }

            setCurrentSubscription(
                result.data.activeSubscription ?? null
            );
        } catch (error) {
            console.error("Current subscription error:", error);
        } finally {
            setSubscriptionLoading(false);
        }
    };

    useEffect(() => {
        fetchCurrentSubscription();
    }, []);

    const currentPlanType =
        currentSubscription?.planCode === "FREE"
            ? "free"
            : currentSubscription?.name
                ?.replace(/\s+Plan$/i, "")
                .toLowerCase() || "free";

    const currentPlanDetails =
        currentPlanType === "free"
            ? activePlan
            : plans.find((plan) => plan.planType === currentPlanType) ||
            activePlan;

    const currentPlanName =
        currentSubscription?.name ||
        `${activePlan.name} Plan`;

    const isFreePlan = currentPlanType === "free";

    const handleSubscribe = async (plan) => {
        try {
            const shop = window.shopify?.config?.shop;

            const shopName = shop?.replace(".myshopify.com", "");

            const payload = {
                name: `${plan.name} Plan`,
                planCode: plan.planType,
                lineItems: [
                    {
                        plan: {
                            appRecurringPricingDetails: {
                                price: {
                                    amount: plan.price.monthly,
                                    currencyCode: plan.currency,
                                },
                                interval: "EVERY_30_DAYS",
                            },
                        },
                    },
                ],
                returnUrl: `https://admin.shopify.com/store/${shopName}/apps/dummy-product-app-1/orderValueBooster`,
                test: true,
                trialDays: 7,
            };


            const response = await fetch("/api/subscription/create", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify(payload),
            });

            const result = await response.json().catch(() => ({}));

            if (!response.ok || !result.success) {
                console.error("Subscription API failed:", {
                    status: response.status,
                    response: result,
                });

                throw new Error(
                    result.details ||
                    result.message ||
                    `Subscription failed with status ${response.status}`
                );
            }

            const confirmationUrl = result.data?.confirmationUrl;

            if (!confirmationUrl) {
                throw new Error("Shopify confirmation URL not received");
            }

            window.top.location.href = confirmationUrl;


        } catch (error) {
            console.error("Subscription error:", error);
            alert(error.message || "Something went wrong");
        }
    };
    return (
        <s-page heading='Pricing Plans'>

            <s-stack display='flex' direction='block' gap='base'>
                {/* Heading Section  */}
                <s-stack display='flex' direction='inline' alignItems='center' gap='base'>
                    <s-icon type='arrow-left'></s-icon>
                    <s-heading fontSize='large-300' >Pricing Plans</s-heading>
                </s-stack>

                {/* Active Plans Credits Usage Section  */}
                <s-section >

                    <s-stack display="flex" direction="block" gap="base" >

                        <s-stack display="flex" direction="inline" alignItems="center" >
                           <s-paragraph fontSize="small">
                                    {subscriptionLoading ? (
                                        "Loading your current plan..."
                                    ) : currentSubscription ? (
                                        <>
                                            You're currently on{" "}
                                            <s-text fontWeight="bold">
                                                {currentSubscription.name}
                                            </s-text>
                                            {" "}
                                            {"("}
                                            {Number(currentSubscription?.credit_count ?? 0).toLocaleString()}
                                            {" / "}
                                            {Number(currentSubscription?.credit_limit ?? 0).toLocaleString()}
                                            {" monthly views"}
                                            {")."}

                                            {currentSubscription.status && (
                                                <>
                                                   {" "}
                                                    <s-text fontSize="small">
                                                        One visitor can have multiple views per session.
                                                    </s-text>
                                                </>
                                            )}

                                            {currentSubscription.trialDays > 0 &&
                                                ` · ${currentSubscription.trialDays} trial days`}

                                            {currentSubscription.currentPeriodEnd &&
                                                ` · Current period ends ${new Date(
                                                    currentSubscription.currentPeriodEnd
                                                ).toLocaleDateString()}`}
                                        </>
                                    ) : (
                                        <>
                                            You're currently on{" "}
                                            <s-text fontWeight="bold">Free Plan</s-text>.
                                        </>
                                    )}
                                </s-paragraph>

                            <s-icon type="question-circle" color="subdued" />
                        </s-stack>
                        { currentSubscription && (
                            <s-progress
                                accessibilityLabel="Monthly banner views used"
                                value={Number(currentSubscription.credit_count ?? 0)}
                                max={Math.max(
                                    Number(currentSubscription.credit_limit ?? 0),
                                    1
                                )}
                            />
                        )}

                    </s-stack>


                </s-section>

                {/* Current Active Plan Section */}
                <s-section>
                    <s-stack display='flex' direction='inline' justifyContent='space-between'  >
                        <s-stack inlineSize='75%'>
                            <s-heading fontSize="large-100">
                                {subscriptionLoading ? "Loading plan..." : currentPlanName}
                            </s-heading>

                            <s-stack display='flex' direction='inline' gap='base' rowGap="none" alignItems='center'   >
                                <s-text color="subdued" fontSize="small">
                                    Up to{" "}
                                    <s-text color="base" fontWeight="bold">
                                        {currentPlanDetails.views}
                                    </s-text>{" "}
                                    monthly views
                                </s-text>
                                {currentPlanDetails.perks.map((perk) => (
                                    <s-stack
                                        display="flex"
                                        key={perk}
                                        direction="inline"
                                        alignItems="center"
                                    >
                                        <s-icon type="check" />
                                        <s-text color="subdued" fontSize="small">
                                            {perk}
                                        </s-text>
                                    </s-stack>
                                ))}
                            </s-stack>
                        </s-stack>
                        <s-stack display='flex' direction='block' justifyContent='center'>

                            <s-button variant='secondary' tone='auto' disabled>
                                Your current plan
                            </s-button>
                        </s-stack>
                    </s-stack>

                </s-section>

                {/* Overall Plans Section */}
                <s-grid
                    gridTemplateColumns="repeat(3, 1fr)"
                    gap="small"
                    justifyContent="center"
                >
                    {
                        plans.map((plan) => (
                            <s-grid-item key={plan.id} gridColumn="auto" >

                                <s-section >
                                    <s-stack display='flex' direction='block' justifyContent="space-between" blockSize='300px' >
                                        <s-stack display='flex' direction='block' >

                                            <s-stack display='flex' direction='inline' gap='base'>

                                                <s-heading>{plan.name}</s-heading>
                                                {
                                                    plan.planType === 'essential' && (
                                                        <s-badge tone='info'>Popular</s-badge>
                                                    )
                                                }
                                            </s-stack>
                                            <s-text fontSize='small'>{plan.planType === 'professional' ? `${plan.views} booster views` : `Up to ${plan.views} monthly views`}</s-text>
                                        </s-stack>


                                        <s-stack display='flex' direction='block' >
                                            {
                                                plan.perks.map((perk, index) => (
                                                    <s-stack display='flex' key={index} direction='inline' alignItems='center' >
                                                        <s-icon type='check'></s-icon>
                                                        <s-text color='subdued' fontSize='small'>{perk}</s-text>
                                                    </s-stack>
                                                ))
                                            }

                                        </s-stack>
                                        <s-stack display='flex' direction='inline' alignItems='last baseline'>
                                            <s-heading fontSize='large-400' fontWeight='bold'>
                                                ${plan.price.monthly}
                                            </s-heading>
                                            <s-text fontWeight='bold' color='subdued'>/month</s-text>
                                        </s-stack>

                                        <s-button
                                            variant="primary"
                                            inlineSize="fill"
                                            loading={subscriptionLoading}
                                            disabled={
                                                subscriptionLoading ||
                                                (!isFreePlan && currentPlanType === plan.planType)
                                            }
                                            onClick={() => handleSubscribe(plan)}
                                        >
                                            {!subscriptionLoading &&
                                                !isFreePlan &&
                                                currentPlanType === plan.planType
                                                ? "Your current plan"
                                                : "Start FREE 7-days trial"}
                                        </s-button>
                                    </s-stack>

                                </s-section>
                            </s-grid-item>

                        ))
                    }
                </s-grid>

                <s-section>
                    <s-stack direction='inline' gap='base' blockSize='100%' inlineSize='100%' alignItems='center'>
                        <s-box blockSize='100px' inlineSize='100px'>

                            <s-image
                                src="https://freeshipping-essential-apps.uk/money_back1.svg"
                                alt="Pricing Logo"
                                aspectRatio="1/1"
                                objectFit="contain"
                                borderRadius="base"
                                inlineSize="fill"
                            />
                        </s-box>
                        <s-stack display='flex' direction='block' inlineSize='800px'>
                            <s-heading fontWeight='bold' fontSize='large-100'>30 Day Money Back Guarantee - No questions asked!</s-heading>
                            <s-text>If you decide that paid subscription is not meeting your needs, you can request a refund within the first 30 days of your subscription, and we will refund you the money via Shopify’s billing. No questions asked.</s-text>
                        </s-stack>


                    </s-stack>
                </s-section>

            </s-stack>

        </s-page>
    )
}

export default PricingPlans
