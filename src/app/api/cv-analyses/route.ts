// app/api/cv-analyses/route.ts
// API for saving and fetching CV analysis results
// Supports both authenticated and anonymous users

import { NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase';
import { Errors, generateTraceId } from '@/lib/api-error';

const IS_DEV = process.env.NODE_ENV !== 'production';

// ============================================
// POST: Save CV analysis results
// ============================================
export async function POST(request: Request) {
  const traceId = generateTraceId();
  if (IS_DEV) console.log(`[${traceId}][CV-ANALYSES] Save request received`);

  try {
    const body = await request.json();
    const {
      user_id,
      email,
      cv_filename,
      candidate_name,
      current_title,
      years_experience,
      score,
      strengths,
      improvements,
      ats_score,
      ats_issues,
      summary,
      career_insights,
      sa_context_highlights,
    } = body;

    // Validate required fields
    if (score === undefined || score === null) {
      return Errors.validation('Missing required field: score').toResponse();
    }

    const supabase = getSupabaseServiceClient();

    // Insert the CV analysis record
    const { data, error } = await supabase
      .from('cv_analyses')
      .insert({
        user_id: user_id || null,
        email: email || null,
        cv_filename: cv_filename || null,
        candidate_name: candidate_name || null,
        current_title: current_title || null,
        years_experience: years_experience || null,
        score: score,
        strengths: strengths || [],
        improvements: improvements || [],
        ats_score: ats_score || null,
        ats_issues: ats_issues || [],
        summary: summary || null,
        career_insights: career_insights || null,
        sa_context_highlights: sa_context_highlights || [],
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error(`[${traceId}][CV-ANALYSES] Supabase error:`, error);
      return Errors.database('Failed to save CV analysis', error.message, traceId).toResponse();
    }

    if (IS_DEV) console.log(`[${traceId}][CV-ANALYSES] Saved analysis with ID: ${data.id}`);

    return NextResponse.json({
      success: true,
      analysis_id: data.id,
      traceId,
    });

  } catch (error) {
    console.error(`[${traceId}][CV-ANALYSES] Error:`, error);
    return Errors.internal('Failed to save CV analysis', traceId).toResponse();
  }
}

// ============================================
// GET: Fetch CV analyses for a user
// ============================================
export async function GET(request: Request) {
  const traceId = generateTraceId();
  if (IS_DEV) console.log(`[${traceId}][CV-ANALYSES] Fetch request received`);

  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');
    const email = searchParams.get('email');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Must have either user_id or email
    if (!user_id && !email) {
      return Errors.validation('Must provide user_id or email to fetch analyses').toResponse();
    }

    const supabase = getSupabaseServiceClient();

    // Build query
    let query = supabase
      .from('cv_analyses')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (user_id) {
      query = query.eq('user_id', user_id);
    } else if (email) {
      query = query.eq('email', email);
    }

    const { data, error } = await query;

    if (error) {
      console.error(`[${traceId}][CV-ANALYSES] Supabase error:`, error);
      return Errors.database('Failed to fetch CV analyses', error.message, traceId).toResponse();
    }

    if (IS_DEV) console.log(`[${traceId}][CV-ANALYSES] Found ${data?.length || 0} analyses`);

    return NextResponse.json({
      success: true,
      analyses: data || [],
      count: data?.length || 0,
      traceId,
    });

  } catch (error) {
    console.error(`[${traceId}][CV-ANALYSES] Error:`, error);
    return Errors.internal('Failed to fetch CV analyses', traceId).toResponse();
  }
}
