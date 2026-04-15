import { Queue, Worker } from "bullmq";
import IORedis from "ioredis";

// The Connection Config
const redisConfig = {
  host: process.env.REDIS_HOST || "localhost",
  port: Number(process.env.REDIS_PORT) || 6379,
  maxRetriesPerRequest: null,
};

// Define our Queue Names
const sharedConnection = new IORedis(redisConfig);
export const QUEUE_NAMES = {
  FRONTIER: "crawler-frontier",
  PARSE: "crawler-parse",
};

// Helper to create a Queue
export const createQueue = (name: string) => {
  return new Queue(name, {
    connection: sharedConnection,
    defaultJobOptions: {
      attempts: 20, // Give it plenty of tries if it gets throttled
      backoff: {
        type: "exponential",
        delay: 2000, // If it fails, wait 2s, then 4s, then 8s...
      },
      removeOnComplete: true,
      removeOnFail: false,
    },
  });
};

// Helper to create a Worker
export const createWorker = (
  name: string,
  processor: any,
  concurrency?: number,
) => {
  return new Worker(name, processor, {
    connection: new IORedis(redisConfig),
    concurrency: concurrency || 5,
    limiter: {
      max: 10,
      duration: 1000,
    },
  });
};

// Export the connection for reuse
export { sharedConnection as connection };
