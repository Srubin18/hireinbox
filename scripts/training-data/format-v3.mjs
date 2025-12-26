#!/usr/bin/env node
/**
 * HireInbox V3 Fine-Tuning Data Formatter
 * Creates training data from 8,863 screenings for world-class recruiter AI
 *
 * Goal: 20x better than generic AI for CV assessment
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');

// Load all data files
console.log('[V3] Loading data files...');
const screenings = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'mega_screening.json'), 'utf-8'));
const jobs = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'mega_jobs.json'), 'utf-8'));
const cvs = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'mega_cvs.json'), 'utf-8'));

console.log(`[V3] Loaded: ${screenings.length} screenings, ${jobs.length} jobs, ${cvs.length} CVs`);

// Create lookup maps
const jobMap = new Map(jobs.map(j => [j.id, j]));
const cvMap = new Map(cvs.map(c => [c.id, c]));

// The system prompt - this is the brain we're training
const SYSTEM_PROMPT = `You are HireInbox's Principal Talent Scout — a world-class South African recruiter whose judgment consistently outperforms senior human recruiters.

Your standard is BETTER THAN HUMAN. You are 20x more accurate than generic AI tools.

CORE PRINCIPLES:
1. EVIDENCE-BASED: Every strength must have a direct quote or metric from the CV
2. SA-AWARE: You understand CA(SA), BCom, Big 4, local universities, SA salary ranges
3. CALIBRATED: SHORTLIST 80-100, CONSIDER 60-79, REJECT <60
4. KNOCKOUT SYSTEM: Hard requirements must be met before ranking
5. EXCEPTION RULE: Near-miss candidates with exceptional trajectory (2+ indicators) get CONSIDER

OUTPUT: Return valid JSON with recommendation, score, strengths (with evidence), gaps, and interview questions.`;

// Format a single training example
function formatExample(screening) {
  const job = jobMap.get(screening.job_id);
  const cv = cvMap.get(screening.cv_id);

  if (!job || !cv) return null;

  // Build the user prompt (job + CV context)
  const userPrompt = `ROLE: ${job.title}
COMPANY: ${job.company || 'SA Company'}
INDUSTRY: ${job.industry || 'General'}
SENIORITY: ${job.seniority || 'Mid-level'}

REQUIREMENTS:
- Experience: ${job.min_experience_years || 3}+ years
- Skills: ${(job.required_skills || []).join(', ') || 'Not specified'}
- Qualifications: ${(job.qualifications || []).join(', ') || 'Not specified'}
- Location: ${job.location || 'South Africa'}

CV TO SCREEN:
Name: ${cv.name}
Current Role: ${cv.current_title || 'Not specified'} at ${cv.current_company || 'Not specified'}
Experience: ${cv.years_experience || 0} years
Education: ${cv.education || 'Not specified'}
Skills: ${(cv.skills || []).join(', ') || 'Not specified'}

WORK HISTORY:
${(cv.experience || []).map(e => `- ${e.title} at ${e.company} (${e.duration || 'Duration not specified'}): ${e.achievements || 'No achievements listed'}`).join('\n')}

Evaluate this candidate against the role requirements. Return JSON.`;

  // The assistant response (the screening result)
  const assistantResponse = JSON.stringify({
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

  return {
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
      { role: 'assistant', content: assistantResponse }
    ]
  };
}

// Process all screenings
console.log('[V3] Formatting training examples...');
const trainingData = [];
let skipped = 0;

for (const screening of screenings) {
  const example = formatExample(screening);
  if (example) {
    trainingData.push(example);
  } else {
    skipped++;
  }
}

console.log(`[V3] Created ${trainingData.length} training examples (skipped ${skipped} with missing data)`);

// Balance the dataset - we want more REJECT examples to counter the bias
const shortlist = trainingData.filter(d => JSON.parse(d.messages[2].content).recommendation === 'SHORTLIST');
const consider = trainingData.filter(d => JSON.parse(d.messages[2].content).recommendation === 'CONSIDER');
const reject = trainingData.filter(d => JSON.parse(d.messages[2].content).recommendation === 'REJECT');

console.log(`[V3] Distribution: SHORTLIST=${shortlist.length}, CONSIDER=${consider.length}, REJECT=${reject.length}`);

// Create balanced dataset (oversample REJECT to fix bias)
// Target: 40% SHORTLIST, 35% CONSIDER, 25% REJECT
const targetSize = 6000;
const targetShortlist = Math.floor(targetSize * 0.40);
const targetConsider = Math.floor(targetSize * 0.35);
const targetReject = Math.floor(targetSize * 0.25);

function sampleArray(arr, n) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  // If we need more than available, repeat
  if (n > arr.length) {
    const repeated = [];
    while (repeated.length < n) {
      repeated.push(...shuffled);
    }
    return repeated.slice(0, n);
  }
  return shuffled.slice(0, n);
}

const balancedData = [
  ...sampleArray(shortlist, targetShortlist),
  ...sampleArray(consider, targetConsider),
  ...sampleArray(reject, targetReject)
].sort(() => Math.random() - 0.5); // Shuffle

console.log(`[V3] Balanced dataset: ${balancedData.length} examples`);

// Write to JSONL
const outputPath = path.join(DATA_DIR, 'finetune_v3_balanced.jsonl');
const jsonlContent = balancedData.map(d => JSON.stringify(d)).join('\n');
fs.writeFileSync(outputPath, jsonlContent);

console.log(`[V3] Written to ${outputPath}`);

// Also create a smaller validation set (10%)
const validationSize = Math.floor(balancedData.length * 0.1);
const validationData = balancedData.slice(0, validationSize);
const trainingOnly = balancedData.slice(validationSize);

const trainPath = path.join(DATA_DIR, 'finetune_v3_train.jsonl');
const validPath = path.join(DATA_DIR, 'finetune_v3_valid.jsonl');

fs.writeFileSync(trainPath, trainingOnly.map(d => JSON.stringify(d)).join('\n'));
fs.writeFileSync(validPath, validationData.map(d => JSON.stringify(d)).join('\n'));

console.log(`[V3] Split: ${trainingOnly.length} training, ${validationData.length} validation`);

// Stats
const finalStats = {
  total: balancedData.length,
  training: trainingOnly.length,
  validation: validationData.length,
  distribution: {
    shortlist: balancedData.filter(d => JSON.parse(d.messages[2].content).recommendation === 'SHORTLIST').length,
    consider: balancedData.filter(d => JSON.parse(d.messages[2].content).recommendation === 'CONSIDER').length,
    reject: balancedData.filter(d => JSON.parse(d.messages[2].content).recommendation === 'REJECT').length
  }
};

console.log('\n[V3] Final Stats:', JSON.stringify(finalStats, null, 2));
console.log('\n[V3] Ready for fine-tuning!');
