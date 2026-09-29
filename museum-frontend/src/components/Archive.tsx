import { useState } from 'react';
import type { Book, AskContext } from '../types';

interface Props {
  onOpenBook: (book: Book) => void;
  onAskWithContext: (ctx: AskContext) => void;
}

type ExhibitTab = 'books' | 'manuscripts' | 'speeches' | 'documents';

export const BOOKS: Book[] = [
  {
    id: 'annihilation-of-caste',
    title: 'Annihilation of Caste',
    year: 1936,
    description: 'A devastating critique of Hindu social order and the caste system — the speech that was never delivered.',
    longDescription: 'Written as an address to the Jat-Pat-Todak Mandal of Lahore, this text was never delivered as the conference was cancelled after the organizers objected to its contents. It remains one of Ambedkar\'s most powerful and provocative works.',
    image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&h=800&fit=crop&auto=format&q=80',
    color: '#5c3a1e',
    tags: ['Social Justice', 'Caste', 'Reform'],
    pages: 226,
    publisher: 'Self-published',
    excerpt: '"Turn in any direction you like, caste is the monster that crosses your path. You cannot have political reform, you cannot have economic reform, unless you kill this monster."',
  },
  {
    id: 'buddha-and-dhamma',
    title: 'The Buddha and His Dhamma',
    subtitle: 'A Critical Edition',
    year: 1956,
    description: 'Ambedkar\'s magnum opus — a reinterpretation of Buddhism as a philosophy of social liberation.',
    longDescription: 'Completed shortly before his death and published posthumously, this work presents Buddhism as a rational, humanistic religion and a path to social emancipation for the oppressed.',
    image: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=600&h=800&fit=crop&auto=format&q=80',
    color: '#1a2f4a',
    tags: ['Buddhism', 'Philosophy', 'Liberation'],
    pages: 584,
    publisher: 'People\'s Education Society',
    excerpt: '"Religion must mainly be a matter of principles only. It cannot be a matter of rules. The moment it degenerates into rules it ceases to be a religion, as it kills responsibility which is the essence of a truly religious act."',
  },
  {
    id: 'who-were-shudras',
    title: 'Who Were the Shudras?',
    year: 1946,
    description: 'A historical investigation into the origins of the fourth varna — dismantling Brahminical mythologies.',
    longDescription: 'A rigorous historical and anthropological inquiry into the origins of the Shudras, the fourth caste in the Hindu varna system, challenging traditional narratives.',
    image: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=600&h=800&fit=crop&auto=format&q=80',
    color: '#2a1f0d',
    tags: ['History', 'Caste', 'Vedic India'],
    pages: 283,
    publisher: 'Thacker and Company',
    excerpt: '"The Shudras are not a single race. They are composed of communities which were originally Kshatriyas but were subsequently degraded to the status of Shudras."',
  },
  {
    id: 'thoughts-on-pakistan',
    title: 'Thoughts on Pakistan',
    year: 1940,
    description: 'An analytical examination of the demand for a separate Muslim homeland and its constitutional implications.',
    longDescription: 'A comprehensive analysis of the Pakistan question, examining it from historical, cultural, and constitutional perspectives with Ambedkar\'s characteristic rigor.',
    image: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=600&h=800&fit=crop&auto=format&q=80',
    color: '#0d2035',
    tags: ['Partition', 'Constitutional Law', 'Muslim League'],
    pages: 412,
    publisher: 'Thacker and Company',
  },
  {
    id: 'states-and-minorities',
    title: 'States and Minorities',
    year: 1947,
    description: 'A constitutional blueprint for protecting the rights of minorities in independent India.',
    longDescription: 'Submitted to the Constituent Assembly as a memorandum on behalf of the Scheduled Castes Federation, this work outlines safeguards for minorities in the new Indian state.',
    image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&h=800&fit=crop&auto=format&q=80',
    color: '#1a1a2e',
    tags: ['Constitutional Law', 'Minorities', 'Federalism'],
    pages: 167,
    publisher: 'Thacker and Company',
  },
  {
    id: 'problem-of-rupee',
    title: 'The Problem of the Rupee',
    year: 1923,
    description: 'Ambedkar\'s doctoral thesis — a pioneering work on Indian monetary policy and exchange rates.',
    longDescription: 'Submitted at the London School of Economics, this work established Ambedkar as a serious economist and influenced the formation of the Reserve Bank of India.',
    image: 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=600&h=800&fit=crop&auto=format&q=80',
    color: '#1c2b0a',
    tags: ['Economics', 'Monetary Policy', 'LSE'],
    pages: 194,
    publisher: 'P. S. King & Son',
  },
];

const MANUSCRIPTS = [
  { id: 'manu-1', title: 'Draft Constitution Notes', year: '1947–48', image: 'https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?w=400&h=300&fit=crop&auto=format&q=75', description: 'Personal annotations and drafts from the Constitution-drafting period.' },
  { id: 'manu-2', title: 'Castes in India', year: '1916', image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400&h=300&fit=crop&auto=format&q=75', description: 'Seminar paper presented at Columbia University — the first scholarly analysis of caste as an institution.' },
  { id: 'manu-3', title: 'Waiting for a Visa', year: '1935–36', image: 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=400&h=300&fit=crop&auto=format&q=75', description: 'Autobiographical notes on the experience of caste discrimination in colonial India.' },
];

const TAB_CONFIG: { id: ExhibitTab; label: string }[] = [
  { id: 'books', label: 'Books' },
  { id: 'manuscripts', label: 'Manuscripts' },
  { id: 'speeches', label: 'Speeches' },
  { id: 'documents', label: 'Documents' },
];

export default function Archive({ onOpenBook, onAskWithContext }: Props) {
  const [activeTab, setActiveTab] = useState<ExhibitTab>('books');

  return (
    <section
      id="archive"
      className="min-h-screen py-24"
      style={{ background: 'var(--bg2)' }}
    >
      <div className="max-w-[1400px] mx-auto px-6">
        {/* Section header */}
        <div className="mb-16">
          <div className="museum-label mb-4">Exhibit Hall</div>
          <h2
            className="museum-heading text-5xl mb-4"
            style={{ fontFamily: 'Fraunces, serif', color: 'var(--fg1)' }}
          >
            The Archive
          </h2>
          <p className="max-w-lg text-base leading-relaxed" style={{ color: 'var(--fg2)', fontWeight: 300 }}>
            A curated collection of Ambedkar's published works, personal manuscripts,
            public speeches, and archival photographs spanning six decades of transformative thought.
          </p>
        </div>

        {/* Exhibit tabs */}
        <div
          className="flex gap-0 mb-12 overflow-x-auto"
          style={{ borderBottom: '1px solid var(--ac-border)' }}
        >
          {TAB_CONFIG.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className="flex-shrink-0 px-6 py-4 text-xs tracking-[0.14em] uppercase relative transition-colors duration-200"
              style={{
                fontFamily: 'DM Mono, monospace',
                color: activeTab === id ? 'var(--ac1)' : 'var(--fg3)',
              }}
            >
              {label}
              {activeTab === id && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-px"
                  style={{ background: 'var(--ac1)' }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Books exhibit */}
        {activeTab === 'books' && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {BOOKS.map((book, i) => (
              <div
                key={book.id}
                className="book-card group"
                style={{ animationDelay: `${i * 0.07}s` }}
                onClick={() => onOpenBook(book)}
              >
                {/* exhibit-card handles all hover via CSS — cursor, glow, lift */}
                <div className="exhibit-card">
                  {/* Book image */}
                  <div className="relative h-56 overflow-hidden" style={{ background: book.color }}>
                    <img
                      src={book.image}
                      alt={book.title}
                      className="exhibit-img w-full h-full object-cover opacity-55"
                    />
                    {/* Bottom gradient for text legibility */}
                    <div
                      className="absolute inset-0"
                      style={{ background: 'linear-gradient(to top, rgba(8,12,26,0.92) 0%, rgba(8,12,26,0.1) 55%, transparent 100%)' }}
                    />

                    {/* Year badge — top right */}
                    <div
                      className="absolute top-4 right-4 px-2 py-1"
                      style={{
                        fontFamily: 'DM Mono, monospace',
                        fontSize: '0.65rem',
                        background: 'rgba(8,12,26,0.72)',
                        color: 'var(--ac1)',
                        border: '1px solid var(--ac-border)',
                      }}
                    >
                      {book.year}
                    </div>

                    {/* "CLICK TO EXPLORE" cue — slides in on hover via CSS */}
                    <div className="book-explore-cue">
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M1 1h8v8H1zM3 1v8M3 3h6M3 6h6" />
                      </svg>
                      Open in Reading Room
                    </div>
                  </div>

                  {/* Book info */}
                  <div className="p-5">
                    {/* Title */}
                    <h3
                      className="text-base font-semibold mb-2 leading-tight"
                      style={{ fontFamily: 'Fraunces, serif', color: 'var(--fg1)' }}
                    >
                      {book.title}
                    </h3>
                    <p
                      className="text-sm leading-relaxed mb-4"
                      style={{ color: 'var(--fg2)', fontSize: '0.8125rem', fontWeight: 300 }}
                    >
                      {book.description}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {book.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 text-xs"
                          style={{
                            fontFamily: 'DM Mono, monospace',
                            fontSize: '0.6rem',
                            letterSpacing: '0.1em',
                            background: 'var(--ac-bg)',
                            color: 'var(--ac1)',
                            border: '1px solid var(--ac-border)',
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Bottom action bar */}
                    <div
                      className="flex items-center justify-between pt-3"
                      style={{ borderTop: '1px solid var(--ac-border)' }}
                    >
                      <button
                        className="flex items-center gap-1.5 text-xs tracking-[0.1em] uppercase"
                        style={{ fontFamily: 'DM Mono, monospace', color: 'var(--ac1)', fontSize: '0.6rem' }}
                        onClick={(e) => { e.stopPropagation(); onOpenBook(book); }}
                      >
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.3">
                          <path d="M1 1h8v8H1z" /><path d="M3 1v8M3 3h6M3 6h6" />
                        </svg>
                        Open
                      </button>
                      <button
                        className="text-xs tracking-[0.1em] uppercase transition-colors"
                        style={{ fontFamily: 'DM Mono, monospace', color: 'var(--fg3)', fontSize: '0.6rem' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onAskWithContext({ type: 'book', id: book.id, title: book.title, description: book.description });
                        }}
                      >
                        Ask Ambedkar →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Manuscripts */}
        {activeTab === 'manuscripts' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {MANUSCRIPTS.map((m) => (
              <div
                key={m.id}
                className="exhibit-card group"
              >
                <div className="relative h-44 overflow-hidden">
                  <img
                    src={m.image}
                    alt={m.title}
                    className="exhibit-img w-full h-full object-cover opacity-60"
                    style={{ filter: 'sepia(40%)' }}
                  />
                  <div
                    className="absolute inset-0"
                    style={{ background: 'linear-gradient(to top, rgba(8,12,26,0.85) 0%, transparent 50%)' }}
                  />
                  <div className="absolute bottom-4 left-4">
                    <div
                      className="text-xs mb-1"
                      style={{ fontFamily: 'DM Mono, monospace', color: '#c4a35a', fontSize: '0.6rem', letterSpacing: '0.14em' }}
                    >
                      Manuscript · {m.year}
                    </div>
                    <h3
                      className="text-base font-semibold"
                      style={{ fontFamily: 'Fraunces, serif', color: '#f2ede0' }}
                    >
                      {m.title}
                    </h3>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-sm" style={{ color: 'rgba(242,237,224,0.55)', fontWeight: 300, fontSize: '0.8rem' }}>
                    {m.description}
                  </p>
                  <button
                    className="mt-3 text-xs tracking-[0.1em] uppercase"
                    style={{ fontFamily: 'DM Mono, monospace', color: '#c4a35a', fontSize: '0.6rem' }}
                    onClick={() => onAskWithContext({ type: 'book', id: m.id, title: m.title })}
                  >
                    Ask Ambedkar →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Speeches */}
        {activeTab === 'speeches' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { id: 'sp-1', title: 'Speech on the Drafting Committee Report', date: '25 Nov 1949', venue: 'Constituent Assembly of India', duration: '~3 hours', description: 'The landmark closing address to the Constituent Assembly, articulating a vision for Indian democracy and constitutional morality.' },
              { id: 'sp-2', title: 'Annihilation of Caste — The Address', date: 'Apr 1936', venue: 'Jat-Pat-Todak Mandal, Lahore (undelivered)', duration: '~45 min', description: 'The speech that was never delivered — suppressed by the organizers due to its radical critique of Hindu social order.' },
              { id: 'sp-3', title: 'The Buddha or Karl Marx', date: '1956', venue: 'World Fellowship of Buddhists, Kathmandu', duration: '~60 min', description: 'A comparative analysis of Buddhist and Marxist approaches to social liberation and human dignity.' },
              { id: 'sp-4', title: 'Castes in India: Their Mechanism, Genesis and Development', date: '9 May 1916', venue: 'Columbia University Anthropology Seminar', duration: '~30 min', description: 'Ambedkar\'s first major scholarly presentation — establishing caste as an enclosed class endogamously enforced.' },
            ].map((sp) => (
              <div key={sp.id} className="exhibit-card p-6 group">
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="text-xs tracking-[0.1em]"
                    style={{ fontFamily: 'DM Mono, monospace', color: 'var(--ac1)', fontSize: '0.6rem' }}
                  >
                    {sp.date} · {sp.duration}
                  </div>
                  <button
                    onClick={() => onAskWithContext({ type: 'book', id: sp.id, title: sp.title })}
                    className="text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ fontFamily: 'DM Mono, monospace', color: 'var(--ac1)', fontSize: '0.6rem', letterSpacing: '0.1em' }}
                  >
                    Ask →
                  </button>
                </div>
                <h3
                  className="text-lg font-semibold mb-2 leading-tight"
                  style={{ fontFamily: 'Fraunces, serif', color: 'var(--cream-full)' }}
                >
                  {sp.title}
                </h3>
                <div
                  className="text-xs mb-3"
                  style={{ fontFamily: 'DM Mono, monospace', color: 'rgba(196,163,90,0.6)', fontSize: '0.65rem', letterSpacing: '0.08em' }}
                >
                  {sp.venue}
                </div>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--cream-55)', fontWeight: 300 }}>
                  {sp.description}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Documents */}
        {activeTab === 'documents' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { id: 'doc-1', title: 'Draft Constitution of India', date: 'Feb 1948', pages: 315, type: 'Constitutional Document', description: 'The first complete draft of the Constitution of India, submitted by the Drafting Committee under Ambedkar\'s chairmanship.' },
              { id: 'doc-2', title: 'Memorandum on Minority Rights', date: 'May 1947', pages: 48, type: 'Legal Memorandum', description: 'Submitted to the Constituent Assembly on behalf of the Scheduled Castes Federation, outlining fundamental rights and safeguards.' },
              { id: 'doc-3', title: 'Poona Pact Agreement', date: '24 Sep 1932', pages: 4, type: 'Historical Agreement', description: 'The agreement between Ambedkar and Gandhi that replaced separate electorates for Depressed Classes with reserved seats.' },
              { id: 'doc-4', title: 'Resignation from Cabinet', date: '27 Sep 1951', pages: 3, type: 'Official Letter', description: 'Letter to Prime Minister Nehru resigning from the Union Cabinet, citing failure to pass the Hindu Code Bill.' },
            ].map((doc) => (
              <div key={doc.id} className="exhibit-card p-6 flex gap-5 group">
                <div
                  className="flex-shrink-0 w-14 flex items-center justify-center"
                  style={{ background: 'rgba(196,163,90,0.08)', border: '1px solid rgba(196,163,90,0.15)' }}
                >
                  <svg width="24" height="28" viewBox="0 0 24 28" fill="none" stroke="rgba(196,163,90,0.6)" strokeWidth="1.2">
                    <path d="M4 1h11l5 5v21H4V1z" />
                    <path d="M15 1v5h5" />
                    <path d="M7 11h10M7 15h10M7 19h6" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    className="text-xs mb-1"
                    style={{ fontFamily: 'DM Mono, monospace', color: 'var(--ac1)', fontSize: '0.6rem', letterSpacing: '0.12em' }}
                  >
                    {doc.type} · {doc.date} · {doc.pages}pp
                  </div>
                  <h3
                    className="text-base font-semibold mb-2"
                    style={{ fontFamily: 'Fraunces, serif', color: 'var(--cream-full)' }}
                  >
                    {doc.title}
                  </h3>
                  <p className="text-sm" style={{ color: 'var(--cream-55)', fontWeight: 300, fontSize: '0.8rem' }}>
                    {doc.description}
                  </p>
                  <div className="flex gap-4 mt-3">
                    <button className="text-xs tracking-[0.1em] uppercase" style={{ fontFamily: 'DM Mono, monospace', color: 'var(--ac1)', fontSize: '0.6rem' }}>
                      Read
                    </button>
                    <button
                      className="text-xs tracking-[0.1em] uppercase"
                      style={{ fontFamily: 'DM Mono, monospace', color: 'var(--cream-4)', fontSize: '0.6rem' }}
                      onClick={() => onAskWithContext({ type: 'book', id: doc.id, title: doc.title })}
                    >
                      Ask Ambedkar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
