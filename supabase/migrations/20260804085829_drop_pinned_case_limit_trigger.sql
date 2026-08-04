/*
# Remove enforce_pinned_case_limit trigger from case_views

1. Purpose
   The `case_views` table stores saved case work (summary, analysis,
   precedents, chat). It was also used as the Search panel's "pinned cases"
   list, with a trigger that deleted all prior rows for free users on every
   INSERT. This caused saving a case from the ECLI Code panel (or anywhere)
   to silently wipe the Search panel's pinned case.

   The ECLI Code panel already has its own separate `ecli_pins` table with its
   own limit enforcement, so the cross-panel collision is unnecessary.

2. Changes
   - DROP TRIGGER `enforce_pinned_case_limit_trigger` on `case_views`.
   - DROP FUNCTION `enforce_pinned_case_limit()`.

3. Safety
   - No data is lost. Existing `case_views` rows are preserved.
   - No tables or columns are modified.
   - Idempotent (DROP ... IF EXISTS).
*/

DROP TRIGGER IF EXISTS enforce_pinned_case_limit_trigger ON case_views;
DROP FUNCTION IF EXISTS enforce_pinned_case_limit();
