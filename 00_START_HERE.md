# 🎉 Welcome to Your Kitbash Database Project!

This is a complete, production-ready skeleton for a **community-driven action figure knowledge graph**—built exactly to your Phase 1-3 specifications.

## ✅ What's Included

### Database & Backend
- ✅ **Supabase schema** with all tables (figures, parts, molds, kitbashes, claims, aliases)
- ✅ **Service layer** abstraction (all DB access goes through services, never direct from UI)
- ✅ **API routes** for CRUD operations on all entities
- ✅ **Search system** with fuzzy matching, aliases, and duplicate detection (Phase 3 complete)
- ✅ **Image handling** utilities for Cloudflare R2 integration

### Frontend
- ✅ **Next.js 14** app with TypeScript
- ✅ **Reusable components** (SearchInput, ResultCard, LoadingSpinner)
- ✅ **Home page** with working search
- ✅ **Tailwind CSS** styling ready to go
- ✅ **Type safety** throughout (no `any` types)

### Documentation
- ✅ **README.md** — Full architecture overview
- ✅ **PROJECT_STRUCTURE.md** — File organization guide
- ✅ **GETTING_STARTED.md** — Quick start (read this first!)
- ✅ **SETUP_CHECKLIST.md** — Step-by-step verification
- ✅ **SUPABASE_SETUP.md** — Database configuration
- ✅ **DEPLOYMENT_CLOUDFLARE_VERCEL.md** — Cloudflare + Vercel hosting setup
- ✅ **VERCEL_ENV_SETUP.md** — One-click Vercel environment variable import
- ✅ **ADMIN_MODERATION_GUIDE.md** — How to approve/apply community contributions
- ✅ **DEVELOPMENT_ROADMAP.md** — How to build Phase 2-3 features
- ✅ **SAMPLE_DATA.sql** — Test data for the database

## 🗂️ File Structure

```
├── 📄 GETTING_STARTED.md          ← START HERE!
├── 📄 README.md                   ← Full reference
├── 📄 PROJECT_STRUCTURE.md        ← File guide
├── 📄 DEVELOPMENT_ROADMAP.md      ← How to build next
│
├── 📁 app/
│   ├── api/figures/               ← Figure CRUD API
│   ├── api/search/                ← Search API (Phase 3)
│   ├── api/upload/                ← Image upload API
│   ├── upload/                    ← Upload flow pages
│   ├── layout.tsx                 ← Root layout
│   ├── page.tsx                   ← Home page with search
│   └── globals.css                ← Tailwind setup
│
├── 📁 services/
│   ├── figureService.ts           ← Figure operations
│   ├── partService.ts             ← Part operations
│   ├── moldService.ts             ← Mold operations + matching
│   ├── kitbashService.ts          ← Kitbash operations
│   └── searchService.ts           ← Phase 3: Fuzzy search
│
├── 📁 components/
│   ├── SearchInput.tsx            ← Search field
│   ├── ResultCard.tsx             ← Search result card
│   └── LoadingSpinner.tsx          ← Loading indicator
│
├── 📁 lib/
│   ├── supabaseClient.ts          ← Supabase config
│   ├── types.ts                   ← TypeScript types
│   ├── r2.ts                      ← Image utilities
│   ├── utils.ts                   ← Helper functions
│   ├── schema.sql                 ← Database schema
│   └── database.types.ts          ← Auto-generated types
│
├── 📄 package.json                ← Dependencies
├── 📄 tsconfig.json               ← TypeScript config
├── 📄 next.config.js              ← Next.js config
├── 📄 tailwind.config.js          ← Tailwind config
├── 📄 .env.local                  ← Environment variables
└── 📄 .gitignore                  ← Git ignore rules
```

## 🚀 Quick Start (5 Minutes)

```bash
# 1. Install dependencies
npm install

# 2. Set up Supabase (follow SUPABASE_SETUP.md)
#    - Create project
#    - Copy credentials to .env.local
#    - Run lib/schema.sql

# 3. Start dev server
npm run dev

# 4. Open browser
http://localhost:3000
```

## 📚 Documentation Reading Order

1. **This file** (you're reading it!)
2. [**GETTING_STARTED.md**](GETTING_STARTED.md) — Quick setup verification
3. [**PROJECT_STRUCTURE.md**](PROJECT_STRUCTURE.md) — Understand the layout
4. [**README.md**](README.md) — Full architecture details
5. [**DEVELOPMENT_ROADMAP.md**](DEVELOPMENT_ROADMAP.md) — Build Phase 2-3 features
6. [**DEPLOYMENT_CLOUDFLARE_VERCEL.md**](DEPLOYMENT_CLOUDFLARE_VERCEL.md) — Deploy frontend + image hosting
7. [**VERCEL_ENV_SETUP.md**](VERCEL_ENV_SETUP.md) — Quick environment variable setup for Vercel
8. [**ADMIN_MODERATION_GUIDE.md**](ADMIN_MODERATION_GUIDE.md) — Review and approve community contributions

## 🎯 What's Already Done (Phase 1-3)

### Phase 1: Foundation ✅
- Database schema with all relationships
- CRUD operations for figures, parts, molds, kitbashes
- Image upload infrastructure with Cloudflare R2 support
- Type definitions

### Phase 2: Graph Features (Ready for UI)
- Part relationships table structure
- Kitbash viewer data model
- Tagging system (backend ready)

### Phase 3: Matching System ✅
- Fuzzy search using Fuse.js
- Alias registration and lookup
- Duplicate detection algorithm
- Levenshtein distance matching
- Confidence scoring

### Admin & Community Features ✅
- Admin moderation dashboard for approving/rejecting claims
- Three-tier upload system (compatibility, figure info, figure change)
- Direct image file upload with preview (no URL needed)
- Anonymous contribution tracking with confidence scores
- Automatic figure matching for submissions

## 🔑 Key Architecture Decisions

### 1. Service Layer Abstraction
All database access goes through `services/`. **Never query Supabase directly from components.**

Why? → Makes it mobile-app-ready. Change UI layer only, services stay the same.

### 2. Claims-Based System
User submissions are "claims", not absolute truth. This allows the graph to grow collaboratively without conflicts.

### 3. Images External Only
Images stored in Cloudflare R2, only URLs in database. Keeps database lean and supports future media features.

### 4. Type Safety
Full TypeScript throughout. `lib/types.ts` defines all core types. Auto-generated database types from Supabase schema.

## 📋 What's Ready to Use

### Search (Phase 3 ✅)
```javascript
// Global search
const results = await searchService.globalSearch('Vulcan');

// Fuzzy matching
const matches = await searchService.fuzzySearch('valcan', 'mold');

// Find duplicates
const dupes = await searchService.findDuplicateFigures();
```

### Services (Phase 1 ✅)
```javascript
// Figures
await figureService.getFigures();
await figureService.createFigure({ name, line, year });

// Kitbashes
await kitbashService.getKitbashes();
await kitbashService.createKitbash({ name, parts, tags });
```

### Components
- `SearchInput` — Reusable search field with debouncing
- `ResultCard` — Formatted search result display
- `LoadingSpinner` — Loading indicator

## 🛠️ How to Build Next (Phase 2 Features)

See [DEVELOPMENT_ROADMAP.md](DEVELOPMENT_ROADMAP.md) for detailed instructions. Quick overview:

1. **Figure browser page** — List figures by line
2. **Kitbash creator form** — Build and save custom figures
3. **Detail pages** — View individual figures/kitbashes
4. **Duplicate detection UI** — Suggest merges for similar entries

## 💡 Design Principles You Have

✅ **Backend-driven schema** — Not guessed; built from architecture needs
✅ **Type-safe throughout** — Catch errors at compile time
✅ **Service abstraction** — Future-proof for mobile reuse
✅ **Scalable matching** — Fuzzy search ready from day one
✅ **Extensible claims system** — Crowdsourcing built-in

## 🎓 Key Files to Understand

| File | Why It Matters |
|------|---|
| `lib/schema.sql` | Database design—understand the model |
| `services/searchService.ts` | Shows how fuzzy matching works |
| `lib/types.ts` | All core TypeScript types |
| `app/layout.tsx` | App structure and navigation |
| `services/figureService.ts` | Example of service pattern |

## ⚙️ Commands

```bash
npm run dev                  # Start development server
npm run build                # Build for production
npm run type-check           # Find TypeScript errors
npm run lint                 # Find code style issues
npm run supabase:generate-types  # Update from schema
```

## 🐛 Troubleshooting

**"Module not found"** → Run `npm install`

**"Supabase error"** → Check `.env.local` credentials

**"Schema issues"** → Run `lib/schema.sql` in Supabase SQL editor

**"Search not working"** → Load sample data via `SAMPLE_DATA.sql`

See [SETUP_CHECKLIST.md](SETUP_CHECKLIST.md) for more.

## 🎉 Next Steps

1. ✅ Read this file
2. 📖 Follow [GETTING_STARTED.md](GETTING_STARTED.md)
3. ⚙️ Complete [SETUP_CHECKLIST.md](SETUP_CHECKLIST.md)
4. 🏗️ Reference [DEVELOPMENT_ROADMAP.md](DEVELOPMENT_ROADMAP.md) to build Phase 2

---

## 📞 Pro Tips

- Start with `npm run dev` and test the home page search
- Read `PROJECT_STRUCTURE.md` to understand the layout
- Check `DEVELOPMENT_ROADMAP.md` when ready to build Phase 2
- Use `npm run type-check` frequently to catch errors early
- Services are your friend—add new functionality there first

---

**You have everything you need to build Phase 1-3 of your kitbash database!**

Start here: [GETTING_STARTED.md](GETTING_STARTED.md)
