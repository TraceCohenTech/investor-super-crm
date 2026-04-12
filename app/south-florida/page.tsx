"use client";

import DataTable, { StatusBadge, StageBadge, LinkedInLink } from "@/components/DataTable";
import data from "@/data/south-florida.json";

const columns = [
  { key: "Name", label: "Name" },
  { key: "Company", label: "Company" },
  { key: "Title", label: "Title" },
  { key: "Email", label: "Email" },
  { key: "City", label: "City" },
  { key: "Email Count", label: "Emails", render: (v: unknown) => v != null ? <span className="font-mono text-xs text-emerald-400">{String(v)}</span> : "—" },
  { key: "Last Contact", label: "Last Contact" },
  { key: "Status", label: "Status", render: (v: unknown) => v ? <StatusBadge status={String(v)} /> : "—" },
  { key: "Category", label: "Category" },
  { key: "Fund Stage", label: "Stage", render: (v: unknown) => v && v !== "Unknown" ? <StageBadge stage={String(v)} /> : "—" },
  { key: "Sector", label: "Sector" },
  { key: "LinkedIn URL", label: "LI", render: (v: unknown) => v ? <LinkedInLink url={String(v)} /> : "—" },
];

export default function SouthFloridaPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">🌴 South Florida</h1>
        <p className="text-sm text-[#a1a1aa] mt-1">South Florida-based investors and contacts</p>
      </div>
      <DataTable data={data as Record<string, unknown>[]} columns={columns} searchKeys={["Name", "Company", "Email", "City", "Category"]} />
    </div>
  );
}
