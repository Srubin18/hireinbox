import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// HireInbox logo as base64 SVG for email embedding
const logoSvg = `
<svg width="140" height="32" viewBox="0 0 140 32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="32" height="32" rx="8" fill="#4F46E5"/>
  <path d="M8 12L16 18L24 12V22C24 22.55 23.55 23 23 23H9C8.45 23 8 22.55 8 22V12Z" fill="white" fill-opacity="0.9"/>
  <path d="M23 9H9C8.45 9 8 9.45 8 10V12L16 18L24 12V10C24 9.45 23.55 9 23 9Z" fill="white"/>
  <circle cx="24" cy="8" r="6" fill="#10B981"/>
  <path d="M21.5 8L23 9.5L26.5 6" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="38" y="22" font-family="Arial, sans-serif" font-size="16" font-weight="800" fill="#0F172A">Hire<tspan fill="#4F46E5">Inbox</tspan></text>
</svg>
`;

const emailHeader = `
  <div style="background: #4f46e5; padding: 24px; text-align: center;">
    <table cellpadding="0" cellspacing="0" border="0" align="center">
      <tr>
        <td style="background: white; border-radius: 8px; padding: 8px 12px;">
          <table cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="vertical-align: middle;">
                <div style="width: 28px; height: 28px; background: #4F46E5; border-radius: 6px; display: inline-block; text-align: center; line-height: 28px;">
                  <span style="color: white; font-size: 14px;">✉</span>
                </div>
              </td>
              <td style="vertical-align: middle; padding-left: 8px;">
                <span style="font-family: Arial, sans-serif; font-weight: 800; font-size: 18px; color: #0F172A;">Hire<span style="color: #4F46E5;">Inbox</span></span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    <p style="color: rgba(255,255,255,0.8); font-size: 12px; margin: 12px 0 0 0; font-family: Arial, sans-serif;">
      Every application reviewed. Every candidate informed.
    </p>
  </div>
`;

const emailFooter = `
  <div style="background: #f1f5f9; padding: 20px; text-align: center; font-family: Arial, sans-serif;">
    <p style="margin: 0 0 8px 0; font-size: 12px; color: #64748b; font-weight: 600;">Powered by HireInbox</p>
    <p style="margin: 0 0 12px 0; font-size: 11px; color: #94a3b8;">Less noise. Better hires.</p>
    <p style="margin: 0; font-size: 10px; color: #94a3b8; line-height: 1.6; max-width: 400px; margin: 0 auto;">
      This email was sent in accordance with the Protection of Personal Information Act (POPIA). 
      Your personal information is processed for recruitment purposes only. 
      To request access, correction, or deletion of your data, reply to this email.
    </p>
  </div>
`;

export async function sendAcknowledgmentEmail(
  toEmail: string,
  candidateName: string,
  roleTitle: string,
  companyName: string = 'HireInbox'
) {
  const mailOptions = {
    from: `"${companyName}" <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: `Application Received - ${roleTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        ${emailHeader}
        <div style="padding: 32px; background: #ffffff;">
          <h2 style="color: #0f172a; font-size: 20px; margin: 0 0 20px 0;">Application Received</h2>
          <p style="font-size: 16px; color: #0f172a; margin-bottom: 20px;">Dear ${candidateName || 'Applicant'},</p>
          <p style="font-size: 16px; color: #475569; line-height: 1.6; margin-bottom: 20px;">
            Thank you for applying for the <strong>${roleTitle}</strong> position.
          </p>
          <p style="font-size: 16px; color: #475569; line-height: 1.6; margin-bottom: 24px;">
            We have received your application and our team is currently reviewing it.
          </p>
          
          <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
            <p style="margin: 0 0 12px 0; color: #0f172a; font-weight: 600;">What happens next?</p>
            <ul style="color: #475569; margin: 0; padding-left: 20px; line-height: 1.8;">
              <li>Your application will be reviewed against the role requirements</li>
              <li>Shortlisted candidates will be contacted within 48 hours</li>
              <li>All applicants will receive a final update on their status</li>
            </ul>
          </div>
          
          <p style="font-size: 14px; color: #64748b; line-height: 1.6; margin-bottom: 24px; padding: 16px; background: #f8fafc; border-left: 3px solid #4f46e5; border-radius: 0 8px 8px 0;">
            Our screening process is designed to fairly assess skills and experience relevant to this role.
          </p>
          
          <p style="font-size: 14px; color: #64748b; margin-bottom: 24px;">
            Please ensure your contact details are up to date in case we need to reach you.
          </p>
          
          <p style="font-size: 16px; color: #475569; margin-bottom: 0;">
            Best regards,<br>
            <strong>The Hiring Team</strong>
          </p>
        </div>
        ${emailFooter}
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Failed to send acknowledgment email:', error);
    return false;
  }
}

export async function sendOutcomeEmail(
  toEmail: string,
  candidateName: string,
  roleTitle: string,
  status: 'shortlist' | 'talent_pool' | 'reject',
  companyName: string = 'HireInbox'
) {
  const subjects = {
    shortlist: `Great News! - ${roleTitle}`,
    talent_pool: `Your Application - ${roleTitle}`,
    reject: `Application Update - ${roleTitle}`,
  };

  const statusColors = {
    shortlist: '#166534',
    talent_pool: '#4f46e5',
    reject: '#64748b',
  };

  const statusHeaders = {
    shortlist: "You've Been Shortlisted!",
    talent_pool: "Added to Talent Pool",
    reject: "Application Update",
  };

  const messages = {
    shortlist: `
      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
        <p style="font-size: 18px; color: #166534; font-weight: 600; margin: 0 0 12px 0;">
          🎉 Congratulations!
        </p>
        <p style="font-size: 16px; color: #166534; margin: 0;">
          You've been shortlisted for the <strong>${roleTitle}</strong> position.
        </p>
      </div>
      <p style="font-size: 16px; color: #475569; line-height: 1.6; margin-bottom: 16px;">
        Your qualifications and experience stood out among the applicants we received.
      </p>
      <p style="font-size: 16px; color: #475569; line-height: 1.6;">
        A member of our team will be in touch within the next <strong>48 hours</strong> to discuss next steps.
      </p>
    `,
    talent_pool: `
      <div style="background: #eef2ff; border: 1px solid #c7d2fe; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
        <p style="font-size: 18px; color: #4f46e5; font-weight: 600; margin: 0 0 12px 0;">
          💼 You're in our Talent Pool
        </p>
        <p style="font-size: 16px; color: #4f46e5; margin: 0;">
          We've saved your profile for future opportunities.
        </p>
      </div>
      <p style="font-size: 16px; color: #475569; line-height: 1.6; margin-bottom: 16px;">
        While we've moved forward with other candidates for the <strong>${roleTitle}</strong> position, we were impressed by your profile.
      </p>
      <p style="font-size: 16px; color: #475569; line-height: 1.6;">
        We'll reach out when a more suitable opportunity arises that matches your skills and experience.
      </p>
    `,
    reject: `
      <p style="font-size: 16px; color: #475569; line-height: 1.6; margin-bottom: 16px;">
        Thank you for your interest in the <strong>${roleTitle}</strong> position.
      </p>
      <p style="font-size: 16px; color: #475569; line-height: 1.6; margin-bottom: 16px;">
        After careful review, we've decided to move forward with candidates whose experience more closely matches our current requirements.
      </p>
      <p style="font-size: 16px; color: #475569; line-height: 1.6;">
        We encourage you to apply for future positions that match your skills and experience. We appreciate the time you took to apply.
      </p>
    `,
  };

  const mailOptions = {
    from: `"${companyName}" <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: subjects[status],
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        ${emailHeader}
        <div style="padding: 32px; background: #ffffff;">
          <h2 style="color: ${statusColors[status]}; font-size: 20px; margin: 0 0 20px 0;">${statusHeaders[status]}</h2>
          <p style="font-size: 16px; color: #0f172a; margin-bottom: 20px;">Dear ${candidateName || 'Applicant'},</p>
          ${messages[status]}
          <p style="font-size: 16px; color: #475569; margin-top: 24px; margin-bottom: 0;">
            Best regards,<br>
            <strong>The Hiring Team</strong>
          </p>
        </div>
        ${emailFooter}
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Failed to send outcome email:', error);
    return false;
  }
}