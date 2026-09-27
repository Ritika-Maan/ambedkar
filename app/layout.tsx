import Link from "next/link";
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header
          style={{ borderBottom: "1px solid var(--rule)", background: "var(--paper-raised)" }}
          className="px-6 py-4 flex items-center justify-between"
        >
          <span className="text-xl font-semibold" style={{ color: "var(--indigo-deep)" }}>
            The Ambedkar Archive
          </span>
          <nav className="flex gap-6 text-sm" style={{ color: "var(--ink)" }}>
            <Link href="/ask">Ask</Link>
            <Link href="/debates">Debates</Link>
            <Link href="/graph">Graph</Link>
            <Link href="/kiosk-settings">Kiosk</Link>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
