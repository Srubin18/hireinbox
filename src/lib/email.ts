// lib/email.ts
// HireInbox World-Class Email System
// "These emails are not notifications — they are part of the product's trust layer."

import nodemailer from 'nodemailer';

// Design System Colors
const COLORS = {
  background: '#FFFFFF',
  primary: '#0F172A',      // Deep charcoal
  secondary: '#64748B',    // Muted slate
  accent: '#10B981',       // Soft green (sparingly)
  brand: '#4F46E5',        // HireInbox purple
  border: '#E2E8F0',
  muted: '#94A3B8',
};

// Create reusable transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// Verify transporter on first use
let transporterVerified = false;
async function verifyTransporter() {
  if (transporterVerified) return true;
  try {
    await transporter.verify();
    transporterVerified = true;
    console.log('Email transporter verified');
    return true;
  } catch (error) {
    console.error('Email transporter verification failed:', error);
    return false;
  }
}

// Base email wrapper - world-class design
function wrapEmail(content: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HireInbox</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td {font-family: Arial, sans-serif !important;}
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: ${COLORS.background}; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: ${COLORS.primary};">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: ${COLORS.background};">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="560" cellspacing="0" cellpadding="0" border="0" style="max-width: 560px; width: 100%;">
          <!-- Logo -->
          <tr>
            <td style="padding-bottom: 32px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="vertical-align: middle; padding-right: 10px;">
                    <div style="width: 32px; height: 32px; background-color: ${COLORS.brand}; border-radius: 8px; display: inline-block;"></div>
                  </td>
                  <td style="vertical-align: middle;">
                    <span style="font-size: 18px; font-weight: 700; letter-spacing: -0.02em;">
                      <span style="color: ${COLORS.primary};">Hire</span><span style="color: ${COLORS.brand};">Inbox</span>
                    </span>
                    <br>
                    <span style="font-size: 11px; color: ${COLORS.secondary};">Less noise. Better hires.</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td>
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top: 40px; border-top: 1px solid ${COLORS.border}; margin-top: 32px;">
              <p style="margin: 0; font-size: 12px; color: ${COLORS.muted}; line-height: 1.5;">
                This message was sent automatically by HireInbox.<br>
                Your data is handled in accordance with POPIA regulations.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * CV RECEIVED EMAIL
 * Purpose: Confirm receipt, reduce anxiety, set expectations, establish credibility
 * Tone: Calm, human, professional, neutral optimism
 * Trigger: AUTOMATIC - sent immediately when CV is processed
 */
export async function sendAcknowledgmentEmail(
  to: string,
  candidateName: string,
  roleTitle: string,
  companyName?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await verifyTransporter();

    const firstName = candidateName?.split(' ')[0] || 'there';

    const content = `
      <p style="margin: 0 0 24px 0; font-size: 16px; color: ${COLORS.primary};">
        Hi ${firstName},
      </p>

      <p style="margin: 0 0 20px 0; font-size: 16px; color: ${COLORS.primary};">
        We've received your application for <strong>${roleTitle}</strong>.
      </p>

      <p style="margin: 0 0 20px 0; font-size: 16px; color: ${COLORS.secondary};">
        Our system reviews every CV carefully against the role requirements. This usually takes a short amount of time, depending on volume.
      </p>

      <p style="margin: 0 0 32px 0; font-size: 16px; color: ${COLORS.primary};">
        <strong>You will hear back from us</strong> — whether the outcome is positive or not.
      </p>

      <p style="margin: 0 0 8px 0; font-size: 16px; color: ${COLORS.secondary};">
        Thanks for taking the time to apply.
      </p>

      <p style="margin: 0; font-size: 16px; color: ${COLORS.primary};">
        The HireInbox Team
      </p>
    `;

    const text = `Hi ${firstName},

We've received your application for ${roleTitle}.

Our system reviews every CV carefully against the role requirements. This usually takes a short amount of time, depending on volume.

You will hear back from us — whether the outcome is positive or not.

Thanks for taking the time to apply.

The HireInbox Team

---
This message was sent automatically by HireInbox.
Your data is handled in accordance with POPIA regulations.`;

    await transporter.sendMail({
      from: `"HireInbox" <${process.env.GMAIL_USER}>`,
      to,
      subject: `We've received your application`,
      text,
      html: wrapEmail(content),
    });

    console.log(`✓ Acknowledgment sent to: ${to}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to send acknowledgment email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * REJECTION EMAIL
 * "The most important email in the system"
 * Purpose: Close the loop, preserve dignity, provide clarity
 * Tone: Direct, kind, calm, never apologetic, never patronising
 * Trigger: MANUAL - from dashboard
 */
export async function sendRejectionEmail(
  to: string,
  candidateName: string,
  roleTitle: string,
  primaryReason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await verifyTransporter();

    const firstName = candidateName?.split(' ')[0] || 'there';

    // Default reason if not provided
    const reason = primaryReason ||
      'candidates whose experience more closely aligns with the specific requirements for this role';

    const content = `
      <p style="margin: 0 0 24px 0; font-size: 16px; color: ${COLORS.primary};">
        Hi ${firstName},
      </p>

      <p style="margin: 0 0 20px 0; font-size: 16px; color: ${COLORS.primary};">
        Thanks for applying for <strong>${roleTitle}</strong>.
      </p>

      <p style="margin: 0 0 20px 0; font-size: 16px; color: ${COLORS.primary};">
        After reviewing your application, we won't be moving forward for this role.
      </p>

      <p style="margin: 0 0 24px 0; font-size: 16px; color: ${COLORS.secondary};">
        For this position, we've decided to proceed with ${reason}.
      </p>

      <p style="margin: 0 0 32px 0; font-size: 16px; color: ${COLORS.secondary};">
        This decision isn't a reflection of your overall ability, and we appreciate the time you took to apply.
      </p>

      <p style="margin: 0 0 8px 0; font-size: 16px; color: ${COLORS.secondary};">
        Wishing you the best in your search,
      </p>

      <p style="margin: 0; font-size: 16px; color: ${COLORS.primary};">
        HireInbox
      </p>
    `;

    const text = `Hi ${firstName},

Thanks for applying for ${roleTitle}.

After reviewing your application, we won't be moving forward for this role.

For this position, we've decided to proceed with ${reason}.

This decision isn't a reflection of your overall ability, and we appreciate the time you took to apply.

Wishing you the best in your search,

HireInbox

---
This message was sent automatically by HireInbox.
Your data is handled in accordance with POPIA regulations.`;

    await transporter.sendMail({
      from: `"HireInbox" <${process.env.GMAIL_USER}>`,
      to,
      subject: `Update on your application`,
      text,
      html: wrapEmail(content),
    });

    console.log(`✓ Rejection email sent to: ${to}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to send rejection email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * SHORTLIST EMAIL
 * Purpose: Notify candidate of positive outcome, set next steps
 * Tone: Professional, warm but not overly excited
 * Trigger: MANUAL - from dashboard
 */
export async function sendShortlistEmail(
  to: string,
  candidateName: string,
  roleTitle: string,
  nextSteps?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await verifyTransporter();

    const firstName = candidateName?.split(' ')[0] || 'there';
    const steps = nextSteps || 'We will be in touch shortly to discuss next steps.';

    const content = `
      <p style="margin: 0 0 24px 0; font-size: 16px; color: ${COLORS.primary};">
        Hi ${firstName},
      </p>

      <p style="margin: 0 0 20px 0; font-size: 16px; color: ${COLORS.primary};">
        Good news — your application for <strong>${roleTitle}</strong> has been shortlisted.
      </p>

      <p style="margin: 0 0 24px 0; font-size: 16px; color: ${COLORS.primary};">
        <strong>Next steps:</strong>
      </p>

      <div style="background-color: #F8FAFC; border-left: 3px solid ${COLORS.accent}; padding: 16px 20px; margin: 0 0 24px 0; border-radius: 0 8px 8px 0;">
        <p style="margin: 0; font-size: 15px; color: ${COLORS.primary};">
          ${steps}
        </p>
      </div>

      <p style="margin: 0 0 32px 0; font-size: 16px; color: ${COLORS.secondary};">
        If you have any questions in the meantime, feel free to reply to this email.
      </p>

      <p style="margin: 0 0 8px 0; font-size: 16px; color: ${COLORS.secondary};">
        We look forward to speaking with you,
      </p>

      <p style="margin: 0; font-size: 16px; color: ${COLORS.primary};">
        HireInbox
      </p>
    `;

    const text = `Hi ${firstName},

Good news — your application for ${roleTitle} has been shortlisted.

Next steps:
${steps}

If you have any questions in the meantime, feel free to reply to this email.

We look forward to speaking with you,

HireInbox

---
This message was sent automatically by HireInbox.
Your data is handled in accordance with POPIA regulations.`;

    await transporter.sendMail({
      from: `"HireInbox" <${process.env.GMAIL_USER}>`,
      to,
      subject: `Good news about your application`,
      text,
      html: wrapEmail(content),
    });

    console.log(`✓ Shortlist notification sent to: ${to}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to send shortlist email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * TALENT POOL EMAIL (CONSIDER outcome)
 * Purpose: Not right for this role, but keep in pool for future
 * Tone: Respectful, forward-looking
 * Trigger: MANUAL - from dashboard
 */
export async function sendTalentPoolEmail(
  to: string,
  candidateName: string,
  roleTitle: string,
  strengths?: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    await verifyTransporter();

    const firstName = candidateName?.split(' ')[0] || 'there';

    // Optional strengths section
    const strengthsSection = strengths && strengths.length > 0 ? `
      <p style="margin: 0 0 12px 0; font-size: 16px; color: ${COLORS.primary};">
        <strong>What stood out:</strong>
      </p>
      <ul style="margin: 0 0 24px 0; padding-left: 20px; color: ${COLORS.secondary};">
        ${strengths.slice(0, 3).map(s => `<li style="margin-bottom: 6px; font-size: 15px;">${s}</li>`).join('')}
      </ul>
    ` : '';

    const content = `
      <p style="margin: 0 0 24px 0; font-size: 16px; color: ${COLORS.primary};">
        Hi ${firstName},
      </p>

      <p style="margin: 0 0 20px 0; font-size: 16px; color: ${COLORS.primary};">
        Thanks for applying for <strong>${roleTitle}</strong>.
      </p>

      <p style="margin: 0 0 20px 0; font-size: 16px; color: ${COLORS.primary};">
        While this particular role isn't the right fit right now, we were impressed by your background.
      </p>

      ${strengthsSection}

      <p style="margin: 0 0 24px 0; font-size: 16px; color: ${COLORS.secondary};">
        We'd like to keep your details on file. If a more suitable opportunity comes up, we'll be in touch.
      </p>

      <p style="margin: 0 0 32px 0; font-size: 16px; color: ${COLORS.secondary};">
        We appreciate your interest and wish you the best.
      </p>

      <p style="margin: 0; font-size: 16px; color: ${COLORS.primary};">
        HireInbox
      </p>
    `;

    const strengthsText = strengths && strengths.length > 0
      ? `\nWhat stood out:\n${strengths.slice(0, 3).map(s => `- ${s}`).join('\n')}\n`
      : '';

    const text = `Hi ${firstName},

Thanks for applying for ${roleTitle}.

While this particular role isn't the right fit right now, we were impressed by your background.
${strengthsText}
We'd like to keep your details on file. If a more suitable opportunity comes up, we'll be in touch.

We appreciate your interest and wish you the best.

HireInbox

---
This message was sent automatically by HireInbox.
Your data is handled in accordance with POPIA regulations.`;

    await transporter.sendMail({
      from: `"HireInbox" <${process.env.GMAIL_USER}>`,
      to,
      subject: `Your application for ${roleTitle}`,
      text,
      html: wrapEmail(content),
    });

    console.log(`✓ Talent pool email sent to: ${to}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to send talent pool email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Generate rejection reason from screening result
 * Returns a human-readable, non-judgmental reason
 */
export function generateRejectionReason(screeningResult: {
  hard_requirements?: {
    not_met?: string[];
    partial?: string[];
  };
  years_experience?: number;
  recommendation_reason?: string;
}, roleRequirements?: {
  min_experience_years?: number;
}): string {
  const notMet = screeningResult?.hard_requirements?.not_met || [];
  const partial = screeningResult?.hard_requirements?.partial || [];

  // Experience gap
  if (roleRequirements?.min_experience_years && screeningResult?.years_experience) {
    const gap = roleRequirements.min_experience_years - screeningResult.years_experience;
    if (gap > 0) {
      return `candidates with ${roleRequirements.min_experience_years}+ years of relevant experience`;
    }
  }

  // Check for specific skill gaps
  const skillGaps = notMet.filter(r =>
    r.toLowerCase().includes('skill') ||
    r.toLowerCase().includes('experience') ||
    r.toLowerCase().includes('qualification')
  );

  if (skillGaps.length > 0) {
    // Extract the requirement name (before the colon)
    const requirement = skillGaps[0].split(':')[0].trim();
    return `candidates whose background more closely matches the ${requirement.toLowerCase()} requirements`;
  }

  // Default
  return 'candidates whose experience more closely aligns with the specific requirements for this role';
}
