import { Request, Response } from "express";
import { supabase } from "../../db/supabase";
import axios from "axios";

/**
 *
 * @param req
 * @param res
 * @returns JSON of all the
 */
export const searchController = async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;
    const page = parseInt(req.query.page as string) || 1;

    if (!query) {
      res.status(400).json({ error: "Missing Query field q" });
      return;
    }
    const response = await axios.post(`${process.env.AI_URL}/embed`, {
      text: query,
    });
    const queryVector = response.data.embedding;

    if (!queryVector || queryVector.length === 0) {
      return res.status(400).json({ error: "No vector received!" });
    }
    const offset = (page - 1) * 10;

    const { data: searchResult, error } = await supabase.rpc("search_pages", {
      query_text: query,
      match_threshold: 0.5,
      query_embedding: queryVector,
      match_count: 10,
      page_offset: offset,
    });

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
