import "dotenv/config";
import shopify from "../shopify.js";

const shop = "testing-stores-development.myshopify.com";
try {
    const s = await shopify.ensureValidOfflineSession(shop);
    console.log("OK  token:", s?.accessToken?.slice(0, 12), " expires:", s?.expires);
} catch (e) {
    console.error("REFRESH FAILED:", e?.message || e, e?.response?.body || "");
}
process.exit(0);