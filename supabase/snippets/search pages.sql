CREATE OR REPLACE FUNCTION search_pages(
  query_text text,
  match_threshold float default 0,
  match_count int DEFAULT 10,
  page_offset int DEFAULT 0
)
RETURNS TABLE (
  id bigint,
  url text,
  title text,
  description text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.url,
    p.title,
    p.description,
    (
      -- RANKING ALGORITHM:
      -- 1. BM25 Match (Weighted by Title > Desc > Body)
      ts_rank_cd(p.search_vector, websearch_to_tsquery('english', query_text), 1 | 32) 
      + 
      -- 2. Authority Boost (Logarithmic decay)
      (ln(COALESCE(p.authority_score, 1) + 1) * 0.05)
    ) AS similarity
  FROM
    pages p
  WHERE
    (p.search_vector @@ websearch_to_tsquery('english', query_text))
  ORDER BY
    similarity DESC
  LIMIT
    match_count
  OFFSET
    page_offset;
END;
$$;