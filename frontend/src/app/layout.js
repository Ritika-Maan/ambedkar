import "./globals.css";

export const metadata = {
  title: "Ask Ambedkar",
  description: "Digital Heritage Archive — Dr. B.R. Ambedkar",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif" }}>
        <nav style={{ display: "flex", gap: "1.5rem", padding: "1rem 2rem", borderBottom: "1px solid #ddd" }}>
          <a href="/ask" style={{ fontWeight: 600 }}>Ask</a>
          <a href="/debates">Debates Explorer</a>
          <a href="/graph">Knowledge Graph</a>
          <a href="/kiosk-settings">Kiosk Settings</a>
        </nav>
        <main style={{ padding: "2rem" }}>{children}</main>
      </body>
    </html>
  );
}