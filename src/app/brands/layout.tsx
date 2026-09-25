import { notFound } from "next/navigation";

import { getViewer } from "@/lib/data/viewer";

// Runs before loading.tsx streams, so non-leads get a real 404 status.
export default async function BrandsLayout({ children }: LayoutProps<"/brands">) {
  const viewer = await getViewer();
  if (!viewer || viewer.role !== "lead") notFound();
  return children;
}
