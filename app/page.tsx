import StatCard from "@/components/StatCard";
import { TopFirmsChart, RegionChart, FundStageChart, StatusPieChart, DataQualityChart } from "@/components/Charts";
import summary from "@/data/summary.json";
import liSummary from "@/data/linkedin-summary.json";
import extSummary from "@/data/external-summary.json";
import hubSummary from "@/data/hubspot-summary.json";
import searchMeta from "@/data/search-meta.json";
import Link from "next/link";

const GRADE_BAR_COLORS: { [key: string]: string } = {
  A: "bg-emerald-400",
  B: "bg-blue-400",
  C: "bg-amber-400",
  D: "bg-orange-400",
  F: "bg-red-400",
};

export default function DashboardPage() {
  const statusData = [
    { name: "Active", value: summary.active },
    { name: "Warm", value: summary.warm },
    { name: "Follow-Up Overdue", value: summary.followUpOverdue },
    { name: "Other", value: summary.totalContacts - summary.active - summary.warm - summary.followUpOverdue },
  ];

  const dq = searchMeta.dataQuality;
  const stale = searchMeta.staleness;
  const gradeData = Object.entries(dq.gradeDistribution).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">NYVP Investor CRM</h1>
        <p className="text-sm text-[#a1a1aa] mt-1">Updated April 12, 2026</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Unified Contacts" value={searchMeta.total} icon="🔍" sub="Deduped across all sources" />
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
        <StatCard label="HubSpot Contacts" value={hubSummary.total} icon="🟠" sub={`${hubSummary.newToCRM.toLocaleString()} new to CRM`} />
        <StatCard label="Active (5+ emails)" value={summary.active} icon="✅" sub="Regular correspondents" />
        <StatCard label="Warm (3-4 emails)" value={summary.warm} icon="🌡️" sub="Growing relationships" />
        <StatCard label="Follow-Up Overdue" value={summary.followUpOverdue} icon="🔥" sub="Need attention" />
        <StatCard label="Dedup Candidates" value={searchMeta.dedupCandidates} icon="🔄" sub="Potential duplicates" />
      </div>

      {/* Data Health + Stale Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Data Health Card */}
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Data Health</h3>
            <span className="text-2xl font-bold text-emerald-400">{dq.overallScore}%</span>
          </div>
          <p className="text-xs text-[#a1a1aa] mb-4">{dq.overallScore}% of contacts are Grade A or B</p>

          {/* Grade Distribution Bar */}
          <div className="flex rounded-lg overflow-hidden h-6 mb-4">
            {Object.entries(dq.gradeDistribution).map(([grade, count]) => {
              const pct = (count / searchMeta.total) * 100;
              if (pct < 0.5) return null;
              return (
                <div
                  key={grade}
                  className={`${GRADE_BAR_COLORS[grade] || "bg-zinc-400"} flex items-center justify-center text-xs font-bold text-black`}
                  style={{ width: `${pct}%` }}
                  title={`Grade ${grade}: ${count.toLocaleString()} (${pct.toFixed(1)}%)`}
                >
                  {pct > 5 && `${grade}: ${count.toLocaleString()}`}
                </div>
              );
            })}
          </div>

          {/* Top Gaps */}
          <h4 className="text-xs text-[#a1a1aa] uppercase tracking-wider mb-2">Top Data Gaps</h4>
          <div className="space-y-1.5">
            {dq.topGaps.filter(g => g.pct > 5).map((gap) => (
              <div key={gap.field} className="flex items-center gap-2">
                <span className="text-xs text-[#a1a1aa] w-20">{gap.field}</span>
                <div className="flex-1 bg-[#27272a] rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-red-400/60 h-full rounded-full"
                    style={{ width: `${gap.pct}%` }}
                  />
                </div>
                <span className="text-xs text-[#a1a1aa] w-16 text-right">{gap.pct}% empty</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stale Relationships Card */}
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Relationship Health</h3>
          <div className="grid grid-cols-3 gap-4 mb-5">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">{stale.stale.toLocaleString()}</div>
              <div className="text-xs text-[#d4d4d8] mt-1">Going Cold</div>
              <div className="text-xs text-[#a1a1aa]">90+ days</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-400">{stale.atRisk.toLocaleString()}</div>
              <div className="text-xs text-[#d4d4d8] mt-1">At Risk</div>
              <div className="text-xs text-[#a1a1aa]">30-90 days</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-400">{stale.healthy.toLocaleString()}</div>
              <div className="text-xs text-[#d4d4d8] mt-1">Healthy</div>
              <div className="text-xs text-[#a1a1aa]">&lt;30 days</div>
            </div>
          </div>
          <div className="space-y-2">
            <Link
              href="/search?staleness=stale"
              className="block w-full text-center px-4 py-2 text-xs rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors"
            >
              View {stale.stale.toLocaleString()} contacts going cold →
            </Link>
            <Link
              href="/search?staleness=at-risk"
              className="block w-full text-center px-4 py-2 text-xs rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 transition-colors"
            >
              View {stale.atRisk.toLocaleString()} at-risk contacts →
            </Link>
            <Link
              href="/dedup"
              className="block w-full text-center px-4 py-2 text-xs rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-colors"
            >
              Review {searchMeta.dedupCandidates.toLocaleString()} potential duplicates →
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DataQualityChart data={gradeData} />
        <TopFirmsChart data={summary.topFirms} />
        <RegionChart data={summary.regions} />
        <FundStageChart data={summary.fundStages} />
        <StatusPieChart data={statusData} />
      </div>
    </div>
  );
}
