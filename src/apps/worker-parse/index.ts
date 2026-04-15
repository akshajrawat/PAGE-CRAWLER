import dotenv from "dotenv";
dotenv.config();

// By simply importing the file, Node.js will execute it and start the BullMQ worker
import { parseWorker } from "../../shared/workers/parse-worker";

console.log("[Service] Parse Worker booted and listening to Redis queue...");

// Graceful Shutdown for Docker
process.on("SIGINT", async () => {
  console.log("\n🛑 [Service] Shutting down Parse Worker gracefully...");
  await parseWorker.close();
  process.exit(0);
});