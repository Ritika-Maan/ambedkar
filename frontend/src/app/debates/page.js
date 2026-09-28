"use client";
import { Suspense, useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const API_BASE = "http://localhost:8000";

// Touch-friendly sizing for kiosk/tablet use (Niyati's Phase D QA pass).
const fieldStyle = { padding: "0.6rem", minHeight: 44, fontSize: "1rem" };
const btnStyle = { padding: "0.6rem 1rem", minHeight: 44, fontWeight: 600, cursor: "pointer" };

function DebatesPageInner() {
  const searchParams = useSearchParams();

  // Seed filters from the incoming URL on first load, so links from the
  // graph (?theme=..., ?date=..., ?volume=...) and any direct ?topic=...
  // or ?article=... link land pre-filled. `topic` wins over `theme` when
  // both are present -- `theme` is Shreya's graph param name, `topic` is
  // the Debates Explorer's own name for the same filter.
  const [date, setDate] = useState(() => searchParams.get("date") || "");
  const [volume, setVolume] = useState(() => searchParams.get("volume") || "");
  const [topic, setTopic] = useState(
    () => searchParams.get("topic") || searchParams.get("theme") || ""
  );
  const [article, setArticle] = useState(() => searchParams.get("article") || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);
  const router = useRouter();
  const [slow, setSlow] = useState(false);

const handleSearch = useCallback(async (e) => {
  if (e) e.preventDefault();
  setLoading(true);
  setError(null);
  setSlow(false);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);
  const slowTimer = setTimeout(() => setSlow(true), 6000);

  try {
    const params = new URLSearchParams();
    if (date) params.set("date", date);
    if (volume) params.set("volume", volume);
    // Server only accepts one `topic` value; when an article keyword is also
    // set we filter client-side below instead, so only send topic here if
    // article is empty.
    if (topic && !article) params.set("topic", topic);
    params.set("limit", "200"); // repo currently holds 76 debate records total
    const res = await fetch(`${API_BASE}/debates-search?${params.toString()}`, {
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`Server returned ${res.status}`);
    const data = await res.json();
    let rows = data.results || [];

    if (topic && article) {
      const t = topic.toLowerCase();
      rows = rows.filter(
        (r) => (r.title || "").toLowerCase().includes(t) || (r.snippet || "").toLowerCase().includes(t)
      );
    }

    // Article filtering: the repository has no structured `article` field
    // on debate records -- only a few records happen to mention "Article N"
    // in free text. This is a best-effort keyword match over title/snippet,
    // not a real structured filter, and the UI says so below when it's used.
    if (article) {
      const needle = article.trim().toLowerCase();
      rows = rows.filter(
        (r) => (r.title || "").toLowerCase().includes(needle) || (r.snippet || "").toLowerCase().includes(needle)
      );
    }

    setResults(rows);
  } catch (err) {
    if (err.name === "AbortError") {
      setError("The archive is taking too long to respond. Try again, or check the backend is running.");
    } else {
      setError(err.message || "Something went wrong. Is the backend running on :8000?");
    }
  } finally {
    clearTimeout(timeoutId);
    clearTimeout(slowTimer);
    setSlow(false);
    setLoading(false);
  }
}, [date, volume, topic, article]);

  // Runs once on mount. Since date/volume/topic/article are already seeded
  // from the URL above (if present), this single call both (a) loads
  // everything by default when there's no query string, and (b) auto-runs
  // the search for graph deep links -- no separate effect needed.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional fetch-on-mount
    handleSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleReset() {
    setDate("");
    setVolume("");
    setTopic("");
    setArticle("");
    setError(null);
    setTimeout(() => handleSearch(), 0);
  }

  function askAboutThis(title, date) {
    router.push(`/ask?q=${encodeURIComponent(`Tell me about "${title}" (${date})`)}`);
  }

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <h1>Debates Explorer</h1>

      <form onSubmit={handleSearch} style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "flex-end", marginBottom: "1.5rem" }}>
        <label>
          Date:{" "}
          <input
            type="text"
            placeholder="e.g. 1948-11-04"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={fieldStyle}
          />
        </label>
        <label>
          Volume:{" "}
          <input
            type="text"
            placeholder="e.g. VII"
            value={volume}
            onChange={(e) => setVolume(e.target.value)}
            style={fieldStyle}
          />
        </label>
        <label>
          Topic:{" "}
          <input
            type="text"
            placeholder="e.g. fundamental rights"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            style={fieldStyle}
          />
        </label>
        <label>
          Article keyword:{" "}
          <input
            type="text"
            placeholder="e.g. Article 15"
            value={article}
            onChange={(e) => setArticle(e.target.value)}
            style={fieldStyle}
          />
        </label>
        <button type="submit" disabled={loading} style={btnStyle}>
          {loading ? (slow ? "Still searching... (archive is slow right now)" : "Searching...") : "Search"}
        </button>
        <button type="button" onClick={handleReset} disabled={loading} style={{ ...btnStyle, fontWeight: 400 }}>
          Reset filters
        </button>
      </form>

      {article && (
        <p
          style={{
            fontSize: "0.85em",
            color: "#8a6100",
            background: "#fff8e6",
            border: "1px solid #f0dca0",
            padding: "0.5rem 0.75rem",
            borderRadius: 6,
            maxWidth: 700,
          }}
        >
          Note: this archive does not have structured article numbers on debate records.
          &quot;Article keyword&quot; matches title/summary text only -- it will miss
          interventions that discuss an article without naming it explicitly.
        </p>
      )}

      {loading && <p>Loading debate records…</p>}

      {error && <p style={{ color: "#b00020" }}>{error}</p>}

      {!loading && results && results.length === 0 && (
        <p>No matching debates found. Try clearing one of the filters.</p>
      )}

      {!loading && results && results.length > 0 && (
        <>
          <p style={{ fontSize: "0.85em", color: "#666" }}>
            {results.length} record{results.length === 1 ? "" : "s"} found.
          </p>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {results.map((r) => (
              <li key={r.id} style={{ border: "1px solid #ddd", padding: "1rem", marginBottom: "1rem" }}>
                <strong>{r.title || "Untitled"}</strong>
                <p style={{ fontSize: "0.85em", color: "#666" }}>
                  {r.date} {r.volume ? `— Vol. ${r.volume}` : ""}
                </p>
                <p>{r.snippet}</p>
                <button onClick={() => askAboutThis(r.title, r.date)} style={{ ...btnStyle, marginTop: "0.5rem" }}>
                  Ask Ambedkar about this →
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

// useSearchParams() requires a Suspense boundary in the App Router, or the
// production build fails during prerendering (same issue as /ask). This
// wrapper is the only reason DebatesPageInner isn't the default export.
export default function DebatesPage() {
  return (
    <Suspense fallback={<div style={{ maxWidth: 800, margin: "0 auto" }}>Loading…</div>}>
      <DebatesPageInner />
    </Suspense>
  );
}