import { supabase } from "../../../db/supabase";
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
    "https://react.dev/reference/react",
    "https://nextjs.org/docs",

    "https://www.postgresql.org/docs/current/tutorial-start.html",
    "https://redis.io/docs/",

    "https://docs.python.org/3/tutorial/index.html",
    "https://js.langchain.com/docs/get_started/introduction",

    "https://tailwindcss.com/docs/utility-first",
  ];

  const run = async () => {
    try {
      console.log("🌱 Seeding Database...");

      // We map the array of strings to an array of objects
      const rowsToInsert = seedUrls.map((u) => ({
        url: u,
        status: "discovered",
      }));

      const { error } = await supabase
        .from("pages")
        .upsert(rowsToInsert, { onConflict: "url", ignoreDuplicates: true });

      if (error) throw error;

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
