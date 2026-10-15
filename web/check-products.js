import pool from "./config/postgres.js";

async function checkProducts() {
    try {
        const result = await pool.query(`
            SELECT *
            FROM shopify_products
            ORDER BY id;
        `);

        console.table(result.rows);
    } catch (error) {
        console.error(error);
    } finally {
        await pool.end();
    }
}

checkProducts();