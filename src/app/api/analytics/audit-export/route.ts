import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ==========================================
// AUDIT EXPORT API
// POPIA & EEA Compliance Reports
// Full AI decision audit trail
// Exportable as CSV/JSON (PDF via client-side)
// ==========================================

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface ScreeningResult {
  overall_score: number;
  recommendation: string;
  recommendation_reason: string;
  confidence?: { level: string; reasons?: string[] };
  years_experience?: number;
  current_title?: string;
  current_company?: string;
  education_level?: string;
  exception_applied?: boolean;
  exception_reason?: string;
  hard_requirements?: {
    met?: string[];
    not_met?: string[];
    partial?: string[];
    unclear?: string[];
  };
  knockouts?: {
    all_passed?: boolean;
    checks?: Array<{
      requirement: string;
      status: string;
      evidence: string;
    }>;
    exception_applied?: boolean;
  };
  risk_register?: Array<{
    risk: string;
    severity: string;
    evidence: string;
    interview_question: string;
  }>;
  summary?: {
    strengths?: Array<{ label: string; evidence: string }>;
    weaknesses?: Array<{ label: string; evidence: string }>;
    fit_assessment?: string;
  };
}

interface Candidate {
  id: string;
  name: string | null;
  email: string | null;
  status: string;
  ai_score: number | null;
  ai_recommendation: string | null;
  ai_reasoning: string | null;
  screening_result: ScreeningResult | null;
  created_at: string;
  screened_at: string | null;
  role_id: string;
}

interface Role {
  id: string;
  title: string;
  company_id: string;
  criteria?: {
    min_experience_years?: number;
    required_skills?: string[];
  };
  facts?: {
    min_experience_years?: number;
    required_skills?: string[];
    qualifications?: string[];
  };
}

// Anonymize candidate data for privacy (POPIA compliance)
function anonymizeEmail(email: string | null): string {
  if (!email) return 'N/A';
  const [local, domain] = email.split('@');
  if (!domain) return 'N/A';
  const masked = local.substring(0, 2) + '***';
  return `${masked}@${domain}`;
}

// Format date for display
function formatDate(dateString: string | null): string {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Generate CSV content
function generateCSV(
  candidates: Candidate[],
  roles: Map<string, Role>,
  includeEvidence: boolean,
  anonymize: boolean
): string {
  const headers = [
    'Candidate ID',
    'Screening Date',
    'Role',
    'Name',
    'Email',
    'AI Score',
    'AI Recommendation',
    'Decision Reason',
    'Confidence Level',
    'Exception Applied',
    'Exception Reason',
    'Requirements Met',
    'Requirements Not Met',
    'Final Status',
  ];

  if (includeEvidence) {
    headers.push('Strengths Evidence', 'Risk Factors', 'Fit Assessment');
  }

  const escapeCSV = (value: string | null | undefined): string => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = candidates.map((candidate) => {
    const role = roles.get(candidate.role_id);
    const screening = candidate.screening_result;

    const row = [
      candidate.id.substring(0, 8), // Shortened ID for privacy
      formatDate(candidate.screened_at || candidate.created_at),
      role?.title || 'Unknown Role',
      anonymize ? candidate.name?.split(' ')[0] + ' ***' : candidate.name,
      anonymize ? anonymizeEmail(candidate.email) : candidate.email,
      candidate.ai_score?.toString() || 'N/A',
      candidate.ai_recommendation || 'N/A',
      screening?.recommendation_reason || candidate.ai_reasoning || 'N/A',
      screening?.confidence?.level || 'N/A',
      screening?.exception_applied ? 'Yes' : 'No',
      screening?.exception_reason || 'N/A',
      screening?.hard_requirements?.met?.join('; ') || 'N/A',
      screening?.hard_requirements?.not_met?.join('; ') || 'N/A',
      candidate.status || 'N/A',
    ];

    if (includeEvidence) {
      const strengths = screening?.summary?.strengths
        ?.map(s => `${s.label}: "${s.evidence}"`)
        .join('; ') || 'N/A';

      const risks = screening?.risk_register
        ?.map(r => `[${r.severity}] ${r.risk}`)
        .join('; ') || 'N/A';

      const fitAssessment = screening?.summary?.fit_assessment || 'N/A';

      row.push(strengths, risks, fitAssessment);
    }

    return row.map(escapeCSV).join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

// Generate JSON audit report
function generateJSONReport(
  candidates: Candidate[],
  roles: Map<string, Role>,
  includeEvidence: boolean,
  anonymize: boolean,
  dateRange: { start: string | null; end: string | null }
): object {
  const summary = {
    reportGeneratedAt: new Date().toISOString(),
    reportType: 'AI Hiring Decision Audit',
    dateRange: {
      start: dateRange.start || 'All time',
      end: dateRange.end || 'Present',
    },
    totalDecisions: candidates.length,
    breakdown: {
      shortlisted: candidates.filter(c => c.ai_recommendation === 'SHORTLIST').length,
      considered: candidates.filter(c => c.ai_recommendation === 'CONSIDER').length,
      rejected: candidates.filter(c => c.ai_recommendation === 'REJECT').length,
    },
    exceptionsApplied: candidates.filter(c => c.screening_result?.exception_applied).length,
    confidenceDistribution: {
      high: candidates.filter(c => c.screening_result?.confidence?.level === 'HIGH').length,
      medium: candidates.filter(c => c.screening_result?.confidence?.level === 'MEDIUM').length,
      low: candidates.filter(c => c.screening_result?.confidence?.level === 'LOW').length,
    },
    compliance: {
      evidenceBasedDecisions: true,
      auditTrailComplete: true,
      humanOversightRequired: true,
      dataMinimization: anonymize,
    },
  };

  const decisions = candidates.map((candidate) => {
    const role = roles.get(candidate.role_id);
    const screening = candidate.screening_result;

    const decision: Record<string, unknown> = {
      decisionId: candidate.id.substring(0, 8),
      timestamp: candidate.screened_at || candidate.created_at,
      role: role?.title || 'Unknown',
      candidate: {
        name: anonymize ? (candidate.name?.split(' ')[0] + ' ***') : candidate.name,
        email: anonymize ? anonymizeEmail(candidate.email) : candidate.email,
      },
      aiDecision: {
        score: candidate.ai_score,
        recommendation: candidate.ai_recommendation,
        reason: screening?.recommendation_reason || candidate.ai_reasoning,
        confidence: screening?.confidence?.level || 'UNKNOWN',
      },
      exceptionHandling: {
        applied: screening?.exception_applied || false,
        reason: screening?.exception_reason || null,
      },
      requirements: {
        met: screening?.hard_requirements?.met || [],
        notMet: screening?.hard_requirements?.not_met || [],
        partial: screening?.hard_requirements?.partial || [],
      },
      finalStatus: candidate.status,
    };

    if (includeEvidence) {
      decision.evidence = {
        strengths: screening?.summary?.strengths || [],
        weaknesses: screening?.summary?.weaknesses || [],
        risks: screening?.risk_register || [],
        fitAssessment: screening?.summary?.fit_assessment || null,
      };

      if (screening?.knockouts) {
        decision.knockoutChecks = screening.knockouts.checks || [];
      }
    }

    return decision;
  });

  return {
    summary,
    decisions,
    legalNotice: {
      purpose: 'This report is generated for compliance with POPIA (Protection of Personal Information Act) and EEA (Employment Equity Act) requirements.',
      dataProtection: 'Personal information has been processed in accordance with POPIA principles. Anonymization applied: ' + (anonymize ? 'Yes' : 'No'),
      evidenceBased: 'All AI decisions are based on evidence extracted from candidate CVs with direct quotes where available.',
      humanOversight: 'Final hiring decisions require human review and approval.',
      retentionPeriod: 'Audit records are retained for the legally required period.',
      generatedBy: 'HireInbox AI Screening Platform',
    },
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const roleId = searchParams.get('role_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const format = searchParams.get('format') || 'csv'; // csv or json
    const includeEvidence = searchParams.get('include_evidence') !== 'false';
    const anonymize = searchParams.get('anonymize') !== 'false'; // Default to anonymized

    // Build query
    let query = supabase
      .from('candidates')
      .select('id, name, email, status, ai_score, ai_recommendation, ai_reasoning, screening_result, created_at, screened_at, role_id')
      .not('screening_result', 'is', null)
      .order('created_at', { ascending: false });

    if (roleId) {
      query = query.eq('role_id', roleId);
    }

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate + 'T23:59:59.999Z');
    }

    const { data: candidates, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch candidates' }, { status: 500 });
    }

    if (!candidates || candidates.length === 0) {
      return NextResponse.json({
        error: 'No audit data found for the specified criteria',
        filters: { roleId, startDate, endDate },
      }, { status: 404 });
    }

    // Fetch roles for context
    const roleIds = [...new Set(candidates.map(c => c.role_id))];
    const { data: rolesData } = await supabase
      .from('roles')
      .select('id, title, company_id, criteria, facts')
      .in('id', roleIds);

    const roles = new Map<string, Role>();
    rolesData?.forEach(role => roles.set(role.id, role));

    // Generate appropriate format
    if (format === 'json') {
      const report = generateJSONReport(
        candidates,
        roles,
        includeEvidence,
        anonymize,
        { start: startDate, end: endDate }
      );

      return new NextResponse(JSON.stringify(report, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="hireinbox-audit-${new Date().toISOString().split('T')[0]}.json"`,
        },
      });
    }

    // Default: CSV format
    const csv = generateCSV(candidates, roles, includeEvidence, anonymize);

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="hireinbox-audit-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });

  } catch (error) {
    console.error('Audit export error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST endpoint for generating custom reports
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      roleIds,
      startDate,
      endDate,
      format = 'json',
      includeEvidence = true,
      anonymize = true,
      filters = {},
    } = body;

    // Build query with advanced filters
    let query = supabase
      .from('candidates')
      .select('id, name, email, status, ai_score, ai_recommendation, ai_reasoning, screening_result, created_at, screened_at, role_id')
      .not('screening_result', 'is', null)
      .order('created_at', { ascending: false });

    if (roleIds && roleIds.length > 0) {
      query = query.in('role_id', roleIds);
    }

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate + 'T23:59:59.999Z');
    }

    if (filters.recommendation) {
      query = query.eq('ai_recommendation', filters.recommendation);
    }

    if (filters.minScore !== undefined) {
      query = query.gte('ai_score', filters.minScore);
    }

    if (filters.maxScore !== undefined) {
      query = query.lte('ai_score', filters.maxScore);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    const { data: candidates, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch candidates' }, { status: 500 });
    }

    if (!candidates || candidates.length === 0) {
      return NextResponse.json({
        error: 'No audit data found for the specified criteria',
        filters: body,
      }, { status: 404 });
    }

    // Fetch roles
    const uniqueRoleIds = [...new Set(candidates.map(c => c.role_id))];
    const { data: rolesData } = await supabase
      .from('roles')
      .select('id, title, company_id, criteria, facts')
      .in('id', uniqueRoleIds);

    const roles = new Map<string, Role>();
    rolesData?.forEach(role => roles.set(role.id, role));

    // Generate report
    if (format === 'csv') {
      const csv = generateCSV(candidates, roles, includeEvidence, anonymize);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="hireinbox-audit-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    const report = generateJSONReport(
      candidates,
      roles,
      includeEvidence,
      anonymize,
      { start: startDate, end: endDate }
    );

    return NextResponse.json(report);

  } catch (error) {
    console.error('Audit export error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
