import { supabase } from "../../db/supabase";
import { createQueue, QUEUE_NAMES } from "../../lib/queue";
import crypto from "crypto";

const frontierQueue = createQueue(QUEUE_NAMES.FRONTIER);

export const addUrlToFrontier = async (url: string) => {
  console.log(`📥 Adding to Frontier: ${url}`);
  const safeId = crypto.createHash("md5").update(url).digest("hex");
  await frontierQueue.add(
    "crawl-job",
    {
      url: url,
    },
    {
      jobId: safeId,
      removeOnComplete: true,
      attempts: 3,
    },
  );

  console.log(`✅ [Queue] Job Added: ${safeId}`);
};

// RUNNER
if (require.main === module) {
  const seedUrls = [
    "https://react.dev",
    "https://nextjs.org/docs",
    "https://developer.mozilla.org/en-US/docs/Web/JavaScript",
    "https://tailwindcss.com/docs",
    "https://python.org",
    "https://nodejs.org/en/docs",
    "https://supabase.com/docs",
    "https://www.docker.com", // Added 'www' (canonical usually better)
  ];

  const run = async () => {
    try {
      console.log("🌱 Seeding Database...");

      // 1. MANUALLY SAVE THE SEED TO DB (Corrected!)
      // We map the array of strings to an array of objects
      const rowsToInsert = seedUrls.map((u) => ({
        url: u,
        status: "discovered",
      }));

      const { error } = await supabase
        .from("pages")
        .upsert(rowsToInsert, { onConflict: "url", ignoreDuplicates: true });

      if (error) throw error;

      // 2. ADD TO QUEUE
      console.log("🚀 pushing to Redis...");
      for (const u of seedUrls) {
        await addUrlToFrontier(u);
      }

      console.log("✅ Seed complete. Start your workers!");
      process.exit(0);
    } catch (err) {
      console.error("❌ Seed Failed:", err);
      process.exit(1);
    }
  };

  run();
}
