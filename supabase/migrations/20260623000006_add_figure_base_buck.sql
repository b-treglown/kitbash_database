-- Add explicit base buck field for all figures.
-- Existing rows default to 'unique' until a specific buck is known.

ALTER TABLE figures
ADD COLUMN IF NOT EXISTS base_buck VARCHAR(120);

UPDATE figures
SET base_buck = 'unique'
WHERE base_buck IS NULL OR trim(base_buck) = '';

ALTER TABLE figures
ALTER COLUMN base_buck SET NOT NULL;

ALTER TABLE figures
ALTER COLUMN base_buck SET DEFAULT 'unique';
