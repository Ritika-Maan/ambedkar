"use client";
/* eslint-disable react-hooks/set-state-in-effect --
   Several effects sync browser-only state (speech support, fullscreen,
   saved display prefs, ?q= deep link) after mount. That is intentional. */
import { Suspense, useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";

const API_BASE = "http://localhost:8000";
const HISTORY_LIMIT = 12; // last 6 exchanges go to the backend (protects Groq limits)
const REQUEST_TIMEOUT_MS = 15000;
const SLOW_AFTER_MS = 6000;

const LANG_TAGS = { en: "en-IN", hi: "hi-IN", mr: "mr-IN", ta: "ta-IN" };

const MODES = [
  { v: "student", l: "Student" },
  { v: "scholar", l: "Scholar" },
  { v: "constitutional", l: "Constitutional" },
];
const LANGS = [
  { v: "en", l: "English", aria: "English" },
  { v: "hi", l: "हिन्दी", aria: "Hindi" },
  { v: "mr", l: "मराठी", aria: "Marathi" },
  { v: "ta", l: "தமிழ்", aria: "Tamil" },
];
const CORPORA = [
  { v: "both", l: "Both" },
  { v: "debates", l: "Debates" },
  { v: "writings", l: "Writings" },
];

// One tap asks. All four are answerable from material already ingested.
const SUGGESTIONS = [
  "What did Ambedkar say about the Directive Principles?",
  "How did Ambedkar explain the origin of caste?",
  "Why is India described as a Union of States?",
  "What safeguards did Ambedkar propose for minorities?",
];

const EMPTY_TITLE = "Ask about Dr. Ambedkar’s writings and speeches";
const EMPTY_HINT = "Type, speak, or tap one of these to begin.";

const THEMES = {
  light: {
    "--bg": "#f7f5ef", "--panel": "#ffffff", "--ink": "#1a1a1a", "--dim": "#55524a",
    "--line": "#cfc9b8", "--accent": "#1d4e89", "--accentInk": "#ffffff",
    "--userBg": "#1d4e89", "--userInk": "#ffffff", "--botBg": "#ffffff",
    "--chipBg": "#eef2f8", "--danger": "#b00020", "--focus": "#1d4e89",
  },
  contrast: {
    "--bg": "#000000", "--panel": "#000000", "--ink": "#ffffff", "--dim": "#e6e6e6",
    "--line": "#ffffff", "--accent": "#ffd400", "--accentInk": "#000000",
    "--userBg": "#ffd400", "--userInk": "#000000", "--botBg": "#000000",
    "--chipBg": "#000000", "--danger": "#ff8a80", "--focus": "#ffd400",
  },
};

const CSS = `
body.ask-contrast { background: #000 !important; }
.ask-root { background: var(--bg); color: var(--ink); font-size: 18px; line-height: 1.55;
  max-width: 960px; margin: 0 auto; padding: 0 1rem; display: flex; flex-direction: column; min-height: 80vh; }
.ask-root.large { font-size: 22px; }
.ask-root *, .ask-root *::before, .ask-root *::after { box-sizing: border-box; }
.ask-root :focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }

.ask-top { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: .75rem; padding: 1rem 0 .5rem; }
.ask-top h1 { margin: 0; font-size: 1.6em; }
.ask-tools { display: flex; flex-wrap: wrap; gap: .5rem; }

.ask-btn { min-height: 56px; padding: 0 1.25rem; border-radius: 12px; border: 2px solid var(--accent);
  background: var(--accent); color: var(--accentInk); font: inherit; font-weight: 600; cursor: pointer; }
.ask-btn.ghost { background: transparent; color: var(--ink); border-color: var(--line); }
.ask-btn.ghost[aria-pressed="true"] { border-color: var(--accent); box-shadow: inset 0 0 0 2px var(--accent); }
.ask-btn.small { min-height: 48px; font-size: .9em; padding: 0 1rem; }
.ask-btn:disabled { opacity: .55; cursor: not-allowed; }

.ask-options { display: flex; flex-wrap: wrap; gap: .75rem 1.5rem; padding: .5rem 0 1rem; border-bottom: 2px solid var(--line); }
.ask-seg-wrap { display: flex; flex-direction: column; gap: .25rem; }
.ask-seg-label { font-size: .8em; color: var(--dim); text-transform: uppercase; letter-spacing: .04em; }
.ask-seg { display: inline-flex; border: 2px solid var(--line); border-radius: 12px; overflow: hidden; }
.ask-seg-btn { min-height: 48px; min-width: 48px; padding: 0 1rem; border: 0; background: transparent; color: var(--ink);
  font: inherit; cursor: pointer; border-right: 2px solid var(--line); }
.ask-seg-btn:last-child { border-right: 0; }
.ask-seg-btn[aria-pressed="true"] { background: var(--accent); color: var(--accentInk); font-weight: 600; }

.ask-thread { flex: 1; display: flex; flex-direction: column; gap: 1rem; padding: 1rem 0; }
.ask-msg { max-width: 88%; padding: .85rem 1rem; border-radius: 16px; border: 2px solid var(--line); }
.ask-user { align-self: flex-end; background: var(--userBg); color: var(--userInk); border-color: var(--userBg); border-bottom-right-radius: 4px; }
.ask-bot { align-self: flex-start; background: var(--botBg); border-bottom-left-radius: 4px; }
.ask-answer { white-space: pre-wrap; margin: 0; }
.ask-meta { font-size: .78em; color: var(--dim); margin-bottom: .35rem; display: flex; gap: .5rem; align-items: center; }
.ask-badge { border: 1px solid var(--line); border-radius: 6px; padding: 0 .4rem; }
.ask-actions { margin-top: .75rem; display: flex; flex-wrap: wrap; gap: .5rem; align-items: center; }

.ask-chips { display: flex; flex-wrap: wrap; gap: .5rem; margin-top: .75rem; }
.ask-chip { min-height: 48px; max-width: 100%; padding: .3rem .85rem; border-radius: 999px; border: 2px solid var(--line);
  background: var(--chipBg); color: var(--ink); font: inherit; font-size: .88em; display: inline-flex; gap: .5rem; align-items: center; cursor: pointer; }
.ask-chip[aria-expanded="true"] { background: var(--accent); color: var(--accentInk); border-color: var(--accent); }
.ask-chip-n { font-weight: 700; }
.ask-chip-t { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 16rem; }

.ask-src { margin-top: .6rem; padding: .85rem 1rem; border: 2px solid var(--accent); border-radius: 12px; background: var(--panel); }
.ask-src-head { display: flex; flex-wrap: wrap; gap: .25rem .75rem; align-items: baseline; }
.ask-src-sub { font-size: .8em; color: var(--dim); }
.ask-src-kind { font-size: .78em; color: var(--dim); text-transform: uppercase; letter-spacing: .04em; margin-top: .6rem; }
.ask-src-text { margin: .25rem 0 .75rem; padding-left: .75rem; border-left: 4px solid var(--line); max-height: 12rem; overflow-y: auto; white-space: pre-wrap; }

.ask-empty { text-align: center; padding: 2rem 0 1rem; }
.ask-empty h2 { margin: 0 0 .25rem; font-size: 1.3em; }
.ask-empty p { margin: 0 0 1rem; color: var(--dim); }
.ask-suggest-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: .75rem; text-align: left; }
.ask-suggest { min-height: 72px; padding: .75rem 1rem; border: 2px solid var(--line); border-radius: 14px; background: var(--panel);
  color: var(--ink); font: inherit; text-align: left; cursor: pointer; }

.ask-dots span { display: inline-block; width: .6em; height: .6em; margin-right: .3em; border-radius: 50%; background: var(--ink); animation: askdot 1.2s infinite; }
.ask-dots span:nth-child(2) { animation-delay: .2s; }
.ask-dots span:nth-child(3) { animation-delay: .4s; }
@keyframes askdot { 0%, 80%, 100% { opacity: .25; } 40% { opacity: 1; } }
@media (prefers-reduced-motion: reduce) { .ask-dots span { animation: none; opacity: .7; } }

.ask-error { border: 2px solid var(--danger); color: var(--danger); border-radius: 12px; padding: .75rem 1rem; margin: 0 0 .75rem; }
.ask-note { font-size: .85em; color: var(--dim); margin: 0 0 .5rem; }

.ask-composer { position: sticky; bottom: 0; z-index: 5; background: var(--bg); border-top: 2px solid var(--line); padding: .75rem 0 1rem; }
.ask-input { width: 100%; min-height: 88px; padding: .8rem 1rem; font: inherit; border-radius: 12px; border: 2px solid var(--line);
  background: var(--panel); color: var(--ink); resize: vertical; }
.ask-composer-row { display: flex; gap: .75rem; margin-top: .6rem; }
.ask-composer-row .ask-btn.grow { flex: 1; }

@media (max-width: 640px) {
  .ask-msg { max-width: 96%; }
  .ask-chip-t { max-width: 10rem; }
}
`;

function Segmented({ label, options, value, onChange }) {
  return (
    <div className="ask-seg-wrap">
      <span className="ask-seg-label">{label}</span>
      <div className="ask-seg" role="group" aria-label={label}>
        {options.map((o) => (
          <button
            key={o.v}
            type="button"
            className="ask-seg-btn"
            aria-pressed={value === o.v}
            aria-label={o.aria || undefined}
            onClick={() => onChange(o.v)}
          >
            {o.l}
          </button>
        ))}
      </div>
    </div>
  );
}

function isDebate(s) {
  return String(s.type || "").toLowerCase().startsWith("debate");
}

function sourceMeta(s) {
  const parts = [];
  if (s.date) parts.push(s.date);
  if (s.volume) parts.push(`Vol. ${s.volume}`);
  if (s.section != null && !Number.isNaN(Number(s.section))) parts.push(`section ${Number(s.section) + 1}`);
  return parts.join(" · ");
}

function SourcePanel({ s, onClose }) {
  const debate = isDebate(s);
  return (
    <div className="ask-src" role="region" aria-label="Source detail">
      <div className="ask-src-head">
        <strong>{s.title || "Source"}</strong>
        <span className="ask-src-sub">{sourceMeta(s)}</span>
      </div>
      <div className="ask-src-sub">
        {debate ? "Constituent Assembly Debates" : "Collected Works of Dr. Ambedkar"}
        {s.relevance != null ? ` · relevance ${String(s.relevance)}` : ""}
      </div>
      {s.snippet ? (
        <>
          {/* Debate records are summaries of the intervention, not verbatim speech. */}
          <div className="ask-src-kind">{debate ? "Summary of this intervention" : "Excerpt from the text"}</div>
          <p className="ask-src-text">{s.snippet}</p>
        </>
      ) : (
        <p className="ask-note" style={{ marginTop: ".6rem" }}>No excerpt is available for this source.</p>
      )}
      <button type="button" className="ask-btn ghost small" onClick={onClose}>Close</button>
    </div>
  );
}

function AskPageInner() {
  const searchParams = useSearchParams();

  const [question, setQuestion] = useState("");
  const [prefilled, setPrefilled] = useState(false);
  const [mode, setMode] = useState("student");
  const [lang, setLang] = useState("en");
  const [corpus, setCorpus] = useState("both");

  const [history, setHistory] = useState([]); // [{role, content}] sent to the backend
  const [turns, setTurns] = useState([]); // rendered thread: {id, question, answer, sources, mode, lang, cached}
  const [pending, setPending] = useState(null); // question currently in flight
  const [loading, setLoading] = useState(false);
  const [slow, setSlow] = useState(false);
  const [error, setError] = useState(null);

  const [openSrc, setOpenSrc] = useState(null); // {turnId, index}

  const [speakingId, setSpeakingId] = useState(null);
  const [voiceMissing, setVoiceMissing] = useState(false);
  const [listening, setListening] = useState(false);
  const [micSupported, setMicSupported] = useState(false);
  const [micError, setMicError] = useState(null);
  const recognitionRef = useRef(null);
  const endRef = useRef(null);

  const [contrast, setContrast] = useState(false);
  const [large, setLarge] = useState(false);
  const [fsSupported, setFsSupported] = useState(false);
  const [isFs, setIsFs] = useState(false);

  // ?q= deep link (graph node, debates citation, ...) only pre-fills; the user taps Ask.
  useEffect(() => {
    const q = searchParams.get("q");
    if (q) {
      setQuestion(q);
      setPrefilled(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const warm = () => window.speechSynthesis.getVoices();
    warm();
    window.speechSynthesis.addEventListener("voiceschanged", warm);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", warm);
  }, []);

  useEffect(() => {
    setMicSupported(!!(window.SpeechRecognition || window.webkitSpeechRecognition));
    setFsSupported(!!document.fullscreenEnabled);
    const onFs = () => setIsFs(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    try {
      setContrast(localStorage.getItem("ask.contrast") === "1");
      setLarge(localStorage.getItem("ask.large") === "1");
    } catch {}
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  // Black page background when high contrast is on, so there are no white margins.
  useEffect(() => {
    document.body.classList.toggle("ask-contrast", contrast);
    return () => document.body.classList.remove("ask-contrast");
  }, [contrast]);

  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    endRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "end" });
  }, [turns.length, pending]);

  function setPref(key, value, setter) {
    setter(value);
    try { localStorage.setItem(key, value ? "1" : "0"); } catch {}
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.();
    }
  }

  function stopSpeaking() {
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    setSpeakingId(null);
  }

  async function send(text) {
    const q = (text ?? question).trim();
    if (!q || loading) return;

    setLoading(true);
    setError(null);
    setSlow(false);
    setMicError(null);
    setPrefilled(false);
    setOpenSrc(null);
    setVoiceMissing(false);
    stopSpeaking();
    recognitionRef.current?.stop();
    setPending(q);
    setQuestion("");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    const slowTimer = setTimeout(() => setSlow(true), SLOW_AFTER_MS);

    try {
      const res = await fetch(`${API_BASE}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, mode, lang, corpus, history: history.slice(-HISTORY_LIMIT) }),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data = await res.json();
      const answer = data.answer || "";
      setTurns((t) => [
        ...t,
        {
          id: Date.now(),
          question: q,
          answer,
          sources: Array.isArray(data.sources) ? data.sources : [],
          mode: data.mode || mode,
          lang: data.lang || lang,
          cached: !!data.cached,
        },
      ]);
      setHistory((h) => [...h, { role: "user", content: q }, { role: "assistant", content: answer }]);
    } catch (err) {
      setQuestion(q); // nothing is lost: the question goes back in the box
      if (err.name === "AbortError") {
        setError("The archive is taking too long to respond. Try again, or check the backend is running.");
      } else if (
        err.message === "Failed to fetch" ||
        err.message === "Load failed" ||
        (err.message && err.message.includes("NetworkError")) ||
        (err.message && err.message.includes("network connection was lost")) ||
        (err.message && err.message.toLowerCase().includes("load failed"))
      ) {
        setError("Cannot reach the backend at http://localhost:8000. Is it running? (Check that GROQ_API_KEY is set in .env)");
      } else {
        setError(err.message || "Something went wrong. Is the backend running on :8000?");
      }
    } finally {
      clearTimeout(timeoutId);
      clearTimeout(slowTimer);
      setSlow(false);
      setPending(null);
      setLoading(false);
    }
  }

  function resetConversation() {
    recognitionRef.current?.stop();
    stopSpeaking();
    setVoiceMissing(false);
    setMicError(null);
    setHistory([]);
    setTurns([]);
    setPending(null);
    setOpenSrc(null);
    setError(null);
    setPrefilled(false);
    setQuestion("");
  }

  function speakTurn(turn) {
    if (!turn.answer || typeof window === "undefined" || !window.speechSynthesis) return;
    const synth = window.speechSynthesis;

    if (speakingId === turn.id) {
      stopSpeaking();
      return;
    }
    synth.cancel();

    // don't read citations aloud
    const clean = turn.answer
      .replace(/\((CAD|Writings)[^)]*\)/g, "")
      .replace(/[*#_`]/g, "")
      .trim();

    const target = LANG_TAGS[turn.lang] || "en-IN";
    const voices = synth.getVoices();
    const match =
      voices.find((v) => v.lang === target) ||
      voices.find((v) => v.lang.startsWith(target.split("-")[0]));
    setVoiceMissing(turn.lang !== "en" && !match);

    const utter = new SpeechSynthesisUtterance(clean);
    utter.lang = target;
    if (match) utter.voice = match;
    // cancel() fires the old utterance's end event late; only clear our own id.
    const clear = () => setSpeakingId((cur) => (cur === turn.id ? null : cur));
    utter.onend = clear;
    utter.onerror = clear;

    setSpeakingId(turn.id);
    synth.speak(utter);
  }

  function toggleMic() {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    stopSpeaking();
    setMicError(null);

    const rec = new SR();
    rec.lang = LANG_TAGS[lang] || "en-IN";
    rec.interimResults = true;
    rec.continuous = false;

    rec.onresult = (event) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setQuestion(transcript);
    };
    rec.onerror = (event) => {
      if (event.error === "not-allowed") {
        setMicError("Microphone access is blocked. Allow it in the browser’s address bar and try again.");
      } else if (event.error === "no-speech") {
        setMicError("Nothing was heard. Try again.");
      } else {
        setMicError(`Voice input failed (${event.error}).`);
      }
      setListening(false);
    };
    rec.onend = () => setListening(false);

    recognitionRef.current = rec;
    setListening(true);
    rec.start();
  }

  function onInputKeyDown(e) {
    // Enter sends, Shift+Enter adds a line. Ignore Enter while an IME
    // (Hindi / Marathi / Tamil input) is still composing a word.
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send();
    }
  }

  const rootClass = `ask-root${large ? " large" : ""}`;
  const empty = turns.length === 0 && !pending;

  return (
    <div className={rootClass} style={THEMES[contrast ? "contrast" : "light"]}>
      <style>{CSS}</style>

      <div className="ask-top">
        <h1>Ask Ambedkar</h1>
        <div className="ask-tools">
          {fsSupported && (
            <button type="button" className="ask-btn ghost small" aria-pressed={isFs} onClick={toggleFullscreen}>
              {isFs ? "Exit fullscreen" : "Fullscreen"}
            </button>
          )}
          <button type="button" className="ask-btn ghost small" aria-pressed={contrast} onClick={() => setPref("ask.contrast", !contrast, setContrast)}>
            High contrast
          </button>
          <button type="button" className="ask-btn ghost small" aria-pressed={large} onClick={() => setPref("ask.large", !large, setLarge)}>
            Large text
          </button>
          <button type="button" className="ask-btn ghost small" onClick={resetConversation}>New conversation</button>
        </div>
      </div>

      <div className="ask-options">
        <Segmented label="Mode" options={MODES} value={mode} onChange={setMode} />
        <Segmented label="Language" options={LANGS} value={lang} onChange={setLang} />
        <Segmented label="Search in" options={CORPORA} value={corpus} onChange={setCorpus} />
      </div>

      <div className="ask-thread" aria-live="polite">
        {empty && (
          <div className="ask-empty">
            <h2>{EMPTY_TITLE}</h2>
            <p>{EMPTY_HINT}</p>
            <div className="ask-suggest-grid">
              {SUGGESTIONS.map((s) => (
                <button key={s} type="button" className="ask-suggest" disabled={loading} onClick={() => send(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {turns.map((t) => {
          const open = openSrc && openSrc.turnId === t.id ? t.sources[openSrc.index] : null;
          return (
            <div key={t.id} style={{ display: "contents" }}>
              <div className="ask-msg ask-user">{t.question}</div>
              <div className="ask-msg ask-bot">
                <div className="ask-meta">
                  <span>{t.mode}, {t.lang}</span>
                  {t.cached && <span className="ask-badge">cached</span>}
                </div>
                <p className="ask-answer">{t.answer || "No answer text was returned. See the sources below."}</p>

                {t.answer && (
                  <div className="ask-actions">
                    <button type="button" className="ask-btn ghost small" aria-pressed={speakingId === t.id} onClick={() => speakTurn(t)}>
                      {speakingId === t.id ? "Stop" : "Listen"}
                    </button>
                  </div>
                )}
                {voiceMissing && speakingId === t.id && (
                  <p className="ask-note">No voice for this language is installed on this device.</p>
                )}

                {t.sources.length > 0 && (
                  <>
                    <div className="ask-chips" role="group" aria-label="Sources">
                      {t.sources.map((s, i) => {
                        const isOpen = openSrc && openSrc.turnId === t.id && openSrc.index === i;
                        return (
                          <button
                            key={i}
                            type="button"
                            className="ask-chip"
                            aria-expanded={!!isOpen}
                            onClick={() => setOpenSrc(isOpen ? null : { turnId: t.id, index: i })}
                          >
                            <span className="ask-chip-n">{i + 1}</span>
                            <span className="ask-chip-t">{s.title || "Source"}</span>
                          </button>
                        );
                      })}
                    </div>
                    {open && <SourcePanel s={open} onClose={() => setOpenSrc(null)} />}
                  </>
                )}
              </div>
            </div>
          );
        })}

        {pending && (
          <>
            <div className="ask-msg ask-user">{pending}</div>
            <div className="ask-msg ask-bot" role="status">
              <span className="ask-dots" aria-hidden="true"><span /><span /><span /></span>
              {slow ? "Still thinking. The archive is slow right now." : "Thinking…"}
            </div>
          </>
        )}
        <div ref={endRef} />
      </div>

      <div className="ask-composer">
        {error && <p className="ask-error" role="alert">{error}</p>}
        {micError && <p className="ask-error" role="alert">{micError}</p>}
        {prefilled && <p className="ask-note">Question filled in from the knowledge graph. Tap Ask to send it.</p>}

        <textarea
          className="ask-input"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={onInputKeyDown}
          placeholder="Ask a question about Dr. Ambedkar's writings and speeches..."
          aria-label="Your question"
          rows={2}
        />
        <div className="ask-composer-row">
          {micSupported && (
            <button type="button" className="ask-btn ghost" aria-pressed={listening} onClick={toggleMic}>
              {listening ? "Stop listening" : "🎤 Speak"}
            </button>
          )}
          <button type="button" className="ask-btn grow" disabled={loading || !question.trim()} onClick={() => send()}>
            {loading ? "Thinking…" : "Ask"}
          </button>
        </div>
      </div>
    </div>
  );
}

// useSearchParams() needs a Suspense boundary or `next build` fails during prerender.
export default function AskPage() {
  return (
    <Suspense fallback={<div style={{ maxWidth: 700, margin: "0 auto" }}>Loading…</div>}>
      <AskPageInner />
    </Suspense>
  );
}
