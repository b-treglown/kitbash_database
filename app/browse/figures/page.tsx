"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Figure = {
  id: string;
  name: string;
  line_name?: string;
  base_buck?: string;
  year?: number;
};

export default function BrowseFiguresPage() {
  const [figures, setFigures] = useState<Figure[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/figures');
        if (!res.ok) {
          setFigures([]);
          return;
        }

        const data = (await res.json()) as Figure[];
        setFigures(data);
      } catch {
        setFigures([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-3xl font-bold mb-2">Browse Figures</h2>
        <p className="text-gray-600">
          {loading
            ? 'Loading figures...'
            : figures.length > 0
            ? `Found ${figures.length} figure(s).`
            : 'No figures found yet. Seed data to populate this list.'}
        </p>
      </section>

      {figures.length > 0 ? (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {figures.map((figure) => (
            <Link
              key={figure.id}
              href={`/figures/${figure.id}`}
              className="block p-4 bg-white border rounded-lg shadow-sm hover:bg-slate-50"
            >
              <h3 className="text-lg font-semibold">{figure.name}</h3>
              <p className="text-sm text-gray-600">
                {figure.line_name || 'Unknown line'}
                {figure.year ? ` • ${figure.year}` : ''}
              </p>
              <p className="text-sm text-gray-700 mt-1">
                Base buck: {figure.base_buck || 'unique'}
              </p>
              <p className="text-sm text-blue-600 mt-2">View parts and compatibility</p>
            </Link>
          ))}
        </section>
      ) : (
        <section className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800">
            The route works, but your database currently has no figure rows.
          </p>
        </section>
      )}

      <Link href="/browse" className="inline-block text-blue-600 hover:underline">
        Back to Browse
      </Link>
    </div>
  );
}
