// ============================================
// TALENT POOL JOIN API
// Save candidates who join the talent pool directly
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { Errors, generateTraceId } from '@/lib/api-error';

interface JoinRequest {
  fullName: string;
  email: string;
  phone?: string;
  location?: string;
  jobTitle?: string;
  yearsExperience?: string;
  openToRemote?: boolean;
  availableFrom?: string;
  salaryExpectation?: string;
  linkedIn?: string;
  wantFreeScan?: boolean;
  // CV file info (uploaded separately or as base64)
  cvFileName?: string;
  cvFileUrl?: string;
  cvFileSize?: number;
}

export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimited = withRateLimit(request, 'talent-pool-join', RATE_LIMITS.standard);
  if (rateLimited) return rateLimited;

  const traceId = generateTraceId();

  try {
    const body: JoinRequest = await request.json();

    const {
      fullName,
      email,
      phone,
      location,
      jobTitle,
      yearsExperience,
      openToRemote = true,
      availableFrom = 'immediately',
      salaryExpectation,
      linkedIn,
      wantFreeScan = true,
      cvFileName,
      cvFileUrl,
      cvFileSize
    } = body;

    // Validate required fields
    if (!fullName || !email) {
      return Errors.validation('Full name and email are required').toResponse();
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return Errors.validation('Invalid email format').toResponse();
    }

    const supabase = getSupabaseServiceClient();

    // Check if email already exists
    const { data: existing } = await supabase
      .from('talent_pool_candidates')
      .select('id, email')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        {
          error: 'This email is already registered in the talent pool',
          existingId: existing.id
        },
        { status: 409 }
      );
    }

    // Calculate profile completeness
    let completeness = 20; // Base for having a CV
    if (phone) completeness += 10;
    if (location) completeness += 10;
    if (jobTitle) completeness += 15;
    if (yearsExperience) completeness += 10;
    if (salaryExpectation) completeness += 10;
    if (linkedIn) completeness += 10;
    if (cvFileUrl) completeness += 15;

    // Insert new candidate
    const { data, error } = await supabase
      .from('talent_pool_candidates')
      .insert({
        full_name: fullName,
        email: email.toLowerCase(),
        phone: phone || null,
        location: location || null,
        job_title: jobTitle || null,
        years_experience: yearsExperience || null,
        open_to_remote: openToRemote,
        available_from: availableFrom,
        salary_expectation: salaryExpectation || null,
        linkedin_url: linkedIn || null,
        wants_free_scan: wantFreeScan,
        cv_file_name: cvFileName || null,
        cv_file_url: cvFileUrl || null,
        cv_file_size: cvFileSize || null,
        profile_completeness: Math.min(completeness, 100),
        visibility_level: 'visible',
        intent: availableFrom === 'not-looking' ? 'not_looking' :
                availableFrom === 'immediately' ? 'actively_looking' : 'open'
      })
      .select()
      .single();

    if (error) {
      console.error(`[${traceId}][TalentPool Join] Insert error:`, error);
      return Errors.database('Failed to join talent pool. Please try again.', undefined, traceId).toResponse();
    }

    console.log(`[${traceId}][TalentPool Join] New candidate joined: ${email}`);

    return NextResponse.json({
      success: true,
      message: 'Successfully joined the talent pool!',
      candidateId: data.id,
      profileCompleteness: Math.min(completeness, 100)
    });

  } catch (error) {
    console.error(`[${traceId}][TalentPool Join] Error:`, error);
    return Errors.internal('Failed to join talent pool', traceId).toResponse();
  }
}

// GET - Check if email is already registered
export async function GET(request: NextRequest) {
  // Apply rate limiting
  const rateLimited = withRateLimit(request, 'talent-pool-join-check', RATE_LIMITS.standard);
  if (rateLimited) return rateLimited;

  const traceId = generateTraceId();

  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return Errors.validation('Email parameter is required').toResponse();
    }

    const supabase = getSupabaseServiceClient();

    const { data: existing } = await supabase
      .from('talent_pool_candidates')
      .select('id, full_name, created_at')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    return NextResponse.json({
      exists: !!existing,
      candidate: existing ? {
        id: existing.id,
        name: existing.full_name,
        joinedAt: existing.created_at
      } : null
    });

  } catch (error) {
    console.error(`[${traceId}][TalentPool Join] Check error:`, error);
    return Errors.internal('Failed to check email', traceId).toResponse();
  }
}
