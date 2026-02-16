import { Request, Response } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getVectorEmbeddings } from "../../services/ai";
import { supabase } from "../../db/supabase";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
export const askController = async (req: Request, res: Response) => {
  const query = req.query.q as string;
  if (!query) {
    return res.status(400).json({ error: "Query is required" });
  }

  try {
    console.log(`🧠 [Ask] Thinking about: "${query}"`);

    const queryVector = await getVectorEmbeddings(query);
    const { data: sources, error } = await supabase.rpc("search_pages", {
      query_text: query,
      match_threshold: 0.5,
      query_embedding: queryVector,
      match_count: 3,
    });
    if (error) {
      console.error("Supabase Error:", error);
      throw error;
    }

    if (!sources || sources.length === 0) {
      return res.json({
        answer:
          "I couldn't find any information on that in my index. Try crawling more documentation!",
        sources: [],
      });
    }

    // Build the "Context Window" for Gemini
    const contextText = sources
      .map(
        (p: any) =>
          `SOURCE: ${p.title}\nURL: ${p.url}\nCONTENT: ${p.body_text.slice(0, 1500)}`,
      )
      .join("\n\n---\n\n");

    // The System Prompt
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `
      You are MOXCETY, an AI search assistant for developers.
      
      USER QUESTION: "${query}"
      
      Use ONLY the following context to answer. 
      - Format with Markdown (bold key terms, use code blocks).
      - Be concise (max 3-5 sentences).
      - If the answer isn't in the context, say "I don't know based on the current index."
      
      CONTEXT:
      ${contextText}
    `;

    // Generate & Send
    const result = await model.generateContent(prompt);
    const answer = result.response.text();

    res.json({
      answer: answer,
      sources: sources.map((s: any) => ({ title: s.title, url: s.url })),
    });
  } catch (error: any) {
    console.error("❌ [Ask] Error:", error.message);
    res.status(500).json({ error: "AI Service Failed" });
  }
};
