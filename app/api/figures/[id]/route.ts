/**
 * Figures API Routes for [id]
 * GET /api/figures/[id]
 */

import { NextRequest, NextResponse } from 'next/server';
import * as figureService from '@/services/figureService';
import { enforceRateLimit, isValidUuid, secureJson } from '@/lib/requestSecurity';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const limited = enforceRateLimit(request, 'api:figures:id:get', 120, 60_000);
    if (limited) {
      return limited;
    }

    if (!isValidUuid(params.id)) {
      return secureJson({ error: 'Invalid figure id' }, { status: 400 });
    }

    const figure = await figureService.getFigureById(params.id);
    if (!figure) {
      return secureJson({ error: 'Figure not found' }, { status: 404 });
    }
    return secureJson(figure);
  } catch (error) {
    console.error('Error in GET /api/figures/[id]:', error);
    return secureJson(
      { error: 'Failed to fetch figure' },
      { status: 500 }
    );
  }
}
