"use client";

import DataTable from "@/components/DataTable";
import data from "@/data/needs-review.json";

const columns = [
  { key: "Name", label: "Name" },
  { key: "Email", label: "Email" },
  { key: "Company", label: "Company" },
  { key: "Category", label: "Category" },
  { key: "Email Count", label: "Emails", render: (v: unknown) => v != null ? <span className="font-mono text-xs text-cyan-400">{String(v)}</span> : "—" },
  { key: "Note", label: "Note" },
];

export default function NeedsReviewPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">📋 Needs Review</h1>
        <p className="text-sm text-[#a1a1aa] mt-1">Contacts that need classification or cleanup</p>
      </div>
      <DataTable data={data as Record<string, unknown>[]} columns={columns} searchKeys={["Name", "Email", "Company", "Category"]} />
    </div>
  );
}
