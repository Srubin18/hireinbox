# Company Town: Implementation Checklist
## 20 Tasks in Priority Order

---

## PHASE 1: Foundation (Week 1)

### 1. Database Schema
- [ ] Create `company_profiles` table
- [ ] Create `company_districts` table
- [ ] Create `ai_screening_audit` table
- [ ] Create `company_role_templates` table
- [ ] Add foreign keys to existing tables
- [ ] Run migrations in Supabase

### 2. CSS Theming System
- [ ] Create CSS variables structure in `globals.css`
- [ ] Build `ThemeProvider` component
- [ ] Test with hardcoded Mafadi colors
- [ ] Verify dark mode compatibility

### 3. Brand Ingestion Job
- [ ] Build website fetcher (cheerio or puppeteer)
- [ ] Build color extraction from HTML/CSS
- [ ] Create brand extraction prompt
- [ ] Build `brandIngestJob()` function
- [ ] Test with Mafadi.co.za

### 4. Basic Dashboard Shell
- [ ] Create `DashboardLayout` component
- [ ] Build left navigation with company logo
- [ ] Create placeholder district tiles
- [ ] Wire up company profile to theme

---

## PHASE 2: Core Features (Week 2)

### 5. Taxonomy Builder
- [ ] Create taxonomy builder prompt
- [ ] Build `taxonomyBuilderJob()` function
- [ ] Generate Mafadi districts as test case
- [ ] Store in `company_districts` table

### 6. Onboarding Flow
- [ ] Create `/onboarding` page
- [ ] Build website URL input step
- [ ] Show AI-extracted brand preview
- [ ] Show suggested districts for confirmation
- [ ] Build 6 confirmation questions UI
- [ ] Create `/api/onboarding/start` endpoint
- [ ] Create `/api/onboarding/confirm` endpoint

### 7. District Tiles
- [ ] Build `DistrictTile` component
- [ ] Add health indicator logic
- [ ] Wire candidate counts from database
- [ ] Add click-through to district detail

### 8. District Detail Page
- [ ] Create `/dashboard/[district]` page
- [ ] Show open roles in district
- [ ] Show candidate pipeline
- [ ] Add quick actions (screen, shortlist)

---

## PHASE 3: AI Integration (Week 3)

### 9. Company-Specific Screening
- [ ] Modify screening prompt to accept rubric
- [ ] Load company rubric from database
- [ ] Load district criteria
- [ ] Test screening with Mafadi context

### 10. Audit Trail
- [ ] Log every AI screening decision
- [ ] Store evidence with quotes
- [ ] Track prompt version and model
- [ ] Build audit view in settings

### 11. Terminology System
- [ ] Replace hardcoded labels with company terms
- [ ] Create terminology hook `useTerminology()`
- [ ] Apply throughout UI
- [ ] Test with custom Mafadi terms

### 12. District Assignment
- [ ] Auto-assign candidates to districts based on role
- [ ] Allow manual reassignment
- [ ] Update candidate cards with district badge

---

## PHASE 4: Polish (Week 4)

### 13. Analytics by District
- [ ] Create district-level metrics queries
- [ ] Build analytics cards per district
- [ ] Add AI insights section
- [ ] Show scoring trends

### 14. Role Templates
- [ ] Create role template library per district
- [ ] Pre-populate requirements from taxonomy
- [ ] Allow customization
- [ ] Track template usage

### 15. Learning Loop
- [ ] Track shortlist/reject signals
- [ ] Update scoring weights based on feedback
- [ ] Show "AI is learning" indicators
- [ ] Build feedback collection UI

### 16. Mobile Responsive
- [ ] Test all screens on mobile
- [ ] Collapse nav to hamburger
- [ ] Stack district tiles vertically
- [ ] Ensure touch targets are adequate

---

## PHASE 5: Launch Ready (Week 5)

### 17. Guardrails & Compliance
- [ ] Implement forbidden signals filter
- [ ] Add POPIA consent flow
- [ ] Build data retention automation
- [ ] Test audit export for compliance

### 18. Edge Cases
- [ ] Handle sparse websites gracefully
- [ ] Allow manual brand upload
- [ ] Support logo-less companies
- [ ] Handle onboarding abandonment

### 19. Documentation
- [ ] Write onboarding help text
- [ ] Create district setup guide
- [ ] Document API for integrations
- [ ] Build in-app tooltips

### 20. Testing & QA
- [ ] Test full onboarding flow
- [ ] Test screening with company context
- [ ] Test multi-user permissions
- [ ] Performance test with 1000+ candidates
- [ ] Security audit

---

## RISKS & MITIGATIONS

| Risk | Impact | Mitigation |
|------|--------|------------|
| Website crawl fails (JS-heavy sites) | Can't extract brand | Fallback to manual upload + industry defaults |
| AI extracts wrong industry | Bad district suggestions | Confirmation step catches this; easy to correct |
| Color contrast issues | Accessibility problems | Validate contrast ratios; enforce WCAG AA |
| Over-personalization | Maintenance burden | Keep core UI consistent; only surface elements change |
| POPIA violation | Legal risk | Evidence-based only; audit trail; deletion support |
| API costs spike | Budget overrun | Cache AI responses; use GPT-4o-mini where possible |
| Multi-tenant data leak | Security breach | Row-level security in Supabase; company_id on all queries |

---

## EDGE CASES

| Scenario | Handling |
|----------|----------|
| Company has no website | Skip brand ingest; use industry defaults + manual setup |
| Website is in Afrikaans | AI prompt handles multilingual; extract brand visuals |
| Company rebrands | "Refresh Brand" button re-runs ingest; preserves taxonomy |
| 50+ employees | District permissions; role-based access per district |
| Multiple locations/countries | Location field on districts; compliance per region |
| Subsidiary companies | Parent-child company structure; shared templates option |
| Competitor signs up | No special handling; data is isolated by design |
| Company churns | Data retained for audit; anonymized after retention period |

---

## SUCCESS METRICS

| Metric | Target | Measurement |
|--------|--------|-------------|
| Onboarding completion | >80% | % of signups that finish onboarding |
| Time to first screen | <5 min | Time from signup to first CV screened |
| District adoption | >60% | % of companies using 3+ districts |
| Terminology customization | >40% | % of companies who change default terms |
| User retention (30-day) | >70% | Active users after 30 days |
| NPS | >50 | Survey after 2 weeks |

---

## MAFADI TEST CASE

Before shipping, the full flow should work for Mafadi:

1. **Sign up** with `mafadi.co.za`
2. **AI extracts**: Black/green palette, property management, 7 service areas
3. **Shows**: Suggested districts (Sales, Portfolio, Body Corporate, Finance, Maintenance, Admin, Airbnb)
4. **Confirms**: User tweaks names, adds "Trustees Liaison" to Body Corporate
5. **Dashboard**: Shows Mafadi logo, green accent, district tiles with their names
6. **Screens CV**: AI knows "sectional title" is important for Body Corporate
7. **Shortlists**: Candidate shows in Body Corporate district
8. **Analytics**: Shows "80% of Body Corporate hires have CSOS registration"

If this works smoothly, ship it.

---

*The checklist is the plan. Execute top to bottom. Skip nothing.*
