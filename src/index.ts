import { fetchWorker } from "./core/workers/fetch-worker";
import { parseWorker } from "./core/workers/parse-worker";

console.log(">> MOXCETY CRAWLER SYSTEM STARTED <<");
console.log("---------------------------------");
console.log("> Fetch Worker: LISTENING (Queue: crawler-frontier)");
console.log("> Parse Worker: LISTENING (Queue: crawler-parse)");

// on inturuption close smoothly
process.on("SIGINT", async () => {
  console.log("\n🛑 Shutting down workers...");
  await fetchWorker.close();
  await parseWorker.close();
  process.exit(0);
});
