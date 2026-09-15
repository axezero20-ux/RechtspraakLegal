/*
# Create password_reset_codes table

1. Purpose
   - Stores one-time 6-digit OTP codes used for the custom password reset flow.
   - The code is generated server-side in an edge function, stored here with an
     expiry timestamp, and emailed to the user. When the user submits the code
     along with a new password, a second edge function verifies the code against
     this table and updates the user's password via the Supabase admin API.

2. New Tables
   - `password_reset_codes`
     - `id` (uuid, primary key)
     - `email` (text, not null) — the user's email address
     - `code_hash` (text, not null) — SHA-256 hash of the 6-digit code (never store the plain code)
     - `expires_at` (timestamptz, not null) — 15 minutes from creation
     - `used` (boolean, default false) — marks the code as consumed after successful verification
     - `created_at` (timestamptz, default now)

3. Security
   - RLS enabled. Only the `service_role` (used by edge functions) can read/write.
   - No anon or authenticated access — the frontend never touches this table directly.
*/

CREATE TABLE IF NOT EXISTS password_reset_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  code_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  used boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE password_reset_codes ENABLE ROW LEVEL SECURITY;

-- No policies for anon/authenticated: only the service role (which bypasses RLS) can access.
-- Explicitly deny anon and authenticated:
DROP POLICY IF EXISTS "no_anon_access_reset_codes" ON password_reset_codes;
DROP POLICY IF EXISTS "no_auth_access_reset_codes" ON password_reset_codes;

CREATE POLICY "no_anon_access_reset_codes"
ON password_reset_codes FOR ALL
TO anon
USING (false) WITH CHECK (false);

CREATE POLICY "no_auth_access_reset_codes"
ON password_reset_codes FOR ALL
TO authenticated
USING (false) WITH CHECK (false);

-- Index for fast lookup by email
CREATE INDEX IF NOT EXISTS idx_password_reset_codes_email ON password_reset_codes (email);
