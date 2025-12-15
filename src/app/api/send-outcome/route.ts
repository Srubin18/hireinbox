import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendOutcomeEmail } from '@/lib/email';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { candidateId, status } = await request.json();

    if (!candidateId || !status) {
      return NextResponse.json({ error: 'Missing candidateId or status' }, { status: 400 });
    }

    // Get candidate details
    const { data: candidate, error: candidateError } = await supabase
      .from('candidates')
      .select('*, roles(*)')
      .eq('id', candidateId)
      .single();

    if (candidateError || !candidate) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
    }

    if (!candidate.email) {
      return NextResponse.json({ error: 'Candidate has no email address' }, { status: 400 });
    }

    // Send outcome email
    const sent = await sendOutcomeEmail(
      candidate.email,
      candidate.name || 'Applicant',
      candidate.roles?.title || 'Position',
      status,
      'HireInbox'
    );

    if (!sent) {
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    // Update candidate status if different
    if (candidate.status !== status) {
      await supabase
        .from('candidates')
        .update({ status })
        .eq('id', candidateId);
    }

    return NextResponse.json({ success: true, message: `Email sent to ${candidate.email}` });

  } catch (error) {
    console.error('Send outcome error:', error);
    return NextResponse.json({ error: 'Failed to send outcome email' }, { status: 500 });
  }
}