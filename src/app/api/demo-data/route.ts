import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // Load roles
    const { data: roles, error: rolesError } = await supabase
      .from('roles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (rolesError) {
      console.error('Roles error:', rolesError);
    }

    // Load candidates
    const { data: candidates, error: candidatesError } = await supabase
      .from('candidates')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (candidatesError) {
      console.error('Candidates error:', candidatesError);
    }

    return NextResponse.json({
      roles: roles || [],
      candidates: candidates || []
    });
  } catch (err) {
    console.error('Demo data error:', err);
    return NextResponse.json({ roles: [], candidates: [] });
  }
}
