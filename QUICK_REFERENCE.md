# Quick Reference

Essential commands and patterns for kitbash-database development.

## Getting Started

```bash
# Install dependencies
npm install

# Run dev server (auto-selects port if 3000 is taken)
npm run dev

# Type-check TypeScript
npm run type-check

# Build for production
npm run build

# Run tests
npm test
```

## Environment Variables

**Required in `.env.local`:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key_here
WRITE_API_TOKEN=your_token_here
ADMIN_API_TOKEN=your_token_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Deployed on Vercel**: Set same vars in project settings.

## API Endpoints

**Figures:**
```bash
GET    /api/figures/[id]              # Get figure with parts (returns viewModel)
```

**Admin Operations (requires ADMIN_API_TOKEN):**
```bash
POST   /api/admin/detect-bucks        # Run buck detection sweep
POST   /api/admin/nightly-graph-sweep # Run graph integrity validation
```

**Image Upload (requires WRITE_API_TOKEN):**
```bash
POST   /api/upload/image              # Upload to Supabase Storage
```

## Data Transformation Pipeline

Figure data flows through: **raw → normalize → dedupe → group → viewModel**

```typescript
import { transformFigureData } from '@/lib/figureTransformationPipeline';

// API already applies this, but can use directly:
const viewModel = transformFigureData(figure, rawParts);

// viewModel structure:
{
  title: string,
  baseBuck: string,
  parts: {
    head: Part[],
    torso: Part[],
    arms: Part[],
    legs: Part[],
    accessory: Part[]
  },
  summary: {
    totalParts: number,
    bodyPartsCovered: PartType[]
  }
}
```

## Database Schema

**Key Tables:**
- `figures` - Action figures
- `figure_parts` - Parts used in figures
- `part_definitions` - Part catalog
- `mold_families` - Part mold groupings
- `part_compatibility` - Part swap rules
- `kitbashes` - Custom figure builds
- `kitbash_parts` - Parts in kitbashes
- `mold_family_usage` - Materialized view for stats

**Images:** Stored in Supabase Storage bucket `images` (public access).

## React Patterns

**Server Component (async):**
```typescript
import { supabase } from '@/lib/supabaseClient';

export default async function Page({ params }: { params: { id: string } }) {
  const { data } = await supabase
    .from('figures')
    .select('*')
    .eq('id', params.id)
    .single();

  return <div>{data.name}</div>;
}
```

**Client Component (with state):**
```typescript
'use client';
import { useState } from 'react';

export default function Form() {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/endpoint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ /* data */ })
    });
    setLoading(false);
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

## Key Directories

```
/app               - Next.js App Router pages and API routes
/lib               - Shared utilities, database client, pipelines
/components        - Reusable React components
/services          - Business logic layer (mostly deprecated, use lib/ instead)
/public            - Static assets
/.github/workflows - Scheduled jobs (nightly buck detection, graph integrity sweep)
```

## Common Tasks

**Test API endpoint:**
```powershell
$response = Invoke-RestMethod -Uri "http://localhost:3000/api/figures/[id]" -Method Get
$response | ConvertTo-Json
```

**Deploy to Vercel:**
```bash
git push origin main  # Automatically triggers Vercel deployment
```

**Run type checking before commit:**
```bash
npm run type-check && git add -A && git commit -m "message"
```
}, 300);

// Format date
const formatted = formatDate(new Date());

// Convert to URL slug
const slug = slugify('My Awesome Kitbash');
```

## Part Compatibility (Phase 2) - NEW!

```typescript
import * as compatService from '@/services/partCompatibilityService';

// Check compatibility between two parts
const compat = await compatService.getCompatibility(part1Id, part2Id);

// Get all parts that fit with a specific part (green = direct swap)
const greenSwaps = await compatService.getCompatibleParts(partId, 'green');
const minorMods = await compatService.getCompatibleParts(partId, 'yellow');

// Find best fitting parts (sorted by compatibility level, then confidence)
const bestFits = await compatService.findBestFits(partId);

// Register a compatibility relationship
await compatService.createCompatibility({
  source_part_id: 'head-1',
  target_part_id: 'torso-1',
  compatibility_level: 'green', // 'green' | 'yellow' | 'red'
  notes: 'Both use standard ball joints',
  confidence: 0.95
});

// Update with modification info (for yellow level)
await compatService.recordModification(
  compatibilityId,
  'shave ball joint', // modification needed
  'Socket is slightly tight'
);

// Verify an entire kitbash build
const check = await compatService.checkMultipleCompatibilities([part1, part2, part3]);
// Returns: { compatible, minorMods, incompatible, unknown }

// Get compatibility statistics
const stats = await compatService.getCompatibilityStats();
// Returns: { total, green, yellow, red, averageConfidence }
```

**Compatibility Levels:**
- 🟢 **Green** — Direct swap, no modification
- 🟡 **Yellow** — Minor modification needed (shave, sand, nail polish)
- 🔴 **Red** — Not compatible or extreme modification needed

## Commands

```bash
npm run dev              # Start development server
npm run type-check       # Find TypeScript errors
npm run lint             # Find code style issues
npm run build            # Build for production
npm run supabase:generate-types  # Update types from schema
```

---

**Save this for quick lookups while coding!**
