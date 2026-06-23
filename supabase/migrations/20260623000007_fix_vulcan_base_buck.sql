-- Correct known base buck mismatch for Vulcan rows that were backfilled to 'unique'.

UPDATE figures
SET base_buck = 'Vulcan Buck'
WHERE lower(name) = 'vulcan'
  AND (base_buck IS NULL OR trim(lower(base_buck)) = '' OR trim(lower(base_buck)) = 'unique');
