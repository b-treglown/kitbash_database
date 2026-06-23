-- Normalize RLS policies on `claims`
-- Drops duplicate policy names and creates one canonical read and one insert policy.

-- Remove old/duplicate policies (idempotent)
DROP POLICY IF EXISTS "Allow public read claims" ON claims;
DROP POLICY IF EXISTS "Allow public insert claims" ON claims;
DROP POLICY IF EXISTS "Public read claims" ON claims;
DROP POLICY IF EXISTS "Public insert claims" ON claims;

-- Ensure RLS is enabled
ALTER TABLE IF EXISTS claims ENABLE ROW LEVEL SECURITY;

-- Canonical public read policy
CREATE POLICY IF NOT EXISTS "Public read claims" ON claims
  FOR SELECT
  USING (true);

-- Canonical public insert policy
CREATE POLICY IF NOT EXISTS "Public insert claims" ON claims
  FOR INSERT
  WITH CHECK (true);

-- Note: No UPDATE or DELETE policy is created here; those remain restricted.
