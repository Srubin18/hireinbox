import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ============================================
// HIREINBOX - AUTOMATION CRON JOB
// /api/automation/run
//
// Runs every 5 minutes via Vercel Cron to:
// 1. Trigger email fetching (CV screening)
// 2. Auto-progress candidates based on AI score
// 3. Send outcome emails (shortlist/rejection)
//
// This creates the "magical" end-to-end automation
// where CVs arrive and candidates automatically
// progress through the hiring funnel.
// ============================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Hiring Pass thresholds
const SHORTLIST_THRESHOLD = 80;  // Score >= 80 → auto-shortlist
const CONSIDER_THRESHOLD = 60;   // Score 60-79 → manual review
// Score < 60 → auto-reject (with polite email)

// Email templates using the candidate-emails lib patterns
const OUTCOME_EMAILS = {
  shortlisted: {
    subject: 'Good news about your application at {company}',
    body: `Dear {name},

Thank you for applying for the {role} position at {company}.

We're pleased to let you know that your application has been shortlisted for further consideration. Our team was impressed by your background and experience.

Next steps:
{next_steps}

If you have any questions, please don't hesitate to reach out.

Best regards,
{company} Hiring Team

---
Powered by HireInbox
`
  },
  notSuccessful: {
    subject: 'Update on your application at {company}',
    body: `Dear {name},

Thank you for taking the time to apply for the {role} position at {company}. We appreciate your interest in joining our team.

After careful consideration of all applications, we regret to inform you that we will not be moving forward with your application at this time. This decision was based on the specific requirements for this role and does not reflect on your overall qualifications.

We encourage you to apply for future positions that match your skills and experience. Your information will be kept on file for 12 months in accordance with POPIA regulations.

We wish you the best in your job search.

Kind regards,
{company} Hiring Team

---
Powered by HireInbox
`
  }
};

interface AutomationResult {
  emailsFetched: number;
  candidatesProgressed: number;
  shortlistEmailsSent: number;
  rejectionEmailsSent: number;
  errors: string[];
}

export async function GET(request: Request) {
  // Verify cron secret for security (Vercel sends this)
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // In development, allow without secret
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const result: AutomationResult = {
    emailsFetched: 0,
    candidatesProgressed: 0,
    shortlistEmailsSent: 0,
    rejectionEmailsSent: 0,
    errors: []
  };

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // ============================================
    // STEP 1: Trigger email fetching for all active roles
    // ============================================
    console.log('[Automation] Step 1: Fetching emails for active roles...');

    const { data: activeRoles, error: rolesError } = await supabase
      .from('roles')
      .select('id, title, company_id')
      .eq('status', 'active');

    if (rolesError) {
      result.errors.push(`Failed to fetch roles: ${rolesError.message}`);
    } else if (activeRoles && activeRoles.length > 0) {
      // Trigger email fetch for each role
      const baseUrl = process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'http://localhost:3000';

      for (const role of activeRoles) {
        try {
          const response = await fetch(`${baseUrl}/api/fetch-emails`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roleId: role.id })
          });

          if (response.ok) {
            const data = await response.json();
            result.emailsFetched += data.processed || 0;
          } else {
            result.errors.push(`Failed to fetch emails for role ${role.id}`);
          }
        } catch (err) {
          result.errors.push(`Error fetching role ${role.id}: ${err}`);
        }
      }
    }

    // ============================================
    // STEP 2: Auto-progress candidates based on AI score
    // ============================================
    console.log('[Automation] Step 2: Auto-progressing candidates...');

    // Find candidates that need progression (screened but not yet progressed)
    // Look for status = 'screened' which is set after AI screening
    const { data: pendingCandidates, error: candidatesError } = await supabase
      .from('candidates')
      .select(`
        id,
        name,
        email,
        ai_score,
        status,
        role_id,
        roles (
          id,
          title,
          company_id
        )
      `)
      .eq('status', 'screened')  // Screened by AI, waiting for progression
      .not('ai_score', 'is', null);

    if (candidatesError) {
      result.errors.push(`Failed to fetch candidates: ${candidatesError.message}`);
    } else if (pendingCandidates && pendingCandidates.length > 0) {
      for (const candidate of pendingCandidates) {
        const role = candidate.roles as any;

        // Auto-progression is ENABLED by default (user requested this)
        // Use hardcoded thresholds until schema is updated
        const shortlistThreshold = SHORTLIST_THRESHOLD;  // 80
        const rejectThreshold = CONSIDER_THRESHOLD;      // 60
        const score = candidate.ai_score || 0;

        let newStatus: string;
        let newHiringPass: number;
        let emailType: 'shortlisted' | 'notSuccessful' | null = null;

        if (score >= shortlistThreshold) {
          // Auto-shortlist
          newStatus = 'shortlisted';
          newHiringPass = 2;  // Pass 2 = Shortlisted
          emailType = 'shortlisted';
        } else if (score < rejectThreshold) {
          // Auto-reject (politely)
          newStatus = 'not_successful';
          newHiringPass = 7;  // Pass 7 = Final (not successful)
          emailType = 'notSuccessful';
        } else {
          // Score in "consider" range - requires manual review
          continue;
        }

        // Update candidate status
        const { error: updateError } = await supabase
          .from('candidates')
          .update({
            status: newStatus
          })
          .eq('id', candidate.id);

        if (updateError) {
          result.errors.push(`Failed to update candidate ${candidate.id}: ${updateError.message}`);
          continue;
        }

        result.candidatesProgressed++;

        // Send outcome email if candidate has email
        if (candidate.email && emailType) {
          try {
            // Get company name from company_id if available
            let companyName = 'the company';
            if (role?.company_id) {
              const { data: company } = await supabase
                .from('companies')
                .select('name')
                .eq('id', role.company_id)
                .single();
              if (company?.name) companyName = company.name;
            }

            await sendOutcomeEmail(
              candidate.email,
              candidate.name || 'Candidate',
              role?.title || 'the position',
              companyName,
              emailType,
              'We will be in touch shortly with next steps.'
            );

            if (emailType === 'shortlisted') {
              result.shortlistEmailsSent++;
            } else {
              result.rejectionEmailsSent++;
            }
          } catch (err) {
            result.errors.push(`Failed to send email to ${candidate.email}: ${err}`);
          }
        }
      }
    }

    // ============================================
    // STEP 3: Send pending outcome emails (if email_queue table exists)
    // ============================================
    console.log('[Automation] Step 3: Checking for pending emails...');

    try {
      const { data: pendingEmails, error: emailsError } = await supabase
        .from('email_queue')
        .select('*')
        .eq('status', 'pending')
        .lt('retry_count', 3)
        .limit(50);

      if (!emailsError && pendingEmails && pendingEmails.length > 0) {
        console.log(`[Automation] Processing ${pendingEmails.length} pending emails...`);
        for (const email of pendingEmails) {
          try {
            const sent = await sendEmail(
              email.to_email,
              email.subject,
              email.body
            );

            if (sent) {
              await supabase
                .from('email_queue')
                .update({ status: 'sent', sent_at: new Date().toISOString() })
                .eq('id', email.id);
            }
          } catch (err) {
            await supabase
              .from('email_queue')
              .update({
                retry_count: (email.retry_count || 0) + 1,
                last_error: String(err)
              })
              .eq('id', email.id);
          }
        }
      } else if (emailsError) {
        // Table might not exist yet - that's OK
        console.log('[Automation] email_queue table not available (run migration to enable)');
      }
    } catch {
      // Ignore email queue errors - table might not exist
    }

    console.log('[Automation] Complete:', result);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...result
    });

  } catch (error) {
    console.error('[Automation] Fatal error:', error);
    return NextResponse.json({
      success: false,
      error: String(error),
      timestamp: new Date().toISOString(),
      ...result
    }, { status: 500 });
  }
}

// Helper: Send outcome email
async function sendOutcomeEmail(
  toEmail: string,
  candidateName: string,
  roleTitle: string,
  companyName: string,
  type: 'shortlisted' | 'notSuccessful',
  nextSteps: string
): Promise<boolean> {
  const template = OUTCOME_EMAILS[type];

  const subject = template.subject
    .replace('{company}', companyName);

  const body = template.body
    .replace(/{name}/g, candidateName)
    .replace(/{role}/g, roleTitle)
    .replace(/{company}/g, companyName)
    .replace(/{next_steps}/g, nextSteps);

  return sendEmail(toEmail, subject, body);
}

// Helper: Send email via Resend or fallback
async function sendEmail(to: string, subject: string, body: string): Promise<boolean> {
  // Use Resend if available
  if (process.env.RESEND_API_KEY) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL || 'HireInbox <noreply@hireinbox.co.za>',
          to: [to],
          subject: subject,
          text: body
        })
      });

      if (response.ok) {
        console.log(`[Email] Sent to ${to}: ${subject}`);
        return true;
      } else {
        const error = await response.text();
        console.error(`[Email] Failed to send to ${to}:`, error);
        return false;
      }
    } catch (err) {
      console.error(`[Email] Error sending to ${to}:`, err);
      return false;
    }
  }

  // Fallback: Log the email (for development)
  console.log(`[Email] Would send to ${to}:`, { subject, body: body.substring(0, 100) + '...' });
  return true;
}

// Allow POST for manual triggers
export async function POST(request: Request) {
  return GET(request);
}
