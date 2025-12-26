# Company Town: Implementation Plan
## Engineering Specification

---

## 1. DATA MODEL (Supabase)

### 1.1 New Tables

```sql
-- Company brand and configuration
CREATE TABLE company_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,

  -- Brand
  logo_url TEXT,
  primary_color VARCHAR(7) DEFAULT '#000000',
  secondary_color VARCHAR(7) DEFAULT '#1a1a1a',
  accent_color VARCHAR(7) DEFAULT '#28a745',
  font_family VARCHAR(100) DEFAULT 'Inter',
  tone VARCHAR(20) DEFAULT 'professional', -- formal, professional, casual, friendly

  -- Business context
  industry VARCHAR(100),
  sub_industries JSONB DEFAULT '[]',
  services JSONB DEFAULT '[]',
  company_size VARCHAR(20), -- startup, sme, enterprise
  locations JSONB DEFAULT '[]',

  -- Terminology overrides
  terminology JSONB DEFAULT '{}', -- {"candidate": "applicant", "shortlist": "final_round"}

  -- Compliance
  compliance_region VARCHAR(10) DEFAULT 'ZA',
  data_retention_months INTEGER DEFAULT 24,

  -- Audit
  source_url TEXT, -- website used for extraction
  extracted_at TIMESTAMP,
  confirmed_by UUID REFERENCES users(id),
  confirmed_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Company taxonomy (districts)
CREATE TABLE company_districts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,

  -- Identity
  slug VARCHAR(50) NOT NULL, -- "sales-letting"
  name VARCHAR(100) NOT NULL, -- "Sales & Letting"
  description TEXT,
  sort_order INTEGER DEFAULT 0,

  -- Configuration
  typical_roles JSONB DEFAULT '[]',
  must_have_criteria JSONB DEFAULT '[]',
  nice_to_have JSONB DEFAULT '[]',
  red_flags JSONB DEFAULT '[]',
  kpis JSONB DEFAULT '[]',

  -- Scoring weights (override defaults)
  scoring_weights JSONB DEFAULT '{}',

  -- Status
  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(company_id, slug)
);

-- Link roles to districts
ALTER TABLE roles ADD COLUMN district_id UUID REFERENCES company_districts(id);

-- AI audit log
CREATE TABLE ai_screening_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  candidate_id UUID REFERENCES candidates(id),
  role_id UUID REFERENCES roles(id),
  district_id UUID REFERENCES company_districts(id),

  -- Decision
  action VARCHAR(20) NOT NULL, -- screen, shortlist, reject
  score INTEGER,
  decision_reason TEXT,

  -- Evidence
  evidence JSONB DEFAULT '[]', -- [{claim, source, quote, confidence}]

  -- Reproducibility
  ai_model VARCHAR(50),
  prompt_version VARCHAR(20),
  input_hash VARCHAR(64),
  rubric_snapshot JSONB,

  -- Audit
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  overridden_at TIMESTAMP,
  overridden_by UUID REFERENCES users(id),
  override_reason TEXT
);

-- Company-specific role templates
CREATE TABLE company_role_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  district_id UUID REFERENCES company_districts(id),

  name VARCHAR(200) NOT NULL,
  description TEXT,
  requirements JSONB DEFAULT '{}',
  scoring_rubric JSONB DEFAULT '{}',

  -- Template status
  is_active BOOLEAN DEFAULT TRUE,
  usage_count INTEGER DEFAULT 0,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_districts_company ON company_districts(company_id);
CREATE INDEX idx_audit_company ON ai_screening_audit(company_id);
CREATE INDEX idx_audit_candidate ON ai_screening_audit(candidate_id);
CREATE INDEX idx_templates_district ON company_role_templates(district_id);
```

### 1.2 Modify Existing Tables

```sql
-- Add company theming reference
ALTER TABLE companies ADD COLUMN profile_id UUID REFERENCES company_profiles(id);
ALTER TABLE companies ADD COLUMN onboarding_completed_at TIMESTAMP;

-- Add district to candidates
ALTER TABLE candidates ADD COLUMN district_id UUID REFERENCES company_districts(id);
```

---

## 2. JSON SCHEMAS

### 2.1 brand_profile

```typescript
interface BrandProfile {
  // Visual
  logo_url: string | null;
  primary_color: string;      // "#000000"
  secondary_color: string;    // "#1a1a1a"
  accent_color: string;       // "#28a745"
  font_family: string;        // "Inter"
  tone: 'formal' | 'professional' | 'casual' | 'friendly';

  // Business
  industry: string;
  sub_industries: string[];
  services: string[];
  company_size: 'startup' | 'sme' | 'enterprise';
  locations: string[];

  // Terminology
  terminology: {
    candidate?: string;       // "applicant"
    shortlist?: string;       // "final_round"
    rejected?: string;        // "not_suitable"
    interview?: string;       // "meeting"
    [key: string]: string | undefined;
  };

  // Compliance
  compliance_region: string;  // "ZA"
  data_retention_months: number;

  // Metadata
  source_url: string | null;
  extracted_at: string | null;
  confirmed_at: string | null;
}
```

### 2.2 company_taxonomy (District)

```typescript
interface District {
  id: string;
  slug: string;              // "body-corporate"
  name: string;              // "Body Corporate Ops"
  description: string;
  sort_order: number;

  typical_roles: string[];   // ["Portfolio Manager", "Trustees Liaison"]

  must_have_criteria: Criterion[];
  nice_to_have: Criterion[];
  red_flags: RedFlag[];

  kpis: string[];            // ["CSOS registered %", "Sectional title exp %"]

  scoring_weights: {
    [key: string]: number;   // {"experience": 30, "qualifications": 25}
  };

  is_active: boolean;
}

interface Criterion {
  name: string;              // "sectional_title_experience"
  description: string;       // "Experience with sectional title schemes"
  weight: number;            // 20
  keywords: string[];        // ["sectional title", "body corporate", "CSOS"]
  evidence_required: boolean;
}

interface RedFlag {
  name: string;              // "job_hopping"
  description: string;       // "More than 3 jobs in 2 years"
  threshold: string;         // "3 jobs in 2 years"
  action: 'flag_for_review' | 'auto_reject' | 'reduce_score';
  score_impact?: number;     // -10
}
```

### 2.3 screening_rubric

```typescript
interface ScreeningRubric {
  company_id: string;
  district_id: string;
  role_id?: string;          // Optional: role-specific override

  version: string;           // "v1.2"

  scoring: {
    base_score: number;      // 50
    max_score: number;       // 100

    must_haves: {
      criteria: string;
      weight: number;
      keywords: string[];
      evidence_required: boolean;
    }[];

    nice_to_haves: {
      criteria: string;
      weight: number;
      keywords: string[];
    }[];

    red_flags: {
      flag: string;
      threshold: string;
      action: 'flag' | 'reject' | 'deduct';
      deduction?: number;
    }[];
  };

  thresholds: {
    shortlist: number;       // 75
    consider: number;        // 60
    reject: number;          // 40
  };
}
```

---

## 3. BACKEND JOBS

### 3.1 brand_ingest_job

**File: `src/lib/jobs/brand-ingest.ts`**

```typescript
import OpenAI from 'openai';

interface BrandIngestResult {
  success: boolean;
  profile: Partial<BrandProfile>;
  confidence: number;
  source_pages: string[];
}

export async function brandIngestJob(companyUrl: string): Promise<BrandIngestResult> {
  // 1. Fetch website content
  const pages = await fetchWebsiteContent(companyUrl, {
    maxPages: 5,
    include: ['/', '/about', '/services', '/careers', '/contact']
  });

  // 2. Extract colors from CSS/HTML
  const colors = await extractColorsFromHtml(pages.homepage);

  // 3. AI extraction
  const openai = new OpenAI();
  const extraction = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{
      role: 'system',
      content: BRAND_EXTRACTION_PROMPT
    }, {
      role: 'user',
      content: `Website content:\n${pages.combined}`
    }],
    response_format: { type: 'json_object' }
  });

  const aiResult = JSON.parse(extraction.choices[0].message.content);

  // 4. Merge color extraction with AI result
  const profile: Partial<BrandProfile> = {
    ...aiResult.brand,
    primary_color: colors.primary || aiResult.brand.primary_color,
    accent_color: colors.accent || aiResult.brand.accent_color,
    industry: aiResult.business.industry,
    sub_industries: aiResult.business.sub_industries,
    services: aiResult.business.services,
    source_url: companyUrl,
    extracted_at: new Date().toISOString()
  };

  return {
    success: true,
    profile,
    confidence: calculateConfidence(aiResult),
    source_pages: pages.urls
  };
}

async function fetchWebsiteContent(url: string, options: FetchOptions) {
  // Use puppeteer or cheerio to fetch pages
  // Return combined text content
}

async function extractColorsFromHtml(html: string) {
  // Parse CSS for color values
  // Find most common colors
  // Identify primary, secondary, accent
}
```

### 3.2 taxonomy_builder_job

**File: `src/lib/jobs/taxonomy-builder.ts`**

```typescript
interface TaxonomyResult {
  districts: District[];
  role_templates: RoleTemplate[];
  scoring_rubric: ScreeningRubric;
}

export async function taxonomyBuilderJob(
  companyId: string,
  profile: BrandProfile
): Promise<TaxonomyResult> {
  const openai = new OpenAI();

  // 1. Generate districts based on profile
  const districtResponse = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{
      role: 'system',
      content: TAXONOMY_BUILDER_PROMPT
    }, {
      role: 'user',
      content: JSON.stringify({
        industry: profile.industry,
        services: profile.services,
        sub_industries: profile.sub_industries
      })
    }],
    response_format: { type: 'json_object' }
  });

  const taxonomy = JSON.parse(districtResponse.choices[0].message.content);

  // 2. Generate role templates per district
  const roleTemplates = await Promise.all(
    taxonomy.districts.map(district =>
      generateRoleTemplates(district, profile.industry)
    )
  );

  // 3. Generate scoring rubric
  const rubric = await generateScoringRubric(taxonomy, profile);

  return {
    districts: taxonomy.districts,
    role_templates: roleTemplates.flat(),
    scoring_rubric: rubric
  };
}
```

---

## 4. API ROUTES

### 4.1 Company Onboarding

**File: `src/app/api/onboarding/route.ts`**

```typescript
// POST /api/onboarding/start
// Initiates brand extraction from website
export async function POST(req: Request) {
  const { company_id, website_url } = await req.json();

  // Start async job
  const job = await brandIngestJob(website_url);

  if (job.success) {
    // Save draft profile
    await supabase
      .from('company_profiles')
      .insert({
        company_id,
        ...job.profile,
        confirmed_at: null  // Awaiting confirmation
      });

    // Generate taxonomy
    const taxonomy = await taxonomyBuilderJob(company_id, job.profile);

    return NextResponse.json({
      success: true,
      profile: job.profile,
      suggested_districts: taxonomy.districts,
      confirmation_questions: generateConfirmationQuestions(job.profile)
    });
  }
}

// POST /api/onboarding/confirm
// Finalizes company setup after user confirmation
export async function PUT(req: Request) {
  const { company_id, confirmed_profile, confirmed_districts } = await req.json();

  // Update profile as confirmed
  await supabase
    .from('company_profiles')
    .update({
      ...confirmed_profile,
      confirmed_at: new Date().toISOString()
    })
    .eq('company_id', company_id);

  // Create districts
  await supabase
    .from('company_districts')
    .insert(confirmed_districts.map((d, i) => ({
      company_id,
      ...d,
      sort_order: i
    })));

  // Mark onboarding complete
  await supabase
    .from('companies')
    .update({ onboarding_completed_at: new Date().toISOString() })
    .eq('id', company_id);

  return NextResponse.json({ success: true });
}
```

### 4.2 District CRUD

**File: `src/app/api/districts/route.ts`**

```typescript
// GET /api/districts
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const companyId = searchParams.get('company_id');

  const { data: districts } = await supabase
    .from('company_districts')
    .select('*, candidates:candidates(count), roles:roles(count)')
    .eq('company_id', companyId)
    .eq('is_active', true)
    .order('sort_order');

  // Add health status
  const enriched = districts.map(d => ({
    ...d,
    health: calculateDistrictHealth(d)
  }));

  return NextResponse.json(enriched);
}

function calculateDistrictHealth(district) {
  const shortlisted = district.candidates?.filter(c => c.status === 'shortlisted').length || 0;
  const openRoles = district.roles?.filter(r => r.status === 'open').length || 0;

  if (openRoles === 0) return 'inactive';
  if (shortlisted >= 3) return 'healthy';
  if (shortlisted >= 1) return 'attention';
  return 'urgent';
}
```

---

## 5. UI COMPONENTS

### 5.1 Theme Provider

**File: `src/components/ThemeProvider.tsx`**

```tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';

interface CompanyTheme {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoUrl: string | null;
  companyName: string;
}

const ThemeContext = createContext<CompanyTheme | null>(null);

export function ThemeProvider({
  children,
  companyId
}: {
  children: React.ReactNode;
  companyId: string;
}) {
  const [theme, setTheme] = useState<CompanyTheme | null>(null);

  useEffect(() => {
    // Fetch company profile
    fetch(`/api/company/${companyId}/profile`)
      .then(r => r.json())
      .then(profile => {
        setTheme({
          primaryColor: profile.primary_color,
          secondaryColor: profile.secondary_color,
          accentColor: profile.accent_color,
          logoUrl: profile.logo_url,
          companyName: profile.company_name
        });

        // Apply CSS variables
        document.documentElement.style.setProperty('--company-primary', profile.primary_color);
        document.documentElement.style.setProperty('--company-secondary', profile.secondary_color);
        document.documentElement.style.setProperty('--company-accent', profile.accent_color);
      });
  }, [companyId]);

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useCompanyTheme = () => useContext(ThemeContext);
```

### 5.2 District Tile Component

**File: `src/components/DistrictTile.tsx`**

```tsx
interface DistrictTileProps {
  district: District;
  candidateCount: number;
  shortlistCount: number;
  health: 'healthy' | 'attention' | 'urgent' | 'inactive';
  lastActivity: string;
  onClick: () => void;
}

export function DistrictTile({
  district,
  candidateCount,
  shortlistCount,
  health,
  lastActivity,
  onClick
}: DistrictTileProps) {
  const healthColors = {
    healthy: '#10b981',
    attention: '#f59e0b',
    urgent: '#ef4444',
    inactive: '#6b7280'
  };

  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--company-secondary)',
        borderRadius: 12,
        padding: 20,
        cursor: 'pointer',
        border: `1px solid ${healthColors[health]}20`,
        transition: 'transform 0.2s, box-shadow 0.2s'
      }}
    >
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: 12
      }}>
        <h3 style={{
          fontSize: '1rem',
          fontWeight: 600,
          color: 'white'
        }}>
          {district.name}
        </h3>
        <div style={{
          width: 10,
          height: 10,
          borderRadius: '50%',
          backgroundColor: healthColors[health]
        }} />
      </div>

      {/* Progress bar */}
      <div style={{
        height: 8,
        background: 'rgba(255,255,255,0.1)',
        borderRadius: 4,
        marginBottom: 12,
        overflow: 'hidden'
      }}>
        <div style={{
          height: '100%',
          width: `${Math.min((candidateCount / 15) * 100, 100)}%`,
          background: 'var(--company-accent)',
          borderRadius: 4
        }} />
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '0.85rem',
        color: 'rgba(255,255,255,0.7)'
      }}>
        <span>{candidateCount} candidates</span>
        <span>{shortlistCount} shortlisted</span>
      </div>

      <div style={{
        marginTop: 8,
        fontSize: '0.75rem',
        color: 'rgba(255,255,255,0.5)'
      }}>
        Last activity: {lastActivity}
      </div>
    </div>
  );
}
```

### 5.3 Dashboard Layout

**File: `src/components/DashboardLayout.tsx`**

```tsx
export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const theme = useCompanyTheme();

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: 'var(--company-primary)'
    }}>
      {/* Left Nav */}
      <nav style={{
        width: 240,
        background: 'var(--company-secondary)',
        borderRight: '1px solid rgba(255,255,255,0.1)',
        padding: 16
      }}>
        {/* Logo */}
        <div style={{ marginBottom: 32 }}>
          {theme?.logoUrl ? (
            <img src={theme.logoUrl} alt="Logo" style={{ maxWidth: 140 }} />
          ) : (
            <div style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              color: 'var(--company-accent)'
            }}>
              {theme?.companyName}
            </div>
          )}
        </div>

        {/* Nav items */}
        <NavSection title="OVERVIEW">
          <NavItem href="/dashboard" icon="grid">Dashboard</NavItem>
        </NavSection>

        <NavSection title="DISTRICTS">
          <DistrictNav />
        </NavSection>

        <NavSection title="PIPELINE">
          <NavItem href="/inbox" icon="inbox" badge={24}>Inbox</NavItem>
          <NavItem href="/shortlist" icon="star">Shortlist</NavItem>
          <NavItem href="/interviews" icon="video">Interviews</NavItem>
        </NavSection>

        <NavSection title="TOOLS">
          <NavItem href="/analytics" icon="chart">Analytics</NavItem>
          <NavItem href="/settings" icon="cog">Settings</NavItem>
        </NavSection>
      </nav>

      {/* Main content */}
      <main style={{ flex: 1, padding: 24 }}>
        {children}
      </main>
    </div>
  );
}
```

---

## 6. FILE-BY-FILE CHANGES

### New Files

| File | Purpose |
|------|---------|
| `src/lib/jobs/brand-ingest.ts` | Website crawling + brand extraction |
| `src/lib/jobs/taxonomy-builder.ts` | AI taxonomy generation |
| `src/lib/prompts/brand-extraction.ts` | AI prompt for brand analysis |
| `src/lib/prompts/taxonomy-builder.ts` | AI prompt for district generation |
| `src/app/api/onboarding/route.ts` | Onboarding flow API |
| `src/app/api/districts/route.ts` | District CRUD |
| `src/app/api/company/[id]/profile/route.ts` | Company profile API |
| `src/components/ThemeProvider.tsx` | Company theming context |
| `src/components/DistrictTile.tsx` | District card component |
| `src/components/DashboardLayout.tsx` | Main dashboard shell |
| `src/app/dashboard/page.tsx` | Town overview page |
| `src/app/dashboard/[district]/page.tsx` | District detail page |
| `src/app/onboarding/page.tsx` | Onboarding flow UI |

### Modified Files

| File | Change |
|------|--------|
| `src/lib/supabase.ts` | Add new table types |
| `src/app/layout.tsx` | Wrap with ThemeProvider |
| `src/app/api/fetch-emails/route.ts` | Add district assignment |
| `src/app/api/screen/route.ts` | Use company-specific rubric |

---

*Ship Phase 1 in 1 week. The magic is in the auto-configuration, not the features.*
