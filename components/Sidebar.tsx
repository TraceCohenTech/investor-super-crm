"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/", label: "Dashboard", icon: "📊" },
  { href: "/search", label: "Smart Search", icon: "🔍" },
  { href: "/follow-up", label: "Follow-Up Now", icon: "🔥" },
  { href: "/investors", label: "Investors & Funds", icon: "🏦" },
  { href: "/angels", label: "Angels & Individuals", icon: "👼" },
  { href: "/linkedin", label: "LinkedIn Network", icon: "💼" },
  { href: "/dealflow", label: "Deal Flow", icon: "🚀" },
  { href: "/legal", label: "Legal & Services", icon: "⚖️" },
  { href: "/nyc", label: "NYC Investors", icon: "🗽" },
  { href: "/south-florida", label: "South Florida", icon: "🌴" },
  { href: "/connections", label: "LinkedIn Connections", icon: "🔗" },
  { href: "/external", label: "External Lists", icon: "📑" },
  { href: "/hubspot", label: "HubSpot Contacts", icon: "🟠" },
  { href: "/whatsapp", label: "WhatsApp Network", icon: "💬" },
  { href: "/re-engage", label: "Re-Engage", icon: "🎯" },
  { href: "/needs-review", label: "Needs Review", icon: "📋" },
  { href: "/dedup", label: "Dedup Review", icon: "🔄" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-[#18181b] border-r border-[#27272a] flex flex-col z-50">
      <div className="p-6 border-b border-[#27272a]">
        <h1 className="text-lg font-bold tracking-tight text-white">NYVP</h1>
        <p className="text-xs text-[#a1a1aa] mt-0.5">Investor CRM</p>
      </div>

      <nav className="flex-1 py-4 overflow-y-auto">
        {nav.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-6 py-2.5 text-sm transition-colors ${
                active
                  ? "bg-[#3b82f6]/10 text-[#3b82f6] border-r-2 border-[#3b82f6]"
                  : "text-[#a1a1aa] hover:text-white hover:bg-[#27272a]/50"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[#27272a] text-center space-y-1">
        <div className="flex items-center justify-center gap-3 text-xs text-[#a1a1aa]">
          <a href="https://x.com/Trace_Cohen" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
            Twitter
          </a>
          <span className="text-[#27272a]">|</span>
          <a href="mailto:t@nyvp.com" className="hover:text-white transition-colors">
            t@nyvp.com
          </a>
        </div>
      </div>
    </aside>
  );
}
