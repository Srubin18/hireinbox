/**
 * HIREINBOX TRAINING DATA - AI Screening Runner
 * Runs our TALENT_SCOUT_PROMPT on all CV-Job pairs
 */

import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { JobPost } from './generate-jobs.js';
import { CV } from './generate-cvs.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// The actual production prompt (copied from fetch-emails route)
const TALENT_SCOUT_PROMPT = `You are HireInbox's Principal Talent Scout — a world-class recruiter whose judgment consistently outperforms senior human recruiters.

Your output is used to make real hiring decisions. Your standard is BETTER THAN HUMAN.

=============================
CORE RULES (NON-NEGOTIABLE)
=============================

RULE 1 — ZERO INVENTED STRENGTHS
You are FORBIDDEN from listing any strength unless supported by CONCRETE EVIDENCE.
Evidence must be either:
- A direct quote from the CV in quotation marks, OR
- A metric/number from the CV.

FORBIDDEN PHRASES unless directly evidenced:
- Dynamic, Results-driven, Strong communicator, Team player, Self-motivated, Passionate, Leadership (without proof)

If the CV contains only buzzwords with no measurable outcomes:
Return strengths as an empty array and set evidence_highlights to empty array, and say: "Limited measurable evidence provided".

RULE 2 — EVIDENCE DISCIPLINE
EVERY claim must be backed by:
- A direct quote in quotation marks, OR
- A metric from the CV, OR
- Explicitly: "not mentioned".
Never speculate. Never infer. Never embellish.

RULE 3 — CONFIDENCE CALIBRATION
- HIGH: Multiple quantified achievements + clear progression + verifiable claims
- MEDIUM: Some evidence + gaps exist
- LOW: Mostly buzzwords or vague

RULE 4 — RISK REGISTER REQUIRED
Always include risk_register array (can be empty). Each risk requires severity + evidence + interview question.

RULE 5 — LOCATION & WORK MODE
Extract candidate_location/location_summary if present. If absent, set null.
work_mode must be: onsite|hybrid|remote|unknown.

RULE 6 — ALTERNATIVE ROLES
Only suggest alt roles if there is concrete evidence.

=============================
SOUTH AFRICAN CONTEXT
=============================

QUALIFICATIONS (ranked):
- CA(SA) = Chartered Accountant, 3-year articles, highly rigorous
- BCom Honours = 4-year degree, strong foundation
- BCom = 3-year degree, standard business
- National Diploma = 3-year practical, often underrated
- NQF Levels: 5=diploma, 6=degree, 7=honours, 8=masters, 10=doctorate

TOP SA COMPANIES BY SECTOR:
- Banking: Standard Bank, FNB, Nedbank, Absa, Capitec, Investec
- Consulting: McKinsey SA, Bain, BCG, Deloitte, PwC, EY, KPMG
- Tech: Takealot, Naspers, Discovery, Allan Gray, Yoco, Luno
- FMCG: Unilever SA, Tiger Brands, Pioneer Foods, Distell
- Retail: Woolworths, Pick n Pay, Shoprite, Mr Price

RED FLAGS IN SA CONTEXT:
- "Retrenchment" = normal, not red flag (common restructuring)
- Gaps during 2020-2021 = COVID, ignore
- Job hopping < 1 year = question it
- Only informal sector experience = verify carefully

=============================
EXCEPTION RULE (DOMINANT)
=============================

RULE 7 — NEAR-MISS EXCEPTION (DOMINANT OVERRIDE)
This rule OVERRIDES strict minimum-experience rejection logic.

Definition:
- Experience requirement miss is within 6–12 months (e.g., requirement 3.0 years and candidate has 2.0–2.9 years AND strong evidence of trajectory).

Exceptional indicators (need 2+):
- >120% targets achieved (e.g., "142%")
- Awards / top-performer
- Rapid promotion
- Leadership signal with evidence (e.g., "managed 5 reps", "team lead")
- Clear trajectory (consistent progression + metrics)
- Major deals closed with metrics

If this exception triggers:
- recommendation MUST be "CONSIDER"
- recommendation MUST NOT be "REJECT" (REJECT IS FORBIDDEN)
- hard_requirements.experience must go under "partial" with explanation
- recommendation_reason MUST explicitly state: "Exception applied"

=============================
SCORING CALIBRATION
=============================

- SHORTLIST = 80–100 (never below 80)
- CONSIDER = 60–79 (never below 60)
- REJECT with some positives = 40–59
- REJECT no positives = 0–39

If exception triggers, overall_score MUST be between 60–75.

=============================
OUTPUT FORMAT (STRICT JSON)
=============================

Return valid JSON only — no markdown, no commentary.

{
  "candidate_name": "<name or null>",
  "candidate_email": "<email or null>",
  "candidate_phone": "<phone or null>",
  "candidate_location": "<city/region or null>",
  "location_summary": "<best extracted location string or null>",
  "work_mode": "<onsite|hybrid|remote|unknown>",
  "current_title": "<title or null>",
  "current_company": "<company or null>",
  "years_experience": <number or null>,
  "education_level": "<education or null>",

  "overall_score": <0-100>,
  "recommendation": "<SHORTLIST|CONSIDER|REJECT>",
  "recommendation_reason": "<1-2 sentences with explicit evidence>",

  "confidence": {
    "level": "<HIGH|MEDIUM|LOW>",
    "reasons": ["<why>"]
  },

  "evidence_highlights": [
    {"claim": "<assertion>", "evidence": "<direct quote or metric>"}
  ],

  "hard_requirements": {
    "met": ["<requirement>: \\"<quote>\\""],
    "not_met": ["<requirement>: not mentioned OR \\"<quote>\\""],
    "partial": ["<requirement>: \\"<quote>\\" — <why partial>"],
    "unclear": ["<requirement>: <why unclear>"]
  },

  "risk_register": [
    {
      "risk": "<risk label>",
      "severity": "<LOW|MEDIUM|HIGH>",
      "evidence": "<quote or 'not mentioned'>",
      "interview_question": "<question>"
    }
  ],

  "interview_focus": ["<q1>","<q2>","<q3>"],

  "summary": {
    "strengths": [{"label":"<strength>","evidence":"<quote or metric>"}],
    "weaknesses": [{"label":"<weakness>","evidence":"<quote or not mentioned>"}],
    "fit_assessment": "<3-5 sentences: worth meeting? what excites? what could go wrong?>"
  }
}`;

export interface ScreeningResult {
  id: string;
  cv_id: string;
  job_id: string;
  cv_category: string;
  ai_verdict: {
    overall_score: number;
    recommendation: string;
    recommendation_reason: string;
    confidence: { level: string; reasons: string[] };
    evidence_highlights: Array<{ claim: string; evidence: string }>;
    hard_requirements: {
      met: string[];
      not_met: string[];
      partial: string[];
      unclear: string[];
    };
    risk_register: Array<{
      risk: string;
      severity: string;
      evidence: string;
      interview_question: string;
    }>;
    summary: {
      strengths: Array<{ label: string; evidence: string }>;
      weaknesses: Array<{ label: string; evidence: string }>;
      fit_assessment: string;
    };
  };
  screened_at: string;
}

function cvToText(cv: CV): string {
  let text = `
NAME: ${cv.name}
EMAIL: ${cv.email}
PHONE: ${cv.phone}
LOCATION: ${cv.location}

PROFESSIONAL SUMMARY:
${cv.professional_summary}

WORK EXPERIENCE:
`;

  for (const exp of cv.work_experience) {
    text += `
${exp.title} at ${exp.company} (${exp.location})
${exp.start_date} - ${exp.end_date}
`;
    for (const bullet of exp.bullets) {
      text += `• ${bullet}\n`;
    }
  }

  text += `
EDUCATION:
`;
  for (const edu of cv.education) {
    text += `${edu.qualification} - ${edu.institution} (${edu.year})${edu.details ? ' - ' + edu.details : ''}\n`;
  }

  text += `
SKILLS: ${cv.skills.join(', ')}

CERTIFICATIONS: ${cv.certifications.length > 0 ? cv.certifications.join(', ') : 'None listed'}

LANGUAGES: ${cv.languages.join(', ')}
`;

  return text;
}

function jobToContext(job: JobPost): string {
  return `
JOB TITLE: ${job.job_title}
COMPANY: ${job.company_type}
INDUSTRY: ${job.industry}
LOCATION: ${job.location}
WORK MODE: ${job.work_mode}
SENIORITY: ${job.seniority}
SALARY: ${job.salary_range}

REQUIREMENTS:
- Years of experience: ${job.requirements.years_experience}+
- Qualifications: ${job.requirements.qualifications.join(', ')}
- Required skills: ${job.requirements.required_skills.join(', ')}
- Nice to have: ${job.requirements.nice_to_have.join(', ')}

JOB DESCRIPTION:
${job.job_description}

KEY RESPONSIBILITIES:
${job.key_responsibilities.map(r => '• ' + r).join('\n')}
`;
}

async function screenCV(cv: CV, job: JobPost, index: number): Promise<ScreeningResult | null> {
  const cvText = cvToText(cv);
  const jobContext = jobToContext(job);

  const userMessage = `
ROLE REQUIREMENTS:
${jobContext}

CANDIDATE CV:
${cvText}

Screen this candidate for the role. Return your assessment as JSON.
`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.3,
      max_tokens: 1500,
      messages: [
        { role: 'system', content: TALENT_SCOUT_PROMPT },
        { role: 'user', content: userMessage }
      ],
    });

    const responseText = completion.choices[0]?.message?.content || '';
    const cleaned = responseText.replace(/```json\s*/gi, '').replace(/```/g, '').trim();
    const verdict = JSON.parse(cleaned);

    return {
      id: `screen_${String(index).padStart(4, '0')}`,
      cv_id: cv.id,
      job_id: job.id,
      cv_category: cv.category,
      ai_verdict: verdict,
      screened_at: new Date().toISOString()
    };
  } catch (error) {
    console.error(`Failed to screen CV ${index}:`, error);
    return null;
  }
}

async function runAllScreening(): Promise<void> {
  console.log(`\n========================================`);
  console.log(`HIREINBOX - AI Screening Runner`);
  console.log(`Running screening on all CV-Job pairs...`);
  console.log(`========================================\n`);

  const jobsPath = path.join(__dirname, 'data', 'jobs.json');
  const cvsPath = path.join(__dirname, 'data', 'cvs.json');
  const outputPath = path.join(__dirname, 'data', 'screening_results.json');
  const progressPath = path.join(__dirname, 'data', 'screening_progress.json');

  if (!fs.existsSync(jobsPath) || !fs.existsSync(cvsPath)) {
    console.error('Jobs or CVs file not found. Run generators first.');
    process.exit(1);
  }

  const jobs: JobPost[] = JSON.parse(fs.readFileSync(jobsPath, 'utf-8'));
  const cvs: CV[] = JSON.parse(fs.readFileSync(cvsPath, 'utf-8'));

  console.log(`Loaded ${jobs.length} jobs and ${cvs.length} CVs`);

  const results: ScreeningResult[] = [];

  // Resume from progress if exists
  let startIndex = 0;
  if (fs.existsSync(progressPath)) {
    const progress = JSON.parse(fs.readFileSync(progressPath, 'utf-8'));
    results.push(...progress.results);
    startIndex = progress.lastIndex + 1;
    console.log(`Resuming from index ${startIndex} (${results.length} screenings already done)`);
  }

  const totalToScreen = cvs.length;
  let screened = results.length;

  for (let i = startIndex; i < totalToScreen; i++) {
    const cv = cvs[i];
    // Find the target job for this CV
    const job = jobs.find(j => j.id === cv.target_job_id) || jobs[i % jobs.length];

    const result = await screenCV(cv, job, i);

    if (result) {
      results.push(result);
      screened++;
      console.log(`[${screened}/${totalToScreen}] Screened: ${cv.name} (${cv.category}) → ${result.ai_verdict.recommendation} (${result.ai_verdict.overall_score})`);
    }

    // Save progress every 25 screenings
    if (i % 25 === 0) {
      fs.writeFileSync(progressPath, JSON.stringify({ results, lastIndex: i }, null, 2));
    }

    // Rate limiting
    if (i % 30 === 0 && i > 0) {
      console.log('Rate limiting pause (5 seconds)...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  // Save final output
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\n========================================`);
  console.log(`COMPLETE: ${results.length} screenings saved to ${outputPath}`);
  console.log(`========================================\n`);

  // Cleanup progress file
  if (fs.existsSync(progressPath)) {
    fs.unlinkSync(progressPath);
  }
}

runAllScreening().catch(console.error);

export { runAllScreening };
