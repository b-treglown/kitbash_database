"use client";

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

const LEVEL_COLORS: Record<string, string> = {
  green: 'bg-green-100 text-green-800 border-green-300',
  yellow: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  red: 'bg-red-100 text-red-800 border-red-300',
};

type Part = {
  id: string;
  name: string;
  slug: string;
  part_type: string;
  description?: string;
};

type CompatibilityRow = {
  id: string;
  compatibility_level: 'green' | 'yellow' | 'red';
  notes?: string;
  modification_type?: string;
  confidence?: number;
  target?: { id: string; name: string; slug: string; part_type: string };
  source?: { id: string; name: string; slug: string; part_type: string };
};

type FigureUsage = {
  slot_label?: string;
  notes?: string;
  figures?: { id: string; name: string; year?: number; lines?: { name?: string } };
};

export default function PartDetailPage({ params }: { params: { id: string } }) {
  const [part, setPart] = useState<Part | null>(null);
  const [usedBy, setUsedBy] = useState<FigureUsage[]>([]);
  const [compatibleWith, setCompatibleWith] = useState<CompatibilityRow[]>([]);
  const [usedAsTargetBy, setUsedAsTargetBy] = useState<CompatibilityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [levelFilter, setLevelFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'confidence' | 'level'>('confidence');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/parts/${params.id}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || 'Failed to load part');
          return;
        }

        setPart(data.part || null);
        setUsedBy(data.usedByFigures || []);
        setCompatibleWith(data.compatibleWith || []);
        setUsedAsTargetBy(data.usedAsTargetBy || []);
      } catch {
        setError('Failed to load part');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [params.id]);

  const allCompatibilities = useMemo(() => {
    let edges = [
      ...compatibleWith.map((row) => ({
        id: row.id,
        direction: 'outgoing' as const,
        level: row.compatibility_level,
        label: row.target?.name || 'Unknown part',
        partId: row.target?.id,
        notes: row.notes,
        confidence: row.confidence || 0.5,
      })),
      ...usedAsTargetBy.map((row) => ({
        id: row.id,
        direction: 'incoming' as const,
        level: row.compatibility_level,
        label: row.source?.name || 'Unknown part',
        partId: row.source?.id,
        notes: row.notes,
        confidence: row.confidence || 0.5,
      })),
    ];

    if (levelFilter) {
      edges = edges.filter((e) => e.level === levelFilter);
    }

    if (sortBy === 'confidence') {
      edges.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
    } else if (sortBy === 'level') {
      const levelOrder = { green: 0, yellow: 1, red: 2 };
      edges.sort((a, b) => levelOrder[a.level as keyof typeof levelOrder] - levelOrder[b.level as keyof typeof levelOrder]);
    }

    return edges;
  }, [compatibleWith, usedAsTargetBy, levelFilter, sortBy]);

  if (loading) {
    return <p className="text-gray-600">Loading part...</p>;
  }

  if (error || !part) {
    return (
      <div className="space-y-4">
        <p className="text-red-700">{error || 'Part not found'}</p>
        <Link href="/browse/figures" className="text-blue-600 hover:underline">
          Back to Figures
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-3xl font-bold mb-2">{part.name}</h2>
        <p className="text-gray-600">
          {part.part_type} • {part.slug}
        </p>
        {part.description ? <p className="mt-2 text-gray-700">{part.description}</p> : null}
      </section>

      <section className="space-y-3">
        <h3 className="text-xl font-semibold">Used By Figures</h3>
        {usedBy.length === 0 ? (
          <p className="text-gray-600">No linked figures yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {usedBy.map((row, idx) => (
              <Link
                key={`${row.figures?.id || 'figure'}-${idx}`}
                href={row.figures?.id ? `/figures/${row.figures.id}` : '/browse/figures'}
                className="block p-4 bg-white border rounded-lg hover:bg-slate-50"
              >
                <p className="font-semibold">{row.figures?.name || 'Unknown figure'}</p>
                <p className="text-sm text-gray-600">
                  {row.figures?.lines?.name || 'Unknown line'}
                  {row.slot_label ? ` • slot: ${row.slot_label}` : ''}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-xl font-semibold">Compatibility Graph</h3>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'confidence' | 'level')}
            className="text-sm px-2 py-1 border rounded"
          >
            <option value="confidence">Sort by confidence</option>
            <option value="level">Sort by level</option>
          </select>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setLevelFilter(null)}
            className={`px-3 py-1 text-sm rounded border ${!levelFilter ? 'bg-slate-200' : 'bg-white'}`}
          >
            All
          </button>
          {(['green', 'yellow', 'red'] as const).map((lv) => (
            <button
              key={lv}
              onClick={() => setLevelFilter(levelFilter === lv ? null : lv)}
              className={`px-3 py-1 text-sm rounded border ${levelFilter === lv ? LEVEL_COLORS[lv] : 'bg-white'}`}
            >
              {lv.charAt(0).toUpperCase() + lv.slice(1)}
            </button>
          ))}
        </div>

        {allCompatibilities.length === 0 ? (
          <p className="text-gray-600">No compatibility edges for this part{levelFilter ? ` at level ${levelFilter}` : ''}.</p>
        ) : (
          <div className="space-y-2">
            {allCompatibilities.map((row) => (
              <div key={row.id} className="p-4 bg-white border rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium">
                      {row.direction === 'outgoing' ? 'Works with' : 'Used by compatibility from'}:{' '}
                      {row.partId ? (
                        <Link href={`/parts/${row.partId}`} className="text-blue-600 hover:underline">
                          {row.label}
                        </Link>
                      ) : (
                        row.label
                      )}
                    </p>
                    {row.notes ? <p className="text-sm text-gray-600 mt-1">{row.notes}</p> : null}
                  </div>
                  <div className="ml-2 flex flex-col items-end gap-1">
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded border ${LEVEL_COLORS[row.level]}`}>
                      {row.level}
                    </span>
                    <span className="text-xs text-gray-600">confidence: {(row.confidence * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <p className="text-green-900">
          Know a fit that is missing? Add a compatibility claim from the upload compatibility page.
        </p>
      </section>

      <Link href="/browse/figures" className="inline-block text-blue-600 hover:underline">
        Back to Figures
      </Link>
    </div>
  );
}
