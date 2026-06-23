-- Fix RLS policies on claims table to allow anonymous INSERT
-- Ensures public can read and insert claims, but not update/delete

-- Drop existing policies that might be conflicting
DROP POLICY IF EXISTS "Public read claims" ON claims;
DROP POLICY IF EXISTS "Public insert claims" ON claims;

-- Ensure RLS is enabled
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;

-- Allow public (anonymous) to read claims
CREATE POLICY "Allow public read claims" ON claims
  FOR SELECT
  USING (true);

-- Allow public (anonymous) to insert claims
-- This is the key policy - WITH CHECK(true) means any insert is allowed
CREATE POLICY "Allow public insert claims" ON claims
  FOR INSERT
  WITH CHECK (true);

-- No UPDATE or DELETE policies for public - they are restricted by default
