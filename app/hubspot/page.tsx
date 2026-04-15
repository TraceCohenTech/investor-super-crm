"use client";

import { useState, useMemo } from "react";
import contacts from "@/data/hubspot-contacts.json";
import summary from "@/data/hubspot-summary.json";

type Contact = (typeof contacts)[number];

function OwnerBadge({ owner }: { owner: string }) {
  const colors: Record<string, string> = {
    "Alex Rivera": "bg-blue-500/10 text-blue-400 border-blue-500/20",
    "Jordan Kim": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    "Sam Chen": "bg-amber-500/10 text-amber-400 border-amber-500/20",
    "Taylor Morgan": "bg-rose-500/10 text-rose-400 border-rose-500/20",
  };
  return (
    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full border whitespace-nowrap ${colors[owner] || "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"}`}>
      {owner || "—"}
    </span>
  );
}

export default function HubSpotPage() {
  const [search, setSearch] = useState("");
  const [ownerFilter, setOwnerFilter] = useState<string>("all");
  const [crmFilter, setCrmFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [sortKey, setSortKey] = useState<"name" | "email" | "domain" | "owner">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const pageSize = 50;

  const filtered = useMemo(() => {
    let data = contacts as Contact[];
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(c =>
        c.fullName.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.domain.toLowerCase().includes(q) ||
        c.owner.toLowerCase().includes(q)
      );
    }
    if (ownerFilter !== "all") {
      data = data.filter(c => c.owner === ownerFilter);
    }
    if (crmFilter === "new") {
      data = data.filter(c => !c.inCRM);
    } else if (crmFilter === "existing") {
      data = data.filter(c => c.inCRM);
    }
    return data;
  }, [search, ownerFilter, crmFilter]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name") cmp = a.fullName.localeCompare(b.fullName);
      else if (sortKey === "email") cmp = a.email.localeCompare(b.email);
      else if (sortKey === "domain") cmp = a.domain.localeCompare(b.domain);
      else cmp = a.owner.localeCompare(b.owner);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.ceil(sorted.length / pageSize);
  const paged = sorted.slice(page * pageSize, (page + 1) * pageSize);

  const owners = Object.entries(summary.owners as Record<string, number>);

  function toggleSort(key: typeof sortKey) {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
    setPage(0);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">🟠 HubSpot Contacts</h1>
        <p className="text-sm text-[#a1a1aa] mt-1">{summary.total.toLocaleString()} contacts from HubSpot CRM exports</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
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
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-3">
          <div className="text-xs text-[#a1a1aa]">Have Email</div>
          <div className="text-lg font-bold text-cyan-400 mt-1">{summary.hasEmail.toLocaleString()}</div>
        </div>
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-3">
          <div className="text-xs text-[#a1a1aa]">Have Phone</div>
          <div className="text-lg font-bold text-amber-400 mt-1">{summary.hasPhone.toLocaleString()}</div>
        </div>
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-3">
          <div className="text-xs text-[#a1a1aa]">Have Name</div>
          <div className="text-lg font-bold text-white mt-1">{summary.hasName.toLocaleString()}</div>
        </div>
      </div>

      {/* Owner filter */}
      <div className="flex flex-wrap gap-2">
        <span className="text-xs text-[#71717a] py-1.5">Owner:</span>
        <button
          onClick={() => { setOwnerFilter("all"); setPage(0); }}
          className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
            ownerFilter === "all" ? "bg-white/10 border-white/20 text-white" : "bg-[#18181b] border-[#27272a] text-[#a1a1aa] hover:text-white"
          }`}
        >
          All
        </button>
        {owners.map(([owner, count]) => (
          <button
            key={owner}
            onClick={() => { setOwnerFilter(ownerFilter === owner ? "all" : owner); setPage(0); }}
            className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
              ownerFilter === owner ? "bg-white/10 border-white/20 text-white" : "bg-[#18181b] border-[#27272a] text-[#a1a1aa] hover:text-white"
            }`}
          >
            {owner} ({count.toLocaleString()})
          </button>
        ))}
      </div>

      {/* Top domains */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-4">
        <div className="text-xs text-[#a1a1aa] mb-3">Top Email Domains</div>
        <div className="flex flex-wrap gap-2">
          {summary.topDomains.slice(0, 15).map((d: { name: string; count: number }) => (
            <button
              key={d.name}
              onClick={() => { setSearch(d.name); setPage(0); }}
              className="px-2.5 py-1 text-xs rounded-lg bg-[#27272a] text-[#a1a1aa] hover:text-white hover:bg-[#3f3f46] transition-colors"
            >
              {d.name} <span className="text-[#71717a]">({d.count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Search names, emails, domains..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          className="bg-[#18181b] border border-[#27272a] rounded-lg px-4 py-2 text-sm text-white placeholder:text-[#52525b] focus:outline-none focus:border-[#3b82f6] flex-1 max-w-md transition-colors"
        />
        {(ownerFilter !== "all" || crmFilter !== "all" || search) && (
          <button
            onClick={() => { setOwnerFilter("all"); setCrmFilter("all"); setSearch(""); setPage(0); }}
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
              <th className="cursor-pointer select-none" onClick={() => toggleSort("email")}>
                Email {sortKey === "email" && (sortDir === "asc" ? "↑" : "↓")}
              </th>
              <th className="cursor-pointer select-none" onClick={() => toggleSort("domain")}>
                Domain {sortKey === "domain" && (sortDir === "asc" ? "↑" : "↓")}
              </th>
              <th>Phone</th>
              <th className="cursor-pointer select-none" onClick={() => toggleSort("owner")}>
                Owner {sortKey === "owner" && (sortDir === "asc" ? "↑" : "↓")}
              </th>
              <th>CRM</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((c, i) => (
              <tr key={i}>
                <td className="font-medium text-white whitespace-nowrap">{c.fullName || <span className="text-[#71717a] italic">No name</span>}</td>
                <td>
                  {c.email
                    ? <a href={`mailto:${c.email}`} className="text-cyan-400 hover:text-cyan-300 text-xs truncate max-w-[220px] block">{c.email}</a>
                    : <span className="text-[#71717a] text-xs">—</span>
                  }
                </td>
                <td className="text-xs text-[#a1a1aa]">{c.domain || "—"}</td>
                <td className="text-xs text-[#a1a1aa] whitespace-nowrap">{c.phone || "—"}</td>
                <td><OwnerBadge owner={c.owner} /></td>
                <td>
                  {c.inCRM
                    ? <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full border bg-blue-500/10 text-blue-400 border-blue-500/20">In CRM</span>
                    : <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">New</span>
                  }
                </td>
                <td className="text-xs text-[#71717a] whitespace-nowrap">{c.createDate ? c.createDate.split(" ")[0] : "—"}</td>
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
