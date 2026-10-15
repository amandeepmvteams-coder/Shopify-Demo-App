import "dotenv/config";
import {
    Worker
} from "bullmq";
import {
    upsertProducts,
    // findProductsNotSeenSince,
    markProductsAsDeleted
} from "../repositories/product.repository.js";
import redisConnection from "../config/redis.js";
import sessionStorage from "../config/shopify-session.js";
import {
    createSync,
    completeSync,
    failSync,
} from "../repositories/sync.repository.js";
import {
    getShopifyClient
} from "../utils/token.js";

const SHOPIFY_PAGE_SIZE = 50;
const DB_BATCH_SIZE = 10;


async function waitForShopifyThrottle(throttleStatus) {
    const minimumAvailable = 200;

    if (
        throttleStatus &&
        throttleStatus.currentlyAvailable < minimumAvailable
    ) {
        const missingPoints =
            minimumAvailable - throttleStatus.currentlyAvailable;

        const waitTime =
            (missingPoints / throttleStatus.restoreRate) * 1000;

        console.log(
            `Shopify API budget low (${throttleStatus.currentlyAvailable}). ` +
            `Waiting ${Math.ceil(waitTime)}ms...`
        );

        await new Promise((resolve) =>
            setTimeout(resolve, waitTime)
        );
    }
}

export function startProductSyncWorker(shopify) {
    const productSyncWorker = new Worker(
        "product-sync",
        async (job) => {
            console.log("Job received:", job.id);

            const shop = job.data.shop;
            const sessionId = `offline_${shop}`;

            console.log("Looking for session:", sessionId);

            const session = await sessionStorage.loadSession(sessionId);
            console.log(session);


            if (!session) {
                throw new Error(`Shopify session not found for ${shop}`);
            }

            console.log("Shopify session found!");
            console.log("Shop:", session.shop);
            console.log("Access token exists:", !!session.accessToken);

            // Same GraphQL client approach as your controller
            // const client = new shopify.api.clients.Graphql({
            //     session,
            // });
            const client = await getShopifyClient(shopify, shop)
            const syncStartedAt = new Date();
            let syncId = null;

            try {
                syncId = await createSync(
                    shop,
                    syncStartedAt
                );

                console.log(`Sync started. Sync ID: ${syncId}`);


                let cursor = null;
                let totalFetched = 0;

                const countResponse = await client.request(`
                                                         query GetProductCount {
                                                             productsCount {
                                                             count
                                                             }
                                                         }
                                                         `);

                const totalProducts = countResponse.data.productsCount.count;

                console.log(`Total products in Shopify: ${totalProducts}`);

                while (true) {
                    const products = await client.request(`
                                                        query GetProducts {
    products(
        first: ${SHOPIFY_PAGE_SIZE}
        ${cursor ? `after: "${cursor}"` : ""}
    ) {
        edges {
            node {
                id
                title
                description
                status
                createdAt
                updatedAt
                productType
                totalInventory
                vendor
                tags

                featuredMedia {
                    preview {
                        image {
                            url
                            altText
                        }
                    }
                }
            }
        }

        pageInfo {
            hasNextPage
            endCursor
        }
    }
}
                                                    `);
                    const throttleStatus =
                        products.extensions?.cost?.throttleStatus;

                    if (throttleStatus) {
                        console.log(
                            `Shopify API - Available: ${throttleStatus.currentlyAvailable}, ` +
                            `Restore rate: ${throttleStatus.restoreRate}`
                        );

                        await waitForShopifyThrottle(throttleStatus);
                    }

                    const productEdges = products.data.products.edges;
                    const pageInfo = products.data.products.pageInfo;

                    const productData = productEdges.map((product) => ({
                        id: product.node.id,
                        title: product.node.title,
                        description: product.node.description,
                        status: product.node.status,
                        createdAt: product.node.createdAt,
                        productType: product.node.productType,
                        totalInventory: product.node.totalInventory,
                        updatedAt: product.node.updatedAt,
                        vendor: product.node.vendor,
                        image: product.node.featuredMedia?.preview?.image?.url,
                        tags: product.node.tags,
                    }));

                    for (let i = 0; i < productData.length; i += DB_BATCH_SIZE) {
                        const batch = productData.slice(i, i + DB_BATCH_SIZE);

                        console.log(`Upserting ${batch.length} products...`);

                        await upsertProducts(
                            batch,
                            shop,
                            syncStartedAt
                        );
                    }

                    totalFetched += productEdges.length;

                    const progress = totalProducts === 0 ?
                        100 :
                        Math.round((totalFetched / totalProducts) * 100);

                    await job.updateProgress(progress);

                    console.log(`Progress: ${progress}%`);

                    console.log(`Fetched ${productEdges.length} products`);
                    console.log(`Total fetched: ${totalFetched}`);

                    if (!pageInfo.hasNextPage) {
                        break;
                    }

                    cursor = pageInfo.endCursor;
                }

                console.log(`Sync finished. Total products: ${totalFetched}`);

                // const productsNotSeen = await findProductsNotSeenSince(
                //     shop,
                //     syncStartedAt
                // );

                //  console.log(
                //     `Products not seen during this sync: ${productsNotSeen.length}`
                // );

                const deletedProducts = await markProductsAsDeleted(
                    shop,
                    syncStartedAt
                );

                console.log(
                    `Products marked as deleted: ${deletedProducts.length}`
                );

                console.log(
                    deletedProducts.map((product) => ({
                        id: product.shopify_product_id,
                        title: product.title,

                    }))
                );


                await completeSync(
                    syncId,
                    totalFetched,
                    deletedProducts.length
                );

                console.log(`Sync completed. Sync ID: ${syncId}`);
                // console.log(
                //     productsNotSeen.map((product) => ({
                //         id: product.shopify_product_id,
                //         title: product.title,
                //     }))
                // );

                return {
                    totalFetched,
                    // productsNotSeen: productsNotSeen.length,
                    deletedProducts: deletedProducts.length,
                };
            } catch (error) {

                if (syncId) {
                    await failSync(
                        syncId,
                        error.message
                    );
                }

                throw error;
            }


        }, {
            connection: redisConnection,

        }
    );

    productSyncWorker.on("completed", (job) => {
        console.log(`Job ${job.id} completed`);
    });

    productSyncWorker.on("failed", (job, error) => {
        console.error(`Job ${job?.id} failed:`, error);
    });

    console.log("Product sync worker started...");

    return productSyncWorker;
}