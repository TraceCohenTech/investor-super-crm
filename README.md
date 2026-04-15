# Investor CRM Template

A full-featured investor relationship management dashboard built with Next.js 14, TypeScript, and Tailwind CSS. Designed for VC funds, angel investors, and anyone managing investor relationships.

## Features

- **Dashboard** — Overview stats, charts, data quality scores, and relationship health
- **Smart Search** — Faceted search with 11 filter dimensions, URL-driven filters, saved searches
- **Network Graph** — Interactive force-directed graph showing connections by company, WhatsApp group, source, or tags
- **Dedup & Merge Wizard** — Fuzzy duplicate detection with side-by-side merge UI
- **Contact Profiles** — Detail pages with quality grades, staleness alerts, intro paths
- **Multi-Source Ingestion** — Email, LinkedIn, HubSpot, WhatsApp, external lists (Crunchbase, PitchBook, etc.)
- **Regional Views** — NYC Metro, South Florida, and other region-specific dashboards
- **Quality Scoring** — A-F grades based on data completeness
- **Smart Auto-Tags** — 12+ auto-generated tags (reachable, multi-source, high-engagement, etc.)

## Quick Start

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/investor-crm.git
cd investor-crm

# Install dependencies
npm install

# Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the dashboard with sample data.

## How to Customize

### 1. Replace the sample data

All data lives in `/data/*.json`. The included files contain fictional contacts to demonstrate the CRM structure.

**Option A — Manual JSON editing:**
Replace the JSON files in `/data/` with your own data, following the same schema.

**Option B — Use the enrichment script:**
1. Create an Excel file at `data/Investor_CRM.xlsx` with your contacts
2. Run the enrichment pipeline:
   ```bash
   python3 scripts/enrich-and-index.py
   ```
3. This generates `search-index.json`, `search-meta.json`, and `dedup-candidates.json`

### 2. Update branding

- **Sidebar title**: `components/Sidebar.tsx` — change "Your Fund" to your name
- **Page title**: `app/layout.tsx` — update the metadata
- **Footer**: `components/Footer.tsx` — add your links

### 3. Customize categories

- **Investor types, regions, fund stages**: `scripts/enrich-and-index.py`
- **HubSpot owner colors**: `app/hubspot/page.tsx`
- **Chart colors**: `components/Charts.tsx`
- **Type definitions**: `lib/types.ts`

## Data Schema

Each contact in `search-index.json` uses compact field names for performance:

| Field | Description | Example |
|-------|-------------|---------|
| `n` | Name | "Jane Smith" |
| `e` | Email | "jane@fund.com" |
| `c` | Company | "Sequoia Capital" |
| `t` | Title | "Partner" |
| `li` | LinkedIn URL | "https://linkedin.com/in/jane" |
| `src` | Sources | ["email", "linkedin"] |
| `st` | Status | "Active" / "Warm" / "Contacted" / "New" |
| `rg` | Region | "Bay Area" |
| `fs` | Fund Stage | "Seed" / "Series A" |
| `q` | Quality Grade | "A" / "B" / "C" / "D" / "F" |
| `sl` | Staleness | "healthy" / "at-risk" / "stale" |
| `rs` | Relationship | "Strong" / "Medium" / "Weak" / "None" |
| `tg` | Tags | ["reachable", "multi-source"] |
| `ec` | Email Count | 15 |
| `lc` | Last Contact | "2026-03-15" |

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Graph**: react-force-graph-2d
- **Data**: Static JSON (no database required)
- **Enrichment**: Python 3 (openpyxl)

## Deploy

```bash
# Deploy to Vercel
npx vercel --prod

# Or build for any host
npm run build
npm start
```

## Project Structure

```
app/
  page.tsx              # Dashboard
  search/page.tsx       # Smart Search with faceted filters
  network/page.tsx      # Network Graph
  dedup/page.tsx        # Dedup & Merge Wizard
  contact/[id]/page.tsx # Contact detail pages
  investors/            # Investors & Funds view
  angels/               # Angels & Individuals
  follow-up/            # Follow-up queue
  re-engage/            # Re-engagement list
  ...
components/
  Sidebar.tsx           # Navigation
  Footer.tsx            # Footer
  StatCard.tsx          # Stat card component
  Charts.tsx            # Recharts components
data/
  search-index.json     # Main contact index
  search-meta.json      # Facet counts & quality stats
  summary.json          # Dashboard overview stats
  ...
scripts/
  enrich-and-index.py   # Data enrichment pipeline
lib/
  types.ts              # TypeScript interfaces
```
