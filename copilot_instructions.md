# Copilot Instructions — Lean Implementation

Purpose: guide the LLM to make minimal, secure, and efficient changes. Priorities are correctness, security (RLS, anon safety), and small, auditable diffs.

---

## Scope
- Make surgical edits only.
- Prefer configuration changes, small migrations, or single-file fixes over large refactors or new subsystems.
- Avoid introducing new abstractions unless explicitly required.

---

## Files & Structure
- Create new files only when necessary.
- If a new file is added, include a brief header explaining its purpose (1–3 lines max).
- Prefer modifying existing patterns in the codebase over introducing new ones.

---

## Commits & PRs
- Use conventional commit messages:
  - `fix:`, `feat:`, `chore:`, `refactor:`, `security:`
- Keep commits small and focused.
- Push to `main` only after tests/type-checks pass.
- Prefer small PRs when changes affect multiple areas (>3 files).

---

## Data & Schema Design
- Use normalized relational tables for core entities.
- Use `JSONB` only for optional, non-relational metadata.
- Do not store binary data in the database. Use Supabase Storage and store references in tables.
- Index primary keys, foreign keys, and frequently queried slugs only.
- Avoid premature or excessive indexing on JSONB fields.
- Keep migrations minimal and intentional (one logical change per migration).

---

## Security (RLS & Anon Access)
- Default posture: RLS enabled, deny by default.
- Explicitly define `SELECT` and `INSERT` policies where required.
- Public endpoints must be carefully scoped and validated.
- Never expose admin keys in client code. Use anon-safe environment variables only.
- Apply rate limiting for anonymous endpoints where applicable.

---

## Operational Efficiency
- Inspect existing code (`grep`, `read`, search) before making changes.
- Batch related edits into a single patch when safe.
- Keep logs structured and minimal (e.g., `[upload]`, `[figure-info]`).
- Return detailed errors in server logs only; expose generic errors to clients in production.

---

## Development Flow
1. Run `npm run type-check` before commits.
2. Add migrations to `supabase/migrations/` using timestamped filenames.
3. Apply database changes via migrations, not manual edits.
4. Validate changes locally before pushing.

---

## Migration Template

```sql
-- YYYYMMDDHHMMSS_description.sql
BEGIN;

-- schema changes here

COMMIT;