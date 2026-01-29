import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { Errors, generateTraceId } from '@/lib/api-error';

// ============================================
// TALENT POOL OPT-IN API
// Simple. Deliberate. Transparent.
// ============================================

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

interface OptInRequest {
  candidateId: string;
  visibility: 'hidden' | 'anonymized' | 'visible';
  intent: 'actively_looking' | 'open' | 'not_looking';
  intentTimeframe?: string;
  workArrangement?: 'remote' | 'hybrid' | 'office' | 'flexible';
  skills: string[];
  experienceHighlights: string[];
  preferredIndustries?: string[];
  preferredLocations?: string[];
  salaryExpectationMin?: number;
  salaryExpectationMax?: number;
}

export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimited = withRateLimit(request, 'talent-pool-opt-in', RATE_LIMITS.standard);
  if (rateLimited) return rateLimited;

  const traceId = generateTraceId();

  try {
    const body: OptInRequest = await request.json();

    const {
      candidateId,
      visibility,
      intent,
      intentTimeframe,
      skills,
      experienceHighlights,
      preferredIndustries,
      preferredLocations,
      salaryExpectationMin,
      salaryExpectationMax
    } = body;

    // Validate required fields
    if (!candidateId || !visibility || !intent) {
      return Errors.validation('Missing required fields: candidateId, visibility, intent').toResponse();
    }

    // Calculate profile completeness
    let completeness = 20; // Base for CV
    if (skills && skills.length > 0) completeness += 20;
    if (experienceHighlights && experienceHighlights.length > 0) completeness += 15;
    if (preferredIndustries && preferredIndustries.length > 0) completeness += 10;
    if (preferredLocations && preferredLocations.length > 0) completeness += 10;
    if (salaryExpectationMin || salaryExpectationMax) completeness += 10;
    if (intentTimeframe) completeness += 5;
    // Video and interview add more (handled elsewhere)

    // Update candidate record
    const { data, error } = await supabase
      .from('candidates')
      .update({
        talent_pool_opted_in: true,
        talent_pool_opted_in_at: new Date().toISOString(),
        visibility_level: visibility,
        candidate_intent: intent,
        intent_timeframe: intentTimeframe || null,
        skills: skills || [],
        experience_highlights: experienceHighlights || [],
        preferred_industries: preferredIndustries || null,
        preferred_locations: preferredLocations || null,
        salary_expectation_min: salaryExpectationMin || null,
        salary_expectation_max: salaryExpectationMax || null,
        profile_completeness: Math.min(completeness, 100)
      })
      .eq('id', candidateId)
      .select()
      .single();

    if (error) {
      console.error(`[${traceId}] Talent pool opt-in error:`, error);
      return Errors.database('Failed to save opt-in preferences', undefined, traceId).toResponse();
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully joined the Talent Pool',
      profile: {
        visibility,
        intent,
        profileCompleteness: Math.min(completeness, 100)
      }
    });

  } catch (error) {
    console.error(`[${traceId}] Talent pool opt-in error:`, error);
    return Errors.internal('Failed to save opt-in preferences', traceId).toResponse();
  }
}

// Get opt-in status for a candidate
export async function GET(request: NextRequest) {
  // Apply rate limiting
  const rateLimited = withRateLimit(request, 'talent-pool-opt-in-get', RATE_LIMITS.standard);
  if (rateLimited) return rateLimited;

  const traceId = generateTraceId();

  try {
    const { searchParams } = new URL(request.url);
    const candidateId = searchParams.get('candidateId');

    if (!candidateId) {
      return Errors.validation('candidateId is required').toResponse();
    }

    const { data, error } = await supabase
      .from('candidates')
      .select(`
        talent_pool_opted_in,
        talent_pool_opted_in_at,
        visibility_level,
        candidate_intent,
        intent_timeframe,
        skills,
        experience_highlights,
        preferred_industries,
        preferred_locations,
        salary_expectation_min,
        salary_expectation_max,
        profile_completeness,
        has_video_intro,
        has_ai_interview
      `)
      .eq('id', candidateId)
      .single();

    if (error) {
      return Errors.notFound('Candidate').toResponse();
    }

    return NextResponse.json({ profile: data });

  } catch (error) {
    console.error(`[${traceId}] Get opt-in status error:`, error);
    return Errors.internal('Failed to fetch opt-in status', traceId).toResponse();
  }
}
