"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import type { ContactRecord, SearchData } from "@/lib/types";
import { STRENGTH_COLORS } from "@/lib/types";
import { getAllFollowUps, getSnoozed, snoozeContact, setFollowUp } from "@/lib/local-store";

const today = new Date().toISOString().split("T")[0];

function inDays(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

function StrengthBadge({ strength }: { strength: string }) {
  if (!strength || strength === "None") return null;
  return (
    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full border whitespace-nowrap ${STRENGTH_COLORS[strength] || ""}`}>
      {strength}
    </span>
  );
}

function OutreachRow({ contact, reason, onSnooze, onDone }: {
  contact: ContactRecord;
  reason: string;
  onSnooze: (id: string, until: string) => void;
  onDone: (id: string) => void;
}) {
  const [showSnooze, setShowSnooze] = useState(false);

  return (
    <div className="flex items-center gap-3 py-3 px-4 hover:bg-[#27272a]/30 transition-colors rounded-lg group">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Link href={`/contact/${contact.id}`} className="text-sm font-medium text-white hover:text-[#3b82f6] transition-colors truncate">
            {contact.n}
          </Link>
          <StrengthBadge strength={contact.rs} />
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {contact.c && <span className="text-xs text-[#a1a1aa] truncate">{contact.c}</span>}
          {contact.t && <span className="text-xs text-[#71717a] truncate">· {contact.t}</span>}
        </div>
        <span className="text-xs text-[#71717a] mt-0.5 block">{reason}</span>
      </div>

      <div className="flex items-center gap-1.5 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
        {contact.e && (
          <a
            href={`mailto:${contact.e}?subject=${encodeURIComponent(`Following up — ${contact.n}`)}`}
            className="px-2.5 py-1.5 text-xs rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20 transition-colors"
          >
            Email
          </a>
        )}
        {contact.li && (
          <a
            href={contact.li}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1.5 text-xs rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-colors"
          >
            LinkedIn
          </a>
        )}

        <div className="relative">
          <button
            onClick={() => setShowSnooze(!showSnooze)}
            className="px-2.5 py-1.5 text-xs rounded-lg bg-[#27272a] border border-[#3f3f46] text-[#a1a1aa] hover:text-white hover:border-[#52525b] transition-colors"
          >
            Snooze
          </button>
          {showSnooze && (
            <div className="absolute right-0 top-full mt-1 bg-[#18181b] border border-[#27272a] rounded-lg shadow-xl z-10 py-1 min-w-[120px]">
              {[
                { label: "1 week", days: 7 },
                { label: "2 weeks", days: 14 },
                { label: "1 month", days: 30 },
                { label: "3 months", days: 90 },
              ].map(({ label, days }) => (
                <button
                  key={days}
                  onClick={() => { onSnooze(contact.id, inDays(days)); setShowSnooze(false); }}
                  className="block w-full text-left px-3 py-1.5 text-xs text-[#a1a1aa] hover:text-white hover:bg-[#27272a] transition-colors"
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => onDone(contact.id)}
          className="px-2.5 py-1.5 text-xs rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  );
}

function SectionBlock({ title, icon, count, accent, children }: {
  title: string; icon: string; count: number; accent: string; children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  if (count === 0) return null;
  return (
    <div className="bg-[#18181b] border border-[#27272a] rounded-xl overflow-hidden">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#27272a]/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">{icon}</span>
          <h2 className="text-sm font-semibold text-white">{title}</h2>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${accent}`}>{count}</span>
        </div>
        <span className="text-[#71717a] text-xs">{collapsed ? "Show" : "Hide"}</span>
      </button>
      {!collapsed && <div className="px-1 pb-2">{children}</div>}
    </div>
  );
}

export default function TodayPage() {
  const [data, setData] = useState<SearchData | null>(null);
  const [loading, setLoading] = useState(true);
  const [snoozed, setSnoozed] = useState<Record<string, string>>({});
  const [done, setDone] = useState<Set<string>>(new Set());
  const [followUps, setFollowUps] = useState<Record<string, string>>({});

  useEffect(() => {
    import("@/data/search-index.json").then((mod) => {
      setData(mod.default as unknown as SearchData);
      setLoading(false);
    });
    setSnoozed(getSnoozed());
    setFollowUps(getAllFollowUps());
  }, []);

  const isSnoozed = (id: string) => snoozed[id] && snoozed[id] > today;
  const isDone = (id: string) => done.has(id);
  const isHidden = (id: string) => isSnoozed(id) || isDone(id);

  const handleSnooze = (id: string, until: string) => {
    snoozeContact(id, until);
    setSnoozed(prev => ({ ...prev, [id]: until }));
  };

  const handleDone = (id: string) => {
    setFollowUp(id, null);
    setDone(prev => { const s = new Set(Array.from(prev)); s.add(id); return s; });
  };

  const records = useMemo(() => data?.records as ContactRecord[] || [], [data]);

  const overdueFollowUps = useMemo(() => {
    const fuEntries = Object.entries(followUps)
      .filter(([, date]) => date <= today)
      .map(([id]) => id);

    const dataFu = records
      .filter(r => r.fu && r.fu <= today)
      .map(r => r.id);

    const allIds = Array.from(new Set([...fuEntries, ...dataFu]));
    return allIds
      .map(id => records.find(r => r.id === id))
      .filter((r): r is ContactRecord => !!r && !isHidden(r.id))
      .sort((a, b) => (b.ec || 0) - (a.ec || 0));
  }, [records, followUps, snoozed, done]);

  const goingCold = useMemo(() => {
    return records
      .filter(r => r.sl === "stale" && (r.rs === "Strong" || r.rs === "Medium") && !isHidden(r.id))
      .sort((a, b) => {
        const order = { Strong: 0, Medium: 1 };
        return (order[a.rs as keyof typeof order] ?? 2) - (order[b.rs as keyof typeof order] ?? 2);
      })
      .slice(0, 50);
  }, [records, snoozed, done]);

  const atRisk = useMemo(() => {
    return records
      .filter(r => r.sl === "at-risk" && (r.rs === "Strong" || r.rs === "Medium") && !isHidden(r.id))
      .sort((a, b) => {
        const order = { Strong: 0, Medium: 1 };
        return (order[a.rs as keyof typeof order] ?? 2) - (order[b.rs as keyof typeof order] ?? 2);
      })
      .slice(0, 50);
  }, [records, snoozed, done]);

  const recentlyAdded = useMemo(() => {
    return records
      .filter(r => r.crm === "New" && r.rs !== "None" && r.e && !isHidden(r.id))
      .sort((a, b) => {
        const order = { Strong: 0, Medium: 1, Weak: 2 };
        return (order[a.rs as keyof typeof order] ?? 3) - (order[b.rs as keyof typeof order] ?? 3);
      })
      .slice(0, 30);
  }, [records, snoozed, done]);

  const totalActions = overdueFollowUps.length + goingCold.length + atRisk.length + recentlyAdded.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="text-2xl mb-3">☀️</div>
          <div className="text-sm text-[#a1a1aa]">Building your outreach list...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Today&apos;s Outreach</h1>
        <p className="text-sm text-[#a1a1aa] mt-1">
          {totalActions > 0
            ? <>{totalActions} contacts need your attention — strongest relationships first</>
            : <>You&apos;re all caught up. Nice work.</>
          }
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-amber-400">{overdueFollowUps.length}</div>
          <div className="text-xs text-[#a1a1aa] mt-1">Overdue</div>
        </div>
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-red-400">{goingCold.length}</div>
          <div className="text-xs text-[#a1a1aa] mt-1">Going Cold</div>
        </div>
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-orange-400">{atRisk.length}</div>
          <div className="text-xs text-[#a1a1aa] mt-1">At Risk</div>
        </div>
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-blue-400">{recentlyAdded.length}</div>
          <div className="text-xs text-[#a1a1aa] mt-1">New to Reach</div>
        </div>
      </div>

      {done.size > 0 && (
        <div className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-2">
          {done.size} contact{done.size > 1 ? "s" : ""} marked done this session
        </div>
      )}

      <SectionBlock title="Overdue Follow-Ups" icon="🔥" count={overdueFollowUps.length} accent="bg-amber-500/10 text-amber-400">
        {overdueFollowUps.map(r => (
          <OutreachRow
            key={r.id}
            contact={r}
            reason={`Follow-up was due ${followUps[r.id] || r.fu}`}
            onSnooze={handleSnooze}
            onDone={handleDone}
          />
        ))}
      </SectionBlock>

      <SectionBlock title="Going Cold — Save These" icon="🥶" count={goingCold.length} accent="bg-red-500/10 text-red-400">
        {goingCold.map(r => (
          <OutreachRow
            key={r.id}
            contact={r}
            reason={`${r.rs} relationship · ${r.ec || 0} emails · last contact ${r.lc || "unknown"}`}
            onSnooze={handleSnooze}
            onDone={handleDone}
          />
        ))}
      </SectionBlock>

      <SectionBlock title="At Risk — Keep Warm" icon="⚠️" count={atRisk.length} accent="bg-orange-500/10 text-orange-400">
        {atRisk.map(r => (
          <OutreachRow
            key={r.id}
            contact={r}
            reason={`${r.rs} relationship · ${r.ec || 0} emails · last contact ${r.lc || "unknown"}`}
            onSnooze={handleSnooze}
            onDone={handleDone}
          />
        ))}
      </SectionBlock>

      <SectionBlock title="New Contacts to Reach Out To" icon="👋" count={recentlyAdded.length} accent="bg-blue-500/10 text-blue-400">
        {recentlyAdded.map(r => (
          <OutreachRow
            key={r.id}
            contact={r}
            reason={`New to CRM · ${r.it || "Unknown type"} · ${r.rg || "No region"}`}
            onSnooze={handleSnooze}
            onDone={handleDone}
          />
        ))}
      </SectionBlock>
    </div>
  );
}
