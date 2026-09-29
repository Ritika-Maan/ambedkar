import { useState, useRef } from 'react';
import type { AskContext } from '../types';

interface Props {
  onAskWithContext: (ctx: AskContext) => void;
}

const TRACKS = [
  {
    id: 'closing-speech',
    title: 'Closing Speech to the Constituent Assembly',
    type: 'speech' as const,
    year: 1949,
    duration: '3:24:00',
    description: 'The landmark address of 25 November 1949 — Ambedkar\'s vision for Indian democracy, constitutional morality, and the dangers of hero-worship.',
    transcript: [
      'Sir, looking back on the work of the Constituent Assembly, I feel somewhat satisfied...',
      '...on the 26th of January 1950, India will be an independent country.',
      'What would happen to her independence? Will she maintain it or will she lose it again?',
      'This is the first thought that comes to my mind.',
    ],
  },
  {
    id: 'conversion-address',
    title: 'Address at the Conversion Ceremony, Nagpur',
    type: 'speech' as const,
    year: 1956,
    duration: '1:12:00',
    description: 'The historic address at Deeksha Bhumi, Nagpur on 14 October 1956 — Ambedkar\'s final public declaration and the founding of Navayana Buddhism.',
    transcript: [
      'I am not the first to have adopted Buddhism...',
      '...I have come to take refuge in the Buddha, the Dhamma, and the Sangha.',
      'From today I am not a Hindu. I will never return to Hinduism.',
    ],
  },
  {
    id: 'labour-speech',
    title: 'On the Labour Policy of India',
    type: 'speech' as const,
    year: 1943,
    duration: '0:55:00',
    description: 'Address to the Indian Labour Conference, outlining Ambedkar\'s framework for workers\' rights, minimum wages, and social security.',
    transcript: [
      'The Labour policy of a country must be based on its social structure...',
      '...the caste system is the greatest hindrance to a rational distribution of labour.',
    ],
  },
  {
    id: 'buddha-marx',
    title: 'The Buddha or Karl Marx',
    type: 'reading' as const,
    year: 1956,
    duration: '1:08:00',
    description: 'A reading of the seminal essay comparing the paths of Buddhist liberation and Marxist revolution, delivered at Kathmandu.',
    transcript: [
      'The question may be asked: what is to be compared?',
      'I am going to compare the Buddha and Karl Marx as teachers of a new social order...',
    ],
  },
];

function WaveformViz({ playing }: { playing: boolean }) {
  return (
    <div className="flex items-end gap-0.5 h-8">
      {Array.from({ length: 40 }).map((_, i) => {
        const baseH = 15 + Math.sin(i * 0.6) * 10 + Math.cos(i * 0.3) * 6;
        return (
          <div
            key={i}
            style={{
              width: 3,
              height: `${baseH}%`,
              background: i % 5 === 0 ? '#c4a35a' : 'rgba(196,163,90,0.35)',
              transformOrigin: 'bottom',
              animation: playing ? `waveBar ${0.4 + (i % 4) * 0.15}s ease-in-out ${i * 0.03}s infinite` : 'none',
              transition: 'height 0.3s ease',
            }}
          />
        );
      })}
    </div>
  );
}

export default function AudioVisual({ onAskWithContext }: Props) {
  const [activeTrack, setActiveTrack] = useState(TRACKS[0]);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeTranscript, setActiveTranscript] = useState(0);
  const progressRef = useRef<HTMLDivElement>(null);

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (progressRef.current) {
      const rect = progressRef.current.getBoundingClientRect();
      const pct = (e.clientX - rect.left) / rect.width;
      setProgress(Math.max(0, Math.min(1, pct)));
    }
  };

  const selectTrack = (t: typeof TRACKS[0]) => {
    setActiveTrack(t);
    setPlaying(false);
    setProgress(0);
    setActiveTranscript(0);
  };

  return (
    <section
      id="audiovisual"
      className="py-24"
      style={{ background: 'var(--bg3)' }}
    >
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="mb-12">
          <div className="museum-label mb-4">Sound Archive</div>
          <h2
            className="museum-heading text-5xl mb-4"
            style={{ fontFamily: 'Fraunces, serif', color: 'var(--cream-full)' }}
          >
            Audio &amp; Visual
          </h2>
          <p
            className="max-w-lg text-base leading-relaxed"
            style={{ color: 'var(--cream-55)', fontWeight: 300 }}
          >
            Speeches, readings, and recorded addresses from the archive — hear the
            voice of constitutional history.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          {/* Main player */}
          <div
            className="p-6"
            style={{ background: 'var(--bg2)', border: '1px solid var(--ac-border)' }}
          >
            {/* Track info */}
            <div className="flex items-start justify-between mb-6 gap-4">
              <div>
                <div className="museum-label mb-2" style={{ fontSize: '0.55rem' }}>
                  {activeTrack.type.toUpperCase()} · {activeTrack.year}
                </div>
                <h3
                  className="text-xl font-semibold mb-2 leading-snug"
                  style={{ fontFamily: 'Fraunces, serif', color: 'var(--cream-full)' }}
                >
                  {activeTrack.title}
                </h3>
                <p className="text-sm" style={{ color: 'var(--cream-5)', fontWeight: 300 }}>
                  {activeTrack.description}
                </p>
              </div>
              <div
                className="flex-shrink-0 text-sm"
                style={{ fontFamily: 'DM Mono, monospace', color: 'var(--cream-4)', fontSize: '0.75rem' }}
              >
                {activeTrack.duration}
              </div>
            </div>

            {/* Waveform */}
            <div
              className="mb-6 p-4"
              style={{ background: 'rgba(196,163,90,0.04)', border: '1px solid rgba(196,163,90,0.1)' }}
            >
              <WaveformViz playing={playing} />
            </div>

            {/* Progress bar */}
            <div
              ref={progressRef}
              className="relative h-1 mb-4 cursor-pointer group"
              style={{ background: 'rgba(196,163,90,0.15)' }}
              onClick={handleProgressClick}
            >
              <div
                className="absolute left-0 top-0 h-full transition-all"
                style={{ width: `${progress * 100}%`, background: 'var(--ac1)' }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                style={{
                  left: `calc(${progress * 100}% - 6px)`,
                  background: 'var(--ac1)',
                  border: '2px solid #080c1a',
                }}
              />
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Rewind */}
                <button
                  onClick={() => setProgress((p) => Math.max(0, p - 0.05))}
                  className="transition-colors"
                  style={{ color: 'var(--cream-5)' }}
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
                    <path d="M8 4L2 9l6 5V4zM16 4l-6 5 6 5V4z" />
                  </svg>
                </button>

                {/* Play/Pause */}
                <button
                  onClick={() => setPlaying(!playing)}
                  className="w-12 h-12 rounded-full flex items-center justify-center transition-colors"
                  style={{ background: 'var(--ac1)' }}
                >
                  {playing ? (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="#080c1a">
                      <rect x="3" y="2" width="4" height="12" />
                      <rect x="9" y="2" width="4" height="12" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="#080c1a">
                      <path d="M4 2l10 6-10 6V2z" />
                    </svg>
                  )}
                </button>

                {/* Forward */}
                <button
                  onClick={() => setProgress((p) => Math.min(1, p + 0.05))}
                  className="transition-colors"
                  style={{ color: 'var(--cream-5)' }}
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
                    <path d="M10 4l6 5-6 5V4zM2 4l6 5-6 5V4z" />
                  </svg>
                </button>
              </div>

              {/* Ask button */}
              <button
                onClick={() => onAskWithContext({ type: 'book', id: activeTrack.id, title: activeTrack.title })}
                className="flex items-center gap-2 px-4 py-2 text-xs tracking-[0.1em] uppercase transition-colors"
                style={{
                  fontFamily: 'DM Mono, monospace',
                  color: '#c4a35a',
                  border: '1px solid rgba(196,163,90,0.3)',
                  fontSize: '0.6rem',
                }}
              >
                Ask Ambedkar
              </button>
            </div>

            {/* Synchronized transcript */}
            <div
              className="mt-6 pt-5"
              style={{ borderTop: '1px solid rgba(196,163,90,0.1)' }}
            >
              <div className="museum-label mb-3" style={{ fontSize: '0.55rem' }}>
                Transcript
              </div>
              <div className="flex flex-col gap-2">
                {activeTrack.transcript.map((line, i) => (
                  <p
                    key={i}
                    className="text-sm leading-relaxed transition-colors duration-300 cursor-pointer"
                    onClick={() => setActiveTranscript(i)}
                    style={{
                      color: activeTranscript === i
                        ? 'var(--cream-full)'
                        : 'var(--cream-35)',
                      fontStyle: 'italic',
                      fontSize: '0.8125rem',
                      fontWeight: activeTranscript === i ? 400 : 300,
                      borderLeft: activeTranscript === i
                        ? '2px solid #c4a35a'
                        : '2px solid transparent',
                      paddingLeft: '0.75rem',
                    }}
                  >
                    {line}
                  </p>
                ))}
              </div>
            </div>
          </div>

          {/* Track list */}
          <div className="flex flex-col gap-3">
            <div className="museum-label mb-2">Archive Tracks</div>
            {TRACKS.map((track) => (
              <button
                key={track.id}
                onClick={() => selectTrack(track)}
                className="text-left p-4 transition-all duration-200 group"
                style={{
                  background: activeTrack.id === track.id ? '#1a2035' : '#0d1326',
                  border: `1px solid ${activeTrack.id === track.id ? 'rgba(196,163,90,0.35)' : 'rgba(196,163,90,0.1)'}`,
                }}
              >
                <div
                  className="text-xs mb-1.5 flex items-center justify-between"
                  style={{
                    fontFamily: 'DM Mono, monospace',
                    fontSize: '0.6rem',
                    color: activeTrack.id === track.id ? '#c4a35a' : 'rgba(196,163,90,0.5)',
                  }}
                >
                  <span>{track.type.toUpperCase()} · {track.year}</span>
                  <span style={{ color: 'rgba(242,237,224,0.35)' }}>{track.duration}</span>
                </div>
                <div
                  className="text-sm font-medium leading-snug"
                  style={{
                    fontFamily: 'Fraunces, serif',
                    color: activeTrack.id === track.id ? '#f2ede0' : 'rgba(242,237,224,0.6)',
                    fontSize: '0.875rem',
                  }}
                >
                  {track.title}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
