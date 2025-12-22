/**
 * HIREINBOX TRAINING DATA - CV Generator
 * Generates 1000 realistic South African CVs with varied quality
 */

import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { JobPost } from './generate-jobs.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// CV quality categories for training
const CV_CATEGORIES = {
  STRONG_MATCH: { count: 300, description: 'Clearly qualified, exceeds requirements' },
  WEAK_MATCH: { count: 300, description: 'Missing 1-2 key requirements' },
  WRONG_ROLE: { count: 200, description: 'Good candidate, wrong fit for this role' },
  EDGE_CASE: { count: 100, description: 'Career changers, gaps, overqualified' },
  POOR_CV: { count: 100, description: 'Buzzwords only, no evidence, red flags' }
};

// SA Names for realism
const SA_FIRST_NAMES = [
  'Thabo', 'Sipho', 'Mandla', 'Bongani', 'Kagiso', 'Tshepo', 'Lerato', 'Nomvula', 'Thandiwe', 'Palesa',
  'Johan', 'Pieter', 'Willem', 'Gerhard', 'Francois', 'Annemarie', 'Liesel', 'Christa', 'Elsa', 'Marie',
  'Mohammed', 'Ahmed', 'Fatima', 'Aisha', 'Yusuf', 'Zainab', 'Imran', 'Nadia', 'Rashid', 'Samira',
  'Raj', 'Priya', 'Vikram', 'Sunita', 'Deepak', 'Kavitha', 'Ravi', 'Anjali', 'Suresh', 'Meera',
  'James', 'Michael', 'Sarah', 'Emma', 'David', 'Lisa', 'Robert', 'Jennifer', 'William', 'Jessica'
];

const SA_LAST_NAMES = [
  'Molefe', 'Nkosi', 'Dlamini', 'Mkhize', 'Zulu', 'Ndlovu', 'Khumalo', 'Sithole', 'Mahlangu', 'Mokoena',
  'Van der Merwe', 'Botha', 'Pretorius', 'Du Plessis', 'Van Zyl', 'Coetzee', 'Fourie', 'Venter', 'Meyer', 'Swanepoel',
  'Khan', 'Patel', 'Naidoo', 'Pillay', 'Govender', 'Reddy', 'Naicker', 'Moodley', 'Chetty', 'Maharaj',
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Wilson', 'Anderson', 'Taylor'
];

const SA_CITIES = ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria', 'Port Elizabeth', 'Bloemfontein', 'East London', 'Polokwane', 'Nelspruit', 'Kimberley'];

const CV_GENERATION_PROMPT = `Generate a realistic South African CV in JSON format.

Target category: {category}
Category description: {category_desc}
Target job context: {job_context}

The CV should be {quality_instruction}.

SA Context:
- Use realistic SA qualifications (BCom, BA, BSc, National Diploma, CA(SA), etc.)
- Reference real SA universities (Wits, UCT, Stellenbosch, UP, UKZN, UJ, etc.)
- Include realistic SA companies in work history
- Use ZAR for any salary mentions
- Include SA phone format (+27 or 0XX XXX XXXX)

Return ONLY valid JSON:
{
  "name": "<full name>",
  "email": "<email>",
  "phone": "<SA phone>",
  "location": "<SA city>",
  "linkedin": "<optional or null>",

  "professional_summary": "<2-3 sentences>",

  "work_experience": [
    {
      "title": "<job title>",
      "company": "<company name>",
      "location": "<city>",
      "start_date": "<MMM YYYY>",
      "end_date": "<MMM YYYY or Present>",
      "bullets": ["<achievement/responsibility>", "<achievement/responsibility>"]
    }
  ],

  "education": [
    {
      "qualification": "<degree/diploma>",
      "institution": "<university/college>",
      "year": "<YYYY>",
      "details": "<optional: honours, distinctions, etc.>"
    }
  ],

  "skills": ["<skill1>", "<skill2>", "<skill3>"],

  "certifications": ["<cert1 or empty array>"],

  "languages": ["<English>", "<other SA languages>"]
}`;

export interface CV {
  id: string;
  category: string;
  target_job_id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string | null;
  professional_summary: string;
  work_experience: Array<{
    title: string;
    company: string;
    location: string;
    start_date: string;
    end_date: string;
    bullets: string[];
  }>;
  education: Array<{
    qualification: string;
    institution: string;
    year: string;
    details?: string;
  }>;
  skills: string[];
  certifications: string[];
  languages: string[];
  generated_at: string;
}

function getQualityInstruction(category: string): string {
  switch (category) {
    case 'STRONG_MATCH':
      return 'a strong candidate who exceeds requirements. Include specific metrics and achievements (e.g., "increased sales by 35%", "managed team of 8", "reduced costs by R500k"). Show clear career progression.';
    case 'WEAK_MATCH':
      return 'a candidate who is close but missing 1-2 key requirements. Maybe slightly under on experience years, or missing one required skill. Otherwise decent.';
    case 'WRONG_ROLE':
      return 'a strong candidate but for a DIFFERENT type of role. Good experience and achievements, but in a different field/function than the target job.';
    case 'EDGE_CASE':
      return 'an unusual case: either a career changer with transferable skills, someone with employment gaps (include realistic gaps), or someone overqualified for the role.';
    case 'POOR_CV':
      return 'a weak CV with vague buzzwords ("dynamic team player", "results-driven"), no specific metrics, unclear responsibilities, possible red flags like very short tenures or inconsistencies.';
    default:
      return 'a typical candidate CV.';
  }
}

async function generateCV(
  category: string,
  categoryDesc: string,
  job: JobPost,
  index: number
): Promise<CV | null> {
  const qualityInstruction = getQualityInstruction(category);
  const jobContext = `${job.job_title} at ${job.company_type} (${job.industry}). Requirements: ${job.requirements.years_experience}+ years, skills: ${job.requirements.required_skills.join(', ')}`;

  const prompt = CV_GENERATION_PROMPT
    .replace('{category}', category)
    .replace('{category_desc}', categoryDesc)
    .replace('{job_context}', jobContext)
    .replace('{quality_instruction}', qualityInstruction);

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.9, // Higher temp for variety
      max_tokens: 1200,
      messages: [
        { role: 'system', content: 'You are an expert at creating realistic South African CVs. Return only valid JSON. Be creative with names, companies, and experiences while keeping them realistic for SA.' },
        { role: 'user', content: prompt }
      ],
    });

    const responseText = completion.choices[0]?.message?.content || '';
    const cleaned = responseText.replace(/```json\s*/gi, '').replace(/```/g, '').trim();
    const cv = JSON.parse(cleaned);

    return {
      id: `cv_${String(index).padStart(4, '0')}`,
      category,
      target_job_id: job.id,
      ...cv,
      generated_at: new Date().toISOString()
    };
  } catch (error) {
    console.error(`Failed to generate CV ${index}:`, error);
    return null;
  }
}

async function generateAllCVs(jobs: JobPost[], count: number = 1000): Promise<void> {
  console.log(`\n========================================`);
  console.log(`HIREINBOX - CV Generator`);
  console.log(`Generating ${count} SA CVs...`);
  console.log(`========================================\n`);

  const cvs: CV[] = [];
  const outputPath = path.join(__dirname, 'data', 'cvs.json');
  const progressPath = path.join(__dirname, 'data', 'cvs_progress.json');

  // Create data directory
  const dataDir = path.join(__dirname, 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Resume from progress if exists
  let startIndex = 0;
  if (fs.existsSync(progressPath)) {
    const progress = JSON.parse(fs.readFileSync(progressPath, 'utf-8'));
    cvs.push(...progress.cvs);
    startIndex = progress.lastIndex + 1;
    console.log(`Resuming from index ${startIndex} (${cvs.length} CVs already generated)`);
  }

  // Build category distribution
  const categories: Array<{ category: string; desc: string }> = [];
  for (const [cat, info] of Object.entries(CV_CATEGORIES)) {
    for (let i = 0; i < info.count; i++) {
      categories.push({ category: cat, desc: info.description });
    }
  }

  let generated = cvs.length;

  for (let i = startIndex; i < count; i++) {
    const { category, desc } = categories[i];
    const job = jobs[i % jobs.length]; // Cycle through jobs

    const cv = await generateCV(category, desc, job, i);

    if (cv) {
      cvs.push(cv);
      generated++;
      console.log(`[${generated}/${count}] Generated: ${cv.name} (${category}) for ${job.job_title}`);
    }

    // Save progress every 20 CVs
    if (i % 20 === 0) {
      fs.writeFileSync(progressPath, JSON.stringify({ cvs, lastIndex: i }, null, 2));
    }

    // Rate limiting: batch pause every 30 requests
    if (i % 30 === 0 && i > 0) {
      console.log('Rate limiting pause (5 seconds)...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  // Save final output
  fs.writeFileSync(outputPath, JSON.stringify(cvs, null, 2));
  console.log(`\n========================================`);
  console.log(`COMPLETE: ${cvs.length} CVs saved to ${outputPath}`);
  console.log(`========================================\n`);

  // Cleanup progress file
  if (fs.existsSync(progressPath)) {
    fs.unlinkSync(progressPath);
  }
}

// Run if called directly
async function main() {
  const jobsPath = path.join(__dirname, 'data', 'jobs.json');

  if (!fs.existsSync(jobsPath)) {
    console.error('Jobs file not found. Run generate-jobs.ts first.');
    process.exit(1);
  }

  const jobs: JobPost[] = JSON.parse(fs.readFileSync(jobsPath, 'utf-8'));
  console.log(`Loaded ${jobs.length} jobs`);

  await generateAllCVs(jobs, 1000);
}

main().catch(console.error);

export { generateAllCVs };
