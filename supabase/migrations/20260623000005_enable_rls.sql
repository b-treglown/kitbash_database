-- Security hardening: enable RLS and read-only policies for public access
-- This protects the database from direct anon-key writes.

ALTER TABLE lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE figures ENABLE ROW LEVEL SECURITY;
ALTER TABLE mold_families ENABLE ROW LEVEL SECURITY;
ALTER TABLE part_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE figure_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE kitbashes ENABLE ROW LEVEL SECURITY;
ALTER TABLE kitbash_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE part_compatibility ENABLE ROW LEVEL SECURITY;
ALTER TABLE images ENABLE ROW LEVEL SECURITY;
ALTER TABLE image_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Public read lines" ON lines
  FOR SELECT USING (true);

CREATE POLICY "Public read figures" ON figures
  FOR SELECT USING (true);

CREATE POLICY "Public read mold_families" ON mold_families
  FOR SELECT USING (true);

CREATE POLICY "Public read part_definitions" ON part_definitions
  FOR SELECT USING (true);

CREATE POLICY "Public read figure_parts" ON figure_parts
  FOR SELECT USING (true);

CREATE POLICY "Public read kitbashes" ON kitbashes
  FOR SELECT USING (true);

CREATE POLICY "Public read kitbash_parts" ON kitbash_parts
  FOR SELECT USING (true);

CREATE POLICY "Public read aliases" ON aliases
  FOR SELECT USING (true);

CREATE POLICY "Public read part_compatibility" ON part_compatibility
  FOR SELECT USING (true);

CREATE POLICY "Public read images" ON images
  FOR SELECT USING (true);

CREATE POLICY "Public read image_links" ON image_links
  FOR SELECT USING (true);

-- Claims can be read publicly, but no public write policy is granted here.
CREATE POLICY "Public read claims" ON claims
  FOR SELECT USING (true);
