"use client";

import { useState, useMemo, useEffect } from "react";

interface Record {
  id: string;
  n: string;   // name
  e: string;   // email
  c: string;   // company
  t: string;   // title
  li: string;  // linkedin
  src: string[];
  st: string;  // status
  rg: string;  // region
  ct: string;  // city
  fs: string;  // fund stage
  sc: string[];// sectors
  pr: string;  // priority
  crm: string;
  it: string;  // investor type
  rt: string;  // role type
  cs: string;  // check size
  rs: string;  // relationship strength
  wg: string[];// whatsapp groups
}

interface SearchData {
  records: Record[];
  facets: { [key: string]: { [key: string]: number } };
}

type Filters = {
  investorType: string[];
  region: string[];
  fundStage: string[];
  sector: string[];
  status: string[];
  crmStatus: string[];
  relationshipStrength: string[];
  sources: string[];
};

const EMPTY_FILTERS: Filters = {
  investorType: [], region: [], fundStage: [], sector: [],
  status: [], crmStatus: [], relationshipStrength: [], sources: [],
};

const PRESETS: { label: string; icon: string; filters: Partial<Filters> }[] = [
  { label: "Active VCs in NYC", icon: "🗽", filters: { investorType: ["VC Fund"], region: ["NYC Metro"], status: ["Active"] } },
  { label: "Pre-Seed Funds", icon: "🌱", filters: { fundStage: ["Pre-Seed", "Seed"], investorType: ["VC Fund"] } },
  { label: "AI Investors", icon: "🤖", filters: { sector: ["AI/ML"] } },
  { label: "Family Offices", icon: "🏠", filters: { investorType: ["Family Office"] } },
  { label: "Fund of Funds", icon: "🏛️", filters: { investorType: ["Fund of Funds"] } },
  { label: "New from WhatsApp", icon: "💬", filters: { sources: ["whatsapp"], crmStatus: ["New"] } },
  { label: "Founders Not in CRM", icon: "🚀", filters: { investorType: ["Founder"], crmStatus: ["New"] } },
  { label: "Strong Relationships", icon: "💪", filters: { relationshipStrength: ["Strong"] } },
  { label: "Fintech Focus", icon: "💳", filters: { sector: ["Fintech"] } },
  { label: "Healthcare", icon: "🏥", filters: { sector: ["Healthcare"] } },
];

const SOURCE_COLORS: { [key: string]: string } = {
  investors: "bg-blue-400", angels: "bg-sky-400", hubspot: "bg-orange-400",
  linkedin: "bg-cyan-400", "linkedin-conn": "bg-cyan-300", whatsapp: "bg-emerald-400",
  dealflow: "bg-rose-400", external: "bg-indigo-400", legal: "bg-amber-400",
  "follow-up": "bg-red-400", nyc: "bg-blue-300", "south-florida": "bg-teal-400",
  "re-engage": "bg-pink-400", "needs-review": "bg-zinc-400",
};

const SOURCE_LABELS: { [key: string]: string } = {
  investors: "Investors", angels: "Angels", hubspot: "HubSpot",
  linkedin: "LinkedIn", "linkedin-conn": "LI Connections", whatsapp: "WhatsApp",
  dealflow: "Deal Flow", external: "External", legal: "Legal",
  "follow-up": "Follow-Up", nyc: "NYC", "south-florida": "S. Florida",
  "re-engage": "Re-Engage", "needs-review": "Review",
};

function TypeBadge({ type }: { type: string }) {
  const colors: { [key: string]: string } = {
    "VC Fund": "bg-blue-500/10 text-blue-400 border-blue-500/20",
    "Family Office": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    "Fund of Funds": "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    "Angel/Individual": "bg-amber-500/10 text-amber-400 border-amber-500/20",
    "Founder": "bg-rose-500/10 text-rose-400 border-rose-500/20",
    "Executive": "bg-sky-500/10 text-sky-400 border-sky-500/20",
    "Legal/Services": "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
    "Other": "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  };
  if (!type) return null;
  return <span className={`inline-flex px-2 py-0.5 text-[10px] font-medium rounded-full border whitespace-nowrap ${colors[type] || colors.Other}`}>{type}</span>;
}

function StrengthBadge({ strength }: { strength: string }) {
  const colors: { [key: string]: string } = {
    "Strong": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    "Medium": "bg-amber-500/10 text-amber-400 border-amber-500/20",
    "Weak": "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  };
  if (!strength || strength === "None") return <span className="text-[#52525b] text-[10px]">-</span>;
  return <span className={`inline-flex px-2 py-0.5 text-[10px] font-medium rounded-full border whitespace-nowrap ${colors[strength] || ""}`}>{strength}</span>;
}

function SourceDots({ sources }: { sources: string[] }) {
  return (
    <div className="flex gap-1 items-center" title={sources.map(s => SOURCE_LABELS[s] || s).join(", ")}>
      {sources.map(s => (
        <span key={s} className={`w-2 h-2 rounded-full ${SOURCE_COLORS[s] || "bg-zinc-400"}`} />
      ))}
    </div>
  );
}

function FacetRow({ label, facetKey, counts, selected, onToggle }: {
  label: string;
  facetKey: string;
  counts: { [key: string]: number };
  selected: string[];
  onToggle: (key: string, value: string) => void;
}) {
  const items = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  if (items.length === 0) return null;

  return (
    <div className="flex items-start gap-2">
      <span className="text-[10px] text-[#52525b] w-16 shrink-0 pt-1.5 text-right">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {items.map(([value, count]) => {
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
              {facetKey === "sources" ? (SOURCE_LABELS[value] || value) : value}
              <span className={`ml-1 ${active ? "text-[#3b82f6]/60" : "text-[#52525b]"}`}>{count.toLocaleString()}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
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
  const pageSize = 50;

  useEffect(() => {
    import("@/data/search-index.json").then((mod) => {
      setData(mod.default as unknown as SearchData);
      setLoading(false);
    });
  }, []);

  function toggleFilter(key: string, value: string) {
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
  }

  function applyPreset(preset: typeof PRESETS[number]) {
    if (activePreset === preset.label) {
      setActivePreset(null);
      setFilters({ ...EMPTY_FILTERS });
    } else {
      setActivePreset(preset.label);
      setFilters({ ...EMPTY_FILTERS, ...preset.filters } as Filters);
    }
    setQuery("");
    setPage(0);
  }

  function clearAll() {
    setFilters({ ...EMPTY_FILTERS });
    setQuery("");
    setActivePreset(null);
    setPage(0);
  }

  const hasFilters = query || Object.values(filters).some(f => f.length > 0);

  // Build search text index once
  const searchTexts = useMemo(() => {
    if (!data) return [];
    return data.records.map(r =>
      `${r.n} ${r.c} ${r.t} ${r.e} ${r.sc.join(" ")} ${r.rg} ${r.it} ${r.fs}`.toLowerCase()
    );
  }, [data]);

  // Filter records
  const filtered = useMemo(() => {
    if (!data) return [];
    const results = data.records;
    let indices = results.map((_, i) => i);

    // Text search
    if (query) {
      const q = query.toLowerCase();
      const terms = q.split(/\s+/).filter(Boolean);
      indices = indices.filter(i =>
        terms.every(term => searchTexts[i].includes(term))
      );
    }

    // Facet filters (AND between dimensions, OR within)
    const filterMap: [keyof Filters, (r: Record) => string | string[]][] = [
      ["investorType", r => r.it],
      ["region", r => r.rg],
      ["fundStage", r => r.fs],
      ["sector", r => r.sc],
      ["status", r => r.st],
      ["crmStatus", r => r.crm],
      ["relationshipStrength", r => r.rs],
      ["sources", r => r.src],
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
    const dims: { key: string; accessor: (r: Record) => string | string[] }[] = [
      { key: "investorType", accessor: r => r.it },
      { key: "region", accessor: r => r.rg },
      { key: "fundStage", accessor: r => r.fs },
      { key: "sector", accessor: r => r.sc },
      { key: "status", accessor: r => r.st },
      { key: "crmStatus", accessor: r => r.crm },
      { key: "relationshipStrength", accessor: r => r.rs },
      { key: "sources", accessor: r => r.src },
    ];

    for (const { key } of dims) {
      counts[key] = {};
    }

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
      const fieldMap: { [key: string]: (r: Record) => string } = {
        n: r => r.n, c: r => r.c, t: r => r.t, it: r => r.it, rg: r => r.rg, rs: r => r.rs,
      };
      const fn = fieldMap[sortKey] || fieldMap.n;
      const cmp = fn(a).localeCompare(fn(b));
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
          <div className="text-xs text-[#52525b] mt-1">36,000+ contacts across 14 sources</div>
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
          {data ? data.records.length.toLocaleString() : "..."} contacts across 14 sources — search by type, stage, region, sector, and more
        </p>
      </div>

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

      {/* Search Input */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-lg">
          <input
            type="text"
            placeholder="Search by name, company, title, email, sector..."
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
          <button onClick={clearAll} className="px-3 py-2.5 text-xs rounded-lg bg-[#27272a] text-[#a1a1aa] hover:text-white transition-colors whitespace-nowrap">
            Clear all
          </button>
        )}
        <span className="text-xs text-[#a1a1aa] whitespace-nowrap">{filtered.length.toLocaleString()} results</span>
      </div>

      {/* Facet Filters */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-4 space-y-2.5">
        <FacetRow label="Type" facetKey="investorType" counts={dynamicFacets.investorType || {}} selected={filters.investorType} onToggle={toggleFilter} />
        <FacetRow label="Stage" facetKey="fundStage" counts={dynamicFacets.fundStage || {}} selected={filters.fundStage} onToggle={toggleFilter} />
        <FacetRow label="Region" facetKey="region" counts={dynamicFacets.region || {}} selected={filters.region} onToggle={toggleFilter} />
        <FacetRow label="Sector" facetKey="sector" counts={dynamicFacets.sector || {}} selected={filters.sector} onToggle={toggleFilter} />
        <FacetRow label="Status" facetKey="status" counts={dynamicFacets.status || {}} selected={filters.status} onToggle={toggleFilter} />
        <FacetRow label="CRM" facetKey="crmStatus" counts={dynamicFacets.crmStatus || {}} selected={filters.crmStatus} onToggle={toggleFilter} />
        <FacetRow label="Strength" facetKey="relationshipStrength" counts={dynamicFacets.relationshipStrength || {}} selected={filters.relationshipStrength} onToggle={toggleFilter} />
        <FacetRow label="Source" facetKey="sources" counts={dynamicFacets.sources || {}} selected={filters.sources} onToggle={toggleFilter} />
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
              <th>Stage</th>
              <th className="cursor-pointer select-none" onClick={() => toggleSort("rg")}>
                Region {sortKey === "rg" && (sortDir === "asc" ? "↑" : "↓")}
              </th>
              <th>Strength</th>
              <th>Sources</th>
              <th>Contact</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((r) => (
              <tr key={r.id}>
                <td className="font-medium text-white whitespace-nowrap">{r.n}</td>
                <td className="text-[#a1a1aa] text-xs max-w-[160px] truncate">{r.c || "—"}</td>
                <td className="text-[#a1a1aa] text-xs max-w-[200px] truncate">{r.t || "—"}</td>
                <td><TypeBadge type={r.it} /></td>
                <td className="text-xs text-[#a1a1aa] whitespace-nowrap">{r.fs || "—"}</td>
                <td className="text-xs text-[#a1a1aa] whitespace-nowrap">{r.rg || "—"}</td>
                <td><StrengthBadge strength={r.rs} /></td>
                <td><SourceDots sources={r.src} /></td>
                <td className="flex items-center gap-2">
                  {r.e && <a href={`mailto:${r.e}`} className="text-cyan-400 hover:text-cyan-300 text-xs">Email</a>}
                  {r.li && <a href={r.li} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 text-xs">LI</a>}
                  {!r.e && !r.li && <span className="text-[#52525b] text-xs">—</span>}
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
