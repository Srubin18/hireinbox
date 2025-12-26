// Talent Pool API
// Save rejected candidates for future opportunities

import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

// GET - Fetch talent pool for a company
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get('company_id');
  const category = searchParams.get('category');
  const includeNetwork = searchParams.get('include_network') === 'true';

  try {
    const supabase = await createServerSupabaseClient();

    let query = supabase
      .from('talent_pool')
      .select(`
        *,
        candidates (
          id,
          name,
          email,
          score,
          cv_summary,
          strengths,
          experience_years,
          education
        ),
        roles (
          id,
          title
        )
      `)
      .eq('status', 'active')
      .order('added_at', { ascending: false });

    // Filter by company or include network
    if (companyId && !includeNetwork) {
      query = query.eq('company_id', companyId);
    } else if (companyId && includeNetwork) {
      query = query.or(`company_id.eq.${companyId},share_with_network.eq.true`);
    }

    // Filter by category
    if (category) {
      query = query.eq('talent_category', category);
    }

    const { data, error } = await query.limit(100);

    if (error) {
      console.error('[TalentPool] Fetch error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      talent: data || [],
      count: data?.length || 0
    });

  } catch (error) {
    console.error('[TalentPool] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch talent pool' }, { status: 500 });
  }
}

// POST - Add candidate to talent pool
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      company_id,
      candidate_id,
      original_role_id,
      rejection_reason,
      ai_recommended_roles,
      ai_talent_notes,
      talent_category,
      seniority_level,
      share_with_network = false,
      notes
    } = body;

    if (!company_id || !candidate_id) {
      return NextResponse.json(
        { error: 'company_id and candidate_id are required' },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    // Check if already in pool
    const { data: existing } = await supabase
      .from('talent_pool')
      .select('id')
      .eq('company_id', company_id)
      .eq('candidate_id', candidate_id)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Candidate already in talent pool', existing_id: existing.id },
        { status: 409 }
      );
    }

    // Add to pool
    const { data, error } = await supabase
      .from('talent_pool')
      .insert({
        company_id,
        candidate_id,
        original_role_id,
        rejection_reason,
        ai_recommended_roles,
        ai_talent_notes,
        talent_category,
        seniority_level,
        share_with_network,
        shared_at: share_with_network ? new Date().toISOString() : null,
        notes
      })
      .select()
      .single();

    if (error) {
      console.error('[TalentPool] Insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`[TalentPool] Added candidate ${candidate_id} to pool for company ${company_id}`);

    return NextResponse.json({
      success: true,
      talent_pool_id: data.id,
      message: 'Candidate added to talent pool'
    });

  } catch (error) {
    console.error('[TalentPool] Error:', error);
    return NextResponse.json({ error: 'Failed to add to talent pool' }, { status: 500 });
  }
}

// PATCH - Update talent pool entry (toggle sharing, update notes, etc.)
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();

    // If enabling sharing, set shared_at
    if (updates.share_with_network === true) {
      updates.shared_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('talent_pool')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[TalentPool] Update error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      updated: data
    });

  } catch (error) {
    console.error('[TalentPool] Error:', error);
    return NextResponse.json({ error: 'Failed to update talent pool entry' }, { status: 500 });
  }
}

// DELETE - Remove from talent pool
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  try {
    const supabase = await createServerSupabaseClient();

    const { error } = await supabase
      .from('talent_pool')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[TalentPool] Delete error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Removed from talent pool'
    });

  } catch (error) {
    console.error('[TalentPool] Error:', error);
    return NextResponse.json({ error: 'Failed to remove from talent pool' }, { status: 500 });
  }
}
