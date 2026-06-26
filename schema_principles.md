🧱 KITBASH SYSTEM — IMPLEMENTATION CONTRACT (v1.0)
🧠 Core Principle

This system is a composition database, not an inference engine.

The database’s job is to store:

Figures (as compositions of parts)
Kitbashes (user-generated compositions)
Parts (global reusable components)
Images (independent assets linked via join tables)

Everything else is derived or optional.

1. SYSTEM ARCHITECTURE OVERVIEW
1.1 Primary Data Flow
Figure → FigureParts → PartDefinitions → MoldFamilies
Kitbash → KitbashParts → PartDefinitions
Images → ImageLinks → (Figure | Kitbash | PartDefinition)
1.2 Source of Truth Rules
Concept	Source of Truth
Figure composition	figure_parts
Kitbash composition	kitbash_parts
Part identity	part_definitions
Mold lineage	mold_families
Image ownership	images + image_links
Compatibility	derived (NOT core truth)
2. CORE ENTITIES
2.1 PartDefinition (GLOBAL ATOMIC UNIT)

Represents a reusable physical part.

Examples:

Vulcan legs
Sunfire torso
Retro Spider-Man head
Rules:
MUST be reusable across figures
MUST NOT reference figures directly
MAY reference mold family
MAY include metadata for UI only
2.2 Figure (RETAIL COMPOSITION)

Represents a packaged figure release.

Rules:
MUST NOT contain parts directly
MUST ONLY reference parts through figure_parts
MUST be a stable, canonical entity
2.3 FigureParts (STRUCTURAL TRUTH TABLE)

Defines what a figure is made of.

Rules:
One row = one part in one figure slot
MUST reference figure_id and part_definition_id
MUST NOT duplicate data in JSONB
Constraint (IMPORTANT):
UNIQUE(figure_id, part_definition_id, slot_label)

Prevents duplicate slot assignments.

2.4 Kitbash (USER-GENERATED ASSEMBLY)

Represents a custom user build.

Rules:
ALWAYS created by users
MUST be composed via kitbash_parts
MAY include images and metadata
2.5 KitbashParts (USER COMPOSITION TRUTH)

Defines kitbash structure.

Rules:
One row = one part used in a kitbash
MUST reference part_definition_id
2.6 MoldFamily (OPTIONAL LINEAGE METADATA)

Represents shared tooling/buck lineage.

Rules:
ONLY attached to part_definitions
MUST NOT connect to figures directly
2.7 Images + ImageLinks (ASSET SYSTEM)
Images:
Store file metadata only
ImageLinks:
Polymorphic mapping to:
figures
kitbashes
parts
Rule:
Images are NEVER directly embedded into core entities
3. CLAIMS SYSTEM (OPTIONAL STAGING LAYER)
Purpose

Used for:

user submissions
moderation queue
AI-assisted enrichment
Rules:
MUST NOT be treated as canonical truth
MUST NOT replace core tables
MUST be reviewed or processed before affecting core data
Example usage:
user submits new figure info
stored as claim
later merged into figure record
4. COMPATIBILITY SYSTEM (DERIVED LAYER)
Purpose

Represents inferred compatibility between parts.

Rules:
MUST reference ONLY part_definitions
MUST NOT reference figures
MUST be derived from:
kitbashes
user reports
inferred patterns
Important:

This is a derived analytics layer, not source-of-truth data.

5. DATA FLOW RULES
5.1 Figure Creation Flow
1. Create Figure
2. Create FigureParts rows
3. Link PartDefinitions
4. Attach Images via ImageLinks
5.2 Kitbash Creation Flow
1. Create Kitbash
2. Upload Images → Images table
3. Link via ImageLinks
4. Create KitbashParts
5. (Optional) Generate derived compatibility signals
5.3 Submission Flow (Claims)
1. User submits data
2. Store in Claims table
3. Validate / review / infer
4. Optionally promote into core tables
6. FRONTEND RULES (IMPORTANT FOR UI QUALITY)
6.1 Kitbash-first UX

The system UI MUST prioritize:

Kitbash creation
Kitbash browsing
Kitbash detail pages

NOT compatibility graphs or claims.

6.2 Figure UI

Figures are:

read-only reference objects
displayed as composition breakdowns
6.3 Compatibility UI

Displayed as:

secondary insight layer
not primary navigation structure
7. VALIDATION RULES (BACKEND ENFORCED)
MUST enforce:
No duplicate figure_parts per slot constraint
All kitbash_parts must reference valid part_definitions
No direct figure-part relationships outside figure_parts
No reliance on JSONB for structural relationships
8. JSONB USAGE POLICY
Allowed:
UI display hints
temporary metadata
non-critical annotations
Forbidden:
relationships
structural modeling
identity definition
compatibility logic
9. DESIGN GUARANTEES

If implemented correctly, the system guarantees:

No circular dependencies
No duplicate sources of truth
No shadow database in JSONB
Stable kitbash-first UX
Clean relational querying
Safe future scaling
10. GOLDEN RULES
Rule 1

Figures are compositions, not owners.

Rule 2

Parts are global, reusable entities.

Rule 3

Kitbashes are the primary user interaction unit.

Rule 4

Relationships must live in join tables, never JSONB.

Rule 5

Derived data must never overwrite source truth.

11. IMPLEMENTATION PRIORITY ORDER
Phase 1 (NOW)
Fix upload pipeline
Fix RLS issues
Implement kitbash-first UI
Ensure FigureParts correctness
Phase 2
Improve image linking UX
Clean claims workflow
Add validation constraints
Phase 3 (later)
Compatibility scoring
Deduplication systems
Analytics layer
🧠 FINAL SUMMARY

This system is:

A relational composition graph for collectible parts and user-generated builds.

Not:

a knowledge graph engine
a full inference system
an AI-driven schema