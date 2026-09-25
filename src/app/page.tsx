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
      <main className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="text-3xl font-semibold tracking-tight">Quality review, grounded in each brand.</h1>
        <p className="mt-4 text-lg">Choose a demo person above to sign in and see what they are allowed to see.</p>
        {signin === "failed" && (
          <p role="alert" className="mt-4 text-sm text-red-700">
            Sign-in failed. Run <code>npm run seed</code> and check <code>DEMO_PASSWORD</code> in <code>.env.local</code>.
          </p>
        )}
      </main>
    );
  }

  if (viewer.role === "lead") redirect("/review");

  const [brands, replies] = await Promise.all([listBrands(), listReplies()]);

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">{viewer.fullName}</h1>
      <p className="mt-1 text-neutral-600">
        Specialist · {brands.map((brand) => brand.name).join(", ")}
      </p>

      <h2 className="mt-8 text-lg font-semibold">
        Your replies{" "}
        <span className="font-normal text-neutral-500">({replies.length})</span>
      </h2>
      {replies.length === 0 ? (
        <p className="mt-3 text-neutral-600">You have no replies yet. They appear here once they are imported from the helpdesk.</p>
      ) : (
        <table className="table table-sm mt-3">
          <thead>
            <tr>
              <th>Sent</th>
              <th>Brand</th>
              <th>Specialist</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            {replies.map((reply) => (
              <tr key={reply.id}>
                <td>{dateFormat.format(new Date(reply.sent_at))}</td>
                <td>{reply.brand.name}</td>
                <td>{reply.specialist.full_name}</td>
                <td>{reply.review ? `${reply.review.score}/4` : <span className="text-neutral-500">Not reviewed</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
