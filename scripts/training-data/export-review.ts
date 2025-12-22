/**
 * HIREINBOX TRAINING DATA - Export for Human Review
 * Creates a CSV file for human review of AI screening results
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { JobPost } from './generate-jobs.js';
import { CV } from './generate-cvs.js';
import { ScreeningResult } from './run-screening.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ReviewRow {
  id: string;
  cv_name: string;
  cv_category: string;
  cv_location: string;
  cv_experience_summary: string;
  job_title: string;
  job_company: string;
  job_requirements: string;
  ai_score: number;
  ai_recommendation: string;
  ai_reason: string;
  ai_strengths: string;
  ai_weaknesses: string;
  ai_confidence: string;
  human_verdict: string;
  human_correct_recommendation: string;
  human_notes: string;
}

function escapeCSV(value: string): string {
  if (!value) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function generateReviewCSV(): void {
  console.log(`\n========================================`);
  console.log(`HIREINBOX - Export for Human Review`);
  console.log(`========================================\n`);

  const jobsPath = path.join(__dirname, 'data', 'jobs.json');
  const cvsPath = path.join(__dirname, 'data', 'cvs.json');
  const resultsPath = path.join(__dirname, 'data', 'screening_results.json');
  const outputPath = path.join(__dirname, 'data', 'human_review.csv');
  const fullDataPath = path.join(__dirname, 'data', 'human_review_full.json');

  if (!fs.existsSync(resultsPath)) {
    console.error('Screening results not found. Run screening first.');
    process.exit(1);
  }

  const jobs: JobPost[] = JSON.parse(fs.readFileSync(jobsPath, 'utf-8'));
  const cvs: CV[] = JSON.parse(fs.readFileSync(cvsPath, 'utf-8'));
  const results: ScreeningResult[] = JSON.parse(fs.readFileSync(resultsPath, 'utf-8'));

  console.log(`Loaded ${results.length} screening results`);

  // Create lookup maps
  const jobMap = new Map(jobs.map(j => [j.id, j]));
  const cvMap = new Map(cvs.map(c => [c.id, c]));

  // CSV Header
  const headers = [
    'ID',
    'CV Name',
    'CV Category',
    'CV Location',
    'CV Experience Summary',
    'Job Title',
    'Job Company',
    'Job Requirements',
    'AI Score',
    'AI Recommendation',
    'AI Reason',
    'AI Strengths',
    'AI Weaknesses',
    'AI Confidence',
    'HUMAN: Agree? (Y/N)',
    'HUMAN: Correct Recommendation',
    'HUMAN: Notes'
  ];

  const rows: string[] = [headers.join(',')];
  const fullData: any[] = [];

  for (const result of results) {
    const cv = cvMap.get(result.cv_id);
    const job = jobMap.get(result.job_id);

    if (!cv || !job) continue;

    // Summarize CV experience
    const expSummary = cv.work_experience
      .slice(0, 2)
      .map(e => `${e.title} at ${e.company}`)
      .join('; ');

    // Summarize job requirements
    const jobReqs = `${job.requirements.years_experience}+ yrs, ${job.requirements.required_skills.slice(0, 3).join('/')}`;

    // Summarize AI strengths/weaknesses
    const strengths = result.ai_verdict.summary?.strengths
      ?.slice(0, 2)
      .map(s => s.label)
      .join('; ') || '';
    const weaknesses = result.ai_verdict.summary?.weaknesses
      ?.slice(0, 2)
      .map(w => w.label)
      .join('; ') || '';

    const row = [
      result.id,
      cv.name,
      result.cv_category,
      cv.location,
      expSummary,
      job.job_title,
      job.company_type,
      jobReqs,
      result.ai_verdict.overall_score,
      result.ai_verdict.recommendation,
      result.ai_verdict.recommendation_reason,
      strengths,
      weaknesses,
      result.ai_verdict.confidence?.level || 'UNKNOWN',
      '', // Human verdict - to be filled
      '', // Human correct recommendation - to be filled
      ''  // Human notes - to be filled
    ].map(v => escapeCSV(String(v)));

    rows.push(row.join(','));

    // Full data for detailed review
    fullData.push({
      id: result.id,
      cv,
      job,
      ai_verdict: result.ai_verdict,
      human_review: {
        agree: null,
        correct_recommendation: null,
        notes: null
      }
    });
  }

  // Write CSV
  fs.writeFileSync(outputPath, rows.join('\n'));
  console.log(`CSV exported: ${outputPath}`);

  // Write full JSON for detailed review
  fs.writeFileSync(fullDataPath, JSON.stringify(fullData, null, 2));
  console.log(`Full data exported: ${fullDataPath}`);

  // Generate summary stats
  const stats = {
    total: results.length,
    by_category: {} as Record<string, number>,
    by_recommendation: {} as Record<string, number>,
    by_score_range: {
      '80-100 (SHORTLIST)': 0,
      '60-79 (CONSIDER)': 0,
      '40-59 (WEAK REJECT)': 0,
      '0-39 (STRONG REJECT)': 0
    }
  };

  for (const result of results) {
    // By category
    stats.by_category[result.cv_category] = (stats.by_category[result.cv_category] || 0) + 1;

    // By recommendation
    const rec = result.ai_verdict.recommendation;
    stats.by_recommendation[rec] = (stats.by_recommendation[rec] || 0) + 1;

    // By score range
    const score = result.ai_verdict.overall_score;
    if (score >= 80) stats.by_score_range['80-100 (SHORTLIST)']++;
    else if (score >= 60) stats.by_score_range['60-79 (CONSIDER)']++;
    else if (score >= 40) stats.by_score_range['40-59 (WEAK REJECT)']++;
    else stats.by_score_range['0-39 (STRONG REJECT)']++;
  }

  console.log(`\n========================================`);
  console.log(`SUMMARY STATS`);
  console.log(`========================================`);
  console.log(`Total screenings: ${stats.total}`);
  console.log(`\nBy CV Category:`);
  for (const [cat, count] of Object.entries(stats.by_category)) {
    console.log(`  ${cat}: ${count}`);
  }
  console.log(`\nBy AI Recommendation:`);
  for (const [rec, count] of Object.entries(stats.by_recommendation)) {
    console.log(`  ${rec}: ${count}`);
  }
  console.log(`\nBy Score Range:`);
  for (const [range, count] of Object.entries(stats.by_score_range)) {
    console.log(`  ${range}: ${count}`);
  }
  console.log(`========================================\n`);

  // Save stats
  fs.writeFileSync(
    path.join(__dirname, 'data', 'stats.json'),
    JSON.stringify(stats, null, 2)
  );
}

generateReviewCSV();
