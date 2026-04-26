import { Request, Response } from "express";
import axios from "axios";
import { supabase } from "../../../db/supabase";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Redis } from "@upstash/redis";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Initialize Upstash Redis
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || "",
  token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
});

export const searchController = async (req: Request, res: Response) => {
  try {
    const rawQuery = req.query.q as string;
    const page = parseInt(req.query.page as string) || 1;

    if (!rawQuery) {
      res.status(400).json({ error: "Missing Query field q" });
      return;
    }

    console.log(`Original Query: "${rawQuery}"`);

    const normalizedQuery = rawQuery.toLowerCase().trim();
    const cacheKey = `moxcety:search:${normalizedQuery}:page:${page}`;;

    // Check Redis First
    const cachedResults = await redis.get(cacheKey);
    if (cachedResults) {
      console.log(`⚡ [Search Cache HIT] for: "${rawQuery}"`);
      return res.json(cachedResults);
    }
    console.log(`🧠 [Search Cache MISS] for: "${rawQuery}"`);

    // SEMANTIC QUERY EXPANSION VIA GEMINI
    let expandedQuery = rawQuery;
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      // Strict system instruction to prevent conversational garbage
      const prompt = `You are a search query expander for a technical database. 
      The user searched for: "${rawQuery}". 
      Reply with 3 to 4 highly relevant synonymous technical terms or alternate phrasings to improve vector search recall. 
      Return ONLY a single line of space-separated terms. No commas, no markdown, no quotes, no explanation.`;

      const result = await model.generateContent(prompt);
      const synonyms = result.response.text().trim();

      // Combine original query with the synonyms to create a dense semantic string
      expandedQuery = `${rawQuery} ${synonyms}`;

      console.log(`Expanded Query: "${expandedQuery}"`);
    } catch (llmError) {
      // Graceful degradation: If Gemini fails/timeouts, just use the original query
      console.warn(
        "⚠️ Query Expansion failed, falling back to raw query.",
        llmError,
      );
      expandedQuery = rawQuery;
    }

    const response = await axios.post(`${process.env.AI_URL}/embed`, {
      text: expandedQuery,
    });

    const queryVector = response.data.embedding;

    if (!queryVector || queryVector.length === 0) {
      return res.status(400).json({ error: "No vector received!" });
    }
    const offset = (page - 1) * 10;

    const { data: searchResult, error } = await supabase.rpc("search_pages", {
      query_text: rawQuery,
      match_threshold: 0.55,
      query_embedding: queryVector,
      match_count: 10,
      page_offset: offset,
    });

    if (error) {
      console.error(error);
      return res.status(500).json({ error: error.message });
    }

    // 4. Save to Redis before returning
    await redis.set(
      cacheKey,
      {
        page: page,
        count: searchResult.length,
        data: searchResult || [],
      },
      { ex: 86400 },
    );

    return res.json({
      page: page,
      count: searchResult.length,
      data: searchResult || [],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
