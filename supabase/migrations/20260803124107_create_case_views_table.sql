/*
# Create case_views table

1. New Tables

- `case_views`
  - `id` (uuid, primary key)
  - `user_id` (uuid, not null, defaults to authenticated user, references auth.users with cascade delete)
  - `ecli` (text, not null — the case identifier)
  - `title` (text, nullable — case title for display)
  - `summary` (text, nullable — AI-generated summary)
  - `analysis` (jsonb, nullable — full CaseAnalysis object)
  - `precedents` (jsonb, nullable — full PrecedentAnalysis object)
  - `chat` (jsonb, nullable — array of ChatMessage objects)
  - `updated_at` (timestamptz, defaults to now, auto-updated via trigger)

2. Security

- RLS enabled on `case_views`.
- Owner-scoped CRUD: each authenticated user can only access their own case views (auth.uid() = user_id).
- Four separate policies (SELECT, INSERT, UPDATE, DELETE).

3. Indexes

- `case_views.user_id` — frequent filtering by owner.
- `case_views.ecli` — frequent lookups by ECLI.

4. Constraints

- Unique on (user_id, ecli) — one saved view per case per user. Upsert on save.
*/

CREATE TABLE IF NOT EXISTS case_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  ecli text NOT NULL,
  title text,
  summary text,
  analysis jsonb,
  precedents jsonb,
  chat jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, ecli)
);

ALTER TABLE case_views ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_case_views_user_id ON case_views(user_id);
CREATE INDEX IF NOT EXISTS idx_case_views_ecli ON case_views(ecli);

DROP POLICY IF EXISTS "select_own_case_views" ON case_views;
CREATE POLICY "select_own_case_views" ON case_views FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_case_views" ON case_views;
CREATE POLICY "insert_own_case_views" ON case_views FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_case_views" ON case_views;
CREATE POLICY "update_own_case_views" ON case_views FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_case_views" ON case_views;
CREATE POLICY "delete_own_case_views" ON case_views FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS trg_case_views_updated_at ON case_views;
CREATE TRIGGER trg_case_views_updated_at
  BEFORE UPDATE ON case_views
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();
