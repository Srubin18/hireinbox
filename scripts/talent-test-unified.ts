#!/usr/bin/env npx tsx
/**
 * HIREINBOX TALENT MAPPING - TERMINAL TEST
 * =========================================
 *
 * This script uses the EXACT SAME CODE as the pilot page.
 * If this works, the pilot works. If this fails, the pilot fails.
 *
 * USAGE:
 *   npx tsx scripts/talent-test-unified.ts
 *
 * INTELLIGENCE STACK (IDENTICAL TO PILOT):
 *   - Claude Opus 4.5 (synthesis)
 *   - GPT-4o (parsing)
 *   - Firecrawl (search)
 *   - SA_CONTEXT_PROMPT (market knowledge)
 */

import * as fs from 'fs';
import * as path from 'path';

// Load environment variables manually (same as compliance-test.ts)
const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const value = match[2].trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
});

// Import THE SAME CORE LIBRARY as the pilot page
import {
  runTalentMapping,
  MODELS,
  CONFIG,
  extractRoleKeywords,
  generateSearchQueries
} from '../src/lib/talent-mapping-core';

// ============================================
// TEST JOB DESCRIPTIONS
// ============================================

const TEST_JDS: Record<string, string> = {
  compliance: `Outsourced Compliance Officer – Management Role
Reporting To: 2 Directors/Owners
Location: Melrose Arch – Hybrid Role
Business Unit: External Compliance Practice
Salary: Highly Negotiable

POSITION SUMMARY
To effectively deliver a quality compliance and risk management service to our FSP clients, assist, review and advice team with any technical queries. Adherence to the compliance requirements as dictated by the FSCA, FICA and other.

MINIMUM REQUIREMENTS – QUALIFICATIONS & WORK EXPERIENCE
• Registered as a FSCA approved Compliance Officer with the FSCA
• Must be approved by the FSCA for Category I & II
• Holds a recognised Legal or Business Degree
• Passed RE1, RE3, and RE5 exams
• Minimum 8 years' proven experience in compliance and risk management within the financial services industry
• Management Experience – i.e. managing a team

COMPETENCIES AND SKILLS
• Good working knowledge of compliance legislation viz. FICA and FAIS and all other subordinate legislation
• Understanding and knowledge of risk management principles
• Knowledge of Collective Investment Schemes Control Act, Companies Act, FMA, FAIS etc`,

  sales: `Head of Sales - Property Management
Location: Johannesburg
Company: Property Management Business

Looking for an experienced Head of Sales whose role will be to bring on properties to manage in Johannesburg.

Requirements:
• 5+ years sales experience in property or real estate
• Network in Johannesburg property market
• Track record of business development`,

  rnd: `R&D Tax Incentive Senior Consultant
Location: Johannesburg or Cape Town
Company: Big 4 Consulting Firm

We are seeking a Senior Consultant to join our R&D Tax Incentive practice.

Requirements:
• 3-5 years experience in R&D tax incentives or Section 11D
• Understanding of DTIC and DSI grant processes
• CA(SA) or relevant technical qualification preferred`
};

// ============================================
// MAIN TEST FUNCTION
// ============================================

async function runTest(testName: string) {
  const jd = TEST_JDS[testName];
  if (!jd) {
    console.error(`Unknown test: ${testName}`);
    console.log('Available tests:', Object.keys(TEST_JDS).join(', '));
    process.exit(1);
  }

  console.log('='.repeat(70));
  console.log('HIREINBOX TALENT MAPPING - TERMINAL TEST');
  console.log('='.repeat(70));
  console.log('');
  console.log('INTELLIGENCE STACK (HARDCODED):');
  console.log(`  Synthesis: ${MODELS.SYNTHESIS}`);
  console.log(`  Parsing:   ${MODELS.PARSING}`);
  console.log(`  Min Candidates: ${CONFIG.MIN_CANDIDATES}`);
  console.log(`  Max Tokens: ${CONFIG.MAX_TOKENS}`);
  console.log('');
  console.log('THIS IS IDENTICAL TO THE PILOT PAGE CODE.');
  console.log('='.repeat(70));
  console.log('');

  // Show extracted keywords (for debugging)
  console.log('KEYWORD EXTRACTION TEST:');
  const keywords = extractRoleKeywords(jd.split('\n')[0]);
  console.log(`  Role: "${jd.split('\n')[0]}"`);
  console.log(`  Keywords: ${keywords.join(', ')}`);
  console.log('');

  // Show generated queries (for debugging)
  console.log('QUERY GENERATION TEST:');
  const queries = generateSearchQueries(jd.split('\n')[0], 'Johannesburg', 'finance', []);
  queries.slice(0, 5).forEach((q, i) => {
    console.log(`  ${i + 1}. ${q.query.substring(0, 65)}...`);
  });
  console.log(`  ... and ${queries.length - 5} more queries`);
  console.log('');

  // Verify API keys
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ERROR: ANTHROPIC_API_KEY not set');
    process.exit(1);
  }
  if (!process.env.OPENAI_API_KEY) {
    console.error('ERROR: OPENAI_API_KEY not set');
    process.exit(1);
  }
  if (!process.env.FIRECRAWL_API_KEY) {
    console.error('ERROR: FIRECRAWL_API_KEY not set');
    process.exit(1);
  }

  console.log('API KEYS: All present');
  console.log('');
  console.log('STARTING TALENT MAPPING...');
  console.log('='.repeat(70));
  console.log('');

  try {
    const result = await runTalentMapping(jd, {
      anthropicApiKey: process.env.ANTHROPIC_API_KEY!,
      openaiApiKey: process.env.OPENAI_API_KEY!,
      firecrawlApiKey: process.env.FIRECRAWL_API_KEY!
    });

    console.log('');
    console.log('='.repeat(70));
    console.log('RESULTS');
    console.log('='.repeat(70));
    console.log('');
    console.log(`Queries Run: ${result.searchMetrics.queriesRun}`);
    console.log(`Total Results: ${result.searchMetrics.totalResults}`);
    console.log(`Unique Results: ${result.searchMetrics.uniqueResults}`);
    console.log(`Candidates Found: ${result.candidates.length}`);
    console.log('');

    if (result.candidates.length === 0) {
      console.log('WARNING: No candidates found!');
    } else {
      console.log('TOP CANDIDATES:');
      console.log('');
      result.candidates.forEach((c, i) => {
        console.log(`${i + 1}. ${c.name}`);
        console.log(`   Role: ${c.currentRole} at ${c.company}`);
        console.log(`   LinkedIn: ${c.linkedinUrl}`);
        console.log(`   Qualifications: ${c.qualifications}`);
        console.log(`   Fit: ${c.fitReason}`);
        console.log(`   Approach: ${c.approachStrategy}`);
        console.log(`   Salary: ${c.salaryExpectation}`);
        console.log('');
      });
    }

    console.log('SEARCH QUALITY:', result.searchQuality);
    console.log('');
    console.log('MARKET INSIGHTS:', result.marketInsights);

  } catch (error: any) {
    console.error('');
    console.error('='.repeat(70));
    console.error('ERROR');
    console.error('='.repeat(70));
    console.error(error.message);
    console.error('');
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// ============================================
// CLI ENTRY POINT
// ============================================

const testName = process.argv[2] || 'compliance';
console.log(`Running test: ${testName}`);
console.log('');

runTest(testName).catch(console.error);
