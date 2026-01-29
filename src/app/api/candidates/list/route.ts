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

    if (!roleId) {
      return NextResponse.json(
        { success: false, error: 'Missing role_id parameter' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('candidates')
      .select('*')
      .eq('role_id', roleId)
      .order('ai_score', { ascending: false });

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
