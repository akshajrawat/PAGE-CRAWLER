import { Queue, Worker } from "bullmq";
import IORedis from "ioredis";

// 1. The Connection Config
const redisConfig = {
  host: "localhost",
  port: 6379,
  maxRetriesPerRequest: null,
};

// 2. Define our Queue Names
const sharedConnection = new IORedis(redisConfig);
export const QUEUE_NAMES = {
  FRONTIER: "crawler-frontier",
  PARSE: "crawler-parse",
};

// 3. Helper to create a Queue
export const createQueue = (name: string) => {
  return new Queue(name, { connection: sharedConnection });
};

// 4. Helper to create a Worker
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
