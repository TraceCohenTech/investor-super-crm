"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import candidates from "@/data/dedup-candidates.json";

type Candidate = (typeof candidates)[number];

type MergeDecision = {
  keep: string;     // id of contact to keep
  remove: string;   // id of contact to merge into keep
  timestamp: string;
};

const GRADE_COLORS: { [key: string]: string } = {
  A: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  B: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  C: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  D: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  F: "bg-red-500/10 text-red-400 border-red-500/20",
};

const MERGE_KEY = "crm-merge-decisions";
const DISMISS_KEY = "crm-dedup-dismissed";

function loadMerges(): MergeDecision[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(MERGE_KEY) || "[]"); } catch { return []; }
}
function saveMerges(d: MergeDecision[]) {
  localStorage.setItem(MERGE_KEY, JSON.stringify(d));
}
function loadDismissed(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try { return new Set(JSON.parse(localStorage.getItem(DISMISS_KEY) || "[]")); } catch { return new Set(); }
}
function saveDismissed(d: Set<string>) {
  localStorage.setItem(DISMISS_KEY, JSON.stringify(Array.from(d)));
}

function pairKey(c: Candidate): string {
  return [c.id1, c.id2].sort().join("|");
}

function SimilarityBadge({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color = pct >= 95 ? "text-red-400 bg-red-500/10 border-red-500/20"
    : pct >= 90 ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
    : "text-blue-400 bg-blue-500/10 border-blue-500/20";
  return (
    <span className={`inline-flex px-2.5 py-1 text-xs font-bold rounded-full border ${color}`}>
      {pct}% match
    </span>
  );
}

function SourceDots({ sources }: { sources: string[] }) {
  return (
    <div className="flex gap-1 flex-wrap">
      {sources.map((s) => (
        <span key={s} className="px-1.5 py-0.5 text-xs rounded bg-[#27272a] text-[#a1a1aa]">
          {s}
        </span>
      ))}
    </div>
  );
}

function FieldRow({ label, val1, val2, selected, onSelect }: {
  label: string;
  val1: string;
  val2: string;
  selected: "left" | "right" | null;
  onSelect: (side: "left" | "right") => void;
}) {
  if (!val1 && !val2) return null;
  return (
    <div className="grid grid-cols-[80px_1fr_1fr] gap-2 items-center text-xs">
      <span className="text-[#71717a] text-right">{label}</span>
      <button
        onClick={() => onSelect("left")}
        className={`px-2 py-1 rounded text-left transition-colors ${
          selected === "left"
            ? "bg-[#3b82f6]/10 border border-[#3b82f6]/30 text-white"
            : val1
            ? "bg-[#18181b] border border-[#27272a] text-[#a1a1aa] hover:border-[#3f3f46]"
            : "bg-[#18181b] border border-[#27272a] text-[#3f3f46]"
        }`}
      >
        {val1 || "—"}
      </button>
      <button
        onClick={() => onSelect("right")}
        className={`px-2 py-1 rounded text-left transition-colors ${
          selected === "right"
            ? "bg-[#3b82f6]/10 border border-[#3b82f6]/30 text-white"
            : val2
            ? "bg-[#18181b] border border-[#27272a] text-[#a1a1aa] hover:border-[#3f3f46]"
            : "bg-[#18181b] border border-[#27272a] text-[#3f3f46]"
        }`}
      >
        {val2 || "—"}
      </button>
    </div>
  );
}

export default function DedupPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [minSimilarity, setMinSimilarity] = useState(0.85);
  const [merges, setMerges] = useState<MergeDecision[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [mergeTarget, setMergeTarget] = useState<Candidate | null>(null);
  const [fieldSelections, setFieldSelections] = useState<{ [field: string]: "left" | "right" }>({});
  const [showMerged, setShowMerged] = useState(false);
  const pageSize = 25;

  useEffect(() => {
    setMerges(loadMerges());
    setDismissed(loadDismissed());
  }, []);

  const mergedPairKeys = useMemo(() => {
    return new Set(merges.map(m => [m.keep, m.remove].sort().join("|")));
  }, [merges]);

  const filtered = useMemo(() => {
    let data = candidates as Candidate[];
    data = data.filter((c) => c.similarity >= minSimilarity);
    // Hide dismissed and already-merged pairs
    if (!showMerged) {
      data = data.filter((c) => {
        const key = pairKey(c);
        return !dismissed.has(key) && !mergedPairKeys.has(key);
      });
    }
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(
        (c) =>
          c.name1.toLowerCase().includes(q) ||
          c.name2.toLowerCase().includes(q) ||
          c.company1.toLowerCase().includes(q) ||
          c.company2.toLowerCase().includes(q) ||
          (c.email1 || "").toLowerCase().includes(q) ||
          (c.email2 || "").toLowerCase().includes(q)
      );
    }
    return data;
  }, [search, minSimilarity, dismissed, mergedPairKeys, showMerged]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = filtered.slice(page * pageSize, (page + 1) * pageSize);

  function dismissPair(c: Candidate) {
    const key = pairKey(c);
    const updated = new Set(dismissed);
    updated.add(key);
    setDismissed(updated);
    saveDismissed(updated);
  }

  function openMerge(c: Candidate) {
    setMergeTarget(c);
    // Auto-select better grade as primary
    const selections: { [f: string]: "left" | "right" } = {};
    const fields = ["name", "email", "company", "title"];
    const gradeOrder = ["A", "B", "C", "D", "F"];
    const g1 = gradeOrder.indexOf(c.grade1);
    const g2 = gradeOrder.indexOf(c.grade2);
    const preferLeft = g1 <= g2;
    for (const f of fields) {
      const v1 = (c as Record<string, unknown>)[`${f}1`] as string;
      const v2 = (c as Record<string, unknown>)[`${f}2`] as string;
      if (v1 && !v2) selections[f] = "left";
      else if (!v1 && v2) selections[f] = "right";
      else if (v1 && v2) selections[f] = preferLeft ? "left" : "right";
    }
    // Sources: merge both
    selections["sources"] = "left"; // both will be merged
    setFieldSelections(selections);
  }

  function confirmMerge() {
    if (!mergeTarget) return;
    // Determine which side is "keep" based on the majority of field selections
    const leftCount = Object.values(fieldSelections).filter(v => v === "left").length;
    const rightCount = Object.values(fieldSelections).filter(v => v === "right").length;
    const keepId = leftCount >= rightCount ? mergeTarget.id1 : mergeTarget.id2;
    const removeId = keepId === mergeTarget.id1 ? mergeTarget.id2 : mergeTarget.id1;

    const decision: MergeDecision = {
      keep: keepId,
      remove: removeId,
      timestamp: new Date().toISOString(),
    };
    const updated = [...merges, decision];
    setMerges(updated);
    saveMerges(updated);
    setMergeTarget(null);
  }

  function undoMerge(idx: number) {
    const updated = merges.filter((_, i) => i !== idx);
    setMerges(updated);
    saveMerges(updated);
  }

  function exportMerges() {
    const blob = new Blob([JSON.stringify(merges, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "merge-decisions.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          🔄 Dedup Review
        </h1>
        <p className="text-sm text-[#a1a1aa] mt-1">
          {candidates.length.toLocaleString()} potential duplicate pairs — review, merge, or dismiss
        </p>
      </div>

      {/* Merge history bar */}
      {merges.length > 0 && (
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-emerald-400 text-sm font-medium">
                {merges.length} merge{merges.length === 1 ? "" : "s"} recorded
              </span>
              <span className="text-xs text-[#71717a]">
                ({dismissed.size} dismissed)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowMerged(!showMerged)}
                className="px-3 py-1 text-[11px] rounded-lg bg-[#18181b] border border-[#27272a] text-[#a1a1aa] hover:text-white transition-colors"
              >
                {showMerged ? "Hide resolved" : "Show all"}
              </button>
              <button
                onClick={exportMerges}
                className="px-3 py-1 text-[11px] rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
              >
                Export JSON
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {merges.slice(-5).map((m, i) => (
              <div key={i} className="flex items-center gap-1.5 bg-[#18181b] rounded-lg px-2.5 py-1 border border-[#27272a]">
                <span className="text-xs text-emerald-400">Keep {m.keep.slice(0, 6)}</span>
                <span className="text-xs text-[#71717a]">← {m.remove.slice(0, 6)}</span>
                <button onClick={() => undoMerge(merges.length - 5 + i)} className="text-xs text-[#71717a] hover:text-red-400 ml-1">✕</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-4">
        <input
          type="text"
          placeholder="Search names, companies, emails..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          className="bg-[#18181b] border border-[#27272a] rounded-lg px-4 py-2 text-sm text-white placeholder:text-[#52525b] focus:outline-none focus:border-[#3b82f6] flex-1 max-w-md transition-colors"
        />
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#71717a]">Min similarity:</span>
          {[0.85, 0.9, 0.95].map((v) => (
            <button
              key={v}
              onClick={() => {
                setMinSimilarity(v);
                setPage(0);
              }}
              className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                minSimilarity === v
                  ? "bg-white/10 border-white/20 text-white"
                  : "bg-[#18181b] border-[#27272a] text-[#a1a1aa] hover:text-white"
              }`}
            >
              {Math.round(v * 100)}%
            </button>
          ))}
        </div>
        <span className="text-xs text-[#a1a1aa]">
          {filtered.length.toLocaleString()} pairs
        </span>
      </div>

      {/* Merge wizard modal */}
      {mergeTarget && (
        <div className="bg-[#18181b] border-2 border-[#3b82f6]/40 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Merge Wizard</h3>
            <span className="text-xs text-[#71717a]">Click each field to pick the value to keep</span>
          </div>

          {/* Headers */}
          <div className="grid grid-cols-[80px_1fr_1fr] gap-2 text-xs text-[#71717a]">
            <span></span>
            <div className="flex items-center gap-2">
              <span className={`px-1.5 py-0.5 rounded-full border text-xs font-bold ${GRADE_COLORS[mergeTarget.grade1] || ""}`}>{mergeTarget.grade1}</span>
              <span className="text-[#a1a1aa]">{mergeTarget.name1}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-1.5 py-0.5 rounded-full border text-xs font-bold ${GRADE_COLORS[mergeTarget.grade2] || ""}`}>{mergeTarget.grade2}</span>
              <span className="text-[#a1a1aa]">{mergeTarget.name2}</span>
            </div>
          </div>

          <FieldRow label="Name" val1={mergeTarget.name1} val2={mergeTarget.name2} selected={fieldSelections["name"] || null} onSelect={(s) => setFieldSelections(p => ({ ...p, name: s }))} />
          <FieldRow label="Email" val1={mergeTarget.email1} val2={mergeTarget.email2} selected={fieldSelections["email"] || null} onSelect={(s) => setFieldSelections(p => ({ ...p, email: s }))} />
          <FieldRow label="Company" val1={mergeTarget.company1} val2={mergeTarget.company2} selected={fieldSelections["company"] || null} onSelect={(s) => setFieldSelections(p => ({ ...p, company: s }))} />
          <FieldRow label="Title" val1={mergeTarget.title1} val2={mergeTarget.title2} selected={fieldSelections["title"] || null} onSelect={(s) => setFieldSelections(p => ({ ...p, title: s }))} />

          <div className="grid grid-cols-[80px_1fr_1fr] gap-2 items-start text-xs">
            <span className="text-[#71717a] text-right pt-1">Sources</span>
            <SourceDots sources={mergeTarget.sources1} />
            <SourceDots sources={mergeTarget.sources2} />
          </div>
          <div className="text-xs text-[#71717a] ml-[88px]">Sources from both contacts will be combined.</div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={confirmMerge}
              className="px-5 py-2 text-xs rounded-lg bg-[#3b82f6] text-white hover:bg-[#2563eb] transition-colors font-medium"
            >
              Confirm Merge
            </button>
            <button
              onClick={() => setMergeTarget(null)}
              className="px-4 py-2 text-xs text-[#a1a1aa] hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Candidate list */}
      <div className="space-y-3">
        {paged.map((c, i) => {
          const key = pairKey(c);
          const isMerged = mergedPairKeys.has(key);
          const isDismissed = dismissed.has(key);

          return (
            <div
              key={i}
              className={`bg-[#18181b] border rounded-xl p-4 ${
                isMerged ? "border-emerald-500/20 opacity-60" :
                isDismissed ? "border-[#27272a] opacity-40" :
                "border-[#27272a]"
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <SimilarityBadge value={c.similarity} />
                {isMerged && <span className="text-xs text-emerald-400">Merged</span>}
                {isDismissed && <span className="text-xs text-[#71717a]">Dismissed</span>}
                {!isMerged && !isDismissed && (
                  <div className="ml-auto flex items-center gap-2">
                    <button
                      onClick={() => openMerge(c)}
                      className="px-3 py-1 text-[11px] rounded-lg bg-[#3b82f6]/10 border border-[#3b82f6]/30 text-[#3b82f6] hover:bg-[#3b82f6]/20 transition-colors"
                    >
                      Merge
                    </button>
                    <button
                      onClick={() => dismissPair(c)}
                      className="px-3 py-1 text-[11px] rounded-lg bg-[#27272a] border border-[#3f3f46] text-[#a1a1aa] hover:text-white transition-colors"
                    >
                      Not a Dup
                    </button>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {/* Left side */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/contact/${c.id1}`}
                      className="text-sm font-medium text-white hover:text-[#3b82f6] transition-colors"
                    >
                      {c.name1}
                    </Link>
                    <span
                      className={`inline-flex px-1.5 py-0.5 text-xs font-medium rounded-full border ${
                        GRADE_COLORS[c.grade1] || ""
                      }`}
                    >
                      {c.grade1}
                    </span>
                  </div>
                  {c.email1 && (
                    <div className="text-xs text-cyan-400">{c.email1}</div>
                  )}
                  <div className="text-xs text-[#a1a1aa]">{c.company1}</div>
                  {c.title1 && (
                    <div className="text-xs text-[#71717a]">{c.title1}</div>
                  )}
                  <SourceDots sources={c.sources1} />
                </div>
                {/* Right side */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/contact/${c.id2}`}
                      className="text-sm font-medium text-white hover:text-[#3b82f6] transition-colors"
                    >
                      {c.name2}
                    </Link>
                    <span
                      className={`inline-flex px-1.5 py-0.5 text-xs font-medium rounded-full border ${
                        GRADE_COLORS[c.grade2] || ""
                      }`}
                    >
                      {c.grade2}
                    </span>
                  </div>
                  {c.email2 && (
                    <div className="text-xs text-cyan-400">{c.email2}</div>
                  )}
                  <div className="text-xs text-[#a1a1aa]">{c.company2}</div>
                  {c.title2 && (
                    <div className="text-xs text-[#71717a]">{c.title2}</div>
                  )}
                  <SourceDots sources={c.sources2} />
                </div>
              </div>
            </div>
          );
        })}

        {paged.length === 0 && (
          <div className="text-center py-12 text-[#71717a] text-sm">
            {merges.length > 0 || dismissed.size > 0
              ? "All pairs reviewed! Click \"Show all\" to see resolved pairs."
              : "No duplicate candidates match your filters."}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className="px-3 py-1.5 text-xs rounded-lg bg-[#18181b] border border-[#27272a] text-[#a1a1aa] hover:text-white disabled:opacity-30 transition-colors"
          >
            Previous
          </button>
          <span className="text-xs text-[#a1a1aa]">
            Page {page + 1} of {totalPages}
          </span>
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
