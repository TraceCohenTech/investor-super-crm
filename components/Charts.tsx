"use client";

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

const COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#06b6d4", "#ef4444", "#8b5cf6", "#ec4899", "#f97316"];

const tooltipStyle = {
  contentStyle: { background: "#18181b", border: "1px solid #27272a", borderRadius: 8, fontSize: 13 },
  labelStyle: { color: "#a1a1aa" },
  itemStyle: { color: "#e4e4e7" },
};

export function TopFirmsChart({ data }: { data: { name: string; count: number }[] }) {
  return (
    <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5">
      <h3 className="text-sm font-semibold text-white mb-4">Top Firms by Contact Count</h3>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20 }}>
          <XAxis type="number" tick={{ fill: "#a1a1aa", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" width={160} tick={{ fill: "#e4e4e7", fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip {...tooltipStyle} />
          <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function StatusPieChart({ data }: { data: { name: string; value: number }[] }) {
  return (
    <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5">
      <h3 className="text-sm font-semibold text-white mb-4">Contact Status Distribution</h3>
      <ResponsiveContainer width="100%" height={320}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={110} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip {...tooltipStyle} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 12, color: "#a1a1aa" }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CategoryBreakdownChart({ data }: { data: { name: string; value: number }[] }) {
  return (
    <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5">
      <h3 className="text-sm font-semibold text-white mb-4">Contact Categories</h3>
      <ResponsiveContainer width="100%" height={320}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={110} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip {...tooltipStyle} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 12, color: "#a1a1aa" }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function RegionChart({ data }: { data: { name: string; count: number }[] }) {
  const filtered = data.filter(d => d.name !== "Unknown");
  return (
    <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5">
      <h3 className="text-sm font-semibold text-white mb-4">Contacts by Region</h3>
      <ResponsiveContainer width="100%" height={360}>
        <BarChart data={filtered} layout="vertical" margin={{ left: 10, right: 20 }}>
          <XAxis type="number" tick={{ fill: "#a1a1aa", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" width={120} tick={{ fill: "#e4e4e7", fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip {...tooltipStyle} />
          <Bar dataKey="count" fill="#06b6d4" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function FundStageChart({ data }: { data: { name: string; count: number }[] }) {
  return (
    <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5">
      <h3 className="text-sm font-semibold text-white mb-4">Fund Stages (Investors)</h3>
      <ResponsiveContainer width="100%" height={360}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={120} paddingAngle={3} dataKey="count" nameKey="name" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip {...tooltipStyle} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 12, color: "#a1a1aa" }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MostActiveChart({ data }: { data: { name: string; company: string; count: number }[] }) {
  return (
    <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5">
      <h3 className="text-sm font-semibold text-white mb-4">Most Active Contacts</h3>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data.slice(0, 10)} layout="vertical" margin={{ left: 10, right: 20 }}>
          <XAxis type="number" tick={{ fill: "#a1a1aa", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" width={160} tick={{ fill: "#e4e4e7", fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip {...tooltipStyle} formatter={(value) => [`${value} emails`, "Count"]} />
          <Bar dataKey="count" fill="#22c55e" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
