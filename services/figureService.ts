/**
 * Figure Service
 * Handles all figure-related database operations in parts-first schema
 */

import { supabase } from '@/lib/supabaseClient';
import type { Figure, Line } from '@/lib/types';

async function ensureLine(lineName: string): Promise<Line> {
  const { data: existing, error: fetchError } = await supabase
    .from('lines')
    .select('*')
    .eq('name', lineName)
    .maybeSingle();

  if (fetchError) {
    console.error('Error fetching line:', fetchError);
    throw fetchError;
  }

  if (existing) {
    return existing;
  }

  const { data: created, error: createError } = await supabase
    .from('lines')
    .insert([{ name: lineName }])
    .select('*')
    .single();

  if (createError) {
    console.error('Error creating line:', createError);
    throw createError;
  }

  return created;
}

/**
 * Get all figures, optionally filtered by line name
 */
export async function getFigures(line?: string): Promise<Figure[]> {
  let query = supabase
    .from('figures')
    .select('*, lines(name)');

  if (line) {
    query = query.eq('lines.name', line);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching figures:', error);
    throw error;
  }
  
  if (!data) {
    console.warn('No data returned from Supabase figures query');
    return [];
  }

  const mapped: Array<Figure | null> = (data || []).map((row: any) => {
    if (!row) {
      console.warn('Row is null/undefined in map');
      return null;
    }
    return {
      id: row.id,
      name: row.name,
      line_id: row.line_id,
      line_name: row.lines?.name,
      year: row.year || undefined,
      metadata: row.metadata || undefined,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  });

  return mapped.filter((row): row is Figure => row !== null);
}

/**
 * Get a single figure by ID
 */
export async function getFigureById(id: string): Promise<Figure | null> {
  const { data, error } = await supabase
    .from('figures')
    .select('*, lines(name)')
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching figure:', error);
    throw error;
  }

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    line_id: data.line_id,
    line_name: data.lines?.name,
    year: data.year || undefined,
    metadata: data.metadata || undefined,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}

/**
 * Search figures by name
 */
export async function searchFigures(query: string): Promise<Figure[]> {
  const { data, error } = await supabase
    .from('figures')
    .select('*, lines(name)')
    .ilike('name', `%${query}%`)
    .limit(20);

  if (error) {
    console.error('Error searching figures:', error);
    throw error;
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    name: row.name,
    line_id: row.line_id,
    line_name: row.lines?.name,
    year: row.year || undefined,
    metadata: row.metadata || undefined,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));
}

/**
 * Create a new figure
 */
export async function createFigure(figure: {
  name: string;
  line: string;
  year?: number;
  metadata?: Record<string, any>;
}): Promise<Figure | null> {
  const line = await ensureLine(figure.line);

  const payload = {
    name: figure.name,
    line_id: line.id,
    year: figure.year || null,
    metadata: figure.metadata || {},
  };

  const { data, error } = await supabase
    .from('figures')
    .insert([payload])
    .select('*, lines(name)')
    .single();

  if (error) {
    console.error('Error creating figure:', error);
    throw error;
  }

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    line_id: data.line_id,
    line_name: data.lines?.name,
    year: data.year || undefined,
    metadata: data.metadata || undefined,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}

/**
 * Update figure
 */
export async function updateFigure(
  id: string,
  updates: Partial<Figure>
): Promise<Figure | null> {
  const updatePayload: Record<string, any> = {
    name: updates.name,
    year: updates.year,
    metadata: updates.metadata,
  };

  if (updates.line_name) {
    const line = await ensureLine(updates.line_name);
    updatePayload.line_id = line.id;
  } else if (updates.line_id) {
    updatePayload.line_id = updates.line_id;
  }

  const { data, error } = await supabase
    .from('figures')
    .update(updatePayload)
    .eq('id', id)
    .select('*, lines(name)')
    .single();

  if (error) {
    console.error('Error updating figure:', error);
    throw error;
  }

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    line_id: data.line_id,
    line_name: data.lines?.name,
    year: data.year || undefined,
    metadata: data.metadata || undefined,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}

/**
 * Get figures by line with pagination (line name)
 */
export async function getFiguresByLine(
  line: string,
  page: number = 1,
  pageSize: number = 20
): Promise<{
  figures: Figure[];
  total: number;
  pages: number;
}> {
  const lineRow = await ensureLine(line);
  const start = (page - 1) * pageSize;

  const { data, error, count } = await supabase
    .from('figures')
    .select('*, lines(name)', { count: 'exact' })
    .eq('line_id', lineRow.id)
    .range(start, start + pageSize - 1);

  if (error) {
    console.error('Error fetching figures by line:', error);
    throw error;
  }

  return {
    figures: (data || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      line_id: row.line_id,
      line_name: row.lines?.name,
      year: row.year || undefined,
      metadata: row.metadata || undefined,
      created_at: row.created_at,
      updated_at: row.updated_at,
    })),
    total: count || 0,
    pages: Math.ceil((count || 0) / pageSize),
  };
}

/**
 * Get unique line names
 */
export async function getAvailableLines(): Promise<string[]> {
  const { data, error } = await supabase
    .from('lines')
    .select('name')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching lines:', error);
    throw error;
  }

  return (data || []).map((d: any) => d.name);
}
