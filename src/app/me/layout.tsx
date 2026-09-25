import { redirect } from "next/navigation";

import { getViewer } from "@/lib/data/viewer";

// Access checks live in the segment layout so they run before loading.tsx starts
// streaming; otherwise redirects and 404s would be sent with a 200 status.
export default async function MeLayout({ children }: LayoutProps<"/me">) {
  const viewer = await getViewer();
  if (!viewer) redirect("/");
  if (viewer.role === "lead") redirect("/review");
  return children;
}
