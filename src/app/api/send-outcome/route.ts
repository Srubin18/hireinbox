// app/api/send-outcome/route.ts
// API route for sending outcome emails (shortlist/reject/talent pool)
// These are MANUAL - triggered by user from dashboard

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { 
  sendShortlistEmail, 
  sendRejectionEmail, 
  sendTalentPoolEmail 
} from '@/lib/email';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { candidateId, action, nextSteps } = body;

    if (!candidateId || !action) {
      return NextResponse.json(
        { error: 'Missing candidateId or action' },
        { status: 400 }
      );
    }

    // Fetch candidate details
    const { data: candidate, error: candidateError } = await supabase
      .from('candidates')
      .select('*, roles(*)')
      .eq('id', candidateId)
      .single();

    if (candidateError || !candidate) {
      return NextResponse.json(
        { error: 'Candidate not found' },
        { status: 404 }
      );
    }

    if (!candidate.email) {
      return NextResponse.json(
        { error: 'Candidate has no email address' },
        { status: 400 }
      );
    }

    const roleTitle = candidate.roles?.title || 'the position';
    const screeningResult = candidate.screening_result;

    // Extract strengths for talent pool email
    const strengths = screeningResult?.summary?.strengths?.map((s: { label: string }) => s.label) || [];

    // Generate rejection reason from screening
    const rejectionReason = screeningResult?.hard_requirements?.not_met?.[0]?.split(':')[0] || undefined;

    let result;
    let newStatus;

    switch (action) {
      case 'shortlist':
        result = await sendShortlistEmail(
          candidate.email,
          candidate.name || 'Applicant',
          roleTitle,
          nextSteps
        );
        newStatus = 'shortlist';
        break;

      case 'reject':
        result = await sendRejectionEmail(
          candidate.email,
          candidate.name || 'Applicant',
          roleTitle,
          rejectionReason ? `candidates with stronger ${rejectionReason.toLowerCase()} backgrounds` : undefined
        );
        newStatus = 'reject';
        break;

      case 'talent_pool':
        result = await sendTalentPoolEmail(
          candidate.email,
          candidate.name || 'Applicant',
          roleTitle,
          strengths.length > 0 ? strengths : undefined
        );
        newStatus = 'talent_pool';
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: shortlist, reject, or talent_pool' },
          { status: 400 }
        );
    }

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to send email', details: result.error },
        { status: 500 }
      );
    }

    // Update candidate status and mark as notified
    await supabase
      .from('candidates')
      .update({ 
        status: newStatus,
        outcome_sent_at: new Date().toISOString(),
        outcome_type: action
      })
      .eq('id', candidateId);

    return NextResponse.json({
      success: true,
      message: `${action} email sent to ${candidate.email}`,
      candidate: {
        id: candidate.id,
        name: candidate.name,
        email: candidate.email,
        newStatus
      }
    });

  } catch (error) {
    console.error('Send outcome error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to send outcome email',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}