import { useEffect, useState, useRef } from 'react';
import type { Book, AskContext } from '../types';

interface Props {
  book: Book | null;
  onClose: () => void;
  onAskWithContext: (ctx: AskContext) => void;
}

export default function BookModal({ book, onClose, onAskWithContext }: Props) {
  const [phase, setPhase] = useState<'closed' | 'opening' | 'open'>('closed');
  const [activeView, setActiveView] = useState<'overview' | 'read' | 'listen'>('overview');
  const [zoom, setZoom] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (book) {
      setPhase('closed');
      setActiveView('overview');
      setZoom(1);
      const t1 = setTimeout(() => setPhase('opening'), 80);
      const t2 = setTimeout(() => setPhase('open'), 900);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [book]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!book) return null;

  const handleAsk = () => {
    onAskWithContext({
      type: 'book',
      id: book.id,
      title: book.title,
      description: book.description,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ background: 'rgba(4,6,14,0.97)', backdropFilter: 'blur(16px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={containerRef}
        className="relative w-full max-w-5xl mx-4 max-h-[92vh] overflow-hidden"
        style={{
          background: 'var(--bg2)',
          border: '1px solid var(--ac-border)',
          animation: 'scaleIn 0.4s cubic-bezier(0.25,0.1,0.25,1) forwards',
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 transition-colors"
          style={{ color: 'var(--fg3)' }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
            <path d="M2 2l12 12M14 2L2 14" />
          </svg>
        </button>

        <div className="flex h-[88vh] overflow-hidden">
          {/* ——— Left: Book visual + metadata ——— */}
          <div
            className="w-72 flex-shrink-0 flex flex-col"
            style={{ background: 'var(--bg3)', borderRight: '1px solid var(--ac-border)' }}
          >
            {/* Book 3D open animation */}
            <div
              className="relative h-64 flex items-center justify-center overflow-hidden"
              style={{ background: book.color, perspective: '1400px' }}
            >
              <div
                style={{
                  width: 110,
                  height: 150,
                  transformStyle: 'preserve-3d',
                  transform: phase === 'opening' || phase === 'open'
                    ? 'perspective(1400px) rotateY(-155deg)'
                    : 'perspective(1400px) rotateY(0deg)',
                  transition: 'transform 0.85s cubic-bezier(0.25, 0.1, 0.25, 1)',
                  position: 'relative',
                }}
              >
                {/* Front cover */}
                <div
                  style={{
                    position: 'absolute', inset: 0,
                    backfaceVisibility: 'hidden',
                    background: `linear-gradient(135deg, ${book.color} 0%, rgba(0,0,0,0.55) 100%)`,
                    border: '1px solid rgba(196,163,90,0.3)',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', padding: '12px',
                  }}
                >
                  <div style={{ fontFamily: 'Fraunces, serif', fontSize: '0.65rem', color: '#f2ede0', lineHeight: 1.3, textAlign: 'center' }}>
                    {book.title}
                  </div>
                  <div style={{ marginTop: 6, width: 24, height: 1, background: '#c4a35a', opacity: 0.6 }} />
                  <div style={{ marginTop: 6, fontFamily: 'DM Mono, monospace', fontSize: '0.52rem', color: '#c4a35a', letterSpacing: '0.1em' }}>
                    {book.year}
                  </div>
                </div>
                {/* Inside page */}
                <div
                  style={{
                    position: 'absolute', inset: 0,
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                    background: '#f5f0e5',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px',
                  }}
                >
                  <div style={{ fontFamily: 'Source Sans 3, sans-serif', fontSize: '0.52rem', color: '#2a1f0d', lineHeight: 1.6, textAlign: 'center' }}>
                    {book.excerpt ? book.excerpt.slice(0, 100) + '…' : 'Open the Reading Room to explore.'}
                  </div>
                </div>
              </div>
              {/* Image overlay */}
              <img src={book.image} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" style={{ filter: 'sepia(60%)' }} />
              <div className="absolute inset-0" style={{ background: `linear-gradient(to top, ${book.color} 0%, transparent 40%)` }} />
            </div>

            {/* Metadata scroll area */}
            <div className="flex-1 overflow-y-auto p-5">
              <div className="museum-label mb-3">About This Work</div>
              <h2 className="text-lg font-semibold mb-1 leading-snug" style={{ fontFamily: 'Fraunces, serif', color: 'var(--fg1)' }}>
                {book.title}
              </h2>
              {book.subtitle && (
                <p className="text-xs mb-3" style={{ color: 'var(--fg3)', fontStyle: 'italic' }}>{book.subtitle}</p>
              )}

              <div className="mb-4 pb-4" style={{ borderBottom: '1px solid var(--ac-border)' }}>
                {[
                  { l: 'Year', v: String(book.year) },
                  ...(book.pages   ? [{ l: 'Pages',     v: String(book.pages)   }] : []),
                  ...(book.publisher ? [{ l: 'Publisher', v: book.publisher }]     : []),
                ].map(({ l, v }) => (
                  <div key={l} className="flex justify-between py-1.5">
                    <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.6rem', color: 'var(--ac1)', letterSpacing: '0.1em' }}>
                      {l.toUpperCase()}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--fg1)' }}>{v}</span>
                  </div>
                ))}
              </div>

              <p className="text-sm leading-relaxed mb-5" style={{ color: 'var(--fg2)', fontWeight: 300, fontSize: '0.8rem' }}>
                {book.longDescription}
              </p>
            </div>

            {/* ——— PRIMARY CTA: ASK AMBEDKAR ——— */}
            <div className="flex-shrink-0 p-4" style={{ borderTop: '1px solid var(--ac-border)', background: 'var(--bg4)' }}>
              <button
                onClick={handleAsk}
                className="w-full py-4 flex items-center justify-center gap-3 transition-all duration-200 group"
                style={{
                  background: 'var(--ac1)',
                  color: 'var(--bg1)',
                  fontFamily: 'DM Mono, monospace',
                  fontSize: '0.65rem',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  fontWeight: 500,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                  <path d="M7 0a7 7 0 100 14A7 7 0 007 0zm.6 10.9H6.4V6.4h1.2v4.5zm0-6.2H6.4v-1.2h1.2v1.2z" />
                </svg>
                Ask Ambedkar About This Work
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"
                  className="transition-transform duration-200 group-hover:translate-x-0.5">
                  <path d="M1 6h10M7 2l4 4-4 4" />
                </svg>
              </button>
            </div>
          </div>

          {/* ——— Right: Reading Room ——— */}
          <div className="flex-1 flex flex-col overflow-hidden">

            {/* "YOU'RE EXPLORING" banner */}
            <div
              className="flex-shrink-0 px-6 py-3 flex items-center gap-3"
              style={{
                background: 'var(--ac-bg)',
                borderBottom: '1px solid var(--ac-border)',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="var(--ac1)">
                <path d="M6 0a6 6 0 100 12A6 6 0 006 0zm.5 9.5h-1v-4h1v4zm0-5.5h-1V3h1v1z" />
              </svg>
              <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.58rem', color: 'var(--ac1)', letterSpacing: '0.12em' }}>
                YOU&apos;RE EXPLORING:
              </span>
              <span className="font-medium" style={{ fontFamily: 'Fraunces, serif', color: 'var(--fg1)', fontSize: '0.875rem' }}>
                {book.title}
              </span>
              <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.58rem', color: 'var(--fg3)' }}>({book.year})</span>
            </div>

            {/* Sub-nav */}
            <div
              className="flex items-center px-6 py-3 gap-6 flex-shrink-0"
              style={{ borderBottom: '1px solid var(--ac-border)' }}
            >
              {(['overview', 'read', 'listen'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setActiveView(v)}
                  className="text-xs tracking-[0.12em] uppercase transition-colors capitalize"
                  style={{
                    fontFamily: 'DM Mono, monospace',
                    fontSize: '0.6rem',
                    color: activeView === v ? 'var(--ac1)' : 'var(--fg3)',
                    borderBottom: activeView === v ? '1px solid var(--ac1)' : '1px solid transparent',
                    paddingBottom: 2,
                  }}
                >
                  {v}
                </button>
              ))}

              {activeView === 'read' && (
                <div className="flex items-center gap-2 ml-auto">
                  <button onClick={() => setZoom((z) => Math.max(0.7, z - 0.15))}
                    className="w-6 h-6 flex items-center justify-center"
                    style={{ border: '1px solid var(--ac-border)', color: 'var(--ac1)', fontSize: '1rem' }}>−</button>
                  <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.6rem', color: 'var(--fg3)' }}>
                    {Math.round(zoom * 100)}%
                  </span>
                  <button onClick={() => setZoom((z) => Math.min(2, z + 0.15))}
                    className="w-6 h-6 flex items-center justify-center"
                    style={{ border: '1px solid var(--ac-border)', color: 'var(--ac1)', fontSize: '1rem' }}>+</button>
                </div>
              )}
            </div>

            {/* Content area */}
            <div className="flex-1 overflow-y-auto p-8">

              {activeView === 'overview' && (
                <div className="max-w-2xl" style={{ animation: 'fadeUp 0.4s ease-out forwards' }}>
                  {book.excerpt && (
                    <blockquote
                      className="text-xl italic mb-8 leading-relaxed"
                      style={{
                        fontFamily: 'Fraunces, serif',
                        color: 'var(--ac1)',
                        borderLeft: '2px solid var(--ac-border-h)',
                        paddingLeft: '1.5rem',
                      }}
                    >
                      {book.excerpt}
                    </blockquote>
                  )}
                  <div className="museum-label mb-4">Overview</div>
                  <p className="text-base leading-relaxed mb-6" style={{ color: 'var(--fg2)', fontWeight: 300 }}>
                    {book.longDescription}
                  </p>
                  <div className="museum-label mb-4">Historical Context</div>
                  <p className="text-base leading-relaxed mb-8" style={{ color: 'var(--fg2)', fontWeight: 300 }}>
                    Published in {book.year}, this work emerged from Ambedkar's deep engagement
                    with the social and political realities of colonial India. It represents a
                    pivotal moment in the intellectual struggle for the rights of marginalized communities.
                  </p>

                  {/* Inline Ask CTA (second path into Ask) */}
                  <div
                    className="p-5 flex items-center justify-between gap-4"
                    style={{ background: 'var(--ac-bg)', border: '1px solid var(--ac-border)' }}
                  >
                    <p className="text-sm" style={{ color: 'var(--fg2)', fontWeight: 300 }}>
                      Have questions about <strong style={{ color: 'var(--fg1)', fontStyle: 'italic', fontFamily: 'Fraunces, serif' }}>{book.title}</strong>?
                      Ask the AI guide — the book is already loaded as context.
                    </p>
                    <button
                      onClick={handleAsk}
                      className="flex-shrink-0 px-5 py-2.5 text-xs tracking-[0.12em] uppercase"
                      style={{
                        fontFamily: 'DM Mono, monospace',
                        background: 'var(--ac1)',
                        color: 'var(--bg1)',
                        whiteSpace: 'nowrap',
                        fontSize: '0.6rem',
                      }}
                    >
                      Ask Ambedkar →
                    </button>
                  </div>
                </div>
              )}

              {activeView === 'read' && (
                <div
                  className="max-w-2xl"
                  style={{
                    transform: `scale(${zoom})`,
                    transformOrigin: 'top left',
                    animation: 'pageReveal 0.4s ease-out forwards',
                  }}
                >
                  <div
                    className="p-8 doc-page"
                    style={{ background: '#f5f0e5', color: '#1a1208', minHeight: 600, boxShadow: '4px 4px 28px rgba(0,0,0,0.3)' }}
                  >
                    <div className="text-center mb-8" style={{ borderBottom: '1px solid rgba(26,18,8,0.15)', paddingBottom: '1.5rem' }}>
                      <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                        {book.title}
                      </h1>
                      {book.subtitle && (
                        <p style={{ fontFamily: 'Source Sans 3, sans-serif', fontSize: '0.9rem', opacity: 0.65 }}>{book.subtitle}</p>
                      )}
                      <p style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.6rem', letterSpacing: '0.15em', marginTop: '0.75rem', opacity: 0.45 }}>
                        BY B. R. AMBEDKAR · {book.year}
                      </p>
                    </div>
                    <div style={{ fontFamily: 'Source Sans 3, sans-serif', fontSize: '0.875rem', lineHeight: 1.85, color: '#1a1208' }}>
                      {book.excerpt && <p>{book.excerpt}</p>}
                      <p style={{ marginTop: '1.2em', opacity: 0.6 }}>
                        This document is part of the Ambedkar Living Archive. Use the zoom controls
                        above to adjust the reading size.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeView === 'listen' && (
                <div className="flex flex-col items-center justify-center min-h-64 gap-6" style={{ animation: 'fadeIn 0.4s ease-out forwards' }}>
                  <div className="w-16 h-16 rounded-full flex items-center justify-center"
                    style={{ background: 'var(--ac-bg)', border: '1px solid var(--ac-border)' }}>
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="var(--ac1)" strokeWidth="1.5">
                      <path d="M14 4a10 10 0 100 20A10 10 0 0014 4z" />
                      <path d="M11 9l8 5-8 5V9z" fill="var(--ac1)" stroke="none" />
                    </svg>
                  </div>
                  <div className="flex items-center gap-1 h-12">
                    {Array.from({ length: 32 }).map((_, i) => (
                      <div key={i} className="wave-bar" style={{
                        width: 3,
                        height: '100%',
                        background: i % 3 === 0 ? 'var(--ac1)' : 'var(--ac-bg2)',
                        transformOrigin: 'center',
                        '--dur': `${0.5 + Math.random() * 0.6}s`,
                        '--delay': `${i * 0.04}s`,
                      } as React.CSSProperties} />
                    ))}
                  </div>
                  <div className="text-center">
                    <div className="text-sm mb-2" style={{ fontFamily: 'Fraunces, serif', color: 'var(--fg1)' }}>
                      Audio reading of {book.title}
                    </div>
                    <p style={{ color: 'var(--fg3)', fontFamily: 'DM Mono, monospace', fontSize: '0.6rem' }}>
                      Connect the audio archive to enable playback
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
