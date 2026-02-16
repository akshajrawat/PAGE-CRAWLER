DROP FUNCTION if exists search_pages(text,vector,double precision,integer,integer);

CREATE OR REPLACE FUNCTION search_pages(
  query_text text,
  query_embedding vector(384),
  match_threshold float default 0,
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
  SELECT
    p.id,
    p.url,
    p.title,
    p.body_text,
    p.description,
    (
      -- RANKING ALGORITHM:
      (ts_rank_cd(p.search_vector, websearch_to_tsquery('english', query_text), 32) * 0.3)
      +
      -- 2. VECTOR SCORE (Cosine Similarity is -1 to 1)
      ((1 - (p.embedding <=> query_embedding)) * 0.5)
      
      +
      -- 3. FUZZY TITLE MATCH (Typo fixing)
      -- This calculates how similar the query is to the title (0 to 1)
      (word_similarity(query_text, p.title) * 0.1)
      +
      -- Check B: Is the Title inside the Query? (e.g. Query "What is Ract", Title "React")
      -- This captures your specific issue!
      (word_similarity(p.title, query_text) * 0.1)

      +
      -- 3. AUTHORITY BOOST (Tiny nudge)
      (log(2.0, (COALESCE(p.authority_score, 1) + 1)::numeric) * 0.05)
    ) AS similarity
  FROM
    pages p
  WHERE
    (p.search_vector @@ websearch_to_tsquery('english', query_text))
    OR
    (1 - (p.embedding <=> query_embedding) > match_threshold)
    OR
    (word_similarity(query_text, p.title) > 0.3 OR word_similarity(p.title, query_text) > 0.3)
  ORDER BY
    similarity DESC
  LIMIT
    match_count
  OFFSET
    page_offset;
END;
$$;