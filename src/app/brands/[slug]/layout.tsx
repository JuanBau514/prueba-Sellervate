import { notFound } from "next/navigation";

import { getBrandBySlug } from "@/lib/data/brand-overview";

// RLS returns the brand only to its members; the parent layout already
// requires a lead. Checked here, before streaming, so the 404 status is real.
export default async function BrandLayout({ children, params }: LayoutProps<"/brands/[slug]">) {
  const { slug } = await params;
  if (!(await getBrandBySlug(slug))) notFound();
  return children;
}
