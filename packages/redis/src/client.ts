import Redis from "ioredis";

export { Redis };

export const redis = new Redis(
    process.env.REDIS_URL!,{
        lazyConnect: true,
        maxRetriesPerRequest:3
    }
);

