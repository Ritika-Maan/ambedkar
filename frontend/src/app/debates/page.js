"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE = "http://localhost:8000";

export default function DebatesPage() {
  const [date, setDate] = useState("");
  const [volume, setVolume] = useState("");
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);
  const router = useRouter();
  const [slow, setSlow] = useState(false);

async function handleSearch(e) {
  e.preventDefault();
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
    if (topic) params.set("topic", topic);
    const res = await fetch(`${API_BASE}/debates-search?${params.toString()}`, {
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`Server returned ${res.status}`);
    const data = await res.json();
    setResults(data.results);
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
}

  function askAboutThis(title) {
    router.push(`/ask?q=${encodeURIComponent(`Tell me about ${title}`)}`);
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
            style={{ padding: "0.4rem" }}
          />
        </label>
        <label>
          Volume:{" "}
          <input
            type="text"
            placeholder="e.g. VII"
            value={volume}
            onChange={(e) => setVolume(e.target.value)}
            style={{ padding: "0.4rem" }}
          />
        </label>
        <label>
          Topic:{" "}
          <input
            type="text"
            placeholder="e.g. fundamental rights"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            style={{ padding: "0.4rem" }}
          />
        </label>
        <button type="submit" disabled={loading} style={{ padding: "0.5rem 1rem", fontWeight: 600 }}>
          {loading ? (slow ? "Still searching... (archive is slow right now)" : "Searching...") : "Search"}
        </button>
      </form>

      {error && <p style={{ color: "#b00020" }}>{error}</p>}

      {results && results.length === 0 && <p>No matching debates found.</p>}

      {results && results.length > 0 && (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {results.map((r) => (
            <li key={r.id} style={{ border: "1px solid #ddd", padding: "1rem", marginBottom: "1rem" }}>
              <strong>{r.title || "Untitled"}</strong>
              <p style={{ fontSize: "0.85em", color: "#666" }}>
                {r.date} {r.volume ? `— Vol. ${r.volume}` : ""}
              </p>
              <p>{r.snippet}</p>
              <button onClick={() => askAboutThis(r.title)} style={{ marginTop: "0.5rem" }}>
                Ask Ambedkar about this →
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}