import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kitbash Database',
  description:
    'Community-built knowledge graph of action figure parts, compatibility, and kitbashes',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <header className="bg-slate-900 text-white p-6">
          <nav className="max-w-7xl mx-auto flex items-center justify-between">
            <h1 className="text-2xl font-bold">Kitbash Database</h1>
            <div className="flex gap-4">
              <a href="/" className="hover:text-slate-200">
                Home
              </a>
              <a href="/browse" className="hover:text-slate-200">
                Browse
              </a>
              <a href="/upload" className="hover:text-slate-200">
                Uploads
              </a>
              <a href="/upload/compatibility" className="hover:text-slate-200">
                Upload Compatibility
              </a>
            </div>
          </nav>
        </header>
        <main className="max-w-7xl mx-auto p-6">{children}</main>
      </body>
    </html>
  );
}
