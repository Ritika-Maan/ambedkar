import { useState, useRef, useEffect, useCallback } from 'react';
import type { Message, AskContext, AskMode, AskLang, SearchIn, Source } from '../types';
import { API_BASE } from '../config';

interface Props {
  isOpen: boolean;
  context: AskContext | null;
  onClose: () => void;
  /** 'panel' (default) = existing right-hand slide-in. 'inline' = same component embedded in a host container (Constitution reading room). */
  variant?: 'panel' | 'inline';
}

const LANG_NAMES: Record<AskLang, string> = {
  en: 'English',
  hi: 'हिन्दी',
  mr: 'मराठी',
  ta: 'தமிழ்',
};

const MODE_DESCS: Record<AskMode, string> = {
  student: 'Clear, accessible explanations',
  scholar: 'Academic depth with citations',
  constitutional: 'Legal and constitutional analysis',
};

const SUGGESTED_QUESTIONS: Record<string, string[]> = {
  general: [
    "What was Ambedkar's core argument against the caste system?",
    "How did Ambedkar envision Indian democracy?",
    "Why did Ambedkar convert to Buddhism?",
    "What is constitutional morality according to Ambedkar?",
  ],
  book: [
    "What is the main thesis of this work?",
    "How does this work relate to Ambedkar's broader philosophy?",
    "What historical events inspired this writing?",
    "How was this work received in its time?",
  ],
  timeline: [
    "What were the broader consequences of this event?",
    "How does this moment fit in Ambedkar's larger journey?",
    "What was the political context at the time?",
    "How did Ambedkar respond to this challenge?",
  ],
  debate: [
    "What was the constitutional significance of this speech?",
    "What objections was Ambedkar responding to here?",
    "How does this debate relate to modern India?",
    "What precedents did this speech establish?",
  ],
  node: [
    "What was this person or concept's relationship to Ambedkar?",
    "How did this influence Ambedkar's thinking?",
    "What primary sources discuss this connection?",
    "How is this theme relevant today?",
  ],
};

function ThinkingDots() {
  return (
    <div className="flex items-center gap-1.5 py-2">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="thinking-dot w-1.5 h-1.5 rounded-full"
          style={{ background: 'var(--ac1)' }}
        />
      ))}
    </div>
  );
}

function SourceCard({ source }: { source: Source }) {
  const displayYear = source.year || source.date;
  const displayExcerpt = source.excerpt || source.snippet;
  return (
    <div
      className="p-3 cursor-pointer group transition-colors duration-200"
      style={{ background: 'var(--bg2)', border: '1px solid var(--ac-border)' }}
    >
      <div
        className="text-xs mb-1 flex items-center gap-2 flex-wrap"
        style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.6rem' }}
      >
        <span
          style={{
            color: 'var(--ac1)',
            background: 'rgba(196,163,90,0.1)',
            padding: '1px 6px',
            letterSpacing: '0.1em',
          }}
        >
          {source.type.toUpperCase()}
        </span>
        {displayYear && (
          <span style={{ color: 'var(--cream-35)' }}>{displayYear}</span>
        )}
        {source.volume && (
          <span style={{ color: 'var(--cream-35)' }}>Vol. {source.volume}</span>
        )}
        {source.page && (
          <span style={{ color: 'var(--cream-35)' }}>p.{source.page}</span>
        )}
                {source.section != null && source.section !== '' && (
          <span style={{ color: 'var(--cream-35)' }}>Sec. {source.section}</span>
        )}
        {source.relevance && (
          <span
            style={{
              color:
                source.relevance === 'high' ? '#8fbf7f' :
                source.relevance === 'medium' ? '#c4a35a' :
                'var(--cream-35)',
              textTransform: 'uppercase',
            }}
          >
            {source.relevance}
          </span>
        )}
      </div>

      <div
        className="text-xs font-medium mb-1"
        style={{ color: 'var(--fg1)', fontFamily: 'Source Sans 3, sans-serif', fontSize: '0.8rem' }}
      >
        {source.title}
      </div>
      {displayExcerpt && (
        <p
          className="text-xs leading-relaxed"
          style={{ color: 'var(--cream-5)', fontStyle: 'italic', fontSize: '0.75rem' }}
        >
          "{displayExcerpt.slice(0, 100)}…"
        </p>
      )}
    </div>
  );
}

export default function AskPanel({ isOpen, context, onClose, variant = 'panel' }: Props) {
  const inline = variant === 'inline';
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<AskMode>('student');
  const [lang, setLang] = useState<AskLang>('en');
  const [searchIn, setSearchIn] = useState<SearchIn>('both');
  const [loading, setLoading] = useState(false);
  const [showSources, setShowSources] = useState(false);
  const [activeSources, setActiveSources] = useState<Source[]>([]);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && !inline && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 400);
    }
  }, [isOpen]);

  const sendMessage = useCallback(async (q: string) => {
    if (!q.trim() || loading) return;
    const question = q.trim();
    setInput('');

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: question,
      timestamp: new Date(),
    };

    const loadingMsg: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      loading: true,
    };

    setMessages((prev) => [...prev, userMsg, loadingMsg]);
    setLoading(true);

    const fullQuestion = context
      ? `[Exploring: ${context.title}${context.section ? ' (' + context.section + ')' : ''}] ${question}`
      : question;

    try {
      const res = await fetch(`${API_BASE}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: fullQuestion,
          mode,
          lang,
          corpus: searchIn,
        }),
      });

      const data = await res.json();
      const answer = data.answer || data.response || "I couldn't find a specific answer in the archive. Please try rephrasing or exploring related topics.";
      const cached = !!data.cached;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rawSources = data.sources || [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sources: Source[] = rawSources.map((s: any, idx: number) => ({
        id: `source-${idx}`,
        title: s.title || 'Untitled Source',
        type: s.type || 'source_text',
        date: s.date,
        year: s.date,
        volume: s.volume,
        section: s.section,
        relevance: s.relevance,
        excerpt: s.snippet || s.text || '',
        snippet: s.snippet,
      }));

      setMessages((prev) =>
        prev.map((m) =>
          m.loading
            ? { ...m, content: answer, sources, cached, loading: false }
            : m
        )
      );

      if (sources.length > 0) {
        setActiveSources(sources);
        setShowSources(true);
      }

      // TTS
      if ('speechSynthesis' in window && answer) {
        const utt = new SpeechSynthesisUtterance(answer.slice(0, 500));
        const langMap: Record<AskLang, string> = { en: 'en-US', hi: 'hi-IN', mr: 'mr-IN', ta: 'ta-IN' };
        utt.lang = langMap[lang];
        utt.rate = 0.9;
        utt.onstart = () => setSpeaking(true);
        utt.onend = () => setSpeaking(false);
        utt.onerror = () => setSpeaking(false);
        window.speechSynthesis.cancel();
        setSpeaking(true);
        window.speechSynthesis.speak(utt);
      }
    } catch(err) {
      console.error('ask failed:', err, 'API_BASE =', API_BASE);
      setMessages((prev) =>
        prev.map((m) =>
          m.loading
            ? {
                ...m,
                content:
                  'The archive connection is temporarily unavailable. Please check your network and try again.',
                loading: false,
              }
            : m
        )
      );
    } finally {
      setLoading(false);
    }
  }, [loading, mode, lang, searchIn, context]);

  const startVoice = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) return;
    recognitionRef.current = new SR();
    const langMap: Record<AskLang, string> = { en: 'en-US', hi: 'hi-IN', mr: 'mr-IN', ta: 'ta-IN' };
    recognitionRef.current.lang = langMap[lang];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognitionRef.current.onresult = (e: any) => {
      const text = e.results[0][0].transcript;
      setInput(text);
      setListening(false);
    };
    recognitionRef.current.onerror = () => setListening(false);
    recognitionRef.current.onend = () => setListening(false);
    recognitionRef.current.start();
    setListening(true);
  };

  const stopVoice = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };
  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
  };

  const clearHistory = () => {
    setMessages([]);
    setActiveSources([]);
    setShowSources(false);
  };

  const suggested = SUGGESTED_QUESTIONS[context?.type || 'general'] || SUGGESTED_QUESTIONS.general;

  if (!isOpen) return null;

  return (
    <div
      className={inline ? 'flex h-full w-full' : 'fixed right-0 top-0 bottom-0 z-[100] flex'}
      style={inline ? undefined : { width: 'min(480px, 100vw)' }}
    >
      {/* Backdrop on mobile */}
      {!inline && (
        <div
          className="md:hidden fixed inset-0"
          style={{ background: 'rgba(8,12,26,0.5)' }}
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className={`ask-panel flex flex-col w-full relative${inline ? ' ask-inline min-h-0' : ''}`}
        style={inline ? { background: 'transparent' } : {
          background: 'var(--bg2)',
          borderLeft: '1px solid rgba(196,163,90,0.2)',
          boxShadow: '-24px 0 80px rgba(0,0,0,0.5)',
        }}
      >
        {/* Header */}
        <div
          className={inline ? 'flex-shrink-0 px-5 py-3 flex flex-wrap items-center gap-x-4 gap-y-2' : 'flex-shrink-0 px-5 pt-5 pb-4'}
          style={{ borderBottom: '1px solid rgba(196,163,90,0.12)' }}
        >
          {!inline && (
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="museum-label mb-1">Your Museum Guide</div>
              <h2
                className="text-lg font-semibold"
                style={{ fontFamily: 'Fraunces, serif', color: 'var(--fg1)' }}
              >
                Ask Ambedkar
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {messages.length > 0 && (
                <button
                  onClick={clearHistory}
                  className="p-1.5 transition-colors"
                  title="Clear history"
                  style={{ color: 'var(--cream-35)' }}
                >
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.2">
                    <path d="M2 3h9M5 3V1h3v2M11 3l-.7 8H2.7L2 3" />
                  </svg>
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1.5 transition-colors"
                style={{ color: 'var(--cream-4)' }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4">
                  <path d="M2 2l10 10M12 2L2 12" />
                </svg>
              </button>
            </div>
          </div>
          )}

          {/* Context banner */}
          {context && (
            <div
              className={`flex items-center gap-2 px-3 py-2 text-xs ${inline ? 'flex-1 min-w-[220px]' : 'mb-4'}`}
              style={{
                background: 'rgba(196,163,90,0.08)',
                border: '1px solid rgba(196,163,90,0.2)',
              }}
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="#c4a35a">
                <path d="M5 0a5 5 0 100 10A5 5 0 005 0zm.4 7.8H4.6V4.6h.8v3.2zm0-4.2H4.6v-.8h.8v.8z" />
              </svg>
              <span
                style={{
                  fontFamily: 'DM Mono, monospace',
                  fontSize: '0.6rem',
                  color: 'var(--ac1)',
                  letterSpacing: '0.08em',
                }}
              >
                Exploring:
              </span>
              <span
                className="truncate"
                style={{ color: 'var(--cream-7)', fontSize: '0.75rem', fontWeight: 300 }}
              >
                {context.title}
              </span>
            </div>
          )}

          {/* Mode + Language selectors */}
          <div className={`flex gap-2 flex-wrap ${inline ? '' : 'mb-3'}`}>
            {(['student', 'scholar', 'constitutional'] as AskMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className="px-3 py-1 text-xs transition-all duration-200"
                style={{
                  fontFamily: 'DM Mono, monospace',
                  fontSize: '0.6rem',
                  letterSpacing: '0.08em',
                  textTransform: 'capitalize',
                  background: mode === m ? 'rgba(196,163,90,0.15)' : 'transparent',
                  color: mode === m ? 'var(--ac1)' : 'var(--cream-4)',
                  border: `1px solid ${mode === m ? 'rgba(196,163,90,0.4)' : 'rgba(196,163,90,0.1)'}`,
                }}
                title={MODE_DESCS[m]}
              >
                {m}
              </button>
            ))}
          </div>

          <div className={`flex gap-2 flex-wrap ${inline ? 'items-center' : ''}`}>
            {(['en', 'hi', 'mr', 'ta'] as AskLang[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className="px-2.5 py-1 text-xs transition-all duration-200"
                style={{
                  fontFamily: 'DM Mono, monospace',
                  fontSize: '0.65rem',
                  background: lang === l ? '#c4a35a' : 'transparent',
                  color: lang === l ? '#080c1a' : 'rgba(242,237,224,0.4)',
                  border: `1px solid ${lang === l ? '#c4a35a' : 'rgba(196,163,90,0.1)'}`,
                }}
              >
                {LANG_NAMES[l]}
              </button>
            ))}
            <div
              className="ml-auto flex items-center gap-1"
              style={{ borderLeft: '1px solid rgba(196,163,90,0.1)', paddingLeft: '0.5rem' }}
            >
              {(['debates', 'writings', 'both'] as SearchIn[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setSearchIn(s)}
                  className="px-2 py-1 text-xs transition-colors"
                  style={{
                    fontFamily: 'DM Mono, monospace',
                    fontSize: '0.55rem',
                    letterSpacing: '0.08em',
                    textTransform: 'capitalize',
                    color: searchIn === s ? 'var(--ac1)' : 'var(--cream-3)',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
            {inline && messages.length > 0 && (
              <button
                onClick={clearHistory}
                className="px-2 py-1 transition-colors"
                title="Clear history"
                aria-label="Clear history"
                style={{ color: 'var(--cream-35)', fontFamily: 'DM Mono, monospace', fontSize: '0.55rem', letterSpacing: '0.08em' }}
              >
                CLEAR
              </button>
            )}
          </div>
        </div>

        {/* Messages + Sources split */}
        <div className="flex-1 flex overflow-hidden">
          {/* Messages */}
          <div className={`flex-1 overflow-y-auto px-5 ${inline ? 'py-3' : 'py-4'}`}>
            {/* Suggested questions */}
            {messages.length === 0 && (
              <div>
                <div className={`museum-label ${inline ? 'mb-2' : 'mb-3'}`} style={{ fontSize: '0.55rem' }}>
                  Suggested Questions
                </div>
                <div className={inline ? 'grid grid-cols-1 md:grid-cols-2 gap-2' : 'flex flex-col gap-2'}>
                  {suggested.map((q) => (
                    <button
                      key={q}
                      onClick={() => sendMessage(q)}
                      className={`text-left px-3 ${inline ? 'py-1.5' : 'py-2.5'} text-sm transition-all duration-200 group`}
                      style={{
                        background: 'transparent',
                        border: '1px solid rgba(196,163,90,0.12)',
                        color: 'var(--cream-6)',
                        fontSize: '0.8rem',
                        lineHeight: 1.5,
                      }}
                    >
                      <span className="group-hover:text-ivory transition-colors">{q}</span>
                    </button>
                  ))}
                </div>

                {/* Welcome */}
                {!inline && (
                <div
                  className="mt-6 p-4 text-sm leading-relaxed"
                  style={{
                    background: 'rgba(196,163,90,0.04)',
                    border: '1px solid rgba(196,163,90,0.1)',
                    color: 'var(--cream-5)',
                    fontStyle: 'italic',
                    fontSize: '0.8rem',
                  }}
                >
                  <span style={{ color: 'var(--ac1)', fontStyle: 'normal', fontFamily: 'DM Mono, monospace', fontSize: '0.6rem' }}>
                    AMBEDKAR ARCHIVE ·
                  </span>{' '}
                  Ask about Ambedkar's life, writings, constitutional debates, philosophy,
                  and legacy. I draw from the full archive of primary sources, speeches, and scholarly works.
                </div>
                )}
              </div>
            )}

            {/* Conversation */}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`mb-4 ${msg.role === 'user' ? 'flex justify-end' : ''}`}
              >
                {msg.role === 'user' ? (
                  <div
                    className="max-w-xs px-4 py-3 text-sm leading-relaxed"
                    style={{
                      background: 'rgba(196,163,90,0.12)',
                      border: '1px solid rgba(196,163,90,0.2)',
                      color: 'var(--fg1)',
                      fontSize: '0.875rem',
                    }}
                  >
                    {msg.content}
                  </div>
                ) : (
                  <div>
                    <div
                      className="flex items-center gap-2 mb-2"
                      style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.55rem', color: 'rgba(196,163,90,0.6)', letterSpacing: '0.1em' }}
                    >
                      <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: 'rgba(196,163,90,0.1)', border: '1px solid rgba(196,163,90,0.3)' }}>
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="#c4a35a">
                          <path d="M4 0a4 4 0 100 8A4 4 0 004 0zm.3 6.2H3.7V3.7h.6v2.5zm0-3.3H3.7v-.6h.6v.6z" />
                        </svg>
                      </div>
                      ASK AMBEDKAR
                      {msg.cached && (
                        <span
                          style={{
                            marginLeft: '0.4rem',
                            padding: '1px 6px',
                            background: 'rgba(143,191,127,0.15)',
                            color: '#8fbf7f',
                          }}
                        >
                          CACHED
                        </span>
                      )}
                    </div>
                    {msg.loading ? (
                      <ThinkingDots />
                    ) : (
                      <>
                        <div
                          className="text-sm leading-relaxed mb-2"
                          style={{ color: 'var(--cream-85)', fontWeight: 300, fontSize: '0.875rem' }}
                        >
                          {msg.content}
                        </div>
                        {msg.sources && msg.sources.length > 0 && (
                          <button
                            onClick={() => { setActiveSources(msg.sources!); setShowSources(true); }}
                            className="flex items-center gap-1.5 text-xs transition-colors"
                            style={{ fontFamily: 'DM Mono, monospace', color: 'rgba(196,163,90,0.7)', fontSize: '0.6rem', letterSpacing: '0.08em' }}
                          >
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.2">
                              <path d="M1 1h8v8H1zM3 3h4M3 5h4M3 7h2" />
                            </svg>
                            {msg.sources.length} SOURCE{msg.sources.length > 1 ? 'S' : ''}
                          </button>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Sources panel */}
          {showSources && activeSources.length > 0 && (
            <div
              className="w-52 flex-shrink-0 flex flex-col"
              style={{
                borderLeft: '1px solid rgba(196,163,90,0.12)',
                background: 'var(--bg3)',
                animation: 'fadeLeft 0.3s ease-out forwards',
              }}
            >
              <div
                className="flex items-center justify-between px-3 py-3"
                style={{ borderBottom: '1px solid rgba(196,163,90,0.1)' }}
              >
                <span
                  style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.55rem', color: 'var(--ac1)', letterSpacing: '0.12em' }}
                >
                  SOURCES
                </span>
                <button onClick={() => setShowSources(false)} style={{ color: 'var(--cream-35)' }}>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.2">
                    <path d="M1 1l8 8M9 1L1 9" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
                {activeSources.map((s) => (
                  <SourceCard key={s.id} source={s} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Input area */}
        <div
          className={inline ? 'flex-shrink-0 px-4 py-2.5' : 'flex-shrink-0 p-4'}
          style={{ borderTop: '1px solid rgba(196,163,90,0.12)' }}
        >
          <div
            className="flex items-end gap-2"
            style={{ background: 'var(--bg3)', border: '1px solid var(--ac-border)', padding: '10px 12px' }}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(input);
                }
              }}
              placeholder="Ask a question…"
              rows={inline ? 1 : 2}
              className="flex-1 bg-transparent outline-none resize-none text-sm"
              style={{
                fontFamily: 'Source Sans 3, sans-serif',
                color: 'var(--fg1)',
                fontSize: '0.875rem',
                lineHeight: 1.5,
              }}
            />
            <div className="flex items-center gap-2">
              {/* Stop speaking */}
              {speaking && (
                <button
                  onClick={stopSpeaking}
                  className="p-1.5 transition-colors"
                  title="Stop speaking"
                  style={{ color: '#c4a35a' }}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                    <rect x="3" y="3" width="8" height="8" />
                  </svg>
                </button>
              )}

              {/* Voice input */}
              <button
                onClick={listening ? stopVoice : startVoice}
                className="p-1.5 transition-colors"
                title={listening ? 'Stop listening' : 'Voice input'}
                style={{ color: listening ? '#c4a35a' : 'var(--cream-35)' }}
              >
                {listening ? (
                  <div className="flex items-center gap-0.5 h-4">
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="wave-bar"
                        style={{
                          width: 2,
                          height: '100%',
                          background: 'var(--ac1)',
                          transformOrigin: 'center',
                          '--dur': `${0.5 + i * 0.1}s`,
                          '--delay': `${i * 0.08}s`,
                        } as React.CSSProperties}
                      />
                    ))}
                  </div>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3">
                    <rect x="5" y="1" width="4" height="8" rx="2" />
                    <path d="M2 7a5 5 0 0010 0M7 12v2" />
                  </svg>
                )}
              </button>

              {/* Send */}
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || loading}
                className="p-1.5 transition-all duration-200"
                style={{
                  color: input.trim() && !loading ? '#c4a35a' : 'rgba(196,163,90,0.25)',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
                  <path d="M2 8h12M10 3l5 5-5 5" />
                </svg>
              </button>
            </div>
          </div>
          <div
            className="flex justify-between mt-2 text-xs"
            style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.55rem', color: 'var(--cream-25)', letterSpacing: '0.08em' }}
          >
            <span>↵ SEND · SHIFT+↵ NEW LINE</span>
            <span>{MODE_DESCS[mode]}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
