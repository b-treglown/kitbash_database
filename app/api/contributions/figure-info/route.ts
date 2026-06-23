import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { calculateSimilarity } from '@/services/searchService';
import { enforceRateLimit, sanitizeText, secureJson } from '@/lib/requestSecurity';

type FigureCandidate = {
  id: string;
  name: string;
  line_name?: string;
  base_buck?: string;
  score: number;
};

function normalize(input: string): string {
  return input.toLowerCase().trim().replace(/\s+/g, ' ');
}

async function findFigureCandidates(figureName: string, lineName?: string): Promise<FigureCandidate[]> {
  const normalizedFigureName = normalize(figureName);
  const { data: figures, error } = await supabase
    .from('figures')
    .select('id, name, base_buck, lines(name)')
    .ilike('name', `%${figureName}%`)
    .limit(25);

  if (error) {
    console.error('Error searching figures for figure-info:', error);
    return [];
  }

  const aliasMatches = await supabase
    .from('aliases')
    .select('entity_id')
    .eq('entity_type', 'figure')
    .ilike('alias', `%${figureName}%`)
    .limit(25);

  const aliasIdSet = new Set<string>((aliasMatches.data || []).map((row: any) => row.entity_id));

  return (figures || [])
    .map((row: any) => {
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
        line_name: row.lines?.name,
        base_buck: row.base_buck,
        score,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

export async function POST(request: NextRequest) {
  try {
    const limited = enforceRateLimit(request, 'api:contributions:figure-info:post', 30, 60_000);
    if (limited) {
      return limited;
    }

    const body = await request.json();

    const figureName = typeof body.figureName === 'string' ? sanitizeText(body.figureName, 120) : '';
    const lineName = typeof body.lineName === 'string' ? sanitizeText(body.lineName, 120) : '';
    const baseBuck = typeof body.baseBuck === 'string' ? sanitizeText(body.baseBuck, 120) : '';
    const imageUrl = typeof body.imageUrl === 'string' ? sanitizeText(body.imageUrl, 255) : '';
    const notes = typeof body.notes === 'string' ? sanitizeText(body.notes, 2000) : '';
    const year = Number.isInteger(body.year) ? body.year : null;
    const submittedBy =
      typeof body.submittedBy === 'string' && body.submittedBy.trim().length > 0
        ? sanitizeText(body.submittedBy, 120)
        : 'anonymous';

    if (!figureName) {
      return secureJson({ error: 'figureName is required' }, { status: 400 });
    }

    if (!baseBuck) {
      return secureJson({ error: 'baseBuck is required' }, { status: 400 });
    }

    if (year !== null && (year < 1900 || year > 2100)) {
      return secureJson({ error: 'Invalid year value' }, { status: 400 });
    }

    const candidates = await findFigureCandidates(figureName, lineName || undefined);
    const best = candidates[0] || null;

    const matchedFigureId = best && best.score >= 0.72 ? best.id : null;
    const matchConfidence = best ? Number(best.score.toFixed(2)) : 0.3;

    const proposedUpdates: Record<string, unknown> = {
      base_buck: baseBuck,
      year,
      line_name: lineName || null,
    };

    const needsBaseBuckCorrection =
      !!best?.base_buck && normalize(best.base_buck) !== normalize(baseBuck);

    const claimPayload = {
      entity_type: 'figure',
      entity_id: matchedFigureId || crypto.randomUUID(),
      claim_type: 'figure_info_submission',
      data: {
        submission: {
          figure_name: figureName,
          line_name: lineName || null,
          base_buck: baseBuck,
          year,
          image_url: imageUrl || null,
          notes: notes || null,
          submitted_by: submittedBy,
        },
        matching: {
          matched_figure_id: matchedFigureId,
          confidence: matchConfidence,
          top_candidates: candidates,
        },
        proposed_updates: proposedUpdates,
        moderation: {
          action_hint: matchedFigureId ? 'apply_updates_to_existing_figure' : 'create_new_figure_candidate',
          needs_base_buck_correction: needsBaseBuckCorrection,
        },
      },
      source: imageUrl || null,
      confidence: Math.max(0.2, Math.min(1, matchConfidence)),
    };

    const { data: claim, error: insertError } = await supabase
      .from('claims')
      .insert([claimPayload])
      .select('*')
      .single();

    if (insertError) {
      console.error('Error creating figure info claim:', insertError);
      return secureJson(
        { error: 'Failed to submit figure info. Ensure claims INSERT policy is enabled.' },
        { status: 500 }
      );
    }

    return secureJson(
      {
        success: true,
        claim,
        matching: {
          matchedFigureId,
          confidence: matchConfidence,
          topCandidates: candidates,
          needsBaseBuckCorrection: needsBaseBuckCorrection,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in POST /api/contributions/figure-info:', error);
    return secureJson({ error: 'Failed to process figure info upload' }, { status: 500 });
  }
}
