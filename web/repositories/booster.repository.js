import pool from "../config/postgres.js";

export const createBoosterRepository = async ({
    shop,
    name,
    type,
    status,
    content = {},
    design = {},
    placement = {},
}) => {

    const result = await pool.query(
        `
        INSERT INTO order_value_boosters (
            shop,
            name,
            type,
            status,
            content,
            design,
            placement,
            published_at
        )
        VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            CURRENT_TIMESTAMP
        )
        RETURNING *;
        `,
        [
            shop,
            name,
            type,
            status,
            content,
            design,
            placement,
        ]
    );


    return result.rows[0];
};

export const getAllBoosterRepository = async ({
    shop
}) => {
    const result = await pool.query(`
            SELECT * FROM order_value_boosters
            WHERE shop= $1
            ORDER BY created_at DESC;
        `, [shop])

    return result.rows

}

export const updateBoosterRepository = async ({
    id,
    shop,
    name,
    type,
    status,
    content,
    design,
    placement,
}) => {
    const result = await pool.query(
        `
        UPDATE order_value_boosters
        SET
            name = $1,
            type = $2,
            status = $3,
            content = $4,
            design = $5,
            placement = $6,
            updated_at = CURRENT_TIMESTAMP,
            published_at = CURRENT_TIMESTAMP
        WHERE id = $7
          AND shop = $8
        RETURNING *;
        `,
        [
            name,
            type,
            status,
            content,
            design,
            placement,
            id,
            shop,
        ]
    );

    return result.rows[0];
};

export const getBoosterByIdRepository = async ({
    id,
    shop,
}) => {
    const result = await pool.query(
        `
        SELECT *
        FROM order_value_boosters
        WHERE id = $1
          AND shop = $2;
        `,
        [id, shop]
    );

    return result.rows[0];
};

export const unpublishBoosterRepository = async ({
    id,
    shop
}) => {
    const result = await pool.query(
        `
        UPDATE order_value_boosters
        SET
            status = 'unpublished',
            published_at = NULL,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
          AND shop = $2
        RETURNING *;
        `,
        [id, shop]
    );

    return result.rows[0];
};

export const deleteBoosterRepository = async ({
    id,
    shop
}) => {
    const result = await pool.query(
        `
        DELETE FROM order_value_boosters
        WHERE id = $1
          AND shop = $2
        RETURNING *;
        `,
        [id, shop]
    );

    return result.rows[0];
};

export const renameBoosterRepository = async ({
    id,
    shop,
    name
}) => {
    const result = await pool.query(`
        UPDATE  order_value_boosters
        SET 
            name = $1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2 
        AND shop = $3  
        RETURNING *;  
        

        `, [name, id, shop])
    return result.rows[0];
}

export const getPublishBoosterRepository = async ({
    shop,
    type
}) => {

    const result = await pool.query(`
            SELECT * FROM order_value_boosters
            WHERE status='published' 
            AND shop = $1
            AND type = $2
            `, [shop, type])
    return result.rows

}