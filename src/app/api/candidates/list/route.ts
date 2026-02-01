import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Server-side candidate listing (bypasses RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const roleId = searchParams.get('role_id');
    const status = searchParams.get('status');

    if (!roleId) {
      return NextResponse.json(
        { success: false, error: 'Missing role_id parameter' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('candidates')
      .select('*')
      .eq('role_id', roleId);

    // Filter by status
    if (status === 'shortlist') {
      // For shortlist view, show all candidates EXCEPT archived ones
      query = query.neq('status', 'archived');
    } else if (status === 'archived') {
      // For archived view, only show archived
      query = query.eq('status', 'archived');
    }

    const { data, error } = await query.order('ai_score', { ascending: false });

    if (error) {
      console.error('[Candidates List] Error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, candidates: data || [] });
  } catch (err) {
    console.error('[Candidates List] Error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch candidates' },
      { status: 500 }
    );
  }
}
