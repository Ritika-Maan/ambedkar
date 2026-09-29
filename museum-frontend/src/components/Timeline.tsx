import { useEffect, useRef, useState } from 'react';
import type { TimelineEvent, AskContext } from '../types';
import mahadImg from '../imports/timeline/mahad.jpg';
import poonaPactImg from '../imports/timeline/poona-pact.jpg';
import lawMinisterImg from '../imports/timeline/law-minister.jpg';
import conversionImg from '../imports/timeline/conversion.jpg';
import deathImg from '../imports/timeline/death.jpg';
import columbiaImg from '../imports/timeline/columbia.jpg';
import constituentAssemblyImg from '../imports/timeline/constituent-assembly.jpg';

interface Props {
  onAskWithContext: (ctx: AskContext) => void;
}

/* ——— Data (unchanged) ——— */
const EVENTS: TimelineEvent[] = [
  { id: 'birth', year: 1891, month: 4, title: 'Birth in Mhow', description: 'Bhimrao Ramji Ambedkar born on 14 April in Mhow (now Dr. Ambedkar Nagar), Central India, the fourteenth child of Ramji Maloji Sakpal and Bhimabai.', category: 'birth', significance: 3 },
  { id: 'high-school', year: 1907, title: 'Matriculation', description: 'Passes matriculation examination from Elphinstone High School, Bombay — a rare achievement for a Dalit student of the time.', category: 'education', significance: 2 },
  { id: 'columbia', year: 1913, title: 'Columbia University', description: 'Awarded a Baroda State scholarship and departs for New York. Enrolled at Columbia University under Professor John Dewey — a transformative intellectual encounter.', category: 'education', significance: 3 },
  { id: 'castes-in-india', year: 1916, title: 'Castes in India', description: "Presents \"Castes in India: Their Mechanism, Genesis and Development\" at Columbia's anthropology seminar — his first major scholarly contribution.", category: 'writing', significance: 2 },
  { id: 'lse', year: 1916, title: 'London School of Economics', description: "Enrolled at LSE and simultaneously joined Gray's Inn to study law. Returns to India to fulfill his Baroda scholarship obligation.", category: 'education', significance: 2 },
  { id: 'baroda-suffering', year: 1917, title: 'Returns to India', description: 'Returns to Baroda but faces severe caste-based discrimination. No lodging will accept him; colleagues refuse to share papers with him. Records the experience in "Waiting for a Visa."', category: 'milestone', significance: 2 },
  { id: 'mooknayak', year: 1920, title: 'Mooknayak Founded', description: 'Launches the fortnightly newspaper Mooknayak ("Leader of the Voiceless") with financial support from the Maharaja of Kolhapur — a pioneering press voice for Dalit communities.', category: 'politics', significance: 2 },
  { id: 'dsc', year: 1923, title: 'Problem of the Rupee', description: 'Awarded DSc (Economics) from the University of London for "The Problem of the Rupee: Its Origin and Its Solution" — the scholarly foundation for the Reserve Bank of India.', category: 'education', significance: 2 },
  { id: 'bahishkrit', year: 1924, title: 'Bahishkrit Hitakarini Sabha', description: 'Founds the Bahishkrit Hitakarini Sabha to promote education, social and economic improvement, and to represent the interests of Depressed Classes.', category: 'politics', significance: 2 },
  { id: 'mahad', year: 1927, month: 3, title: 'Mahad Satyagraha', description: 'Leads the historic Mahad Satyagraha — a public march to the Mahad tank to assert the rights of Dalits to use public water sources. Burns the Manusmriti in a symbolic act of defiance.', category: 'politics', significance: 3 },
  { id: 'rtc', year: 1930, title: 'Round Table Conference', description: 'Represents the Depressed Classes at the First Round Table Conference in London, demanding separate electorates as a constitutional safeguard.', category: 'politics', significance: 3 },
  { id: 'poona-pact', year: 1932, month: 9, title: 'Poona Pact', description: "After Gandhi's \"fast unto death\" against separate electorates, Ambedkar reaches an agreement preserving political representation for Dalits through reserved seats in joint electorates.", category: 'politics', significance: 3 },
  { id: 'nasik', year: 1935, title: 'Declaration at Nasik', description: '"I was born a Hindu, but I will not die a Hindu." — signaling a momentous shift in his religio-political philosophy.', category: 'milestone', significance: 3 },
  { id: 'annihilation', year: 1936, title: 'Annihilation of Caste', description: 'Writes and prepares to deliver "Annihilation of Caste" — suppressed by the Jat-Pat-Todak Mandal for its radical critique. Self-publishes, producing one of his most influential works.', category: 'writing', significance: 3 },
  { id: 'labour-member', year: 1942, title: "Viceroy's Executive Council", description: "Appointed Labour Member of the Viceroy's Executive Council — the highest office yet held by any Dalit leader in colonial India.", category: 'politics', significance: 2 },
  { id: 'constituent-assembly', year: 1946, title: 'Constituent Assembly', description: 'Elected to the Constituent Assembly from Bombay and elected Chair of the Drafting Committee — charged with drafting the constitution of free India.', category: 'constitution', significance: 3 },
  { id: 'draft-constitution', year: 1948, month: 2, title: 'Draft Constitution Presented', description: 'The Drafting Committee presents the first complete draft of the Indian Constitution to the Assembly — the culmination of 18 months of extraordinary intellectual labor.', category: 'constitution', significance: 3 },
  { id: 'constitution-adopted', year: 1949, month: 11, title: 'Constitution Adopted', description: "The Constituent Assembly adopts the Constitution of India on 26 November 1949. Ambedkar's closing speech is a masterwork of constitutional philosophy and democratic vision.", category: 'constitution', significance: 3 },
  { id: 'law-minister', year: 1950, title: 'Law Minister of India', description: 'Serves as the first Law Minister of independent India and works on the Hindu Code Bill — a sweeping reform of Hindu personal law.', category: 'politics', significance: 2 },
  { id: 'resignation', year: 1951, title: 'Resignation from Cabinet', description: "Resigns from the Cabinet in September, citing the stalling of the Hindu Code Bill and disagreement with Nehru's Kashmir policy.", category: 'politics', significance: 2 },
  { id: 'conversion', year: 1956, month: 10, title: 'Conversion to Buddhism', description: 'On 14 October 1956 in Nagpur, Ambedkar and approximately 600,000 followers convert to Buddhism — the culmination of his search for a rational, egalitarian faith.', category: 'religion', significance: 3 },
  { id: 'death', year: 1956, month: 12, title: 'Mahaparinirvana', description: "Dr. B. R. Ambedkar passes away on 6 December 1956 at his home in Delhi. His legacy endures in the Constitution, in millions of lives transformed, and in the continuing struggle for social justice.", category: 'death', significance: 3 },
];


/* ——— Archival photographs (Wikimedia Commons, public domain) ———
   Only photographs whose subject matches the event are listed. Every other event
   shows the restrained archival plate below instead of an unrelated picture. */
const commons = (file: string) =>
  `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=900`;

const PHOTOS: Record<string, { src: string; caption: string; position?: string; source?: string }> = {
  rtc: {
    src: commons('Dr. Babasaheb Ambedkar with Sir Muhammad Zafarullah Khan, standing outside the House of Commons when they participated in the 2nd Round Table Conference on Sept. 1931.jpg'),
    caption: 'Outside the House of Commons, Second Round Table Conference, September 1931',
    source: 'Wikimedia Commons',
    position: 'center 20%',
  },
  'draft-constitution': {
    src: commons('Dr. Babasaheb Ambedkar Chairman, Drafting Committee of the Indian Constitution with other members on Aug. 29, 1947.jpg'),
    caption: 'The Drafting Committee with its Chairman, 29 August 1947',
    source: 'Wikimedia Commons',
    position: 'center 30%',
  },
  'constitution-adopted': {
    src: commons('Dr. Babasaheb Ambedkar, chairman of the Drafting Committee, presenting the final draft of the Indian Constitution to Dr Rajendra Prasad on 25 November, 1949.jpg'),
    caption: 'Presenting the final draft to Dr. Rajendra Prasad, 25 November 1949',
    source: 'Wikimedia Commons',
    position: 'center 30%',
  },

  mahad: {
    src: mahadImg,
    caption: 'Depiction of the Mahad Satyagraha march to the Chavdar Tank, 1927',
    position: 'center 30%',
  },
  'poona-pact': {
    src: poonaPactImg,
    caption: 'Painting depicting the signing of the Poona Pact, 1932',
    position: 'center 40%',
  },
  'law-minister': {
    src: lawMinisterImg,
    caption: 'Ambedkar addressing the House',
    position: 'center 25%',
  },
  conversion: {
    src: conversionImg,
    caption: 'Ambedkar, garlanded, with a Buddha relief',
    position: 'center 22%',
  },
  death: {
    src: deathImg,
    caption: 'The funeral procession, December 1956',
    position: 'center 55%',
  },
  columbia: {
    src: columbiaImg,
    caption: 'Ambedkar, Doctor of Laws (honoris causa), Columbia University, 5 June 1952',
    position: 'center 30%',
  },
  'constituent-assembly': {
    src: constituentAssemblyImg,
    caption: 'The Constituent Assembly in session',
    position: 'center 35%',
  },
};

/* Place line for the archival plate (used when no matching photograph is on file) */
const PLATE_PLACE: Record<string, string> = {
  birth: 'Mhow, Central India',
  'high-school': 'Elphinstone High School, Bombay',
  columbia: 'Columbia University, New York',
  'castes-in-india': 'Columbia University, New York',
  lse: 'London',
  'baroda-suffering': 'Baroda',
  mooknayak: 'Bombay',
  dsc: 'University of London',
  bahishkrit: 'Bombay',
  mahad: 'Mahad, Maharashtra',
  'poona-pact': 'Poona',
  nasik: 'Nasik, Maharashtra',
  annihilation: 'Lahore · Bombay',
  'labour-member': 'New Delhi',
  'constituent-assembly': 'New Delhi',
  'law-minister': 'New Delhi',
  resignation: 'New Delhi',
  conversion: 'Nagpur',
  death: 'Delhi',
};

function ArchivalPlate({ place, color }: { place: string; color: string }) {
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center text-center px-6"
      style={{
        background:
          'radial-gradient(ellipse at 50% 40%, rgba(196,163,90,0.10) 0%, transparent 70%), linear-gradient(160deg, #1b1a16 0%, #12141c 100%)',
      }}
    >
      <div style={{ width: 28, height: 1, background: color, opacity: 0.7, marginBottom: 14 }} />
      <div style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontSize: '1.05rem', color: '#e8dfc6', opacity: 0.85 }}>
        {place}
      </div>
      <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.52rem', letterSpacing: '0.16em', color: '#c4a35a', opacity: 0.55, marginTop: 10 }}>
        PHOTOGRAPH NOT YET CATALOGUED
      </div>
      <div style={{ width: 28, height: 1, background: color, opacity: 0.7, marginTop: 14 }} />
    </div>
  );
}

function EventPhoto({ event, color }: { event: TimelineEvent; color: string }) {
  const photo = PHOTOS[event.id];
  const [failed, setFailed] = useState(false);
  const showPhoto = !!photo && !failed;
  return (
    <figure className="m-0">
      <div className="relative overflow-hidden" style={{ aspectRatio: '16 / 10', background: '#12141c' }}>
        {showPhoto ? (
          <img
            src={photo.src}
            alt={`${event.title} — ${photo.caption}`}
            loading="lazy"
            onError={() => setFailed(true)}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            style={{ filter: 'sepia(40%) contrast(1.05) brightness(0.88)', objectPosition: photo.position ?? 'center' }}
          />
        ) : (
          <ArchivalPlate place={PLATE_PLACE[event.id] ?? 'Archive'} color={color} />
        )}
        {/* Archival mount / frame */}
        <div
          className="absolute pointer-events-none"
          style={{ inset: 8, border: '1px solid rgba(196,163,90,0.45)', boxShadow: 'inset 0 0 0 3px rgba(0,0,0,0.18)' }}
        />
      </div>
      {showPhoto && (
        <figcaption
          style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.52rem', letterSpacing: '0.08em', color: 'var(--fg3)', padding: '6px 20px 0' }}
        >
          {photo.caption}{photo.source ? ` · ${photo.source}` : ''}
        </figcaption>
      )}
    </figure>
  );
}

const CAT_COLOR: Record<TimelineEvent['category'], string> = {
  birth: '#c4a35a',
  education: '#6ea8d9',
  writing: '#a0d488',
  politics: '#d4886a',
  constitution: '#c4a35a',
  religion: '#b08ae0',
  milestone: '#e8c878',
  death: '#8a8478',
};

const CAT_LABEL: Record<TimelineEvent['category'], string> = {
  birth: 'Birth',
  education: 'Education',
  writing: 'Writing',
  politics: 'Politics',
  constitution: 'Constitution',
  religion: 'Faith',
  milestone: 'Milestone',
  death: 'Mahaparinirvana',
};

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

/* ——— Single Event Scene ——— */
function EventScene({
  event,
  index,
  onAskWithContext,
}: {
  event: TimelineEvent;
  index: number;
  onAskWithContext: (ctx: AskContext) => void;
}) {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isLeft = index % 2 === 0;
  const color = CAT_COLOR[event.category];
  const isMajor = event.significance === 3;

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="relative"
      style={{
        paddingTop: isMajor ? '4rem' : '2rem',
        paddingBottom: isMajor ? '4rem' : '2rem',
      }}
    >
      {/* ——— Giant background year number ——— */}
      {isMajor && (
        <div
          className="absolute pointer-events-none select-none"
          style={{
            fontFamily: 'Fraunces, serif',
            fontSize: 'clamp(6rem, 14vw, 11rem)',
            fontWeight: 700,
            color: 'var(--ac1)',
            opacity: 0.04,
            lineHeight: 1,
            top: '50%',
            left: isLeft ? '-1%' : 'auto',
            right: isLeft ? 'auto' : '-1%',
            transform: 'translateY(-50%)',
            letterSpacing: '-0.03em',
            zIndex: 0,
          }}
        >
          {event.year}
        </div>
      )}

      {/* ——— Connector dot + year pill on the spine ——— */}
      <div
        className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center z-10"
        style={{ top: isMajor ? '50%' : '50%', transform: 'translate(-50%, -50%)' }}
      >
        <div
          style={{
            width: isMajor ? 14 : 9,
            height: isMajor ? 14 : 9,
            borderRadius: '50%',
            background: color,
            border: `2px solid var(--bg1)`,
            boxShadow: `0 0 0 3px ${color}40`,
            transition: 'all 0.3s ease',
          }}
        />
        {isMajor && (
          <div
            className="absolute -bottom-8 px-2 py-0.5 whitespace-nowrap"
            style={{
              fontFamily: 'DM Mono, monospace',
              fontSize: '0.58rem',
              letterSpacing: '0.12em',
              color,
              background: 'var(--bg1)',
              border: `1px solid ${color}50`,
            }}
          >
            {event.year}
          </div>
        )}
      </div>

      {/* ——— Content card ——— */}
      <div
        className={`
          relative z-10 grid grid-cols-1 md:grid-cols-[1fr_24px_1fr] gap-0
          items-center
        `}
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'none' : `translateX(${isLeft ? -28 : 28}px)`,
          transition: 'opacity 0.7s ease, transform 0.7s ease',
        }}
      >
        {/* Left column */}
        <div className={isLeft ? 'md:pr-16' : 'md:order-3 md:pl-16'}>
          <div
            className="group cursor-pointer"
            onClick={() => setExpanded(!expanded)}
            style={{
              background: 'var(--bg3)',
              border: `1px solid ${expanded ? color : 'var(--ac-border)'}`,
              transition: 'border-color 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease',
              boxShadow: expanded ? `0 8px 32px ${color}22` : 'none',
            }}
          >
            {/* Archival photograph — every event */}
            <EventPhoto event={event} color={color} />

            <div className="p-5">
              {/* Timeline marker + category */}
              <div className="flex items-center gap-2 mb-2">
                <div style={{ width: 9, height: 9, borderRadius: '50%', background: color, boxShadow: `0 0 0 3px ${color}30` }} />
                <div style={{ width: 24, height: 1, background: color, opacity: 0.5 }} />
                <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.58rem', letterSpacing: '0.14em', color }}>
                  {CAT_LABEL[event.category].toUpperCase()}
                </span>
                {event.month && (
                  <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.58rem', color: 'var(--fg3)' }}>
                    · {MONTHS[event.month - 1]}
                  </span>
                )}
              </div>

              {/* Large year */}
              <div
                style={{
                  fontFamily: 'Fraunces, serif',
                  fontSize: 'clamp(3rem, 4.8vw, 4.5rem)',
                  fontWeight: 600,
                  lineHeight: 1,
                  letterSpacing: '-0.02em',
                  color: 'var(--ac1)',
                  marginBottom: '0.6rem',
                }}
              >
                {event.year}
              </div>

              {/* Title */}
              <h3
                style={{
                  fontFamily: 'Fraunces, serif',
                  fontSize: isMajor ? '1.2rem' : '1rem',
                  fontWeight: 600,
                  color: 'var(--fg1)',
                  lineHeight: 1.25,
                  marginBottom: '0.5rem',
                }}
              >
                {event.title}
              </h3>

              {/* Description — always show for major, toggle for minor */}
              {(isMajor || expanded) && (
                <p
                  style={{
                    fontSize: '0.8125rem',
                    color: 'var(--fg2)',
                    fontWeight: 300,
                    lineHeight: 1.7,
                    marginBottom: '1rem',
                  }}
                >
                  {event.description}
                </p>
              )}

              {!isMajor && !expanded && (
                <p style={{ fontSize: '0.75rem', color: 'var(--fg3)', fontWeight: 300, lineHeight: 1.6, marginBottom: '0.75rem' }}>
                  {event.description.slice(0, 90)}…
                </p>
              )}

              {/* Action buttons */}
              <div
                className="flex items-center gap-3 pt-3"
                style={{ borderTop: `1px solid var(--ac-border)` }}
              >
                <button
                  className="flex items-center gap-1.5 text-xs tracking-[0.1em] uppercase transition-colors"
                  style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.58rem', color: 'var(--fg3)' }}
                  onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.2">
                    {expanded
                      ? <path d="M2 6l3-3 3 3" />
                      : <path d="M2 4l3 3 3-3" />}
                  </svg>
                  {expanded ? 'Collapse' : 'Explore'}
                </button>

                <button
                  className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-xs tracking-[0.1em] uppercase transition-all"
                  style={{
                    fontFamily: 'DM Mono, monospace',
                    fontSize: '0.58rem',
                    color: 'var(--ac1)',
                    border: '1px solid var(--ac-border)',
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onAskWithContext({ type: 'timeline', id: event.id, title: event.title, description: event.description });
                  }}
                >
                  <svg width="9" height="9" viewBox="0 0 9 9" fill="currentColor">
                    <path d="M4.5 0a4.5 4.5 0 100 9 4.5 4.5 0 000-9zm.4 7H4.1V4.1h.8V7zm0-3.8H4.1v-.8h.8v.8z" />
                  </svg>
                  Ask Ambedkar
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Spine spacer (md+) */}
        <div className="hidden md:block" />

        {/* Right column is empty for the content (layout placeholder) */}
        <div className={isLeft ? '' : 'md:order-1'} />
      </div>
    </div>
  );
}

/* ——— Timeline section ——— */
export default function Timeline({ onAskWithContext }: Props) {
  return (
    <section
      id="timeline"
      className="py-24 overflow-hidden"
      style={{ background: 'var(--bg1)' }}
    >
      <div className="max-w-[1400px] mx-auto px-6">

        {/* ——— Header ——— */}
        <div className="mb-20">
          <div className="museum-label mb-4">1891 — 1956</div>
          <h2
            className="museum-heading mb-4"
            style={{
              fontFamily: 'Fraunces, serif',
              fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
              color: 'var(--fg1)',
              lineHeight: 1.05,
            }}
          >
            A Life in Time
          </h2>
          <p className="max-w-lg text-base leading-relaxed" style={{ color: 'var(--fg2)', fontWeight: 300 }}>
            Scroll through six decades of a singular intellect — from a humble household
            in Mhow to the drafting table of the Indian Constitution.
          </p>

          {/* Category legend */}
          <div className="flex flex-wrap gap-x-6 gap-y-2 mt-8">
            {Object.entries(CAT_LABEL).map(([cat, label]) => (
              <div key={cat} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: CAT_COLOR[cat as TimelineEvent['category']] }} />
                <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.58rem', letterSpacing: '0.1em', color: 'var(--fg3)' }}>
                  {label.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ——— Timeline track ——— */}
        <div className="relative">

          {/* ——— Vertical gold spine ——— */}
          <div
            className="absolute left-1/2 top-0 bottom-0 hidden md:block"
            style={{
              width: 1,
              transform: 'translateX(-50%)',
              background: 'linear-gradient(to bottom, transparent 0%, var(--ac1) 4%, var(--ac1) 96%, transparent 100%)',
              opacity: 0.25,
              zIndex: 1,
            }}
          />

          {/* Mobile left spine */}
          <div
            className="absolute left-3 top-0 bottom-0 md:hidden"
            style={{
              width: 1,
              background: 'linear-gradient(to bottom, transparent 0%, var(--ac1) 4%, var(--ac1) 96%, transparent 100%)',
              opacity: 0.2,
            }}
          />

          {/* ——— Event scenes ——— */}
          {EVENTS.map((event, i) => (
            <EventScene
              key={event.id}
              event={event}
              index={i}
              onAskWithContext={onAskWithContext}
            />
          ))}
        </div>

        {/* ——— End marker ——— */}
        <div className="flex flex-col items-center mt-16 gap-3">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center"
            style={{ background: 'var(--ac-bg)', border: '1px solid var(--ac-border)' }}
          >
            <div className="w-2 h-2 rounded-full" style={{ background: 'var(--ac1)' }} />
          </div>
          <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.62rem', letterSpacing: '0.18em', color: 'var(--fg3)', textAlign: 'center' }}>
            EDUCATE · AGITATE · ORGANISE
          </div>
          <div style={{ fontFamily: 'Fraunces, serif', fontSize: '0.875rem', color: 'var(--fg3)', fontStyle: 'italic' }}>
            — Dr. B. R. Ambedkar
          </div>
        </div>
      </div>
    </section>
  );
}
