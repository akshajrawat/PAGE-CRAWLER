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

// first feed
if (require.main === module) {
  const url = process.argv[2];

  if (!url) {
    console.error("❌ Error: You must provide a URL!");
    process.exit(1);
  }

  const run = async () => {
    // 1. MANUALLY SAVE THE SEED TO DB
    console.log("🌱 Seeding Database...");
    await supabase.from("pages").upsert(
      {
        url: url,
        status: "discovered",
      },
      { onConflict: "url" },
    );

    // 2. ADD TO QUEUE
    await addUrlToFrontier(url);

    console.log("✅ Seed URL added successfully.");
    process.exit(0);
  };

  run().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
