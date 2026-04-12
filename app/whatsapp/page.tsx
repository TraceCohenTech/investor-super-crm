"use client";

import { useState, useMemo } from "react";
import contacts from "@/data/whatsapp-contacts.json";
import groups from "@/data/whatsapp-groups.json";

type Contact = (typeof contacts)[number];

function GroupBadge({ name }: { name: string }) {
  const colors: Record<string, string> = {
    "The Pre-Seed Regulars": "bg-blue-500/10 text-blue-400 border-blue-500/20",
    "Family Office Peer Community": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    "GPs Anonymous (VC MPs only)": "bg-amber-500/10 text-amber-400 border-amber-500/20",
    "LPs Embracing Emergence": "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    "VC Investors (NYC-Boston-SF)": "bg-rose-500/10 text-rose-400 border-rose-500/20",
    "First Check for Israeli Founders": "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    "Jewish VCs - Politics": "bg-sky-500/10 text-sky-400 border-sky-500/20",
    "Six Point Ventures": "bg-teal-500/10 text-teal-400 border-teal-500/20",
    "361Firm VC Group": "bg-orange-500/10 text-orange-400 border-orange-500/20",
    "Applied AI VCs": "bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20",
    "Deep Tech VCs": "bg-lime-500/10 text-lime-400 border-lime-500/20",
    "Defense Tech VC": "bg-red-500/10 text-red-400 border-red-500/20",
  };
  const short: Record<string, string> = {
    "The Pre-Seed Regulars": "Pre-Seed",
    "Family Office Peer Community": "Family Office",
    "GPs Anonymous (VC MPs only)": "GPs Anon",
    "LPs Embracing Emergence": "LPs",
    "VC Investors (NYC-Boston-SF)": "NYC/BOS/SF",
    "First Check for Israeli Founders": "Israeli",
    "Jewish VCs - Politics": "Jewish VCs",
    "Six Point Ventures": "SPV",
    "361Firm VC Group": "361Firm",
    "Applied AI VCs": "Applied AI",
    "Deep Tech VCs": "Deep Tech",
    "Defense Tech VC": "Defense",
  };
  return (
    <span className={`inline-flex px-1.5 py-0.5 text-[10px] font-medium rounded border whitespace-nowrap ${colors[name] || "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"}`}>
      {short[name] || name}
    </span>
  );
}

export default function WhatsAppPage() {
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const [crmFilter, setCrmFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [sortKey, setSortKey] = useState<"messages" | "groupCount" | "name">("messages");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const pageSize = 50;

  const filtered = useMemo(() => {
    let data = contacts as Contact[];
    // Remove "You" and "Trace Cohen" from list
    data = data.filter(c => c.name !== "You");

    if (search) {
      const q = search.toLowerCase();
      data = data.filter(c =>
        c.name.toLowerCase().includes(q) ||
        (c.company && c.company.toLowerCase().includes(q)) ||
        (c.introText && c.introText.toLowerCase().includes(q))
      );
    }
    if (groupFilter !== "all") {
      data = data.filter(c => c.groups.includes(groupFilter));
    }
    if (crmFilter === "new") {
      data = data.filter(c => !c.inCRM);
    } else if (crmFilter === "existing") {
      data = data.filter(c => c.inCRM);
    }
    return data;
  }, [search, groupFilter, crmFilter]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "messages") cmp = a.messages - b.messages;
      else if (sortKey === "groupCount") cmp = a.groupCount - b.groupCount;
      else cmp = a.name.localeCompare(b.name);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.ceil(sorted.length / pageSize);
  const paged = sorted.slice(page * pageSize, (page + 1) * pageSize);

  const totalNew = (contacts as Contact[]).filter(c => !c.inCRM && c.name !== "You").length;
  const totalExisting = (contacts as Contact[]).filter(c => c.inCRM && c.name !== "You").length;
  const multiGroup = (contacts as Contact[]).filter(c => c.groupCount > 1 && c.name !== "You").length;
  const withLinkedIn = (contacts as Contact[]).filter(c => (c as Record<string, unknown>).linkedinUrl).length;

  function toggleSort(key: typeof sortKey) {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
    setPage(0);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">💬 WhatsApp Network</h1>
        <p className="text-sm text-[#a1a1aa] mt-1">Contacts extracted from 12 WhatsApp investor groups</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        {(groups as { name: string; members: number; messages: number }[]).map(g => (
          <button
            key={g.name}
            onClick={() => { setGroupFilter(groupFilter === g.name ? "all" : g.name); setPage(0); }}
            className={`bg-[#18181b] border rounded-xl p-3 text-left transition-colors ${
              groupFilter === g.name ? "border-[#3b82f6]" : "border-[#27272a] hover:border-[#3f3f46]"
            }`}
          >
            <div className="text-xs text-[#a1a1aa] truncate">{g.name.replace("(VC MPs only)", "").replace("Peer Community", "")}</div>
            <div className="text-lg font-bold text-white mt-1">{g.members}</div>
            <div className="text-[10px] text-[#52525b]">{g.messages.toLocaleString()} msgs</div>
          </button>
        ))}
      </div>

      {/* Summary row */}
      <div className="flex flex-wrap gap-3">
        <div className="bg-[#18181b] border border-[#27272a] rounded-lg px-4 py-2">
          <span className="text-xs text-[#a1a1aa]">Total: </span>
          <span className="text-sm font-bold text-white">{(contacts as Contact[]).length - 1}</span>
        </div>
        <button
          onClick={() => { setCrmFilter(crmFilter === "new" ? "all" : "new"); setPage(0); }}
          className={`rounded-lg px-4 py-2 border transition-colors ${
            crmFilter === "new" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-[#18181b] border-[#27272a] text-[#a1a1aa] hover:text-white"
          }`}
        >
          <span className="text-xs">New to CRM: </span>
          <span className="text-sm font-bold">{totalNew}</span>
        </button>
        <button
          onClick={() => { setCrmFilter(crmFilter === "existing" ? "all" : "existing"); setPage(0); }}
          className={`rounded-lg px-4 py-2 border transition-colors ${
            crmFilter === "existing" ? "bg-blue-500/10 border-blue-500/30 text-blue-400" : "bg-[#18181b] border-[#27272a] text-[#a1a1aa] hover:text-white"
          }`}
        >
          <span className="text-xs">Already in CRM: </span>
          <span className="text-sm font-bold">{totalExisting}</span>
        </button>
        <div className="bg-[#18181b] border border-[#27272a] rounded-lg px-4 py-2">
          <span className="text-xs text-[#a1a1aa]">Multi-group: </span>
          <span className="text-sm font-bold text-amber-400">{multiGroup}</span>
        </div>
        <div className="bg-[#18181b] border border-[#27272a] rounded-lg px-4 py-2">
          <span className="text-xs text-[#a1a1aa]">With LinkedIn: </span>
          <span className="text-sm font-bold text-blue-400">{withLinkedIn}</span>
        </div>
      </div>

      {/* Search + filters */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Search names, companies, intros..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          className="bg-[#18181b] border border-[#27272a] rounded-lg px-4 py-2 text-sm text-white placeholder:text-[#52525b] focus:outline-none focus:border-[#3b82f6] flex-1 max-w-md transition-colors"
        />
        <span className="text-xs text-[#a1a1aa]">{sorted.length} results</span>
      </div>

      {/* Table */}
      <div className="table-container bg-[#18181b] border border-[#27272a] rounded-xl overflow-hidden max-h-[65vh] overflow-y-auto">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Company</th>
              <th className="cursor-pointer select-none" onClick={() => toggleSort("groupCount")}>
                Groups {sortKey === "groupCount" && (sortDir === "asc" ? "↑" : "↓")}
              </th>
              <th className="cursor-pointer select-none" onClick={() => toggleSort("messages")}>
                Messages {sortKey === "messages" && (sortDir === "asc" ? "↑" : "↓")}
              </th>
              <th>CRM</th>
              <th>Focus</th>
              <th>LinkedIn</th>
              <th>Last Seen</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((c, i) => (
              <tr key={i}>
                <td className="font-medium text-white whitespace-nowrap">{c.name}</td>
                <td className="text-[#a1a1aa] text-xs">{c.company || "—"}</td>
                <td>
                  <div className="flex flex-wrap gap-1">
                    {c.groups.map(g => <GroupBadge key={g} name={g} />)}
                  </div>
                </td>
                <td>
                  <span className="font-mono text-xs text-emerald-400">{c.messages}</span>
                </td>
                <td>
                  {c.inCRM
                    ? <span className="inline-flex px-2 py-0.5 text-[10px] font-medium rounded-full border bg-blue-500/10 text-blue-400 border-blue-500/20">In CRM</span>
                    : <span className="inline-flex px-2 py-0.5 text-[10px] font-medium rounded-full border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">New</span>
                  }
                </td>
                <td className="text-xs text-[#a1a1aa]">{(c as Record<string, unknown>).focus as string || "—"}</td>
                <td>
                  {(c as Record<string, unknown>).linkedinUrl
                    ? <a href={(c as Record<string, unknown>).linkedinUrl as string} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 text-xs">LI</a>
                    : "—"
                  }
                </td>
                <td className="text-xs text-[#52525b] whitespace-nowrap">{c.lastSeen || "—"}</td>
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
