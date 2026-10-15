import "dotenv/config";
import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

pool.on("connect", () => {
    console.log("PostgreSQL connected");
});

pool.on("error", (error) => {
    console.error("PostgreSQL pool error:", error);
});

export default pool;