import { NextRequest } from 'next/server';
import * as partService from '@/services/partService';
import {
  enforceRateLimit,
  isValidUuid,
  requireWriteToken,
  sanitizeText,
  secureJson,
} from '@/lib/requestSecurity';

export async function GET(request: NextRequest) {
  try {
    const limited = enforceRateLimit(request, 'api:parts:get', 120, 60_000);
    if (limited) {
      return limited;
    }

    const { searchParams } = new URL(request.url);
    const figureId = searchParams.get('figureId');
    const partType = searchParams.get('type');
    const queryRaw = searchParams.get('q');
    const query = queryRaw ? sanitizeText(queryRaw, 100) : '';

    if (figureId) {
      if (!isValidUuid(figureId)) {
        return secureJson({ error: 'Invalid figureId' }, { status: 400 });
      }

      const parts = await partService.getPartsByFigure(figureId);
      return secureJson(parts);
    }

    if (query.length >= 2) {
      const parts = await partService.searchParts(query, partType || undefined);
      return secureJson(parts);
    }

    const parts = await partService.getParts(partType || undefined);
    return secureJson(parts);
  } catch (error) {
    console.error('Error in GET /api/parts:', error);
    return secureJson({ error: 'Failed to fetch parts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const limited = enforceRateLimit(request, 'api:parts:post', 20, 60_000);
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
    const type = typeof body.type === 'string' ? sanitizeText(body.type, 50) : '';
    const sourceFigureId =
      typeof body.source_figure_id === 'string' ? body.source_figure_id : undefined;

    if (!name || !type) {
      return secureJson({ error: 'name and type are required' }, { status: 400 });
    }

    if (!['head', 'torso', 'arms', 'legs', 'accessory'].includes(type)) {
      return secureJson({ error: 'Invalid part type' }, { status: 400 });
    }

    if (sourceFigureId && !isValidUuid(sourceFigureId)) {
      return secureJson({ error: 'Invalid source_figure_id' }, { status: 400 });
    }

    const metadata =
      body.metadata !== undefined && typeof body.metadata === 'object' && !Array.isArray(body.metadata)
        ? body.metadata
        : {};

    const part = await partService.createPart({
      name,
      type: type as 'head' | 'torso' | 'arms' | 'legs' | 'accessory',
      source_figure_id: sourceFigureId,
      metadata,
    });

    if (!part) {
      return secureJson({ error: 'Failed to create part' }, { status: 400 });
    }

    return secureJson(part, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/parts:', error);
    return secureJson({ error: 'Failed to create part' }, { status: 500 });
  }
}
