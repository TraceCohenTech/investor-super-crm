"use client";

import DataTable, { StatusBadge } from "@/components/DataTable";
import data from "@/data/re-engage.json";

const columns = [
  { key: "Name", label: "Name" },
  { key: "Company", label: "Company" },
  { key: "Title", label: "Title" },
  { key: "Email", label: "Email" },
  { key: "Last Contact", label: "Last Contact" },
  { key: "Days Since", label: "Days Silent", render: (v: unknown) => v != null ? <span className="text-red-400 font-mono text-xs">{String(v)}d</span> : "—" },
  { key: "Status", label: "Status", render: (v: unknown) => v ? <StatusBadge status={String(v)} /> : "—" },
];

export default function ReEngagePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">🎯 Re-Engage</h1>
        <p className="text-sm text-[#a1a1aa] mt-1">Contacts gone cold — haven&apos;t heard from in 90+ days</p>
      </div>
      <DataTable data={data as Record<string, unknown>[]} columns={columns} />
    </div>
  );
}
