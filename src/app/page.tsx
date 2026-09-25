import { listBrands } from "@/lib/data/brands";
import { listReplies } from "@/lib/data/replies";
import { getViewer } from "@/lib/data/viewer";

const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

// P4 placeholder: proves that switching user changes what the server returns.
// The review queue (P5) and workspace (P6) replace this list.
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

  const [brands, replies] = await Promise.all([listBrands(), listReplies()]);

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">{viewer.fullName}</h1>
      <p className="mt-1 text-neutral-600">
        {viewer.role === "lead" ? "Lead" : "Specialist"} · {brands.map((brand) => brand.name).join(", ")}
      </p>

      <h2 className="mt-8 text-lg font-semibold">
        {viewer.role === "lead" ? "Replies in your brands" : "Your replies"}{" "}
        <span className="font-normal text-neutral-500">({replies.length})</span>
      </h2>
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
    </main>
  );
}
