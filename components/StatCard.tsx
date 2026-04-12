interface StatCardProps {
  label: string;
  value: string | number;
  icon: string;
  sub?: string;
}

export default function StatCard({ label, value, icon, sub }: StatCardProps) {
  return (
    <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5 hover:border-[#3f3f46] transition-colors">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium uppercase tracking-wider text-[#a1a1aa]">{label}</span>
        <span className="text-xl">{icon}</span>
      </div>
      <div className="text-3xl font-bold tracking-tight text-white">
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
      {sub && <p className="text-xs text-[#a1a1aa] mt-1">{sub}</p>}
    </div>
  );
}
