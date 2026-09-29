import { useState, useEffect, useRef, useCallback } from 'react';
import type { GraphNode, GraphEdge, AskContext } from '../types';

interface Props {
  onAskWithContext: (ctx: AskContext) => void;
}

const NODES: GraphNode[] = [
  // Center — Ambedkar
  { id: 'ambedkar', label: 'B. R. Ambedkar', sublabel: '1891–1956', type: 'person', x: 0, y: 0, size: 28 },
  // People
  { id: 'gandhi', label: 'Mahatma Gandhi', sublabel: 'Political opponent', type: 'person', x: -280, y: -80, size: 18 },
  { id: 'nehru', label: 'Jawaharlal Nehru', sublabel: 'Prime Minister', type: 'person', x: 260, y: -140, size: 18 },
  { id: 'dewey', label: 'John Dewey', sublabel: 'Mentor, Columbia', type: 'person', x: -320, y: 120, size: 14 },
  { id: 'rajendra', label: 'Rajendra Prasad', sublabel: 'Assembly President', type: 'person', x: 300, y: 60, size: 14 },
  { id: 'phule', label: 'Jyotirao Phule', sublabel: 'Ideological predecessor', type: 'person', x: -180, y: 220, size: 14 },
  { id: 'buddha', label: 'Gautama Buddha', sublabel: 'Spiritual guide', type: 'person', x: 160, y: 240, size: 16 },
  // Themes
  { id: 'caste', label: 'Caste System', sublabel: 'Core critique', type: 'theme', x: -140, y: -200, size: 22 },
  { id: 'democracy', label: 'Democracy', sublabel: 'Constitutional ideal', type: 'theme', x: 120, y: -220, size: 18 },
  { id: 'equality', label: 'Social Equality', sublabel: 'Foundational value', type: 'theme', x: -60, y: 240, size: 20 },
  { id: 'education', label: 'Education', sublabel: 'Path to liberation', type: 'theme', x: 200, y: 180, size: 16 },
  { id: 'buddhism', label: 'Buddhism', sublabel: 'Navayana', type: 'theme', x: -240, y: 180, size: 18 },
  // Institutions
  { id: 'columbia', label: 'Columbia University', sublabel: 'New York, 1913', type: 'institution', x: -360, y: -10, size: 14 },
  { id: 'lse', label: 'LSE', sublabel: 'London, 1916', type: 'institution', x: -340, y: -160, size: 13 },
  { id: 'ca', label: 'Constituent Assembly', sublabel: '1946–1949', type: 'institution', x: 340, y: -60, size: 18 },
  { id: 'rbi', label: 'Reserve Bank of India', sublabel: 'Founded on his thesis', type: 'institution', x: 260, y: -240, size: 13 },
  // Writings
  { id: 'aoc', label: 'Annihilation of Caste', sublabel: '1936', type: 'writing', x: -200, y: -280, size: 16 },
  { id: 'buddha-book', label: 'The Buddha and His Dhamma', sublabel: '1956', type: 'writing', x: 80, y: 300, size: 15 },
  { id: 'shudras', label: 'Who Were the Shudras?', sublabel: '1946', type: 'writing', x: -320, y: 260, size: 13 },
  { id: 'rupee', label: 'The Problem of the Rupee', sublabel: '1923', type: 'writing', x: 340, y: 200, size: 12 },
  // Events
  { id: 'mahad', label: 'Mahad Satyagraha', sublabel: '1927', type: 'event', x: -80, y: -320, size: 16 },
  { id: 'poona', label: 'Poona Pact', sublabel: '1932', type: 'event', x: 320, y: -200, size: 14 },
  { id: 'nagpur', label: 'Nagpur Conversion', sublabel: '1956', type: 'event', x: 40, y: -300, size: 15 },
];

const EDGES: GraphEdge[] = [
  { id: 'e1', source: 'ambedkar', target: 'caste', strength: 3 },
  { id: 'e2', source: 'ambedkar', target: 'democracy', strength: 3 },
  { id: 'e3', source: 'ambedkar', target: 'equality', strength: 3 },
  { id: 'e4', source: 'ambedkar', target: 'ca', strength: 3 },
  { id: 'e5', source: 'ambedkar', target: 'gandhi', strength: 2, label: 'Poona Pact' },
  { id: 'e6', source: 'ambedkar', target: 'nehru', strength: 2 },
  { id: 'e7', source: 'ambedkar', target: 'dewey', strength: 2, label: 'mentored by' },
  { id: 'e8', source: 'ambedkar', target: 'columbia', strength: 2 },
  { id: 'e9', source: 'ambedkar', target: 'lse', strength: 2 },
  { id: 'e10', source: 'ambedkar', target: 'aoc', strength: 3 },
  { id: 'e11', source: 'ambedkar', target: 'buddha-book', strength: 3 },
  { id: 'e12', source: 'ambedkar', target: 'mahad', strength: 2 },
  { id: 'e13', source: 'ambedkar', target: 'nagpur', strength: 3 },
  { id: 'e14', source: 'ambedkar', target: 'buddhism', strength: 3 },
  { id: 'e15', source: 'ambedkar', target: 'rupee', strength: 2 },
  { id: 'e16', source: 'ambedkar', target: 'shudras', strength: 2 },
  { id: 'e17', source: 'caste', target: 'aoc', strength: 2 },
  { id: 'e18', source: 'buddhism', target: 'buddha-book', strength: 2 },
  { id: 'e19', source: 'buddhism', target: 'nagpur', strength: 2 },
  { id: 'e20', source: 'ca', target: 'democracy', strength: 2 },
  { id: 'e21', source: 'gandhi', target: 'poona', strength: 2 },
  { id: 'e22', source: 'ambedkar', target: 'poona', strength: 2 },
  { id: 'e23', source: 'rupee', target: 'rbi', strength: 1 },
  { id: 'e24', source: 'phule', target: 'ambedkar', strength: 1, label: 'influenced' },
  { id: 'e25', source: 'ambedkar', target: 'education', strength: 2 },
  { id: 'e26', source: 'dewey', target: 'columbia', strength: 1 },
  { id: 'e27', source: 'rajendra', target: 'ca', strength: 1 },
  { id: 'e28', source: 'nehru', target: 'ca', strength: 1 },
  { id: 'e29', source: 'ambedkar', target: 'phule', strength: 1 },
  { id: 'e30', source: 'ambedkar', target: 'buddha', strength: 2 },
  { id: 'e31', source: 'buddha', target: 'buddhism', strength: 2 },
];

const TYPE_COLORS: Record<GraphNode['type'], string> = {
  person: '#c4a35a',
  theme: '#6ea8d9',
  institution: '#a0d488',
  writing: '#d4886a',
  event: '#b08ae0',
};

const TYPE_LABELS: Record<GraphNode['type'], string> = {
  person: 'Person',
  theme: 'Theme',
  institution: 'Institution',
  writing: 'Writing',
  event: 'Event',
};

const SCALE = 0.65;
const OFFSET_X = 500;
const OFFSET_Y = 380;

type BackendNode = {
  id: string;
  label: string;
  type: 'person' | 'theme' | 'institution' | 'writing' | 'intervention';
  description?: string;
  date?: string;
  volume?: string;
};
type BackendEdge = {
  source: string;
  target: string;
  relationship: string;
};
const BACKEND_TYPE_MAP: Record<BackendNode['type'], GraphNode['type']> = {
  person: 'person',
  theme: 'theme',
  institution: 'institution',
  writing: 'writing',
  intervention: 'event',
};

function layoutBackendGraph(nodes: BackendNode[], edges: BackendEdge[]): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const degree = new Map<string, number>();
  edges.forEach((e) => {
    degree.set(e.source, (degree.get(e.source) || 0) + 1);
    degree.set(e.target, (degree.get(e.target) || 0) + 1);
  });

  const hub = nodes
    .filter((n) => n.type === 'person')
    .sort((a, b) => (degree.get(b.id) || 0) - (degree.get(a.id) || 0))[0];

  const positions = new Map<string, { x: number; y: number }>();
  if (hub) positions.set(hub.id, { x: 0, y: 0 });

  const groups: Record<string, BackendNode[]> = {};
  nodes.forEach((n) => {
    if (n.id === hub?.id) return;
    (groups[n.type] ||= []).push(n);
  });
  Object.values(groups).forEach((g) => g.sort((a, b) => (degree.get(b.id) || 0) - (degree.get(a.id) || 0)));

  const sectorOrder: BackendNode['type'][] = ['institution', 'theme', 'writing', 'person', 'intervention'];
  const weights = sectorOrder.map((t) => Math.sqrt((groups[t]?.length || 0) || 1));
  const totalWeight = weights.reduce((a, b) => a + b, 0);

  const RING_GAP = 110;
  const BASE_RADIUS = 150;

  let angleCursor = 0;
  sectorOrder.forEach((type, sIdx) => {
    const group = groups[type] || [];
    const span = (weights[sIdx] / totalWeight) * 2 * Math.PI;
    const sectorStart = angleCursor;
    angleCursor += span;
    if (group.length === 0) return;

    let idx = 0;
    let ring = 0;
    while (idx < group.length) {
      const radius = BASE_RADIUS + ring * RING_GAP;
      const ringCapacity = Math.max(3, Math.floor((span * radius) / 55));
      const countThisRing = Math.min(ringCapacity, group.length - idx);
      for (let i = 0; i < countThisRing; i++) {
        const angle = sectorStart + ((i + 0.5) / countThisRing) * span;
        const n = group[idx];
        positions.set(n.id, { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius });
        idx++;
      }
      ring++;
    }
  });

  const graphNodes: GraphNode[] = nodes.map((n) => {
    const pos = positions.get(n.id) || { x: 0, y: 0 };
    const deg = degree.get(n.id) || 1;
    return {
      id: n.id,
      label: n.label,
      sublabel: [n.date, n.volume ? `Vol. ${n.volume}` : ''].filter(Boolean).join(' · ') || undefined,
      type: BACKEND_TYPE_MAP[n.type] || 'theme',
      x: pos.x,
      y: pos.y,
      size: n.id === hub?.id ? 28 : Math.min(9 + deg * 1.1, 20),
    };
  });

  const graphEdges: GraphEdge[] = edges.map((e, i) => ({
    id: `be${i}`,
    source: e.source,
    target: e.target,
    strength: e.relationship === 'authored' ? 3 : e.relationship?.includes('intervened') ? 2 : 1,
  }));

  return { nodes: graphNodes, edges: graphEdges };
}

export default function KnowledgeGraph({ onAskWithContext }: Props) {
  const [selected, setSelected] = useState<GraphNode | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [graphData, setGraphData] = useState<{ nodes: GraphNode[]; edges: GraphEdge[] }>({ nodes: NODES, edges: EDGES });
  const svgRef = useRef<SVGSVGElement>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const dragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });


  useEffect(() => {
  fetch('http://localhost:8000/graph-data')
    .then((r) => r.json())
    .then((data) => {
      if (data.nodes?.length) {
        setGraphData(layoutBackendGraph(data.nodes, data.edges || []));
      }
    })
    .catch(() => {/* use static data */});
}, []);

  const toSvgX = (x: number) => x * SCALE + OFFSET_X + pan.x;
  const toSvgY = (y: number) => y * SCALE + OFFSET_Y + pan.y;

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as SVGElement).tagName === 'svg') {
      dragging.current = true;
      lastMouse.current = { x: e.clientX, y: e.clientY };
    }
  };
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (dragging.current) {
      const dx = e.clientX - lastMouse.current.x;
      const dy = e.clientY - lastMouse.current.y;
      lastMouse.current = { x: e.clientX, y: e.clientY };
      setPan((p) => ({ x: p.x + dx / zoom, y: p.y + dy / zoom }));
    }
  }, [zoom]);
  const handleMouseUp = () => { dragging.current = false; };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((z) => Math.max(0.4, Math.min(2.5, z - e.deltaY * 0.001)));
  };

  const connectedIds = selected
    ? new Set([
        selected.id,
        ...graphData.edges
          .filter((e) => e.source === selected.id || e.target === selected.id)
          .flatMap((e) => [e.source, e.target]),
      ])
    : null;

  return (
    <section
      id="graph"
      className="relative py-24"
      style={{ background: 'var(--bg1)', minHeight: '100vh' }}
    >
      {/* Header */}
      <div className="max-w-[1400px] mx-auto px-6 mb-8">
        <div className="museum-label mb-4">Interconnections</div>
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h2
              className="museum-heading text-5xl mb-4"
              style={{ fontFamily: 'Fraunces, serif', color: 'var(--cream-full)' }}
            >
              Knowledge Graph
            </h2>
            <p
              className="max-w-lg text-base leading-relaxed"
              style={{ color: 'var(--cream-55)', fontWeight: 300 }}
            >
              An interactive map of Ambedkar's intellectual universe — people, ideas,
              institutions, writings, and pivotal events. Click any node to explore.
            </p>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4">
            {Object.entries(TYPE_LABELS).map(([type, label]) => (
              <div key={type} className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: TYPE_COLORS[type as GraphNode['type']] }}
                />
                <span
                  style={{
                    fontFamily: 'DM Mono, monospace',
                    fontSize: '0.6rem',
                    letterSpacing: '0.1em',
                    color: 'var(--cream-5)',
                  }}
                >
                  {label.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-2 mt-4">
          <button onClick={() => setZoom((z) => Math.min(2.5, z + 0.15))} className="w-8 h-8 flex items-center justify-center" style={{ border: '1px solid rgba(196,163,90,0.2)', color: '#c4a35a', fontSize: '1.1rem' }}>+</button>
          <button onClick={() => setZoom((z) => Math.max(0.4, z - 0.15))} className="w-8 h-8 flex items-center justify-center" style={{ border: '1px solid rgba(196,163,90,0.2)', color: '#c4a35a', fontSize: '1.1rem' }}>−</button>
          <button onClick={() => { setPan({ x: 0, y: 0 }); setZoom(1); }} className="px-3 h-8 flex items-center" style={{ border: '1px solid rgba(196,163,90,0.2)', color: 'var(--cream-5)', fontFamily: 'DM Mono, monospace', fontSize: '0.6rem', letterSpacing: '0.1em' }}>RESET</button>
          <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.6rem', color: 'var(--cream-3)' }}>
            Drag to pan · Scroll to zoom
          </span>
        </div>
      </div>

      <div className="flex gap-0">
        {/* Graph SVG */}
        <div
          className="flex-1 relative overflow-hidden"
          style={{ height: 640, background: 'var(--bg1)', cursor: dragging.current ? 'grabbing' : 'grab' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          <svg
            ref={svgRef}
            width="100%"
            height="100%"
            style={{ userSelect: 'none' }}
          >
            <g transform={`scale(${zoom}) translate(${pan.x},${pan.y})`}>
              {/* Edges */}
              {graphData.edges.map((edge) => {
                const src = graphData.nodes.find((n) => n.id === edge.source);
                const tgt = graphData.nodes.find((n) => n.id === edge.target);
                if (!src || !tgt) return null;
                const isHighlighted = selected && (connectedIds?.has(src.id) && connectedIds?.has(tgt.id));
                const isDimmed = selected && !isHighlighted;
                return (
                  <line
                    key={edge.id}
                    x1={toSvgX(src.x)}
                    y1={toSvgY(src.y)}
                    x2={toSvgX(tgt.x)}
                    y2={toSvgY(tgt.y)}
                    stroke={isHighlighted ? 'rgba(196,163,90,0.5)' : 'rgba(196,163,90,0.1)'}
                    strokeWidth={edge.strength * (isHighlighted ? 1.5 : 0.7)}
                    opacity={isDimmed ? 0.05 : 1}
                    style={{ transition: 'opacity 0.3s ease, stroke 0.3s ease' }}
                  />
                );
              })}

              {/* Nodes */}
              {graphData.nodes.map((node) => {
                const cx = toSvgX(node.x);
                const cy = toSvgY(node.y);
                const color = TYPE_COLORS[node.type];
                const isSelected = selected?.id === node.id;
                const isHovered = hovered === node.id;
                const isDimmed = selected && !connectedIds?.has(node.id);
                const r = node.size;

                return (
                  <g
                    key={node.id}
                    className="graph-node"
                    transform={`translate(${cx},${cy})`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelected(isSelected ? null : node);
                    }}
                    onMouseEnter={() => setHovered(node.id)}
                    onMouseLeave={() => setHovered(null)}
                    style={{ opacity: isDimmed ? 0.15 : 1, transition: 'opacity 0.3s ease' }}
                  >
                    {/* Glow ring for selected */}
                    {isSelected && (
                      <circle
                        r={r + 8}
                        fill="none"
                        stroke={color}
                        strokeWidth="1"
                        opacity="0.35"
                        style={{ animation: 'pulseGold 2s ease-in-out infinite' }}
                      />
                    )}

                    {/* Node circle */}
                    <circle
                      r={r}
                      fill={isSelected || isHovered ? color : `${color}28`}
                      stroke={color}
                      strokeWidth={isSelected ? 2 : 1}
                      style={{ transition: 'all 0.2s ease' }}
                    />

                    {/* Ambedkar center dot */}
                    {node.id === 'ambedkar' && (
                      <circle r={5} fill={color} opacity={0.9} />
                    )}

                    {/* Label */}
                    {(zoom>1.3 || isSelected || isHovered) && (
                      <text
                       y={r + 16}
                       textAnchor="middle"
                       fontSize={node.size > 20 ? 11 : 9}
                       fontFamily="DM Mono, monospace"
                       fontWeight={isSelected ? 500 : 300}
                       style={{ fill: isSelected || isHovered ? 'var(--cream-full)' : 'var(--cream-55)', transition: 'fill 0.2s ease', pointerEvents: 'none' }}
                       >
                        {node.label.length > 18 ? node.label.slice(0, 16) + '…' : node.label}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          </svg>

          {/* Dim overlay when node selected */}
          {selected && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'rgba(8,12,26,0.1)' }}
            />
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div
            className="w-72 flex-shrink-0 flex flex-col source-panel"
            style={{
              background: 'var(--bg3)',
              borderLeft: '1px solid rgba(196,163,90,0.18)',
              height: 640,
              overflowY: 'auto',
            }}
          >
            <div className="p-5">
              {/* Close */}
              <div className="flex items-center justify-between mb-5">
                <div
                  className="flex items-center gap-2"
                  style={{
                    fontFamily: 'DM Mono, monospace',
                    fontSize: '0.6rem',
                    letterSpacing: '0.12em',
                    color: TYPE_COLORS[selected.type],
                    background: `${TYPE_COLORS[selected.type]}18`,
                    padding: '3px 8px',
                  }}
                >
                  {TYPE_LABELS[selected.type].toUpperCase()}
                </div>
                <button
                  onClick={() => setSelected(null)}
                  style={{ color: 'var(--cream-35)' }}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4">
                    <path d="M1 1l10 10M11 1L1 11" />
                  </svg>
                </button>
              </div>

              <h3
                className="text-xl font-semibold mb-1 leading-tight"
                style={{ fontFamily: 'Fraunces, serif', color: 'var(--cream-full)' }}
              >
                {selected.label}
              </h3>
              {selected.sublabel && (
                <p
                  className="text-xs mb-4"
                  style={{ color: 'var(--cream-45)', fontFamily: 'DM Mono, monospace', fontSize: '0.65rem' }}
                >
                  {selected.sublabel}
                </p>
              )}

              <div
                className="mb-4 pt-4"
                style={{ borderTop: '1px solid rgba(196,163,90,0.1)' }}
              >
                <div className="museum-label mb-2" style={{ fontSize: '0.55rem' }}>Connected Nodes</div>
                <div className="flex flex-col gap-1.5">
                  {graphData.edges
                    .filter((e) => e.source === selected.id || e.target === selected.id)
                    .map((edge) => {
                      const otherId = edge.source === selected.id ? edge.target : edge.source;
                      const other = graphData.nodes.find((n) => n.id === otherId);
                      if (!other) return null;
                      return (
                        <button
                          key={edge.id}
                          onClick={() => setSelected(other)}
                          className="flex items-center gap-2 text-left transition-colors duration-200 group"
                        >
                          <div
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ background: TYPE_COLORS[other.type] }}
                          />
                          <span
                            className="text-xs group-hover:text-ivory transition-colors"
                            style={{ color: 'var(--cream-55)', fontSize: '0.75rem' }}
                          >
                            {other.label}
                          </span>
                          {edge.label && (
                            <span
                              className="text-xs italic"
                              style={{ color: 'rgba(196,163,90,0.5)', fontSize: '0.6rem' }}
                            >
                              ({edge.label})
                            </span>
                          )}
                        </button>
                      );
                    })
                  }
                </div>
              </div>

              <button
                onClick={() => onAskWithContext({
                  type: 'node',
                  id: selected.id,
                  title: selected.label,
                  description: selected.sublabel,
                })}
                className="w-full py-2.5 text-xs tracking-[0.1em] uppercase flex items-center justify-center gap-2 mt-4"
                style={{
                  fontFamily: 'DM Mono, monospace',
                  background: 'transparent',
                  color: '#c4a35a',
                  border: '1px solid rgba(196,163,90,0.35)',
                  fontSize: '0.6rem',
                }}
              >
                Ask Ambedkar About This
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
