"use client";

import { FormEvent, useState, ChangeEvent } from 'react';
import Image from 'next/image';

type FigureCandidate = {
  id: string;
  name: string;
  line_name?: string;
  base_buck?: string;
  score: number;
};

type FigureInfoMatch = {
  matchedFigureId: string | null;
  confidence: number;
  needsBaseBuckCorrection: boolean;
  topCandidates: FigureCandidate[];
};

export default function UploadFigureInfoPage() {
  const [figureName, setFigureName] = useState('');
  const [lineName, setLineName] = useState('');
  const [baseBuck, setBaseBuck] = useState('');
  const [year, setYear] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [submittedBy, setSubmittedBy] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [matching, setMatching] = useState<FigureInfoMatch | null>(null);

  const handleImageSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image file must be under 10MB');
      return;
    }

    setImageFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadImage = async () => {
    if (!imageFile) return;

    try {
      setUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append('file', imageFile);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Upload failed: ${res.statusText}`);
      }

      const data = await res.json();
      const uploadedUrl = data.url;

      setImageUrl(uploadedUrl);
      setImageFile(null);
      setImagePreview(null);
      setMessage('Image uploaded successfully! URL is now set.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setMatching(null);

    if (!figureName || !baseBuck) {
      setError('Figure name and base buck are required.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/contributions/figure-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          figureName,
          lineName,
          baseBuck,
          year: year ? Number.parseInt(year, 10) : undefined,
          imageUrl,
          notes,
          submittedBy,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to submit figure info');
        return;
      }

      setMessage('Figure information submitted for review.');
      setMatching(data.matching || null);
      setFigureName('');
      setLineName('');
      setBaseBuck('');
      setYear('');
      setImageUrl('');
      setNotes('');
    } catch {
      setError('Network error while submitting figure info');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <section>
        <h2 className="text-3xl font-bold mb-2">Figure Information Upload</h2>
        <p className="text-gray-600">
          Submit figure details. We auto-match to existing figures and flag possible corrections.
        </p>
      </section>

      <form onSubmit={onSubmit} className="space-y-4 p-6 bg-white border rounded-lg shadow-sm">
        <div>
          <label htmlFor="figureName" className="block text-sm font-medium mb-1">
            Figure Name (required)
          </label>
          <input
            id="figureName"
            required
            value={figureName}
            onChange={(e) => setFigureName(e.target.value)}
            placeholder="Vulcan"
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          <div>
            <label htmlFor="baseBuck" className="block text-sm font-medium mb-1">
              Base Buck (required)
            </label>
            <input
              id="baseBuck"
              required
              value={baseBuck}
              onChange={(e) => setBaseBuck(e.target.value)}
              placeholder="Vulcan Buck"
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="year" className="block text-sm font-medium mb-1">
              Year (optional)
            </label>
            <input
              id="year"
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="2023"
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          <div />
        </div>

        <div className="border-t pt-4">
          <h3 className="font-semibold mb-4">Image (optional)</h3>

          {imagePreview && (
            <div className="mb-4 relative w-full h-48">
              <Image
                src={imagePreview}
                alt="Preview"
                fill
                className="object-contain rounded-md"
              />
            </div>
          )}

          {imageUrl && !imagePreview && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-700">
              ✓ Image URL set: {imageUrl}
            </div>
          )}

          {!imageUrl && (
            <div className="space-y-4">
              <div>
                <label htmlFor="imageFile" className="block text-sm font-medium mb-2">
                  Upload Image File
                </label>
                <input
                  id="imageFile"
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  disabled={uploading}
                  className="w-full px-3 py-2 border rounded-md"
                />
                <p className="text-xs text-gray-500 mt-1">Max 10MB • PNG, JPG, GIF supported</p>
              </div>

              {imageFile && (
                <button
                  type="button"
                  onClick={handleUploadImage}
                  disabled={uploading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-60"
                >
                  {uploading ? 'Uploading...' : 'Upload Image'}
                </button>
              )}

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">or</span>
                </div>
              </div>

              <div>
                <label htmlFor="imageUrl" className="block text-sm font-medium mb-1">
                  Paste Image URL
                </label>
                <input
                  id="imageUrl"
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
            </div>
          )}

          {imageUrl && (
            <button
              type="button"
              onClick={() => {
                setImageUrl('');
                setImageFile(null);
                setImagePreview(null);
              }}
              className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              Clear Image
            </button>
          )}
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium mb-1">
            Notes (optional)
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
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

        {error ? <p className="text-red-700 text-sm">{error}</p> : null}
        {message ? <p className="text-green-700 text-sm">{message}</p> : null}

        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 disabled:opacity-60"
        >
          {submitting ? 'Submitting...' : 'Submit Figure Information'}
        </button>
      </form>

      {matching ? (
        <section className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-2">
          <p className="text-sm text-green-900">
            Match confidence: {(matching.confidence * 100).toFixed(0)}%
          </p>
          {matching.needsBaseBuckCorrection ? (
            <p className="text-sm text-green-900">This submission suggests a base buck correction for an existing figure.</p>
          ) : null}
          {matching.topCandidates.length > 0 ? (
            <ul className="text-sm text-green-900 list-disc pl-5">
              {matching.topCandidates.map((candidate) => (
                <li key={candidate.id}>
                  {candidate.name} ({(candidate.score * 100).toFixed(0)}%)
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
