DROP FUNCTION IF EXISTS match_code_snippets(text, vector, double precision, integer, integer);

CREATE OR REPLACE FUNCTION match_code_snippets (
  query_text text,           
  query_embedding vector(384),
  match_threshold float default 0.2,
  match_count int default 10,
  page_offset int default 0
)
RETURNS TABLE (
  id bigint,
  content text,
  language text,
  page_url text,
  page_title text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  
  -- STEP 1: ISOLATE THE HEAVY MATH
  -- Do the vector search FIRST without any joins. This lets pgvector use its index.
  WITH vector_matches AS (
    SELECT 
      c.id, 
      c.content, 
      c.language, 
      c.page_id,
      (1 - (c.embedding <=> query_embedding)) AS base_score
    FROM code_snippets c
    -- Optimize index usage by putting the operator on one side
    WHERE (c.embedding <=> query_embedding) < (1 - match_threshold)
  )
  
  -- STEP 2: APPLY TEXT BOOST AND JOINS
  -- Now we only run ILIKE on the few rows that passed the vector threshold
  SELECT 
    v.id, 
    v.content, 
    v.language, 
    p.url as page_url, 
    p.title as page_title,
    (
      v.base_score + 
      CASE WHEN v.content ILIKE '%' || query_text || '%' THEN 0.2 ELSE 0 END
    )::float as similarity
  FROM vector_matches v
  JOIN pages p ON v.page_id = p.id
  ORDER BY similarity DESC
  LIMIT match_count
  OFFSET page_offset;
END;
$$;