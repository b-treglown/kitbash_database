# Vercel Environment Variable Setup

This guide shows how to set up environment variables in Vercel for deployment.

## Method 1: Vercel Dashboard (Recommended)

1. Go to your Vercel project dashboard
2. Navigate to **Settings → Environment Variables**
3. Add the following variables:

```
NEXT_PUBLIC_SUPABASE_URL = your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY = your_anon_key_here
WRITE_API_TOKEN = your_write_token_here
ADMIN_API_TOKEN = your_admin_token_here
NEXT_PUBLIC_APP_URL = https://your-vercel-app.vercel.app
```

### Environment Variables Explained

**Public Variables** (visible in client-side code):
- ✅ `NEXT_PUBLIC_SUPABASE_URL` — Your Supabase project URL
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase public/anon key (safe to expose)
- ✅ `NEXT_PUBLIC_APP_URL` — Your deployed app URL

**Private Variables** (server-side only):
- 🔒 `WRITE_API_TOKEN` — Token for image upload API access
- 🔒 `ADMIN_API_TOKEN` — Token for admin moderation dashboard access

## Method 2: Vercel CLI

If you have the Vercel CLI installed:

```bash
# Link your local project to Vercel
vercel link

# Push your .env.local to Vercel
vercel env push

## Method 3: Environment File Reference

Use your `.env.local` file as a reference:

```bash
cat .env.local
```

Then manually enter each value in the Vercel dashboard.

## After Setting Environment Variables

1. **Trigger a redeploy:**
   - Go to your project → **Deployments** → **Redeploy** latest deployment
   - Or push a new commit to trigger automatic deployment

2. **Verify environment variables are loaded:**
   - Check the build logs for errors
   - Test the app at `https://your-vercel-app.vercel.app`

3. **Test image uploads:**
   - Navigate to `/upload/figure-info`
   - Try uploading an image
   - Verify images appear correctly

## Troubleshooting

### "Environment variable not found" errors
- Double-check variable names (case-sensitive)
- Ensure no empty values
- Redeploy after adding variables

### "Cannot connect to Supabase" or upload fails
- Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
- Confirm `NEXT_PUBLIC_SUPABASE_ANON_KEY` matches your Supabase project
- Check Supabase project is active (not paused)
- Verify Supabase Storage bucket `images` exists (create if needed)

## Next Steps

1. Set all environment variables in Vercel
2. Redeploy your project
3. Test at your Vercel URL
4. Check [DEPLOYMENT_CLOUDFLARE_VERCEL.md](DEPLOYMENT_CLOUDFLARE_VERCEL.md) for complete setup verification

---

**Need help?** Check [DEPLOYMENT_CLOUDFLARE_VERCEL.md](DEPLOYMENT_CLOUDFLARE_VERCEL.md) for complete Cloudflare R2 and Vercel setup instructions.
