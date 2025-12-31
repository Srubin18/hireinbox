import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ==========================================
// REPORTS API
// Comprehensive hiring analytics & reports
// Supports multiple report types with filters
// ==========================================

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface ScreeningResult {
  overall_score: number;
  recommendation: string;
  recommendation_reason: string;
  confidence?: { level: string };
  years_experience?: number;
  current_title?: string;
  education_level?: string;
  exception_applied?: boolean;
  exception_reason?: string;
  summary?: {
    strengths?: Array<{ label: string; evidence: string }>;
    weaknesses?: Array<{ label: string; evidence: string }>;
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
  created_at: string;
  screened_at: string | null;
  role_id: string;
  source?: string;
  hired_at?: string | null;
  screening_result: ScreeningResult | null;
}

interface Role {
  id: string;
  title: string;
  status: string;
  created_at: string;
  company_id: string | null;
}

// Helper: Calculate date range
function getDateRange(preset: string | null, startDate: string | null, endDate: string | null) {
  if (startDate && endDate) {
    return { start: startDate, end: endDate };
  }

  const end = new Date();
  const start = new Date();

  switch (preset) {
    case '7d':
      start.setDate(start.getDate() - 7);
      break;
    case '30d':
      start.setDate(start.getDate() - 30);
      break;
    case '90d':
      start.setDate(start.getDate() - 90);
      break;
    case 'ytd':
      start.setMonth(0, 1);
      break;
    case 'all':
    default:
      return { start: null, end: null };
  }

  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}

// Helper: Calculate average
function average(arr: number[]): number {
  return arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
}

// Report: Overview metrics
function generateOverviewReport(candidates: Candidate[], roles: Role[]) {
  const total = candidates.length;
  const shortlisted = candidates.filter(
    (c) => c.ai_recommendation === 'SHORTLIST' || c.status === 'shortlist'
  ).length;
  const considered = candidates.filter(
    (c) => c.ai_recommendation === 'CONSIDER' || c.status === 'talent_pool'
  ).length;
  const rejected = candidates.filter(
    (c) => c.ai_recommendation === 'REJECT' || c.status === 'reject'
  ).length;
  const hired = candidates.filter((c) => c.status === 'hired').length;

  const scoredCandidates = candidates.filter((c) => c.ai_score !== null);
  const averageScore = average(scoredCandidates.map((c) => c.ai_score || 0));

  // Time to shortlist
  const shortlistedWithTimes = candidates.filter(
    (c) => c.screened_at && (c.ai_recommendation === 'SHORTLIST' || c.status === 'shortlist')
  );
  const avgTimeToShortlist = average(
    shortlistedWithTimes.map((c) => {
      const created = new Date(c.created_at);
      const screened = new Date(c.screened_at!);
      return (screened.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
    })
  );

  return {
    reportType: 'overview',
    generatedAt: new Date().toISOString(),
    metrics: {
      totalCandidates: total,
      shortlisted,
      considered,
      rejected,
      hired,
      averageScore: Math.round(averageScore),
      conversionRate: total > 0 ? Math.round((shortlisted / total) * 100 * 10) / 10 : 0,
      avgTimeToShortlistDays: Math.round(avgTimeToShortlist * 10) / 10,
      activeRoles: roles.filter((r) => r.status === 'active').length,
      filledRoles: roles.filter((r) => r.status === 'filled').length,
    },
    funnel: [
      { stage: 'Applied', count: total, percentage: 100 },
      {
        stage: 'Shortlisted',
        count: shortlisted,
        percentage: total > 0 ? Math.round((shortlisted / total) * 100) : 0,
      },
      {
        stage: 'Talent Pool',
        count: considered,
        percentage: total > 0 ? Math.round((considered / total) * 100) : 0,
      },
      {
        stage: 'Rejected',
        count: rejected,
        percentage: total > 0 ? Math.round((rejected / total) * 100) : 0,
      },
      {
        stage: 'Hired',
        count: hired,
        percentage: total > 0 ? Math.round((hired / total) * 100) : 0,
      },
    ],
  };
}

// Report: Pipeline by role
function generatePipelineReport(candidates: Candidate[], roles: Role[]) {
  const roleMap = new Map<
    string,
    {
      roleId: string;
      roleTitle: string;
      new: number;
      screened: number;
      shortlisted: number;
      interviewed: number;
      offered: number;
      hired: number;
    }
  >();

  roles.forEach((role) => {
    roleMap.set(role.id, {
      roleId: role.id,
      roleTitle: role.title,
      new: 0,
      screened: 0,
      shortlisted: 0,
      interviewed: 0,
      offered: 0,
      hired: 0,
    });
  });

  candidates.forEach((c) => {
    const pipeline = roleMap.get(c.role_id);
    if (!pipeline) return;

    pipeline.new++;
    if (c.screening_result || c.ai_recommendation) pipeline.screened++;
    if (c.ai_recommendation === 'SHORTLIST' || c.status === 'shortlist') pipeline.shortlisted++;
    if (c.status === 'interviewed') pipeline.interviewed++;
    if (c.status === 'offered') pipeline.offered++;
    if (c.status === 'hired') pipeline.hired++;
  });

  const pipelineData = Array.from(roleMap.values())
    .filter((p) => p.new > 0)
    .map((p) => ({
      ...p,
      conversionRate: p.new > 0 ? Math.round((p.shortlisted / p.new) * 100) : 0,
    }));

  return {
    reportType: 'pipeline',
    generatedAt: new Date().toISOString(),
    totalRoles: pipelineData.length,
    totalCandidates: candidates.length,
    pipeline: pipelineData,
  };
}

// Report: Score distribution
function generateScoreReport(candidates: Candidate[]) {
  const ranges = [
    { range: '90-100', min: 90, max: 100, label: 'Exceptional' },
    { range: '80-89', min: 80, max: 89, label: 'Strong' },
    { range: '70-79', min: 70, max: 79, label: 'Good' },
    { range: '60-69', min: 60, max: 69, label: 'Moderate' },
    { range: '50-59', min: 50, max: 59, label: 'Below Average' },
    { range: '40-49', min: 40, max: 49, label: 'Weak' },
    { range: '0-39', min: 0, max: 39, label: 'Not Qualified' },
  ];

  const scoredCandidates = candidates.filter((c) => c.ai_score !== null);
  const total = scoredCandidates.length;

  const distribution = ranges.map(({ range, min, max, label }) => {
    const count = scoredCandidates.filter(
      (c) => c.ai_score !== null && c.ai_score >= min && c.ai_score <= max
    ).length;
    return {
      range,
      label,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    };
  });

  const avgScore = average(scoredCandidates.map((c) => c.ai_score || 0));
  const scores = scoredCandidates.map((c) => c.ai_score || 0).sort((a, b) => a - b);
  const medianScore = scores.length > 0 ? scores[Math.floor(scores.length / 2)] : 0;

  return {
    reportType: 'score-distribution',
    generatedAt: new Date().toISOString(),
    totalScored: total,
    averageScore: Math.round(avgScore),
    medianScore: Math.round(medianScore),
    distribution,
    breakdown: {
      shortlistQuality: scoredCandidates.filter((c) => (c.ai_score || 0) >= 80).length,
      considerQuality: scoredCandidates.filter(
        (c) => (c.ai_score || 0) >= 60 && (c.ai_score || 0) < 80
      ).length,
      rejectQuality: scoredCandidates.filter((c) => (c.ai_score || 0) < 60).length,
    },
  };
}

// Report: Source analysis
function generateSourceReport(candidates: Candidate[]) {
  const sourceMap = new Map<
    string,
    {
      total: number;
      shortlisted: number;
      hired: number;
      scores: number[];
    }
  >();

  candidates.forEach((c) => {
    const source = c.source || 'Email/Direct';
    const current = sourceMap.get(source) || { total: 0, shortlisted: 0, hired: 0, scores: [] };
    current.total++;
    if (c.ai_recommendation === 'SHORTLIST' || c.status === 'shortlist') {
      current.shortlisted++;
    }
    if (c.status === 'hired') {
      current.hired++;
    }
    if (c.ai_score !== null) {
      current.scores.push(c.ai_score);
    }
    sourceMap.set(source, current);
  });

  const total = candidates.length;
  const sources = Array.from(sourceMap.entries())
    .map(([source, data]) => ({
      source,
      count: data.total,
      percentage: total > 0 ? Math.round((data.total / total) * 100) : 0,
      conversionRate: data.total > 0 ? Math.round((data.shortlisted / data.total) * 100) : 0,
      hireRate: data.total > 0 ? Math.round((data.hired / data.total) * 100) : 0,
      avgScore: data.scores.length > 0 ? Math.round(average(data.scores)) : null,
    }))
    .sort((a, b) => b.count - a.count);

  // Identify best and worst sources
  const sourcesWithEnoughData = sources.filter((s) => s.count >= 5);
  const bestSource =
    sourcesWithEnoughData.length > 0
      ? sourcesWithEnoughData.reduce((a, b) => (a.conversionRate > b.conversionRate ? a : b))
      : null;
  const worstSource =
    sourcesWithEnoughData.length > 0
      ? sourcesWithEnoughData.reduce((a, b) => (a.conversionRate < b.conversionRate ? a : b))
      : null;

  return {
    reportType: 'source-analysis',
    generatedAt: new Date().toISOString(),
    totalSources: sources.length,
    totalCandidates: total,
    sources,
    insights: {
      bestSource: bestSource ? { name: bestSource.source, conversionRate: bestSource.conversionRate } : null,
      worstSource: worstSource ? { name: worstSource.source, conversionRate: worstSource.conversionRate } : null,
    },
  };
}

// Report: Time to hire
function generateTimeToHireReport(candidates: Candidate[], roles: Role[]) {
  const roleTimeMap = new Map<
    string,
    {
      days: number[];
      screeningTimes: number[];
    }
  >();

  candidates.forEach((c) => {
    const roleData = roleTimeMap.get(c.role_id) || { days: [], screeningTimes: [] };

    // Time to hire
    if (c.status === 'hired' && c.hired_at) {
      const created = new Date(c.created_at);
      const hired = new Date(c.hired_at);
      const days = Math.round((hired.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
      roleData.days.push(days);
    }

    // Time to screen
    if (c.screened_at) {
      const created = new Date(c.created_at);
      const screened = new Date(c.screened_at);
      const hours = Math.round((screened.getTime() - created.getTime()) / (1000 * 60 * 60));
      roleData.screeningTimes.push(hours);
    }

    roleTimeMap.set(c.role_id, roleData);
  });

  const timeToHireData = Array.from(roleTimeMap.entries())
    .filter(([, data]) => data.days.length > 0)
    .map(([roleId, data]) => {
      const role = roles.find((r) => r.id === roleId);
      const sortedDays = [...data.days].sort((a, b) => a - b);
      return {
        roleId,
        roleTitle: role?.title || 'Unknown Role',
        hires: data.days.length,
        avgDays: Math.round(average(data.days)),
        minDays: Math.min(...data.days),
        maxDays: Math.max(...data.days),
        medianDays: sortedDays[Math.floor(sortedDays.length / 2)],
      };
    })
    .sort((a, b) => b.hires - a.hires);

  // Overall metrics
  const allHireTimes = Array.from(roleTimeMap.values()).flatMap((d) => d.days);
  const allScreeningTimes = Array.from(roleTimeMap.values()).flatMap((d) => d.screeningTimes);

  return {
    reportType: 'time-to-hire',
    generatedAt: new Date().toISOString(),
    totalHires: allHireTimes.length,
    overall: {
      avgTimeToHireDays: allHireTimes.length > 0 ? Math.round(average(allHireTimes)) : null,
      avgTimeToScreenHours: allScreeningTimes.length > 0 ? Math.round(average(allScreeningTimes)) : null,
      fastestHireDays: allHireTimes.length > 0 ? Math.min(...allHireTimes) : null,
      slowestHireDays: allHireTimes.length > 0 ? Math.max(...allHireTimes) : null,
    },
    byRole: timeToHireData,
  };
}

// Report: Diversity placeholder
function generateDiversityReport(candidates: Candidate[]) {
  // Note: This is a placeholder. Real diversity metrics require demographic data
  // that should be collected with proper consent and handled carefully.
  return {
    reportType: 'diversity',
    generatedAt: new Date().toISOString(),
    notice:
      'Diversity metrics require demographic data collection with proper consent. This is a placeholder report.',
    metrics: {
      dataAvailable: false,
      recommendation:
        'To enable diversity reporting, configure optional demographic data collection with POPIA-compliant consent flows.',
    },
    // Placeholder metrics that could be populated with real data
    placeholders: {
      genderDistribution: null,
      experienceLevelDistribution: null,
      educationDistribution: null,
      locationDistribution: null,
    },
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'overview';
    const roleId = searchParams.get('role_id');
    const preset = searchParams.get('preset'); // 7d, 30d, 90d, ytd, all
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    const dateRange = getDateRange(preset, startDate, endDate);

    // Build candidates query
    let candidatesQuery = supabase
      .from('candidates')
      .select(
        'id, name, email, status, ai_score, ai_recommendation, ai_reasoning, created_at, screened_at, role_id, source, hired_at, screening_result'
      )
      .order('created_at', { ascending: false });

    if (roleId) {
      candidatesQuery = candidatesQuery.eq('role_id', roleId);
    }

    if (dateRange.start) {
      candidatesQuery = candidatesQuery.gte('created_at', dateRange.start);
    }

    if (dateRange.end) {
      candidatesQuery = candidatesQuery.lte('created_at', dateRange.end + 'T23:59:59.999Z');
    }

    // Fetch data
    const [candidatesResult, rolesResult] = await Promise.all([
      candidatesQuery,
      supabase.from('roles').select('id, title, status, created_at, company_id'),
    ]);

    if (candidatesResult.error) {
      console.error('Candidates query error:', candidatesResult.error);
      return NextResponse.json({ error: 'Failed to fetch candidates' }, { status: 500 });
    }

    if (rolesResult.error) {
      console.error('Roles query error:', rolesResult.error);
      return NextResponse.json({ error: 'Failed to fetch roles' }, { status: 500 });
    }

    const candidates = (candidatesResult.data || []) as Candidate[];
    const roles = (rolesResult.data || []) as Role[];

    // Generate report based on type
    let report;
    switch (reportType) {
      case 'overview':
        report = generateOverviewReport(candidates, roles);
        break;
      case 'pipeline':
        report = generatePipelineReport(candidates, roles);
        break;
      case 'scores':
      case 'score-distribution':
        report = generateScoreReport(candidates);
        break;
      case 'sources':
      case 'source-analysis':
        report = generateSourceReport(candidates);
        break;
      case 'time-to-hire':
        report = generateTimeToHireReport(candidates, roles);
        break;
      case 'diversity':
        report = generateDiversityReport(candidates);
        break;
      default:
        return NextResponse.json({ error: `Unknown report type: ${reportType}` }, { status: 400 });
    }

    return NextResponse.json({
      ...report,
      filters: {
        roleId,
        dateRange: {
          preset,
          start: dateRange.start,
          end: dateRange.end,
        },
      },
    });
  } catch (error) {
    console.error('Report generation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST endpoint for custom report requests
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      reportTypes = ['overview'],
      roleIds,
      startDate,
      endDate,
      format = 'json',
    } = body;

    const dateRange = getDateRange(null, startDate, endDate);

    // Build query
    let candidatesQuery = supabase
      .from('candidates')
      .select(
        'id, name, email, status, ai_score, ai_recommendation, ai_reasoning, created_at, screened_at, role_id, source, hired_at, screening_result'
      )
      .order('created_at', { ascending: false });

    if (roleIds && roleIds.length > 0) {
      candidatesQuery = candidatesQuery.in('role_id', roleIds);
    }

    if (dateRange.start) {
      candidatesQuery = candidatesQuery.gte('created_at', dateRange.start);
    }

    if (dateRange.end) {
      candidatesQuery = candidatesQuery.lte('created_at', dateRange.end + 'T23:59:59.999Z');
    }

    // Fetch data
    const [candidatesResult, rolesResult] = await Promise.all([
      candidatesQuery,
      supabase.from('roles').select('id, title, status, created_at, company_id'),
    ]);

    if (candidatesResult.error || rolesResult.error) {
      return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }

    const candidates = (candidatesResult.data || []) as Candidate[];
    const roles = (rolesResult.data || []) as Role[];

    // Generate all requested reports
    const reports: Record<string, unknown> = {};

    for (const type of reportTypes) {
      switch (type) {
        case 'overview':
          reports.overview = generateOverviewReport(candidates, roles);
          break;
        case 'pipeline':
          reports.pipeline = generatePipelineReport(candidates, roles);
          break;
        case 'scores':
          reports.scores = generateScoreReport(candidates);
          break;
        case 'sources':
          reports.sources = generateSourceReport(candidates);
          break;
        case 'time-to-hire':
          reports.timeToHire = generateTimeToHireReport(candidates, roles);
          break;
        case 'diversity':
          reports.diversity = generateDiversityReport(candidates);
          break;
      }
    }

    // Format response
    if (format === 'csv') {
      // For CSV, we'll return a simplified tabular format
      const csvData = generateCSVFromReports(reports, candidates, roles);
      return new NextResponse(csvData, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="hireinbox-report-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      filters: {
        roleIds,
        dateRange: {
          start: dateRange.start,
          end: dateRange.end,
        },
      },
      reports,
    });
  } catch (error) {
    console.error('Report generation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper: Generate CSV from reports
function generateCSVFromReports(
  reports: Record<string, unknown>,
  candidates: Candidate[],
  roles: Role[]
): string {
  const lines: string[] = [];
  const roleMap = new Map(roles.map((r) => [r.id, r.title]));

  // Header
  lines.push('Candidate ID,Name,Email,Role,Status,AI Score,AI Recommendation,Created At,Screened At');

  // Data rows
  candidates.forEach((c) => {
    const escape = (v: string | null) => {
      if (!v) return '';
      if (v.includes(',') || v.includes('"') || v.includes('\n')) {
        return `"${v.replace(/"/g, '""')}"`;
      }
      return v;
    };

    lines.push(
      [
        c.id.substring(0, 8),
        escape(c.name),
        escape(c.email),
        escape(roleMap.get(c.role_id) || 'Unknown'),
        c.status,
        c.ai_score?.toString() || '',
        c.ai_recommendation || '',
        c.created_at,
        c.screened_at || '',
      ].join(',')
    );
  });

  return lines.join('\n');
}
