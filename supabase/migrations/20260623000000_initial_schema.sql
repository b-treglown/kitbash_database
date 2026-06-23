-- Kitbash Database Schema for Supabase

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "fuzzystrmatch" WITH SCHEMA public;

-- Lines (top-level grouping, e.g. "Marvel Legends")
CREATE TABLE IF NOT EXISTS lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(150) NOT NULL UNIQUE,
  publisher VARCHAR(150),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Figures (specific releases)
CREATE TABLE IF NOT EXISTS figures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  line_id UUID NOT NULL REFERENCES lines(id) ON DELETE RESTRICT,
  base_buck VARCHAR(120) NOT NULL DEFAULT 'unique',
  year INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT figures_name_line_unique UNIQUE(name, line_id)
);

-- Mold Families (tooling/sculpt group)
CREATE TABLE IF NOT EXISTS mold_families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  aliases TEXT[] DEFAULT '{}',
  confidence_score NUMERIC(3,2) DEFAULT 1.0 CHECK (confidence_score >= 0 AND confidence_score <= 1),
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Part Definitions (first-class reusable parts)
CREATE TABLE IF NOT EXISTS part_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  part_type VARCHAR(50) NOT NULL CHECK (part_type IN ('head', 'torso', 'arms', 'legs', 'accessory')),
  mold_family_id UUID REFERENCES mold_families(id) ON DELETE SET NULL,
  description TEXT,
  year_introduced INTEGER,
  pinless BOOLEAN DEFAULT FALSE,
  knee_type VARCHAR(100),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Figure Parts (which figure uses which part definition)
CREATE TABLE IF NOT EXISTS figure_parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  figure_id UUID NOT NULL REFERENCES figures(id) ON DELETE CASCADE,
  part_definition_id UUID NOT NULL REFERENCES part_definitions(id) ON DELETE CASCADE,
  slot_label VARCHAR(100),
  is_primary BOOLEAN DEFAULT TRUE,
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT figure_parts_unique UNIQUE(figure_id, part_definition_id, slot_label)
);

-- Kitbashes
CREATE TABLE IF NOT EXISTS kitbashes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  creator VARCHAR(255),
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Kitbash Parts (which part definitions are used by a kitbash)
CREATE TABLE IF NOT EXISTS kitbash_parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kitbash_id UUID NOT NULL REFERENCES kitbashes(id) ON DELETE CASCADE,
  part_definition_id UUID NOT NULL REFERENCES part_definitions(id) ON DELETE CASCADE,
  position VARCHAR(100),
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT kitbash_parts_unique UNIQUE(kitbash_id, part_definition_id, position)
);

-- Images
CREATE TABLE IF NOT EXISTS images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_key VARCHAR(512) NOT NULL UNIQUE,
  hash VARCHAR(128),
  width INTEGER,
  height INTEGER,
  mime_type VARCHAR(100),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Generic image links (figure/part_definition/kitbash)
CREATE TABLE IF NOT EXISTS image_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_id UUID NOT NULL REFERENCES images(id) ON DELETE CASCADE,
  entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('figure', 'part_definition', 'kitbash')),
  entity_id UUID NOT NULL,
  role VARCHAR(50),
  position INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT image_links_unique UNIQUE(image_id, entity_type, entity_id, role, position)
);

-- Claims Table (for user submissions and metadata)
CREATE TABLE IF NOT EXISTS claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('line', 'figure', 'part_definition', 'mold_family', 'kitbash', 'compatibility')),
  entity_id UUID NOT NULL,
  claim_type VARCHAR(100) NOT NULL,
  data JSONB NOT NULL,
  source VARCHAR(255),
  confidence NUMERIC(3,2) DEFAULT 1.0 CHECK (confidence >= 0 AND confidence <= 1),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Aliases Table (for fuzzy matching and normalization)
CREATE TABLE IF NOT EXISTS aliases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('line', 'figure', 'part_definition', 'mold_family')),
  entity_id UUID NOT NULL,
  alias VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT aliases_entity_alias_unique UNIQUE(entity_type, entity_id, alias)
);

-- Part Compatibility Table (part-definition-level graph edges)
CREATE TABLE IF NOT EXISTS part_compatibility (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_part_definition_id UUID NOT NULL REFERENCES part_definitions(id) ON DELETE CASCADE,
  target_part_definition_id UUID NOT NULL REFERENCES part_definitions(id) ON DELETE CASCADE,
  compatibility_level VARCHAR(10) NOT NULL CHECK (compatibility_level IN ('green', 'yellow', 'red')),
  notes TEXT,
  modification_type VARCHAR(255),
  confidence NUMERIC(3,2) DEFAULT 1.0 CHECK (confidence >= 0 AND confidence <= 1),
  submitted_by VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT part_compatibility_unique UNIQUE(source_part_definition_id, target_part_definition_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_lines_name ON lines USING GIN(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_figures_line_id ON figures(line_id);
CREATE INDEX IF NOT EXISTS idx_figures_name ON figures USING GIN(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_part_definitions_name ON part_definitions USING GIN(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_part_definitions_type ON part_definitions(part_type);
CREATE INDEX IF NOT EXISTS idx_part_definitions_mold_family_id ON part_definitions(mold_family_id);
CREATE INDEX IF NOT EXISTS idx_figure_parts_figure_id ON figure_parts(figure_id);
CREATE INDEX IF NOT EXISTS idx_figure_parts_part_definition_id ON figure_parts(part_definition_id);
CREATE INDEX IF NOT EXISTS idx_kitbashes_creator ON kitbashes(creator);
CREATE INDEX IF NOT EXISTS idx_kitbashes_tags ON kitbashes USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_kitbash_parts_kitbash_id ON kitbash_parts(kitbash_id);
CREATE INDEX IF NOT EXISTS idx_kitbash_parts_part_definition_id ON kitbash_parts(part_definition_id);
CREATE INDEX IF NOT EXISTS idx_claims_entity ON claims(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_aliases_alias ON aliases(alias);
CREATE INDEX IF NOT EXISTS idx_image_links_entity ON image_links(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_part_compatibility_source ON part_compatibility(source_part_definition_id);
CREATE INDEX IF NOT EXISTS idx_part_compatibility_target ON part_compatibility(target_part_definition_id);
CREATE INDEX IF NOT EXISTS idx_part_compatibility_level ON part_compatibility(compatibility_level);

-- Materialized views for performance
CREATE MATERIALIZED VIEW IF NOT EXISTS mold_family_usage AS
SELECT
  mf.id AS mold_family_id,
  mf.name,
  COUNT(DISTINCT pd.id) AS part_definition_count,
  COUNT(DISTINCT fp.figure_id) AS figure_count,
  COUNT(DISTINCT kp.kitbash_id) AS kitbash_usage_count
FROM mold_families mf
LEFT JOIN part_definitions pd ON pd.mold_family_id = mf.id
LEFT JOIN figure_parts fp ON fp.part_definition_id = pd.id
LEFT JOIN kitbash_parts kp ON kp.part_definition_id = pd.id
GROUP BY mf.id, mf.name;

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for timestamp updates
DROP TRIGGER IF EXISTS lines_updated_at_trigger ON lines;
CREATE TRIGGER lines_updated_at_trigger
  BEFORE UPDATE ON lines
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS figures_updated_at_trigger ON figures;
CREATE TRIGGER figures_updated_at_trigger
  BEFORE UPDATE ON figures
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS mold_families_updated_at_trigger ON mold_families;
CREATE TRIGGER mold_families_updated_at_trigger
  BEFORE UPDATE ON mold_families
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS part_definitions_updated_at_trigger ON part_definitions;
CREATE TRIGGER part_definitions_updated_at_trigger
  BEFORE UPDATE ON part_definitions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS figure_parts_updated_at_trigger ON figure_parts;
CREATE TRIGGER figure_parts_updated_at_trigger
  BEFORE UPDATE ON figure_parts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS kitbashes_updated_at_trigger ON kitbashes;
CREATE TRIGGER kitbashes_updated_at_trigger
  BEFORE UPDATE ON kitbashes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS images_updated_at_trigger ON images;
CREATE TRIGGER images_updated_at_trigger
  BEFORE UPDATE ON images
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS part_compatibility_updated_at_trigger ON part_compatibility;
CREATE TRIGGER part_compatibility_updated_at_trigger
  BEFORE UPDATE ON part_compatibility
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
