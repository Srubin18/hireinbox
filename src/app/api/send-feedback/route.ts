// /api/send-feedback/route.ts
// API endpoint to generate and send candidate feedback emails
// Used from the employer dashboard to send feedback to candidates

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  sendCandidateFeedbackEmail,
  generateFeedbackToken,
  generateFeedbackLinkUrl
} from '@/lib/email';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { candidateId, candidateIds } = body;

    // Support both single and bulk sending
    const idsToProcess = candidateIds || (candidateId ? [candidateId] : []);

    if (!idsToProcess.length) {
      return NextResponse.json(
        { error: 'candidateId or candidateIds is required' },
        { status: 400 }
      );
    }

    const results: Array<{
      candidateId: string;
      success: boolean;
      feedbackUrl?: string;
      error?: string;
    }> = [];

    for (const id of idsToProcess) {
      try {
        // Fetch candidate with role info
        const { data: candidate, error: candidateError } = await supabase
          .from('candidates')
          .select(`
            id,
            name,
            email,
            screening_result,
            feedback_token,
            feedback_sent_at,
            role_id,
            roles (
              id,
              title,
              company_id,
              companies (
                id,
                name
              )
            )
          `)
          .eq('id', id)
          .single();

        if (candidateError || !candidate) {
          results.push({
            candidateId: id,
            success: false,
            error: 'Candidate not found'
          });
          continue;
        }

        // Check if screening result exists
        if (!candidate.screening_result) {
          results.push({
            candidateId: id,
            success: false,
            error: 'No screening data available'
          });
          continue;
        }

        // Check if feedback was already sent
        if (candidate.feedback_sent_at) {
          results.push({
            candidateId: id,
            success: false,
            error: 'Feedback already sent'
          });
          continue;
        }

        // Generate token if not exists
        let token = candidate.feedback_token;
        if (!token) {
          token = generateFeedbackToken();
          await supabase
            .from('candidates')
            .update({ feedback_token: token })
            .eq('id', id);
        }

        // Generate feedback URL
        const feedbackUrl = generateFeedbackLinkUrl(token);

        // Extract role and company info - handle both single object and array from Supabase
        const rolesData = candidate.roles;
        const roleObj = Array.isArray(rolesData) ? rolesData[0] : rolesData;
        const roleTitle = (roleObj as { title?: string })?.title || 'Position';
        const companiesData = (roleObj as { companies?: unknown })?.companies;
        const companyObj = Array.isArray(companiesData) ? companiesData[0] : companiesData;
        const companyName = (companyObj as { name?: string })?.name || 'Company';

        // Send the email
        const emailResult = await sendCandidateFeedbackEmail(
          candidate.email,
          candidate.name,
          roleTitle,
          feedbackUrl,
          { name: companyName }
        );

        if (emailResult.success) {
          // Update candidate with feedback_sent_at
          await supabase
            .from('candidates')
            .update({ feedback_sent_at: new Date().toISOString() })
            .eq('id', id);

          results.push({
            candidateId: id,
            success: true,
            feedbackUrl
          });

          console.log(`[FEEDBACK] Email sent to ${candidate.email} for ${candidate.name}`);
        } else {
          results.push({
            candidateId: id,
            success: false,
            error: emailResult.error || 'Failed to send email'
          });
        }

      } catch (err) {
        results.push({
          candidateId: id,
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error'
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: successCount > 0,
      message: `Sent ${successCount} feedback email(s)${failCount > 0 ? `, ${failCount} failed` : ''}`,
      results
    });

  } catch (error) {
    console.error('[SEND-FEEDBACK] Error:', error);
    return NextResponse.json(
      { error: 'Failed to send feedback', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
