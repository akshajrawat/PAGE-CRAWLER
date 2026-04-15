import dotenv from "dotenv";
dotenv.config();

// By simply importing the file, Node.js will execute it and start the BullMQ worker
import { fetchWorker } from "../../shared/workers/fetch-worker";

console.log("[Service] Fetch Worker booted and listening to Redis queue...");

// Graceful Shutdown for Docker
process.on("SIGINT", async () => {
  console.log("\n🛑 [Service] Shutting down Fetch Worker gracefully...");
  await fetchWorker.close();
  process.exit(0);
});

