#!/usr/bin/env node

/**
 * MEGA TRAINING DATA PIPELINE
 * ===========================
 * Generates 3,500 jobs (70% SME, 30% Corporate) and 10,000 CVs
 * Then runs AI screening on all pairs
 *
 * Estimated cost: ~$25-30 with GPT-4o-mini
 */

import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const DATA_DIR = './scripts/training-data/data';
const JOBS_FILE = path.join(DATA_DIR, 'mega_jobs.json');
const CVS_FILE = path.join(DATA_DIR, 'mega_cvs.json');
const SCREENING_FILE = path.join(DATA_DIR, 'mega_screening.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// ============================================
// SOUTH AFRICAN JOB CATEGORIES
// ============================================

const SME_CATEGORIES = [
  // Retail & Services (high volume SME)
  { industry: 'Retail', roles: ['Store Manager', 'Sales Assistant', 'Visual Merchandiser', 'Stock Controller', 'Cashier Supervisor', 'Area Manager'] },
  { industry: 'Hospitality', roles: ['Restaurant Manager', 'Chef', 'Front of House Manager', 'Events Coordinator', 'Barista', 'Hotel Receptionist'] },
  { industry: 'Construction', roles: ['Site Manager', 'Quantity Surveyor', 'Project Coordinator', 'Foreman', 'Safety Officer', 'Estimator'] },
  { industry: 'Healthcare (Private)', roles: ['Practice Manager', 'Dental Assistant', 'Physiotherapist', 'Optometrist', 'Pharmacy Assistant', 'Medical Receptionist'] },
  { industry: 'Automotive', roles: ['Workshop Manager', 'Service Advisor', 'Parts Manager', 'Auto Electrician', 'Panel Beater', 'Sales Executive'] },
  { industry: 'Real Estate', roles: ['Estate Agent', 'Property Manager', 'Rental Agent', 'Leasing Consultant', 'Valuator', 'Admin Assistant'] },
  { industry: 'Agriculture', roles: ['Farm Manager', 'Agricultural Consultant', 'Livestock Manager', 'Agronomist', 'Pack House Supervisor', 'Export Coordinator'] },
  { industry: 'Manufacturing (SME)', roles: ['Production Manager', 'Quality Controller', 'Maintenance Technician', 'Shift Supervisor', 'Procurement Officer', 'Logistics Coordinator'] },
  { industry: 'Professional Services', roles: ['Bookkeeper', 'Tax Practitioner', 'Office Manager', 'HR Generalist', 'Legal Secretary', 'Paralegal'] },
  { industry: 'Education (Private)', roles: ['School Administrator', 'Teacher', 'Tutor', 'Educational Consultant', 'Admissions Officer', 'Sports Coach'] },
  { industry: 'Beauty & Wellness', roles: ['Salon Manager', 'Beauty Therapist', 'Hairstylist', 'Spa Manager', 'Nail Technician', 'Fitness Instructor'] },
  { industry: 'Transport & Logistics', roles: ['Fleet Manager', 'Dispatch Controller', 'Driver Supervisor', 'Warehouse Manager', 'Customs Clerk', 'Route Planner'] },
  { industry: 'Security', roles: ['Security Manager', 'Control Room Operator', 'Site Supervisor', 'Armed Response Officer', 'CCTV Operator', 'Risk Assessor'] },
  { industry: 'Cleaning & Facilities', roles: ['Operations Manager', 'Contracts Manager', 'Area Supervisor', 'Hygiene Officer', 'Maintenance Coordinator'] },
  { industry: 'Food & Beverage', roles: ['Production Manager', 'Food Technologist', 'Sales Representative', 'Distribution Manager', 'Quality Assurance', 'Brand Ambassador'] },
  { industry: 'Printing & Signage', roles: ['Production Manager', 'Graphic Designer', 'Print Estimator', 'Machine Operator', 'Sales Representative'] },
  { industry: 'Tech Startup', roles: ['Full Stack Developer', 'Product Manager', 'UX Designer', 'DevOps Engineer', 'Data Analyst', 'Growth Marketer'] },
  { industry: 'E-commerce', roles: ['E-commerce Manager', 'Digital Marketer', 'Content Creator', 'Customer Service Lead', 'Fulfilment Manager', 'SEO Specialist'] },
];

const CORPORATE_CATEGORIES = [
  // Big Corporate
  { industry: 'Banking', roles: ['Relationship Manager', 'Credit Analyst', 'Branch Manager', 'Risk Analyst', 'Investment Analyst', 'Private Banker', 'Compliance Officer', 'Treasury Analyst'] },
  { industry: 'Insurance', roles: ['Underwriter', 'Claims Manager', 'Actuarial Analyst', 'Business Development Manager', 'Product Manager', 'Policy Administrator'] },
  { industry: 'Mining', roles: ['Mining Engineer', 'Geologist', 'Safety Manager', 'Plant Manager', 'Environmental Officer', 'Procurement Manager', 'HR Manager'] },
  { industry: 'Telecommunications', roles: ['Network Engineer', 'Product Manager', 'Sales Manager', 'Customer Experience Manager', 'Data Scientist', 'Business Analyst'] },
  { industry: 'FMCG', roles: ['Brand Manager', 'Trade Marketing Manager', 'Supply Chain Manager', 'Key Account Manager', 'Category Manager', 'Demand Planner'] },
  { industry: 'Pharmaceutical', roles: ['Medical Representative', 'Regulatory Affairs Manager', 'Clinical Research Associate', 'Quality Assurance Manager', 'Product Manager'] },
  { industry: 'Consulting', roles: ['Management Consultant', 'Strategy Analyst', 'Business Analyst', 'Change Manager', 'Project Manager', 'Associate Consultant'] },
  { industry: 'Big 4 Accounting', roles: ['Audit Manager', 'Tax Consultant', 'Advisory Manager', 'Senior Associate', 'Manager', 'Director'] },
  { industry: 'Corporate Law', roles: ['Associate Attorney', 'Senior Associate', 'Legal Advisor', 'Company Secretary', 'Compliance Manager', 'Contracts Manager'] },
  { industry: 'Investment Banking', roles: ['Analyst', 'Associate', 'Portfolio Manager', 'Research Analyst', 'Corporate Finance Associate', 'Debt Capital Markets'] },
  { industry: 'Asset Management', roles: ['Portfolio Manager', 'Research Analyst', 'Client Relationship Manager', 'Fund Accountant', 'Risk Analyst', 'Operations Manager'] },
  { industry: 'Energy', roles: ['Project Engineer', 'HSE Manager', 'Operations Manager', 'Business Development', 'Renewable Energy Specialist', 'Grid Engineer'] },
];

const SA_CITIES = ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria', 'Port Elizabeth', 'Bloemfontein', 'East London', 'Nelspruit', 'Polokwane', 'Kimberley', 'Pietermaritzburg', 'Stellenbosch', 'Sandton', 'Centurion', 'Midrand', 'Soweto', 'Khayelitsha', 'Mitchells Plain', 'Umlazi', 'Mamelodi', 'Tembisa', 'Alexandra'];
const WORK_MODES = ['On-site', 'Hybrid', 'Remote', 'Flexible'];

// REAL COMPANIES FROM JOB BOARD SCRAPING
const REAL_COMPANIES = {
  retail: ['Pepkor Lifestyle', 'TFG (The Foschini Group)', 'Woolworths SA', 'Pick n Pay', 'Shoprite Checkers', 'Mr Price Group', 'Clicks Group', 'Dis-Chem', 'Massmart', 'Game', 'Makro'],
  tech: ['Takealot', 'Naspers', 'MultiChoice', 'Dimension Data', 'EOH', 'Altron', 'BCX', 'Yoco', 'Luno', 'SnapScan', 'PayFast'],
  fmcg: ['Tiger Brands', 'Unilever SA', 'Clover S.A.', 'Pioneer Foods', 'AVI Limited', 'Distell', 'Simba', 'Kellogg\'s SA'],
  banking: ['Standard Bank', 'FNB (FirstRand)', 'Absa', 'Nedbank', 'Capitec', 'Investec', 'African Bank', 'TymeBank'],
  insurance: ['Old Mutual', 'Sanlam', 'Discovery', 'Liberty', 'Momentum Metropolitan', 'Santam', 'AVBOB South Africa', 'Outsurance'],
  consulting: ['iqbusiness South Africa', 'McKinsey SA', 'Deloitte SA', 'PwC SA', 'EY SA', 'KPMG SA', 'Accenture SA'],
  recruitment: ['Bright Placements', 'Helderberg Personnel cc', 'Kelly SA', 'Adcorp', 'Measured Ability'],
  security: ['Fidelity ADT', 'G4S', 'Chubb SA', 'Bidvest Protea Coin', 'Thorburn Security'],
  hospitality: ['Tsogo Sun', 'Sun International', 'City Lodge', 'Protea Hotels', 'Cape Grace'],
  healthcare: ['Netcare', 'Mediclinic', 'Life Healthcare', 'Clicks Pharmacies', 'Dischem']
};

// TOWNSHIP/DISADVANTAGED AREA CONTEXT
const TOWNSHIP_AREAS = ['Soweto', 'Khayelitsha', 'Mitchells Plain', 'Umlazi', 'Mamelodi', 'Tembisa', 'Alexandra', 'Langa', 'Gugulethu', 'Diepsloot', 'Orange Farm', 'Katlehong', 'Vosloorus', 'Thokoza'];
const RURAL_AREAS = ['Limpopo rural', 'Eastern Cape rural', 'KZN rural', 'Mpumalanga rural', 'Free State rural'];

// REAL RECRUITER REJECTION REASONS (from job board research)
const REJECTION_REASONS = {
  cv_issues: [
    'Generic CV not tailored to role',
    'CV too long (over 3 pages)',
    'Unexplained employment gaps',
    'Copy-pasted job descriptions instead of achievements',
    'No quantifiable achievements or metrics',
    'Unprofessional email address',
    'Typos and grammatical errors',
    'Inconsistent date formatting',
    'Missing key qualifications',
    'Overqualified for position',
    'Inflated job titles',
    'Vague buzzwords without evidence (dynamic, results-driven)',
    'No clear career progression',
    'Too many short tenures (job hopping)',
  ],
  experience_gaps: [
    'Missing required years of experience',
    'Experience in wrong industry',
    'No management experience for senior role',
    'Lacks specific technical skills',
    'No SA market experience',
    'Gap between qualification and experience level',
  ],
  culture_red_flags: [
    'Speaking negatively about past employers',
    'Lack of professional development',
    'No evidence of teamwork',
    'Self-interest over company goals',
    'Poor communication style in cover letter',
  ]
};

// SPECIAL CV SCENARIOS TO TRAIN THE AI ON
const SPECIAL_SCENARIOS = [
  'TOWNSHIP_RESILIENCE',     // From disadvantaged area, showing grit
  'UNISA_WORKER',           // Studied while working full-time
  'FIRST_GEN_GRADUATE',     // First in family to graduate
  'CAREER_GAP_VALID',       // Gap but with good reason (caregiving, illness)
  'CAREER_GAP_UNEXPLAINED', // Gap with no explanation
  'FRESH_GRADUATE',         // No experience but strong academics
  'OVERQUALIFIED',          // Too senior for the role
  'UNDERQUALIFIED_POTENTIAL', // Lacks requirements but shows potential
  'JOB_HOPPER',             // Multiple short tenures
  'BUZZWORD_ONLY',          // All fluff, no substance
  'METRICS_CHAMPION',       // Quantifies everything
  'SCHOOL_LEADER',          // Head boy/girl, sports captain
];

// ============================================
// JOB GENERATION
// ============================================

async function generateJob(category, role, companyType, index) {
  const city = SA_CITIES[Math.floor(Math.random() * SA_CITIES.length)];
  const workMode = WORK_MODES[Math.floor(Math.random() * WORK_MODES.length)];

  const prompt = `Generate a realistic South African job posting for a ${companyType} company.

ROLE: ${role}
INDUSTRY: ${category.industry}
LOCATION: ${city}
WORK MODE: ${workMode}
COMPANY TYPE: ${companyType === 'SME' ? 'Small-Medium Enterprise (10-200 employees)' : 'Large Corporate (500+ employees)'}

Return JSON only:
{
  "job_title": "${role}",
  "company_name": "<realistic SA company name for ${category.industry}>",
  "company_type": "${companyType}",
  "industry": "${category.industry}",
  "location": "${city}",
  "work_mode": "${workMode}",
  "seniority": "<Junior|Mid-level|Senior|Manager|Director>",
  "salary_range": "<realistic SA salary range in ZAR>",
  "experience_required": <number 0-15>,
  "qualifications": ["<required qualifications>"],
  "required_skills": ["<5-8 required skills>"],
  "nice_to_have": ["<2-4 nice to have>"],
  "job_description": "<2-3 paragraph description>",
  "key_responsibilities": ["<5-7 responsibilities>"],
  "benefits": ["<3-5 benefits>"]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.8,
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }]
    });

    const text = response.choices[0]?.message?.content || '';
    const cleaned = text.replace(/```json\s*/gi, '').replace(/```/g, '').trim();
    const job = JSON.parse(cleaned);
    job.id = `job_${String(index).padStart(5, '0')}`;
    job.generated_at = new Date().toISOString();
    return job;
  } catch (e) {
    console.error(`Job generation failed: ${e.message}`);
    return null;
  }
}

async function generateAllJobs(targetCount = 3500) {
  console.log(`\n🏢 GENERATING ${targetCount} JOBS (70% SME, 30% Corporate)\n`);

  const smeCount = Math.floor(targetCount * 0.7);  // 2,450
  const corpCount = targetCount - smeCount;         // 1,050

  const jobs = [];
  let index = 0;

  // Load existing if any
  if (fs.existsSync(JOBS_FILE)) {
    const existing = JSON.parse(fs.readFileSync(JOBS_FILE, 'utf8'));
    jobs.push(...existing);
    index = existing.length;
    console.log(`Resuming from ${index} existing jobs`);
  }

  // Generate SME jobs
  const smePerCategory = Math.ceil(smeCount / SME_CATEGORIES.length);
  for (const category of SME_CATEGORIES) {
    for (const role of category.roles) {
      if (jobs.length >= smeCount) break;

      const job = await generateJob(category, role, 'SME', index++);
      if (job) {
        jobs.push(job);
        console.log(`[${jobs.length}/${targetCount}] SME: ${job.job_title} at ${job.company_name}`);
        fs.writeFileSync(JOBS_FILE, JSON.stringify(jobs, null, 2));
      }

      // Rate limiting
      await new Promise(r => setTimeout(r, 200));
    }
  }

  // Generate Corporate jobs
  for (const category of CORPORATE_CATEGORIES) {
    for (const role of category.roles) {
      if (jobs.length >= targetCount) break;

      const job = await generateJob(category, role, 'Corporate', index++);
      if (job) {
        jobs.push(job);
        console.log(`[${jobs.length}/${targetCount}] Corp: ${job.job_title} at ${job.company_name}`);
        fs.writeFileSync(JOBS_FILE, JSON.stringify(jobs, null, 2));
      }

      await new Promise(r => setTimeout(r, 200));
    }
  }

  console.log(`\n✅ Generated ${jobs.length} jobs\n`);
  return jobs;
}

// ============================================
// CV GENERATION
// ============================================

const CV_CATEGORIES = [
  'STRONG_MATCH',    // 40% - Highly qualified
  'GOOD_MATCH',      // 25% - Meets most requirements
  'PARTIAL_MATCH',   // 20% - Some gaps but potential
  'WEAK_MATCH',      // 10% - Significant gaps
  'CAREER_CHANGER',  // 5%  - Different industry but transferable
];

const SA_UNIVERSITIES = [
  'University of Cape Town', 'University of the Witwatersrand', 'Stellenbosch University',
  'University of Pretoria', 'University of KwaZulu-Natal', 'Rhodes University',
  'University of Johannesburg', 'North-West University', 'University of the Free State',
  'Nelson Mandela University', 'University of South Africa (Unisa)', 'Tshwane University of Technology',
  'Cape Peninsula University of Technology', 'Durban University of Technology', 'Vaal University of Technology',
  'Varsity College', 'Damelin', 'Boston City Campus', 'Monash South Africa'
];

const SA_FIRST_NAMES = ['Thabo', 'Nomvula', 'Sipho', 'Thandiwe', 'Bongani', 'Lerato', 'Mandla', 'Nthabiseng', 'Kagiso', 'Palesa', 'Tshepo', 'Mpho', 'Siyabonga', 'Nokuthula', 'Lebogang', 'Themba', 'Ayanda', 'Zanele', 'Sibusiso', 'Nkosazana', 'James', 'Sarah', 'Michael', 'Emma', 'David', 'Olivia', 'Johannes', 'Annemarie', 'Pieter', 'Lizette', 'Mohammed', 'Fatima', 'Ahmed', 'Aisha', 'Raj', 'Priya'];
const SA_LAST_NAMES = ['Nkosi', 'Dlamini', 'Molefe', 'Ndlovu', 'Mokoena', 'Mthembu', 'Khumalo', 'Zulu', 'Sithole', 'Ngcobo', 'Pillay', 'Naidoo', 'Govender', 'Maharaj', 'Smith', 'Van der Merwe', 'Botha', 'Du Plessis', 'Jacobs', 'Williams', 'Johnson', 'Brown', 'Abrahams', 'Adams', 'Petersen'];

async function generateCV(job, matchCategory, index) {
  const firstName = SA_FIRST_NAMES[Math.floor(Math.random() * SA_FIRST_NAMES.length)];
  const lastName = SA_LAST_NAMES[Math.floor(Math.random() * SA_LAST_NAMES.length)];
  const university = SA_UNIVERSITIES[Math.floor(Math.random() * SA_UNIVERSITIES.length)];

  // Pick a random special scenario for variety
  const specialScenario = SPECIAL_SCENARIOS[Math.floor(Math.random() * SPECIAL_SCENARIOS.length)];
  const townshipArea = TOWNSHIP_AREAS[Math.floor(Math.random() * TOWNSHIP_AREAS.length)];
  const rejectionReason = REJECTION_REASONS.cv_issues[Math.floor(Math.random() * REJECTION_REASONS.cv_issues.length)];

  const matchInstructions = {
    'STRONG_MATCH': `Create a highly qualified candidate who EXCEEDS all requirements. Include impressive achievements with SPECIFIC METRICS (e.g., "increased sales by 142%", "managed team of 8", "reduced costs by R500k").

    VARY THE BACKGROUND - pick one:
    - Corporate high-achiever from Big 4 or top bank
    - Township success story from ${townshipArea} who overcame adversity
    - Unisa graduate who worked full-time while studying
    - First-generation graduate with academic excellence
    - School leader (head boy/girl, sports captain at ${['Bishops', 'Grey College', 'Michaelhouse', 'St Johns', 'Pretoria Boys High'][Math.floor(Math.random() * 5)]})

    Include REAL SA company names and universities.`,

    'GOOD_MATCH': `Create a solid candidate who meets MOST requirements. Good experience and qualifications, but might be missing one nice-to-have.

    VARY - could be:
    - Experienced professional with one skill gap
    - Strong performer but slightly under on years
    - Great cultural fit but needs one certification`,

    'PARTIAL_MATCH': `Create a candidate with SOME gaps but CLEAR POTENTIAL. Maybe lacks 1-2 years experience or missing one key skill.

    INCLUDE scenarios like:
    - Fresh graduate with strong internship/vacation work
    - Career changer with transferable skills
    - Someone returning from valid career gap (caregiving, further study)
    - Township candidate showing determination and grit`,

    'WEAK_MATCH': `Create a realistically WEAK CV with common problems recruiters see:

    INCLUDE these RED FLAGS:
    - ${rejectionReason}
    - Vague buzzwords like "dynamic team player" and "results-driven" with NO evidence
    - Generic responsibilities copied from job descriptions
    - Unexplained employment gaps
    - Multiple short tenures (job hopping)
    - Wrong industry experience
    - Missing key qualifications

    Make it feel like a real bad CV that gets rejected.`,

    'CAREER_CHANGER': `Create a candidate from a COMPLETELY DIFFERENT industry with transferable skills.

    SCENARIOS:
    - Teacher wanting to move into corporate training
    - Retail manager wanting office work
    - Engineer wanting to move into consulting
    - Military/police wanting private sector

    They have strong general abilities but NO direct industry experience.`,
  };

  const prompt = `Generate a realistic South African CV for someone applying to this job.

JOB THEY'RE APPLYING FOR:
- Title: ${job.job_title}
- Industry: ${job.industry}
- Required Experience: ${job.experience_required} years
- Required Skills: ${job.required_skills?.join(', ') || 'Not specified'}
- Qualifications: ${job.qualifications?.join(', ') || 'Not specified'}

CANDIDATE PROFILE:
- Name: ${firstName} ${lastName}
- Match Category: ${matchCategory}
- Instructions: ${matchInstructions[matchCategory]}

Return JSON only:
{
  "name": "${firstName} ${lastName}",
  "email": "${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.com",
  "phone": "+27 ${Math.floor(Math.random() * 9) + 1}${Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 10)} ${Math.floor(Math.random() * 1000).toString().padStart(3, '0')} ${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}",
  "location": "<SA city>",
  "professional_summary": "<3-4 sentences summarizing experience and goals>",
  "work_experience": [
    {
      "title": "<job title>",
      "company": "<realistic SA company>",
      "location": "<city>",
      "start_date": "<Month Year>",
      "end_date": "<Month Year or Present>",
      "achievements": ["<achievement with metric if possible>", "<achievement>"]
    }
  ],
  "education": [
    {
      "qualification": "<degree/diploma>",
      "institution": "${university}",
      "year": "<graduation year>",
      "achievements": ["<optional academic achievements>"]
    }
  ],
  "skills": ["<relevant skills>"],
  "certifications": ["<any certifications>"],
  "languages": ["<languages spoken>"],
  "school_achievements": "<optional: if they were prefect, sports captain, etc at school>",
  "volunteer_work": "<optional: community involvement>"
}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.9,
      max_tokens: 1200,
      messages: [{ role: 'user', content: prompt }]
    });

    const text = response.choices[0]?.message?.content || '';
    const cleaned = text.replace(/```json\s*/gi, '').replace(/```/g, '').trim();
    const cv = JSON.parse(cleaned);
    cv.id = `cv_${String(index).padStart(5, '0')}`;
    cv.target_job_id = job.id;
    cv.match_category = matchCategory;
    cv.generated_at = new Date().toISOString();
    return cv;
  } catch (e) {
    console.error(`CV generation failed: ${e.message}`);
    return null;
  }
}

async function generateAllCVs(jobs, targetCount = 10000) {
  console.log(`\n👤 GENERATING ${targetCount} CVs\n`);

  const cvs = [];
  let index = 0;

  // Load existing if any
  if (fs.existsSync(CVS_FILE)) {
    const existing = JSON.parse(fs.readFileSync(CVS_FILE, 'utf8'));
    cvs.push(...existing);
    index = existing.length;
    console.log(`Resuming from ${index} existing CVs`);
  }

  // Distribution: 40% strong, 25% good, 20% partial, 10% weak, 5% career changer
  const distribution = {
    'STRONG_MATCH': 0.40,
    'GOOD_MATCH': 0.25,
    'PARTIAL_MATCH': 0.20,
    'WEAK_MATCH': 0.10,
    'CAREER_CHANGER': 0.05,
  };

  while (cvs.length < targetCount) {
    // Pick random job
    const job = jobs[Math.floor(Math.random() * jobs.length)];

    // Pick category based on distribution
    const rand = Math.random();
    let cumulative = 0;
    let category = 'STRONG_MATCH';
    for (const [cat, prob] of Object.entries(distribution)) {
      cumulative += prob;
      if (rand <= cumulative) {
        category = cat;
        break;
      }
    }

    const cv = await generateCV(job, category, index++);
    if (cv) {
      cvs.push(cv);
      console.log(`[${cvs.length}/${targetCount}] ${category}: ${cv.name} -> ${job.job_title}`);

      // Save every 10 CVs
      if (cvs.length % 10 === 0) {
        fs.writeFileSync(CVS_FILE, JSON.stringify(cvs, null, 2));
      }
    }

    // Rate limiting - faster for bulk
    await new Promise(r => setTimeout(r, 150));
  }

  fs.writeFileSync(CVS_FILE, JSON.stringify(cvs, null, 2));
  console.log(`\n✅ Generated ${cvs.length} CVs\n`);
  return cvs;
}

// ============================================
// SCREENING (Run after jobs and CVs are done)
// ============================================

async function runScreening(cv, job, index) {
  const cvText = `
Name: ${cv.name}
Email: ${cv.email}
Phone: ${cv.phone}
Location: ${cv.location}

PROFESSIONAL SUMMARY:
${cv.professional_summary}

WORK EXPERIENCE:
${cv.work_experience?.map(exp => `
${exp.title} at ${exp.company}, ${exp.location}
${exp.start_date} - ${exp.end_date}
${exp.achievements?.map(a => `- ${a}`).join('\n') || ''}
`).join('\n')}

EDUCATION:
${cv.education?.map(edu => `${edu.qualification} - ${edu.institution} (${edu.year})`).join('\n')}

SKILLS: ${cv.skills?.join(', ')}
CERTIFICATIONS: ${cv.certifications?.join(', ') || 'None'}
LANGUAGES: ${cv.languages?.join(', ')}
${cv.school_achievements ? `SCHOOL ACHIEVEMENTS: ${cv.school_achievements}` : ''}
${cv.volunteer_work ? `VOLUNTEER: ${cv.volunteer_work}` : ''}
`;

  const jobContext = `
ROLE: ${job.job_title}
COMPANY: ${job.company_name} (${job.company_type})
INDUSTRY: ${job.industry}
LOCATION: ${job.location}
EXPERIENCE REQUIRED: ${job.experience_required} years
REQUIRED SKILLS: ${job.required_skills?.join(', ')}
QUALIFICATIONS: ${job.qualifications?.join(', ')}
`;

  const prompt = `Screen this CV against the job requirements. Be accurate and evidence-based.

${jobContext}

CV:
${cvText}

Return JSON only:
{
  "overall_score": <0-100>,
  "recommendation": "<SHORTLIST|CONSIDER|REJECT>",
  "recommendation_reason": "<1-2 sentences with evidence>",
  "strengths": [{"label": "<strength>", "evidence": "<quote from CV>"}],
  "gaps": [{"label": "<gap>", "detail": "<what's missing>"}],
  "experience_match": "<EXCEEDS|MEETS|PARTIAL|INSUFFICIENT>",
  "skills_match_percentage": <0-100>,
  "culture_fit_signals": ["<any positive signals>"],
  "risk_flags": ["<any concerns>"],
  "interview_questions": ["<2-3 key questions to ask>"]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0,
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }]
    });

    const text = response.choices[0]?.message?.content || '';
    const cleaned = text.replace(/```json\s*/gi, '').replace(/```/g, '').trim();
    const result = JSON.parse(cleaned);
    result.cv_id = cv.id;
    result.job_id = job.id;
    result.expected_category = cv.match_category;
    result.screened_at = new Date().toISOString();
    return result;
  } catch (e) {
    console.error(`Screening failed: ${e.message}`);
    return null;
  }
}

async function runAllScreening(cvs, jobs) {
  console.log(`\n🔍 SCREENING ${cvs.length} CVs\n`);

  const results = [];
  const jobMap = new Map(jobs.map(j => [j.id, j]));

  // Load existing if any
  if (fs.existsSync(SCREENING_FILE)) {
    const existing = JSON.parse(fs.readFileSync(SCREENING_FILE, 'utf8'));
    results.push(...existing);
    console.log(`Resuming from ${results.length} existing screenings`);
  }

  const screened = new Set(results.map(r => r.cv_id));

  for (let i = 0; i < cvs.length; i++) {
    const cv = cvs[i];
    if (screened.has(cv.id)) continue;

    const job = jobMap.get(cv.target_job_id);
    if (!job) continue;

    const result = await runScreening(cv, job, i);
    if (result) {
      results.push(result);
      console.log(`[${results.length}/${cvs.length}] ${result.recommendation}: ${cv.name} (${result.overall_score}/100)`);

      if (results.length % 20 === 0) {
        fs.writeFileSync(SCREENING_FILE, JSON.stringify(results, null, 2));
      }
    }

    await new Promise(r => setTimeout(r, 150));
  }

  fs.writeFileSync(SCREENING_FILE, JSON.stringify(results, null, 2));
  console.log(`\n✅ Screened ${results.length} CVs\n`);
  return results;
}

// ============================================
// MAIN PIPELINE
// ============================================

async function main() {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                 HIREINBOX MEGA TRAINING PIPELINE             ║
║              3,500 Jobs + 10,000 CVs + Screening             ║
╚══════════════════════════════════════════════════════════════╝
`);

  const startTime = Date.now();

  // Phase 1: Generate Jobs
  const jobs = await generateAllJobs(3500);

  // Phase 2: Generate CVs
  const cvs = await generateAllCVs(jobs, 10000);

  // Phase 3: Run Screening
  const results = await runAllScreening(cvs, jobs);

  // Summary
  const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);

  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                        PIPELINE COMPLETE                      ║
╠══════════════════════════════════════════════════════════════╣
║  Jobs Generated:     ${String(jobs.length).padEnd(10)} (70% SME, 30% Corp)       ║
║  CVs Generated:      ${String(cvs.length).padEnd(10)}                            ║
║  Screenings Done:    ${String(results.length).padEnd(10)}                            ║
║  Time Elapsed:       ${String(elapsed + ' minutes').padEnd(10)}                       ║
╠══════════════════════════════════════════════════════════════╣
║  SCREENING RESULTS:                                           ║
║  - SHORTLIST: ${String(results.filter(r => r.recommendation === 'SHORTLIST').length).padEnd(8)}                                    ║
║  - CONSIDER:  ${String(results.filter(r => r.recommendation === 'CONSIDER').length).padEnd(8)}                                    ║
║  - REJECT:    ${String(results.filter(r => r.recommendation === 'REJECT').length).padEnd(8)}                                    ║
╚══════════════════════════════════════════════════════════════╝
`);
}

main().catch(console.error);
