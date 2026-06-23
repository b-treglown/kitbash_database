import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { calculateSimilarity } from '@/services/searchService';
import { enforceRateLimit, isValidUuid, sanitizeText, secureJson } from '@/lib/requestSecurity';

type ChangeField = 'base_buck' | 'name' | 'year' | 'line_name';

function normalize(input: string): string {
  return input.toLowerCase().trim().replace(/\s+/g, ' ');
}

async function resolveFigureId(figureName: string, lineName?: string): Promise<{ id: string | null; confidence: number }> {
  const { data: figures, error } = await supabase
    .from('figures')
    .select('id, name, lines(name)')
    .ilike('name', `%${figureName}%`)
    .limit(20);

  if (error || !figures || figures.length === 0) {
    return { id: null, confidence: 0 };
  }

  const ranked = figures
    .map((row: any) => {
      const nameScore = calculateSimilarity(normalize(figureName), normalize(row.name || ''));
      const lineScore =
        lineName && row.lines?.name
          ? calculateSimilarity(normalize(lineName), normalize(row.lines.name))
          : 0;
      const score = Math.min(1, nameScore * 0.8 + lineScore * 0.2);
      return { id: row.id as string, score };
    })
    .sort((a, b) => b.score - a.score);

  const best = ranked[0];
  if (!best || best.score < 0.7) {
    return { id: null, confidence: best?.score || 0 };
  }

  return { id: best.id, confidence: Number(best.score.toFixed(2)) };
}

export async function POST(request: NextRequest) {
  try {
    const limited = enforceRateLimit(request, 'api:contributions:figure-change:post', 30, 60_000);
    if (limited) {
      return limited;
    }

    const body = await request.json();

    const figureIdRaw = typeof body.figureId === 'string' ? body.figureId : '';
    const figureName = typeof body.figureName === 'string' ? sanitizeText(body.figureName, 120) : '';
    const lineName = typeof body.lineName === 'string' ? sanitizeText(body.lineName, 120) : '';
    const field = typeof body.field === 'string' ? sanitizeText(body.field, 40) : '';
    const proposedValueRaw = body.proposedValue;
    const reason = typeof body.reason === 'string' ? sanitizeText(body.reason, 2000) : '';
    const source = typeof body.source === 'string' ? sanitizeText(body.source, 255) : '';
    const submittedBy =
      typeof body.submittedBy === 'string' && body.submittedBy.trim().length > 0
        ? sanitizeText(body.submittedBy, 120)
        : 'anonymous';

    if (!field || !['base_buck', 'name', 'year', 'line_name'].includes(field)) {
      return secureJson({ error: 'field must be one of base_buck, name, year, line_name' }, { status: 400 });
    }

    if (proposedValueRaw === undefined || proposedValueRaw === null || String(proposedValueRaw).trim() === '') {
      return secureJson({ error: 'proposedValue is required' }, { status: 400 });
    }

    const typedField = field as ChangeField;
    const proposedYear = Number.parseInt(String(proposedValueRaw), 10);
    const proposedValue: string | number =
      typedField === 'year'
        ? proposedYear
        : sanitizeText(String(proposedValueRaw), 120);

    if (typedField === 'year' && (!Number.isInteger(proposedYear) || proposedYear < 1900 || proposedYear > 2100)) {
      return secureJson({ error: 'Invalid year value' }, { status: 400 });
    }

    let targetFigureId: string | null = null;
    let resolveConfidence = 1;

    if (figureIdRaw) {
      if (!isValidUuid(figureIdRaw)) {
        return secureJson({ error: 'Invalid figureId' }, { status: 400 });
      }
      targetFigureId = figureIdRaw;
    } else {
      if (!figureName) {
        return secureJson({ error: 'figureId or figureName is required' }, { status: 400 });
      }

      const resolved = await resolveFigureId(figureName, lineName || undefined);
      targetFigureId = resolved.id;
      resolveConfidence = resolved.confidence;
    }

    if (!targetFigureId) {
      return secureJson({ error: 'Could not confidently resolve figure target' }, { status: 400 });
    }

    const { data: figureRow } = await supabase
      .from('figures')
      .select('id, name, base_buck, year, lines(name)')
      .eq('id', targetFigureId)
      .maybeSingle();

    if (!figureRow) {
      return secureJson({ error: 'Target figure not found' }, { status: 404 });
    }

    const linesValue = (figureRow as any).lines;
    const currentLineName = Array.isArray(linesValue)
      ? linesValue[0]?.name || null
      : linesValue?.name || null;

    const currentValueByField: Record<ChangeField, unknown> = {
      base_buck: figureRow.base_buck,
      name: figureRow.name,
      year: figureRow.year,
      line_name: currentLineName,
    };

    const currentValue = currentValueByField[typedField];

    const claimPayload = {
      entity_type: 'figure',
      entity_id: targetFigureId,
      claim_type: 'figure_change_request',
      data: {
        target: {
          figure_id: targetFigureId,
          figure_name: figureRow.name,
        },
        change: {
          field: typedField,
          current_value: currentValue,
          proposed_value: proposedValue,
          reason: reason || null,
          source: source || null,
          submitted_by: submittedBy,
        },
        matching: {
          resolution_confidence: resolveConfidence,
        },
      },
      source: source || null,
      confidence: Math.max(0.3, Math.min(1, resolveConfidence)),
    };

    const { data: claim, error: insertError } = await supabase
      .from('claims')
      .insert([claimPayload])
      .select('*')
      .single();

    if (insertError) {
      console.error('Error creating figure change claim:', insertError);
      return secureJson(
        { error: 'Failed to submit figure change. Ensure claims INSERT policy is enabled.' },
        { status: 500 }
      );
    }

    return secureJson({ success: true, claim }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/contributions/figure-change:', error);
    return secureJson({ error: 'Failed to submit figure change' }, { status: 500 });
  }
}
