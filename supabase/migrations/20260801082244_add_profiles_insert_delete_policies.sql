/*
# Add missing INSERT and DELETE policies to profiles table

1. Security Changes
- Add INSERT policy: authenticated users can insert their own profile row (fallback if trigger fails)
- Add DELETE policy: authenticated users can delete their own profile row
- These were missing from the original migration, which only had SELECT and UPDATE policies

2. Important Notes
- The INSERT policy uses WITH CHECK (auth.uid() = id) so users can only insert a profile for themselves
- This serves as a fallback if the database trigger fails to create the profile automatically
*/

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_delete_own" ON profiles;
CREATE POLICY "profiles_delete_own"
  ON profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = id);
