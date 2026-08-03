/*
# Enforce search history limit for free users

1. Purpose
   Free users can only keep 1 saved search at a time (across all their matters).
   Pro users have unlimited saved searches.

2. Changes
   - Creates a SECURITY DEFINER trigger function `enforce_search_history_limit()`
     that runs AFTER INSERT on `matter_searches`.
   - The function looks up the user's subscription plan from the `subscriptions` table.
   - If the user is on the free plan, all prior saved searches owned by that user
     (across all their matters) are deleted, keeping only the most recently inserted one.
   - If the user is on the pro plan, no deletion occurs (unlimited history).
   - Creates a trigger `enforce_search_history_limit_trigger` on `matter_searches`.

3. Security
   - The trigger function is SECURITY DEFINER so it can read the `subscriptions`
     table (which is RLS-protected) and delete rows from `matter_searches` across
     multiple matters owned by the same user.
   - The function is owned by the postgres role and has a fixed `search_path = public`.
   - No new tables or columns are created.
   - No existing data is modified; the trigger only fires on future inserts.

4. Important notes
   - The limit is per-user (across all matters), not per-matter.
   - When a free user saves a new search, their previous search is automatically
     deleted by the trigger — the frontend does not need to handle deletion.
   - The trigger keeps only the single most-recently-inserted row for free users.
*/

-- ========================================================
-- Trigger function: enforce_search_history_limit
-- ========================================================

CREATE OR REPLACE FUNCTION enforce_search_history_limit()
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

  -- Free users: keep only the most recent search (the row just inserted)
  -- Delete all other searches owned by this user across all their matters
  DELETE FROM matter_searches
  WHERE id IN (
    SELECT ms.id
    FROM matter_searches ms
    JOIN matters m ON m.id = ms.matter_id
    WHERE m.user_id = v_user_id
      AND ms.id <> NEW.id
  );

  RETURN NEW;
END;
$$;

-- ========================================================
-- Trigger: fires after each insert on matter_searches
-- ========================================================

DROP TRIGGER IF EXISTS enforce_search_history_limit_trigger ON matter_searches;

CREATE TRIGGER enforce_search_history_limit_trigger
AFTER INSERT ON matter_searches
FOR EACH ROW
EXECUTE FUNCTION enforce_search_history_limit();
