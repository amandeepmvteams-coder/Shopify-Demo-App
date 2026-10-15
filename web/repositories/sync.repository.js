import pool from "../config/postgres.js";

export const createSync = async (shopDomain, startedAt) => {
    const result = await pool.query(
        `
        INSERT INTO product_syncs (
            shop_domain,
            status,
            started_at
        )
        VALUES ($1, $2, $3)
        RETURNING id;
        `,
        [shopDomain, "running", startedAt]
    );

    return result.rows[0].id;
};

export const completeSync = async (
    syncId,
    totalFetched,
    totalDeleted
) => {
    await pool.query(
        `
        UPDATE product_syncs
        SET
            status = 'completed',
            completed_at = NOW(),
            total_fetched = $2,
            total_deleted = $3
        WHERE id = $1;
        `,
        [syncId, totalFetched, totalDeleted]
    );
};

export const failSync = async (syncId, errorMessage) => {
    await pool.query(
        `
        UPDATE product_syncs
        SET
            status = 'failed',
            completed_at = NOW(),
            error_message = $2
        WHERE id = $1;
        `,
        [syncId, errorMessage]
    );
};