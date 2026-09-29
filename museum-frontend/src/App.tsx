import { useState, useEffect, useCallback } from 'react';
import Navigation from './components/Navigation';
import Hero from './components/Hero';
import Archive from './components/Archive';
import BookModal from './components/BookModal';
import Timeline from './components/Timeline';
import Debates from './components/Debates';
import Compare from './components/Compare';
import KnowledgeGraph from './components/KnowledgeGraph';
import AskPanel from './components/AskPanel';
import AudioVisual from './components/AudioVisual';
import MappingLegacy from './components/MappingLegacy';
import type { Section, Book, AskContext } from './types';

type Theme = 'dark' | 'light';

function Footer() {
  return (
    <footer
      className="py-12"
      style={{
        background: '#080c1a',
        borderTop: '1px solid rgba(196,163,90,0.1)',
      }}
    >
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          <div>
            <div className="museum-label mb-4">Ambedkar Archive</div>
            <p
              className="text-sm leading-relaxed"
              style={{ color: 'rgba(242,237,224,0.4)', fontWeight: 300, fontSize: '0.8125rem' }}
            >
              A living digital museum preserving the works, speeches, and legacy
              of Dr. B. R. Ambedkar for present and future generations.
            </p>
          </div>
          <div>
            <div className="museum-label mb-4">Collections</div>
            <div className="flex flex-col gap-2">
              {['Published Works', 'Manuscripts', 'Constitutional Debates', 'Photographs', 'Speeches'].map((item) => (
                <span
                  key={item}
                  className="text-sm"
                  style={{ color: 'rgba(242,237,224,0.4)', fontSize: '0.8125rem' }}
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
          <div>
            <div className="museum-label mb-4">API Endpoints</div>
            <div className="flex flex-col gap-2">
              {[
                'POST /ask',
                'GET /timeline',
                'POST /compare',
                'GET /debates-search',
                'GET /graph-data',
              ].map((ep) => (
                <span
                  key={ep}
                  className="text-xs"
                  style={{
                    fontFamily: 'DM Mono, monospace',
                    color: 'rgba(196,163,90,0.65)',
                    fontSize: '0.65rem',
                    letterSpacing: '0.06em',
                  }}
                >
                  {ep}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div
          className="pt-8 flex items-center justify-between flex-wrap gap-4"
          style={{ borderTop: '1px solid rgba(196,163,90,0.08)' }}
        >
          <div
            className="text-xs"
            style={{
              fontFamily: 'DM Mono, monospace',
              color: 'rgba(242,237,224,0.45)',
              fontSize: '0.6rem',
              letterSpacing: '0.1em',
            }}
          >
            ASK AMBEDKAR — A LIVING ARCHIVE · DEDICATED TO THE MEMORY OF DR. B. R. AMBEDKAR · 1891–1956
          </div>
          <div
            className="flex items-center gap-2"
            style={{ color: 'rgba(196,163,90,0.3)' }}
          >
            <div className="w-1 h-1 rounded-full" style={{ background: 'currentColor' }} />
            <span
              style={{
                fontFamily: 'DM Mono, monospace',
                fontSize: '0.6rem',
                letterSpacing: '0.1em',
              }}
            >
              EDUCATE · AGITATE · ORGANISE
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function App() {
  const [section, setSection] = useState<Section>('home');
  const [showAskPanel, setShowAskPanel] = useState(false);
  const [askContext, setAskContext] = useState<AskContext | null>(null);
  const [openBook, setOpenBook] = useState<Book | null>(null);
  const [highContrast, setHighContrast] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [theme, setTheme] = useState<Theme>(() => {
    try { return (localStorage.getItem('ambedkar-theme') as Theme) || 'dark'; }
    catch { return 'dark'; }
  });

  // Apply theme class
  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light');
    try { localStorage.setItem('ambedkar-theme', theme); } catch {}
  }, [theme]);

  const toggleTheme = useCallback(() => setTheme((t) => t === 'dark' ? 'light' : 'dark'), []);

  // Apply accessibility classes
  useEffect(() => {
    document.documentElement.classList.toggle('high-contrast', highContrast);
  }, [highContrast]);

  useEffect(() => {
    document.documentElement.classList.toggle('large-text', largeText);
  }, [largeText]);

  // Fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  // Scroll to section
  const navigateTo = useCallback((s: Section) => {
    setSection(s);
    const el = document.getElementById(s);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  // Update section based on scroll position
  useEffect(() => {
    const SECTIONS: Section[] = ['home', 'archive', 'timeline', 'debates', 'compare', 'graph', 'audiovisual'];
    const onScroll = () => {
      for (const s of [...SECTIONS].reverse()) {
        const el = document.getElementById(s);
        if (el && el.getBoundingClientRect().top <= 80) {
          setSection(s);
          break;
        }
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleAskWithContext = useCallback((ctx: AskContext) => {
    setAskContext(ctx);
    setShowAskPanel(true);
    setOpenBook(null);
  }, []);

  const handleOpenAsk = useCallback(() => {
    setAskContext(null);
    setShowAskPanel(true);
  }, []);

  return (
    <div
      className={`min-h-screen ${isFullscreen ? 'touch-friendly' : ''}`}
      style={{
        background: 'var(--bg1)',
        color: 'var(--fg1)',
        fontSize: largeText ? '1.125rem' : undefined,
      }}
    >
      <Navigation
        activeSection={section}
        onNavigate={navigateTo}
        showAskPanel={showAskPanel}
        onToggleAsk={() => setShowAskPanel((v) => !v)}
        highContrast={highContrast}
        largeText={largeText}
        onToggleHighContrast={() => setHighContrast((v) => !v)}
        onToggleLargeText={() => setLargeText((v) => !v)}
        onToggleFullscreen={toggleFullscreen}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <main>
        {/* Entrance */}
        <Hero
          onEnterArchive={() => navigateTo('archive')}
          onOpenAsk={handleOpenAsk}
          onAskWithContext={handleAskWithContext}
        />

        {/* The Archive — Books, Manuscripts, Speeches, etc. */}
        <Archive
          onOpenBook={setOpenBook}
          onAskWithContext={handleAskWithContext}
        />

        {/* Immersive timeline */}
        <Timeline onAskWithContext={handleAskWithContext} />

        {/* Constitutional debates search */}
        <Debates onAskWithContext={handleAskWithContext} />

        {/* Compare the same question across two periods */}
        <Compare />

        {/* Interactive knowledge graph */}
        <KnowledgeGraph onAskWithContext={handleAskWithContext} />

        {/* Audio-visual archive */}
        <AudioVisual onAskWithContext={handleAskWithContext} />

        {/* Mapping a Legacy — Interactive India as an archival map exhibit (Ask Ambedkar context preserved) */}
        <MappingLegacy onAskWithContext={handleAskWithContext} />
      </main>

      <Footer />

      {/* Book modal with cinematic opening */}
      <BookModal
        book={openBook}
        onClose={() => setOpenBook(null)}
        onAskWithContext={handleAskWithContext}
      />

      {/* Ask Ambedkar sliding panel */}
      <AskPanel
        isOpen={showAskPanel}
        context={askContext}
        onClose={() => setShowAskPanel(false)}
      />
    </div>
  );
}
