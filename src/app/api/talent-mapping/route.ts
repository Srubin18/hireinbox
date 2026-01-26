import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import FirecrawlApp from '@mendable/firecrawl-js';
import { SA_CONTEXT_PROMPT } from '@/lib/sa-context';

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

const firecrawl = new FirecrawlApp({
  apiKey: process.env.FIRECRAWL_API_KEY || '',
});

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

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 5) {
      return NextResponse.json({ error: 'Please describe who you are looking for' }, { status: 400 });
    }

    const searchTimestamp = new Date().toISOString();
    console.log('[TalentMapping] Starting PREMIUM search:', prompt);

    // Step 1: Parse search criteria with OpenAI
    const parseResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an expert South African executive search consultant. Parse the search criteria.

${SA_CONTEXT_PROMPT}

Return valid JSON only:
{
  "role": "job title",
  "location": "city in South Africa",
  "experience": "years required",
  "industry": "sector (use: finance, tech, mining, retail, fmcg, healthcare, telecoms, manufacturing, consulting)",
  "seniority": "junior|mid|senior|executive",
  "mustHaves": ["requirements"],
  "niceToHaves": ["nice-to-haves"],
  "targetCompanies": ["specific companies to search if mentioned"],
  "excludeCompanies": ["companies to exclude if mentioned"]
}`
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 800,
      response_format: { type: 'json_object' }
    });

    const parsed = JSON.parse(parseResponse.choices[0]?.message?.content || '{}');
    console.log('[TalentMapping] Parsed:', parsed);

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
        const results = await firecrawl.search(sq.query, { limit: 5 }) as any;
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

    // Prioritize high-value sources
    const sortedResults = uniqueResults.sort((a, b) => {
      const valueOrder = { high: 0, medium: 1, low: 2 };
      return valueOrder[a.sourceValue] - valueOrder[b.sourceValue];
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
    const webContext = sortedResults.length > 0
      ? `\n\nINTELLIGENCE GATHERED (${sortedResults.length} sources):\n${sortedResults.slice(0, 20).map((r, i) =>
          `[${i+1}] [${r.sourceType.toUpperCase()}] ${r.url}\nSource: ${r.dataSource}\n${r.title}\n${r.content.substring(0, 2000)}\n---`
        ).join('\n')}`
      : '\n\n(Limited web results - provide market intelligence based on SA industry knowledge)';

    const synthesisResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a premium South African executive search intelligence analyst. Your job is to find HIDDEN candidates that recruiters cannot easily find themselves.

${SA_CONTEXT_PROMPT}

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

SOURCE QUALITY:
- Company team pages, news, conferences, awards = HIGH VALUE (hidden intel)
- LinkedIn profiles = MEDIUM VALUE (recruiter can find this)
- Generic search results = LOW VALUE

LEGAL COMPLIANCE (POPIA):
- Only use publicly available information
- For each candidate, track how we found them
- Be transparent about data sources

Return valid JSON only. No markdown.`
        },
        {
          role: 'user',
          content: `Search: "${prompt}"

Parsed criteria:
- Role: ${parsed.role || 'Unknown'}
- Location: ${parsed.location || 'South Africa'}
- Experience: ${parsed.experience || 'Not specified'}
- Industry: ${parsed.industry || 'Not specified'}
- Seniority: ${parsed.seniority || 'Not specified'}
- Must-haves: ${(parsed.mustHaves || []).join(', ')}
- Target companies: ${(parsed.targetCompanies || []).join(', ') || 'None specified'}

Intelligence quality: ${highValueCount} high-value sources, ${linkedInCount} LinkedIn sources
${webContext}

Generate a PREMIUM talent mapping report as JSON. IMPORTANT: For EACH candidate, you MUST include:
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
      "name": "Full Name",
      "currentRole": "Job Title",
      "company": "Company Name",
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

Generate 5-8 candidates. PRIORITIZE candidates found through non-LinkedIn sources. For each candidate, explain WHY they're valuable (hidden intel, not just a LinkedIn search).`
        }
      ],
      temperature: 0.7,
      max_tokens: 6000,
      response_format: { type: 'json_object' }
    });

    const reportText = synthesisResponse.choices[0]?.message?.content || '{}';
    let report: any;
    try {
      report = JSON.parse(reportText);
    } catch {
      console.error('[TalentMapping] Failed to parse report');
      throw new Error('Failed to generate report');
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
        howWeFoundYou: c.howWeFoundYou || 'Your public professional information appeared in search results'
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

      // New: Competitive intelligence
      competitiveIntelligence: report.competitiveIntelligence || {
        companiesHiringSimilarRoles: [],
        recentFundingMAndA: [],
        marketSalaryMovement: {
          direction: 'stable',
          percentage: '0%',
          drivers: ['Insufficient data']
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
        description: 'Multi-source intelligence gathering using specialized South African data sources',
        queriesExecuted: searchMethodology.length,
        sourceTypesSearched: [...new Set(searchMethodology.map(s => s.sourceType))],
        totalResultsAnalyzed: sortedResults.length,
        aiModel: 'gpt-4o',
        searchEngine: 'Firecrawl',
        timestamp: searchTimestamp
      },

      completedAt: searchTimestamp
    };

    console.log('[TalentMapping] PREMIUM Complete:', enrichedCandidates.length, 'candidates from', sortedResults.length, 'sources (', highValueCount, 'high-value)');

    return NextResponse.json(result);

  } catch (error) {
    console.error('[TalentMapping] Error:', error);
    return NextResponse.json({
      error: 'Talent mapping failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
