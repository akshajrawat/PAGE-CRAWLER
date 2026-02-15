CREATE OR REPLACE FUNCTION match_code_snippets (
  query_embedding vector(384),
  match_threshold float default 0,
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
  SELECT
    c.id,
    c.content,
    c.language,
    p.url as page_url,
    p.title as page_title,
    1 - (c.embedding <=> query_embedding) as similarity
  FROM code_snippets c
  JOIN pages p ON c.page_id = p.id
  WHERE 1 - (c.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity desc
  LIMIT match_count
  OFFSET page_offset;
END;
$$;