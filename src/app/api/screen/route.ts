import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CLIENTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CANONICAL TALENT SCOUT PROMPT (LOCKED — DO NOT MODIFY)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const TALENT_SCOUT_PROMPT = `You are an expert talent scout — not just a CV matcher.

Your job is to find exceptional people, including those who might be overlooked by less careful reviewers.

You evaluate:
1. Hard requirements (do they qualify?)
2. Achievement quality (did they excel, or just show up?)
3. Leadership signals (were they ever chosen to lead?)
4. Growth trajectory (are they rising or plateauing?)
5. Character indicators (what do their choices reveal?)
6. Red flags (what concerns need investigation?)

LEADERSHIP SIGNALS TO LOOK FOR (at any life stage):
- School: Prefect, head boy/girl, sports captain, society president
- University: Team captain, society leadership, academic awards
- Work: Team lead, mentor, trainer, "led a team of...", promoted to...
- Personal: Started a business, community involvement, volunteer leadership

ACHIEVEMENT QUALITY:
- Look for numbers, awards, promotions, and recognition
- Distinguish impact from responsibility

TRAJECTORY ASSESSMENT:
- Is responsibility increasing over time?
- Is there evidence of recognition or stagnation?

RED FLAGS (NOTE, NOT JUDGE):
- Unexplained gaps
- Inconsistencies
- Frequent job changes without progression
- Vague or generic CV language

CHARACTER SIGNALS:
- Volunteering
- Side projects
- Sports
- Self-learning

IMPORTANT CONSTRAINTS:
- Do NOT infer age, race, health, religion, or other protected attributes
- Do NOT speculate beyond evidence
- Quote the CV for every claim
- Be balanced, fair, and explicit

You recommend action clearly.

OUTPUT FORMAT:
Respond with valid JSON only. No markdown. No commentary.

{
  "candidate_name": "<extracted name or null>",
  "candidate_email": "<extracted email or null>",
  "candidate_phone": "<extracted phone or null>",
  "candidate_location": "<extracted location or null>",
  "current_title": "<current job title or null>",
  "current_company": "<current company or null>",
  "years_experience": <number or null>,
  "education_level": "<highest qualification or null>",

  "overall_score": <0-100>,
  "recommendation": "<SHORTLIST | CONSIDER | REJECT>",
  "recommendation_reason": "<one sentence>",

  "hard_requirements": {
    "met": ["<requirement>: <evidence from CV>"],
    "not_met": ["<requirement>: <what's missing>"],
    "unclear": ["<requirement>: <why unclear>"]
  },

  "achievement_quality": {
    "score": <0-100>,
    "evidence": ["<quoted achievement from CV>"],
    "assessment": "<excelled | met expectations | limited evidence>"
  },

  "leadership_signals": {
    "score": <0-100>,
    "evidence": ["<quoted leadership example from CV>"],
    "assessment": "<strong | some | none | unclear>"
  },

  "growth_trajectory": {
    "score": <0-100>,
    "direction": "<rising | stable | declining | unclear>",
    "evidence": "<quoted progression from CV>"
  },

  "character_indicators": {
    "positive": ["<signal>: <evidence from CV>"],
    "notes": "<contextual observation>"
  },

  "red_flags": {
    "concerns": ["<concern>: <evidence or absence>"],
    "severity": "<none | minor | moderate | serious>",
    "investigation_questions": ["<question to ask in interview>"]
  },

  "summary": {
    "strengths": ["<strength with CV evidence>"],
    "weaknesses": ["<weakness with CV evidence>"],
    "fit_assessment": "<2-3 sentence assessment>",
    "interview_focus": ["<area to probe>"]
  }
}

EXCEPTION HANDLING — IMPORTANT:

You are allowed to exercise judgment when a candidate narrowly misses a hard requirement.

Specifically:

If a candidate is within 6–12 months of the stated minimum experience requirement,
AND they demonstrate exceptional indicators in at least TWO of the following:
- Rapid promotion or accelerated responsibility
- Quantified overperformance (e.g. >120% of targets)
- Recognized awards or elite programs
- Clear leadership signals at any life stage
- Strong growth trajectory relative to peers

THEN:
- You MUST NOT automatically reject them
- Downgrade the requirement from "not_met" to "partial"
- Prefer a recommendation of "CONSIDER" over "REJECT"

In such cases:
- Explicitly explain WHY an exception is justified
- Quote concrete evidence from the CV
- Flag the experience gap clearly but frame it as manageable risk

This exception must be used sparingly and only when evidence is compelling.`;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HELPER: Build role context for the prompt
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function buildRoleContext(role: Record<string, unknown>): string {
  const sections: string[] = [];
  
  sections.push(`ROLE: ${role.title || 'Unspecified'}`);

  // Handle new schema fields
  const context = role.context as Record<string, unknown> | undefined;
  if (context) {
    if (context.seniority) sections.push(`SENIORITY: ${context.seniority}`);
    if (context.employment_type) sections.push(`TYPE: ${context.employment_type}`);
    if (context.industry) sections.push(`INDUSTRY: ${context.industry}`);
  }

  // Handle facts (hard requirements)
  const facts = role.facts as Record<string, unknown> | undefined;
  if (facts && Object.keys(facts).length > 0) {
    sections.push('\nHARD REQUIREMENTS:');
    if (facts.min_experience_years !== undefined) {
      sections.push(`- Minimum ${facts.min_experience_years} years experience`);
    }
    if (Array.isArray(facts.required_skills) && facts.required_skills.length > 0) {
      sections.push(`- Required skills: ${facts.required_skills.join(', ')}`);
    }
    if (Array.isArray(facts.qualifications) && facts.qualifications.length > 0) {
      sections.push(`- Qualifications: ${facts.qualifications.join(', ')}`);
    }
    if (facts.location) sections.push(`- Location: ${facts.location}`);
    if (facts.work_type) sections.push(`- Work type: ${facts.work_type}`);
    if (facts.must_have) sections.push(`- Must have: ${facts.must_have}`);
  }

  // Handle preferences
  const preferences = role.preferences as Record<string, unknown> | undefined;
  if (preferences?.nice_to_have) {
    sections.push(`\nNICE TO HAVE: ${preferences.nice_to_have}`);
  }

  // Handle AI guidance
  const aiGuidance = role.ai_guidance as Record<string, unknown> | undefined;
  if (aiGuidance) {
    if (aiGuidance.strong_fit) {
      sections.push(`\nSTRONG FIT LOOKS LIKE: ${aiGuidance.strong_fit}`);
    }
    if (aiGuidance.disqualifiers) {
      sections.push(`\nDISQUALIFIERS: ${aiGuidance.disqualifiers}`);
    }
  }

  // Handle screening questions
  const screeningQuestions = role.screening_questions as string[] | undefined;
  if (Array.isArray(screeningQuestions) && screeningQuestions.length > 0) {
    sections.push('\nSCREENING QUESTIONS:');
    screeningQuestions.forEach((q: string) => sections.push(`- ${q}`));
  }

  // Fallback to legacy criteria
  const criteria = role.criteria as Record<string, unknown> | undefined;
  if (criteria && (!facts || Object.keys(facts).length === 0)) {
    sections.push('\nREQUIREMENTS:');
    if (criteria.min_experience_years !== undefined) {
      sections.push(`- Minimum ${criteria.min_experience_years} years experience`);
    }
    if (Array.isArray(criteria.required_skills) && criteria.required_skills.length > 0) {
      sections.push(`- Required skills: ${criteria.required_skills.join(', ')}`);
    }
    if (Array.isArray(criteria.locations) && criteria.locations.length > 0) {
      sections.push(`- Location: ${criteria.locations.join(' or ')}`);
    }
    if (Array.isArray(criteria.preferred_skills) && criteria.preferred_skills.length > 0) {
      sections.push(`- Preferred: ${criteria.preferred_skills.join(', ')}`);
    }
    if (criteria.education) {
      sections.push(`- Education: ${criteria.education}`);
    }
    if (Array.isArray(criteria.dealbreakers) && criteria.dealbreakers.length > 0) {
      sections.push(`- Dealbreakers: ${criteria.dealbreakers.join(', ')}`);
    }
  }

  return sections.join('\n');
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HELPER: Map recommendation to status
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function mapRecommendationToStatus(recommendation: string): string {
  switch ((recommendation || '').toUpperCase()) {
    case 'SHORTLIST': return 'shortlist';
    case 'CONSIDER': return 'talent_pool';
    case 'REJECT': return 'reject';
    default: return 'screened';
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HELPER: Parse and validate AI response
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function parseAIResponse(text: string): Record<string, unknown> | null {
  try {
    const cleaned = text
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// API ROUTE HANDLER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { candidateId, roleId, cvText } = body;

    // Validate roleId
    if (!roleId) {
      return NextResponse.json(
        { error: 'Missing roleId', code: 'MISSING_ROLE_ID' },
        { status: 400 }
      );
    }

    // Fetch role
    const { data: role, error: roleError } = await supabase
      .from('roles')
      .select('*')
      .eq('id', roleId)
      .single();

    if (roleError || !role) {
      return NextResponse.json(
        { error: 'Role not found', code: 'ROLE_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Get CV content
    let cvContent = cvText;
    let candidate: Record<string, unknown> | null = null;

    if (candidateId) {
      const { data: candidateData, error: candidateError } = await supabase
        .from('candidates')
        .select('*')
        .eq('id', candidateId)
        .single();

      if (candidateError || !candidateData) {
        return NextResponse.json(
          { error: 'Candidate not found', code: 'CANDIDATE_NOT_FOUND' },
          { status: 404 }
        );
      }

      candidate = candidateData;
      cvContent = candidateData.cv_text || cvText;
    }

    // Validate CV content
    if (!cvContent || typeof cvContent !== 'string' || cvContent.trim().length < 50) {
      return NextResponse.json(
        { error: 'Invalid or missing CV content', code: 'INVALID_CV' },
        { status: 400 }
      );
    }

    // Build role context
    const roleContext = buildRoleContext(role);

    // Build user prompt
    const userPrompt = `ROLE CONTEXT:
${roleContext}

CV TO EVALUATE:
${cvContent}

Evaluate this candidate against the role requirements. Respond with valid JSON only.`;

    // Call OpenAI
    let completion;
    try {
      completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        temperature: 0,
        max_tokens: 4000,
        messages: [
          { role: 'system', content: TALENT_SCOUT_PROMPT },
          { role: 'user', content: userPrompt }
        ]
      });
    } catch (openaiError) {
      console.error('OpenAI error:', openaiError);
      return NextResponse.json(
        { error: 'AI service unavailable', code: 'OPENAI_ERROR' },
        { status: 503 }
      );
    }

    const responseText = completion.choices[0]?.message?.content || '';

    if (!responseText) {
      return NextResponse.json(
        { error: 'Empty AI response', code: 'EMPTY_RESPONSE' },
        { status: 500 }
      );
    }

    // Parse response
    let assessment = parseAIResponse(responseText);

    // Retry once if parse fails
    if (!assessment) {
      try {
        const retryCompletion = await openai.chat.completions.create({
          model: 'gpt-4o',
          temperature: 0,
          max_tokens: 4000,
          messages: [
            { role: 'system', content: TALENT_SCOUT_PROMPT },
            { role: 'user', content: userPrompt },
            { role: 'assistant', content: responseText },
            { role: 'user', content: 'Your response was not valid JSON. Respond again with ONLY valid JSON, no markdown.' }
          ]
        });
        const retryText = retryCompletion.choices[0]?.message?.content || '';
        assessment = parseAIResponse(retryText);
      } catch {
        // Ignore retry error
      }
    }

    if (!assessment) {
      return NextResponse.json(
        { error: 'Failed to parse AI response', code: 'PARSE_ERROR', raw: responseText },
        { status: 500 }
      );
    }

    // Update candidate if provided
    if (candidateId && candidate) {
      const status = mapRecommendationToStatus(assessment.recommendation as string);

      const { error: updateError } = await supabase
        .from('candidates')
        .update({
          ai_score: assessment.overall_score,
          ai_recommendation: assessment.recommendation,
          ai_reasoning: (assessment.summary as Record<string, unknown>)?.fit_assessment || assessment.recommendation_reason,
          screening_result: assessment,
          screened_at: new Date().toISOString(),
          status: status,
          // Legacy fields
          score: assessment.overall_score,
          strengths: (assessment.summary as Record<string, unknown>)?.strengths || [],
          missing: (assessment.summary as Record<string, unknown>)?.weaknesses || []
        })
        .eq('id', candidateId);

      if (updateError) {
        console.error('Failed to update candidate:', updateError);
        return NextResponse.json({
          success: true,
          warning: 'Screening completed but database update failed',
          assessment,
          role: { id: role.id, title: role.title }
        });
      }
    }

    // Return success
    return NextResponse.json({
      success: true,
      assessment,
      candidate: candidate ? {
        id: candidate.id,
        name: candidate.name,
        email: candidate.email
      } : null,
      role: {
        id: role.id,
        title: role.title
      }
    });

  } catch (error) {
    console.error('Screening error:', error);
    return NextResponse.json(
      { error: 'Screening failed', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
