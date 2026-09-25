import type { Metadata } from "next";
import { Literata, Public_Sans } from "next/font/google";
import Link from "next/link";

import { getViewer } from "@/lib/data/viewer";
import { UserSwitcher } from "./user-switcher";
import "./globals.css";

// Sans for the interface; a reading serif for what someone actually wrote.
const publicSans = Public_Sans({ subsets: ["latin"], variable: "--font-public-sans", display: "swap" });
const literata = Literata({ subsets: ["latin"], variable: "--font-literata", display: "swap" });

export const metadata: Metadata = {
  title: "Sellervate · Quality review",
  description: "Brand-specific feedback for customer support specialists.",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const viewer = await getViewer();
  return (
    <html lang="en" data-theme="sellervate" className={`${publicSans.variable} ${literata.variable}`}>
      <body className="min-h-screen antialiased">
        <a
          href="#content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-field focus:bg-sheet focus:px-3 focus:py-2 focus:shadow"
        >
          Skip to content
        </a>
        <header className="border-b border-rule bg-sheet">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-3 sm:px-6">
            <nav className="flex items-center gap-5" aria-label="Main">
              <Link href="/" className="text-base font-semibold tracking-tight">
                Sellervate <span className="font-normal text-muted">Quality</span>
              </Link>
              {viewer && (
                <Link
                  href={viewer.role === "lead" ? "/review" : "/me"}
                  className="text-sm text-muted hover:text-base-content"
                >
                  {viewer.role === "lead" ? "Review queue" : "Your feedback"}
                </Link>
              )}
              {viewer?.role === "lead" && (
                <Link href="/brands" className="text-sm text-muted hover:text-base-content">
                  Brands
                </Link>
              )}
            </nav>
            <UserSwitcher viewer={viewer} />
          </div>
        </header>
        <div id="content" tabIndex={-1} className="outline-none">
          {children}
        </div>
      </body>
    </html>
  );
}
