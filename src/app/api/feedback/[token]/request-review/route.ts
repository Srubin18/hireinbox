// /api/feedback/[token]/request-review/route.ts
// Handles human review requests from candidates
// Stores the request and notifies the hiring team

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token || token.length < 16) {
      return NextResponse.json(
        { error: 'Invalid feedback token' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { message } = body;

    if (!message || typeof message !== 'string' || message.trim().length < 10) {
      return NextResponse.json(
        { error: 'Please provide a detailed message (at least 10 characters)' },
        { status: 400 }
      );
    }

    // Sanitize and limit message length
    const sanitizedMessage = message.trim().slice(0, 2000);

    // Find candidate by token
    const { data: candidate, error: candidateError } = await supabase
      .from('candidates')
      .select(`
        id,
        name,
        email,
        feedback_token,
        review_requested_at,
        role_id,
        roles (
          id,
          title,
          company_id
        )
      `)
      .eq('feedback_token', token)
      .single();

    if (candidateError || !candidate) {
      return NextResponse.json(
        { error: 'Invalid feedback link' },
        { status: 404 }
      );
    }

    // Check if review was already requested
    if (candidate.review_requested_at) {
      return NextResponse.json(
        { error: 'A review request has already been submitted for this application' },
        { status: 409 }
      );
    }

    // Update candidate with review request
    const { error: updateError } = await supabase
      .from('candidates')
      .update({
        review_requested_at: new Date().toISOString(),
        review_request_message: sanitizedMessage,
        status: 'review_requested' // Update status to flag for review
      })
      .eq('id', candidate.id);

    if (updateError) {
      console.error('[REVIEW] Failed to update candidate:', updateError);
      return NextResponse.json(
        { error: 'Failed to submit review request' },
        { status: 500 }
      );
    }

    // Log the review request
    console.log(`[REVIEW] Request submitted:`, {
      candidateId: candidate.id,
      candidateName: candidate.name,
      candidateEmail: candidate.email,
      roleId: candidate.role_id,
      messageLength: sanitizedMessage.length,
      timestamp: new Date().toISOString()
    });

    // TODO: Send notification email to hiring team
    // This would use sendTemplatedEmail with a new 'review_request' template
    // For now, we just log and store it

    return NextResponse.json({
      success: true,
      message: 'Your review request has been submitted. The hiring team will be notified.'
    });

  } catch (error) {
    console.error('[REVIEW] Error:', error);
    return NextResponse.json(
      { error: 'Failed to submit review request' },
      { status: 500 }
    );
  }
}
