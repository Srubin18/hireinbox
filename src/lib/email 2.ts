// lib/email.ts
// HireInbox World-Class Email & Communications System
// Phase 6: Complete communications infrastructure
// "These emails are not notifications - they are part of the product's trust layer."

import nodemailer from 'nodemailer';

// ============================================
// DESIGN SYSTEM
// ============================================

const COLORS = {
  background: '#FFFFFF',
  primary: '#0F172A',      // Deep charcoal
  secondary: '#64748B',    // Muted slate
  accent: '#10B981',       // Soft green (sparingly)
  brand: '#4F46E5',        // HireInbox purple
  border: '#E2E8F0',
  muted: '#94A3B8',
  success: '#059669',
  warning: '#D97706',
  error: '#DC2626',
};

// ============================================
// TYPES
// ============================================

export interface CompanyBranding {
  name: string;
  logoUrl?: string;
  primaryColor?: string;
  website?: string;
  tagline?: string;
  address?: string;
  phone?: string;
}

export interface EmailTemplate {
  id: string;
  type: 'acknowledgment' | 'shortlist' | 'rejection' | 'talent_pool' | 'interview_invite' | 'interview_confirmation' | 'interview_reminder' | 'candidate_feedback';
  subject: string;
  bodyHtml: string;
  bodyText: string;
  isDefault: boolean;
  companyId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InterviewSlot {
  id: string;
  companyId: string;
  roleId: string;
  interviewerId: string;
  interviewerName: string;
  interviewerEmail: string;
  startTime: string; // ISO string
  endTime: string;
  duration: number; // minutes
  location: string; // 'video' | 'phone' | 'in-person'
  meetingLink?: string;
  address?: string;
  isBooked: boolean;
  bookedByCandidate?: string;
  bookedAt?: string;
  notes?: string;
  calendarEventId?: string;
}

export interface BookingLink {
  id: string;
  candidateId: string;
  roleId: string;
  companyId: string;
  token: string;
  expiresAt: string;
  usedAt?: string;
  selectedSlotId?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// ============================================
// TRANSPORTER SETUP
// ============================================

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

let transporterVerified = false;
async function verifyTransporter(): Promise<boolean> {
  if (transporterVerified) return true;
  try {
    await transporter.verify();
    transporterVerified = true;
    console.log('[EMAIL] Transporter verified');
    return true;
  } catch (error) {
    console.error('[EMAIL] Transporter verification failed:', error);
    return false;
  }
}

// ============================================
// EMAIL WRAPPER WITH COMPANY BRANDING
// ============================================

function wrapEmailWithBranding(content: string, branding?: CompanyBranding): string {
  const brandColor = branding?.primaryColor || COLORS.brand;
  const companyName = branding?.name || 'HireInbox';
  const tagline = branding?.tagline || 'Less noise. Better hires.';
  const logoUrl = branding?.logoUrl;

  const logoSection = logoUrl
    ? `<img src="${logoUrl}" alt="${companyName}" style="height: 40px; max-width: 180px; object-fit: contain;" />`
    : `<div style="display: flex; align-items: center; gap: 10px;">
        <div style="width: 32px; height: 32px; background-color: ${brandColor}; border-radius: 8px;"></div>
        <div>
          <span style="font-size: 18px; font-weight: 700; letter-spacing: -0.02em; color: ${COLORS.primary};">
            ${companyName}
          </span>
          <br>
          <span style="font-size: 11px; color: ${COLORS.secondary};">${tagline}</span>
        </div>
      </div>`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${companyName}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td {font-family: Arial, Helvetica, sans-serif !important;}
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: ${COLORS.primary}; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #F8FAFC;">
    <tr>
      <td align="center" style="padding: 48px 20px;">
        <table role="presentation" width="560" cellspacing="0" cellpadding="0" border="0" style="max-width: 560px; width: 100%; background-color: ${COLORS.background}; border-radius: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04);">

          <!-- Header with Logo -->
          <tr>
            <td style="padding: 32px 32px 24px 32px; border-bottom: 1px solid ${COLORS.border};">
              ${logoSection}
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px 32px 32px; background-color: #F8FAFC; border-radius: 0 0 16px 16px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td>
                    <p style="margin: 0 0 8px 0; font-size: 12px; color: ${COLORS.muted};">
                      Sent by <strong>${companyName}</strong> via HireInbox
                    </p>
                    <p style="margin: 0; font-size: 11px; color: ${COLORS.muted}; line-height: 1.5;">
                      Your data is handled in accordance with POPIA regulations.
                      ${branding?.website ? `<br><a href="${branding.website}" style="color: ${brandColor}; text-decoration: none;">${branding.website}</a>` : ''}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>

        <!-- Unsubscribe Link -->
        <table role="presentation" width="560" cellspacing="0" cellpadding="0" border="0" style="max-width: 560px; width: 100%;">
          <tr>
            <td align="center" style="padding: 16px 0;">
              <p style="margin: 0; font-size: 11px; color: ${COLORS.muted};">
                <a href="#" style="color: ${COLORS.muted}; text-decoration: underline;">Unsubscribe</a> from these notifications
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

// ============================================
// TEMPLATE VARIABLE REPLACEMENT
// ============================================

interface TemplateVariables {
  candidateName?: string;
  candidateFirstName?: string;
  candidateEmail?: string;
  roleTitle?: string;
  companyName?: string;
  interviewDate?: string;
  interviewTime?: string;
  interviewDuration?: string;
  interviewLocation?: string;
  interviewerName?: string;
  meetingLink?: string;
  bookingLink?: string;
  feedbackLink?: string;
  nextSteps?: string;
  rejectionReason?: string;
  strengths?: string[];
  customMessage?: string;
}

function replaceTemplateVariables(template: string, variables: TemplateVariables): string {
  let result = template;

  const firstName = variables.candidateFirstName ||
    (variables.candidateName?.split(' ')[0]) ||
    'there';

  const replacements: Record<string, string> = {
    '{{candidateName}}': variables.candidateName || '',
    '{{candidateFirstName}}': firstName,
    '{{candidateEmail}}': variables.candidateEmail || '',
    '{{roleTitle}}': variables.roleTitle || '',
    '{{companyName}}': variables.companyName || '',
    '{{interviewDate}}': variables.interviewDate || '',
    '{{interviewTime}}': variables.interviewTime || '',
    '{{interviewDuration}}': variables.interviewDuration || '',
    '{{interviewLocation}}': variables.interviewLocation || '',
    '{{interviewerName}}': variables.interviewerName || '',
    '{{meetingLink}}': variables.meetingLink || '',
    '{{bookingLink}}': variables.bookingLink || '',
    '{{nextSteps}}': variables.nextSteps || '',
    '{{rejectionReason}}': variables.rejectionReason || '',
    '{{customMessage}}': variables.customMessage || '',
  };

  for (const [key, value] of Object.entries(replacements)) {
    result = result.replace(new RegExp(key, 'g'), value);
  }

  // Handle strengths array
  if (variables.strengths && variables.strengths.length > 0) {
    const strengthsHtml = variables.strengths
      .slice(0, 3)
      .map(s => `<li style="margin-bottom: 6px; font-size: 15px; color: ${COLORS.secondary};">${s}</li>`)
      .join('');
    result = result.replace('{{strengthsList}}', `<ul style="margin: 0 0 24px 0; padding-left: 20px;">${strengthsHtml}</ul>`);

    const strengthsText = variables.strengths.slice(0, 3).map(s => `- ${s}`).join('\n');
    result = result.replace('{{strengthsText}}', strengthsText);
  } else {
    result = result.replace('{{strengthsList}}', '');
    result = result.replace('{{strengthsText}}', '');
  }

  return result;
}

// ============================================
// DEFAULT EMAIL TEMPLATES
// ============================================

export const DEFAULT_TEMPLATES: Record<string, { subject: string; bodyHtml: string; bodyText: string }> = {
  acknowledgment: {
    subject: 'Application Received - {{roleTitle}} at {{companyName}}',
    bodyHtml: `
      <p style="margin: 0 0 24px 0; font-size: 16px; color: ${COLORS.primary};">
        Hi {{candidateFirstName}},
      </p>

      <p style="margin: 0 0 20px 0; font-size: 16px; color: ${COLORS.primary};">
        Thank you for applying for the <strong>{{roleTitle}}</strong> position at <strong>{{companyName}}</strong>.
      </p>

      <p style="margin: 0 0 20px 0; font-size: 16px; color: ${COLORS.secondary};">
        We've received your CV and our team is reviewing it against the role requirements. We use AI-assisted screening to ensure every application gets a fair and thorough review.
      </p>

      <p style="margin: 0 0 32px 0; font-size: 16px; color: ${COLORS.primary};">
        <strong>You will hear back from us</strong> - we respond to every applicant, whether the outcome is positive or not.
      </p>

      <p style="margin: 0 0 8px 0; font-size: 16px; color: ${COLORS.secondary};">
        Thanks for your interest in joining {{companyName}}.
      </p>

      <p style="margin: 0; font-size: 16px; color: ${COLORS.primary}; font-weight: 500;">
        The {{companyName}} Hiring Team
      </p>
    `,
    bodyText: `Hi {{candidateFirstName}},

Thank you for applying for the {{roleTitle}} position at {{companyName}}.

We've received your CV and our team is reviewing it against the role requirements. We use AI-assisted screening to ensure every application gets a fair and thorough review.

You will hear back from us - we respond to every applicant, whether the outcome is positive or not.

Thanks for your interest in joining {{companyName}}.

The {{companyName}} Hiring Team`
  },

  shortlist: {
    subject: 'Good news about your application - {{roleTitle}}',
    bodyHtml: `
      <p style="margin: 0 0 24px 0; font-size: 16px; color: ${COLORS.primary};">
        Hi {{candidateFirstName}},
      </p>

      <p style="margin: 0 0 20px 0; font-size: 16px; color: ${COLORS.primary};">
        Good news - your application for <strong>{{roleTitle}}</strong> has been shortlisted.
      </p>

      <p style="margin: 0 0 16px 0; font-size: 16px; color: ${COLORS.primary};">
        <strong>Next steps:</strong>
      </p>

      <div style="background-color: #F0FDF4; border-left: 3px solid ${COLORS.accent}; padding: 16px 20px; margin: 0 0 24px 0; border-radius: 0 8px 8px 0;">
        <p style="margin: 0; font-size: 15px; color: ${COLORS.primary};">
          {{nextSteps}}
        </p>
      </div>

      <p style="margin: 0 0 32px 0; font-size: 16px; color: ${COLORS.secondary};">
        If you have any questions in the meantime, feel free to reply to this email.
      </p>

      <p style="margin: 0 0 8px 0; font-size: 16px; color: ${COLORS.secondary};">
        We look forward to speaking with you,
      </p>

      <p style="margin: 0; font-size: 16px; color: ${COLORS.primary}; font-weight: 500;">
        The {{companyName}} Hiring Team
      </p>
    `,
    bodyText: `Hi {{candidateFirstName}},

Good news - your application for {{roleTitle}} has been shortlisted.

Next steps:
{{nextSteps}}

If you have any questions in the meantime, feel free to reply to this email.

We look forward to speaking with you,

The {{companyName}} Hiring Team`
  },

  rejection: {
    subject: 'Update on your application - {{roleTitle}}',
    bodyHtml: `
      <p style="margin: 0 0 24px 0; font-size: 16px; color: ${COLORS.primary};">
        Hi {{candidateFirstName}},
      </p>

      <p style="margin: 0 0 20px 0; font-size: 16px; color: ${COLORS.primary};">
        Thanks for applying for <strong>{{roleTitle}}</strong>.
      </p>

      <p style="margin: 0 0 20px 0; font-size: 16px; color: ${COLORS.primary};">
        After reviewing your application, we won't be moving forward for this role.
      </p>

      <p style="margin: 0 0 24px 0; font-size: 16px; color: ${COLORS.secondary};">
        For this position, we've decided to proceed with {{rejectionReason}}.
      </p>

      <p style="margin: 0 0 32px 0; font-size: 16px; color: ${COLORS.secondary};">
        This decision isn't a reflection of your overall ability, and we appreciate the time you took to apply.
      </p>

      <p style="margin: 0 0 8px 0; font-size: 16px; color: ${COLORS.secondary};">
        Wishing you the best in your search,
      </p>

      <p style="margin: 0; font-size: 16px; color: ${COLORS.primary}; font-weight: 500;">
        The {{companyName}} Hiring Team
      </p>
    `,
    bodyText: `Hi {{candidateFirstName}},

Thanks for applying for {{roleTitle}}.

After reviewing your application, we won't be moving forward for this role.

For this position, we've decided to proceed with {{rejectionReason}}.

This decision isn't a reflection of your overall ability, and we appreciate the time you took to apply.

Wishing you the best in your search,

The {{companyName}} Hiring Team`
  },

  talent_pool: {
    subject: 'Your application for {{roleTitle}}',
    bodyHtml: `
      <p style="margin: 0 0 24px 0; font-size: 16px; color: ${COLORS.primary};">
        Hi {{candidateFirstName}},
      </p>

      <p style="margin: 0 0 20px 0; font-size: 16px; color: ${COLORS.primary};">
        Thanks for applying for <strong>{{roleTitle}}</strong>.
      </p>

      <p style="margin: 0 0 20px 0; font-size: 16px; color: ${COLORS.primary};">
        While this particular role isn't the right fit right now, we were impressed by your background.
      </p>

      {{strengthsList}}

      <p style="margin: 0 0 24px 0; font-size: 16px; color: ${COLORS.secondary};">
        We'd like to keep your details on file. If a more suitable opportunity comes up, we'll be in touch.
      </p>

      <p style="margin: 0 0 32px 0; font-size: 16px; color: ${COLORS.secondary};">
        We appreciate your interest and wish you the best.
      </p>

      <p style="margin: 0; font-size: 16px; color: ${COLORS.primary}; font-weight: 500;">
        The {{companyName}} Hiring Team
      </p>
    `,
    bodyText: `Hi {{candidateFirstName}},

Thanks for applying for {{roleTitle}}.

While this particular role isn't the right fit right now, we were impressed by your background.

{{strengthsText}}

We'd like to keep your details on file. If a more suitable opportunity comes up, we'll be in touch.

We appreciate your interest and wish you the best.

The {{companyName}} Hiring Team`
  },

  interview_invite: {
    subject: 'Interview Invitation - {{roleTitle}} at {{companyName}}',
    bodyHtml: `
      <p style="margin: 0 0 24px 0; font-size: 16px; color: ${COLORS.primary};">
        Hi {{candidateFirstName}},
      </p>

      <p style="margin: 0 0 20px 0; font-size: 16px; color: ${COLORS.primary};">
        We'd like to invite you for an interview for the <strong>{{roleTitle}}</strong> position.
      </p>

      <p style="margin: 0 0 24px 0; font-size: 16px; color: ${COLORS.secondary};">
        Please select a time slot that works for you using the link below:
      </p>

      <div style="text-align: center; margin: 0 0 32px 0;">
        <a href="{{bookingLink}}" style="display: inline-block; background-color: ${COLORS.brand}; color: white; font-size: 16px; font-weight: 600; padding: 14px 32px; border-radius: 8px; text-decoration: none;">
          Choose Your Interview Time
        </a>
      </div>

      <p style="margin: 0 0 24px 0; font-size: 14px; color: ${COLORS.muted};">
        This link expires in 7 days. If you need to reschedule after booking, please reply to this email.
      </p>

      <p style="margin: 0 0 8px 0; font-size: 16px; color: ${COLORS.secondary};">
        Looking forward to meeting you,
      </p>

      <p style="margin: 0; font-size: 16px; color: ${COLORS.primary}; font-weight: 500;">
        The {{companyName}} Hiring Team
      </p>
    `,
    bodyText: `Hi {{candidateFirstName}},

We'd like to invite you for an interview for the {{roleTitle}} position.

Please select a time slot that works for you using this link:
{{bookingLink}}

This link expires in 7 days. If you need to reschedule after booking, please reply to this email.

Looking forward to meeting you,

The {{companyName}} Hiring Team`
  },

  interview_confirmation: {
    subject: 'Interview Confirmed - {{roleTitle}} on {{interviewDate}}',
    bodyHtml: `
      <p style="margin: 0 0 24px 0; font-size: 16px; color: ${COLORS.primary};">
        Hi {{candidateFirstName}},
      </p>

      <p style="margin: 0 0 20px 0; font-size: 16px; color: ${COLORS.primary};">
        Your interview for <strong>{{roleTitle}}</strong> has been confirmed.
      </p>

      <div style="background-color: #F8FAFC; border: 1px solid ${COLORS.border}; border-radius: 12px; padding: 24px; margin: 0 0 24px 0;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr>
            <td style="padding: 0 0 12px 0;">
              <p style="margin: 0; font-size: 13px; color: ${COLORS.muted}; text-transform: uppercase; letter-spacing: 0.5px;">Date & Time</p>
              <p style="margin: 4px 0 0 0; font-size: 16px; color: ${COLORS.primary}; font-weight: 600;">
                {{interviewDate}} at {{interviewTime}}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 0 12px 0;">
              <p style="margin: 0; font-size: 13px; color: ${COLORS.muted}; text-transform: uppercase; letter-spacing: 0.5px;">Duration</p>
              <p style="margin: 4px 0 0 0; font-size: 16px; color: ${COLORS.primary};">
                {{interviewDuration}}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 0 12px 0;">
              <p style="margin: 0; font-size: 13px; color: ${COLORS.muted}; text-transform: uppercase; letter-spacing: 0.5px;">Location</p>
              <p style="margin: 4px 0 0 0; font-size: 16px; color: ${COLORS.primary};">
                {{interviewLocation}}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0;">
              <p style="margin: 0; font-size: 13px; color: ${COLORS.muted}; text-transform: uppercase; letter-spacing: 0.5px;">Interviewer</p>
              <p style="margin: 4px 0 0 0; font-size: 16px; color: ${COLORS.primary};">
                {{interviewerName}}
              </p>
            </td>
          </tr>
        </table>
      </div>

      {{#meetingLink}}
      <div style="text-align: center; margin: 0 0 24px 0;">
        <a href="{{meetingLink}}" style="display: inline-block; background-color: ${COLORS.brand}; color: white; font-size: 16px; font-weight: 600; padding: 14px 32px; border-radius: 8px; text-decoration: none;">
          Join Video Call
        </a>
      </div>
      {{/meetingLink}}

      <p style="margin: 0 0 24px 0; font-size: 14px; color: ${COLORS.muted};">
        A calendar invite has been sent to your email. If you need to reschedule, please reply to this email as soon as possible.
      </p>

      <p style="margin: 0 0 8px 0; font-size: 16px; color: ${COLORS.secondary};">
        See you soon,
      </p>

      <p style="margin: 0; font-size: 16px; color: ${COLORS.primary}; font-weight: 500;">
        The {{companyName}} Hiring Team
      </p>
    `,
    bodyText: `Hi {{candidateFirstName}},

Your interview for {{roleTitle}} has been confirmed.

DATE & TIME: {{interviewDate}} at {{interviewTime}}
DURATION: {{interviewDuration}}
LOCATION: {{interviewLocation}}
INTERVIEWER: {{interviewerName}}

{{meetingLink}}

A calendar invite has been sent to your email. If you need to reschedule, please reply to this email as soon as possible.

See you soon,

The {{companyName}} Hiring Team`
  },

  interview_reminder: {
    subject: 'Reminder: Interview Tomorrow - {{roleTitle}}',
    bodyHtml: `
      <p style="margin: 0 0 24px 0; font-size: 16px; color: ${COLORS.primary};">
        Hi {{candidateFirstName}},
      </p>

      <p style="margin: 0 0 20px 0; font-size: 16px; color: ${COLORS.primary};">
        Just a friendly reminder about your interview tomorrow for <strong>{{roleTitle}}</strong>.
      </p>

      <div style="background-color: #FEF3C7; border: 1px solid #F59E0B; border-radius: 12px; padding: 24px; margin: 0 0 24px 0;">
        <p style="margin: 0 0 8px 0; font-size: 18px; color: ${COLORS.primary}; font-weight: 600;">
          {{interviewDate}} at {{interviewTime}}
        </p>
        <p style="margin: 0; font-size: 15px; color: ${COLORS.secondary};">
          {{interviewLocation}} with {{interviewerName}}
        </p>
      </div>

      {{#meetingLink}}
      <div style="text-align: center; margin: 0 0 24px 0;">
        <a href="{{meetingLink}}" style="display: inline-block; background-color: ${COLORS.brand}; color: white; font-size: 16px; font-weight: 600; padding: 14px 32px; border-radius: 8px; text-decoration: none;">
          Join Video Call
        </a>
      </div>
      {{/meetingLink}}

      <p style="margin: 0 0 24px 0; font-size: 14px; color: ${COLORS.muted};">
        If something has come up and you can't make it, please let us know as soon as possible by replying to this email.
      </p>

      <p style="margin: 0 0 8px 0; font-size: 16px; color: ${COLORS.secondary};">
        Good luck!
      </p>

      <p style="margin: 0; font-size: 16px; color: ${COLORS.primary}; font-weight: 500;">
        The {{companyName}} Hiring Team
      </p>
    `,
    bodyText: `Hi {{candidateFirstName}},

Just a friendly reminder about your interview tomorrow for {{roleTitle}}.

{{interviewDate}} at {{interviewTime}}
{{interviewLocation}} with {{interviewerName}}

{{meetingLink}}

If something has come up and you can't make it, please let us know as soon as possible by replying to this email.

Good luck!

The {{companyName}} Hiring Team`
  }
};

// ============================================
// CORE EMAIL SENDING FUNCTIONS
// ============================================

/**
 * Send a templated email with company branding
 */
export async function sendTemplatedEmail(
  templateType: keyof typeof DEFAULT_TEMPLATES,
  to: string,
  variables: TemplateVariables,
  branding?: CompanyBranding,
  customTemplate?: EmailTemplate
): Promise<EmailResult> {
  try {
    await verifyTransporter();

    const template = customTemplate
      ? { subject: customTemplate.subject, bodyHtml: customTemplate.bodyHtml, bodyText: customTemplate.bodyText }
      : DEFAULT_TEMPLATES[templateType];

    if (!template) {
      return { success: false, error: `Unknown template type: ${templateType}` };
    }

    const subject = replaceTemplateVariables(template.subject, variables);
    const bodyHtml = replaceTemplateVariables(template.bodyHtml, variables);
    const bodyText = replaceTemplateVariables(template.bodyText, variables);

    const html = wrapEmailWithBranding(bodyHtml, branding);
    const companyName = branding?.name || variables.companyName || 'HireInbox';

    const result = await transporter.sendMail({
      from: `"${companyName}" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      text: bodyText,
      html,
    });

    console.log(`[EMAIL] Sent ${templateType} to: ${to}`);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error(`[EMAIL] Failed to send ${templateType}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// ============================================
// CONVENIENCE EMAIL FUNCTIONS
// ============================================

/**
 * CV RECEIVED EMAIL
 * Trigger: AUTOMATIC - sent immediately when CV is processed
 */
export async function sendAcknowledgmentEmail(
  to: string,
  candidateName: string,
  roleTitle: string,
  companyName?: string,
  branding?: CompanyBranding
): Promise<EmailResult> {
  return sendTemplatedEmail('acknowledgment', to, {
    candidateName,
    roleTitle,
    companyName: companyName || branding?.name || 'our team',
  }, branding || { name: companyName || 'HireInbox' });
}

/**
 * SHORTLIST EMAIL
 * Trigger: MANUAL - from dashboard
 */
export async function sendShortlistEmail(
  to: string,
  candidateName: string,
  roleTitle: string,
  nextSteps?: string,
  branding?: CompanyBranding
): Promise<EmailResult> {
  return sendTemplatedEmail('shortlist', to, {
    candidateName,
    roleTitle,
    companyName: branding?.name || 'HireInbox',
    nextSteps: nextSteps || 'We will be in touch shortly to discuss next steps.',
  }, branding);
}

/**
 * REJECTION EMAIL
 * Trigger: MANUAL - from dashboard
 */
export async function sendRejectionEmail(
  to: string,
  candidateName: string,
  roleTitle: string,
  primaryReason?: string,
  branding?: CompanyBranding
): Promise<EmailResult> {
  const reason = primaryReason ||
    'candidates whose experience more closely aligns with the specific requirements for this role';

  return sendTemplatedEmail('rejection', to, {
    candidateName,
    roleTitle,
    companyName: branding?.name || 'HireInbox',
    rejectionReason: reason,
  }, branding);
}

/**
 * TALENT POOL EMAIL
 * Trigger: MANUAL - from dashboard
 */
export async function sendTalentPoolEmail(
  to: string,
  candidateName: string,
  roleTitle: string,
  strengths?: string[],
  branding?: CompanyBranding
): Promise<EmailResult> {
  return sendTemplatedEmail('talent_pool', to, {
    candidateName,
    roleTitle,
    companyName: branding?.name || 'HireInbox',
    strengths,
  }, branding);
}

/**
 * INTERVIEW INVITATION EMAIL
 * Trigger: MANUAL - from dashboard
 */
export async function sendInterviewInviteEmail(
  to: string,
  candidateName: string,
  roleTitle: string,
  bookingLink: string,
  branding?: CompanyBranding
): Promise<EmailResult> {
  return sendTemplatedEmail('interview_invite', to, {
    candidateName,
    roleTitle,
    companyName: branding?.name || 'HireInbox',
    bookingLink,
  }, branding);
}

/**
 * INTERVIEW CONFIRMATION EMAIL
 * Trigger: AUTOMATIC - when candidate books a slot
 */
export async function sendInterviewConfirmationEmail(
  to: string,
  candidateName: string,
  roleTitle: string,
  slot: InterviewSlot,
  branding?: CompanyBranding
): Promise<EmailResult> {
  const startDate = new Date(slot.startTime);
  const dateOptions: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  };

  const interviewDate = startDate.toLocaleDateString('en-ZA', dateOptions);
  const interviewTime = startDate.toLocaleTimeString('en-ZA', timeOptions);

  let locationDisplay = slot.location;
  if (slot.location === 'video' && slot.meetingLink) {
    locationDisplay = 'Video Call';
  } else if (slot.location === 'phone') {
    locationDisplay = 'Phone Call';
  } else if (slot.address) {
    locationDisplay = slot.address;
  }

  return sendTemplatedEmail('interview_confirmation', to, {
    candidateName,
    roleTitle,
    companyName: branding?.name || 'HireInbox',
    interviewDate,
    interviewTime,
    interviewDuration: `${slot.duration} minutes`,
    interviewLocation: locationDisplay,
    interviewerName: slot.interviewerName,
    meetingLink: slot.meetingLink,
  }, branding);
}

/**
 * INTERVIEW REMINDER EMAIL
 * Trigger: AUTOMATIC - 24 hours before interview
 */
export async function sendInterviewReminderEmail(
  to: string,
  candidateName: string,
  roleTitle: string,
  slot: InterviewSlot,
  branding?: CompanyBranding
): Promise<EmailResult> {
  const startDate = new Date(slot.startTime);
  const dateOptions: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  };
  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  };

  const interviewDate = startDate.toLocaleDateString('en-ZA', dateOptions);
  const interviewTime = startDate.toLocaleTimeString('en-ZA', timeOptions);

  let locationDisplay = slot.location;
  if (slot.location === 'video') {
    locationDisplay = 'Video Call';
  } else if (slot.location === 'phone') {
    locationDisplay = 'Phone Call';
  }

  return sendTemplatedEmail('interview_reminder', to, {
    candidateName,
    roleTitle,
    companyName: branding?.name || 'HireInbox',
    interviewDate,
    interviewTime,
    interviewLocation: locationDisplay,
    interviewerName: slot.interviewerName,
    meetingLink: slot.meetingLink,
  }, branding);
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Generate rejection reason from screening result
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
    const requirement = skillGaps[0].split(':')[0].trim();
    return `candidates whose background more closely matches the ${requirement.toLowerCase()} requirements`;
  }

  return 'candidates whose experience more closely aligns with the specific requirements for this role';
}

/**
 * Generate a unique booking token
 */
export function generateBookingToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * Generate a booking link URL
 */
export function generateBookingLinkUrl(token: string, baseUrl?: string): string {
  const base = baseUrl || process.env.NEXT_PUBLIC_APP_URL || 'https://hireinbox.co.za';
  return `${base}/book/${token}`;
}

/**
 * Format date for display in emails (South African format)
 */
export function formatEmailDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-ZA', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

/**
 * Format time for display in emails
 */
export function formatEmailTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('en-ZA', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Preview email - returns rendered HTML without sending
 */
export function previewEmail(
  templateType: keyof typeof DEFAULT_TEMPLATES,
  variables: TemplateVariables,
  branding?: CompanyBranding
): { subject: string; html: string; text: string } {
  const template = DEFAULT_TEMPLATES[templateType];

  const subject = replaceTemplateVariables(template.subject, variables);
  const bodyHtml = replaceTemplateVariables(template.bodyHtml, variables);
  const bodyText = replaceTemplateVariables(template.bodyText, variables);
  const html = wrapEmailWithBranding(bodyHtml, branding);

  return { subject, html, text: bodyText };
}
