import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gem Crush",
  description: "A match-3 puzzle game",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
