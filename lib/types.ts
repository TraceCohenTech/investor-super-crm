export interface ContactRecord {
  id: string;
  n: string;   // name
  e: string;   // email
  c: string;   // company
  t: string;   // title
  li: string;  // linkedin URL
  lv: string;  // linkedin verified: "verified" | "unverified" | ""
  src: string[];  // source badges
  so: string;  // detailed source string
  st: string;  // status
  rg: string;  // region/geo
  fs: string;  // fund stage
  sc: string[];  // sectors
  pr: string;  // priority
  crm: string; // "In CRM" | "New"
  it: string;  // investor type / category
  rt: string;  // role type
  cs: string;  // check size
  rs: string;  // relationship strength
  wg: string[];  // whatsapp groups
  tg: string[];  // tags
  q: string;   // quality grade A-F
  sl: string;  // staleness
  ec: number;  // email count
  lc: string;  // last contact date
  fu: string;  // follow-up date
  nt: string;  // notes
  il: boolean; // israel flag
}

export interface SearchData {
  records: ContactRecord[];
  facets: { [key: string]: { [key: string]: number } };
}

export const SOURCE_COLORS: { [key: string]: string } = {
  "investors": "#3b82f6",
  "angels": "#22c55e",
  "hubspot": "#f97316",
  "linkedin": "#06b6d4",
  "linkedin-verified": "#0ea5e9",
  "whatsapp": "#22c55e",
  "nyc": "#a855f7",
  "south-florida": "#f59e0b",
  "israel": "#60a5fa",
  "external": "#ec4899",
  "dealflow": "#ef4444",
  "follow-up": "#f59e0b",
  "re-engage": "#f43f5e",
  "legal": "#64748b",
  "needs-review": "#71717a",
  "lp-pipeline": "#8b5cf6",
  "gmail": "#ea4335",
  "calendar": "#4285f4",
};

export const SOURCE_LABELS: { [key: string]: string } = {
  "investors": "Investors",
  "angels": "Angels",
  "hubspot": "HubSpot",
  "linkedin": "LinkedIn",
  "linkedin-verified": "LI Verified",
  "whatsapp": "WhatsApp",
  "nyc": "NYC",
  "south-florida": "S. Florida",
  "israel": "Israel",
  "external": "External",
  "dealflow": "Deal Flow",
  "follow-up": "Follow-Up",
  "re-engage": "Re-Engage",
  "legal": "Legal",
  "needs-review": "Review",
  "lp-pipeline": "LP Pipeline",
  "gmail": "Gmail",
  "calendar": "Calendar",
};

export const GRADE_COLORS: { [key: string]: string } = {
  "A": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "B": "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "C": "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "D": "bg-orange-500/10 text-orange-400 border-orange-500/20",
  "F": "bg-red-500/10 text-red-400 border-red-500/20",
};

export const STALENESS_CONFIG: { [key: string]: { color: string; label: string } } = {
  "stale": { color: "bg-red-500/10 text-red-400 border-red-500/20", label: "Going Cold" },
  "at-risk": { color: "bg-amber-500/10 text-amber-400 border-amber-500/20", label: "At Risk" },
  "healthy": { color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", label: "Healthy" },
};

export const STRENGTH_COLORS: { [key: string]: string } = {
  "Strong": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "Medium": "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "Weak": "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "None": "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
};

export const TAG_COLORS: { [key: string]: string } = {
  "vc": "bg-blue-500/10 text-blue-400",
  "angel": "bg-emerald-500/10 text-emerald-400",
  "founder": "bg-cyan-500/10 text-cyan-400",
  "senior": "bg-indigo-500/10 text-indigo-400",
  "junior": "bg-zinc-500/10 text-zinc-400",
  "active": "bg-emerald-500/10 text-emerald-400",
  "warm": "bg-amber-500/10 text-amber-400",
  "contacted": "bg-blue-500/10 text-blue-400",
  "not-emailed": "bg-zinc-500/10 text-zinc-400",
  "verified-linkedin": "bg-sky-500/10 text-sky-400",
  "has-linkedin": "bg-sky-500/10 text-sky-400",
  "in-hubspot": "bg-orange-500/10 text-orange-400",
  "whatsapp": "bg-green-500/10 text-green-400",
  "nyc": "bg-violet-500/10 text-violet-400",
  "bay-area": "bg-teal-500/10 text-teal-400",
  "israel": "bg-blue-500/10 text-blue-400",
  "lp-pipeline": "bg-purple-500/10 text-purple-400",
  "emerging-manager": "bg-rose-500/10 text-rose-400",
  "family-office": "bg-amber-500/10 text-amber-400",
  "ai": "bg-cyan-500/10 text-cyan-400",
  "deep-tech": "bg-indigo-500/10 text-indigo-400",
  "climate": "bg-green-500/10 text-green-400",
  "defense": "bg-red-500/10 text-red-400",
  "fintech": "bg-emerald-500/10 text-emerald-400",
  "crypto": "bg-violet-500/10 text-violet-400",
  "seed": "bg-teal-500/10 text-teal-400",
  "pre-seed": "bg-sky-500/10 text-sky-400",
  "growth": "bg-blue-500/10 text-blue-400",
  "community-led": "bg-pink-500/10 text-pink-400",
  "university": "bg-indigo-500/10 text-indigo-400",
  "corporate": "bg-zinc-500/10 text-zinc-400",
};
