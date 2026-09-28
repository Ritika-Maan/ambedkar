import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "Ask Ambedkar",
  description: "Digital Heritage Archive — Dr. B.R. Ambedkar",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif" }}>
        <nav style={{ display: "flex", gap: "1.5rem", padding: "1rem 2rem", borderBottom: "1px solid #ddd" }}>
          <Link href="/ask" style={{ fontWeight: 600 }}>Ask</Link>
          <Link href="/debates">Debates Explorer</Link>
          <Link href="/graph">Knowledge Graph</Link>
          <Link href="/kiosk-settings">Kiosk Settings</Link>
        </nav>
        <main style={{ padding: "2rem" }}>{children}</main>
      </body>
    </html>
  );
}