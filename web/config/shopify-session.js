import "dotenv/config";

import {
    PostgreSQLSessionStorage
} from "@shopify/shopify-app-session-storage-postgresql";

const sessionStorage = new PostgreSQLSessionStorage(
    process.env.DATABASE_URL
);

export default sessionStorage;