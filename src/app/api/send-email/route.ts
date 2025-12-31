import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  sendTemplatedEmail,
  sendShortlistEmail,
  sendRejectionEmail,
  sendTalentPoolEmail,
  sendInterviewInviteEmail,
  generateRejectionReason,
  generateBookingToken,
  generateBookingLinkUrl,
  DEFAULT_TEMPLATES,
  CompanyBranding,
} from '@/lib/email';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Email types that can be sent manually
type EmailType = 'shortlist' | 'rejection' | 'talent_pool' | 'interview_invite' | 'custom';

interface SendEmailRequest {
  candidateId: string;
  emailType: EmailType;
  customSubject?: string;
  customMessage?: string;
  nextSteps?: string;
  rejectionReason?: string;
  strengths?: string[];
}

/**
 * POST /api/send-email
 *
 * Send an email to a candidate based on their status
 * Logs email to email_history table for audit trail
 */
export async function POST(request: NextRequest) {
  try {
    const body: SendEmailRequest = await request.json();
    const { candidateId, emailType, customSubject, customMessage, nextSteps, rejectionReason, strengths } = body;

    if (!candidateId || !emailType) {
      return NextResponse.json(
        { error: 'Missing required fields: candidateId, emailType' },
        { status: 400 }
      );
    }

    // Fetch candidate data
    const { data: candidate, error: candidateError } = await supabase
      .from('candidates')
      .select('*, roles(title, company_id, companies(name, logo_url, primary_color, website))')
      .eq('id', candidateId)
      .single();

    if (candidateError || !candidate) {
      return NextResponse.json(
        { error: 'Candidate not found' },
        { status: 404 }
      );
    }

    if (!candidate.email) {
      return NextResponse.json(
        { error: 'Candidate has no email address' },
        { status: 400 }
      );
    }

    // Build company branding from database
    const company = candidate.roles?.companies;
    const branding: CompanyBranding = {
      name: company?.name || 'HireInbox',
      logoUrl: company?.logo_url,
      primaryColor: company?.primary_color,
      website: company?.website,
    };

    const roleTitle = candidate.roles?.title || 'the position';
    let result;

    switch (emailType) {
      case 'shortlist':
        result = await sendShortlistEmail(
          candidate.email,
          candidate.name,
          roleTitle,
          nextSteps || customMessage || 'We will be in touch shortly to schedule an interview.',
          branding
        );
        break;

      case 'rejection':
        const reason = rejectionReason ||
          (candidate.screening_result ? generateRejectionReason(candidate.screening_result) : undefined);
        result = await sendRejectionEmail(
          candidate.email,
          candidate.name,
          roleTitle,
          reason,
          branding
        );
        break;

      case 'talent_pool':
        // Extract strengths from screening result if not provided
        const candidateStrengths = strengths ||
          candidate.screening_result?.summary?.strengths?.map((s: { label: string }) =>
            typeof s === 'string' ? s : s.label
          ) ||
          candidate.strengths || [];
        result = await sendTalentPoolEmail(
          candidate.email,
          candidate.name,
          roleTitle,
          candidateStrengths,
          branding
        );
        break;

      case 'interview_invite':
        // Generate booking link for interview scheduling
        const token = generateBookingToken();
        const bookingLink = generateBookingLinkUrl(token);

        // Store booking link in database
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

        await supabase.from('booking_links').insert({
          candidate_id: candidateId,
          role_id: candidate.role_id,
          company_id: candidate.company_id,
          token,
          expires_at: expiresAt.toISOString(),
        });

        result = await sendInterviewInviteEmail(
          candidate.email,
          candidate.name,
          roleTitle,
          bookingLink,
          branding
        );
        break;

      case 'custom':
        if (!customSubject || !customMessage) {
          return NextResponse.json(
            { error: 'Custom emails require customSubject and customMessage' },
            { status: 400 }
          );
        }
        // Use the generic templated email with custom content
        result = await sendTemplatedEmail(
          'acknowledgment', // Base template for structure
          candidate.email,
          {
            candidateName: candidate.name,
            roleTitle,
            companyName: branding.name,
            customMessage,
          },
          branding,
          {
            id: 'custom',
            type: 'acknowledgment',
            subject: customSubject,
            bodyHtml: `
              <p style="margin: 0 0 24px 0; font-size: 16px; color: #0F172A;">
                Hi {{candidateFirstName}},
              </p>
              <p style="margin: 0 0 20px 0; font-size: 16px; color: #0F172A;">
                {{customMessage}}
              </p>
              <p style="margin: 0 0 8px 0; font-size: 16px; color: #64748B;">
                Best regards,
              </p>
              <p style="margin: 0; font-size: 16px; color: #0F172A; font-weight: 500;">
                The {{companyName}} Hiring Team
              </p>
            `,
            bodyText: `Hi {{candidateFirstName}},\n\n{{customMessage}}\n\nBest regards,\nThe {{companyName}} Hiring Team`,
            isDefault: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        );
        break;

      default:
        return NextResponse.json(
          { error: `Unknown email type: ${emailType}` },
          { status: 400 }
        );
    }

    // Log email to history
    const emailLog = {
      candidate_id: candidateId,
      email_type: emailType,
      subject: customSubject || DEFAULT_TEMPLATES[emailType as keyof typeof DEFAULT_TEMPLATES]?.subject || 'Email',
      recipient: candidate.email,
      sent_at: new Date().toISOString(),
      success: result.success,
      message_id: result.messageId,
      error: result.error,
      metadata: {
        role_title: roleTitle,
        company_name: branding.name,
        custom_message: customMessage,
      },
    };

    // Try to insert into email_history table (may not exist yet)
    const { error: logError } = await supabase
      .from('email_history')
      .insert(emailLog);

    if (logError) {
      console.warn('[SEND-EMAIL] Failed to log email to history:', logError.message);
      // Don't fail the request if logging fails
    }

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          logged: !logError,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      recipient: candidate.email,
      emailType,
      logged: !logError,
    });

  } catch (error) {
    console.error('[SEND-EMAIL] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/send-email?candidateId=xxx
 *
 * Get email history for a candidate
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const candidateId = searchParams.get('candidateId');

    if (!candidateId) {
      return NextResponse.json(
        { error: 'Missing candidateId parameter' },
        { status: 400 }
      );
    }

    // Fetch email history
    const { data: history, error } = await supabase
      .from('email_history')
      .select('*')
      .eq('candidate_id', candidateId)
      .order('sent_at', { ascending: false });

    if (error) {
      // Table might not exist yet
      if (error.code === '42P01') {
        return NextResponse.json({
          history: [],
          message: 'Email history table not yet created',
        });
      }
      throw error;
    }

    return NextResponse.json({
      history: history || [],
    });

  } catch (error) {
    console.error('[SEND-EMAIL] GET Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Preview an email template
 * GET /api/send-email/preview?type=shortlist&candidateId=xxx
 */
