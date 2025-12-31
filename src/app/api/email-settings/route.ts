import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Default filters stored in memory (in production, store in database)
let emailFilters = {
  allowedDomains: [] as string[],
  blockedDomains: [] as string[],
  requireAttachment: false,
  maxEmailsPerFetch: 10
};

/**
 * GET /api/email-settings
 * Returns current email configuration and filters
 */
export async function GET() {
  try {
    // Get email account info from environment
    const account = {
      id: 'primary',
      name: 'Primary Inbox',
      email: process.env.GMAIL_USER || '',
      host: 'imap.gmail.com',
      port: 993,
      folder: 'Hireinbox',
      isActive: true,
      lastSyncAt: null as string | null,
      lastSyncStatus: null as string | null,
      emailsProcessed: 0
    };

    // Try to get sync stats from database
    try {
      const { data: syncStats } = await supabase
        .from('email_sync_stats')
        .select('*')
        .eq('account_id', 'primary')
        .order('synced_at', { ascending: false })
        .limit(1)
        .single();

      if (syncStats) {
        account.lastSyncAt = syncStats.synced_at;
        account.lastSyncStatus = syncStats.status;
        account.emailsProcessed = syncStats.total_processed || 0;
      }
    } catch {
      // Table may not exist yet
    }

    // Try to load filters from database
    try {
      const { data: storedFilters } = await supabase
        .from('email_filters')
        .select('*')
        .eq('account_id', 'primary')
        .single();

      if (storedFilters) {
        emailFilters = {
          allowedDomains: storedFilters.allowed_domains || [],
          blockedDomains: storedFilters.blocked_domains || [],
          requireAttachment: storedFilters.require_attachment || false,
          maxEmailsPerFetch: storedFilters.max_emails_per_fetch || 10
        };
      }
    } catch {
      // Use in-memory defaults
    }

    return NextResponse.json({
      account,
      filters: emailFilters
    });

  } catch (error) {
    console.error('[EMAIL-SETTINGS] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to load email settings' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/email-settings
 * Update email filters
 */
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { filters } = body;

    if (filters) {
      emailFilters = {
        allowedDomains: filters.allowedDomains || [],
        blockedDomains: filters.blockedDomains || [],
        requireAttachment: filters.requireAttachment || false,
        maxEmailsPerFetch: Math.min(50, Math.max(1, filters.maxEmailsPerFetch || 10))
      };

      // Try to persist to database
      try {
        await supabase
          .from('email_filters')
          .upsert({
            account_id: 'primary',
            allowed_domains: emailFilters.allowedDomains,
            blocked_domains: emailFilters.blockedDomains,
            require_attachment: emailFilters.requireAttachment,
            max_emails_per_fetch: emailFilters.maxEmailsPerFetch,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'account_id'
          });
      } catch {
        // Table may not exist, settings still saved in memory
      }
    }

    return NextResponse.json({
      success: true,
      filters: emailFilters
    });

  } catch (error) {
    console.error('[EMAIL-SETTINGS] PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to save email settings' },
      { status: 500 }
    );
  }
}

// Export filters for use in fetch-emails route
export function getEmailFilters() {
  return emailFilters;
}
