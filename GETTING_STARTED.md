# Getting Started

**TL;DR**: Clone → npm install → Supabase setup → npm run dev

## 1️⃣ Install & Run (5 min)

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Open browser
http://localhost:3000
```

## 2️⃣ Set Up Database (10 min)

Follow **[SUPABASE_SETUP.md](SUPABASE_SETUP.md)**:
1. Create Supabase project
2. Copy credentials to `.env.local`
3. Run `lib/schema.sql` in Supabase
4. Test with sample data (optional)

## 3️⃣ Verify Everything Works

Open `http://localhost:3000` and:
- Try the search box
- No console errors? ✅

## 📚 Documentation

| Read This | For |
|---|---|
| [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) | File organization & quick reference |
| [README.md](README.md) | Full architecture & API docs |
| [SETUP_CHECKLIST.md](SETUP_CHECKLIST.md) | Step-by-step verification |
| [FEATURE_SUMMARY.md](FEATURE_SUMMARY.md) | ⭐ New features: admin moderation, direct image upload, Vercel setup |
| [VERCEL_ENV_SETUP.md](VERCEL_ENV_SETUP.md) | One-click Vercel environment configuration |
| [ADMIN_MODERATION_GUIDE.md](ADMIN_MODERATION_GUIDE.md) | How to review & approve community contributions |
| [DEPLOYMENT_CLOUDFLARE_VERCEL.md](DEPLOYMENT_CLOUDFLARE_VERCEL.md) | Production hosting setup |

## 🔧 Development

```bash
npm run dev              # Dev server
npm run type-check       # Find TS errors
npm run build            # Production build
```

## 📍 Key Folders

- **`services/`** — All database logic (don't use DB directly in components!)
- **`app/api/`** — Backend API endpoints
- **`components/`** — Reusable React components
- **`lib/`** — Config, types, utilities

## 🚀 Next Steps

1. ✅ Get it running (you are here)
2. 📖 Read [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)
3. 🏗️ Start building Phase 2 features
4. 📚 Reference [README.md](README.md) for architecture details

---

**Stuck?** Check **Troubleshooting** section in [SETUP_CHECKLIST.md](SETUP_CHECKLIST.md)
