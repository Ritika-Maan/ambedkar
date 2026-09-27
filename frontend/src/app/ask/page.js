"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

const API_BASE = "http://localhost:8000";

export default function AskPage() {
  const [question, setQuestion] = useState("");
  const [mode, setMode] = useState("student");
  const [lang, setLang] = useState("en");
  const [corpus, setCorpus] = useState("both");
  const [history, setHistory] = useState([]); // [{role, content}]
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const searchParams = useSearchParams();
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const q = searchParams.get("q");
    if (q) setQuestion(q);
}, [searchParams]);

async function handleAsk(e) {
  e.preventDefault();
  if (!question.trim()) return;
  setLoading(true);
  setError(null);
  setSlow(false);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // hard timeout
  const slowTimer = setTimeout(() => setSlow(true), 6000); // "still working" flag

  try {
    const res = await fetch(`${API_BASE}/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, mode, lang, corpus, history }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`Server returned ${res.status}`);
    const data = await res.json();
    setResult(data);
    setHistory([
      ...history,
      { role: "user", content: question },
      { role: "assistant", content: data.answer },
    ]);
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

  return (
    <div style={{ maxWidth: 700, margin: "0 auto" }}>
      <h1>Ask Ambedkar</h1>

      <form onSubmit={handleAsk} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a question about Dr. Ambedkar's writings and speeches..."
          rows={3}
          style={{ padding: "0.75rem", fontSize: "1rem" }}
        />

        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <label>
            Mode:{" "}
            <select value={mode} onChange={(e) => setMode(e.target.value)}>
              <option value="student">Student</option>
              <option value="scholar">Scholar</option>
              <option value="constitutional">Constitutional</option>
            </select>
          </label>

          <label>
            Language:{" "}
            <select value={lang} onChange={(e) => setLang(e.target.value)}>
              <option value="en">English</option>
              <option value="hi">Hindi</option>
              <option value="mr">Marathi</option>
              <option value="ta">Tamil</option>
            </select>
          </label>

          <label>
            Corpus:{" "}
            <select value={corpus} onChange={(e) => setCorpus(e.target.value)}>
              <option value="both">Both</option>
              <option value="debates">Debates</option>
              <option value="writings">Writings</option>
            </select>
          </label>
        </div>

        <button type="submit" disabled={loading} style={{ padding: "0.6rem", fontWeight: 600 }}>
          {loading ? (slow ? "Still thinking... (archive is slow right now)" : "Thinking...") : "Ask"}
        </button>
      </form>

      {error && (
        <p style={{ color: "#b00020", marginTop: "1rem" }}>
          {error}
        </p>
      )}

      {result && (
        <div style={{ marginTop: "2rem" }}>
          <h3>Answer ({result.mode}, {result.lang})</h3>
          <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{result.answer}</p>

          <h4>Sources</h4>
          <ul>
            {result.sources.map((s, i) => (
              <li key={i} style={{ marginBottom: "0.5rem" }}>
                <strong>{s.title}</strong>
                {s.date ? ` — ${s.date}` : ""}
                {s.volume ? ` — Vol. ${s.volume}` : ""}
                {s.section != null ? `, section ${s.section + 1}` : ""}
                {" "}
                <span style={{ fontSize: "0.85em", color: "#666" }}>
                  ({s.type}, relevance: {s.relevance})
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}