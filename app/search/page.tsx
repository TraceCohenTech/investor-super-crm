"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import type { ContactRecord, SearchData } from "@/lib/types";
import {
  SOURCE_LABELS as SRC_LABELS,
  GRADE_COLORS,
  STALENESS_CONFIG,
  STRENGTH_COLORS,
} from "@/lib/types";

type Filters = {
  investorType: string[];
  region: string[];
  fundStage: string[];
  sector: string[];
  status: string[];
  crmStatus: string[];
  relationshipStrength: string[];
  sources: string[];
  qualityGrade: string[];
  staleness: string[];
  tags: string[];
};

const EMPTY_FILTERS: Filters = {
  investorType: [], region: [], fundStage: [], sector: [],
  status: [], crmStatus: [], relationshipStrength: [], sources: [],
  qualityGrade: [], staleness: [], tags: [],
};

type SavedSearch = {
  name: string;
  filters: Filters;
  query: string;
  createdAt: string;
};

const PRESETS: { label: string; icon: string; filters: Partial<Filters>; query?: string }[] = [
  { label: "Active VCs in NYC", icon: "🗽", filters: { investorType: ["VC Fund"], region: ["NYC Metro"], status: ["Active"] } },
  { label: "Pre-Seed Funds", icon: "🌱", filters: { fundStage: ["Pre-Seed", "Seed", "Pre-Seed/Seed"], investorType: ["VC Fund"] } },
  { label: "AI Investors", icon: "🤖", filters: { sector: ["AI/ML", "Applied AI"] } },
  { label: "Family Offices", icon: "🏠", filters: { investorType: ["Family Office", "LP/Family Office"] } },
  { label: "LP Pipeline", icon: "🏛️", filters: { sources: ["lp-pipeline"] } },
  { label: "Going Cold", icon: "🥶", filters: { staleness: ["stale"] } },
  { label: "At Risk", icon: "⚠️", filters: { staleness: ["at-risk"] } },
  { label: "Grade A Contacts", icon: "⭐", filters: { qualityGrade: ["A"] } },
  { label: "Strong Relationships", icon: "💪", filters: { relationshipStrength: ["Strong"] } },
  { label: "Israel Network", icon: "🇮🇱", filters: { tags: ["israel"] } },
  { label: "New from WhatsApp", icon: "💬", filters: { sources: ["whatsapp"], crmStatus: ["New"] } },
  { label: "Founders", icon: "🚀", filters: { investorType: ["Founder/Executive", "Startup/Founder"] } },
];

const DOT_COLORS: { [key: string]: string } = {
  investors: "bg-blue-400", angels: "bg-sky-400", hubspot: "bg-orange-400",
  linkedin: "bg-cyan-400", "linkedin-verified": "bg-cyan-300", whatsapp: "bg-emerald-400",
  dealflow: "bg-rose-400", external: "bg-indigo-400", legal: "bg-amber-400",
  "follow-up": "bg-red-400", nyc: "bg-blue-300", "south-florida": "bg-teal-400",
  "re-engage": "bg-pink-400", "needs-review": "bg-zinc-400", "lp-pipeline": "bg-violet-400",
  gmail: "bg-red-400", calendar: "bg-blue-400", israel: "bg-sky-400",
};

function GradeBadge({ grade }: { grade: string }) {
  if (!grade) return null;
  return <span className={`inline-flex px-1.5 py-0.5 text-[9px] font-bold rounded-full border ${GRADE_COLORS[grade] || ""}`}>{grade}</span>;
}

function StalenessBadge({ level }: { level: string }) {
  const cfg = STALENESS_CONFIG[level];
  if (!cfg) return null;
  return <span className={`inline-flex px-1.5 py-0.5 text-[9px] font-medium rounded-full border ${cfg.color}`}>{cfg.label}</span>;
}

function TypeBadge({ type }: { type: string }) {
  const colors: { [key: string]: string } = {
    "VC Fund": "bg-blue-500/10 text-blue-400 border-blue-500/20",
    "Family Office": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    "Fund of Funds": "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    "Individual/Angel": "bg-amber-500/10 text-amber-400 border-amber-500/20",
    "Founder/Executive": "bg-rose-500/10 text-rose-400 border-rose-500/20",
    "Angel/Syndicate": "bg-amber-500/10 text-amber-400 border-amber-500/20",
    "LP": "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    "LP/Family Office": "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    "Corporate": "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
    "University": "bg-sky-500/10 text-sky-400 border-sky-500/20",
  };
  if (!type) return null;
  return <span className={`inline-flex px-2 py-0.5 text-[10px] font-medium rounded-full border whitespace-nowrap ${colors[type] || "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"}`}>{type}</span>;
}

function StrengthBadge({ strength }: { strength: string }) {
  if (!strength || strength === "None") return <span className="text-[#52525b] text-[10px]">-</span>;
  return <span className={`inline-flex px-2 py-0.5 text-[10px] font-medium rounded-full border whitespace-nowrap ${STRENGTH_COLORS[strength] || ""}`}>{strength}</span>;
}

function SourceDots({ sources }: { sources: string[] }) {
  return (
    <div className="flex gap-1 items-center" title={sources.map(s => SRC_LABELS[s] || s).join(", ")}>
      {sources.map(s => (
        <span key={s} className={`w-2 h-2 rounded-full ${DOT_COLORS[s] || "bg-zinc-400"}`} />
      ))}
    </div>
  );
}

function FacetRow({ label, facetKey, counts, selected, onToggle, maxItems = 20 }: {
  label: string;
  facetKey: string;
  counts: { [key: string]: number };
  selected: string[];
  onToggle: (key: string, value: string) => void;
  maxItems?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const items = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  if (items.length === 0) return null;
  const visible = expanded ? items : items.slice(0, maxItems);
  const hasMore = items.length > maxItems;

  return (
    <div className="flex items-start gap-2">
      <span className="text-[10px] text-[#52525b] w-16 shrink-0 pt-1.5 text-right">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {visible.map(([value, count]) => {
          const active = selected.includes(value);
          return (
            <button
              key={value}
              onClick={() => onToggle(facetKey, value)}
              className={`px-2.5 py-1 text-[11px] rounded-lg border transition-colors ${
                active
                  ? "bg-[#3b82f6]/10 border-[#3b82f6]/30 text-[#3b82f6]"
                  : "bg-[#18181b] border-[#27272a] text-[#a1a1aa] hover:text-white hover:border-[#3f3f46]"
              }`}
            >
              {facetKey === "sources" ? (SRC_LABELS[value] || value) : value}
              <span className={`ml-1 ${active ? "text-[#3b82f6]/60" : "text-[#52525b]"}`}>{count.toLocaleString()}</span>
            </button>
          );
        })}
        {hasMore && (
          <button onClick={() => setExpanded(!expanded)} className="px-2 py-1 text-[10px] text-[#52525b] hover:text-white transition-colors">
            {expanded ? "Show less" : `+${items.length - maxItems} more`}
          </button>
        )}
      </div>
    </div>
  );
}

const SAVED_KEY = "nyvp-saved-searches";
function loadSaved(): SavedSearch[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(SAVED_KEY) || "[]");
  } catch { return []; }
}
function persistSaved(searches: SavedSearch[]) {
  localStorage.setItem(SAVED_KEY, JSON.stringify(searches));
}

export default function SearchPage() {
  const [data, setData] = useState<SearchData | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Filters>({ ...EMPTY_FILTERS });
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [sortKey, setSortKey] = useState<string>("n");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveName, setSaveName] = useState("");
  const pageSize = 50;

  useEffect(() => {
    import("@/data/search-index.json").then((mod) => {
      setData(mod.default as unknown as SearchData);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    setSavedSearches(loadSaved());
  }, []);

  const toggleFilter = useCallback((key: string, value: string) => {
    setActivePreset(null);
    setFilters(prev => {
      const dim = key as keyof Filters;
      const current = prev[dim];
      const next = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      return { ...prev, [dim]: next };
    });
    setPage(0);
  }, []);

  function applyPreset(preset: typeof PRESETS[number]) {
    if (activePreset === preset.label) {
      setActivePreset(null);
      setFilters({ ...EMPTY_FILTERS });
      setQuery("");
    } else {
      setActivePreset(preset.label);
      setFilters({ ...EMPTY_FILTERS, ...preset.filters } as Filters);
      setQuery(preset.query || "");
    }
    setPage(0);
  }

  function clearAll() {
    setFilters({ ...EMPTY_FILTERS });
    setQuery("");
    setActivePreset(null);
    setPage(0);
  }

  function saveSearch() {
    if (!saveName.trim()) return;
    const s: SavedSearch = {
      name: saveName.trim(),
      filters: { ...filters },
      query,
      createdAt: new Date().toISOString(),
    };
    const updated = [...savedSearches, s];
    setSavedSearches(updated);
    persistSaved(updated);
    setSaveName("");
    setShowSaveModal(false);
  }

  function deleteSaved(idx: number) {
    const updated = savedSearches.filter((_, i) => i !== idx);
    setSavedSearches(updated);
    persistSaved(updated);
  }

  function applySaved(s: SavedSearch) {
    setFilters({ ...EMPTY_FILTERS, ...s.filters });
    setQuery(s.query || "");
    setActivePreset(null);
    setPage(0);
  }

  const hasFilters = query || Object.values(filters).some(f => f.length > 0);

  // Build search text index once (includes tags)
  const searchTexts = useMemo(() => {
    if (!data) return [];
    return data.records.map((r: ContactRecord) =>
      `${r.n} ${r.c} ${r.t} ${r.e} ${r.sc.join(" ")} ${r.rg} ${r.it} ${r.fs} ${(r.tg || []).join(" ")} ${(r.wg || []).join(" ")} ${r.nt || ""}`.toLowerCase()
    );
  }, [data]);

  // Filter records
  const filtered = useMemo(() => {
    if (!data) return [];
    const results = data.records as ContactRecord[];
    let indices = results.map((_, i) => i);

    if (query) {
      const q = query.toLowerCase();
      const terms = q.split(/\s+/).filter(Boolean);
      indices = indices.filter(i =>
        terms.every(term => searchTexts[i].includes(term))
      );
    }

    const filterMap: [keyof Filters, (r: ContactRecord) => string | string[]][] = [
      ["investorType", r => r.it],
      ["region", r => r.rg],
      ["fundStage", r => r.fs],
      ["sector", r => r.sc],
      ["status", r => r.st],
      ["crmStatus", r => r.crm],
      ["relationshipStrength", r => r.rs],
      ["sources", r => r.src],
      ["qualityGrade", r => r.q],
      ["staleness", r => r.sl],
      ["tags", r => r.tg || []],
    ];

    for (const [dim, accessor] of filterMap) {
      if (filters[dim].length > 0) {
        indices = indices.filter(i => {
          const val = accessor(results[i]);
          if (Array.isArray(val)) {
            return val.some(v => filters[dim].includes(v));
          }
          return filters[dim].includes(val);
        });
      }
    }

    return indices.map(i => results[i]);
  }, [data, query, filters, searchTexts]);

  // Dynamic facet counts
  const dynamicFacets = useMemo(() => {
    const counts: { [dim: string]: { [val: string]: number } } = {};
    const dims: { key: string; accessor: (r: ContactRecord) => string | string[] }[] = [
      { key: "investorType", accessor: r => r.it },
      { key: "region", accessor: r => r.rg },
      { key: "fundStage", accessor: r => r.fs },
      { key: "sector", accessor: r => r.sc },
      { key: "status", accessor: r => r.st },
      { key: "crmStatus", accessor: r => r.crm },
      { key: "relationshipStrength", accessor: r => r.rs },
      { key: "sources", accessor: r => r.src },
      { key: "qualityGrade", accessor: r => r.q },
      { key: "staleness", accessor: r => r.sl },
      { key: "tags", accessor: r => r.tg || [] },
    ];

    for (const { key } of dims) counts[key] = {};

    for (const r of filtered) {
      for (const { key, accessor } of dims) {
        const val = accessor(r);
        if (Array.isArray(val)) {
          for (const v of val) {
            if (v && v !== "Generalist") counts[key][v] = (counts[key][v] || 0) + 1;
          }
        } else if (val) {
          counts[key][val] = (counts[key][val] || 0) + 1;
        }
      }
    }
    return counts;
  }, [filtered]);

  // Sort
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const fieldMap: { [key: string]: (r: ContactRecord) => string | number } = {
        n: r => r.n, c: r => r.c, t: r => r.t, it: r => r.it, rg: r => r.rg, rs: r => r.rs,
        q: r => r.q || "Z", ec: r => r.ec || 0,
      };
      const fn = fieldMap[sortKey] || fieldMap.n;
      const va = fn(a);
      const vb = fn(b);
      if (typeof va === "number" && typeof vb === "number") {
        return sortDir === "asc" ? va - vb : vb - va;
      }
      const cmp = String(va).localeCompare(String(vb));
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.ceil(sorted.length / pageSize);
  const paged = sorted.slice(page * pageSize, (page + 1) * pageSize);

  function toggleSort(key: string) {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
    setPage(0);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="text-2xl mb-3">🔍</div>
          <div className="text-sm text-[#a1a1aa]">Loading search index...</div>
          <div className="text-xs text-[#52525b] mt-1">24,000+ contacts from master CRM</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">🔍 Smart Search</h1>
        <p className="text-sm text-[#a1a1aa] mt-1">
          {data ? data.records.length.toLocaleString() : "..."} contacts — search by type, stage, region, sector, quality, tags, and more
        </p>
      </div>

      {/* Saved Searches */}
      {savedSearches.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <span className="text-[10px] text-[#52525b] pt-1.5">Saved:</span>
          {savedSearches.map((s, i) => (
            <div key={i} className="flex items-center gap-1 bg-[#18181b] border border-[#27272a] rounded-lg px-2.5 py-1">
              <button onClick={() => applySaved(s)} className="text-[11px] text-[#a1a1aa] hover:text-white transition-colors">
                {s.name}
              </button>
              <button onClick={() => deleteSaved(i)} className="text-[10px] text-[#52525b] hover:text-red-400 ml-1 transition-colors">
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Quick Presets */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {PRESETS.map(preset => (
          <button
            key={preset.label}
            onClick={() => applyPreset(preset)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border whitespace-nowrap transition-colors shrink-0 ${
              activePreset === preset.label
                ? "bg-[#3b82f6]/10 border-[#3b82f6]/30 text-[#3b82f6]"
                : "bg-[#18181b] border-[#27272a] text-[#a1a1aa] hover:text-white hover:border-[#3f3f46]"
            }`}
          >
            <span>{preset.icon}</span>
            <span>{preset.label}</span>
          </button>
        ))}
      </div>

      {/* Search Input + Actions */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-lg">
          <input
            type="text"
            placeholder="Search name, company, title, email, sector, tags..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(0); setActivePreset(null); }}
            className="w-full bg-[#18181b] border border-[#27272a] rounded-lg pl-4 pr-10 py-2.5 text-sm text-white placeholder:text-[#52525b] focus:outline-none focus:border-[#3b82f6] transition-colors"
          />
          {query && (
            <button onClick={() => { setQuery(""); setPage(0); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#52525b] hover:text-white text-xs">
              ✕
            </button>
          )}
        </div>
        {hasFilters && (
          <>
            <button onClick={() => setShowSaveModal(true)} className="px-3 py-2.5 text-xs rounded-lg bg-[#3b82f6]/10 border border-[#3b82f6]/30 text-[#3b82f6] hover:bg-[#3b82f6]/20 transition-colors whitespace-nowrap">
              Save Search
            </button>
            <button onClick={clearAll} className="px-3 py-2.5 text-xs rounded-lg bg-[#27272a] text-[#a1a1aa] hover:text-white transition-colors whitespace-nowrap">
              Clear all
            </button>
          </>
        )}
        <span className="text-xs text-[#a1a1aa] whitespace-nowrap">{filtered.length.toLocaleString()} results</span>
      </div>

      {/* Save Search Modal */}
      {showSaveModal && (
        <div className="bg-[#18181b] border border-[#3b82f6]/30 rounded-xl p-4 flex items-center gap-3">
          <input
            type="text"
            placeholder="Name this search..."
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && saveSearch()}
            autoFocus
            className="flex-1 bg-[#09090b] border border-[#27272a] rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#52525b] focus:outline-none focus:border-[#3b82f6] transition-colors"
          />
          <button onClick={saveSearch} className="px-4 py-2 text-xs rounded-lg bg-[#3b82f6] text-white hover:bg-[#2563eb] transition-colors">
            Save
          </button>
          <button onClick={() => { setShowSaveModal(false); setSaveName(""); }} className="px-3 py-2 text-xs text-[#a1a1aa] hover:text-white transition-colors">
            Cancel
          </button>
        </div>
      )}

      {/* Facet Filters */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-4 space-y-2.5">
        <FacetRow label="Quality" facetKey="qualityGrade" counts={dynamicFacets.qualityGrade || {}} selected={filters.qualityGrade} onToggle={toggleFilter} />
        <FacetRow label="Health" facetKey="staleness" counts={dynamicFacets.staleness || {}} selected={filters.staleness} onToggle={toggleFilter} />
        <FacetRow label="Type" facetKey="investorType" counts={dynamicFacets.investorType || {}} selected={filters.investorType} onToggle={toggleFilter} />
        <FacetRow label="Stage" facetKey="fundStage" counts={dynamicFacets.fundStage || {}} selected={filters.fundStage} onToggle={toggleFilter} />
        <FacetRow label="Region" facetKey="region" counts={dynamicFacets.region || {}} selected={filters.region} onToggle={toggleFilter} />
        <FacetRow label="Sector" facetKey="sector" counts={dynamicFacets.sector || {}} selected={filters.sector} onToggle={toggleFilter} />
        <FacetRow label="Status" facetKey="status" counts={dynamicFacets.status || {}} selected={filters.status} onToggle={toggleFilter} />
        <FacetRow label="CRM" facetKey="crmStatus" counts={dynamicFacets.crmStatus || {}} selected={filters.crmStatus} onToggle={toggleFilter} />
        <FacetRow label="Strength" facetKey="relationshipStrength" counts={dynamicFacets.relationshipStrength || {}} selected={filters.relationshipStrength} onToggle={toggleFilter} />
        <FacetRow label="Source" facetKey="sources" counts={dynamicFacets.sources || {}} selected={filters.sources} onToggle={toggleFilter} />
        <FacetRow label="Tags" facetKey="tags" counts={dynamicFacets.tags || {}} selected={filters.tags} onToggle={toggleFilter} maxItems={15} />
      </div>

      {/* Results Table */}
      <div className="table-container bg-[#18181b] border border-[#27272a] rounded-xl overflow-hidden max-h-[55vh] overflow-y-auto">
        <table>
          <thead>
            <tr>
              <th className="cursor-pointer select-none" onClick={() => toggleSort("n")}>
                Name {sortKey === "n" && (sortDir === "asc" ? "↑" : "↓")}
              </th>
              <th className="cursor-pointer select-none" onClick={() => toggleSort("c")}>
                Company {sortKey === "c" && (sortDir === "asc" ? "↑" : "↓")}
              </th>
              <th className="cursor-pointer select-none" onClick={() => toggleSort("t")}>
                Title {sortKey === "t" && (sortDir === "asc" ? "↑" : "↓")}
              </th>
              <th>Type</th>
              <th className="cursor-pointer select-none" onClick={() => toggleSort("q")}>
                Grade {sortKey === "q" && (sortDir === "asc" ? "↑" : "↓")}
              </th>
              <th>Health</th>
              <th>Strength</th>
              <th>Sources</th>
              <th>Links</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((r) => (
              <tr key={r.id}>
                <td className="font-medium whitespace-nowrap">
                  <Link href={`/contact/${r.id}`} className="text-white hover:text-[#3b82f6] transition-colors">
                    {r.n}
                  </Link>
                </td>
                <td className="text-[#a1a1aa] text-xs max-w-[160px] truncate">{r.c || "—"}</td>
                <td className="text-[#a1a1aa] text-xs max-w-[200px] truncate">{r.t || "—"}</td>
                <td><TypeBadge type={r.it} /></td>
                <td><GradeBadge grade={r.q} /></td>
                <td><StalenessBadge level={r.sl} /></td>
                <td><StrengthBadge strength={r.rs} /></td>
                <td><SourceDots sources={r.src} /></td>
                <td className="flex items-center gap-2">
                  {r.e && <a href={`mailto:${r.e}`} className="text-cyan-400 hover:text-cyan-300 text-xs">Email</a>}
                  {r.li && <a href={r.li} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 text-xs">LI</a>}
                  <Link href={`/contact/${r.id}#intros`} className="text-emerald-400 hover:text-emerald-300 text-[10px]">Intro</Link>
                </td>
              </tr>
            ))}
            {paged.length === 0 && (
              <tr>
                <td colSpan={9} className="text-center py-12 text-[#52525b]">
                  No results match your filters. Try broadening your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className="px-3 py-1.5 text-xs rounded-lg bg-[#18181b] border border-[#27272a] text-[#a1a1aa] hover:text-white disabled:opacity-30 transition-colors"
          >
            Previous
          </button>
          <span className="text-xs text-[#a1a1aa]">Page {page + 1} of {totalPages}</span>
          <button
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
            className="px-3 py-1.5 text-xs rounded-lg bg-[#18181b] border border-[#27272a] text-[#a1a1aa] hover:text-white disabled:opacity-30 transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
