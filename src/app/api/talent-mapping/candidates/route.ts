import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'shortlist';
    const reportId = searchParams.get('report_id');

    let query = supabase
      .from('talent_mapping_candidates')
      .select('*')
      .eq('user_id', user.id);

    // Filter by status: shortlist = all except archived, archived = only archived
    if (status === 'shortlist') {
      query = query.neq('status', 'archived');
    } else if (status === 'archived') {
      query = query.eq('status', 'archived');
    }

    if (reportId) {
      query = query.eq('report_id', reportId);
    }

    const { data, error } = await query.order('match_score', { ascending: false });

    if (error) {
      console.error('[TM Candidates] Error:', error);
      return NextResponse.json({ error: 'Failed to fetch candidates' }, { status: 500 });
    }

    console.log(`[TM Candidates] Returning ${data?.length || 0} candidates for status=${status}, reportId=${reportId}`);
    console.log('[TM Candidates] Candidate statuses:', data?.map(c => ({ name: c.name, status: c.status })));

    return NextResponse.json({ success: true, candidates: data || [] });

  } catch (error) {
    console.error('[TM Candidates] Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
