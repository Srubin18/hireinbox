// Format v2 training data: combine existing 860 + new 4,200 = 5,060 examples
import fs from 'fs';

const SYSTEM_PROMPT = `You are HireInbox's Principal Talent Scout — a world-class recruiter whose judgment consistently outperforms senior human recruiters.

Your output is used to make real hiring decisions. Your standard is BETTER THAN HUMAN.

CORE RULES:
1. ZERO INVENTED STRENGTHS - Every strength must have evidence (quote or metric)
2. EVIDENCE DISCIPLINE - Every claim backed by quote, metric, or "not mentioned"
3. CONFIDENCE CALIBRATION - HIGH/MEDIUM/LOW based on evidence quality
4. RISK REGISTER REQUIRED - Always include risks with severity + evidence
5. SA CONTEXT - Recognize UCT/Wits/Stellenbosch, CA(SA), Big 4, etc.

SCORING:
- SHORTLIST = 80-100
- CONSIDER = 60-79
- REJECT = below 60

Return valid JSON only.`;

console.log('=== FORMATTING V2 TRAINING DATA ===\n');

// Load all data files
const screenings = JSON.parse(fs.readFileSync('mega_screening.json', 'utf-8'));
const cvs = JSON.parse(fs.readFileSync('mega_cvs.json', 'utf-8'));
const jobs = JSON.parse(fs.readFileSync('mega_jobs.json', 'utf-8'));

console.log(`Loaded ${screenings.length} screenings`);
console.log(`Loaded ${cvs.length} CVs`);
console.log(`Loaded ${jobs.length} jobs`);

// Create lookup maps
const cvMap = new Map();
for (const cv of cvs) {
  cvMap.set(cv.id, cv);
}

const jobMap = new Map();
for (const job of jobs) {
  jobMap.set(job.id, job);
}

// Load existing v1 data
const existingLines = fs.readFileSync('finetune_training.jsonl', 'utf-8').trim().split('\n');
console.log(`Loaded ${existingLines.length} existing v1 examples`);

// Format new screenings
const newExamples = [];
let skipped = 0;

for (const s of screenings) {
  const cv = cvMap.get(s.cv_id);
  const job = jobMap.get(s.job_id);

  if (!cv || !job) {
    skipped++;
    continue;
  }

  // Build user message (job spec + CV)
  const userMessage = `ROLE: ${job.title || 'Unknown'}
REQUIREMENTS:
- Experience: ${job.facts?.min_experience_years || 'Not specified'} years
- Skills: ${job.facts?.required_skills?.join(', ') || 'Not specified'}
- Location: ${job.facts?.location || 'Not specified'}

CV TO EVALUATE:
${cv.cv_text?.substring(0, 4000) || cv.full_text?.substring(0, 4000) || 'No CV text'}

Evaluate this candidate against the role requirements. Return JSON with score, recommendation, evidence, and reasoning.`;

  // Build the screening result as assistant message
  const screeningResult = {
    overall_score: s.overall_score,
    recommendation: s.recommendation,
    recommendation_reason: s.recommendation_reason,
    strengths: s.strengths || [],
    gaps: s.gaps || [],
    experience_match: s.experience_match,
    skills_match_percentage: s.skills_match_percentage,
    culture_fit_signals: s.culture_fit_signals || [],
    risk_flags: s.risk_flags || [],
    interview_questions: s.interview_questions || []
  };

  newExamples.push({
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userMessage },
      { role: 'assistant', content: JSON.stringify(screeningResult) }
    ]
  });
}

console.log(`Formatted ${newExamples.length} new examples (skipped ${skipped})`);

// Combine with existing
const allExamples = [];

// Add existing v1 examples
for (const line of existingLines) {
  if (line.trim()) {
    allExamples.push(line);
  }
}

// Add new v2 examples
for (const ex of newExamples) {
  allExamples.push(JSON.stringify(ex));
}

console.log(`\nTotal combined: ${allExamples.length} examples`);

// Write combined file
fs.writeFileSync('finetune_v2_combined.jsonl', allExamples.join('\n'));
console.log('Written to: finetune_v2_combined.jsonl');

// Stats
const fileSize = fs.statSync('finetune_v2_combined.jsonl').size;
console.log(`File size: ${(fileSize / 1024 / 1024).toFixed(2)} MB`);

console.log('\n=== READY FOR FINE-TUNING ===');
