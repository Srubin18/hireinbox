/**
 * REJECTION EMAIL TEMPLATE GENERATOR
 * 
 * Generates safe, respectful, legally cautious rejection emails.
 * 
 * RULES ENFORCED:
 * - Never infers protected attributes (age, gender, race, health, religion, nationality)
 * - Never states opinions about the candidate as a person
 * - Never implies job offers or guarantees
 * - Never mentions "AI decided"
 * - Uses soft language throughout
 * - Frames all reasons as role-specific, not personal
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TYPES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface ScreeningResult {
  recommendation: string;
  recommendation_reason: string;
  hard_requirements?: {
    met?: string[];
    not_met?: string[];
    partial?: string[];
    unclear?: string[];
  };
  achievement_quality?: {
    score: number;
    evidence: string[];
    assessment: string;
  };
  leadership_signals?: {
    score: number;
    evidence: string[];
    assessment: string;
  };
  summary?: {
    strengths?: string[];
    weaknesses?: string[];
    fit_assessment?: string;
    interview_focus?: string[];
  };
}

interface RejectionEmailInput {
  candidateName: string;
  candidateEmail: string;
  roleTitle: string;
  companyName: string;
  screeningResult: ScreeningResult;
  includeTalentPoolOptIn?: boolean;
}

interface RejectionEmailOutput {
  html: string;
  includesAlternativeSignals: boolean;
  alternativeSignalsReason: string | null;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HELPER: Determine if alternative signals section should be included
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * LOGIC FOR INCLUDING SECTION 2 (Alternative Signals):
 * 
 * Include ONLY if:
 * 1. The candidate has at least 2 documented strengths, AND
 * 2. Achievement quality score >= 60 OR leadership signals score >= 60
 * 
 * This ensures we only suggest alternatives when there's genuine evidence
 * of transferable capability — not as a consolation or generic statement.
 */
function shouldIncludeAlternativeSignals(result: ScreeningResult): {
  include: boolean;
  reason: string | null;
  strengths: string[];
} {
  const strengths = result.summary?.strengths || [];
  const achievementScore = result.achievement_quality?.score || 0;
  const leadershipScore = result.leadership_signals?.score || 0;
  
  const hasMultipleStrengths = strengths.length >= 2;
  const hasStrongSignals = achievementScore >= 60 || leadershipScore >= 60;
  
  if (hasMultipleStrengths && hasStrongSignals) {
    return {
      include: true,
      reason: `Candidate has ${strengths.length} strengths with achievement score ${achievementScore} and leadership score ${leadershipScore}`,
      strengths: strengths.slice(0, 3) // Limit to top 3
    };
  }
  
  return {
    include: false,
    reason: null,
    strengths: []
  };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HELPER: Extract role-specific rejection reasons
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function buildRejectionReason(result: ScreeningResult, roleTitle: string): string {
  const notMet = result.hard_requirements?.not_met || [];
  const partial = result.hard_requirements?.partial || [];
  const weaknesses = result.summary?.weaknesses || [];
  
  // Build a factual, role-specific explanation
  let reason = `For this ${roleTitle} position, we were looking for candidates who closely match specific requirements.`;
  
  if (notMet.length > 0) {
    // Extract just the requirement name (before the colon)
    const missingReqs = notMet.map(r => r.split(':')[0].trim()).slice(0, 2);
    reason += ` This role required ${missingReqs.join(' and ')}, which were not sufficiently demonstrated in your application.`;
  } else if (partial.length > 0) {
    const partialReqs = partial.map(r => r.split(':')[0].trim()).slice(0, 2);
    reason += ` While your application showed some alignment, the role required stronger evidence of ${partialReqs.join(' and ')}.`;
  } else if (weaknesses.length > 0) {
    // Generic fallback using weaknesses
    reason += ` After careful review, we found that other candidates more closely matched the specific requirements for this position.`;
  } else {
    // Most generic fallback
    reason += ` After reviewing all applications, we have decided to move forward with candidates whose experience more closely aligns with the specific needs of this role.`;
  }
  
  return reason;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HELPER: Build alternative signals section
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function buildAlternativeSignalsSection(strengths: string[]): string {
  if (strengths.length === 0) return '';
  
  // Clean strengths (remove CV evidence after colon if present)
  const cleanStrengths = strengths.map(s => s.split(':')[0].trim());
  
  return `
    <div style="background-color: #f8f9fa; border-left: 4px solid #7c3aed; padding: 16px; margin: 24px 0; border-radius: 0 8px 8px 0;">
      <p style="margin: 0; color: #374151; font-size: 15px; line-height: 1.6;">
        <strong style="color: #7c3aed;">A note on your strengths:</strong><br>
        Your application demonstrated experience in ${cleanStrengths.join(', ')}. 
        These capabilities may potentially align with different types of roles. 
        We encourage you to explore opportunities where these strengths could be a primary focus.
      </p>
    </div>
  `;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MAIN: Generate rejection email
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function generateRejectionEmail(input: RejectionEmailInput): RejectionEmailOutput {
  const {
    candidateName,
    roleTitle,
    companyName,
    screeningResult,
    includeTalentPoolOptIn = true
  } = input;
  
  // Determine if alternative signals should be included
  const alternativeCheck = shouldIncludeAlternativeSignals(screeningResult);
  
  // Build rejection reason
  const rejectionReason = buildRejectionReason(screeningResult, roleTitle);
  
  // Build alternative signals section (if applicable)
  const alternativeSignalsHtml = alternativeCheck.include 
    ? buildAlternativeSignalsSection(alternativeCheck.strengths)
    : '';
  
  // Build talent pool section (if enabled)
  const talentPoolHtml = includeTalentPoolOptIn ? `
    <div style="background-color: #faf5ff; border: 1px solid #e9d5ff; padding: 20px; margin: 24px 0; border-radius: 8px;">
      <p style="margin: 0 0 12px 0; color: #374151; font-size: 15px; line-height: 1.6;">
        <strong>Stay connected?</strong><br>
        If you'd like, we can keep your details on file and notify you if a future opportunity may align with your experience. 
        This is entirely optional and you can opt out at any time.
      </p>
      <div style="margin-top: 16px;">
        <a href="mailto:${companyName.toLowerCase().replace(/\s+/g, '')}@hireinbox.co.za?subject=Talent Pool Opt-In: ${encodeURIComponent(candidateName)}&body=Yes, please add me to your talent pool for future opportunities." 
           style="display: inline-block; background-color: #7c3aed; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 500; margin-right: 12px;">
          Yes, keep me in mind
        </a>
        <span style="color: #6b7280; font-size: 14px;">or simply ignore this if you prefer not to</span>
      </div>
    </div>
  ` : '';
  
  // Build final HTML email
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Application Update - ${roleTitle}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f3f4f6;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%); padding: 32px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">HireInbox</h1>
              <p style="margin: 8px 0 0 0; color: #e9d5ff; font-size: 14px; font-weight: 400;">Less noise. Better hires.</p>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              
              <!-- Greeting -->
              <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                Dear ${candidateName},
              </p>
              
              <!-- Thank you -->
              <p style="margin: 0 0 20px 0; color: #374151; font-size: 15px; line-height: 1.6;">
                Thank you for taking the time to apply for the <strong>${roleTitle}</strong> position with ${companyName}. We appreciate your interest and the effort you put into your application.
              </p>
              
              <!-- SECTION 1: Rejection reason (always included) -->
              <p style="margin: 0 0 20px 0; color: #374151; font-size: 15px; line-height: 1.6;">
                ${rejectionReason}
              </p>
              
              <p style="margin: 0 0 24px 0; color: #374151; font-size: 15px; line-height: 1.6;">
                We know this isn't the news you were hoping for, and we genuinely appreciate your interest in joining our team.
              </p>
              
              <!-- SECTION 2: Alternative signals (conditional) -->
              ${alternativeSignalsHtml}
              
              <!-- SECTION 3: Talent pool opt-in (optional) -->
              ${talentPoolHtml}
              
              <!-- Closing -->
              <p style="margin: 24px 0 0 0; color: #374151; font-size: 15px; line-height: 1.6;">
                We wish you the very best in your job search and future career.
              </p>
              
              <p style="margin: 20px 0 0 0; color: #374151; font-size: 15px; line-height: 1.6;">
                Kind regards,<br>
                <strong>The ${companyName} Team</strong>
              </p>
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 40px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #9ca3af; font-size: 13px; text-align: center;">
                Powered by <strong style="color: #7c3aed;">HireInbox</strong>
              </p>
              <p style="margin: 8px 0 0 0; color: #9ca3af; font-size: 12px; text-align: center;">
                This email was sent regarding your application. Please do not reply directly to this email.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
  
  return {
    html,
    includesAlternativeSignals: alternativeCheck.include,
    alternativeSignalsReason: alternativeCheck.reason
  };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EXPORT FOR USE IN EMAIL SENDING
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type { RejectionEmailInput, RejectionEmailOutput, ScreeningResult };
