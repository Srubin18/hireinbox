/**
 * HIREINBOX - Complete Training Data Generator
 * Standalone script - no local imports
 * Run with: node generate-all.mjs
 */

import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// ============================================
// CONFIGURATION
// ============================================

const INDUSTRIES = [
  'Banking & Financial Services', 'Technology & Software', 'Retail & FMCG',
  'Mining & Resources', 'Healthcare & Pharma', 'Manufacturing',
  'Telecommunications', 'Professional Services', 'Insurance', 'Logistics & Supply Chain'
];
const SENIORITY_LEVELS = ['Junior', 'Mid-Level', 'Senior', 'Executive'];
const LOCATIONS = ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria', 'Remote SA'];

const CV_CATEGORIES = {
  STRONG_MATCH: { count: 300, desc: 'Clearly qualified, exceeds requirements' },
  WEAK_MATCH: { count: 300, desc: 'Missing 1-2 key requirements' },
  WRONG_ROLE: { count: 200, desc: 'Good candidate, wrong fit' },
  EDGE_CASE: { count: 100, desc: 'Career changers, gaps, overqualified' },
  POOR_CV: { count: 100, desc: 'Buzzwords only, no evidence' }
};

// ============================================
// PROMPTS
// ============================================

const JOB_PROMPT = `Generate a realistic South African job posting in JSON format.
Industry: {industry} | Seniority: {seniority} | Location: {location}

Return ONLY valid JSON:
{
  "job_title": "<specific title>",
  "company_type": "<e.g., 'Large SA Bank', 'Tech Startup'>",
  "industry": "<industry>",
  "location": "<city>",
  "work_mode": "<onsite|hybrid|remote>",
  "seniority": "<level>",
  "salary_range": "<e.g., 'R35,000 - R45,000 per month'>",
  "requirements": {
    "years_experience": <number>,
    "qualifications": ["<SA qualifications>"],
    "required_skills": ["<skill1>", "<skill2>", "<skill3>"],
    "nice_to_have": ["<skill1>", "<skill2>"]
  },
  "job_description": "<2-3 sentences>",
  "key_responsibilities": ["<resp1>", "<resp2>", "<resp3>"]
}`;

const CV_PROMPT = `Generate a realistic South African CV in JSON format.
Target category: {category} ({category_desc})
For job: {job_context}

Quality instruction: {quality_instruction}

Return ONLY valid JSON:
{
  "name": "<full name>",
  "email": "<email>",
  "phone": "<SA phone>",
  "location": "<SA city>",
  "professional_summary": "<2-3 sentences>",
  "work_experience": [
    {
      "title": "<job title>",
      "company": "<company>",
      "location": "<city>",
      "start_date": "<MMM YYYY>",
      "end_date": "<MMM YYYY or Present>",
      "bullets": ["<achievement>", "<achievement>"]
    }
  ],
  "education": [{"qualification": "<degree>", "institution": "<university>", "year": "<YYYY>"}],
  "skills": ["<skill1>", "<skill2>", "<skill3>"],
  "certifications": [],
  "languages": ["English"]
}`;

const SCREENING_PROMPT = `You are HireInbox's Principal Talent Scout — a world-class recruiter.

RULES:
1. ZERO INVENTED STRENGTHS - Every strength needs evidence (quote or metric)
2. EVIDENCE DISCIPLINE - Back claims with quotes or "not mentioned"
3. SCORING: SHORTLIST=80-100, CONSIDER=60-79, REJECT with positives=40-59, REJECT no positives=0-39

SA CONTEXT:
- CA(SA) = highly rigorous, BCom = standard business degree
- Top companies: Standard Bank, FNB, Discovery, Takealot, Naspers

Return ONLY valid JSON:
{
  "overall_score": <0-100>,
  "recommendation": "<SHORTLIST|CONSIDER|REJECT>",
  "recommendation_reason": "<1-2 sentences with evidence>",
  "confidence": {"level": "<HIGH|MEDIUM|LOW>", "reasons": ["<why>"]},
  "evidence_highlights": [{"claim": "<assertion>", "evidence": "<quote or metric>"}],
  "hard_requirements": {
    "met": ["<requirement>: evidence"],
    "not_met": ["<requirement>: evidence"],
    "partial": [],
    "unclear": []
  },
  "summary": {
    "strengths": [{"label": "<strength>", "evidence": "<quote>"}],
    "weaknesses": [{"label": "<weakness>", "evidence": "<quote or not mentioned>"}],
    "fit_assessment": "<3 sentences>"
  }
}`;

// ============================================
// HELPERS
// ============================================

function getQualityInstruction(category) {
  const instructions = {
    STRONG_MATCH: 'a strong candidate who exceeds requirements. Include specific metrics (e.g., "increased sales by 35%", "managed team of 8").',
    WEAK_MATCH: 'a candidate missing 1-2 key requirements. Maybe slightly under on experience years, or missing one required skill.',
    WRONG_ROLE: 'a strong candidate but for a DIFFERENT type of role. Good experience in a different field.',
    EDGE_CASE: 'an unusual case: career changer with transferable skills, employment gaps, or overqualified.',
    POOR_CV: 'a weak CV with vague buzzwords ("dynamic team player"), no specific metrics, unclear responsibilities.'
  };
  return instructions[category] || 'a typical candidate CV.';
}

async function callGPT(prompt, maxTokens = 800) {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.8,
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: 'You are an expert. Return only valid JSON, no markdown.' },
        { role: 'user', content: prompt }
      ],
    });
    const text = completion.choices[0]?.message?.content || '';
    return JSON.parse(text.replace(/```json\s*/gi, '').replace(/```/g, '').trim());
  } catch (error) {
    console.error('GPT call failed:', error.message);
    return null;
  }
}

function saveProgress(filename, data, lastIndex) {
  fs.writeFileSync(
    path.join(DATA_DIR, `${filename}_progress.json`),
    JSON.stringify({ data, lastIndex }, null, 2)
  );
}

function loadProgress(filename) {
  const progressPath = path.join(DATA_DIR, `${filename}_progress.json`);
  if (fs.existsSync(progressPath)) {
    return JSON.parse(fs.readFileSync(progressPath, 'utf-8'));
  }
  return null;
}

function saveFinal(filename, data) {
  fs.writeFileSync(path.join(DATA_DIR, `${filename}.json`), JSON.stringify(data, null, 2));
  // Cleanup progress file
  const progressPath = path.join(DATA_DIR, `${filename}_progress.json`);
  if (fs.existsSync(progressPath)) fs.unlinkSync(progressPath);
}

// ============================================
// GENERATORS
// ============================================

async function generateJobs(count = 300) {
  console.log(`\n========================================`);
  console.log(`Generating ${count} Job Posts...`);
  console.log(`========================================\n`);

  let jobs = [];
  let startIndex = 0;

  // Check for existing completed jobs
  const existingPath = path.join(DATA_DIR, 'jobs.json');
  if (fs.existsSync(existingPath)) {
    jobs = JSON.parse(fs.readFileSync(existingPath, 'utf-8'));
    if (jobs.length >= count) {
      console.log(`Jobs already generated (${jobs.length}), skipping...`);
      return jobs;
    }
  }

  // Check for progress
  const progress = loadProgress('jobs');
  if (progress) {
    jobs = progress.data;
    startIndex = progress.lastIndex + 1;
    console.log(`Resuming from index ${startIndex}`);
  }

  for (let i = startIndex; i < count; i++) {
    const industry = INDUSTRIES[i % INDUSTRIES.length];
    const seniority = SENIORITY_LEVELS[Math.floor(i / INDUSTRIES.length) % SENIORITY_LEVELS.length];
    const location = LOCATIONS[Math.floor(i / 40) % LOCATIONS.length];

    const prompt = JOB_PROMPT
      .replace('{industry}', industry)
      .replace('{seniority}', seniority)
      .replace('{location}', location);

    const job = await callGPT(prompt);
    if (job) {
      job.id = `job_${String(i).padStart(4, '0')}`;
      job.generated_at = new Date().toISOString();
      jobs.push(job);
      console.log(`[${jobs.length}/${count}] ${job.job_title} (${seniority}) - ${location}`);
    }

    // Save progress every 10
    if (i % 10 === 0) saveProgress('jobs', jobs, i);

    // Rate limit every 25
    if (i % 25 === 0 && i > 0) {
      console.log('Rate limiting (3s)...');
      await new Promise(r => setTimeout(r, 3000));
    }
  }

  saveFinal('jobs', jobs);
  console.log(`\nGenerated ${jobs.length} jobs\n`);
  return jobs;
}

async function generateCVs(jobs, count = 1000) {
  console.log(`\n========================================`);
  console.log(`Generating ${count} CVs...`);
  console.log(`========================================\n`);

  let cvs = [];
  let startIndex = 0;

  // Check for existing completed CVs
  const existingPath = path.join(DATA_DIR, 'cvs.json');
  if (fs.existsSync(existingPath)) {
    cvs = JSON.parse(fs.readFileSync(existingPath, 'utf-8'));
    if (cvs.length >= count) {
      console.log(`CVs already generated (${cvs.length}), skipping...`);
      return cvs;
    }
  }

  // Check for progress
  const progress = loadProgress('cvs');
  if (progress) {
    cvs = progress.data;
    startIndex = progress.lastIndex + 1;
    console.log(`Resuming from index ${startIndex}`);
  }

  // Build category distribution
  const categories = [];
  for (const [cat, info] of Object.entries(CV_CATEGORIES)) {
    for (let j = 0; j < info.count; j++) {
      categories.push({ category: cat, desc: info.desc });
    }
  }

  for (let i = startIndex; i < count; i++) {
    const { category, desc } = categories[i];
    const job = jobs[i % jobs.length];
    const jobContext = `${job.job_title} (${job.industry}). Requires: ${job.requirements.years_experience}+ years, ${job.requirements.required_skills.join(', ')}`;

    const prompt = CV_PROMPT
      .replace('{category}', category)
      .replace('{category_desc}', desc)
      .replace('{job_context}', jobContext)
      .replace('{quality_instruction}', getQualityInstruction(category));

    const cv = await callGPT(prompt, 1200);
    if (cv) {
      cv.id = `cv_${String(i).padStart(4, '0')}`;
      cv.category = category;
      cv.target_job_id = job.id;
      cv.generated_at = new Date().toISOString();
      cvs.push(cv);
      console.log(`[${cvs.length}/${count}] ${cv.name} (${category})`);
    }

    // Save progress every 20
    if (i % 20 === 0) saveProgress('cvs', cvs, i);

    // Rate limit every 30
    if (i % 30 === 0 && i > 0) {
      console.log('Rate limiting (5s)...');
      await new Promise(r => setTimeout(r, 5000));
    }
  }

  saveFinal('cvs', cvs);
  console.log(`\nGenerated ${cvs.length} CVs\n`);
  return cvs;
}

async function runScreening(jobs, cvs) {
  console.log(`\n========================================`);
  console.log(`Running AI Screening on ${cvs.length} CVs...`);
  console.log(`========================================\n`);

  let results = [];
  let startIndex = 0;

  // Check for existing results
  const existingPath = path.join(DATA_DIR, 'screening_results.json');
  if (fs.existsSync(existingPath)) {
    results = JSON.parse(fs.readFileSync(existingPath, 'utf-8'));
    if (results.length >= cvs.length) {
      console.log(`Screening already done (${results.length}), skipping...`);
      return results;
    }
  }

  // Check for progress
  const progress = loadProgress('screening');
  if (progress) {
    results = progress.data;
    startIndex = progress.lastIndex + 1;
    console.log(`Resuming from index ${startIndex}`);
  }

  const jobMap = new Map(jobs.map(j => [j.id, j]));

  for (let i = startIndex; i < cvs.length; i++) {
    const cv = cvs[i];
    const job = jobMap.get(cv.target_job_id) || jobs[i % jobs.length];

    // Build CV text
    const cvText = `
NAME: ${cv.name}
LOCATION: ${cv.location}
SUMMARY: ${cv.professional_summary}

EXPERIENCE:
${cv.work_experience.map(e => `${e.title} at ${e.company} (${e.start_date} - ${e.end_date})\n${e.bullets.map(b => '• ' + b).join('\n')}`).join('\n\n')}

EDUCATION: ${cv.education.map(e => `${e.qualification} - ${e.institution}`).join(', ')}
SKILLS: ${cv.skills.join(', ')}
`;

    const jobContext = `
JOB: ${job.job_title} at ${job.company_type}
REQUIREMENTS: ${job.requirements.years_experience}+ years, ${job.requirements.required_skills.join(', ')}
QUALIFICATIONS: ${job.requirements.qualifications.join(', ')}
`;

    const prompt = `${SCREENING_PROMPT}\n\nJOB:\n${jobContext}\n\nCANDIDATE CV:\n${cvText}\n\nScreen this candidate.`;

    const verdict = await callGPT(prompt, 1500);
    if (verdict) {
      results.push({
        id: `screen_${String(i).padStart(4, '0')}`,
        cv_id: cv.id,
        job_id: job.id,
        cv_category: cv.category,
        ai_verdict: verdict,
        screened_at: new Date().toISOString()
      });
      console.log(`[${results.length}/${cvs.length}] ${cv.name} → ${verdict.recommendation} (${verdict.overall_score})`);
    }

    // Save progress every 25
    if (i % 25 === 0) saveProgress('screening', results, i);

    // Rate limit every 30
    if (i % 30 === 0 && i > 0) {
      console.log('Rate limiting (5s)...');
      await new Promise(r => setTimeout(r, 5000));
    }
  }

  saveFinal('screening_results', results);
  console.log(`\nScreened ${results.length} candidates\n`);
  return results;
}

function exportReview(jobs, cvs, results) {
  console.log(`\n========================================`);
  console.log(`Exporting for Human Review...`);
  console.log(`========================================\n`);

  const jobMap = new Map(jobs.map(j => [j.id, j]));
  const cvMap = new Map(cvs.map(c => [c.id, c]));

  const headers = [
    'ID', 'CV Name', 'CV Category', 'Job Title', 'AI Score', 'AI Recommendation',
    'AI Reason', 'AI Confidence', 'HUMAN: Agree (Y/N)', 'HUMAN: Correct Rec', 'HUMAN: Notes'
  ];

  const rows = [headers.join(',')];

  for (const result of results) {
    const cv = cvMap.get(result.cv_id);
    const job = jobMap.get(result.job_id);
    if (!cv || !job) continue;

    const row = [
      result.id,
      cv.name,
      result.cv_category,
      job.job_title,
      result.ai_verdict.overall_score,
      result.ai_verdict.recommendation,
      `"${(result.ai_verdict.recommendation_reason || '').replace(/"/g, '""')}"`,
      result.ai_verdict.confidence?.level || 'UNKNOWN',
      '', '', ''
    ];
    rows.push(row.join(','));
  }

  fs.writeFileSync(path.join(DATA_DIR, 'human_review.csv'), rows.join('\n'));

  // Stats
  const stats = {
    total: results.length,
    by_category: {},
    by_recommendation: {}
  };

  for (const r of results) {
    stats.by_category[r.cv_category] = (stats.by_category[r.cv_category] || 0) + 1;
    stats.by_recommendation[r.ai_verdict.recommendation] = (stats.by_recommendation[r.ai_verdict.recommendation] || 0) + 1;
  }

  fs.writeFileSync(path.join(DATA_DIR, 'stats.json'), JSON.stringify(stats, null, 2));

  console.log(`Exported ${results.length} results to human_review.csv`);
  console.log(`Stats:`, stats);
}

// ============================================
// MAIN
// ============================================

async function main() {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║   HIREINBOX - AI TRAINING DATA GENERATOR                 ║
║   Generating: 300 jobs, 1000 CVs, 1000 screenings        ║
║   Estimated time: 2-3 hours                              ║
║   Estimated cost: ~$50-70                                ║
╚══════════════════════════════════════════════════════════╝
`);

  const startTime = Date.now();

  try {
    const jobs = await generateJobs(300);
    const cvs = await generateCVs(jobs, 1000);
    const results = await runScreening(jobs, cvs);
    exportReview(jobs, cvs, results);

    const elapsed = Math.round((Date.now() - startTime) / 1000 / 60);
    console.log(`
╔══════════════════════════════════════════════════════════╗
║   COMPLETE!                                              ║
║   Time: ${String(elapsed).padStart(3)} minutes                                      ║
║   Files in: scripts/training-data/data/                  ║
║   - jobs.json (300 jobs)                                 ║
║   - cvs.json (1000 CVs)                                  ║
║   - screening_results.json (1000 verdicts)               ║
║   - human_review.csv (for review)                        ║
╚══════════════════════════════════════════════════════════╝
`);
  } catch (error) {
    console.error('Pipeline failed:', error);
    process.exit(1);
  }
}

main();
