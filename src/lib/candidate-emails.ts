// ============================================
// HIREINBOX - CANDIDATE EMAIL TEMPLATES
//
// POPIA-compliant email templates for candidate communications.
// All emails must be:
// - Respectful and professional
// - Clear about next steps
// - Include data processing notice
// - Provide support contact
//
// Used by the Hiring Pass System:
// Pass 0: CV Received → cvReceivedEmail
// Pass 2: Shortlisted → shortlistedEmail
// Pass 6: Not Successful → notSuccessfulEmail
// Pass 7: Talent Pool → talentPoolInviteEmail
// ============================================

import { BRAND, POPIA_CONFIG } from './guardrails';

export interface CandidateEmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface CandidateEmailData {
  candidateName: string;
  roleTitle: string;
  companyName: string;
  nextSteps?: string;
  timeline?: string;
}

// Common email footer
const getEmailFooter = (includeUnsubscribe = false): string => `
<div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
  <p><strong>${BRAND.name}</strong> — ${BRAND.tagline}</p>
  <p>
    Your data is processed in accordance with POPIA.
    <a href="${BRAND.privacyUrl}" style="color: #4F46E5;">Privacy Policy</a> |
    <a href="${BRAND.termsUrl}" style="color: #4F46E5;">Terms of Service</a>
  </p>
  <p>Questions? Contact us at <a href="mailto:${BRAND.supportEmail}" style="color: #4F46E5;">${BRAND.supportEmail}</a></p>
  ${includeUnsubscribe ? '<p><a href="{{unsubscribe_url}}" style="color: #64748b;">Unsubscribe from these emails</a></p>' : ''}
</div>
`;

// Pass 0: CV Received Acknowledgement
export function cvReceivedEmail(data: CandidateEmailData): CandidateEmailTemplate {
  const subject = `Thank you for applying - ${data.roleTitle} at ${data.companyName}`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #0f172a; max-width: 600px; margin: 0 auto; padding: 24px;">
  <div style="text-align: center; margin-bottom: 32px;">
    <h1 style="color: #4F46E5; font-size: 24px; margin: 0;">${BRAND.name}</h1>
  </div>

  <p>Dear ${data.candidateName},</p>

  <p>Thank you for applying for the <strong>${data.roleTitle}</strong> position at <strong>${data.companyName}</strong>.</p>

  <p>We have received your application and it is currently being reviewed. Here's what happens next:</p>

  <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 24px 0;">
    <h3 style="margin: 0 0 12px; color: #0f172a; font-size: 16px;">Next Steps</h3>
    <ol style="margin: 0; padding-left: 20px; color: #475569;">
      <li>Your CV is being reviewed against the role requirements</li>
      <li>Shortlisted candidates will be contacted within ${data.timeline || '5-7 working days'}</li>
      <li>You will receive an update regardless of the outcome</li>
    </ol>
  </div>

  <p>We appreciate your interest and the time you took to apply.</p>

  <p>Best regards,<br>The ${data.companyName} Hiring Team</p>

  ${getEmailFooter()}
</body>
</html>
  `;

  const text = `Dear ${data.candidateName},

Thank you for applying for the ${data.roleTitle} position at ${data.companyName}.

We have received your application and it is currently being reviewed.

Next Steps:
1. Your CV is being reviewed against the role requirements
2. Shortlisted candidates will be contacted within ${data.timeline || '5-7 working days'}
3. You will receive an update regardless of the outcome

We appreciate your interest and the time you took to apply.

Best regards,
The ${data.companyName} Hiring Team

---
${BRAND.name} — ${BRAND.tagline}
Questions? Contact us at ${BRAND.supportEmail}`;

  return { subject, html, text };
}

// Pass 2: Shortlisted
export function shortlistedEmail(data: CandidateEmailData & { interviewDetails?: string }): CandidateEmailTemplate {
  const subject = `Great news! You've been shortlisted - ${data.roleTitle}`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #0f172a; max-width: 600px; margin: 0 auto; padding: 24px;">
  <div style="text-align: center; margin-bottom: 32px;">
    <h1 style="color: #4F46E5; font-size: 24px; margin: 0;">${BRAND.name}</h1>
  </div>

  <p>Dear ${data.candidateName},</p>

  <p>We are pleased to inform you that you have been <strong>shortlisted</strong> for the <strong>${data.roleTitle}</strong> position at <strong>${data.companyName}</strong>.</p>

  <div style="background-color: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 20px; margin: 24px 0;">
    <h3 style="margin: 0 0 12px; color: #166534; font-size: 16px;">✓ You're Moving Forward</h3>
    <p style="margin: 0; color: #166534;">
      ${data.nextSteps || 'The hiring team will be in touch soon with next steps regarding the interview process.'}
    </p>
  </div>

  <p>Congratulations on making it to this stage. We look forward to speaking with you.</p>

  <p>Best regards,<br>The ${data.companyName} Hiring Team</p>

  ${getEmailFooter()}
</body>
</html>
  `;

  const text = `Dear ${data.candidateName},

Great news! You have been shortlisted for the ${data.roleTitle} position at ${data.companyName}.

${data.nextSteps || 'The hiring team will be in touch soon with next steps regarding the interview process.'}

Congratulations on making it to this stage. We look forward to speaking with you.

Best regards,
The ${data.companyName} Hiring Team

---
${BRAND.name} — ${BRAND.tagline}
Questions? Contact us at ${BRAND.supportEmail}`;

  return { subject, html, text };
}

// Pass 6: Not Successful (respectful, no "rejected" language)
export function notSuccessfulEmail(data: CandidateEmailData & { inviteTalentPool?: boolean }): CandidateEmailTemplate {
  const subject = `Update on your application - ${data.roleTitle}`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #0f172a; max-width: 600px; margin: 0 auto; padding: 24px;">
  <div style="text-align: center; margin-bottom: 32px;">
    <h1 style="color: #4F46E5; font-size: 24px; margin: 0;">${BRAND.name}</h1>
  </div>

  <p>Dear ${data.candidateName},</p>

  <p>Thank you for taking the time to apply for the <strong>${data.roleTitle}</strong> position at <strong>${data.companyName}</strong>.</p>

  <p>After careful consideration, we have decided not to progress with your application at this time. This was a competitive process with many qualified candidates, and the decision was not easy.</p>

  <p>We genuinely appreciate your interest in joining our team and the effort you put into your application.</p>

  ${data.inviteTalentPool ? `
  <div style="background-color: #faf5ff; border: 1px solid #e9d5ff; border-radius: 8px; padding: 20px; margin: 24px 0;">
    <h3 style="margin: 0 0 12px; color: #7c3aed; font-size: 16px;">Join Our Talent Pool</h3>
    <p style="margin: 0 0 16px; color: #6b21a8;">We'd love to keep you in mind for future opportunities.</p>
    <a href="{{talent_pool_url}}" style="display: inline-block; padding: 12px 24px; background-color: #7c3aed; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">Join Talent Pool</a>
  </div>
  ` : ''}

  <p>We wish you the very best in your career journey.</p>

  <p>Best regards,<br>The ${data.companyName} Hiring Team</p>

  ${getEmailFooter()}
</body>
</html>
  `;

  const text = `Dear ${data.candidateName},

Thank you for taking the time to apply for the ${data.roleTitle} position at ${data.companyName}.

After careful consideration, we have decided not to progress with your application at this time. This was a competitive process with many qualified candidates, and the decision was not easy.

We genuinely appreciate your interest in joining our team and the effort you put into your application.

${data.inviteTalentPool ? 'We would love to keep you in mind for future opportunities. Visit {{talent_pool_url}} to join our Talent Pool.' : ''}

We wish you the very best in your career journey.

Best regards,
The ${data.companyName} Hiring Team

---
${BRAND.name} — ${BRAND.tagline}
Questions? Contact us at ${BRAND.supportEmail}`;

  return { subject, html, text };
}

// Pass 7: Talent Pool Invitation
export function talentPoolInviteEmail(data: CandidateEmailData): CandidateEmailTemplate {
  const subject = `Join our Talent Pool - ${data.companyName}`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #0f172a; max-width: 600px; margin: 0 auto; padding: 24px;">
  <div style="text-align: center; margin-bottom: 32px;">
    <h1 style="color: #4F46E5; font-size: 24px; margin: 0;">${BRAND.name}</h1>
  </div>

  <p>Dear ${data.candidateName},</p>

  <p>We'd like to invite you to join our <strong>Talent Pool</strong>.</p>

  <div style="background-color: #faf5ff; border: 1px solid #e9d5ff; border-radius: 8px; padding: 20px; margin: 24px 0;">
    <h3 style="margin: 0 0 12px; color: #7c3aed; font-size: 16px;">What is the Talent Pool?</h3>
    <ul style="margin: 0; padding-left: 20px; color: #6b21a8;">
      <li>Be discoverable by vetted employers</li>
      <li>Get matched to relevant opportunities</li>
      <li>Your contact details stay private until you accept</li>
      <li>Opt-out anytime with one click</li>
    </ul>
  </div>

  <div style="background-color: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 20px; margin: 24px 0;">
    <h3 style="margin: 0 0 12px; color: #166534; font-size: 16px;">Your Data, Your Control (POPIA)</h3>
    <p style="margin: 0; color: #166534;">
      You have full control over your data. We only share your profile (not contact details) with employers who match your preferences. Delete your data anytime.
    </p>
  </div>

  <div style="text-align: center; margin: 32px 0;">
    <a href="{{talent_pool_url}}" style="display: inline-block; padding: 14px 32px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Join Talent Pool</a>
  </div>

  <p style="text-align: center; color: #64748b; font-size: 14px;">
    Not interested? No action needed. This invitation expires in ${POPIA_CONFIG.retention.deletedAccountData} days.
  </p>

  <p>Best regards,<br>The ${BRAND.name} Team</p>

  ${getEmailFooter(true)}
</body>
</html>
  `;

  const text = `Dear ${data.candidateName},

We'd like to invite you to join our Talent Pool.

What is the Talent Pool?
- Be discoverable by vetted employers
- Get matched to relevant opportunities
- Your contact details stay private until you accept
- Opt-out anytime with one click

Your Data, Your Control (POPIA)
You have full control over your data. We only share your profile (not contact details) with employers who match your preferences.

Join here: {{talent_pool_url}}

Not interested? No action needed.

Best regards,
The ${BRAND.name} Team

---
${BRAND.name} — ${BRAND.tagline}
Questions? Contact us at ${BRAND.supportEmail}`;

  return { subject, html, text };
}

// Export all candidate email templates
export const candidateEmailTemplates = {
  cvReceived: cvReceivedEmail,
  shortlisted: shortlistedEmail,
  notSuccessful: notSuccessfulEmail,
  talentPoolInvite: talentPoolInviteEmail,
};
