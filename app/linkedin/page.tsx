"use client";

import DataTable, { LinkedInLink } from "@/components/DataTable";
import data from "@/data/linkedin.json";

const columns = [
  { key: "Name", label: "Name" },
  { key: "Company", label: "Company" },
  { key: "Title", label: "Title" },
  { key: "Inferred Email", label: "Inferred Email" },
  { key: "Region", label: "Region" },
  { key: "LinkedIn URL", label: "LinkedIn", render: (v: unknown) => v ? <LinkedInLink url={String(v)} /> : "—" },
  { key: "Note", label: "Note" },
];

export default function LinkedInPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">💼 LinkedIn Network</h1>
        <p className="text-sm text-[#a1a1aa] mt-1">Contacts from LinkedIn — email needed</p>
      </div>
      <DataTable data={data as Record<string, unknown>[]} columns={columns} searchKeys={["Name", "Company", "Title", "Region"]} />
    </div>
  );
}
