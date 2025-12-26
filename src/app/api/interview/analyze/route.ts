// /api/interview/analyze - Analyze completed voice interview
// Processes transcript, extracts evidence, scores responses, updates candidate

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

// Interview analyzer prompt
const INTERVIEW_ANALYZER_PROMPT = `You are an expert interview analyst for HireInbox, evaluating voice interview transcripts for South African candidates.

Your task is to analyze the interview transcript and provide a structured evaluation with evidence-based scoring.

EVALUATION CRITERIA:

1. COMMUNICATION (0-100)
   - Clarity of expression
   - Structured responses (STAR format when applicable)
   - Vocabulary and articulation
   - Listening and responding appropriately

2. EXPERIENCE DEPTH (0-100)
   - Specific examples provided
   - Metrics and outcomes mentioned
   - Relevance to role requirements
   - Progression and growth demonstrated

3. TECHNICAL/SKILL FIT (0-100)
   - Knowledge demonstrated
   - Problem-solving approach
   - Relevant expertise shown
   - Learning ability indicated

4. CULTURAL FIT (0-100)
   - Values alignment
   - Team orientation
   - Attitude and enthusiasm
   - Professional demeanor

5. RED FLAGS (-10 to 0 each)
   - Evasive answers
   - Inconsistencies
   - Negative attitude
   - Concerning gaps

OUTPUT FORMAT (JSON):
{
  "interview_summary": {
    "duration_minutes": <number>,
    "questions_answered": <number>,
    "overall_impression": "<2-3 sentence summary>"
  },

  "scores": {
    "communication": {
      "score": <0-100>,
      "evidence": ["<quote from transcript>", "<quote>"],
      "notes": "<brief explanation>"
    },
    "experience_depth": {
      "score": <0-100>,
      "evidence": ["<quote>", "<quote>"],
      "notes": "<brief explanation>"
    },
    "technical_fit": {
      "score": <0-100>,
      "evidence": ["<quote>", "<quote>"],
      "notes": "<brief explanation>"
    },
    "cultural_fit": {
      "score": <0-100>,
      "evidence": ["<quote>", "<quote>"],
      "notes": "<brief explanation>"
    }
  },

  "overall_score": <0-100 weighted average>,

  "recommendation": "<STRONG_YES|YES|MAYBE|NO>",
  "recommendation_reason": "<2-3 sentences explaining the recommendation>",

  "key_strengths": [
    {
      "strength": "<what they demonstrated>",
      "evidence": "<exact quote from interview>",
      "impact": "<why this matters for the role>"
    }
  ],

  "concerns": [
    {
      "concern": "<what was concerning>",
      "evidence": "<exact quote or observation>",
      "severity": "<LOW|MEDIUM|HIGH>",
      "mitigation": "<how to verify or address in next round>"
    }
  ],

  "red_flags": [
    {
      "flag": "<description>",
      "evidence": "<quote or observation>",
      "impact_on_score": <-5 to -15>
    }
  ],

  "claims_verified": [
    {
      "claim": "<what they claimed in CV>",
      "status": "<VERIFIED|PARTIALLY_VERIFIED|NOT_VERIFIED|INCONSISTENT>",
      "evidence": "<relevant quote>"
    }
  ],

  "follow_up_questions": [
    "<question for next interview round>"
  ],

  "hiring_manager_notes": "<executive summary for hiring manager, 3-4 sentences>"
}

SCORING GUIDELINES:
- 90-100: Exceptional - top 10% of candidates
- 80-89: Strong - clearly above average
- 70-79: Good - meets expectations
- 60-69: Acceptable - some concerns but worth considering
- Below 60: Below expectations - significant concerns

EVIDENCE RULES:
- Every score MUST have at least 1 direct quote as evidence
- Quotes must be EXACT from the transcript
- If no evidence exists, score lower and note "limited evidence"
- Red flags must have specific evidence

${SA_CONTEXT_PROMPT}`;

interface TranscriptItem {
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
}

export async function POST(request: Request) {
  const traceId = Date.now().toString(36);
  console.log(`[${traceId}][ANALYZE] Interview analysis request received`);

  try {
    const body = await request.json();
    const { sessionId, candidateId, transcript, duration, roleId } = body;

    if (!candidateId || !transcript) {
      return NextResponse.json(
        { error: 'candidateId and transcript are required' },
        { status: 400 }
      );
    }

    // Fetch candidate data for context
    const { data: candidate } = await supabase
      .from('candidates')
      .select('*')
      .eq('id', candidateId)
      .single();

    // Fetch role data if available
    let role = null;
    const targetRoleId = roleId || candidate?.role_id;
    if (targetRoleId) {
      const { data: roleData } = await supabase
        .from('roles')
        .select('*')
        .eq('id', targetRoleId)
        .single();
      role = roleData;
    }

    // Format transcript for analysis
    const formattedTranscript = formatTranscript(transcript);
    const transcriptText = formattedTranscript.text;
    const questionCount = formattedTranscript.questionCount;

    // Estimate duration if not provided
    const estimatedDuration = duration || Math.ceil(transcript.length / 2); // ~2 exchanges per minute

    // Build context
    const roleContext = role ? `
Role: ${role.title}
Requirements: ${JSON.stringify(role.facts || role.criteria || {})}
` : 'General assessment interview';

    const candidateContext = candidate ? `
Candidate: ${candidate.name}
CV Score: ${candidate.ai_score || 'N/A'}
Prior Assessment: ${candidate.ai_recommendation || 'N/A'}
` : 'Unknown candidate';

    // Analyze with AI
    const userPrompt = `Analyze this interview transcript:

${roleContext}

${candidateContext}

INTERVIEW TRANSCRIPT:
${transcriptText}

Interview Duration: approximately ${estimatedDuration} minutes
Questions Asked: ${questionCount}

Provide a comprehensive analysis with evidence-based scoring.
Return valid JSON only.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.3,
      max_tokens: 3000,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: INTERVIEW_ANALYZER_PROMPT },
        { role: 'user', content: userPrompt },
      ],
    });

    const responseText = completion.choices[0]?.message?.content || '{}';
    let analysis;

    try {
      analysis = JSON.parse(responseText);
    } catch {
      console.error(`[${traceId}] Failed to parse analysis`);
      return NextResponse.json(
        { error: 'Failed to analyze interview' },
        { status: 500 }
      );
    }

    // Validate and normalize scores
    analysis = normalizeAnalysis(analysis);

    // Update session in database (if table exists)
    if (sessionId) {
      const { error: sessionError } = await supabase
        .from('interview_sessions')
        .update({
          status: 'completed',
          transcript: transcript,
          analysis: analysis,
          duration_minutes: estimatedDuration,
          completed_at: new Date().toISOString(),
        })
        .eq('id', sessionId);

      if (sessionError) {
        console.warn(`[${traceId}] Could not update session:`, sessionError.message);
      }
    }

    // Update candidate record with interview results
    if (candidate) {
      const interviewScore = typeof analysis.overall_score === 'number' ? analysis.overall_score : 70;
      const candidateScore = typeof candidate.ai_score === 'number' ? candidate.ai_score : null;
      const combinedScore = candidateScore
        ? Math.round((candidateScore * 0.6) + (interviewScore * 0.4))
        : interviewScore;

      const { error: updateError } = await supabase
        .from('candidates')
        .update({
          interview_score: interviewScore,
          interview_analysis: analysis,
          interview_recommendation: analysis.recommendation,
          interviewed_at: new Date().toISOString(),
          // Update combined score
          ai_score: combinedScore,
          ai_recommendation: mapRecommendation(
            String(analysis.recommendation || ''),
            typeof analysis.overall_score === 'number' ? analysis.overall_score : 65
          ),
        })
        .eq('id', candidateId);

      if (updateError) {
        console.warn(`[${traceId}] Could not update candidate:`, updateError.message);
      }
    }

    console.log(`[${traceId}][ANALYZE] Analysis complete: ${analysis.recommendation} (${analysis.overall_score})`);

    return NextResponse.json({
      success: true,
      analysis: {
        summary: analysis.interview_summary,
        scores: analysis.scores,
        overallScore: analysis.overall_score,
        recommendation: analysis.recommendation,
        recommendationReason: analysis.recommendation_reason,
        keyStrengths: analysis.key_strengths || [],
        concerns: analysis.concerns || [],
        redFlags: analysis.red_flags || [],
        claimsVerified: analysis.claims_verified || [],
        followUpQuestions: analysis.follow_up_questions || [],
        hiringManagerNotes: analysis.hiring_manager_notes,
      },
      transcript: formattedTranscript.items,
      questionCount,
      duration: estimatedDuration,
    });

  } catch (error) {
    console.error(`[${traceId}][ANALYZE] Error:`, error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Analysis failed' },
      { status: 500 }
    );
  }
}

function formatTranscript(transcript: TranscriptItem[]): {
  text: string;
  items: TranscriptItem[];
  questionCount: number;
} {
  if (!Array.isArray(transcript) || transcript.length === 0) {
    return { text: 'No transcript available', items: [], questionCount: 0 };
  }

  let questionCount = 0;
  const lines: string[] = [];

  for (const item of transcript) {
    const speaker = item.role === 'assistant' ? 'INTERVIEWER' : 'CANDIDATE';
    lines.push(`${speaker}: ${item.text}`);

    // Count questions (rough estimate)
    if (item.role === 'assistant' && item.text.includes('?')) {
      questionCount++;
    }
  }

  return {
    text: lines.join('\n\n'),
    items: transcript,
    questionCount,
  };
}

function normalizeAnalysis(analysis: Record<string, unknown>): Record<string, unknown> {
  // Ensure scores are within bounds
  const scores = analysis.scores as Record<string, { score: number }> | undefined;
  if (scores) {
    for (const key of Object.keys(scores)) {
      if (scores[key]?.score !== undefined) {
        scores[key].score = Math.max(0, Math.min(100, scores[key].score));
      }
    }
  }

  // Ensure overall score is reasonable
  if (typeof analysis.overall_score === 'number') {
    analysis.overall_score = Math.max(0, Math.min(100, analysis.overall_score));
  } else {
    // Calculate from component scores
    if (scores) {
      const scoreValues = Object.values(scores)
        .map(s => s?.score)
        .filter((s): s is number => typeof s === 'number');
      if (scoreValues.length > 0) {
        analysis.overall_score = Math.round(
          scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length
        );
      } else {
        analysis.overall_score = 65;
      }
    } else {
      analysis.overall_score = 65;
    }
  }

  // Ensure recommendation exists
  if (!analysis.recommendation) {
    const score = analysis.overall_score as number;
    if (score >= 85) analysis.recommendation = 'STRONG_YES';
    else if (score >= 70) analysis.recommendation = 'YES';
    else if (score >= 55) analysis.recommendation = 'MAYBE';
    else analysis.recommendation = 'NO';
  }

  // Ensure arrays exist
  if (!Array.isArray(analysis.key_strengths)) analysis.key_strengths = [];
  if (!Array.isArray(analysis.concerns)) analysis.concerns = [];
  if (!Array.isArray(analysis.red_flags)) analysis.red_flags = [];
  if (!Array.isArray(analysis.claims_verified)) analysis.claims_verified = [];
  if (!Array.isArray(analysis.follow_up_questions)) analysis.follow_up_questions = [];

  return analysis;
}

function mapRecommendation(interviewRec: string, score: number): string {
  // Map interview recommendation to candidate status recommendation
  switch (String(interviewRec).toUpperCase()) {
    case 'STRONG_YES':
      return 'SHORTLIST';
    case 'YES':
      return score >= 75 ? 'SHORTLIST' : 'CONSIDER';
    case 'MAYBE':
      return 'CONSIDER';
    case 'NO':
      return 'REJECT';
    default:
      return score >= 70 ? 'CONSIDER' : 'REJECT';
  }
}

// GET endpoint to retrieve interview analysis
export async function GET(request: Request) {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get('sessionId');
  const candidateId = url.searchParams.get('candidateId');

  if (!sessionId && !candidateId) {
    return NextResponse.json(
      { error: 'sessionId or candidateId required' },
      { status: 400 }
    );
  }

  try {
    if (sessionId) {
      const { data: session, error } = await supabase
        .from('interview_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error || !session) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }

      return NextResponse.json({ success: true, session });
    }

    if (candidateId) {
      const { data: candidate, error } = await supabase
        .from('candidates')
        .select('id, name, interview_score, interview_analysis, interview_recommendation, interviewed_at')
        .eq('id', candidateId)
        .single();

      if (error || !candidate) {
        return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        interview: {
          candidateId: candidate.id,
          name: candidate.name,
          score: candidate.interview_score,
          recommendation: candidate.interview_recommendation,
          analysis: candidate.interview_analysis,
          interviewedAt: candidate.interviewed_at,
        },
      });
    }

  } catch (error) {
    console.error('[ANALYZE] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve interview data' },
      { status: 500 }
    );
  }
}
