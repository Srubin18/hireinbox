import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { Errors, generateTraceId } from '@/lib/api-error';

// ============================================
// AI TALENT POOL MATCHING
//
// Core Principle: AI as Translator, Not Inventor
// - Extract factual signals from profiles
// - Match against role requirements
// - Provide evidence for every recommendation
// - Never fabricate or embellish
// ============================================

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || ''
});

interface MatchReason {
  reason: string;
  source: 'cv' | 'video' | 'interview' | 'skills';
  evidence: string;
}

interface CandidateMatch {
  candidateId: string;
  matchScore: number;
  confidence: 'high' | 'medium' | 'low';
  matchReasons: MatchReason[];
}

// The matching prompt - transparent, evidence-based
const MATCHING_PROMPT = `You are an AI talent matcher for HireInbox, a South African recruitment platform.

Your job is to match candidates to roles with TRANSPARENT, EVIDENCE-BASED reasoning.

CORE PRINCIPLES:
1. AI as Translator - Extract factual signals, never invent
2. Evidence Required - Every match reason needs a source
3. Confidence Levels:
   - HIGH: CV + Video + Interview data available
   - MEDIUM: CV + one additional signal
   - LOW: CV only
4. South African Context - Understand CA(SA), BCom, local companies

ROLE REQUIREMENTS:
{requirements}

CANDIDATE PROFILES:
{candidates}

For each candidate, provide:
1. match_score (0-100): How well they fit the requirements
2. confidence: high/medium/low based on available signals
3. match_reasons: Array of reasons with:
   - reason: What matches (e.g., "5 years React experience")
   - source: Where this came from (cv/video/interview/skills)
   - evidence: Specific quote or reference (e.g., "CV Work Experience section")

SCORING GUIDELINES:
- 85-100: Excellent match, meets or exceeds most requirements
- 70-84: Good match, meets core requirements
- 55-69: Potential match, transferable skills
- Below 55: Weak match, significant gaps

HONESTY RULES:
- If a requirement is NOT evidenced in the profile, don't match on it
- If experience is unclear, say "Experience level unclear from available data"
- Never assume skills not explicitly stated
- Prefer specific quotes over general statements

Respond with a JSON array of matches:
[
  {
    "candidateId": "string",
    "matchScore": number,
    "confidence": "high" | "medium" | "low",
    "matchReasons": [
      {
        "reason": "string",
        "source": "cv" | "video" | "interview" | "skills",
        "evidence": "string"
      }
    ]
  }
]`;

export async function POST(request: NextRequest) {
  // Apply rate limiting (AI endpoint)
  const rateLimited = withRateLimit(request, 'talent-pool-match', RATE_LIMITS.ai);
  if (rateLimited) return rateLimited;

  const traceId = generateTraceId();

  try {
    const { roleId, requirements } = await request.json();

    if (!roleId || !requirements) {
      return Errors.validation('roleId and requirements are required').toResponse();
    }

    // Get candidates opted into talent pool
    const { data: candidates, error: candidatesError } = await supabase
      .from('candidates')
      .select(`
        id,
        name,
        email,
        visibility_level,
        candidate_intent,
        skills,
        experience_highlights,
        profile_completeness,
        has_video_intro,
        has_ai_interview,
        preferred_industries,
        preferred_locations
      `)
      .eq('talent_pool_opted_in', true)
      .in('visibility_level', ['anonymized', 'visible'])
      .in('candidate_intent', ['actively_looking', 'open']);

    if (candidatesError) {
      console.error(`[${traceId}] Error fetching candidates:`, candidatesError);
      return Errors.database('Failed to fetch candidates', undefined, traceId).toResponse();
    }

    if (!candidates || candidates.length === 0) {
      return NextResponse.json({
        matches: [],
        message: 'No candidates in the talent pool match your criteria'
      });
    }

    // Format candidates for the AI
    const candidateProfiles = candidates.map(c => ({
      id: c.id,
      name: c.visibility_level === 'visible' ? c.name : `Candidate ${c.id.slice(0, 8)}`,
      skills: c.skills || [],
      highlights: c.experience_highlights || [],
      hasVideo: c.has_video_intro,
      hasInterview: c.has_ai_interview,
      intent: c.candidate_intent,
      completeness: c.profile_completeness
    }));

    // Call Claude for matching
    const prompt = MATCHING_PROMPT
      .replace('{requirements}', JSON.stringify(requirements, null, 2))
      .replace('{candidates}', JSON.stringify(candidateProfiles, null, 2));

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    // Extract the text content
    const textContent = response.content.find(c => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from AI');
    }

    // Parse the JSON response
    let matches: CandidateMatch[];
    try {
      // Find JSON array in the response
      const jsonMatch = textContent.text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found in response');
      }
      matches = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('Failed to parse AI response:', textContent.text);
      throw new Error('Failed to parse matching results');
    }

    // Calculate confidence based on available signals
    const enrichedMatches = matches.map(match => {
      const candidate = candidates.find(c => c.id === match.candidateId);
      let confidence: 'high' | 'medium' | 'low' = 'low';

      if (candidate) {
        const hasVideo = candidate.has_video_intro;
        const hasInterview = candidate.has_ai_interview;

        if (hasVideo && hasInterview) {
          confidence = 'high';
        } else if (hasVideo || hasInterview) {
          confidence = 'medium';
        }
      }

      return {
        ...match,
        confidence
      };
    });

    // Sort by match score descending
    enrichedMatches.sort((a, b) => b.matchScore - a.matchScore);

    // Save matches to database
    for (const match of enrichedMatches) {
      await supabase
        .from('talent_pool_matches')
        .upsert({
          candidate_id: match.candidateId,
          role_id: roleId,
          match_score: match.matchScore,
          confidence_level: match.confidence,
          match_reasons: match.matchReasons,
          created_at: new Date().toISOString()
        }, {
          onConflict: 'candidate_id,role_id'
        });
    }

    return NextResponse.json({
      matches: enrichedMatches,
      totalCandidates: candidates.length,
      matchedCandidates: enrichedMatches.filter(m => m.matchScore >= 55).length
    });

  } catch (error) {
    console.error(`[${traceId}] Talent pool matching error:`, error);
    // SECURITY: Do not expose internal error details to client
    const isAIError = error instanceof Error &&
      (error.message.includes('Anthropic') || error.message.includes('API'));
    const userMessage = isAIError
      ? 'AI matching service temporarily unavailable. Please try again.'
      : 'Failed to generate matches. Please try again.';
    return Errors.internal(userMessage, traceId).toResponse();
  }
}

// Get existing matches for a role
export async function GET(request: NextRequest) {
  // Apply rate limiting
  const rateLimited = withRateLimit(request, 'talent-pool-match-get', RATE_LIMITS.standard);
  if (rateLimited) return rateLimited;

  const traceId = generateTraceId();

  try {
    const { searchParams } = new URL(request.url);
    const roleId = searchParams.get('roleId');

    if (!roleId) {
      return Errors.validation('roleId is required').toResponse();
    }

    const { data: matches, error } = await supabase
      .from('talent_pool_matches')
      .select(`
        id,
        match_score,
        confidence_level,
        match_reasons,
        created_at,
        viewed_by_employer,
        employer_action,
        candidate:candidates (
          id,
          name,
          visibility_level,
          skills,
          experience_highlights,
          candidate_intent,
          has_video_intro,
          has_ai_interview,
          profile_completeness
        )
      `)
      .eq('role_id', roleId)
      .order('match_score', { ascending: false });

    if (error) {
      console.error(`[${traceId}] Error fetching matches:`, error);
      return Errors.database('Failed to fetch matches', undefined, traceId).toResponse();
    }

    return NextResponse.json({ matches });

  } catch (error) {
    console.error(`[${traceId}] Get matches error:`, error);
    return Errors.internal('Failed to fetch matches', traceId).toResponse();
  }
}
