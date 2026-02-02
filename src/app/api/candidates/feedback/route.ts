import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { candidateId, feedback } = await request.json();

    if (!candidateId || !feedback || !['good', 'bad'].includes(feedback)) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    const { error } = await supabase
      .from('candidates')
      .update({ user_feedback: feedback })
      .eq('id', candidateId);

    if (error) {
      console.error('[Feedback] Error:', error);
      return NextResponse.json({ error: 'Failed to update feedback' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Feedback] Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
