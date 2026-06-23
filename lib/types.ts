/**
 * Core application types
 */

export type PartType = 'head' | 'torso' | 'arms' | 'legs' | 'accessory';

export interface Line {
  id: string;
  name: string;
  publisher?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Figure {
  id: string;
  name: string;
  line_id: string;
  line_name?: string;
  base_buck?: string;
  year?: number;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface PartDefinition {
  id: string;
  slug: string;
  name: string;
  part_type: PartType;
  mold_family_id?: string;
  description?: string;
  year_introduced?: number;
  pinless?: boolean;
  knee_type?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export type Part = PartDefinition;

export interface FigurePart {
  id: string;
  figure_id: string;
  part_definition_id: string;
  slot_label?: string;
  is_primary: boolean;
  notes?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface MoldFamily {
  id: string;
  name: string;
  aliases: string[];
  confidence_score: number;
  description?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export type Mold = MoldFamily;

export interface KitbashPart {
  part_definition_id: string;
  part_id?: string;
  position?: string;
  notes?: string;
}

export interface Kitbash {
  id: string;
  name: string;
  description?: string;
  parts: KitbashPart[];
  creator?: string;
  tags: string[];
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Claim {
  id: string;
  entity_type: 'line' | 'figure' | 'part_definition' | 'mold_family' | 'kitbash' | 'compatibility';
  entity_id: string;
  claim_type: string;
  data: Record<string, any>;
  source?: string;
  confidence: number;
  created_at: string;
}

export interface Alias {
  id: string;
  entity_type: 'line' | 'figure' | 'part_definition' | 'mold_family';
  entity_id: string;
  alias: string;
  created_at: string;
}

export type CompatibilityLevel = 'green' | 'yellow' | 'red';

export interface PartCompatibility {
  id: string;
  source_part_definition_id: string;
  target_part_definition_id: string;
  source_part_id?: string;
  target_part_id?: string;
  compatibility_level: CompatibilityLevel;
  notes?: string;
  modification_type?: string;
  confidence: number;
  submitted_by?: string;
  created_at: string;
  updated_at: string;
}

export const COMPATIBILITY_DESCRIPTIONS: Record<CompatibilityLevel, string> = {
  green: 'Direct swap - No modification needed',
  yellow: 'Swap with minor modification - Shaving, sanding, or nail polish',
  red: 'Not compatible - Requires extreme modification or not compatible',
};

export interface SearchResult {
  type: 'line' | 'figure' | 'part' | 'mold' | 'kitbash';
  id: string;
  name: string;
  score: number;
  metadata?: Record<string, any>;
}

export interface MatchResult {
  primary: Figure | PartDefinition | MoldFamily;
  potentialMatches: (Figure | PartDefinition | MoldFamily)[];
  confidence: number;
}
