import { useEffect, useState, useRef } from 'react';
import ambedkarFullBody from '../imports/image.png';
import constitutionBook from '../imports/constitution-book.png';
import type { AskContext } from '../types';
import ConstitutionReadingRoom from './ConstitutionReadingRoom';

interface Props {
  onEnterArchive: () => void;
  onOpenAsk: () => void;
  onAskWithContext: (ctx: AskContext) => void;
}

// Context handed to the existing Ask Ambedkar component when the Hero book is opened
const HERO_BOOK_CONTEXT: AskContext = {
  type: 'book',
  id: 'constitution-of-india',
  title: 'The Constitution of India',
  description:
    "The Constitution of India — the foundational document of the Republic, drafted under the chairmanship of Dr. B. R. Ambedkar.",
};

const FLOAT_LABELS = ['EQUALITY', 'JUSTICE', 'CONSTITUTION', 'DEMOCRACY'];

export default function Hero({ onEnterArchive, onOpenAsk }: Props) {
  const [visible, setVisible] = useState(false);
  const [bookHover, setBookHover] = useState(false);
  const [bookOpening, setBookOpening] = useState(false);
  const bookBtnRef = useRef<HTMLButtonElement>(null);
  const [parallaxY, setParallaxY] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      if (heroRef.current) {
        const rect = heroRef.current.getBoundingClientRect();
        if (rect.bottom > 0) setParallaxY(window.scrollY * 0.28);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <section
      id="home"
      ref={heroRef}
      className="relative min-h-screen flex items-center overflow-hidden"
      style={{ background: 'linear-gradient(135deg, var(--bg1) 0%, var(--bg2) 60%, var(--bg1) 100%)' }}
    >
      {/* Archival atmosphere — deep midnight navy / charcoal spotlight behind the portrait */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 34% 78% at 84% 52%, rgba(20,30,58,0.95) 0%, rgba(14,20,38,0.7) 45%, transparent 100%),' +
            'radial-gradient(ellipse 45% 90% at 5% 55%, rgba(0,0,0,0.25) 0%, transparent 100%),' +
            'radial-gradient(ellipse 22% 40% at 84% 40%, rgba(196,163,90,0.08) 0%, transparent 100%)',
        }}
      />
      {/* Very subtle grain for archival depth */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: 0.05,
          mixBlendMode: 'overlay',
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
        }}
      />

      {/* ——— Right: full-body Ambedkar — large, dominant, uncropped ——— */}
      <div
        className="absolute right-0 bottom-0 pointer-events-none flex items-end justify-end"
        style={{
          top: '4.5rem',
          width: '62%',
          transform: `translateY(${parallaxY * -0.07}px)`,
        }}
      >
        <div className="relative h-full" style={{ aspectRatio: '432 / 720', maxWidth: '100%' }}>
          <img
            src={ambedkarFullBody}
            alt="Dr. B. R. Ambedkar, full-length portrait"
            className="block w-full h-full"
            style={{
              objectFit: 'contain',
              objectPosition: 'bottom right',
              /* Feather only the portrait's own backdrop into the navy hero; the figure stays intact */
              WebkitMaskImage:
                'linear-gradient(to right, transparent 0%, black 26%, black 88%, transparent 100%), linear-gradient(to bottom, transparent 0%, black 9%, black 100%)',
              WebkitMaskComposite: 'source-in',
              maskImage:
                'linear-gradient(to right, transparent 0%, black 26%, black 88%, transparent 100%), linear-gradient(to bottom, transparent 0%, black 9%, black 100%)',
              maskComposite: 'intersect',
            }}
          />
        </div>
      </div>

      {/* Floating thematic labels */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {FLOAT_LABELS.map((label, i) => (
          <span
            key={label}
            className={`absolute float-label-${i + 1}`}
            style={{
              fontFamily: 'DM Mono, monospace',
              fontSize: '0.58rem',
              letterSpacing: '0.28em',
              color: 'var(--ac1)',
              opacity: 0.45,
              top: `${18 + i * 17}%`,
              right: `${1.5 + (i % 2) * 2}%`,
              transform: 'rotate(90deg)',
              transformOrigin: 'right center',
            }}
          >
            {label}
          </span>
        ))}
      </div>

      {/* Main content — left column */}
      <div className="relative z-10 max-w-[1400px] mx-auto px-6 pt-24 pb-16 w-full">
        {/* Text block intentionally narrower so image overlaps */}
        <div className="max-w-[460px]">

          {/* Museum label */}
          <div
            className="museum-label mb-8 section-reveal section-reveal-1"
            style={{ opacity: visible ? undefined : 0 }}
          >
            The Hall of Knowledge
          </div>

          {/* Main heading */}
          <h1
            className="museum-heading section-reveal section-reveal-2"
            style={{
              fontFamily: 'Fraunces, serif',
              fontSize: 'clamp(2.8rem, 5.5vw, 5.2rem)',
              color: 'var(--fg1)',
              lineHeight: 1.04,
              opacity: visible ? undefined : 0,
            }}
          >
            Ideas That<br />
            <em style={{ color: 'var(--ac1)', fontStyle: 'italic' }}>Shaped</em> a Nation.
          </h1>

          {/* Gold divider */}
          <div
            className="museum-divider section-reveal section-reveal-3"
            style={{ opacity: visible ? undefined : 0, background: 'var(--ac1)' }}
          />

          {/* Description */}
          <p
            className="text-base leading-relaxed mb-10 section-reveal section-reveal-4"
            style={{
              color: 'var(--fg2)',
              fontFamily: 'Source Sans 3, sans-serif',
              fontWeight: 300,
              opacity: visible ? undefined : 0,
              maxWidth: 400,
            }}
          >
            An immersive journey through the life, writings, and enduring
            philosophy of Dr. B.&nbsp;R.&nbsp;Ambedkar — architect of the
            Indian Constitution, champion of social justice.
          </p>

          {/* CTA buttons */}
          <div
            className="flex flex-wrap gap-4 section-reveal section-reveal-5"
            style={{ opacity: visible ? undefined : 0 }}
          >
            <button
              onClick={onEnterArchive}
              className="group flex items-center gap-3 px-7 py-3.5 text-xs tracking-[0.16em] uppercase transition-all duration-300"
              style={{
                fontFamily: 'DM Mono, monospace',
                background: 'var(--ac1)',
                color: 'var(--bg1)',
              }}
            >
              Enter the Archive
              <svg
                width="14" height="14" viewBox="0 0 14 14" fill="none"
                stroke="currentColor" strokeWidth="1.6"
                className="transition-transform duration-300 group-hover:translate-x-1"
              >
                <path d="M1 7h12M8 2l5 5-5 5" />
              </svg>
            </button>

            <button
              onClick={onOpenAsk}
              className="group flex items-center gap-3 px-7 py-3.5 text-xs tracking-[0.16em] uppercase transition-all duration-300"
              style={{
                fontFamily: 'DM Mono, monospace',
                color: 'var(--ac1)',
                border: '1px solid var(--ac-border-h)',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4">
                <circle cx="7" cy="7" r="5.5" />
                <path d="M7 4v4M7 9.5v.5" />
              </svg>
              Ask Ambedkar
            </button>
          </div>

          {/* Stats strip */}
          <div
            className="mt-16 pt-8 grid grid-cols-3 gap-6 section-reveal section-reveal-6"
            style={{
              borderTop: '1px solid var(--ac-border)',
              opacity: visible ? undefined : 0,
            }}
          >
            {[
              { n: '1891–1956', l: 'Life Span'              },
              { n: '40+',       l: 'Published Works'        },
              { n: '395',       l: 'Constitutional Articles' },
            ].map(({ n, l }) => (
              <div key={l}>
                <div
                  className="text-xl font-light mb-1"
                  style={{ fontFamily: 'Fraunces, serif', color: 'var(--ac1)' }}
                >
                  {n}
                </div>
                <div className="museum-label" style={{ fontSize: '0.58rem', letterSpacing: '0.16em' }}>
                  {l}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ——— Separate interactive book — the ONLY clickable Hero object ——— */}
      <div
        className="absolute z-20 pointer-events-none w-[64px] right-[3%] bottom-[3%] md:right-auto md:bottom-auto md:left-[52%] md:top-1/2 md:-translate-y-1/2 md:w-[clamp(130px,12.5vw,210px)]"
      >
        <button
          type="button"
          ref={bookBtnRef}
          onClick={() => setBookOpening(true)}
          onMouseEnter={() => setBookHover(true)}
          onMouseLeave={() => setBookHover(false)}
          onFocus={() => setBookHover(true)}
          onBlur={() => setBookHover(false)}
          aria-label="Ask Ambedkar about The Constitution of India"
          title="Ask Ambedkar about The Constitution of India"
          className="block w-full p-0 border-0 bg-transparent pointer-events-auto cursor-pointer outline-none"
          style={{
            transform: bookHover ? 'translateY(-8px)' : 'translateY(0)',
            transition: 'transform 320ms ease, filter 320ms ease',
            filter: bookHover
              ? 'drop-shadow(0 22px 26px rgba(0,0,0,0.6)) drop-shadow(0 0 14px rgba(196,163,90,0.38))'
              : 'drop-shadow(0 14px 20px rgba(0,0,0,0.55)) drop-shadow(0 0 6px rgba(196,163,90,0.16))',
          }}
        >
          <img
            src={constitutionBook}
            alt="The Constitution of India"
            draggable={false}
            className="block w-full h-auto select-none"
          />
        </button>
      </div>

      {/* Constitution reading room: 3D book opening + the existing Ask Ambedkar component underneath it */}
      {bookOpening && (
        <ConstitutionReadingRoom
          context={HERO_BOOK_CONTEXT}
          onClose={() => { setBookOpening(false); bookBtnRef.current?.focus({ preventScroll: true }); }}
        />
      )}

      {/* Scroll indicator */}
      <div
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        style={{ opacity: 0.35 }}
      >
        <span
          style={{
            fontFamily: 'DM Mono, monospace',
            color: 'var(--ac1)',
            fontSize: '0.58rem',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
          }}
        >
          Scroll to explore
        </span>
        <div className="w-px h-8 overflow-hidden" style={{ background: 'var(--ac-border)' }}>
          <div
            className="w-full"
            style={{
              height: '50%',
              background: 'var(--ac1)',
              animation: 'scanLine 1.8s ease-in-out infinite',
            }}
          />
        </div>
      </div>
    </section>
  );
}
