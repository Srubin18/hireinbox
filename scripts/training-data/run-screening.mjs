// HIREINBOX AI Training Pipeline - STRICT EVIDENCE-BASED SCREENING
// Approved format: specific evidence, score caps, no generic labels

import fs from 'fs';
import OpenAI from 'openai';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_DIR = join(__dirname, 'data');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const STRICT_PROMPT = `You are HireInbox ELITE AI Screener. Precise, evidence-based, no fluff.

RULE 1: ZERO GENERIC LABELS (MANDATORY)
FORBIDDEN labels - NEVER use these:
- "Relevant Experience"
- "Skills Match"
- "Strong Background"
- "Good Fit"
- "Educational Background"

REQUIRED: Every strength must be SPECIFIC with EXACT QUOTE from CV.
Good: "Secured R25M in contracts" with evidence "Negotiated contracts worth R25 million"
Bad: "Strong sales skills" with evidence "Shows sales ability"

RULE 2: HARD SCORING CAPS (MATHEMATICAL - ENFORCE STRICTLY)
Experience penalties:
- Has 0-1 years, needs 3+ = MAX SCORE 45 (REJECT)
- Has 2 years, needs 3+ = MAX SCORE 65 (CONSIDER)
- Has 2 years, needs 5+ = MAX SCORE 50 (REJECT)
- Experience meets/exceeds = no cap

Skill penalties:
- Each missing REQUIRED skill = -10 points
- Missing required qualification = -20 points
- Wrong industry entirely = MAX SCORE 55

Score ranges:
- SHORTLIST (80-100): Experience >= requirement AND 80%+ skills AND quantified achievement
- CONSIDER (60-79): Gaps but potential
- REJECT (0-59): Major gaps, insufficient experience

RULE 3: QUOTE OR DON'T CLAIM
Every strength needs exact CV text. No quote = don't list it.

SA CONTEXT:
- CA(SA) = Gold standard accounting
- UCT, Wits, Stellenbosch, UP = Tier 1 universities
- Unisa = Distance learning, shows determination (POSITIVE)
- Big 4 (PwC, Deloitte, EY, KPMG) = Well-trained
- Township background = Resilience, grit (POSITIVE)

Return ONLY valid JSON:
{
  "overall_score": <0-100>,
  "recommendation": "SHORTLIST|CONSIDER|REJECT",
  "recommendation_reason": "<Has X years (needs Y), achieved Z metric, lacks W>",
  "experience_check": {
    "candidate_years": <number>,
    "required_years": <number>,
    "gap": "<X years short OR meets requirement>",
    "score_cap": <number or null>
  },
  "strengths": [
    {"label": "<SPECIFIC achievement>", "evidence": "<EXACT quote from CV>"}
  ],
  "weaknesses": [
    {"label": "<specific gap>", "evidence": "<quote or 'not mentioned'>"}
  ],
  "skills_assessment": {
    "matched": ["<skill found>"],
    "missing": ["<required skill not found>"]
  }
}`;

function formatCV(cv) {
  let text = "NAME: " + cv.name + " | LOCATION: " + cv.location + "\n";
  text += "SUMMARY: " + (cv.professional_summary || "") + "\n\n";
  text += "EXPERIENCE:\n";
  (cv.work_experience || []).forEach(w => {
    text += "- " + w.title + " at " + w.company + " (" + w.start_date + " - " + w.end_date + ")\n";
    (w.achievements || []).forEach(a => { text += "  * " + a + "\n"; });
  });
  text += "\nEDUCATION:\n";
  (cv.education || []).forEach(e => {
    text += "- " + e.qualification + " from " + e.institution + " (" + e.year + ")\n";
  });
  text += "\nSKILLS: " + (cv.skills || []).join(", ") + "\n";
  if (cv.certifications && cv.certifications.length) {
    text += "CERTIFICATIONS: " + cv.certifications.join(", ") + "\n";
  }
  return text;
}

function formatJob(job) {
  let text = "ROLE: " + (job.job_title || job.title || "Unknown") + "\n";
  text += "COMPANY: " + (job.company_name || "") + " (" + (job.industry || "") + ")\n";
  text += "EXPERIENCE REQUIRED: " + (job.experience_required || job.min_experience_years || 0) + " years\n";
  text += "REQUIRED SKILLS: " + (job.required_skills || []).join(", ") + "\n";
  if (job.qualifications && job.qualifications.length) {
    text += "QUALIFICATIONS: " + job.qualifications.join(", ") + "\n";
  }
  return text;
}

async function screenCV(cv, job, retries = 2) {
  const prompt = "JOB:\n" + formatJob(job) + "\n---\n\nCV:\n" + formatCV(cv);

  for (let i = 0; i <= retries; i++) {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0.1,
        max_tokens: 1200,
        messages: [
          { role: 'system', content: STRICT_PROMPT },
          { role: 'user', content: prompt }
        ]
      });

      const text = response.choices[0]?.message?.content || '';
      const cleaned = text.replace(/```json\s*/gi, '').replace(/```/g, '').trim();
      return JSON.parse(cleaned);
    } catch (e) {
      if (i === retries) throw e;
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
}

async function main() {
  console.log('============================================================');
  console.log('  HIREINBOX STRICT AI SCREENING - APPROVED FORMAT');
  console.log('  Evidence-based | Score caps | No generic labels');
  console.log('============================================================\n');

  const jobs = JSON.parse(fs.readFileSync(join(DATA_DIR, 'mega_jobs.json'), 'utf8'));
  const cvs = JSON.parse(fs.readFileSync(join(DATA_DIR, 'mega_cvs.json'), 'utf8'));

  const jobMap = {};
  jobs.forEach(j => jobMap[j.id] = j);

  const unscreened = cvs.filter(c => !c.screening_result);

  console.log('Jobs: ' + jobs.length);
  console.log('CVs: ' + cvs.length);
  console.log('Already screened: ' + (cvs.length - unscreened.length));
  console.log('To screen: ' + unscreened.length + '\n');

  if (unscreened.length === 0) {
    console.log('All CVs screened!');
    return;
  }

  const BATCH_SIZE = 5;
  let screened = 0;
  let errors = 0;
  const startTime = Date.now();

  for (let i = 0; i < unscreened.length; i += BATCH_SIZE) {
    const batch = unscreened.slice(i, i + BATCH_SIZE);

    const promises = batch.map(async (cv) => {
      let job = jobMap[cv.target_job_id];
      if (!job) {
        job = jobs[Math.floor(Math.random() * jobs.length)];
        cv.target_job_id = job.id;
      }

      try {
        const result = await screenCV(cv, job);
        cv.screening_result = result;
        cv.ai_score = result.overall_score;
        cv.ai_recommendation = result.recommendation;
        screened++;
        return cv;
      } catch (e) {
        errors++;
        return null;
      }
    });

    await Promise.all(promises);

    // Save progress
    fs.writeFileSync(join(DATA_DIR, 'mega_cvs.json'), JSON.stringify(cvs, null, 2));

    const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
    const rate = screened > 0 ? (screened / ((Date.now() - startTime) / 1000 / 60)).toFixed(0) : 0;
    const pct = ((screened / unscreened.length) * 100).toFixed(1);
    const eta = rate > 0 ? ((unscreened.length - screened) / rate).toFixed(0) : '?';

    // Show distribution every 50
    if (screened % 50 === 0 || screened === unscreened.length) {
      const results = cvs.filter(c => c.screening_result);
      const s = results.filter(c => c.ai_recommendation === 'SHORTLIST').length;
      const c = results.filter(c => c.ai_recommendation === 'CONSIDER').length;
      const r = results.filter(c => c.ai_recommendation === 'REJECT').length;
      console.log('[' + pct + '%] ' + screened + '/' + unscreened.length + ' | S:' + s + ' C:' + c + ' R:' + r + ' | ' + elapsed + 'min | ETA:' + eta + 'min');
    }

    await new Promise(r => setTimeout(r, 500));
  }

  console.log('\n============================================================');
  console.log('  SCREENING COMPLETE');
  console.log('============================================================');

  const results = cvs.filter(c => c.screening_result);
  const shortlist = results.filter(c => c.ai_recommendation === 'SHORTLIST').length;
  const consider = results.filter(c => c.ai_recommendation === 'CONSIDER').length;
  const reject = results.filter(c => c.ai_recommendation === 'REJECT').length;

  console.log('SHORTLIST: ' + shortlist + ' (' + (shortlist/results.length*100).toFixed(1) + '%)');
  console.log('CONSIDER: ' + consider + ' (' + (consider/results.length*100).toFixed(1) + '%)');
  console.log('REJECT: ' + reject + ' (' + (reject/results.length*100).toFixed(1) + '%)');
}

main().catch(console.error);
