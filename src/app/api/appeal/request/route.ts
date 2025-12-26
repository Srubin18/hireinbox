// /api/appeal/request - Create a new appeal request
// Candidates can request human review of AI decisions (POPIA compliance)

import { NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase';
import { Errors, generateTraceId } from '@/lib/api-error';

// Email notification template
const APPEAL_NOTIFICATION_HTML = (data: {
  candidateName: string;
  candidateEmail: string;
  roleTitle: string;
  reason: string;
  appealId: string;
  aiScore?: number;
  aiRecommendation?: string;
}) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <tr>
      <td style="padding: 32px 24px; background-color: #4F46E5;">
        <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 600;">
          Human Review Requested
        </h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 32px 24px;">
        <p style="margin: 0 0 24px; color: #0f172a; font-size: 16px; line-height: 1.6;">
          A candidate has requested human review of their AI screening decision.
        </p>

        <div style="background-color: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding: 8px 0;">
                <span style="color: #64748b; font-size: 13px;">Candidate</span><br>
                <strong style="color: #0f172a; font-size: 15px;">${data.candidateName}</strong>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0;">
                <span style="color: #64748b; font-size: 13px;">Email</span><br>
                <a href="mailto:${data.candidateEmail}" style="color: #4F46E5; font-size: 15px;">${data.candidateEmail}</a>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0;">
                <span style="color: #64748b; font-size: 13px;">Role</span><br>
                <strong style="color: #0f172a; font-size: 15px;">${data.roleTitle}</strong>
              </td>
            </tr>
            ${data.aiScore !== undefined ? `
            <tr>
              <td style="padding: 8px 0;">
                <span style="color: #64748b; font-size: 13px;">AI Score</span><br>
                <strong style="color: #0f172a; font-size: 15px;">${data.aiScore}/100 (${data.aiRecommendation || 'Unknown'})</strong>
              </td>
            </tr>
            ` : ''}
          </table>
        </div>

        ${data.reason ? `
        <div style="margin-bottom: 24px;">
          <p style="margin: 0 0 8px; color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">
            Candidate's Reason
          </p>
          <div style="background-color: #fef3c7; border-left: 3px solid #f59e0b; padding: 16px; border-radius: 0 8px 8px 0;">
            <p style="margin: 0; color: #92400e; font-size: 15px; line-height: 1.6;">
              "${data.reason}"
            </p>
          </div>
        </div>
        ` : ''}

        <div style="background-color: #f0fdf4; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <p style="margin: 0 0 8px; color: #166534; font-size: 14px; font-weight: 600;">
            POPIA Compliance Note
          </p>
          <p style="margin: 0; color: #15803d; font-size: 14px; line-height: 1.5;">
            Under POPIA, candidates have the right to request human review of automated decisions.
            Please review this appeal within 2 business days and document your decision.
          </p>
        </div>

        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://hireinbox.co.za'}/appeals?id=${data.appealId}"
           style="display: inline-block; background-color: #4F46E5; color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">
          Review Appeal
        </a>
      </td>
    </tr>
    <tr>
      <td style="padding: 24px; background-color: #f8fafc; border-top: 1px solid #e2e8f0;">
        <p style="margin: 0; color: #94a3b8; font-size: 13px; text-align: center;">
          Sent by HireInbox | Appeal ID: ${data.appealId}
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
`;

const CANDIDATE_CONFIRMATION_HTML = (data: {
  candidateName: string;
  roleTitle: string;
  appealId: string;
}) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <tr>
      <td style="padding: 32px 24px; background-color: #059669;">
        <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 600;">
          Review Request Received
        </h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 32px 24px;">
        <p style="margin: 0 0 24px; color: #0f172a; font-size: 16px; line-height: 1.6;">
          Hi ${data.candidateName.split(' ')[0]},
        </p>

        <p style="margin: 0 0 24px; color: #0f172a; font-size: 16px; line-height: 1.6;">
          We have received your request for human review of your application for <strong>${data.roleTitle}</strong>.
        </p>

        <div style="background-color: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <p style="margin: 0 0 12px; color: #0f172a; font-size: 15px; font-weight: 600;">
            What happens next?
          </p>
          <ul style="margin: 0; padding-left: 20px; color: #64748b; font-size: 15px; line-height: 1.8;">
            <li>A member of the hiring team will personally review your application</li>
            <li>They will consider any additional context you provided</li>
            <li>You will receive an update within 2 business days</li>
          </ul>
        </div>

        <div style="background-color: #dbeafe; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.5;">
            <strong>Reference:</strong> ${data.appealId}<br>
            Please keep this reference number for your records.
          </p>
        </div>

        <p style="margin: 0; color: #64748b; font-size: 15px; line-height: 1.6;">
          Thank you for your patience.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding: 24px; background-color: #f8fafc; border-top: 1px solid #e2e8f0;">
        <p style="margin: 0; color: #94a3b8; font-size: 13px; text-align: center;">
          Your data is handled in accordance with POPIA regulations.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
`;

export async function POST(request: Request) {
  const traceId = generateTraceId();

  try {
    const supabase = getSupabaseServiceClient();
    const body = await request.json();

    // Validate required fields
    const { candidate_id, candidate_name, candidate_email, role_title, reason } = body;

    if (!candidate_id) {
      return Errors.validation('Missing required field: candidate_id').toResponse();
    }

    if (!candidate_email) {
      return Errors.validation('Missing required field: candidate_email').toResponse();
    }

    // Check if candidate exists
    const { data: candidate, error: candidateError } = await supabase
      .from('candidates')
      .select('id, name, email, score, screening_result, role_id, company_id')
      .eq('id', candidate_id)
      .single();

    if (candidateError || !candidate) {
      console.error(`[${traceId}] Candidate not found:`, candidateError);
      return Errors.notFound('Candidate').toResponse();
    }

    // Check for existing pending appeal
    const { data: existingAppeal } = await supabase
      .from('appeals')
      .select('id, status')
      .eq('candidate_id', candidate_id)
      .eq('status', 'pending')
      .single();

    if (existingAppeal) {
      return NextResponse.json({
        success: false,
        error: 'An appeal is already pending for this candidate',
        appeal: existingAppeal,
        traceId,
      }, { status: 409 });
    }

    // Get role info if available
    let roleInfo = null;
    if (candidate.role_id) {
      const { data: role } = await supabase
        .from('roles')
        .select('id, title, company_id')
        .eq('id', candidate.role_id)
        .single();
      roleInfo = role;
    }

    // Get company info for notification
    let companyInfo = null;
    const companyId = candidate.company_id || roleInfo?.company_id;
    if (companyId) {
      const { data: company } = await supabase
        .from('companies')
        .select('id, name, email')
        .eq('id', companyId)
        .single();
      companyInfo = company;
    }

    // Parse screening result for AI decision info
    let aiScore: number | undefined;
    let aiRecommendation: string | undefined;
    if (candidate.screening_result) {
      const screening = typeof candidate.screening_result === 'string'
        ? JSON.parse(candidate.screening_result)
        : candidate.screening_result;
      aiScore = screening.overall_score || candidate.score;
      aiRecommendation = screening.recommendation;
    } else {
      aiScore = candidate.score ?? undefined;
    }

    // Create appeal record
    const appealData = {
      candidate_id,
      role_id: candidate.role_id,
      company_id: companyId,
      candidate_name: candidate_name || candidate.name,
      candidate_email: candidate_email || candidate.email,
      role_title: role_title || roleInfo?.title || 'Unknown Role',
      reason: reason || 'Candidate requested human review',
      status: 'pending',
      ai_score: aiScore,
      ai_recommendation: aiRecommendation,
      ai_decision_data: candidate.screening_result,
      created_at: new Date().toISOString(),
    };

    const { data: appeal, error: appealError } = await supabase
      .from('appeals')
      .insert(appealData as never)
      .select()
      .single();

    if (appealError) {
      // If table doesn't exist, provide helpful error
      if (appealError.code === '42P01') {
        console.error(`[${traceId}] Appeals table does not exist. Run migration first.`);
        return NextResponse.json({
          error: 'Appeals system not configured. Please run database migration.',
          code: 'DATABASE_ERROR',
          details: 'appeals table not found',
          traceId,
        }, { status: 500 });
      }
      console.error(`[${traceId}] Database error creating appeal:`, appealError);
      return Errors.database('Failed to create appeal', appealError.message, traceId).toResponse();
    }

    // Update candidate record
    await supabase
      .from('candidates')
      .update({
        appeal_requested: true,
        appeal_status: 'pending',
        appeal_id: appeal.id,
      })
      .eq('id', candidate_id);

    // Send email notifications (async, don't block response)
    const sendNotifications = async () => {
      try {
        // Only send if nodemailer is configured
        if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
          console.log(`[${traceId}] Email not configured, skipping notifications`);
          return;
        }

        const nodemailer = await import('nodemailer');
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD,
          },
        });

        // Notify employer
        const employerEmail = companyInfo?.email || process.env.GMAIL_USER;
        if (employerEmail) {
          await transporter.sendMail({
            from: `"HireInbox" <${process.env.GMAIL_USER}>`,
            to: employerEmail,
            subject: `Human Review Requested: ${appealData.candidate_name} for ${appealData.role_title}`,
            html: APPEAL_NOTIFICATION_HTML({
              candidateName: appealData.candidate_name,
              candidateEmail: appealData.candidate_email,
              roleTitle: appealData.role_title,
              reason: appealData.reason,
              appealId: appeal.id,
              aiScore,
              aiRecommendation,
            }),
          });
          console.log(`[${traceId}] Employer notification sent to ${employerEmail}`);
        }

        // Confirm to candidate
        await transporter.sendMail({
          from: `"${companyInfo?.name || 'HireInbox'}" <${process.env.GMAIL_USER}>`,
          to: appealData.candidate_email,
          subject: `Your Review Request Has Been Received - ${appealData.role_title}`,
          html: CANDIDATE_CONFIRMATION_HTML({
            candidateName: appealData.candidate_name,
            roleTitle: appealData.role_title,
            appealId: appeal.id,
          }),
        });
        console.log(`[${traceId}] Candidate confirmation sent to ${appealData.candidate_email}`);

      } catch (emailError) {
        console.error(`[${traceId}] Email notification failed:`, emailError);
        // Don't fail the request if email fails
      }
    };

    // Fire and forget email notifications
    sendNotifications();

    console.log(`[${traceId}] Appeal created: ${appeal.id} for candidate ${candidate_id}`);

    return NextResponse.json({
      success: true,
      appeal,
      message: 'Your request for human review has been submitted. The hiring team has been notified.',
      traceId,
    }, { status: 201 });

  } catch (error) {
    console.error(`[${traceId}] Error creating appeal:`, error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Errors.internal(message, traceId).toResponse();
  }
}

// GET - List appeals (for dashboard)
export async function GET(request: Request) {
  const traceId = generateTraceId();

  try {
    const supabase = getSupabaseServiceClient();
    const { searchParams } = new URL(request.url);

    const status = searchParams.get('status');
    const candidateId = searchParams.get('candidate_id');
    const companyId = searchParams.get('company_id');
    const roleId = searchParams.get('role_id');

    let query = supabase
      .from('appeals')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (candidateId) {
      query = query.eq('candidate_id', candidateId);
    }

    if (companyId) {
      query = query.eq('company_id', companyId);
    }

    if (roleId) {
      query = query.eq('role_id', roleId);
    }

    const { data: appeals, error } = await query;

    if (error) {
      // Handle table not existing gracefully
      if (error.code === '42P01') {
        return NextResponse.json({ appeals: [], traceId });
      }
      console.error(`[${traceId}] Database error fetching appeals:`, error);
      return Errors.database('Failed to fetch appeals', error.message, traceId).toResponse();
    }

    return NextResponse.json({ appeals, traceId });

  } catch (error) {
    console.error(`[${traceId}] Error fetching appeals:`, error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Errors.internal(message, traceId).toResponse();
  }
}
