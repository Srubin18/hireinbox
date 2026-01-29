import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth, isAuthError, requireRateLimit } from '@/lib/api-auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/recruiter/stats - Get dashboard statistics for the recruiter
export async function GET(request: NextRequest) {
  const rateLimitError = requireRateLimit(request, { maxRequests: 100, windowMs: 3600000 });
  if (rateLimitError) return rateLimitError;

  const authResult = await requireAuth(request);
  if (isAuthError(authResult)) return authResult;
  const { user } = authResult;

  try {
    // Fetch all data in parallel
    const [clientsResult, talentResult, commissionsResult] = await Promise.all([
      supabase
        .from('recruiter_clients')
        .select('id, status')
        .eq('recruiter_id', user.id),
      supabase
        .from('recruiter_talent')
        .select('id, status')
        .eq('recruiter_id', user.id),
      supabase
        .from('recruiter_commissions')
        .select('id, status, fee_amount, placement_date')
        .eq('recruiter_id', user.id),
    ]);

    const clients = clientsResult.data || [];
    const talent = talentResult.data || [];
    const commissions = commissionsResult.data || [];

    // Calculate current year stats
    const currentYear = new Date().getFullYear();
    const thisYearCommissions = commissions.filter(c => {
      const year = new Date(c.placement_date).getFullYear();
      return year === currentYear;
    });

    // Calculate stats
    const stats = {
      clients: {
        total: clients.length,
        active: clients.filter(c => c.status === 'active').length,
        paused: clients.filter(c => c.status === 'paused').length,
        inactive: clients.filter(c => c.status === 'inactive').length,
      },
      talent: {
        total: talent.length,
        available: talent.filter(t => t.status === 'available').length,
        interviewing: talent.filter(t => t.status === 'interviewing').length,
        placed: talent.filter(t => t.status === 'placed').length,
        unavailable: talent.filter(t => t.status === 'unavailable').length,
      },
      commissions: {
        total_placements: commissions.length,
        this_year_placements: thisYearCommissions.length,
        pending_amount: commissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + (c.fee_amount || 0), 0),
        invoiced_amount: commissions.filter(c => c.status === 'invoiced').reduce((sum, c) => sum + (c.fee_amount || 0), 0),
        paid_amount: commissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + (c.fee_amount || 0), 0),
        this_year_earned: thisYearCommissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + (c.fee_amount || 0), 0),
      },
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
