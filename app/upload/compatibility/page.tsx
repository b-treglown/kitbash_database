"use client";

import { FormEvent, useState } from 'react';

export default function UploadCompatibilityPage() {
  const [sourceFigureId, setSourceFigureId] = useState('');
  const [sourcePartId, setSourcePartId] = useState('');
  const [targetFigureId, setTargetFigureId] = useState('');
  const [targetPartId, setTargetPartId] = useState('');
  const [compatibilityLevel, setCompatibilityLevel] = useState<'green' | 'yellow' | 'red'>('green');
  const [notes, setNotes] = useState('');
  const [submittedBy, setSubmittedBy] = useState('');
  const [source, setSource] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!sourcePartId || !targetPartId) {
      setError('Source and target part IDs are required.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceFigureId: sourceFigureId || null,
          sourcePartId,
          targetFigureId: targetFigureId || null,
          targetPartId,
          compatibilityLevel,
          notes,
          submittedBy,
          source,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Submission failed');
        return;
      }

      setMessage('Compatibility claim submitted successfully.');
      setNotes('');
      setSource('');
    } catch {
      setError('Network error while submitting claim');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <section>
        <h2 className="text-3xl font-bold mb-2">Upload Compatibility</h2>
        <p className="text-gray-600">
          Submit part-to-part compatibility evidence, optionally linked to source and target figures.
        </p>
        <p className="text-sm text-gray-600 mt-2">
          Other upload types:
          {' '}
          <a href="/upload/figure-info" className="text-blue-700 underline">figure information</a>
          {' '}
          and
          {' '}
          <a href="/upload/figure-change" className="text-blue-700 underline">figure change requests</a>
          .
        </p>
      </section>

      <form onSubmit={onSubmit} className="space-y-4 p-6 bg-white border rounded-lg shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="sourceFigureId" className="block text-sm font-medium mb-1">
              Source Figure ID (optional)
            </label>
            <input
              id="sourceFigureId"
              value={sourceFigureId}
              onChange={(e) => setSourceFigureId(e.target.value)}
              placeholder="UUID"
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          <div>
            <label htmlFor="targetFigureId" className="block text-sm font-medium mb-1">
              Target Figure ID (optional)
            </label>
            <input
              id="targetFigureId"
              value={targetFigureId}
              onChange={(e) => setTargetFigureId(e.target.value)}
              placeholder="UUID"
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="sourcePartId" className="block text-sm font-medium mb-1">
              Source Part ID (required)
            </label>
            <input
              id="sourcePartId"
              required
              value={sourcePartId}
              onChange={(e) => setSourcePartId(e.target.value)}
              placeholder="UUID"
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          <div>
            <label htmlFor="targetPartId" className="block text-sm font-medium mb-1">
              Target Part ID (required)
            </label>
            <input
              id="targetPartId"
              required
              value={targetPartId}
              onChange={(e) => setTargetPartId(e.target.value)}
              placeholder="UUID"
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
        </div>

        <div>
          <label htmlFor="compatibilityLevel" className="block text-sm font-medium mb-1">
            Compatibility Level
          </label>
          <select
            id="compatibilityLevel"
            value={compatibilityLevel}
            onChange={(e) => setCompatibilityLevel(e.target.value as 'green' | 'yellow' | 'red')}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="green">Green - direct swap</option>
            <option value="yellow">Yellow - minor modifications</option>
            <option value="red">Red - incompatible</option>
          </select>
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium mb-1">
            Notes
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="How did you test this fit? Any modifications?"
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="submittedBy" className="block text-sm font-medium mb-1">
              Submitted By
            </label>
            <input
              id="submittedBy"
              value={submittedBy}
              onChange={(e) => setSubmittedBy(e.target.value)}
              placeholder="username or alias"
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          <div>
            <label htmlFor="source" className="block text-sm font-medium mb-1">
              Source URL / Reference
            </label>
            <input
              id="source"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="Optional proof link"
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
        </div>

        {error ? <p className="text-red-700 text-sm">{error}</p> : null}
        {message ? <p className="text-green-700 text-sm">{message}</p> : null}

        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 disabled:opacity-60"
        >
          {submitting ? 'Submitting...' : 'Submit Compatibility Claim'}
        </button>
      </form>
    </div>
  );
}
