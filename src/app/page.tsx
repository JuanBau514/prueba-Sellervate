import { redirect } from "next/navigation";

import { getViewer } from "@/lib/data/viewer";

// Entry point: leads start at their review queue, specialists at their feedback.
export default async function HomePage({ searchParams }: PageProps<"/">) {
  const viewer = await getViewer();
  if (viewer) redirect(viewer.role === "lead" ? "/review" : "/me");

  const { signin } = await searchParams;
  return (
    <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <h1 className="max-w-2xl text-xl font-semibold tracking-tight">Quality review, grounded in each brand.</h1>
      <p className="mt-3 max-w-prose text-base text-muted">
        Leads review sent replies against the brand&apos;s own procedure; specialists read what to change. Choose a person in
        “Viewing as” to sign in and see exactly what they are allowed to see.
      </p>
      {signin === "failed" && (
        <p role="alert" className="mt-6 max-w-prose rounded-field border border-critical/40 bg-critical/5 px-3 py-2 text-sm text-critical">
          Sign-in failed. Run <code>npm run seed</code> and check <code>DEMO_PASSWORD</code> in <code>.env.local</code>.
        </p>
      )}
    </main>
  );
}
