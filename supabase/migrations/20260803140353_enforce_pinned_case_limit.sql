/*
# Enforce pinned case limit for free users

1. Purpose
   Free users can only pin 1 case at a time (stored in case_views).
   Pro users can pin unlimited cases.

2. Changes
   - Creates a SECURITY DEFINER trigger function `enforce_pinned_case_limit()`
     that runs AFTER INSERT on `case_views`.
   - Looks up the user's subscription plan from `subscriptions`.
   - If free plan: deletes all prior pinned cases for that user, keeping only
     the most recently inserted one.
   - If pro plan: no deletion (unlimited pinned cases).
   - Creates trigger `enforce_pinned_case_limit_trigger` on `case_views`.

3. Security
   - SECURITY DEFINER function with fixed search_path = public.
   - No new tables or columns. No existing data modified.
*/

CREATE OR REPLACE FUNCTION enforce_pinned_case_limit()
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

  -- Free users: keep only the most recent pinned case (the row just inserted)
  DELETE FROM case_views
  WHERE id IN (
    SELECT cv.id
    FROM case_views cv
    WHERE cv.user_id = NEW.user_id
      AND cv.id <> NEW.id
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_pinned_case_limit_trigger ON case_views;

CREATE TRIGGER enforce_pinned_case_limit_trigger
AFTER INSERT ON case_views
FOR EACH ROW
EXECUTE FUNCTION enforce_pinned_case_limit();
