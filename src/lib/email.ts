// lib/email.ts
// Complete email utilities for HireInbox

import nodemailer from 'nodemailer';

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

/**
 * Send acknowledgment email to candidate when their CV is received
 * AUTOMATIC - triggered when CV is processed
 */
export async function sendAcknowledgmentEmail(
  to: string,
  candidateName: string,
  roleTitle: string,
  companyName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await verifyTransporter();
    
    const firstName = candidateName?.split(' ')[0] || 'there';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #f8fafc; border-radius: 12px; padding: 32px; margin-bottom: 24px;">
          <h1 style="margin: 0 0 16px 0; font-size: 24px; color: #0f172a;">Application Received ✓</h1>
          <p style="margin: 0; color: #475569;">Hi ${firstName},</p>
        </div>
        
        <p>Thank you for applying for the <strong>${roleTitle}</strong> position${companyName && companyName !== 'HireInbox' ? ` at ${companyName}` : ''}.</p>
        
        <p>We've received your application and our team is reviewing it. Here's what happens next:</p>
        
        <ul style="color: #475569; padding-left: 20px;">
          <li style="margin-bottom: 8px;">Your CV will be reviewed within the next few business days</li>
          <li style="margin-bottom: 8px;">If you're shortlisted, we'll be in touch to arrange next steps</li>
          <li style="margin-bottom: 8px;">Either way, we'll update you on the outcome</li>
        </ul>
        
        <p style="color: #64748b; font-size: 14px; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
          This is an automated confirmation. Please don't reply to this email.
        </p>
        
        <p style="color: #64748b; font-size: 14px;">
          Best regards,<br>
          The Hiring Team
        </p>
      </body>
      </html>
    `;

    const text = `
Application Received ✓

Hi ${firstName},

Thank you for applying for the ${roleTitle} position${companyName && companyName !== 'HireInbox' ? ` at ${companyName}` : ''}.

We've received your application and our team is reviewing it.

What happens next:
- Your CV will be reviewed within the next few business days
- If you're shortlisted, we'll be in touch to arrange next steps
- Either way, we'll update you on the outcome

This is an automated confirmation. Please don't reply to this email.

Best regards,
The Hiring Team
    `.trim();

    await transporter.sendMail({
      from: `"Hiring Team" <${process.env.GMAIL_USER}>`,
      to,
      subject: `Application Received: ${roleTitle}`,
      text,
      html,
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
 * Send shortlist notification email
 * MANUAL - triggered from dashboard when user clicks "Notify"
 */
export async function sendShortlistEmail(
  to: string,
  candidateName: string,
  roleTitle: string,
  companyName: string,
  nextSteps?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await verifyTransporter();
    
    const firstName = candidateName?.split(' ')[0] || 'there';
    const steps = nextSteps || 'We will contact you shortly to schedule the next stage of our process.';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #ecfdf5, #d1fae5); border-radius: 12px; padding: 32px; margin-bottom: 24px; border: 1px solid rgba(5,150,105,0.2);">
          <h1 style="margin: 0 0 16px 0; font-size: 24px; color: #166534;">Great News! 🎉</h1>
          <p style="margin: 0; color: #166534;">Hi ${firstName},</p>
        </div>
        
        <p>We're pleased to let you know that your application for the <strong>${roleTitle}</strong> position${companyName && companyName !== 'HireInbox' ? ` at ${companyName}` : ''} has been shortlisted.</p>
        
        <p><strong>Next steps:</strong></p>
        <p style="background: #f8fafc; padding: 16px; border-radius: 8px; border-left: 4px solid #4F46E5;">${steps}</p>
        
        <p>If you have any questions, feel free to reply to this email.</p>
        
        <p style="color: #64748b; font-size: 14px; margin-top: 32px;">
          Best regards,<br>
          The Hiring Team
        </p>
      </body>
      </html>
    `;

    const text = `
Great News! 🎉

Hi ${firstName},

We're pleased to let you know that your application for the ${roleTitle} position has been shortlisted.

Next steps:
${steps}

If you have any questions, feel free to reply to this email.

Best regards,
The Hiring Team
    `.trim();

    await transporter.sendMail({
      from: `"Hiring Team" <${process.env.GMAIL_USER}>`,
      to,
      subject: `Great News About Your Application: ${roleTitle}`,
      text,
      html,
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
 * Send rejection email
 * MANUAL - triggered from dashboard when user clicks "Send Outcome"
 * Tone: Kind, respectful, professional
 */
export async function sendRejectionEmail(
  to: string,
  candidateName: string,
  roleTitle: string,
  companyName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await verifyTransporter();
    
    const firstName = candidateName?.split(' ')[0] || 'there';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #f8fafc; border-radius: 12px; padding: 32px; margin-bottom: 24px;">
          <h1 style="margin: 0 0 16px 0; font-size: 24px; color: #0f172a;">Application Update</h1>
          <p style="margin: 0; color: #475569;">Hi ${firstName},</p>
        </div>
        
        <p>Thank you for taking the time to apply for the <strong>${roleTitle}</strong> position${companyName && companyName !== 'HireInbox' ? ` at ${companyName}` : ''}.</p>
        
        <p>After careful consideration, we've decided to move forward with other candidates whose experience more closely matches our current requirements.</p>
        
        <p>This wasn't an easy decision — we received many strong applications. We genuinely appreciate your interest and encourage you to apply for future opportunities that match your skills.</p>
        
        <p>We wish you all the best in your career.</p>
        
        <p style="color: #64748b; font-size: 14px; margin-top: 32px;">
          Kind regards,<br>
          The Hiring Team
        </p>
      </body>
      </html>
    `;

    const text = `
Application Update

Hi ${firstName},

Thank you for taking the time to apply for the ${roleTitle} position.

After careful consideration, we've decided to move forward with other candidates whose experience more closely matches our current requirements.

This wasn't an easy decision — we received many strong applications. We genuinely appreciate your interest and encourage you to apply for future opportunities.

We wish you all the best in your career.

Kind regards,
The Hiring Team
    `.trim();

    await transporter.sendMail({
      from: `"Hiring Team" <${process.env.GMAIL_USER}>`,
      to,
      subject: `Your Application for ${roleTitle}`,
      text,
      html,
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
 * Send talent pool notification
 * MANUAL - triggered when moving candidate to talent pool with notification
 */
export async function sendTalentPoolEmail(
  to: string,
  candidateName: string,
  roleTitle: string,
  companyName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await verifyTransporter();
    
    const firstName = candidateName?.split(' ')[0] || 'there';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #eef2ff, #e0e7ff); border-radius: 12px; padding: 32px; margin-bottom: 24px; border: 1px solid rgba(79,70,229,0.2);">
          <h1 style="margin: 0 0 16px 0; font-size: 24px; color: #4F46E5;">Application Update</h1>
          <p style="margin: 0; color: #4F46E5;">Hi ${firstName},</p>
        </div>
        
        <p>Thank you for your application for the <strong>${roleTitle}</strong> position${companyName && companyName !== 'HireInbox' ? ` at ${companyName}` : ''}.</p>
        
        <p>While this particular role wasn't the right fit, we were impressed by your background and would like to keep your details on file for future opportunities.</p>
        
        <p>We'll reach out if a suitable position opens up that matches your skills and experience.</p>
        
        <p style="color: #64748b; font-size: 14px; margin-top: 32px;">
          Best regards,<br>
          The Hiring Team
        </p>
      </body>
      </html>
    `;

    const text = `
Application Update

Hi ${firstName},

Thank you for your application for the ${roleTitle} position.

While this particular role wasn't the right fit, we were impressed by your background and would like to keep your details on file for future opportunities.

We'll reach out if a suitable position opens up that matches your skills and experience.

Best regards,
The Hiring Team
    `.trim();

    await transporter.sendMail({
      from: `"Hiring Team" <${process.env.GMAIL_USER}>`,
      to,
      subject: `Your Application: ${roleTitle} - Added to Talent Pool`,
      text,
      html,
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