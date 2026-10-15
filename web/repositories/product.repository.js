import pool from "../config/postgres.js";

export const upsertProducts = async (
    products,
    shopDomain,
    syncStartedAt
) => {
    if (products.length === 0) {
        return;
    }

    const values = [];
    const placeholders = [];

    products.forEach((product, index) => {
        const offset = index * 13;

        placeholders.push(`
            (
                $${offset + 1},
                $${offset + 2},
                $${offset + 3},
                $${offset + 4},
                $${offset + 5},
                $${offset + 6},
                $${offset + 7},
                $${offset + 8},
                $${offset + 9},
                $${offset + 10},
                $${offset + 11},
                $${offset + 12},
                NOW(),
                $${offset + 13},
                false
            )
        `);

        values.push(
            product.id,
            shopDomain,
            product.title,
            product.description,
            product.status,
            product.createdAt,
            product.updatedAt,
            product.productType,
            product.totalInventory,
            product.vendor,
            product.image,
            product.tags,
            syncStartedAt
        );
    });

    await pool.query(
        `
        INSERT INTO shopify_products (
            shopify_product_id,
            shop_domain,
            title,
            description,
            status,
            created_at,
            updated_at,
            product_type,
            total_inventory,
            vendor,
            image,
            tags,
            synced_at,
            last_seen_at,
            is_deleted
        )
        VALUES
        ${placeholders.join(",")}
        ON CONFLICT (shopify_product_id, shop_domain)
        DO UPDATE SET
            title = EXCLUDED.title,
            description = EXCLUDED.description,
            status = EXCLUDED.status,
            created_at = EXCLUDED.created_at,
            updated_at = EXCLUDED.updated_at,
            product_type = EXCLUDED.product_type,
            total_inventory = EXCLUDED.total_inventory,
            vendor = EXCLUDED.vendor,
            image = EXCLUDED.image,
            tags = EXCLUDED.tags,
            synced_at = NOW(),
            last_seen_at = EXCLUDED.last_seen_at,
            is_deleted = false
        `,
        values
    );
};

// export const findProductsNotSeenSince = async (
//     shopDomain,
//     syncStartedAt
// ) => {
//     const result = await pool.query(
//         `
//         SELECT *
//         FROM shopify_products
//         WHERE shop_domain = $1
//           AND last_seen_at < $2
//         ORDER BY id;
//         `,
//         [shopDomain, syncStartedAt]
//     );

//     return result.rows;
// };

export const markProductsAsDeleted = async (
    shopDomain,
    syncStartedAt
) => {
    const result = await pool.query(
        `
        UPDATE shopify_products
        SET is_deleted = true,
            synced_at = NOW()
        WHERE shop_domain = $1
          AND last_seen_at < $2
          AND is_deleted = false
        RETURNING shopify_product_id, title;
        `,
        [shopDomain, syncStartedAt]
    );

    return result.rows;
};

export const getProducts = async (
    shopDomain,
    page = 1,
    limit = 10,
) => {
    const offset = (page - 1) * limit;
    const result = await pool.query(`
        SELECT 
            shopify_product_id,
            title,
            description,
            vendor,
            tags,
            status,
            created_at,
            updated_at,
            product_type,
            total_inventory,
            image

            FROM shopify_products
            WHERE  shop_domain=$1
            AND is_deleted=false
            ORDER BY created_at DESC
            LIMIT $2
            OFFSET $3
        
        `, [shopDomain, limit, offset])

    return result.rows.map((product) => ({
        id: product.shopify_product_id,
        title: product.title,
        description: product.description,
        status: product.status,
        createdAt: product.created_at,
        productType: product.product_type,
        totalInventory: product.total_inventory,
        updatedAt: product.updated_at,
        vendor: product.vendor,
        image: product.image,
        tags: product.tags,
    }));
}

export const getProductsCount = async (shopDomain) => {
    const result = await pool.query(
        `
        SELECT COUNT(*)::integer AS count
        FROM shopify_products
        WHERE shop_domain = $1
          AND is_deleted = false
        `,
        [shopDomain]
    );

    return result.rows[0].count;
};

export const updateProductFromWebhook = async (
    shopDomain,
    payload
) => {
    const shopifyProductId = `gid://shopify/Product/${payload.id}`;

    const result = await pool.query(
        `
        UPDATE shopify_products
        SET
            title = $1,
            description = $2,
            status = $3,
            created_at = $4,
            updated_at = $5,
            product_type = $6,
            vendor = $7,
            tags = $8,
            image = $9,
            synced_at = NOW(),
            is_deleted = false
        WHERE shopify_product_id = $10
          AND shop_domain = $11
        RETURNING *;
        `,
        [
            payload.title,
            payload.body_html,
            payload.status,
            payload.created_at,
            payload.updated_at,
            payload.product_type,
            payload.vendor,
            payload.tags ?
            payload.tags.split(",").map((tag) => tag.trim()) : [],
            payload.image?.src || null,
            shopifyProductId,
            shopDomain,
        ]
    );

    return result.rows[0] || null;
};

export const createProductFromWebhook = async (
    shopDomain,
    payload
) => {
    const shopifyProductId = `gid://shopify/Product/${payload.id}`;

    const result = await pool.query(
        `
        INSERT INTO shopify_products (
            shopify_product_id,
            shop_domain,
            title,
            description,
            status,
            created_at,
            updated_at,
            product_type,
            total_inventory,
            vendor,
            image,
            tags,
            synced_at,
            last_seen_at,
            is_deleted
        )
        VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            $8,
            $9,
            $10,
            $11,
            $12,
            NOW(),
            NOW(),
            false
        )
        ON CONFLICT (shopify_product_id, shop_domain)
        DO UPDATE SET
            title = EXCLUDED.title,
            description = EXCLUDED.description,
            status = EXCLUDED.status,
            created_at = EXCLUDED.created_at,
            updated_at = EXCLUDED.updated_at,
            product_type = EXCLUDED.product_type,
            total_inventory = EXCLUDED.total_inventory,
            vendor = EXCLUDED.vendor,
            image = EXCLUDED.image,
            tags = EXCLUDED.tags,
            synced_at = NOW(),
            last_seen_at = NOW(),
            is_deleted = false
        RETURNING *;
        `,
        [
            shopifyProductId,
            shopDomain,
            payload.title,
            payload.body_html,
            payload.status,
            payload.created_at,
            payload.updated_at,
            payload.product_type,
            null,
            payload.vendor,
            payload.image?.src || null,
            payload.tags ?
            payload.tags.split(",").map((tag) => tag.trim()) : [],
        ]
    );

    return result.rows[0] || null;
};

export const deleteProductFromWebhook = async (shopDomain, payload) => {
    const shopifyProductId = `gid://shopify/Product/${payload.id}`;

    const result = await pool.query(`
           DELETE FROM shopify_products
           WHERE shopify_product_id=$1
           AND shop_domain=$2
           
        `, [shopifyProductId, shopDomain])
    return result.rows[0] || null;
}