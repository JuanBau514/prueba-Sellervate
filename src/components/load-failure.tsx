'use client';

import Link from 'next/link';

// Shared by the route and global error boundaries. It says what failed, the two
// usual local causes, and what to do; no apology, no stack trace. The reference
// matches the server log entry.
export function LoadFailure({ digest, retry }: { digest?: string; retry: () => void }) {
  return (
    <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <h1 className="text-xl font-semibold tracking-tight">This page could not load its data</h1>
      <div className="mt-3 max-w-prose space-y-2 text-muted">
        <p>The server did not get an answer from the database, so nothing is shown rather than something incomplete.</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Running the demo locally? Check that Supabase is up with <code className="text-base-content">npm run db:status</code>,
            then try again.
          </li>
          <li>If your session ended, choose a person again in “Viewing as”.</li>
        </ul>
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button type="button" onClick={retry} className="btn btn-primary">
          Try again
        </button>
        <Link href="/" className="btn btn-ghost font-normal">
          Go to the start
        </Link>
      </div>
      {digest && <p className="mt-6 text-xs text-muted">Reference for the server log: {digest}</p>}
    </main>
  );
}
