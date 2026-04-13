"use client";

import { useState, useMemo } from "react";
import connections from "@/data/linkedin-connections.json";
import summary from "@/data/linkedin-summary.json";

type Connection = (typeof connections)[number];

function CategoryBadge({ category }: { category: string }) {
  const colors: Record<string, string> = {
    "Investor/VC": "bg-blue-500/10 text-blue-400 border-blue-500/20",
    "Founder": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    "Executive": "bg-amber-500/10 text-amber-400 border-amber-500/20",
    "Other": "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  };
  return (
    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full border ${colors[category] || colors["Other"]}`}>
      {category}
    </span>
  );
}

function CRMBadge({ status }: { status: string }) {
  if (status === "In CRM") {
    return <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full border bg-blue-500/10 text-blue-400 border-blue-500/20">In CRM</span>;
  }
  return <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">New</span>;
}

export default function ConnectionsPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [crmFilter, setCrmFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [sortKey, setSortKey] = useState<"name" | "company" | "position">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const pageSize = 50;

  const filtered = useMemo(() => {
    let data = connections as Connection[];
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(c =>
        c.fullName.toLowerCase().includes(q) ||
        c.company.toLowerCase().includes(q) ||
        c.position.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q)
      );
    }
    if (categoryFilter !== "all") {
      data = data.filter(c => c.category === categoryFilter);
    }
    if (crmFilter === "new") {
      data = data.filter(c => c.crmStatus === "New");
    } else if (crmFilter === "existing") {
      data = data.filter(c => c.crmStatus === "In CRM");
    }
    return data;
  }, [search, categoryFilter, crmFilter]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name") cmp = a.fullName.localeCompare(b.fullName);
      else if (sortKey === "company") cmp = a.company.localeCompare(b.company);
      else cmp = a.position.localeCompare(b.position);
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">🔗 LinkedIn Connections</h1>
        <p className="text-sm text-[#a1a1aa] mt-1">{summary.total.toLocaleString()} connections from your LinkedIn network</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-3">
          <div className="text-xs text-[#a1a1aa]">Total</div>
          <div className="text-lg font-bold text-white mt-1">{summary.total.toLocaleString()}</div>
        </div>
        <button
          onClick={() => { setCrmFilter(crmFilter === "new" ? "all" : "new"); setPage(0); }}
          className={`rounded-xl p-3 text-left transition-colors border ${
            crmFilter === "new" ? "bg-emerald-500/10 border-emerald-500/30" : "bg-[#18181b] border-[#27272a] hover:border-[#3f3f46]"
          }`}
        >
          <div className="text-xs text-[#a1a1aa]">New to CRM</div>
          <div className="text-lg font-bold text-emerald-400 mt-1">{summary.newToCRM.toLocaleString()}</div>
        </button>
        <button
          onClick={() => { setCrmFilter(crmFilter === "existing" ? "all" : "existing"); setPage(0); }}
          className={`rounded-xl p-3 text-left transition-colors border ${
            crmFilter === "existing" ? "bg-blue-500/10 border-blue-500/30" : "bg-[#18181b] border-[#27272a] hover:border-[#3f3f46]"
          }`}
        >
          <div className="text-xs text-[#a1a1aa]">In CRM</div>
          <div className="text-lg font-bold text-blue-400 mt-1">{summary.inCRM.toLocaleString()}</div>
        </button>
        <button
          onClick={() => { setCategoryFilter(categoryFilter === "Investor/VC" ? "all" : "Investor/VC"); setPage(0); }}
          className={`rounded-xl p-3 text-left transition-colors border ${
            categoryFilter === "Investor/VC" ? "bg-blue-500/10 border-blue-500/30" : "bg-[#18181b] border-[#27272a] hover:border-[#3f3f46]"
          }`}
        >
          <div className="text-xs text-[#a1a1aa]">Investors/VC</div>
          <div className="text-lg font-bold text-blue-400 mt-1">{summary.investors.toLocaleString()}</div>
        </button>
        <button
          onClick={() => { setCategoryFilter(categoryFilter === "Founder" ? "all" : "Founder"); setPage(0); }}
          className={`rounded-xl p-3 text-left transition-colors border ${
            categoryFilter === "Founder" ? "bg-emerald-500/10 border-emerald-500/30" : "bg-[#18181b] border-[#27272a] hover:border-[#3f3f46]"
          }`}
        >
          <div className="text-xs text-[#a1a1aa]">Founders</div>
          <div className="text-lg font-bold text-emerald-400 mt-1">{summary.founders.toLocaleString()}</div>
        </button>
        <button
          onClick={() => { setCategoryFilter(categoryFilter === "Executive" ? "all" : "Executive"); setPage(0); }}
          className={`rounded-xl p-3 text-left transition-colors border ${
            categoryFilter === "Executive" ? "bg-amber-500/10 border-amber-500/30" : "bg-[#18181b] border-[#27272a] hover:border-[#3f3f46]"
          }`}
        >
          <div className="text-xs text-[#a1a1aa]">Executives</div>
          <div className="text-lg font-bold text-amber-400 mt-1">{summary.executives.toLocaleString()}</div>
        </button>
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-3">
          <div className="text-xs text-[#a1a1aa]">Have Email</div>
          <div className="text-lg font-bold text-cyan-400 mt-1">{summary.hasEmail}</div>
        </div>
      </div>

      {/* Top companies */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-4">
        <div className="text-xs text-[#a1a1aa] mb-3">Top Companies</div>
        <div className="flex flex-wrap gap-2">
          {summary.topCompanies.slice(0, 15).map((c: { name: string; count: number }) => (
            <button
              key={c.name}
              onClick={() => { setSearch(c.name); setPage(0); }}
              className="px-2.5 py-1 text-xs rounded-lg bg-[#27272a] text-[#a1a1aa] hover:text-white hover:bg-[#3f3f46] transition-colors"
            >
              {c.name} <span className="text-[#71717a]">({c.count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Search names, companies, titles, emails..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          className="bg-[#18181b] border border-[#27272a] rounded-lg px-4 py-2 text-sm text-white placeholder:text-[#52525b] focus:outline-none focus:border-[#3b82f6] flex-1 max-w-md transition-colors"
        />
        {(categoryFilter !== "all" || crmFilter !== "all" || search) && (
          <button
            onClick={() => { setCategoryFilter("all"); setCrmFilter("all"); setSearch(""); setPage(0); }}
            className="px-3 py-2 text-xs rounded-lg bg-[#27272a] text-[#a1a1aa] hover:text-white transition-colors"
          >
            Clear filters
          </button>
        )}
        <span className="text-xs text-[#a1a1aa]">{sorted.length.toLocaleString()} results</span>
      </div>

      {/* Table */}
      <div className="table-container bg-[#18181b] border border-[#27272a] rounded-xl overflow-hidden max-h-[60vh] overflow-y-auto">
        <table>
          <thead>
            <tr>
              <th className="cursor-pointer select-none" onClick={() => toggleSort("name")}>
                Name {sortKey === "name" && (sortDir === "asc" ? "↑" : "↓")}
              </th>
              <th className="cursor-pointer select-none" onClick={() => toggleSort("company")}>
                Company {sortKey === "company" && (sortDir === "asc" ? "↑" : "↓")}
              </th>
              <th className="cursor-pointer select-none" onClick={() => toggleSort("position")}>
                Position {sortKey === "position" && (sortDir === "asc" ? "↑" : "↓")}
              </th>
              <th>Category</th>
              <th>CRM</th>
              <th>Email</th>
              <th>LinkedIn</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((c, i) => (
              <tr key={i}>
                <td className="font-medium text-white whitespace-nowrap">{c.fullName}</td>
                <td className="text-[#a1a1aa] text-xs max-w-[200px] truncate">{c.company || "—"}</td>
                <td className="text-[#a1a1aa] text-xs max-w-[250px] truncate">{c.position || "—"}</td>
                <td><CategoryBadge category={c.category} /></td>
                <td><CRMBadge status={c.crmStatus} /></td>
                <td>
                  {c.email
                    ? <a href={`mailto:${c.email}`} className="text-cyan-400 hover:text-cyan-300 text-xs truncate max-w-[150px] block">{c.email}</a>
                    : <span className="text-[#71717a] text-xs">—</span>
                  }
                </td>
                <td>
                  {c.url
                    ? <a href={c.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 text-xs">Profile</a>
                    : "—"
                  }
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
