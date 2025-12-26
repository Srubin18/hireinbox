// app/api/whatsapp/notify/route.ts
// WhatsApp Notification API for HireInbox
//
// Phase 1: Quick Win - Notify recruiters via WhatsApp
// - New CV arrivals
// - Shortlist summaries
// - Daily/weekly digests
//
// Usage:
//   POST /api/whatsapp/notify
//   {
//     "type": "new_cv" | "shortlist_summary" | "custom",
//     "recipientPhone": "+27821234567",
//     "data": { ... }
//   }

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  sendWhatsAppMessage,
  normalizePhoneNumber,
  isValidPhoneNumber,
  MESSAGES,
} from '@/lib/whatsapp';

// ============================================
// TYPES
// ============================================

interface NotifyRequest {
  type: 'new_cv' | 'shortlist_summary' | 'daily_digest' | 'custom';
  recipientPhone: string;
  data?: {
    // For new_cv
    candidateName?: string;
    candidateEmail?: string;
    roleName?: string;
    score?: number;
    recommendation?: string;

    // For shortlist_summary
    shortlistCount?: number;

    // For daily_digest
    newApplications?: number;
    shortlisted?: number;
    rejected?: number;

    // For custom
    message?: string;
  };
  companyId?: string;
}

// ============================================
// NOTIFICATION TEMPLATES
// ============================================

function formatNewCVMessage(data: NotifyRequest['data']): string {
  const candidateName = data?.candidateName || 'New Candidate';
  const roleName = data?.roleName || 'Open Position';
  const score = data?.score ?? 0;
  const recommendation = data?.recommendation || 'REVIEW';

  let emoji = '';
  if (recommendation === 'SHORTLIST') emoji = '';
  else if (recommendation === 'CONSIDER') emoji = '';
  else emoji = '';

  return `${emoji} *New Application Received*

*Candidate:* ${candidateName}
*Role:* ${roleName}
*AI Score:* ${score}/100
*Recommendation:* ${recommendation}

${score >= 80
    ? 'This candidate looks strong! Review their full profile in HireInbox.'
    : 'View full assessment in your HireInbox dashboard.'}`;
}

function formatShortlistSummary(data: NotifyRequest['data']): string {
  const count = data?.shortlistCount || 0;
  const roleName = data?.roleName || 'your open positions';

  if (count === 0) {
    return `*Daily Shortlist Update*

No new shortlisted candidates today for ${roleName}.

Check back tomorrow or review your talent pool for potential fits.`;
  }

  return `*Daily Shortlist Update*

${count} new candidate${count !== 1 ? 's' : ''} shortlisted for ${roleName}!

Open HireInbox to:
- Review their CVs
- Schedule interviews
- Send outcomes

Don't keep them waiting - top candidates move fast!`;
}

function formatDailyDigest(data: NotifyRequest['data']): string {
  const newApps = data?.newApplications || 0;
  const shortlisted = data?.shortlisted || 0;
  const rejected = data?.rejected || 0;

  if (newApps === 0 && shortlisted === 0) {
    return `*HireInbox Daily Summary*

No new activity today.

Your inbox is clear - check back tomorrow!`;
  }

  return `*HireInbox Daily Summary*

*Today's Activity:*
- New applications: ${newApps}
- Shortlisted: ${shortlisted}
- Rejected: ${rejected}

${shortlisted > 0
    ? `\nYou have ${shortlisted} candidates ready to contact!`
    : ''}

Open HireInbox to take action.`;
}

// ============================================
// API HANDLER
// ============================================

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  const traceId = Date.now().toString(36);
  console.log(`[${traceId}][WHATSAPP-NOTIFY] Request received`);

  try {
    // Check if WhatsApp is configured
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      console.error(`[${traceId}][WHATSAPP-NOTIFY] Twilio not configured`);
      return NextResponse.json({
        success: false,
        error: 'WhatsApp notifications not configured. Add Twilio credentials to environment.',
      }, { status: 503 });
    }

    // Parse request
    const body: NotifyRequest = await request.json();
    const { type, recipientPhone, data, companyId } = body;

    // Validate required fields
    if (!type) {
      return NextResponse.json({
        success: false,
        error: 'Missing required field: type',
      }, { status: 400 });
    }

    if (!recipientPhone) {
      return NextResponse.json({
        success: false,
        error: 'Missing required field: recipientPhone',
      }, { status: 400 });
    }

    // Validate phone number
    const normalizedPhone = normalizePhoneNumber(recipientPhone);
    if (!isValidPhoneNumber(normalizedPhone)) {
      return NextResponse.json({
        success: false,
        error: `Invalid phone number: ${recipientPhone}`,
      }, { status: 400 });
    }

    // Check opt-out status (respect user preferences)
    const { data: optOut } = await supabase
      .from('whatsapp_optouts')
      .select('id')
      .eq('phone', normalizedPhone)
      .single();

    if (optOut) {
      console.log(`[${traceId}][WHATSAPP-NOTIFY] Recipient opted out: ${normalizedPhone}`);
      return NextResponse.json({
        success: false,
        error: 'Recipient has opted out of WhatsApp notifications',
        optedOut: true,
      }, { status: 400 });
    }

    // Format message based on type
    let message: string;
    switch (type) {
      case 'new_cv':
        message = formatNewCVMessage(data);
        break;
      case 'shortlist_summary':
        message = formatShortlistSummary(data);
        break;
      case 'daily_digest':
        message = formatDailyDigest(data);
        break;
      case 'custom':
        if (!data?.message) {
          return NextResponse.json({
            success: false,
            error: 'Custom notification requires data.message',
          }, { status: 400 });
        }
        message = data.message;
        break;
      default:
        return NextResponse.json({
          success: false,
          error: `Unknown notification type: ${type}`,
        }, { status: 400 });
    }

    // Send the message
    console.log(`[${traceId}][WHATSAPP-NOTIFY] Sending ${type} to ${normalizedPhone}`);
    const result = await sendWhatsAppMessage({
      to: normalizedPhone,
      body: message,
    });

    if (!result.success) {
      console.error(`[${traceId}][WHATSAPP-NOTIFY] Send failed:`, result.error);
      return NextResponse.json({
        success: false,
        error: result.error,
        errorCode: result.errorCode,
      }, { status: 500 });
    }

    // Log the notification
    try {
      await supabase.from('whatsapp_notifications').insert({
        recipient_phone: normalizedPhone,
        notification_type: type,
        message_id: result.messageId,
        company_id: companyId,
        data: data,
        sent_at: new Date().toISOString(),
      });
    } catch (err) {
      console.warn(`[${traceId}][WHATSAPP-NOTIFY] Failed to log notification:`, err);
    }

    console.log(`[${traceId}][WHATSAPP-NOTIFY] Success: ${result.messageId}`);
    return NextResponse.json({
      success: true,
      messageId: result.messageId,
    });

  } catch (error) {
    console.error(`[${traceId}][WHATSAPP-NOTIFY] Error:`, error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

// ============================================
// GET: Health check / status
// ============================================

export async function GET() {
  const isConfigured = !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN);

  return NextResponse.json({
    service: 'whatsapp-notify',
    status: isConfigured ? 'configured' : 'not_configured',
    twilioNumber: process.env.TWILIO_WHATSAPP_NUMBER || 'not set',
    supportedTypes: ['new_cv', 'shortlist_summary', 'daily_digest', 'custom'],
  });
}
