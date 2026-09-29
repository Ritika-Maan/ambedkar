import { useState, useEffect } from 'react';
import type { Section } from '../types';

interface Props {
  activeSection: Section;
  onNavigate: (s: Section) => void;
  showAskPanel: boolean;
  onToggleAsk: () => void;
  highContrast: boolean;
  largeText: boolean;
  onToggleHighContrast: () => void;
  onToggleLargeText: () => void;
  onToggleFullscreen: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

const NAV_LINKS: { label: string; id: Section }[] = [
  { label: 'Archive',         id: 'archive'  },
  { label: 'Timeline',        id: 'timeline' },
  { label: 'Debates',         id: 'debates'  },
  { label: 'Compare',         id: 'compare'  },
  { label: 'Knowledge Graph', id: 'graph'    },
];

export default function Navigation({
  activeSection, onNavigate, showAskPanel, onToggleAsk,
  highContrast, largeText, onToggleHighContrast, onToggleLargeText,
  onToggleFullscreen, theme, onToggleTheme,
}: Props) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
      style={{
        background: scrolled ? 'var(--nav-bg)' : 'linear-gradient(to bottom, var(--nav-bg) 0%, transparent 100%)',
        backdropFilter: scrolled ? 'blur(14px)' : 'none',
        borderBottom: scrolled ? '1px solid var(--nav-border)' : 'none',
      }}
    >
      <div className="max-w-[1400px] mx-auto px-6 flex items-center h-16">
        {/* Logo */}
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-3 group flex-shrink-0"
        >
          <div
            className="w-8 h-8 flex items-center justify-center"
            style={{ border: '1px solid var(--ac-border-h)' }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="3" fill="var(--ac1)" />
              <circle cx="8" cy="8" r="6.5" stroke="var(--ac1)" strokeWidth="0.8" fill="none" />
            </svg>
          </div>
          <div
            className="text-xs tracking-[0.22em] uppercase"
            style={{ fontFamily: 'DM Mono, monospace', color: 'var(--ac1)' }}
          >
            Ambedkar Archive
          </div>
        </button>

        {/* Desktop Nav Links */}
        <div className="hidden lg:flex items-center gap-8 ml-12">
          {NAV_LINKS.map((link) => (
            <button
              key={link.label}
              onClick={() => onNavigate(link.id)}
              className="relative text-xs tracking-[0.14em] uppercase transition-colors duration-200"
              style={{
                fontFamily: 'DM Mono, monospace',
                color: activeSection === link.id ? 'var(--ac1)' : 'var(--fg3)',
              }}
            >
              {link.label}
              {activeSection === link.id && (
                <span
                  className="absolute -bottom-1 left-0 right-0 h-px"
                  style={{ background: 'var(--ac1)' }}
                />
              )}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        {/* Search */}
        {searchOpen ? (
          <div className="flex items-center gap-2 mr-4">
            <input
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Escape') setSearchOpen(false); }}
              placeholder="Search the archive…"
              className="bg-transparent outline-none w-48 pb-1 text-sm"
              style={{
                fontFamily: 'Source Sans 3, sans-serif',
                color: 'var(--fg1)',
                borderBottom: '1px solid var(--ac-border-h)',
              }}
            />
            <button onClick={() => setSearchOpen(false)} style={{ color: 'var(--fg3)' }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" fill="none" />
              </svg>
            </button>
          </div>
        ) : (
          <button
            onClick={() => setSearchOpen(true)}
            className="p-2 transition-colors duration-200 mr-1"
            style={{ color: 'var(--fg3)' }}
            title="Search archive"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
              <circle cx="6.5" cy="6.5" r="4.5" />
              <path d="M10.5 10.5l3.5 3.5" />
            </svg>
          </button>
        )}

        {/* Accessibility controls */}
        <div className="hidden md:flex items-center gap-1 mr-1">
          <button
            onClick={onToggleHighContrast}
            title="Toggle high contrast"
            className="p-2 transition-opacity duration-200"
            style={{ color: highContrast ? 'var(--ac1)' : 'var(--fg4)' }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2" />
              <path d="M7 1v12" stroke="currentColor" strokeWidth="1.2" />
              <path d="M7 1a6 6 0 010 12" fill="currentColor" />
            </svg>
          </button>

          <button
            onClick={onToggleLargeText}
            title="Toggle large text"
            className="p-2 transition-opacity duration-200"
            style={{
              fontFamily: 'DM Mono, monospace',
              fontSize: '10px',
              color: largeText ? 'var(--ac1)' : 'var(--fg4)',
            }}
          >
            Aa
          </button>

          <button
            onClick={onToggleFullscreen}
            title="Fullscreen / kiosk mode"
            className="p-2 transition-opacity duration-200"
            style={{ color: 'var(--fg4)' }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2">
              <path d="M1 5V1h4M9 1h4v4M13 9v4H9M5 13H1V9" />
            </svg>
          </button>
        </div>

        {/* ——— Dark / Light Mode Toggle ——— */}
        <button
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="relative flex items-center justify-center mr-3 transition-all duration-300"
          style={{
            width: 44,
            height: 24,
            borderRadius: 12,
            background: theme === 'light' ? 'var(--ac-bg2)' : 'rgba(196,163,90,0.15)',
            border: '1px solid var(--ac-border)',
            flexShrink: 0,
          }}
        >
          {/* Track icon: sun (light) / moon (dark) */}
          <span
            className="absolute transition-all duration-300 flex items-center justify-center"
            style={{
              width: 18,
              height: 18,
              borderRadius: '50%',
              background: 'var(--ac1)',
              left: theme === 'light' ? 3 : 'calc(100% - 21px)',
            }}
          >
            {theme === 'light' ? (
              /* Sun icon */
              <svg width="10" height="10" viewBox="0 0 10 10" fill="var(--bg1)">
                <circle cx="5" cy="5" r="2.2" />
                <path stroke="var(--bg1)" strokeWidth="1" fill="none"
                  d="M5 0.5v1M5 8.5v1M0.5 5h1M8.5 5h1M2 2l.7.7M7.3 7.3l.7.7M2 8l.7-.7M7.3 2.7l.7-.7" />
              </svg>
            ) : (
              /* Moon icon */
              <svg width="10" height="10" viewBox="0 0 10 10" fill="var(--bg1)">
                <path d="M7.5 5.5A3 3 0 014 2a3.5 3.5 0 100 6 3 3 0 003.5-2.5z" />
              </svg>
            )}
          </span>
        </button>

        {/* Ask Ambedkar CTA */}
        <button
          onClick={onToggleAsk}
          className="hidden md:flex items-center gap-2 px-4 py-2 text-xs tracking-[0.12em] uppercase transition-all duration-300"
          style={{
            fontFamily: 'DM Mono, monospace',
            background: showAskPanel ? 'var(--ac1)' : 'transparent',
            color: showAskPanel ? 'var(--bg1)' : 'var(--ac1)',
            border: '1px solid var(--ac-border-h)',
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <path d="M6 0a6 6 0 100 12A6 6 0 006 0zm.5 9.5h-1v-4h1v4zm0-5.5h-1V3h1v1z" />
          </svg>
          Ask Ambedkar
        </button>

        {/* Mobile menu */}
        <button
          className="lg:hidden p-2 ml-2"
          onClick={() => setMenuOpen(!menuOpen)}
          style={{ color: 'var(--fg2)' }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4">
            {menuOpen
              ? <><path d="M3 3l14 14M17 3L3 17" /></>
              : <><path d="M3 5h14M3 10h14M3 15h14" /></>}
          </svg>
        </button>
      </div>

      {/* Mobile menu panel */}
      {menuOpen && (
        <div
          className="lg:hidden px-6 pb-6"
          style={{
            background: 'var(--nav-bg)',
            borderTop: '1px solid var(--nav-border)',
            backdropFilter: 'blur(14px)',
          }}
        >
          {NAV_LINKS.map((link) => (
            <button
              key={link.label}
              onClick={() => { onNavigate(link.id); setMenuOpen(false); }}
              className="block w-full text-left py-3 text-sm tracking-[0.1em] uppercase border-b"
              style={{
                fontFamily: 'DM Mono, monospace',
                color: 'var(--fg2)',
                borderColor: 'var(--nav-border)',
              }}
            >
              {link.label}
            </button>
          ))}
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={() => { onToggleAsk(); setMenuOpen(false); }}
              className="flex-1 py-3 text-sm tracking-[0.1em] uppercase"
              style={{
                fontFamily: 'DM Mono, monospace',
                color: 'var(--ac1)',
                border: '1px solid var(--ac-border)',
              }}
            >
              Ask Ambedkar
            </button>
            <button
              onClick={onToggleTheme}
              className="py-3 px-4 text-sm tracking-[0.1em] uppercase"
              style={{
                fontFamily: 'DM Mono, monospace',
                color: 'var(--ac1)',
                border: '1px solid var(--ac-border)',
                fontSize: '0.6rem',
              }}
            >
              {theme === 'dark' ? '☀ Light' : '☽ Dark'}
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
