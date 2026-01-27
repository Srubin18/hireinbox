import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Server-side candidate creation (bypasses RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      role_id,
      name,
      email,
      phone,
      cv_text,
      ai_score,
      ai_recommendation,
      ai_reasoning,
      screening_result,
      status,
      score,
      strengths,
      missing,
    } = body;

    if (!role_id || !name || !email) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: role_id, name, email' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('candidates')
      .insert({
        role_id,
        name,
        email,
        phone: phone || null,
        cv_text: cv_text || null,
        ai_score: ai_score || 0,
        ai_recommendation: ai_recommendation || null,
        ai_reasoning: ai_reasoning || null,
        screening_result: screening_result || null,
        screened_at: new Date().toISOString(),
        status: status || 'screened',
        score: score || 0,
        strengths: strengths || [],
        missing: missing || [],
      })
      .select()
      .single();

    if (error) {
      console.error('[Candidate Create] Insert error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, candidate: data });
  } catch (err) {
    console.error('[Candidate Create] Error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to create candidate' },
      { status: 500 }
    );
  }
}
