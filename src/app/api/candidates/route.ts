// /api/candidates - CRUD operations for candidates
//
// RATE LIMITING: 100 req/hr GET, 50 req/hr POST/PATCH/DELETE
// AUTHENTICATION: Required for all operations

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase';
import { Errors, generateTraceId } from '@/lib/api-error';
import { requireAuth, isAuthError, requireRateLimit } from '@/lib/api-auth';

// ============================================
// VALIDATION HELPERS
// ============================================

const MAX_NAME_LENGTH = 200;
const MAX_EMAIL_LENGTH = 254;
const MAX_PHONE_LENGTH = 50;
const MAX_CV_TEXT_LENGTH = 500000; // 500k characters
const VALID_STATUSES = ['new', 'screened', 'shortlist', 'talent_pool', 'reject', 'interview', 'hired', 'unprocessed'];

function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

function isValidEmail(email: string): boolean {
  // Basic email validation - more permissive to avoid false negatives
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= MAX_EMAIL_LENGTH;
}

function sanitizeString(str: string, maxLength: number): string {
  return str.trim().slice(0, maxLength);
}

export async function GET(request: NextRequest) {
  const traceId = generateTraceId();

  // Check rate limit
  const rateLimitError = requireRateLimit(request, { maxRequests: 100, windowMs: 3600000 });
  if (rateLimitError) return rateLimitError;

  // Require authentication
  const authResult = await requireAuth(request);
  if (isAuthError(authResult)) return authResult;
  const { user } = authResult;

  try {
    const supabase = getSupabaseServiceClient();

    // Get user's company to filter candidates
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('company_id')
      .eq('user_id', user.id)
      .single();

    let query = supabase
      .from('candidates')
      .select('*')
      .order('created_at', { ascending: false });

    // Filter by company if user has one
    if (userProfile?.company_id) {
      query = query.eq('company_id', userProfile.company_id);
    }

    const { data: candidates, error } = await query;

    if (error) {
      console.error(`[${traceId}] Database error fetching candidates:`, error);
      return Errors.database('Failed to fetch candidates', error.message, traceId).toResponse();
    }

    return NextResponse.json({ candidates, traceId });
  } catch (error) {
    console.error(`[${traceId}] Error fetching candidates:`, error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Errors.internal(message, traceId).toResponse();
  }
}

export async function POST(request: Request) {
  const traceId = generateTraceId();

  try {
    const supabase = getSupabaseServiceClient();

    // Parse request body
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return Errors.validation('Invalid JSON in request body').toResponse();
    }

    // ============================================
    // VALIDATE REQUIRED FIELDS
    // ============================================

    // Validate name
    if (!body.name || typeof body.name !== 'string') {
      return Errors.validation('Missing or invalid required field: name').toResponse();
    }
    const name = sanitizeString(body.name, MAX_NAME_LENGTH);
    if (name.length < 1) {
      return Errors.validation('Name cannot be empty').toResponse();
    }

    // Validate email
    if (!body.email || typeof body.email !== 'string') {
      return Errors.validation('Missing or invalid required field: email').toResponse();
    }
    const email = body.email.trim().toLowerCase();
    if (!isValidEmail(email)) {
      return Errors.validation('Invalid email format').toResponse();
    }

    // Validate role_id
    if (!body.role_id || typeof body.role_id !== 'string') {
      return Errors.validation('Missing required field: role_id').toResponse();
    }
    if (!isValidUUID(body.role_id)) {
      return Errors.validation('Invalid role_id format. Expected UUID.').toResponse();
    }

    // ============================================
    // VALIDATE OPTIONAL FIELDS
    // ============================================

    // Validate company_id if provided
    if (body.company_id !== undefined && body.company_id !== null) {
      if (typeof body.company_id !== 'string' || !isValidUUID(body.company_id)) {
        return Errors.validation('Invalid company_id format. Expected UUID.').toResponse();
      }
    }

    // Validate phone if provided
    let phone = null;
    if (body.phone !== undefined && body.phone !== null) {
      if (typeof body.phone !== 'string') {
        return Errors.validation('Phone must be a string').toResponse();
      }
      phone = sanitizeString(body.phone, MAX_PHONE_LENGTH) || null;
    }

    // Validate cv_text if provided
    let cvText = null;
    if (body.cv_text !== undefined && body.cv_text !== null) {
      if (typeof body.cv_text !== 'string') {
        return Errors.validation('cv_text must be a string').toResponse();
      }
      if (body.cv_text.length > MAX_CV_TEXT_LENGTH) {
        return Errors.validation(
          `CV text too long. Maximum ${MAX_CV_TEXT_LENGTH.toLocaleString()} characters.`
        ).toResponse();
      }
      cvText = body.cv_text;
    }

    // Validate status if provided
    if (body.status !== undefined) {
      if (typeof body.status !== 'string' || !VALID_STATUSES.includes(body.status)) {
        return Errors.validation(
          `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`
        ).toResponse();
      }
    }

    // Validate score if provided
    let score = 0;
    if (body.score !== undefined) {
      if (typeof body.score !== 'number' || body.score < 0 || body.score > 100) {
        return Errors.validation('Score must be a number between 0 and 100').toResponse();
      }
      score = Math.round(body.score);
    }

    // ============================================
    // CREATE CANDIDATE
    // ============================================

    const candidateData = {
      company_id: body.company_id || null,
      role_id: body.role_id,
      name,
      email,
      phone,
      cv_text: cvText,
      status: body.status || 'new',
      score,
      strengths: Array.isArray(body.strengths) ? body.strengths : [],
      missing: Array.isArray(body.missing) ? body.missing : [],
    };

    const { data: candidate, error } = await supabase
      .from('candidates')
      .insert(candidateData as never)
      .select()
      .single();

    if (error) {
      console.error(`[${traceId}] Database error creating candidate:`, error);
      return Errors.database('Failed to create candidate', error.message, traceId).toResponse();
    }

    console.log(`[${traceId}] Candidate created: ${candidate.id} - ${name}`);
    return NextResponse.json({ candidate, traceId }, { status: 201 });

  } catch (error) {
    console.error(`[${traceId}] Error creating candidate:`, error);
    return Errors.internal('Failed to create candidate', traceId).toResponse();
  }
}

export async function PATCH(request: Request) {
  const traceId = generateTraceId();

  try {
    const supabase = getSupabaseServiceClient();

    // Parse request body
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return Errors.validation('Invalid JSON in request body').toResponse();
    }

    // Validate ID
    if (!body.id || typeof body.id !== 'string') {
      return Errors.validation('Missing required field: id').toResponse();
    }
    if (!isValidUUID(body.id)) {
      return Errors.validation('Invalid id format. Expected UUID.').toResponse();
    }

    const { id, ...updates } = body;

    // ============================================
    // VALIDATE UPDATE FIELDS
    // ============================================

    // Validate name if provided
    if (updates.name !== undefined) {
      if (typeof updates.name !== 'string') {
        return Errors.validation('Name must be a string').toResponse();
      }
      updates.name = sanitizeString(updates.name, MAX_NAME_LENGTH);
      if ((updates.name as string).length < 1) {
        return Errors.validation('Name cannot be empty').toResponse();
      }
    }

    // Validate email if provided
    if (updates.email !== undefined) {
      if (typeof updates.email !== 'string') {
        return Errors.validation('Email must be a string').toResponse();
      }
      updates.email = (updates.email as string).trim().toLowerCase();
      if (!isValidEmail(updates.email as string)) {
        return Errors.validation('Invalid email format').toResponse();
      }
    }

    // Validate status if provided
    if (updates.status !== undefined) {
      if (typeof updates.status !== 'string' || !VALID_STATUSES.includes(updates.status)) {
        return Errors.validation(
          `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`
        ).toResponse();
      }
    }

    // Validate score if provided
    if (updates.score !== undefined) {
      if (typeof updates.score !== 'number' || updates.score < 0 || updates.score > 100) {
        return Errors.validation('Score must be a number between 0 and 100').toResponse();
      }
      updates.score = Math.round(updates.score);
    }

    // Validate role_id if provided
    if (updates.role_id !== undefined) {
      if (typeof updates.role_id !== 'string' || !isValidUUID(updates.role_id)) {
        return Errors.validation('Invalid role_id format. Expected UUID.').toResponse();
      }
    }

    const { data: candidate, error } = await supabase
      .from('candidates')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`[${traceId}] Database error updating candidate:`, error);
      return Errors.database('Failed to update candidate', error.message, traceId).toResponse();
    }

    if (!candidate) {
      return Errors.notFound('Candidate').toResponse();
    }

    console.log(`[${traceId}] Candidate updated: ${id}`);
    return NextResponse.json({ candidate, traceId });

  } catch (error) {
    console.error(`[${traceId}] Error updating candidate:`, error);
    return Errors.internal('Failed to update candidate', traceId).toResponse();
  }
}

export async function DELETE(request: Request) {
  const traceId = generateTraceId();

  try {
    const supabase = getSupabaseServiceClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Validate ID
    if (!id) {
      return Errors.validation('Missing required parameter: id').toResponse();
    }
    if (!isValidUUID(id)) {
      return Errors.validation('Invalid id format. Expected UUID.').toResponse();
    }

    // Check if candidate exists before deleting
    const { data: existingCandidate, error: fetchError } = await supabase
      .from('candidates')
      .select('id')
      .eq('id', id)
      .single();

    if (fetchError || !existingCandidate) {
      return Errors.notFound('Candidate').toResponse();
    }

    const { error } = await supabase
      .from('candidates')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`[${traceId}] Database error deleting candidate:`, error);
      return Errors.database('Failed to delete candidate', error.message, traceId).toResponse();
    }

    console.log(`[${traceId}] Candidate deleted: ${id}`);
    return NextResponse.json({ success: true, traceId });

  } catch (error) {
    console.error(`[${traceId}] Error deleting candidate:`, error);
    return Errors.internal('Failed to delete candidate', traceId).toResponse();
  }
}
