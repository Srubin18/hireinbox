import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth, isAuthError, requireRateLimit } from '@/lib/api-auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  // Check rate limit
  const rateLimitError = requireRateLimit(request, { maxRequests: 100, windowMs: 3600000 });
  if (rateLimitError) return rateLimitError;

  // Require authentication
  const authResult = await requireAuth(request);
  if (isAuthError(authResult)) return authResult;
  const { user } = authResult;

  try {
    // Get user's company to filter roles
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('company_id')
      .eq('user_id', user.id)
      .single();

    let query = supabase
      .from('roles')
      .select('*')
      .order('created_at', { ascending: false });

    // Filter by company if user has one
    if (userProfile?.company_id) {
      query = query.eq('company_id', userProfile.company_id);
    }

    const { data: roles, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ roles });
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json({ error: 'Failed to fetch roles' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // Check rate limit
  const rateLimitError = requireRateLimit(request, { maxRequests: 50, windowMs: 3600000 });
  if (rateLimitError) return rateLimitError;

  // Require authentication
  const authResult = await requireAuth(request);
  if (isAuthError(authResult)) return authResult;
  const { user } = authResult;

  try {
    const body = await request.json();

    // Get user's company
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('company_id')
      .eq('user_id', user.id)
      .single();
    
    const roleData = {
      title: body.title,
      status: body.status || 'active',
      criteria: body.criteria || {},
      facts: body.facts || {},
      preferences: body.preferences || {},
      context: body.context || {},
      ai_guidance: body.ai_guidance || {},
      screening_questions: body.screening_questions || [],
      company_id: userProfile?.company_id || null,
      created_by: user.id,
    };

    const { data: role, error } = await supabase
      .from('roles')
      .insert([roleData])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ role });
  } catch (error) {
    console.error('Error creating role:', error);
    return NextResponse.json({ error: 'Failed to create role' }, { status: 500 });
  }
}