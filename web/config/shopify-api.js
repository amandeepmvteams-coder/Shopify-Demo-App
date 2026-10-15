import "dotenv/config";
import "@shopify/shopify-api/adapters/node";

import {
  shopifyApi,
  ApiVersion,
} from "@shopify/shopify-api";

const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET,
  scopes: process.env.SCOPES?.split(","),
  hostName: process.env.HOST?.replace(/https?:\/\//, ""),
  hostScheme: process.env.HOST?.split("://")[0],
  apiVersion: ApiVersion.July25,
  isEmbeddedApp: true,
});

export default shopify;