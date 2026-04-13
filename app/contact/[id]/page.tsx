"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { ContactRecord, SearchData } from "@/lib/types";
import {
  SOURCE_COLORS,
  SOURCE_LABELS,
  GRADE_COLORS,
  STALENESS_CONFIG,
  STRENGTH_COLORS,
  TAG_COLORS,
} from "@/lib/types";

function Badge({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full border ${className}`}>
      {children}
    </span>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5">
      <h3 className="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider mb-4">{title}</h3>
      {children}
    </div>
  );
}

export default function ContactDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<SearchData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    import("@/data/search-index.json").then((mod) => {
      setData(mod.default as unknown as SearchData);
      setLoading(false);
    });
  }, []);

  const contact = useMemo(() => {
    if (!data) return null;
    return (data.records as ContactRecord[]).find((r) => r.id === id) || null;
  }, [data, id]);

  // Similar contacts: same company
  const similar = useMemo(() => {
    if (!data || !contact) return [];
    return (data.records as ContactRecord[])
      .filter(
        (r) =>
          r.id !== id &&
          r.c &&
          contact.c &&
          r.c.toLowerCase() === contact.c.toLowerCase()
      )
      .slice(0, 10);
  }, [data, contact, id]);

  // Intro paths: contacts who can introduce you to this person
  const introPaths = useMemo(() => {
    if (!data || !contact) return [];
    const paths: { mutual: ContactRecord; via: string; viaType: number }[] = [];

    for (const m of data.records as ContactRecord[]) {
      if (m.id === contact.id) continue;
      if (m.rs !== "Strong" && m.rs !== "Medium") continue;

      // Same company
      if (m.c && contact.c && m.c.toLowerCase() === contact.c.toLowerCase() && m.id !== contact.id) {
        paths.push({ mutual: m, via: `Colleague at ${m.c}`, viaType: 0 });
        continue;
      }

      // Shared WhatsApp group
      const mWg = m.wg || [];
      const cWg = contact.wg || [];
      if (mWg.length && cWg.length) {
        const shared = mWg.filter((g: string) => cWg.includes(g));
        if (shared.length > 0) {
          paths.push({ mutual: m, via: `WhatsApp: ${shared[0]}`, viaType: 1 });
          continue;
        }
      }

      // Shared sources (2+)
      const mSrc = m.src || [];
      const cSrc = contact.src || [];
      if (mSrc.length && cSrc.length) {
        const shared = mSrc.filter((s: string) => cSrc.includes(s));
        if (shared.length >= 2) {
          paths.push({ mutual: m, via: `${shared.length} shared sources`, viaType: 2 });
        }
      }
    }

    return paths
      .sort((a, b) => {
        const strengthOrder = { Strong: 0, Medium: 1 };
        const sa = strengthOrder[a.mutual.rs as keyof typeof strengthOrder] ?? 2;
        const sb = strengthOrder[b.mutual.rs as keyof typeof strengthOrder] ?? 2;
        if (sa !== sb) return sa - sb;
        return a.viaType - b.viaType;
      })
      .slice(0, 15);
  }, [data, contact]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-sm text-[#71717a]">Loading contact...</div>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="space-y-4">
        <Link href="/search" className="text-sm text-[#3b82f6] hover:underline">
          &larr; Back to Search
        </Link>
        <div className="text-center py-20 text-[#71717a]">Contact not found</div>
      </div>
    );
  }

  const tags = contact.tg || [];
  const sectors = contact.sc || [];
  const waGroups = contact.wg || [];
  const sources = contact.src || [];

  return (
    <div className="space-y-6 max-w-4xl">
      <Link href="/search" className="text-sm text-[#3b82f6] hover:underline inline-block">
        &larr; Back to Search
      </Link>

      {/* Profile Header */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">{contact.n}</h1>
            {(contact.t || contact.c) && (
              <p className="text-sm text-[#a1a1aa] mt-1">
                {contact.t}
                {contact.t && contact.c && " at "}
                {contact.c && <span className="text-white">{contact.c}</span>}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {contact.q && (
              <Badge className={GRADE_COLORS[contact.q] || ""}>Grade {contact.q}</Badge>
            )}
            {contact.sl && STALENESS_CONFIG[contact.sl] && (
              <Badge className={STALENESS_CONFIG[contact.sl].color}>
                {STALENESS_CONFIG[contact.sl].label}
              </Badge>
            )}
            {contact.rs && (
              <Badge className={STRENGTH_COLORS[contact.rs] || ""}>{contact.rs}</Badge>
            )}
          </div>
        </div>

        {/* Contact info row */}
        <div className="flex flex-wrap gap-4 mt-4 text-xs">
          {contact.e && (
            <a href={`mailto:${contact.e}`} className="text-cyan-400 hover:text-cyan-300 transition-colors">
              {contact.e}
            </a>
          )}
          {contact.li && (
            <a href={contact.li} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1">
              LinkedIn
              {contact.lv === "verified" && <span className="text-emerald-400">✓</span>}
              {contact.lv === "unverified" && <span className="text-[#71717a]">~</span>}
            </a>
          )}
          {contact.il && <span className="text-[#a1a1aa]">🇮🇱 Israel</span>}
        </div>
      </div>

      {/* Engagement Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-3 text-center">
          <div className="text-lg font-bold text-white">{contact.ec || 0}</div>
          <div className="text-xs text-[#a1a1aa]">Emails</div>
        </div>
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-3 text-center">
          <div className="text-lg font-bold text-white">{contact.st || "—"}</div>
          <div className="text-xs text-[#a1a1aa]">Status</div>
        </div>
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-3 text-center">
          <div className="text-lg font-bold text-white">{contact.lc || "—"}</div>
          <div className="text-xs text-[#a1a1aa]">Last Contact</div>
        </div>
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-3 text-center">
          <div className="text-lg font-bold text-white">{contact.fu || "—"}</div>
          <div className="text-xs text-[#a1a1aa]">Follow-Up</div>
        </div>
      </div>

      {/* Classification */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Section title="Classification">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[#71717a]">Category</span>
              <span className="text-white">{contact.it || "—"}</span>
            </div>
            {contact.rt && (
              <div className="flex justify-between">
                <span className="text-[#71717a]">Role</span>
                <span className="text-white">{contact.rt}</span>
              </div>
            )}
            {contact.fs && (
              <div className="flex justify-between">
                <span className="text-[#71717a]">Stage</span>
                <span className="text-white">{contact.fs}</span>
              </div>
            )}
            {contact.cs && (
              <div className="flex justify-between">
                <span className="text-[#71717a]">Check Size</span>
                <span className="text-white">{contact.cs}</span>
              </div>
            )}
            {contact.rg && (
              <div className="flex justify-between">
                <span className="text-[#71717a]">Region</span>
                <span className="text-white">{contact.rg}</span>
              </div>
            )}
            {contact.pr && (
              <div className="flex justify-between">
                <span className="text-[#71717a]">Priority</span>
                <span className="text-white">{contact.pr}</span>
              </div>
            )}
            {contact.crm && (
              <div className="flex justify-between">
                <span className="text-[#71717a]">CRM</span>
                <span className="text-white">{contact.crm}</span>
              </div>
            )}
          </div>
        </Section>

        <Section title="Sectors">
          <div className="flex flex-wrap gap-2">
            {sectors.map((s) => (
              <span key={s} className="px-2.5 py-1 text-xs rounded-lg bg-[#27272a] text-[#a1a1aa]">
                {s}
              </span>
            ))}
          </div>
        </Section>
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <Section title="Tags">
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className={`px-2 py-0.5 text-xs rounded-full ${TAG_COLORS[tag] || "bg-zinc-500/10 text-zinc-400"}`}
              >
                {tag}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* Sources */}
      <Section title={`Sources (${sources.length})`}>
        <div className="flex flex-wrap gap-2">
          {sources.map((s) => (
            <span
              key={s}
              className="px-2.5 py-1 text-xs rounded-lg border border-[#27272a]"
              style={{ color: SOURCE_COLORS[s] || "#a1a1aa" }}
            >
              {SOURCE_LABELS[s] || s}
            </span>
          ))}
        </div>
        {contact.so && (
          <p className="text-xs text-[#71717a] mt-3 break-all">{contact.so}</p>
        )}
      </Section>

      {/* WhatsApp Groups */}
      {waGroups.length > 0 && (
        <Section title="WhatsApp Groups">
          <div className="flex flex-wrap gap-2">
            {waGroups.map((g) => (
              <span key={g} className="px-2.5 py-1 text-xs rounded-lg bg-green-500/10 text-green-400 border border-green-500/20">
                {g}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* Notes */}
      {contact.nt && (
        <Section title="Notes">
          <p className="text-sm text-[#a1a1aa]">{contact.nt}</p>
        </Section>
      )}

      {/* Intro Paths */}
      <div id="intros">
        <Section title={`Intro Paths (${introPaths.length})`}>
          {introPaths.length === 0 ? (
            <p className="text-xs text-[#71717a]">No warm intro paths found for this contact.</p>
          ) : (
            <div className="space-y-2">
              {introPaths.map((path, i) => (
                <div key={i} className="flex items-center gap-3 py-1.5">
                  <Badge className={STRENGTH_COLORS[path.mutual.rs] || ""}>
                    {path.mutual.rs}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/contact/${path.mutual.id}`}
                      className="text-sm text-white hover:text-[#3b82f6] transition-colors"
                    >
                      {path.mutual.n}
                    </Link>
                    <span className="text-xs text-[#71717a] ml-2">{path.mutual.c}</span>
                  </div>
                  <span className="text-xs text-[#71717a] shrink-0">{path.via}</span>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>

      {/* Similar Contacts (same company) */}
      {similar.length > 0 && (
        <Section title={`Other contacts at ${contact.c} (${similar.length})`}>
          <div className="space-y-1.5">
            {similar.map((s) => (
              <div key={s.id} className="flex items-center gap-3 py-1">
                <Link
                  href={`/contact/${s.id}`}
                  className="text-sm text-white hover:text-[#3b82f6] transition-colors"
                >
                  {s.n}
                </Link>
                <span className="text-xs text-[#71717a]">{s.t}</span>
                {s.rs && (
                  <Badge className={STRENGTH_COLORS[s.rs] || ""}>{s.rs}</Badge>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
