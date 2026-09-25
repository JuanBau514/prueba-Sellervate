import { notFound, redirect } from "next/navigation";

import { getViewer } from "@/lib/data/viewer";
import { getReviewContext } from "@/lib/data/workspace";

// Checked before loading.tsx streams: a hidden or missing reply returns a real
// 404 (never a 403 that would confirm it exists).
export default async function ReviewReplyLayout({ children, params }: LayoutProps<"/review/[replyId]">) {
  const viewer = await getViewer();
  if (!viewer || viewer.role !== "lead") redirect("/review");
  const { replyId } = await params;
  if (!(await getReviewContext(replyId))) notFound();
  return children;
}
