# Vercel Environment Variable Setup

This guide provides **three ways** to quickly import environment variables into your Vercel project.

## Method 1: Vercel Dashboard (One-Click Recommended)

1. Go to your Vercel project dashboard
2. Navigate to **Settings → Environment Variables**
3. Copy the environment variables from the table below and paste them one by one
4. Replace placeholder values with your actual credentials
5. Select which environments apply (Production, Preview, Development)

### Environment Variables to Add

Copy each variable name and value into your Vercel dashboard:

```
NEXT_PUBLIC_SUPABASE_URL = your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY = your_anon_key_here
NEXT_PUBLIC_R2_BUCKET_NAME = kitbash-media
NEXT_PUBLIC_R2_ACCOUNT_ID = your_account_id_here
R2_ACCESS_KEY_ID = your_access_key_here
R2_SECRET_ACCESS_KEY = your_secret_key_here
NEXT_PUBLIC_R2_PUBLIC_BASE_URL = https://cdn.example.com
R2_CDN_URL = https://cdn.example.com
WRITE_API_TOKEN = your_write_token_here
ADMIN_API_TOKEN = your_admin_token_here
NEXT_PUBLIC_APP_URL = https://your-vercel-project.vercel.app
```

### Which are "Public" (NEXT_PUBLIC_)?

These values are visible in client-side code and should be safe to expose:
- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` (public/non-secret by design)
- ✅ `NEXT_PUBLIC_R2_BUCKET_NAME`
- ✅ `NEXT_PUBLIC_R2_ACCOUNT_ID`
- ✅ `NEXT_PUBLIC_R2_PUBLIC_BASE_URL`
- ✅ `NEXT_PUBLIC_APP_URL`

These are **private** (server-side only):
- 🔒 `R2_ACCESS_KEY_ID`
- 🔒 `R2_SECRET_ACCESS_KEY`
- 🔒 `R2_CDN_URL`
- 🔒 `WRITE_API_TOKEN`
- 🔒 `ADMIN_API_TOKEN`

## Method 2: Vercel CLI

If you have the Vercel CLI installed, you can set variables from your local `.env.local`:

```bash
# First, link your local project to Vercel
vercel link

# Then, copy your .env.local values to Vercel
vercel env pull    # pulls current Vercel env to local
vercel env push    # pushes your current .env.local to Vercel
```

To push only specific variables:

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
# ... etc for each variable
```

## Method 3: Environment File Reference

If you prefer manual setup, use your `.env.local` file as a reference:

```bash
# Copy your local .env.local values
cat .env.local
```

Then paste each value into the Vercel dashboard Environment Variables page.

## After Setting Environment Variables

1. **Trigger a redeploy** in Vercel:
   - Go to your project → **Deployments** → **Redeploy** latest deployment
   - Or push a new commit to trigger automatic deployment

2. **Verify environment variables are loaded:**
   - Check the build logs for any missing variables
   - Test the app at `https://your-project.vercel.app`

3. **Test uploads:**
   - If using R2, test image upload to confirm R2 connectivity
   - Check browser console for any errors

## Troubleshooting

### "Environment variable not found" errors
- Double-check variable names match exactly (case-sensitive)
- Ensure value is not empty
- Trigger a redeploy after adding variables

### "R2 upload failed"
- Verify `R2_ACCESS_KEY_ID` and `R2_SECRET_ACCESS_KEY` are correct
- Check R2 bucket name matches `NEXT_PUBLIC_R2_BUCKET_NAME`
- Ensure R2 public URL is reachable at `NEXT_PUBLIC_R2_PUBLIC_BASE_URL`

### "Cannot connect to Supabase"
- Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
- Check `NEXT_PUBLIC_SUPABASE_ANON_KEY` matches your project
- Confirm Supabase project is active and not paused

## Next Steps

1. Set all environment variables in Vercel
2. Redeploy your project
3. Test the app at your Vercel URL
4. Run the [DEPLOYMENT_CLOUDFLARE_VERCEL.md](DEPLOYMENT_CLOUDFLARE_VERCEL.md) checklist to verify everything is working

---

**Need help?** Check [DEPLOYMENT_CLOUDFLARE_VERCEL.md](DEPLOYMENT_CLOUDFLARE_VERCEL.md) for complete Cloudflare R2 and Vercel setup instructions.
