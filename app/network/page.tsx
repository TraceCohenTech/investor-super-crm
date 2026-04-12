"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import type { ContactRecord, SearchData } from "@/lib/types";
import { SOURCE_LABELS } from "@/lib/types";

// Types for the graph
interface GraphNode {
  id: string;
  name: string;
  company: string;
  type: string;
  grade: string;
  strength: string;
  region: string;
  val: number; // node size
  color: string;
}

interface GraphLink {
  source: string;
  target: string;
  via: string;
  strength: number;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

const TYPE_COLORS: { [key: string]: string } = {
  "VC Fund": "#3b82f6",
  "Family Office": "#22c55e",
  "Individual/Angel": "#f59e0b",
  "Angel/Syndicate": "#f59e0b",
  "Founder/Executive": "#ef4444",
  "Startup/Founder": "#ef4444",
  "LP": "#8b5cf6",
  "LP/Family Office": "#8b5cf6",
  "Corporate": "#64748b",
  "University": "#06b6d4",
  "Services": "#71717a",
  "Legal": "#71717a",
  "LinkedIn": "#0ea5e9",
  "Other": "#52525b",
};

const GRADE_SIZES: { [key: string]: number } = { A: 8, B: 5, C: 3, D: 2, F: 1 };

type FilterMode = "company" | "whatsapp" | "source" | "tags";

function buildGraph(
  records: ContactRecord[],
  mode: FilterMode,
  maxNodes: number
): GraphData {
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];
  const nodeMap = new Map<string, GraphNode>();
  const linkSet = new Set<string>();

  // Build a node for each record
  for (const r of records) {
    if (nodeMap.has(r.id)) continue;
    const node: GraphNode = {
      id: r.id,
      name: r.n,
      company: r.c,
      type: r.it,
      grade: r.q,
      strength: r.rs,
      region: r.rg,
      val: GRADE_SIZES[r.q] || 3,
      color: TYPE_COLORS[r.it] || "#52525b",
    };
    nodeMap.set(r.id, node);
  }

  // Helper: group records by a key, return { key: ids[] }
  function groupBy(recs: ContactRecord[], keyer: (r: ContactRecord) => string[]): { [key: string]: string[] } {
    const groups: { [key: string]: string[] } = {};
    for (const r of recs) {
      for (const k of keyer(r)) {
        if (!k) continue;
        if (!groups[k]) groups[k] = [];
        groups[k].push(r.id);
      }
    }
    return groups;
  }

  function addLinks(groups: { [key: string]: string[] }, via: (k: string) => string, str: number, minSize: number, maxSize: number, sampleN: number) {
    for (const key of Object.keys(groups)) {
      const ids = groups[key];
      if (ids.length < minSize || ids.length > maxSize) continue;
      const sample = ids.slice(0, sampleN);
      for (let i = 0; i < sample.length; i++) {
        for (let j = i + 1; j < sample.length; j++) {
          const lk = [sample[i], sample[j]].sort().join("-");
          if (!linkSet.has(lk)) {
            linkSet.add(lk);
            links.push({ source: sample[i], target: sample[j], via: via(key), strength: str });
          }
        }
      }
    }
  }

  // Build edges based on mode
  if (mode === "company") {
    const groups = groupBy(records, r => r.c ? [r.c.toLowerCase().trim()] : []);
    addLinks(groups, k => k, 2, 2, 30, 15);
  } else if (mode === "whatsapp") {
    const groups = groupBy(records, r => r.wg || []);
    addLinks(groups, k => k, 3, 2, 40, 20);
  } else if (mode === "source") {
    const groups = groupBy(records, r => r.src);
    addLinks(groups, k => SOURCE_LABELS[k] || k, 1, 2, 200, 30);
  } else if (mode === "tags") {
    const groups = groupBy(records, r => r.tg || []);
    addLinks(groups, k => k, 1, 2, 100, 25);
  }

  // Only include nodes that have at least one link
  const connectedIds = new Set<string>();
  for (const l of links) {
    connectedIds.add(l.source);
    connectedIds.add(l.target);
  }

  // Limit nodes to maxNodes by picking those with most connections
  const connectionCount: { [id: string]: number } = {};
  for (const l of links) {
    connectionCount[l.source] = (connectionCount[l.source] || 0) + 1;
    connectionCount[l.target] = (connectionCount[l.target] || 0) + 1;
  }

  const topIds = Array.from(connectedIds)
    .sort((a, b) => (connectionCount[b] || 0) - (connectionCount[a] || 0))
    .slice(0, maxNodes);
  const topSet = new Set(topIds);

  for (const id of topIds) {
    const node = nodeMap.get(id);
    if (node) nodes.push(node);
  }

  const filteredLinks = links.filter(l => topSet.has(l.source) && topSet.has(l.target));

  return { nodes, links: filteredLinks };
}

export default function NetworkPage() {
  const [data, setData] = useState<SearchData | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<FilterMode>("company");
  const [filterQuery, setFilterQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("");
  const [filterGrade, setFilterGrade] = useState<string>("");
  const [maxNodes, setMaxNodes] = useState(200);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ForceGraph = useRef<any>(null);
  const [graphReady, setGraphReady] = useState(false);

  useEffect(() => {
    import("@/data/search-index.json").then((mod) => {
      setData(mod.default as unknown as SearchData);
      setLoading(false);
    });
    import("react-force-graph-2d").then((mod) => {
      ForceGraph.current = mod.default;
      setGraphReady(true);
    });
  }, []);

  // Filter records before building graph
  const filteredRecords = useMemo(() => {
    if (!data) return [];
    let recs = data.records as ContactRecord[];
    if (filterQuery) {
      const q = filterQuery.toLowerCase();
      recs = recs.filter(r =>
        r.n.toLowerCase().includes(q) ||
        r.c.toLowerCase().includes(q) ||
        (r.tg || []).some(t => t.includes(q))
      );
    }
    if (filterType) {
      recs = recs.filter(r => r.it === filterType);
    }
    if (filterGrade) {
      recs = recs.filter(r => r.q === filterGrade);
    }
    return recs;
  }, [data, filterQuery, filterType, filterGrade]);

  const graphData = useMemo(() => {
    if (filteredRecords.length === 0) return { nodes: [], links: [] };
    return buildGraph(filteredRecords, mode, maxNodes);
  }, [filteredRecords, mode, maxNodes]);

  const handleNodeClick = useCallback((node: GraphNode) => {
    window.open(`/contact/${node.id}`, "_blank");
  }, []);

  const handleNodeHover = useCallback((node: GraphNode | null) => {
    setHoveredNode(node);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="text-2xl mb-3">🕸️</div>
          <div className="text-sm text-[#a1a1aa]">Loading network data...</div>
        </div>
      </div>
    );
  }

  const FG = ForceGraph.current;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">🕸️ Network Graph</h1>
        <p className="text-sm text-[#a1a1aa] mt-1">
          Visualize connections between {data ? data.records.length.toLocaleString() : "..."} contacts
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Connection mode */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-[#52525b]">Connect by:</span>
          {(["company", "whatsapp", "source", "tags"] as FilterMode[]).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                mode === m
                  ? "bg-[#3b82f6]/10 border-[#3b82f6]/30 text-[#3b82f6]"
                  : "bg-[#18181b] border-[#27272a] text-[#a1a1aa] hover:text-white hover:border-[#3f3f46]"
              }`}
            >
              {m === "company" ? "🏢 Company" : m === "whatsapp" ? "💬 WhatsApp" : m === "source" ? "📊 Source" : "🏷️ Tags"}
            </button>
          ))}
        </div>

        {/* Filter input */}
        <input
          type="text"
          placeholder="Filter by name, company, tag..."
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
          className="bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-[#52525b] focus:outline-none focus:border-[#3b82f6] w-48 transition-colors"
        />

        {/* Type filter */}
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-1.5 text-xs text-[#a1a1aa] focus:outline-none focus:border-[#3b82f6] transition-colors"
        >
          <option value="">All Types</option>
          <option value="VC Fund">VC Fund</option>
          <option value="Family Office">Family Office</option>
          <option value="Founder/Executive">Founder/Executive</option>
          <option value="Individual/Angel">Individual/Angel</option>
          <option value="LP">LP</option>
          <option value="Corporate">Corporate</option>
        </select>

        {/* Grade filter */}
        <select
          value={filterGrade}
          onChange={(e) => setFilterGrade(e.target.value)}
          className="bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-1.5 text-xs text-[#a1a1aa] focus:outline-none focus:border-[#3b82f6] transition-colors"
        >
          <option value="">All Grades</option>
          <option value="A">Grade A</option>
          <option value="B">Grade B</option>
          <option value="C">Grade C</option>
        </select>

        {/* Max nodes */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-[#52525b]">Max nodes:</span>
          {[100, 200, 500].map(n => (
            <button
              key={n}
              onClick={() => setMaxNodes(n)}
              className={`px-2.5 py-1 text-[11px] rounded-lg border transition-colors ${
                maxNodes === n
                  ? "bg-white/10 border-white/20 text-white"
                  : "bg-[#18181b] border-[#27272a] text-[#a1a1aa] hover:text-white"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-4 text-xs text-[#a1a1aa]">
        <span>{graphData.nodes.length} nodes</span>
        <span>{graphData.links.length} connections</span>
        {filteredRecords.length !== data?.records.length && (
          <span className="text-[#52525b]">(from {filteredRecords.length.toLocaleString()} filtered contacts)</span>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {Object.entries(TYPE_COLORS).slice(0, 8).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-[10px] text-[#a1a1aa]">{type}</span>
          </div>
        ))}
      </div>

      {/* Hover info */}
      {hoveredNode && (
        <div className="bg-[#18181b] border border-[#3b82f6]/30 rounded-xl p-3 flex items-center gap-4">
          <div>
            <div className="text-sm font-medium text-white">{hoveredNode.name}</div>
            <div className="text-xs text-[#a1a1aa]">{hoveredNode.company || "—"}</div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] rounded-full bg-[#27272a] text-[#a1a1aa]">{hoveredNode.type}</span>
            <span className="px-2 py-0.5 text-[10px] rounded-full bg-[#27272a] text-[#a1a1aa]">Grade {hoveredNode.grade}</span>
            {hoveredNode.region && <span className="px-2 py-0.5 text-[10px] rounded-full bg-[#27272a] text-[#a1a1aa]">{hoveredNode.region}</span>}
          </div>
          <Link href={`/contact/${hoveredNode.id}`} className="text-xs text-[#3b82f6] hover:text-blue-300 ml-auto">
            View Profile →
          </Link>
        </div>
      )}

      {/* Graph */}
      <div className="bg-[#09090b] border border-[#27272a] rounded-xl overflow-hidden" style={{ height: "60vh" }}>
        {graphReady && FG && graphData.nodes.length > 0 ? (
          <FG
            graphData={graphData}
            nodeLabel={(node: GraphNode) => `${node.name}\n${node.company || ""}\n${node.type}`}
            nodeColor={(node: GraphNode) => node.color}
            nodeVal={(node: GraphNode) => node.val}
            linkColor={() => "rgba(59, 130, 246, 0.15)"}
            linkWidth={(link: GraphLink) => link.strength * 0.5}
            backgroundColor="#09090b"
            onNodeClick={handleNodeClick}
            onNodeHover={handleNodeHover}
            nodeCanvasObject={(node: GraphNode & { x: number; y: number }, ctx: CanvasRenderingContext2D, globalScale: number) => {
              const label = node.name.split(" ")[0];
              const fontSize = Math.max(10 / globalScale, 2);
              const r = Math.sqrt(node.val) * 2;
              ctx.beginPath();
              ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
              ctx.fillStyle = node.color;
              ctx.fill();
              if (globalScale > 1.5) {
                ctx.font = `${fontSize}px -apple-system, system-ui, sans-serif`;
                ctx.textAlign = "center";
                ctx.textBaseline = "top";
                ctx.fillStyle = "#e4e4e7";
                ctx.fillText(label, node.x, node.y + r + 2);
              }
            }}
            nodePointerAreaPaint={(node: GraphNode & { x: number; y: number }, color: string, ctx: CanvasRenderingContext2D) => {
              const r = Math.sqrt(node.val) * 2 + 3;
              ctx.beginPath();
              ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
              ctx.fillStyle = color;
              ctx.fill();
            }}
            warmupTicks={50}
            cooldownTicks={100}
            width={typeof window !== "undefined" ? window.innerWidth - 310 : 800}
            height={typeof window !== "undefined" ? window.innerHeight * 0.6 : 500}
          />
        ) : graphData.nodes.length === 0 ? (
          <div className="flex items-center justify-center h-full text-[#52525b] text-sm">
            No connections found. Try adjusting your filters or connection mode.
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-[#52525b] text-sm">
            Loading graph renderer...
          </div>
        )}
      </div>
    </div>
  );
}
