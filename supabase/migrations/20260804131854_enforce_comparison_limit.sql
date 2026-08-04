/*
# Enforce saved comparison limit for free users

1. Purpose
   Free users can only keep 1 saved comparison at a time (across all their matters).
   Pro users have unlimited saved comparisons.

2. Changes
   - Creates a SECURITY DEFINER trigger function `enforce_comparison_limit()`
     that runs AFTER INSERT on `matter_comparisons`.
   - The function looks up the user's subscription plan from the `subscriptions` table.
   - If the user is on the free plan, all prior saved comparisons owned by that user
     (across all their matters) are deleted, keeping only the most recently inserted one.
   - If the user is on the pro plan, no deletion occurs (unlimited comparisons).
   - Creates a trigger `enforce_comparison_limit_trigger` on `matter_comparisons`.

3. Security
   - The trigger function is SECURITY DEFINER so it can read the `subscriptions`
     table (which is RLS-protected) and delete rows from `matter_comparisons` across
     multiple matters owned by the same user.
   - The function is owned by the postgres role and has a fixed `search_path = public`.
   - No new tables or columns are created.
   - No existing data is modified; the trigger only fires on future inserts.

4. Important notes
   - The limit is per-user (across all matters), not per-matter.
   - When a free user saves a new comparison, their previous comparison is automatically
     deleted by the trigger — the frontend does not need to handle deletion.
   - The trigger keeps only the single most-recently-inserted row for free users.
*/

-- ========================================================
-- Trigger function: enforce_comparison_limit
-- ========================================================

CREATE OR REPLACE FUNCTION enforce_comparison_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_plan text;
BEGIN
  -- Get the owner of the parent matter
  SELECT m.user_id INTO v_user_id
  FROM matters m
  WHERE m.id = NEW.matter_id;

  IF v_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Look up the user's subscription plan
  SELECT s.plan INTO v_plan
  FROM subscriptions s
  WHERE s.user_id = v_user_id
  LIMIT 1;

  v_plan := COALESCE(v_plan, 'free');

  -- Pro users: no limit
  IF v_plan = 'pro' THEN
    RETURN NEW;
  END IF;

  -- Free users: keep only the most recent comparison (the row just inserted)
  DELETE FROM matter_comparisons
  WHERE id IN (
    SELECT mc.id
    FROM matter_comparisons mc
    JOIN matters m ON m.id = mc.matter_id
    WHERE m.user_id = v_user_id
      AND mc.id <> NEW.id
  );

  RETURN NEW;
END;
$$;

-- ========================================================
-- Trigger: fires after each insert on matter_comparisons
-- ========================================================

DROP TRIGGER IF EXISTS enforce_comparison_limit_trigger ON matter_comparisons;

CREATE TRIGGER enforce_comparison_limit_trigger
AFTER INSERT ON matter_comparisons
FOR EACH ROW
EXECUTE FUNCTION enforce_comparison_limit();
