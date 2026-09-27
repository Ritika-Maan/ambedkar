"use client";
import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import graphData from "./graph-data.json";

type NodeType = "person" | "theme" | "institution" | "intervention";

type GraphNode = {
  id: string;
  label: string;
  type: NodeType;
  description?: string;
  summary?: string;
  date?: string;
  volume?: string;
  x?: number;
  y?: number;
};

type GraphEdge = {
  source: string | GraphNode;
  target: string | GraphNode;
  relationship: string;
  justification: string;
};

const COLORS: Record<NodeType, string> = {
  person: "#c9a24b",
  theme: "#4fa593",
  institution: "#b06a5b",
  intervention: "#6f83c9",
};

export default function GraphPage() {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [selected, setSelected] = useState<GraphNode | null>(null);
  const [connections, setConnections] = useState<
    { node: GraphNode; relationship: string; justification: string }[]
  >([]);

  useEffect(() => {
    const nodes: GraphNode[] = (graphData.nodes as GraphNode[]).map((d) => ({ ...d }));
    const links: GraphEdge[] = (graphData.edges as GraphEdge[]).map((d) => ({ ...d }));
    const nodeById = new Map(nodes.map((n) => [n.id, n]));

    const width = 900;
    const height = 640;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("viewBox", `0 0 ${width} ${height}`);

    const simulation = d3
      .forceSimulation(nodes as any)
      .force(
        "link",
        d3
          .forceLink(links as any)
          .id((d: any) => d.id)
          .distance(70)
          .strength(0.4)
      )
      .force("charge", d3.forceManyBody().strength(-140))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(22));

    const link = svg
      .append("g")
      .attr("stroke", "#333c5e")
      .attr("stroke-width", 1)
      .selectAll("line")
      .data(links)
      .join("line");

    const node = svg
      .append("g")
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("r", (d: any) => (d.id === "P01" ? 16 : 9))
      .attr("fill", (d: any) => COLORS[d.type as NodeType] ?? "#888")
      .attr("stroke", "#14192b")
      .attr("stroke-width", 1.5)
      .style("cursor", "pointer")
      .call(
        d3
          .drag<SVGCircleElement, any>()
          .on("start", (event, d: any) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d: any) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d: any) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      )
      .on("click", (_event, d: any) => {
        setSelected(d);
        const linked = links
          .map((l: any) => {
            const sourceId = l.source.id ?? l.source;
            const targetId = l.target.id ?? l.target;
            if (sourceId !== d.id && targetId !== d.id) return null;
            const otherId = sourceId === d.id ? targetId : sourceId;
            const otherNode = nodeById.get(otherId);
            if (!otherNode) return null;
            return { node: otherNode, relationship: l.relationship, justification: l.justification };
          })
          .filter(Boolean) as { node: GraphNode; relationship: string; justification: string }[];
        setConnections(linked);
      });

    const label = svg
      .append("g")
      .selectAll("text")
      .data(nodes)
      .join("text")
      .text((d: any) => d.label)
      .attr("font-size", 9)
      .attr("fill", "#a9a6c4")
      .attr("dx", 12)
      .attr("dy", 4)
      .style("pointer-events", "none");

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);
      node.attr("cx", (d: any) => d.x).attr("cy", (d: any) => d.y);
      label.attr("x", (d: any) => d.x).attr("y", (d: any) => d.y);
    });

    return () => {
      simulation.stop();
    };
  }, []);

  return (
    <div className="relative" style={{ background: "#14192b", minHeight: "calc(100vh - 73px)" }}>
      <div className="px-6 pt-8 pb-2">
        <h1 className="font-serif-display text-2xl" style={{ color: "#ede6d6" }}>
          Knowledge graph
        </h1>
        <p className="text-sm mt-1" style={{ color: "#a9a6c4" }}>
          Click a node to see its connections and justifications.
        </p>
      </div>

      <svg ref={svgRef} className="w-full" style={{ height: "640px" }} />

      {selected && (
        <div
          className="absolute top-0 right-0 h-full w-full sm:w-96 p-6 overflow-y-auto"
          style={{ background: "#1a2038", borderLeft: "1px solid #333c5e", color: "#ede6d6" }}
        >
          <button onClick={() => setSelected(null)} className="text-sm mb-4" style={{ color: "#c9a24b" }}>
            ← close
          </button>
          <span className="text-xs uppercase tracking-wide" style={{ color: COLORS[selected.type] }}>
            {selected.type}
          </span>
          <h2 className="font-serif-display text-xl mt-1 mb-3">{selected.label}</h2>
          {selected.description && <p className="text-sm opacity-80 mb-4">{selected.description}</p>}
          {selected.summary && <p className="text-sm opacity-80 mb-4">{selected.summary}</p>}
          {selected.date && (
            <p className="text-xs opacity-60 mb-4">
              {selected.date} · Vol. {selected.volume}
            </p>
          )}

          <h3 className="text-sm font-medium mt-6 mb-2" style={{ color: "#c9a24b" }}>
            Connections
          </h3>
          <div className="flex flex-col gap-3">
            {connections.map((c, i) => (
              <div key={i} className="text-sm pb-3" style={{ borderBottom: "1px solid #333c5e" }}>
                <p className="font-medium">{c.node.label}</p>
                <p className="text-xs opacity-60 mb-1">{c.relationship}</p>
                <p className="text-xs opacity-80">{c.justification}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
