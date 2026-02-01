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
    const searchId = searchParams.get('id');

    // If specific ID requested, return just that search
    if (searchId) {
      const { data: search, error } = await supabase
        .from('pilot_billing_events')
        .select('id, created_at, event_date, related_id, metadata')
        .eq('id', searchId)
        .eq('user_id', user.id)
        .eq('event_type', 'talent_search')
        .single();

      if (error) {
        console.error('[Search History] Error fetching single search:', error);
        return NextResponse.json({ error: 'Search not found' }, { status: 404 });
      }

      const formattedSearch = {
        id: search.id,
        created_at: search.created_at,
        event_date: search.event_date,
        search_prompt: search.metadata?.search_prompt || 'Search',
        role: search.metadata?.role || 'Unknown',
        location: search.metadata?.location || '',
        candidates_found: search.metadata?.candidates_found || 0,
        report_data: search.metadata?.report_data || null,
        is_saved: !!search.related_id,
        saved_report_id: search.related_id,
      };

      return NextResponse.json({ search: formattedSearch });
    }

    // Get all talent search billing events (these contain full search results)
    const { data: searches, error } = await supabase
      .from('pilot_billing_events')
      .select('id, created_at, event_date, related_id, metadata')
      .eq('user_id', user.id)
      .eq('event_type', 'talent_search')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Search History] Error:', error);
      return NextResponse.json({ error: 'Failed to fetch search history' }, { status: 500 });
    }

    // Filter out backfilled records and format the results
    const formattedSearches = (searches || [])
      .filter(s => !s.metadata?.backfilled)
      .map(search => ({
        id: search.id,
        created_at: search.created_at,
        event_date: search.event_date,
        search_prompt: search.metadata?.search_prompt || 'Search',
        role: search.metadata?.role || 'Unknown',
        location: search.metadata?.location || '',
        candidates_found: search.metadata?.candidates_found || 0,
        report_data: search.metadata?.report_data || null,
        is_saved: !!search.related_id, // Has related_id = was saved as a report
        saved_report_id: search.related_id,
      }));

    return NextResponse.json({ searches: formattedSearches });

  } catch (error) {
    console.error('[Search History] Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
