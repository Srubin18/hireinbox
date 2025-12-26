'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  MetricCard,
  FunnelChart,
  ScoreDistributionChart,
  BiasAlertCard,
  DemographicTable,
  ConfidenceLevelsChart,
  ComplianceSummary,
  ExportButton,
  DateRangePicker,
  ExperienceLevelChart,
  type FunnelStage,
  type BiasAlert,
  type DemographicBreakdown,
  type ScoreDistribution,
  type ConfidenceLevel,
} from '@/components/DiversityMetrics';

// ==========================================
// DIVERSITY & BIAS DASHBOARD
// EU AI Act & POPIA Compliant
// Evidence-based fairness monitoring
// ==========================================

// Types for API response
interface BiasAnalysisResponse {
  summary: {
    totalCandidates: number;
    screened: number;
    shortlisted: number;
    talentPool: number;
    rejected: number;
    overallSelectionRate: number;
    averageScore: number;
    exceptionCount: number;
  };
  funnel: FunnelStage[];
  experienceBreakdown: DemographicBreakdown;
  educationBreakdown: DemographicBreakdown;
  scoreDistribution: ScoreDistribution[];
  confidenceLevels: ConfidenceLevel[];
  alerts: BiasAlert[];
  complianceChecks: { name: string; status: 'pass' | 'warning' | 'fail'; detail: string }[];
  dateRange: { start: string; end: string };
}

interface Role {
  id: string;
  title: string;
  status: string;
}

// Logo component (matches main page)
const Logo = ({ size = 36, showText = true }: { size?: number; showText?: boolean }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="12" fill="#4F46E5"/>
      <path d="M12 18L24 26L36 18V32C36 33.1 35.1 34 34 34H14C12.9 34 12 33.1 12 32V18Z" fill="white" fillOpacity="0.9"/>
      <path d="M34 14H14C12.9 14 12 14.9 12 16V18L24 26L36 18V16C36 14.9 35.1 14 34 14Z" fill="white"/>
      <circle cx="36" cy="12" r="9" fill="#10B981"/>
      <path d="M32.5 12L35 14.5L39.5 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
    {showText && (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: size > 30 ? '1.25rem' : '1rem', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
          <span style={{ color: '#0f172a' }}>Hire</span>
          <span style={{ color: '#4F46E5' }}>Inbox</span>
        </span>
      </div>
    )}
  </div>
);

export default function DiversityDashboard() {
  const [data, setData] = useState<BiasAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [exportLoading, setExportLoading] = useState(false);

  // Fetch roles for filter
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await fetch('/api/roles');
        if (response.ok) {
          const rolesData = await response.json();
          setRoles(rolesData.roles || []);
        }
      } catch (err) {
        console.error('Failed to fetch roles:', err);
      }
    };
    fetchRoles();
  }, []);

  // Fetch bias analysis data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (selectedRoleId) params.append('role_id', selectedRoleId);
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      const response = await fetch(`/api/analytics/bias?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch bias analysis data');
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [selectedRoleId, startDate, endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle date range change
  const handleDateChange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
  };

  // Export audit report
  const handleExport = async (format: 'csv' | 'json') => {
    setExportLoading(true);

    try {
      const params = new URLSearchParams();
      params.append('format', format);
      if (selectedRoleId) params.append('role_id', selectedRoleId);
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      const response = await fetch(`/api/analytics/audit-export?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to export audit report');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hireinbox-audit-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to export audit report');
    } finally {
      setExportLoading(false);
    }
  };

  // Calculate experience level pass rates for chart
  const getExperienceLevelData = () => {
    if (!data?.experienceBreakdown) return [];

    return data.experienceBreakdown.groups.map(group => ({
      level: group.name,
      applied: group.count,
      passed: Math.round(group.count * group.selectionRate),
      passRate: group.selectionRate * 100,
    }));
  };

  return (
    <div style={{
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      background: '#f8fafc',
      minHeight: '100vh',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Header */}
      <header style={{
        background: 'white',
        borderBottom: '1px solid #e2e8f0',
        padding: '16px 24px',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <div style={{
          maxWidth: 1400,
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <a href="/?dashboard=true" style={{ textDecoration: 'none' }}>
              <Logo size={32} />
            </a>
            <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: 16 }}>
              <h1 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
                Diversity & Bias Dashboard
              </h1>
              <p style={{ fontSize: '0.75rem', color: '#64748b' }}>
                EU AI Act & POPIA Compliant Monitoring
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            {/* Role Filter */}
            <select
              value={selectedRoleId}
              onChange={(e) => setSelectedRoleId(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: 6,
                fontSize: '0.85rem',
                color: '#0f172a',
                background: 'white',
                cursor: 'pointer',
              }}
            >
              <option value="">All Roles</option>
              {roles.map(role => (
                <option key={role.id} value={role.id}>{role.title}</option>
              ))}
            </select>

            {/* Date Range Picker */}
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onChange={handleDateChange}
            />

            {/* Export Buttons */}
            <ExportButton
              onClick={() => handleExport('csv')}
              loading={exportLoading}
              format="CSV"
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: 1400, margin: '0 auto', padding: '24px' }}>
        {loading ? (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: 400,
          }}>
            <div style={{
              width: 40,
              height: 40,
              border: '3px solid #e2e8f0',
              borderTopColor: '#4F46E5',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }} />
          </div>
        ) : error ? (
          <div style={{
            textAlign: 'center',
            padding: 48,
            background: 'white',
            borderRadius: 12,
            border: '1px solid #e2e8f0',
          }}>
            <p style={{ color: '#ef4444', fontSize: '1.1rem', fontWeight: 500, marginBottom: 8 }}>
              {error}
            </p>
            <button
              onClick={fetchData}
              style={{
                padding: '10px 20px',
                background: '#4F46E5',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                fontSize: '0.9rem',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Retry
            </button>
          </div>
        ) : data ? (
          <>
            {/* Summary Metrics */}
            <section style={{ marginBottom: 32 }}>
              <h2 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Overview
              </h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 16,
              }}>
                <MetricCard
                  title="Total Candidates"
                  value={data.summary.totalCandidates}
                  subtitle="Processed by AI"
                />
                <MetricCard
                  title="Shortlisted"
                  value={data.summary.shortlisted}
                  subtitle={`${data.summary.overallSelectionRate.toFixed(1)}% selection rate`}
                />
                <MetricCard
                  title="Talent Pool"
                  value={data.summary.talentPool || 0}
                  subtitle="For consideration"
                />
                <MetricCard
                  title="Average Score"
                  value={data.summary.averageScore}
                  subtitle="AI screening score"
                />
                <MetricCard
                  title="Exceptions Applied"
                  value={data.summary.exceptionCount || 0}
                  subtitle="Near-miss upgrades"
                />
              </div>
            </section>

            {/* Bias Alerts */}
            {data.alerts && data.alerts.length > 0 && (
              <section style={{ marginBottom: 32 }}>
                <h2 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Bias Alerts ({data.alerts.length})
                </h2>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                  gap: 16,
                }}>
                  {data.alerts.map(alert => (
                    <BiasAlertCard key={alert.id} alert={alert} />
                  ))}
                </div>
              </section>
            )}

            {/* Main Dashboard Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
              gap: 24,
              marginBottom: 32,
            }}>
              {/* Hiring Funnel */}
              <FunnelChart stages={data.funnel} />

              {/* Score Distribution */}
              <ScoreDistributionChart distribution={data.scoreDistribution} />

              {/* AI Confidence Levels */}
              <ConfidenceLevelsChart levels={data.confidenceLevels} />

              {/* Experience Level Pass Rates */}
              <ExperienceLevelChart data={getExperienceLevelData()} />
            </div>

            {/* Demographic Breakdowns */}
            <section style={{ marginBottom: 32 }}>
              <h2 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Demographic Analysis (4/5ths Rule Monitoring)
              </h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))',
                gap: 24,
              }}>
                <DemographicTable breakdown={data.experienceBreakdown} showAdverseImpact={true} />
                <DemographicTable breakdown={data.educationBreakdown} showAdverseImpact={true} />
              </div>
            </section>

            {/* Compliance Status */}
            <section style={{ marginBottom: 32 }}>
              <h2 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Compliance Status
              </h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
                gap: 24,
              }}>
                <ComplianceSummary checks={data.complianceChecks} />

                {/* Legal Context Card */}
                <div style={{
                  background: 'white',
                  borderRadius: 12,
                  padding: 24,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                  border: '1px solid #e2e8f0',
                }}>
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#0f172a', marginBottom: 16 }}>
                    Regulatory Context
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ padding: 12, background: '#f1f5f9', borderRadius: 8 }}>
                      <h4 style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>
                        EU AI Act (2026)
                      </h4>
                      <p style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        Hiring AI is classified as "high-risk". Requires bias testing, transparency, and human oversight.
                      </p>
                    </div>
                    <div style={{ padding: 12, background: '#f1f5f9', borderRadius: 8 }}>
                      <h4 style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>
                        POPIA (South Africa)
                      </h4>
                      <p style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        Requires lawful processing, purpose limitation, and providing access to automated decision reasoning.
                      </p>
                    </div>
                    <div style={{ padding: 12, background: '#f1f5f9', borderRadius: 8 }}>
                      <h4 style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>
                        Employment Equity Act
                      </h4>
                      <p style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        Employers must report demographic hiring data. 4/5ths rule monitors for adverse impact.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Evidence-Based Approach Explainer */}
            <section style={{
              background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
              borderRadius: 16,
              padding: 32,
              color: 'white',
            }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 16 }}>
                Why HireInbox is Fair by Design
              </h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: 24,
              }}>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 8, opacity: 0.9 }}>
                    Evidence-Based Decisions
                  </h3>
                  <p style={{ fontSize: '0.85rem', opacity: 0.8, lineHeight: 1.6 }}>
                    Every AI decision includes direct quotes from the CV. No invented strengths, no hidden criteria.
                    Candidates and auditors can see exactly why each decision was made.
                  </p>
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 8, opacity: 0.9 }}>
                    Knockout + Ranking System
                  </h3>
                  <p style={{ fontSize: '0.85rem', opacity: 0.8, lineHeight: 1.6 }}>
                    Clear separation between hard requirements (knockouts) and differentiating factors (ranking).
                    Exception rules catch near-miss candidates with exceptional trajectories.
                  </p>
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 8, opacity: 0.9 }}>
                    Human-in-the-Loop
                  </h3>
                  <p style={{ fontSize: '0.85rem', opacity: 0.8, lineHeight: 1.6 }}>
                    AI assists screening but never makes final decisions. Recruiters review AI recommendations
                    and have full context to override when appropriate.
                  </p>
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 8, opacity: 0.9 }}>
                    Complete Audit Trail
                  </h3>
                  <p style={{ fontSize: '0.85rem', opacity: 0.8, lineHeight: 1.6 }}>
                    Every decision is logged with full reasoning. Export compliance reports anytime.
                    POPIA and EEA requirements are built into the system.
                  </p>
                </div>
              </div>
            </section>
          </>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: 48,
            background: 'white',
            borderRadius: 12,
            border: '1px solid #e2e8f0',
          }}>
            <p style={{ color: '#64748b', fontSize: '1rem' }}>
              No data available. Start screening candidates to see analytics.
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid #e2e8f0',
        padding: '24px',
        marginTop: 48,
        background: 'white',
      }}>
        <div style={{
          maxWidth: 1400,
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}>
          <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
            HireInbox Diversity Dashboard - Privacy-first aggregate analytics for fair hiring
          </p>
          <div style={{ display: 'flex', gap: 16 }}>
            <a
              href="/?dashboard=true"
              style={{ fontSize: '0.75rem', color: '#64748b', textDecoration: 'none' }}
            >
              Back to Dashboard
            </a>
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); handleExport('json'); }}
              style={{ fontSize: '0.75rem', color: '#64748b', textDecoration: 'none' }}
            >
              Export Full Audit (JSON)
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
