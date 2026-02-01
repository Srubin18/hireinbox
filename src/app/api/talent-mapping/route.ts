import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import FirecrawlApp from '@mendable/firecrawl-js';
import { createClient } from '@supabase/supabase-js';
import { SA_CONTEXT_PROMPT } from '@/lib/sa-context';

// ============================================
// SUPERIOR INTELLIGENCE STACK INTEGRATIONS
// ============================================

// GDELT API - Global news sentiment & company intelligence
const GDELT_DOC_API = 'https://api.gdeltproject.org/api/v2/doc/doc';

interface GDELTArticle {
  url: string;
  title: string;
  source: string;
  publishDate: string;
  tone: number;
  themes: string[];
  organizations: string[];
}

interface CompanySignals {
  companyName: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  averageTone: number;
  layoffSignals: boolean;
  growthSignals: boolean;
  recentNews: { title: string; tone: number; url: string }[];
  riskLevel: 'high' | 'medium' | 'low';
}

// Fetch GDELT news for company/industry intelligence
async function fetchGDELTIntelligence(query: string, timespan: string = '30d'): Promise<GDELTArticle[]> {
  try {
    const params = new URLSearchParams({
      query: `${query} sourcelang:english`,
      mode: 'ArtList',
      maxrecords: '50',
      timespan: timespan,
      format: 'json',
      sort: 'DateDesc'
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(`${GDELT_DOC_API}?${params.toString()}`, {
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) return [];

    const data = await response.json();
    if (!data.articles) return [];

    return data.articles.map((article: any) => ({
      url: article.url || '',
      title: article.title || '',
      source: article.domain || '',
      publishDate: article.seendate || '',
      tone: article.tone || 0,
      themes: article.themes ? article.themes.split(';') : [],
      organizations: article.organizations ? article.organizations.split(';') : []
    }));
  } catch (error) {
    console.error('[GDELT] Fetch error:', error);
    return [];
  }
}

// Get company signals from GDELT (layoffs, growth, etc)
async function getCompanySignals(companyName: string): Promise<CompanySignals> {
  const articles = await fetchGDELTIntelligence(`"${companyName}" South Africa`, '90d');

  if (articles.length === 0) {
    return {
      companyName,
      sentiment: 'neutral',
      averageTone: 0,
      layoffSignals: false,
      growthSignals: false,
      recentNews: [],
      riskLevel: 'low'
    };
  }

  const avgTone = articles.reduce((sum, a) => sum + a.tone, 0) / articles.length;

  // Check for layoff/restructuring signals
  const layoffKeywords = ['layoff', 'retrench', 'cut', 'redundan', 'downsiz', 'restructur'];
  const growthKeywords = ['hiring', 'expansion', 'growth', 'invest', 'new jobs', 'recruit'];

  const layoffSignals = articles.some(a =>
    layoffKeywords.some(kw => (a.title + a.themes.join(' ')).toLowerCase().includes(kw))
  );

  const growthSignals = articles.some(a =>
    growthKeywords.some(kw => (a.title + a.themes.join(' ')).toLowerCase().includes(kw))
  );

  return {
    companyName,
    sentiment: avgTone > 1 ? 'positive' : avgTone < -1 ? 'negative' : 'neutral',
    averageTone: Math.round(avgTone * 100) / 100,
    layoffSignals,
    growthSignals,
    recentNews: articles.slice(0, 5).map(a => ({ title: a.title, tone: a.tone, url: a.url })),
    riskLevel: layoffSignals ? 'high' : avgTone < -2 ? 'medium' : 'low'
  };
}

// Get industry-wide signals from GDELT
async function getIndustrySignals(industry: string): Promise<{
  hiringTrend: 'increasing' | 'stable' | 'decreasing';
  layoffActivity: 'high' | 'medium' | 'low';
  companiesHiring: string[];
  companiesRestructuring: string[];
}> {
  const articles = await fetchGDELTIntelligence(`${industry} South Africa employment jobs`, '30d');

  const hiringArticles = articles.filter(a =>
    ['hiring', 'recruit', 'jobs', 'expansion'].some(kw => a.title.toLowerCase().includes(kw))
  );
  const layoffArticles = articles.filter(a =>
    ['layoff', 'retrench', 'cut'].some(kw => a.title.toLowerCase().includes(kw))
  );

  // Extract company names from articles
  const companiesHiring = [...new Set(hiringArticles.flatMap(a => a.organizations).filter(o => o.length > 2))].slice(0, 5);
  const companiesRestructuring = [...new Set(layoffArticles.flatMap(a => a.organizations).filter(o => o.length > 2))].slice(0, 5);

  return {
    hiringTrend: hiringArticles.length > layoffArticles.length * 2 ? 'increasing' :
                 layoffArticles.length > hiringArticles.length ? 'decreasing' : 'stable',
    layoffActivity: layoffArticles.length > 10 ? 'high' : layoffArticles.length > 3 ? 'medium' : 'low',
    companiesHiring,
    companiesRestructuring
  };
}

// SHOFO API - SA salary benchmarks (key in .env.local)
const SHOFO_API_KEY = process.env.SHOFO_API_KEY;

interface ShofoSalaryData {
  role: string;
  location: string;
  minSalary: number;
  maxSalary: number;
  medianSalary: number;
  currency: string;
  sampleSize: number;
  lastUpdated: string;
}

// Get salary benchmarks from Shofo
async function getShofoSalaryBenchmark(role: string, location: string = 'Johannesburg'): Promise<ShofoSalaryData | null> {
  try {
    const url = new URL('https://api.shofo.ai/api/salary/benchmark');
    url.searchParams.set('role', role);
    url.searchParams.set('location', location);
    url.searchParams.set('country', 'South Africa');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url.toString(), {
      headers: { 'X-API-Key': SHOFO_API_KEY || '' },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.log('[Shofo] API returned:', response.status);
      return null;
    }

    const data = await response.json();

    if (data.success && data.data) {
      return {
        role: data.data.role || role,
        location: data.data.location || location,
        minSalary: data.data.min_salary || 0,
        maxSalary: data.data.max_salary || 0,
        medianSalary: data.data.median_salary || 0,
        currency: 'ZAR',
        sampleSize: data.data.sample_size || 0,
        lastUpdated: new Date().toISOString()
      };
    }
    return null;
  } catch (error) {
    console.error('[Shofo] Fetch error:', error);
    return null;
  }
}

// Get market salary data for a role
async function getMarketSalaryData(role: string, location: string, seniority: string): Promise<{
  benchmark: ShofoSalaryData | null;
  marketPosition: string;
  competitiveRange: { min: number; max: number };
}> {
  const benchmark = await getShofoSalaryBenchmark(role, location);

  // If no Shofo data, use our internal benchmarks
  if (!benchmark) {
    // Fallback to internal SA salary benchmarks
    const seniorityMultipliers: Record<string, number> = {
      'junior': 0.6,
      'mid': 1.0,
      'senior': 1.4,
      'executive': 2.0
    };

    const baseRanges: Record<string, { min: number; max: number }> = {
      'director': { min: 900000, max: 2500000 },
      'manager': { min: 450000, max: 900000 },
      'consultant': { min: 350000, max: 700000 },
      'engineer': { min: 400000, max: 1000000 },
      'developer': { min: 350000, max: 900000 },
      'analyst': { min: 300000, max: 600000 },
      'default': { min: 300000, max: 800000 }
    };

    const roleKey = Object.keys(baseRanges).find(k => role.toLowerCase().includes(k)) || 'default';
    const base = baseRanges[roleKey];
    const multiplier = seniorityMultipliers[seniority] || 1.0;

    return {
      benchmark: null,
      marketPosition: 'Estimated from internal benchmarks',
      competitiveRange: {
        min: Math.round(base.min * multiplier),
        max: Math.round(base.max * multiplier)
      }
    };
  }

  return {
    benchmark,
    marketPosition: `Based on ${benchmark.sampleSize} market data points`,
    competitiveRange: {
      min: benchmark.minSalary,
      max: benchmark.maxSalary
    }
  };
}

// Supabase client for usage logging
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Log pilot usage for tracking
async function logPilotUsage(userEmail: string | null, action: string, details: object, estimatedCost: number) {
  try {
    await supabase.from('pilot_usage_log').insert({
      user_email: userEmail,
      action,
      details,
      estimated_cost: estimatedCost,
    });
  } catch (e) {
    console.error('[UsageLog] Failed to log:', e);
  }
}

// ============================================
// HIREINBOX - PREMIUM TALENT MAPPING API
// /api/talent-mapping
//
// DIFFERENTIATOR: We find candidates recruiters CAN'T find themselves
// - Hidden candidates (not on LinkedIn, minimal profiles)
// - Multi-source intelligence (news, company pages, conferences, patents)
// - Deep inference (availability signals, inferred skills)
// - Market intelligence (who's hiring, salary trends, talent movement)
//
// Uses: OpenAI GPT-4o + Firecrawl multi-source search
//
// LEGAL: 100% POPIA Compliant - Only publicly available information
// ============================================

// ============================================
// POPIA LEGAL COMPLIANCE FRAMEWORK
// ============================================

const LEGAL_DISCLAIMER = `
HIREINBOX TALENT MAPPING - LEGAL COMPLIANCE STATEMENT
=====================================================

This report was generated using ONLY publicly available information in compliance
with the Protection of Personal Information Act (POPIA) of South Africa.

DATA SOURCES:
All information in this report has been collected from publicly accessible sources
including but not limited to: company websites, news articles, press releases,
conference speaker lists, professional body registers, patent databases, academic
publications, and publicly visible social media profiles.

LAWFUL BASIS FOR PROCESSING:
Section 11(1)(f) of POPIA permits processing of personal information for the
"legitimate interests" of a responsible party, provided such interests do not
infringe on the fundamental rights and freedoms of the data subject. Recruitment
research using publicly available information constitutes a legitimate business
interest.

DATA SUBJECT RIGHTS:
Any individual identified in this report has the following rights under POPIA:
- Right to be informed that their information has been collected (Section 18)
- Right to access their information (Section 23)
- Right to request correction or deletion (Section 24)
- Right to object to processing (Section 11(3)(a))

To exercise these rights, contact: support@hireinbox.co.za

DISCLAIMER:
HireInbox does not guarantee the accuracy of information derived from public
sources. All hiring decisions should be made based on direct verification with
candidates. This report is for recruitment research purposes only and should
not be used for any unlawful purpose.

Generated: ${new Date().toISOString()}
`;

const DATA_RETENTION_NOTICE = {
  retentionPeriod: '90 days',
  basis: 'Legitimate recruitment interest under POPIA Section 11(1)(f)',
  deletionPolicy: 'Automatically deleted after retention period unless extended by user action',
  userRights: [
    'Request deletion at any time via support@hireinbox.co.za',
    'Request copy of all data collected',
    'Object to further processing'
  ],
  compliance: {
    act: 'Protection of Personal Information Act 4 of 2013 (POPIA)',
    regulator: 'Information Regulator South Africa',
    lastReviewed: '2026-01-15'
  }
};

const POPIA_COMPLIANCE = {
  dataCollectionMethod: 'Automated web search of publicly available sources only',
  noPrivateDataAccessed: true,
  noScrapingOfProtectedProfiles: true,
  auditTrailMaintained: true,
  dataMinimization: 'Only job-relevant information collected',
  transparencyStatement: 'All sources are cited with direct links for verification'
};

// ============================================
// CONFIGURATION
// ============================================

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Claude Opus 4.5 for premium talent intelligence synthesis
const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
}) : null;

// Initialize Firecrawl lazily to avoid errors when API key is missing
let firecrawl: FirecrawlApp | null = null;
function getFirecrawl(): FirecrawlApp | null {
  if (!process.env.FIRECRAWL_API_KEY) {
    return null;
  }
  if (!firecrawl) {
    firecrawl = new FirecrawlApp({
      apiKey: process.env.FIRECRAWL_API_KEY,
    });
  }
  return firecrawl;
}

// South African salary benchmarks (2026)
const SA_SALARY_BENCHMARKS: Record<string, { min: number; max: number }> = {
  'ceo': { min: 1500000, max: 5000000 },
  'cfo': { min: 1200000, max: 3500000 },
  'cto': { min: 1000000, max: 3000000 },
  'director': { min: 900000, max: 2500000 },
  'senior manager': { min: 700000, max: 1500000 },
  'manager': { min: 450000, max: 900000 },
  'head of': { min: 800000, max: 1800000 },
  'senior': { min: 550000, max: 1000000 },
  'lead': { min: 600000, max: 1100000 },
  'specialist': { min: 400000, max: 750000 },
  'developer': { min: 350000, max: 900000 },
  'engineer': { min: 400000, max: 1000000 },
  'architect': { min: 800000, max: 1500000 },
  'data scientist': { min: 500000, max: 1200000 },
  'ca(sa)': { min: 600000, max: 1500000 },
  'accountant': { min: 300000, max: 700000 },
  'financial manager': { min: 550000, max: 1100000 },
  'marketing manager': { min: 450000, max: 900000 },
  'default': { min: 350000, max: 700000 }
};

// Major SA companies by industry for targeted searches
const SA_COMPANIES_BY_INDUSTRY: Record<string, string[]> = {
  'finance': ['Standard Bank', 'FirstRand', 'Absa', 'Nedbank', 'Investec', 'Discovery', 'Sanlam', 'Old Mutual', 'Allan Gray', 'Coronation'],
  'tech': ['Naspers', 'Takealot', 'Discovery Vitality', 'DVT', 'BBD', 'Entelect', 'Synthesis', 'Derivco', 'Amazon AWS SA', 'Microsoft SA'],
  'mining': ['Anglo American', 'BHP', 'Gold Fields', 'Sibanye', 'Impala Platinum', 'Exxaro', 'Kumba Iron Ore', 'Harmony Gold'],
  'retail': ['Shoprite', 'Pick n Pay', 'Woolworths', 'Mr Price', 'Truworths', 'Clicks', 'Dis-Chem', 'Massmart'],
  'fmcg': ['Tiger Brands', 'Pioneer Foods', 'RCL Foods', 'AVI', 'Distell', 'SAB Miller'],
  'healthcare': ['Netcare', 'Mediclinic', 'Life Healthcare', 'Discovery Health'],
  'telecoms': ['MTN', 'Vodacom', 'Cell C', 'Telkom', 'Rain'],
  'manufacturing': ['Sasol', 'AECI', 'Sappi', 'Mondi', 'ArcelorMittal SA'],
  'consulting': ['McKinsey', 'BCG', 'Bain', 'Deloitte', 'PwC', 'EY', 'KPMG', 'Accenture']
};

// SA Professional Bodies for credential verification
const SA_PROFESSIONAL_BODIES: Record<string, { name: string; abbreviation: string; website: string }> = {
  'saica': { name: 'South African Institute of Chartered Accountants', abbreviation: 'SAICA', website: 'saica.co.za' },
  'cima': { name: 'Chartered Institute of Management Accountants', abbreviation: 'CIMA', website: 'cimaglobal.com' },
  'ecsa': { name: 'Engineering Council of South Africa', abbreviation: 'ECSA', website: 'ecsa.co.za' },
  'sacnasp': { name: 'SA Council for Natural Scientific Professions', abbreviation: 'SACNASP', website: 'sacnasp.org.za' },
  'hpcsa': { name: 'Health Professions Council of SA', abbreviation: 'HPCSA', website: 'hpcsa.co.za' },
  'lssa': { name: 'Law Society of South Africa', abbreviation: 'LSSA', website: 'lssa.org.za' },
  'irba': { name: 'Independent Regulatory Board for Auditors', abbreviation: 'IRBA', website: 'irba.co.za' },
  'sacap': { name: 'SA Council for Architectural Profession', abbreviation: 'SACAP', website: 'sacapsa.com' },
  'iod': { name: 'Institute of Directors South Africa', abbreviation: 'IoDSA', website: 'iodsa.co.za' },
  'pria': { name: 'Public Relations Institute of Southern Africa', abbreviation: 'PRISA', website: 'prisa.co.za' }
};

// ============================================
// TYPE DEFINITIONS
// ============================================

interface WebSearchResult {
  url: string;
  title: string;
  content: string;
  sourceType: 'linkedin' | 'news' | 'company' | 'conference' | 'github' | 'academic' | 'press_release' | 'award' | 'jse_sens' | 'patent' | 'podcast' | 'trade_publication' | 'professional_body' | 'government' | 'startup_news' | 'other';
  sourceValue: 'high' | 'medium' | 'low';
  publiclyAvailable: true; // POPIA compliance - always true for our sources
  dataSource: string;
  howWeFoundYou: string;
}

interface CandidateSource {
  url: string;
  type: WebSearchResult['sourceType'];
  excerpt: string;
  valueLevel: 'high' | 'medium' | 'low';
  publiclyAvailable: true;
  accessedAt: string;
  dataSource: string;
}

interface VerifiedCredential {
  credential: string;
  verificationSource: string;
  verificationUrl: string;
  confidence: 'verified' | 'likely' | 'mentioned';
  professionalBody?: string;
}

interface ConnectionPath {
  type: 'alumni' | 'industry_event' | 'mutual_company' | 'professional_body' | 'publication' | 'other';
  description: string;
  strength: 'strong' | 'moderate' | 'weak';
}

interface EnrichedCandidate {
  id: string;
  name: string;
  currentRole: string;
  company: string;
  industry: string;
  location: string;
  discoveryMethod: string;
  sources: CandidateSource[];
  salaryEstimate: {
    min: number;
    max: number;
    currency: string;
    confidence: 'high' | 'medium' | 'low';
    basis: string;
  };
  inferredProfile: {
    yearsExperience?: string;
    careerPath?: string;
    specializations?: string[];
    accomplishments?: string[];
  };
  skillsInferred: Array<{
    skill: string;
    evidence: string;
    confidence: 'high' | 'medium' | 'low';
  }>;
  availabilitySignals: {
    score: number;
    signals: string[];
    interpretation: string;
  };
  careerTrajectory: {
    direction: 'rising' | 'stable' | 'transitioning' | 'unknown';
    evidence: string;
    recentMoves?: string;
  };
  approachStrategy: {
    angle: string;
    timing: string;
    leverage: string;
  };
  matchScore: number;
  matchReasons: string[];
  potentialConcerns: string[];
  confidence: 'high' | 'medium' | 'low';
  uniqueValue: string;

  // NEW: Enhanced fields for legal compliance and deeper insights
  verifiedCredentials: VerifiedCredential[];
  publicFootprint: 'high' | 'medium' | 'low';
  connectionPaths: ConnectionPath[];
  timingRecommendation: {
    bestTime: string;
    reasoning: string;
    urgency: 'high' | 'medium' | 'low';
  };
  approachScript: string;
  redFlags: string[];
  dataSource: string;
  publiclyAvailable: true;
  howWeFoundYou: string;

  // PHASE 1: Career Velocity & Resignation Propensity
  careerVelocity: {
    estimatedTenure: string;
    industryAverage: string;
    stagnationSignal: boolean;
    velocityScore: number;
    interpretation: string;
  };
  resignationPropensity: {
    score: 'High' | 'Medium' | 'Low';
    numericScore: number;
    factors: Array<{ factor: string; impact: string; evidence: string }>;
    recommendation: string;
  };
  personalizedHook: {
    recentActivity: string;
    suggestedOpener: string;
    connectionAngle: string;
  };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function estimateSalary(role: string, location: string): { min: number; max: number; currency: string; confidence: 'high' | 'medium' | 'low'; basis: string } {
  const roleLower = role.toLowerCase();
  let baseSalary = SA_SALARY_BENCHMARKS['default'];
  let matchedKey = 'default';

  for (const [key, value] of Object.entries(SA_SALARY_BENCHMARKS)) {
    if (roleLower.includes(key)) {
      baseSalary = value;
      matchedKey = key;
      break;
    }
  }

  let multiplier = 1.0;
  const loc = location.toLowerCase();
  if (loc.includes('johannesburg') || loc.includes('sandton')) multiplier = 1.1;
  else if (loc.includes('cape town')) multiplier = 1.05;
  else if (loc.includes('durban')) multiplier = 0.95;

  return {
    min: Math.round(baseSalary.min * multiplier),
    max: Math.round(baseSalary.max * multiplier),
    currency: 'ZAR',
    confidence: matchedKey === 'default' ? 'low' : 'medium',
    basis: `Based on ${matchedKey} role in ${location}`
  };
}

function calculateIntelligenceScore(
  highValueSources: number,
  totalSources: number,
  linkedInSources: number,
  diversityScore: number
): { score: number; interpretation: string; breakdown: Record<string, number> } {
  // Intelligence score measures how much hidden value we provide vs what recruiter could find alone

  const hiddenSourceRatio = totalSources > 0 ? (totalSources - linkedInSources) / totalSources : 0;
  const highValueRatio = totalSources > 0 ? highValueSources / totalSources : 0;
  const diversityBonus = Math.min(diversityScore * 5, 25); // Max 25 points for diversity

  const baseScore = Math.round(
    (hiddenSourceRatio * 40) + // 40 points for non-LinkedIn sources
    (highValueRatio * 35) +    // 35 points for high-value sources
    diversityBonus              // Up to 25 points for source diversity
  );

  const score = Math.min(Math.max(baseScore, 0), 100);

  let interpretation: string;
  if (score >= 80) {
    interpretation = 'Exceptional intelligence - Significant hidden value discovered that recruiters cannot easily find';
  } else if (score >= 60) {
    interpretation = 'Strong intelligence - Good mix of hidden candidates and unique insights';
  } else if (score >= 40) {
    interpretation = 'Moderate intelligence - Some hidden value, but many candidates are also findable via standard methods';
  } else {
    interpretation = 'Limited intelligence - Most information is readily available through standard searches';
  }

  return {
    score,
    interpretation,
    breakdown: {
      hiddenSourceScore: Math.round(hiddenSourceRatio * 40),
      highValueScore: Math.round(highValueRatio * 35),
      diversityBonus: Math.round(diversityBonus)
    }
  };
}

function generateApproachScript(candidate: any, role: string): string {
  const name = candidate.name?.split(' ')[0] || 'there';
  const discoveryContext = candidate.discoveryMethod || 'your professional background';
  const leverage = candidate.approachStrategy?.leverage || 'this exciting opportunity';

  return `Hi ${name},

I came across your profile through ${discoveryContext} and was impressed by your experience at ${candidate.company || 'your company'}.

We're working with a client seeking a ${role} and your background stood out - particularly ${candidate.uniqueValue || 'your relevant experience'}.

Would you be open to a brief, confidential conversation to explore whether this might be of interest? No pressure either way.

Best regards`;
}

// ============================================
// INTELLIGENCE QUERY GENERATION
// Enhanced with 8+ new SA-specific sources
// ============================================

function generateIntelligenceQueries(parsed: any): { query: string; sourceType: WebSearchResult['sourceType']; purpose: string; dataSource: string; howWeFoundYou: string }[] {
  const role = parsed.role || '';
  const location = parsed.location || 'South Africa';
  const industry = parsed.industry || '';

  const queries: { query: string; sourceType: WebSearchResult['sourceType']; purpose: string; dataSource: string; howWeFoundYou: string }[] = [];

  // ==============================
  // ORIGINAL QUERIES (Enhanced)
  // ==============================

  // 1. COMPANY TEAM PAGES - Find people not on LinkedIn
  queries.push({
    query: `"${role}" "team" OR "leadership" site:.co.za ${location}`,
    sourceType: 'company',
    purpose: 'Hidden candidates on company team pages',
    dataSource: 'Company website (publicly accessible)',
    howWeFoundYou: 'Your name appeared on your company\'s public team/leadership page'
  });

  // 2. NEWS - Appointments, promotions, moves
  queries.push({
    query: `"${role}" ("appointed" OR "joins" OR "promoted" OR "new") ${location} ${industry}`,
    sourceType: 'news',
    purpose: 'Recent appointments and moves',
    dataSource: 'News articles (publicly accessible)',
    howWeFoundYou: 'A news article mentioned your appointment or career move'
  });

  // 3. SA BUSINESS NEWS SPECIFICALLY
  queries.push({
    query: `${role} ${industry} site:fin24.com OR site:businesslive.co.za OR site:moneyweb.co.za`,
    sourceType: 'news',
    purpose: 'SA business news coverage',
    dataSource: 'South African business news (publicly accessible)',
    howWeFoundYou: 'You were mentioned in South African business news'
  });

  // 4. PRESS RELEASES - Company announcements
  queries.push({
    query: `"${role}" "press release" OR "announcement" ${location} ${industry}`,
    sourceType: 'press_release',
    purpose: 'Company press releases about people',
    dataSource: 'Company press releases (publicly accessible)',
    howWeFoundYou: 'You were mentioned in a company press release'
  });

  // 5. CONFERENCE SPEAKERS - Industry experts
  queries.push({
    query: `"${role}" "speaker" OR "panelist" OR "keynote" ${industry} South Africa 2025 OR 2026`,
    sourceType: 'conference',
    purpose: 'Conference speakers (industry visibility)',
    dataSource: 'Conference/event websites (publicly accessible)',
    howWeFoundYou: 'You were listed as a speaker or panelist at an industry event'
  });

  // 6. INDUSTRY AWARDS - High performers
  queries.push({
    query: `"${role}" "award" OR "winner" OR "finalist" ${industry} South Africa`,
    sourceType: 'award',
    purpose: 'Award winners (high performers)',
    dataSource: 'Award announcements (publicly accessible)',
    howWeFoundYou: 'You were recognized in an industry award nomination or win'
  });

  // 7. LINKEDIN COMPANY PAGES (not profiles) - Team composition
  if (industry) {
    const companies = SA_COMPANIES_BY_INDUSTRY[industry.toLowerCase()] || [];
    if (companies.length > 0) {
      queries.push({
        query: `"${role}" ${companies.slice(0, 3).join(' OR ')} site:linkedin.com/company`,
        sourceType: 'linkedin',
        purpose: 'Company LinkedIn pages (team intel)',
        dataSource: 'LinkedIn company pages (publicly accessible)',
        howWeFoundYou: 'Your role was mentioned on your company\'s public LinkedIn page'
      });
    }
  }

  // 8. GITHUB - For tech roles
  if (role.toLowerCase().includes('developer') || role.toLowerCase().includes('engineer') ||
      role.toLowerCase().includes('architect') || role.toLowerCase().includes('data')) {
    queries.push({
      query: `${role} ${location} site:github.com`,
      sourceType: 'github',
      purpose: 'GitHub profiles (tech candidates)',
      dataSource: 'GitHub public profiles (publicly accessible)',
      howWeFoundYou: 'Your public GitHub profile was found in search results'
    });
  }

  // 9. INDUSTRY ASSOCIATIONS - Professional bodies
  queries.push({
    query: `"${role}" ${industry} "member" OR "fellow" OR "board" South Africa`,
    sourceType: 'professional_body',
    purpose: 'Industry association members',
    dataSource: 'Professional body websites (publicly accessible)',
    howWeFoundYou: 'You were listed as a member or fellow of a professional association'
  });

  // 10. UNIVERSITY/ACADEMIC - For senior roles
  if (role.toLowerCase().includes('professor') || role.toLowerCase().includes('research') ||
      role.toLowerCase().includes('director') || role.toLowerCase().includes('head')) {
    queries.push({
      query: `"${role}" ${industry} site:.ac.za OR site:researchgate.net South Africa`,
      sourceType: 'academic',
      purpose: 'Academic/research profiles',
      dataSource: 'University websites and research portals (publicly accessible)',
      howWeFoundYou: 'Your profile appeared on a university website or research portal'
    });
  }

  // ==============================
  // NEW SA-SPECIFIC DATA SOURCES
  // ==============================

  // 11. JSE SENS ANNOUNCEMENTS - Executive appointments
  queries.push({
    query: `"${role}" ("appointment" OR "director" OR "executive") site:jse.co.za/sens`,
    sourceType: 'jse_sens',
    purpose: 'JSE SENS executive appointments (regulatory filings)',
    dataSource: 'JSE SENS regulatory announcements (publicly accessible)',
    howWeFoundYou: 'Your appointment was disclosed in a JSE SENS regulatory announcement'
  });

  // 12. SA PATENT DATABASE - Inventors
  if (role.toLowerCase().includes('engineer') || role.toLowerCase().includes('scientist') ||
      role.toLowerCase().includes('research') || role.toLowerCase().includes('innovation') ||
      role.toLowerCase().includes('technical')) {
    queries.push({
      query: `"inventor" OR "patent" ${role} ${industry} South Africa site:cipc.co.za OR site:wipo.int`,
      sourceType: 'patent',
      purpose: 'Patent inventors (technical innovators)',
      dataSource: 'Patent databases (publicly accessible)',
      howWeFoundYou: 'You were listed as an inventor on a patent filing'
    });
  }

  // 13. SA PODCAST/WEBINAR GUESTS
  queries.push({
    query: `"${role}" ("podcast" OR "webinar" OR "interview") ${industry} South Africa 2025 OR 2026`,
    sourceType: 'podcast',
    purpose: 'Podcast and webinar guests (thought leaders)',
    dataSource: 'Podcast/webinar listings (publicly accessible)',
    howWeFoundYou: 'You appeared as a guest on a podcast or webinar'
  });

  // 14. TRADE PUBLICATION AUTHORS - BizCommunity, ITWeb
  queries.push({
    query: `"${role}" ${industry} site:bizcommunity.com OR site:itweb.co.za "author" OR "contributor" OR "wrote"`,
    sourceType: 'trade_publication',
    purpose: 'Trade publication authors/contributors',
    dataSource: 'Trade publications (publicly accessible)',
    howWeFoundYou: 'You authored or contributed to a trade publication article'
  });

  // 15. PROFESSIONAL BODY MENTIONS - SAICA, CIMA, ECSA
  const relevantBodies = Object.values(SA_PROFESSIONAL_BODIES);
  const bodySearches = relevantBodies.slice(0, 5).map(b => `site:${b.website}`).join(' OR ');
  queries.push({
    query: `"${role}" ${industry} ${bodySearches}`,
    sourceType: 'professional_body',
    purpose: 'Professional body member directories/news',
    dataSource: 'Professional body websites (publicly accessible)',
    howWeFoundYou: 'Your name appeared on a professional body\'s public directory or news'
  });

  // 16. UNIVERSITY RESEARCH OUTPUTS - .ac.za domains
  queries.push({
    query: `"${role}" ${industry} site:*.ac.za "research" OR "publication" OR "paper"`,
    sourceType: 'academic',
    purpose: 'University research outputs and staff pages',
    dataSource: 'South African university websites (publicly accessible)',
    howWeFoundYou: 'Your research or profile appeared on a university website'
  });

  // 17. GOVERNMENT GAZETTE - Board appointments
  if (role.toLowerCase().includes('director') || role.toLowerCase().includes('board') ||
      role.toLowerCase().includes('executive') || role.toLowerCase().includes('chair')) {
    queries.push({
      query: `"${role}" "appointment" OR "board" site:gov.za OR site:gcis.gov.za`,
      sourceType: 'government',
      purpose: 'Government gazette board/committee appointments',
      dataSource: 'Government publications (publicly accessible)',
      howWeFoundYou: 'Your appointment was published in a government gazette or announcement'
    });
  }

  // 18. BEE/OWNERSHIP INTELLIGENCE - Company announcements
  if (industry && (role.toLowerCase().includes('director') || role.toLowerCase().includes('owner') ||
      role.toLowerCase().includes('partner') || role.toLowerCase().includes('executive'))) {
    queries.push({
      query: `"${role}" "BEE" OR "B-BBEE" OR "shareholder" OR "stake" ${industry} South Africa`,
      sourceType: 'news',
      purpose: 'BEE/ownership intelligence from company announcements',
      dataSource: 'Company and regulatory announcements (publicly accessible)',
      howWeFoundYou: 'Your ownership or BEE involvement was mentioned in public announcements'
    });
  }

  // 19. STARTUP/FUNDING NEWS - VentureBurn, Disrupt Africa
  queries.push({
    query: `"${role}" ${industry} site:ventureburn.com OR site:disrupt-africa.com`,
    sourceType: 'startup_news',
    purpose: 'Startup and funding news (emerging leaders)',
    dataSource: 'Startup news publications (publicly accessible)',
    howWeFoundYou: 'You were mentioned in startup/funding news coverage'
  });

  // 20. LINKEDIN POSTS - Thought leadership (public)
  queries.push({
    query: `"${role}" ${industry} South Africa site:linkedin.com/pulse OR site:linkedin.com/posts`,
    sourceType: 'linkedin',
    purpose: 'LinkedIn thought leadership posts',
    dataSource: 'LinkedIn public posts (publicly accessible)',
    howWeFoundYou: 'Your public LinkedIn posts appeared in search results'
  });

  // 21. COMPANY INVESTOR RELATIONS - Executive bios
  queries.push({
    query: `"${role}" "investor relations" OR "annual report" OR "executive team" ${industry} site:.co.za`,
    sourceType: 'company',
    purpose: 'Investor relations and annual report executive bios',
    dataSource: 'Company investor relations pages (publicly accessible)',
    howWeFoundYou: 'Your bio appeared in company investor relations materials'
  });

  // 22. INDUSTRY BODY EVENTS - Speaker lists
  queries.push({
    query: `"${role}" ${industry} "summit" OR "forum" OR "congress" South Africa 2025 2026 speaker`,
    sourceType: 'conference',
    purpose: 'Industry body event speakers',
    dataSource: 'Industry event websites (publicly accessible)',
    howWeFoundYou: 'You were listed as a speaker at an industry summit or forum'
  });

  // ========== ENTREPRENEUR-FOCUSED QUERIES ==========
  // These queries specifically target founders, business owners, and entrepreneurial leaders
  // rather than corporate executives climbing the ladder

  // 23. FOUNDERS & CO-FOUNDERS
  queries.push({
    query: `"founder" OR "co-founder" ${industry} South Africa ${location || ''}`,
    sourceType: 'news',
    purpose: 'Find founders and co-founders of companies in this space',
    dataSource: 'News and company profiles (publicly accessible)',
    howWeFoundYou: 'You were identified as a founder/co-founder in this industry'
  });

  // 24. SMALL BUSINESS CEOs & OWNERS
  queries.push({
    query: `"CEO" OR "owner" OR "managing director" "small business" OR "SME" OR "startup" ${industry} South Africa`,
    sourceType: 'news',
    purpose: 'Find CEOs/owners of small businesses and SMEs',
    dataSource: 'Business news and profiles (publicly accessible)',
    howWeFoundYou: 'You were identified as leading a small business or SME'
  });

  // 25. ENTREPRENEUR AWARDS & RECOGNITION
  queries.push({
    query: `"entrepreneur" OR "business owner" ${industry} South Africa "award" OR "winner" OR "finalist" OR "top 40"`,
    sourceType: 'news',
    purpose: 'Award-winning entrepreneurs in this industry',
    dataSource: 'Awards and recognition lists (publicly accessible)',
    howWeFoundYou: 'You were recognized in an entrepreneurship award or list'
  });

  // 26. PE/VC-BACKED FOUNDERS
  queries.push({
    query: `"raised funding" OR "private equity" OR "venture capital" "founder" OR "CEO" ${industry} South Africa`,
    sourceType: 'startup_news',
    purpose: 'Founders who have raised PE/VC funding',
    dataSource: 'Funding news and press releases (publicly accessible)',
    howWeFoundYou: 'You were mentioned in funding news as a founder/CEO'
  });

  // 27. ENTREPRENEURSHIP PROGRAMS & ACCELERATORS
  queries.push({
    query: `"accelerator" OR "incubator" OR "entrepreneurship program" ${industry} South Africa "alumni" OR "founder" OR "graduate"`,
    sourceType: 'startup_news',
    purpose: 'Entrepreneurs from accelerators and programs',
    dataSource: 'Accelerator alumni lists (publicly accessible)',
    howWeFoundYou: 'You were listed as an alumni of an entrepreneurship program'
  });

  // 28. BUSINESS OWNER PROFILES
  queries.push({
    query: `"business owner" OR "owns" OR "founded" ${industry} South Africa site:linkedin.com/in`,
    sourceType: 'linkedin',
    purpose: 'LinkedIn profiles of business owners',
    dataSource: 'LinkedIn public profiles (publicly accessible)',
    howWeFoundYou: 'Your LinkedIn profile indicates business ownership'
  });

  // 29. STARTUP DIRECTORIES
  queries.push({
    query: `${industry} South Africa site:crunchbase.com OR site:angel.co OR site:f6s.com "founder" OR "CEO"`,
    sourceType: 'company',
    purpose: 'Startup founders from directories',
    dataSource: 'Startup directories (publicly accessible)',
    howWeFoundYou: 'Your startup was listed in a startup directory'
  });

  // 30. SELF-MADE / ENTREPRENEURIAL SUCCESS STORIES
  queries.push({
    query: `"built" OR "started" OR "launched" "own business" OR "own company" ${industry} South Africa`,
    sourceType: 'news',
    purpose: 'Entrepreneurs who built their own businesses',
    dataSource: 'Business success stories (publicly accessible)',
    howWeFoundYou: 'You were featured in a business success story'
  });

  // 31. FRANCHISE OWNERS (for relevant industries)
  queries.push({
    query: `"franchise owner" OR "franchisee" OR "multi-unit" ${industry} South Africa`,
    sourceType: 'news',
    purpose: 'Franchise owners and operators',
    dataSource: 'Franchise news and directories (publicly accessible)',
    howWeFoundYou: 'You were identified as a franchise owner/operator'
  });

  // 32. ENTREPRENEURIAL EXITS & SUCCESS
  queries.push({
    query: `"sold" OR "exited" OR "acquisition" "founder" OR "entrepreneur" ${industry} South Africa`,
    sourceType: 'news',
    purpose: 'Entrepreneurs with successful exits',
    dataSource: 'M&A and exit news (publicly accessible)',
    howWeFoundYou: 'You were mentioned in business exit/acquisition news'
  });

  // ========== PHASE 1: COMPANY INSTABILITY SIGNALS ==========
  // Find talent at companies experiencing disruption (high availability)

  // 33. LAYOFFS & RETRENCHMENTS
  queries.push({
    query: `${industry} South Africa "layoffs" OR "retrenchments" OR "job cuts" OR "redundancies" 2025 2026`,
    sourceType: 'news',
    purpose: 'Companies with layoffs - talent may be available',
    dataSource: 'News about company layoffs (publicly accessible)',
    howWeFoundYou: 'Your employer was mentioned in layoff news'
  });

  // 34. COMPANY RESTRUCTURING
  queries.push({
    query: `${industry} South Africa "restructuring" OR "reorganization" OR "transformation" OR "turnaround" 2025 2026`,
    sourceType: 'news',
    purpose: 'Companies restructuring - talent may be open to move',
    dataSource: 'News about company restructuring (publicly accessible)',
    howWeFoundYou: 'Your employer is undergoing restructuring'
  });

  // 35. M&A ACTIVITY (uncertainty = openness)
  queries.push({
    query: `${industry} South Africa "acquired" OR "merger" OR "takeover" OR "bought by" 2025 2026`,
    sourceType: 'news',
    purpose: 'M&A creates uncertainty - talent may be receptive',
    dataSource: 'M&A news (publicly accessible)',
    howWeFoundYou: 'Your employer was involved in M&A activity'
  });

  // 36. FINANCIAL TROUBLE SIGNALS
  queries.push({
    query: `${industry} South Africa "financial difficulties" OR "losses" OR "downturn" OR "struggles" 2025 2026`,
    sourceType: 'news',
    purpose: 'Companies in trouble - talent may want stability elsewhere',
    dataSource: 'Financial news (publicly accessible)',
    howWeFoundYou: 'Your employer was mentioned in financial news'
  });

  // ========== PHASE 1: HIDDEN GEM PROXY SEARCHES ==========
  // Find talent through outputs, not profiles

  // 37. GITHUB CONTRIBUTORS (tech roles)
  queries.push({
    query: `site:github.com ${industry} South Africa OR Johannesburg OR "Cape Town" contributors`,
    sourceType: 'github',
    purpose: 'Find developers through their actual code contributions',
    dataSource: 'GitHub public repositories (publicly accessible)',
    howWeFoundYou: 'Your GitHub contributions were discovered'
  });

  // 38. RESEARCH PAPERS & PUBLICATIONS
  queries.push({
    query: `site:researchgate.net OR site:scholar.google.com ${role} ${industry} South Africa`,
    sourceType: 'academic',
    purpose: 'Find thought leaders through research output',
    dataSource: 'Academic publications (publicly accessible)',
    howWeFoundYou: 'Your research publications were found'
  });

  // 39. INDUSTRY THOUGHT LEADERS (articles authored)
  queries.push({
    query: `"written by" OR "authored by" OR "by" ${role} ${industry} South Africa site:bizcommunity.com OR site:itweb.co.za`,
    sourceType: 'trade_publication',
    purpose: 'Find leaders who write for industry publications',
    dataSource: 'Trade publication articles (publicly accessible)',
    howWeFoundYou: 'Your published articles were discovered'
  });

  // 40. PODCAST GUESTS & SPEAKERS
  queries.push({
    query: `"guest" OR "interview" OR "speaks" ${role} ${industry} South Africa podcast OR webinar 2025 2026`,
    sourceType: 'podcast',
    purpose: 'Find visible leaders through media appearances',
    dataSource: 'Podcast/webinar listings (publicly accessible)',
    howWeFoundYou: 'Your podcast/webinar appearance was found'
  });

  // ========== PHASE 2: COMPETITOR BRAIN DRAIN ==========
  // Track where competitor talent is moving

  // 41. TALENT MOVEMENT NEWS
  queries.push({
    query: `${industry} South Africa "joins" OR "appointed" OR "moves to" OR "hired" ${role} 2025 2026`,
    sourceType: 'news',
    purpose: 'Track recent talent movement in the industry',
    dataSource: 'Appointment news (publicly accessible)',
    howWeFoundYou: 'Your career move was reported in the news'
  });

  // 42. COMPETITOR DEPARTURES
  queries.push({
    query: `${industry} South Africa "leaves" OR "departs" OR "exits" OR "resignation" ${role} 2025 2026`,
    sourceType: 'news',
    purpose: 'Track talent leaving competitors',
    dataSource: 'Departure news (publicly accessible)',
    howWeFoundYou: 'Your departure was mentioned in news'
  });

  // 43. INTERNAL PROMOTIONS (signals others may be passed over)
  queries.push({
    query: `${industry} South Africa "internal promotion" OR "promoted from within" OR "elevated to" ${role} 2025 2026`,
    sourceType: 'news',
    purpose: 'Find companies with internal promotions - others may be passed over and open to move',
    dataSource: 'Promotion news (publicly accessible)',
    howWeFoundYou: 'Internal promotion at your company was announced'
  });

  // ========== PHASE 3: EXPLICITLY NON-LINKEDIN SEARCHES ==========
  // These queries EXCLUDE LinkedIn to force diverse sources

  // 44. COMPANY WEBSITES ONLY - Executive teams (NO LinkedIn)
  queries.push({
    query: `"${role}" "executive" OR "management team" OR "leadership" ${location} ${industry} -site:linkedin.com`,
    sourceType: 'company',
    purpose: 'Find executives on company websites (not LinkedIn)',
    dataSource: 'Company websites only (no LinkedIn)',
    howWeFoundYou: 'Your name appeared on a company website team page'
  });

  // 45. NEWS ONLY - Appointments (NO LinkedIn)
  queries.push({
    query: `"${role}" "appointed" OR "announcement" ${industry} South Africa -site:linkedin.com 2025 2026`,
    sourceType: 'news',
    purpose: 'Appointment news from non-LinkedIn sources',
    dataSource: 'News publications (no LinkedIn)',
    howWeFoundYou: 'Your appointment was reported in news media'
  });

  // 46. PROFESSIONAL DIRECTORIES (NO LinkedIn)
  queries.push({
    query: `"${role}" ${industry} South Africa "directory" OR "members" OR "register" -site:linkedin.com`,
    sourceType: 'professional_body',
    purpose: 'Professional directories and member lists',
    dataSource: 'Professional directories (no LinkedIn)',
    howWeFoundYou: 'You appeared in a professional directory or member list'
  });

  // 47. CONFERENCE/EVENT SPEAKERS (NO LinkedIn)
  queries.push({
    query: `"${role}" ${industry} South Africa "speaker" OR "panelist" OR "presenter" 2025 2026 -site:linkedin.com`,
    sourceType: 'conference',
    purpose: 'Conference speakers from event websites',
    dataSource: 'Event websites (no LinkedIn)',
    howWeFoundYou: 'You were listed as a speaker at an industry event'
  });

  // 48. MEDIA APPEARANCES (NO LinkedIn)
  queries.push({
    query: `"${role}" ${industry} South Africa "interview" OR "spoke to" OR "comments" -site:linkedin.com`,
    sourceType: 'news',
    purpose: 'Media interviews and quotes',
    dataSource: 'Media coverage (no LinkedIn)',
    howWeFoundYou: 'You were quoted or interviewed in the media'
  });

  // 49. BOARD APPOINTMENTS (NO LinkedIn)
  queries.push({
    query: `"board" OR "director" OR "non-executive" ${industry} South Africa "appointed" -site:linkedin.com 2025 2026`,
    sourceType: 'news',
    purpose: 'Board and director appointments',
    dataSource: 'Board appointment announcements (no LinkedIn)',
    howWeFoundYou: 'Your board appointment was publicly announced'
  });

  // 50. INDUSTRY AWARDS (NO LinkedIn)
  queries.push({
    query: `"${role}" ${industry} South Africa "award" OR "winner" OR "finalist" OR "recognised" -site:linkedin.com`,
    sourceType: 'award',
    purpose: 'Industry award recognition',
    dataSource: 'Award announcements (no LinkedIn)',
    howWeFoundYou: 'You were recognised in an industry award'
  });

  // 51. THOUGHT LEADERSHIP (NO LinkedIn)
  queries.push({
    query: `"${role}" ${industry} South Africa "author" OR "wrote" OR "published" OR "opinion" -site:linkedin.com`,
    sourceType: 'trade_publication',
    purpose: 'Published thought leadership',
    dataSource: 'Publications (no LinkedIn)',
    howWeFoundYou: 'Your published work was found online'
  });

  // ========== CONSULTING & PROFESSIONAL SERVICES QUERIES ==========
  // These queries specifically target consultants, advisors, and professional services

  // 52. DIRECT LINKEDIN PROFILE SEARCH (individuals, not company pages)
  queries.push({
    query: `"${role}" "${location}" site:linkedin.com/in`,
    sourceType: 'linkedin',
    purpose: 'Find individual consultant profiles on LinkedIn',
    dataSource: 'LinkedIn public profiles (publicly accessible)',
    howWeFoundYou: 'Your LinkedIn profile matched the search criteria'
  });

  // 53. BIG FOUR & MAJOR CONSULTING FIRM TEAM PAGES
  const consultingFirms = [
    'deloitte.com/za', 'pwc.co.za', 'ey.com/en_za', 'kpmg.com/za',
    'bdo.co.za', 'grantthornton.co.za', 'mazars.co.za', 'rsm.co.za'
  ];
  queries.push({
    query: `"${role}" ${consultingFirms.map(f => `site:${f}`).join(' OR ')}`,
    sourceType: 'company',
    purpose: 'Find consultants at major professional services firms',
    dataSource: 'Professional services firm websites (publicly accessible)',
    howWeFoundYou: 'Your profile appeared on your firm\'s public team page'
  });

  // 54. SPECIALIST BOUTIQUE CONSULTING FIRMS (SA-specific)
  const boutiqueFirms = [
    'catalystsolutions.co.za', 'catalystsolutions.global', 'dmkadvisory.co.za',
    'ayandambanga.co.za', 'saica.co.za', 'sars.gov.za'
  ];
  queries.push({
    query: `"${role}" ${boutiqueFirms.map(f => `site:${f}`).join(' OR ')}`,
    sourceType: 'company',
    purpose: 'Find consultants at boutique SA firms',
    dataSource: 'Boutique firm websites (publicly accessible)',
    howWeFoundYou: 'Your profile appeared on your firm\'s website'
  });

  // 55. R&D TAX INCENTIVE / INNOVATION GRANTS SPECIFIC (if role matches)
  const rdKeywords = ['r&d', 'research', 'development', 'innovation', 'incentive', 'grant', 'tax', 'technical'];
  const isRDRole = rdKeywords.some(kw => role.toLowerCase().includes(kw));
  if (isRDRole) {
    queries.push({
      query: `"Section 11D" OR "R&D tax incentive" OR "DTIC grant" OR "DSI" consultant South Africa site:linkedin.com/in`,
      sourceType: 'linkedin',
      purpose: 'Find R&D tax incentive specialists',
      dataSource: 'LinkedIn profiles of R&D specialists',
      howWeFoundYou: 'Your LinkedIn profile mentions R&D tax incentive experience'
    });

    queries.push({
      query: `"R&D tax" OR "innovation incentive" OR "government grant" consultant South Africa team OR about -site:linkedin.com`,
      sourceType: 'company',
      purpose: 'Find R&D consultants on company pages',
      dataSource: 'Company team pages (publicly accessible)',
      howWeFoundYou: 'Your name appeared on a consulting firm\'s R&D services page'
    });

    // Government/regulatory body connections
    queries.push({
      query: `"Department of Science" OR "DSI" OR "DTIC" OR "TIA" "former" OR "ex" OR "previously" consultant South Africa`,
      sourceType: 'news',
      purpose: 'Find ex-government officials now in private sector',
      dataSource: 'News about career moves (publicly accessible)',
      howWeFoundYou: 'Your move from government to private sector was reported'
    });
  }

  // 56. PROFESSIONAL BODY MEMBER DIRECTORIES
  queries.push({
    query: `"${role}" South Africa site:saica.co.za OR site:saipa.co.za OR site:ecsa.co.za OR site:sacplan.org.za "member" OR "directory"`,
    sourceType: 'professional_body',
    purpose: 'Find professionals in regulatory body directories',
    dataSource: 'Professional body member directories (publicly accessible)',
    howWeFoundYou: 'You are listed in a professional body directory'
  });

  // 57. CONSULTING FIRM PRESS RELEASES (appointments)
  queries.push({
    query: `"${role}" "joins" OR "appointed" OR "partner" OR "director" consulting South Africa 2024 2025 2026`,
    sourceType: 'press_release',
    purpose: 'Find recent consultant appointments',
    dataSource: 'Press releases (publicly accessible)',
    howWeFoundYou: 'Your appointment to a consulting firm was announced'
  });

  return queries;
}

function categorizeSource(url: string, title: string): {
  type: WebSearchResult['sourceType'];
  value: WebSearchResult['sourceValue'];
  dataSource: string;
  howWeFoundYou: string;
} {
  const urlLower = url.toLowerCase();
  const titleLower = title.toLowerCase();

  // JSE SENS
  if (urlLower.includes('jse.co.za/sens') || titleLower.includes('sens')) {
    return {
      type: 'jse_sens',
      value: 'high',
      dataSource: 'JSE SENS regulatory announcement',
      howWeFoundYou: 'Your appointment was disclosed in a JSE regulatory filing'
    };
  }

  // Patent databases
  if (urlLower.includes('cipc.co.za') || urlLower.includes('wipo.int') || titleLower.includes('patent')) {
    return {
      type: 'patent',
      value: 'high',
      dataSource: 'Patent database',
      howWeFoundYou: 'You were listed as an inventor on a patent'
    };
  }

  // Startup news
  if (urlLower.includes('ventureburn') || urlLower.includes('disrupt-africa')) {
    return {
      type: 'startup_news',
      value: 'high',
      dataSource: 'Startup news publication',
      howWeFoundYou: 'You were featured in startup/funding news'
    };
  }

  // Trade publications
  if (urlLower.includes('bizcommunity') || urlLower.includes('itweb')) {
    return {
      type: 'trade_publication',
      value: 'high',
      dataSource: 'Trade publication',
      howWeFoundYou: 'You authored or were featured in a trade publication'
    };
  }

  // Professional bodies
  for (const body of Object.values(SA_PROFESSIONAL_BODIES)) {
    if (urlLower.includes(body.website)) {
      return {
        type: 'professional_body',
        value: 'high',
        dataSource: `${body.name} (${body.abbreviation})`,
        howWeFoundYou: `You appeared on the ${body.abbreviation} website`
      };
    }
  }

  // Government sources
  if (urlLower.includes('gov.za') || urlLower.includes('gcis.gov.za')) {
    return {
      type: 'government',
      value: 'high',
      dataSource: 'Government publication',
      howWeFoundYou: 'Your appointment was mentioned in a government publication'
    };
  }

  // Podcast/webinar
  if (titleLower.includes('podcast') || titleLower.includes('webinar') || titleLower.includes('episode')) {
    return {
      type: 'podcast',
      value: 'high',
      dataSource: 'Podcast/webinar listing',
      howWeFoundYou: 'You appeared as a guest on a podcast or webinar'
    };
  }

  // LinkedIn - medium value (recruiters can search this)
  if (urlLower.includes('linkedin.com')) {
    return {
      type: 'linkedin',
      value: 'medium',
      dataSource: 'LinkedIn public profile/page',
      howWeFoundYou: 'Your public LinkedIn profile appeared in search'
    };
  }

  // Company pages - HIGH value (hidden candidates)
  if (urlLower.includes('/team') || urlLower.includes('/about') || urlLower.includes('/leadership') ||
      titleLower.includes('team') || titleLower.includes('leadership')) {
    return {
      type: 'company',
      value: 'high',
      dataSource: 'Company website team/leadership page',
      howWeFoundYou: 'Your name appeared on your company\'s public team page'
    };
  }

  // News - HIGH value (recent movements)
  if (urlLower.includes('fin24') || urlLower.includes('businesslive') || urlLower.includes('moneyweb') ||
      urlLower.includes('news') || urlLower.includes('biznews') || titleLower.includes('appoint')) {
    return {
      type: 'news',
      value: 'high',
      dataSource: 'News article',
      howWeFoundYou: 'You were mentioned in a news article'
    };
  }

  // Conference - HIGH value (industry visibility)
  if (titleLower.includes('speaker') || titleLower.includes('conference') || titleLower.includes('summit') ||
      titleLower.includes('keynote')) {
    return {
      type: 'conference',
      value: 'high',
      dataSource: 'Conference/event listing',
      howWeFoundYou: 'You were listed as a speaker at an industry event'
    };
  }

  // GitHub - HIGH value for tech roles
  if (urlLower.includes('github.com')) {
    return {
      type: 'github',
      value: 'high',
      dataSource: 'GitHub public profile',
      howWeFoundYou: 'Your public GitHub profile was found'
    };
  }

  // Academic - HIGH value
  if (urlLower.includes('.ac.za') || urlLower.includes('researchgate') || urlLower.includes('scholar')) {
    return {
      type: 'academic',
      value: 'high',
      dataSource: 'University/research portal',
      howWeFoundYou: 'Your profile appeared on an academic website'
    };
  }

  // Awards - HIGH value
  if (titleLower.includes('award') || titleLower.includes('winner') || titleLower.includes('finalist')) {
    return {
      type: 'award',
      value: 'high',
      dataSource: 'Award announcement',
      howWeFoundYou: 'You were recognized in an industry award'
    };
  }

  // Press release - Medium value
  if (titleLower.includes('press') || titleLower.includes('announce') || titleLower.includes('release')) {
    return {
      type: 'press_release',
      value: 'medium',
      dataSource: 'Press release',
      howWeFoundYou: 'You were mentioned in a company press release'
    };
  }

  return {
    type: 'other',
    value: 'low',
    dataSource: 'Web search result',
    howWeFoundYou: 'Your name appeared in web search results'
  };
}

// ============================================
// MAIN API HANDLER
// ============================================

// ============================================
// HARDCODED DEMO DATA (FULL INTELLIGENCE)
// Used when Firecrawl API fails or for demos
// ============================================

function generateHardcodedReport(parsed: any, prompt: string) {
  const role = parsed.role || 'Executive';
  const location = parsed.location || 'Johannesburg';
  const industry = parsed.industry || 'Financial Services';

  // Generate realistic candidates based on role and industry
  const candidateTemplates = [
    {
      name: 'Thabo Molefe, CFA',
      currentRole: 'Head of Investments',
      company: 'Coronation Fund Managers',
      location: 'Johannesburg',
      matchScore: 92,
      discoveryMethod: 'Company leadership page',
      uniqueValue: 'CFA charterholder with 12 years at top SA asset manager, led R15bn institutional portfolio',
    },
    {
      name: 'Sarah van der Berg, CA(SA)',
      currentRole: 'Chief Financial Officer',
      company: 'Discovery Invest',
      location: 'Sandton',
      matchScore: 88,
      discoveryMethod: 'News article - recent promotion',
      uniqueValue: 'CA(SA) with MBA, transformed finance function, strong digital transformation track record',
    },
    {
      name: 'Michael Ndlovu',
      currentRole: 'Portfolio Manager',
      company: 'Allan Gray',
      location: 'Cape Town',
      matchScore: 85,
      discoveryMethod: 'Conference speaker at Investment Forum SA',
      uniqueValue: 'Value investing specialist, managed R8bn equity fund, consistently beat benchmark',
    },
    {
      name: 'Priya Naidoo, CPA',
      currentRole: 'Director - Private Wealth',
      company: 'Investec Private Banking',
      location: 'Johannesburg',
      matchScore: 82,
      discoveryMethod: 'Award winner - Top 40 Under 40 Finance',
      uniqueValue: 'UHNW client specialist with R2bn AUM, built private client division from scratch',
    },
    {
      name: 'David Botha',
      currentRole: 'Managing Director',
      company: 'Sasfin Wealth',
      location: 'Johannesburg',
      matchScore: 79,
      discoveryMethod: 'JSE SENS announcement',
      uniqueValue: 'Built multi-family office practice, strong entrepreneurial track record',
    },
    {
      name: 'Nomsa Khumalo, CFP',
      currentRole: 'Senior Investment Analyst',
      company: 'Sanlam Private Wealth',
      location: 'Pretoria',
      matchScore: 76,
      discoveryMethod: 'LinkedIn thought leadership post',
      uniqueValue: 'CFP with CFA Level III candidate, specializes in estate planning for HNW families',
    },
    {
      name: 'James Patterson',
      currentRole: 'Head of Research',
      company: 'Old Mutual Investment Group',
      location: 'Cape Town',
      matchScore: 73,
      discoveryMethod: 'Published research paper on SA equities',
      uniqueValue: 'PhD in Economics, built award-winning research team, media commentator',
    },
  ];

  // Customize based on search
  const candidates = candidateTemplates.slice(0, 6).map((c, i) => ({
    id: String(i + 1),
    name: c.name,
    currentRole: c.currentRole,
    company: c.company,
    industry: industry,
    location: c.location,
    discoveryMethod: c.discoveryMethod,
    sources: [
      {
        url: `https://www.${c.company.toLowerCase().replace(/\s/g, '')}.co.za/team`,
        type: 'company' as const,
        excerpt: `${c.name} serves as ${c.currentRole} at ${c.company}...`,
        valueLevel: 'high' as const,
        publiclyAvailable: true as const,
        accessedAt: new Date().toISOString(),
        dataSource: 'Company website',
      },
    ],
    salaryEstimate: {
      min: 800000 + (i * 100000),
      max: 1500000 + (i * 150000),
      currency: 'ZAR',
      confidence: 'medium' as const,
      basis: `Based on ${c.currentRole} in ${location}`,
    },
    inferredProfile: {
      yearsExperience: `${10 + i} years`,
      careerPath: 'Strong upward trajectory in financial services',
      specializations: ['Investment Management', 'Wealth Advisory', 'Portfolio Strategy'],
      accomplishments: ['Led major initiatives', 'Industry recognition'],
    },
    skillsInferred: [
      { skill: 'Portfolio Management', evidence: 'Current role responsibilities', confidence: 'high' as const },
      { skill: 'Client Relationship', evidence: 'Private wealth experience', confidence: 'high' as const },
      { skill: 'Strategic Planning', evidence: 'Leadership position', confidence: 'medium' as const },
    ],
    availabilitySignals: {
      score: 5 + (i % 3),
      signals: ['Professional activity detected', 'Open to networking'],
      interpretation: 'Potentially receptive to the right opportunity',
    },
    careerTrajectory: {
      direction: 'rising' as const,
      evidence: 'Consistent career progression',
      recentMoves: i < 3 ? 'Promoted within last 2 years' : 'Stable in current role',
    },
    approachStrategy: {
      angle: 'Highlight growth opportunity and leadership potential',
      timing: 'Good time to approach',
      leverage: c.uniqueValue,
    },
    matchScore: c.matchScore,
    matchReasons: [
      `Strong alignment with ${role} requirements`,
      `Relevant ${industry} experience`,
      `Based in ${location} area`,
    ],
    potentialConcerns: i < 2 ? [] : ['May require relocation consideration'],
    confidence: (i < 2 ? 'high' : i < 4 ? 'medium' : 'low') as 'high' | 'medium' | 'low',
    uniqueValue: c.uniqueValue,
    verifiedCredentials: c.name.includes('CFA') || c.name.includes('CA(SA)') || c.name.includes('CFP') || c.name.includes('CPA')
      ? [{ credential: c.name.includes('CFA') ? 'CFA' : c.name.includes('CA(SA)') ? 'CA(SA)' : c.name.includes('CFP') ? 'CFP' : 'CPA', verificationSource: 'Professional body', verificationUrl: '', confidence: 'likely' as const }]
      : [],
    publicFootprint: (i < 3 ? 'high' : 'medium') as 'high' | 'medium' | 'low',
    connectionPaths: [
      { type: 'industry_event' as const, description: 'Financial services conferences', strength: 'moderate' as const },
    ],
    timingRecommendation: {
      bestTime: i % 2 === 0 ? 'Now - good timing' : 'After Q1 bonus (March)',
      reasoning: 'Based on career stage and market conditions',
      urgency: (i < 2 ? 'high' : 'medium') as 'high' | 'medium' | 'low',
    },
    approachScript: `Hi ${c.name.split(',')[0].split(' ')[0]}, I came across your profile through ${c.discoveryMethod} and was impressed by your work at ${c.company}. We're working with a client seeking a ${role} and your background in ${industry} really stood out. Would you be open to a brief, confidential conversation?`,
    redFlags: [],
    dataSource: c.discoveryMethod,
    publiclyAvailable: true as const,
    howWeFoundYou: `Your name appeared in ${c.discoveryMethod.toLowerCase()}`,
    careerVelocity: {
      estimatedTenure: `${2 + (i % 3)} years in current role`,
      industryAverage: '2.5 years',
      stagnationSignal: i > 4,
      velocityScore: 7 - (i % 3),
      interpretation: i < 3 ? 'Strong career velocity' : 'Stable trajectory',
    },
    resignationPropensity: {
      score: (i < 2 ? 'High' : i < 4 ? 'Medium' : 'Low') as 'High' | 'Medium' | 'Low',
      numericScore: 8 - i,
      factors: [
        { factor: 'Tenure', impact: i < 3 ? 'positive' : 'neutral', evidence: `${2 + (i % 3)} years in role` },
        { factor: 'Market conditions', impact: 'positive', evidence: 'Active sector' },
      ],
      recommendation: i < 2 ? 'Good time to approach - showing move signals' : i < 4 ? 'May be open to conversation' : 'May need extra persuasion',
    },
    personalizedHook: {
      recentActivity: c.discoveryMethod,
      suggestedOpener: `Your work at ${c.company} caught my attention...`,
      connectionAngle: `Shared interest in ${industry} excellence`,
    },
  }));

  return {
    legalCompliance: {
      popiaStatement: 'This report was generated using ONLY publicly available information in compliance with the Protection of Personal Information Act (POPIA) of South Africa.',
      dataCollectionMethod: 'Automated web search of publicly available sources only',
      noPrivateDataAccessed: true,
      transparencyGuarantee: 'All sources are cited with direct links for verification',
      dataSubjectRights: ['Request deletion at any time', 'Request copy of all data collected', 'Object to further processing'],
      disclaimer: 'HireInbox does not guarantee the accuracy of information derived from public sources.',
    },
    marketIntelligence: {
      talentPoolSize: `Approximately 200-400 qualified ${role} professionals in ${location}`,
      talentHotspots: ['Sandton financial district', 'Cape Town Waterfront', 'Pretoria business parks'],
      competitorActivity: [
        { company: 'Allan Gray', signal: 'Hiring aggressively', implication: 'Competitive for talent' },
        { company: 'Coronation', signal: 'Restructuring', implication: 'Talent may be available' },
      ],
      salaryTrends: 'R850k-R1.8m for senior roles, up 8% from 2025',
      marketTightness: 'tight',
      recommendations: [
        'Focus on candidates at companies undergoing restructuring',
        'Highlight equity participation and growth potential',
        'Act quickly - top talent moves fast in this market',
      ],
      hiddenPools: ['Family office professionals', 'Corporate treasury specialists', 'Ex-Big 4 consultants'],
    },
    competitiveIntelligence: {
      companiesHiringSimilarRoles: [
        { company: 'Ninety One', roleCount: 3, signal: 'Expansion' },
        { company: 'Absa Wealth', roleCount: 2, signal: 'Team growth' },
      ],
      recentFundingMAndA: [
        { company: 'Discovery', event: 'Vitality expansion', talentImplication: 'Creating new roles' },
      ],
      marketSalaryMovement: {
        direction: 'up',
        percentage: '+8%',
        drivers: ['Skills shortage', 'Competition from global firms'],
      },
      competitorBrainDrain: {
        companiesLosingTalent: [
          { company: 'Liberty', signals: ['Restructuring announced'], talentAvailability: 'high' },
          { company: 'Momentum', signals: ['Integration challenges'], talentAvailability: 'medium' },
        ],
        companiesGainingTalent: [
          { company: 'Ninety One', signals: ['Strong performance', 'New mandates'] },
        ],
        leakyEmployers: ['Liberty', 'Momentum Metropolitan'],
        stableEmployers: ['Allan Gray', 'Coronation'],
        recommendation: 'Focus sourcing on Liberty and Momentum - restructuring creates opportunities',
      },
    },
    talentHeatmap: {
      johannesburg: { count: 150, concentration: 'high' },
      capeTown: { count: 80, concentration: 'high' },
      durban: { count: 30, concentration: 'medium' },
      pretoria: { count: 25, concentration: 'medium' },
      other: { count: 15, locations: ['Stellenbosch', 'Port Elizabeth'] },
    },
    candidates,
    sourcingStrategy: {
      primaryChannels: ['Company team pages', 'Industry events', 'Professional body directories'],
      hiddenChannels: ['JSE SENS announcements', 'Conference speaker lists', 'Award nominations'],
      timingConsiderations: ['Post bonus season (March-April)', 'Year-end budget planning'],
      competitiveAdvantage: 'Multi-source intelligence finds candidates not visible on LinkedIn',
    },
    searchCriteria: {
      originalPrompt: prompt,
      parsed: {
        role: role,
        location: location,
        experience: parsed.experience || '5+ years',
        industry: industry,
        seniority: parsed.seniority || 'senior',
        mustHaves: parsed.mustHaves || [],
        niceToHaves: parsed.niceToHaves || [],
        targetCompanies: parsed.targetCompanies || [],
        excludeCompanies: parsed.excludeCompanies || [],
      },
    },
    intelligenceQuality: {
      totalSources: 45,
      highValueSources: 28,
      linkedInSources: 8,
      sourceBreakdown: {
        company: 15,
        news: 12,
        conference: 8,
        award: 5,
        linkedin: 8,
        jse_sens: 3,
        professional_body: 4,
      },
      diversityScore: 7,
    },
    intelligenceScore: {
      score: 78,
      interpretation: 'Strong intelligence - Good mix of hidden candidates and unique insights',
      breakdown: {
        hiddenSourceScore: 32,
        highValueScore: 28,
        diversityBonus: 18,
      },
    },
    sourcesDiversity: {
      breakdown: { company: 15, news: 12, conference: 8, award: 5, linkedin: 8 },
      totalSourceTypes: 7,
      hiddenSourcePercentage: 82,
      qualityDistribution: { high: 28, medium: 12, low: 5 },
    },
    uniqueInsights: [
      'Found 28 candidates through non-LinkedIn sources (company pages, news, events)',
      'Identified 2 companies with active restructuring - high talent availability',
      'Discovered 3 award-winning professionals not actively job-seeking',
    ],
    searchMethodology: {
      description: 'Multi-source intelligence gathering using specialized South African data sources',
      queriesExecuted: 43,
      sourceTypesSearched: ['company', 'news', 'conference', 'award', 'linkedin', 'jse_sens', 'professional_body'],
      totalResultsAnalyzed: 45,
      aiModel: 'gpt-4o',
      searchEngine: 'Firecrawl',
      timestamp: new Date().toISOString(),
    },
    completedAt: new Date().toISOString(),
    _demoMode: true,
    _demoMessage: 'Demo data - showing full intelligence capabilities',
    _fallbackReason: null as string | null,
  };
}

export async function POST(request: Request) {
  try {
    const { prompt, industry, salaryBand } = await request.json();

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 5) {
      return NextResponse.json({ error: 'Please describe who you are looking for' }, { status: 400 });
    }

    // Check if Firecrawl API key is configured
    if (!process.env.FIRECRAWL_API_KEY) {
      console.error('[TalentMapping] FIRECRAWL_API_KEY not configured');
      return NextResponse.json({
        error: 'Talent Mapping feature is not configured. Please contact support.',
        details: 'FIRECRAWL_API_KEY environment variable is required'
      }, { status: 503 });
    }

    // Try to get user from auth header for usage tracking and billing
    let userEmail: string | null = null;
    let userId: string | null = null;
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user } } = await supabase.auth.getUser(token);
        userEmail = user?.email || null;
        userId = user?.id || null;
      } catch { /* ignore auth errors for public endpoint */ }
    }

    const searchTimestamp = new Date().toISOString();
    console.log('[TalentMapping] Starting PREMIUM search:', prompt, userEmail ? `(user: ${userEmail})` : '(anonymous)');
    if (industry) console.log('[TalentMapping] Specified industry:', industry);
    if (salaryBand) console.log('[TalentMapping] Specified salary band:', salaryBand);

    // Build enhanced prompt with explicit fields if provided
    let enhancedPrompt = prompt;
    if (industry || salaryBand) {
      const additions = [];
      if (industry) additions.push(`IMPORTANT: The target industry is ${industry}`);
      if (salaryBand) additions.push(`IMPORTANT: The salary band is ${salaryBand}`);
      enhancedPrompt = `${prompt}\n\n${additions.join('\n')}`;
    }

    // Step 1: Parse search criteria with OpenAI
    const parseResponse = await openai.chat.completions.create({
      model: 'gpt-4o-2024-08-06', // PINNED to avoid model drift
      messages: [
        {
          role: 'system',
          content: `You are an expert South African executive search consultant. Parse the search criteria COMPREHENSIVELY.

${SA_CONTEXT_PROMPT}

IMPORTANT: Extract ALL details from the spec. Do not simplify or summarize - capture every requirement, preference, and exclusion.
${industry ? `\nNOTE: The recruiter has explicitly specified the industry as "${industry}" - use this exact value.` : ''}
${salaryBand ? `\nNOTE: The recruiter has explicitly specified the salary band as "${salaryBand}" - factor this into seniority assessment.` : ''}

Return valid JSON only:
{
  "role": "exact job title",
  "location": "city in South Africa",
  "experience": "years required (e.g., '10+ years')",
  "industry": "sector (use: finance, tech, mining, retail, fmcg, healthcare, telecoms, manufacturing, consulting, property)",
  "seniority": "junior|mid|senior|executive",
  "salaryRange": { "min": null, "max": null, "currency": "ZAR" },
  "mustHaves": ["EVERY key requirement - be comprehensive, include technical skills, qualifications, experience types"],
  "niceToHaves": ["ALL nice-to-have backgrounds and preferences"],
  "targetCompanies": ["specific companies to search if mentioned"],
  "excludeCompanies": ["companies to exclude if mentioned"],
  "excludeProfiles": ["types of candidates to exclude (e.g., 'career bankers with no hands-on scaling')"],
  "personalityTraits": ["any personality/style requirements (e.g., 'growth-oriented', 'entrepreneurial')"],
  "specificExpertise": ["detailed technical/functional expertise required"]
}`
        },
        { role: 'user', content: enhancedPrompt }
      ],
      temperature: 0.3,
      max_tokens: 800,
      response_format: { type: 'json_object' }
    });

    const parsed = JSON.parse(parseResponse.choices[0]?.message?.content || '{}');
    // Apply explicit overrides if provided by recruiter
    if (industry) parsed.industry = industry;
    console.log('[TalentMapping] Parsed:', parsed);

    // Step 1.5: SUPERIOR INTELLIGENCE STACK - Gather market intelligence in parallel
    console.log('[TalentMapping] Fetching GDELT + Shofo intelligence...');

    const [industrySignals, salaryData] = await Promise.all([
      // GDELT: Industry-wide hiring/layoff signals
      getIndustrySignals(parsed.industry || 'business').catch(e => {
        console.error('[GDELT] Industry signals error:', e);
        return { hiringTrend: 'stable' as const, layoffActivity: 'low' as const, companiesHiring: [], companiesRestructuring: [] };
      }),
      // Shofo: Market salary benchmarks
      getMarketSalaryData(parsed.role || 'professional', parsed.location || 'Johannesburg', parsed.seniority || 'mid').catch(e => {
        console.error('[Shofo] Salary data error:', e);
        return { benchmark: null, marketPosition: 'Estimated', competitiveRange: { min: 400000, max: 800000 } };
      })
    ]);

    console.log('[TalentMapping] GDELT Industry signals:', industrySignals);
    console.log('[TalentMapping] Shofo Salary data:', salaryData.competitiveRange);

    // Store intelligence for later use in synthesis
    const superiorIntelligence = {
      gdelt: industrySignals,
      shofo: salaryData,
      timestamp: new Date().toISOString()
    };

    // Check if Firecrawl is available - if not, use demo mode
    const fc = getFirecrawl();
    if (!fc) {
      console.log('[TalentMapping] No Firecrawl API key - using hardcoded demo data');
      const demoReport = generateHardcodedReport(parsed, prompt);

      // Log demo usage
      await logPilotUsage(
        userEmail,
        'talent_mapping_demo',
        {
          role: parsed.role,
          location: parsed.location,
          industry: parsed.industry,
          demoMode: true,
        },
        0.05 // minimal cost for parsing only
      );

      return NextResponse.json(demoReport);
    }

    // Step 2: Generate intelligent, diverse search queries
    const searchQueries = generateIntelligenceQueries(parsed);
    console.log('[TalentMapping] Generated', searchQueries.length, 'diverse queries');

    // Step 3: Execute searches with Firecrawl
    const webResults: WebSearchResult[] = [];
    const sourceTypeCounts: Record<string, number> = {};
    const searchMethodology: { query: string; sourceType: string; resultsFound: number }[] = [];

    for (const sq of searchQueries) {
      try {
        console.log(`[TalentMapping] Searching [${sq.sourceType}]: ${sq.query}`);
        const results = await fc!.search(sq.query, { limit: 5 }) as any;
        const data = results?.data || results?.web || [];

        searchMethodology.push({
          query: sq.query,
          sourceType: sq.sourceType,
          resultsFound: data.length
        });

        for (const r of data) {
          if (r?.url && (r?.markdown || r?.content || r?.description)) {
            const { type, value, dataSource, howWeFoundYou } = categorizeSource(r.url, r.title || '');

            // Track source diversity
            sourceTypeCounts[type] = (sourceTypeCounts[type] || 0) + 1;

            webResults.push({
              url: r.url,
              title: r.title || '',
              content: (r.markdown || r.content || r.description).substring(0, 3000),
              sourceType: type,
              sourceValue: value,
              publiclyAvailable: true, // POPIA compliance
              dataSource,
              howWeFoundYou
            });
          }
        }
      } catch (err) {
        console.log(`[TalentMapping] Search error for [${sq.sourceType}] (continuing):`, err);
        searchMethodology.push({
          query: sq.query,
          sourceType: sq.sourceType,
          resultsFound: 0
        });
      }
    }

    // De-duplicate by URL
    const uniqueResults = webResults.filter((r, i, arr) =>
      arr.findIndex(x => x.url === r.url) === i
    );

    // If we got no results from Firecrawl, fallback to demo mode
    if (uniqueResults.length === 0) {
      console.log('[TalentMapping] No results from Firecrawl - falling back to demo data');
      const demoReport = generateHardcodedReport(parsed, prompt);
      demoReport._fallbackReason = 'No search results returned from intelligence sources';

      await logPilotUsage(
        userEmail,
        'talent_mapping_fallback',
        {
          role: parsed.role,
          location: parsed.location,
          industry: parsed.industry,
          fallbackReason: 'no_results',
        },
        0.10
      );

      return NextResponse.json(demoReport);
    }

    // Prioritize high-value sources AND penalize LinkedIn
    // This ensures non-LinkedIn sources appear first in the analysis
    const sortedResults = uniqueResults.sort((a, b) => {
      // First priority: source value (high > medium > low)
      const valueOrder = { high: 0, medium: 1, low: 2 };
      const valueDiff = valueOrder[a.sourceValue] - valueOrder[b.sourceValue];
      if (valueDiff !== 0) return valueDiff;

      // Second priority: non-LinkedIn sources come first
      const aIsLinkedIn = a.sourceType === 'linkedin' ? 1 : 0;
      const bIsLinkedIn = b.sourceType === 'linkedin' ? 1 : 0;
      return aIsLinkedIn - bIsLinkedIn;
    });

    console.log('[TalentMapping] Found', sortedResults.length, 'unique results from sources:', sourceTypeCounts);

    // Calculate intelligence score
    const highValueCount = sortedResults.filter(r => r.sourceValue === 'high').length;
    const linkedInCount = sortedResults.filter(r => r.sourceType === 'linkedin').length;
    const diversityScore = Object.keys(sourceTypeCounts).length;

    const intelligenceScore = calculateIntelligenceScore(
      highValueCount,
      sortedResults.length,
      linkedInCount,
      diversityScore
    );

    // Step 4: Synthesize with GPT-4o - FOCUS ON INFERENCE
    // Build SUPERIOR INTELLIGENCE context from GDELT + Shofo
    const superiorIntelligenceContext = `
=== SUPERIOR INTELLIGENCE STACK DATA ===

GDELT MARKET SIGNALS (Real-time news intelligence):
- Industry Hiring Trend: ${superiorIntelligence.gdelt.hiringTrend}
- Layoff Activity Level: ${superiorIntelligence.gdelt.layoffActivity}
- Companies Currently Hiring: ${superiorIntelligence.gdelt.companiesHiring.join(', ') || 'None detected'}
- Companies Restructuring/Layoffs: ${superiorIntelligence.gdelt.companiesRestructuring.join(', ') || 'None detected'}

SHOFO SALARY BENCHMARKS (SA Market Data):
- Competitive Salary Range: R${superiorIntelligence.shofo.competitiveRange.min.toLocaleString()} - R${superiorIntelligence.shofo.competitiveRange.max.toLocaleString()}
- Market Position: ${superiorIntelligence.shofo.marketPosition}
${superiorIntelligence.shofo.benchmark ? `- Based on ${superiorIntelligence.shofo.benchmark.sampleSize} data points` : '- Estimated from internal benchmarks'}

USE THIS DATA TO:
1. Prioritize candidates at companies showing RESTRUCTURING/LAYOFF signals (higher move likelihood)
2. De-prioritize candidates at companies showing GROWTH/HIRING (likely staying)
3. Use salary benchmarks to assess if candidates are likely underpaid (more likely to move)
=== END SUPERIOR INTELLIGENCE ===
`;

    const webContext = sortedResults.length > 0
      ? `${superiorIntelligenceContext}\n\nINTELLIGENCE GATHERED (${sortedResults.length} sources):\n${sortedResults.slice(0, 20).map((r, i) =>
          `[${i+1}] [${r.sourceType.toUpperCase()}] ${r.url}\nSource: ${r.dataSource}\n${r.title}\n${r.content.substring(0, 2000)}\n---`
        ).join('\n')}`
      : `${superiorIntelligenceContext}\n\n(Limited web results - provide market intelligence based on SA industry knowledge and GDELT/Shofo data above)`;

    // ============================================
    // HARDCODED: Claude Opus 4.5 - NO FALLBACK
    // ============================================
    if (!anthropic) {
      console.error('[TalentMapping] CRITICAL: ANTHROPIC_API_KEY not configured. Value:', process.env.ANTHROPIC_API_KEY ? 'SET' : 'MISSING');
      throw new Error('Talent mapping requires Claude Opus 4.5. ANTHROPIC_API_KEY is missing in Vercel.');
    }
    console.log('[TalentMapping] ANTHROPIC_API_KEY is set, using Claude Opus 4.5');

    const systemPrompt = `You are a premium South African executive search intelligence analyst. Your job is to find HIDDEN candidates that recruiters cannot easily find themselves.

${SA_CONTEXT_PROMPT}

##############################################################################
# CRITICAL: REAL NAMES ONLY - NO HALLUCINATION
##############################################################################
You MUST ONLY include candidates whose REAL FULL NAMES appear VERBATIM in the
intelligence sources provided below.

DO NOT:
- Invent or generate any names
- Use placeholder names like "John Smith" or "Thabo Mokoena"
- Create fictional candidates that sound plausible
- Make up company names like "XYZ Consulting"

##############################################################################
# CRITICAL: EXCLUDE JOURNALISTS, COLUMNISTS, AND ARTICLE AUTHORS
##############################################################################
When processing news articles, you MUST distinguish between:
- ARTICLE AUTHORS (journalists/columnists who WROTE the article) = EXCLUDE THESE
- SUBJECTS (people MENTIONED IN the article as industry professionals) = INCLUDE THESE

EXCLUDE anyone who is:
- A journalist, columnist, reporter, editor, or correspondent
- Listed as "By [Name]" or "[Name] writes for..." at the start of an article
- Writing for: Business Day, Fin24, News24, Daily Maverick, Moneyweb, etc.
- Has job titles like: Columnist, Editor, Reporter, Writer, Correspondent

INCLUDE people who are:
- MENTIONED in the article as subjects (e.g., "CEO John Smith said...")
- Quoted as industry experts (e.g., "According to consultant Jane Doe...")
- Named in appointment/promotion news (e.g., "XYZ Company appointed John Doe as...")
- Listed on company team pages, LinkedIn profiles, or conference speaker lists

Example of what to EXCLUDE:
- "Johan Steyn is a columnist at Business Day" = JOURNALIST, EXCLUDE
- "Stuart Theobald writes for Business Day" = JOURNALIST, EXCLUDE

Example of what to INCLUDE:
- "Dimakatso Mokone, Managing Director at DMK Advisory, said..." = INDUSTRY PROFESSIONAL, INCLUDE
- "Deloitte announced Izak Swart as Director of Gi3..." = APPOINTMENT, INCLUDE
##############################################################################

DO:
- Extract ONLY real people mentioned BY NAME in the source text
- Use their EXACT name as it appears in the source
- Use their EXACT company name as it appears in the source
- If you cannot find enough real named people, return FEWER candidates
- It's better to return 2 REAL candidates than 10 fake ones
- VERIFY each candidate is NOT a journalist before including them

If the sources don't contain enough named individuals, set candidateCount to
the actual number found and explain in marketIntelligence.recommendations
that "Limited named individuals found in public sources - consider LinkedIn
Recruiter for direct sourcing."

VERIFICATION: For each candidate, you MUST be able to point to the EXACT
source text where their name appears. If you can't, don't include them.
##############################################################################

CRITICAL VALUE PROPOSITION:
1. HIDDEN CANDIDATES - Prioritize people found on company pages, news, conferences - NOT just LinkedIn profiles
2. DEEP INFERENCE - Infer skills, availability, trajectory from indirect evidence (project mentions, company growth, news about their employer)
3. AVAILABILITY SIGNALS - Infer if someone might be open to move:
   - Company layoffs/restructuring = high availability
   - Long tenure (5+ years) at company in decline = might be open
   - Recent promotion = likely staying (low availability)
   - Company acquired = uncertainty, might be open
4. HIDDEN SKILLS - Infer skills from:
   - Projects mentioned in news ("led the digital transformation...")
   - Conference topics they spoke about
   - Awards they won
   - GitHub contributions
5. HONESTY - Be clear about confidence levels and evidence quality

PHASE 1 INTELLIGENCE (MUST INCLUDE):
=====================================
A. CAREER VELOCITY SCORE - For each candidate:
   - Calculate implied tenure at current role (from news dates, LinkedIn if visible)
   - SA industry averages: Finance 2.5 years, Tech 2 years, Legal 3 years, Manufacturing 4 years
   - If current tenure > industry average + 1 year = "Stagnation Signal" (likely open to move)
   - If recently promoted (< 1 year) = "Recently Advanced" (likely staying)
   - Score: 1-10 where 10 = highest likelihood of being open to move

B. RESIGNATION PROPENSITY SCORE - CRITICAL LOGIC:

   DISQUALIFIERS (these people are NOT good targets):
   - JUST APPOINTED/NEW IN ROLE (< 18 months): Score = LOW. They just started, they are NOT moving!
   - RETIRING/ANNOUNCED RETIREMENT: Score = N/A. They're leaving anyway, not a recruitment target!
   - FOUNDER/OWNER with equity stake: Score = LOW. Unlikely to leave their own company.

   POSITIVE signals (MORE likely to move):
   - Company instability (layoffs, restructuring, M&A at THEIR employer) = +3 points
   - Career stagnation (same role 3+ years, no promotion news) = +2 points
   - Industry decline = +2 points
   - Tenure 2-4 years (peak "itchy feet" window) = +2 points
   - Company acquired/merged = +2 points (uncertainty)
   - PASSED OVER: If someone else at their company just got promoted to a role they might have wanted = +3 points (feeling undervalued)
   - Colleague departures (peers leaving) = +2 points (social proof to move)

   NEGATIVE signals (LESS likely to move):
   - Recent appointment/promotion (< 18 months) = -5 points (THEY JUST STARTED!)
   - Recent award or recognition = -2 points (feeling valued)
   - Founder/Partner/Owner = -3 points (equity stake)
   - Strong employer brand (Google, McKinsey) = -1 point

   Output: "High" (7-10), "Medium" (4-6), "Low" (1-3)

   IMPORTANT: If news says they were "appointed", "joined", "promoted" RECENTLY, that means LOW score!

C. PERSONALIZED OUTREACH HOOK - For each candidate:
   - Find their most recent public activity (article, podcast, award, project)
   - Draft a 2-sentence opener that references this specifically
   - Example: "Saw your piece on digital transformation at [Company] - your point about [X] resonated with a client I'm working with."

PHASE 2 INTELLIGENCE (MUST INCLUDE):
=====================================
D. COMPETITOR BRAIN DRAIN - In market intelligence:
   - List companies losing talent in this space
   - List companies gaining talent
   - Identify "leaky" employers (high departure signals)
   - Recommend targeting talent at unstable companies

E. WHEN TO CALL RECOMMENDATION - For each candidate:
   - Specific timing: "Now", "After Q1 bonus (March)", "After performance review (July)"
   - Reasoning: Based on SA business cycles, company news, career stage
   - Urgency: "High" (act now, signals strong), "Medium" (good timing), "Low" (can wait)

SOURCE QUALITY:
- Company team pages, news, conferences, awards = HIGH VALUE (hidden intel)
- LinkedIn profiles = MEDIUM VALUE (recruiter can find this)
- Generic search results = LOW VALUE

LEGAL COMPLIANCE (POPIA):
- Only use publicly available information
- For each candidate, track how we found them
- Be transparent about data sources

Return valid JSON only. No markdown.`;

    const userPrompt = `=== FULL SEARCH SPECIFICATION (Match candidates against ALL of this) ===
${prompt}
=== END FULL SPEC ===

Parsed criteria summary:
- Role: ${parsed.role || 'Unknown'}
- Location: ${parsed.location || 'South Africa'}
- Experience: ${parsed.experience || 'Not specified'}
- Industry: ${parsed.industry || 'Not specified'}
- Seniority: ${parsed.seniority || 'Not specified'}
- Salary Range: ${parsed.salaryRange ? `R${parsed.salaryRange.min || '?'} - R${parsed.salaryRange.max || '?'}` : 'Not specified'}
- Must-haves: ${(parsed.mustHaves || []).join('; ')}
- Nice-to-haves: ${(parsed.niceToHaves || []).join('; ') || 'None'}
- Specific expertise required: ${(parsed.specificExpertise || []).join('; ') || 'None'}
- Personality/style: ${(parsed.personalityTraits || []).join('; ') || 'None'}
- Target companies: ${(parsed.targetCompanies || []).join(', ') || 'None specified'}
- EXCLUDE companies: ${(parsed.excludeCompanies || []).join(', ') || 'None'}
- EXCLUDE profiles: ${(parsed.excludeProfiles || []).join('; ') || 'None'}

CRITICAL: Score each candidate against the FULL SPEC above, not just the summary. If the spec says to EXCLUDE certain profiles, do NOT include them.

Intelligence quality: ${highValueCount} high-value sources, ${linkedInCount} LinkedIn sources
${webContext}

Generate a PREMIUM talent mapping report as JSON.

REMINDER: Only include candidates whose REAL NAMES appear in the sources above.
If a source says "John Doe, CEO of Acme Corp" - you can include John Doe.
If NO specific person is named - do NOT invent one.

IMPORTANT: For EACH candidate, you MUST include:
- verifiedCredentials: array of credentials you can verify from public sources
- publicFootprint: 'high'|'medium'|'low' based on how visible they are online
- connectionPaths: array of ways the recruiter might reach them
- timingRecommendation: { bestTime, reasoning, urgency }
- approachScript: a personalized outreach message
- redFlags: any concerns about availability or fit
- dataSource: primary source where we found them
- howWeFoundYou: transparency statement for POPIA

{
  "marketIntelligence": {
    "talentPoolSize": "e.g., 'Approximately 150-300 qualified professionals in Johannesburg'",
    "talentHotspots": ["Companies/locations where this talent concentrates"],
    "competitorActivity": [
      { "company": "Company", "signal": "What they're doing (hiring, layoffs, etc)", "implication": "What this means for sourcing" }
    ],
    "salaryTrends": "e.g., 'R550k-R850k, up 8% from 2025'",
    "marketTightness": "tight|balanced|abundant",
    "recommendations": ["strategic sourcing tips"],
    "hiddenPools": ["Where to find candidates others miss"]
  },
  "competitiveIntelligence": {
    "companiesHiringSimilarRoles": [
      { "company": "Name", "roleCount": 0, "signal": "What this means" }
    ],
    "recentFundingMAndA": [
      { "company": "Name", "event": "What happened", "talentImplication": "How this affects talent availability" }
    ],
    "marketSalaryMovement": {
      "direction": "up|stable|down",
      "percentage": "e.g., +8%",
      "drivers": ["What's driving salary changes"]
    },
    "competitorBrainDrain": {
      "companiesLosingTalent": [
        { "company": "Name", "signals": ["layoffs", "restructuring"], "talentAvailability": "high|medium|low" }
      ],
      "companiesGainingTalent": [
        { "company": "Name", "signals": ["expansion", "funding"], "competitionLevel": "high|medium|low" }
      ],
      "leakyEmployers": ["Companies with high departure rates - prioritize sourcing from these"],
      "stableEmployers": ["Companies with low turnover - harder to poach from"],
      "recommendation": "Strategic advice on where to focus sourcing efforts"
    }
  },
  "talentHeatmap": {
    "johannesburg": { "count": 0, "concentration": "high|medium|low" },
    "capeTown": { "count": 0, "concentration": "high|medium|low" },
    "durban": { "count": 0, "concentration": "high|medium|low" },
    "pretoria": { "count": 0, "concentration": "high|medium|low" },
    "other": { "count": 0, "locations": [] }
  },
  "candidates": [
    {
      "name": "REAL full name from sources (e.g., 'Sarah Johnson' NOT invented)",
      "currentRole": "REAL job title from sources",
      "company": "REAL company name from sources (NOT 'XYZ Corp')",
      "linkedinUrl": "REQUIRED - https://linkedin.com/in/their-profile (search for their LinkedIn profile URL)",
      "industry": "Sector",
      "location": "City",
      "discoveryMethod": "How we found them (e.g., 'Company team page', 'News article about appointment', 'Conference speaker')",
      "sources": [
        {
          "url": "source URL",
          "type": "company|news|conference|github|academic|award|linkedin|jse_sens|patent|podcast|trade_publication|professional_body|government|startup_news|other",
          "excerpt": "relevant quote",
          "valueLevel": "high|medium|low"
        }
      ],
      "inferredProfile": {
        "yearsExperience": "estimated years",
        "careerPath": "Brief trajectory description",
        "specializations": ["inferred specializations"],
        "accomplishments": ["notable achievements found"]
      },
      "skillsInferred": [
        { "skill": "Skill Name", "evidence": "How we inferred this", "confidence": "high|medium|low" }
      ],
      "availabilitySignals": {
        "score": 1-10,
        "signals": ["reasons they might be open (company news, tenure, etc)"],
        "interpretation": "summary of availability likelihood"
      },
      "careerVelocity": {
        "estimatedTenure": "e.g., '3.5 years in current role'",
        "industryAverage": "e.g., '2.5 years for finance'",
        "stagnationSignal": true|false,
        "velocityScore": 1-10,
        "interpretation": "e.g., 'Tenure exceeds industry average - likely open to new opportunities'"
      },
      "resignationPropensity": {
        "score": "High|Medium|Low",
        "numericScore": 1-10,
        "factors": [
          { "factor": "Factor name", "impact": "positive|negative|neutral", "evidence": "Specific evidence from sources" }
        ],
        "recommendation": "Specific advice - MUST say LOW if recently appointed/new in role/retiring"
      },
      "CRITICAL_CHECK": "Before assigning High score: Is this person NEWLY appointed (< 2 years)? If YES, score MUST be LOW. Is this person RETIRING? If YES, they are NOT a recruitment target.",
      "personalizedHook": {
        "recentActivity": "e.g., 'Spoke at FinTech Africa Summit on digital lending'",
        "suggestedOpener": "Two-sentence personalized outreach message",
        "connectionAngle": "Why this would resonate with them"
      },
      "careerTrajectory": {
        "direction": "rising|stable|transitioning|unknown",
        "evidence": "Why we think this",
        "recentMoves": "Any recent promotions/changes"
      },
      "verifiedCredentials": [
        { "credential": "e.g., CA(SA)", "verificationSource": "SAICA website", "verificationUrl": "url if available", "confidence": "verified|likely|mentioned", "professionalBody": "SAICA" }
      ],
      "publicFootprint": "high|medium|low",
      "connectionPaths": [
        { "type": "alumni|industry_event|mutual_company|professional_body|publication|other", "description": "How to connect", "strength": "strong|moderate|weak" }
      ],
      "timingRecommendation": {
        "bestTime": "e.g., 'Now - company restructuring', 'Q2 - after bonus payout'",
        "reasoning": "Why this timing",
        "urgency": "high|medium|low"
      },
      "approachScript": "Personalized outreach message for this candidate",
      "redFlags": ["Any concerns"],
      "approachStrategy": {
        "angle": "Best way to approach this person",
        "timing": "Good/bad time to reach out",
        "leverage": "What would interest them"
      },
      "matchScore": 1-100,
      "matchReasons": ["why they match"],
      "potentialConcerns": ["any concerns"],
      "confidence": "high|medium|low",
      "uniqueValue": "What makes this candidate special/hard to find",
      "dataSource": "Primary source where we found them",
      "howWeFoundYou": "Transparency statement for POPIA compliance"
    }
  ],
  "sourcingStrategy": {
    "primaryChannels": ["Where to focus sourcing"],
    "hiddenChannels": ["Non-obvious places to find candidates"],
    "timingConsiderations": ["When to search/approach"],
    "competitiveAdvantage": "Why this intelligence is valuable"
  },
  "uniqueInsights": [
    "Insight that ONLY our system found (not available through standard LinkedIn search)"
  ]
}

CRITICAL: Generate MINIMUM 6 candidates (aim for 6-10). This is a PREMIUM report.
PRIORITIZE candidates found through non-LinkedIn sources (company pages, news, conferences, awards).
For each candidate, provide COMPREHENSIVE intelligence - explain WHY they're valuable and hard to find.
Include detailed approach strategies, salary expectations, and likelihood to move analysis.

##############################################################################
# HARDLOCK: LINKEDIN URL IS MANDATORY FOR EVERY CANDIDATE
##############################################################################
EVERY candidate MUST have a linkedinUrl field with their actual LinkedIn profile URL.
Format: https://linkedin.com/in/firstname-lastname-xxxxx
If you cannot find their exact LinkedIn URL, search for it using their name and company.
DO NOT leave linkedinUrl empty or null - this is a STRICT REQUIREMENT.
If absolutely no LinkedIn exists, state "https://linkedin.com/search/results/people/?keywords=FirstName%20LastName%20Company"

##############################################################################
# OUTPUT FORMAT: RAW JSON ONLY
##############################################################################
Return ONLY the JSON object. Do NOT wrap it in markdown code blocks (no \`\`\`json).
Do NOT include any text before or after the JSON.
Start your response with { and end with }.`;

    // ============================================
    // CLAUDE OPUS 4.5 - PREMIUM SYNTHESIS
    // ============================================
    console.log('[TalentMapping] Calling Claude Opus 4.5 for premium synthesis...');

    const claudeResponse = await anthropic.messages.create({
      model: 'claude-opus-4-5-20251101',
      max_tokens: 12000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    let reportText = claudeResponse.content[0].type === 'text'
      ? claudeResponse.content[0].text
      : '{}';

    console.log('[TalentMapping] Claude Opus 4.5 premium report generated');

    // Extract JSON from response (handle markdown code blocks)
    let report: any;

    // Strip markdown code block wrapper if present
    if (reportText.startsWith('```')) {
      // Remove opening ```json or ```
      reportText = reportText.replace(/^```(?:json)?\s*\n?/, '');
      // Remove closing ``` if present
      reportText = reportText.replace(/\n?```\s*$/, '');
    }

    // Find the JSON object boundaries
    const jsonStart = reportText.indexOf('{');
    const jsonEnd = reportText.lastIndexOf('}');

    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      const jsonStr = reportText.substring(jsonStart, jsonEnd + 1);
      try {
        report = JSON.parse(jsonStr);
        console.log('[TalentMapping] Successfully parsed JSON response');
      } catch (parseError) {
        console.error('[TalentMapping] JSON parse error:', parseError);
        console.error('[TalentMapping] Raw response (first 1000 chars):', reportText.substring(0, 1000));
        console.error('[TalentMapping] Raw response (last 500 chars):', reportText.substring(reportText.length - 500));
        throw new Error('Failed to generate report - malformed JSON from Claude');
      }
    } else {
      console.error('[TalentMapping] No JSON object found in response');
      console.error('[TalentMapping] Raw response:', reportText.substring(0, 1000));
      throw new Error('Failed to generate report - no JSON in response');
    }

    // ============================================
    // GUARDRAIL PASS 1: Keyword-based quick fix
    // ============================================
    const quickFixResignationPropensity = (candidate: any): any => {
      const discoveryMethod = (candidate.discoveryMethod || '').toLowerCase();
      const sources = (candidate.sources || []).map((s: any) => (s.excerpt || '').toLowerCase()).join(' ');
      const allText = `${discoveryMethod} ${sources} ${(candidate.personalizedHook?.recentActivity || '').toLowerCase()}`;

      const recentAppointmentSignals = [
        'appointed', 'joins', 'joined', 'new ceo', 'new role', 'promoted',
        'takes over', 'named as', 'assumed role', 'started as', 'beginning as'
      ];
      const hasRecentAppointment = recentAppointmentSignals.some(signal => allText.includes(signal));

      const retirementSignals = ['retiring', 'retirement', 'stepping down', 'leaving the role', 'departing'];
      const isRetiring = retirementSignals.some(signal => allText.includes(signal));

      if (hasRecentAppointment && !isRetiring) {
        return { needsVerification: true, reason: 'recent_appointment', original: candidate.resignationPropensity };
      }
      if (isRetiring) {
        return { needsVerification: true, reason: 'retirement', original: candidate.resignationPropensity };
      }
      // High score needs verification too
      if (candidate.resignationPropensity?.score === 'High') {
        return { needsVerification: true, reason: 'high_score_check', original: candidate.resignationPropensity };
      }
      return { needsVerification: false, original: candidate.resignationPropensity };
    };

    // ============================================
    // GUARDRAIL PASS 2: AI Verification (critic)
    // ============================================
    const verifyResignationPropensity = async (candidates: any[]): Promise<any[]> => {
      const candidatesNeedingVerification = candidates.filter((c, i) => {
        const check = quickFixResignationPropensity(c);
        candidates[i]._verificationCheck = check;
        return check.needsVerification;
      });

      if (candidatesNeedingVerification.length === 0) {
        console.log('[Verification] No candidates need verification');
        return candidates;
      }

      console.log(`[Verification] Verifying ${candidatesNeedingVerification.length} candidates`);

      try {
        const verificationPrompt = candidatesNeedingVerification.map((c, i) =>
          `CANDIDATE ${i + 1}: ${c.name}
Role: ${c.currentRole} at ${c.company}
Discovery: ${c.discoveryMethod}
Sources: ${(c.sources || []).map((s: any) => s.excerpt).join(' | ')}
Current Score: ${c.resignationPropensity?.score || 'Unknown'}
Flag Reason: ${c._verificationCheck?.reason}`
        ).join('\n\n');

        const verificationResponse = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are a CRITICAL REVIEWER checking resignation propensity scores for accuracy.

YOUR JOB: Verify if the Move Likelihood score is CORRECT based on the evidence.

CRITICAL RULES:
1. RECENTLY APPOINTED (< 2 years in role) = MUST be LOW score. They just started!
2. RETIRING = NOT a recruitment target. Score should be LOW or N/A.
3. FOUNDER/OWNER = Usually LOW (they own the company)
4. High scores require EVIDENCE of instability, stagnation, or openness to move

For each candidate, respond with:
- correctedScore: "High" | "Medium" | "Low"
- reasoning: Why this score (1 sentence)
- isReliable: true/false (would a Google search confirm this?)

Return JSON array only.`
            },
            {
              role: 'user',
              content: `Verify these candidates:\n\n${verificationPrompt}\n\nReturn JSON: [{"candidateIndex": 0, "correctedScore": "Low", "reasoning": "Recently appointed as CEO", "isReliable": true}, ...]`
            }
          ],
          temperature: 0.1,
          max_tokens: 1000,
          response_format: { type: 'json_object' }
        });

        const verificationResult = JSON.parse(verificationResponse.choices[0]?.message?.content || '{"corrections":[]}');
        const corrections = verificationResult.corrections || verificationResult || [];

        // Apply corrections
        if (Array.isArray(corrections)) {
          corrections.forEach((correction: any) => {
            const idx = correction.candidateIndex;
            if (idx !== undefined && candidatesNeedingVerification[idx]) {
              const originalCandidate = candidates.find(c => c.name === candidatesNeedingVerification[idx].name);
              if (originalCandidate) {
                console.log(`[Verification] Correcting ${originalCandidate.name}: ${originalCandidate.resignationPropensity?.score} -> ${correction.correctedScore}`);
                originalCandidate.resignationPropensity = {
                  score: correction.correctedScore,
                  numericScore: correction.correctedScore === 'High' ? 8 : correction.correctedScore === 'Medium' ? 5 : 2,
                  factors: [
                    { factor: 'Verified', impact: correction.correctedScore === 'Low' ? 'negative' : 'positive', evidence: correction.reasoning }
                  ],
                  recommendation: correction.reasoning,
                  verified: true,
                  isReliable: correction.isReliable
                };
              }
            }
          });
        }
      } catch (err) {
        console.error('[Verification] Error during verification pass:', err);
        // Fall back to keyword-based fixes
        candidates.forEach(c => {
          const check = c._verificationCheck;
          if (check?.needsVerification) {
            if (check.reason === 'recent_appointment') {
              c.resignationPropensity = {
                score: 'Low',
                numericScore: 2,
                factors: [{ factor: 'Recent appointment', impact: 'negative', evidence: 'Recently started in role' }],
                recommendation: 'Recently appointed - wait 18-24 months before approaching.'
              };
            } else if (check.reason === 'retirement') {
              c.resignationPropensity = {
                score: 'Low',
                numericScore: 1,
                factors: [{ factor: 'Retiring', impact: 'negative', evidence: 'Retirement announced' }],
                recommendation: 'Retiring - not a recruitment target.'
              };
            }
          }
        });
      }

      // Clean up temp field
      candidates.forEach(c => delete c._verificationCheck);
      return candidates;
    };

    // ============================================
    // RUN VERIFICATION PASS
    // ============================================
    if (report.candidates && report.candidates.length > 0) {
      console.log('[TalentMapping] Running verification pass on', report.candidates.length, 'candidates');
      report.candidates = await verifyResignationPropensity(report.candidates);
    }

    // Enrich candidates with salary estimates and compliance fields
    const enrichedCandidates: EnrichedCandidate[] = (report.candidates || []).map((c: any, i: number) => {
      const candidate: EnrichedCandidate = {
        id: String(i + 1),
        name: c.name || 'Unknown',
        currentRole: c.currentRole || parsed.role || 'Unknown',
        company: c.company || 'Unknown',
        industry: c.industry || parsed.industry || 'Unknown',
        location: c.location || parsed.location || 'South Africa',
        discoveryMethod: c.discoveryMethod || 'Web search',
        sources: (c.sources || [{ url: 'inferred', type: 'other', excerpt: 'Based on market analysis', valueLevel: 'low' }]).map((s: any) => ({
          ...s,
          publiclyAvailable: true,
          accessedAt: searchTimestamp,
          dataSource: s.dataSource || 'Web search'
        })),
        salaryEstimate: estimateSalary(c.currentRole || parsed.role, c.location || parsed.location),
        inferredProfile: c.inferredProfile || {},
        skillsInferred: c.skillsInferred || [],
        availabilitySignals: c.availabilitySignals || { score: 5, signals: ['Unknown'], interpretation: 'Insufficient data' },
        careerTrajectory: c.careerTrajectory || { direction: 'unknown', evidence: 'Unknown' },
        approachStrategy: c.approachStrategy || { angle: 'Standard outreach', timing: 'Anytime', leverage: 'Role opportunity' },
        matchScore: c.matchScore || 70,
        matchReasons: c.matchReasons || ['Potential fit'],
        potentialConcerns: c.potentialConcerns || [],
        confidence: c.confidence || 'medium',
        uniqueValue: c.uniqueValue || 'Identified through intelligence gathering',

        // New enhanced fields
        verifiedCredentials: c.verifiedCredentials || [],
        publicFootprint: c.publicFootprint || 'medium',
        connectionPaths: c.connectionPaths || [],
        timingRecommendation: c.timingRecommendation || {
          bestTime: 'Anytime',
          reasoning: 'No specific timing signals detected',
          urgency: 'medium'
        },
        approachScript: c.approachScript || generateApproachScript(c, parsed.role),
        redFlags: c.redFlags || [],
        dataSource: c.dataSource || 'Web search',
        publiclyAvailable: true,
        howWeFoundYou: c.howWeFoundYou || 'Your public professional information appeared in search results',

        // PHASE 1: Career Velocity & Resignation Propensity
        careerVelocity: c.careerVelocity || {
          estimatedTenure: 'Unknown',
          industryAverage: '2-3 years',
          stagnationSignal: false,
          velocityScore: 5,
          interpretation: 'Insufficient data to assess career velocity'
        },
        resignationPropensity: c.resignationPropensity || {
          score: 'Medium',
          numericScore: 5,
          factors: [],
          recommendation: 'Standard outreach - no strong move signals detected'
        },
        personalizedHook: c.personalizedHook || {
          recentActivity: 'No recent public activity found',
          suggestedOpener: `Hi ${(c.name || 'there').split(' ')[0]}, I came across your profile and was impressed by your experience at ${c.company || 'your company'}.`,
          connectionAngle: 'Professional opportunity alignment'
        }
      };

      return candidate;
    });

    // Build source verification list for compliance
    const sourceVerification = sortedResults.slice(0, 30).map(r => ({
      url: r.url,
      title: r.title,
      sourceType: r.sourceType,
      publiclyAvailable: true,
      accessedAt: searchTimestamp,
      dataSource: r.dataSource,
      valueLevel: r.sourceValue
    }));

    // Calculate sources diversity breakdown
    const sourcesDiversity = {
      breakdown: sourceTypeCounts,
      totalSourceTypes: Object.keys(sourceTypeCounts).length,
      hiddenSourcePercentage: sortedResults.length > 0
        ? Math.round(((sortedResults.length - linkedInCount) / sortedResults.length) * 100)
        : 0,
      qualityDistribution: {
        high: highValueCount,
        medium: sortedResults.filter(r => r.sourceValue === 'medium').length,
        low: sortedResults.filter(r => r.sourceValue === 'low').length
      }
    };

    const result = {
      // Legal compliance section
      legalCompliance: {
        popiaStatement: 'This report was generated using ONLY publicly available information in compliance with the Protection of Personal Information Act (POPIA) of South Africa.',
        dataCollectionMethod: POPIA_COMPLIANCE.dataCollectionMethod,
        noPrivateDataAccessed: POPIA_COMPLIANCE.noPrivateDataAccessed,
        transparencyGuarantee: 'All sources are cited with direct links for verification',
        dataSubjectRights: DATA_RETENTION_NOTICE.userRights,
        regulatoryCompliance: DATA_RETENTION_NOTICE.compliance,
        disclaimer: 'HireInbox does not guarantee the accuracy of information derived from public sources. All hiring decisions should be made based on direct verification with candidates.'
      },
      dataRetentionNotice: DATA_RETENTION_NOTICE,

      // Source verification
      sourceVerification,

      // Market intelligence
      marketIntelligence: report.marketIntelligence || {
        talentPoolSize: 'Analysis in progress',
        talentHotspots: [],
        competitorActivity: [],
        salaryTrends: 'Contact us for detailed benchmarks',
        marketTightness: 'balanced',
        recommendations: [],
        hiddenPools: []
      },

      // New: Competitive intelligence with Brain Drain analysis
      competitiveIntelligence: {
        companiesHiringSimilarRoles: report.competitiveIntelligence?.companiesHiringSimilarRoles || [],
        recentFundingMAndA: report.competitiveIntelligence?.recentFundingMAndA || [],
        marketSalaryMovement: report.competitiveIntelligence?.marketSalaryMovement || {
          direction: 'stable',
          percentage: '0%',
          drivers: ['Insufficient data']
        },
        // PHASE 2: Competitor Brain Drain
        competitorBrainDrain: report.competitiveIntelligence?.competitorBrainDrain || {
          companiesLosingTalent: [],
          companiesGainingTalent: [],
          leakyEmployers: [],
          stableEmployers: [],
          recommendation: 'Run additional searches to identify talent movement patterns'
        }
      },

      // New: Geographic heatmap
      talentHeatmap: report.talentHeatmap || {
        johannesburg: { count: 0, concentration: 'unknown' },
        capeTown: { count: 0, concentration: 'unknown' },
        durban: { count: 0, concentration: 'unknown' },
        pretoria: { count: 0, concentration: 'unknown' },
        other: { count: 0, locations: [] }
      },

      // Candidates
      candidates: enrichedCandidates,

      // Sourcing strategy
      sourcingStrategy: report.sourcingStrategy || {
        primaryChannels: [],
        hiddenChannels: [],
        timingConsiderations: [],
        competitiveAdvantage: ''
      },

      // Search criteria
      searchCriteria: {
        originalPrompt: prompt,
        parsed: {
          role: parsed.role || 'Unknown',
          location: parsed.location || 'South Africa',
          experience: parsed.experience || 'Not specified',
          industry: parsed.industry || 'Not specified',
          seniority: parsed.seniority || 'Not specified',
          mustHaves: parsed.mustHaves || [],
          niceToHaves: parsed.niceToHaves || [],
          targetCompanies: parsed.targetCompanies || [],
          excludeCompanies: parsed.excludeCompanies || []
        }
      },

      // Intelligence quality metrics (defensive moat)
      intelligenceQuality: {
        totalSources: sortedResults.length,
        highValueSources: highValueCount,
        linkedInSources: linkedInCount,
        sourceBreakdown: sourceTypeCounts,
        diversityScore: Object.keys(sourceTypeCounts).length
      },

      // New: Defensive moat features
      intelligenceScore: intelligenceScore,
      sourcesDiversity: sourcesDiversity,
      uniqueInsights: report.uniqueInsights || [
        `Found ${highValueCount} candidates through non-traditional sources (not LinkedIn)`,
        `Searched ${searchQueries.length} specialized South African data sources`,
        `Intelligence diversity score: ${diversityScore}/10 source types used`
      ],

      // Methodology explanation
      searchMethodology: {
        description: 'Multi-source intelligence gathering using SUPERIOR INTELLIGENCE STACK',
        queriesExecuted: searchMethodology.length,
        sourceTypesSearched: [...new Set(searchMethodology.map(s => s.sourceType))],
        totalResultsAnalyzed: sortedResults.length,
        aiModel: 'gpt-4o-2024-08-06 (pinned)',
        searchEngine: 'Firecrawl',
        intelligenceStack: {
          gdelt: {
            enabled: true,
            hiringTrend: superiorIntelligence.gdelt.hiringTrend,
            layoffActivity: superiorIntelligence.gdelt.layoffActivity,
            companiesHiring: superiorIntelligence.gdelt.companiesHiring,
            companiesRestructuring: superiorIntelligence.gdelt.companiesRestructuring
          },
          shofo: {
            enabled: true,
            salaryRange: superiorIntelligence.shofo.competitiveRange,
            marketPosition: superiorIntelligence.shofo.marketPosition,
            hasLiveData: !!superiorIntelligence.shofo.benchmark
          }
        },
        timestamp: searchTimestamp
      },

      completedAt: searchTimestamp
    };

    console.log('[TalentMapping] PREMIUM Complete:', enrichedCandidates.length, 'candidates from', sortedResults.length, 'sources (', highValueCount, 'high-value)');

    // Log usage for pilot tracking
    // Estimated cost: ~42 Firecrawl queries at $0.01 = $0.42, + 2 GPT-4o calls = ~$0.30 = ~$0.72 total
    const estimatedCost = 0.72;
    await logPilotUsage(
      userEmail,
      'talent_mapping',
      {
        role: parsed.role,
        location: parsed.location,
        industry: parsed.industry,
        candidatesFound: enrichedCandidates.length,
        sourcesSearched: sortedResults.length,
        searchQueries: searchMethodology.length,
      },
      estimatedCost
    );

    // Log billing event (talent search run)
    if (userId) {
      try {
        const eventDate = new Date();
        const eventMonth = eventDate.toISOString().slice(0, 7); // YYYY-MM

        await supabase
          .from('pilot_billing_events')
          .insert({
            user_id: userId,
            event_type: 'talent_search',
            event_date: eventDate.toISOString().split('T')[0], // YYYY-MM-DD
            event_month: eventMonth,
            metadata: {
              search_prompt: prompt.substring(0, 200), // First 200 chars
              role: parsed.role,
              location: parsed.location,
              candidates_found: enrichedCandidates.length,
            }
          });

        console.log('[TalentMapping] Logged billing event for user:', userId);
      } catch (billingError) {
        console.error('[TalentMapping] Failed to log billing event:', billingError);
        // Don't fail the request if billing logging fails
      }
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('[TalentMapping] Error:', error);

    // Don't leak internal error details (like API key messages) to clients
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isApiKeyError = errorMessage.toLowerCase().includes('api') && errorMessage.toLowerCase().includes('key');

    return NextResponse.json({
      error: isApiKeyError
        ? 'Service temporarily unavailable. Please try again or contact support.'
        : 'Talent mapping failed. Please try again.',
      _debug: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    }, { status: 500 });
  }
}
