import { getVectorEmbeddings } from "../services/ai";
import { supabase } from "./supabase";

// Define the shape of data coming from the crawler
export type CrawlResult = {
  title: string;
  links: string[];
  codeSnippets: { language: string; content: string }[];
};

/**
 * The Master Save Function
 * This function orchestrates the saving of Page Data + AI Vectors
 */
export const savePageData = async (url: string, data: CrawlResult) => {
  console.log(` [DB] Saving data for: ${url}`);

  // STEP 1: Update the 'pages' table
  // We mark the page as 'crawled' and save its title.
  const { data: pageRecord, error: pageError } = await supabase
    .from("pages")
    .update({
      title: data.title,
      status: "crawled",
      last_crawled: new Date().toISOString(),
    })
    .eq("url", url)
    .select()
    .single();

  if (pageError || !pageRecord) {
    console.error(`❌ [DB] Error finding page ${url}:`, pageError);
    return; // Stop if the page isn't in our DB (it should be!)
  }

  const pageId = pageRecord.id;

  // STEP 2: Process Code Snippets (THE AI PART)
  // If we found code, we generate vectors and save them.
  if (data.codeSnippets.length > 0) {
    console.log(
      ` [AI] Generating vectors for ${data.codeSnippets.length} snippets...`,
    );

    for (const snippet of data.codeSnippets) {
      try {
        // A. Call Python AI to get the vector [0.1, -0.2...]
        const embedding = await getVectorEmbeddings(snippet.content);

        // B. Insert into Supabase 'code_snippets' table
        const { error } = await supabase.from("code_snippets").insert({
          page_id: pageId,
          language: snippet.language,
          content: snippet.content,
          embedding: embedding, // <--- The Searchable Vector
        });

        if (error) console.error("Error saving snippet:", error);
      } catch (e) {
        console.error("Failed to process snippet vector", e);
      }
    }
  }

  // STEP 3: Add New Links to the Queue
  // We use "upsert" to ignore duplicates automatically.
  if (data.links.length > 0) {
    const linksToInsert = data.links.map((link) => ({
      url: link,
      status: "discovered", // Ready to be crawled next
    }));

    // 'onConflict' ensures we don't crash if the URL already exists
    const { error } = await supabase.from("pages").upsert(linksToInsert, {
      onConflict: "url",
      ignoreDuplicates: true,
    });

    if (error) console.error("Error saving links:", error);
  }

  console.log("✅ [DB] Page saved successfully!");
};
