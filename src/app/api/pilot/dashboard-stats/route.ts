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

    // Get roles for this user
    const { data: allRoles } = await supabase
      .from('roles')
      .select('id, title, created_at, criteria')
      .order('created_at', { ascending: false });

    const roles = allRoles?.filter((role: any) =>
      role.criteria?.user_id === user.id
    ) || [];

    // Count candidates for each role
    let totalCandidates = 0;
    const recentRoles = [];

    for (const role of roles.slice(0, 5)) {
      const { data: candidates } = await supabase
        .from('candidates')
        .select('id')
        .eq('role_id', role.id);

      const count = candidates?.length || 0;
      totalCandidates += count;

      recentRoles.push({
        id: role.id,
        title: role.title,
        created_at: role.created_at,
        candidate_count: count,
      });
    }

    return NextResponse.json({
      cvsScreened: totalCandidates,
      activeRoles: roles.length,
      recentRoles,
    });

  } catch (error) {
    console.error('[Dashboard Stats] Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
