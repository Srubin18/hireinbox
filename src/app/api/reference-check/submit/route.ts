import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ============================================
// REFERENCE SUBMISSION API
// Receives responses from referees
// ============================================

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(request: NextRequest) {
  try {
    const { token, answers } = await request.json();

    if (!token || !answers) {
      return NextResponse.json(
        { error: 'token and answers are required' },
        { status: 400 }
      );
    }

    // Get request by token
    const { data: requestData, error: reqError } = await supabase
      .from('reference_requests')
      .select('id, status, expires_at')
      .eq('token', token)
      .single();

    if (reqError || !requestData) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      );
    }

    // Check if expired
    if (new Date(requestData.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Request expired' },
        { status: 410 }
      );
    }

    // Check if already completed
    if (requestData.status === 'completed') {
      return NextResponse.json(
        { error: 'Reference already submitted' },
        { status: 400 }
      );
    }

    // Extract rating and would_rehire from answers if present
    let overallRating = null;
    let wouldRehire = null;

    for (const [key, value] of Object.entries(answers)) {
      if (key.includes('rating') || key === 'q5') {
        overallRating = typeof value === 'number' ? value : null;
      }
      if (key.includes('rehire') || key === 'q6') {
        wouldRehire = typeof value === 'boolean' ? value : null;
      }
    }

    // Get IP and user agent
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Save response
    const { error: respError } = await supabase
      .from('reference_responses')
      .insert({
        request_id: requestData.id,
        answers,
        overall_rating: overallRating,
        would_rehire: wouldRehire,
        ip_address: ip,
        user_agent: userAgent
      });

    if (respError) {
      console.error('Save response error:', respError);
      return NextResponse.json(
        { error: 'Failed to save response' },
        { status: 500 }
      );
    }

    // Update request status
    await supabase
      .from('reference_requests')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', requestData.id);

    return NextResponse.json({
      success: true,
      message: 'Reference submitted successfully'
    });

  } catch (error) {
    console.error('Reference submit error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
