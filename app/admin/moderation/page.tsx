'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

type ChangeRequest = {
  id: string;
  entity_id: string;
  claim_type: string;
  data: {
    target?: {
      figure_id: string;
      figure_name: string;
    };
    change?: {
      field: string;
      current_value: any;
      proposed_value: any;
      reason?: string;
      source?: string;
      submitted_by?: string;
    };
    figure_info?: any;
    admin_review?: {
      status: string;
      reviewed_at: string;
    };
  };
  confidence: number;
  created_at: string;
  source?: string;
  figure?: {
    id: string;
    name: string;
    base_buck?: string;
    year?: number;
  };
};

function AdminModerationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [claims, setClaims] = useState<ChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);

  // Check for token in URL or session
  useEffect(() => {
    const urlToken = searchParams.get('token');
    const savedToken = sessionStorage.getItem('admin_token');

    if (urlToken) {
      setToken(urlToken);
      sessionStorage.setItem('admin_token', urlToken);
      setAuthenticated(true);
    } else if (savedToken) {
      setToken(savedToken);
      setAuthenticated(true);
    }
  }, [searchParams]);

  // Fetch claims when authenticated
  useEffect(() => {
    if (!authenticated || !token) return;

    const fetchClaims = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch('/api/admin/claims', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          if (res.status === 401) {
            setError('Invalid admin token');
            setAuthenticated(false);
            sessionStorage.removeItem('admin_token');
            return;
          }
          throw new Error(`Failed to fetch claims: ${res.statusText}`);
        }

        const data = await res.json();
        setClaims(data.claims || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch claims');
      } finally {
        setLoading(false);
      }
    };

    fetchClaims();
  }, [authenticated, token]);

  const handleApprove = async (claimId: string) => {
    if (!confirm('Approve this claim?')) return;

    try {
      setProcessing(claimId);
      const res = await fetch('/api/admin/claims', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          claimId,
          action: 'approve',
        }),
      });

      if (!res.ok) {
        throw new Error(`Failed to approve: ${res.statusText}`);
      }

      // Refresh claims
      setClaims(claims.filter((c) => c.id !== claimId));
      alert('Claim approved!');
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (claimId: string) => {
    if (!confirm('Reject this claim?')) return;

    try {
      setProcessing(claimId);
      const res = await fetch('/api/admin/claims', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          claimId,
          action: 'reject',
        }),
      });

      if (!res.ok) {
        throw new Error(`Failed to reject: ${res.statusText}`);
      }

      // Refresh claims
      setClaims(claims.filter((c) => c.id !== claimId));
      alert('Claim rejected!');
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setProcessing(null);
    }
  };

  if (!authenticated) {
    return (
      <div className="max-w-2xl space-y-6">
        <section>
          <h2 className="text-3xl font-bold mb-2">Admin Moderation</h2>
          <p className="text-gray-600">Review and approve community contributions</p>
        </section>

        <div className="p-6 bg-white border rounded-lg shadow-sm space-y-4">
          <p className="text-sm text-gray-600">
            Enter your admin token to access the moderation dashboard.
          </p>
          <input
            type="password"
            placeholder="Admin token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
          />
          <button
            onClick={() => {
              if (token) {
                sessionStorage.setItem('admin_token', token);
                setAuthenticated(true);
              }
            }}
            className="px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800"
          >
            Unlock
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <section>
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold mb-2">Admin Moderation Dashboard</h2>
            <p className="text-gray-600">Review and approve community contributions</p>
          </div>
          <button
            onClick={() => {
              sessionStorage.removeItem('admin_token');
              setAuthenticated(false);
              setToken('');
            }}
            className="px-3 py-1 text-sm bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            Logout
          </button>
        </div>
      </section>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="p-6 bg-white border rounded-lg text-center text-gray-500">Loading claims...</div>
      ) : claims.length === 0 ? (
        <div className="p-6 bg-white border rounded-lg text-center text-gray-500">No pending claims</div>
      ) : (
        <div className="space-y-4">
          {claims.map((claim) => (
            <div
              key={claim.id}
              className={`p-6 border rounded-lg ${
                claim.data.admin_review?.status === 'approved_and_applied'
                  ? 'bg-green-50 border-green-200'
                  : 'bg-white'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg">
                    {claim.claim_type === 'figure_change_request'
                      ? 'Figure Change Request'
                      : 'Figure Info Submission'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {new Date(claim.created_at).toLocaleString()} · Confidence: {(claim.confidence * 100).toFixed(0)}%
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(claim.id)}
                    disabled={processing === claim.id}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-60"
                  >
                    {processing === claim.id ? 'Processing...' : 'Approve'}
                  </button>
                  <button
                    onClick={() => handleReject(claim.id)}
                    disabled={processing === claim.id}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-60"
                  >
                    {processing === claim.id ? 'Processing...' : 'Reject'}
                  </button>
                </div>
              </div>

              {claim.claim_type === 'figure_change_request' && claim.data.change && (
                <div className="space-y-4 bg-gray-50 p-4 rounded border border-gray-200">
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Target Figure</p>
                    <p className="text-lg">
                      {claim.data.target?.figure_name || claim.figure?.name}
                      {claim.figure?.base_buck && (
                        <span className="text-sm text-gray-500 ml-2">({claim.figure.base_buck})</span>
                      )}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-semibold text-gray-600 uppercase">Current Value</p>
                      <p className="text-base font-mono bg-white p-2 rounded border border-gray-300">
                        {claim.data.change.current_value || '(empty)'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-600 uppercase">Proposed Value</p>
                      <p className="text-base font-mono bg-white p-2 rounded border border-gray-300 text-green-700 font-bold">
                        {claim.data.change.proposed_value}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-gray-700">Field</p>
                    <p className="text-lg font-mono bg-white p-2 rounded border border-gray-300">
                      {claim.data.change.field}
                    </p>
                  </div>

                  {claim.data.change.reason && (
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Reason</p>
                      <p className="text-sm bg-white p-2 rounded border border-gray-300">
                        {claim.data.change.reason}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    {claim.data.change.source && (
                      <div>
                        <p className="text-xs font-semibold text-gray-600">Source</p>
                        <p className="text-sm">{claim.data.change.source}</p>
                      </div>
                    )}
                    {claim.data.change.submitted_by && (
                      <div>
                        <p className="text-xs font-semibold text-gray-600">Submitted By</p>
                        <p className="text-sm">{claim.data.change.submitted_by}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {claim.claim_type === 'figure_info_submission' && claim.data.figure_info && (
                <div className="space-y-4 bg-gray-50 p-4 rounded border border-gray-200">
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Submitted Info</p>
                    <div className="mt-2 space-y-2 text-sm">
                      {claim.data.figure_info.figureName && (
                        <p>
                          <span className="font-semibold">Name:</span> {claim.data.figure_info.figureName}
                        </p>
                      )}
                      {claim.data.figure_info.baseBuck && (
                        <p>
                          <span className="font-semibold">Base Buck:</span> {claim.data.figure_info.baseBuck}
                        </p>
                      )}
                      {claim.data.figure_info.year && (
                        <p>
                          <span className="font-semibold">Year:</span> {claim.data.figure_info.year}
                        </p>
                      )}
                      {claim.data.figure_info.lineName && (
                        <p>
                          <span className="font-semibold">Line:</span> {claim.data.figure_info.lineName}
                        </p>
                      )}
                    </div>
                  </div>

                  {(claim.data as any).matching?.topCandidates && (claim.data as any).matching.topCandidates.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Match Candidates</p>
                      <ul className="mt-2 space-y-1 text-sm">
                        {(claim.data as any).matching.topCandidates.map((candidate: any) => (
                          <li key={candidate.id} className="text-gray-600">
                            {candidate.name} ({candidate.base_buck}) - {(candidate.score * 100).toFixed(0)}%
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {claim.data.admin_review && (
                <div className="mt-4 p-3 bg-gray-100 rounded text-sm text-gray-700">
                  <strong>Status:</strong> {claim.data.admin_review.status} •{' '}
                  {new Date(claim.data.admin_review.reviewed_at).toLocaleString()}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminModerationPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-gray-500">Loading...</div>}>
      <AdminModerationContent />
    </Suspense>
  );
}
