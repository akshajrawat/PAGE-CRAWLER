DROP FUNCTION IF EXISTS search_pages(text, vector, double precision, integer, integer);

CREATE OR REPLACE FUNCTION search_pages(
  query_text text,
  query_embedding vector(384),
  match_threshold float DEFAULT 0.5, 
  match_count int DEFAULT 10,
  page_offset int DEFAULT 0
)
RETURNS TABLE (
  id bigint,
  url text,
  title text,
  body_text text,
  description text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH 
  vector_matches AS (
    SELECT p.id, (1 - (p.embedding <=> query_embedding)) AS vector_score
    FROM pages p
    ORDER BY p.embedding <=> query_embedding
    LIMIT 100 
  ),
  keyword_matches AS (
    SELECT p.id, ts_rank_cd(p.search_vector, websearch_to_tsquery('english', query_text), 32) AS keyword_score
    FROM pages p
    WHERE p.search_vector @@ websearch_to_tsquery('english', query_text)
    ORDER BY keyword_score DESC
    LIMIT 100 
  ),
  fuzzy_matches AS (
    SELECT p.id, 
           GREATEST(word_similarity(query_text, p.title), word_similarity(p.title, query_text)) AS fuzzy_score
    FROM pages p
    WHERE p.title % query_text 
    ORDER BY fuzzy_score DESC
    LIMIT 50 
  ),
  combined_ids AS (
    SELECT vm.id FROM vector_matches vm
    UNION SELECT km.id FROM keyword_matches km
    UNION SELECT fm.id FROM fuzzy_matches fm
  )
  SELECT 
    p.id, p.url, p.title, p.body_text, p.description,
    (
      (COALESCE(LEAST(k.keyword_score, 1.0), 0) * 0.2) +      -- 20% Exact Keyword
      (COALESCE(v.vector_score, 0) * 0.4) +                   -- 40% AI Meaning
      (COALESCE(f.fuzzy_score, 0) * 0.3) +                    -- 30% Title Match (Huge for relevance!)
      (log(2.0, (COALESCE(p.authority_score, 1) + 1)::numeric) * 0.1) -- 10% Authority
    )::float AS similarity
  FROM combined_ids c
  JOIN pages p ON p.id = c.id
  LEFT JOIN vector_matches v ON v.id = c.id
  LEFT JOIN keyword_matches k ON k.id = c.id
  LEFT JOIN fuzzy_matches f ON f.id = c.id
  WHERE (v.vector_score > match_threshold OR k.keyword_score > 0.1 OR f.fuzzy_score > 0.3)
  ORDER BY similarity DESC
  LIMIT match_count OFFSET page_offset;
END;
$$;