import shopify from "../shopify.js";



const inFlight = new Map();

export function refreshShopSession(shop) {

    if (inFlight.has(shop)) return inFlight.get(shop);

    const p = shopify

        .ensureValidOfflineSession(shop)

        .finally(() => inFlight.delete(shop));

    inFlight.set(shop, p);

    return p;

}