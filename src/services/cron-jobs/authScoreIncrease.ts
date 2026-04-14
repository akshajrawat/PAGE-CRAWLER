import cron from "node-cron";
import { supabase } from "../../db/supabase";

export const startRankUpdater = () => {
  console.log("⏱️  [Cron] Rank Updater initialized.");

  // 1. Define the actual work
  const updateScores = async () => {
    console.log("🔄 [Cron] Calculating new authority scores...");
    try {
      const { error } = await supabase.rpc("calculate_authority_scores");
      if (error) throw error;
      console.log("✅ [Cron] Authority scores successfully updated.");
    } catch (error) {
      console.error("❌ [Cron] Failed to update authority scores:", error);
    }
  };

  // 2. RUN IT ONCE IMMEDIATELY ON STARTUP
  updateScores();

  // 3. THEN START THE TIMER TO RUN IT EVERY HOUR ('0 * * * *')
  cron.schedule("0 * * * *", updateScores);
};