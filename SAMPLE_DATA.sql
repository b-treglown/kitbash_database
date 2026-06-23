-- Sample Data Setup for Parts-First Graph Schema
-- Run this SQL in Supabase SQL Editor after lib/schema.sql

-- 1) Lines
INSERT INTO lines (name, publisher, metadata)
VALUES
  ('Marvel Legends', 'Hasbro', '{"scale": "1:12"}'::jsonb),
  ('G.I. Joe Classified', 'Hasbro', '{"scale": "1:12"}'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- 2) Figures
INSERT INTO figures (name, line_id, base_buck, year, metadata)
SELECT
  v.name,
  l.id,
  v.base_buck,
  v.year,
  v.metadata
FROM (
  VALUES
    ('Vulcan', 'Marvel Legends', 'Vulcan Buck', 2023, '{"character": "Vulcan"}'::jsonb),
    ('Astonishing Cyclops', 'Marvel Legends', 'Vulcan Buck', 2024, '{"character": "Cyclops"}'::jsonb),
    ('Havok', 'Marvel Legends', 'Vulcan Buck', 2024, '{"character": "Havok"}'::jsonb),
    ('Retro Spider-Man', 'Marvel Legends', 'unique', 2020, '{"character": "Spider-Man"}'::jsonb)
) AS v(name, line_name, base_buck, year, metadata)
JOIN lines l ON l.name = v.line_name
ON CONFLICT (name, line_id) DO NOTHING;

-- Ensure known correction is applied even if row already existed before this script.
UPDATE figures
SET base_buck = 'Vulcan Buck'
WHERE lower(name) = 'vulcan'
  AND (base_buck IS NULL OR trim(lower(base_buck)) = '' OR trim(lower(base_buck)) = 'unique');

-- 3) Mold Families
INSERT INTO mold_families (name, aliases, confidence_score, description, metadata)
VALUES
  ('Vulcan Buck', ARRAY['Vulcan body', 'Vulcan base'], 0.95, 'Primary male buck used in recent ML releases', '{"body_class": "male_standard"}'::jsonb),
  ('Sunfire Buck', ARRAY['Sunfire body'], 0.9, 'Athletic buck variant', '{"body_class": "male_athletic"}'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- 4) Part Definitions (first-class entities)
INSERT INTO part_definitions (
  slug,
  name,
  part_type,
  mold_family_id,
  description,
  year_introduced,
  pinless,
  knee_type,
  metadata
)
SELECT
  v.slug,
  v.name,
  v.part_type,
  mf.id,
  v.description,
  v.year_introduced,
  v.pinless,
  v.knee_type,
  v.metadata
FROM (
  VALUES
    ('vulcan-legs-v1', 'Vulcan Legs', 'legs', 'Vulcan Buck', 'Pinless legs from Vulcan tooling run', 2023, TRUE, 'double-jointed', '{"scale_fit": "1:12"}'::jsonb),
    ('vulcan-torso-v1', 'Vulcan Torso', 'torso', 'Vulcan Buck', 'Core Vulcan torso with butterfly shoulders', 2023, TRUE, NULL, '{"ab_crunch": true}'::jsonb),
    ('sunfire-torso-v1', 'Sunfire Torso', 'torso', 'Sunfire Buck', 'Athletic torso with narrow waist', 2023, TRUE, NULL, '{"ab_crunch": true}'::jsonb),
    ('ryv-spiderman-torso-v1', 'RYV Spider-Man Torso', 'torso', 'Sunfire Buck', 'Renew Your Vows torso sculpt', 2022, TRUE, NULL, '{"ab_crunch": true}'::jsonb)
) AS v(slug, name, part_type, mold_family_name, description, year_introduced, pinless, knee_type, metadata)
JOIN mold_families mf ON mf.name = v.mold_family_name
ON CONFLICT (slug) DO NOTHING;

-- 5) Figure -> Part Definition links (reuse graph)
INSERT INTO figure_parts (figure_id, part_definition_id, slot_label, is_primary, notes, metadata)
SELECT
  f.id,
  pd.id,
  v.slot_label,
  v.is_primary,
  v.notes,
  '{}'::jsonb
FROM (
  VALUES
    ('Vulcan', 'vulcan-legs-v1', 'legs', TRUE, 'Primary lower body'),
    ('Vulcan', 'vulcan-torso-v1', 'torso', TRUE, 'Primary torso'),
    ('Astonishing Cyclops', 'vulcan-legs-v1', 'legs', TRUE, 'Shared legs reuse'),
    ('Havok', 'vulcan-legs-v1', 'legs', TRUE, 'Shared legs reuse'),
    ('Retro Spider-Man', 'ryv-spiderman-torso-v1', 'torso', TRUE, 'Distinct spider torso')
) AS v(figure_name, part_slug, slot_label, is_primary, notes)
JOIN figures f ON f.name = v.figure_name
JOIN part_definitions pd ON pd.slug = v.part_slug
ON CONFLICT (figure_id, part_definition_id, slot_label) DO NOTHING;

-- 6) Kitbashes
INSERT INTO kitbashes (name, description, creator, tags, metadata)
VALUES
  ('X-Men Tactical Wolverine', 'Wolverine build using Vulcan lower body profile', 'user123', ARRAY['x-men', 'tactical', 'wolverine'], '{"difficulty": "intermediate"}'::jsonb),
  ('Future Cyclops', 'Cyclops concept build with mixed buck parts', 'user456', ARRAY['x-men', 'cyclops', 'future'], '{"difficulty": "beginner"}'::jsonb)
ON CONFLICT DO NOTHING;

-- 7) Kitbash -> Part Definition links
INSERT INTO kitbash_parts (kitbash_id, part_definition_id, position, notes, metadata)
SELECT
  k.id,
  pd.id,
  v.position,
  v.notes,
  '{}'::jsonb
FROM (
  VALUES
    ('X-Men Tactical Wolverine', 'vulcan-legs-v1', 'legs', 'Direct fit'),
    ('X-Men Tactical Wolverine', 'sunfire-torso-v1', 'torso', 'Minor trim at peg entrance'),
    ('Future Cyclops', 'vulcan-legs-v1', 'legs', 'Direct fit'),
    ('Future Cyclops', 'vulcan-torso-v1', 'torso', 'Direct fit')
) AS v(kitbash_name, part_slug, position, notes)
JOIN kitbashes k ON k.name = v.kitbash_name
JOIN part_definitions pd ON pd.slug = v.part_slug
ON CONFLICT (kitbash_id, part_definition_id, position) DO NOTHING;

-- 8) Aliases for search
INSERT INTO aliases (entity_type, entity_id, alias)
SELECT 'part_definition', pd.id, a.alias
FROM part_definitions pd
JOIN (
  VALUES
    ('vulcan-legs-v1', 'vulcan legs'),
    ('vulcan-legs-v1', 'vulcan lower body'),
    ('sunfire-torso-v1', 'sunfire torso'),
    ('ryv-spiderman-torso-v1', 'ryv torso')
) AS a(slug, alias) ON a.slug = pd.slug
ON CONFLICT (entity_type, entity_id, alias) DO NOTHING;

INSERT INTO aliases (entity_type, entity_id, alias)
SELECT 'mold_family', mf.id, a.alias
FROM mold_families mf
JOIN (
  VALUES
    ('Vulcan Buck', 'vulcan buck'),
    ('Vulcan Buck', 'vulcan body'),
    ('Sunfire Buck', 'sunfire buck')
) AS a(name, alias) ON a.name = mf.name
ON CONFLICT (entity_type, entity_id, alias) DO NOTHING;

-- 9) Part compatibility graph edges
INSERT INTO part_compatibility (
  source_part_definition_id,
  target_part_definition_id,
  compatibility_level,
  notes,
  modification_type,
  confidence,
  submitted_by
)
SELECT
  src.id,
  dst.id,
  v.level,
  v.notes,
  v.modification_type,
  v.confidence,
  v.submitted_by
FROM (
  VALUES
    ('vulcan-legs-v1', 'vulcan-torso-v1', 'green', 'Direct swap, no mod needed', NULL, 1.0, 'seed'),
    ('vulcan-legs-v1', 'sunfire-torso-v1', 'yellow', 'Socket is tight on first install', 'shave ball joint', 0.88, 'seed'),
    ('vulcan-legs-v1', 'ryv-spiderman-torso-v1', 'red', 'Attachment geometry mismatch', 'extreme mod required', 0.95, 'seed')
) AS v(source_slug, target_slug, level, notes, modification_type, confidence, submitted_by)
JOIN part_definitions src ON src.slug = v.source_slug
JOIN part_definitions dst ON dst.slug = v.target_slug
ON CONFLICT (source_part_definition_id, target_part_definition_id) DO NOTHING;

-- Useful checks after insert:
-- SELECT name FROM lines ORDER BY name;
-- SELECT name, slug, part_type FROM part_definitions ORDER BY name;
-- SELECT f.name AS figure, pd.name AS part, fp.slot_label
-- FROM figure_parts fp
-- JOIN figures f ON f.id = fp.figure_id
-- JOIN part_definitions pd ON pd.id = fp.part_definition_id
-- ORDER BY f.name, fp.slot_label;
