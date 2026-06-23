import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { calculateSimilarity } from '@/services/searchService';
import { enforceRateLimit, sanitizeText, secureJson } from '@/lib/requestSecurity';

type Candidate = {
  id: string;
  name: string;
  score: number;
  reason: string;
};

function normalize(input: string): string {
  return input.toLowerCase().trim().replace(/\s+/g, ' ');
}

function confidenceDeltaFromScore(score: number): number {
  if (score >= 0.95) return 0.05;
  if (score >= 0.85) return 0.03;
  if (score >= 0.75) return 0.01;
  return 0;
}

async function findFigureCandidates(figureName: string, lineName?: string): Promise<Candidate[]> {
  const normalizedFigureName = normalize(figureName);
  const { data: figures, error } = await supabase
    .from('figures')
    .select('id, name, lines(name)')
    .ilike('name', `%${figureName}%`)
    .limit(25);

  if (error) {
    console.error('Error searching figures:', error);
    return [];
  }

  const aliasMatches = await supabase
    .from('aliases')
    .select('entity_id, alias')
    .eq('entity_type', 'figure')
    .ilike('alias', `%${figureName}%`)
    .limit(25);

  const aliasIdSet = new Set<string>((aliasMatches.data || []).map((row: any) => row.entity_id));

  const candidates = (figures || []).map((row: any) => {
    const nameScore = calculateSimilarity(normalizedFigureName, normalize(row.name || ''));
    const lineScore =
      lineName && row.lines?.name
        ? calculateSimilarity(normalize(lineName), normalize(row.lines.name))
        : 0;

    const exactNameBoost = normalize(row.name || '') === normalizedFigureName ? 0.15 : 0;
    const aliasBoost = aliasIdSet.has(row.id) ? 0.1 : 0;
    const score = Math.min(1, nameScore * 0.75 + lineScore * 0.15 + exactNameBoost + aliasBoost);

    return {
      id: row.id,
      name: row.name,
      score,
      reason: aliasIdSet.has(row.id) ? 'name + alias match' : 'name similarity',
    };
  });

  return candidates.sort((a, b) => b.score - a.score).slice(0, 5);
}

async function findPartCandidates(partName: string, partType?: string): Promise<Candidate[]> {
  const normalizedPartName = normalize(partName);
  let query = supabase
    .from('part_definitions')
    .select('id, name, part_type')
    .ilike('name', `%${partName}%`)
    .limit(25);

  if (partType) {
    query = query.eq('part_type', partType);
  }

  const { data: parts, error } = await query;

  if (error) {
    console.error('Error searching parts:', error);
    return [];
  }

  const aliasMatches = await supabase
    .from('aliases')
    .select('entity_id, alias')
    .eq('entity_type', 'part_definition')
    .ilike('alias', `%${partName}%`)
    .limit(25);

  const aliasIdSet = new Set<string>((aliasMatches.data || []).map((row: any) => row.entity_id));

  const candidates = (parts || []).map((row: any) => {
    const nameScore = calculateSimilarity(normalizedPartName, normalize(row.name || ''));
    const typeBoost = partType && row.part_type === partType ? 0.1 : 0;
    const exactNameBoost = normalize(row.name || '') === normalizedPartName ? 0.15 : 0;
    const aliasBoost = aliasIdSet.has(row.id) ? 0.1 : 0;
    const score = Math.min(1, nameScore * 0.75 + typeBoost + exactNameBoost + aliasBoost);

    return {
      id: row.id,
      name: row.name,
      score,
      reason: aliasIdSet.has(row.id) ? 'name + alias match' : 'name similarity',
    };
  });

  return candidates.sort((a, b) => b.score - a.score).slice(0, 5);
}

export async function POST(request: NextRequest) {
  try {
    const limited = enforceRateLimit(request, 'api:contributions:part-observation:post', 30, 60_000);
    if (limited) {
      return limited;
    }

    const body = await request.json();

    const figureName = typeof body.figureName === 'string' ? sanitizeText(body.figureName, 120) : '';
    const lineName = typeof body.lineName === 'string' ? sanitizeText(body.lineName, 120) : '';
    const baseBuck = typeof body.baseBuck === 'string' ? sanitizeText(body.baseBuck, 120) : '';
    const partName = typeof body.partName === 'string' ? sanitizeText(body.partName, 120) : '';
    const partType = typeof body.partType === 'string' ? sanitizeText(body.partType, 50) : '';
    const imageUrl = typeof body.imageUrl === 'string' ? sanitizeText(body.imageUrl, 255) : '';
    const notes = typeof body.notes === 'string' ? sanitizeText(body.notes, 2000) : '';
    const submittedBy =
      typeof body.submittedBy === 'string' && body.submittedBy.trim().length > 0
        ? sanitizeText(body.submittedBy, 120)
        : 'anonymous';

    if (!figureName && !partName) {
      return secureJson(
        { error: 'At least figureName or partName is required' },
        { status: 400 }
      );
    }

    if (partType && !['head', 'torso', 'arms', 'legs', 'accessory'].includes(partType)) {
      return secureJson({ error: 'Invalid partType' }, { status: 400 });
    }

    const [figureCandidates, partCandidates] = await Promise.all([
      figureName ? findFigureCandidates(figureName, lineName || undefined) : Promise.resolve([]),
      partName ? findPartCandidates(partName, partType || undefined) : Promise.resolve([]),
    ]);

    const bestFigure = figureCandidates[0] || null;
    const bestPart = partCandidates[0] || null;

    const matchedFigureId = bestFigure && bestFigure.score >= 0.7 ? bestFigure.id : null;
    const matchedPartId = bestPart && bestPart.score >= 0.7 ? bestPart.id : null;

    const matchScores = [bestFigure?.score, bestPart?.score].filter(
      (value): value is number => typeof value === 'number'
    );
    const overallMatchConfidence =
      matchScores.length > 0
        ? Number((matchScores.reduce((sum, score) => sum + score, 0) / matchScores.length).toFixed(2))
        : 0.3;

    const suggestedConfidenceDelta = Number(
      (
        confidenceDeltaFromScore(bestFigure?.score || 0) +
        confidenceDeltaFromScore(bestPart?.score || 0)
      ).toFixed(2)
    );

    const entityType = matchedPartId ? 'part_definition' : 'figure';
    const entityId = matchedPartId || matchedFigureId || crypto.randomUUID();

    const claimPayload = {
      entity_type: entityType,
      entity_id: entityId,
      claim_type: 'anonymous_part_observation',
      data: {
        submission: {
          figure_name: figureName || null,
          line_name: lineName || null,
          base_buck: baseBuck || null,
          part_name: partName || null,
          part_type: partType || null,
          image_url: imageUrl || null,
          notes: notes || null,
          submitted_by: submittedBy,
        },
        matching: {
          matched_figure_id: matchedFigureId,
          matched_part_id: matchedPartId,
          overall_match_confidence: overallMatchConfidence,
          suggested_confidence_delta: suggestedConfidenceDelta,
          top_figure_candidates: figureCandidates,
          top_part_candidates: partCandidates,
        },
        moderation: {
          action_hint:
            matchedFigureId || matchedPartId
              ? 'attach_to_existing_candidate'
              : 'create_new_candidate_entity',
        },
      },
      source: imageUrl || null,
      confidence: Math.max(0.2, Math.min(1, overallMatchConfidence)),
    };

    const { data: claim, error: claimError } = await supabase
      .from('claims')
      .insert([claimPayload])
      .select('*')
      .single();

    if (claimError) {
      console.error('Error inserting anonymous contribution claim:', claimError);
      return secureJson(
        {
          error: 'Failed to submit contribution. Ensure claims INSERT RLS policy is applied.',
        },
        { status: 500 }
      );
    }

    return secureJson(
      {
        success: true,
        claim,
        matching: {
          matchedFigureId,
          matchedPartId,
          overallMatchConfidence,
          suggestedConfidenceDelta,
          topFigureCandidates: figureCandidates,
          topPartCandidates: partCandidates,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in POST /api/contributions/part-observation:', error);
    return secureJson({ error: 'Failed to process contribution' }, { status: 500 });
  }
}
