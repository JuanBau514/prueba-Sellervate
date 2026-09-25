import Link from "next/link";
import { notFound } from "next/navigation";

import { EmptyState } from "@/components/empty-state";
import { listBrands } from "@/lib/data/brands";
import { listBrandSummary } from "@/lib/data/feedback";
import { getViewer } from "@/lib/data/viewer";

// The brands a lead can show evidence for. RLS returns only assigned brands.
export default async function BrandsPage() {
  const viewer = await getViewer();
  if (!viewer || viewer.role !== "lead") notFound();

  const [brands, summary] = await Promise.all([listBrands(), listBrandSummary()]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="text-xl font-semibold tracking-tight">Brands</h1>
      <p className="mt-1 max-w-prose text-muted">
        The evidence you can show each brand: weekly trend, critical issues, recurring patterns and coverage.
      </p>
      {brands.length === 0 ? (
        <div className="mt-8">
          <EmptyState title="You are not leading any brand yet" action={{ href: "/review", label: "Go to the review queue" }}>
            Brand evidence appears here for each brand you lead.
          </EmptyState>
        </div>
      ) : (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {brands.map((brand) => {
            const rows = summary.filter((row) => row.brand_id === brand.id);
            const reviews = rows.reduce((sum, row) => sum + row.reviews, 0);
            const average = reviews ? rows.reduce((sum, row) => sum + row.average_score * row.reviews, 0) / reviews : null;
            return (
              <li key={brand.id}>
                <Link
                  href={`/brands/${brand.slug}`}
                  className="block rounded-box border border-rule bg-sheet px-5 py-4 transition-colors hover:border-primary"
                >
                  <span className="text-base font-semibold">{brand.name}</span>
                  <span className="mt-1 block text-sm text-muted">
                    {average === null ? "No reviews yet" : `${average.toFixed(1)} average · n = ${reviews} (all time)`}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
