import Link from "next/link";

// Also shown for replies the viewer may not see: saying "forbidden" would
// confirm that another brand's or colleague's reply exists.
export default function NotFound() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <h1 className="text-xl font-semibold tracking-tight">We could not find that page</h1>
      <p className="mt-3 max-w-prose text-muted">
        It may not exist, or it belongs to a brand you are not assigned to. Your review queue lists everything you can open.
      </p>
      <Link href="/review" className="btn btn-primary mt-6">
        Go to the review queue
      </Link>
    </main>
  );
}
