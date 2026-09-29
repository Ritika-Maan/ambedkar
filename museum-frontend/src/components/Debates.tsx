import { useState, useEffect } from 'react';
import type { DebateResult, AskContext } from '../types';

interface Props {
  onAskWithContext: (ctx: AskContext) => void;
}

const SAMPLE_DEBATES: DebateResult[] = [
  {
    id: 'cab-1949-11-25',
    date: '25 November 1949',
    volume: 'Volume XI',
    topic: 'Closing Speech on the Constitution',
    speaker: 'Dr. B. R. Ambedkar',
    assembly: 'Constituent Assembly of India',
    page: '972',
    excerpt: '"On 26th January 1950, India will be an independent country. What would happen to her independence? Will she maintain it or will she lose it again? This is the first thought that comes to my mind. It is not that India was never an independent country. The point is that she once lost the independence she had. Will she lose it a second time?"',
  },
  {
    id: 'cab-1949-11-17',
    date: '17 November 1949',
    volume: 'Volume XI',
    topic: 'On Fundamental Rights and Directive Principles',
    speaker: 'Dr. B. R. Ambedkar',
    assembly: 'Constituent Assembly of India',
    page: '841',
    excerpt: '"The Directive Principles of State Policy have been criticized as containing contradictions… The objection is misconstrued. Fundamental Rights are justiciable while Directive Principles are not. The Directive Principles are aimed at making the Fundamental Rights real and effective."',
  },
  {
    id: 'cab-1948-12-17',
    date: '17 December 1948',
    volume: 'Volume VII',
    topic: 'Introduction of the Draft Constitution',
    speaker: 'Dr. B. R. Ambedkar',
    assembly: 'Constituent Assembly of India',
    page: '35',
    excerpt: '"The Draft Constitution has provisions… for the protection of Fundamental Rights which are justiciable. They are not mere pious declarations. They are enforceable in a court of law."',
  },
  {
    id: 'cab-1949-09-10',
    date: '10 September 1949',
    volume: 'IX',
    topic: 'On the Abolition of Untouchability',
    speaker: 'Dr. B. R. Ambedkar',
    assembly: 'Constituent Assembly of India',
    page: '1205',
    excerpt: '"Untouchability is the greatest blot on the face of India. It is not merely a social evil. It is a system which had been perpetuated for centuries and which has resulted in the degradation of millions of human beings."',
  },
  {
    id: 'cab-1949-08-02',
    date: '2 August 1949',
    volume: 'IX',
    topic: 'Article 17 — Abolition of Untouchability',
    speaker: 'Dr. B. R. Ambedkar',
    assembly: 'Constituent Assembly of India',
    page: '702',
    excerpt: '"Untouchability is a unique institution. It is probably the only institution in the world which has been built upon the notion that some classes of people are, by birth, clean and some classes of people are, by birth, unclean."',
  },
  {
    id: 'cab-1950-02-06',
    date: '6 February 1950',
    volume: 'XII',
    topic: 'On Social Revolution and Constitutional Morality',
    speaker: 'Dr. B. R. Ambedkar',
    assembly: 'Constituent Assembly of India',
    page: '11',
    excerpt: '"Constitutional morality is not a natural sentiment. It has to be cultivated. We must realize that our people have yet to learn it. Democracy in India is only a top-dressing on an Indian soil which is essentially undemocratic."',
  },
];

const TOPIC_FILTERS = [
  'All Topics',
  'Fundamental Rights',
  'Untouchability',
  'Constitution',
  'Social Justice',
  'Federalism',
  'Emergency Provisions',
];

export default function Debates({ onAskWithContext }: Props) {
  const [query, setQuery] = useState('');
  const [selectedVolume, setSelectedVolume] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('All Topics');
  const [results, setResults] = useState<DebateResult[]>(SAMPLE_DEBATES);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const doSearch = async () => {
    setLoading(true);
    try {
      const activeTopic = query.trim() || (selectedTopic !== 'All Topics' ? selectedTopic : '');
      const params = new URLSearchParams({
        ...(activeTopic && { topic: activeTopic }),
        ...(selectedVolume && { volume: selectedVolume }),
      });
      const res = await fetch(`/debates-search?${params}`);
      if (res.ok) {
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const mapped: DebateResult[] = data.results.map((r: any) => ({
            id: r.id || crypto.randomUUID(),
            date: r.date || 'Constituent Assembly',
            volume: r.volume ? `Volume ${r.volume}` : 'Constituent Assembly',
            topic: r.title || 'Debate Speech',
            speaker: 'Dr. B. R. Ambedkar',
            assembly: 'Constituent Assembly of India',
            excerpt: r.snippet || '',
          }));
          setResults(mapped);
          return;
        }
      }
    } catch {
      // API not available — fallback to sample data filtering
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!query && selectedTopic === 'All Topics' && !selectedVolume) {
      setResults(SAMPLE_DEBATES);
      return;
    }
    const filtered = SAMPLE_DEBATES.filter((d) => {
      const q = query.toLowerCase();
      const matchQuery = !q || d.topic.toLowerCase().includes(q) || d.excerpt.toLowerCase().includes(q);
      const matchTopic = selectedTopic === 'All Topics' || d.topic.toLowerCase().includes(selectedTopic.toLowerCase());
      const matchVol = !selectedVolume || d.volume.toLowerCase().includes(selectedVolume.toLowerCase());
      return matchQuery && matchTopic && matchVol;
    });
    setResults(filtered);
  }, [query, selectedTopic, selectedVolume]);

  return (
    <section
      id="debates"
      className="min-h-screen py-24"
      style={{ background: 'var(--bg2)' }}
    >
      <div className="max-w-[1400px] mx-auto px-6">
        {/* Header */}
        <div className="mb-12">
          <div className="museum-label mb-4">Constitutional Archive</div>
          <h2
            className="museum-heading text-5xl mb-4"
            style={{ fontFamily: 'Fraunces, serif', color: 'var(--fg1)' }}
          >
            The Debates
          </h2>
          <p
            className="max-w-lg text-base leading-relaxed"
            style={{ color: 'var(--cream-55)', fontWeight: 300 }}
          >
            Search and explore Ambedkar's interventions in the Constituent Assembly debates,
            legislative councils, and public addresses — the living record of constitution-making.
          </p>
        </div>

        {/* Search bar */}
        <div
          className="p-5 mb-6"
          style={{ background: 'var(--bg3)', border: '1px solid var(--ac-border)' }}
        >
          <div className="flex gap-3 mb-4">
            <div className="flex-1 relative">
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                stroke="rgba(196,163,90,0.5)"
                strokeWidth="1.4"
                className="absolute left-3 top-1/2 -translate-y-1/2"
              >
                <circle cx="6" cy="6" r="4.5" />
                <path d="M9.5 9.5l3 3" />
              </svg>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && doSearch()}
                placeholder="Search by keyword, speech content, or topic…"
                className="w-full pl-9 pr-4 py-2.5 text-sm bg-transparent outline-none"
                style={{
                  fontFamily: 'Source Sans 3, sans-serif',
                  color: 'var(--fg1)',
                  border: '1px solid rgba(196,163,90,0.2)',
                  fontSize: '0.875rem',
                }}
              />
            </div>
            <button
              onClick={doSearch}
              className="px-5 py-2.5 text-xs tracking-[0.12em] uppercase transition-colors"
              style={{
                fontFamily: 'DM Mono, monospace',
                background: '#c4a35a',
                color: '#080c1a',
                fontSize: '0.65rem',
              }}
            >
              {loading ? '…' : 'Search'}
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <input
              type="text"
              value={selectedVolume}
              onChange={(e) => setSelectedVolume(e.target.value)}
              placeholder="Volume (e.g. XI)"
              className="px-3 py-1.5 text-xs bg-transparent outline-none"
              style={{
                fontFamily: 'DM Mono, monospace',
                fontSize: '0.65rem',
                color: 'var(--fg1)',
                border: '1px solid var(--ac-border)',
                width: 120,
              }}
            />
            <input
              type="text"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              placeholder="Date from"
              className="px-3 py-1.5 text-xs bg-transparent outline-none"
              style={{
                fontFamily: 'DM Mono, monospace',
                fontSize: '0.65rem',
                color: 'var(--fg1)',
                border: '1px solid var(--ac-border)',
                width: 110,
              }}
            />
            <input
              type="text"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              placeholder="Date to"
              className="px-3 py-1.5 text-xs bg-transparent outline-none"
              style={{
                fontFamily: 'DM Mono, monospace',
                fontSize: '0.65rem',
                color: 'var(--fg1)',
                border: '1px solid var(--ac-border)',
                width: 110,
              }}
            />
            <div className="flex flex-wrap gap-2">
              {TOPIC_FILTERS.map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedTopic(t)}
                  className="px-3 py-1.5 text-xs tracking-[0.08em] transition-colors"
                  style={{
                    fontFamily: 'DM Mono, monospace',
                    fontSize: '0.6rem',
                    background: selectedTopic === t ? 'var(--ac-border)' : 'transparent',
                    color: selectedTopic === t ? 'var(--ac1)' : 'var(--cream-4)',
                    border: `1px solid ${selectedTopic === t ? 'rgba(196,163,90,0.4)' : 'rgba(196,163,90,0.1)'}`,
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results count */}
        <div
          className="mb-6 text-xs"
          style={{ fontFamily: 'DM Mono, monospace', color: 'var(--cream-4)', fontSize: '0.65rem', letterSpacing: '0.1em' }}
        >
          {results.length} DEBATE{results.length !== 1 ? 'S' : ''} FOUND
        </div>

        {/* Results */}
        <div className="flex flex-col gap-4">
          {results.map((debate) => {
            const isExpanded = expanded === debate.id;
            return (
              <div
                key={debate.id}
                className="exhibit-card p-0 overflow-hidden"
              >
                {/* Header row */}
                <div
                  className="flex items-start gap-4 p-5 cursor-pointer"
                  onClick={() => setExpanded(isExpanded ? null : debate.id)}
                >
                  {/* Volume marker */}
                  <div
                    className="flex-shrink-0 w-12 h-12 flex items-center justify-center"
                    style={{
                      background: 'rgba(196,163,90,0.08)',
                      border: '1px solid rgba(196,163,90,0.2)',
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="rgba(196,163,90,0.6)" strokeWidth="1.2">
                      <path d="M3 2h14v16H3zM7 2v16M7 6h7M7 10h7M7 14h5" />
                    </svg>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <span
                        style={{
                          fontFamily: 'DM Mono, monospace',
                          fontSize: '0.6rem',
                          letterSpacing: '0.12em',
                          color: 'var(--ac1)',
                          background: 'rgba(196,163,90,0.1)',
                          padding: '2px 8px',
                        }}
                      >
                        {debate.volume}
                      </span>
                      <span
                        style={{
                          fontFamily: 'DM Mono, monospace',
                          fontSize: '0.6rem',
                          color: 'var(--cream-4)',
                          letterSpacing: '0.08em',
                        }}
                      >
                        {debate.date}
                        {debate.page && ` · p.${debate.page}`}
                      </span>
                      {debate.assembly && (
                        <span
                          style={{
                            fontFamily: 'DM Mono, monospace',
                            fontSize: '0.6rem',
                            color: 'var(--cream-3)',
                          }}
                        >
                          {debate.assembly}
                        </span>
                      )}
                    </div>

                    <h3
                      className="text-base font-semibold mb-1 leading-snug"
                      style={{ fontFamily: 'Fraunces, serif', color: 'var(--fg1)' }}
                    >
                      {debate.topic}
                    </h3>
                    <div
                      className="text-xs"
                      style={{ color: 'var(--cream-45)', fontFamily: 'Source Sans 3, sans-serif' }}
                    >
                      {debate.speaker}
                    </div>
                  </div>

                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    stroke="rgba(196,163,90,0.5)"
                    strokeWidth="1.4"
                    className="flex-shrink-0 transition-transform duration-300"
                    style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', marginTop: 2 }}
                  >
                    <path d="M2 4l5 6 5-6" />
                  </svg>
                </div>

                {/* Expanded excerpt */}
                {isExpanded && (
                  <div
                    className="px-5 pb-5"
                    style={{
                      borderTop: '1px solid rgba(196,163,90,0.1)',
                      animation: 'fadeUp 0.3s ease-out forwards',
                    }}
                  >
                    <blockquote
                      className="text-sm leading-relaxed my-4 italic"
                      style={{
                        color: 'var(--fg1)',
                        fontFamily: 'Source Sans 3, sans-serif',
                        fontWeight: 300,
                        paddingLeft: '1rem',
                        borderLeft: '2px solid rgba(196,163,90,0.4)',
                        fontSize: '0.875rem',
                      }}
                    >
                      {debate.excerpt}
                    </blockquote>

                    <div className="flex gap-4 mt-4">
                      <button
                        className="flex items-center gap-2 text-xs tracking-[0.1em] uppercase"
                        style={{
                          fontFamily: 'DM Mono, monospace',
                          color: 'var(--ac1)',
                          fontSize: '0.6rem',
                          border: '1px solid rgba(196,163,90,0.3)',
                          padding: '6px 12px',
                        }}
                      >
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.2">
                          <path d="M1 1h8v8H1z" />
                          <path d="M3 3h4M3 5h4M3 7h2" />
                        </svg>
                        Read Full Debate
                      </button>
                      <button
                        onClick={() => onAskWithContext({
                          type: 'debate',
                          id: debate.id,
                          title: debate.topic,
                          description: debate.excerpt,
                        })}
                        className="flex items-center gap-2 text-xs tracking-[0.1em] uppercase"
                        style={{
                          fontFamily: 'DM Mono, monospace',
                          color: 'var(--cream-5)',
                          fontSize: '0.6rem',
                          border: '1px solid rgba(242,237,224,0.1)',
                          padding: '6px 12px',
                        }}
                      >
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                          <path d="M5 0a5 5 0 100 10A5 5 0 005 0zm.4 7.8H4.6V4.6h.8v3.2zm0-4.2H4.6v-.8h.8v.8z" />
                        </svg>
                        Ask Ambedkar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {results.length === 0 && !loading && (
          <div
            className="text-center py-16"
            style={{ color: 'var(--cream-3)' }}
          >
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.2" className="mx-auto mb-4">
              <circle cx="14" cy="14" r="10" />
              <path d="M24 24l6 6" />
            </svg>
            <p style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.7rem', letterSpacing: '0.12em' }}>
              NO DEBATES FOUND FOR YOUR QUERY
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
