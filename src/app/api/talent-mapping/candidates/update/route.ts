import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { candidateId, feedback, status } = await request.json();

    if (!candidateId) {
      return NextResponse.json({ error: 'candidateId required' }, { status: 400 });
    }

    const updates: any = { updated_at: new Date().toISOString() };

    if (feedback && ['good', 'bad'].includes(feedback)) {
      updates.user_feedback = feedback;
    }

    if (status && ['active', 'shortlist', 'archived'].includes(status)) {
      updates.status = status;
    }

    const { error } = await supabase
      .from('talent_mapping_candidates')
      .update(updates)
      .eq('id', candidateId)
      .eq('user_id', user.id); // Security: only update own candidates

    if (error) {
      console.error('[TM Update] Error:', error);
      return NextResponse.json({ error: 'Failed to update candidate' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('[TM Update] Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
