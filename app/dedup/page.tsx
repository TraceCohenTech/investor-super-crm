"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import candidates from "@/data/dedup-candidates.json";

type Candidate = (typeof candidates)[number];

const GRADE_COLORS: { [key: string]: string } = {
  A: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  B: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  C: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  D: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  F: "bg-red-500/10 text-red-400 border-red-500/20",
};

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
        <span key={s} className="px-1.5 py-0.5 text-[9px] rounded bg-[#27272a] text-[#a1a1aa]">
          {s}
        </span>
      ))}
    </div>
  );
}

export default function DedupPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [minSimilarity, setMinSimilarity] = useState(0.85);
  const pageSize = 25;

  const filtered = useMemo(() => {
    let data = candidates as Candidate[];
    data = data.filter((c) => c.similarity >= minSimilarity);
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
  }, [search, minSimilarity]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = filtered.slice(page * pageSize, (page + 1) * pageSize);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          🔄 Dedup Review
        </h1>
        <p className="text-sm text-[#a1a1aa] mt-1">
          {candidates.length.toLocaleString()} potential duplicate pairs found
          via fuzzy matching
        </p>
      </div>

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
          <span className="text-xs text-[#52525b]">Min similarity:</span>
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

      <div className="space-y-3">
        {paged.map((c, i) => (
          <div
            key={i}
            className="bg-[#18181b] border border-[#27272a] rounded-xl p-4"
          >
            <div className="flex items-center gap-3 mb-3">
              <SimilarityBadge value={c.similarity} />
              <span className="text-[10px] text-[#52525b]">
                Potential duplicate
              </span>
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
                    className={`inline-flex px-1.5 py-0.5 text-[9px] font-medium rounded-full border ${
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
                  <div className="text-[10px] text-[#52525b]">{c.title1}</div>
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
                    className={`inline-flex px-1.5 py-0.5 text-[9px] font-medium rounded-full border ${
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
                  <div className="text-[10px] text-[#52525b]">{c.title2}</div>
                )}
                <SourceDots sources={c.sources2} />
              </div>
            </div>
          </div>
        ))}

        {paged.length === 0 && (
          <div className="text-center py-12 text-[#52525b] text-sm">
            No duplicate candidates match your filters.
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
