// /api/interview/start - Initialize AI Voice Interview Session
// Creates interview session, loads candidate data, generates personalized questions

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { SA_CONTEXT_PROMPT } from '@/lib/sa-context';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Interview question generator prompt
const INTERVIEW_DESIGNER_PROMPT = `You are an expert interview designer for HireInbox, creating personalized interview questions for South African candidates.

Your task is to analyze the candidate's CV and role requirements, then generate a structured interview plan.

OUTPUT FORMAT (JSON):
{
  "interview_summary": {
    "candidate_name": "<name>",
    "role_title": "<role>",
    "estimated_duration_minutes": <10-15>,
    "difficulty_level": "<standard|challenging|senior>"
  },
  "cv_highlights": {
    "key_strengths": ["<strength 1>", "<strength 2>"],
    "potential_concerns": ["<concern 1>", "<concern 2>"],
    "claims_to_verify": ["<claim 1>", "<claim 2>"]
  },
  "focus_areas": ["<area 1>", "<area 2>", "<area 3>"],
  "questions": [
    {
      "category": "<intro|background|behavioral|technical|situational|closing>",
      "question": "<the question to ask>",
      "purpose": "<what this question reveals>",
      "follow_up_if_vague": "<follow-up question if answer lacks specifics>",
      "green_flags": ["<what a good answer looks like>"],
      "red_flags": ["<what a concerning answer looks like>"]
    }
  ],
  "opening_script": "<brief friendly greeting and interview explanation>",
  "closing_script": "<thank you and next steps explanation>"
}

RULES:
1. Generate 6-10 questions (10-15 minute interview)
2. Start with easy warmup questions, build to harder ones
3. Include at least 2 behavioral questions (STAR format)
4. Always include claims verification questions for CV highlights
5. Tailor questions to the specific role and seniority
6. Include SA-specific context where relevant

${SA_CONTEXT_PROMPT}`;

export async function POST(request: Request) {
  const traceId = Date.now().toString(36);
  console.log(`[${traceId}][INTERVIEW] Start request received`);

  try {
    const body = await request.json();
    const { candidateId, roleId } = body;

    if (!candidateId) {
      return NextResponse.json(
        { error: 'candidateId is required' },
        { status: 400 }
      );
    }

    // Fetch candidate data
    const { data: candidate, error: candidateError } = await supabase
      .from('candidates')
      .select('*')
      .eq('id', candidateId)
      .single();

    if (candidateError || !candidate) {
      console.error(`[${traceId}] Candidate not found:`, candidateError);
      return NextResponse.json(
        { error: 'Candidate not found' },
        { status: 404 }
      );
    }

    // Fetch role data (use provided roleId or candidate's role)
    const targetRoleId = roleId || candidate.role_id;
    let role = null;

    if (targetRoleId) {
      const { data: roleData } = await supabase
        .from('roles')
        .select('*')
        .eq('id', targetRoleId)
        .single();
      role = roleData;
    }

    // Build context for question generation
    const cvText = candidate.cv_text || '';
    const screeningResult = candidate.screening_result || {};

    // Generate interview plan using AI
    const roleContext = role ? buildRoleContext(role) : 'General interview - no specific role requirements';
    const screeningContext = buildScreeningContext(screeningResult);

    const userPrompt = `Create an interview plan for this candidate:

CANDIDATE NAME: ${candidate.name || 'Unknown'}
CANDIDATE EMAIL: ${candidate.email || 'Unknown'}

ROLE: ${role?.title || 'General Assessment'}
${roleContext}

CV SCREENING RESULTS:
${screeningContext}

CV TEXT:
${cvText.substring(0, 3000)}

Generate a personalized interview plan with questions that:
1. Verify the claims in their CV
2. Explore the strengths identified in screening
3. Probe the concerns/weaknesses
4. Assess fit for the specific role

Return valid JSON only.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.7,
      max_tokens: 2500,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: INTERVIEW_DESIGNER_PROMPT },
        { role: 'user', content: userPrompt },
      ],
    });

    const responseText = completion.choices[0]?.message?.content || '{}';
    let interviewPlan;

    try {
      interviewPlan = JSON.parse(responseText);
    } catch {
      console.error(`[${traceId}] Failed to parse interview plan`);
      interviewPlan = getDefaultInterviewPlan(candidate.name, role?.title);
    }

    // Create interview session in database
    const sessionId = `interview_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const { error: sessionError } = await supabase
      .from('interview_sessions')
      .insert({
        id: sessionId,
        candidate_id: candidateId,
        role_id: targetRoleId,
        status: 'created',
        interview_plan: interviewPlan,
        created_at: new Date().toISOString(),
      });

    // Note: If table doesn't exist, we continue anyway - session stored client-side
    if (sessionError) {
      console.warn(`[${traceId}] Could not save session to DB (table may not exist):`, sessionError.message);
    }

    // Build AI instructions for the voice interview
    const voiceInstructions = buildVoiceInstructions(
      candidate.name || 'Candidate',
      role?.title || 'the position',
      interviewPlan,
      screeningResult
    );

    console.log(`[${traceId}][INTERVIEW] Session created: ${sessionId}`);

    return NextResponse.json({
      success: true,
      sessionId,
      candidate: {
        id: candidate.id,
        name: candidate.name,
        email: candidate.email,
        currentTitle: screeningResult.current_title || null,
        yearsExperience: screeningResult.years_experience || null,
        aiScore: candidate.ai_score,
        aiRecommendation: candidate.ai_recommendation,
      },
      role: role ? {
        id: role.id,
        title: role.title,
      } : null,
      interviewPlan: {
        summary: interviewPlan.interview_summary,
        focusAreas: interviewPlan.focus_areas || [],
        questionCount: interviewPlan.questions?.length || 8,
        openingScript: interviewPlan.opening_script,
        closingScript: interviewPlan.closing_script,
      },
      voiceInstructions,
      apiKeyPreview: process.env.OPENAI_API_KEY ?
        `${process.env.OPENAI_API_KEY.substring(0, 8)}...` : null,
    });

  } catch (error) {
    console.error(`[${traceId}][INTERVIEW] Error:`, error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to start interview' },
      { status: 500 }
    );
  }
}

function buildRoleContext(role: Record<string, unknown>): string {
  const sections: string[] = [];

  const context = role.context as Record<string, unknown> | undefined;
  if (context) {
    if (context.seniority) sections.push(`Seniority: ${context.seniority}`);
    if (context.employment_type) sections.push(`Type: ${context.employment_type}`);
  }

  const facts = role.facts as Record<string, unknown> | undefined;
  if (facts) {
    if (facts.min_experience_years) sections.push(`Minimum Experience: ${facts.min_experience_years} years`);
    if (Array.isArray(facts.required_skills)) sections.push(`Required Skills: ${facts.required_skills.join(', ')}`);
    if (Array.isArray(facts.qualifications)) sections.push(`Qualifications: ${facts.qualifications.join(', ')}`);
  }

  return sections.join('\n');
}

function buildScreeningContext(screening: Record<string, unknown>): string {
  const sections: string[] = [];

  if (screening.overall_score) sections.push(`AI Score: ${screening.overall_score}/100`);
  if (screening.recommendation) sections.push(`Recommendation: ${screening.recommendation}`);
  if (screening.recommendation_reason) sections.push(`Reason: ${screening.recommendation_reason}`);

  const summary = screening.summary as Record<string, unknown> | undefined;
  if (summary) {
    const strengths = summary.strengths as Array<{ label: string }> | undefined;
    if (strengths?.length) {
      sections.push(`Strengths: ${strengths.map(s => s.label).join(', ')}`);
    }
    const weaknesses = summary.weaknesses as Array<{ label: string }> | undefined;
    if (weaknesses?.length) {
      sections.push(`Concerns: ${weaknesses.map(w => w.label).join(', ')}`);
    }
  }

  const interviewFocus = screening.interview_focus as string[] | undefined;
  if (interviewFocus?.length) {
    sections.push(`Interview Focus: ${interviewFocus.join('; ')}`);
  }

  return sections.join('\n') || 'No prior screening data available';
}

function buildVoiceInstructions(
  candidateName: string,
  roleTitle: string,
  plan: Record<string, unknown>,
  screening: Record<string, unknown>
): string {
  const summary = plan.interview_summary as Record<string, unknown> | undefined;
  const questions = plan.questions as Array<{
    category: string;
    question: string;
    follow_up_if_vague?: string;
  }> | undefined;
  const cvHighlights = plan.cv_highlights as Record<string, unknown> | undefined;

  const focusAreas = (plan.focus_areas as string[]) || [];
  const openingScript = (plan.opening_script as string) || `Hello ${candidateName}, welcome to your interview for the ${roleTitle} position.`;

  // Build question guide
  let questionGuide = '';
  if (questions?.length) {
    questionGuide = questions.map((q, i) =>
      `${i + 1}. [${q.category.toUpperCase()}] ${q.question}${q.follow_up_if_vague ? ` (If vague: ${q.follow_up_if_vague})` : ''}`
    ).join('\n');
  }

  return `You are a professional AI interviewer for HireInbox, conducting a voice interview with ${candidateName} for the ${roleTitle} position.

INTERVIEW CONTEXT:
- Candidate: ${candidateName}
- Role: ${roleTitle}
- Difficulty: ${summary?.difficulty_level || 'standard'}
- Duration: ${summary?.estimated_duration_minutes || 12} minutes
- Focus Areas: ${focusAreas.join(', ') || 'general assessment'}

CV HIGHLIGHTS TO VERIFY:
${cvHighlights?.claims_to_verify ? (cvHighlights.claims_to_verify as string[]).map(c => `- ${c}`).join('\n') : '- Review their key experiences'}

POTENTIAL CONCERNS TO PROBE:
${cvHighlights?.potential_concerns ? (cvHighlights.potential_concerns as string[]).map(c => `- ${c}`).join('\n') : '- Look for gaps or inconsistencies'}

OPENING:
${openingScript}

QUESTION GUIDE:
${questionGuide || 'Ask about their background, experience, and fit for the role.'}

INTERVIEW RULES:
1. Keep responses SHORT (2-3 sentences) - this is voice conversation
2. Ask ONE question at a time
3. Listen carefully for specific examples and metrics
4. If answer is vague: "Can you give me a specific example with numbers or outcomes?"
5. Acknowledge good answers before moving on: "Great example, thank you."
6. Take mental notes of red flags and green flags
7. Be warm but professional - this is their first impression of the company
8. Handle interruptions gracefully
9. If they seem nervous, be encouraging

ENDING THE INTERVIEW:
After 8-10 questions OR when you have enough information:
- Ask if they have any questions for you
- Thank them for their time
- Explain the hiring team will review and be in touch
- End with: "Best of luck, ${candidateName}!"

SOUTH AFRICAN CONTEXT:
- Respect SA qualifications: CA(SA), Pr.Eng, etc.
- Know local companies and their cultures
- Be aware of load shedding realities
- Understand the diverse background of SA candidates

Remember: You're assessing fit and gathering evidence. Be thorough but efficient.`;
}

function getDefaultInterviewPlan(name?: string, roleTitle?: string): Record<string, unknown> {
  return {
    interview_summary: {
      candidate_name: name || 'Candidate',
      role_title: roleTitle || 'General Assessment',
      estimated_duration_minutes: 12,
      difficulty_level: 'standard',
    },
    cv_highlights: {
      key_strengths: [],
      potential_concerns: [],
      claims_to_verify: [],
    },
    focus_areas: ['background', 'experience', 'skills'],
    questions: [
      {
        category: 'intro',
        question: 'Tell me about yourself and your current role.',
        purpose: 'Warm up and understand background',
        follow_up_if_vague: 'What are your main responsibilities day-to-day?',
      },
      {
        category: 'background',
        question: 'What drew you to this position?',
        purpose: 'Understand motivation and research',
      },
      {
        category: 'behavioral',
        question: 'Tell me about a challenging project you completed recently.',
        purpose: 'Assess problem-solving and achievement',
        follow_up_if_vague: 'What was the specific outcome or result?',
      },
      {
        category: 'behavioral',
        question: 'Describe a time you had to work with a difficult colleague or client.',
        purpose: 'Assess interpersonal skills',
      },
      {
        category: 'technical',
        question: 'What technical skills or tools are you most proficient in?',
        purpose: 'Assess core competencies',
      },
      {
        category: 'situational',
        question: 'How do you handle tight deadlines and competing priorities?',
        purpose: 'Assess time management',
      },
      {
        category: 'closing',
        question: 'Where do you see yourself in 3-5 years?',
        purpose: 'Understand career goals and retention risk',
      },
      {
        category: 'closing',
        question: 'Do you have any questions for me about the role or company?',
        purpose: 'Gauge interest and research effort',
      },
    ],
    opening_script: `Hello ${name || 'there'}, thank you for joining this interview. I'm the AI assistant helping with initial screening for the ${roleTitle || 'position'}. This will take about 10-12 minutes. I'll ask you some questions about your background and experience. Feel free to speak naturally - I'm here to have a conversation. Ready to begin?`,
    closing_script: `Thank you so much for your time today, ${name || 'it was great talking with you'}. The hiring team will review our conversation and be in touch about next steps. Best of luck!`,
  };
}
