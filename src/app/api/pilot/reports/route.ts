import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ============================================
// PILOT REPORTS API
// /api/pilot/reports
// Save and retrieve talent mapping reports for pilot users
// ============================================

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Retrieve reports for a user
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
    const limit = parseInt(searchParams.get('limit') || '20');
    const reportId = searchParams.get('id');

    if (reportId) {
      // Get single report
      const { data, error } = await supabase
        .from('talent_mapping_reports')
        .select('*')
        .eq('id', reportId)
        .eq('user_id', user.id)
        .single();

      if (error) {
        return NextResponse.json({ error: 'Report not found' }, { status: 404 });
      }

      return NextResponse.json({ report: data });
    }

    // Get all reports for user
    const { data, error } = await supabase
      .from('talent_mapping_reports')
      .select('id, created_at, search_prompt, role_parsed, candidate_count, location, industry')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[Reports] Error fetching:', error);
      return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
    }

    return NextResponse.json({ reports: data || [] });

  } catch (error) {
    console.error('[Reports] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Save a new report
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

    const body = await request.json();
    const {
      search_prompt,
      role_parsed,
      location,
      industry,
      report_data,
      candidate_count,
    } = body;

    if (!search_prompt || !report_data) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data: reportData, error: reportError } = await supabase
      .from('talent_mapping_reports')
      .insert({
        user_id: user.id,
        search_prompt,
        role_parsed,
        location,
        industry,
        report_data,
        candidate_count: candidate_count || 0,
      })
      .select()
      .single();

    if (reportError) {
      console.error('[Reports] Error saving:', reportError);
      return NextResponse.json({ error: 'Failed to save report' }, { status: 500 });
    }

    // Insert individual candidates for tracking and feedback
    if (report_data.candidates && Array.isArray(report_data.candidates)) {
      const candidateInserts = report_data.candidates.map((candidate: any) => ({
        report_id: reportData.id,
        user_id: user.id,
        name: candidate.name || 'Unknown',
        current_role: candidate.currentRole,
        company: candidate.company,
        location: candidate.location,
        match_score: candidate.matchScore,
        discovery_method: candidate.discoveryMethod,
        candidate_data: candidate,
        status: 'shortlist',
      }));

      const { error: candidatesError } = await supabase
        .from('talent_mapping_candidates')
        .insert(candidateInserts);

      if (candidatesError) {
        console.error('[Reports] Error saving candidates:', candidatesError);
        // Don't fail the request - report was saved successfully
      }
    }

    return NextResponse.json({ report: reportData, message: 'Report saved successfully' });

  } catch (error) {
    console.error('[Reports] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete a report
export async function DELETE(request: Request) {
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
    const reportId = searchParams.get('id');

    if (!reportId) {
      return NextResponse.json({ error: 'Report ID required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('talent_mapping_reports')
      .delete()
      .eq('id', reportId)
      .eq('user_id', user.id);

    if (error) {
      console.error('[Reports] Error deleting:', error);
      return NextResponse.json({ error: 'Failed to delete report' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Report deleted successfully' });

  } catch (error) {
    console.error('[Reports] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
