import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/email-settings/history
 * Returns sync history
 */
export async function GET() {
  try {
    // Try to get sync history from database
    let history: Array<{
      id: string;
      syncedAt: string;
      emailsFound: number;
      emailsProcessed: number;
      emailsSkipped: number;
      emailsFailed: number;
      duration: number;
      errors: string[];
    }> = [];

    try {
      const { data: syncHistory } = await supabase
        .from('email_sync_history')
        .select('*')
        .order('synced_at', { ascending: false })
        .limit(20);

      if (syncHistory) {
        history = syncHistory.map(s => ({
          id: s.id,
          syncedAt: s.synced_at,
          emailsFound: s.emails_found || 0,
          emailsProcessed: s.emails_processed || 0,
          emailsSkipped: s.emails_skipped || 0,
          emailsFailed: s.emails_failed || 0,
          duration: s.duration_seconds || 0,
          errors: s.errors || []
        }));
      }
    } catch {
      // Table may not exist yet - return empty history
    }

    return NextResponse.json({ history });

  } catch (error) {
    console.error('[EMAIL-HISTORY] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to load sync history', history: [] },
      { status: 500 }
    );
  }
}

/**
 * POST /api/email-settings/history
 * Record a new sync event
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Try to save to database
    try {
      await supabase.from('email_sync_history').insert({
        account_id: 'primary',
        synced_at: new Date().toISOString(),
        emails_found: body.emailsFound || 0,
        emails_processed: body.emailsProcessed || 0,
        emails_skipped: body.emailsSkipped || 0,
        emails_failed: body.emailsFailed || 0,
        duration_seconds: body.duration || 0,
        errors: body.errors || []
      });
    } catch {
      // Table may not exist
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('[EMAIL-HISTORY] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to record sync history' },
      { status: 500 }
    );
  }
}
