import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import FirecrawlApp from '@mendable/firecrawl-js';

// ============================================
// HIREINBOX - TALENT MAPPING API
// /api/talent-mapping
//
// Takes a natural language prompt and uses AI + Firecrawl
// to find relevant candidates from public sources.
//
// Process:
// 1. AI parses the prompt to extract criteria
// 2. Firecrawl searches public web sources
// 3. AI analyzes results and extracts candidates
// ============================================

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

const firecrawl = new FirecrawlApp({
  apiKey: process.env.FIRECRAWL_API_KEY || ''
});

interface MappedCandidate {
  id: string;
  name: string;
  currentRole: string;
  company: string;
  industry: string;
  location: string;
  whyMatch: string;
  sourceLinks: string[];
  confidence: 'high' | 'medium' | 'low';
}

interface MappingResult {
  marketOverview: string;
  totalFound: number;
  candidates: MappedCandidate[];
  searchCriteria: string;
  completedAt: string;
  parsedCriteria: {
    role: string;
    location: string;
    experience: string;
    industry: string;
    qualifications: string;
    otherRequirements: string[];
  };
}

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    console.log('[TalentMapping] Received prompt:', prompt);

    // Step 1: AI parses search criteria and generates TARGETED search queries
    const criteriaResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: `You are an expert recruiter who finds REAL people from PUBLIC sources.

Parse the search request and generate search queries to find ACTUAL professionals from:
- Company team/about pages (e.g., "Pam Golding team Johannesburg")
- Industry conference speakers
- Professional association directories
- News articles mentioning professionals
- Company press releases

Respond in JSON format:
{
  "parsedCriteria": {
    "role": "job title",
    "location": "city/region",
    "experience": "years required",
    "industry": "sector",
    "qualifications": "required quals",
    "otherRequirements": ["any other requirements"]
  },
  "companySearches": [
    "specific company team page search 1",
    "specific company team page search 2"
  ],
  "industrySearches": [
    "industry association or conference search",
    "professional directory search"
  ],
  "newsSearches": [
    "news article search for professionals"
  ],
  "targetCompanies": ["list of real companies in this industry/location to search"]
}

For South African searches, include real companies like:
- Real estate: Pam Golding, Seeff, Rawson, Lew Geffen Sotheby's, RE/MAX, Just Property, Tyson Properties
- Finance: Standard Bank, FNB, Nedbank, Investec, Old Mutual, Discovery, Sanlam
- Accounting: Deloitte, PwC, EY, KPMG, BDO, SNG Grant Thornton`,
      messages: [{ role: 'user', content: prompt }]
    });

    const criteriaText = criteriaResponse.content[0].type === 'text' ? criteriaResponse.content[0].text : '';
    const criteriaMatch = criteriaText.match(/\{[\s\S]*\}/);
    const criteria = criteriaMatch ? JSON.parse(criteriaMatch[0]) : { parsedCriteria: {}, companySearches: [], industrySearches: [], newsSearches: [], targetCompanies: [] };

    console.log('[TalentMapping] Parsed criteria:', criteria.parsedCriteria);
    console.log('[TalentMapping] Target companies:', criteria.targetCompanies);

    // Step 2: Search for REAL people using Firecrawl
    interface WebResult {
      url: string;
      content: string;
      title?: string;
    }
    const webResults: WebResult[] = [];

    if (process.env.FIRECRAWL_API_KEY) {
      // Combine all search queries
      const allQueries = [
        ...(criteria.companySearches || []).slice(0, 2),
        ...(criteria.industrySearches || []).slice(0, 1),
        ...(criteria.newsSearches || []).slice(0, 1)
      ];

      for (const query of allQueries) {
        try {
          console.log('[TalentMapping] Searching:', query);

          const searchResult = await firecrawl.search(query, {
            limit: 3
          }) as any;

          const results = searchResult?.data || searchResult?.web || [];
          for (const result of results) {
            const content = result?.markdown || result?.content || result?.description || '';
            const url = result?.url || result?.link || '';
            const title = result?.title || '';
            if (content && url) {
              webResults.push({
                url,
                content: content.substring(0, 4000),
                title
              });
            }
          }
        } catch (searchErr) {
          console.log('[TalentMapping] Search error (continuing):', searchErr);
        }
      }
    }

    console.log('[TalentMapping] Found', webResults.length, 'web sources with URLs');

    // Step 3: AI extracts REAL people from the web results
    const webContext = webResults.length > 0
      ? `\n\nWEB SOURCES FOUND:\n${webResults.map((r, i) => `
SOURCE ${i + 1}: ${r.url}
Title: ${r.title || 'N/A'}
Content:
${r.content}
---`).join('\n')}`
      : '';

    const analysisResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      system: `You are an expert recruiter extracting REAL professionals from web sources.

Your job is to find and extract ACTUAL PEOPLE mentioned in the web content provided.

CRITICAL RULES:
1. ONLY include people you can VERIFY from the source content provided
2. Include the EXACT SOURCE URL where you found each person
3. Extract their ACTUAL name, role, and company as stated in the source
4. If the web sources don't contain real people matching the criteria, say so honestly
5. DO NOT invent or fabricate people - only report what you find in the sources
6. Mark confidence as "high" only if you found them directly in a source

For each candidate, provide:
- The exact name as it appears in the source
- Their actual job title
- The company they work for
- The source URL where you found them

Respond in JSON:
{
  "marketOverview": "Brief market analysis based on what you found",
  "sourcesSearched": number of sources analyzed,
  "realCandidatesFound": true/false,
  "candidates": [
    {
      "name": "Actual name from source",
      "currentRole": "Actual title from source",
      "company": "Actual company from source",
      "industry": "Industry",
      "location": "Location if mentioned",
      "whyMatch": "How they match the criteria",
      "confidence": "high if directly found, medium if inferred",
      "sourceUrl": "EXACT URL where found",
      "sourceExcerpt": "Brief quote from source mentioning them"
    }
  ],
  "noResultsReason": "If no candidates found, explain why"
}

If you cannot find real people in the sources, be honest and return an empty candidates array with an explanation.`,
      messages: [
        {
          role: 'user',
          content: `Search criteria:\n${JSON.stringify(criteria.parsedCriteria, null, 2)}\n\nOriginal request: "${prompt}"${webContext}\n\nExtract REAL people from the sources above that match the criteria. Only include people you can verify from the source content.`
        }
      ]
    });

    const responseText = analysisResponse.content[0].type === 'text' ? analysisResponse.content[0].text : '';
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error('Failed to parse AI response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    const result: MappingResult = {
      marketOverview: parsed.marketOverview || (parsed.noResultsReason ? `Search completed. ${parsed.noResultsReason}` : 'Market analysis in progress.'),
      totalFound: parsed.candidates?.length || 0,
      candidates: (parsed.candidates || []).map((c: any, i: number) => ({
        id: String(i + 1),
        name: c.name,
        currentRole: c.currentRole,
        company: c.company,
        industry: c.industry || criteria.parsedCriteria?.industry || 'Not specified',
        location: c.location || criteria.parsedCriteria?.location || 'Not specified',
        whyMatch: c.sourceExcerpt ? `${c.whyMatch}\n\nSource: "${c.sourceExcerpt}"` : c.whyMatch,
        sourceLinks: c.sourceUrl ? [c.sourceUrl] : [],
        confidence: c.confidence || 'medium'
      })),
      searchCriteria: prompt,
      completedAt: new Date().toISOString(),
      parsedCriteria: criteria.parsedCriteria || {
        role: 'Unknown',
        location: 'Unknown',
        experience: 'Unknown',
        industry: 'Unknown',
        qualifications: 'Unknown',
        otherRequirements: []
      }
    };

    console.log('[TalentMapping] Extracted', result.totalFound, 'real candidates from', webResults.length, 'sources');

    return NextResponse.json(result);

  } catch (error) {
    console.error('[TalentMapping] Error:', error);
    return NextResponse.json({
      error: 'Talent mapping failed',
      details: String(error)
    }, { status: 500 });
  }
}
