import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/email-settings/queue/clear
 * Clear failed items from queue
 */
export async function POST() {
  try {
    // Try to clear from database
    try {
      await supabase
        .from('email_processing_queue')
        .delete()
        .eq('status', 'failed');
    } catch {
      // Table may not exist
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('[EMAIL-QUEUE-CLEAR] Error:', error);
    return NextResponse.json(
      { error: 'Failed to clear queue' },
      { status: 500 }
    );
  }
}
