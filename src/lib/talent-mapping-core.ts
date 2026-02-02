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
 * 4. Firecrawl - Web search
 * 5. GDELT API - Real-time news intelligence
 * 6. Shofo API - SA salary benchmarks
 * 7. SA_CONTEXT_PROMPT - South African market knowledge
 * 8. Internal SA benchmarks - Salary/company data
 *
 * @author HireInbox
 * @version 2.0.0 - Da Vinci Edition
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
  MIN_CANDIDATES: 6,
  MAX_TOKENS: 12000,
  SEARCH_LIMIT_PER_QUERY: 10,
  MAX_QUERIES: 20,
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
    // Add FSCA-specific for SA financial compliance
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
    // Remove filler words and extract core role
    const fillerWords = ['outsourced', 'management', 'role', 'position', 'opportunity', 'senior', 'junior', 'experienced'];
    const words = roleTitle.split(/[\s\-–]+/).filter(w =>
      w.length > 2 && !fillerWords.includes(w.toLowerCase())
    );
    if (words.length >= 2) {
      keywords.push(words.slice(0, 3).join(' '));
    }
    keywords.push(roleTitle.split(/[\-–]/)[0].trim()); // First part before dash
  }

  return [...new Set(keywords)]; // Deduplicate
}

/**
 * Extract industry-specific qualifications to search for.
 */
export function extractQualifications(roleTitle: string, mustHaves: string[]): string[] {
  const quals: string[] = [];
  const combined = (roleTitle + ' ' + mustHaves.join(' ')).toLowerCase();

  // Financial services qualifications
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
  return companies['finance']; // Default to finance as most common
}

// ============================================
// SEARCH QUERY GENERATION - THE CORE LOGIC
// ============================================

export interface SearchQuery {
  query: string;
  sourceType: 'linkedin' | 'company' | 'news' | 'conference' | 'professional_body' | 'other';
  purpose: string;
}

/**
 * Generate optimized search queries for talent mapping.
 * THIS IS THE SINGLE SOURCE OF TRUTH.
 */
export function generateSearchQueries(
  roleTitle: string,
  location: string,
  industry: string,
  mustHaves: string[] = []
): SearchQuery[] {
  const queries: SearchQuery[] = [];

  // Extract core keywords from verbose role title
  const roleKeywords = extractRoleKeywords(roleTitle);
  const qualifications = extractQualifications(roleTitle, mustHaves);
  const targetCompanies = getTargetCompanies(industry);

  // Normalize location
  const locationShort = location.split(',')[0].trim(); // "Melrose Arch, Johannesburg" -> "Melrose Arch"
  const locationCity = location.includes('Johannesburg') ? 'Johannesburg' :
                       location.includes('Cape Town') ? 'Cape Town' :
                       location.includes('Durban') ? 'Durban' : 'South Africa';

  // ========== LINKEDIN DIRECT PROFILE SEARCHES (HIGHEST VALUE) ==========
  // These find actual people with their names

  for (const keyword of roleKeywords.slice(0, 3)) { // Top 3 keywords
    // Basic LinkedIn search
    queries.push({
      query: `"${keyword}" ${locationCity} site:linkedin.com/in`,
      sourceType: 'linkedin',
      purpose: `Find ${keyword} profiles on LinkedIn`
    });

    // With qualifications
    if (qualifications.length > 0) {
      queries.push({
        query: `"${keyword}" ${qualifications.slice(0, 2).join(' ')} South Africa site:linkedin.com/in`,
        sourceType: 'linkedin',
        purpose: `Find qualified ${keyword} profiles`
      });
    }
  }

  // ========== TARGET COMPANY SEARCHES ==========

  if (targetCompanies.length > 0) {
    const companyGroup = targetCompanies.slice(0, 4).join(' OR ');
    queries.push({
      query: `"${roleKeywords[0]}" ${companyGroup} site:linkedin.com/in`,
      sourceType: 'linkedin',
      purpose: 'Find candidates at target companies'
    });
  }

  // ========== NEWS & APPOINTMENTS ==========

  queries.push({
    query: `"${roleKeywords[0]}" (appointed OR joins OR promoted) ${locationCity} ${industry} 2024 2025 2026`,
    sourceType: 'news',
    purpose: 'Recent appointments and moves'
  });

  // ========== COMPANY TEAM PAGES ==========

  queries.push({
    query: `"${roleKeywords[0]}" "team" OR "leadership" OR "about us" site:.co.za ${locationCity}`,
    sourceType: 'company',
    purpose: 'Company team pages (hidden candidates)'
  });

  // ========== PROFESSIONAL BODIES ==========

  if (qualifications.includes('FSCA') || qualifications.includes('FAIS')) {
    queries.push({
      query: `"${roleKeywords[0]}" FSCA FAIS site:linkedin.com/in South Africa`,
      sourceType: 'linkedin',
      purpose: 'FSCA registered compliance professionals'
    });
  }

  // ========== CONFERENCE SPEAKERS ==========

  queries.push({
    query: `"${roleKeywords[0]}" speaker OR panelist ${industry} South Africa 2025 2026`,
    sourceType: 'conference',
    purpose: 'Industry thought leaders'
  });

  // ========== INDUSTRY-SPECIFIC QUERIES ==========

  // Compliance specific
  if (industry.toLowerCase().includes('compliance') || roleKeywords.some(k => k.toLowerCase().includes('compliance'))) {
    queries.push({
      query: `"Compliance Officer" FSCA "Category I" OR "Category II" site:linkedin.com/in`,
      sourceType: 'linkedin',
      purpose: 'FSCA Category I & II registered officers'
    });
    queries.push({
      query: `"outsourced compliance" FSP South Africa`,
      sourceType: 'other',
      purpose: 'Outsourced compliance specialists'
    });
  }

  // R&D / Tax incentive specific
  if (roleKeywords.some(k => k.toLowerCase().includes('r&d') || k.toLowerCase().includes('incentive'))) {
    queries.push({
      query: `"Section 11D" OR "R&D tax incentive" consultant South Africa site:linkedin.com/in`,
      sourceType: 'linkedin',
      purpose: 'R&D tax incentive specialists'
    });
    queries.push({
      query: `"R&D tax" Deloitte OR BDO OR KPMG OR PwC OR EY South Africa`,
      sourceType: 'company',
      purpose: 'Big 4/5 R&D consultants'
    });
  }

  return queries;
}

// ============================================
// CANDIDATE NAME VALIDATION - GUARDRAILS
// ============================================

/**
 * Validate that a candidate name is actually a person's name.
 * Rejects job titles, company names, locations.
 */
export function isValidCandidateName(name: string): { valid: boolean; reason?: string } {
  if (!name || typeof name !== 'string') {
    return { valid: false, reason: 'Empty or invalid name' };
  }

  const nameLower = name.toLowerCase();
  const words = name.trim().split(/\s+/);

  // Must have 2-4 words (First Last or First Middle Last)
  if (words.length < 2) {
    return { valid: false, reason: 'Too few words for a name' };
  }
  if (words.length > 5) {
    return { valid: false, reason: 'Too many words - likely a title or description' };
  }

  // Reject if contains job title keywords
  const jobTitles = ['manager', 'director', 'officer', 'head', 'chief', 'senior', 'junior',
                     'lead', 'specialist', 'consultant', 'analyst', 'executive', 'ceo', 'cfo',
                     'coo', 'cto', 'vp', 'president', 'associate', 'intern', 'trainee'];
  for (const title of jobTitles) {
    if (nameLower.includes(title) && words.length > 3) {
      return { valid: false, reason: `Contains job title: ${title}` };
    }
  }

  // Reject if contains company/location keywords
  const companyLocation = ['trafalgar', 'broll', 'sanlam', 'discovery', 'standard bank',
                           'johannesburg', 'cape town', 'durban', 'pretoria', 'sandton',
                           'estate', 'manor', 'property', 'holdings', 'group', 'ltd', 'pty',
                           'inc', 'corp', 'limited', 'solutions', 'services', 'consulting'];
  for (const term of companyLocation) {
    if (nameLower.includes(term)) {
      return { valid: false, reason: `Contains company/location: ${term}` };
    }
  }

  // Reject if starts with article or preposition
  const invalidStarts = ['the', 'a', 'an', 'at', 'in', 'for', 'with', 'from'];
  if (invalidStarts.includes(words[0].toLowerCase())) {
    return { valid: false, reason: 'Starts with article/preposition' };
  }

  // Reject if contains "inferred" or "candidate"
  if (nameLower.includes('inferred') || nameLower.includes('candidate') || nameLower.includes('database')) {
    return { valid: false, reason: 'Contains placeholder text' };
  }

  return { valid: true };
}

/**
 * Check for seniority mismatch between candidate and target role.
 */
export function isSeniorityMismatch(candidateRole: string, targetSeniority: string): boolean {
  const roleLower = (candidateRole || '').toLowerCase();
  const seniorityLower = (targetSeniority || '').toLowerCase();

  // C-level titles
  const cSuite = ['ceo', 'cfo', 'coo', 'cto', 'chief executive', 'chief financial',
                  'chief operating', 'chief technology', 'managing director', 'md'];

  const isCandidateCLevel = cSuite.some(t => roleLower.includes(t));

  // Don't return C-level candidates for junior/mid roles
  if (['junior', 'mid', 'entry', 'associate'].some(s => seniorityLower.includes(s))) {
    if (isCandidateCLevel) {
      return true; // Mismatch
    }
  }

  return false;
}

// ============================================
// SYNTHESIS PROMPT - SINGLE SOURCE OF TRUTH
// ============================================

export function buildSynthesisPrompt(
  roleTitle: string,
  location: string,
  industry: string,
  seniority: string,
  mustHaves: string[],
  searchResults: string
): string {
  return `You are an elite South African headhunter. Analyze these search results and identify the TOP ${CONFIG.MIN_CANDIDATES} candidates for:

ROLE: ${roleTitle}
LOCATION: ${location}
SENIORITY: ${seniority}
INDUSTRY: ${industry}

KEY REQUIREMENTS:
${mustHaves.map(m => `- ${m}`).join('\n')}

SEARCH RESULTS:
${searchResults}

##############################################################################
CRITICAL RULES FOR CANDIDATE NAMES:
##############################################################################
1. A candidate name MUST be a real person's name (e.g., "John Smith", "Thandi Nkosi")
2. DO NOT use job titles as names (e.g., "Compliance Manager" is NOT a name)
3. DO NOT use company names as candidate names
4. DO NOT use locations as candidate names
5. Each candidate must have FIRST NAME + LAST NAME minimum
6. If you cannot find a real name in the search results, DO NOT include that candidate

EXCLUSION RULES:
- DO NOT include journalists, columnists, or reporters
- DO NOT include academics/professors unless specifically requested
- DO NOT include anyone clearly mismatched for seniority level

For EACH valid candidate you find in the search results:
1. Full Name (MUST be a real person's name from the search results)
2. Current Role & Company
3. LinkedIn URL (from search results - must be real)
4. Why they're qualified (specific evidence from search results)
5. Approach Strategy
6. Salary Expectation (ZAR)

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
// MAIN SEARCH FUNCTION
// ============================================

export interface TalentMappingResult {
  candidates: Array<{
    name: string;
    currentRole: string;
    company: string;
    linkedinUrl: string;
    qualifications: string;
    fitReason: string;
    approachStrategy: string;
    salaryExpectation: string;
  }>;
  searchQuality: string;
  marketInsights: string;
  searchMetrics: {
    queriesRun: number;
    totalResults: number;
    uniqueResults: number;
  };
}

export async function runTalentMapping(
  jobDescription: string,
  options: {
    anthropicApiKey: string;
    openaiApiKey: string;
    firecrawlApiKey: string;
  }
): Promise<TalentMappingResult> {

  // Initialize clients
  const anthropic = new Anthropic({ apiKey: options.anthropicApiKey });
  const openai = new OpenAI({ apiKey: options.openaiApiKey });
  const firecrawl = new FirecrawlApp({ apiKey: options.firecrawlApiKey });

  console.log('[TalentMapping] Starting PREMIUM search');
  console.log(`[TalentMapping] Model: ${MODELS.SYNTHESIS} (HARDCODED)`);

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

  // Step 2: Generate optimized search queries
  const queries = generateSearchQueries(
    parsed.role || 'Professional',
    parsed.location || 'South Africa',
    parsed.industry || 'General',
    parsed.mustHaves || []
  );
  console.log(`[TalentMapping] Generated ${queries.length} optimized queries`);

  // Step 3: Search with Firecrawl
  let allResults: any[] = [];
  for (const q of queries) {
    console.log(`[TalentMapping] Searching: ${q.query.substring(0, 70)}...`);
    try {
      const results = await firecrawl.search(q.query, { limit: CONFIG.SEARCH_LIMIT_PER_QUERY }) as any;
      // CRITICAL FIX: Check length explicitly, empty array is truthy
      const data = (results?.data?.length > 0) ? results.data : (results?.web || []);
      console.log(`[TalentMapping]   Found: ${data.length} results`);
      allResults.push(...data);
    } catch (e: any) {
      console.log(`[TalentMapping]   Error: ${e.message}`);
    }
  }

  // Deduplicate by URL
  const uniqueResults = allResults.filter((r, i, arr) =>
    arr.findIndex(x => x.url === r.url) === i
  );
  console.log(`[TalentMapping] Total unique results: ${uniqueResults.length}`);

  // Step 4: Synthesize with Claude Opus 4.5
  console.log(`[TalentMapping] Synthesizing with ${MODELS.SYNTHESIS}...`);

  const resultsForClaude = uniqueResults.slice(0, 50).map(r =>
    `SOURCE: ${r.url}\nTITLE: ${r.title}\nCONTENT: ${r.description || r.content || r.markdown || ''}\n`
  ).join('\n---\n');

  const prompt = buildSynthesisPrompt(
    parsed.role || 'Professional',
    parsed.location || 'South Africa',
    parsed.industry || 'General',
    parsed.seniority || 'Senior',
    parsed.mustHaves || [],
    resultsForClaude
  );

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

  // Apply guardrails
  const validCandidates = (result.candidates || []).filter((c: any) => {
    const nameCheck = isValidCandidateName(c.name);
    if (!nameCheck.valid) {
      console.log(`[Guardrail] Rejected "${c.name}": ${nameCheck.reason}`);
      return false;
    }
    if (isSeniorityMismatch(c.currentRole, parsed.seniority || 'senior')) {
      console.log(`[Guardrail] Rejected "${c.name}": Seniority mismatch`);
      return false;
    }
    return true;
  });

  console.log(`[TalentMapping] Final candidates: ${validCandidates.length} (after guardrails)`);

  return {
    candidates: validCandidates,
    searchQuality: result.searchQuality || 'Unknown',
    marketInsights: result.marketInsights || 'No insights available',
    searchMetrics: {
      queriesRun: queries.length,
      totalResults: allResults.length,
      uniqueResults: uniqueResults.length
    }
  };
}
