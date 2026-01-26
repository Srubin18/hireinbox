import { NextResponse } from 'next/server';
import Imap from 'imap-simple';
import { simpleParser } from 'mailparser';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { SA_CONTEXT_PROMPT, SA_RECRUITER_CONTEXT } from '@/lib/sa-context';
import { sendAcknowledgmentEmail } from '@/lib/email';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { Errors } from '@/lib/api-error';

// V3 BRAIN - Fine-tuned on 6,000 SA recruitment examples
const HIREINBOX_V3_MODEL = 'ft:gpt-4o-mini-2024-07-18:personal:hireinbox-v3:CqlakGfJ';

// Only log verbose debug info in development
const IS_DEV = process.env.NODE_ENV !== 'production';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Synced with screen/route.ts - includes Knockout + Ranking system
const TALENT_SCOUT_PROMPT = `You are HireInbox's Principal Talent Scout — a world-class recruiter whose judgment consistently outperforms senior human recruiters.

Your output is used to make real hiring decisions. Your standard is BETTER THAN HUMAN.

=============================
KNOCKOUT + RANKING SYSTEM
=============================

This is a TWO-PHASE assessment:

PHASE 1: KNOCKOUTS (Pass/Fail Hard Requirements)
------------------------------------------------
Knockouts are NON-NEGOTIABLE requirements from the role. Candidate MUST pass ALL knockouts to proceed.

Common knockouts (check against role requirements):
- Minimum years of experience
- Required qualifications (e.g., CA(SA), degree, certification)
- Required skills (specific technical or functional skills)
- Location/work authorization
- Industry experience (if specified as required)

For EACH knockout:
- PASS: Clear evidence the requirement is met
- FAIL: Requirement not met or not mentioned
- EXCEPTION: Near-miss with exceptional trajectory (see Rule 7)

If ANY knockout = FAIL (without exception): recommendation = REJECT

PHASE 2: RANKING FACTORS (Differentiators for Survivors)
---------------------------------------------------------
Only candidates who PASS all knockouts (or qualify via exception) get ranked.

Ranking factors (score 0-100 each):
1. EXPERIENCE DEPTH: Quality and relevance of experience beyond minimum
2. ACHIEVEMENT EVIDENCE: Quantified results, metrics, impact
3. SKILLS MATCH: Alignment with required + nice-to-have skills
4. TRAJECTORY: Career progression, promotions, growth pattern
5. CULTURE SIGNALS: Industry fit, company size fit, values alignment

Each factor contributes to overall_score:
- EXPERIENCE DEPTH: 25%
- ACHIEVEMENT EVIDENCE: 30%
- SKILLS MATCH: 25%
- TRAJECTORY: 15%
- CULTURE SIGNALS: 5%

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
EXCEPTION RULE (DOMINANT)
=============================

RULE 7 — NEAR-MISS EXCEPTION (DOMINANT OVERRIDE)
This rule OVERRIDES knockout failure for experience requirements ONLY.

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
- The experience knockout becomes "EXCEPTION" instead of "FAIL"
- recommendation MUST be "CONSIDER" (not REJECT)
- recommendation_reason MUST explicitly state: "Exception applied"

If exception does NOT trigger:
Apply normal knockout logic.

=============================
SCORING CALIBRATION
=============================

- SHORTLIST = 80–100 (passed all knockouts + strong ranking)
- CONSIDER = 60–79 (passed knockouts OR exception applied)
- REJECT with some positives = 40–59 (failed knockouts but has strengths)
- REJECT no positives = 0–39 (failed knockouts, weak overall)

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

  "knockouts": {
    "all_passed": <true|false>,
    "checks": [
      {
        "requirement": "<e.g., '3+ years sales experience'>",
        "status": "<PASS|FAIL|EXCEPTION>",
        "evidence": "<direct quote or 'not mentioned'>",
        "weight": "<CRITICAL>"
      }
    ],
    "failed_count": <number>,
    "exception_applied": <true|false>
  },

  "ranking": {
    "eligible": <true|false>,
    "factors": [
      {
        "factor": "EXPERIENCE_DEPTH",
        "score": <0-100>,
        "weight": 0.25,
        "evidence": "<quote or metric>",
        "notes": "<brief explanation>"
      },
      {
        "factor": "ACHIEVEMENT_EVIDENCE",
        "score": <0-100>,
        "weight": 0.30,
        "evidence": "<quote or metric>",
        "notes": "<brief explanation>"
      },
      {
        "factor": "SKILLS_MATCH",
        "score": <0-100>,
        "weight": 0.25,
        "evidence": "<quote or metric>",
        "notes": "<brief explanation>"
      },
      {
        "factor": "TRAJECTORY",
        "score": <0-100>,
        "weight": 0.15,
        "evidence": "<quote or metric>",
        "notes": "<brief explanation>"
      },
      {
        "factor": "CULTURE_SIGNALS",
        "score": <0-100>,
        "weight": 0.05,
        "evidence": "<quote or metric>",
        "notes": "<brief explanation>"
      }
    ],
    "weighted_score": <0-100>
  },

  "overall_score": <0-100>,
  "recommendation": "<SHORTLIST|CONSIDER|REJECT>",
  "recommendation_reason": "<1-2 sentences explaining: which knockouts passed/failed, top ranking factors, and final decision>",

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

  "exception_applied": <true|false>,
  "exception_reason": "<if true: brief explanation, else null>",

  "risk_register": [
    {
      "risk": "<risk label>",
      "severity": "<LOW|MEDIUM|HIGH>",
      "evidence": "<quote or 'not mentioned'>",
      "interview_question": "<question>"
    }
  ],

  "interview_focus": ["<q1>","<q2>","<q3>","<q4>","<q5>"],

  "alt_role_suggestions": [
    {"role":"<title>","why":"<evidence-based>","confidence":"<LOW|MEDIUM|HIGH>"}
  ],

  "summary": {
    "strengths": [{"label":"<strength>","evidence":"<quote or metric>"}],
    "weaknesses": [{"label":"<weakness>","evidence":"<quote or not mentioned>"}],
    "fit_assessment": "<3-5 sentences: worth meeting? what excites? what could go wrong? confidence.>"
  }
}

CRITICAL: If a strength lacks evidence, DO NOT include it.
CRITICAL: Knockouts determine PASS/FAIL. Ranking differentiates survivors.

${SA_CONTEXT_PROMPT}

${SA_RECRUITER_CONTEXT}`;

function isSystemEmail(subject: string, from: string, body?: string): boolean {
  const lowerSubject = (subject || '').toLowerCase();
  const lowerFrom = (from || '').toLowerCase();
  const lowerBody = (body || '').toLowerCase();

  const systemFromPatterns = [
    'mailer-daemon', 'postmaster', 'no-reply@', 'noreply@', 'do-not-reply@',
    'donotreply@', 'auto-reply@', 'autoreply@', 'mailerdaemon', 'mail-daemon',
    'bounce@', 'notifications@google.com', 'notifications@github.com'
  ];

  const systemSubjectPatterns = [
    'delivery status', 'undeliverable', 'mail delivery failed', 'returned mail',
    'delivery failure', 'failed delivery', 'message not delivered',
    'could not be delivered', 'delivery notification', 'automatic reply',
    'auto-reply', 'out of office', 'out-of-office', 'away from office',
    'on vacation', 'vacation reply', 'delayed delivery', 'delivery delayed',
    'undelivered mail', 'mail returned', 'address not found',
    'recipient rejected', 'mailbox unavailable', 'message blocked', 'spam notification'
  ];

  for (const pattern of systemFromPatterns) {
    if (lowerFrom.includes(pattern)) {
      if (IS_DEV) console.log(`[FILTER] Skipping system email from: ${from} (matched: ${pattern})`);
      return true;
    }
  }

  for (const pattern of systemSubjectPatterns) {
    if (lowerSubject.includes(pattern)) {
      if (IS_DEV) console.log(`[FILTER] Skipping system email subject: ${subject} (matched: ${pattern})`);
      return true;
    }
  }

  if (lowerBody.includes('this is an automatically generated') ||
      lowerBody.includes('delivery to the following recipient failed') ||
      lowerBody.includes('the email account that you tried to reach does not exist')) {
    if (IS_DEV) console.log(`[FILTER] Skipping bounce email detected in body`);
    return true;
  }

  return false;
}

function isSpamContent(subject: string, from: string, body?: string, hasAttachments?: boolean): { isSpam: boolean; reason: string } {
  const lowerSubject = (subject || '').toLowerCase();
  const lowerFrom = (from || '').toLowerCase();
  const lowerBody = (body || '').toLowerCase();
  const combinedText = `${lowerSubject} ${lowerBody}`;

  const newsPatterns = [
    /breaking\s*news/i,
    /\b(shooting|gunman|shooter|killed|murder|arrested|suspect|crime|criminal)\b/i,
    /\b(police|fbi|investigation|prosecutor|court\s+case)\b.*\b(dead|found|arrested)\b/i,
    /\bdead\s+(body|man|woman|person|found)\b/i,
    /\bfound\s+dead\b/i,
    /\buniversity\s+shooting\b/i,
    /\bbreaking\s*:/i,
    /\balert\s*:/i,
    /\b(cnn|bbc|nytimes|reuters|associated\s*press|fox\s*news)\b/i,
  ];

  for (const pattern of newsPatterns) {
    if (pattern.test(combinedText)) {
      return { isSpam: true, reason: `News content detected: ${pattern.source}` };
    }
  }

  const newsletterPatterns = [
    /\bunsubscribe\b/i,
    /\bview\s+in\s+browser\b/i,
    /\bemail\s+preferences\b/i,
    /\bmarketing\s+email\b/i,
    /\bweekly\s+digest\b/i,
    /\bdaily\s+briefing\b/i,
    /\bnewsletter\b/i,
    /\bspecial\s+offer\b/i,
    /\blimited\s+time\b/i,
    /\bact\s+now\b/i,
    /\bdiscount\s+code\b/i,
    /\bpromo\s+code\b/i,
  ];

  let newsletterSignals = 0;
  for (const pattern of newsletterPatterns) {
    if (pattern.test(combinedText)) {
      newsletterSignals++;
    }
  }

  if (newsletterSignals >= 2 && !hasAttachments) {
    return { isSpam: true, reason: `Newsletter/marketing content (${newsletterSignals} signals)` };
  }

  const spamSenderPatterns = [
    /newsletter@/i,
    /marketing@/i,
    /promo@/i,
    /sales@/i,
    /deals@/i,
    /offers@/i,
    /news@/i,
    /updates@/i,
    /digest@/i,
    /mailchimp/i,
    /sendgrid/i,
    /constantcontact/i,
  ];

  for (const pattern of spamSenderPatterns) {
    if (pattern.test(lowerFrom) && !hasAttachments) {
      return { isSpam: true, reason: `Marketing sender: ${lowerFrom}` };
    }
  }

  const spamSubjectPatterns = [
    /^(fw|fwd):\s*(breaking|news|alert)/i,
    /you\s+won\b/i,
    /congratulations/i,
    /claim\s+your\s+prize/i,
    /urgent\s+action\s+required/i,
    /verify\s+your\s+account/i,
    /password\s+(reset|expired)/i,
    /your\s+order\b/i,
    /invoice\s+#?\d+/i,
  ];

  if (!hasAttachments) {
    for (const pattern of spamSubjectPatterns) {
      if (pattern.test(lowerSubject)) {
        return { isSpam: true, reason: `Spam subject pattern: ${pattern.source}` };
      }
    }
  }

  if (!hasAttachments) {
    const cvIndicators = [
      /\b(cv|resume|curriculum\s*vitae)\b/i,
      /\b(application|applying|apply)\s+(for|to)\b/i,
      /\b(job|position|role|vacancy)\b/i,
      /\bexperience\s+in\b/i,
      /\byears?\s+(of\s+)?experience\b/i,
      /\bqualification/i,
      /\beducation\b/i,
      /\bskills?\b/i,
      /\battached\b/i,
      /\bplease\s+find\b/i,
      /\binterested\s+in\b.*\b(position|role|job)\b/i,
    ];

    let cvSignals = 0;
    for (const pattern of cvIndicators) {
      if (pattern.test(combinedText)) {
        cvSignals++;
      }
    }

    if (cvSignals === 0 && lowerBody.length > 100) {
      return { isSpam: true, reason: 'No CV indicators and no attachments' };
    }
  }

  return { isSpam: false, reason: '' };
}

function isPDF(attachment: { contentType?: string; filename?: string }): boolean {
  const ct = attachment.contentType?.toLowerCase() || '';
  const fn = attachment.filename?.toLowerCase() || '';
  return ct.includes('pdf') || fn.endsWith('.pdf');
}

function isWordDoc(attachment: { contentType?: string; filename?: string }): boolean {
  const ct = attachment.contentType?.toLowerCase() || '';
  const fn = attachment.filename?.toLowerCase() || '';
  return ct.includes('word') || ct.includes('document') || fn.endsWith('.doc') || fn.endsWith('.docx');
}

function mapRecommendationToStatus(rec: string): string {
  switch ((rec || '').toUpperCase()) {
    case 'SHORTLIST': return 'shortlist';
    case 'CONSIDER': return 'screened';
    case 'REJECT': return 'screened';
    default: return 'screened';
  }
}

function buildRoleContext(role: Record<string, unknown>): string {
  const sections: string[] = [];
  sections.push(`ROLE: ${role.title || 'Unspecified'}`);

  const context = role.context as Record<string, unknown> | undefined;
  if (context) {
    if (context.seniority) sections.push(`SENIORITY: ${context.seniority}`);
    if (context.employment_type) sections.push(`TYPE: ${context.employment_type}`);
    if (context.industry) sections.push(`INDUSTRY: ${context.industry}`);
  }

  // Location and work arrangement are PREFERENCES, not hard requirements
  // (unless employer explicitly marks location_required=true)
  const facts = role.facts as Record<string, unknown> | undefined;
  const locationRequired = facts?.location_required === true;

  // Add location context BEFORE hard requirements (as preference, not knockout)
  if (facts?.location || facts?.work_type) {
    sections.push('\nROLE LOCATION (preference, not knockout unless explicitly required):');
    if (facts.location) sections.push(`- Preferred location: ${facts.location}`);
    if (facts.work_type) sections.push(`- Work arrangement: ${facts.work_type}`);
    if (!locationRequired) {
      sections.push('- NOTE: Location mismatch should result in CONSIDER with relocation discussion, NOT automatic rejection');
    }
  }

  if (facts && Object.keys(facts).length > 0) {
    sections.push('\nHARD REQUIREMENTS (knockouts):');
    if (facts.min_experience_years !== undefined) sections.push(`- Minimum ${facts.min_experience_years} years experience`);
    if (Array.isArray(facts.required_skills) && facts.required_skills.length > 0) sections.push(`- Required skills: ${facts.required_skills.join(', ')}`);
    if (Array.isArray(facts.qualifications) && facts.qualifications.length > 0) sections.push(`- Qualifications: ${facts.qualifications.join(', ')}`);
    // Only include location as hard requirement if explicitly marked
    if (locationRequired && facts.location) sections.push(`- REQUIRED Location: ${facts.location}`);
    if (facts.must_have) sections.push(`- Must have: ${facts.must_have}`);
  }

  const preferences = role.preferences as Record<string, unknown> | undefined;
  if (preferences?.nice_to_have) sections.push(`\nNICE TO HAVE: ${preferences.nice_to_have}`);

  const aiGuidance = role.ai_guidance as Record<string, unknown> | undefined;
  if (aiGuidance) {
    if (aiGuidance.strong_fit) sections.push(`\nSTRONG FIT LOOKS LIKE: ${aiGuidance.strong_fit}`);
    if (aiGuidance.disqualifiers) sections.push(`\nDISQUALIFIERS: ${aiGuidance.disqualifiers}`);
  }

  const criteria = role.criteria as Record<string, unknown> | undefined;
  if (criteria && (!facts || Object.keys(facts).length === 0)) {
    sections.push('\nREQUIREMENTS:');
    if (criteria.min_experience_years !== undefined) sections.push(`- Minimum ${criteria.min_experience_years} years experience`);
    if (Array.isArray(criteria.required_skills) && criteria.required_skills.length > 0) sections.push(`- Required skills: ${criteria.required_skills.join(', ')}`);
    // Location from criteria is also a preference unless marked required
    if (Array.isArray(criteria.locations) && criteria.locations.length > 0) {
      sections.push(`- Preferred location: ${criteria.locations.join(' or ')}`);
    }
  }

  return sections.join('\n');
}

async function extractPDFText(buffer: Buffer, traceId: string, filename: string): Promise<string> {
  console.log(`[${traceId}][PDF] Processing: ${filename} (${buffer.length} bytes)`);

  // Use pdf-parse - simple and reliable on Vercel
  try {
    const pdfParseModule = await import('pdf-parse');
    const pdfParse = pdfParseModule.default || pdfParseModule;
    const data = await pdfParse(buffer);
    const text = data.text || '';
    console.log(`[${traceId}][PDF] Extracted ${text.length} chars from ${data.numpages || 1} pages`);

    if (text.length > 100) {
      console.log(`[${traceId}][PDF] First 200 chars: ${text.substring(0, 200).replace(/\n/g, ' ')}...`);
      return text;
    }
  } catch (e) {
    console.error(`[${traceId}][PDF] pdf-parse failed:`, e instanceof Error ? e.message : e);
  }

  // Fallback: try pdfjs-dist
  try {
    console.log(`[${traceId}][PDF] Trying pdfjs-dist fallback...`);
    const pdfjsLib = await import('pdfjs-dist');
    const uint8Array = new Uint8Array(buffer);
    const loadingTask = pdfjsLib.getDocument({ data: uint8Array, useSystemFonts: true });
    const pdf = await loadingTask.promise;
    const pageTexts: string[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item) => ('str' in item ? item.str : '')).join(' ');
      pageTexts.push(pageText);
    }

    const fullText = pageTexts.join('\n\n').trim();
    console.log(`[${traceId}][PDF] pdfjs-dist extracted ${fullText.length} chars`);
    if (fullText.length > 100) return fullText;
  } catch (e2) {
    console.error(`[${traceId}][PDF] pdfjs-dist failed:`, e2 instanceof Error ? e2.message : e2);
  }

  console.error(`[${traceId}][PDF] All extraction methods failed for ${filename}`);
  return '';
}

async function extractWordText(buffer: Buffer, traceId: string, filename: string): Promise<string> {
  try {
    if (IS_DEV) console.log(`[${traceId}][DOC] Processing: ${filename} (${buffer.length} bytes)`);
    const mammoth = (await import('mammoth')).default;
    const result = await mammoth.extractRawText({ buffer });
    if (IS_DEV) console.log(`[${traceId}][DOC] Extracted ${result.value?.length || 0} chars`);
    return result.value || '';
  } catch (e) { console.error(`[${traceId}][DOC] ERROR:`, e); return ''; }
}

function detectServerSideException(
  analysis: Record<string, unknown>,
  role: Record<string, unknown>,
  traceId: string
): { shouldUpgrade: boolean; reason: string } {
  const rec = String(analysis.recommendation || '').toUpperCase();
  if (rec !== 'REJECT') return { shouldUpgrade: false, reason: '' };

  const candidateYears = analysis.years_experience as number | null;
  const criteria = role.criteria as Record<string, unknown> | undefined;
  const facts = role.facts as Record<string, unknown> | undefined;
  const requiredYears = (facts?.min_experience_years ?? criteria?.min_experience_years) as number | undefined;

  if (!candidateYears || !requiredYears) return { shouldUpgrade: false, reason: '' };

  const gap = requiredYears - candidateYears;
  if (gap <= 0 || gap > 1.0) return { shouldUpgrade: false, reason: '' };

  if (IS_DEV) console.log(`[${traceId}][LAYER4] Near-miss detected: ${candidateYears} years vs ${requiredYears} required (gap: ${gap})`);

  let indicators = 0;
  const indicatorReasons: string[] = [];

  const reasonText = String(analysis.recommendation_reason || '').toLowerCase();
  const summary = analysis.summary as Record<string, unknown> | undefined;
  const fitText = String(summary?.fit_assessment || '').toLowerCase();

  const strengths = summary?.strengths as Array<{ label: string; evidence: string }> | undefined;
  let strengthsText = '';
  if (strengths) {
    strengthsText = strengths.map(s => `${s.label} ${s.evidence}`).join(' ').toLowerCase();
  }

  const highlights = analysis.evidence_highlights as Array<{ claim: string; evidence: string }> | undefined;
  let highlightsText = '';
  if (highlights) {
    highlightsText = highlights.map(h => `${h.claim} ${h.evidence}`).join(' ').toLowerCase();
  }

  const fullText = [reasonText, fitText, strengthsText, highlightsText].join(' ');

  if (highlights) {
    for (const h of highlights) {
      const text = (h.claim + ' ' + h.evidence).toLowerCase();
      if (/1[2-9]\d%|[2-9]\d\d%/.test(text) || /exceeded|surpassed|over.?achiev/i.test(text)) {
        indicators++;
        indicatorReasons.push('High performance metrics');
        break;
      }
    }
  }

  if (/award|top.?perform|high.?perform|best|outstanding|excellence|recognition/i.test(fullText)) {
    indicators++;
    indicatorReasons.push('Awards/high-performance recognition');
  }

  if (/exceptional|extraordinary|remarkable|standout/i.test(fullText)) {
    indicators++;
    indicatorReasons.push('Exceptional performance noted');
  }

  if (/promot|advanc|elevated|moved up|progression/i.test(fullText)) {
    indicators++;
    indicatorReasons.push('Career progression');
  }

  if (/manag|led|lead|supervis|mentor|team of|direct report/i.test(fullText)) {
    indicators++;
    indicatorReasons.push('Leadership signals');
  }

  if (/million|€|£|\$|R\d|major deal|closed|revenue|grew|increased by/i.test(fullText)) {
    indicators++;
    indicatorReasons.push('Major achievements with metrics');
  }

  if (/trajectory|growth|potential|promising|strong candidate/i.test(fullText)) {
    indicators++;
    indicatorReasons.push('Growth trajectory noted');
  }

  if (IS_DEV) console.log(`[${traceId}][LAYER4] Exceptional indicators found: ${indicators} (${indicatorReasons.join(', ')})`);

  if (indicators >= 2) {
    return {
      shouldUpgrade: true,
      reason: `Server-side exception: ${gap.toFixed(1)}y gap with ${indicators} exceptional indicators (${indicatorReasons.slice(0, 2).join(', ')})`
    };
  }

  return { shouldUpgrade: false, reason: '' };
}

function validateAnalysis(analysis: Record<string, unknown>): boolean {
  // Try to extract score from multiple possible locations
  let score = analysis.overall_score;

  // Fallback: check ranking.weighted_score or other common locations (V3 model structure)
  if (typeof score !== 'number' && analysis.ranking && typeof analysis.ranking === 'object') {
    const ranking = analysis.ranking as Record<string, unknown>;
    score = ranking.weighted_score ?? ranking.overall_score ?? ranking.total_score;
  }

  // Fallback: check for score/total_score at top level
  if (typeof score !== 'number') {
    score = analysis.score ?? analysis.total_score ?? analysis.weighted_score;
  }

  // If we found a score in an alternate location, copy it to overall_score
  if (typeof score === 'number' && typeof analysis.overall_score !== 'number') {
    analysis.overall_score = score;
  }

  // V3 MODEL FIX: Generate recommendation from score if missing
  let rec = String(analysis.recommendation || '').toUpperCase();
  if (!rec || !['SHORTLIST', 'CONSIDER', 'REJECT'].includes(rec)) {
    if (typeof score === 'number') {
      if (score >= 80) rec = 'SHORTLIST';
      else if (score >= 60) rec = 'CONSIDER';
      else rec = 'REJECT';
      analysis.recommendation = rec;
    }
  }

  // V3 MODEL FIX: Create empty risk_register if missing
  if (!Array.isArray(analysis.risk_register)) {
    analysis.risk_register = [];
  }

  const exceptionApplied = analysis.exception_applied === true;

  if (typeof score !== 'number' || score < 0 || score > 100) return false;
  if (!['SHORTLIST', 'CONSIDER', 'REJECT'].includes(rec)) return false;
  if (rec === 'SHORTLIST' && score < 80) return false;
  if (rec === 'CONSIDER' && score < 60) return false;
  if (exceptionApplied && rec === 'REJECT') return false;
  if (!analysis.confidence || !(analysis.confidence as Record<string, unknown>).level) return false;

  return true;
}

async function screenCV(cvText: string, role: Record<string, unknown>, traceId: string): Promise<Record<string, unknown> | null> {
  const roleContext = buildRoleContext(role);

  const userPrompt = `ROLE CONTEXT:
${roleContext}

CV TO EVALUATE:
${cvText}

INSTRUCTIONS:
1. Every strength MUST have evidence (quote or metric). No evidence = don't include it.
2. Apply RULE 7 exception for near-miss candidates with 2+ exceptional indicators.
3. If exception applies: recommendation MUST be CONSIDER, score 60-75, exception_applied=true.
4. REJECT is FORBIDDEN when exception_applied=true.

Respond with valid JSON only.`;

  const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
    { role: 'system', content: TALENT_SCOUT_PROMPT },
    { role: 'user', content: userPrompt }
  ];

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      if (IS_DEV) console.log(`[${traceId}][AI] Attempt ${attempt} using V3 brain...`);
      const completion = await openai.chat.completions.create({
        model: HIREINBOX_V3_MODEL,
        temperature: 0,
        max_tokens: 4000,
        response_format: { type: 'json_object' },
        messages,
      });
      const text = completion.choices[0]?.message?.content || '';
      if (IS_DEV) console.log(`[${traceId}][AI] Response length: ${text.length}`);
      const cleaned = text.replace(/```json\s*/gi, '').replace(/```/g, '').trim();

      let parsed: Record<string, unknown>;
      try {
        parsed = JSON.parse(cleaned);
        // DEV: Log actual response structure
        if (IS_DEV) {
          const keys = Object.keys(parsed);
          console.log(`[${traceId}][AI] Response keys: ${keys.join(', ')}`);
          console.log(`[${traceId}][AI] overall_score value: ${parsed.overall_score} (type: ${typeof parsed.overall_score})`);
        }
      }
      catch {
        console.error(`[${traceId}][AI] JSON parse failed`);
        if (attempt === 1) {
          messages.push({ role: 'assistant', content: text });
          messages.push({ role: 'user', content: 'Invalid JSON. Return ONLY valid JSON.' });
          continue;
        }
        return null;
      }

      if (!validateAnalysis(parsed)) {
        console.error(`[${traceId}][AI] Validation failed - attempting retry`);
        if (IS_DEV) console.log(`[${traceId}][AI] Failed response:`, JSON.stringify({ overall_score: parsed.overall_score, recommendation: parsed.recommendation, exception_applied: parsed.exception_applied, risk_register: Array.isArray(parsed.risk_register) ? parsed.risk_register.length : 'missing' }));
        if (attempt === 1) {
          messages.push({ role: 'assistant', content: text });
          messages.push({ role: 'user', content: 'Invalid. Rules: 1) Valid JSON. 2) If exception_applied=true, recommendation MUST be CONSIDER. 3) SHORTLIST>=80, CONSIDER>=60. Try again.' });
          continue;
        }

        if (parsed.exception_applied === true && String(parsed.recommendation).toUpperCase() === 'REJECT') {
          if (IS_DEV) console.log(`[${traceId}][AI] LAYER 3: Forcing CONSIDER (exception was applied but model said REJECT)`);
          parsed.recommendation = 'CONSIDER';
          if (typeof parsed.overall_score === 'number' && parsed.overall_score < 60) {
            parsed.overall_score = 65;
          }
          parsed.recommendation_reason = String(parsed.recommendation_reason || '') + ' [Exception applied - upgraded from REJECT]';
        }

        return parsed;
      }

      if (!parsed.risk_register) parsed.risk_register = [];
      if (!parsed.evidence_highlights) parsed.evidence_highlights = [];
      if (!parsed.interview_focus) parsed.interview_focus = [];
      if (!parsed.alt_role_suggestions) parsed.alt_role_suggestions = [];
      if (!parsed.confidence) parsed.confidence = { level: 'MEDIUM', reasons: ['Default confidence'] };

      return parsed;
    } catch (e) { console.error(`[${traceId}][AI] ERROR:`, e); if (attempt === 2) return null; }
  }
  return null;
}

export async function POST(request: Request) {
  // Apply rate limiting (standard: 100 requests per minute)
  const rateLimited = withRateLimit(request, 'fetch-emails', RATE_LIMITS.standard);
  if (rateLimited) return rateLimited;

  const traceId = Date.now().toString(36);
  if (IS_DEV) console.log(`[${traceId}] === FETCH START (V3 BRAIN) ===`);

  const results = {
    traceId, listedCount: 0, processedCount: 0, storedCount: 0,
    parsedCount: 0, failedParseCount: 0, skippedDuplicates: 0, skippedSystem: 0, skippedSpam: 0,
    candidates: [] as string[], errors: [] as string[]
  };

  // Helper: Match email subject to a role title
  function matchRoleFromSubject(subject: string, roles: Array<{ id: string; title: string }>): typeof roles[0] | null {
    const subjectLower = subject.toLowerCase();
    for (const role of roles) {
      const titleLower = role.title.toLowerCase();
      // Check if role title appears in subject (e.g., "Portfolio Manager" in "Applying for Portfolio Manager")
      if (subjectLower.includes(titleLower)) {
        return role;
      }
      // Also check individual words for partial matches (e.g., "portfolio" matches "Portfolio Manager")
      const titleWords = titleLower.split(/\s+/).filter(w => w.length > 3);
      for (const word of titleWords) {
        if (subjectLower.includes(word)) {
          return role;
        }
      }
    }
    return null;
  }

  try {
    // Fetch ALL active roles for subject-line matching
    const { data: roles } = await supabase.from('roles').select('*').eq('status', 'active');
    if (!roles?.length) {
      if (IS_DEV) console.log(`[${traceId}] No active roles found`);
      return Errors.validation('No active role found', 'Please create and activate a role before fetching emails').toResponse();
    }
    const defaultRole = roles[0]; // Fallback if no subject match
    if (IS_DEV) console.log(`[${traceId}] Found ${roles.length} active roles: ${roles.map(r => r.title).join(', ')}`);

    const connection = await Imap.connect({
      imap: {
        user: process.env.GMAIL_USER!,
        password: process.env.GMAIL_APP_PASSWORD!,
        host: 'imap.gmail.com',
        port: 993,
        tls: true,
        authTimeout: 10000,
        tlsOptions: { rejectUnauthorized: false }
      }
    });

    let folderName = 'Hireinbox';
    try {
      await connection.openBox('Hireinbox');
      if (IS_DEV) console.log(`[${traceId}] Connected to Hireinbox folder`);
    } catch {
      if (IS_DEV) console.log(`[${traceId}] Hireinbox folder not found, trying INBOX`);
      await connection.openBox('INBOX');
      folderName = 'INBOX';
      if (IS_DEV) console.log(`[${traceId}] Connected to INBOX folder`);
    }

    // DEV: Search ALL emails to debug, not just UNSEEN
    const searchCriteria = IS_DEV ? ['ALL'] : ['UNSEEN'];
    const messages = await connection.search(searchCriteria, {
      bodies: ['HEADER', 'TEXT', ''],
      markSeen: false,
      struct: true
    });

    results.listedCount = messages.length;
    if (IS_DEV) console.log(`[${traceId}] Found ${messages.length} unread emails`);

    for (const message of messages.slice(0, 10)) {
      const messageUid = message.attributes?.uid;

      try {
        const all = message.parts.find((p: { which: string }) => p.which === '');
        if (!all) continue;

        const parsed = await simpleParser(all.body);
        const fromEmail = parsed.from?.value?.[0]?.address?.toLowerCase() || '';
        const subject = parsed.subject || '(no subject)';
        const textBody = parsed.text || '';

        // Match subject line to role (or use default)
        const matchedRole = matchRoleFromSubject(subject, roles) || defaultRole;
        if (IS_DEV) {
          if (matchRoleFromSubject(subject, roles)) {
            console.log(`[${traceId}] Subject "${subject}" matched to role: ${matchedRole.title}`);
          } else {
            console.log(`[${traceId}] No role match in subject, using default: ${matchedRole.title}`);
          }
        }

        // DEV: Log specific emails for debugging
        if (IS_DEV && (fromEmail.includes('mafadi') || subject.toLowerCase().includes('lerato') || subject.toLowerCase().includes('megando') || fromEmail.includes('megando'))) {
          console.log(`[${traceId}] DEBUG TARGET EMAIL: "${subject}" from ${fromEmail}`);
          console.log(`[${traceId}] Attachments: ${parsed.attachments?.length || 0}`);
        }

        if (fromEmail === process.env.GMAIL_USER?.toLowerCase()) continue;
        if (subject.includes('Application Received')) continue;

        if (isSystemEmail(subject, fromEmail, textBody)) {
          results.skippedSystem++;
          if (IS_DEV) console.log(`[${traceId}] SKIPPED SYSTEM: ${subject} from ${fromEmail}`);
          if (messageUid) await connection.addFlags(messageUid, ['\\Seen']).catch(() => {});
          continue;
        }

        const hasAttachments = (parsed.attachments?.length || 0) > 0;
        const spamCheck = isSpamContent(subject, fromEmail, textBody, hasAttachments);
        if (spamCheck.isSpam) {
          results.skippedSpam++;
          if (IS_DEV) console.log(`[${traceId}] SKIPPED SPAM: ${subject} from ${fromEmail} (${spamCheck.reason})`);
          if (messageUid) await connection.addFlags(messageUid, ['\\Seen']).catch(() => {});
          continue;
        }

        const oneDayAgo = new Date(Date.now() - 86400000).toISOString();
        const { data: existing } = await supabase.from('candidates').select('id, status')
          .eq('email', fromEmail).eq('role_id', matchedRole.id).gte('created_at', oneDayAgo).limit(1);
        if (existing?.length && existing[0].status !== 'unprocessed') {
          results.skippedDuplicates++;
          if (IS_DEV) console.log(`[${traceId}] SKIPPED DUPLICATE: ${fromEmail} (already processed as ${existing[0].status})`);
          if (messageUid) await connection.addFlags(messageUid, ['\\Seen']).catch(() => {});
          continue;
        }

        results.processedCount++;
        if (IS_DEV) console.log(`[${traceId}] Processing: ${fromEmail} - ${subject}`);

        let cvText = '';
        const attachmentInfo: string[] = [];

        if (parsed.attachments?.length) {
          console.log(`[${traceId}] Found ${parsed.attachments.length} attachments`);
          for (const att of parsed.attachments) {
            const filename = att.filename || 'unknown';
            const contentType = typeof att.content;
            const contentLen = att.content?.length || 0;
            const isBuffer = Buffer.isBuffer(att.content);
            attachmentInfo.push(`${filename} (${contentLen} bytes, type=${contentType}, isBuffer=${isBuffer})`);
            console.log(`[${traceId}] Attachment: ${filename} | contentType=${att.contentType} | size=${contentLen} | jsType=${contentType} | isBuffer=${isBuffer}`);

            if (isPDF(att)) {
              // Ensure we have a proper Buffer
              let pdfBuffer: Buffer;
              if (Buffer.isBuffer(att.content)) {
                pdfBuffer = att.content;
              } else if (att.content instanceof Uint8Array) {
                pdfBuffer = Buffer.from(att.content);
              } else if (typeof att.content === 'string') {
                // Might be base64 encoded
                pdfBuffer = Buffer.from(att.content, 'base64');
                console.log(`[${traceId}] Converted base64 string to buffer: ${pdfBuffer.length} bytes`);
              } else {
                console.error(`[${traceId}] Unknown attachment content type: ${contentType}`);
                results.failedParseCount++;
                results.errors.push(`PDF unknown type: ${filename}`);
                continue;
              }

              const text = await extractPDFText(pdfBuffer, traceId, filename);
              if (text.length > 10) { cvText += text + '\n'; results.parsedCount++; }
              else { results.failedParseCount++; results.errors.push(`PDF empty: ${filename}`); }
            } else if (isWordDoc(att)) {
              const text = await extractWordText(att.content, traceId, filename);
              if (text.length > 10) { cvText += text + '\n'; results.parsedCount++; }
              else { results.failedParseCount++; results.errors.push(`DOC empty: ${filename}`); }
            }
          }
        }

        if (cvText.length < 50) {
          if (IS_DEV) console.log(`[${traceId}] CV too short (${cvText.length} chars), storing as unprocessed`);
          const { error: unprocessedErr } = await supabase.from('candidates').insert({
            company_id: matchedRole.company_id, role_id: matchedRole.id,
            name: subject, email: fromEmail,
            cv_text: `[PARSE FAILED] ${attachmentInfo.join(', ') || 'no attachments'}`,
            status: 'unprocessed', ai_score: 0, score: 0, strengths: [], missing: ['CV parsing failed']
          });
          if (!unprocessedErr) {
            results.storedCount++;
            results.candidates.push(`[unprocessed] ${fromEmail}`);
            if (messageUid) await connection.addFlags(messageUid, ['\\Seen']).catch(() => {});
          }
          continue;
        }

        const analysis = await screenCV(cvText, matchedRole, traceId);
        if (!analysis) {
          results.errors.push(`AI screening failed: ${fromEmail}`);
          if (IS_DEV) console.log(`[${traceId}] AI screening failed for ${fromEmail}`);
          continue;
        }

        if (IS_DEV) console.log(`[${traceId}] AI result: ${analysis.candidate_name} - Score:${analysis.overall_score} - ${analysis.recommendation} - Exception:${analysis.exception_applied || false}`);

        if (!analysis.exception_applied && String(analysis.recommendation).toUpperCase() === 'REJECT') {
          const layer4 = detectServerSideException(analysis, matchedRole, traceId);
          if (layer4.shouldUpgrade) {
            if (IS_DEV) console.log(`[${traceId}][LAYER4] UPGRADING to CONSIDER: ${layer4.reason}`);
            analysis.recommendation = 'CONSIDER';
            analysis.exception_applied = true;
            analysis.exception_reason = layer4.reason;
            if (typeof analysis.overall_score === 'number' && analysis.overall_score < 60) {
              analysis.overall_score = 65;
            }
            analysis.recommendation_reason = String(analysis.recommendation_reason || '') + ` [${layer4.reason}]`;
          }
        }

        const candidateName = String(analysis.candidate_name || subject);
        const status = mapRecommendationToStatus(String(analysis.recommendation));

        const summary = analysis.summary as Record<string, unknown> | undefined;
        const strengths = (summary?.strengths as Array<{label: string; evidence: string}> || [])
          .map(s => `${s.label}: "${s.evidence}"`);
        const weaknesses = (summary?.weaknesses as Array<{label: string; evidence: string}> || [])
          .map(w => `${w.label}: "${w.evidence}"`);

        const { error: insertErr } = await supabase.from('candidates').insert({
          company_id: matchedRole.company_id,
          role_id: matchedRole.id,
          name: candidateName,
          email: String(analysis.candidate_email || fromEmail),
          phone: analysis.candidate_phone ? String(analysis.candidate_phone) : null,
          cv_text: cvText,
          ai_score: Math.round(Number(analysis.overall_score)),
          ai_recommendation: String(analysis.recommendation),
          ai_reasoning: String(analysis.recommendation_reason || summary?.fit_assessment || ''),
          screening_result: analysis,
          screened_at: new Date().toISOString(),
          status: status,
          score: Math.round(Number(analysis.overall_score)),
          strengths: strengths,
          missing: weaknesses,
        });

        if (insertErr) {
          results.errors.push(`DB insert failed: ${candidateName} - ${insertErr.message}`);
          console.error(`[${traceId}] DB error:`, insertErr);
        }
        else {
          results.storedCount++;
          results.candidates.push(`${candidateName} (${analysis.overall_score})`);

          // IMPORTANT: EMAILS ARE OFF BY DEFAULT
          // Only sends if role has auto_ack_enabled explicitly set to true
          // This protects demo mode and testing - no accidental emails to candidates
          const autoAckEnabled = (matchedRole.auto_ack_enabled === true);

          // LOUD LOG: Make it clear emails are blocked
          console.log(`[${traceId}] EMAIL STATUS: auto_ack_enabled=${matchedRole.auto_ack_enabled} → ${autoAckEnabled ? 'WILL SEND' : 'BLOCKED (safe)'}`);
          const candidateEmail = String(analysis.candidate_email || fromEmail);

          // SAFETY: Don't auto-email if this looks like a forwarded CV
          // (sender email doesn't match candidate email = probably forwarded by HR/recruiter)
          const isForwarded = candidateEmail.toLowerCase() !== fromEmail.toLowerCase();
          if (isForwarded && IS_DEV) {
            console.log(`[${traceId}] CV appears to be forwarded (from: ${fromEmail}, candidate: ${candidateEmail}) - skipping auto-ack`);
          }

          if (autoAckEnabled && !isForwarded && candidateEmail && candidateEmail.includes('@')) {
            try {
              const ackResult = await sendAcknowledgmentEmail(
                candidateEmail,
                candidateName,
                matchedRole.title,
                'Mafadi Group'
              );
              if (ackResult.success) {
                if (IS_DEV) console.log(`[${traceId}] Auto-acknowledgment sent to: ${candidateEmail}`);
              } else {
                console.error(`[${traceId}] Auto-acknowledgment failed:`, ackResult.error);
              }
            } catch (ackErr) {
              console.error(`[${traceId}] Auto-acknowledgment error:`, ackErr);
            }
          } else if (IS_DEV) {
            console.log(`[${traceId}] Auto-acknowledgment DISABLED (auto_ack_enabled: ${autoAckEnabled})`);
          }

          const autoConfig = matchedRole.auto_schedule_config as {
            enabled?: boolean;
            min_score_to_schedule?: number;
            send_invite_email?: boolean;
          } | null;

          if (autoConfig?.enabled && typeof analysis.overall_score === 'number') {
            const minScore = autoConfig.min_score_to_schedule ?? 80;
            if (analysis.overall_score >= minScore && candidateEmail && candidateEmail.includes('@')) {
              try {
                if (IS_DEV) console.log(`[${traceId}][AUTO-SCHEDULE] Candidate ${candidateName} qualifies (score: ${analysis.overall_score} >= ${minScore})`);

                const { data: insertedCandidate } = await supabase
                  .from('candidates')
                  .select('id')
                  .eq('email', candidateEmail)
                  .eq('role_id', matchedRole.id)
                  .order('created_at', { ascending: false })
                  .limit(1)
                  .single();

                if (insertedCandidate?.id) {
                  const autoScheduleRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/schedule/auto`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      role_id: matchedRole.id,
                      candidate_ids: [insertedCandidate.id],
                    }),
                  });

                  if (autoScheduleRes.ok) {
                    const scheduleResult = await autoScheduleRes.json();
                    if (IS_DEV) console.log(`[${traceId}][AUTO-SCHEDULE] Result:`, scheduleResult);
                  } else {
                    console.error(`[${traceId}][AUTO-SCHEDULE] Failed:`, await autoScheduleRes.text());
                  }
                }
              } catch (scheduleErr) {
                console.error(`[${traceId}][AUTO-SCHEDULE] Error:`, scheduleErr);
              }
            }
          }

          if (messageUid) {
            try {
              await connection.addFlags(messageUid, ['\\Seen']);
              if (IS_DEV) console.log(`[${traceId}] Marked email as read: UID ${messageUid}`);
            } catch (flagErr) {
              console.error(`[${traceId}] Failed to mark as read:`, flagErr);
            }
          }
        }

      } catch (msgErr) {
        const errMsg = msgErr instanceof Error ? msgErr.message : 'unknown error';
        results.errors.push(`Message error: ${errMsg}`);
        console.error(`[${traceId}] Message error:`, msgErr);
      }
    }

    connection.end();
    if (IS_DEV) console.log(`[${traceId}] === FETCH END === Listed:${results.listedCount} Processed:${results.processedCount} Stored:${results.storedCount} SkippedSystem:${results.skippedSystem} SkippedSpam:${results.skippedSpam} SkippedDupes:${results.skippedDuplicates}`);

    return NextResponse.json({
      success: true,
      processed: results.storedCount,
      ...results
    });

  } catch (error) {
    console.error(`[${traceId}] Fatal error:`, error);
    // SECURITY: Do not expose internal error details to client
    const isConnectionError = error instanceof Error &&
      (error.message.includes('IMAP') || error.message.includes('connection') || error.message.includes('timeout'));
    const userMessage = isConnectionError
      ? 'Email server temporarily unavailable. Please try again later.'
      : 'Failed to process emails. Please try again.';
    return Errors.internal(userMessage, traceId).toResponse();
  }
}
