import Redis from "ioredis";

// Redis connection for BullMQ
const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

// Create a shared Redis connection 
let redisInstance: Redis | null = null;

export const redis = new Proxy({} as Redis, {
  get(_, prop) {
    if (!redisInstance) {
      redisInstance = new Redis(redisUrl, {
        maxRetriesPerRequest: null, // Required for BullMQ
        enableReadyCheck: false,
        lazyConnect: true, 
      });

      redisInstance.on("error", (err) => {
        console.error("Redis connection error:", err.message);
      });

      redisInstance.on("connect", () => {
        console.log("Connected to Redis");
      });
    }
    return (redisInstance as unknown as Record<string | symbol, unknown>)[prop];
  },
});

// Connection for BullMQ
export const getRedisConnection = () => ({
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
  lazyConnect: true,
});
