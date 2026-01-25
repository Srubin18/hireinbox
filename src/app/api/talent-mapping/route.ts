import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import FirecrawlApp from '@mendable/firecrawl-js';
import { SA_CONTEXT_PROMPT } from '@/lib/sa-context';

// ============================================
// HIREINBOX - TALENT MAPPING API
// /api/talent-mapping
//
// Uses OpenAI GPT-4o + Firecrawl for real web search
// Provides South African market intelligence
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

  // Location adjustments
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
  sourceType: string;
}

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 5) {
      return NextResponse.json({ error: 'Please describe who you are looking for' }, { status: 400 });
    }

    console.log('[TalentMapping] Starting search:', prompt);

    // Step 1: Parse search criteria with OpenAI
    const parseResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an expert South African recruiter. Parse the search criteria.

${SA_CONTEXT_PROMPT}

Return valid JSON only:
{
  "role": "job title",
  "location": "city in South Africa",
  "experience": "years required",
  "industry": "sector",
  "mustHaves": ["requirements"],
  "niceToHaves": ["nice-to-haves"],
  "searchQueries": ["3-5 specific web search queries to find people in this role in SA"]
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

    // Step 2: Execute web searches with Firecrawl
    const webResults: WebSearchResult[] = [];
    const searchQueries = parsed.searchQueries || [
      `${parsed.role} ${parsed.location} site:linkedin.com`,
      `${parsed.role} ${parsed.industry} ${parsed.location} team`,
      `${parsed.role} appointed ${parsed.location}`
    ];

    for (const query of searchQueries.slice(0, 5)) {
      try {
        console.log('[TalentMapping] Searching:', query);
        const results = await firecrawl.search(query, { limit: 5 }) as any;
        const data = results?.data || results?.web || [];

        for (const r of data) {
          if (r?.url && (r?.markdown || r?.content || r?.description)) {
            webResults.push({
              url: r.url,
              title: r.title || '',
              content: (r.markdown || r.content || r.description).substring(0, 3000),
              sourceType: r.url.includes('linkedin') ? 'linkedin' :
                          r.url.includes('news') || r.url.includes('fin24') ? 'news' : 'other'
            });
          }
        }
      } catch (err) {
        console.log('[TalentMapping] Search error (continuing):', err);
      }
    }

    console.log('[TalentMapping] Found', webResults.length, 'web results');

    // Step 3: Synthesize results with OpenAI
    const webContext = webResults.length > 0
      ? `\n\nWEB SEARCH RESULTS:\n${webResults.map((r, i) => `[${i+1}] ${r.url}\n${r.title}\n${r.content.substring(0, 1500)}\n---`).join('\n')}`
      : '\n\n(No web results found - provide realistic synthetic candidates based on SA market knowledge)';

    const synthesisResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a premium South African talent intelligence analyst. Generate a talent mapping report.

${SA_CONTEXT_PROMPT}

CRITICAL:
- If web results contain real people, extract them with evidence
- If no web results, generate REALISTIC synthetic candidates based on typical SA market profiles
- Always be honest about data quality and confidence
- Use real South African company names, universities, and qualifications
- Candidates should reflect SA demographics (diverse names)

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
- Must-haves: ${(parsed.mustHaves || []).join(', ')}
${webContext}

Generate a talent mapping report as JSON:
{
  "marketIntelligence": {
    "talentPoolSize": "e.g., 'Approximately 150-300 qualified professionals in Johannesburg'",
    "competitorActivity": [
      { "company": "Company hiring for similar roles", "signal": "What they're doing" }
    ],
    "salaryTrends": "e.g., 'R550k-R850k, up 8% from 2025'",
    "marketTightness": "tight" | "balanced" | "abundant",
    "recommendations": ["hiring strategy tips"]
  },
  "candidates": [
    {
      "name": "Full Name (realistic SA name)",
      "currentRole": "Job Title",
      "company": "Real SA Company",
      "industry": "Sector",
      "location": "City",
      "sources": [
        { "url": "source URL or 'inferred'", "type": "linkedin|news|company|inferred", "excerpt": "relevant quote or basis" }
      ],
      "skillsInferred": [
        { "skill": "Skill Name", "evidence": "Why we think they have this", "confidence": "high|medium|low" }
      ],
      "availabilitySignals": {
        "score": 1-10,
        "signals": ["reasons they might be open"],
        "interpretation": "summary"
      },
      "careerTrajectory": {
        "direction": "rising|stable|transitioning|unknown",
        "evidence": "Why",
        "yearsInRole": "2"
      },
      "matchScore": 1-100,
      "matchReasons": ["why they match"],
      "potentialConcerns": ["any concerns"],
      "confidence": "high|medium|low"
    }
  ]
}

Generate 5-8 candidates with varied confidence levels.`
        }
      ],
      temperature: 0.7,
      max_tokens: 4000,
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
      sources: c.sources || [{ url: 'inferred', type: 'inferred', excerpt: 'Based on market analysis' }],
      salaryEstimate: estimateSalary(c.currentRole || parsed.role, c.location || parsed.location),
      availabilitySignals: c.availabilitySignals || { score: 5, signals: ['Unknown'], interpretation: 'Insufficient data' },
      skillsInferred: c.skillsInferred || [],
      careerTrajectory: c.careerTrajectory || { direction: 'unknown', evidence: 'Unknown' },
      matchScore: c.matchScore || 70,
      matchReasons: c.matchReasons || ['Potential fit'],
      potentialConcerns: c.potentialConcerns || [],
      confidence: c.confidence || 'medium'
    }));

    const result = {
      marketIntelligence: report.marketIntelligence || {
        talentPoolSize: 'Analysis in progress',
        competitorActivity: [],
        salaryTrends: 'Contact us for detailed benchmarks',
        marketTightness: 'balanced',
        recommendations: []
      },
      candidates: enrichedCandidates,
      searchCriteria: {
        originalPrompt: prompt,
        parsed: {
          role: parsed.role || 'Unknown',
          location: parsed.location || 'South Africa',
          experience: parsed.experience || 'Not specified',
          industry: parsed.industry || 'Not specified',
          mustHaves: parsed.mustHaves || [],
          niceToHaves: parsed.niceToHaves || []
        }
      },
      sourcesSearched: webResults.length,
      completedAt: new Date().toISOString()
    };

    console.log('[TalentMapping] Complete:', enrichedCandidates.length, 'candidates from', webResults.length, 'sources');

    return NextResponse.json(result);

  } catch (error) {
    console.error('[TalentMapping] Error:', error);
    return NextResponse.json({
      error: 'Talent mapping failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
