import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom';

const OrderValueBooster = () => {
    const [boosters, setBoosters] = useState([])
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [currentSubscription, setCurrentSubscription] = useState(null);
    const [subscriptionLoading, setSubscriptionLoading] = useState(true);
    const navigate = useNavigate()
    const getBoosters = async () => {
        try {
            const response = await fetch("/api/boosters");

            const text = await response.text();

            let result = {};

            try {
                result = text ? JSON.parse(text) : {};
            } catch {
                throw new Error(
                    `Invalid JSON response. HTTP status: ${response.status}`
                );
            }

            if (!response.ok) {
                throw new Error(
                    result.message || `Failed to fetch boosters: ${response.status}`
                );
            }

            setBoosters(Array.isArray(result.data) ? result.data : []);
            return result.data;

        } catch (error) {
            console.error("Get boosters error:", error);
            setBoosters([]);
        }
    };

    const syncSubscriptionStatus = async () => {
        const params = new URLSearchParams(window.location.search);

        const attemptId = params.get("subscriptionAttemptId");

        if (!attemptId) {
            return;
        }

        try {
            const response = await fetch("/api/subscription/sync-status", {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ attemptId }),
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message || "Failed to sync subscription status"
                );
            }


            // Remove the tracking parameter after successful synchronization.
            params.delete("subscriptionAttemptId");

            const query = params.toString();
            const newUrl = query
                ? `${window.location.pathname}?${query}`
                : window.location.pathname;

            window.history.replaceState({}, "", newUrl);
        } catch (error) {
            console.error("Subscription status sync error:", error);
        }
    };
    const getCurrentSubscription = async () => {
        try {
            setSubscriptionLoading(true);

            const response = await fetch("/api/subscription/current", {
                credentials: "include",
            });

            const result = await response.json();


            if (!response.ok || !result.success) {
                throw new Error(
                    result.message || "Failed to fetch subscription"
                );
            }

            setCurrentSubscription(result.data.activeSubscription);
        } catch (error) {
            console.error("Get subscription error:", error);
        } finally {
            setSubscriptionLoading(false);
        }
    };

    useEffect(() => {
        const loadPage = async () => {
            try {
                setLoading(true);
                setError("");


                await Promise.all([
                    getBoosters(),
                    getCurrentSubscription(),
                    syncSubscriptionStatus()
                ]);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        loadPage();
    }, []);

    return (
        <s-page heading="Essential Free Shipping" >
            <s-stack gap="base" display="flex" direction="block" blockSize="">
                <s-stack display="flex" direction="inline" justifyContent="space-between" >
                    <s-heading fontSize="large-200" fontWeight="bold">Your order value boosters</s-heading>
                    <s-button variant="primary" href="/orderValueBoosterType" >Create a new booster</s-button>
                </s-stack>
                <s-section>
                    <s-stack
                        display="flex"
                        direction="inline"
                        gap="base"
                        justifyContent="space-between"
                    >
                        <s-stack
                            display="flex"
                            direction="block"
                            inlineSize={
                                (!currentSubscription ||
                                    currentSubscription.planCode === "FREE")
                                    ? "80%"
                                    : "100%"
                            }
                            gap="base"
                        >
                            <s-stack
                                display="flex"
                                direction="inline"
                                alignItems="center"
                            >
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
                                            {")"}

                                            {currentSubscription.status && (
                                                <>
                                                    {" "}Status:{" "}
                                                    <s-text fontWeight="bold">
                                                        {currentSubscription.status}
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

                                <s-icon
                                    type="question-circle"
                                    color="subdued"
                                />
                            </s-stack>


                            {!subscriptionLoading && currentSubscription && (
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

                        {!subscriptionLoading &&
                            (!currentSubscription ||
                                currentSubscription.planCode === "FREE") && (
                                <s-stack
                                    display="flex"
                                    direction="inline"
                                    gap="base"
                                    alignItems="center"
                                >
                                    <s-button
                                        variant="secondary"
                                        href="/pricingPlans"
                                    >
                                        Upgrade
                                    </s-button>

                                    <s-icon
                                        type="menu-horizontal"
                                        color="subdued"
                                    />
                                </s-stack>
                            )}
                    </s-stack>
                </s-section>
                <s-section padding="none">
                    <s-table>
                        <s-table-header-row>
                            <s-table-header>Offer / Booster name</s-table-header>
                            <s-table-header>Booster-id</s-table-header>
                            <s-table-header>Status</s-table-header>
                            <s-table-header >Type</s-table-header>
                        </s-table-header-row>
                        <s-table-body>
                            {
                                boosters.map((booster) => (
                                    <s-table-row key={booster.id}
                                        onClick={() => {
                                            navigate(
                                                `/item?type=${booster.type}&id=${booster.id}`
                                            );
                                        }}
                                    >
                                        <s-table-cell>{booster.name}</s-table-cell>
                                        <s-table-cell>{booster.id}</s-table-cell>
                                        <s-table-cell>
                                            <s-badge tone={booster.status === 'published' ? "success" : " "}>
                                                {booster.status}
                                            </s-badge>
                                        </s-table-cell>
                                        <s-table-cell>{booster.type}</s-table-cell>
                                    </s-table-row>
                                ))
                            }


                        </s-table-body>
                    </s-table>
                </s-section>

            </s-stack>

        </s-page>
    )
}

export default OrderValueBooster
