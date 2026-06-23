import Link from 'next/link';

export default function UploadHubPage() {
  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-3xl font-bold mb-2">Uploads</h2>
        <p className="text-gray-600">
          Choose the upload type that matches your contribution.
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/upload/compatibility"
          className="p-6 bg-amber-50 rounded-lg border border-amber-200 hover:bg-amber-100 transition"
        >
          <h3 className="text-xl font-bold mb-2">Compatibility Uploads</h3>
          <p className="text-gray-700">Submit fit results between two parts.</p>
        </Link>

        <Link
          href="/upload/figure-info"
          className="p-6 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 transition"
        >
          <h3 className="text-xl font-bold mb-2">Figure Information Uploads</h3>
          <p className="text-gray-700">Add or enrich figure details like line, base buck, and references.</p>
        </Link>

        <Link
          href="/upload/figure-change"
          className="p-6 bg-emerald-50 rounded-lg border border-emerald-200 hover:bg-emerald-100 transition"
        >
          <h3 className="text-xl font-bold mb-2">Figure Change Requests</h3>
          <p className="text-gray-700">Submit corrections to existing figure data.</p>
        </Link>
      </section>
    </div>
  );
}
