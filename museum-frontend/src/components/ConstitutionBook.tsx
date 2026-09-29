import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';

/**
 * The physical Constitution book (Archive Reading Room only).
 * Pure CSS/DOM 3D: every leaf is a chain of narrow segments, each hinged on the previous one,
 * so a page can genuinely bend as it travels around the spine. No WebGL, no dependencies.
 *
 * Page content
 * ────────────
 * The leaves carry typeset DIGITAL TRANSCRIPTIONS of the Constitution of India as originally
 * enacted (1950 wording). They are not scans or facsimiles of the original manuscript, and are
 * labelled as such on every page. Nothing here is paraphrased.
 */

export type BookPhase = 'enter' | 'lift' | 'cover' | 'pages' | 'settle' | 'closing';

const SEGS = 5;               // segments per leaf (bend resolution)
const REST = [-1.6, -0.6, 0.5, 0.8, 0.9];   // resting gutter curvature, degrees (sums to 0)
const AMP = [0.5, 1.2, 2.0, 2.8, 3.4];      // how much each segment trails/leads while turning
const TURN_MS = 820;
const LEAVES = 4;             // front-matter leaves turned by the opening animation

/* ─────────────────────────── page model ─────────────────────────── */

type PageId =
  | 'note' | 'pre-a' | 'pre-b' | 'a1-a' | 'a1-b' | 'a14' | 'a17' | 'a19-a' | 'a19-b' | 'a19-c';

type Face =
  | { kind: 'title'; folio: string }
  | { kind: 'text'; page: PageId; folio: string }
  | { kind: 'blank' };

/** Face n is printed on: 0 = left of spread 1; 1 = right of spread 1; 2 = left of spread 2 … */
const FACES: Face[] = [
  { kind: 'title', folio: 'i' },
  { kind: 'text', page: 'note', folio: 'ii' },
  { kind: 'text', page: 'pre-a', folio: '1' },
  { kind: 'text', page: 'pre-b', folio: '2' },
  { kind: 'text', page: 'a1-a', folio: '3' },
  { kind: 'text', page: 'a1-b', folio: '4' },
  { kind: 'text', page: 'a14', folio: '5' },
  { kind: 'text', page: 'a17', folio: '6' },
  { kind: 'text', page: 'a19-a', folio: '7' },
  { kind: 'text', page: 'a19-b', folio: '8' },
  { kind: 'text', page: 'a19-c', folio: '9' },
];
if ((FACES.length - 1) % 2 !== 0) FACES.push({ kind: 'blank' });   // faces 1..2N → N turnable sheets

/** Constitutional section shown on each spread — handed to the existing Ask Ambedkar context. */
export const SPREAD_SECTIONS: (string | undefined)[] = [
  undefined,                              // title page
  'Preamble',
  'Article 1',
  'Article 14 and Article 17',
  'Article 19',
  'Article 19 (continued) and Article 21',
];

const SHEETS = (FACES.length - 1) / 2;          // sheet j: front = faces[2j+1], back = faces[2j+2]
const SPREADS = SHEETS + 1;                      // spread s: left = faces[2s], right = faces[2s+1]
const ZSTEP = Math.min(0.2, 0.9 / SHEETS);

const folioOf = (f?: Face) => (f && 'folio' in f ? f.folio : undefined);

/* ─────────────────────────── drawing ─────────────────────────── */

function Chakra() {
  const spokes = Array.from({ length: 24 }, (_, i) => i * 15);
  return (
    <svg viewBox="0 0 100 100" className="rr-chakra" aria-hidden="true">
      <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="2.2" />
      <circle cx="50" cy="50" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
      {spokes.map((a) => (
        <line key={a} x1="50" y1="56" x2="50" y2="90" stroke="currentColor" strokeWidth="1.4" transform={`rotate(${a} 50 50)`} />
      ))}
    </svg>
  );
}

const Head = ({ no, name }: { no: string; name: string }) => (
  <header className="rr-tx-head">
    <div className="rr-tx-no">{no}</div>
    <h3 className="rr-tx-name">{name}</h3>
    <div className="rr-p-rule" />
  </header>
);

function PageText({ page }: { page: PageId }) {
  switch (page) {
    case 'note':
      return (
        <div className="rr-tx-body rr-tx-mid rr-tx-note">
          <div className="rr-tx-no">About this volume</div>
          <div className="rr-p-rule" />
          <p>The pages that follow are digital transcriptions of the text of the Constitution of India as originally enacted, set in type for this reading room.</p>
          <p>They are not scans or facsimiles of the original manuscript.</p>
          <p className="rr-tx-list">Preamble<br />Articles 1, 14, 17, 19 and 21</p>
        </div>
      );
    case 'pre-a':
      return (
        <div className="rr-tx-body rr-tx-mid rr-tx-c rr-tx-pre">
          <div className="rr-tx-no">Preamble</div>
          <div className="rr-p-rule" />
          <p><b>WE, THE PEOPLE OF INDIA,</b> having solemnly resolved to constitute India into a <b>SOVEREIGN DEMOCRATIC REPUBLIC</b> and to secure to all its citizens:</p>
          <p><b>JUSTICE,</b> social, economic and political;</p>
          <p><b>LIBERTY</b> of thought, expression, belief, faith and worship;</p>
          <p><b>EQUALITY</b> of status and of opportunity;</p>
        </div>
      );
    case 'pre-b':
      return (
        <div className="rr-tx-body rr-tx-mid rr-tx-c rr-tx-pre">
          <p>and to promote among them all</p>
          <p><b>FRATERNITY</b> assuring the dignity of the individual and the unity of the Nation;</p>
          <p>IN OUR CONSTITUENT ASSEMBLY this twenty-sixth day of November, 1949, do <b>HEREBY ADOPT, ENACT AND GIVE TO OURSELVES THIS CONSTITUTION.</b></p>
        </div>
      );
    case 'a1-a':
      return (
        <div className="rr-tx-body rr-lg">
          <Head no="Article 1" name="Name and territory of the Union" />
          <p>1. Name and territory of the Union.—(1) India, that is Bharat, shall be a Union of States.</p>
          <p>(2) The States and the territories thereof shall be the States and their territories specified in Parts A, B and C of the First Schedule.</p>
        </div>
      );
    case 'a1-b':
      return (
        <div className="rr-tx-body rr-lg">
          <p>(3) The territory of India shall comprise—</p>
          <p className="rr-i1">(a) the territories of the States;</p>
          <p className="rr-i1">(b) the territories specified in Part D of the First Schedule; and</p>
          <p className="rr-i1">(c) such other territories as may be acquired.</p>
        </div>
      );
    case 'a14':
      return (
        <div className="rr-tx-body rr-tx-mid rr-lg">
          <Head no="Article 14" name="Equality before law" />
          <p>The State shall not deny to any person equality before the law or the equal protection of the laws within the territory of India.</p>
        </div>
      );
    case 'a17':
      return (
        <div className="rr-tx-body rr-tx-mid rr-lg">
          <Head no="Article 17" name="Abolition of Untouchability" />
          <p>“Untouchability” is abolished and its practice in any form is forbidden.</p>
          <p>The enforcement of any disability arising out of “Untouchability” shall be an offence punishable in accordance with law.</p>
        </div>
      );
    case 'a19-a':
      return (
        <div className="rr-tx-body rr-dense">
          <Head no="Article 19" name="Protection of certain rights regarding freedom of speech, etc." />
          <p>(1) All citizens shall have the right—</p>
          <p className="rr-i1">(a) to freedom of speech and expression;</p>
          <p className="rr-i1">(b) to assemble peaceably and without arms;</p>
          <p className="rr-i1">(c) to form associations or unions;</p>
          <p className="rr-i1">(d) to move freely throughout the territory of India;</p>
          <p className="rr-i1">(e) to reside and settle in any part of the territory of India;</p>
          <p className="rr-i1">(f) to acquire, hold and dispose of property; and</p>
          <p className="rr-i1">(g) to practise any profession, or to carry on any occupation, trade or business.</p>
          <p>(2) Nothing in sub-clause (a) of clause (1) shall affect the operation of any existing law in so far as it relates to, or prevent the State from making any law relating to, libel, slander, defamation, contempt of court or any matter which offends against decency or morality or which undermines the security of, or tends to overthrow, the State.</p>
        </div>
      );
    case 'a19-b':
      return (
        <div className="rr-tx-body rr-dense">
          <p>(3) Nothing in sub-clause (b) of the said clause shall affect the operation of any existing law in so far as it imposes, or prevent the State from making any law imposing, in the interests of public order, reasonable restrictions on the exercise of the right conferred by the said sub-clause.</p>
          <p>(4) Nothing in sub-clause (c) of the said clause shall affect the operation of any existing law in so far as it imposes, or prevent the State from making any law imposing, in the interests of public order or morality, reasonable restrictions on the exercise of the right conferred by the said sub-clause.</p>
          <p>(5) Nothing in sub-clauses (d), (e) and (f) of the said clause shall affect the operation of any existing law in so far as it imposes, or prevent the State from making any law imposing, reasonable restrictions on the exercise of any of the rights conferred by the said sub-clauses either in the interests of the general public or for the protection of the interests of any Scheduled Tribe.</p>
        </div>
      );
    case 'a19-c':
      return (
        <div className="rr-tx-body rr-dense">
          <p>(6) Nothing in sub-clause (g) of the said clause shall affect the operation of any existing law in so far as it imposes, or prevent the State from making any law imposing, in the interests of the general public, reasonable restrictions on the exercise of the right conferred by the said sub-clause, and, in particular, nothing in the said sub-clause shall affect the operation of any existing law in so far as it prescribes or empowers any authority to prescribe, or prevent the State from making any law prescribing or empowering any authority to prescribe, the professional or technical qualifications necessary for practising any profession or carrying on any occupation, trade or business.</p>
          <div className="rr-tx-sep" />
          <Head no="Article 21" name="Protection of life and personal liberty" />
          <p>No person shall be deprived of his life or personal liberty except according to procedure established by law.</p>
        </div>
      );
  }
}

/** A typeset transcription page: label above, source below, folio at the foot. */
function TextPage({ page, folio, side }: { page: PageId; folio: string; side: 'r' | 'l' }) {
  return (
    <div className={`rr-tx rr-tx-${side}`}>
      <div className="rr-tx-label">Digital transcription</div>
      <PageText page={page} />
      <div className="rr-tx-src">Source · Constitution of India, 1950</div>
      <div className="rr-folio">{folio}</div>
    </div>
  );
}

function FaceBody({ face, side }: { face: Face; side: 'r' | 'l' }) {
  return (
    <>
      {face.kind === 'title' && (
        <div className="rr-titlepage">
          <div className="rr-p-kicker">Primary Document</div>
          <div className="rr-tp-title">The Constitution of India</div>
          <div className="rr-p-rule" />
          <p>Drafted under the chairmanship of<br /><b>Dr. B. R. Ambedkar</b></p>
          <p className="rr-tp-meta">Adopted 26 November 1949<br />In force 26 January 1950</p>
          <p className="rr-tp-meta">395 Articles · 22 Parts · 8 Schedules<br />as originally enacted</p>
          <div className="rr-folio">{face.folio}</div>
        </div>
      )}
      {face.kind === 'text' && <TextPage page={face.page} folio={face.folio} side={side} />}
      <div className={`rr-edge rr-edge-${side}`} />
      <div className={`rr-gutter rr-gutter-${side}`} />
      <div className={`rr-shade rr-shade-${side}`} />
    </>
  );
}

/** One leaf = SEGS nested, hinged segments. Front and back faces are sliced across them. */
function Segs({ k = 0, front, back }: { k?: number; front: Face; back: Face }) {
  const last = k === SEGS - 1;
  return (
    <div className="rr-seg" style={{ ['--r' as string]: REST[k], ['--amp' as string]: AMP[k] } as CSSProperties}>
      <div className="rr-slice rr-slice-front" data-edge={last ? '' : undefined} style={{ ['--off' as string]: k } as CSSProperties}>
        <div className="rr-face-body"><FaceBody face={front} side="r" /></div>
      </div>
      <div className="rr-slice rr-slice-back" data-edge={last ? '' : undefined} style={{ ['--off' as string]: SEGS - 1 - k } as CSSProperties}>
        <div className="rr-face-body"><FaceBody face={back} side="l" /></div>
      </div>
      {!last && <Segs k={k + 1} front={front} back={back} />}
    </div>
  );
}

const paperTone = (n: number): CSSProperties => {
  const a = ((n * 37) % 7) - 3;      // −3 … +3, deterministic variation so no two leaves are identical
  return {
    ['--p1' as string]: `hsl(${43 + a * 0.7}, ${54 + a}%, ${94 - Math.abs(a) * 0.5}%)`,
    ['--p2' as string]: `hsl(${41 + a * 0.6}, ${48 + a}%, ${87 - Math.abs(a) * 0.6}%)`,
  } as CSSProperties;
};

type AnimKind =
  | 'turn-fwd' | 'turn-back'
  | 'under-r-fwd' | 'under-r-back' | 'under-l-fwd' | 'under-l-back';

/* ─────────────────────────── component ─────────────────────────── */

export default function ConstitutionBook({ phase, reduced, onSpreadChange }: { phase: BookPhase; reduced: boolean; onSpreadChange?: (spread: number) => void }) {
  const [spread, setSpread] = useState(0);
  const [anims, setAnims] = useState<Record<number, { kind: AnimKind; id: number }>>({});
  const [veil, setVeil] = useState(false);
  const [hover, setHover] = useState<'prev' | 'next' | null>(null);

  const spreadRef = useRef(0);
  const animsRef = useRef(anims);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const idRef = useRef(0);
  const timers = useRef<number[]>([]);
  const spineRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; t: number } | null>(null);

  const later = (ms: number, fn: () => void) => { timers.current.push(window.setTimeout(fn, ms)); };
  useEffect(() => () => { timers.current.forEach((t) => window.clearTimeout(t)); }, []);

  const onSpreadChangeRef = useRef(onSpreadChange);
  onSpreadChangeRef.current = onSpreadChange;
  useEffect(() => { onSpreadChangeRef.current?.(spread); }, [spread]);

  const setSpreadBoth = (s: number) => { spreadRef.current = s; setSpread(s); };
  const setAnimsBoth = (a: Record<number, { kind: AnimKind; id: number }>) => { animsRef.current = a; setAnims(a); };

  const go = useCallback((dir: 1 | -1) => {
    if (phaseRef.current !== 'settle') return;
    const s = spreadRef.current;
    const to = s + dir;
    if (to < 0 || to >= SPREADS) return;
    const j = dir === 1 ? s : s - 1;               // the sheet that turns
    if (animsRef.current[j]?.kind.startsWith('turn')) return;

    if (reduced) {                                  // simple fade instead of the 3D turn
      setVeil(true);
      later(140, () => { setSpreadBoth(to); later(30, () => setVeil(false)); });
      return;
    }

    const id = ++idRef.current;
    const next = { ...animsRef.current };
    next[j] = { kind: dir === 1 ? 'turn-fwd' : 'turn-back', id };
    const setUnder = (idx: number, kind: AnimKind) => {
      if (idx < 0 || idx >= SHEETS || next[idx]?.kind.startsWith('turn')) return;
      next[idx] = { kind, id };
    };
    setUnder(j + 1, dir === 1 ? 'under-r-fwd' : 'under-r-back');
    setUnder(j - 1, dir === 1 ? 'under-l-fwd' : 'under-l-back');
    setSpreadBoth(to);
    setAnimsBoth(next);
    later(TURN_MS + 80, () => {
      const cur = { ...animsRef.current };
      Object.keys(cur).forEach((key) => { if (cur[+key]?.id === id) delete cur[+key]; });
      setAnimsBoth(cur);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

  // Put the pages back before the cover closes
  useEffect(() => {
    if (phase === 'closing') { setSpreadBoth(0); setAnimsBoth({}); }
  }, [phase]);

  // Keyboard arrows (never while typing in the Ask Ambedkar box)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const el = e.target as HTMLElement | null;
      if (el) {
        const field = el.tagName === 'INPUT' || el.tagName === 'TEXTAREA';
        // arrows keep their normal meaning while the reader is actually typing a question
        if (el.tagName === 'SELECT' || el.isContentEditable) return;
        if (field && (el as HTMLInputElement | HTMLTextAreaElement).value.length > 0) return;
      }
      e.preventDefault();
      go(e.key === 'ArrowRight' ? 1 : -1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go]);

  /* pointer: click a side to turn, or swipe / drag horizontally */
  const sideOf = (clientX: number): 'prev' | 'next' => {
    const sx = spineRef.current?.getBoundingClientRect().left ?? window.innerWidth / 2;
    return clientX >= sx ? 'next' : 'prev';
  };
  const onDown = (e: React.PointerEvent) => {
    drag.current = { x: e.clientX, y: e.clientY, t: performance.now() };
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onUp = (e: React.PointerEvent) => {
    const d = drag.current; drag.current = null;
    if (!d) return;
    const dx = e.clientX - d.x, dy = e.clientY - d.y;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? 1 : -1);
    else if (Math.abs(dx) < 10 && Math.abs(dy) < 10) go(sideOf(e.clientX) === 'next' ? 1 : -1);
  };
  const onMove = (e: React.PointerEvent) => {
    if (e.pointerType === 'touch') return;
    const side = sideOf(e.clientX);
    const ok = side === 'next' ? spreadRef.current < SPREADS - 1 : spreadRef.current > 0;
    setHover(ok ? side : null);
  };

  /* what is rendered: a window of sheets around the current spread (keeps the DOM light) */
  const centerRef = useRef(0);
  if (phase !== 'closing') centerRef.current = spread;
  const center = centerRef.current;
  const js = new Set<number>();
  for (let j = Math.max(0, center - 3); j <= Math.min(SHEETS - 1, center + 2); j++) js.add(j);
  Object.keys(anims).forEach((k) => js.add(+k));
  const sheets = Array.from(js).sort((a, b) => a - b);

  const interactive = phase === 'settle';
  const leftFace = FACES[2 * spread];
  const rightFace = spread < SPREADS - 1 ? FACES[2 * spread + 1] : undefined;
  const lf = folioOf(leftFace), rf = folioOf(rightFace);
  const label = lf && rf ? `Pages ${lf}–${rf}` : `Spread ${spread + 1} of ${SPREADS}`;

  const total = SHEETS + 8;
  const tr = (SHEETS - spread + 4) / total;
  const tl = (spread + 4) / total;

  const bookStyle = {
    ['--turn-ms' as string]: `${TURN_MS}ms`,
    ['--tr' as string]: (0.2 + 1.4 * tr).toFixed(3),
    ['--tl' as string]: (0.2 + 1.4 * tl).toFixed(3),
  } as CSSProperties;

  return (
    <>
      <div
        className="rr-book"
        role="group"
        aria-roledescription="book"
        aria-label={`The Constitution of India, open book. ${label}`}
        style={bookStyle}
      >
        <div className="rr-contact" />
        <div className="rr-base">
          <div className="rr-board-back" />
          <div className="rr-endpaper"><div className="rr-gutter rr-gutter-r" /></div>
        </div>
        <div className="rr-spine-bed" />
        <div className="rr-spine-mark" ref={spineRef} />
        <div className="rr-block rr-block-r" /><div className="rr-block rr-block-l" />
        <div className="rr-tail rr-tail-r" /><div className="rr-tail rr-tail-l" />

        {/* Front-matter leaves: turned by the opening animation */}
        {Array.from({ length: LEAVES }, (_, i) => (
          <div
            key={`leaf-${i}`}
            className="rr-leaf"
            aria-hidden="true"
            style={{
              ['--i' as string]: i,
              ['--zr' as string]: `${1.2 + (LEAVES - i) * 0.5}px`,
              ['--zl' as string]: `${1.5 + i * 0.7}px`,
              ...paperTone(i + 1),
            } as CSSProperties}
          >
            <Segs
              front={{ kind: 'blank' }}
              back={i === LEAVES - 1 ? FACES[0] : { kind: 'blank' }}
            />
          </div>
        ))}

        {/* Turnable sheets */}
        {sheets.map((j) => (
          <div
            key={`sheet-${j}`}
            className="rr-sheet"
            aria-hidden="true"
            data-flipped={j < spread ? 'true' : 'false'}
            data-anim={anims[j]?.kind}
            style={{
              ['--i' as string]: SHEETS - j,
              ['--zr' as string]: `${(0.6 + (SHEETS - j) * ZSTEP).toFixed(3)}px`,
              ['--zl' as string]: `${(4.2 + j * ZSTEP).toFixed(3)}px`,
              ...paperTone(j + 7),
            } as CSSProperties}
          >
            <Segs front={FACES[2 * j + 1]} back={FACES[2 * j + 2]} />
          </div>
        ))}

        {/* Front cover — rotates about the spine */}
        <div className="rr-cover">
          <div className="rr-cover-front">
            <div className="rr-cover-frame">
              <div className="rr-corner rr-c1" /><div className="rr-corner rr-c2" />
              <div className="rr-corner rr-c3" /><div className="rr-corner rr-c4" />
              <Chakra />
              <div className="rr-cv-the">THE</div>
              <div className="rr-cv-title">CONSTITUTION</div>
              <div className="rr-cv-of">OF</div>
              <div className="rr-cv-india">INDIA</div>
            </div>
            <div className="rr-spine-edge" />
          </div>
          <div className="rr-cover-inside"><div className="rr-pastedown" /></div>
        </div>

        <div className="rr-veil" data-on={veil ? 'true' : 'false'} aria-hidden="true" />
      </div>

      {/* Click a side / swipe to turn */}
      <div
        className="rr-hit"
        data-active={interactive ? 'true' : 'false'}
        data-hover={hover ?? undefined}
        aria-hidden="true"
        onPointerDown={onDown}
        onPointerUp={onUp}
        onPointerMove={onMove}
        onPointerLeave={() => { setHover(null); drag.current = null; }}
        onPointerCancel={() => { drag.current = null; }}
      />

      <div className="rr-controls" data-on={interactive ? 'true' : 'false'}>
        <button
          type="button"
          className="rr-btn"
          onClick={() => go(-1)}
          aria-disabled={!interactive || spread === 0}
          aria-label="Previous page"
        >
          <span aria-hidden="true">←</span><span>Previous</span>
        </button>
        <span className="rr-pageno" aria-live="polite">{label}</span>
        <button
          type="button"
          className="rr-btn"
          onClick={() => go(1)}
          aria-disabled={!interactive || spread >= SPREADS - 1}
          aria-label="Next page"
        >
          <span>Next</span><span aria-hidden="true">→</span>
        </button>
      </div>
    </>
  );
}
