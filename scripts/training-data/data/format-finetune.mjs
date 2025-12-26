// Format training data for OpenAI fine-tuning
import fs from 'fs';

const screenings = JSON.parse(fs.readFileSync('./mega_screening.json', 'utf-8'));
const cvs = JSON.parse(fs.readFileSync('./mega_cvs.json', 'utf-8'));
const jobs = JSON.parse(fs.readFileSync('./mega_jobs.json', 'utf-8'));

// Build lookup maps
const cvMap = {};
cvs.forEach(cv => { cvMap[cv.id] = cv; });
const jobMap = {};
jobs.forEach(job => { jobMap[job.id] = job; });

// System prompt for fine-tuning (condensed but comprehensive)
const SYSTEM_PROMPT = `You are HireInbox's AI Talent Scout - an expert CV screener for South African recruitment.

CRITICAL SA CONTEXT:
- CA(SA) = Gold standard accounting qualification (<50% pass rate, 3-4 year articles)
- UCT, Wits, Stellenbosch, UP = Tier 1 universities
- Big 4 (PwC, Deloitte, EY, KPMG) = Well-trained professionals
- Investec, RMB, Discovery = High-performance culture
- Unisa = Valid degree, shows determination (DO NOT penalize)
- Head Boy/Girl, Sports Captain = Strong leadership signals
- Pr.Eng = Registered Professional Engineer
- FASSA = Fellow of Actuarial Society (elite)

SCORING CALIBRATION:
- SHORTLIST (80-100): Strong match, clear fit, interview immediately
- CONSIDER (60-79): Potential fit, needs discussion, some gaps
- REJECT (<60): Clear mismatch, missing critical requirements

EVIDENCE RULES:
- Every strength MUST have a direct quote from the CV
- Never invent or assume skills not mentioned
- Gaps must be specific and actionable

OUTPUT: Valid JSON only.`;

// Format for fine-tuning
const trainingData = [];
let matched = 0;
let skipped = 0;

screenings.forEach(screening => {
  const cv = cvMap[screening.cv_id];
  const job = jobMap[screening.job_id];

  if (!cv || !job) {
    skipped++;
    return;
  }

  matched++;

  // User message: Job + CV
  const userMessage = `ROLE: ${job.title}
COMPANY: ${job.company}
LOCATION: ${job.location || 'South Africa'}
REQUIREMENTS: ${job.requirements?.join(', ') || 'Not specified'}
NICE TO HAVE: ${job.nice_to_have?.join(', ') || 'None'}

CANDIDATE CV:
${cv.cv_text}`;

  // Assistant message: The screening result (clean JSON)
  const assistantMessage = JSON.stringify({
    overall_score: screening.overall_score,
    recommendation: screening.recommendation,
    recommendation_reason: screening.recommendation_reason,
    strengths: screening.strengths || [],
    gaps: screening.gaps || [],
    experience_match: screening.experience_match,
    skills_match_percentage: screening.skills_match_percentage,
    culture_fit_signals: screening.culture_fit_signals || [],
    risk_flags: screening.risk_flags || [],
    interview_questions: screening.interview_questions || []
  });

  trainingData.push({
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userMessage },
      { role: 'assistant', content: assistantMessage }
    ]
  });
});

console.log('=== FINE-TUNING DATA PREPARATION ===');
console.log('Matched screenings:', matched);
console.log('Skipped (missing CV/job):', skipped);
console.log('Training examples:', trainingData.length);

// Write JSONL format (one JSON object per line)
const jsonl = trainingData.map(d => JSON.stringify(d)).join('\n');
fs.writeFileSync('finetune_training.jsonl', jsonl);

const fileSizeMB = (fs.statSync('finetune_training.jsonl').size / 1024 / 1024).toFixed(2);
console.log('\nSaved to: finetune_training.jsonl');
console.log('File size:', fileSizeMB, 'MB');
console.log('\nReady for OpenAI upload!');
