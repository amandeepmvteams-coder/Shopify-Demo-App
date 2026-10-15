
export async function getShopifyClient(shopify, shop) {
    const session = await shopify.ensureValidOfflineSession(shop);
    if (!session) {
        throw new Error(`Shopify session not found for ${shop} - the shop must reinstall the app`);
    }
    return new shopify.api.clients.Graphql({
        session
    });
}
