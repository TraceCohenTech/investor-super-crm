import StatCard from "@/components/StatCard";
import { TopFirmsChart, RegionChart, FundStageChart, StatusPieChart } from "@/components/Charts";
import summary from "@/data/summary.json";
import liSummary from "@/data/linkedin-summary.json";
import extSummary from "@/data/external-summary.json";

export default function DashboardPage() {
  const statusData = [
    { name: "Active", value: summary.active },
    { name: "Warm", value: summary.warm },
    { name: "Follow-Up Overdue", value: summary.followUpOverdue },
    { name: "Other", value: summary.totalContacts - summary.active - summary.warm - summary.followUpOverdue },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">NYVP Investor CRM</h1>
        <p className="text-sm text-[#a1a1aa] mt-1">Updated April 12, 2026</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Contacts" value={summary.totalContacts} icon="📊" />
        <StatCard label="Investors & Funds" value={summary.investorsAndFunds} icon="🏦" />
        <StatCard label="Angels" value={summary.angelsAndIndividuals} icon="👼" />
        <StatCard label="LinkedIn Only" value={summary.linkedInOnly} icon="💼" />
        <StatCard label="NYC Metro" value={summary.nycMetro} icon="🗽" />
        <StatCard label="Bay Area" value={summary.bayArea} icon="🌉" />
        <StatCard label="South Florida" value={summary.southFlorida} icon="🌴" />
        <StatCard label="Boston" value={summary.boston} icon="🎓" />
        <StatCard label="LinkedIn Connections" value={liSummary.total} icon="🔗" sub={`${liSummary.newToCRM.toLocaleString()} new to CRM`} />
        <StatCard label="External Lists" value={extSummary.total} icon="📑" sub={`${extSummary.newToCRM} new funds & offices`} />
        <StatCard label="Active (5+ emails)" value={summary.active} icon="✅" sub="Regular correspondents" />
        <StatCard label="Warm (3-4 emails)" value={summary.warm} icon="🌡️" sub="Growing relationships" />
        <StatCard label="Follow-Up Overdue" value={summary.followUpOverdue} icon="🔥" sub="Need attention" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopFirmsChart data={summary.topFirms} />
        <RegionChart data={summary.regions} />
        <FundStageChart data={summary.fundStages} />
        <StatusPieChart data={statusData} />
      </div>
    </div>
  );
}
