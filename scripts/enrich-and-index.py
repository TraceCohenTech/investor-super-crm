#!/usr/bin/env python3
"""
NYVP Investor CRM — Enrichment & Unified Search Index Builder

Reads all 14 JSON data sources, infers missing tags, deduplicates
across sources, and writes a unified search index for the Smart Search page.
"""

import json
import os
import re
import hashlib
from collections import Counter, defaultdict

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")

# ─── Known firm HQ lookup (top 200 firms) ───
FIRM_HQ = {
    "a16z": "Bay Area", "andreessen horowitz": "Bay Area", "sequoia": "Bay Area",
    "benchmark": "Bay Area", "greylock": "Bay Area", "accel": "Bay Area",
    "kleiner perkins": "Bay Area", "lightspeed": "Bay Area", "index ventures": "Bay Area",
    "bessemer": "Bay Area", "general catalyst": "Bay Area", "khosla": "Bay Area",
    "nea": "Bay Area", "battery ventures": "Boston", "ivp": "Bay Area",
    "gv": "Bay Area", "insight partners": "NYC Metro", "tiger global": "NYC Metro",
    "coatue": "NYC Metro", "thrive capital": "NYC Metro", "union square ventures": "NYC Metro",
    "lerer hippeau": "NYC Metro", "firstmark": "NYC Metro", "rre ventures": "NYC Metro",
    "greycroft": "NYC Metro", "box group": "NYC Metro", "boxgroup": "NYC Metro",
    "primary venture": "NYC Metro", "boldstart": "NYC Metro", "nyca partners": "NYC Metro",
    "bain capital": "Boston", "general atlantic": "NYC Metro", "spark capital": "Boston",
    "floodgate": "Bay Area", "founder collective": "Boston", "flybridge": "Boston",
    "underscore vc": "Boston", "pillar vc": "Boston", "modern ventures": "Chicago",
    "hyde park": "Chicago", "m25": "Chicago", "origin ventures": "Chicago",
    "pritzker": "Chicago", "valor equity": "Chicago",
    "softbank": "Bay Area", "y combinator": "Bay Area", "500 global": "Bay Area",
    "techstars": "Colorado", "first round": "Bay Area", "true ventures": "Bay Area",
    "upfront ventures": "LA/SoCal", "bonfire ventures": "LA/SoCal",
    "crosscut ventures": "LA/SoCal", "amplify.la": "LA/SoCal", "mucker capital": "LA/SoCal",
    "revolution": "DC/DMV", "steve case": "DC/DMV", "aol": "DC/DMV",
    "initialized capital": "Bay Area", "craft ventures": "Bay Area",
    "maverick ventures": "Bay Area", "redpoint": "Bay Area",
    "social capital": "Bay Area", "ribbit capital": "Bay Area",
    "paradigm": "Bay Area", "haun ventures": "Bay Area",
    "ggv capital": "Bay Area", "canaan partners": "Bay Area",
    "felicis": "Bay Area", "cowboy ventures": "Bay Area",
    "slow ventures": "Bay Area", "founders fund": "Bay Area",
    "8vc": "Bay Area", "tribe capital": "Bay Area",
    "kkr": "NYC Metro", "blackstone": "NYC Metro", "carlyle": "DC/DMV",
    "apollo": "NYC Metro", "warburg pincus": "NYC Metro",
    "goldman sachs": "NYC Metro", "morgan stanley": "NYC Metro", "jpmorgan": "NYC Metro",
    "citi": "NYC Metro", "citigroup": "NYC Metro",
    "cooley": "Bay Area", "wilson sonsini": "Bay Area", "fenwick": "Bay Area",
    "goodwin": "Boston", "mintz": "Boston", "gunderson": "Bay Area",
    "carta": "Bay Area", "stripe": "Bay Area", "plaid": "Bay Area",
}

# ─── Sector keyword mapping ───
SECTOR_KEYWORDS = {
    "AI/ML": ["ai", "artificial intelligence", "machine learning", "deep learning", "nlp",
              "computer vision", "generative ai", "llm", "neural", "gpt"],
    "Fintech": ["fintech", "finance tech", "payments", "banking tech", "neobank",
                "lending", "insurtech", "regtech", "defi"],
    "Healthcare": ["health", "biotech", "medtech", "pharma", "clinical", "genomics",
                   "telemedicine", "digital health", "life science"],
    "B2B SaaS": ["saas", "enterprise software", "b2b software", "cloud platform",
                 "devtools", "developer tools", "infrastructure"],
    "Consumer": ["consumer", "d2c", "direct to consumer", "e-commerce", "ecommerce",
                 "marketplace", "social media", "gaming", "entertainment"],
    "Crypto/Web3": ["crypto", "web3", "blockchain", "token", "defi", "nft", "dao",
                    "decentralized"],
    "Climate": ["climate", "cleantech", "clean energy", "sustainability", "carbon",
                "renewable", "greentech", "energy transition"],
    "Defense/Gov": ["defense", "military", "government", "govtech", "national security",
                    "aerospace", "space"],
    "PropTech": ["proptech", "real estate tech", "property tech", "construction tech"],
    "EdTech": ["edtech", "education", "learning platform", "lms"],
}

# ─── Investor type inference ───
VC_KEYWORDS = ["venture", "capital", "partners", "vc", "fund", "investment"]
FO_KEYWORDS = ["family office", "family investment", "private office", "wealth management"]
FOF_KEYWORDS = ["fund of funds", "fund-of-funds"]
LEGAL_KEYWORDS = ["law", "legal", "attorney", "counsel", "llp"]
SERVICE_KEYWORDS = ["bank", "advisory", "consulting", "accounting", "audit"]

# ─── Role type inference ───
ROLE_MAP = [
    (["general partner", "managing partner", " gp ", "gp,", "gp/"], "GP/Partner"),
    (["partner"], "Partner"),
    (["principal"], "Principal"),
    (["associate", "analyst"], "Associate/Analyst"),
    (["founder", "co-founder", "cofounder", "ceo", "chief executive"], "Founder/CEO"),
    (["cto", "cfo", "coo", "chief"], "C-Suite"),
    (["vp ", "vice president", "svp", "evp"], "VP"),
    (["director"], "Director"),
    (["managing director", " md "], "Managing Director"),
]


def load_json(filename):
    path = os.path.join(DATA_DIR, filename)
    if not os.path.exists(path):
        return []
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def clean_name(name):
    """Normalize a name: strip credentials, extra whitespace, fix casing."""
    if not name:
        return ""
    # Strip common suffixes
    name = re.sub(r",?\s*(Ph\.?D\.?|MD|MBA|CFA|CPA|Esq\.?|Jr\.?|Sr\.?|III|II|IV)\s*$", "", name, flags=re.IGNORECASE)
    name = re.sub(r"\s+", " ", name).strip()
    # If name looks like an email, return empty
    if "@" in name:
        return ""
    return name


def infer_investor_type(record):
    """Infer the investor type from available fields."""
    company = (record.get("company") or "").lower()
    title = (record.get("title") or "").lower()
    category = (record.get("_category") or "").lower()
    source = record.get("_primary_source", "")

    if any(k in category for k in FOF_KEYWORDS) or any(k in company for k in FOF_KEYWORDS):
        return "Fund of Funds"
    if any(k in category for k in ["family office"]) or any(k in company for k in FO_KEYWORDS):
        return "Family Office"
    if "sovereign" in category:
        return "Sovereign Wealth"
    if source == "legal" or any(k in company for k in LEGAL_KEYWORDS):
        return "Legal/Services"
    if any(k in title for k in ["founder", "co-founder", "cofounder", "ceo"]) and not any(k in company for k in VC_KEYWORDS):
        return "Founder"
    if category in ["vc fund", "investor/vc"] or any(k in company for k in VC_KEYWORDS):
        return "VC Fund"
    if source == "angels" or "angel" in category:
        return "Angel/Individual"
    if any(k in title for k in ["cto", "cfo", "coo", "vp ", "vice president", "director", "head of"]):
        return "Executive"
    if any(k in company for k in SERVICE_KEYWORDS):
        return "Service Provider"
    if category == "founder":
        return "Founder"
    if category == "executive":
        return "Executive"
    return "Other"


def infer_role_type(title):
    """Infer role type from title."""
    if not title:
        return ""
    t = f" {title.lower()} "
    for keywords, role in ROLE_MAP:
        if any(k in t for k in keywords):
            return role
    return ""


def infer_sectors(record):
    """Infer sector tags from all text fields."""
    text = " ".join([
        record.get("company", ""),
        record.get("title", ""),
        record.get("_focus", ""),
        record.get("_description", ""),
        " ".join(record.get("_sector_hints", [])),
    ]).lower()

    sectors = []
    for sector, keywords in SECTOR_KEYWORDS.items():
        if any(k in text for k in keywords):
            sectors.append(sector)
    return sectors if sectors else ["Generalist"]


def infer_region(record):
    """Try to fill in missing region from known firm HQs, city, etc."""
    region = record.get("region", "")
    if region and region != "Unknown":
        return region

    city = (record.get("city") or "").lower()
    company = (record.get("company") or "").lower()
    hq = (record.get("_headquarters") or "").lower()

    # Check city
    if any(c in city for c in ["new york", "nyc", "brooklyn", "manhattan", "queens", "bronx", "jersey city", "hoboken"]):
        return "NYC Metro"
    if any(c in city for c in ["san francisco", "palo alto", "menlo park", "mountain view", "sunnyvale", "cupertino", "san jose", "oakland"]):
        return "Bay Area"
    if any(c in city for c in ["boston", "cambridge", "somerville"]):
        return "Boston"
    if any(c in city for c in ["los angeles", "santa monica", "venice", "beverly hills", "hollywood", "pasadena"]):
        return "LA/SoCal"
    if any(c in city for c in ["miami", "fort lauderdale", "boca raton", "palm beach", "delray"]):
        return "South Florida"
    if any(c in city for c in ["washington", "dc", "arlington", "bethesda", "mclean"]):
        return "DC/DMV"
    if any(c in city for c in ["chicago", "evanston"]):
        return "Chicago"
    if any(c in city for c in ["seattle", "bellevue", "redmond"]):
        return "Seattle"
    if any(c in city for c in ["austin", "dallas", "houston", "san antonio"]):
        return "Texas"
    if any(c in city for c in ["denver", "boulder"]):
        return "Colorado"

    # Check HQ field (from external lists)
    for region_name, cities in [
        ("NYC Metro", ["new york"]), ("Bay Area", ["san francisco", "palo alto", "menlo park"]),
        ("Boston", ["boston"]), ("LA/SoCal", ["los angeles"]), ("South Florida", ["miami"]),
        ("DC/DMV", ["washington"]), ("Chicago", ["chicago"]),
    ]:
        if any(c in hq for c in cities):
            return region_name

    # Check company name against known firms
    for firm_key, firm_region in FIRM_HQ.items():
        if firm_key in company:
            return firm_region

    return ""


def parse_check_size(raw):
    """Parse check size string into a range bucket."""
    if not raw:
        return ""
    raw = raw.lower().replace(",", "").replace(" ", "")
    # Find dollar amounts
    amounts = re.findall(r'\$?([\d.]+)\s*([kmb])?', raw)
    if not amounts:
        return ""
    parsed = []
    for val, unit in amounts:
        try:
            n = float(val)
            if unit == "k":
                n *= 1000
            elif unit == "m":
                n *= 1_000_000
            elif unit == "b":
                n *= 1_000_000_000
            elif n < 100:  # likely already in millions if no unit and small number
                n *= 1_000_000
            parsed.append(n)
        except ValueError:
            continue
    if not parsed:
        return ""
    max_val = max(parsed)
    if max_val < 100_000:
        return "<$100K"
    if max_val < 500_000:
        return "$100K-$500K"
    if max_val < 1_000_000:
        return "$500K-$1M"
    if max_val < 5_000_000:
        return "$1M-$5M"
    return "$5M+"


def compute_strength(record):
    """Compute relationship strength from engagement signals."""
    emails = record.get("_email_count", 0)
    messages = record.get("_wa_messages", 0)
    sources = len(record.get("sources", []))
    in_crm = record.get("_in_crm", False)

    if emails >= 5 or messages >= 50 or sources >= 3:
        return "Strong"
    if emails >= 2 or messages >= 10 or sources >= 2:
        return "Medium"
    if emails >= 1 or messages >= 1 or in_crm:
        return "Weak"
    return "None"


def normalize_stage(stage):
    """Normalize fund stage variants."""
    if not stage or stage == "Unknown":
        return ""
    s = stage.lower().strip()
    mapping = {
        "angel": "Angel",
        "pre-seed": "Pre-Seed", "pre-seed/seed": "Pre-Seed", "preseed": "Pre-Seed",
        "seed": "Seed", "seed/a": "Seed",
        "series a": "Series A", "series a/b": "Series A",
        "series b": "Series B+", "series b+": "Series B+",
        "growth": "Growth",
        "pe": "PE", "private equity": "PE",
        "multi-stage": "Multi-Stage",
    }
    for key, val in mapping.items():
        if key in s:
            return val
    return stage


def normalize_status(status):
    """Normalize contact status."""
    if not status:
        return ""
    s = status.lower().strip()
    if "active" in s:
        return "Active"
    if "warm" in s:
        return "Warm"
    if "contact" in s:
        return "Contacted"
    if "new" in s:
        return "New"
    if "connect" in s:
        return "Connected"
    return status


# ─── Load all sources ───
print("Loading data sources...")

raw_records = []  # list of dicts with normalized fields + metadata


def add_records(source_name, data, field_map):
    """Generic loader. field_map maps our fields to source fields."""
    for row in data:
        rec = {"_primary_source": source_name}
        for our_field, src_field in field_map.items():
            if callable(src_field):
                rec[our_field] = src_field(row)
            else:
                rec[our_field] = (row.get(src_field) or "").strip() if isinstance(row.get(src_field), str) else row.get(src_field, "")
        raw_records.append(rec)


# Investors
add_records("investors", load_json("investors.json"), {
    "name": "Name", "email": "Email", "company": "Company", "title": "Title",
    "region": "Region", "city": "City", "fundStage": "Fund Stage",
    "sector": "Sector", "status": "Status", "priority": "Priority",
    "linkedinUrl": "LinkedIn URL",
    "_email_count": lambda r: int(r.get("Emails", 0) or 0),
    "_last_contact": "Last Contact",
})

# Angels
add_records("angels", load_json("angels.json"), {
    "name": "Name", "email": "Email", "company": "Company", "title": "Title",
    "region": "Region", "city": "City", "fundStage": "Fund Stage",
    "sector": "Sector", "status": "Status", "priority": "Priority",
    "linkedinUrl": "LinkedIn URL",
    "_email_count": lambda r: int(r.get("Emails", 0) or 0),
})

# LinkedIn (from spreadsheet)
add_records("linkedin", load_json("linkedin.json"), {
    "name": "Name", "email": lambda r: (r.get("Inferred Email") or r.get("Placeholder Email") or "").strip(),
    "company": "Company", "title": "Title", "region": "Region",
    "linkedinUrl": "LinkedIn URL",
})

# LinkedIn Connections
add_records("linkedin-conn", load_json("linkedin-connections.json"), {
    "name": "fullName", "email": "email", "company": "company", "title": "position",
    "linkedinUrl": "url", "_category": "category",
})

# HubSpot
add_records("hubspot", load_json("hubspot-contacts.json"), {
    "name": "fullName", "email": "email",
    "_email_count": lambda r: 1 if r.get("email") else 0,
    "_owner": "owner",
    "_last_contact": "createDate",
    "_in_crm": lambda r: r.get("inCRM", False),
})

# External Lists
add_records("external", load_json("external-lists.json"), {
    "name": "name", "email": "email", "company": "firm",
    "_category": "category", "_focus": "focus",
    "_description": "description", "_check_size_raw": "checkSize",
    "_rounds": "rounds", "region": "region", "linkedinUrl": "linkedin",
    "_headquarters": lambda r: r.get("headquarters", ""),
})

# WhatsApp
add_records("whatsapp", load_json("whatsapp-contacts.json"), {
    "name": "name", "company": "company",
    "linkedinUrl": lambda r: r.get("linkedinUrl", ""),
    "_wa_messages": lambda r: r.get("messages", 0),
    "_wa_groups": lambda r: r.get("groups", []),
    "_focus": lambda r: r.get("focus", ""),
    "_check_size_raw": lambda r: r.get("checkSize", ""),
    "_in_crm": lambda r: r.get("inCRM", False),
})

# Deal Flow
add_records("dealflow", load_json("dealflow.json"), {
    "name": "Name", "email": "Email", "company": "Company", "title": "Title",
    "region": "Region", "status": "Status", "linkedinUrl": "LinkedIn URL",
})

# Follow-up
add_records("follow-up", load_json("follow-up.json"), {
    "name": "Name", "email": "Email", "company": "Company", "title": "Title",
    "region": "Region", "city": "City", "fundStage": "Fund Stage",
    "sector": "Sector", "status": "Status", "priority": "Priority",
    "linkedinUrl": "LinkedIn URL",
    "_email_count": lambda r: int(r.get("Emails", 0) or 0),
    "_last_contact": "Last Contact",
})

# Legal
add_records("legal", load_json("legal.json"), {
    "name": "Name", "email": "Email", "company": "Company", "title": "Title",
    "region": "Region", "linkedinUrl": "LinkedIn URL",
})

# NYC
add_records("nyc", load_json("nyc-investors.json"), {
    "name": "Name", "email": "Email", "company": "Company", "title": "Title",
    "region": lambda r: "NYC Metro", "city": "City", "fundStage": "Fund Stage",
    "sector": "Sector", "status": "Status", "priority": "Priority",
    "linkedinUrl": "LinkedIn URL",
    "_email_count": lambda r: int(r.get("Emails", 0) or 0),
})

# South Florida
add_records("south-florida", load_json("south-florida.json"), {
    "name": "Name", "email": "Email", "company": "Company", "title": "Title",
    "region": lambda r: "South Florida", "city": "City", "fundStage": "Fund Stage",
    "sector": "Sector", "status": "Status", "priority": "Priority",
    "linkedinUrl": "LinkedIn URL",
})

# Re-engage
add_records("re-engage", load_json("re-engage.json"), {
    "name": "Name", "email": "Email", "company": "Company", "title": "Title",
    "region": "Region", "fundStage": "Fund Stage", "sector": "Sector",
    "status": "Status", "linkedinUrl": "LinkedIn URL",
})

# Needs Review
add_records("needs-review", load_json("needs-review.json"), {
    "name": "Name", "email": "Email", "company": "Company",
    "region": "Region", "_category": "Category",
})

print(f"Loaded {len(raw_records)} raw records from all sources")

# ─── Dedup Pass 1: By email ───
print("Deduplicating...")
email_groups = defaultdict(list)
no_email = []

for rec in raw_records:
    email = (rec.get("email") or "").strip().lower()
    name = clean_name(rec.get("name", ""))
    if not name and not email:
        continue  # skip completely empty records
    if email and "@" in email:
        email_groups[email].append(rec)
    else:
        rec["name"] = name
        no_email.append(rec)

# Source priority for merging
SOURCE_PRIORITY = [
    "investors", "nyc", "south-florida", "external", "dealflow", "angels",
    "follow-up", "re-engage", "linkedin", "linkedin-conn", "hubspot",
    "whatsapp", "legal", "needs-review"
]


def merge_records(records):
    """Merge multiple records into one unified record."""
    # Sort by source priority
    def source_key(r):
        src = r.get("_primary_source", "")
        return SOURCE_PRIORITY.index(src) if src in SOURCE_PRIORITY else 99
    records.sort(key=source_key)

    merged = {}
    sources = set()
    email_count = 0
    wa_messages = 0
    wa_groups = []
    in_crm = False
    sector_hints = []

    for rec in records:
        sources.add(rec["_primary_source"])
        email_count = max(email_count, rec.get("_email_count", 0))
        wa_messages = max(wa_messages, rec.get("_wa_messages", 0))
        wa_groups = rec.get("_wa_groups", []) or wa_groups
        in_crm = in_crm or rec.get("_in_crm", False)
        if rec.get("sector"):
            sector_hints.append(rec["sector"])

        # Take first non-empty value for each field
        for field in ["name", "email", "company", "title", "region", "city",
                       "fundStage", "sector", "status", "priority", "linkedinUrl",
                       "_category", "_focus", "_description", "_check_size_raw",
                       "_rounds", "_owner", "_last_contact", "_headquarters"]:
            val = rec.get(field, "")
            if isinstance(val, str):
                val = val.strip()
            if val and val != "Unknown" and field not in merged:
                merged[field] = val
            elif val and val != "Unknown" and not merged.get(field):
                merged[field] = val

    merged["sources"] = sorted(sources)
    merged["_email_count"] = email_count
    merged["_wa_messages"] = wa_messages
    merged["_wa_groups"] = wa_groups
    merged["_in_crm"] = in_crm
    merged["_sector_hints"] = sector_hints
    return merged


# Merge email groups
unified = []
for email, recs in email_groups.items():
    merged = merge_records(recs)
    merged["name"] = clean_name(merged.get("name", ""))
    merged["email"] = email
    unified.append(merged)

# ─── Dedup Pass 2: No-email records by name+company ───
name_groups = defaultdict(list)
for rec in no_email:
    name = clean_name(rec.get("name", "")).lower()
    company = (rec.get("company") or "").strip().lower()
    if name:
        key = f"{name}||{company}"
        name_groups[key].append(rec)

for key, recs in name_groups.items():
    merged = merge_records(recs)
    merged["name"] = clean_name(merged.get("name", ""))
    # Check if this name+company already exists in unified (from email pass)
    name_lower = merged["name"].lower()
    company_lower = (merged.get("company") or "").lower()
    duplicate = False
    for u in unified:
        if u["name"].lower() == name_lower and (u.get("company") or "").lower() == company_lower:
            # Merge into existing
            for field in ["title", "region", "city", "fundStage", "sector", "status",
                          "priority", "linkedinUrl", "_category", "_focus"]:
                if not u.get(field) and merged.get(field):
                    u[field] = merged[field]
            u["sources"] = sorted(set(u["sources"]) | set(merged["sources"]))
            u["_email_count"] = max(u.get("_email_count", 0), merged.get("_email_count", 0))
            u["_wa_messages"] = max(u.get("_wa_messages", 0), merged.get("_wa_messages", 0))
            if merged.get("_wa_groups"):
                u["_wa_groups"] = merged["_wa_groups"]
            duplicate = True
            break
    if not duplicate:
        unified.append(merged)

print(f"After dedup: {len(unified)} unique records")

# ─── Enrich all records ───
print("Enriching tags...")
final = []
for rec in unified:
    name = rec.get("name", "")
    if not name:
        continue

    # Generate stable ID
    id_seed = rec.get("email") or f"{name}|{rec.get('company', '')}"
    rid = hashlib.md5(id_seed.lower().encode()).hexdigest()[:12]

    entry = {
        "id": rid,
        "n": name,                                          # name
        "e": rec.get("email", ""),                          # email
        "c": rec.get("company", ""),                        # company
        "t": rec.get("title", ""),                          # title
        "li": rec.get("linkedinUrl", ""),                   # linkedin
        "src": rec.get("sources", []),                      # sources
        "st": normalize_status(rec.get("status", "")),      # status
        "rg": infer_region(rec),                            # region
        "ct": rec.get("city", ""),                          # city
        "fs": normalize_stage(rec.get("fundStage", "")),    # fund stage
        "sc": infer_sectors(rec),                           # sectors (array)
        "pr": rec.get("priority", ""),                      # priority
        "crm": "In CRM" if rec.get("_in_crm") or len(rec.get("sources", [])) > 1 else "New",
        "it": infer_investor_type(rec),                     # investor type
        "rt": infer_role_type(rec.get("title", "")),        # role type
        "cs": parse_check_size(rec.get("_check_size_raw", "")),  # check size range
        "rs": "",                                           # relationship strength (computed below)
        "wg": rec.get("_wa_groups", []),                    # whatsapp groups
    }

    # Compute relationship strength
    entry["rs"] = compute_strength({
        "_email_count": rec.get("_email_count", 0),
        "_wa_messages": rec.get("_wa_messages", 0),
        "sources": entry["src"],
        "_in_crm": entry["crm"] == "In CRM",
    })

    final.append(entry)

print(f"Enriched {len(final)} records")

# ─── Compute facets ───
print("Computing facets...")
facets = {}
facet_dims = {
    "investorType": "it",
    "region": "rg",
    "fundStage": "fs",
    "status": "st",
    "crmStatus": "crm",
    "relationshipStrength": "rs",
    "roleType": "rt",
    "checkSize": "cs",
}

for facet_name, field in facet_dims.items():
    counts = Counter(r[field] for r in final if r[field])
    facets[facet_name] = dict(counts.most_common(30))

# Sectors are arrays, need special handling
sector_counter = Counter()
for r in final:
    for s in r["sc"]:
        if s != "Generalist":
            sector_counter[s] += 1
sector_counter["Generalist"] = sum(1 for r in final if r["sc"] == ["Generalist"])
facets["sector"] = dict(sector_counter.most_common(20))

# Sources
source_counter = Counter()
for r in final:
    for s in r["src"]:
        source_counter[s] += 1
facets["sources"] = dict(source_counter.most_common(20))

# ─── Write output ───
index_path = os.path.join(DATA_DIR, "search-index.json")
meta_path = os.path.join(DATA_DIR, "search-meta.json")

output = {"records": final, "facets": facets}
with open(index_path, "w", encoding="utf-8") as f:
    json.dump(output, f, separators=(",", ":"))

with open(meta_path, "w", encoding="utf-8") as f:
    json.dump({"total": len(final), "facets": facets}, f, indent=2)

# File size
size_mb = os.path.getsize(index_path) / (1024 * 1024)
print(f"\nOutput: {index_path} ({size_mb:.1f} MB, {len(final)} records)")
print(f"Facets: {meta_path}")

# Summary
print("\n=== Enrichment Summary ===")
for facet_name, counts in facets.items():
    top = sorted(counts.items(), key=lambda x: -x[1])[:5]
    print(f"  {facet_name}: {', '.join(f'{k} ({v})' for k, v in top)}")
