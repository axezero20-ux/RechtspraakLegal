/*
# Create ecli_pins table for ECLI Code panel pinned cases

1. Purpose
   The ECLI Code panel ("Load by ECLI") gets its own pin storage, separate from
   the case_views pins used by the Search panel.  Free users can pin 1 ECLI case
   at a time; Pro users can pin unlimited ECLI cases.

2. New Tables
   - `ecli_pins`
     - `id`        uuid primary key
     - `user_id`   uuid NOT NULL, defaults to auth.uid(), references auth.users
     - `ecli`      text NOT NULL (the ECLI code, e.g. ECLI:NL:HR:2024:123)
     - `title`     text (case title, nullable)
     - `created_at` timestamptz default now()
   - Unique constraint on (user_id, ecli) so a user can't pin the same ECLI twice.

3. Security
   - RLS enabled on ecli_pins.
   - Four owner-scoped policies (select/insert/update/delete) TO authenticated
     using auth.uid() = user_id.
   - user_id defaults to auth.uid() so client inserts that omit user_id succeed.

4. Free-user limit
   - SECURITY DEFINER trigger function `enforce_ecli_pin_limit()` runs AFTER
     INSERT on ecli_pins.
   - Looks up the user's subscription plan from subscriptions.
   - Free plan: deletes all prior ecli_pins for that user except the newest row.
   - Pro plan: no deletion (unlimited).
   - Trigger `enforce_ecli_pin_limit_trigger` on ecli_pins.

5. Important notes
   - This table is independent of case_views. Pins made from the ECLI Code
     panel do NOT affect pins made from the Search panel, and vice versa.
   - The limit is per-user, not per-matter.
   - Safe to re-run (idempotent: IF NOT EXISTS, DROP ... IF EXISTS).
*/

-- ========================================================
-- Table: ecli_pins
-- ========================================================

CREATE TABLE IF NOT EXISTS ecli_pins (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  ecli       text NOT NULL,
  title      text,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, ecli)
);

ALTER TABLE ecli_pins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_ecli_pins" ON ecli_pins;
CREATE POLICY "select_own_ecli_pins" ON ecli_pins FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_ecli_pins" ON ecli_pins;
CREATE POLICY "insert_own_ecli_pins" ON ecli_pins FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_ecli_pins" ON ecli_pins;
CREATE POLICY "update_own_ecli_pins" ON ecli_pins FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_ecli_pins" ON ecli_pins;
CREATE POLICY "delete_own_ecli_pins" ON ecli_pins FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ========================================================
-- Trigger function: enforce_ecli_pin_limit
-- ========================================================

CREATE OR REPLACE FUNCTION enforce_ecli_pin_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan text;
BEGIN
  SELECT s.plan INTO v_plan
  FROM subscriptions s
  WHERE s.user_id = NEW.user_id
  LIMIT 1;

  v_plan := COALESCE(v_plan, 'free');

  IF v_plan = 'pro' THEN
    RETURN NEW;
  END IF;

  -- Free users: keep only the most recent ecli pin (the row just inserted)
  DELETE FROM ecli_pins
  WHERE id IN (
    SELECT ep.id
    FROM ecli_pins ep
    WHERE ep.user_id = NEW.user_id
      AND ep.id <> NEW.id
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_ecli_pin_limit_trigger ON ecli_pins;

CREATE TRIGGER enforce_ecli_pin_limit_trigger
AFTER INSERT ON ecli_pins
FOR EACH ROW
EXECUTE FUNCTION enforce_ecli_pin_limit();
