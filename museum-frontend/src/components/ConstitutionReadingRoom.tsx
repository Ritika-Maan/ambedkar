import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import AskPanel from './AskPanel';
import ConstitutionBook, { SPREAD_SECTIONS } from './ConstitutionBook';
import type { AskContext } from '../types';

interface Props {
  /** Constitution context, passed straight into the existing Ask Ambedkar component. */
  context: AskContext;
  onClose: () => void;
}

type Phase = 'enter' | 'lift' | 'cover' | 'pages' | 'settle' | 'closing';

/**
 * "AI Archive Reading Room" for the Constitution book.
 * CSS/DOM 3D book opening → open spread centred → Ask Ambedkar (existing component,
 * inline variant) revealed underneath. Application-level immersive mode, not browser fullscreen.
 */
export default function ConstitutionReadingRoom({ context, onClose }: Props) {
  const reduced =
    typeof window !== 'undefined' && !!window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobile =
    typeof window !== 'undefined' && !!window.matchMedia &&
    window.matchMedia('(max-width: 640px)').matches;

  const [phase, setPhase] = useState<Phase>('enter');
  const [guide, setGuide] = useState(false);       // "Your archive guide" bar revealed
  const [aiOpen, setAiOpen] = useState(false);     // AI section expanded
  const [bookExpanded, setBookExpanded] = useState(false);
  const [fast, setFast] = useState(false);
  const [spread, setSpread] = useState(0);         // open spread of the book → current constitutional section

  const rootRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const timers = useRef<number[]>([]);
  const closingRef = useRef(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const clearTimers = () => { timers.current.forEach((t) => window.clearTimeout(t)); timers.current = []; };
  const at = (ms: number, fn: () => void) => { timers.current.push(window.setTimeout(fn, ms)); };

  const focusInput = () => {
    if (mobile) return; // don't pop the on-screen keyboard
    rootRef.current?.querySelector<HTMLTextAreaElement>('.rr-dock-body textarea')?.focus({ preventScroll: true });
  };

  // Cinematic sequence
  useEffect(() => {
    if (reduced) {
      at(30, () => setPhase('settle'));
      at(450, () => { setGuide(true); });
      at(800, () => { setAiOpen(!mobile); if (!mobile) at(500, focusInput); });
    } else {
      at(60, () => setPhase('lift'));
      at(900, () => setPhase('cover'));
      at(2150, () => setPhase('pages'));
      at(4250, () => setPhase('settle'));
      at(4900, () => setGuide(true));
      at(5400, () => { setAiOpen(!mobile); if (!mobile) at(900, focusInput); });
    }
    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Lock page scroll while the room is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus({ preventScroll: true });
    return () => { document.body.style.overflow = prev; };
  }, []);

  const skip = () => {
    clearTimers();
    setFast(true);
    setPhase('settle');
    setGuide(true);
    setAiOpen(!mobile);
    if (!mobile) at(700, focusInput);
  };

  const close = () => {
    if (closingRef.current) { clearTimers(); onCloseRef.current(); return; }
    closingRef.current = true;
    clearTimers();
    setAiOpen(false);
    setBookExpanded(false);
    setGuide(false);
    if (reduced) {
      setPhase('closing');
      at(350, () => onCloseRef.current());
    } else {
      setFast(false);
      setPhase('closing');
      at(1700, () => onCloseRef.current());
    }
  };

  // Keyboard: Escape closes; Tab is kept inside the dialog
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); close(); return; }
      if (e.key !== 'Tab' || !rootRef.current) return;
      const items = Array.from(
        rootRef.current.querySelectorAll<HTMLElement>('button, textarea, input, [href], [tabindex]:not([tabindex="-1"])')
      ).filter((el) => !el.hasAttribute('disabled') && el.offsetParent !== null && getComputedStyle(el).visibility !== 'hidden');
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && (active === first || !rootRef.current.contains(active))) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && (active === last || !rootRef.current.contains(active))) { e.preventDefault(); first.focus(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleAi = () => {
    if (bookExpanded) { setBookExpanded(false); setAiOpen(true); at(750, focusInput); return; }
    setAiOpen((v) => { if (!v) at(750, focusInput); return !v; });
  };
  const toggleBook = () => setBookExpanded((v) => !v);

  // Same context object as before; once a constitutional section is open it also carries that section.
  const section = SPREAD_SECTIONS[spread];
  const askContext = useMemo<AskContext>(
    () =>
      section
        ? {
            ...context,
            section,
            description: `${context.description ? context.description + ' ' : ''}Currently open in the reading room: ${section} (transcription of the Constitution of India as originally enacted, 1950).`,
          }
        : context,
    [context, section]
  );

  const dockOpen = aiOpen && !bookExpanded;
  const interactive = phase === 'settle';

  return createPortal(
    <div
      ref={rootRef}
      className={`rr-overlay${reduced ? ' rr-reduced' : ''}`}
      data-phase={phase}
      data-fast={fast ? '' : undefined}
      data-expanded={bookExpanded ? 'true' : 'false'}
      role="dialog"
      aria-modal="true"
      aria-label="The Constitution of India — Archive Reading Room"
    >
      <div className="rr-backdrop" aria-hidden="true" />

      {/* ——— Top bar ——— */}
      <header className="rr-top">
        <div className="rr-top-title">
          <span className="rr-kicker">Archive Reading Room</span>
          <span className="rr-title">The Constitution of India</span>
        </div>
        <div className="rr-top-actions">
          {!(phase === 'settle') && phase !== 'closing' && (
            <button type="button" className="rr-btn rr-btn-quiet" onClick={skip}>Skip animation</button>
          )}
          <button
            type="button"
            className="rr-btn"
            onClick={toggleBook}
            disabled={!interactive}
            aria-pressed={bookExpanded}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
              {bookExpanded
                ? <path d="M1 4.5h3.5V1M11 4.5H7.5V1M1 7.5h3.5V11M11 7.5H7.5V11" />
                : <path d="M4.5 1H1v3.5M7.5 1H11v3.5M4.5 11H1V7.5M7.5 11H11V7.5" />}
            </svg>
            <span>{bookExpanded ? 'Minimize book' : 'Expand book'}</span>
          </button>
          <button type="button" ref={closeRef} className="rr-btn rr-btn-close" onClick={close}>
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
              <path d="M1.5 1.5l9 9M10.5 1.5l-9 9" />
            </svg>
            <span>Close archive</span>
          </button>
        </div>
      </header>

      {/* ——— The book ——— */}
      <div className="rr-stage">
        <div className="rr-ground" aria-hidden="true" />
        <ConstitutionBook phase={phase} reduced={reduced} onSpreadChange={setSpread} />
        <div className="rr-light" aria-hidden="true" />
      </div>

      {/* ——— AI archive guide, underneath the book ——— */}
      <section className="rr-dock" data-guide={guide ? 'true' : 'false'} data-open={dockOpen ? 'true' : 'false'} aria-label="Archive guide">
        <div className="rr-dock-bar">
          <div className="rr-dock-label">
            <span className="rr-kicker">Your Archive Guide</span>
            <span className="rr-dock-title">Ask Ambedkar about this work</span>
          </div>
          <button
            type="button"
            className="rr-btn rr-btn-gold"
            onClick={toggleAi}
            aria-expanded={dockOpen}
            aria-controls="rr-ai"
            disabled={!guide}
          >
            <span>{dockOpen ? 'Collapse' : 'Ask Ambedkar'}</span>
            <svg className="rr-chev" width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M2 8l4-4 4 4" />
            </svg>
          </button>
        </div>
        <div className="rr-dock-body" id="rr-ai">
          {/* Existing Ask Ambedkar component + existing context mechanism (inline layout only) */}
          <AskPanel isOpen context={askContext} onClose={() => setAiOpen(false)} variant="inline" />
        </div>
      </section>
    </div>,
    document.body
  );
}
