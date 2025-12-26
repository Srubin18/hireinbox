# Company Town: UI & Information Architecture
## Detailed Design Specification

---

## 1. NAVIGATION STRUCTURE

### 1.1 Left Navigation (Persistent)

```
+------------------------+
|  [Company Logo]        |  <- Uploaded/crawled, max 140px wide
|  Company Name          |  <- From signup
+------------------------+
|                        |
|  OVERVIEW              |  <- Dashboard home (the "town")
|                        |
|  DISTRICTS             |  <- Expandable section
|  ├─ Sales & Letting    |
|  ├─ Portfolio Mgmt     |
|  ├─ Body Corporate     |
|  ├─ Finance            |
|  ├─ Maintenance        |
|  ├─ Admin              |
|  └─ Airbnb Ops         |
|                        |
|  TALENT POOL           |  <- All candidates ever screened
|  REJECTIONS            |  <- Archive with reasons
|                        |
|  ─────────────────     |
|                        |
|  INBOX                 |  <- Unprocessed CVs [badge: 24]
|  SHORTLIST             |  <- Ready for interview
|  INTERVIEWS            |  <- Video analysis hub
|                        |
|  ─────────────────     |
|                        |
|  ANALYTICS             |  <- Hiring metrics
|  SETTINGS              |  <- Company config
|                        |
+------------------------+
|  [User Avatar]         |
|  Thabo M.              |
|  Admin                 |
+------------------------+
```

### 1.2 Top Bar

```
+------------------------------------------------------------------+
| [Hamburger]  HireInbox              [Search...]  [?] [Bell] [Av] |
+------------------------------------------------------------------+
         ^                                  ^       ^    ^      ^
         |                                  |       |    |      |
     Mobile nav                        Global   Help Notif  Profile
                                      search
```

### 1.3 Search Behavior
- Global search across all candidates
- Type-ahead with district filtering: "maintenance:plumber"
- Recent searches remembered
- Filters: District, Score range, Date, Status

---

## 2. DASHBOARD: THE TOWN VIEW

### 2.1 Layout Grid (Desktop)

```
+------------------------------------------------------------------+
|  Good morning, Thabo.                    [Date: 22 Dec 2024]    |
|  12 new CVs waiting in your inbox.       [Quick: Screen Inbox]  |
+------------------------------------------------------------------+
|                                                                  |
|  +----------------+  +----------------+  +----------------+      |
|  | SALES &        |  | PORTFOLIO      |  | BODY CORPORATE |      |
|  | LETTING        |  | MANAGEMENT     |  | OPS            |      |
|  |                |  |                |  |                |      |
|  | [████████] 8   |  | [███] 3        |  | [█████] 5      |      |
|  | 2 shortlisted  |  | 1 shortlisted  |  | 0 shortlisted  |      |
|  | ● Active       |  | ● Active       |  | ⚠ Needs attn   |      |
|  +----------------+  +----------------+  +----------------+      |
|                                                                  |
|  +----------------+  +----------------+  +----------------+      |
|  | FINANCE &      |  | MAINTENANCE    |  | AIRBNB OPS     |      |
|  | COLLECTIONS    |  | / FIELD OPS    |  |                |      |
|  |                |  |                |  |                |      |
|  | [██] 2         |  | [██████████] 12|  | [██████] 6     |      |
|  | 0 shortlisted  |  | 4 shortlisted  |  | 2 shortlisted  |      |
|  | 🔴 Urgent      |  | ● Healthy      |  | ● Active       |      |
|  +----------------+  +----------------+  +----------------+      |
|                                                                  |
+------------------------------------------------------------------+
|  TODAY'S PRIORITY                                                |
|  ┌──────────────────────────────────────────────────────────┐   |
|  │ 🎯 3 candidates ready for interview in Finance           │   |
|  │ ⭐ Strong match: Sarah M. — 8 years sectional title exp  │   |
|  │ 📬 24 unscreened CVs in inbox (oldest: 3 days)           │   |
|  └──────────────────────────────────────────────────────────┘   |
+------------------------------------------------------------------+
```

### 2.2 District Tile Specification

```
+----------------------------------+
|  [District Name]                 |  <- Company's terminology
|  2 open roles                    |  <- Role count
|                                  |
|  [████████████░░░░░░░] 8/15     |  <- Progress bar: candidates/target
|                                  |
|  Shortlisted: 2                  |
|  Last activity: 2 hours ago      |
|                                  |
|  [●] Healthy                     |  <- Status dot + label
+----------------------------------+

States:
- ● Green = Healthy (shortlist ≥3, recent activity)
- ⚠ Amber = Attention (shortlist <3, or stale >3 days)
- 🔴 Red = Urgent (no shortlist, or urgent flag)
```

### 2.3 Click-Through: District Detail

```
+------------------------------------------------------------------+
|  ← Back to Overview                                              |
+------------------------------------------------------------------+
|  FINANCE & COLLECTIONS                           [+ Add Role]    |
|  0 of 2 roles filled | 2 candidates in pipeline                  |
+------------------------------------------------------------------+
|                                                                  |
|  OPEN ROLES                                                      |
|  +------------------------------------------------------------+ |
|  | Senior Accountant (CA(SA) Required)            Posted 5d   | |
|  | Pipeline: 1 candidate | Shortlist: 0 | Status: 🔴 Urgent   | |
|  | [View Candidates]  [Edit Role]  [Share]                    | |
|  +------------------------------------------------------------+ |
|  +------------------------------------------------------------+ |
|  | Credit Controller                              Posted 2d   | |
|  | Pipeline: 1 candidate | Shortlist: 0 | Status: ⚠ Attention| |
|  | [View Candidates]  [Edit Role]  [Share]                    | |
|  +------------------------------------------------------------+ |
|                                                                  |
|  RECENT ACTIVITY                                                 |
|  • Sarah M. screened for Senior Accountant — Score: 82 (2h ago) |
|  • New CV received: James K. — Pending screening (1d ago)       |
|                                                                  |
+------------------------------------------------------------------+
```

---

## 3. CORE SCREENS

### 3.1 Inbox

```
+------------------------------------------------------------------+
|  INBOX                                          [Screen All AI] |
|  24 unprocessed CVs                                              |
+------------------------------------------------------------------+
|  Filter: [All Districts ▼] [All Dates ▼] [Sort: Newest ▼]       |
+------------------------------------------------------------------+
|                                                                  |
|  +------------------------------------------------------------+ |
|  | 📎 Sarah_CV.pdf                           Body Corporate   | |
|  | Received: 2 hours ago | From: careers@mafadi.co.za         | |
|  | [Screen Now]  [Assign to Role]  [Archive]                  | |
|  +------------------------------------------------------------+ |
|  | 📎 James_Resume.docx                       Finance         | |
|  | Received: 1 day ago | From: jobs@mafadi.co.za              | |
|  | [Screen Now]  [Assign to Role]  [Archive]                  | |
|  +------------------------------------------------------------+ |
|                                                                  |
+------------------------------------------------------------------+
```

### 3.2 Candidate Card (Universal)

```
+------------------------------------------------------------------+
|  SARAH MOKOENA                                    Score: 82/100 |
|  Senior Property Manager | 8 years experience                    |
+------------------------------------------------------------------+
|  Applied for: Body Corporate Manager                             |
|  District: Body Corporate Ops                                    |
+------------------------------------------------------------------+
|                                                                  |
|  STRENGTHS (Evidence-based)                                      |
|  ┌──────────────────────────────────────────────────────────┐   |
|  │ ✓ Sectional title expertise                              │   |
|  │   "Managed 15 sectional title schemes across Gauteng"    │   |
|  │                                                          │   |
|  │ ✓ Compliance knowledge                                   │   |
|  │   "CSOS registered, completed trustees training 2023"    │   |
|  └──────────────────────────────────────────────────────────┘   |
|                                                                  |
|  CONSIDERATIONS                                                  |
|  ┌──────────────────────────────────────────────────────────┐   |
|  │ ⚠ No HOA experience mentioned                            │   |
|  │ ⚠ Gap in employment: Jan 2022 - Jun 2022                 │   |
|  └──────────────────────────────────────────────────────────┘   |
|                                                                  |
|  [Shortlist]  [Request Interview]  [Reject]  [View Full CV]     |
+------------------------------------------------------------------+
```

### 3.3 Shortlist

```
+------------------------------------------------------------------+
|  SHORTLIST                                      [Export CSV]    |
|  6 candidates ready for interview                                |
+------------------------------------------------------------------+
|  Group by: [District ▼]                                          |
+------------------------------------------------------------------+
|                                                                  |
|  BODY CORPORATE OPS (2)                                          |
|  +------------------------------------------------------------+ |
|  | Sarah M. | Score: 82 | Body Corporate Manager | [Interview]| |
|  | Thabo K. | Score: 78 | Trustees Liaison       | [Interview]| |
|  +------------------------------------------------------------+ |
|                                                                  |
|  MAINTENANCE / FIELD OPS (4)                                     |
|  +------------------------------------------------------------+ |
|  | David L. | Score: 85 | Senior Technician      | [Interview]| |
|  | ... (3 more)                                                | |
|  +------------------------------------------------------------+ |
|                                                                  |
+------------------------------------------------------------------+
```

### 3.4 Analytics

```
+------------------------------------------------------------------+
|  ANALYTICS                           [Date Range: Last 30 days] |
+------------------------------------------------------------------+
|                                                                  |
|  OVERVIEW                                                        |
|  +------------+  +------------+  +------------+  +------------+ |
|  | 156        |  | 24         |  | 8          |  | 4.2 days   | |
|  | CVs        |  | Shortlisted|  | Hired      |  | Avg time   | |
|  | screened   |  |            |  |            |  | to hire    | |
|  +------------+  +------------+  +------------+  +------------+ |
|                                                                  |
|  BY DISTRICT                                                     |
|  +------------------------------------------------------------+ |
|  | District          | CVs | Shortlist | Hired | Avg Score   | |
|  |--------------------|-----|-----------|-------|-------------| |
|  | Sales & Letting    | 45  | 8         | 3     | 71          | |
|  | Portfolio Mgmt     | 28  | 5         | 2     | 74          | |
|  | Body Corporate     | 22  | 4         | 1     | 68          | |
|  | Finance            | 18  | 3         | 1     | 79          | |
|  | Maintenance        | 35  | 4         | 1     | 65          | |
|  +------------------------------------------------------------+ |
|                                                                  |
|  AI INSIGHTS                                                     |
|  • Finance district has highest quality candidates (avg 79)     |
|  • Maintenance has fastest pipeline but lowest scores           |
|  • Body Corporate: "sectional title" mentioned in 80% of hires  |
|                                                                  |
+------------------------------------------------------------------+
```

---

## 4. MAFADI-SPECIFIC DISTRICT KPIS

| District | KPIs Manager Sees in 10 Seconds |
|----------|--------------------------------|
| **Sales & Letting** | Pipeline size, conversion rate, "sales experience" % |
| **Portfolio Mgmt** | Qualified candidates (5+ yrs), sectional title %, CA(SA) % |
| **Body Corporate** | CSOS registered %, trustees exp %, compliance score |
| **Finance** | CA(SA) present, years in property, credit control exp |
| **Maintenance** | Trade certified %, availability score, driver's license % |
| **Leasing Admin** | Processing speed indicator, lease system exp % |
| **Airbnb Ops** | Weekend availability %, guest service exp, language skills |

---

## 5. THEMING SYSTEM

### 5.1 CSS Variables (Company-Specific)

```css
:root {
  /* Mafadi Example */
  --company-primary: #000000;
  --company-secondary: #2e2e2e;
  --company-accent: #28a745;
  --company-accent-hover: #218838;
  --company-text-on-dark: #ffffff;
  --company-text-on-light: #000000;

  /* Derived */
  --company-success: var(--company-accent);
  --company-warning: #fbbf24;
  --company-danger: #ef4444;

  /* Surfaces */
  --company-bg-primary: #0f0f0f;
  --company-bg-secondary: #1a1a1a;
  --company-bg-tertiary: #252525;
  --company-border: #333333;
}
```

### 5.2 Logo Placement Rules
- Max width: 140px
- Max height: 40px
- Dark mode: Use light version if available, otherwise add subtle glow
- Fallback: Company initials in accent color

### 5.3 Dark Mode Palette Generator

Given a company's primary color, generate:
1. Desaturate by 20% for dark backgrounds
2. Boost accent by 10% for CTAs
3. White text on all dark surfaces
4. Subtle gradients: primary → secondary

---

## 6. RESPONSIVE BEHAVIOR

### Mobile (< 768px)
- Districts stack vertically as cards
- Left nav collapses to hamburger
- Priority panel moves to top
- Single-column candidate cards

### Tablet (768px - 1024px)
- 2-column district grid
- Collapsible left nav
- Slide-out candidate details

### Desktop (> 1024px)
- Full 3-column district grid
- Persistent left nav
- Side-by-side candidate comparison

---

*Navigation should feel like walking through a familiar building, not using software.*
