/**
 * Search API Route
 * GET /api/search?q=query&type=figure|part|mold|kitbash
 */

import { NextRequest, NextResponse } from 'next/server';
import * as searchService from '@/services/searchService';
import { enforceRateLimit, sanitizeText, secureJson } from '@/lib/requestSecurity';

export async function GET(request: NextRequest) {
  try {
    const limited = enforceRateLimit(request, 'api:search:get', 90, 60_000);
    if (limited) {
      return limited;
    }

    const { searchParams } = new URL(request.url);
    const queryRaw = searchParams.get('q');
    const typeParam = searchParams.get('type');
    const methodParam = searchParams.get('method') || 'global'; // global, fuzzy, alias
    const type =
      typeParam === 'figure' ||
      typeParam === 'part' ||
      typeParam === 'mold' ||
      typeParam === 'kitbash' ||
      typeParam === 'line'
        ? typeParam
        : undefined;
    const method =
      methodParam === 'global' || methodParam === 'fuzzy' || methodParam === 'alias'
        ? methodParam
        : 'global';

    const query = queryRaw ? sanitizeText(queryRaw, 100) : '';

    if (query.length < 2) {
      return secureJson(
        { error: 'Query too short' },
        { status: 400 }
      );
    }

    let results;

    switch (method) {
      case 'fuzzy':
        results = await searchService.fuzzySearch(query, type);
        break;
      case 'alias':
        results = await searchService.searchWithAliases(query, type);
        break;
      default:
        results = await searchService.globalSearch(query);
    }

    return secureJson({
      query,
      method,
      resultCount: results.length,
      results,
    });
  } catch (error) {
    console.error('Error in GET /api/search:', error);
    return secureJson(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}
