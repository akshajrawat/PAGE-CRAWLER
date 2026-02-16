import axios from "axios";
import { Request, Response } from "express";
import { supabase } from "../../db/supabase";


export const codeSearchController = async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;
    const page = parseInt(req.query.page as string) || 1;

    const response = await axios.post(`${process.env.AI_URL}/embed`, {
      text: query,
    });
    const queryVector = response.data.embedding;

    if (!queryVector || queryVector.length === 0) {
      return res.status(400).json({ error: "No vector received!" });
    }

    const offset = (page - 1) * 10;

    const { data: searchResult, error } = await supabase.rpc(
      "match_code_snippets",
      {
        query_embedding: queryVector,
        match_threshold: 0.5,
        match_count: 10,
        page_offset: offset,
      },
    );

    if (error) {
      console.error(error);
      return res.status(500).json({ error: error.message });
    }

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
