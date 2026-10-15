const PLAN_CREDIT_LIMITS = {
    FREE: 1000,
    STARTER: 10000,
    ESSENTIAL: 50000,
    PROFESSIONAL: "Unlimited",
};

export const getPlanCreditLimit = (planCode) => {
    const normalizedCode = planCode?.toUpperCase();

    if (!(normalizedCode in PLAN_CREDIT_LIMITS)) {
        throw new Error(`Unknown plan code: ${normalizedCode}`);
    }

    return PLAN_CREDIT_LIMITS[normalizedCode];
};