"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';

type Figure = {
  id: string;
  name: string;
  line_name?: string;
  base_buck?: string;
  year?: number;
};

type FigurePart = {
  id: string;
  name: string;
  slug: string;
  part_type: string;
  slot_label?: string;
  notes?: string;
  is_primary?: boolean;
};

type ComparisonState = {
  showComparison: boolean;
  compareFigureId: string | null;
  compareFigureName: string | null;
  compareParts: FigurePart[] | null;
};

async function fetchFigureData(figureId: string) {
  const res = await fetch(`/api/figures/${figureId}`);
  if (!res.ok) return null;
  return res.json();
}

export default function FigureDetailPage({ params }: { params: { id: string } }) {
  const [figure, setFigure] = useState<Figure | null>(null);
  const [parts, setParts] = useState<FigurePart[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comparison, setComparison] = useState<ComparisonState>({
    showComparison: false,
    compareFigureId: null,
    compareFigureName: null,
    compareParts: null,
  });
  const [compareFigureUrl, setCompareFigureUrl] = useState('');
  const [comparisonLoading, setComparisonLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchFigureData(params.id);
        if (!data) {
          setError('Failed to load figure');
          return;
        }

        setFigure(data.figure);
        setParts(data.parts || []);
      } catch {
        setError('Failed to load figure');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [params.id]);

  const handleStartComparison = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!compareFigureUrl) return;

    setComparisonLoading(true);
    try {
      const uuid = compareFigureUrl.split('/').pop();
      if (!uuid || !/^[0-9a-f-]{36}$/i.test(uuid)) {
        alert('Invalid figure URL or ID');
        return;
      }

      const data = await fetchFigureData(uuid);
      if (!data) {
        alert('Figure not found');
        return;
      }

      setComparison({
        showComparison: true,
        compareFigureId: uuid,
        compareFigureName: data.figure.name,
        compareParts: data.parts || [],
      });
    } catch {
      alert('Failed to load comparison figure');
    } finally {
      setComparisonLoading(false);
    }
  };

  if (loading) {
    return <p className="text-gray-600">Loading figure...</p>;
  }

  if (error || !figure) {
    return (
      <div className="space-y-4">
        <p className="text-red-700">{error || 'Figure not found'}</p>
        <Link href="/browse/figures" className="text-blue-600 hover:underline">
          Back to Figures
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-3xl font-bold mb-2">{figure.name}</h2>
        <p className="text-gray-600">
          {figure.line_name || 'Unknown line'}
          {figure.year ? ` • ${figure.year}` : ''}
        </p>
        <p className="text-sm text-gray-700 mt-1">Base buck: {figure.base_buck || 'unique'}</p>
      </section>

      <section className="space-y-3">
        <h3 className="text-xl font-semibold">Parts Used</h3>
        {parts.length === 0 ? (
          <p className="text-gray-600">No parts linked to this figure yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {parts.map((part) => (
              <Link
                key={`${part.id}-${part.slot_label || 'slot'}`}
                href={`/parts/${part.id}`}
                className="block p-4 bg-white border rounded-lg hover:bg-slate-50"
              >
                <p className="font-semibold">{part.name}</p>
                <p className="text-sm text-gray-600">
                  {part.part_type}
                  {part.slot_label ? ` • slot: ${part.slot_label}` : ''}
                  {part.is_primary ? ' • primary' : ''}
                </p>
                {part.notes ? <p className="text-sm text-gray-500 mt-1">{part.notes}</p> : null}
              </Link>
            ))}
          </div>
        )}
      </section>

      {!comparison.showComparison ? (
        <section className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
          <p className="text-blue-900 font-semibold">Compare with another figure</p>
          <form onSubmit={handleStartComparison} className="flex gap-2">
            <input
              type="text"
              value={compareFigureUrl}
              onChange={(e) => setCompareFigureUrl(e.target.value)}
              placeholder="Figure UUID or URL"
              className="flex-1 px-3 py-1 text-sm border rounded"
            />
            <button
              type="submit"
              disabled={comparisonLoading}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60"
            >
              {comparisonLoading ? 'Loading...' : 'Compare'}
            </button>
          </form>
        </section>
      ) : (
        <ComparisonPanel
          figure1={figure}
          parts1={parts}
          figure2Name={comparison.compareFigureName || 'Unknown'}
          figure2Id={comparison.compareFigureId || ''}
          parts2={comparison.compareParts || []}
          onClose={() =>
            setComparison({ showComparison: false, compareFigureId: null, compareFigureName: null, compareParts: null })
          }
        />
      )}

      <Link href="/browse/figures" className="inline-block text-blue-600 hover:underline">
        Back to Figures
      </Link>
    </div>
  );
}

function ComparisonPanel({
  figure1,
  parts1,
  figure2Name,
  figure2Id,
  parts2,
  onClose,
}: {
  figure1: Figure;
  parts1: FigurePart[];
  figure2Name: string;
  figure2Id: string;
  parts2: FigurePart[];
  onClose: () => void;
}) {
  const [selectedPair, setSelectedPair] = useState<[string, string] | null>(null);
  const [level, setLevel] = useState<'green' | 'yellow' | 'red'>('green');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  const handleQuickAdd = async () => {
    if (!selectedPair) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/compatibility/quick-add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          figure1Id: figure1.id,
          figure2Id: figure2Id,
          part1Id: selectedPair[0],
          part2Id: selectedPair[1],
          level,
          notes,
          submittedBy: 'browser-user',
        }),
      });

      if (res.ok) {
        setSubmitMessage('Compatibility claim submitted!');
        setSelectedPair(null);
        setNotes('');
        setTimeout(() => setSubmitMessage(null), 3000);
      } else {
        setSubmitMessage('Failed to submit');
      }
    } catch {
      setSubmitMessage('Error submitting claim');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="p-4 bg-purple-50 border border-purple-200 rounded-lg space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          Compare: {figure1.name} vs {figure2Name}
        </h3>
        <button onClick={onClose} className="text-gray-600 hover:text-gray-900">
          ✕
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <p className="font-semibold text-sm">{figure1.name}</p>
          {parts1.length === 0 ? (
            <p className="text-sm text-gray-600">No parts</p>
          ) : (
            <div className="space-y-1">
              {parts1.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPair([p.id, selectedPair?.[1] || ''])}
                  className={`w-full text-left px-2 py-1 text-sm rounded border ${
                    selectedPair?.[0] === p.id ? 'bg-purple-200 border-purple-400' : 'bg-white hover:bg-purple-100'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <p className="font-semibold text-sm">{figure2Name}</p>
          {parts2.length === 0 ? (
            <p className="text-sm text-gray-600">No parts</p>
          ) : (
            <div className="space-y-1">
              {parts2.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPair([selectedPair?.[0] || '', p.id])}
                  className={`w-full text-left px-2 py-1 text-sm rounded border ${
                    selectedPair?.[1] === p.id ? 'bg-purple-200 border-purple-400' : 'bg-white hover:bg-purple-100'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedPair && selectedPair[0] && selectedPair[1] && (
        <div className="space-y-2 p-3 bg-white rounded border">
          <p className="font-semibold text-sm">
            {parts1.find((p) => p.id === selectedPair[0])?.name} ↔{' '}
            {parts2.find((p) => p.id === selectedPair[1])?.name}
          </p>

          <select
            value={level}
            onChange={(e) => setLevel(e.target.value as 'green' | 'yellow' | 'red')}
            className="w-full px-2 py-1 text-sm border rounded"
          >
            <option value="green">Green - direct swap</option>
            <option value="yellow">Yellow - minor modifications</option>
            <option value="red">Red - incompatible</option>
          </select>

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Notes (optional)"
            className="w-full px-2 py-1 text-sm border rounded"
          />

          <button
            onClick={handleQuickAdd}
            disabled={submitting}
            className="w-full px-2 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-60"
          >
            {submitting ? 'Submitting...' : 'Submit Compatibility'}
          </button>

          {submitMessage && <p className="text-sm text-center text-green-700">{submitMessage}</p>}
        </div>
      )}
    </section>
  );
}
