-- Add a light CHECK constraint on claims.claim_type to prevent malformed claim types
-- Constraint is created NOT VALID to avoid blocking existing data; validate manually when convenient

ALTER TABLE claims
  ADD CONSTRAINT claims_claim_type_check
  CHECK (claim_type IN ('figure_info_submission','compatibility_report','alias_suggestion','other')) NOT VALID;

-- To validate the constraint (optional, run manually after inspecting data):
-- ALTER TABLE claims VALIDATE CONSTRAINT claims_claim_type_check;
