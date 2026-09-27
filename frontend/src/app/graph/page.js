"use client";
import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { useRouter } from "next/navigation";

const API_BASE = "http://localhost:8000";

const TYPE_COLORS = {
  person: "#1f77b4",
  theme: "#ff7f0e",
  institution: "#2ca02c",
  writing: "#9467bd",
  intervention: "#7f7f7f",
};

export default function GraphPage() {
  const svgRef = useRef(null);
  const [graphData, setGraphData] = useState(null);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    fetch(`${API_BASE}/graph-data`)
      .then((res) => res.json())
      .then(setGraphData)
      .catch(() => setError("Could not load graph data. Is the backend running?"));
  }, []);

  useEffect(() => {
    if (!graphData || !graphData.nodes || graphData.nodes.length === 0) return;

    const width = 900;
    const height = 650;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // clear on re-render

    const g = svg.append("g");

    svg.call(
      d3.zoom().on("zoom", (event) => {
        g.attr("transform", event.transform);
      })
    );

    const nodes = graphData.nodes.map((d) => ({ ...d }));
    const links = graphData.edges.map((d) => ({ ...d }));

    const simulation = d3
      .forceSimulation(nodes)
      .force("link", d3.forceLink(links).id((d) => d.id).distance(90))
      .force("charge", d3.forceManyBody().strength(-250))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide(25));

    const link = g
      .append("g")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", "#ccc")
      .attr("stroke-width", 1);

    const node = g
      .append("g")
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("r", (d) => (d.type === "person" ? 10 : 6))
      .attr("fill", (d) => TYPE_COLORS[d.type] || "#999")
      .style("cursor", "pointer")
      .call(
        d3
          .drag()
          .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      )
      .on("click", (event, d) => setSelected(d));

    const label = g
      .append("g")
      .selectAll("text")
      .data(nodes)
      .join("text")
      .text((d) => d.label)
      .attr("font-size", 9)
      .attr("dx", 10)
      .attr("dy", 3)
      .style("pointer-events", "none");

    simulation.on("tick", () => {
      link
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);
      node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
      label.attr("x", (d) => d.x).attr("y", (d) => d.y);
    });

    return () => simulation.stop();
  }, [graphData]);

  function askAboutNode() {
    if (!selected) return;
    router.push(`/ask?q=${encodeURIComponent(`Tell me about ${selected.label}`)}`);
  }

  if (error) return <p style={{ color: "#b00020" }}>{error}</p>;

  return (
    <div>
      <h1>Knowledge Graph</h1>
      <p style={{ fontSize: "0.9em", color: "#555" }}>
        Drag nodes to explore. Click a node to see details. {graphData ? `${graphData.nodes.length} nodes, ${graphData.edges.length} connections.` : "Loading..."}
      </p>

      <div style={{ display: "flex", gap: "1.5rem" }}>
        <svg ref={svgRef} width={900} height={650} style={{ border: "1px solid #ddd" }} />

        {selected && (
          <div style={{ width: 260, padding: "1rem", border: "1px solid #ddd" }}>
            <h3>{selected.label}</h3>
            <p style={{ fontSize: "0.8em", color: "#666", textTransform: "capitalize" }}>{selected.type}</p>
            {selected.description && <p>{selected.description}</p>}
            {selected.summary && <p>{selected.summary}</p>}
            {selected.date && <p><strong>Date:</strong> {selected.date}</p>}
            {selected.volume && <p><strong>Volume:</strong> {selected.volume}</p>}
            <button onClick={askAboutNode} style={{ marginTop: "0.5rem" }}>
              Ask Ambedkar about this →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}