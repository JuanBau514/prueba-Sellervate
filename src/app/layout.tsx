import type { Metadata } from "next";
import Link from "next/link";

import { getViewer } from "@/lib/data/viewer";
import { UserSwitcher } from "./user-switcher";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sellervate · Quality review",
  description: "Brand-specific feedback for customer support specialists.",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const viewer = await getViewer();
  return (
    <html lang="en">
      <body>
        <header className="border-b border-neutral-200">
          <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-6 py-3">
            <nav className="flex items-center gap-4" aria-label="Main">
              <Link href="/" className="font-semibold">
                Sellervate
              </Link>
              {viewer?.role === "lead" && (
                <Link href="/review" className="text-sm link link-hover">
                  Review queue
                </Link>
              )}
            </nav>
            <UserSwitcher viewer={viewer} />
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
