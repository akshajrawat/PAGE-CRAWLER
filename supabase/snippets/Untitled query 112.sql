-- 1. Enable Fuzzy Search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Create a Trigram Index on the Title (Critical for speed)
-- We only do this on Title because doing it on Body Text is too slow.
CREATE INDEX idx_pages_title_trgm ON pages USING gin (title gin_trgm_ops);