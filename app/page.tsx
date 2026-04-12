import StatCard from "@/components/StatCard";
import { TopFirmsChart, StatusPieChart, CategoryBreakdownChart, MostActiveChart } from "@/components/Charts";
import summary from "@/data/summary.json";

export default function DashboardPage() {
  const statusData = [
    { name: "Active", value: summary.active },
    { name: "Warm", value: summary.warm },
    { name: "New", value: summary.totalContacts - summary.active - summary.warm - summary.followUpDueToday },
    { name: "Follow-Up Due", value: summary.followUpDueToday },
  ];

  const categoryData = [
    { name: "Investors & Funds", value: summary.investorsAndFunds },
    { name: "Angels & Individuals", value: summary.angelsAndIndividuals },
    { name: "LinkedIn Only", value: summary.linkedInOnly },
    { name: "NYC-Based", value: summary.nycBased },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">NYVP Investor CRM</h1>
        <p className="text-sm text-[#a1a1aa] mt-1">Updated April 11, 2026</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Contacts" value={summary.totalContacts} icon="📊" />
        <StatCard label="Investors & Funds" value={summary.investorsAndFunds} icon="🏦" />
        <StatCard label="Angels" value={summary.angelsAndIndividuals} icon="👼" />
        <StatCard label="NYC-Based" value={summary.nycBased} icon="🗽" />
        <StatCard label="LinkedIn Only" value={summary.linkedInOnly} icon="💼" />
        <StatCard label="Active (5+ emails)" value={summary.active} icon="✅" sub="Regular correspondents" />
        <StatCard label="Warm (3-4 emails)" value={summary.warm} icon="🌡️" sub="Growing relationships" />
        <StatCard label="Follow-Up Due" value={summary.followUpDueToday} icon="📬" sub="Need attention today" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopFirmsChart data={summary.topFirms} />
        <MostActiveChart data={summary.mostActiveContacts} />
        <StatusPieChart data={statusData} />
        <CategoryBreakdownChart data={categoryData} />
      </div>
    </div>
  );
}
