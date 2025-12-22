/**
 * HIREINBOX TRAINING DATA - Job Post Generator
 * Generates 300 realistic South African job posts
 */

import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// SA-specific configuration
const INDUSTRIES = [
  'Banking & Financial Services',
  'Technology & Software',
  'Retail & FMCG',
  'Mining & Resources',
  'Healthcare & Pharma',
  'Manufacturing',
  'Telecommunications',
  'Professional Services',
  'Insurance',
  'Logistics & Supply Chain'
];

const SENIORITY_LEVELS = ['Junior', 'Mid-Level', 'Senior', 'Executive'];
const LOCATIONS = ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria', 'Remote SA'];

const JOB_GENERATION_PROMPT = `Generate a realistic South African job posting in JSON format.

Industry: {industry}
Seniority: {seniority}
Location: {location}

Create a job that sounds like it's from a real SA company. Include realistic requirements for the SA market.

Return ONLY valid JSON:
{
  "job_title": "<specific title>",
  "company_type": "<e.g., 'Large SA Bank', 'Tech Startup', 'Retail Chain'>",
  "industry": "<industry>",
  "location": "<city>",
  "work_mode": "<onsite|hybrid|remote>",
  "seniority": "<level>",
  "salary_range": "<e.g., 'R35,000 - R45,000 per month' or 'Market related'>",
  "requirements": {
    "years_experience": <number>,
    "qualifications": ["<SA qualifications like BCom, CA(SA), National Diploma>"],
    "required_skills": ["<skill1>", "<skill2>", "<skill3>"],
    "nice_to_have": ["<skill1>", "<skill2>"]
  },
  "job_description": "<2-3 sentences about the role>",
  "key_responsibilities": ["<resp1>", "<resp2>", "<resp3>"],
  "company_culture": "<1 sentence about culture>"
}`;

export interface JobPost {
  id: string;
  job_title: string;
  company_type: string;
  industry: string;
  location: string;
  work_mode: string;
  seniority: string;
  salary_range: string;
  requirements: {
    years_experience: number;
    qualifications: string[];
    required_skills: string[];
    nice_to_have: string[];
  };
  job_description: string;
  key_responsibilities: string[];
  company_culture: string;
  generated_at: string;
}

async function generateJobPost(industry: string, seniority: string, location: string, index: number): Promise<JobPost | null> {
  const prompt = JOB_GENERATION_PROMPT
    .replace('{industry}', industry)
    .replace('{seniority}', seniority)
    .replace('{location}', location);

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Using mini for cost efficiency
      temperature: 0.8,
      max_tokens: 800,
      messages: [
        { role: 'system', content: 'You are an expert at creating realistic South African job postings. Return only valid JSON.' },
        { role: 'user', content: prompt }
      ],
    });

    const responseText = completion.choices[0]?.message?.content || '';
    const cleaned = responseText.replace(/```json\s*/gi, '').replace(/```/g, '').trim();
    const job = JSON.parse(cleaned);

    return {
      id: `job_${String(index).padStart(4, '0')}`,
      ...job,
      generated_at: new Date().toISOString()
    };
  } catch (error) {
    console.error(`Failed to generate job ${index}:`, error);
    return null;
  }
}

async function generateAllJobs(count: number = 300): Promise<void> {
  console.log(`\n========================================`);
  console.log(`HIREINBOX - Job Post Generator`);
  console.log(`Generating ${count} SA job posts...`);
  console.log(`========================================\n`);

  const jobs: JobPost[] = [];
  const outputPath = path.join(__dirname, 'data', 'jobs.json');
  const progressPath = path.join(__dirname, 'data', 'jobs_progress.json');

  // Create data directory
  const dataDir = path.join(__dirname, 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Resume from progress if exists
  let startIndex = 0;
  if (fs.existsSync(progressPath)) {
    const progress = JSON.parse(fs.readFileSync(progressPath, 'utf-8'));
    jobs.push(...progress.jobs);
    startIndex = progress.lastIndex + 1;
    console.log(`Resuming from index ${startIndex} (${jobs.length} jobs already generated)`);
  }

  const totalToGenerate = count;
  let generated = jobs.length;

  for (let i = startIndex; i < totalToGenerate; i++) {
    // Cycle through combinations
    const industry = INDUSTRIES[i % INDUSTRIES.length];
    const seniority = SENIORITY_LEVELS[Math.floor(i / INDUSTRIES.length) % SENIORITY_LEVELS.length];
    const location = LOCATIONS[Math.floor(i / (INDUSTRIES.length * SENIORITY_LEVELS.length)) % LOCATIONS.length];

    const job = await generateJobPost(industry, seniority, location, i);

    if (job) {
      jobs.push(job);
      generated++;
      console.log(`[${generated}/${totalToGenerate}] Generated: ${job.job_title} (${job.seniority}) - ${job.location}`);
    }

    // Save progress every 10 jobs
    if (i % 10 === 0) {
      fs.writeFileSync(progressPath, JSON.stringify({ jobs, lastIndex: i }, null, 2));
    }

    // Rate limiting: 20 requests per minute for safety
    if (i % 20 === 0 && i > 0) {
      console.log('Rate limiting pause (3 seconds)...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  // Save final output
  fs.writeFileSync(outputPath, JSON.stringify(jobs, null, 2));
  console.log(`\n========================================`);
  console.log(`COMPLETE: ${jobs.length} jobs saved to ${outputPath}`);
  console.log(`========================================\n`);

  // Cleanup progress file
  if (fs.existsSync(progressPath)) {
    fs.unlinkSync(progressPath);
  }
}

// Run if called directly
generateAllJobs(300).catch(console.error);

export { generateAllJobs };
