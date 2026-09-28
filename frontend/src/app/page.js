"use client";
import { useState, useEffect, useMemo, useRef } from "react";

const API_BASE = "http://localhost:8000";
const ROTATE_MS = 6000;
const USE_MOCK = true; // flip to false once GROQ_API_KEY is set and backend is confirmed live

const MOCK_EVENTS = [
  { id: "I01", label: "Introduction of Draft Constitution", date: "1948-11-04", volume: "VII",
    summary: "Ambedkar presented the Draft Constitution and explained the work and responsibility of the Drafting Committee." },
  { id: "I09", label: "Directive Principles", date: "1948-11-19", volume: "VII",
    summary: "Debate on the nature and enforceability of the Directive Principles of State Policy." },
  { id: "I25", label: "Reserved Constituencies", date: "1947-08-27", volume: "V",
    summary: "Discussion on reservation of seats for Scheduled Castes and Scheduled Tribes in the legislature." },
  { id: "I60", label: "Emergency Powers", date: "1949-08-02", volume: "IX",
    summary: "Debate on the scope of Article 352 and the conditions under which a national emergency may be proclaimed." },
  { id: "I74", label: "Article 15", date: "1949-11-25", volume: "XI",
    summary: "Ambedkar's closing speech on the completion of the Constitution and warnings against losing India's independence." },
];

async function mockFetchTimeline() {
  await new Promise((r) => setTimeout(r, 300));
  const dates = [...new Set(MOCK_EVENTS.map((e) => e.date))].sort();
  return { dates, events: [...MOCK_EVENTS].sort((a, b) => a.date.localeCompare(b.date)) };
}
async function fetchTimeline() {
  if (USE_MOCK) return mockFetchTimeline();
  const res = await fetch(`${API_BASE}/timeline`);
  if (!res.ok) throw new Error(`Server returned ${res.status}`);
  return res.json();
}

function monthDay(d) { return d.slice(5); }
function formatDate(d) {
  return new Date(d + "T00:00:00").toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

const SECTIONS = [
  { href: "/ask", title: "Ask Ambedkar", desc: "Ask a question and get an answer grounded in the debates and writings." },
  { href: "/debates", title: "Debates Explorer", desc: "Search the Constituent Assembly debates by date, volume, or topic." },
  { href: "/graph", title: "Knowledge Graph", desc: "Explore people, themes, and interventions as a connected graph." },
  { href: "/kiosk-settings", title: "Kiosk Settings", desc: "Fullscreen mode and accessibility options for this display." },
];

const CSS = `
.home { --bg:#f7f5ef; --panel:#ffffff; --ink:#1a1a1a; --dim:#55524a; --line:#cfc9b8; --accent:#1d4e89; --accentInk:#ffffff;
  background: var(--bg); color: var(--ink); font-family: -apple-system, Segoe UI, Roboto, sans-serif;
  max-width: 1000px; margin: 0 auto; padding: 2.5rem 1.5rem 3rem; }
.home-hero { text-align: center; margin-bottom: 2rem; }
.home-hero h1 { margin: 0 0 .5rem; font-size: 2.1em; }
.home-hero p { margin: 0 auto; color: var(--dim); font-size: 1.05em; max-width: 46rem; }

.otd { background: var(--panel); border: 2px solid var(--line); border-radius: 16px; padding: 1.25rem 1.5rem;
  max-width: 640px; margin: 0 auto 2.5rem; }
.otd-eyebrow { font-size: .8em; text-transform: uppercase; letter-spacing: .06em; color: var(--dim); margin: 0 0 .35rem; }
.otd-date { font-size: 1.05em; font-weight: 700; margin: 0 0 .6rem; }
.otd-label { font-size: 1.15em; font-weight: 600; margin: 0 0 .4rem; }
.otd-summary { margin: 0 0 .85rem; line-height: 1.5; color: var(--dim); }
.otd-meta { font-size: .82em; color: var(--dim); margin: 0 0 .85rem; }
.otd-dots { display: flex; gap: .4rem; margin-top: .75rem; }
.otd-dot { width: .55rem; height: .55rem; border-radius: 50%; background: var(--line); border: 0; padding: 0; cursor: pointer; }
.otd-dot[aria-current="true"] { background: var(--accent); }
.otd-link { display: inline-block; min-height: 44px; padding: 0 1rem; line-height: 44px; border-radius: 10px;
  border: 2px solid var(--accent); background: var(--accent); color: var(--accentInk); text-decoration: none; font-weight: 600; }
.otd-state { color: var(--dim); font-size: .9em; }
.otd-mockbadge { font-size: .72em; color: #8a6d00; background: #fff3cd; border: 1px solid #e0c264; border-radius: 6px; padding: .1rem .5rem; margin-left: .5rem; }

.home-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; }
.home-card { display: block; min-height: 120px; padding: 1.25rem 1.4rem; border: 2px solid var(--line); border-radius: 16px;
  background: var(--panel); color: var(--ink); text-decoration: none; transition: border-color .15s; }
.home-card:hover, .home-card:focus-visible { border-color: var(--accent); }
.home-card h2 { margin: 0 0 .4rem; font-size: 1.1em; }
.home-card p { margin: 0; color: var(--dim); font-size: .92em; line-height: 1.4; }
`;

function OnThisDay() {
  const [state, setState] = useState({ loading: true, error: null, events: [] });
  const [index, setIndex] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    fetchTimeline()
      .then((d) => { if (!cancelled) setState({ loading: false, error: null, events: d.events || [] }); })
      .catch((e) => { if (!cancelled) setState({ loading: false, error: e.message, events: [] }); });
    return () => { cancelled = true; };
  }, []);

  const todayMatches = useMemo(() => {
    if (!state.events.length) return [];
    const today = monthDay(new Date().toISOString().slice(0, 10));
    return state.events.filter((e) => monthDay(e.date) === today);
  }, [state.events]);

  const usingFallback = todayMatches.length === 0;
  const pool = usingFallback ? state.events : todayMatches;

  useEffect(() => {
    if (pool.length < 2) return;
    timerRef.current = setInterval(() => setIndex((i) => (i + 1) % pool.length), ROTATE_MS);
    return () => clearInterval(timerRef.current);
  }, [pool.length]);

  if (state.loading) return <div className="otd"><p className="otd-state">Loading today in the archive…</p></div>;
  if (state.error) return <div className="otd"><p className="otd-state">Couldn't load the timeline. ({state.error})</p></div>;
  if (pool.length === 0) return <div className="otd"><p className="otd-state">No debate entries are in the archive yet.</p></div>;

  const event = pool[Math.min(index, pool.length - 1)];
  return (
    <div className="otd">
      <p className="otd-eyebrow">
        {usingFallback ? "From the archive" : "On this day"}
        {USE_MOCK && <span className="otd-mockbadge">preview data</span>}
      </p>
      <p className="otd-date">{formatDate(event.date)}</p>
      <p className="otd-label">{event.label || event.title}</p>
      <p className="otd-summary">{event.summary || event.description}</p>
      <p className="otd-meta">Volume {event.volume}</p>
      <a className="otd-link" href={`/debates?date=${event.date}&volume=${event.volume}`}>Read this debate</a>
      {pool.length > 1 && (
        <div className="otd-dots" role="tablist" aria-label="More entries">
          {pool.map((e, i) => (
            <button key={e.id || i} type="button" className="otd-dot" aria-current={i === index}
              aria-label={`Show entry ${i + 1} of ${pool.length}`} onClick={() => setIndex(i)} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="home">
      <style>{CSS}</style>
      <div className="home-hero">
        <h1>The Ambedkar Archive</h1>
        <p>Explore Dr. B. R. Ambedkar's Constituent Assembly debates and writings — ask questions, search by date or topic, or browse the connections between people, themes, and ideas.</p>
      </div>
      <OnThisDay />
      <div className="home-grid">
        {SECTIONS.map((s) => (
          <a key={s.href} className="home-card" href={s.href}>
            <h2>{s.title}</h2>
            <p>{s.desc}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
