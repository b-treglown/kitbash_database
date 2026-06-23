/**
 * Home Page
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Home() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data.results || []);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="text-center py-12">
        <h2 className="text-4xl font-bold mb-4">Action Figure Knowledge Graph</h2>
        <p className="text-gray-600 mb-8">
          A community-built database of parts, molds, and kitbashes
        </p>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-8">
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search figures, parts, molds, or kitbashes..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>

        {/* Results */}
        {results.length > 0 && (
          <div className="max-w-2xl mx-auto text-left">
            <h3 className="text-xl font-bold mb-4">Results ({results.length})</h3>
            <div className="space-y-2">
              {results.map((result) => (
                <div
                  key={`${result.type}-${result.id}`}
                  className="p-3 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  <span className="inline-block mr-2 px-2 py-1 bg-blue-200 text-blue-800 text-xs rounded">
                    {result.type}
                  </span>
                  <span className="font-semibold">{result.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Quick Links */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Link
          href="/browse/figures"
          className="p-6 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
        >
          <h3 className="text-xl font-bold mb-2">Browse Figures</h3>
          <p className="text-gray-600">Explore all action figures</p>
        </Link>
        <Link
          href="/browse/kitbashes"
          className="p-6 bg-green-50 rounded-lg hover:bg-green-100 transition"
        >
          <h3 className="text-xl font-bold mb-2">Browse Kitbashes</h3>
          <p className="text-gray-600">See community creations</p>
        </Link>
        <Link
          href="/upload"
          className="p-6 bg-purple-50 rounded-lg hover:bg-purple-100 transition"
        >
          <h3 className="text-xl font-bold mb-2">Uploads</h3>
          <p className="text-gray-600">Open all upload workflows</p>
        </Link>
        <Link
          href="/upload/figure-info"
          className="p-6 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition"
        >
          <h3 className="text-xl font-bold mb-2">Upload Figure Info</h3>
          <p className="text-gray-600">Add or enrich figure details</p>
        </Link>
        <Link
          href="/upload/figure-change"
          className="p-6 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition"
        >
          <h3 className="text-xl font-bold mb-2">Submit Figure Change</h3>
          <p className="text-gray-600">Propose corrections to figure records</p>
        </Link>
        <Link
          href="/upload/compatibility"
          className="p-6 bg-amber-50 rounded-lg hover:bg-amber-100 transition"
        >
          <h3 className="text-xl font-bold mb-2">Upload Compatibility</h3>
          <p className="text-gray-600">Submit fit results between parts</p>
        </Link>
      </section>

      {/* Stats */}
      <section className="bg-gray-50 p-8 rounded-lg">
        <h3 className="text-xl font-bold mb-4">About This Project</h3>
        <p className="text-gray-700 mb-4">
          Kitbash Database is a community-driven knowledge graph of action figure parts,
          molds, and customizations. Unlike a static catalog, this grows as the community
          adds information, creating a living resource for figure enthusiasts.
        </p>
        <ul className="space-y-2 text-gray-600">
          <li>✓ Build a knowledge graph of figure parts and compatibility</li>
          <li>✓ Search with intelligent matching and aliases</li>
          <li>✓ Community submissions and claims system</li>
          <li>✓ Mobile-ready architecture</li>
        </ul>
      </section>
    </div>
  );
}
