/*
# Create profiles table for user accounts

1. New Tables
- `profiles`
  - `id` (uuid, primary key, references auth.users) — links each profile to a Supabase auth user
  - `email` (text, unique, not null) — the user's email address
  - `first_name` (text, not null) — user's first name
  - `last_name` (text, not null) — user's last name
  - `phone` (text) — user's phone number
  - `created_at` (timestamptz, default now()) — when the profile was created
  - `updated_at` (timestamptz, default now()) — when the profile was last updated

2. Security
- Enable RLS on `profiles`.
- Users can read and update only their own profile row.
- No anonymous access — only authenticated users.

3. Trigger
- `handle_new_user` function: automatically creates a `profiles` row when a new user signs up in `auth.users`.
- Trigger fires on INSERT to `auth.users` and inserts a corresponding row into `profiles` using the new user's id and email.

4. Important Notes
- The `profiles` table extends Supabase's built-in `auth.users` table with additional fields (first name, last name, phone) that Supabase Auth does not store natively.
- Email verification is handled by Supabase Auth's built-in email confirmation flow.
- The trigger ensures every new auth user gets a matching profile row without the frontend needing to insert it separately.
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Function to automatically create a profile row when a new auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, phone)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Trigger that fires after a new user is inserted into auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at on profile changes
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
