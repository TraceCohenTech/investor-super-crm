"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Html, Stars } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import type { ContactRecord, SearchData } from "@/lib/types";
import { getAllFollowUps, getSnoozed, snoozeContact, setFollowUp, addNote } from "@/lib/local-store";

// ─── COLOR / SIZE TABLES ────────────────────────────────────────────────
const TYPE_COLORS: Record<string, string> = {
  "VC Fund":            "#3b82f6",
  "Family Office":      "#22c55e",
  "Individual/Angel":   "#f59e0b",
  "Angel/Syndicate":    "#f59e0b",
  "Founder/Executive":  "#ef4444",
  "Startup/Founder":    "#ef4444",
  "LP":                 "#8b5cf6",
  "LP/Family Office":   "#8b5cf6",
  "Corporate":          "#64748b",
  "University":         "#06b6d4",
  "Services":           "#71717a",
  "Legal":              "#71717a",
  "LinkedIn":           "#0ea5e9",
  "Other":              "#52525b",
};

const GRADE_SIZE: Record<string, number> = { A: 0.55, B: 0.38, C: 0.28, D: 0.22, F: 0.18 };
const GRADE_EMISSIVE: Record<string, number> = { A: 1.6, B: 1.0, C: 0.6, D: 0.4, F: 0.3 };

const TYPE_GROUPS = [
  "VC Fund",
  "Family Office",
  "LP",
  "Individual/Angel",
  "Founder/Executive",
  "University",
  "Corporate",
  "Legal",
  "LinkedIn",
  "Other",
];

// ─── HELPERS ────────────────────────────────────────────────────────────
function normalizeType(t: string): string {
  if (!t) return "Other";
  if (TYPE_GROUPS.includes(t)) return t;
  if (t === "Angel/Syndicate") return "Individual/Angel";
  if (t === "Startup/Founder") return "Founder/Executive";
  if (t === "LP/Family Office") return "LP";
  if (t === "Services") return "Legal";
  return "Other";
}

function daysSince(dateStr?: string): number {
  if (!dateStr) return 999;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 999;
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
}

// Recency factor 0..1 (1 = fresh, 0 = ancient)
function recencyFactor(dateStr?: string): number {
  const d = daysSince(dateStr);
  if (d < 7) return 1.0;
  if (d < 30) return 0.85;
  if (d < 60) return 0.65;
  if (d < 120) return 0.42;
  if (d < 365) return 0.25;
  return 0.13;
}

// ─── GRAPH BUILD ────────────────────────────────────────────────────────
interface GNode {
  id: string;
  name: string;
  company: string;
  title: string;
  linkedin?: string;
  type: string;
  grade: string;
  region?: string;
  status?: string;
  email?: string;
  emailCount: number;
  lastContact?: string;
  position: [number, number, number];
  color: string;
  size: number;
  emissiveIntensity: number;
  record: ContactRecord;
}

function buildGraph(records: ContactRecord[], maxNodes: number): GNode[] {
  const gradeRank: Record<string, number> = { A: 0, B: 1, C: 2, D: 3, F: 4 };
  const sorted = [...records].sort((a, b) => {
    const ga = gradeRank[a.q] ?? 9;
    const gb = gradeRank[b.q] ?? 9;
    if (ga !== gb) return ga - gb;
    return (b.ec || 0) - (a.ec || 0);
  });
  const trimmed = sorted.slice(0, maxNodes);

  const byType = new Map<string, ContactRecord[]>();
  for (const r of trimmed) {
    const t = normalizeType(r.it);
    if (!byType.has(t)) byType.set(t, []);
    byType.get(t)!.push(r);
  }

  const nodes: GNode[] = [];
  const TYPES_USED = TYPE_GROUPS.filter(t => byType.has(t));

  TYPES_USED.forEach((type, ti) => {
    const φ = (2 * Math.PI * ti) / TYPES_USED.length;
    const θ = ((ti % 3) - 1) * 0.45;
    const TYPE_RADIUS = 28;
    const cx = TYPE_RADIUS * Math.cos(φ) * Math.cos(θ);
    const cy = TYPE_RADIUS * Math.sin(φ) * Math.cos(θ);
    const cz = TYPE_RADIUS * Math.sin(θ) * 0.6;

    const list = byType.get(type)!;
    const byCompany = new Map<string, ContactRecord[]>();
    for (const r of list) {
      const k = (r.c || "Unknown").toLowerCase();
      if (!byCompany.has(k)) byCompany.set(k, []);
      byCompany.get(k)!.push(r);
    }
    const companies = Array.from(byCompany.values());

    const golden = Math.PI * (3 - Math.sqrt(5));
    companies.forEach((compRecs, ci) => {
      const angle = ci * golden;
      const radius = 3.5 + Math.sqrt(ci) * 0.95;
      const compCx = cx + radius * Math.cos(angle);
      const compCy = cy + radius * Math.sin(angle);
      const compCz = cz + ((ci * 7919) % 100 - 50) / 18;

      compRecs.forEach((r, ii) => {
        const subAngle = ii * golden;
        const subR = 0.6 + Math.sqrt(ii) * 0.42;
        const dx = subR * Math.cos(subAngle);
        const dy = subR * Math.sin(subAngle);
        const dz = (((ii * 13 + ci * 17) % 100) - 50) / 60;
        const grade = r.q || "C";
        nodes.push({
          id: r.id,
          name: r.n,
          company: r.c,
          title: r.t,
          linkedin: r.li,
          type,
          grade,
          region: r.rg,
          status: r.st,
          email: r.e,
          emailCount: r.ec || 0,
          lastContact: r.lc,
          position: [compCx + dx, compCy + dy, compCz + dz],
          color: TYPE_COLORS[type] || "#52525b",
          size: GRADE_SIZE[grade] ?? 0.22,
          emissiveIntensity: GRADE_EMISSIVE[grade] ?? 0.4,
          record: r,
        });
      });
    });
  });

  return nodes;
}

// ─── 3D NODE ────────────────────────────────────────────────────────────
interface NodeMeshProps {
  node: GNode;
  isSelected: boolean;
  isMatch: boolean;       // search match — pulse + bright
  isBeacon: boolean;      // in today's outreach queue — strong pulse halo
  recencyOpacity: number; // when recencyTint mode is on
  dimmed: boolean;
  onClick: () => void;
  onContextMenu: (clientX: number, clientY: number) => void;
}

function NodeMesh({
  node, isSelected, isMatch, isBeacon, recencyOpacity, dimmed, onClick, onContextMenu,
}: NodeMeshProps) {
  const ref = useRef<THREE.Mesh>(null);
  const beaconRef = useRef<THREE.Mesh>(null);
  const matchRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (ref.current) {
      const t = isSelected || hovered ? 1.45 : isMatch ? 1.25 : 1.0;
      ref.current.scale.lerp(new THREE.Vector3(t, t, t), 0.18);
    }
    if (beaconRef.current) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 2.2) * 0.18;
      beaconRef.current.scale.set(pulse, pulse, pulse);
      const mat = beaconRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.35 + Math.sin(state.clock.elapsedTime * 2.2) * 0.15;
    }
    if (matchRef.current) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 3.5) * 0.12;
      matchRef.current.scale.set(pulse, pulse, pulse);
      const mat = matchRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.45 + Math.sin(state.clock.elapsedTime * 3.5) * 0.2;
    }
  });

  const ei = isSelected ? 5 : isMatch ? 4 : hovered ? 3.5 : node.emissiveIntensity;
  const opacity = dimmed ? 0.16 : recencyOpacity;

  return (
    <group position={node.position}>
      {/* Beacon — pulsing transparent halo for today's-outreach contacts */}
      {isBeacon && (
        <mesh ref={beaconRef}>
          <sphereGeometry args={[node.size * 2.4, 14, 14]} />
          <meshBasicMaterial color="#22ff88" transparent opacity={0.4} depthWrite={false} />
        </mesh>
      )}
      {/* Search match — outer ring */}
      {isMatch && !isBeacon && (
        <mesh ref={matchRef}>
          <sphereGeometry args={[node.size * 2.0, 14, 14]} />
          <meshBasicMaterial color={node.color} transparent opacity={0.5} depthWrite={false} />
        </mesh>
      )}
      <mesh
        ref={ref}
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        onContextMenu={(e) => {
          e.stopPropagation();
          e.nativeEvent.preventDefault();
          onContextMenu(e.nativeEvent.clientX, e.nativeEvent.clientY);
        }}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = "pointer"; }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = "default"; }}
      >
        <sphereGeometry args={[node.size, 18, 18]} />
        <meshStandardMaterial
          color={node.color}
          emissive={node.color}
          emissiveIntensity={ei}
          metalness={0.4}
          roughness={0.3}
          transparent
          opacity={opacity}
          toneMapped={false}
        />
      </mesh>
      {(isSelected || hovered || isMatch || isBeacon) && !dimmed && (
        <Html
          distanceFactor={20}
          position={[0, node.size + 0.5, 0]}
          style={{ pointerEvents: "none", userSelect: "none" }}
        >
          <div style={{
            color: "white",
            background: "rgba(0,0,0,0.85)",
            padding: "3px 8px",
            borderRadius: 4,
            whiteSpace: "nowrap",
            font: "11px -apple-system, BlinkMacSystemFont, sans-serif",
            fontWeight: isSelected ? 700 : 500,
            border: isSelected ? `1px solid ${node.color}` : isBeacon ? "1px solid #22ff88" : "1px solid rgba(255,255,255,0.12)",
            boxShadow: isSelected ? `0 0 12px ${node.color}80` : isBeacon ? "0 0 12px #22ff88a0" : "none",
          }}>
            <div style={{ fontWeight: 700 }}>{node.name}</div>
            {node.company && (
              <div style={{ fontSize: 10, opacity: 0.7, fontWeight: 400 }}>{node.company}</div>
            )}
          </div>
        </Html>
      )}
    </group>
  );
}

function MeNode() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = 1 + Math.sin(state.clock.elapsedTime * 1.5) * 0.05;
    ref.current.scale.set(t, t, t);
  });
  return (
    <group position={[0, 0, 0]}>
      <mesh ref={ref}>
        <sphereGeometry args={[0.9, 32, 32]} />
        <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={3} toneMapped={false} />
      </mesh>
      <Html distanceFactor={20} position={[0, 1.5, 0]} style={{ pointerEvents: "none" }}>
        <div style={{
          color: "#FFD700", background: "rgba(0,0,0,0.85)",
          padding: "4px 10px", borderRadius: 999,
          whiteSpace: "nowrap",
          font: "12px -apple-system, BlinkMacSystemFont, sans-serif",
          fontWeight: 700,
          border: "1px solid #FFD700",
          boxShadow: "0 0 12px #FFD70080",
        }}>You</div>
      </Html>
    </group>
  );
}

function EdgeLine({ from, to, color, opacity, thick }: {
  from: [number, number, number];
  to: [number, number, number];
  color: string;
  opacity: number;
  thick: boolean;
}) {
  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setFromPoints([new THREE.Vector3(...from), new THREE.Vector3(...to)]);
    return g;
  }, [from, to]);

  if (thick) {
    const dir = new THREE.Vector3(to[0] - from[0], to[1] - from[1], to[2] - from[2]);
    const len = dir.length();
    const mid = new THREE.Vector3((from[0] + to[0]) / 2, (from[1] + to[1]) / 2, (from[2] + to[2]) / 2);
    const orientation = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    return (
      <mesh position={mid.toArray()} quaternion={orientation}>
        <cylinderGeometry args={[0.07, 0.07, len, 8, 1]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={6} toneMapped={false} transparent opacity={opacity} />
      </mesh>
    );
  }
  return (
    <line>
      <primitive object={geom} attach="geometry" />
      <lineBasicMaterial color={color} transparent opacity={opacity} />
    </line>
  );
}

function CameraFocus({ target }: { target: [number, number, number] | null }) {
  const { camera } = useThree();
  useFrame(() => {
    if (!target) return;
    const dir = new THREE.Vector3(...target).normalize();
    const desired = new THREE.Vector3(...target).add(dir.multiplyScalar(13));
    camera.position.lerp(desired, 0.05);
  });
  return null;
}

// ─── PAGE ───────────────────────────────────────────────────────────────
const TYPE_FILTERS = ["VC Fund", "Family Office", "LP", "Individual/Angel", "Founder/Executive", "University", "Corporate"];
const GRADES = ["A", "B", "C"];

export default function Network3DPage() {
  const [data, setData] = useState<SearchData | null>(null);
  const [loading, setLoading] = useState(true);
  const [maxNodes, setMaxNodes] = useState(600);
  const [filterQuery, setFilterQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("");
  const [filterGrade, setFilterGrade] = useState<string>("A");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Mode toggles
  const [recencyTint, setRecencyTint] = useState(false);
  const [beaconToday, setBeaconToday] = useState(true);

  // localStorage state
  const [followUps, setFollowUps] = useState<Record<string, string>>({});
  const [snoozed, setSnoozed] = useState<Record<string, string>>({});

  // Right-click menu
  const [contextMenu, setContextMenu] = useState<{ node: GNode; x: number; y: number } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    import("@/data/search-index.json").then((mod) => {
      setData(mod.default as unknown as SearchData);
      setLoading(false);
    });
    setFollowUps(getAllFollowUps());
    setSnoozed(getSnoozed());
  }, []);

  // Today's outreach queue (mirrors /today criteria)
  const todayQueueIds = useMemo(() => {
    if (!data) return new Set<string>();
    const today = new Date().toISOString().split("T")[0];
    const isSnoozed = (id: string) => snoozed[id] && snoozed[id] > today;
    const ids = new Set<string>();
    for (const r of data.records as ContactRecord[]) {
      if (isSnoozed(r.id)) continue;
      const fuLocal = followUps[r.id];
      if (fuLocal && fuLocal <= today) { ids.add(r.id); continue; }
      if (r.fu && r.fu <= today) { ids.add(r.id); continue; }
      if ((r.sl === "stale" || r.sl === "at-risk") && (r.rs === "Strong" || r.rs === "Medium")) {
        ids.add(r.id);
      }
    }
    return ids;
  }, [data, followUps, snoozed]);

  const filteredRecords = useMemo(() => {
    if (!data) return [];
    let recs = data.records as ContactRecord[];
    if (filterType) recs = recs.filter(r => normalizeType(r.it) === filterType);
    if (filterGrade) recs = recs.filter(r => r.q === filterGrade);
    return recs;
  }, [data, filterType, filterGrade]);

  // Note: search query no longer FILTERS — it now HIGHLIGHTS matches in place
  const nodes = useMemo(() => buildGraph(filteredRecords, maxNodes), [filteredRecords, maxNodes]);
  const nodeById = useMemo(() => {
    const m = new Map<string, GNode>();
    for (const n of nodes) m.set(n.id, n);
    return m;
  }, [nodes]);

  // Match set — when search query is non-empty, every node matching name OR company gets highlighted
  const matchSet = useMemo(() => {
    if (!filterQuery.trim()) return new Set<string>();
    const q = filterQuery.toLowerCase();
    const set = new Set<string>();
    for (const n of nodes) {
      if (n.name.toLowerCase().includes(q) || n.company.toLowerCase().includes(q)) {
        set.add(n.id);
      }
    }
    return set;
  }, [filterQuery, nodes]);

  const selected = selectedId ? nodeById.get(selectedId) : null;
  const targetPos = selected ? selected.position : null;

  const typeCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const n of nodes) c[n.type] = (c[n.type] || 0) + 1;
    return c;
  }, [nodes]);

  // Stats for HUD
  const beaconCount = useMemo(() => {
    let n = 0;
    for (const node of nodes) if (todayQueueIds.has(node.id)) n++;
    return n;
  }, [nodes, todayQueueIds]);

  // Right-click handlers
  const openContextMenu = useCallback((node: GNode, x: number, y: number) => {
    setContextMenu({ node, x, y });
  }, []);
  useEffect(() => {
    const close = () => setContextMenu(null);
    if (contextMenu) {
      window.addEventListener("click", close);
      return () => window.removeEventListener("click", close);
    }
  }, [contextMenu]);

  const flashToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1800);
  }, []);

  const inDays = (n: number) => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d.toISOString().split("T")[0];
  };

  const handleSnooze = (id: string, days: number) => {
    snoozeContact(id, inDays(days));
    setSnoozed(getSnoozed());
    flashToast(`Snoozed ${days} day${days > 1 ? "s" : ""}`);
  };
  const handleFollowUp = (id: string, days: number) => {
    setFollowUp(id, inDays(days));
    setFollowUps(getAllFollowUps());
    flashToast(`Follow-up set for ${days === 1 ? "tomorrow" : `${days} days`}`);
  };
  const handleMarkContacted = (id: string, name: string) => {
    addNote(id, `Reached out via 3D Network on ${new Date().toLocaleDateString()}`);
    flashToast(`Logged: contacted ${name}`);
  };
  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      flashToast(`Copied ${label}`);
    } catch {
      flashToast("Copy failed");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="text-2xl mb-3">🌌</div>
          <div className="text-sm text-[#a1a1aa]">Loading network...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3" style={{ marginLeft: "-32px", marginRight: "-32px", marginTop: "-32px" }}>
      <div className="px-8 pt-6 pb-3 border-b border-[#27272a]">
        <h1 className="text-2xl font-bold tracking-tight text-white">🌌 3D Network</h1>
        <p className="text-sm text-[#a1a1aa] mt-1">
          {nodes.length.toLocaleString()} contacts ·
          {beaconToday && beaconCount > 0 && (
            <> <span style={{ color: "#22ff88" }}>{beaconCount} need outreach today</span> ·</>
          )}
          {filterQuery && matchSet.size > 0 && (
            <> <span style={{ color: "#88c4ff" }}>{matchSet.size} matches</span> ·</>
          )}
          {" "}click to focus · right-click for actions
        </p>
      </div>

      <div style={{
        position: "relative",
        height: "calc(100vh - 160px)",
        background: "radial-gradient(ellipse at center, #16162c 0%, #07070f 70%)",
        overflow: "hidden",
      }}>
        <Canvas camera={{ position: [0, 0, 60], fov: 55 }} dpr={[1, 2]}>
          <color attach="background" args={["#0a0b18"]} />
          <ambientLight intensity={0.6} />
          <pointLight position={[20, 30, 20]} intensity={1.5} color="#ffffff" />
          <pointLight position={[-25, -15, 15]} intensity={0.7} color="#88aaff" />
          <fog attach="fog" args={["#0a0b18", 50, 130]} />

          <Stars radius={140} depth={50} count={2000} factor={4} fade speed={0.3} />

          <MeNode />

          {/* Edges — emphasize matches and selected */}
          {nodes.map(n => {
            const isSel = selected && selected.id === n.id;
            const isMatch = matchSet.has(n.id);
            const isBeacon = beaconToday && todayQueueIds.has(n.id);
            const dimmed = !!selectedId && !isSel;
            const opacity = dimmed
              ? 0.04
              : isSel
                ? 1.0
                : isMatch
                  ? 0.7
                  : isBeacon
                    ? 0.5
                    : 0.07;
            const color = isSel ? "#22ff88" : isMatch ? "#88c4ff" : isBeacon ? "#22ff88" : n.color;
            return (
              <EdgeLine
                key={`e-${n.id}`}
                from={[0, 0, 0]}
                to={n.position}
                color={color}
                opacity={opacity}
                thick={!!isSel}
              />
            );
          })}

          {nodes.map(n => {
            const isSelected = selectedId === n.id;
            const isMatch = matchSet.has(n.id);
            const isBeacon = beaconToday && todayQueueIds.has(n.id);
            const dimmed = !!selectedId && !isSelected;
            const recOpacity = recencyTint ? recencyFactor(n.lastContact) : 1.0;
            return (
              <NodeMesh
                key={n.id}
                node={n}
                isSelected={isSelected}
                isMatch={isMatch}
                isBeacon={isBeacon}
                recencyOpacity={recOpacity}
                dimmed={dimmed}
                onClick={() => setSelectedId(n.id === selectedId ? null : n.id)}
                onContextMenu={(x, y) => openContextMenu(n, x, y)}
              />
            );
          })}

          <OrbitControls enablePan enableZoom enableRotate makeDefault />
          <CameraFocus target={targetPos} />

          <EffectComposer>
            <Bloom intensity={0.85} luminanceThreshold={0.15} luminanceSmoothing={0.6} mipmapBlur />
          </EffectComposer>
        </Canvas>

        {/* HUD overlay — controls */}
        <div style={{
          position: "absolute", top: 16, left: 16, color: "white",
          fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
          background: "rgba(10,11,24,0.85)",
          backdropFilter: "blur(12px)",
          padding: "14px 16px",
          borderRadius: 10,
          border: "1px solid rgba(255,255,255,0.1)",
          width: 300,
          maxHeight: "calc(100vh - 200px)",
          overflowY: "auto",
        }}>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 }}>Filters</div>

          <input
            placeholder="Search name or company…"
            value={filterQuery}
            onChange={e => setFilterQuery(e.target.value)}
            style={{
              width: "100%", boxSizing: "border-box",
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "white",
              padding: "7px 10px", borderRadius: 6,
              fontSize: 12, fontFamily: "inherit",
              marginBottom: 8, outline: "none",
            }}
          />

          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            style={{
              width: "100%", boxSizing: "border-box",
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "white",
              padding: "6px 9px", borderRadius: 6,
              fontSize: 12, fontFamily: "inherit", marginBottom: 8,
            }}
          >
            <option value="">All types</option>
            {TYPE_FILTERS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          <div style={{ display: "flex", gap: 4, marginBottom: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", alignSelf: "center", marginRight: 4 }}>Grade:</span>
            <button onClick={() => setFilterGrade("")} style={pillStyle(filterGrade === "")}>All</button>
            {GRADES.map(g => (
              <button key={g} onClick={() => setFilterGrade(g)} style={pillStyle(filterGrade === g)}>{g}</button>
            ))}
          </div>

          <label style={{ display: "block", fontSize: 11, color: "rgba(255,255,255,0.7)" }}>
            Max nodes: <strong style={{ color: "white" }}>{maxNodes}</strong>
            <input
              type="range" min={100} max={2000} step={100}
              value={maxNodes}
              onChange={e => setMaxNodes(Number(e.target.value))}
              style={{ width: "100%", marginTop: 4 }}
            />
          </label>

          <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 6 }}>Modes</div>

            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "rgba(255,255,255,0.85)", cursor: "pointer", padding: "4px 0" }}>
              <input type="checkbox" checked={beaconToday} onChange={e => setBeaconToday(e.target.checked)} />
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22ff88", boxShadow: "0 0 6px #22ff88" }} />
                Today&apos;s outreach beacon
                {beaconToday && beaconCount > 0 && (
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#22ff88", background: "rgba(34,255,136,0.15)", padding: "1px 6px", borderRadius: 999 }}>{beaconCount}</span>
                )}
              </span>
            </label>

            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "rgba(255,255,255,0.85)", cursor: "pointer", padding: "4px 0" }}>
              <input type="checkbox" checked={recencyTint} onChange={e => setRecencyTint(e.target.checked)} />
              <span>Recency tint <span style={{ fontSize: 10, color: "rgba(255,255,255,0.5)" }}>(fade by days since contact)</span></span>
            </label>
          </div>

          <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.08)", fontSize: 10, color: "rgba(255,255,255,0.55)" }}>
            <Link href="/network" style={{ color: "#88c4ff", textDecoration: "none", fontSize: 11 }}>← Back to 2D graph</Link>
            <span style={{ marginLeft: 8 }}>·</span>
            <Link href="/today" style={{ color: "#22ff88", textDecoration: "none", fontSize: 11, marginLeft: 8 }}>Today&apos;s queue →</Link>
          </div>
        </div>

        {/* Type legend */}
        <div style={{
          position: "absolute", right: 16, bottom: 16, color: "white",
          fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
          background: "rgba(10,11,24,0.78)", backdropFilter: "blur(12px)",
          padding: "10px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)",
          fontSize: 11, maxWidth: 280,
        }}>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 6 }}>Investor type · count</div>
          {Object.entries(typeCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([t, c]) => (
              <div key={t} style={{ display: "flex", alignItems: "center", gap: 6, padding: "2px 0" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: TYPE_COLORS[t] || "#888", boxShadow: `0 0 5px ${TYPE_COLORS[t] || "#888"}` }} />
                <span style={{ flex: 1, color: "rgba(255,255,255,0.8)" }}>{t}</span>
                <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 10 }}>{c}</span>
              </div>
            ))}
        </div>

        {/* Selected detail panel */}
        {selected && !contextMenu && (
          <div style={{
            position: "absolute", right: 16, top: 16, color: "white",
            fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
            background: "rgba(10,11,24,0.92)",
            backdropFilter: "blur(12px)",
            padding: "16px 18px",
            borderRadius: 10,
            border: `1px solid ${selected.color}`,
            width: 320,
            boxShadow: `0 0 30px ${selected.color}30`,
          }}>
            <button
              onClick={() => setSelectedId(null)}
              style={{
                position: "absolute", top: 8, right: 10,
                background: "transparent", border: "none",
                color: "rgba(255,255,255,0.55)", fontSize: 20,
                cursor: "pointer", padding: 4, lineHeight: 1,
              }}
              aria-label="Close"
            >×</button>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ width: 9, height: 9, borderRadius: "50%", background: selected.color, boxShadow: `0 0 8px ${selected.color}` }} />
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", textTransform: "uppercase", letterSpacing: 0.6 }}>{selected.type}</span>
              <span style={{
                marginLeft: "auto",
                fontSize: 10, fontWeight: 700,
                padding: "2px 8px", borderRadius: 999,
                background: `${selected.color}30`,
                color: selected.color,
              }}>{selected.grade}</span>
            </div>
            <h2 style={{ margin: "4px 0 4px 0", fontSize: 19, fontWeight: 700 }}>{selected.name}</h2>
            {selected.company && (
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", marginBottom: 4 }}>{selected.company}</div>
            )}
            {selected.title && (
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginBottom: 10 }}>{selected.title}</div>
            )}

            {todayQueueIds.has(selected.id) && (
              <div style={{ fontSize: 11, color: "#22ff88", background: "rgba(34,255,136,0.1)", border: "1px solid rgba(34,255,136,0.3)", padding: "6px 10px", borderRadius: 6, marginBottom: 10, fontWeight: 600 }}>
                ⚡ In today&apos;s outreach queue
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
              <Stat label="Last contact" value={selected.lastContact ? `${daysSince(selected.lastContact)}d ago` : "—"} />
              <Stat label="Region" value={selected.region || "—"} />
              <Stat label="Emails" value={String(selected.emailCount)} />
              <Stat label="Status" value={selected.status || "—"} />
            </div>

            {selected.email && (
              <a
                href={`mailto:${selected.email}`}
                style={{
                  display: "block", fontSize: 12, color: "#88c4ff",
                  marginBottom: 8, textDecoration: "none", wordBreak: "break-all",
                }}
              >{selected.email}</a>
            )}

            <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
              <Link
                href={`/contact/${selected.id}`}
                style={{
                  flex: 1, textAlign: "center",
                  background: "rgba(34,255,136,0.15)",
                  border: "1px solid rgba(34,255,136,0.45)",
                  color: "#22ff88",
                  padding: "8px 12px", borderRadius: 6,
                  fontSize: 12, fontWeight: 600, textDecoration: "none",
                }}
              >Open contact →</Link>
              {selected.email && (
                <a
                  href={`mailto:${selected.email}?subject=${encodeURIComponent(`Following up — ${selected.name}`)}`}
                  style={{
                    flex: 1, textAlign: "center",
                    background: "rgba(59,130,246,0.18)",
                    border: "1px solid rgba(59,130,246,0.5)",
                    color: "#88c4ff",
                    padding: "8px 12px", borderRadius: 6,
                    fontSize: 12, fontWeight: 600, textDecoration: "none",
                  }}
                >Email</a>
              )}
            </div>
          </div>
        )}

        {/* Right-click context menu */}
        {contextMenu && (
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "fixed",
              left: Math.min(contextMenu.x, window.innerWidth - 240),
              top: Math.min(contextMenu.y, window.innerHeight - 360),
              width: 230,
              background: "rgba(15,16,28,0.96)",
              backdropFilter: "blur(12px)",
              border: `1px solid ${contextMenu.node.color}`,
              borderRadius: 8,
              boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
              fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
              color: "white",
              overflow: "hidden",
              zIndex: 100,
            }}
          >
            <div style={{ padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.08)", background: `${contextMenu.node.color}15` }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{contextMenu.node.name}</div>
              {contextMenu.node.company && (
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>{contextMenu.node.company}</div>
              )}
            </div>
            <MenuItem
              icon="📧"
              label="Email"
              disabled={!contextMenu.node.email}
              onClick={() => {
                if (contextMenu.node.email) {
                  window.location.href = `mailto:${contextMenu.node.email}?subject=${encodeURIComponent(`Following up — ${contextMenu.node.name}`)}`;
                }
                setContextMenu(null);
              }}
            />
            <MenuItem
              icon="🔗"
              label="Open LinkedIn"
              disabled={!contextMenu.node.linkedin}
              onClick={() => {
                if (contextMenu.node.linkedin) window.open(contextMenu.node.linkedin, "_blank");
                setContextMenu(null);
              }}
            />
            <MenuItem
              icon="📋"
              label="Open contact page"
              onClick={() => {
                window.open(`/contact/${contextMenu.node.id}`, "_blank");
                setContextMenu(null);
              }}
            />
            <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "4px 0" }} />
            <MenuItem
              icon="✓"
              label="Mark contacted (log note)"
              onClick={() => {
                handleMarkContacted(contextMenu.node.id, contextMenu.node.name);
                setContextMenu(null);
              }}
            />
            <MenuItem
              icon="📅"
              label="Follow up tomorrow"
              onClick={() => {
                handleFollowUp(contextMenu.node.id, 1);
                setContextMenu(null);
              }}
            />
            <MenuItem
              icon="📅"
              label="Follow up in 1 week"
              onClick={() => {
                handleFollowUp(contextMenu.node.id, 7);
                setContextMenu(null);
              }}
            />
            <MenuItem
              icon="💤"
              label="Snooze 1 month"
              onClick={() => {
                handleSnooze(contextMenu.node.id, 30);
                setContextMenu(null);
              }}
            />
            <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "4px 0" }} />
            <MenuItem
              icon="📨"
              label="Copy email"
              disabled={!contextMenu.node.email}
              onClick={() => {
                if (contextMenu.node.email) handleCopy(contextMenu.node.email, "email");
                setContextMenu(null);
              }}
            />
            <MenuItem
              icon="🔗"
              label="Copy LinkedIn URL"
              disabled={!contextMenu.node.linkedin}
              onClick={() => {
                if (contextMenu.node.linkedin) handleCopy(contextMenu.node.linkedin, "LinkedIn URL");
                setContextMenu(null);
              }}
            />
          </div>
        )}

        {/* Toast */}
        {toast && (
          <div style={{
            position: "absolute", bottom: 80, left: "50%", transform: "translateX(-50%)",
            background: "rgba(34,255,136,0.95)",
            color: "#0a0a0a", padding: "8px 16px",
            borderRadius: 999, fontSize: 13, fontWeight: 700,
            fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
            boxShadow: "0 10px 30px rgba(34,255,136,0.4)",
            zIndex: 200,
            pointerEvents: "none",
          }}>{toast}</div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 9, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.9)", fontWeight: 500 }}>{value}</div>
    </div>
  );
}

function MenuItem({ icon, label, onClick, disabled }: { icon: string; label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        width: "100%", padding: "8px 12px",
        background: "transparent", border: "none",
        color: disabled ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.85)",
        fontSize: 12, fontFamily: "inherit",
        textAlign: "left", cursor: disabled ? "not-allowed" : "pointer",
        transition: "background 0.1s",
      }}
      onMouseEnter={(e) => { if (!disabled) (e.currentTarget.style.background = "rgba(255,255,255,0.06)"); }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
    >
      <span style={{ fontSize: 14 }}>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function pillStyle(active: boolean): React.CSSProperties {
  return {
    background: active ? "rgba(59,130,246,0.25)" : "rgba(255,255,255,0.05)",
    border: `1px solid ${active ? "rgba(59,130,246,0.6)" : "rgba(255,255,255,0.12)"}`,
    color: active ? "#88c4ff" : "rgba(255,255,255,0.65)",
    padding: "3px 9px", borderRadius: 999,
    fontSize: 11, fontWeight: 600, cursor: "pointer",
    fontFamily: "inherit",
  };
}
