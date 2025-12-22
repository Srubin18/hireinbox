// Generate remaining CVs and Jobs to hit 10,000 / 3,500 targets
import fs from 'fs';
import OpenAI from 'openai';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_DIR = join(__dirname, 'data');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const INDUSTRIES = ['Retail', 'Hospitality', 'Construction', 'Healthcare', 'Automotive', 'Real Estate', 'Agriculture', 'Manufacturing', 'Professional Services', 'Education', 'Beauty & Wellness', 'Transport & Logistics', 'Security', 'Food & Beverage', 'Tech Startup', 'E-commerce', 'Insurance', 'Telecommunications', 'FMCG', 'Consulting', 'Banking', 'Mining', 'Cleaning & Facilities', 'Printing & Signage', 'Pharmaceutical', 'Legal', 'Accounting', 'Marketing & Advertising', 'HR & Recruitment', 'IT Services'];

const MATCH_DISTRIBUTION = { STRONG_MATCH: 0.35, GOOD_MATCH: 0.25, PARTIAL_MATCH: 0.20, WEAK_MATCH: 0.12, CAREER_CHANGER: 0.08 };

async function generateJob(industry, companyType, index) {
  const prompt = "Generate a realistic South African " + companyType + " job posting in " + industry + ". Return JSON only: {\"title\": \"\", \"company_name\": \"<realistic SA company>\", \"industry\": \"" + industry + "\", \"company_type\": \"" + companyType + "\", \"location\": \"<SA city>\", \"min_experience_years\": <1-10>, \"salary_min\": <rand>, \"salary_max\": <rand>, \"required_skills\": [\"\"], \"qualifications\": [\"\"], \"responsibilities\": \"\", \"nice_to_have\": [\"\"]}";

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.8,
    max_tokens: 500,
    messages: [{ role: 'user', content: prompt }]
  });

  const text = response.choices[0]?.message?.content || '';
  const cleaned = text.replace(/```json\s*/gi, '').replace(/```/g, '').trim();
  const job = JSON.parse(cleaned);
  job.id = "job_" + String(index).padStart(5, '0');
  return job;
}

async function generateCV(job, matchType, index) {
  const prompt = "Generate a realistic South African CV for: " + job.title + " at " + job.company_name + " (" + job.industry + "). Match level: " + matchType + " (STRONG=perfect, GOOD=meets most, PARTIAL=some gaps, WEAK=wrong industry, CAREER_CHANGER=different background). Job needs " + job.min_experience_years + " years. Return JSON: {\"name\": \"<SA name>\", \"email\": \"\", \"phone\": \"+27\", \"location\": \"<SA city>\", \"professional_summary\": \"\", \"work_experience\": [{\"title\": \"\", \"company\": \"\", \"location\": \"\", \"start_date\": \"\", \"end_date\": \"\", \"achievements\": [\"\"]}], \"education\": [{\"qualification\": \"\", \"institution\": \"<SA uni>\", \"year\": \"\"}], \"skills\": [\"\"], \"certifications\": [\"\"], \"languages\": [\"English\"], \"school_achievements\": \"\"}";

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.9,
    max_tokens: 800,
    messages: [{ role: 'user', content: prompt }]
  });

  const text = response.choices[0]?.message?.content || '';
  const cleaned = text.replace(/```json\s*/gi, '').replace(/```/g, '').trim();
  const cv = JSON.parse(cleaned);
  cv.id = "cv_" + String(index).padStart(5, '0');
  cv.target_job_id = job.id;
  cv.match_category = matchType;
  return cv;
}

function pickMatchType() {
  const r = Math.random();
  let cumulative = 0;
  for (const [type, prob] of Object.entries(MATCH_DISTRIBUTION)) {
    cumulative += prob;
    if (r <= cumulative) return type;
  }
  return 'PARTIAL_MATCH';
}

async function main() {
  console.log('==============================================');
  console.log('   GENERATING MORE JOBS & CVS');
  console.log('   Target: 3,500 jobs / 10,000 CVs');
  console.log('==============================================\n');

  let jobs = [];
  let cvs = [];
  try {
    jobs = JSON.parse(fs.readFileSync(join(DATA_DIR, 'mega_jobs.json'), 'utf8'));
    cvs = JSON.parse(fs.readFileSync(join(DATA_DIR, 'mega_cvs.json'), 'utf8'));
  } catch (e) {
    console.log('Starting fresh...');
  }

  console.log('Existing: ' + jobs.length + ' jobs, ' + cvs.length + ' CVs\n');

  const TARGET_JOBS = 3500;
  const TARGET_CVS = 10000;

  let jobIndex = jobs.length;
  let cvIndex = cvs.length;
  const startTime = Date.now();

  const BATCH_SIZE = 5;

  while (jobs.length < TARGET_JOBS || cvs.length < TARGET_CVS) {
    // Generate jobs if needed
    if (jobs.length < TARGET_JOBS) {
      for (let i = 0; i < BATCH_SIZE && jobs.length < TARGET_JOBS; i++) {
        const industry = INDUSTRIES[Math.floor(Math.random() * INDUSTRIES.length)];
        const companyType = Math.random() < 0.7 ? 'SME' : 'Corporate';
        try {
          const job = await generateJob(industry, companyType, jobIndex++);
          jobs.push(job);
        } catch (e) {
          console.log('Job error: ' + (e.message || '').substring(0, 30));
        }
      }
      fs.writeFileSync(join(DATA_DIR, 'mega_jobs.json'), JSON.stringify(jobs, null, 2));
    }

    // Generate CVs (priority - need more of these)
    if (cvs.length < TARGET_CVS) {
      for (let i = 0; i < BATCH_SIZE && cvs.length < TARGET_CVS; i++) {
        const job = jobs[Math.floor(Math.random() * jobs.length)];
        const matchType = pickMatchType();
        try {
          const cv = await generateCV(job, matchType, cvIndex++);
          cvs.push(cv);
        } catch (e) {
          console.log('CV error: ' + (e.message || '').substring(0, 30));
        }
      }
      fs.writeFileSync(join(DATA_DIR, 'mega_cvs.json'), JSON.stringify(cvs, null, 2));
    }

    const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
    const jobPct = (jobs.length / TARGET_JOBS * 100).toFixed(1);
    const cvPct = (cvs.length / TARGET_CVS * 100).toFixed(1);

    console.log('[' + elapsed + 'min] Jobs: ' + jobs.length + '/' + TARGET_JOBS + ' (' + jobPct + '%) | CVs: ' + cvs.length + '/' + TARGET_CVS + ' (' + cvPct + '%)');

    await new Promise(r => setTimeout(r, 300));
  }

  console.log('\n=== GENERATION COMPLETE ===');
  console.log('Jobs: ' + jobs.length);
  console.log('CVs: ' + cvs.length);
}

main().catch(console.error);
