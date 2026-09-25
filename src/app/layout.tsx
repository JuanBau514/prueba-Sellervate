import type { Metadata } from "next";

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
            <span className="font-semibold">Sellervate</span>
            <UserSwitcher viewer={viewer} />
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
