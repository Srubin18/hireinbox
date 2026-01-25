import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { Errors, generateTraceId } from '@/lib/api-error';

// ============================================
// TALENT POOL CONNECTION REQUESTS
// Employer requests to connect with candidate
// Candidate approves or declines
// ============================================

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimited = withRateLimit(request, 'talent-pool-connect', RATE_LIMITS.standard);
  if (rateLimited) return rateLimited;

  const traceId = generateTraceId();

  try {
    const { employerId, candidateId, roleId, message } = await request.json();

    if (!employerId || !candidateId) {
      return Errors.validation('employerId and candidateId are required').toResponse();
    }

    // Check if connection already exists
    const { data: existing } = await supabase
      .from('talent_pool_connections')
      .select('id, status')
      .eq('employer_id', employerId)
      .eq('candidate_id', candidateId)
      .single();

    if (existing) {
      return NextResponse.json({
        success: false,
        message: `Connection request already ${existing.status}`,
        connectionId: existing.id
      });
    }

    // Create connection request
    const { data, error } = await supabase
      .from('talent_pool_connections')
      .insert({
        employer_id: employerId,
        candidate_id: candidateId,
        role_id: roleId || null,
        employer_message: message || null,
        status: 'pending',
        requested_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error(`[${traceId}] Connection request error:`, error);
      return Errors.database('Failed to create connection request', undefined, traceId).toResponse();
    }

    // Update match record to show employer interest
    if (roleId) {
      await supabase
        .from('talent_pool_matches')
        .update({
          viewed_by_employer: true,
          viewed_at: new Date().toISOString(),
          employer_action: 'interested',
          employer_action_at: new Date().toISOString()
        })
        .eq('candidate_id', candidateId)
        .eq('role_id', roleId);
    }

    return NextResponse.json({
      success: true,
      message: 'Connection request sent',
      connectionId: data.id
    });

  } catch (error) {
    console.error(`[${traceId}] Connection request error:`, error);
    return Errors.internal('Failed to process connection request', traceId).toResponse();
  }
}

// Candidate responds to connection request
export async function PATCH(request: NextRequest) {
  // Apply rate limiting
  const rateLimited = withRateLimit(request, 'talent-pool-connect-patch', RATE_LIMITS.standard);
  if (rateLimited) return rateLimited;

  const traceId = generateTraceId();

  try {
    const { connectionId, candidateId, action, response } = await request.json();

    if (!connectionId || !candidateId || !action) {
      return Errors.validation('connectionId, candidateId, and action are required').toResponse();
    }

    if (!['accepted', 'declined'].includes(action)) {
      return Errors.validation('action must be accepted or declined').toResponse();
    }

    // Update connection
    const { data, error } = await supabase
      .from('talent_pool_connections')
      .update({
        status: action,
        candidate_response: response || null,
        responded_at: new Date().toISOString()
      })
      .eq('id', connectionId)
      .eq('candidate_id', candidateId)
      .select()
      .single();

    if (error) {
      console.error(`[${traceId}] Connection response error:`, error);
      return Errors.database('Failed to update connection', undefined, traceId).toResponse();
    }

    // Update match record with final action
    if (data.role_id) {
      await supabase
        .from('talent_pool_matches')
        .update({
          employer_action: action === 'accepted' ? 'contacted' : 'not_interested',
          employer_action_at: new Date().toISOString()
        })
        .eq('candidate_id', candidateId)
        .eq('role_id', data.role_id);
    }

    return NextResponse.json({
      success: true,
      message: action === 'accepted' ? 'Connection accepted' : 'Connection declined',
      connection: data
    });

  } catch (error) {
    console.error(`[${traceId}] Connection response error:`, error);
    return Errors.internal('Failed to update connection', traceId).toResponse();
  }
}

// Get connection requests for a candidate
export async function GET(request: NextRequest) {
  // Apply rate limiting
  const rateLimited = withRateLimit(request, 'talent-pool-connect-get', RATE_LIMITS.standard);
  if (rateLimited) return rateLimited;

  const traceId = generateTraceId();

  try {
    const { searchParams } = new URL(request.url);
    const candidateId = searchParams.get('candidateId');
    const employerId = searchParams.get('employerId');

    if (!candidateId && !employerId) {
      return Errors.validation('candidateId or employerId is required').toResponse();
    }

    let query = supabase.from('talent_pool_connections').select('*');

    if (candidateId) {
      query = query.eq('candidate_id', candidateId);
    } else {
      query = query.eq('employer_id', employerId);
    }

    const { data, error } = await query.order('requested_at', { ascending: false });

    if (error) {
      console.error(`[${traceId}] Get connections error:`, error);
      return Errors.database('Failed to fetch connections', undefined, traceId).toResponse();
    }

    return NextResponse.json({ connections: data });

  } catch (error) {
    console.error(`[${traceId}] Get connections error:`, error);
    return Errors.internal('Failed to fetch connections', traceId).toResponse();
  }
}
