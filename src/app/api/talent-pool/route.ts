// Talent Pool API
// Save candidates for future opportunities with tags, folders, and search

import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { Errors, generateTraceId } from '@/lib/api-error';

// GET - Fetch talent pool for a company with advanced filtering
export async function GET(request: Request) {
  // Apply rate limiting
  const rateLimited = withRateLimit(request, 'talent-pool-get', RATE_LIMITS.standard);
  if (rateLimited) return rateLimited;

  const traceId = generateTraceId();
  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get('company_id');
  const category = searchParams.get('category');
  const folder = searchParams.get('folder');
  const includeNetwork = searchParams.get('include_network') === 'true';
  const search = searchParams.get('search');
  const tags = searchParams.get('tags'); // comma-separated
  const minScore = searchParams.get('min_score');
  const maxScore = searchParams.get('max_score');
  const dateFrom = searchParams.get('date_from');
  const dateTo = searchParams.get('date_to');
  const candidateId = searchParams.get('candidate_id'); // Check if candidate is in pool
  const getInsights = searchParams.get('insights') === 'true';

  try {
    const supabase = await createServerSupabaseClient();

    // If checking if a specific candidate is in pool
    if (candidateId) {
      const { data: existing } = await supabase
        .from('talent_pool')
        .select('id, folder')
        .eq('candidate_id', candidateId)
        .maybeSingle();

      return NextResponse.json({
        success: true,
        inPool: !!existing,
        poolEntry: existing
      });
    }

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
          education,
          phone,
          location
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

    // Filter by category (legacy)
    if (category) {
      query = query.eq('talent_category', category);
    }

    // Filter by folder
    if (folder) {
      query = query.eq('folder', folder);
    }

    // Filter by tags (using contains for array)
    if (tags) {
      const tagArray = tags.split(',').map(t => t.trim());
      query = query.contains('tags', tagArray);
    }

    // Filter by score range
    if (minScore) {
      query = query.gte('candidates.score', parseInt(minScore));
    }
    if (maxScore) {
      query = query.lte('candidates.score', parseInt(maxScore));
    }

    // Filter by date range
    if (dateFrom) {
      query = query.gte('added_at', dateFrom);
    }
    if (dateTo) {
      query = query.lte('added_at', dateTo);
    }

    const { data, error } = await query.limit(500);

    if (error) {
      console.error(`[${traceId}][TalentPool] Fetch error:`, error);
      return Errors.database('Failed to fetch talent pool', undefined, traceId).toResponse();
    }

    let filteredData = data || [];

    // Text search on name/email (client-side filtering for now)
    if (search && filteredData.length > 0) {
      const searchLower = search.toLowerCase();
      filteredData = filteredData.filter(t =>
        t.candidates?.name?.toLowerCase().includes(searchLower) ||
        t.candidates?.email?.toLowerCase().includes(searchLower) ||
        t.notes?.toLowerCase().includes(searchLower) ||
        t.tags?.some((tag: string) => tag.toLowerCase().includes(searchLower))
      );
    }

    // Calculate insights if requested
    let insights = null;
    if (getInsights && filteredData.length > 0) {
      const allTags: Record<string, number> = {};
      let totalScore = 0;
      let scoreCount = 0;
      const folderCounts: Record<string, number> = {};

      filteredData.forEach(t => {
        // Count tags
        if (t.tags && Array.isArray(t.tags)) {
          t.tags.forEach((tag: string) => {
            allTags[tag] = (allTags[tag] || 0) + 1;
          });
        }
        // Sum scores
        if (t.candidates?.score) {
          totalScore += t.candidates.score;
          scoreCount++;
        }
        // Count folders
        const f = t.folder || 'Uncategorized';
        folderCounts[f] = (folderCounts[f] || 0) + 1;
      });

      // Sort tags by frequency
      const topTags = Object.entries(allTags)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([tag, count]) => ({ tag, count }));

      insights = {
        totalCandidates: filteredData.length,
        averageScore: scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0,
        topTags,
        folderCounts
      };
    }

    return NextResponse.json({
      success: true,
      talent: filteredData,
      count: filteredData.length,
      insights
    });

  } catch (error) {
    console.error(`[${traceId}][TalentPool] Error:`, error);
    return Errors.internal('Failed to fetch talent pool', traceId).toResponse();
  }
}

// POST - Add candidate to talent pool (single or bulk)
export async function POST(request: Request) {
  // Apply rate limiting
  const rateLimited = withRateLimit(request, 'talent-pool-post', RATE_LIMITS.standard);
  if (rateLimited) return rateLimited;

  const traceId = generateTraceId();

  try {
    const body = await request.json();

    // Handle bulk operations
    if (body.action === 'bulk_add_to_role') {
      return handleBulkAddToRole(body);
    }
    if (body.action === 'bulk_email') {
      return handleBulkEmail(body);
    }
    if (body.action === 'export_csv') {
      return handleExportCSV(body);
    }

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
      notes,
      tags = [],
      folder = 'Hot Leads'
    } = body;

    if (!company_id || !candidate_id) {
      return Errors.validation('company_id and candidate_id are required').toResponse();
    }

    const supabase = await createServerSupabaseClient();

    // Check if already in pool
    const { data: existing } = await supabase
      .from('talent_pool')
      .select('id')
      .eq('company_id', company_id)
      .eq('candidate_id', candidate_id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: 'Candidate already in talent pool', existing_id: existing.id },
        { status: 409 }
      );
    }

    // Add to pool with new fields
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
        notes,
        tags,
        folder,
        status: 'active'
      })
      .select()
      .single();

    if (error) {
      console.error(`[${traceId}][TalentPool] Insert error:`, error);
      return Errors.database('Failed to add candidate to talent pool', undefined, traceId).toResponse();
    }

    console.log(`[${traceId}][TalentPool] Added candidate ${candidate_id} to pool for company ${company_id}`);

    return NextResponse.json({
      success: true,
      talent_pool_id: data.id,
      message: 'Candidate added to talent pool'
    });

  } catch (error) {
    console.error(`[${traceId}][TalentPool] Error:`, error);
    return Errors.internal('Failed to add to talent pool', traceId).toResponse();
  }
}

// Handle bulk add to role
async function handleBulkAddToRole(body: { candidate_ids: string[]; role_id: string }) {
  const { candidate_ids, role_id } = body;

  if (!candidate_ids?.length || !role_id) {
    return NextResponse.json({ error: 'candidate_ids and role_id required' }, { status: 400 });
  }

  // This would typically add candidates to a new role's screening queue
  // For now, we return success and the caller should handle the role assignment
  return NextResponse.json({
    success: true,
    message: `${candidate_ids.length} candidates queued for role`,
    candidate_ids,
    role_id
  });
}

// Handle bulk email - returns email list for mailto
async function handleBulkEmail(body: { talent_pool_ids: string[] }) {
  const { talent_pool_ids } = body;

  if (!talent_pool_ids?.length) {
    return NextResponse.json({ error: 'talent_pool_ids required' }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('talent_pool')
    .select('candidates(email, name)')
    .in('id', talent_pool_ids);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  interface TalentPoolRow {
    candidates: { email: string; name: string } | null;
  }

  const emails = (data as unknown as TalentPoolRow[])
    .map(t => t.candidates?.email)
    .filter(Boolean);

  return NextResponse.json({
    success: true,
    emails,
    mailto: `mailto:${emails.join(',')}`
  });
}

// Handle CSV export
async function handleExportCSV(body: { talent_pool_ids?: string[]; folder?: string }) {
  const { talent_pool_ids, folder } = body;

  const supabase = await createServerSupabaseClient();

  let query = supabase
    .from('talent_pool')
    .select(`
      *,
      candidates (name, email, phone, score, experience_years, education, location),
      roles (title)
    `)
    .eq('status', 'active');

  if (talent_pool_ids?.length) {
    query = query.in('id', talent_pool_ids);
  }
  if (folder) {
    query = query.eq('folder', folder);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Build CSV
  const headers = ['Name', 'Email', 'Phone', 'Score', 'Experience Years', 'Education', 'Location', 'Tags', 'Folder', 'Notes', 'Original Role', 'Added At'];

  interface ExportRow {
    candidates: { name: string; email: string; phone: string; score: number; experience_years: number; education: string; location: string } | null;
    tags: string[] | null;
    folder: string | null;
    notes: string | null;
    roles: { title: string } | null;
    added_at: string | null;
  }

  const rows = (data as ExportRow[]).map(t => [
    t.candidates?.name || '',
    t.candidates?.email || '',
    t.candidates?.phone || '',
    t.candidates?.score?.toString() || '',
    t.candidates?.experience_years?.toString() || '',
    t.candidates?.education || '',
    t.candidates?.location || '',
    (t.tags || []).join('; '),
    t.folder || '',
    t.notes || '',
    t.roles?.title || '',
    t.added_at || ''
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(','))].join('\n');

  return NextResponse.json({
    success: true,
    csv,
    filename: `talent-pool-${new Date().toISOString().split('T')[0]}.csv`
  });
}

// PATCH - Update talent pool entry (toggle sharing, update notes, tags, folder, etc.)
export async function PATCH(request: Request) {
  // Apply rate limiting
  const rateLimited = withRateLimit(request, 'talent-pool-patch', RATE_LIMITS.standard);
  if (rateLimited) return rateLimited;

  const traceId = generateTraceId();

  try {
    const body = await request.json();
    const { id, ids, action, ...updates } = body;

    // Handle bulk folder move
    if (action === 'bulk_move' && ids?.length && updates.folder) {
      const supabase = await createServerSupabaseClient();
      const { error } = await supabase
        .from('talent_pool')
        .update({ folder: updates.folder })
        .in('id', ids);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: `${ids.length} candidates moved to ${updates.folder}`
      });
    }

    // Handle bulk tag add
    if (action === 'bulk_add_tag' && ids?.length && updates.tag) {
      const supabase = await createServerSupabaseClient();

      // Get current tags for all entries
      const { data: entries } = await supabase
        .from('talent_pool')
        .select('id, tags')
        .in('id', ids);

      if (entries) {
        for (const entry of entries) {
          const currentTags = entry.tags || [];
          if (!currentTags.includes(updates.tag)) {
            await supabase
              .from('talent_pool')
              .update({ tags: [...currentTags, updates.tag] })
              .eq('id', entry.id);
          }
        }
      }

      return NextResponse.json({
        success: true,
        message: `Tag "${updates.tag}" added to ${ids.length} candidates`
      });
    }

    // Handle bulk tag remove
    if (action === 'bulk_remove_tag' && ids?.length && updates.tag) {
      const supabase = await createServerSupabaseClient();

      const { data: entries } = await supabase
        .from('talent_pool')
        .select('id, tags')
        .in('id', ids);

      if (entries) {
        for (const entry of entries) {
          const currentTags = (entry.tags || []).filter((t: string) => t !== updates.tag);
          await supabase
            .from('talent_pool')
            .update({ tags: currentTags })
            .eq('id', entry.id);
        }
      }

      return NextResponse.json({
        success: true,
        message: `Tag "${updates.tag}" removed from ${ids.length} candidates`
      });
    }

    if (!id) {
      return Errors.validation('id is required').toResponse();
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
      console.error(`[${traceId}][TalentPool] Update error:`, error);
      return Errors.database('Failed to update talent pool entry', undefined, traceId).toResponse();
    }

    return NextResponse.json({
      success: true,
      updated: data
    });

  } catch (error) {
    console.error(`[${traceId}][TalentPool] Error:`, error);
    return Errors.internal('Failed to update talent pool entry', traceId).toResponse();
  }
}

// DELETE - Remove from talent pool
export async function DELETE(request: Request) {
  // Apply rate limiting
  const rateLimited = withRateLimit(request, 'talent-pool-delete', RATE_LIMITS.standard);
  if (rateLimited) return rateLimited;

  const traceId = generateTraceId();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return Errors.validation('id is required').toResponse();
  }

  try {
    const supabase = await createServerSupabaseClient();

    const { error } = await supabase
      .from('talent_pool')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`[${traceId}][TalentPool] Delete error:`, error);
      return Errors.database('Failed to remove from talent pool', undefined, traceId).toResponse();
    }

    return NextResponse.json({
      success: true,
      message: 'Removed from talent pool'
    });

  } catch (error) {
    console.error(`[${traceId}][TalentPool] Error:`, error);
    return Errors.internal('Failed to remove from talent pool', traceId).toResponse();
  }
}
