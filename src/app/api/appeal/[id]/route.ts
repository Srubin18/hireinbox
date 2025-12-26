// /api/appeal/[id] - Get, update, or delete a specific appeal
// Employers use this to review and respond to appeal requests

import { NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase';
import { Errors, generateTraceId } from '@/lib/api-error';

type AppealStatus = 'pending' | 'reviewed' | 'upheld' | 'overturned';

// Email template for outcome notification
const OUTCOME_NOTIFICATION_HTML = (data: {
  candidateName: string;
  roleTitle: string;
  outcome: 'upheld' | 'overturned';
  reviewerNotes?: string;
  nextSteps?: string;
}) => {
  const isOverturned = data.outcome === 'overturned';
  const headerColor = isOverturned ? '#059669' : '#64748b';
  const headerText = isOverturned
    ? 'Good News About Your Application'
    : 'Your Review Request Has Been Completed';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <tr>
      <td style="padding: 32px 24px; background-color: ${headerColor};">
        <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 600;">
          ${headerText}
        </h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 32px 24px;">
        <p style="margin: 0 0 24px; color: #0f172a; font-size: 16px; line-height: 1.6;">
          Hi ${data.candidateName.split(' ')[0]},
        </p>

        <p style="margin: 0 0 24px; color: #0f172a; font-size: 16px; line-height: 1.6;">
          A member of our hiring team has personally reviewed your application for <strong>${data.roleTitle}</strong>.
        </p>

        ${isOverturned ? `
        <div style="background-color: #d1fae5; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <p style="margin: 0 0 8px; color: #065f46; font-size: 16px; font-weight: 600;">
            Decision Updated
          </p>
          <p style="margin: 0; color: #047857; font-size: 15px; line-height: 1.6;">
            After human review, we would like to reconsider your application. The original AI assessment has been overturned.
          </p>
        </div>
        ` : `
        <div style="background-color: #f1f5f9; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <p style="margin: 0 0 8px; color: #475569; font-size: 16px; font-weight: 600;">
            Review Complete
          </p>
          <p style="margin: 0; color: #64748b; font-size: 15px; line-height: 1.6;">
            After careful human review, our team has confirmed the original assessment. While this particular role isn't the right fit, we appreciate you taking the time to apply.
          </p>
        </div>
        `}

        ${data.reviewerNotes ? `
        <div style="margin-bottom: 24px;">
          <p style="margin: 0 0 8px; color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">
            Reviewer's Notes
          </p>
          <div style="background-color: #fafafa; border-left: 3px solid #4F46E5; padding: 16px; border-radius: 0 8px 8px 0;">
            <p style="margin: 0; color: #334155; font-size: 15px; line-height: 1.6;">
              ${data.reviewerNotes}
            </p>
          </div>
        </div>
        ` : ''}

        ${data.nextSteps ? `
        <div style="background-color: #dbeafe; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <p style="margin: 0 0 8px; color: #1e40af; font-size: 14px; font-weight: 600;">
            Next Steps
          </p>
          <p style="margin: 0; color: #1e3a8a; font-size: 15px; line-height: 1.6;">
            ${data.nextSteps}
          </p>
        </div>
        ` : ''}

        <p style="margin: 0; color: #64748b; font-size: 15px; line-height: 1.6;">
          Thank you for your interest and patience throughout this process.
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
};

// GET - Fetch a specific appeal
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const traceId = generateTraceId();

  try {
    const { id } = await params;
    const supabase = getSupabaseServiceClient();

    const { data: appeal, error } = await supabase
      .from('appeals')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return Errors.notFound('Appeal').toResponse();
      }
      console.error(`[${traceId}] Database error fetching appeal:`, error);
      return Errors.database('Failed to fetch appeal', error.message, traceId).toResponse();
    }

    // Fetch associated candidate data
    let candidate = null;
    if (appeal.candidate_id) {
      const { data: candidateData } = await supabase
        .from('candidates')
        .select('id, name, email, score, screening_result, cv_text, status')
        .eq('id', appeal.candidate_id)
        .single();
      candidate = candidateData;
    }

    return NextResponse.json({ appeal, candidate, traceId });

  } catch (error) {
    console.error(`[${traceId}] Error fetching appeal:`, error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Errors.internal(message, traceId).toResponse();
  }
}

// PATCH - Update an appeal (employer review)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const traceId = generateTraceId();

  try {
    const { id } = await params;
    const supabase = getSupabaseServiceClient();
    const body = await request.json();

    // Get current appeal
    const { data: currentAppeal, error: fetchError } = await supabase
      .from('appeals')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !currentAppeal) {
      return Errors.notFound('Appeal').toResponse();
    }

    // Validate status transition
    const validStatuses: AppealStatus[] = ['pending', 'reviewed', 'upheld', 'overturned'];
    if (body.status && !validStatuses.includes(body.status)) {
      return Errors.validation(`Invalid status. Must be one of: ${validStatuses.join(', ')}`).toResponse();
    }

    // Build update data
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    // Only allow certain fields to be updated
    const allowedFields = [
      'status',
      'reviewer_name',
      'reviewer_email',
      'reviewer_notes',
      'outcome',
      'outcome_reason',
      'next_steps',
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // If status is being set to reviewed/upheld/overturned, set reviewed_at
    if (body.status && ['reviewed', 'upheld', 'overturned'].includes(body.status)) {
      updateData.reviewed_at = new Date().toISOString();
    }

    // Update the appeal
    const { data: appeal, error: updateError } = await supabase
      .from('appeals')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error(`[${traceId}] Database error updating appeal:`, updateError);
      return Errors.database('Failed to update appeal', updateError.message, traceId).toResponse();
    }

    // Update candidate record
    if (currentAppeal.candidate_id) {
      const candidateUpdate: Record<string, unknown> = {
        appeal_status: body.status || appeal.status,
      };

      // If appeal is overturned, update candidate status
      if (body.status === 'overturned') {
        candidateUpdate.status = body.new_candidate_status || 'reconsidered';
      }

      await supabase
        .from('candidates')
        .update(candidateUpdate)
        .eq('id', currentAppeal.candidate_id);
    }

    // Send outcome notification to candidate (async)
    if (body.status === 'upheld' || body.status === 'overturned') {
      const sendOutcomeNotification = async () => {
        try {
          if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
            console.log(`[${traceId}] Email not configured, skipping outcome notification`);
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

          const subject = body.status === 'overturned'
            ? `Good News - ${currentAppeal.role_title}`
            : `Update on Your Application - ${currentAppeal.role_title}`;

          await transporter.sendMail({
            from: `"HireInbox" <${process.env.GMAIL_USER}>`,
            to: currentAppeal.candidate_email,
            subject,
            html: OUTCOME_NOTIFICATION_HTML({
              candidateName: currentAppeal.candidate_name,
              roleTitle: currentAppeal.role_title,
              outcome: body.status,
              reviewerNotes: body.reviewer_notes,
              nextSteps: body.next_steps,
            }),
          });

          console.log(`[${traceId}] Outcome notification sent to ${currentAppeal.candidate_email}`);
        } catch (emailError) {
          console.error(`[${traceId}] Outcome notification failed:`, emailError);
        }
      };

      // Fire and forget
      sendOutcomeNotification();
    }

    console.log(`[${traceId}] Appeal ${id} updated to status: ${body.status || appeal.status}`);

    return NextResponse.json({
      success: true,
      appeal,
      message: body.status === 'overturned'
        ? 'Appeal approved. The AI decision has been overturned.'
        : body.status === 'upheld'
          ? 'Appeal reviewed. The original decision has been upheld.'
          : 'Appeal updated successfully.',
      traceId,
    });

  } catch (error) {
    console.error(`[${traceId}] Error updating appeal:`, error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Errors.internal(message, traceId).toResponse();
  }
}

// DELETE - Delete an appeal (admin only)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const traceId = generateTraceId();

  try {
    const { id } = await params;
    const supabase = getSupabaseServiceClient();

    // Get the appeal first to update candidate
    const { data: appeal } = await supabase
      .from('appeals')
      .select('candidate_id')
      .eq('id', id)
      .single();

    // Delete the appeal
    const { error } = await supabase
      .from('appeals')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`[${traceId}] Database error deleting appeal:`, error);
      return Errors.database('Failed to delete appeal', error.message, traceId).toResponse();
    }

    // Update candidate record if exists
    if (appeal?.candidate_id) {
      await supabase
        .from('candidates')
        .update({
          appeal_requested: false,
          appeal_status: null,
          appeal_id: null,
        })
        .eq('id', appeal.candidate_id);
    }

    return NextResponse.json({ success: true, traceId });

  } catch (error) {
    console.error(`[${traceId}] Error deleting appeal:`, error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Errors.internal(message, traceId).toResponse();
  }
}
