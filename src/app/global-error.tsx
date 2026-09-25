'use client';

import { LoadFailure } from '@/components/load-failure';
import './globals.css';

// Replaces the root layout when it fails (the layout itself reads the session
// from the database), so it brings its own document and theme.
export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="en" data-theme="sellervate">
      <body className="min-h-screen antialiased">
        <title>Sellervate · Could not load</title>
        <LoadFailure digest={error.digest} retry={retry} />
      </body>
    </html>
  );
}
