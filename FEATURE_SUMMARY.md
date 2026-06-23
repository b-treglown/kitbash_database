# 🚀 Three New Features Added

This document summarizes the three new features that have been added to your Kitbash Database project to streamline deployment and improve the community moderation workflow.

## 1. ✅ Vercel One-Click Environment Setup

### What It Does
Provides a structured guide and configuration for quickly importing all required environment variables into Vercel with minimal copy-paste.

### Files Added
- `vercel.json` — Vercel build and environment configuration
- `VERCEL_ENV_SETUP.md` — Step-by-step guide for three setup methods

### Three Ways to Set Up

#### Method 1: Vercel Dashboard (Recommended)
- Copy/paste environment variables directly into Vercel Settings → Environment Variables
- Fastest way for manual setup

#### Method 2: Vercel CLI
```bash
vercel link
vercel env push    # Push your .env.local to Vercel
```

#### Method 3: Manual Reference
- Use your `.env.local` as a checklist
- Set each variable in Vercel dashboard

### Quick Start
1. Read [VERCEL_ENV_SETUP.md](VERCEL_ENV_SETUP.md)
2. Choose your preferred setup method
3. Import all environment variables
4. Redeploy your project

---

## 2. ✅ Admin Moderation Dashboard

### What It Does
Provides a web UI for reviewing and approving community contributions (figure changes, figure info submissions) with a single click.

### Files Added
- `app/api/admin/claims/route.ts` — Backend API for fetching and processing claims
- `app/admin/moderation/page.tsx` — Admin dashboard UI
- `app/admin/layout.tsx` — Admin section layout
- `ADMIN_MODERATION_GUIDE.md` — Complete moderation workflow guide

### Access the Dashboard

```
https://your-app.com/admin/moderation?token=YOUR_ADMIN_API_TOKEN
```

Requires `ADMIN_API_TOKEN` environment variable.

### Features

**View Pending Claims**
- All unapproved figure changes and figure info submissions
- Sorted by newest first
- Shows confidence scores and submission details

**Approve Changes**
- Review current vs. proposed values
- Click "Approve" to apply directly to database
- One-click updates for base_buck, name, year fields

**Reject Changes**
- Review submissions without applying
- Click "Reject" to mark as rejected (keeps audit trail)
- Rejected claims remain in database for historical reference

### Example Workflow

1. User submits: "Change Vulcan base_buck from 'unique' to 'Vulcan Buck'"
2. You see this in the admin dashboard with matching confidence
3. You verify the change makes sense
4. You click "Approve"
5. The figure is immediately updated in the database
6. All users see the corrected base_buck

### Security
- All endpoints require `ADMIN_API_TOKEN` header
- Rate-limited to prevent abuse
- Audit trail stored with every approval/rejection

---

## 3. ✅ Direct Image Upload to Figure Information Form

### What It Does
Adds direct file upload capability to the Figure Information submission form, with image preview and automatic URL handling.

### Files Modified
- `app/upload/figure-info/page.tsx` — Added file upload UI, preview, and upload handler

### Features

**Two Ways to Add Images**
1. **Upload File** — Drag/drop or select image, automatically uploads to Supabase Storage
2. **Paste URL** — Manually enter an image URL

**Image Preview**
- Shows preview of selected file before uploading
- Displays confirmation when URL is set

**File Validation**
- Accepts: PNG, JPG, GIF, WebP (any image/*  type)
- Max size: 10MB
- Clear error messages for validation failures

**Upload Workflow**
1. Select a local image file
2. Click "Upload Image"
3. File is uploaded to Supabase Storage
4. Public URL is automatically set in the form
5. Continue filling out figure details
6. Submit the claim

### Example Usage

```
1. Fill in figure details (name, base buck, year, line)
2. Click image upload section
3. Select image.jpg from computer
4. Click "Upload Image"
5. Preview appears, URL is set
6. Fill remaining fields (notes, submitter)
7. Click "Submit Figure Information"
```

---

## How These Features Work Together

### Deployment Workflow
1. Configure Vercel env vars using `VERCEL_ENV_SETUP.md`
2. Deploy to Vercel
3. Access admin dashboard at `/admin/moderation?token=...`

### Community Contribution Workflow
1. Users submit figures with images (direct upload)
2. Claims land in database with automatic matching
3. Admin reviews in moderation dashboard
4. Admin approves/rejects with one click
5. Approved changes apply immediately

---

## Quick Reference

| Feature | Access | Purpose |
|---------|--------|---------|
| Vercel Setup | [VERCEL_ENV_SETUP.md](VERCEL_ENV_SETUP.md) | Configure env vars for deployment |
| Admin Dashboard | `/admin/moderation?token=TOKEN` | Review and approve claims |
| Image Upload | `/upload/figure-info` | Submit figures with direct image upload |
| Moderation Guide | [ADMIN_MODERATION_GUIDE.md](ADMIN_MODERATION_GUIDE.md) | Learn the review workflow |

---

## Testing Locally

### Test Image Upload
1. Run `npm run dev`
2. Go to `http://localhost:3000/upload/figure-info`
3. Select an image file
4. Click "Upload Image"
5. Verify image preview and URL are set

### Test Admin Dashboard
1. Set `ADMIN_API_TOKEN` in `.env.local`
2. Submit test figure information/change
3. Go to `http://localhost:3000/admin/moderation?token=YOUR_TOKEN`
4. Verify claim appears in dashboard
5. Click "Approve" to test (will apply to database)

---

## What Happens in Production?

### Image Upload
- Files uploaded to Supabase Storage bucket 'images'
- Public URL returned and stored in claim
- Images served via Supabase CDN (fast, reliable)

### Admin Moderation
- Claims stored in Supabase `claims` table
- Admin token checked on every request
- Approved changes written to canonical tables (figures, parts, etc.)
- Full audit trail maintained

### Deployment
- All env vars configured in Vercel
- No additional setup needed after initial env import
- Automatic HTTPS, deployments on every git push

---

## Next Steps

1. **Deploy to Production:**
   - Read [VERCEL_ENV_SETUP.md](VERCEL_ENV_SETUP.md)
   - Import environment variables into Vercel
   - Redeploy project

2. **Test Admin Dashboard:**
   - Create admin token
   - Access `/admin/moderation?token=TOKEN`
   - Review the [ADMIN_MODERATION_GUIDE.md](ADMIN_MODERATION_GUIDE.md)

3. **Test Image Uploads:**
   - Have users submit figures with images
   - Verify images appear in admin dashboard
   - Approve a test submission

---

For more details, see the individual guides:
- [VERCEL_ENV_SETUP.md](VERCEL_ENV_SETUP.md)
- [ADMIN_MODERATION_GUIDE.md](ADMIN_MODERATION_GUIDE.md)
- [DEPLOYMENT_CLOUDFLARE_VERCEL.md](DEPLOYMENT_CLOUDFLARE_VERCEL.md)
