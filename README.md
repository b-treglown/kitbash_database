# Kitbash Database

Community-driven knowledge graph for action figure parts, molds, and kitbashes.

Principles: minimal surface area, claims-based contributions, anonymous submissions, and secure defaults.

Quick start
---------
- Install:

```bash
npm install
```

- Copy env and set required vars:

```bash
cp .env.local.example .env.local
```

Required env vars (at minimum):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL`

Run dev:

```bash
npm run dev
```

Storage & Images
-----------------
- Images are stored in Supabase Storage; DB stores `storage_key`/URLs.
- Current uploads use the `uploaded_images` bucket.

Core structure (short)
----------------------
- `app/` — Next.js routes & pages (API routes under `app/api`)
- `lib/` — shared utilities and Supabase client
- `services/` — data access + business rules (use instead of calling DB in UI)
- `supabase/migrations/` — ordered SQL migrations

Database model (high level)
---------------------------
- `figures`, `part_definitions`, `figure_parts`, `mold_families`, `part_compatibility`, `claims`, `aliases`, `images`.
- Use `JSONB` for optional metadata; prefer normalized rows for core relations.

Security & contributions
------------------------
- RLS is enabled by default. Public `SELECT` is allowed; `INSERT` is granted selectively (e.g., `claims`).
- Never expose admin secrets to the browser. Use server-only env vars for writes that require keys.
- Rate-limit anonymous endpoints (IP-based) for uploads/submissions.

Useful commands
---------------
- Start dev: `npm run dev`
- Type-check: `npm run type-check`
- Run migrations: apply SQL files in `supabase/migrations/` via Supabase SQL editor or CLI

Contributing (brief)
--------------------
- Small, focused commits. Add one migration per schema change.
- Run `npm run type-check` before committing. Keep docs short.

Troubleshooting
---------------
- If images fail, verify the `uploaded_images` bucket exists and public URL patterns.
- If claims INSERT fails, check RLS policies on `claims` and ensure the migration set public INSERT where intended.

License
-------
Open source.

---

Keep this README minimal — see `QUICK_REFERENCE.md` for more commands.
