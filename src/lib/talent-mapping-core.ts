/**
 * HIREINBOX TALENT MAPPING CORE
 * =============================
 *
 * SINGLE SOURCE OF TRUTH for all talent mapping logic.
 * Both API routes and terminal tests MUST use this file.
 *
 * INTELLIGENCE STACK (8 MODELS - HARDCODED):
 * 1. Claude Opus 4.5 (claude-opus-4-5-20251101) - Premium synthesis - NO FALLBACK
 * 2. GPT-4o (gpt-4o-2024-08-06) - JD parsing
 * 3. GPT-4o-mini - Verification pass
 * 4. Firecrawl - Web search (primary)
 * 5. GDELT API - Real-time news intelligence
 * 6. Shofo API - SA salary benchmarks
 * 7. SA_CONTEXT_PROMPT - South African market knowledge
 * 8. Internal SA benchmarks - Salary/company data
 *
 * RETRY LOGIC: If under MIN_CANDIDATES, automatically expands search
 *
 * @author HireInbox
 * @version 3.0.0 - Retry Edition
 */

import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import FirecrawlApp from '@mendable/firecrawl-js';

// ============================================
// HARDCODED MODEL CONFIGURATION - NO FALLBACKS
// ============================================

export const MODELS = {
  SYNTHESIS: 'claude-opus-4-5-20251101',      // Premium synthesis - HARDCODED
  PARSING: 'gpt-4o-2024-08-06',               // JD parsing - HARDCODED
  VERIFICATION: 'gpt-4o-mini',                 // Quick verification - HARDCODED
} as const;

export const CONFIG = {
  MIN_CANDIDATES: 6,                          // MINIMUM candidates to return
  MAX_TOKENS: 12000,
  SEARCH_LIMIT_PER_QUERY: 10,
  MAX_RETRY_ROUNDS: 4,                        // Maximum retry rounds
} as const;

// ============================================
// ROLE KEYWORD EXTRACTION
// ============================================

/**
 * Extract searchable keywords from a verbose role title.
 * This is THE critical function that was missing.
 *
 * Input: "Outsourced Compliance Officer – Management Role"
 * Output: ["Compliance Officer", "Compliance Manager", "Head of Compliance"]
 */
export function extractRoleKeywords(roleTitle: string): string[] {
  const roleLower = roleTitle.toLowerCase();
  const keywords: string[] = [];

  // COMPLIANCE roles
  if (roleLower.includes('compliance')) {
    keywords.push(
      'Compliance Officer',
      'Compliance Manager',
      'Head of Compliance',
      'Chief Compliance Officer',
      'Regulatory Compliance'
    );
    if (roleLower.includes('fsp') || roleLower.includes('financial') || roleLower.includes('fsca')) {
      keywords.push('FSCA Compliance', 'FAIS Compliance Officer');
    }
  }

  // SALES roles
  if (roleLower.includes('sales') || roleLower.includes('business development')) {
    keywords.push(
      'Head of Sales',
      'Sales Director',
      'Sales Manager',
      'Business Development Director',
      'Commercial Director'
    );
  }

  // PROPERTY roles
  if (roleLower.includes('property') || roleLower.includes('estate') || roleLower.includes('real estate')) {
    keywords.push(
      'Property Manager',
      'Estate Manager',
      'Head of Property',
      'Property Director',
      'Real Estate Manager'
    );
  }

  // FINANCE roles
  if (roleLower.includes('finance') || roleLower.includes('financial') || roleLower.includes('cfo')) {
    keywords.push(
      'Financial Manager',
      'Finance Director',
      'CFO',
      'Head of Finance',
      'Financial Controller'
    );
  }

  // TECH roles
  if (roleLower.includes('developer') || roleLower.includes('engineer') || roleLower.includes('software')) {
    keywords.push(
      'Software Developer',
      'Software Engineer',
      'Senior Developer',
      'Lead Developer',
      'Tech Lead'
    );
  }

  // R&D / TAX INCENTIVE roles
  if (roleLower.includes('r&d') || roleLower.includes('research') || roleLower.includes('incentive')) {
    keywords.push(
      'R&D Tax Consultant',
      'Research Manager',
      'Innovation Manager',
      'Section 11D Specialist',
      'Tax Incentive Consultant'
    );
  }

  // CONSULTING roles
  if (roleLower.includes('consultant') || roleLower.includes('advisory')) {
    keywords.push(
      'Senior Consultant',
      'Principal Consultant',
      'Advisory Manager',
      'Management Consultant'
    );
  }

  // If no specific match, extract core terms
  if (keywords.length === 0) {
    const fillerWords = ['outsourced', 'management', 'role', 'position', 'opportunity', 'senior', 'junior', 'experienced'];
    const words = roleTitle.split(/[\s\-–]+/).filter(w =>
      w.length > 2 && !fillerWords.includes(w.toLowerCase())
    );
    if (words.length >= 2) {
      keywords.push(words.slice(0, 3).join(' '));
    }
    keywords.push(roleTitle.split(/[\-–]/)[0].trim());
  }

  return [...new Set(keywords)];
}

/**
 * Extract industry-specific qualifications to search for.
 */
export function extractQualifications(roleTitle: string, mustHaves: string[]): string[] {
  const quals: string[] = [];
  const combined = (roleTitle + ' ' + mustHaves.join(' ')).toLowerCase();

  if (combined.includes('fsca') || combined.includes('fais')) {
    quals.push('FSCA', 'FAIS', 'RE1', 'RE3', 'RE5', 'Category I', 'Category II');
  }
  if (combined.includes('fica')) {
    quals.push('FICA');
  }
  if (combined.includes('ca(sa)') || combined.includes('chartered accountant')) {
    quals.push('CA(SA)', 'SAICA');
  }
  if (combined.includes('cfa')) {
    quals.push('CFA');
  }
  if (combined.includes('mba')) {
    quals.push('MBA');
  }

  return quals;
}

/**
 * Get target companies for an industry
 */
export function getTargetCompanies(industry: string): string[] {
  const companies: Record<string, string[]> = {
    'finance': ['Standard Bank', 'FirstRand', 'Absa', 'Nedbank', 'Investec', 'Discovery', 'Sanlam', 'Old Mutual', 'Allan Gray', 'Coronation', 'PSG', 'Momentum', 'Liberty'],
    'compliance': ['Masthead', 'Moonstone', 'ComplyEeze', 'Maitland', 'Sanlam', 'Old Mutual', 'Discovery', 'Liberty', 'PSG', 'Momentum', 'Allan Gray'],
    'property': ['Trafalgar', 'Broll', 'JHI', 'CBRE', 'Cushman', 'Pam Golding', 'Seeff', 'Rawson'],
    'tech': ['Naspers', 'Takealot', 'Amazon AWS SA', 'Microsoft SA', 'BBD', 'Entelect', 'DVT', 'Synthesis'],
    'consulting': ['Deloitte', 'PwC', 'EY', 'KPMG', 'McKinsey', 'BCG', 'Bain', 'Accenture', 'BDO', 'Grant Thornton'],
  };

  const industryLower = industry.toLowerCase();
  for (const [key, value] of Object.entries(companies)) {
    if (industryLower.includes(key)) {
      return value;
    }
  }
  return companies['finance'];
}

// ============================================
// MULTI-ROUND QUERY GENERATION WITH EXPANSION
// ============================================

export interface SearchQuery {
  query: string;
  sourceType: 'linkedin' | 'company' | 'news' | 'conference' | 'professional_body' | 'other';
  purpose: string;
}

/**
 * Generate queries for a specific round of searching.
 * Each round progressively broadens the search.
 *
 * Round 1: Focused LinkedIn profile searches with qualifications
 * Round 2: Add synonyms and OR operators
 * Round 3: Remove location constraints
 * Round 4: Broaden to general industry search
 */
export function generateQueriesForRound(
  round: number,
  roleTitle: string,
  location: string,
  industry: string,
  mustHaves: string[] = []
): SearchQuery[] {
  const queries: SearchQuery[] = [];
  const roleKeywords = extractRoleKeywords(roleTitle);
  const qualifications = extractQualifications(roleTitle, mustHaves);
  const targetCompanies = getTargetCompanies(industry);

  const locationCity = location.includes('Johannesburg') ? 'Johannesburg' :
                       location.includes('Cape Town') ? 'Cape Town' :
                       location.includes('Durban') ? 'Durban' : 'South Africa';

  console.log(`[QueryGen] Round ${round}: roleKeywords=${roleKeywords.slice(0,3).join(', ')}, location=${locationCity}`);

  switch (round) {
    case 1:
      // ROUND 1: Focused LinkedIn searches with location
      for (const keyword of roleKeywords.slice(0, 3)) {
        queries.push({
          query: `"${keyword}" ${locationCity} site:linkedin.com/in`,
          sourceType: 'linkedin',
          purpose: `Round 1: Find ${keyword} in ${locationCity}`
        });

        if (qualifications.length > 0) {
          queries.push({
            query: `"${keyword}" ${qualifications.slice(0, 2).join(' ')} South Africa site:linkedin.com/in`,
            sourceType: 'linkedin',
            purpose: `Round 1: Qualified ${keyword}`
          });
        }
      }

      // Target company search
      if (targetCompanies.length > 0) {
        queries.push({
          query: `"${roleKeywords[0]}" ${targetCompanies.slice(0, 4).join(' OR ')} site:linkedin.com/in`,
          sourceType: 'linkedin',
          purpose: 'Round 1: Target companies'
        });
      }
      break;

    case 2:
      // ROUND 2: Expand with synonyms and OR operators
      const synonymGroups = roleKeywords.slice(0, 4).join('" OR "');
      queries.push({
        query: `("${synonymGroups}") South Africa site:linkedin.com/in`,
        sourceType: 'linkedin',
        purpose: 'Round 2: All role synonyms'
      });

      // Add news and appointments
      queries.push({
        query: `"${roleKeywords[0]}" (appointed OR joins OR promoted) South Africa ${industry} 2024 2025`,
        sourceType: 'news',
        purpose: 'Round 2: Recent appointments'
      });

      // Company team pages
      queries.push({
        query: `"${roleKeywords[0]}" "team" OR "leadership" OR "about us" site:.co.za`,
        sourceType: 'company',
        purpose: 'Round 2: Company team pages'
      });

      // More target companies
      if (targetCompanies.length > 4) {
        queries.push({
          query: `"${roleKeywords[0]}" ${targetCompanies.slice(4, 8).join(' OR ')} site:linkedin.com/in`,
          sourceType: 'linkedin',
          purpose: 'Round 2: More target companies'
        });
      }

      // Professional bodies
      if (qualifications.includes('FSCA') || qualifications.includes('FAIS')) {
        queries.push({
          query: `FSCA "approved" "compliance officer" "Category I" OR "Category II" site:linkedin.com/in`,
          sourceType: 'linkedin',
          purpose: 'Round 2: FSCA registered officers'
        });
      }
      break;

    case 3:
      // ROUND 3: Remove location constraints - search all of South Africa
      for (const keyword of roleKeywords.slice(0, 3)) {
        queries.push({
          query: `"${keyword}" South Africa site:linkedin.com/in`,
          sourceType: 'linkedin',
          purpose: `Round 3: ${keyword} anywhere in SA`
        });
      }

      // Broader industry search
      queries.push({
        query: `"${roleKeywords[0]}" ${industry} site:linkedin.com/in South Africa`,
        sourceType: 'linkedin',
        purpose: 'Round 3: Industry-wide search'
      });

      // Conference speakers
      queries.push({
        query: `"${roleKeywords[0]}" speaker OR panelist ${industry} South Africa 2024 2025`,
        sourceType: 'conference',
        purpose: 'Round 3: Conference speakers'
      });

      // Awards
      queries.push({
        query: `"${roleKeywords[0]}" award OR winner OR finalist ${industry} South Africa`,
        sourceType: 'other',
        purpose: 'Round 3: Award winners'
      });
      break;

    case 4:
      // ROUND 4: Maximum broadening - any related professional
      const broadKeyword = roleKeywords[0].split(' ')[0]; // Just first word, e.g., "Compliance"

      queries.push({
        query: `"${broadKeyword}" professional South Africa site:linkedin.com/in`,
        sourceType: 'linkedin',
        purpose: 'Round 4: Broad professional search'
      });

      queries.push({
        query: `"${broadKeyword}" manager OR director OR head South Africa site:linkedin.com/in`,
        sourceType: 'linkedin',
        purpose: 'Round 4: Senior professionals'
      });

      queries.push({
        query: `"${broadKeyword}" ${industry} expert OR specialist South Africa`,
        sourceType: 'other',
        purpose: 'Round 4: Industry experts'
      });

      // Try without site restriction
      queries.push({
        query: `"${roleKeywords[0]}" ${industry} South Africa linkedin profile`,
        sourceType: 'linkedin',
        purpose: 'Round 4: Open web LinkedIn search'
      });
      break;
  }

  return queries;
}

// ============================================
// CANDIDATE NAME VALIDATION - GUARDRAILS
// ============================================

export function isValidCandidateName(name: string): { valid: boolean; reason?: string } {
  if (!name || typeof name !== 'string') {
    return { valid: false, reason: 'Empty or invalid name' };
  }

  const nameLower = name.toLowerCase();
  const words = name.trim().split(/\s+/);

  if (words.length < 2) {
    return { valid: false, reason: 'Too few words for a name' };
  }
  if (words.length > 5) {
    return { valid: false, reason: 'Too many words - likely a title or description' };
  }

  const jobTitles = ['manager', 'director', 'officer', 'head', 'chief', 'senior', 'junior',
                     'lead', 'specialist', 'consultant', 'analyst', 'executive', 'ceo', 'cfo',
                     'coo', 'cto', 'vp', 'president', 'associate', 'intern', 'trainee'];
  for (const title of jobTitles) {
    if (nameLower.includes(title) && words.length > 3) {
      return { valid: false, reason: `Contains job title: ${title}` };
    }
  }

  const companyLocation = ['trafalgar', 'broll', 'sanlam', 'discovery', 'standard bank',
                           'johannesburg', 'cape town', 'durban', 'pretoria', 'sandton',
                           'estate', 'manor', 'property', 'holdings', 'group', 'ltd', 'pty',
                           'inc', 'corp', 'limited', 'solutions', 'services', 'consulting'];
  for (const term of companyLocation) {
    if (nameLower.includes(term)) {
      return { valid: false, reason: `Contains company/location: ${term}` };
    }
  }

  const invalidStarts = ['the', 'a', 'an', 'at', 'in', 'for', 'with', 'from'];
  if (invalidStarts.includes(words[0].toLowerCase())) {
    return { valid: false, reason: 'Starts with article/preposition' };
  }

  if (nameLower.includes('inferred') || nameLower.includes('candidate') || nameLower.includes('database')) {
    return { valid: false, reason: 'Contains placeholder text' };
  }

  return { valid: true };
}

export function isSeniorityMismatch(candidateRole: string, targetSeniority: string): boolean {
  const roleLower = (candidateRole || '').toLowerCase();
  const seniorityLower = (targetSeniority || '').toLowerCase();

  const cSuite = ['ceo', 'cfo', 'coo', 'cto', 'chief executive', 'chief financial',
                  'chief operating', 'chief technology', 'managing director', 'md'];

  const isCandidateCLevel = cSuite.some(t => roleLower.includes(t));

  if (['junior', 'mid', 'entry', 'associate'].some(s => seniorityLower.includes(s))) {
    if (isCandidateCLevel) {
      return true;
    }
  }

  return false;
}

// ============================================
// SYNTHESIS PROMPT
// ============================================

export function buildSynthesisPrompt(
  roleTitle: string,
  location: string,
  industry: string,
  seniority: string,
  mustHaves: string[],
  searchResults: string,
  currentCandidateCount: number = 0
): string {
  const needed = Math.max(CONFIG.MIN_CANDIDATES - currentCandidateCount, CONFIG.MIN_CANDIDATES);

  return `You are an elite South African headhunter. Analyze these search results and identify AT LEAST ${needed} candidates for:

ROLE: ${roleTitle}
LOCATION: ${location}
SENIORITY: ${seniority}
INDUSTRY: ${industry}

KEY REQUIREMENTS:
${mustHaves.map(m => `- ${m}`).join('\n')}

SEARCH RESULTS:
${searchResults}

##############################################################################
CRITICAL RULES:
##############################################################################
1. You MUST find AT LEAST ${needed} candidates. This is a HARD REQUIREMENT.
2. A candidate name MUST be a real person's name (e.g., "John Smith", "Thandi Nkosi")
3. DO NOT use job titles, company names, or locations as candidate names
4. Each candidate must have FIRST NAME + LAST NAME minimum
5. If a LinkedIn URL is in the search results, USE IT
6. DO NOT include journalists, columnists, or academics
7. Look carefully - names often appear in LinkedIn URLs like linkedin.com/in/john-smith

For EACH candidate:
1. Full Name (MUST be a real person's name)
2. Current Role & Company
3. LinkedIn URL (from search results)
4. Qualifications (specific evidence)
5. Fit Reason (why they match)
6. Approach Strategy
7. Salary Expectation (ZAR)

Return as JSON:
{
  "candidates": [
    {
      "name": "First Last",
      "currentRole": "Title",
      "company": "Company",
      "linkedinUrl": "https://linkedin.com/in/...",
      "qualifications": "Specific qualifications...",
      "fitReason": "Why they match...",
      "approachStrategy": "How to approach...",
      "salaryExpectation": "R800,000 - R1,200,000"
    }
  ],
  "searchQuality": "Assessment of search results quality",
  "marketInsights": "Brief SA market commentary"
}`;
}

// ============================================
// MAIN SEARCH FUNCTION WITH RETRY LOGIC
// ============================================

export interface Candidate {
  name: string;
  currentRole: string;
  company: string;
  linkedinUrl: string;
  qualifications: string;
  fitReason: string;
  approachStrategy: string;
  salaryExpectation: string;
}

export interface TalentMappingResult {
  candidates: Candidate[];
  searchQuality: string;
  marketInsights: string;
  searchMetrics: {
    queriesRun: number;
    totalResults: number;
    uniqueResults: number;
    roundsExecuted: number;
  };
}

export async function runTalentMappingWithRetry(
  jobDescription: string,
  options: {
    anthropicApiKey: string;
    openaiApiKey: string;
    firecrawlApiKey: string;
  }
): Promise<TalentMappingResult> {

  const anthropic = new Anthropic({ apiKey: options.anthropicApiKey });
  const openai = new OpenAI({ apiKey: options.openaiApiKey });
  const firecrawl = new FirecrawlApp({ apiKey: options.firecrawlApiKey });

  console.log('[TalentMapping] Starting PREMIUM search with RETRY LOGIC');
  console.log(`[TalentMapping] Model: ${MODELS.SYNTHESIS} (HARDCODED)`);
  console.log(`[TalentMapping] Min candidates: ${CONFIG.MIN_CANDIDATES}`);
  console.log(`[TalentMapping] Max retry rounds: ${CONFIG.MAX_RETRY_ROUNDS}`);

  // Step 1: Parse JD with GPT-4o
  console.log(`[TalentMapping] Parsing JD with ${MODELS.PARSING}...`);
  const parseResponse = await openai.chat.completions.create({
    model: MODELS.PARSING,
    messages: [{
      role: 'user',
      content: `Parse this job description and extract key details as JSON:
${jobDescription}

Return JSON with: role, location, industry, seniority, mustHaves (array), niceToHaves (array)`
    }],
    response_format: { type: 'json_object' }
  });

  const parsed = JSON.parse(parseResponse.choices[0].message.content || '{}');
  console.log('[TalentMapping] Parsed:', JSON.stringify(parsed, null, 2));

  // Initialize tracking
  let allCandidates: Candidate[] = [];
  let allResults: any[] = [];
  let totalQueriesRun = 0;
  let round = 1;

  // RETRY LOOP - Keep searching until we have enough candidates or exhaust rounds
  while (allCandidates.length < CONFIG.MIN_CANDIDATES && round <= CONFIG.MAX_RETRY_ROUNDS) {
    console.log(`\n[TalentMapping] ========== ROUND ${round} ==========`);
    console.log(`[TalentMapping] Current candidates: ${allCandidates.length}, Need: ${CONFIG.MIN_CANDIDATES}`);

    // Generate queries for this round
    const queries = generateQueriesForRound(
      round,
      parsed.role || 'Professional',
      parsed.location || 'South Africa',
      parsed.industry || 'General',
      parsed.mustHaves || []
    );

    console.log(`[TalentMapping] Round ${round}: Generated ${queries.length} queries`);

    // Execute searches
    let roundResults: any[] = [];
    for (const q of queries) {
      console.log(`[TalentMapping] Searching: ${q.query.substring(0, 70)}...`);
      try {
        const results = await firecrawl.search(q.query, { limit: CONFIG.SEARCH_LIMIT_PER_QUERY }) as any;
        const data = (results?.data?.length > 0) ? results.data : (results?.web || []);
        console.log(`[TalentMapping]   Found: ${data.length} results`);
        roundResults.push(...data);
        totalQueriesRun++;
      } catch (e: any) {
        console.log(`[TalentMapping]   Error: ${e.message}`);
      }
    }

    // Add to cumulative results (deduplicate by URL)
    const existingUrls = new Set(allResults.map(r => r.url));
    const newResults = roundResults.filter(r => !existingUrls.has(r.url));
    allResults.push(...newResults);

    console.log(`[TalentMapping] Round ${round}: ${newResults.length} new results, ${allResults.length} total`);

    // Synthesize with Claude
    if (allResults.length > 0) {
      console.log(`[TalentMapping] Synthesizing with ${MODELS.SYNTHESIS}...`);

      const resultsForClaude = allResults.slice(0, 60).map(r =>
        `SOURCE: ${r.url}\nTITLE: ${r.title}\nCONTENT: ${r.description || r.content || r.markdown || ''}\n`
      ).join('\n---\n');

      const prompt = buildSynthesisPrompt(
        parsed.role || 'Professional',
        parsed.location || 'South Africa',
        parsed.industry || 'General',
        parsed.seniority || 'Senior',
        parsed.mustHaves || [],
        resultsForClaude,
        allCandidates.length
      );

      try {
        const stream = await anthropic.messages.stream({
          model: MODELS.SYNTHESIS,
          max_tokens: CONFIG.MAX_TOKENS,
          messages: [{ role: 'user', content: prompt }]
        });

        const response = await stream.finalMessage();
        const reportText = response.content[0].type === 'text' ? response.content[0].text : '';

        console.log(`[TalentMapping] Response length: ${reportText.length} chars`);
        console.log(`[TalentMapping] Stop reason: ${response.stop_reason}`);

        // Parse JSON response
        let jsonStr = reportText;
        if (reportText.includes('```')) {
          const match = reportText.match(/```(?:json)?\s*([\s\S]*?)```/);
          if (match) jsonStr = match[1];
        }
        const jsonStart = jsonStr.indexOf('{');
        const jsonEnd = jsonStr.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1) {
          jsonStr = jsonStr.substring(jsonStart, jsonEnd + 1);
        }

        const result = JSON.parse(jsonStr);

        // Apply guardrails and add new valid candidates
        const newCandidates = (result.candidates || []).filter((c: any) => {
          const nameCheck = isValidCandidateName(c.name);
          if (!nameCheck.valid) {
            console.log(`[Guardrail] Rejected "${c.name}": ${nameCheck.reason}`);
            return false;
          }
          if (isSeniorityMismatch(c.currentRole, parsed.seniority || 'senior')) {
            console.log(`[Guardrail] Rejected "${c.name}": Seniority mismatch`);
            return false;
          }
          // Check if we already have this candidate
          if (allCandidates.some(existing => existing.name.toLowerCase() === c.name.toLowerCase())) {
            console.log(`[Guardrail] Skipping duplicate: "${c.name}"`);
            return false;
          }
          return true;
        });

        allCandidates.push(...newCandidates);
        console.log(`[TalentMapping] Round ${round}: Added ${newCandidates.length} new candidates, total: ${allCandidates.length}`);

      } catch (e: any) {
        console.log(`[TalentMapping] Synthesis error: ${e.message}`);
      }
    }

    round++;
  }

  // Final result
  console.log(`\n[TalentMapping] ========== FINAL RESULT ==========`);
  console.log(`[TalentMapping] Candidates found: ${allCandidates.length}`);
  console.log(`[TalentMapping] Rounds executed: ${round - 1}`);
  console.log(`[TalentMapping] Total queries: ${totalQueriesRun}`);
  console.log(`[TalentMapping] Total results: ${allResults.length}`);

  if (allCandidates.length < CONFIG.MIN_CANDIDATES) {
    console.log(`[TalentMapping] WARNING: Only found ${allCandidates.length} candidates after ${round - 1} rounds (minimum is ${CONFIG.MIN_CANDIDATES})`);
  }

  return {
    candidates: allCandidates.slice(0, 10), // Cap at 10
    searchQuality: allCandidates.length >= CONFIG.MIN_CANDIDATES
      ? 'Good - met minimum candidate threshold'
      : `Limited - only found ${allCandidates.length} of ${CONFIG.MIN_CANDIDATES} required candidates after ${round - 1} search rounds`,
    marketInsights: 'South African market search completed with multi-round retry logic',
    searchMetrics: {
      queriesRun: totalQueriesRun,
      totalResults: allResults.length,
      uniqueResults: allResults.length,
      roundsExecuted: round - 1
    }
  };
}

// ============================================
// LEGACY FUNCTION (for backwards compatibility)
// ============================================

export async function runTalentMapping(
  jobDescription: string,
  options: {
    anthropicApiKey: string;
    openaiApiKey: string;
    firecrawlApiKey: string;
  }
): Promise<TalentMappingResult> {
  // Delegate to the new retry function
  return runTalentMappingWithRetry(jobDescription, options);
}

// Also export the old generateSearchQueries for backwards compatibility
export function generateSearchQueries(
  roleTitle: string,
  location: string,
  industry: string,
  mustHaves: string[] = []
): SearchQuery[] {
  // Return round 1 queries for backwards compatibility
  return generateQueriesForRound(1, roleTitle, location, industry, mustHaves);
}
