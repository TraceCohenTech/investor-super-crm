"use client";

import DataTable, { StatusBadge, LinkedInLink } from "@/components/DataTable";
import data from "@/data/dealflow.json";

const columns = [
  { key: "Name", label: "Name" },
  { key: "Company", label: "Company" },
  { key: "Title", label: "Title" },
  { key: "Email", label: "Email" },
  { key: "Last Contact", label: "Last Contact" },
  { key: "Status", label: "Status", render: (v: unknown) => v ? <StatusBadge status={String(v)} /> : "—" },
  { key: "Region", label: "Region" },
  { key: "LinkedIn URL", label: "LI", render: (v: unknown) => v ? <LinkedInLink url={String(v)} /> : "—" },
  { key: "Note", label: "Note" },
];

export default function DealFlowPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">🚀 Deal Flow</h1>
        <p className="text-sm text-[#a1a1aa] mt-1">Active deals and startup founders in pipeline</p>
      </div>
      <DataTable data={data as Record<string, unknown>[]} columns={columns} searchKeys={["Name", "Company", "Email", "Region"]} />
    </div>
  );
}
