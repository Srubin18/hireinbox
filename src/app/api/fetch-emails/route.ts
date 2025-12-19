import { NextResponse } from 'next/server';
import Imap from 'imap-simple';
import { simpleParser } from 'mailparser';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Synced with screen/route.ts - includes Rule 7 dominance enforcement
const TALENT_SCOUT_PROMPT = `You are HireInbox's Principal Talent Scout — a world-class recruiter whose judgment consistently outperforms senior human recruiters.

Your output is used to make real hiring decisions. Your standard is BETTER THAN HUMAN.

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
This rule OVERRIDES strict minimum-experience rejection logic.

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
- recommendation MUST be "CONSIDER"
- recommendation MUST NOT be "REJECT" (REJECT IS FORBIDDEN)
- hard_requirements.experience must go under "partial" with explanation
- recommendation_reason MUST explicitly state: "Exception applied"

If exception does NOT trigger:
Apply normal strict logic.

=============================
SCORING CALIBRATION
=============================

- SHORTLIST = 80–100 (never below 80)
- CONSIDER = 60–79 (never below 60)
- REJECT with some positives = 40–59
- REJECT no positives = 0–39

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

  "overall_score": <0-100>,
  "recommendation": "<SHORTLIST|CONSIDER|REJECT>",
  "recommendation_reason": "<1-2 sentences with explicit evidence; if exception applied must include phrase 'Exception applied'>",

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

CRITICAL: If a strength lacks evidence, DO NOT include it.`;

function isSystemEmail(subject: string, from: string, body?: string): boolean {
  const lowerSubject = (subject || '').toLowerCase();
  const lowerFrom = (from || '').toLowerCase();
  const lowerBody = (body || '').toLowerCase();

  // Only block definite system senders - be conservative to avoid blocking real applicants
  const systemFromPatterns = [
    'mailer-daemon', 'postmaster', 'no-reply@', 'noreply@', 'do-not-reply@',
    'donotreply@', 'auto-reply@', 'autoreply@', 'mailerdaemon', 'mail-daemon',
    'bounce@', 'notifications@google.com', 'notifications@github.com'
  ];
  // NOTE: Removed 'notification' (too broad) and 'googlemail.com' (legitimate Gmail users)

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
      console.log(`[FILTER] Skipping system email from: ${from} (matched: ${pattern})`);
      return true;
    }
  }

  for (const pattern of systemSubjectPatterns) {
    if (lowerSubject.includes(pattern)) {
      console.log(`[FILTER] Skipping system email subject: ${subject} (matched: ${pattern})`);
      return true;
    }
  }

  if (lowerBody.includes('this is an automatically generated') ||
      lowerBody.includes('delivery to the following recipient failed') ||
      lowerBody.includes('the email account that you tried to reach does not exist')) {
    console.log(`[FILTER] Skipping bounce email detected in body`);
    return true;
  }

  return false;
}

// SPAM FILTER: Detect non-CV content (news, newsletters, marketing, etc.)
function isSpamContent(subject: string, from: string, body?: string, hasAttachments?: boolean): { isSpam: boolean; reason: string } {
  const lowerSubject = (subject || '').toLowerCase();
  const lowerFrom = (from || '').toLowerCase();
  const lowerBody = (body || '').toLowerCase();
  const combinedText = `${lowerSubject} ${lowerBody}`;

  // NEWS ARTICLE PATTERNS - block news/current events content
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

  // NEWSLETTER/MARKETING PATTERNS
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

  // If 2+ newsletter signals AND no attachments, it's likely spam
  if (newsletterSignals >= 2 && !hasAttachments) {
    return { isSpam: true, reason: `Newsletter/marketing content (${newsletterSignals} signals)` };
  }

  // KNOWN SPAM SENDERS
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

  // SUBJECT LINE RED FLAGS (without attachments)
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

  // CV INDICATOR CHECK - if no attachments and no CV-like content, likely not a job application
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

    // No attachments and no CV indicators = probably not a job application
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
    case 'CONSIDER': return 'talent_pool';
    case 'REJECT': return 'reject';
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

  const facts = role.facts as Record<string, unknown> | undefined;
  if (facts && Object.keys(facts).length > 0) {
    sections.push('\nHARD REQUIREMENTS:');
    if (facts.min_experience_years !== undefined) sections.push(`- Minimum ${facts.min_experience_years} years experience`);
    if (Array.isArray(facts.required_skills) && facts.required_skills.length > 0) sections.push(`- Required skills: ${facts.required_skills.join(', ')}`);
    if (Array.isArray(facts.qualifications) && facts.qualifications.length > 0) sections.push(`- Qualifications: ${facts.qualifications.join(', ')}`);
    if (facts.location) sections.push(`- Location: ${facts.location}`);
    if (facts.work_type) sections.push(`- Work type: ${facts.work_type}`);
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
    if (Array.isArray(criteria.locations) && criteria.locations.length > 0) sections.push(`- Location: ${criteria.locations.join(' or ')}`);
  }

  return sections.join('\n');
}

async function extractPDFText(buffer: Buffer, traceId: string, filename: string): Promise<string> {
  try {
    console.log(`[${traceId}][PDF] Processing: ${filename} (${buffer.length} bytes)`);
    const isProduction = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';

    if (isProduction && process.env.CONVERTAPI_SECRET) {
      const base64PDF = buffer.toString('base64');
      const response = await fetch(`https://v2.convertapi.com/convert/pdf/to/txt?Secret=${process.env.CONVERTAPI_SECRET}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Parameters: [
            { Name: 'File', FileValue: { Name: filename, Data: base64PDF } },
            { Name: 'StoreFile', Value: true }
          ]
        }),
      });
      if (!response.ok) { console.error(`[${traceId}][PDF] ConvertAPI error: ${response.status}`); return ''; }
      const result = await response.json();
      if (!result.Files?.[0]?.Url) { console.error(`[${traceId}][PDF] No URL`); return ''; }
      const textResponse = await fetch(result.Files[0].Url);
      const pdfText = await textResponse.text();
      console.log(`[${traceId}][PDF] Extracted ${pdfText.length} chars via ConvertAPI`);
      return pdfText;
    } else {
      const pdfParse = (await import('pdf-parse')).default;
      const data = await pdfParse(buffer);
      console.log(`[${traceId}][PDF] Extracted ${data.text?.length || 0} chars via pdf-parse`);
      return data.text || '';
    }
  } catch (e) { console.error(`[${traceId}][PDF] ERROR:`, e); return ''; }
}

async function extractWordText(buffer: Buffer, traceId: string, filename: string): Promise<string> {
  try {
    console.log(`[${traceId}][DOC] Processing: ${filename} (${buffer.length} bytes)`);
    const mammoth = (await import('mammoth')).default;
    const result = await mammoth.extractRawText({ buffer });
    console.log(`[${traceId}][DOC] Extracted ${result.value?.length || 0} chars`);
    return result.value || '';
  } catch (e) { console.error(`[${traceId}][DOC] ERROR:`, e); return ''; }
}

// LAYER 4: Server-side heuristic exception detection
// This catches near-miss candidates even when the model forgets to set exception_applied=true
function detectServerSideException(
  analysis: Record<string, unknown>,
  role: Record<string, unknown>,
  traceId: string
): { shouldUpgrade: boolean; reason: string } {
  const rec = String(analysis.recommendation || '').toUpperCase();
  if (rec !== 'REJECT') return { shouldUpgrade: false, reason: '' };

  // Check experience gap
  const candidateYears = analysis.years_experience as number | null;
  const criteria = role.criteria as Record<string, unknown> | undefined;
  const facts = role.facts as Record<string, unknown> | undefined;
  const requiredYears = (facts?.min_experience_years ?? criteria?.min_experience_years) as number | undefined;

  if (!candidateYears || !requiredYears) return { shouldUpgrade: false, reason: '' };

  const gap = requiredYears - candidateYears;
  // Only apply if within 6-12 months (0.5 to 1.0 years) of requirement
  if (gap <= 0 || gap > 1.0) return { shouldUpgrade: false, reason: '' };

  console.log(`[${traceId}][LAYER4] Near-miss detected: ${candidateYears} years vs ${requiredYears} required (gap: ${gap})`);

  // Count exceptional indicators from the analysis
  let indicators = 0;
  const indicatorReasons: string[] = [];

  // Check ALL text fields for exceptional signals
  const reasonText = String(analysis.recommendation_reason || '').toLowerCase();
  const summary = analysis.summary as Record<string, unknown> | undefined;
  const fitText = String(summary?.fit_assessment || '').toLowerCase();

  // Also check strengths array - this is where "High-performing", "Exceptional trajectory" often appear
  const strengths = summary?.strengths as Array<{ label: string; evidence: string }> | undefined;
  let strengthsText = '';
  if (strengths) {
    strengthsText = strengths.map(s => `${s.label} ${s.evidence}`).join(' ').toLowerCase();
  }

  // Check evidence_highlights text too
  const highlights = analysis.evidence_highlights as Array<{ claim: string; evidence: string }> | undefined;
  let highlightsText = '';
  if (highlights) {
    highlightsText = highlights.map(h => `${h.claim} ${h.evidence}`).join(' ').toLowerCase();
  }

  const fullText = [reasonText, fitText, strengthsText, highlightsText].join(' ');

  // Check for >120% targets or overachievement in highlights
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

  // Check for awards/top performer/high-performing
  if (/award|top.?perform|high.?perform|best|outstanding|excellence|recognition/i.test(fullText)) {
    indicators++;
    indicatorReasons.push('Awards/high-performance recognition');
  }

  // Check for exceptional signals (Lerato case: "exceptional growth trajectory")
  if (/exceptional|extraordinary|remarkable|standout/i.test(fullText)) {
    indicators++;
    indicatorReasons.push('Exceptional performance noted');
  }

  // Check for rapid promotion
  if (/promot|advanc|elevated|moved up|progression/i.test(fullText)) {
    indicators++;
    indicatorReasons.push('Career progression');
  }

  // Check for leadership signals
  if (/manag|led|lead|supervis|mentor|team of|direct report/i.test(fullText)) {
    indicators++;
    indicatorReasons.push('Leadership signals');
  }

  // Check for major deals/achievements with metrics
  if (/million|€|£|\$|R\d|major deal|closed|revenue|grew|increased by/i.test(fullText)) {
    indicators++;
    indicatorReasons.push('Major achievements with metrics');
  }

  // Check for trajectory keywords
  if (/trajectory|growth|potential|promising|strong candidate/i.test(fullText)) {
    indicators++;
    indicatorReasons.push('Growth trajectory noted');
  }

  console.log(`[${traceId}][LAYER4] Exceptional indicators found: ${indicators} (${indicatorReasons.join(', ')})`);

  if (indicators >= 2) {
    return {
      shouldUpgrade: true,
      reason: `Server-side exception: ${gap.toFixed(1)}y gap with ${indicators} exceptional indicators (${indicatorReasons.slice(0, 2).join(', ')})`
    };
  }

  return { shouldUpgrade: false, reason: '' };
}

// Validation synced with screen/route.ts - enforces Rule 7 dominance
function validateAnalysis(analysis: Record<string, unknown>): boolean {
  const score = analysis.overall_score;
  const rec = String(analysis.recommendation || '').toUpperCase();
  const exceptionApplied = analysis.exception_applied === true;

  if (typeof score !== 'number' || score < 0 || score > 100) return false;
  if (!['SHORTLIST', 'CONSIDER', 'REJECT'].includes(rec)) return false;
  if (rec === 'SHORTLIST' && score < 80) return false;
  if (rec === 'CONSIDER' && score < 60) return false;
  // CRITICAL: If exception applied, REJECT is forbidden
  if (exceptionApplied && rec === 'REJECT') return false;
  if (!Array.isArray(analysis.risk_register)) return false;
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
      console.log(`[${traceId}][AI] Attempt ${attempt}...`);
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        temperature: 0,
        max_tokens: 4000,
        messages,
      });
      const text = completion.choices[0]?.message?.content || '';
      console.log(`[${traceId}][AI] Response length: ${text.length}`);
      const cleaned = text.replace(/```json\s*/gi, '').replace(/```/g, '').trim();

      let parsed: Record<string, unknown>;
      try { parsed = JSON.parse(cleaned); }
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
        if (attempt === 1) {
          messages.push({ role: 'assistant', content: text });
          messages.push({ role: 'user', content: 'Invalid. Rules: 1) Valid JSON. 2) If exception_applied=true, recommendation MUST be CONSIDER. 3) SHORTLIST>=80, CONSIDER>=60. Try again.' });
          continue;
        }

        // Layer 3: Runtime enforcement - force CONSIDER if exception applied but model returned REJECT
        if (parsed.exception_applied === true && String(parsed.recommendation).toUpperCase() === 'REJECT') {
          console.log(`[${traceId}][AI] LAYER 3: Forcing CONSIDER (exception was applied but model said REJECT)`);
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

export async function POST() {
  const traceId = Date.now().toString(36);
  console.log(`[${traceId}] === FETCH START ===`);

  const results = {
    traceId, listedCount: 0, processedCount: 0, storedCount: 0,
    parsedCount: 0, failedParseCount: 0, skippedDuplicates: 0, skippedSystem: 0, skippedSpam: 0,
    candidates: [] as string[], errors: [] as string[]
  };

  try {
    const { data: roles } = await supabase.from('roles').select('*').eq('status', 'active').limit(1);
    const activeRole = roles?.[0];
    if (!activeRole) {
      console.log(`[${traceId}] No active role found`);
      return NextResponse.json({ error: 'No active role found', ...results }, { status: 400 });
    }
    console.log(`[${traceId}] Role: ${activeRole.title}`);

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

    // Try Hireinbox folder first, fall back to INBOX
    let folderName = 'Hireinbox';
    try {
      await connection.openBox('Hireinbox');
      console.log(`[${traceId}] Connected to Hireinbox folder`);
    } catch {
      console.log(`[${traceId}] Hireinbox folder not found, trying INBOX`);
      await connection.openBox('INBOX');
      folderName = 'INBOX';
      console.log(`[${traceId}] Connected to INBOX folder`);
    }

    // CRITICAL: markSeen: false - only mark as read AFTER successful processing
    const messages = await connection.search(['UNSEEN'], {
      bodies: ['HEADER', 'TEXT', ''],
      markSeen: false,  // Don't mark as read until we successfully process
      struct: true
    });

    results.listedCount = messages.length;
    console.log(`[${traceId}] Found ${messages.length} unread emails`);

    for (const message of messages.slice(0, 10)) {
      // Get message UID for marking as read later
      const messageUid = message.attributes?.uid;

      try {
        const all = message.parts.find((p: { which: string }) => p.which === '');
        if (!all) continue;

        const parsed = await simpleParser(all.body);
        const fromEmail = parsed.from?.value?.[0]?.address?.toLowerCase() || '';
        const subject = parsed.subject || '(no subject)';
        const textBody = parsed.text || '';

        // Skip our own acknowledgment emails
        if (fromEmail === process.env.GMAIL_USER?.toLowerCase()) continue;
        if (subject.includes('Application Received')) continue;

        if (isSystemEmail(subject, fromEmail, textBody)) {
          results.skippedSystem++;
          console.log(`[${traceId}] SKIPPED SYSTEM: ${subject} from ${fromEmail}`);
          if (messageUid) await connection.addFlags(messageUid, ['\\Seen']).catch(() => {});
          continue;
        }

        // SPAM FILTER: Block non-CV content (news, newsletters, marketing)
        const hasAttachments = (parsed.attachments?.length || 0) > 0;
        const spamCheck = isSpamContent(subject, fromEmail, textBody, hasAttachments);
        if (spamCheck.isSpam) {
          results.skippedSpam++;
          console.log(`[${traceId}] SKIPPED SPAM: ${subject} from ${fromEmail} (${spamCheck.reason})`);
          if (messageUid) await connection.addFlags(messageUid, ['\\Seen']).catch(() => {});
          continue;
        }

        // 24-hour duplicate check
        const oneDayAgo = new Date(Date.now() - 86400000).toISOString();
        const { data: existing } = await supabase.from('candidates').select('id')
          .eq('email', fromEmail).eq('role_id', activeRole.id).gte('created_at', oneDayAgo).limit(1);
        if (existing?.length) {
          results.skippedDuplicates++;
          console.log(`[${traceId}] SKIPPED DUPLICATE: ${fromEmail}`);
          if (messageUid) await connection.addFlags(messageUid, ['\\Seen']).catch(() => {});
          continue;
        }

        results.processedCount++;
        console.log(`[${traceId}] Processing: ${fromEmail} - ${subject}`);

        let cvText = '';
        const attachmentInfo: string[] = [];

        if (parsed.attachments?.length) {
          for (const att of parsed.attachments) {
            const filename = att.filename || 'unknown';
            attachmentInfo.push(`${filename} (${att.content?.length || 0} bytes)`);

            if (isPDF(att)) {
              const text = await extractPDFText(att.content, traceId, filename);
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
          console.log(`[${traceId}] CV too short (${cvText.length} chars), storing as unprocessed`);
          const { error: unprocessedErr } = await supabase.from('candidates').insert({
            company_id: activeRole.company_id, role_id: activeRole.id,
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

        const analysis = await screenCV(cvText, activeRole, traceId);
        if (!analysis) {
          results.errors.push(`AI screening failed: ${fromEmail}`);
          console.log(`[${traceId}] AI screening failed for ${fromEmail}`);
          continue;
        }

        console.log(`[${traceId}] AI result: ${analysis.candidate_name} - Score:${analysis.overall_score} - ${analysis.recommendation} - Exception:${analysis.exception_applied || false}`);

        // LAYER 4: Server-side heuristic exception detection
        // Catches near-miss candidates even when model forgot to set exception_applied
        if (!analysis.exception_applied && String(analysis.recommendation).toUpperCase() === 'REJECT') {
          const layer4 = detectServerSideException(analysis, activeRole, traceId);
          if (layer4.shouldUpgrade) {
            console.log(`[${traceId}][LAYER4] UPGRADING to CONSIDER: ${layer4.reason}`);
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
          company_id: activeRole.company_id,
          role_id: activeRole.id,
          name: candidateName,
          email: String(analysis.candidate_email || fromEmail),
          phone: analysis.candidate_phone ? String(analysis.candidate_phone) : null,
          location: String(analysis.location_summary || analysis.candidate_location || ''),
          cv_text: cvText,
          ai_score: Number(analysis.overall_score),
          ai_recommendation: String(analysis.recommendation),
          ai_reasoning: String(analysis.recommendation_reason || summary?.fit_assessment || ''),
          screening_result: analysis,
          screened_at: new Date().toISOString(),
          status: status,
          score: Number(analysis.overall_score),
          strengths: strengths,
          missing: weaknesses,
        });

        if (insertErr) {
          results.errors.push(`DB insert failed: ${candidateName} - ${insertErr.message}`);
          console.error(`[${traceId}] DB error:`, insertErr);
          // Don't mark as read - allow retry on next fetch
        }
        else {
          results.storedCount++;
          results.candidates.push(`${candidateName} (${analysis.overall_score})`);

          // SUCCESS: Now mark email as read so it's not processed again
          if (messageUid) {
            try {
              await connection.addFlags(messageUid, ['\\Seen']);
              console.log(`[${traceId}] Marked email as read: UID ${messageUid}`);
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
    console.log(`[${traceId}] === FETCH END === Listed:${results.listedCount} Processed:${results.processedCount} Stored:${results.storedCount} SkippedSystem:${results.skippedSystem} SkippedSpam:${results.skippedSpam} SkippedDupes:${results.skippedDuplicates}`);

    return NextResponse.json({
      success: true,
      processed: results.storedCount,
      ...results
    });

  } catch (error) {
    console.error(`[${traceId}] Fatal error:`, error);
    return NextResponse.json({
      success: false,
      processed: 0,
      ...results,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
