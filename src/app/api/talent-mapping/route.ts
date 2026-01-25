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

interface WebSearchResult {
  url: string;
  title: string;
  content: string;
  sourceType: 'linkedin' | 'news' | 'company' | 'conference' | 'github' | 'academic' | 'press_release' | 'award' | 'other';
  sourceValue: 'high' | 'medium' | 'low'; // How valuable this source is for inference
}

// Generate diverse search queries that find HIDDEN candidates
function generateIntelligenceQueries(parsed: any): { query: string; sourceType: string; purpose: string }[] {
  const role = parsed.role || '';
  const location = parsed.location || 'South Africa';
  const industry = parsed.industry || '';

  const queries: { query: string; sourceType: string; purpose: string }[] = [];

  // 1. COMPANY TEAM PAGES - Find people not on LinkedIn
  queries.push({
    query: `"${role}" "team" OR "leadership" site:.co.za ${location}`,
    sourceType: 'company',
    purpose: 'Hidden candidates on company team pages'
  });

  // 2. NEWS - Appointments, promotions, moves
  queries.push({
    query: `"${role}" ("appointed" OR "joins" OR "promoted" OR "new") ${location} ${industry}`,
    sourceType: 'news',
    purpose: 'Recent appointments and moves'
  });

  // 3. SA BUSINESS NEWS SPECIFICALLY
  queries.push({
    query: `${role} ${industry} site:fin24.com OR site:businesslive.co.za OR site:moneyweb.co.za`,
    sourceType: 'news',
    purpose: 'SA business news coverage'
  });

  // 4. PRESS RELEASES - Company announcements
  queries.push({
    query: `"${role}" "press release" OR "announcement" ${location} ${industry}`,
    sourceType: 'press_release',
    purpose: 'Company press releases about people'
  });

  // 5. CONFERENCE SPEAKERS - Industry experts
  queries.push({
    query: `"${role}" "speaker" OR "panelist" OR "keynote" ${industry} South Africa 2025 OR 2026`,
    sourceType: 'conference',
    purpose: 'Conference speakers (industry visibility)'
  });

  // 6. INDUSTRY AWARDS - High performers
  queries.push({
    query: `"${role}" "award" OR "winner" OR "finalist" ${industry} South Africa`,
    sourceType: 'award',
    purpose: 'Award winners (high performers)'
  });

  // 7. LINKEDIN COMPANY PAGES (not profiles) - Team composition
  if (industry) {
    const companies = SA_COMPANIES_BY_INDUSTRY[industry.toLowerCase()] || [];
    if (companies.length > 0) {
      queries.push({
        query: `"${role}" ${companies.slice(0, 3).join(' OR ')} site:linkedin.com/company`,
        sourceType: 'linkedin',
        purpose: 'Company LinkedIn pages (team intel)'
      });
    }
  }

  // 8. GITHUB - For tech roles
  if (role.toLowerCase().includes('developer') || role.toLowerCase().includes('engineer') ||
      role.toLowerCase().includes('architect') || role.toLowerCase().includes('data')) {
    queries.push({
      query: `${role} ${location} site:github.com`,
      sourceType: 'github',
      purpose: 'GitHub profiles (tech candidates)'
    });
  }

  // 9. INDUSTRY ASSOCIATIONS - Professional bodies
  queries.push({
    query: `"${role}" ${industry} "member" OR "fellow" OR "board" South Africa`,
    sourceType: 'other',
    purpose: 'Industry association members'
  });

  // 10. UNIVERSITY/ACADEMIC - For senior roles
  if (role.toLowerCase().includes('professor') || role.toLowerCase().includes('research') ||
      role.toLowerCase().includes('director') || role.toLowerCase().includes('head')) {
    queries.push({
      query: `"${role}" ${industry} site:.ac.za OR site:researchgate.net South Africa`,
      sourceType: 'academic',
      purpose: 'Academic/research profiles'
    });
  }

  return queries;
}

function categorizeSource(url: string, title: string): { type: WebSearchResult['sourceType']; value: WebSearchResult['sourceValue'] } {
  const urlLower = url.toLowerCase();
  const titleLower = title.toLowerCase();

  // LinkedIn - medium value (recruiters can search this)
  if (urlLower.includes('linkedin.com')) {
    return { type: 'linkedin', value: 'medium' };
  }

  // Company pages - HIGH value (hidden candidates)
  if (urlLower.includes('/team') || urlLower.includes('/about') || urlLower.includes('/leadership') ||
      titleLower.includes('team') || titleLower.includes('leadership')) {
    return { type: 'company', value: 'high' };
  }

  // News - HIGH value (recent movements)
  if (urlLower.includes('fin24') || urlLower.includes('businesslive') || urlLower.includes('moneyweb') ||
      urlLower.includes('news') || urlLower.includes('biznews') || titleLower.includes('appoint')) {
    return { type: 'news', value: 'high' };
  }

  // Conference - HIGH value (industry visibility)
  if (titleLower.includes('speaker') || titleLower.includes('conference') || titleLower.includes('summit') ||
      titleLower.includes('keynote')) {
    return { type: 'conference', value: 'high' };
  }

  // GitHub - HIGH value for tech roles
  if (urlLower.includes('github.com')) {
    return { type: 'github', value: 'high' };
  }

  // Academic - HIGH value
  if (urlLower.includes('.ac.za') || urlLower.includes('researchgate') || urlLower.includes('scholar')) {
    return { type: 'academic', value: 'high' };
  }

  // Awards - HIGH value
  if (titleLower.includes('award') || titleLower.includes('winner') || titleLower.includes('finalist')) {
    return { type: 'award', value: 'high' };
  }

  // Press release - Medium value
  if (titleLower.includes('press') || titleLower.includes('announce') || titleLower.includes('release')) {
    return { type: 'press_release', value: 'medium' };
  }

  return { type: 'other', value: 'low' };
}

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 5) {
      return NextResponse.json({ error: 'Please describe who you are looking for' }, { status: 400 });
    }

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

    for (const sq of searchQueries) {
      try {
        console.log(`[TalentMapping] Searching [${sq.sourceType}]: ${sq.query}`);
        const results = await firecrawl.search(sq.query, { limit: 5 }) as any;
        const data = results?.data || results?.web || [];

        for (const r of data) {
          if (r?.url && (r?.markdown || r?.content || r?.description)) {
            const { type, value } = categorizeSource(r.url, r.title || '');

            // Track source diversity
            sourceTypeCounts[type] = (sourceTypeCounts[type] || 0) + 1;

            webResults.push({
              url: r.url,
              title: r.title || '',
              content: (r.markdown || r.content || r.description).substring(0, 3000),
              sourceType: type,
              sourceValue: value
            });
          }
        }
      } catch (err) {
        console.log(`[TalentMapping] Search error for [${sq.sourceType}] (continuing):`, err);
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

    // Step 4: Synthesize with GPT-4o - FOCUS ON INFERENCE
    const webContext = sortedResults.length > 0
      ? `\n\nINTELLIGENCE GATHERED (${sortedResults.length} sources):\n${sortedResults.slice(0, 20).map((r, i) =>
          `[${i+1}] [${r.sourceType.toUpperCase()}] ${r.url}\n${r.title}\n${r.content.substring(0, 2000)}\n---`
        ).join('\n')}`
      : '\n\n(Limited web results - provide market intelligence based on SA industry knowledge)';

    const highValueCount = sortedResults.filter(r => r.sourceValue === 'high').length;
    const linkedInCount = sortedResults.filter(r => r.sourceType === 'linkedin').length;

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

Generate a PREMIUM talent mapping report as JSON:
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
          "type": "company|news|conference|github|academic|award|linkedin|other",
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
      "approachStrategy": {
        "angle": "Best way to approach this person",
        "timing": "Good/bad time to reach out",
        "leverage": "What would interest them"
      },
      "matchScore": 1-100,
      "matchReasons": ["why they match"],
      "potentialConcerns": ["any concerns"],
      "confidence": "high|medium|low",
      "uniqueValue": "What makes this candidate special/hard to find"
    }
  ],
  "sourcingStrategy": {
    "primaryChannels": ["Where to focus sourcing"],
    "hiddenChannels": ["Non-obvious places to find candidates"],
    "timingConsiderations": ["When to search/approach"],
    "competitiveAdvantage": "Why this intelligence is valuable"
  }
}

Generate 5-8 candidates. PRIORITIZE candidates found through non-LinkedIn sources. For each candidate, explain WHY they're valuable (hidden intel, not just a LinkedIn search).`
        }
      ],
      temperature: 0.7,
      max_tokens: 5000,
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

    // Enrich candidates with salary estimates
    const enrichedCandidates = (report.candidates || []).map((c: any, i: number) => ({
      id: String(i + 1),
      name: c.name || 'Unknown',
      currentRole: c.currentRole || parsed.role || 'Unknown',
      company: c.company || 'Unknown',
      industry: c.industry || parsed.industry || 'Unknown',
      location: c.location || parsed.location || 'South Africa',
      discoveryMethod: c.discoveryMethod || 'Web search',
      sources: c.sources || [{ url: 'inferred', type: 'other', excerpt: 'Based on market analysis', valueLevel: 'low' }],
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
      uniqueValue: c.uniqueValue || 'Identified through intelligence gathering'
    }));

    const result = {
      marketIntelligence: report.marketIntelligence || {
        talentPoolSize: 'Analysis in progress',
        talentHotspots: [],
        competitorActivity: [],
        salaryTrends: 'Contact us for detailed benchmarks',
        marketTightness: 'balanced',
        recommendations: [],
        hiddenPools: []
      },
      candidates: enrichedCandidates,
      sourcingStrategy: report.sourcingStrategy || {
        primaryChannels: [],
        hiddenChannels: [],
        timingConsiderations: [],
        competitiveAdvantage: ''
      },
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
      intelligenceQuality: {
        totalSources: sortedResults.length,
        highValueSources: highValueCount,
        linkedInSources: linkedInCount,
        sourceBreakdown: sourceTypeCounts,
        diversityScore: Object.keys(sourceTypeCounts).length // More source types = more diverse
      },
      completedAt: new Date().toISOString()
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
