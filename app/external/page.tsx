"use client";

import { useState, useMemo } from "react";
import entries from "@/data/external-lists.json";
import summary from "@/data/external-summary.json";

type Entry = (typeof entries)[number];

function CategoryBadge({ category }: { category: string }) {
  const colors: Record<string, string> = {
    "Fund of Funds": "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    "Investment Advisory": "bg-amber-500/10 text-amber-400 border-amber-500/20",
    "Sovereign Wealth": "bg-rose-500/10 text-rose-400 border-rose-500/20",
    "VC Fund": "bg-blue-500/10 text-blue-400 border-blue-500/20",
    "Family Office": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  };
  return (
    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full border whitespace-nowrap ${colors[category] || "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"}`}>
      {category}
    </span>
  );
}

function SourceBadge({ source }: { source: string }) {
  const colors: Record<string, string> = {
    "FoF List": "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    "Big VC List": "bg-sky-500/10 text-sky-400 border-sky-500/20",
    "Big VC List (Scraped)": "bg-sky-500/10 text-sky-400 border-sky-500/20",
    "LP Family Office Intel": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    "VCA 2025 LP Intel": "bg-teal-500/10 text-teal-400 border-teal-500/20",
  };
  const short: Record<string, string> = {
    "Big VC List (Scraped)": "VC List",
    "LP Family Office Intel": "FO Intel",
    "VCA 2025 LP Intel": "VCA 2025",
  };
  return (
    <span className={`inline-flex px-1.5 py-0.5 text-xs font-medium rounded border whitespace-nowrap ${colors[source] || "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"}`}>
      {short[source] || source}
    </span>
  );
}

export default function ExternalListsPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [crmFilter, setCrmFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [sortKey, setSortKey] = useState<"name" | "firm" | "checkSize">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const pageSize = 50;

  const filtered = useMemo(() => {
    let data = entries as Entry[];
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.firm.toLowerCase().includes(q) ||
        c.focus.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q)
      );
    }
    if (categoryFilter !== "all") {
      data = data.filter(c => c.category === categoryFilter);
    }
    if (sourceFilter !== "all") {
      data = data.filter(c => c.source === sourceFilter || (sourceFilter === "Big VC List" && c.source.startsWith("Big VC")));
    }
    if (crmFilter === "new") {
      data = data.filter(c => !c.inCRM);
    } else if (crmFilter === "existing") {
      data = data.filter(c => c.inCRM);
    }
    return data;
  }, [search, categoryFilter, sourceFilter, crmFilter]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name") cmp = a.name.localeCompare(b.name);
      else if (sortKey === "firm") cmp = a.firm.localeCompare(b.firm);
      else cmp = a.checkSize.localeCompare(b.checkSize);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.ceil(sorted.length / pageSize);
  const paged = sorted.slice(page * pageSize, (page + 1) * pageSize);

  function toggleSort(key: typeof sortKey) {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
    setPage(0);
  }

  const categories = Object.entries(summary.categories as Record<string, number>);
  const sources = Object.entries(summary.sources as Record<string, number>);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">📋 External Lists</h1>
        <p className="text-sm text-[#a1a1aa] mt-1">{summary.total} funds and offices from imported lists</p>
      </div>

      {/* Stat cards row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-3">
          <div className="text-xs text-[#a1a1aa]">Total</div>
          <div className="text-lg font-bold text-white mt-1">{summary.total}</div>
        </div>
        <button
          onClick={() => { setCrmFilter(crmFilter === "new" ? "all" : "new"); setPage(0); }}
          className={`rounded-xl p-3 text-left transition-colors border ${
            crmFilter === "new" ? "bg-emerald-500/10 border-emerald-500/30" : "bg-[#18181b] border-[#27272a] hover:border-[#3f3f46]"
          }`}
        >
          <div className="text-xs text-[#a1a1aa]">New to CRM</div>
          <div className="text-lg font-bold text-emerald-400 mt-1">{summary.newToCRM}</div>
        </button>
        <button
          onClick={() => { setCrmFilter(crmFilter === "existing" ? "all" : "existing"); setPage(0); }}
          className={`rounded-xl p-3 text-left transition-colors border ${
            crmFilter === "existing" ? "bg-blue-500/10 border-blue-500/30" : "bg-[#18181b] border-[#27272a] hover:border-[#3f3f46]"
          }`}
        >
          <div className="text-xs text-[#a1a1aa]">In CRM</div>
          <div className="text-lg font-bold text-blue-400 mt-1">{summary.inCRM}</div>
        </button>
        {categories.map(([cat, count]) => (
          <button
            key={cat}
            onClick={() => { setCategoryFilter(categoryFilter === cat ? "all" : cat); setPage(0); }}
            className={`rounded-xl p-3 text-left transition-colors border ${
              categoryFilter === cat ? "bg-blue-500/10 border-blue-500/30" : "bg-[#18181b] border-[#27272a] hover:border-[#3f3f46]"
            }`}
          >
            <div className="text-xs text-[#a1a1aa]">{cat}</div>
            <div className="text-lg font-bold text-white mt-1">{count}</div>
          </button>
        ))}
      </div>

      {/* Source filter row */}
      <div className="flex flex-wrap gap-2">
        <span className="text-xs text-[#71717a] py-1">Source:</span>
        <button
          onClick={() => { setSourceFilter("all"); setPage(0); }}
          className={`px-3 py-1 text-xs rounded-lg border transition-colors ${
            sourceFilter === "all" ? "bg-white/10 border-white/20 text-white" : "bg-[#18181b] border-[#27272a] text-[#a1a1aa] hover:text-white"
          }`}
        >
          All
        </button>
        {sources.map(([src, count]) => (
          <button
            key={src}
            onClick={() => { setSourceFilter(sourceFilter === src ? "all" : src); setPage(0); }}
            className={`px-3 py-1 text-xs rounded-lg border transition-colors ${
              sourceFilter === src ? "bg-white/10 border-white/20 text-white" : "bg-[#18181b] border-[#27272a] text-[#a1a1aa] hover:text-white"
            }`}
          >
            {src.replace(" (Scraped)", "")} ({count})
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Search names, firms, focus areas, descriptions..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          className="bg-[#18181b] border border-[#27272a] rounded-lg px-4 py-2 text-sm text-white placeholder:text-[#52525b] focus:outline-none focus:border-[#3b82f6] flex-1 max-w-md transition-colors"
        />
        {(categoryFilter !== "all" || sourceFilter !== "all" || crmFilter !== "all" || search) && (
          <button
            onClick={() => { setCategoryFilter("all"); setSourceFilter("all"); setCrmFilter("all"); setSearch(""); setPage(0); }}
            className="px-3 py-2 text-xs rounded-lg bg-[#27272a] text-[#a1a1aa] hover:text-white transition-colors"
          >
            Clear filters
          </button>
        )}
        <span className="text-xs text-[#a1a1aa]">{sorted.length} results</span>
      </div>

      {/* Table */}
      <div className="table-container bg-[#18181b] border border-[#27272a] rounded-xl overflow-hidden max-h-[60vh] overflow-y-auto">
        <table>
          <thead>
            <tr>
              <th className="cursor-pointer select-none" onClick={() => toggleSort("name")}>
                Name {sortKey === "name" && (sortDir === "asc" ? "↑" : "↓")}
              </th>
              <th className="cursor-pointer select-none" onClick={() => toggleSort("firm")}>
                Firm {sortKey === "firm" && (sortDir === "asc" ? "↑" : "↓")}
              </th>
              <th>Category</th>
              <th>Source</th>
              <th className="cursor-pointer select-none" onClick={() => toggleSort("checkSize")}>
                Check Size {sortKey === "checkSize" && (sortDir === "asc" ? "↑" : "↓")}
              </th>
              <th>Focus</th>
              <th>Rounds</th>
              <th>CRM</th>
              <th>Contact</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((c, i) => (
              <tr key={i}>
                <td className="font-medium text-white whitespace-nowrap">{c.name}</td>
                <td className="text-[#a1a1aa] text-xs max-w-[180px] truncate">{c.firm !== c.name ? c.firm : "—"}</td>
                <td><CategoryBadge category={c.category} /></td>
                <td><SourceBadge source={c.source} /></td>
                <td className="text-xs text-emerald-400 whitespace-nowrap">{c.checkSize || "—"}</td>
                <td className="text-xs text-[#a1a1aa] max-w-[200px] truncate">{c.focus || "—"}</td>
                <td className="text-xs text-[#a1a1aa] whitespace-nowrap">{c.rounds || "—"}</td>
                <td>
                  {c.inCRM
                    ? <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full border bg-blue-500/10 text-blue-400 border-blue-500/20">In CRM</span>
                    : <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">New</span>
                  }
                </td>
                <td className="flex items-center gap-2">
                  {c.email && (
                    <a href={`mailto:${c.email}`} className="text-cyan-400 hover:text-cyan-300 text-xs">Email</a>
                  )}
                  {c.linkedin && (
                    <a href={c.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 text-xs">LI</a>
                  )}
                  {!c.email && !c.linkedin && <span className="text-[#71717a] text-xs">—</span>}
                </td>
              </tr>
            ))}
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
