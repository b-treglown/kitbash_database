/**
 * Figures API Routes
 * GET /api/figures
 * POST /api/figures
 */

import { NextRequest } from 'next/server';
import * as figureService from '@/services/figureService';
import {
  enforceRateLimit,
  requireWriteToken,
  sanitizeText,
  secureJson,
} from '@/lib/requestSecurity';

export async function GET(request: NextRequest) {
  try {
    const limited = enforceRateLimit(request, 'api:figures:get', 120, 60_000);
    if (limited) {
      return limited;
    }

    const { searchParams } = new URL(request.url);
    const lineRaw = searchParams.get('line');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10) || 20)
    );

    const line = lineRaw ? sanitizeText(lineRaw, 80) : null;

    // Get figures list
    if (line) {
      const result = await figureService.getFiguresByLine(line, page, pageSize);
      return secureJson(result);
    }

    const figures = await figureService.getFigures();
    return secureJson(figures);
  } catch (error) {
    console.error('Error in GET /api/figures:', error);
    return secureJson(
      { error: 'Failed to fetch figures' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const limited = enforceRateLimit(request, 'api:figures:post', 20, 60_000);
    if (limited) {
      return limited;
    }

    const authError = requireWriteToken(request);
    if (authError) {
      return authError;
    }

    const body = await request.json();

    if (!body || typeof body !== 'object') {
      return secureJson({ error: 'Invalid request body' }, { status: 400 });
    }

    const name = typeof body.name === 'string' ? sanitizeText(body.name, 120) : '';
    const line = typeof body.line === 'string' ? sanitizeText(body.line, 120) : '';
    const baseBuck = typeof body.baseBuck === 'string' ? sanitizeText(body.baseBuck, 120) : 'unique';
    const year = body.year;

    if (!name || !line) {
      return secureJson(
        { error: 'name and line are required' },
        { status: 400 }
      );
    }

    if (
      year !== undefined &&
      year !== null &&
      (!Number.isInteger(year) || year < 1900 || year > 2100)
    ) {
      return secureJson({ error: 'Invalid year value' }, { status: 400 });
    }

    if (!baseBuck) {
      return secureJson({ error: 'baseBuck is required' }, { status: 400 });
    }

    const metadata = body.metadata;
    if (metadata !== undefined && (typeof metadata !== 'object' || Array.isArray(metadata))) {
      return secureJson({ error: 'metadata must be an object' }, { status: 400 });
    }

    const figure = await figureService.createFigure({
      name,
      line,
      base_buck: baseBuck,
      year,
      metadata,
    });

    if (!figure) {
      return secureJson(
        { error: 'Failed to create figure' },
        { status: 400 }
      );
    }

    return secureJson(figure, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/figures:', error);
    return secureJson(
      { error: 'Failed to create figure' },
      { status: 500 }
    );
  }
}
