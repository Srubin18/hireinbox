'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

/* ===========================================
   HIREINBOX - B2B REPORTS DASHBOARD
   Comprehensive hiring analytics & exports

   Features:
   1. Overview metrics dashboard
   2. Date range selector
   3. Multiple report types
   4. Export to CSV/PDF
   5. POPIA-compliant audit export
   6. Print-friendly views
   =========================================== */

// Types
interface Role {
  id: string;
  title: string;
  status: string;
  created_at: string;
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
  screening_result?: {
    overall_score: number;
    recommendation: string;
    recommendation_reason: string;
    confidence?: { level: string };
    years_experience?: number;
    current_title?: string;
    education_level?: string;
    exception_applied?: boolean;
    summary?: {
      strengths?: Array<{ label: string; evidence: string }>;
      weaknesses?: Array<{ label: string; evidence: string }>;
    };
  };
}

interface ReportMetrics {
  totalCandidates: number;
  shortlisted: number;
  considered: number;
  rejected: number;
  hired: number;
  averageScore: number;
  avgTimeToShortlist: number;
  conversionRate: number;
  rolesActive: number;
  rolesFilled: number;
}

interface PipelineData {
  roleId: string;
  roleTitle: string;
  new: number;
  screened: number;
  shortlisted: number;
  interviewed: number;
  offered: number;
  hired: number;
}

interface ScoreDistribution {
  range: string;
  count: number;
  percentage: number;
}

interface SourceData {
  source: string;
  count: number;
  percentage: number;
  conversionRate: number;
}

interface TimeToHireData {
  roleTitle: string;
  avgDays: number;
  minDays: number;
  maxDays: number;
  hires: number;
}

// Logo component
const Logo = ({ size = 36 }: { size?: number }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="12" fill="#4F46E5"/>
      <path d="M12 18L24 26L36 18V32C36 33.1 35.1 34 34 34H14C12.9 34 12 33.1 12 32V18Z" fill="white" fillOpacity="0.9"/>
      <path d="M34 14H14C12.9 14 12 14.9 12 16V18L24 26L36 18V16C36 14.9 35.1 14 34 14Z" fill="white"/>
      <circle cx="36" cy="12" r="9" fill="#10B981"/>
      <path d="M32.5 12L35 14.5L39.5 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
        <span style={{ color: '#0f172a' }}>Hire</span>
        <span style={{ color: '#4F46E5' }}>Inbox</span>
      </span>
    </div>
  </div>
);

// Date preset options
const DATE_PRESETS = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
  { label: 'This year', days: 365 },
  { label: 'All time', days: 0 },
];

// Report types
type ReportType = 'overview' | 'pipeline' | 'time-to-hire' | 'sources' | 'scores' | 'audit';

export default function ReportsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // State
  const [roles, setRoles] = useState<Role[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeReport, setActiveReport] = useState<ReportType>('overview');
  const [selectedRoleId, setSelectedRoleId] = useState<string>('all');
  const [datePreset, setDatePreset] = useState<number>(30);
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [exporting, setExporting] = useState(false);

  // Auth redirect
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/reports');
    }
  }, [user, authLoading, router]);

  // Date range calculation
  const dateRange = useMemo(() => {
    if (customStartDate && customEndDate) {
      return { start: customStartDate, end: customEndDate };
    }
    if (datePreset === 0) {
      return { start: null, end: null };
    }
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - datePreset);
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    };
  }, [datePreset, customStartDate, customEndDate]);

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [rolesRes, candidatesRes] = await Promise.all([
        fetch('/api/roles'),
        fetch('/api/candidates'),
      ]);

      if (!rolesRes.ok || !candidatesRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const rolesData = await rolesRes.json();
      const candidatesData = await candidatesRes.json();

      setRoles(rolesData.roles || []);
      setCandidates(candidatesData.candidates || []);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, fetchData]);

  // Filter candidates by date range and role
  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      // Role filter
      if (selectedRoleId !== 'all' && c.role_id !== selectedRoleId) {
        return false;
      }
      // Date filter
      if (dateRange.start && dateRange.end) {
        const createdAt = new Date(c.created_at);
        const start = new Date(dateRange.start);
        const end = new Date(dateRange.end);
        end.setHours(23, 59, 59, 999);
        if (createdAt < start || createdAt > end) {
          return false;
        }
      }
      return true;
    });
  }, [candidates, selectedRoleId, dateRange]);

  // Calculate metrics
  const metrics: ReportMetrics = useMemo(() => {
    const total = filteredCandidates.length;
    const shortlisted = filteredCandidates.filter(
      (c) => c.ai_recommendation === 'SHORTLIST' || c.status === 'shortlist'
    ).length;
    const considered = filteredCandidates.filter(
      (c) => c.ai_recommendation === 'CONSIDER' || c.status === 'talent_pool'
    ).length;
    const rejected = filteredCandidates.filter(
      (c) => c.ai_recommendation === 'REJECT' || c.status === 'reject'
    ).length;
    const hired = filteredCandidates.filter((c) => c.status === 'hired').length;

    const scoredCandidates = filteredCandidates.filter((c) => c.ai_score !== null);
    const averageScore =
      scoredCandidates.length > 0
        ? scoredCandidates.reduce((sum, c) => sum + (c.ai_score || 0), 0) / scoredCandidates.length
        : 0;

    // Average time to shortlist (days from created to screened)
    const shortlistedWithScreening = filteredCandidates.filter(
      (c) => c.screened_at && (c.ai_recommendation === 'SHORTLIST' || c.status === 'shortlist')
    );
    const avgTimeToShortlist =
      shortlistedWithScreening.length > 0
        ? shortlistedWithScreening.reduce((sum, c) => {
            const created = new Date(c.created_at);
            const screened = new Date(c.screened_at!);
            return sum + (screened.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
          }, 0) / shortlistedWithScreening.length
        : 0;

    const conversionRate = total > 0 ? (shortlisted / total) * 100 : 0;
    const activeRoles = roles.filter((r) => r.status === 'active').length;
    const filledRoles = roles.filter((r) => r.status === 'filled').length;

    return {
      totalCandidates: total,
      shortlisted,
      considered,
      rejected,
      hired,
      averageScore: Math.round(averageScore),
      avgTimeToShortlist: Math.round(avgTimeToShortlist * 10) / 10,
      conversionRate: Math.round(conversionRate * 10) / 10,
      rolesActive: activeRoles,
      rolesFilled: filledRoles,
    };
  }, [filteredCandidates, roles]);

  // Pipeline data by role
  const pipelineData: PipelineData[] = useMemo(() => {
    const roleMap = new Map<string, PipelineData>();

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

    filteredCandidates.forEach((c) => {
      const pipeline = roleMap.get(c.role_id);
      if (!pipeline) return;

      pipeline.new++;
      if (c.screening_result || c.ai_recommendation) pipeline.screened++;
      if (c.ai_recommendation === 'SHORTLIST' || c.status === 'shortlist') pipeline.shortlisted++;
      if (c.status === 'interviewed') pipeline.interviewed++;
      if (c.status === 'offered') pipeline.offered++;
      if (c.status === 'hired') pipeline.hired++;
    });

    return Array.from(roleMap.values()).filter((p) => p.new > 0);
  }, [roles, filteredCandidates]);

  // Score distribution
  const scoreDistribution: ScoreDistribution[] = useMemo(() => {
    const ranges = [
      { range: '90-100', min: 90, max: 100 },
      { range: '80-89', min: 80, max: 89 },
      { range: '70-79', min: 70, max: 79 },
      { range: '60-69', min: 60, max: 69 },
      { range: '50-59', min: 50, max: 59 },
      { range: '40-49', min: 40, max: 49 },
      { range: '0-39', min: 0, max: 39 },
    ];

    const scoredCandidates = filteredCandidates.filter((c) => c.ai_score !== null);
    const total = scoredCandidates.length;

    return ranges.map(({ range, min, max }) => {
      const count = scoredCandidates.filter(
        (c) => c.ai_score !== null && c.ai_score >= min && c.ai_score <= max
      ).length;
      return {
        range,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      };
    });
  }, [filteredCandidates]);

  // Source analysis
  const sourceData: SourceData[] = useMemo(() => {
    const sourceMap = new Map<string, { total: number; shortlisted: number }>();

    filteredCandidates.forEach((c) => {
      const source = c.source || 'Email/Direct';
      const current = sourceMap.get(source) || { total: 0, shortlisted: 0 };
      current.total++;
      if (c.ai_recommendation === 'SHORTLIST' || c.status === 'shortlist') {
        current.shortlisted++;
      }
      sourceMap.set(source, current);
    });

    const total = filteredCandidates.length;
    return Array.from(sourceMap.entries())
      .map(([source, data]) => ({
        source,
        count: data.total,
        percentage: total > 0 ? Math.round((data.total / total) * 100) : 0,
        conversionRate: data.total > 0 ? Math.round((data.shortlisted / data.total) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredCandidates]);

  // Time to hire data
  const timeToHireData: TimeToHireData[] = useMemo(() => {
    const roleTimeMap = new Map<string, number[]>();

    filteredCandidates.forEach((c) => {
      if (c.status === 'hired' && c.hired_at) {
        const created = new Date(c.created_at);
        const hired = new Date(c.hired_at);
        const days = Math.round((hired.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
        const current = roleTimeMap.get(c.role_id) || [];
        current.push(days);
        roleTimeMap.set(c.role_id, current);
      }
    });

    return Array.from(roleTimeMap.entries())
      .map(([roleId, days]) => {
        const role = roles.find((r) => r.id === roleId);
        return {
          roleTitle: role?.title || 'Unknown Role',
          avgDays: Math.round(days.reduce((a, b) => a + b, 0) / days.length),
          minDays: Math.min(...days),
          maxDays: Math.max(...days),
          hires: days.length,
        };
      })
      .sort((a, b) => b.hires - a.hires);
  }, [filteredCandidates, roles]);

  // Export functions
  const exportToCSV = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (selectedRoleId !== 'all') params.append('role_id', selectedRoleId);
      if (dateRange.start) params.append('start_date', dateRange.start);
      if (dateRange.end) params.append('end_date', dateRange.end);
      params.append('format', 'csv');

      const response = await fetch(`/api/analytics/audit-export?${params}`);
      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hireinbox-candidates-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
      alert('Failed to export CSV. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const exportAuditLog = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (selectedRoleId !== 'all') params.append('role_id', selectedRoleId);
      if (dateRange.start) params.append('start_date', dateRange.start);
      if (dateRange.end) params.append('end_date', dateRange.end);
      params.append('format', 'json');
      params.append('include_evidence', 'true');
      params.append('anonymize', 'false');

      const response = await fetch(`/api/analytics/audit-export?${params}`);
      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hireinbox-audit-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
      alert('Failed to export audit log. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const printReport = () => {
    window.print();
  };

  // Render loading state
  if (authLoading || loading) {
    return (
      <div style={styles.loadingContainer}>
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
          <circle cx="24" cy="24" r="20" stroke="#E5E7EB" strokeWidth="4" fill="none" />
          <circle
            cx="24"
            cy="24"
            r="20"
            stroke="#4F46E5"
            strokeWidth="4"
            fill="none"
            strokeDasharray="80"
            strokeDashoffset="60"
            strokeLinecap="round"
          />
        </svg>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ marginTop: 16, color: '#64748b', fontSize: '0.875rem' }}>Loading reports...</p>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div style={styles.errorContainer}>
        <div style={styles.errorBox}>
          <h2 style={{ margin: 0, color: '#991B1B' }}>Error Loading Reports</h2>
          <p style={{ color: '#64748b', margin: '8px 0 16px' }}>{error}</p>
          <button onClick={fetchData} style={styles.primaryButton}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Print-friendly styles */}
      <style>{printStyles}</style>

      {/* Header */}
      <header style={styles.header} className="no-print">
        <Logo size={36} />
        <nav style={styles.nav}>
          <a href="/" style={styles.navLink}>Dashboard</a>
          <a href="/reports" style={{ ...styles.navLink, color: '#4F46E5', fontWeight: 600 }}>Reports</a>
        </nav>
      </header>

      {/* Main Content */}
      <main style={styles.main}>
        {/* Page Title & Actions */}
        <div style={styles.titleRow} className="print-header">
          <div>
            <h1 style={styles.title}>Reports & Analytics</h1>
            <p style={styles.subtitle}>
              Comprehensive insights into your hiring pipeline
            </p>
          </div>
          <div style={styles.actionButtons} className="no-print">
            <button onClick={exportToCSV} disabled={exporting} style={styles.secondaryButton}>
              {exporting ? 'Exporting...' : 'Export CSV'}
            </button>
            <button onClick={exportAuditLog} disabled={exporting} style={styles.secondaryButton}>
              Audit Log (POPIA)
            </button>
            <button onClick={printReport} style={styles.primaryButton}>
              Print Report
            </button>
          </div>
        </div>

        {/* Filters */}
        <div style={styles.filterBar} className="no-print">
          {/* Date Presets */}
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Time Period</label>
            <div style={styles.presetButtons}>
              {DATE_PRESETS.map((preset) => (
                <button
                  key={preset.days}
                  onClick={() => {
                    setDatePreset(preset.days);
                    setCustomStartDate('');
                    setCustomEndDate('');
                  }}
                  style={{
                    ...styles.presetButton,
                    ...(datePreset === preset.days && !customStartDate
                      ? styles.presetButtonActive
                      : {}),
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Date Range */}
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Custom Range</label>
            <div style={styles.dateInputs}>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                style={styles.dateInput}
              />
              <span style={{ color: '#64748b' }}>to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                style={styles.dateInput}
              />
            </div>
          </div>

          {/* Role Filter */}
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Role</label>
            <select
              value={selectedRoleId}
              onChange={(e) => setSelectedRoleId(e.target.value)}
              style={styles.select}
            >
              <option value="all">All Roles</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Report Type Tabs */}
        <div style={styles.tabs} className="no-print">
          {[
            { id: 'overview' as const, label: 'Overview', icon: 'chart' },
            { id: 'pipeline' as const, label: 'Pipeline', icon: 'funnel' },
            { id: 'scores' as const, label: 'Score Distribution', icon: 'bar' },
            { id: 'sources' as const, label: 'Source Analysis', icon: 'pie' },
            { id: 'time-to-hire' as const, label: 'Time to Hire', icon: 'clock' },
            { id: 'audit' as const, label: 'Audit Trail', icon: 'shield' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveReport(tab.id)}
              style={{
                ...styles.tab,
                ...(activeReport === tab.id ? styles.tabActive : {}),
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Report Content */}
        <div style={styles.reportContent}>
          {/* Overview Report */}
          {activeReport === 'overview' && (
            <div>
              {/* Metrics Grid */}
              <div style={styles.metricsGrid}>
                <MetricCard
                  label="Total Candidates"
                  value={metrics.totalCandidates}
                  icon="users"
                  color="#4F46E5"
                />
                <MetricCard
                  label="Shortlisted"
                  value={metrics.shortlisted}
                  subValue={`${metrics.conversionRate}% of total`}
                  icon="check"
                  color="#10B981"
                />
                <MetricCard
                  label="Average Score"
                  value={metrics.averageScore}
                  subValue="AI confidence score"
                  icon="star"
                  color="#F59E0B"
                />
                <MetricCard
                  label="Avg. Time to Screen"
                  value={`${metrics.avgTimeToShortlist}d`}
                  subValue="Application to decision"
                  icon="clock"
                  color="#8B5CF6"
                />
              </div>

              {/* Funnel Chart */}
              <div style={styles.chartCard}>
                <h3 style={styles.chartTitle}>Hiring Funnel</h3>
                <div style={styles.funnelChart}>
                  {[
                    { stage: 'Applied', count: metrics.totalCandidates, color: '#E5E7EB' },
                    {
                      stage: 'Shortlisted',
                      count: metrics.shortlisted,
                      color: '#10B981',
                    },
                    { stage: 'Talent Pool', count: metrics.considered, color: '#F59E0B' },
                    { stage: 'Rejected', count: metrics.rejected, color: '#EF4444' },
                    { stage: 'Hired', count: metrics.hired, color: '#4F46E5' },
                  ].map((stage, idx) => {
                    const maxCount = metrics.totalCandidates || 1;
                    const width = Math.max((stage.count / maxCount) * 100, 5);
                    return (
                      <div key={stage.stage} style={styles.funnelRow}>
                        <div style={styles.funnelLabel}>
                          <span>{stage.stage}</span>
                          <span style={{ fontWeight: 600 }}>{stage.count}</span>
                        </div>
                        <div style={styles.funnelBarContainer}>
                          <div
                            style={{
                              ...styles.funnelBar,
                              width: `${width}%`,
                              backgroundColor: stage.color,
                            }}
                          />
                        </div>
                        {idx > 0 && metrics.totalCandidates > 0 && (
                          <span style={styles.funnelPercent}>
                            {Math.round((stage.count / metrics.totalCandidates) * 100)}%
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quick Stats */}
              <div style={styles.quickStats}>
                <div style={styles.statCard}>
                  <div style={styles.statIcon}>
                    <span style={{ fontSize: '1.5rem' }}>📋</span>
                  </div>
                  <div>
                    <div style={styles.statValue}>{metrics.rolesActive}</div>
                    <div style={styles.statLabel}>Active Roles</div>
                  </div>
                </div>
                <div style={styles.statCard}>
                  <div style={styles.statIcon}>
                    <span style={{ fontSize: '1.5rem' }}>✅</span>
                  </div>
                  <div>
                    <div style={styles.statValue}>{metrics.rolesFilled}</div>
                    <div style={styles.statLabel}>Roles Filled</div>
                  </div>
                </div>
                <div style={styles.statCard}>
                  <div style={styles.statIcon}>
                    <span style={{ fontSize: '1.5rem' }}>🎯</span>
                  </div>
                  <div>
                    <div style={styles.statValue}>{metrics.hired}</div>
                    <div style={styles.statLabel}>Total Hires</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Pipeline Report */}
          {activeReport === 'pipeline' && (
            <div style={styles.tableContainer}>
              <h3 style={styles.chartTitle}>Hiring Pipeline by Role</h3>
              {pipelineData.length === 0 ? (
                <div style={styles.emptyState}>
                  <p>No pipeline data available for the selected period.</p>
                </div>
              ) : (
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Role</th>
                      <th style={{ ...styles.th, textAlign: 'center' }}>Applied</th>
                      <th style={{ ...styles.th, textAlign: 'center' }}>Screened</th>
                      <th style={{ ...styles.th, textAlign: 'center' }}>Shortlisted</th>
                      <th style={{ ...styles.th, textAlign: 'center' }}>Interviewed</th>
                      <th style={{ ...styles.th, textAlign: 'center' }}>Offered</th>
                      <th style={{ ...styles.th, textAlign: 'center' }}>Hired</th>
                      <th style={{ ...styles.th, textAlign: 'center' }}>Conversion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pipelineData.map((row) => (
                      <tr key={row.roleId}>
                        <td style={styles.td}>{row.roleTitle}</td>
                        <td style={{ ...styles.td, textAlign: 'center' }}>{row.new}</td>
                        <td style={{ ...styles.td, textAlign: 'center' }}>{row.screened}</td>
                        <td style={{ ...styles.td, textAlign: 'center' }}>
                          <span style={styles.badgeGreen}>{row.shortlisted}</span>
                        </td>
                        <td style={{ ...styles.td, textAlign: 'center' }}>{row.interviewed}</td>
                        <td style={{ ...styles.td, textAlign: 'center' }}>{row.offered}</td>
                        <td style={{ ...styles.td, textAlign: 'center' }}>
                          <span style={styles.badgePurple}>{row.hired}</span>
                        </td>
                        <td style={{ ...styles.td, textAlign: 'center' }}>
                          {row.new > 0 ? Math.round((row.shortlisted / row.new) * 100) : 0}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Score Distribution */}
          {activeReport === 'scores' && (
            <div style={styles.chartCard}>
              <h3 style={styles.chartTitle}>AI Score Distribution</h3>
              <div style={styles.histogram}>
                {scoreDistribution.map((bucket) => (
                  <div key={bucket.range} style={styles.histogramRow}>
                    <div style={styles.histogramLabel}>{bucket.range}</div>
                    <div style={styles.histogramBarContainer}>
                      <div
                        style={{
                          ...styles.histogramBar,
                          width: `${bucket.percentage}%`,
                          backgroundColor: getScoreColor(parseInt(bucket.range)),
                        }}
                      />
                    </div>
                    <div style={styles.histogramValue}>
                      {bucket.count} ({bucket.percentage}%)
                    </div>
                  </div>
                ))}
              </div>
              <div style={styles.chartLegend}>
                <div style={styles.legendItem}>
                  <span style={{ ...styles.legendDot, backgroundColor: '#10B981' }} />
                  <span>Shortlist (80+)</span>
                </div>
                <div style={styles.legendItem}>
                  <span style={{ ...styles.legendDot, backgroundColor: '#F59E0B' }} />
                  <span>Consider (60-79)</span>
                </div>
                <div style={styles.legendItem}>
                  <span style={{ ...styles.legendDot, backgroundColor: '#EF4444' }} />
                  <span>Reject (&lt;60)</span>
                </div>
              </div>
            </div>
          )}

          {/* Source Analysis */}
          {activeReport === 'sources' && (
            <div style={styles.tableContainer}>
              <h3 style={styles.chartTitle}>Candidate Source Analysis</h3>
              {sourceData.length === 0 ? (
                <div style={styles.emptyState}>
                  <p>No source data available. Source tracking will populate as candidates are processed.</p>
                </div>
              ) : (
                <>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Source</th>
                        <th style={{ ...styles.th, textAlign: 'center' }}>Candidates</th>
                        <th style={{ ...styles.th, textAlign: 'center' }}>% of Total</th>
                        <th style={{ ...styles.th, textAlign: 'center' }}>Conversion Rate</th>
                        <th style={styles.th}>Quality</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sourceData.map((row) => (
                        <tr key={row.source}>
                          <td style={styles.td}>{row.source}</td>
                          <td style={{ ...styles.td, textAlign: 'center' }}>{row.count}</td>
                          <td style={{ ...styles.td, textAlign: 'center' }}>{row.percentage}%</td>
                          <td style={{ ...styles.td, textAlign: 'center' }}>
                            <span
                              style={
                                row.conversionRate >= 30
                                  ? styles.badgeGreen
                                  : row.conversionRate >= 15
                                  ? styles.badgeYellow
                                  : styles.badgeRed
                              }
                            >
                              {row.conversionRate}%
                            </span>
                          </td>
                          <td style={styles.td}>
                            <div style={styles.qualityBar}>
                              <div
                                style={{
                                  ...styles.qualityFill,
                                  width: `${row.conversionRate}%`,
                                  backgroundColor:
                                    row.conversionRate >= 30
                                      ? '#10B981'
                                      : row.conversionRate >= 15
                                      ? '#F59E0B'
                                      : '#EF4444',
                                }}
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </div>
          )}

          {/* Time to Hire */}
          {activeReport === 'time-to-hire' && (
            <div style={styles.tableContainer}>
              <h3 style={styles.chartTitle}>Time to Hire Analysis</h3>
              {timeToHireData.length === 0 ? (
                <div style={styles.emptyState}>
                  <p>No hiring data available yet. Time to hire metrics will appear once candidates are marked as hired.</p>
                </div>
              ) : (
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Role</th>
                      <th style={{ ...styles.th, textAlign: 'center' }}>Hires</th>
                      <th style={{ ...styles.th, textAlign: 'center' }}>Avg Days</th>
                      <th style={{ ...styles.th, textAlign: 'center' }}>Min Days</th>
                      <th style={{ ...styles.th, textAlign: 'center' }}>Max Days</th>
                      <th style={styles.th}>Timeline</th>
                    </tr>
                  </thead>
                  <tbody>
                    {timeToHireData.map((row) => (
                      <tr key={row.roleTitle}>
                        <td style={styles.td}>{row.roleTitle}</td>
                        <td style={{ ...styles.td, textAlign: 'center' }}>{row.hires}</td>
                        <td style={{ ...styles.td, textAlign: 'center', fontWeight: 600 }}>
                          {row.avgDays}
                        </td>
                        <td style={{ ...styles.td, textAlign: 'center', color: '#10B981' }}>
                          {row.minDays}
                        </td>
                        <td style={{ ...styles.td, textAlign: 'center', color: '#EF4444' }}>
                          {row.maxDays}
                        </td>
                        <td style={styles.td}>
                          <div style={styles.timelineBar}>
                            <div
                              style={{
                                ...styles.timelineRange,
                                left: `${(row.minDays / 90) * 100}%`,
                                width: `${((row.maxDays - row.minDays) / 90) * 100}%`,
                              }}
                            />
                            <div
                              style={{
                                ...styles.timelineAvg,
                                left: `${(row.avgDays / 90) * 100}%`,
                              }}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Audit Trail */}
          {activeReport === 'audit' && (
            <div style={styles.auditSection}>
              <h3 style={styles.chartTitle}>POPIA Compliance Audit Trail</h3>
              <p style={styles.auditDescription}>
                Download a complete audit trail of all AI screening decisions for POPIA compliance.
                The audit log includes decision reasoning, evidence quotes, and human oversight records.
              </p>

              <div style={styles.auditCards}>
                <div style={styles.auditCard}>
                  <div style={styles.auditCardIcon}>
                    <span style={{ fontSize: '2rem' }}>📊</span>
                  </div>
                  <h4 style={styles.auditCardTitle}>CSV Export</h4>
                  <p style={styles.auditCardDescription}>
                    Spreadsheet-friendly format with all candidate screening data
                  </p>
                  <button onClick={exportToCSV} disabled={exporting} style={styles.primaryButton}>
                    Download CSV
                  </button>
                </div>

                <div style={styles.auditCard}>
                  <div style={styles.auditCardIcon}>
                    <span style={{ fontSize: '2rem' }}>🔒</span>
                  </div>
                  <h4 style={styles.auditCardTitle}>Full Audit Log (JSON)</h4>
                  <p style={styles.auditCardDescription}>
                    Complete evidence trail with AI reasoning and decision justifications
                  </p>
                  <button onClick={exportAuditLog} disabled={exporting} style={styles.primaryButton}>
                    Download JSON
                  </button>
                </div>

                <div style={styles.auditCard}>
                  <div style={styles.auditCardIcon}>
                    <span style={{ fontSize: '2rem' }}>🖨️</span>
                  </div>
                  <h4 style={styles.auditCardTitle}>Print Report</h4>
                  <p style={styles.auditCardDescription}>
                    Generate a print-friendly version of the current report view
                  </p>
                  <button onClick={printReport} style={styles.secondaryButton}>
                    Print View
                  </button>
                </div>
              </div>

              <div style={styles.complianceNote}>
                <strong>POPIA Compliance Notice:</strong> All AI-assisted screening decisions are
                logged with full evidence trails. Personal data is handled in accordance with the
                Protection of Personal Information Act. Data subjects have the right to request
                access to decisions made about them.
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer style={styles.footer} className="no-print">
        <p style={{ margin: 0, color: '#64748b' }}>
          Hyred Reports - Generated {new Date().toLocaleDateString('en-ZA')}
        </p>
      </footer>
    </div>
  );
}

// Helper Components
function MetricCard({
  label,
  value,
  subValue,
  icon,
  color,
}: {
  label: string;
  value: number | string;
  subValue?: string;
  icon: string;
  color: string;
}) {
  return (
    <div style={styles.metricCard}>
      <div style={{ ...styles.metricIcon, backgroundColor: `${color}15`, color }}>
        {icon === 'users' && (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        )}
        {icon === 'check' && (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22,4 12,14.01 9,11.01" />
          </svg>
        )}
        {icon === 'star' && (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26 12,2" />
          </svg>
        )}
        {icon === 'clock' && (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12,6 12,12 16,14" />
          </svg>
        )}
      </div>
      <div>
        <div style={styles.metricValue}>{value}</div>
        <div style={styles.metricLabel}>{label}</div>
        {subValue && <div style={styles.metricSubValue}>{subValue}</div>}
      </div>
    </div>
  );
}

// Helper function for score colors
function getScoreColor(score: number): string {
  if (score >= 80) return '#10B981';
  if (score >= 60) return '#F59E0B';
  return '#EF4444';
}

// Print styles
const printStyles = `
  @media print {
    .no-print {
      display: none !important;
    }

    body {
      font-size: 12pt;
      color: #000;
      background: #fff;
    }

    .print-header {
      margin-bottom: 24px;
    }

    .print-header h1 {
      font-size: 24pt;
      margin-bottom: 8px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      page-break-inside: auto;
    }

    tr {
      page-break-inside: avoid;
      page-break-after: auto;
    }

    th, td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: left;
    }

    th {
      background-color: #f5f5f5 !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .chart-card {
      page-break-inside: avoid;
    }
  }
`;

// Styles object
const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#F8FAFC',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  loadingContainer: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  errorContainer: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  errorBox: {
    backgroundColor: '#FEE2E2',
    padding: '24px',
    borderRadius: '12px',
    textAlign: 'center',
    maxWidth: '400px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 32px',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #E5E7EB',
    position: 'sticky' as const,
    top: 0,
    zIndex: 100,
  },
  nav: {
    display: 'flex',
    gap: '24px',
  },
  navLink: {
    color: '#64748b',
    textDecoration: 'none',
    fontSize: '0.9375rem',
    fontWeight: 500,
  },
  main: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '32px',
  },
  titleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '24px',
    flexWrap: 'wrap' as const,
    gap: '16px',
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: 700,
    color: '#0f172a',
    margin: 0,
  },
  subtitle: {
    fontSize: '0.9375rem',
    color: '#64748b',
    margin: '4px 0 0',
  },
  actionButtons: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap' as const,
  },
  primaryButton: {
    backgroundColor: '#4F46E5',
    color: '#ffffff',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '8px',
    fontSize: '0.875rem',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  secondaryButton: {
    backgroundColor: '#ffffff',
    color: '#374151',
    border: '1px solid #E5E7EB',
    padding: '10px 20px',
    borderRadius: '8px',
    fontSize: '0.875rem',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  filterBar: {
    display: 'flex',
    gap: '24px',
    flexWrap: 'wrap' as const,
    backgroundColor: '#ffffff',
    padding: '20px',
    borderRadius: '12px',
    marginBottom: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  filterGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  filterLabel: {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#64748b',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  presetButtons: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap' as const,
  },
  presetButton: {
    padding: '6px 12px',
    border: '1px solid #E5E7EB',
    borderRadius: '6px',
    backgroundColor: '#ffffff',
    color: '#374151',
    fontSize: '0.8125rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  presetButtonActive: {
    backgroundColor: '#4F46E5',
    color: '#ffffff',
    borderColor: '#4F46E5',
  },
  dateInputs: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  dateInput: {
    padding: '6px 12px',
    border: '1px solid #E5E7EB',
    borderRadius: '6px',
    fontSize: '0.875rem',
  },
  select: {
    padding: '8px 12px',
    border: '1px solid #E5E7EB',
    borderRadius: '6px',
    fontSize: '0.875rem',
    minWidth: '200px',
    backgroundColor: '#ffffff',
  },
  tabs: {
    display: 'flex',
    gap: '4px',
    marginBottom: '24px',
    overflowX: 'auto' as const,
    paddingBottom: '4px',
  },
  tab: {
    padding: '10px 16px',
    border: 'none',
    borderRadius: '8px',
    backgroundColor: 'transparent',
    color: '#64748b',
    fontSize: '0.875rem',
    fontWeight: 500,
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
    transition: 'all 0.2s',
  },
  tabActive: {
    backgroundColor: '#4F46E5',
    color: '#ffffff',
  },
  reportContent: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '32px',
  },
  metricCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '20px',
    backgroundColor: '#F8FAFC',
    borderRadius: '12px',
    border: '1px solid #E5E7EB',
  },
  metricIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValue: {
    fontSize: '1.75rem',
    fontWeight: 700,
    color: '#0f172a',
    lineHeight: 1.2,
  },
  metricLabel: {
    fontSize: '0.875rem',
    color: '#64748b',
    fontWeight: 500,
  },
  metricSubValue: {
    fontSize: '0.75rem',
    color: '#94a3b8',
    marginTop: '2px',
  },
  chartCard: {
    marginBottom: '32px',
  },
  chartTitle: {
    fontSize: '1.125rem',
    fontWeight: 600,
    color: '#0f172a',
    marginBottom: '20px',
    margin: '0 0 20px',
  },
  funnelChart: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  funnelRow: {
    display: 'grid',
    gridTemplateColumns: '140px 1fr 60px',
    alignItems: 'center',
    gap: '16px',
  },
  funnelLabel: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.875rem',
    color: '#374151',
  },
  funnelBarContainer: {
    height: '32px',
    backgroundColor: '#F3F4F6',
    borderRadius: '6px',
    overflow: 'hidden',
  },
  funnelBar: {
    height: '100%',
    borderRadius: '6px',
    transition: 'width 0.5s ease-out',
  },
  funnelPercent: {
    fontSize: '0.875rem',
    color: '#64748b',
    fontWeight: 500,
    textAlign: 'right' as const,
  },
  quickStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
  },
  statCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px',
    backgroundColor: '#F8FAFC',
    borderRadius: '10px',
    border: '1px solid #E5E7EB',
  },
  statIcon: {
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#0f172a',
  },
  statLabel: {
    fontSize: '0.8125rem',
    color: '#64748b',
  },
  tableContainer: {
    overflowX: 'auto' as const,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: '0.875rem',
  },
  th: {
    padding: '12px 16px',
    textAlign: 'left' as const,
    fontWeight: 600,
    color: '#374151',
    backgroundColor: '#F8FAFC',
    borderBottom: '2px solid #E5E7EB',
  },
  td: {
    padding: '12px 16px',
    borderBottom: '1px solid #F3F4F6',
    color: '#374151',
  },
  badgeGreen: {
    display: 'inline-block',
    padding: '4px 10px',
    backgroundColor: '#D1FAE5',
    color: '#065F46',
    borderRadius: '12px',
    fontSize: '0.8125rem',
    fontWeight: 500,
  },
  badgeYellow: {
    display: 'inline-block',
    padding: '4px 10px',
    backgroundColor: '#FEF3C7',
    color: '#92400E',
    borderRadius: '12px',
    fontSize: '0.8125rem',
    fontWeight: 500,
  },
  badgeRed: {
    display: 'inline-block',
    padding: '4px 10px',
    backgroundColor: '#FEE2E2',
    color: '#991B1B',
    borderRadius: '12px',
    fontSize: '0.8125rem',
    fontWeight: 500,
  },
  badgePurple: {
    display: 'inline-block',
    padding: '4px 10px',
    backgroundColor: '#EDE9FE',
    color: '#5B21B6',
    borderRadius: '12px',
    fontSize: '0.8125rem',
    fontWeight: 500,
  },
  qualityBar: {
    width: '100px',
    height: '8px',
    backgroundColor: '#F3F4F6',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  qualityFill: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.3s',
  },
  histogram: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  histogramRow: {
    display: 'grid',
    gridTemplateColumns: '80px 1fr 100px',
    alignItems: 'center',
    gap: '16px',
  },
  histogramLabel: {
    fontSize: '0.875rem',
    color: '#374151',
    fontWeight: 500,
    textAlign: 'right' as const,
  },
  histogramBarContainer: {
    height: '28px',
    backgroundColor: '#F3F4F6',
    borderRadius: '6px',
    overflow: 'hidden',
  },
  histogramBar: {
    height: '100%',
    borderRadius: '6px',
    transition: 'width 0.5s ease-out',
    minWidth: '4px',
  },
  histogramValue: {
    fontSize: '0.8125rem',
    color: '#64748b',
  },
  chartLegend: {
    display: 'flex',
    gap: '24px',
    marginTop: '20px',
    justifyContent: 'center',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '0.8125rem',
    color: '#64748b',
  },
  legendDot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
  },
  timelineBar: {
    width: '200px',
    height: '8px',
    backgroundColor: '#F3F4F6',
    borderRadius: '4px',
    position: 'relative' as const,
  },
  timelineRange: {
    position: 'absolute' as const,
    top: 0,
    height: '100%',
    backgroundColor: '#DBEAFE',
    borderRadius: '4px',
  },
  timelineAvg: {
    position: 'absolute' as const,
    top: '-4px',
    width: '4px',
    height: '16px',
    backgroundColor: '#4F46E5',
    borderRadius: '2px',
    transform: 'translateX(-50%)',
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: '48px 24px',
    color: '#64748b',
  },
  auditSection: {
    textAlign: 'center' as const,
  },
  auditDescription: {
    fontSize: '0.9375rem',
    color: '#64748b',
    maxWidth: '600px',
    margin: '0 auto 32px',
    lineHeight: 1.6,
  },
  auditCards: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '24px',
    marginBottom: '32px',
  },
  auditCard: {
    padding: '24px',
    backgroundColor: '#F8FAFC',
    borderRadius: '12px',
    border: '1px solid #E5E7EB',
    textAlign: 'center' as const,
  },
  auditCardIcon: {
    marginBottom: '16px',
  },
  auditCardTitle: {
    fontSize: '1rem',
    fontWeight: 600,
    color: '#0f172a',
    margin: '0 0 8px',
  },
  auditCardDescription: {
    fontSize: '0.875rem',
    color: '#64748b',
    marginBottom: '16px',
    lineHeight: 1.5,
  },
  complianceNote: {
    backgroundColor: '#F0FDF4',
    border: '1px solid #BBF7D0',
    padding: '16px 20px',
    borderRadius: '8px',
    fontSize: '0.8125rem',
    color: '#166534',
    textAlign: 'left' as const,
    lineHeight: 1.6,
  },
  footer: {
    textAlign: 'center' as const,
    padding: '24px 32px',
    borderTop: '1px solid #E5E7EB',
    backgroundColor: '#ffffff',
    marginTop: '32px',
  },
};
