import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { SA_CONTEXT_PROMPT } from '@/lib/sa-context';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

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

CRITICAL: If a strength lacks evidence, DO NOT include it.

${SA_CONTEXT_PROMPT}`;

function validateAnalysis(analysis: Record<string, unknown>): boolean {
  const score = analysis.overall_score;
  const rec = String(analysis.recommendation || "").toUpperCase();
  const exceptionApplied = analysis.exception_applied === true;
  if (typeof score !== "number" || score < 0 || score > 100) return false;
  if (!["SHORTLIST", "CONSIDER", "REJECT"].includes(rec)) return false;
  if (rec === "SHORTLIST" && score < 80) return false;
  if (rec === "CONSIDER" && score < 60) return false;
  if (exceptionApplied && rec === "REJECT") return false;
  if (!Array.isArray(analysis.risk_register)) return false;
  if (!analysis.confidence || !(analysis.confidence as Record<string, unknown>).level) return false;
  return true;
}

function buildRoleContext(role: Record<string, unknown>): string {
  const sections: string[] = [];
  sections.push('ROLE: ' + (role.title || 'Unspecified'));
  const context = role.context as Record<string, unknown> | undefined;
  if (context) {
    if (context.seniority) sections.push('SENIORITY: ' + context.seniority);
    if (context.employment_type) sections.push('TYPE: ' + context.employment_type);
    if (context.industry) sections.push('INDUSTRY: ' + context.industry);
  }
  const facts = role.facts as Record<string, unknown> | undefined;
  if (facts && Object.keys(facts).length > 0) {
    sections.push('\nHARD REQUIREMENTS:');
    if (facts.min_experience_years !== undefined) sections.push('- Minimum ' + facts.min_experience_years + ' years experience');
    if (Array.isArray(facts.required_skills) && facts.required_skills.length > 0) sections.push('- Required skills: ' + facts.required_skills.join(', '));
    if (Array.isArray(facts.qualifications) && facts.qualifications.length > 0) sections.push('- Qualifications: ' + facts.qualifications.join(', '));
    if (facts.location) sections.push('- Location: ' + facts.location);
    if (facts.work_type) sections.push('- Work type: ' + facts.work_type);
    if (facts.must_have) sections.push('- Must have: ' + facts.must_have);
  }
  const preferences = role.preferences as Record<string, unknown> | undefined;
  if (preferences?.nice_to_have) sections.push('\nNICE TO HAVE: ' + preferences.nice_to_have);
  const aiGuidance = role.ai_guidance as Record<string, unknown> | undefined;
  if (aiGuidance) {
    if (aiGuidance.strong_fit) sections.push('\nSTRONG FIT LOOKS LIKE: ' + aiGuidance.strong_fit);
    if (aiGuidance.disqualifiers) sections.push('\nDISQUALIFIERS: ' + aiGuidance.disqualifiers);
  }
  const criteria = role.criteria as Record<string, unknown> | undefined;
  if (criteria && (!facts || Object.keys(facts).length === 0)) {
    sections.push('\nREQUIREMENTS:');
    if (criteria.min_experience_years !== undefined) sections.push('- Minimum ' + criteria.min_experience_years + ' years experience');
    if (Array.isArray(criteria.required_skills) && criteria.required_skills.length > 0) sections.push('- Required skills: ' + criteria.required_skills.join(', '));
    if (Array.isArray(criteria.locations) && criteria.locations.length > 0) sections.push('- Location: ' + criteria.locations.join(' or '));
  }
  return sections.join('\n');
}

function mapRecommendationToStatus(recommendation: string): string {
  switch ((recommendation || '').toUpperCase()) {
    case 'SHORTLIST': return 'shortlist';
    case 'CONSIDER': return 'talent_pool';
    case 'REJECT': return 'reject';
    default: return 'screened';
  }
}

function parseAIResponse(text: string): Record<string, unknown> | null {
  try {
    const cleaned = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
    return JSON.parse(cleaned);
  } catch { return null; }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { candidateId, roleId, cvText } = body;
    if (!roleId) return NextResponse.json({ error: 'Missing roleId' }, { status: 400 });

    const { data: role, error: roleError } = await supabase.from('roles').select('*').eq('id', roleId).single();
    if (roleError || !role) return NextResponse.json({ error: 'Role not found' }, { status: 404 });

    let cvContent = cvText;
    let candidate: Record<string, unknown> | null = null;

    if (candidateId) {
      const { data: candidateData, error: candidateError } = await supabase.from('candidates').select('*').eq('id', candidateId).single();
      if (candidateError || !candidateData) return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
      candidate = candidateData;
      cvContent = candidateData.cv_text || cvText;
    }

    if (!cvContent || cvContent.trim().length < 50) return NextResponse.json({ error: 'Invalid CV' }, { status: 400 });

    const roleContext = buildRoleContext(role);
    const userPrompt = 'ROLE CONTEXT:\n' + roleContext + '\n\nCV TO EVALUATE:\n' + cvContent + '\n\nINSTRUCTIONS:\n1. Every strength MUST have evidence. No evidence = don\'t include it.\n2. Apply RULE 7 exception for near-miss candidates with 2+ exceptional indicators.\n3. If exception applies: recommendation MUST be CONSIDER, score 60-75, exception_applied=true.\n\nRespond with valid JSON only.';

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0,
      max_tokens: 4000,
      messages: [{ role: 'system', content: TALENT_SCOUT_PROMPT }, { role: 'user', content: userPrompt }]
    });

    const responseText = completion.choices[0]?.message?.content || '';
    let assessment = parseAIResponse(responseText);

    if (!assessment || !validateAnalysis(assessment)) {
      const retry = await openai.chat.completions.create({
        model: 'gpt-4o', temperature: 0, max_tokens: 4000,
        messages: [
          { role: 'system', content: TALENT_SCOUT_PROMPT },
          { role: 'user', content: userPrompt },
          { role: 'assistant', content: responseText },
          { role: 'user', content: 'Invalid. Rules: 1) Valid JSON. 2) If exception_applied=true, recommendation MUST be CONSIDER. 3) SHORTLIST>=80, CONSIDER>=60. Try again.' }
        ]
      });
      assessment = parseAIResponse(retry.choices[0]?.message?.content || '');
    }

    if (!assessment || !validateAnalysis(assessment)) return NextResponse.json({ error: 'Parse error' }, { status: 500 });

    if (!assessment.risk_register) assessment.risk_register = [];
    if (!assessment.evidence_highlights) assessment.evidence_highlights = [];

    if (candidateId && candidate) {
      const status = mapRecommendationToStatus(assessment.recommendation as string);
      await supabase.from('candidates').update({
        ai_score: assessment.overall_score,
        ai_recommendation: assessment.recommendation,
        ai_reasoning: (assessment.summary as Record<string, unknown>)?.fit_assessment || assessment.recommendation_reason,
        screening_result: assessment,
        screened_at: new Date().toISOString(),
        status,
        score: assessment.overall_score,
        strengths: (assessment.summary as Record<string, unknown>)?.strengths || [],
        missing: (assessment.summary as Record<string, unknown>)?.weaknesses || []
      }).eq('id', candidateId);
    }

    return NextResponse.json({ success: true, assessment, role: { id: role.id, title: role.title } });
  } catch (error) {
    console.error('Screening error:', error);
    return NextResponse.json({ error: 'Screening failed' }, { status: 500 });
  }
}
