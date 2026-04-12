"use client";

import DataTable, { StatusBadge, PriorityBadge, StageBadge, LinkedInLink } from "@/components/DataTable";
import data from "@/data/angels.json";

const columns = [
  { key: "Name", label: "Name" },
  { key: "Company", label: "Company" },
  { key: "Title", label: "Title" },
  { key: "Email", label: "Email" },
  { key: "Emails", label: "Emails", render: (v: unknown) => v != null ? <span className="font-mono text-xs text-emerald-400">{String(v)}</span> : "—" },
  { key: "Last Contact", label: "Last Contact" },
  { key: "Status", label: "Status", render: (v: unknown) => v ? <StatusBadge status={String(v)} /> : "—" },
  { key: "Region", label: "Region" },
  { key: "City", label: "City" },
  { key: "Fund Stage", label: "Stage", render: (v: unknown) => v && v !== "Unknown" ? <StageBadge stage={String(v)} /> : "—" },
  { key: "Sector", label: "Sector" },
  { key: "Priority", label: "Priority", render: (v: unknown) => v ? <PriorityBadge priority={String(v)} /> : "—" },
  { key: "LinkedIn URL", label: "LI", render: (v: unknown) => v ? <LinkedInLink url={String(v)} /> : "—" },
];

export default function AngelsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">👼 Angels & Individuals</h1>
        <p className="text-sm text-[#a1a1aa] mt-1">Individual angel investors and personal contacts</p>
      </div>
      <DataTable data={data as Record<string, unknown>[]} columns={columns} searchKeys={["Name", "Company", "Email", "Region", "Sector"]} />
    </div>
  );
}
