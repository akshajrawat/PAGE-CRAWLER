import { Request, Response } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getVectorEmbeddings } from "../../../shared/services/ai";
import { supabase } from "../../../db/supabase";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export const askController = async (req: Request, res: Response) => {
  const query = req.query.q as string;
  if (!query) {
    return res.status(400).json({ error: "Query is required" });
  }

  // ESTABLISH STREAMING HEADERS
  // We bypass standard JSON responses to keep the TCP connection open.
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  try {
    console.log(`🧠 [Ask] Thinking about: "${query}"`);

    const queryVector = await getVectorEmbeddings(query);
    const { data: sources, error } = await supabase.rpc("search_pages", {
      query_text: query,
      match_threshold: 0.2,
      query_embedding: queryVector,
      match_count: 3,
    });

    if (error) {
      console.error("Supabase Error:", error);
      throw error;
    }

    if (!sources || sources.length === 0) {
      res.write(
        `data: ${JSON.stringify({ type: "chunk", text: "I couldn't find any information on that in my index." })}\n\n`,
      );
      res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
      return res.end();
    }

    // SEND SOURCES IMMEDIATELY
    // We send the sources to the frontend before the AI even starts typing.
    const formattedSources = sources.map((s: any) => ({
      title: s.title,
      url: s.url,
    }));
    res.write(
      `data: ${JSON.stringify({ type: "sources", data: formattedSources })}\n\n`,
    );

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
      - Use standard quotation marks ("") for quotes, not backticks.
      - Format with Markdown (bold key terms, use code blocks for direct quotes or wherever needed).
      - Synthesize the information naturally. DO NOT repeat yourself.
      - Be concise (max 3-5 sentences).
      - If the answer isn't in the context, say "I don't know based on the current index."
      
      CONTEXT:
      ${contextText}
    `;

    // Generate & Send
    const result = await model.generateContentStream(prompt);
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      // Push each text segment down the pipe as soon as Gemini yields it
      res.write(
        `data: ${JSON.stringify({ type: "chunk", text: chunkText })}\n\n`,
      );
    }

    // 6. CLOSE THE CONNECTION
    res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
    res.end();
  } catch (error: any) {
    console.error("❌ [Ask] Error:", error.message);
    res.write(
      `data: ${JSON.stringify({ type: "error", message: "AI Service Failed" })}\n\n`,
    );
    res.end();
  }
};
