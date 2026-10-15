import IORedis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

const redisConnection = new IORedis(
    process.env.REDIS_URL,
    {
        maxRetriesPerRequest: null,
    }
);

redisConnection.on("connect", () => {
    console.log("Redis connected");
});

redisConnection.on("error", (error) => {
    console.error("Redis connection error:", error.message);
});

export default redisConnection;


// import IORedis from 'ioredis'

// const redisConnection = new IORedis({
//     host: "127.0.0.1",
//     port: 6379,
//     maxRetriesPerRequest: null,
// })

// redisConnection.on("connect", () => {
//     console.log("Redis connected");

// })

// redisConnection.on("error", (error) => {
//     console.error("Redis connection error:", error);
// });

// export default redisConnection;