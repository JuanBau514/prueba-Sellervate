import { redirect } from "next/navigation";

import { listBrands } from "@/lib/data/brands";
import { listReplies } from "@/lib/data/replies";
import { getViewer } from "@/lib/data/viewer";

const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

// Entry point: leads start at their review queue. Specialists see their own
// replies here until the feedback view (P7) replaces this list.
export default async function HomePage({ searchParams }: PageProps<"/">) {
  const viewer = await getViewer();
  const { signin } = await searchParams;

  if (!viewer) {
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

  if (viewer.role === "lead") redirect("/review");

  const [brands, replies] = await Promise.all([listBrands(), listReplies()]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="text-xl font-semibold tracking-tight">{viewer.fullName}</h1>
      <p className="mt-1 text-muted">Specialist · {brands.map((brand) => brand.name).join(", ")}</p>

      <h2 className="mt-8 border-b border-rule pb-2 text-lg font-semibold">
        Your replies <span className="text-sm font-normal text-muted">({replies.length})</span>
      </h2>
      {replies.length === 0 ? (
        <p className="mt-4 text-muted">You have no replies yet. They appear here once they are imported from the helpdesk.</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="table table-sm">
            <thead>
              <tr className="text-muted">
                <th>Sent</th>
                <th>Brand</th>
                <th className="text-right">Score</th>
              </tr>
            </thead>
            <tbody>
              {replies.map((reply) => (
                <tr key={reply.id} className="border-rule">
                  <td className="tabular-nums">{dateFormat.format(new Date(reply.sent_at))}</td>
                  <td>{reply.brand.name}</td>
                  <td className="text-right tabular-nums">
                    {reply.review ? `${reply.review.score} / 4` : <span className="text-muted">Not reviewed yet</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
