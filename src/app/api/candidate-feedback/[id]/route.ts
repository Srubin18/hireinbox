// /api/candidate-feedback/[id]/route.ts
// Candidate Feedback Portal API
// Transforms screening_result into candidate-friendly, POPIA-compliant feedback
// "The differentiator: 90% of rejected candidates never hear why."

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================
// TYPES
// ============================================

interface StrengthEvidence {
  label: string;
  evidence: string;
}

interface KnockoutCheck {
  requirement: string;
  status: 'PASS' | 'FAIL' | 'EXCEPTION';
  evidence: string;
  weight?: string;
}

interface RankingFactor {
  factor: string;
  score: number;
  weight: number;
  evidence: string;
  notes: string;
}

interface RiskItem {
  risk: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  evidence: string;
  interview_question: string;
}

interface ScreeningResult {
  candidate_name?: string;
  candidate_email?: string;
  current_title?: string;
  years_experience?: number;
  education_level?: string;
  overall_score?: number;
  recommendation?: string;
  recommendation_reason?: string;
  knockouts?: {
    all_passed: boolean;
    checks: KnockoutCheck[];
    failed_count: number;
    exception_applied: boolean;
  };
  ranking?: {
    eligible: boolean;
    factors: RankingFactor[];
    weighted_score: number;
  };
  hard_requirements?: {
    met: string[];
    not_met: string[];
    partial: string[];
    unclear: string[];
  };
  evidence_highlights?: Array<{ claim: string; evidence: string }>;
  summary?: {
    strengths: StrengthEvidence[];
    weaknesses: StrengthEvidence[];
    fit_assessment: string;
  };
  risk_register?: RiskItem[];
  alt_role_suggestions?: Array<{ role: string; why: string; confidence: string }>;
  interview_focus?: string[];
  exception_applied?: boolean;
  exception_reason?: string;
}

interface CandidateFeedback {
  candidateName: string;
  roleTitle: string;
  companyName: string;
  feedbackDate: string;

  // What went well (POPIA safe - based on evidence)
  strengths: Array<{
    title: string;
    detail: string;
    evidenceQuote?: string;
  }>;

  // Gaps identified (constructive, non-discriminatory)
  gaps: Array<{
    area: string;
    observation: string;
    suggestion: string;
  }>;

  // Improvement suggestions
  actionableSteps: string[];

  // Career guidance (if available)
  alternativeRoles?: Array<{
    role: string;
    reason: string;
  }>;

  // Meta
  feedbackType: 'SHORTLIST' | 'CONSIDER' | 'REJECT';
  encouragement: string;

  // Allow human review request
  canRequestReview: boolean;
}

// ============================================
// POPIA COMPLIANCE FILTERS
// ============================================

// These topics should NEVER appear in feedback (discriminatory/sensitive)
const PROHIBITED_TOPICS = [
  'age', 'gender', 'race', 'disability', 'health', 'religion', 'pregnancy',
  'marital status', 'sexual orientation', 'ethnic', 'nationality', 'citizen',
  'family status', 'political', 'union', 'belief', 'culture', 'language',
  'old', 'young', 'mature', 'veteran'
];

function containsProhibitedTopic(text: string): boolean {
  const lowerText = text.toLowerCase();
  return PROHIBITED_TOPICS.some(topic => lowerText.includes(topic));
}

function sanitizeText(text: string): string {
  // Remove any potentially discriminatory content
  let sanitized = text;

  // Remove age-related phrases
  sanitized = sanitized.replace(/\b\d+\s*(years?\s*old|yr|yrs)\b/gi, '');
  sanitized = sanitized.replace(/\bage[d]?\b/gi, '');

  return sanitized.trim();
}

// ============================================
// FEEDBACK TRANSFORMATION
// ============================================

function transformToFeedback(
  screening: ScreeningResult,
  roleTitle: string,
  companyName: string
): CandidateFeedback {
  const recommendation = (screening.recommendation || 'REJECT').toUpperCase() as 'SHORTLIST' | 'CONSIDER' | 'REJECT';

  // Build strengths from evidence
  const strengths: CandidateFeedback['strengths'] = [];

  // From summary strengths
  if (screening.summary?.strengths) {
    for (const s of screening.summary.strengths) {
      if (!containsProhibitedTopic(s.label) && !containsProhibitedTopic(s.evidence)) {
        strengths.push({
          title: sanitizeText(s.label),
          detail: 'This was highlighted as a key strength in your application.',
          evidenceQuote: sanitizeText(s.evidence)
        });
      }
    }
  }

  // From evidence highlights
  if (screening.evidence_highlights && strengths.length < 5) {
    for (const h of screening.evidence_highlights) {
      if (!containsProhibitedTopic(h.claim) && !containsProhibitedTopic(h.evidence)) {
        if (!strengths.find(s => s.title.toLowerCase() === h.claim.toLowerCase())) {
          strengths.push({
            title: sanitizeText(h.claim),
            detail: 'Your CV demonstrated evidence of this.',
            evidenceQuote: sanitizeText(h.evidence)
          });
        }
      }
      if (strengths.length >= 5) break;
    }
  }

  // From ranking factors with high scores
  if (screening.ranking?.factors && strengths.length < 5) {
    const goodFactors = screening.ranking.factors
      .filter(f => f.score >= 70 && f.evidence && f.evidence !== 'not mentioned')
      .sort((a, b) => b.score - a.score);

    for (const f of goodFactors) {
      if (!containsProhibitedTopic(f.notes || '') && !containsProhibitedTopic(f.evidence)) {
        const title = f.factor.replace(/_/g, ' ').toLowerCase()
          .replace(/\b\w/g, c => c.toUpperCase());

        if (!strengths.find(s => s.title.toLowerCase().includes(f.factor.toLowerCase()))) {
          strengths.push({
            title: title,
            detail: sanitizeText(f.notes || 'Strong performance in this area.'),
            evidenceQuote: sanitizeText(f.evidence)
          });
        }
      }
      if (strengths.length >= 5) break;
    }
  }

  // Build gaps (constructive, not critical)
  const gaps: CandidateFeedback['gaps'] = [];

  // From hard requirements not met
  if (screening.hard_requirements?.not_met) {
    for (const req of screening.hard_requirements.not_met) {
      if (!containsProhibitedTopic(req)) {
        // Parse the requirement string (format: "Requirement: evidence/not mentioned")
        const [area, detail] = req.split(':').map(s => s.trim());
        if (area && !gaps.find(g => g.area.toLowerCase() === area.toLowerCase())) {
          gaps.push({
            area: sanitizeText(area),
            observation: 'This requirement was not clearly demonstrated in your application.',
            suggestion: generateSuggestion(area)
          });
        }
      }
      if (gaps.length >= 4) break;
    }
  }

  // From knockouts that failed
  if (screening.knockouts?.checks) {
    const failedChecks = screening.knockouts.checks.filter(c => c.status === 'FAIL');
    for (const check of failedChecks) {
      if (!containsProhibitedTopic(check.requirement) && !containsProhibitedTopic(check.evidence)) {
        if (!gaps.find(g => g.area.toLowerCase().includes(check.requirement.toLowerCase().split(' ')[0]))) {
          gaps.push({
            area: sanitizeText(check.requirement),
            observation: check.evidence === 'not mentioned'
              ? 'This was not clearly addressed in your CV.'
              : 'The requirement was not fully demonstrated.',
            suggestion: generateSuggestion(check.requirement)
          });
        }
      }
      if (gaps.length >= 4) break;
    }
  }

  // From summary weaknesses
  if (screening.summary?.weaknesses && gaps.length < 4) {
    for (const w of screening.summary.weaknesses) {
      if (!containsProhibitedTopic(w.label) && !containsProhibitedTopic(w.evidence)) {
        if (!gaps.find(g => g.area.toLowerCase().includes(w.label.toLowerCase().split(' ')[0]))) {
          gaps.push({
            area: sanitizeText(w.label),
            observation: w.evidence === 'not mentioned'
              ? 'This area was not covered in your application.'
              : sanitizeText(w.evidence),
            suggestion: generateSuggestion(w.label)
          });
        }
      }
      if (gaps.length >= 4) break;
    }
  }

  // Build actionable steps
  const actionableSteps = generateActionableSteps(gaps, screening);

  // Build alternative roles
  const alternativeRoles: CandidateFeedback['alternativeRoles'] = [];
  if (screening.alt_role_suggestions) {
    for (const alt of screening.alt_role_suggestions.slice(0, 3)) {
      if (!containsProhibitedTopic(alt.role) && !containsProhibitedTopic(alt.why)) {
        alternativeRoles.push({
          role: alt.role,
          reason: sanitizeText(alt.why)
        });
      }
    }
  }

  // Generate encouragement based on outcome
  const encouragement = generateEncouragement(recommendation, strengths.length);

  return {
    candidateName: screening.candidate_name || 'Candidate',
    roleTitle,
    companyName,
    feedbackDate: new Date().toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }),
    strengths: strengths.slice(0, 5),
    gaps: gaps.slice(0, 4),
    actionableSteps: actionableSteps.slice(0, 5),
    alternativeRoles: alternativeRoles.length > 0 ? alternativeRoles : undefined,
    feedbackType: recommendation,
    encouragement,
    canRequestReview: recommendation === 'REJECT' || recommendation === 'CONSIDER'
  };
}

function generateSuggestion(area: string): string {
  const lowerArea = area.toLowerCase();

  if (lowerArea.includes('experience') || lowerArea.includes('years')) {
    return 'Consider highlighting any related experience, projects, or transferable skills that demonstrate capability in this area.';
  }
  if (lowerArea.includes('skill') || lowerArea.includes('technical')) {
    return 'Consider adding specific examples or certifications that demonstrate proficiency in this skill.';
  }
  if (lowerArea.includes('qualification') || lowerArea.includes('education') || lowerArea.includes('degree')) {
    return 'Ensure your qualifications are clearly listed, including any relevant certifications or professional development.';
  }
  if (lowerArea.includes('leadership') || lowerArea.includes('management')) {
    return 'Add examples of times you led projects, mentored others, or took initiative, with measurable outcomes if possible.';
  }
  if (lowerArea.includes('achievement') || lowerArea.includes('metric') || lowerArea.includes('result')) {
    return 'Quantify your achievements where possible (e.g., "increased sales by 30%" or "managed a team of 5").';
  }
  if (lowerArea.includes('location') || lowerArea.includes('remote') || lowerArea.includes('onsite')) {
    return 'Clearly state your location preferences and availability in your CV or cover letter.';
  }

  return 'Consider providing more specific examples or evidence in this area to strengthen future applications.';
}

function generateActionableSteps(
  gaps: CandidateFeedback['gaps'],
  screening: ScreeningResult
): string[] {
  const steps: string[] = [];

  // Add gap-specific steps
  for (const gap of gaps.slice(0, 2)) {
    steps.push(gap.suggestion);
  }

  // Add general improvement steps based on screening data
  const score = screening.overall_score || 0;

  if (score < 60) {
    steps.push('Review the job requirements carefully and tailor your CV to highlight relevant experience for each role you apply to.');
  }

  if (!screening.evidence_highlights?.length || screening.evidence_highlights.length < 3) {
    steps.push('Add more quantified achievements to your CV (numbers, percentages, rand values) to make your impact clear.');
  }

  if (screening.ranking?.factors) {
    const lowFactors = screening.ranking.factors.filter(f => f.score < 50);
    if (lowFactors.some(f => f.factor === 'TRAJECTORY')) {
      steps.push('Highlight your career progression - promotions, increased responsibilities, or new skills acquired over time.');
    }
  }

  // Always include this one
  steps.push('Have a colleague or mentor review your CV for clarity and impact before applying.');

  return [...new Set(steps)]; // Remove duplicates
}

function generateEncouragement(
  recommendation: 'SHORTLIST' | 'CONSIDER' | 'REJECT',
  strengthCount: number
): string {
  if (recommendation === 'SHORTLIST') {
    return 'Congratulations! Your application stood out, and we are excited to move forward with you.';
  }

  if (recommendation === 'CONSIDER') {
    if (strengthCount >= 3) {
      return 'Your application showed real promise. While we have decided to proceed with other candidates for this specific role, your skills are valuable. Consider applying for future opportunities.';
    }
    return 'Thank you for your application. While this particular role was not the right fit, we encourage you to keep developing your skills and applying.';
  }

  // REJECT
  if (strengthCount >= 2) {
    return 'We appreciate your interest and the time you invested in applying. While this role was not the right match, your experience has value. Use this feedback to strengthen future applications.';
  }

  return 'Thank you for applying. Every application is a learning opportunity. Use the suggestions above to strengthen your CV for future roles.';
}

// ============================================
// API HANDLER
// ============================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Candidate ID is required' },
        { status: 400 }
      );
    }

    // Fetch candidate with role info
    const { data: candidate, error: candidateError } = await supabase
      .from('candidates')
      .select(`
        id,
        name,
        email,
        screening_result,
        ai_recommendation,
        feedback_token,
        feedback_viewed_at,
        created_at,
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
      console.error('[FEEDBACK] Candidate not found:', candidateError);
      return NextResponse.json(
        { error: 'Candidate not found' },
        { status: 404 }
      );
    }

    // Check if screening result exists
    if (!candidate.screening_result) {
      return NextResponse.json(
        { error: 'No screening data available for this candidate' },
        { status: 404 }
      );
    }

    // Extract role and company info - handle both single object and array from Supabase
    const rolesData = candidate.roles;
    const roleObj = Array.isArray(rolesData) ? rolesData[0] : rolesData;
    const roleTitle = (roleObj as { title?: string })?.title || 'Position';
    const companiesData = (roleObj as { companies?: unknown })?.companies;
    const companyObj = Array.isArray(companiesData) ? companiesData[0] : companiesData;
    const companyName = (companyObj as { name?: string })?.name || 'Company';

    // Transform screening result to candidate-friendly feedback
    const feedback = transformToFeedback(
      candidate.screening_result as ScreeningResult,
      roleTitle,
      companyName
    );

    return NextResponse.json({
      success: true,
      feedback,
      meta: {
        candidateId: id,
        generatedAt: new Date().toISOString(),
        feedbackToken: candidate.feedback_token,
        previouslyViewed: !!candidate.feedback_viewed_at
      }
    });

  } catch (error) {
    console.error('[FEEDBACK] Error generating feedback:', error);
    return NextResponse.json(
      { error: 'Failed to generate feedback', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST: Generate a new feedback token for a candidate
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Candidate ID is required' },
        { status: 400 }
      );
    }

    // Generate a secure, unguessable token
    const token = generateSecureToken();

    // Update candidate with the feedback token
    const { data, error } = await supabase
      .from('candidates')
      .update({ feedback_token: token })
      .eq('id', id)
      .select('id, name, email, feedback_token')
      .single();

    if (error) {
      console.error('[FEEDBACK] Error generating token:', error);
      return NextResponse.json(
        { error: 'Failed to generate feedback token' },
        { status: 500 }
      );
    }

    // Build the feedback URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://hireinbox.co.za';
    const feedbackUrl = `${baseUrl}/feedback/${token}`;

    return NextResponse.json({
      success: true,
      feedbackUrl,
      token,
      candidate: {
        id: data.id,
        name: data.name,
        email: data.email
      }
    });

  } catch (error) {
    console.error('[FEEDBACK] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate feedback link' },
      { status: 500 }
    );
  }
}

function generateSecureToken(): string {
  // Generate a cryptographically secure token
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  const array = new Uint8Array(32);

  // Use crypto if available (Node.js)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    // Fallback for environments without crypto
    for (let i = 0; i < 32; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }

  for (let i = 0; i < 32; i++) {
    token += chars[array[i] % chars.length];
  }

  return token;
}
