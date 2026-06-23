"use client";

import { FormEvent, useState } from 'react';

type ChangeField = 'base_buck' | 'name' | 'year' | 'line_name';

export default function UploadFigureChangePage() {
  const [figureId, setFigureId] = useState('');
  const [figureName, setFigureName] = useState('');
  const [lineName, setLineName] = useState('');
  const [field, setField] = useState<ChangeField>('base_buck');
  const [proposedValue, setProposedValue] = useState('');
  const [reason, setReason] = useState('');
  const [source, setSource] = useState('');
  const [submittedBy, setSubmittedBy] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fillVulcanCorrection = () => {
    setFigureName('Vulcan');
    setLineName('Marvel Legends');
    setField('base_buck');
    setProposedValue('Vulcan Buck');
    setReason('Current entry shows unique buck, but figure uses Vulcan Buck.');
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!figureId && !figureName) {
      setError('Provide figureId or figureName.');
      return;
    }

    if (!proposedValue) {
      setError('proposedValue is required.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/contributions/figure-change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          figureId: figureId || undefined,
          figureName: figureName || undefined,
          lineName: lineName || undefined,
          field,
          proposedValue,
          reason,
          source,
          submittedBy,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to submit figure change');
        return;
      }

      setMessage('Figure change request submitted for review.');
      setFigureId('');
      setFigureName('');
      setLineName('');
      setProposedValue('');
      setReason('');
      setSource('');
    } catch {
      setError('Network error while submitting figure change');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <section>
        <h2 className="text-3xl font-bold mb-2">Figure Change Request</h2>
        <p className="text-gray-600">
          Submit a correction to an existing figure record. Example: set Vulcan base buck to Vulcan Buck.
        </p>
      </section>

      <section className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <button
          type="button"
          onClick={fillVulcanCorrection}
          className="px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700"
        >
          Prefill Vulcan Base Buck Fix
        </button>
      </section>

      <form onSubmit={onSubmit} className="space-y-4 p-6 bg-white border rounded-lg shadow-sm">
        <div>
          <label htmlFor="figureId" className="block text-sm font-medium mb-1">
            Figure ID (optional if name is provided)
          </label>
          <input
            id="figureId"
            value={figureId}
            onChange={(e) => setFigureId(e.target.value)}
            placeholder="UUID"
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="figureName" className="block text-sm font-medium mb-1">
              Figure Name (optional if ID is provided)
            </label>
            <input
              id="figureName"
              value={figureName}
              onChange={(e) => setFigureName(e.target.value)}
              placeholder="Vulcan"
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          <div>
            <label htmlFor="lineName" className="block text-sm font-medium mb-1">
              Line Name (optional)
            </label>
            <input
              id="lineName"
              value={lineName}
              onChange={(e) => setLineName(e.target.value)}
              placeholder="Marvel Legends"
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="field" className="block text-sm font-medium mb-1">
              Field
            </label>
            <select
              id="field"
              value={field}
              onChange={(e) => setField(e.target.value as ChangeField)}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="base_buck">base_buck</option>
              <option value="name">name</option>
              <option value="year">year</option>
              <option value="line_name">line_name</option>
            </select>
          </div>

          <div>
            <label htmlFor="proposedValue" className="block text-sm font-medium mb-1">
              Proposed Value (required)
            </label>
            <input
              id="proposedValue"
              required
              value={proposedValue}
              onChange={(e) => setProposedValue(e.target.value)}
              placeholder={field === 'base_buck' ? 'Vulcan Buck' : 'New value'}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
        </div>

        <div>
          <label htmlFor="reason" className="block text-sm font-medium mb-1">
            Reason
          </label>
          <textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Why this change is needed"
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="source" className="block text-sm font-medium mb-1">
              Source URL / Reference (optional)
            </label>
            <input
              id="source"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          <div>
            <label htmlFor="submittedBy" className="block text-sm font-medium mb-1">
              Submitted By (optional)
            </label>
            <input
              id="submittedBy"
              value={submittedBy}
              onChange={(e) => setSubmittedBy(e.target.value)}
              placeholder="anonymous"
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
          {submitting ? 'Submitting...' : 'Submit Figure Change Request'}
        </button>
      </form>
    </div>
  );
}
