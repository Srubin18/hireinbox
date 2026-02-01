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

    // Use SQL to aggregate by month and type - let the database do the work
    const { data: monthlySummary, error: summaryError } = await supabase.rpc('get_monthly_usage_summary', {
      p_user_id: user.id
    });

    if (summaryError) {
      console.error('[Usage Stats] Error fetching summary:', summaryError);
      return NextResponse.json({ error: 'Failed to fetch usage stats' }, { status: 500 });
    }

    // Transform DB results into the format the frontend expects
    const eventsByMonth: Record<string, { talent_searches: number; roles_created: number }> = {};

    (monthlySummary || []).forEach((row: any) => {
      eventsByMonth[row.event_month] = {
        talent_searches: parseInt(row.talent_searches) || 0,
        roles_created: parseInt(row.roles_created) || 0,
      };
    });

    // Calculate all-time totals from the summary
    const allTimeTalentSearches = (monthlySummary || []).reduce((sum: number, row: any) => sum + (parseInt(row.talent_searches) || 0), 0);
    const allTimeRolesCreated = (monthlySummary || []).reduce((sum: number, row: any) => sum + (parseInt(row.roles_created) || 0), 0);

    // Build monthly history (last 6 months)
    const monthlyHistory: Array<{
      month: string;
      monthLabel: string;
      talentSearches: number;
      rolesCreated: number;
    }> = [];

    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);

      // Format month key manually to avoid timezone issues
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const monthKey = `${year}-${month}`;
      const monthLabel = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

      const monthData = eventsByMonth[monthKey] || { talent_searches: 0, roles_created: 0 };

      monthlyHistory.push({
        month: monthKey,
        monthLabel,
        talentSearches: monthData.talent_searches,
        rolesCreated: monthData.roles_created,
      });
    }

    // Current month stats - format manually to avoid timezone issues
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const currentMonthData = eventsByMonth[currentMonthKey] || { talent_searches: 0, roles_created: 0 };

    return NextResponse.json({
      currentMonth: {
        talentSearches: currentMonthData.talent_searches,
        rolesCreated: currentMonthData.roles_created,
      },
      allTime: {
        talentSearches: allTimeTalentSearches,
        rolesCreated: allTimeRolesCreated,
      },
      monthlyHistory,
    });

  } catch (error) {
    console.error('[Usage Stats] Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
