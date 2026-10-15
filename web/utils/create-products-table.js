import pool from "../config/postgres.js";

async function createProductsTable() {
    try {
        await pool.query(`
    CREATE TABLE IF NOT EXISTS shopify_products (
        id SERIAL PRIMARY KEY,

        shopify_product_id VARCHAR(255) NOT NULL,
        shop_domain VARCHAR(255) NOT NULL,

        title TEXT,
        status VARCHAR(50),
        created_at TIMESTAMP,
        updated_at TIMESTAMP,
        product_type TEXT,
        total_inventory INTEGER,
        vendor TEXT,
        image TEXT,
        tags TEXT[],

        synced_at TIMESTAMP DEFAULT NOW(),

        UNIQUE (shopify_product_id, shop_domain)
    );
`);

        console.log("shopify_products table created successfully!");
    } catch (error) {
        console.error("Failed to create table:", error);
    } finally {
        await pool.end();
    }
}

createProductsTable();