-- Comprehensive data insertion migration
-- This will insert all sample data for the kitbash database

INSERT INTO lines (name, publisher, metadata)
VALUES
  ('Marvel Legends', 'Hasbro', '{"scale": "1:12"}'::jsonb),
  ('G.I. Joe Classified', 'Hasbro', '{"scale": "1:12"}'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- Get the line IDs for figures insert
INSERT INTO figures (name, line_id, base_buck, year, metadata)
SELECT v.fname, l.id, v.base_buck, v.year, v.metadata::jsonb
FROM lines l
CROSS JOIN (
  VALUES
    ('Vulcan', 'Marvel Legends', 'Vulcan Buck', 2023, '{"character": "Vulcan"}'),
    ('Astonishing Cyclops', 'Marvel Legends', 'Vulcan Buck', 2024, '{"character": "Cyclops"}'),
    ('Havok', 'Marvel Legends', 'Vulcan Buck', 2024, '{"character": "Havok"}'),
    ('Retro Spider-Man', 'Marvel Legends', 'unique', 2020, '{"character": "Spider-Man"}')
) AS v(fname, line_name, base_buck, year, metadata)
WHERE l.name = v.line_name
ON CONFLICT (name, line_id) DO NOTHING;

-- Insert mold families
INSERT INTO mold_families (name, aliases, confidence_score, description, metadata)
VALUES
  ('Vulcan Buck', ARRAY['Vulcan body', 'Vulcan base'], 0.95, 'Primary male buck used in recent ML releases', '{"body_class": "male_standard"}'::jsonb),
  ('Sunfire Buck', ARRAY['Sunfire body'], 0.9, 'Athletic buck variant', '{"body_class": "male_athletic"}'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- Insert part definitions
INSERT INTO part_definitions (
  slug, name, part_type, mold_family_id, description, year_introduced, pinless, knee_type, metadata
)
SELECT v.slug, v.pname, v.part_type, mf.id, v.description, v.year_introduced, v.pinless, v.knee_type, v.metadata::jsonb
FROM mold_families mf
CROSS JOIN (
  VALUES
    ('vulcan-legs-v1', 'Vulcan Legs', 'legs', 'Vulcan Buck', 'Pinless legs from Vulcan tooling run', 2023, TRUE, 'double-jointed', '{"scale_fit": "1:12"}'),
    ('vulcan-torso-v1', 'Vulcan Torso', 'torso', 'Vulcan Buck', 'Core Vulcan torso with butterfly shoulders', 2023, TRUE, NULL, '{"ab_crunch": true}'),
    ('sunfire-torso-v1', 'Sunfire Torso', 'torso', 'Sunfire Buck', 'Athletic torso with narrow waist', 2023, TRUE, NULL, '{"ab_crunch": true}'),
    ('ryv-spiderman-torso-v1', 'RYV Spider-Man Torso', 'torso', 'Sunfire Buck', 'Renew Your Vows torso sculpt', 2022, TRUE, NULL, '{"ab_crunch": true}')
) AS v(slug, pname, part_type, mold_name, description, year_introduced, pinless, knee_type, metadata)
WHERE mf.name = v.mold_name
ON CONFLICT (slug) DO NOTHING;
