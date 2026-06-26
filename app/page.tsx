/**
 * Home Page
 */

import React from 'react';

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-900">
      <div className="max-w-xl text-center p-8">
        <h1 className="text-4xl font-extrabold mb-4">Site Under Maintenance</h1>
        <p className="text-lg mb-6">We're performing maintenance on the backend. The site will be back shortly.</p>
        <p className="text-sm text-gray-600">If you need urgent access, contact the maintainer or try again in a few minutes.</p>
      </div>
    </main>
  );
}
