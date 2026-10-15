import pool from "../config/postgres.js";

export const createSubscriptionTable = async () => {
    const query = `
        CREATE TABLE IF NOT EXISTS app_subscriptions (
            id BIGSERIAL PRIMARY KEY,
            shop VARCHAR(255) NOT NULL,
            shopify_subscription_id VARCHAR(255) NOT NULL UNIQUE,
            name VARCHAR(255) NOT NULL,
            status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
            price NUMERIC(10, 2) NOT NULL,
            currency VARCHAR(10) NOT NULL DEFAULT 'USD',
            billing_interval VARCHAR(50) NOT NULL DEFAULT 'EVERY_30_DAYS',
            trial_days INTEGER NOT NULL DEFAULT 0,
            is_test BOOLEAN NOT NULL DEFAULT FALSE,
            confirmation_url TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_app_subscriptions_shop
        ON app_subscriptions (shop);
    `;

    try {
        await pool.query(query);
        console.log("app_subscriptions table is ready.");
    } catch (error) {
        console.error("Error creating app_subscriptions table:", error.message);
        throw error;
    }
};

createSubscriptionTable()
    .finally(() => pool.end());