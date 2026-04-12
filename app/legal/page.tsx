"use client";

import DataTable from "@/components/DataTable";
import data from "@/data/legal.json";

const columns = [
  { key: "Name", label: "Name" },
  { key: "Company", label: "Company" },
  { key: "Title", label: "Title" },
  { key: "Email", label: "Email" },
  { key: "Last Contact", label: "Last Contact" },
  { key: "Note", label: "Note" },
];

export default function LegalPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">⚖️ Legal & Services</h1>
        <p className="text-sm text-[#a1a1aa] mt-1">Law firms, accountants, and service providers</p>
      </div>
      <DataTable data={data as Record<string, unknown>[]} columns={columns} />
    </div>
  );
}
