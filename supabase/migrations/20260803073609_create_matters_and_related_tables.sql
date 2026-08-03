/*
# Create matters, matter_items, matter_chats, and subscriptions tables

1. New Tables

- `matters`
  - `id` (uuid, primary key)
  - `user_id` (uuid, not null, defaults to authenticated user, references auth.users with cascade delete)
  - `title` (text, not null)
  - `client_ref` (text, nullable — client reference label)
  - `jurisdiction` (text, nullable — legal jurisdiction)
  - `status` (text, not null, defaults to 'active' — values: 'active' or 'archived')
  - `created_at` (timestamptz, defaults to now)
  - `updated_at` (timestamptz, defaults to now, auto-updated via trigger)

- `matter_items`
  - `id` (uuid, primary key)
  - `matter_id` (uuid, not null, references matters with cascade delete)
  - `type` (text, not null — values: 'case', 'article', 'note', 'document', 'timeline')
  - `ecli` (text, nullable — ECLI identifier for case type items)
  - `article_code` (text, nullable — article code for article type items)
  - `content` (jsonb, nullable — flexible content payload)
  - `created_at` (timestamptz, defaults to now)

- `matter_chats`
  - `id` (uuid, primary key)
  - `matter_id` (uuid, not null, references matters with cascade delete)
  - `messages` (jsonb, nullable — array of chat messages)
  - `updated_at` (timestamptz, defaults to now, auto-updated via trigger)

- `subscriptions`
  - `user_id` (uuid, primary key, references auth.users with cascade delete)
  - `plan` (text, not null, defaults to 'free' — values: 'free' or 'pro')
  - `status` (text, not null, defaults to 'active')
  - `current_period_end` (timestamptz, nullable — end of current billing period)

2. Security

- RLS enabled on all four tables.
- `matters`: owner-scoped CRUD — authenticated users can only access their own rows (auth.uid() = user_id).
- `matter_items`: scoped through parent matter — authenticated users can only access items belonging to a matter they own.
- `matter_chats`: scoped through parent matter — same ownership check via the parent matters table.
- `subscriptions`: owner-scoped CRUD — each user can only access their own subscription row.

3. Indexes

- `matters.user_id` — frequent filtering by owner.
- `matter_items.matter_id` — frequent filtering by parent matter.
- `matter_chats.matter_id` — frequent filtering by parent matter.

4. Triggers

- `updated_at` auto-update trigger on `matters` and `matter_chats` so the column stays current without client code.
*/

-- ========================================================
-- matters
-- ========================================================

CREATE TABLE IF NOT EXISTS matters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  client_ref text,
  jurisdiction text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE matters ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_matters_user_id ON matters(user_id);

DROP POLICY IF EXISTS "select_own_matters" ON matters;
CREATE POLICY "select_own_matters" ON matters FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_matters" ON matters;
CREATE POLICY "insert_own_matters" ON matters FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_matters" ON matters;
CREATE POLICY "update_own_matters" ON matters FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_matters" ON matters;
CREATE POLICY "delete_own_matters" ON matters FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ========================================================
-- matter_items
-- ========================================================

CREATE TABLE IF NOT EXISTS matter_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  matter_id uuid NOT NULL REFERENCES matters(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('case', 'article', 'note', 'document', 'timeline')),
  ecli text,
  article_code text,
  content jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE matter_items ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_matter_items_matter_id ON matter_items(matter_id);

DROP POLICY IF EXISTS "select_own_matter_items" ON matter_items;
CREATE POLICY "select_own_matter_items" ON matter_items FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM matters WHERE matters.id = matter_items.matter_id AND matters.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_matter_items" ON matter_items;
CREATE POLICY "insert_own_matter_items" ON matter_items FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM matters WHERE matters.id = matter_items.matter_id AND matters.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_own_matter_items" ON matter_items;
CREATE POLICY "update_own_matter_items" ON matter_items FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM matters WHERE matters.id = matter_items.matter_id AND matters.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM matters WHERE matters.id = matter_items.matter_id AND matters.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_matter_items" ON matter_items;
CREATE POLICY "delete_own_matter_items" ON matter_items FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM matters WHERE matters.id = matter_items.matter_id AND matters.user_id = auth.uid())
  );

-- ========================================================
-- matter_chats
-- ========================================================

CREATE TABLE IF NOT EXISTS matter_chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  matter_id uuid NOT NULL REFERENCES matters(id) ON DELETE CASCADE,
  messages jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE matter_chats ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_matter_chats_matter_id ON matter_chats(matter_id);

DROP POLICY IF EXISTS "select_own_matter_chats" ON matter_chats;
CREATE POLICY "select_own_matter_chats" ON matter_chats FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM matters WHERE matters.id = matter_chats.matter_id AND matters.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_matter_chats" ON matter_chats;
CREATE POLICY "insert_own_matter_chats" ON matter_chats FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM matters WHERE matters.id = matter_chats.matter_id AND matters.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_own_matter_chats" ON matter_chats;
CREATE POLICY "update_own_matter_chats" ON matter_chats FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM matters WHERE matters.id = matter_chats.matter_id AND matters.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM matters WHERE matters.id = matter_chats.matter_id AND matters.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_matter_chats" ON matter_chats;
CREATE POLICY "delete_own_matter_chats" ON matter_chats FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM matters WHERE matters.id = matter_chats.matter_id AND matters.user_id = auth.uid())
  );

-- ========================================================
-- subscriptions
-- ========================================================

CREATE TABLE IF NOT EXISTS subscriptions (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plan text NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  status text NOT NULL DEFAULT 'active',
  current_period_end timestamptz
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_subscriptions" ON subscriptions;
CREATE POLICY "select_own_subscriptions" ON subscriptions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_subscriptions" ON subscriptions;
CREATE POLICY "insert_own_subscriptions" ON subscriptions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_subscriptions" ON subscriptions;
CREATE POLICY "update_own_subscriptions" ON subscriptions FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_subscriptions" ON subscriptions;
CREATE POLICY "delete_own_subscriptions" ON subscriptions FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ========================================================
-- updated_at trigger function (shared)
-- ========================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_matters_updated_at ON matters;
CREATE TRIGGER trg_matters_updated_at
  BEFORE UPDATE ON matters
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_matter_chats_updated_at ON matter_chats;
CREATE TRIGGER trg_matter_chats_updated_at
  BEFORE UPDATE ON matter_chats
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();
