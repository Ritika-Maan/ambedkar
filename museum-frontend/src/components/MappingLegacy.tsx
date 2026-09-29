import { useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react';
import type { AskContext } from '../types';

/**
 * MAPPING A LEGACY — the "Interactive India" section as an archival map exhibit.
 *
 * Layers, back to front:  background → archival map → location markers → selected location → information panel.
 * Depth is light CSS/DOM 3D only (a slight tilt, a soft shadow, a little parallax, markers lifted off the sheet).
 * No WebGL, no dependencies. Location data is exactly the project's existing set of eight places.
 */

interface Props {
  onAskWithContext: (ctx: AskContext) => void;
}

interface Loc {
  id: string;
  name: string;
  state: string;
  year: string;
  event: string;
  /** Geographic position, used only to place the marker on the outline of India. Absent for overseas places. */
  lon?: number;
  lat?: number;
  /** Where the hover label sits relative to the marker. */
  side: 'l' | 'r' | 't';
  /** Overseas places are shown in the off-map inset (fractions of the map sheet). */
  inset?: { x: number; y: number };
}

// The existing location data (unchanged), plus the position each place occupies on the sheet.
const LOCATIONS: Loc[] = [
  { id: 'mhow',     name: 'Mhow (Ambedkar Nagar)', state: 'Madhya Pradesh', year: '1891',      event: 'Birthplace',                          lon: 75.76, lat: 22.55, side: 'l' },
  { id: 'bombay',   name: 'Bombay (Mumbai)',       state: 'Maharashtra',    year: '1913',      event: 'Early career & Elphinstone College',  lon: 72.83, lat: 18.94, side: 'l' },
  { id: 'new-york', name: 'New York',              state: 'USA',            year: '1913–1916', event: 'Columbia University',                 side: 'r', inset: { x: 0.155, y: 0.855 } },
  { id: 'london',   name: 'London',                state: 'United Kingdom', year: '1916–1917', event: "LSE & Gray's Inn",                    side: 'r', inset: { x: 0.155, y: 0.915 } },
  { id: 'mahad',    name: 'Mahad',                 state: 'Maharashtra',    year: '1927',      event: 'Satyagraha for water rights',         lon: 73.42, lat: 18.08, side: 'l' },
  { id: 'pune',     name: 'Pune',                  state: 'Maharashtra',    year: '1932',      event: 'Poona Pact negotiations',             lon: 73.86, lat: 18.52, side: 'r' },
  { id: 'delhi',    name: 'New Delhi',             state: 'Delhi',          year: '1946–1956', event: 'Constituent Assembly & Parliament',   lon: 77.21, lat: 28.61, side: 'r' },
  { id: 'nagpur',   name: 'Nagpur',                state: 'Maharashtra',    year: '1956',      event: 'Historic Buddhist conversion',        lon: 79.09, lat: 21.15, side: 'r' },
];

/* ─────────────── the sheet: a simple equirectangular plate of the subcontinent ─────────────── */

const W = 780;
const H = 800;
const px = (lon: number) => (lon - 66) * 22 + 30;
const py = (lat: number) => (37.6 - lat) * 23 + 30;

// Simplified outline of India as a base plate (lon, lat). It carries no data — locations are placed on it separately.
const OUTLINE: [number, number][] = [
  [74.0, 37.0], [75.4, 36.9], [76.9, 35.9], [77.8, 35.5], [78.9, 35.5], [80.2, 35.6], [80.3, 34.6], [79.7, 33.6], [79.0, 32.8],
  [78.7, 32.2], [79.1, 31.4], [80.1, 30.5], [81.0, 30.2], [80.5, 29.7], [80.05, 28.85], [81.0, 28.3], [81.9, 27.9], [83.3, 27.4],
  [84.3, 27.35], [85.2, 26.7], [86.5, 26.5], [88.1, 26.4], [88.2, 27.4], [88.1, 27.9], [88.75, 28.1], [88.9, 27.3], [88.8, 26.95],
  [89.9, 26.7], [91.6, 26.8], [92.1, 26.9], [92.0, 27.85], [93.0, 28.3], [94.2, 29.3], [95.3, 29.1], [96.1, 29.4], [97.3, 28.2],
  [96.9, 27.6], [96.2, 27.3], [95.2, 26.6], [94.6, 25.5], [94.1, 24.4], [93.4, 23.1], [93.1, 22.2], [92.6, 21.95], [92.3, 22.5],
  [92.4, 23.7], [91.6, 24.1], [92.2, 24.9], [91.9, 25.2], [90.9, 25.15], [89.8, 25.3], [89.85, 26.05], [89.0, 26.35], [88.45, 26.6],
  [88.6, 25.6], [88.1, 24.9], [88.3, 24.4], [88.9, 23.3], [89.05, 22.1], [88.9, 21.7], [88.0, 21.6], [87.1, 21.5], [86.9, 20.7],
  [86.3, 19.9], [85.4, 19.7], [84.8, 19.1], [84.0, 18.4], [83.3, 17.8], [82.3, 16.7], [81.3, 16.3], [80.9, 15.7], [80.25, 15.6],
  [80.1, 14.0], [80.3, 13.3], [80.2, 12.5], [79.85, 11.7], [79.8, 10.8], [79.3, 10.3], [78.9, 9.3], [78.4, 8.95], [77.6, 8.1],
  [77.0, 8.35], [76.55, 8.9], [76.3, 9.8], [75.9, 11.0], [75.3, 12.0], [74.8, 13.3], [74.4, 14.5], [74.1, 15.5], [73.85, 16.0],
  [73.3, 17.4], [72.9, 18.9], [72.75, 20.0], [72.7, 21.0], [72.9, 21.6], [72.6, 22.3], [72.2, 21.75], [72.0, 21.1], [71.2, 20.75],
  [70.5, 20.85], [69.8, 21.0], [69.1, 22.2], [69.1, 22.5], [70.1, 22.75], [70.8, 22.95], [70.0, 23.15], [69.5, 22.9], [68.9, 23.05],
  [68.2, 23.65], [68.15, 23.85], [68.7, 24.3], [69.6, 24.25], [70.1, 24.2], [70.5, 25.1], [70.0, 25.8], [70.3, 26.6], [70.1, 27.4],
  [70.6, 28.0], [71.4, 27.95], [72.4, 28.4], [73.3, 29.2], [74.3, 29.8], [74.5, 31.0], [74.6, 31.9], [75.3, 32.4], [75.0, 32.9],
  [74.4, 33.4], [74.3, 34.0], [73.9, 34.7], [73.6, 35.1], [74.2, 35.5], [73.7, 36.3],
];
const OUTLINE_PATH = 'M' + OUTLINE.map(([lo, la]) => `${px(lo).toFixed(1)},${py(la).toFixed(1)}`).join('L') + 'Z';

const MERIDIANS = [70, 75, 80, 85, 90, 95];
const PARALLELS = [10, 15, 20, 25, 30, 35];

// Inset for places that lie beyond the subcontinent (New York, London) — deliberately "off map".
const INSET = { x: 26, y: 596, w: 200, h: 176 };

const posOf = (l: Loc) =>
  l.inset ? { x: l.inset.x, y: l.inset.y } : { x: px(l.lon as number) / W, y: py(l.lat as number) / H };

const askContextFor = (loc: Loc): AskContext => ({
  type: 'map',
  id: loc.id,
  title: `${loc.name} — ${loc.event}`,
  description: `Ambedkar in ${loc.name}, ${loc.state} (${loc.year}): ${loc.event}`,
});

export default function MappingLegacy({ onAskWithContext }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const reduced = useMemo(
    () => typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  );

  const selected = LOCATIONS.find((l) => l.id === selectedId) ?? null;

  // Very slight parallax: the pointer position becomes two CSS variables; CSS does the rest.
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (reduced || e.pointerType === 'touch') return;
    const el = stageRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3));
    el.style.setProperty('--my', (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3));
  };
  const onLeave = () => {
    const el = stageRef.current;
    if (!el) return;
    el.style.setProperty('--mx', '0');
    el.style.setProperty('--my', '0');
  };
  const onKey = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Escape' && selectedId) { e.stopPropagation(); setSelectedId(null); }
  };

  // Gentle zoom toward the selected place (translate + scale about the sheet's centre)
  const zoom = 1.08;
  const pan = (f: number) => `${Math.max(-3.5, Math.min(3.5, -(f - 0.5) * zoom * 14)).toFixed(2)}%`;
  const sel = selected ? posOf(selected) : null;
  const planeStyle = {
    ['--z' as string]: sel ? zoom : 1,
    ['--tx' as string]: sel ? pan(sel.x) : '0%',
    ['--ty' as string]: sel ? pan(sel.y) : '0%',
  } as CSSProperties;

  return (
    <section id="map" className="ml-section" onKeyDown={onKey}>
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="mb-10">
          <div className="museum-label mb-4">Geographic Archive · Mapping a Legacy</div>
          <h2 className="museum-heading text-5xl mb-4" style={{ fontFamily: 'Fraunces, serif', color: '#f2ede0' }}>
            Interactive India
          </h2>
          <p className="max-w-lg text-base leading-relaxed" style={{ color: 'rgba(242,237,224,0.55)', fontWeight: 300 }}>
            Trace Ambedkar's journey across the subcontinent — from Mhow to Nagpur,
            from Bombay to London — each location a chapter in the archive.
          </p>
        </div>

        <div className="ml-grid">
          {/* ——— BACKGROUND + ARCHIVAL MAP + MARKERS ——— */}
          <div
            ref={stageRef}
            className="ml-stage"
            data-selected={selected ? 'true' : 'false'}
            onPointerMove={onMove}
            onPointerLeave={onLeave}
            onClick={(e) => { if (e.target === e.currentTarget) setSelectedId(null); }}
          >
            <div className="ml-bg" aria-hidden="true" />
            <div className="ml-shadow" aria-hidden="true" />

            <div className="ml-plane" style={planeStyle}>
              <svg className="ml-sheet" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Archival map of India with the places of Ambedkar's life marked" preserveAspectRatio="xMidYMid meet">
                <defs>
                  <linearGradient id="ml-paper" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#141c36" />
                    <stop offset="1" stopColor="#0d1428" />
                  </linearGradient>
                  <linearGradient id="ml-land" x1="0" y1="0" x2="0.6" y2="1">
                    <stop offset="0" stopColor="#252a44" />
                    <stop offset="1" stopColor="#1c2038" />
                  </linearGradient>
                  <radialGradient id="ml-vignette" cx="50%" cy="46%" r="70%">
                    <stop offset="0.55" stopColor="#000" stopOpacity="0" />
                    <stop offset="1" stopColor="#000" stopOpacity="0.5" />
                  </radialGradient>
                  <filter id="ml-grain" x="0" y="0" width="100%" height="100%">
                    <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" />
                    <feColorMatrix values="0 0 0 0 0.85  0 0 0 0 0.72  0 0 0 0 0.4  0 0 0 0.09 0" />
                  </filter>
                  <pattern id="ml-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(-30)">
                    <line x1="0" y1="0" x2="0" y2="6" stroke="#c4a35a" strokeOpacity="0.045" strokeWidth="1" />
                  </pattern>
                </defs>

                {/* sheet */}
                <rect width={W} height={H} fill="url(#ml-paper)" />
                <rect width={W} height={H} fill="url(#ml-hatch)" />
                <rect width={W} height={H} filter="url(#ml-grain)" />

                {/* graticule */}
                <g stroke="#c4a35a" strokeOpacity="0.13" strokeWidth="0.7" fill="none">
                  {MERIDIANS.map((lo) => <line key={`m${lo}`} x1={px(lo)} y1={32} x2={px(lo)} y2={H - 32} />)}
                  {PARALLELS.map((la) => <line key={`p${la}`} x1={32} y1={py(la)} x2={W - 32} y2={py(la)} />)}
                </g>
                <g fill="#c4a35a" fillOpacity="0.5" fontFamily="DM Mono, monospace" fontSize="9" letterSpacing="1">
                  {MERIDIANS.map((lo) => <text key={`ml${lo}`} x={px(lo)} y={24} textAnchor="middle">{lo}°E</text>)}
                  {PARALLELS.map((la) => <text key={`pl${la}`} x={W - 24} y={py(la) + 3} textAnchor="end">{la}°N</text>)}
                </g>

                {/* engraved coast: concentric offshore lines, then the land itself */}
                <g fill="none" stroke="#c4a35a" strokeLinejoin="round">
                  <path d={OUTLINE_PATH} strokeWidth="22" strokeOpacity="0.035" />
                  <path d={OUTLINE_PATH} strokeWidth="14" strokeOpacity="0.05" />
                  <path d={OUTLINE_PATH} strokeWidth="7" strokeOpacity="0.08" />
                </g>
                <path d={OUTLINE_PATH} fill="url(#ml-land)" stroke="#c4a35a" strokeOpacity="0.78" strokeWidth="1.3" strokeLinejoin="round" />
                <path d={OUTLINE_PATH} fill="none" stroke="#e0c880" strokeOpacity="0.16" strokeWidth="0.6" strokeLinejoin="round" transform="translate(1.5 1.5)" />

                {/* off-map inset for overseas places */}
                <g>
                  <rect x={INSET.x} y={INSET.y} width={INSET.w} height={INSET.h} fill="#0b1124" fillOpacity="0.85" stroke="#c4a35a" strokeOpacity="0.4" strokeWidth="1" />
                  <rect x={INSET.x + 4} y={INSET.y + 4} width={INSET.w - 8} height={INSET.h - 8} fill="none" stroke="#c4a35a" strokeOpacity="0.16" strokeWidth="0.7" />
                  <text x={INSET.x + INSET.w / 2} y={INSET.y + 26} textAnchor="middle" fill="#c4a35a" fillOpacity="0.85" fontFamily="DM Mono, monospace" fontSize="9.5" letterSpacing="2.4">BEYOND THE MAP</text>
                  <text x={INSET.x + INSET.w / 2} y={INSET.y + 42} textAnchor="middle" fill="#f2ede0" fillOpacity="0.42" fontFamily="Fraunces, serif" fontStyle="italic" fontSize="11">Overseas places, not to scale</text>
                </g>

                {/* compass */}
                <g transform={`translate(${W - 78} ${H - 84})`} stroke="#c4a35a" strokeOpacity="0.6" fill="none" strokeWidth="0.9">
                  <circle r="26" strokeOpacity="0.3" />
                  <path d="M0,-26 L5,0 L0,26 L-5,0 Z" fill="#c4a35a" fillOpacity="0.16" />
                  <path d="M-26,0 L0,-5 L26,0 L0,5 Z" strokeOpacity="0.35" />
                  <text y="-33" textAnchor="middle" fill="#c4a35a" fillOpacity="0.85" stroke="none" fontFamily="DM Mono, monospace" fontSize="10" letterSpacing="1">N</text>
                </g>

                {/* frame */}
                <rect x="10" y="10" width={W - 20} height={H - 20} fill="none" stroke="#c4a35a" strokeOpacity="0.5" strokeWidth="1.2" />
                <rect x="16" y="16" width={W - 32} height={H - 32} fill="none" stroke="#c4a35a" strokeOpacity="0.2" strokeWidth="0.7" />
                <rect width={W} height={H} fill="url(#ml-vignette)" pointerEvents="none" />
              </svg>

              {/* ——— LOCATION MARKERS (lifted a little above the sheet) ——— */}
              <div className="ml-markers">
                {LOCATIONS.map((loc) => {
                  const p = posOf(loc);
                  const active = loc.id === selectedId;
                  return (
                    <button
                      key={loc.id}
                      type="button"
                      className="ml-mk"
                      data-active={active ? 'true' : 'false'}
                      data-side={loc.side}
                      style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%` }}
                      aria-pressed={active}
                      aria-label={`${loc.name}, ${loc.state}, ${loc.year}`}
                      onClick={() => setSelectedId(active ? null : loc.id)}
                    >
                      <span className="ml-mk-shadow" aria-hidden="true" />
                      <span className="ml-mk-ring" aria-hidden="true" />
                      <span className="ml-mk-dot" aria-hidden="true" />
                      <span className="ml-mk-tip" aria-hidden="true">
                        <span className="ml-mk-name">{loc.name}</span>
                        <span className="ml-mk-year">{loc.year}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ——— INFORMATION PANEL ——— */}
          <aside className="ml-panel" aria-live="polite">
            {selected ? (
              <div className="ml-card" key={selected.id}>
                <div className="ml-card-year">{selected.year}</div>
                <h3 className="ml-card-name">{selected.name}</h3>
                <div className="ml-card-state">{selected.state}</div>
                <div className="ml-card-rule" />
                <p className="ml-card-event">{selected.event}</p>
                <p className="ml-card-desc">{`Ambedkar in ${selected.name}, ${selected.state} (${selected.year}): ${selected.event}`}</p>
                <div className="ml-card-actions">
                  <button type="button" className="ml-ask" onClick={() => onAskWithContext(askContextFor(selected))}>
                    Ask Ambedkar →
                  </button>
                  <button type="button" className="ml-clear" onClick={() => setSelectedId(null)}>Clear</button>
                </div>
              </div>
            ) : (
              <div className="ml-card ml-card-empty" key="empty">
                <div className="ml-card-year">Select a place</div>
                <p className="ml-card-desc">
                  Choose a marker on the map, or a place from the index, to open its entry in the archive.
                </p>
              </div>
            )}

            <div className="ml-index-label">Index of places</div>
            <ol className="ml-index">
              {LOCATIONS.map((loc, i) => (
                <li key={loc.id}>
                  <button
                    type="button"
                    className="ml-index-item"
                    data-active={loc.id === selectedId ? 'true' : 'false'}
                    aria-pressed={loc.id === selectedId}
                    onClick={() => setSelectedId(loc.id === selectedId ? null : loc.id)}
                  >
                    <span className="ml-index-no">{String(i + 1).padStart(2, '0')}</span>
                    <span className="ml-index-name">{loc.name}</span>
                    <span className="ml-index-year">{loc.year}</span>
                  </button>
                </li>
              ))}
            </ol>
          </aside>
        </div>
      </div>
    </section>
  );
}
