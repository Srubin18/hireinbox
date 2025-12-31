// ============================================
// HireInbox Email Templates
// Welcome emails and notifications
// ============================================

export interface EmailTemplate {
  subject: string;
  textContent: string;
  htmlContent: string;
}

// Welcome email for employers
export const welcomeEmployerEmail = (userName?: string): EmailTemplate => {
  const greeting = userName ? `Hi ${userName},` : 'Hi there,';

  return {
    subject: 'Welcome to HireInbox - Your AI Recruitment Assistant',
    textContent: `
${greeting}

Welcome to HireInbox! You've just unlocked a smarter way to screen CVs.

YOUR FREE TRIAL INCLUDES:
- 10 free CV screenings
- AI-powered candidate scoring with evidence
- Works directly with your email inbox

GETTING STARTED IN 3 STEPS:

1. Create Your First Role
   Head to your dashboard and click "Create Role" to define the position you're hiring for.

2. Connect Your Email (Optional)
   Let HireInbox automatically screen CVs sent to your inbox. Works with Gmail, Outlook, and more.

3. Start Screening
   Watch as AI analyzes CVs and ranks candidates - with clear reasoning for every decision.

WHY HIREINBOX?
- Evidence-based AI: Every recommendation shows WHY with direct quotes from CVs
- South Africa focused: Understands CA(SA), BCom, and local context
- POPIA compliant: Full audit trail for all AI decisions
- Save hours: Screen 50 CVs in seconds, not days

Need help getting started? Just reply to this email.

Happy hiring!

The HireInbox Team
Cape Town, South Africa

---
You're receiving this because you signed up at hireinbox.co.za
    `.trim(),
    htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to HireInbox</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <tr>
      <td style="padding: 32px; text-align: center; background: linear-gradient(135deg, #4F46E5 0%, #6366F1 100%);">
        <table cellpadding="0" cellspacing="0" style="margin: 0 auto;">
          <tr>
            <td style="padding-right: 10px;">
              <img src="https://hireinbox.co.za/logo.png" alt="HireInbox" width="48" height="48" style="display: block;">
            </td>
            <td>
              <span style="color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: -0.02em;">Hire<span style="color: #A5B4FC;">Inbox</span></span>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Main Content -->
    <tr>
      <td style="padding: 40px 32px;">
        <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: #0f172a; letter-spacing: -0.02em;">
          ${greeting}
        </h1>
        <p style="margin: 0 0 24px; font-size: 16px; color: #475569; line-height: 1.6;">
          Welcome to HireInbox! You've just unlocked a smarter way to screen CVs.
        </p>

        <!-- Free Trial Box -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #EEF2FF; border-radius: 12px; margin-bottom: 24px;">
          <tr>
            <td style="padding: 20px;">
              <p style="margin: 0 0 12px; font-size: 14px; font-weight: 600; color: #4F46E5;">YOUR FREE TRIAL INCLUDES:</p>
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 4px 0; font-size: 14px; color: #374151;">
                    <span style="color: #10B981; margin-right: 8px;">&#10003;</span> 10 free CV screenings
                  </td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-size: 14px; color: #374151;">
                    <span style="color: #10B981; margin-right: 8px;">&#10003;</span> AI-powered candidate scoring with evidence
                  </td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-size: 14px; color: #374151;">
                    <span style="color: #10B981; margin-right: 8px;">&#10003;</span> Works directly with your email inbox
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- Getting Started Steps -->
        <h2 style="margin: 0 0 16px; font-size: 18px; font-weight: 600; color: #0f172a;">Getting Started in 3 Steps</h2>

        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
          <tr>
            <td style="padding: 16px 0; border-bottom: 1px solid #f1f5f9;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width: 36px; vertical-align: top;">
                    <div style="width: 28px; height: 28px; background-color: #4F46E5; border-radius: 50%; color: #ffffff; font-size: 14px; font-weight: 600; text-align: center; line-height: 28px;">1</div>
                  </td>
                  <td>
                    <p style="margin: 0; font-size: 15px; font-weight: 600; color: #0f172a;">Create Your First Role</p>
                    <p style="margin: 4px 0 0; font-size: 14px; color: #64748b;">Define the position you're hiring for</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 16px 0; border-bottom: 1px solid #f1f5f9;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width: 36px; vertical-align: top;">
                    <div style="width: 28px; height: 28px; background-color: #4F46E5; border-radius: 50%; color: #ffffff; font-size: 14px; font-weight: 600; text-align: center; line-height: 28px;">2</div>
                  </td>
                  <td>
                    <p style="margin: 0; font-size: 15px; font-weight: 600; color: #0f172a;">Connect Your Email (Optional)</p>
                    <p style="margin: 4px 0 0; font-size: 14px; color: #64748b;">Let HireInbox automatically screen CVs from your inbox</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 16px 0;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width: 36px; vertical-align: top;">
                    <div style="width: 28px; height: 28px; background-color: #4F46E5; border-radius: 50%; color: #ffffff; font-size: 14px; font-weight: 600; text-align: center; line-height: 28px;">3</div>
                  </td>
                  <td>
                    <p style="margin: 0; font-size: 15px; font-weight: 600; color: #0f172a;">Start Screening</p>
                    <p style="margin: 4px 0 0; font-size: 14px; color: #64748b;">Watch AI analyze and rank candidates with clear reasoning</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- CTA Button -->
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="text-align: center; padding: 8px 0 24px;">
              <a href="https://hireinbox.co.za/dashboard" style="display: inline-block; padding: 14px 32px; background-color: #4F46E5; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; border-radius: 10px;">
                Go to Dashboard
              </a>
            </td>
          </tr>
        </table>

        <!-- Why HireInbox -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border-radius: 12px;">
          <tr>
            <td style="padding: 20px;">
              <p style="margin: 0 0 12px; font-size: 14px; font-weight: 600; color: #0f172a;">Why HireInbox?</p>
              <p style="margin: 0 0 8px; font-size: 14px; color: #475569; line-height: 1.5;">
                <strong>Evidence-based AI:</strong> Every recommendation shows WHY with direct quotes from CVs
              </p>
              <p style="margin: 0 0 8px; font-size: 14px; color: #475569; line-height: 1.5;">
                <strong>South Africa focused:</strong> Understands CA(SA), BCom, and local context
              </p>
              <p style="margin: 0 0 8px; font-size: 14px; color: #475569; line-height: 1.5;">
                <strong>POPIA compliant:</strong> Full audit trail for all AI decisions
              </p>
              <p style="margin: 0; font-size: 14px; color: #475569; line-height: 1.5;">
                <strong>Save hours:</strong> Screen 50 CVs in seconds, not days
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="padding: 24px 32px; background-color: #f8fafc; text-align: center;">
        <p style="margin: 0 0 8px; font-size: 13px; color: #64748b;">
          Need help? Just reply to this email.
        </p>
        <p style="margin: 0; font-size: 12px; color: #94a3b8;">
          HireInbox | Cape Town, South Africa
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim()
  };
};

// Welcome email for job seekers
export const welcomeJobSeekerEmail = (userName?: string): EmailTemplate => {
  const greeting = userName ? `Hi ${userName},` : 'Hi there,';

  return {
    subject: 'Welcome to HireInbox - Get Your Free CV Assessment',
    textContent: `
${greeting}

Welcome to HireInbox! You're about to see your CV through a recruiter's eyes.

YOUR FREE ASSESSMENT INCLUDES:
- Overall CV score (how you compare to other candidates)
- Strengths identified (what makes you stand out)
- Improvement areas (specific tips to boost your score)
- Role suggestions (positions where you'd be a great fit)

HOW IT WORKS:

1. Upload Your CV
   PDF or Word format, max 10MB

2. Get Instant Analysis
   Our AI reviews your CV like a top recruiter would

3. See Your Results
   Detailed breakdown with actionable improvements

Ready to find out how strong your CV really is?

Upload your CV now: https://hireinbox.co.za/upload

Good luck with your job search!

The HireInbox Team
Cape Town, South Africa

---
You're receiving this because you signed up at hireinbox.co.za
    `.trim(),
    htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to HireInbox</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <tr>
      <td style="padding: 32px; text-align: center; background: linear-gradient(135deg, #10B981 0%, #059669 100%);">
        <table cellpadding="0" cellspacing="0" style="margin: 0 auto;">
          <tr>
            <td style="padding-right: 10px;">
              <img src="https://hireinbox.co.za/logo.png" alt="HireInbox" width="48" height="48" style="display: block;">
            </td>
            <td>
              <span style="color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: -0.02em;">Hire<span style="color: #D1FAE5;">Inbox</span></span>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Main Content -->
    <tr>
      <td style="padding: 40px 32px;">
        <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: #0f172a; letter-spacing: -0.02em;">
          ${greeting}
        </h1>
        <p style="margin: 0 0 24px; font-size: 16px; color: #475569; line-height: 1.6;">
          Welcome to HireInbox! You're about to see your CV through a recruiter's eyes.
        </p>

        <!-- Free Assessment Box -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ECFDF5; border-radius: 12px; margin-bottom: 24px;">
          <tr>
            <td style="padding: 20px;">
              <p style="margin: 0 0 12px; font-size: 14px; font-weight: 600; color: #059669;">YOUR FREE ASSESSMENT INCLUDES:</p>
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 4px 0; font-size: 14px; color: #374151;">
                    <span style="color: #10B981; margin-right: 8px;">&#10003;</span> Overall CV score
                  </td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-size: 14px; color: #374151;">
                    <span style="color: #10B981; margin-right: 8px;">&#10003;</span> Strengths identified
                  </td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-size: 14px; color: #374151;">
                    <span style="color: #10B981; margin-right: 8px;">&#10003;</span> Improvement areas with specific tips
                  </td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-size: 14px; color: #374151;">
                    <span style="color: #10B981; margin-right: 8px;">&#10003;</span> Role suggestions
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- How It Works -->
        <h2 style="margin: 0 0 16px; font-size: 18px; font-weight: 600; color: #0f172a;">How It Works</h2>

        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
          <tr>
            <td style="padding: 16px 0; border-bottom: 1px solid #f1f5f9;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width: 36px; vertical-align: top;">
                    <div style="width: 28px; height: 28px; background-color: #10B981; border-radius: 50%; color: #ffffff; font-size: 14px; font-weight: 600; text-align: center; line-height: 28px;">1</div>
                  </td>
                  <td>
                    <p style="margin: 0; font-size: 15px; font-weight: 600; color: #0f172a;">Upload Your CV</p>
                    <p style="margin: 4px 0 0; font-size: 14px; color: #64748b;">PDF or Word format, max 10MB</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 16px 0; border-bottom: 1px solid #f1f5f9;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width: 36px; vertical-align: top;">
                    <div style="width: 28px; height: 28px; background-color: #10B981; border-radius: 50%; color: #ffffff; font-size: 14px; font-weight: 600; text-align: center; line-height: 28px;">2</div>
                  </td>
                  <td>
                    <p style="margin: 0; font-size: 15px; font-weight: 600; color: #0f172a;">Get Instant Analysis</p>
                    <p style="margin: 4px 0 0; font-size: 14px; color: #64748b;">Our AI reviews your CV like a top recruiter would</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 16px 0;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width: 36px; vertical-align: top;">
                    <div style="width: 28px; height: 28px; background-color: #10B981; border-radius: 50%; color: #ffffff; font-size: 14px; font-weight: 600; text-align: center; line-height: 28px;">3</div>
                  </td>
                  <td>
                    <p style="margin: 0; font-size: 15px; font-weight: 600; color: #0f172a;">See Your Results</p>
                    <p style="margin: 4px 0 0; font-size: 14px; color: #64748b;">Detailed breakdown with actionable improvements</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- CTA Button -->
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="text-align: center; padding: 8px 0 24px;">
              <a href="https://hireinbox.co.za/upload" style="display: inline-block; padding: 14px 32px; background-color: #10B981; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; border-radius: 10px;">
                Upload My CV Now
              </a>
            </td>
          </tr>
        </table>

        <p style="margin: 0; font-size: 15px; color: #64748b; text-align: center;">
          Good luck with your job search!
        </p>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="padding: 24px 32px; background-color: #f8fafc; text-align: center;">
        <p style="margin: 0 0 8px; font-size: 13px; color: #64748b;">
          Questions? Just reply to this email.
        </p>
        <p style="margin: 0; font-size: 12px; color: #94a3b8;">
          HireInbox | Cape Town, South Africa
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim()
  };
};

// CV assessment complete notification for job seekers
export const cvAssessmentCompleteEmail = (userName?: string, score?: number): EmailTemplate => {
  const greeting = userName ? `Hi ${userName},` : 'Hi there,';
  const scoreText = score ? `Your CV scored ${score}/100!` : 'Your CV has been analyzed!';

  return {
    subject: `Your CV Assessment is Ready - ${scoreText}`,
    textContent: `
${greeting}

${scoreText}

Your full assessment is ready. Log in to see:
- Detailed score breakdown
- Your top strengths
- Areas for improvement
- Suggested roles for your profile

View your results: https://hireinbox.co.za/upload

Want to improve your score? Our AI has specific recommendations tailored to your CV.

The HireInbox Team
    `.trim(),
    htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your CV Assessment is Ready</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <tr>
      <td style="padding: 32px; text-align: center; background: linear-gradient(135deg, #10B981 0%, #059669 100%);">
        <table cellpadding="0" cellspacing="0" style="margin: 0 auto;">
          <tr>
            <td>
              <span style="color: #ffffff; font-size: 24px; font-weight: 700;">Your Results Are In!</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Main Content -->
    <tr>
      <td style="padding: 40px 32px; text-align: center;">
        <p style="margin: 0 0 16px; font-size: 16px; color: #475569;">
          ${greeting}
        </p>

        ${score ? `
        <div style="width: 120px; height: 120px; margin: 0 auto 24px; background: linear-gradient(135deg, #10B981 0%, #059669 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
          <span style="color: #ffffff; font-size: 36px; font-weight: 700;">${score}</span>
        </div>
        ` : ''}

        <h1 style="margin: 0 0 24px; font-size: 24px; font-weight: 700; color: #0f172a;">
          ${scoreText}
        </h1>

        <a href="https://hireinbox.co.za/upload" style="display: inline-block; padding: 14px 32px; background-color: #10B981; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; border-radius: 10px;">
          View Full Results
        </a>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="padding: 24px 32px; background-color: #f8fafc; text-align: center;">
        <p style="margin: 0; font-size: 12px; color: #94a3b8;">
          HireInbox | Cape Town, South Africa
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim()
  };
};
