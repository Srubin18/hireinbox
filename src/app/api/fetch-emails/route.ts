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

const TALENT_SCOUT_PROMPT = `You are HireInbox's Principal Talent Scout — a world-class recruiter whose judgment consistently outperforms senior human recruiters.

Your output is used to make real hiring decisions. Your standard is BETTER THAN HUMAN.

## CORE RULES (NON-NEGOTIABLE)

🔴 RULE 1 — ZERO INVENTED STRENGTHS
You are FORBIDDEN from listing any strength unless supported by CONCRETE EVIDENCE.

FORBIDDEN PHRASES (unless directly evidenced with quote/number):
- Dynamic, Results-driven, Strong communicator, Team player, Self-motivated, Passionate, Leadership (without proof)

If a CV contains only buzzwords with no numbers, promotions, awards, or outcomes:
State: "Limited measurable evidence provided"

🔴 RULE 2 — EVIDENCE DISCIPLINE
EVERY claim must be backed by:
- A direct quote from the CV in quotation marks, OR
- A number/metric from the CV, OR  
- Explicit statement: "not mentioned"

Never speculate. Never infer. Never embellish.

🔴 RULE 3 — CONFIDENCE CALIBRATION
Assess your confidence based on evidence completeness:
- HIGH: Multiple quantified achievements, clear progression, verifiable claims
- MEDIUM: Some evidence but gaps exist, claims not fully verifiable
- LOW: Mostly buzzwords, vague descriptions, limited concrete evidence

🔴 RULE 4 — RISK REGISTER (ALWAYS REQUIRED)
Every candidate MUST have a risk_register (even if empty array).
For each risk: severity (LOW/MEDIUM/HIGH), evidence, interview question.

🔴 RULE 5 — LOCATION & WORK MODE
Extract location if mentioned. Infer work_mode if stated (onsite/hybrid/remote/unknown).

🔴 RULE 6 — ALTERNATIVE ROLE SUGGESTIONS
ONLY suggest alternative roles if there is REAL EVIDENCE the candidate would fit.
If no evidence, return empty array. Never guess.

🔴 RULE 7 — EXCEPTION RULE FOR NEAR-MISS CANDIDATES
If within 6-12 months of experience requirement AND shows 2+ exceptional indicators:
- Rapid promotion, >120% targets, awards, leadership signals, strong trajectory
THEN: downgrade to "partial", recommend CONSIDER, explain exception.

🔴 RULE 8 — TONE ALIGNMENT
If evidence is weak, your output should feel conservative, not enthusiastic.
High scores with apologetic language are contradictory. Match tone to confidence.

## SCORING CALIBRATION

SHORTLIST = 80-100 (never below 80)
CONSIDER = 60-79
REJECT with qualities = 40-59
REJECT no qualities = 0-39

## OUTPUT FORMAT (STRICT JSON)

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
  "recommendation_reason": "<1-2 sentence decision-ready reasoning with specific evidence>",

  "confidence": {
    "level": "<HIGH|MEDIUM|LOW>",
    "reasons": ["<why this confidence level>"]
  },

  "evidence_highlights": [
    {"claim": "<what we're asserting>", "evidence": "<direct quote or metric from CV>"}
  ],

  "hard_requirements": {
    "met": ["<requirement>: \\"<quote>\\""],
    "not_met": ["<requirement>: not mentioned"],
    "partial": ["<requirement>: \\"<quote>\\" — <why partial>"],
    "unclear": ["<requirement>: <why unclear>"]
  },

  "risk_register": [
    {
      "risk": "<risk label>",
      "severity": "<LOW|MEDIUM|HIGH>",
      "evidence": "<quote or 'not mentioned'>",
      "interview_question": "<specific question>"
    }
  ],

  "interview_focus": [
    "<question 1>",
    "<question 2>",
    "<question 3>",
    "<question 4>",
    "<question 5>"
  ],

  "alt_role_suggestions": [
    {
      "role": "<alternative role title>",
      "why": "<evidence-based reason>",
      "confidence": "<LOW|MEDIUM|HIGH>"
    }
  ],

  "summary": {
    "strengths": [
      {"label": "<strength>", "evidence": "<quote or metric>"}
    ],
    "weaknesses": [
      {"label": "<weakness>", "evidence": "<quote or 'not mentioned'>"}
    ],
    "fit_assessment": "<3-5 sentences: Worth meeting? What excites? What could go wrong? Confidence level.>"
  }
}

CRITICAL: If you cannot find evidence for a strength, DO NOT include it. Return empty array or state "Limited measurable evidence provided".`;

function isSystemEmail(subject: string, from: string, body?: string): boolean {
  const lowerSubject = (subject || '').toLowerCase();
  const lowerFrom = (from || '').toLowerCase();
  const lowerBody = (body || '').toLowerCase();

  const systemFromPatterns = [
    'mailer-daemon', 'postmaster', 'no-reply', 'noreply', 'do-not-reply',
    'donotreply', 'auto-reply', 'autoreply', 'mailerdaemon', 'mail-daemon',
    'bounce', 'notification', 'googlemail.com'
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

function validateAnalysis(analysis: Record<string, unknown>): boolean {
  if (typeof analysis.overall_score !== 'number' || analysis.overall_score < 0 || analysis.overall_score > 100) return false;
  if (!['SHORTLIST', 'CONSIDER', 'REJECT'].includes(String(analysis.recommendation || '').toUpperCase())) return false;
  return true;
}

async function screenCV(cvText: string, role: Record<string, unknown>, traceId: string) {
  const roleContext = buildRoleContext(role);
  
  const userPrompt = `ROLE CONTEXT:
${roleContext}

CV TO EVALUATE:
${cvText}

INSTRUCTIONS:
1. Every strength MUST have evidence (quote or metric). No evidence = don't include it.
2. Assess confidence level based on evidence quality.
3. Always populate risk_register (even if empty array).
4. Extract location and work_mode if mentioned.
5. Only suggest alt_role_suggestions if real evidence exists.
6. Apply exception rule for near-miss candidates with 2+ exceptional indicators.
7. Ensure score aligns with recommendation.
8. Match tone to confidence — weak evidence = conservative output.

Respond with valid JSON only.`;

  const messages: { role: 'system' | 'user'; content: string }[] = [
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
        if (attempt === 1) { messages.push({ role: 'user', content: 'Invalid JSON. Return ONLY valid JSON.' }); continue; }
        return null;
      }
      
      if (!validateAnalysis(parsed)) {
        console.error(`[${traceId}][AI] Validation failed`);
        if (attempt === 1) { messages.push({ role: 'user', content: 'Missing fields. Include overall_score and recommendation.' }); continue; }
        return null;
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
    parsedCount: 0, failedParseCount: 0, skippedDuplicates: 0, skippedSystem: 0,
    candidates: [] as string[], errors: [] as string[]
  };

  try {
    const { data: roles } = await supabase.from('roles').select('*').eq('status', 'active').limit(1);
    const activeRole = roles?.[0];
    if (!activeRole) return NextResponse.json({ error: 'No active role found' }, { status: 400 });
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
    
    await connection.openBox('Hireinbox');
    console.log(`[${traceId}] Connected to Hireinbox`);

    const messages = await connection.search(['UNSEEN'], {
      bodies: ['HEADER', 'TEXT', ''],
      markSeen: true,
      struct: true
    });
    
    results.listedCount = messages.length;
    console.log(`[${traceId}] Found ${messages.length} unread emails`);

    for (const message of messages.slice(0, 10)) {
      try {
        const all = message.parts.find((p: { which: string }) => p.which === '');
        if (!all) continue;

        const parsed = await simpleParser(all.body);
        const fromEmail = parsed.from?.value?.[0]?.address?.toLowerCase() || '';
        const subject = parsed.subject || '(no subject)';
        const textBody = parsed.text || '';
        
        if (fromEmail === process.env.GMAIL_USER?.toLowerCase()) continue;
        if (subject.includes('Application Received')) continue;
        
        if (isSystemEmail(subject, fromEmail, textBody)) { 
          results.skippedSystem++; 
          console.log(`[${traceId}] SKIPPED SYSTEM: ${subject} from ${fromEmail}`);
          continue; 
        }

        const oneDayAgo = new Date(Date.now() - 86400000).toISOString();
        const { data: existing } = await supabase.from('candidates').select('id')
          .eq('email', fromEmail).eq('role_id', activeRole.id).gte('created_at', oneDayAgo).limit(1);
        if (existing?.length) { results.skippedDuplicates++; continue; }

        results.processedCount++;
        console.log(`[${traceId}] Processing: ${fromEmail} - ${subject}`);

        let cvText = '';
        let attachmentInfo: string[] = [];

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
          await supabase.from('candidates').insert({
            company_id: activeRole.company_id, role_id: activeRole.id,
            name: subject, email: fromEmail,
            cv_text: `[PARSE FAILED] ${attachmentInfo.join(', ') || 'none'}`,
            status: 'unprocessed', ai_score: 0, score: 0, strengths: [], missing: ['CV parsing failed']
          });
          results.storedCount++;
          results.candidates.push(`[unprocessed] ${fromEmail}`);
          continue;
        }

        const analysis = await screenCV(cvText, activeRole, traceId);
        if (!analysis) { results.errors.push(`AI failed: ${fromEmail}`); continue; }

        console.log(`[${traceId}] AI: ${analysis.candidate_name} - ${analysis.overall_score} - ${analysis.recommendation}`);

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

        if (insertErr) { results.errors.push(`DB: ${candidateName}`); }
        else { results.storedCount++; results.candidates.push(candidateName); }

      } catch (msgErr) {
        results.errors.push(`Error: ${msgErr instanceof Error ? msgErr.message : 'unknown'}`);
      }
    }

    connection.end();
    console.log(`[${traceId}] === FETCH END === Stored:${results.storedCount} SkippedSystem:${results.skippedSystem}`);
    return NextResponse.json({ success: true, ...results });

  } catch (error) {
    console.error(`[${traceId}] Fatal:`, error);
    return NextResponse.json({ success: false, ...results, error: error instanceof Error ? error.message : 'Unknown' }, { status: 500 });
  }
}
