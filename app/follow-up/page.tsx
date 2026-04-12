"use client";

import DataTable, { StatusBadge, PriorityBadge, StageBadge, LinkedInLink } from "@/components/DataTable";
import data from "@/data/follow-up.json";

const columns = [
  { key: "Name", label: "Name" },
  { key: "Company", label: "Company" },
  { key: "Email", label: "Email" },
  { key: "Last Contact", label: "Last Contact" },
  { key: "Days Since", label: "Days", render: (v: unknown) => v != null ? <span className="text-amber-400 font-mono text-xs">{String(v)}d</span> : "—" },
  { key: "Priority", label: "Priority", render: (v: unknown) => v ? <PriorityBadge priority={String(v)} /> : "—" },
  { key: "Status", label: "Status", render: (v: unknown) => v ? <StatusBadge status={String(v)} /> : "—" },
  { key: "Region", label: "Region" },
  { key: "Fund Stage", label: "Stage", render: (v: unknown) => v && v !== "Unknown" ? <StageBadge stage={String(v)} /> : "—" },
  { key: "Sector", label: "Sector" },
  { key: "LinkedIn URL", label: "LI", render: (v: unknown) => v ? <LinkedInLink url={String(v)} /> : "—" },
];

export default function FollowUpPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">🔥 Follow-Up Now</h1>
        <p className="text-sm text-[#a1a1aa] mt-1">Contacts that need follow-up, sorted by priority</p>
      </div>
      <DataTable data={data as Record<string, unknown>[]} columns={columns} />
    </div>
  );
}
