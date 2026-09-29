import { useState } from 'react';
import type { AskMode } from '../types';

// ——— Backend contract (verified against main.py: CompareRequest / CompareResponse) ———
// POST /compare  { question, date_a, date_b, mode }
// -> { a: CompareSide, b: CompareSide }
interface CompareSource {
  date?: string | null;
  volume?: string | null;
  title?: string | null;
  type?: string | null;
  relevance?: string | null;
  section?: number | null;
  snippet?: string | null;
}

interface CompareSide {
  date: string;
  answer: string;
  mode: string;
  sources: CompareSource[];
}

interface CompareResponse {
  a: CompareSide;
  b: CompareSide;
}

// Same convention as the rest of the app (relative path); VITE_API_BASE is an
// optional override for pointing the frontend at a separately hosted backend.
const API_BASE: string = (import.meta.env.VITE_API_BASE as string | undefined) ?? '';

const MODES: AskMode[] = ['student', 'scholar', 'constitutional'];

const MODE_DESCS: Record<AskMode, string> = {
  student: 'Clear, accessible explanations',
  scholar: 'Academic depth with citations',
  constitutional: 'Legal and constitutional analysis',
};

const EXAMPLE_QUESTION = "How did Ambedkar's view of Fundamental Rights develop?";

// Same rules as the reference /ask page: backend marks Constituent Assembly
// records as "summary"; writings come through as "source_text".
function isDebate(s: CompareSource): boolean {
  const t = String(s.type || '').toLowerCase();
  return t === 'summary' || t.startsWith('debate');
}

function sourceMeta(s: CompareSource): string {
  const parts: string[] = [];
  if (s.date) parts.push(s.date);
  if (s.volume) parts.push(`Vol. ${s.volume}`);
  if (s.section != null && !Number.isNaN(Number(s.section))) {
    parts.push(`section ${Number(s.section) + 1}`);
  }
  return parts.join(' · ');
}

const mono = { fontFamily: 'DM Mono, monospace' } as const;

function ThinkingDots() {
  return (
    <div className="flex items-center gap-1.5 py-2">
      {[0, 1, 2].map((i) => (
        <div key={i} className="thinking-dot w-1.5 h-1.5 rounded-full" style={{ background: 'var(--ac1)' }} />
      ))}
    </div>
  );
}

function SourceEntry({ source }: { source: CompareSource }) {
  const debate = isDebate(source);
  return (
    <div className="p-3" style={{ background: 'var(--bg2)', border: '1px solid var(--ac-border)' }}>
      <div className="flex flex-wrap items-center gap-2 mb-1.5" style={{ ...mono, fontSize: '0.6rem' }}>
        <span style={{ color: 'var(--ac1)', background: 'var(--ac-bg)', padding: '1px 6px', letterSpacing: '0.1em' }}>
          {debate ? 'DEBATE' : 'WRITING'}
        </span>
        {source.type && (
          <span style={{ color: 'var(--fg3)', letterSpacing: '0.08em' }}>
            {source.type.replace(/_/g, ' ').toUpperCase()}
          </span>
        )}
        {source.relevance != null && (
          <span style={{ color: 'var(--ac1)', letterSpacing: '0.08em' }}>
            RELEVANCE · {String(source.relevance).toUpperCase()}
          </span>
        )}
      </div>
      <div
        className="text-sm font-medium mb-1"
        style={{ color: 'var(--fg1)', fontFamily: 'Source Sans 3, sans-serif' }}
      >
        {source.title || 'Untitled source'}
      </div>
      {sourceMeta(source) && (
        <div style={{ ...mono, fontSize: '0.6rem', color: 'var(--fg3)', letterSpacing: '0.08em' }}>
          {sourceMeta(source)}
        </div>
      )}
      {source.snippet && (
        <p
          className="mt-2 leading-relaxed"
          style={{
            color: 'var(--fg2)',
            fontStyle: 'italic',
            fontSize: '0.78rem',
            borderLeft: '2px solid var(--ac-border-h)',
            paddingLeft: '0.75rem',
          }}
        >
          {source.snippet}
        </p>
      )}
    </div>
  );
}

function ResultPanel({ label, side, period }: { label: string; side: CompareSide | null; period: string }) {
  return (
    <div className="flex flex-col min-w-0" style={{ background: 'var(--bg3)', border: '1px solid var(--ac-border)' }}>
      <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--ac-border)' }}>
        <div className="museum-label mb-1">{label}</div>
        <div
          style={{ fontFamily: 'Fraunces, serif', color: 'var(--fg1)', fontSize: '1.25rem', fontWeight: 600 }}
        >
          {side ? side.date : period}
        </div>
      </div>

      <div className="px-5 py-5 flex-1">
        {side === null ? (
          <div>
            <ThinkingDots />
            <p style={{ color: 'var(--fg3)', fontSize: '0.8rem', fontStyle: 'italic' }}>
              Consulting the archive for this period…
            </p>
          </div>
        ) : (
          <>
            <div
              className="leading-relaxed mb-6"
              style={{ color: 'var(--fg1)', fontWeight: 300, fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}
            >
              {side.answer}
            </div>

            <div className="museum-label mb-3" style={{ fontSize: '0.55rem' }}>
              Sources & Citations · {side.sources.length}
            </div>
            {side.sources.length === 0 ? (
              <p style={{ color: 'var(--fg3)', fontSize: '0.78rem' }}>
                No archive sources were retrieved for this period.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {side.sources.map((s, i) => (
                  <SourceEntry key={i} source={s} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function Compare() {
  const [question, setQuestion] = useState('');
  const [periodA, setPeriodA] = useState('');
  const [periodB, setPeriodB] = useState('');
  const [mode, setMode] = useState<AskMode>('student');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CompareResponse | null>(null);
  // Periods as submitted, so the loading panels show the right headings
  const [submitted, setSubmitted] = useState<{ a: string; b: string } | null>(null);

  const canSubmit = !!question.trim() && !!periodA.trim() && !!periodB.trim() && !loading;

  const runCompare = async () => {
    if (!canSubmit) return;
    const body = {
      question: question.trim(),
      date_a: periodA.trim(),
      date_b: periodB.trim(),
      mode,
    };
    setLoading(true);
    setError(null);
    setResult(null);
    setSubmitted({ a: body.date_a, b: body.date_b });

    try {
      const res = await fetch(`${API_BASE}/compare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      let data: unknown = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok) {
        const d = data as { detail?: unknown } | null;
        const detail = typeof d?.detail === 'string' ? d.detail : `The archive returned an error (${res.status}).`;
        throw new Error(detail);
      }

      const parsed = data as Partial<CompareResponse> | null;
      if (!parsed || !parsed.a || !parsed.b) {
        throw new Error('The archive returned an unexpected response. Please try again.');
      }
      setResult({ a: parsed.a, b: parsed.b });
    } catch (e) {
      const msg = e instanceof TypeError
        ? 'Could not reach the archive backend. Check that it is running and try again.'
        : e instanceof Error ? e.message : 'Something went wrong. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    fontFamily: 'Source Sans 3, sans-serif',
    color: 'var(--fg1)',
    border: '1px solid var(--ac-border)',
    fontSize: '0.9rem',
    minHeight: 44,
  } as const;

  return (
    <section id="compare" className="py-24" style={{ background: 'var(--bg1)' }}>
      <div className="max-w-[1400px] mx-auto px-6">
        {/* Header */}
        <div className="mb-12">
          <div className="museum-label mb-4">Comparative Study</div>
          <h2 className="museum-heading text-5xl mb-4" style={{ fontFamily: 'Fraunces, serif', color: 'var(--fg1)' }}>
            Compare Periods
          </h2>
          <p className="max-w-lg text-base leading-relaxed" style={{ color: 'var(--fg2)', fontWeight: 300 }}>
            Compare the same question across two historical periods, and see how the archive answers
            each — with its sources set side by side.
          </p>
        </div>

        {/* Research form */}
        <div className="p-5 mb-8" style={{ background: 'var(--bg3)', border: '1px solid var(--ac-border)' }}>
          <label className="museum-label block mb-2" htmlFor="compare-question" style={{ fontSize: '0.55rem' }}>
            Your question
          </label>
          <textarea
            id="compare-question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={EXAMPLE_QUESTION}
            rows={2}
            className="w-full px-3 py-2.5 bg-transparent outline-none resize-none mb-5"
            style={{ ...inputStyle, lineHeight: 1.5 }}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            <div>
              <label className="museum-label block mb-2" htmlFor="compare-a" style={{ fontSize: '0.55rem' }}>
                Period A / Date
              </label>
              <input
                id="compare-a"
                type="text"
                value={periodA}
                onChange={(e) => setPeriodA(e.target.value)}
                placeholder="e.g. 1948-11-04"
                className="w-full px-3 py-2.5 bg-transparent outline-none"
                style={{ ...inputStyle, ...mono, fontSize: '0.8rem' }}
              />
            </div>
            <div>
              <label className="museum-label block mb-2" htmlFor="compare-b" style={{ fontSize: '0.55rem' }}>
                Period B / Date
              </label>
              <input
                id="compare-b"
                type="text"
                value={periodB}
                onChange={(e) => setPeriodB(e.target.value)}
                placeholder="e.g. 1949-11-25"
                className="w-full px-3 py-2.5 bg-transparent outline-none"
                style={{ ...inputStyle, ...mono, fontSize: '0.8rem' }}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="museum-label mb-2" style={{ fontSize: '0.55rem' }}>Mode</div>
              <div className="flex gap-2 flex-wrap">
                {MODES.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    title={MODE_DESCS[m]}
                    className="px-4 py-2.5 text-xs transition-all duration-200"
                    style={{
                      ...mono,
                      minHeight: 44,
                      fontSize: '0.65rem',
                      letterSpacing: '0.08em',
                      textTransform: 'capitalize',
                      background: mode === m ? 'var(--ac-bg2)' : 'transparent',
                      color: mode === m ? 'var(--ac1)' : 'var(--fg3)',
                      border: `1px solid ${mode === m ? 'var(--ac-border-h)' : 'var(--ac-border)'}`,
                    }}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={runCompare}
              disabled={!canSubmit}
              className="px-6 py-2.5 text-xs tracking-[0.12em] uppercase transition-colors"
              style={{
                ...mono,
                minHeight: 44,
                background: 'var(--ac1)',
                color: 'var(--bg1)',
                fontSize: '0.65rem',
                opacity: canSubmit ? 1 : 0.45,
                cursor: canSubmit ? 'pointer' : 'not-allowed',
              }}
            >
              {loading ? 'Comparing…' : 'Compare'}
            </button>
          </div>

          <p className="mt-4" style={{ ...mono, fontSize: '0.55rem', color: 'var(--fg4)', letterSpacing: '0.08em' }}>
            {MODE_DESCS[mode].toUpperCase()}
          </p>
        </div>

        {/* Error — inputs above are preserved */}
        {error && (
          <div
            role="alert"
            className="p-4 mb-8 flex items-start justify-between gap-4 flex-wrap"
            style={{ background: 'var(--ac-bg)', border: '1px solid var(--ac-border-h)' }}
          >
            <div>
              <div className="museum-label mb-1" style={{ fontSize: '0.55rem' }}>Comparison unavailable</div>
              <p style={{ color: 'var(--fg1)', fontSize: '0.85rem' }}>{error}</p>
            </div>
            <button
              type="button"
              onClick={runCompare}
              disabled={!canSubmit}
              className="px-4 py-2 text-xs tracking-[0.12em] uppercase"
              style={{ ...mono, minHeight: 44, fontSize: '0.6rem', color: 'var(--ac1)', border: '1px solid var(--ac-border-h)' }}
            >
              Try again
            </button>
          </div>
        )}

        {/* Loading: both panels appear immediately with a thinking state */}
        {loading && submitted && (
          <>
            <p
              className="mb-4"
              role="status"
              style={{ ...mono, fontSize: '0.65rem', color: 'var(--ac1)', letterSpacing: '0.1em' }}
            >
              CONSULTING THE ARCHIVE FOR BOTH PERIODS — THIS MAY TAKE A MOMENT…
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ResultPanel label="Period A" side={null} period={submitted.a} />
              <ResultPanel label="Period B" side={null} period={submitted.b} />
            </div>
          </>
        )}

        {/* Results */}
        {!loading && result && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ResultPanel label="Period A" side={result.a} period={result.a.date} />
            <ResultPanel label="Period B" side={result.b} period={result.b.date} />
          </div>
        )}
      </div>
    </section>
  );
}
