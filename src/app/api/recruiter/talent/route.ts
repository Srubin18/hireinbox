import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth, isAuthError, requireRateLimit } from '@/lib/api-auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/recruiter/talent - List all talent for the recruiter
export async function GET(request: NextRequest) {
  const rateLimitError = requireRateLimit(request, { maxRequests: 100, windowMs: 3600000 });
  if (rateLimitError) return rateLimitError;

  const authResult = await requireAuth(request);
  if (isAuthError(authResult)) return authResult;
  const { user } = authResult;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    let query = supabase
      .from('recruiter_talent')
      .select('*')
      .eq('recruiter_id', user.id)
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,current_title.ilike.%${search}%,current_company.ilike.%${search}%`);
    }

    const { data: talent, error } = await query;

    if (error) {
      console.error('Error fetching talent:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ talent: talent || [] });
  } catch (error) {
    console.error('Error fetching talent:', error);
    return NextResponse.json({ error: 'Failed to fetch talent' }, { status: 500 });
  }
}

// POST /api/recruiter/talent - Add a new candidate to talent pool
export async function POST(request: NextRequest) {
  const rateLimitError = requireRateLimit(request, { maxRequests: 50, windowMs: 3600000 });
  if (rateLimitError) return rateLimitError;

  const authResult = await requireAuth(request);
  if (isAuthError(authResult)) return authResult;
  const { user } = authResult;

  try {
    const body = await request.json();

    const talentData = {
      recruiter_id: user.id,
      name: body.name,
      email: body.email,
      phone: body.phone || null,
      current_title: body.current_title || null,
      current_company: body.current_company || null,
      skills: body.skills || [],
      experience_years: body.experience_years || null,
      location: body.location || null,
      salary_expectation: body.salary_expectation || null,
      cv_url: body.cv_url || null,
      cv_text: body.cv_text || null,
      linkedin_url: body.linkedin_url || null,
      notes: body.notes || null,
      source: body.source || null,
      status: body.status || 'available',
    };

    if (!talentData.name || !talentData.email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }

    const { data: talent, error } = await supabase
      .from('recruiter_talent')
      .insert([talentData])
      .select()
      .single();

    if (error) {
      console.error('Error creating talent:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ talent });
  } catch (error) {
    console.error('Error creating talent:', error);
    return NextResponse.json({ error: 'Failed to add talent' }, { status: 500 });
  }
}

// PUT /api/recruiter/talent - Update a talent record
export async function PUT(request: NextRequest) {
  const rateLimitError = requireRateLimit(request, { maxRequests: 50, windowMs: 3600000 });
  if (rateLimitError) return rateLimitError;

  const authResult = await requireAuth(request);
  if (isAuthError(authResult)) return authResult;
  const { user } = authResult;

  try {
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json({ error: 'Talent ID is required' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.current_title !== undefined) updateData.current_title = body.current_title;
    if (body.current_company !== undefined) updateData.current_company = body.current_company;
    if (body.skills !== undefined) updateData.skills = body.skills;
    if (body.experience_years !== undefined) updateData.experience_years = body.experience_years;
    if (body.location !== undefined) updateData.location = body.location;
    if (body.salary_expectation !== undefined) updateData.salary_expectation = body.salary_expectation;
    if (body.cv_url !== undefined) updateData.cv_url = body.cv_url;
    if (body.cv_text !== undefined) updateData.cv_text = body.cv_text;
    if (body.linkedin_url !== undefined) updateData.linkedin_url = body.linkedin_url;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.source !== undefined) updateData.source = body.source;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.last_contacted_at !== undefined) updateData.last_contacted_at = body.last_contacted_at;

    const { data: talent, error } = await supabase
      .from('recruiter_talent')
      .update(updateData)
      .eq('id', body.id)
      .eq('recruiter_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating talent:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ talent });
  } catch (error) {
    console.error('Error updating talent:', error);
    return NextResponse.json({ error: 'Failed to update talent' }, { status: 500 });
  }
}

// DELETE /api/recruiter/talent - Delete a talent record
export async function DELETE(request: NextRequest) {
  const rateLimitError = requireRateLimit(request, { maxRequests: 50, windowMs: 3600000 });
  if (rateLimitError) return rateLimitError;

  const authResult = await requireAuth(request);
  if (isAuthError(authResult)) return authResult;
  const { user } = authResult;

  try {
    const { searchParams } = new URL(request.url);
    const talentId = searchParams.get('id');

    if (!talentId) {
      return NextResponse.json({ error: 'Talent ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('recruiter_talent')
      .delete()
      .eq('id', talentId)
      .eq('recruiter_id', user.id);

    if (error) {
      console.error('Error deleting talent:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting talent:', error);
    return NextResponse.json({ error: 'Failed to delete talent' }, { status: 500 });
  }
}
