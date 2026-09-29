export type Section = 'home' | 'archive' | 'timeline' | 'debates' | 'compare' | 'graph' | 'audiovisual' | 'map' | 'ask';

export type AskMode = 'student' | 'scholar' | 'constitutional';
export type AskLang = 'en' | 'hi' | 'mr' | 'ta';
export type SearchIn = 'debates' | 'writings' | 'both';

export interface AskContext {
  type: 'book' | 'timeline' | 'debate' | 'node' | 'map' | 'general';
  id: string;
  title: string;
  description?: string;
  /** Optional finer-grained location inside the context, e.g. "Article 14" in the Constitution book. */
  section?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Source[];
  timestamp: Date;
  loading?: boolean;
}

export interface Source {
  id: string;
  title: string;
  type: string;
  year?: string;
  date?: string;
  volume?: string;
  page?: string;
  section?: string | number;
  excerpt?: string;
  snippet?: string;
  url?: string;
}

export interface Book {
  id: string;
  title: string;
  subtitle?: string;
  year: number;
  description: string;
  longDescription: string;
  image: string;
  color: string;
  tags: string[];
  pages?: number;
  publisher?: string;
  excerpt?: string;
}

export interface TimelineEvent {
  id: string;
  year: number;
  month?: number;
  title: string;
  description: string;
  image?: string;
  category: 'birth' | 'education' | 'writing' | 'politics' | 'constitution' | 'religion' | 'milestone' | 'death';
  significance: 1 | 2 | 3;
}

export interface DebateResult {
  id: string;
  date: string;
  volume: string;
  topic: string;
  excerpt: string;
  speaker: string;
  assembly?: string;
  page?: string;
}

export interface GraphNode {
  id: string;
  label: string;
  sublabel?: string;
  type: 'person' | 'theme' | 'institution' | 'writing' | 'event';
  x: number;
  y: number;
  size: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  strength: number;
}

export interface AudioTrack {
  id: string;
  title: string;
  type: 'speech' | 'interview' | 'reading';
  year: number;
  duration: string;
  description: string;
  transcript: string[];
}

export interface MapLocation {
  id: string;
  name: string;
  state: string;
  x: number;
  y: number;
  events: string[];
  description: string;
}

export interface AppState {
  section: Section;
  showAskPanel: boolean;
  askContext: AskContext | null;
  highContrast: boolean;
  largeText: boolean;
  isFullscreen: boolean;
}
