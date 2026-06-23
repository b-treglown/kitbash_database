# Cloudflare R2 + Vercel Deployment Guide

This guide gets your blank Cloudflare and Vercel accounts wired to this project quickly.

## 1) Cloudflare: Create R2 Bucket and Public URL

1. In Cloudflare dashboard, open R2.
2. Create bucket: `kitbash-media` (or any name).
3. In bucket settings, add a Public Development URL or custom domain.
4. Copy the final public base URL (example: `https://media.yourdomain.com`).

## 2) Cloudflare: Create API Tokens for R2

1. Cloudflare -> My Profile -> API Tokens -> Create Token.
2. Use R2 template or custom token with bucket read/write permissions.
3. Save values:
- `account_id`
- `access_key_id`
- `secret_access_key`

## 3) Vercel: Import and Deploy Frontend

1. In Vercel, click Add New -> Project.
2. Import your Git repository.
3. Framework preset: Next.js (auto-detected).
4. Build command: `npm run build`.
5. Output: default Next.js settings.

## 4) Configure Vercel Environment Variables

Set these in Project -> Settings -> Environment Variables:

### Supabase
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Cloudflare R2
- `NEXT_PUBLIC_R2_BUCKET_NAME`
- `NEXT_PUBLIC_R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `NEXT_PUBLIC_R2_PUBLIC_BASE_URL`

### App Security / URL
- `WRITE_API_TOKEN`
- `ADMIN_API_TOKEN`
- `NEXT_PUBLIC_APP_URL` = your Vercel URL (or custom domain)

Deploy after setting values.

## 5) Configure Upload Behavior

Upload route `POST /api/upload` now behaves as:
- R2 configured: uploads to Cloudflare R2 and returns public URL.
- R2 not configured: local filesystem fallback (`/public/uploads`).

## 6) Validate Production Setup

1. Open deployed app.
2. Test `Uploads -> Figure Information Upload` with image URL and figure metadata.
3. Test `Upload Compatibility` submission.
4. If you use write-protected routes, provide valid `WRITE_API_TOKEN` in requests.

## 7) Optional: Vercel CLI Workflow

```bash
npm i -g vercel
vercel login
vercel link
vercel --prod
```

## Common Pitfalls

- Wrong R2 public URL: ensure `NEXT_PUBLIC_R2_PUBLIC_BASE_URL` is a real public endpoint.
- Missing anon key: frontend fetches fail without `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Missing claims insert policy: contribution APIs return insert errors until RLS policies are applied.
