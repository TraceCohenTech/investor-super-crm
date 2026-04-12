"use client";

import DataTable, { StatusBadge, PriorityBadge } from "@/components/DataTable";
import data from "@/data/nyc-investors.json";

const columns = [
  { key: "Name", label: "Name" },
  { key: "Company", label: "Company" },
  { key: "Title", label: "Title" },
  { key: "Email", label: "Email" },
  { key: "Email Count", label: "Emails", render: (v: unknown) => v != null ? <span className="font-mono text-xs text-emerald-400">{String(v)}</span> : "—" },
  { key: "Last Contact", label: "Last Contact" },
  { key: "Status", label: "Status", render: (v: unknown) => v ? <StatusBadge status={String(v)} /> : "—" },
  { key: "Priority", label: "Priority", render: (v: unknown) => v ? <PriorityBadge priority={String(v)} /> : "—" },
];

export default function NYCPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">🗽 NYC Investors</h1>
        <p className="text-sm text-[#a1a1aa] mt-1">New York City-based investors and funds</p>
      </div>
      <DataTable data={data as Record<string, unknown>[]} columns={columns} />
    </div>
  );
}
