# HireInbox: Company Town Dashboard
## Product Specification v1.0

---

## 1. THE CONCEPT

### What is Company Town?

When a company signs up for HireInbox, they don't get a generic dashboard. They get a **branded hiring command center** that feels like it was built specifically for their business.

**The metaphor**: Your dashboard is a "town" with districts. Each district represents a talent bucket (Sales Agents, Property Managers, Finance, etc.). Districts have health indicators, population counts, and activity feeds. You can see your whole hiring operation at a glance.

### Why It Feels Magical

1. **Instant recognition**: Their logo, their colors, their terminology everywhere
2. **Speaks their language**: "Letting Agents" not "Sales Reps", "Portfolio Managers" not "Account Managers"
3. **Reflects their org**: Districts match their actual departments, not a generic template
4. **AI understands context**: Screening knows that a "CA(SA)" is essential for their Finance district, that "sectional title experience" matters for Body Corporate

### The 10-Second Test

A Mafadi manager opens the dashboard and sees:
- Mafadi logo top-left, their green accent color on CTAs
- "Good morning, Thabo. 12 new CVs in Body Corporate Ops."
- District tiles: Sales & Letting (green, healthy), Finance (amber, 2 open roles), Maintenance (red, urgent hire)
- Today's shortlist: 3 candidates ready for interview
- AI insight: "Strong candidate for Senior Portfolio Manager - 8 years sectional title experience"

They know everything in 10 seconds. That's the goal.

---

## 2. ANATOMY OF A COMPANY TOWN

### 2.1 The Shell (Company Brand Layer)

| Element | What It Shows | Source |
|---------|---------------|--------|
| Logo | Company logo, top-left nav | Uploaded or crawled |
| Colors | Primary, secondary, accent | Extracted from website |
| Typography | Font family preference | Inferred or default |
| Terminology | Custom labels for roles, statuses | Onboarding + AI learning |
| Tone | Formal/casual communication style | Website analysis |

### 2.2 The Districts (Talent Buckets)

Each district is a **logical grouping of roles** that makes sense to the company.

**Mafadi Example**:

| District | Contains | Key Metric | Manager Cares About |
|----------|----------|------------|---------------------|
| Sales & Letting Agents | Sales agents, letting agents, area managers | Pipeline velocity | How fast are we filling roles? |
| Portfolio / Property Managers | Senior PMs, junior PMs, body corp managers | Quality of shortlist | Are these people actually qualified? |
| Body Corporate Ops | Trustees liaison, levy collectors, compliance | Compliance flags | Do they understand sectional title law? |
| Finance & Collections | Accountants, bookkeepers, credit controllers | CA(SA) presence | Do we have qualified candidates? |
| Maintenance / Field Ops | Technicians, plumbers, electricians, inspectors | Availability | Can they start immediately? |
| Leasing Admin | Onboarding coordinators, lease admins | Processing speed | How fast can they turn around leases? |
| Airbnb Ops | Guest coordinators, cleaners, key runners | Flexibility score | Can they work weekends? |

### 2.3 The Command Center (Dashboard View)

```
+------------------------------------------------------------------+
|  [Mafadi Logo]         Company Town         [Search] [Settings]  |
+------------------------------------------------------------------+
|  |             |                                                 |
|  | DISTRICTS   |   SALES & LETTING        PORTFOLIO MANAGERS    |
|  | ----------- |   [====] 8 candidates    [==] 3 candidates     |
|  | Sales       |   2 shortlisted          1 shortlisted         |
|  | Portfolio   |   Last activity: 2h ago  Last activity: 1d     |
|  | Body Corp   |                                                 |
|  | Finance     |   BODY CORPORATE OPS     FINANCE & COLLECTIONS |
|  | Maintenance |   [===] 5 candidates     [=] 2 candidates      |
|  | Admin       |   0 shortlisted (!)      0 shortlisted (!)     |
|  | Airbnb      |   Needs attention        Urgent: CA(SA) needed |
|  |             |                                                 |
|  | QUICK LINKS |   MAINTENANCE OPS        AIRBNB OPS           |
|  | ----------- |   [======] 12 candidates [====] 6 candidates   |
|  | Inbox (24)  |   4 shortlisted          2 shortlisted         |
|  | Shortlist   |   High volume            Weekend avail checked |
|  | Analytics   |                                                 |
|  | Settings    |                                                 |
|  |             +------------------------------------------------+
|  |             | TODAY'S PRIORITY                               |
|  |             | "3 candidates ready for interview in Finance"  |
|  |             | "Strong match: Sarah M. - 8yrs sectional title"|
+------------------------------------------------------------------+
```

---

## 3. DISTRICT DEEP DIVE

### What Each District Shows

#### Tile View (Collapsed)
- District name with company terminology
- Candidate count (bar visualization)
- Shortlist count
- Health indicator (green/amber/red)
- Last activity timestamp

#### Expanded View (Click into district)
- All open roles in this district
- Candidate pipeline per role
- AI-ranked shortlist
- Recent activity feed
- Quick actions: "Screen inbox", "View shortlist", "Add role"

### Health Indicators

| Status | Meaning | Trigger |
|--------|---------|---------|
| Green | Healthy | Shortlist has 3+ candidates, active movement |
| Amber | Attention | Open role with <3 shortlisted, no activity in 3 days |
| Red | Urgent | Open role with 0 shortlisted, or urgent flag set |

---

## 4. MAPPING TO ANY BUSINESS

### The Generic Template

Every company can have up to 10 districts. Default suggestions by industry:

**Real Estate / Property Management** (like Mafadi)
- Sales & Leasing
- Property Management
- Finance & Admin
- Maintenance & Facilities
- Customer Service

**Retail / Hospitality**
- Store Operations
- Management
- Warehouse / Logistics
- Customer Service
- Corporate / Support

**Tech / Software**
- Engineering
- Product
- Sales & Marketing
- Customer Success
- Operations

**Healthcare**
- Clinical Staff
- Nursing
- Admin & Reception
- Specialists
- Support Services

### Customization Flow

1. AI suggests districts based on website crawl
2. Company confirms or modifies during onboarding
3. Districts can be renamed, merged, or split anytime
4. AI learns from their actual hiring patterns over time

---

## 5. WHY THIS IS A MOAT

1. **Personalization = stickiness**: Generic ATS is replaceable. A tool that speaks your language isn't.

2. **AI context = better screening**: When AI knows "sectional title" is important, it can score for it.

3. **Org alignment = adoption**: Managers see their world reflected, not a foreign system.

4. **Brand investment = commitment**: Once you've configured your town, you've invested time. Switching means starting over.

5. **Data compounds**: Every hire teaches the AI more about what this company values.

---

## 6. IMPLEMENTATION PHILOSOPHY

### Phase 1: Thin Slice (Ship in 1 week)
- Company logo upload
- Primary color extraction (or manual)
- 3-5 custom district names
- Basic theming (CSS variables)

### Phase 2: Smart Defaults (Ship in 2 weeks)
- Website crawl for brand extraction
- Industry-based district suggestions
- Role template library per district

### Phase 3: Full Town (Ship in 4-6 weeks)
- AI-generated scoring rubrics per district
- Custom terminology throughout
- District-level analytics
- Multi-user permissions per district

---

*This is not enterprise bloat. This is making software feel like home.*
