/*
# Add matter_searches, matter_comparisons, and matter_uploads tables

1. New Tables

- `matter_searches`
  - `id` (uuid, primary key)
  - `matter_id` (uuid, not null, references matters with cascade delete)
  - `query` (text, nullable — the search query text)
  - `filters` (jsonb, nullable — date range, court, subject, type filters used)
  - `results` (jsonb, not null — array of search result entries)
  - `created_at` (timestamptz, defaults to now)

- `matter_comparisons`
  - `id` (uuid, primary key)
  - `matter_id` (uuid, not null, references matters with cascade delete)
  - `eclis` (jsonb, not null — array of ECLI strings compared)
  - `result` (jsonb, not null — the full comparison analysis object)
  - `created_at` (timestamptz, defaults to now)

- `matter_uploads`
  - `id` (uuid, primary key)
  - `matter_id` (uuid, not null, references matters with cascade delete)
  - `file_name` (text, not null — original uploaded file name)
  - `file_type` (text, nullable — pdf, docx, text)
  - `file_size` (integer, nullable — file size in bytes)
  - `text_content` (text, nullable — extracted text, capped at 80000 chars)
  - `summary` (text, nullable — AI-generated summary)
  - `chat` (jsonb, nullable — array of chat messages about this document)
  - `created_at` (timestamptz, defaults to now)

2. Security

- RLS enabled on all three new tables.
- All tables are scoped through the parent matter: authenticated users can only
  access rows belonging to a matter they own (EXISTS check against matters.user_id = auth.uid()).
- Four separate CRUD policies per table (SELECT, INSERT, UPDATE, DELETE).

3. Indexes

- `matter_searches.matter_id` — filter by parent matter.
- `matter_comparisons.matter_id` — filter by parent matter.
- `matter_uploads.matter_id` — filter by parent matter.
*/

-- ========================================================
-- matter_searches
-- ========================================================

CREATE TABLE IF NOT EXISTS matter_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  matter_id uuid NOT NULL REFERENCES matters(id) ON DELETE CASCADE,
  query text,
  filters jsonb,
  results jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE matter_searches ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_matter_searches_matter_id ON matter_searches(matter_id);

DROP POLICY IF EXISTS "select_own_matter_searches" ON matter_searches;
CREATE POLICY "select_own_matter_searches" ON matter_searches FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM matters WHERE matters.id = matter_searches.matter_id AND matters.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_matter_searches" ON matter_searches;
CREATE POLICY "insert_own_matter_searches" ON matter_searches FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM matters WHERE matters.id = matter_searches.matter_id AND matters.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_own_matter_searches" ON matter_searches;
CREATE POLICY "update_own_matter_searches" ON matter_searches FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM matters WHERE matters.id = matter_searches.matter_id AND matters.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM matters WHERE matters.id = matter_searches.matter_id AND matters.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_matter_searches" ON matter_searches;
CREATE POLICY "delete_own_matter_searches" ON matter_searches FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM matters WHERE matters.id = matter_searches.matter_id AND matters.user_id = auth.uid())
  );

-- ========================================================
-- matter_comparisons
-- ========================================================

CREATE TABLE IF NOT EXISTS matter_comparisons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  matter_id uuid NOT NULL REFERENCES matters(id) ON DELETE CASCADE,
  eclis jsonb NOT NULL DEFAULT '[]'::jsonb,
  result jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE matter_comparisons ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_matter_comparisons_matter_id ON matter_comparisons(matter_id);

DROP POLICY IF EXISTS "select_own_matter_comparisons" ON matter_comparisons;
CREATE POLICY "select_own_matter_comparisons" ON matter_comparisons FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM matters WHERE matters.id = matter_comparisons.matter_id AND matters.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_matter_comparisons" ON matter_comparisons;
CREATE POLICY "insert_own_matter_comparisons" ON matter_comparisons FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM matters WHERE matters.id = matter_comparisons.matter_id AND matters.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_own_matter_comparisons" ON matter_comparisons;
CREATE POLICY "update_own_matter_comparisons" ON matter_comparisons FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM matters WHERE matters.id = matter_comparisons.matter_id AND matters.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM matters WHERE matters.id = matter_comparisons.matter_id AND matters.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_matter_comparisons" ON matter_comparisons;
CREATE POLICY "delete_own_matter_comparisons" ON matter_comparisons FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM matters WHERE matters.id = matter_comparisons.matter_id AND matters.user_id = auth.uid())
  );

-- ========================================================
-- matter_uploads
-- ========================================================

CREATE TABLE IF NOT EXISTS matter_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  matter_id uuid NOT NULL REFERENCES matters(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_type text,
  file_size integer,
  text_content text,
  summary text,
  chat jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE matter_uploads ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_matter_uploads_matter_id ON matter_uploads(matter_id);

DROP POLICY IF EXISTS "select_own_matter_uploads" ON matter_uploads;
CREATE POLICY "select_own_matter_uploads" ON matter_uploads FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM matters WHERE matters.id = matter_uploads.matter_id AND matters.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_matter_uploads" ON matter_uploads;
CREATE POLICY "insert_own_matter_uploads" ON matter_uploads FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM matters WHERE matters.id = matter_uploads.matter_id AND matters.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_own_matter_uploads" ON matter_uploads;
CREATE POLICY "update_own_matter_uploads" ON matter_uploads FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM matters WHERE matters.id = matter_uploads.matter_id AND matters.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM matters WHERE matters.id = matter_uploads.matter_id AND matters.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_matter_uploads" ON matter_uploads;
CREATE POLICY "delete_own_matter_uploads" ON matter_uploads FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM matters WHERE matters.id = matter_uploads.matter_id AND matters.user_id = auth.uid())
  );
