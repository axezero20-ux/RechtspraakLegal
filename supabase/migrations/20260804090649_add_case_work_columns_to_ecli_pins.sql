/*
# Add case-work columns to ecli_pins

1. Purpose
   The ECLI Code panel's pinned cases (ecli_pins) currently only store ecli
   and title. To make saving case work from the ECLI panel independent of
   the Search panel's case_views table, ecli_pins needs the same rich-data
   columns: summary, analysis, precedents, chat, and updated_at.

2. Changes
   - ALTER TABLE ecli_pins ADD COLUMN summary, analysis, precedents, chat,
     updated_at.
   - updated_at defaults to now() and auto-updates on row change via trigger.

3. Safety
   - All new columns are nullable, so existing rows are unaffected.
   - No data is lost or modified.
   - Idempotent (ADD COLUMN IF NOT EXISTS, DROP ... IF EXISTS for trigger).
*/

ALTER TABLE ecli_pins
  ADD COLUMN IF NOT EXISTS summary    text,
  ADD COLUMN IF NOT EXISTS analysis   jsonb,
  ADD COLUMN IF NOT EXISTS precedents jsonb,
  ADD COLUMN IF NOT EXISTS chat       jsonb,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Auto-update updated_at on row change
DROP TRIGGER IF EXISTS ecli_pins_set_updated_at ON ecli_pins;

CREATE OR REPLACE FUNCTION ecli_pins_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER ecli_pins_set_updated_at
BEFORE UPDATE ON ecli_pins
FOR EACH ROW
EXECUTE FUNCTION ecli_pins_set_updated_at();
