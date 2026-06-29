import { Link } from 'react-router-dom';

/**
 * Real not-found page for unknown routes. Rendered (not redirected) so the URL
 * is preserved and the global <Seo /> marks it noindex,nofollow — avoiding the
 * soft-404 that a 200 + redirect-to-home would otherwise produce.
 */
export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col items-center justify-center px-6 text-center">
      <p className="text-5xl" aria-hidden>
        🪴
      </p>
      <h1 className="mt-4 text-2xl font-bold text-emerald-950">Page not found</h1>
      <p className="mt-2 text-sm text-gray-600">
        We couldn&apos;t find that page. It may have moved, or the link might be incomplete.
      </p>
      <Link
        to="/"
        className="mt-6 rounded-2xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800"
      >
        Back to Dr. Plant
      </Link>
    </main>
  );
}
