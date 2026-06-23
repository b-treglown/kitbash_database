-- Quick test migration to verify data inserts work

-- Insert a test line
INSERT INTO lines (name, publisher, metadata)
VALUES ('Test Line', 'Test Publisher', '{"test": true}'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- Insert a test figure
INSERT INTO figures (name, line_id, base_buck, year, metadata)
SELECT 'Test Figure', l.id, 'unique', 2024, '{"test": true}'::jsonb
FROM lines l WHERE l.name = 'Test Line'
ON CONFLICT (name, line_id) DO NOTHING;
