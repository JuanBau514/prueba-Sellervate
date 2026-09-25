import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sellervate · Quality review",
  description: "Brand-specific feedback for customer support specialists.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
