import { supabase } from "../../db/supabase";
import { createQueue, QUEUE_NAMES } from "../../lib/queue";
import crypto from "crypto";
import { isAllowedForCrawl } from "../../utils/url_filter";

const frontierQueue = createQueue(QUEUE_NAMES.FRONTIER);

export const addUrlToFrontier = async (url: string, depth: number = 0) => {
  if (!isAllowedForCrawl(url)) {
    console.log(`🚫 [Queue] Blocked Blacklisted URL: ${url}`);
    return; // Silently drop it, do not add to Redis
  }

  console.log(`📥 Adding to Frontier: ${url}`);
  const safeId = crypto.createHash("md5").update(url).digest("hex");
  await frontierQueue.add(
    "crawl-job",
    {
      url: url,
      depth: depth,
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
    // --- TECH PILLAR ---
    "https://news.ycombinator.com", 
    "https://dev.to", 
    "https://techcrunch.com",

    // --- KNOWLEDGE & NEWS PILLAR ---
    "https://www.bbc.com/news",
    "https://www.theverge.com", 
    "https://medium.com", 
    "https://www.wired.com",

    // --- DOCUMENTATION PILLAR (Keep your favorites) ---
    "https://developer.mozilla.org/en-US/docs/Web",
    "https://python.org",

    // --- OPEN DIRECTORIES ---
    "https://www.dmoz-odp.org", 
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
