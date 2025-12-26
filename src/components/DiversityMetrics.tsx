'use client';

import React from 'react';

// ==========================================
// DIVERSITY METRICS COMPONENT
// Privacy-first aggregate statistics
// EU AI Act & POPIA compliant
// ==========================================

// Types
export interface FunnelStage {
  stage: string;
  count: number;
  percentage: number;
}

export interface DemographicBreakdown {
  category: string;
  groups: {
    name: string;
    count: number;
    percentage: number;
    selectionRate: number;
  }[];
}

export interface BiasAlert {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  message: string;
  recommendation: string;
  adverseImpactRatio?: number;
  affectedGroup?: string;
  referenceGroup?: string;
}

export interface ScoreDistribution {
  range: string;
  count: number;
  percentage: number;
}

export interface TimelinePoint {
  date: string;
  applications: number;
  screened: number;
  shortlisted: number;
}

export interface ConfidenceLevel {
  level: 'HIGH' | 'MEDIUM' | 'LOW';
  count: number;
  percentage: number;
}

// Metric Card Component
export function MetricCard({
  title,
  value,
  subtitle,
  trend,
  icon
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: { value: number; positive: boolean };
  icon?: React.ReactNode;
}) {
  return (
    <div style={{
      background: 'white',
      borderRadius: 12,
      padding: 20,
      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      border: '1px solid #e2e8f0',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {title}
        </span>
        {icon && <span style={{ color: '#94a3b8' }}>{icon}</span>}
      </div>
      <div style={{ fontSize: '2rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>
        {value}
      </div>
      {(subtitle || trend) && (
        <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
          {subtitle && <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{subtitle}</span>}
          {trend && (
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: trend.positive ? '#10b981' : '#ef4444',
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}>
              {trend.positive ? '+' : ''}{trend.value}%
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// Funnel Chart Component
export function FunnelChart({ stages }: { stages: FunnelStage[] }) {
  const maxCount = Math.max(...stages.map(s => s.count));

  return (
    <div style={{
      background: 'white',
      borderRadius: 12,
      padding: 24,
      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      border: '1px solid #e2e8f0',
    }}>
      <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#0f172a', marginBottom: 20 }}>
        Hiring Funnel
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {stages.map((stage, index) => {
          const widthPercent = maxCount > 0 ? (stage.count / maxCount) * 100 : 0;
          const colors = ['#4F46E5', '#6366F1', '#818CF8', '#A5B4FC', '#C7D2FE'];

          return (
            <div key={stage.stage}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{stage.stage}</span>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0f172a' }}>
                  {stage.count} ({stage.percentage.toFixed(1)}%)
                </span>
              </div>
              <div style={{
                height: 24,
                background: '#f1f5f9',
                borderRadius: 6,
                overflow: 'hidden',
                position: 'relative'
              }}>
                <div style={{
                  width: `${widthPercent}%`,
                  height: '100%',
                  background: colors[index % colors.length],
                  borderRadius: 6,
                  transition: 'width 0.5s ease-out',
                  minWidth: stage.count > 0 ? 20 : 0,
                }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Score Distribution Chart
export function ScoreDistributionChart({ distribution }: { distribution: ScoreDistribution[] }) {
  const maxCount = Math.max(...distribution.map(d => d.count));

  return (
    <div style={{
      background: 'white',
      borderRadius: 12,
      padding: 24,
      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      border: '1px solid #e2e8f0',
    }}>
      <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#0f172a', marginBottom: 20 }}>
        Score Distribution
      </h3>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 140 }}>
        {distribution.map((bucket) => {
          const heightPercent = maxCount > 0 ? (bucket.count / maxCount) * 100 : 0;
          const getColor = () => {
            if (bucket.range.includes('80') || bucket.range.includes('90') || bucket.range.includes('100')) return '#10b981';
            if (bucket.range.includes('60') || bucket.range.includes('70')) return '#f59e0b';
            return '#ef4444';
          };

          return (
            <div key={bucket.range} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>
                {bucket.count}
              </span>
              <div style={{
                width: '100%',
                height: `${Math.max(heightPercent, 5)}%`,
                background: getColor(),
                borderRadius: '4px 4px 0 0',
                transition: 'height 0.5s ease-out',
              }} />
              <span style={{ fontSize: '0.65rem', color: '#64748b', marginTop: 4, textAlign: 'center' }}>
                {bucket.range}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Bias Alert Component
export function BiasAlertCard({ alert }: { alert: BiasAlert }) {
  const getSeverityColor = () => {
    switch (alert.severity) {
      case 'critical': return { bg: '#FEE2E2', border: '#FECACA', text: '#991B1B', badge: '#DC2626' };
      case 'high': return { bg: '#FEF3C7', border: '#FDE68A', text: '#92400E', badge: '#D97706' };
      case 'medium': return { bg: '#FEF9C3', border: '#FEF08A', text: '#854D0E', badge: '#CA8A04' };
      case 'low': return { bg: '#ECFDF5', border: '#A7F3D0', text: '#065F46', badge: '#059669' };
    }
  };

  const colors = getSeverityColor();

  return (
    <div style={{
      background: colors.bg,
      borderRadius: 12,
      padding: 16,
      border: `1px solid ${colors.border}`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <span style={{
          fontSize: '0.7rem',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: colors.badge,
          background: 'white',
          padding: '2px 8px',
          borderRadius: 4,
        }}>
          {alert.severity} severity
        </span>
        <span style={{ fontSize: '0.75rem', color: colors.text }}>{alert.category}</span>
      </div>
      <p style={{ fontSize: '0.9rem', fontWeight: 600, color: colors.text, marginBottom: 8 }}>
        {alert.message}
      </p>
      {alert.adverseImpactRatio !== undefined && (
        <div style={{
          display: 'flex',
          gap: 16,
          marginBottom: 8,
          fontSize: '0.8rem',
          color: colors.text,
        }}>
          <span>Adverse Impact Ratio: <strong>{(alert.adverseImpactRatio * 100).toFixed(1)}%</strong></span>
          {alert.affectedGroup && <span>Affected: <strong>{alert.affectedGroup}</strong></span>}
        </div>
      )}
      <div style={{
        background: 'rgba(255,255,255,0.7)',
        padding: 10,
        borderRadius: 6,
        marginTop: 8
      }}>
        <span style={{ fontSize: '0.7rem', fontWeight: 600, color: colors.text, display: 'block', marginBottom: 4 }}>
          Recommendation:
        </span>
        <span style={{ fontSize: '0.8rem', color: colors.text }}>{alert.recommendation}</span>
      </div>
    </div>
  );
}

// Demographic Breakdown Table
export function DemographicTable({
  breakdown,
  showAdverseImpact = true
}: {
  breakdown: DemographicBreakdown;
  showAdverseImpact?: boolean;
}) {
  // Calculate adverse impact ratios (4/5ths rule)
  const maxSelectionRate = Math.max(...breakdown.groups.map(g => g.selectionRate));

  const getAdverseImpactColor = (ratio: number) => {
    if (ratio >= 0.8) return '#10b981'; // Passes 4/5ths rule
    if (ratio >= 0.6) return '#f59e0b'; // Warning
    return '#ef4444'; // Fails 4/5ths rule
  };

  return (
    <div style={{
      background: 'white',
      borderRadius: 12,
      padding: 24,
      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      border: '1px solid #e2e8f0',
    }}>
      <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#0f172a', marginBottom: 16 }}>
        {breakdown.category}
      </h3>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
            <th style={{ textAlign: 'left', padding: '8px 0', fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>Group</th>
            <th style={{ textAlign: 'right', padding: '8px 0', fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>Count</th>
            <th style={{ textAlign: 'right', padding: '8px 0', fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>Selection Rate</th>
            {showAdverseImpact && (
              <th style={{ textAlign: 'right', padding: '8px 0', fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>Impact Ratio</th>
            )}
          </tr>
        </thead>
        <tbody>
          {breakdown.groups.map((group) => {
            const impactRatio = maxSelectionRate > 0 ? group.selectionRate / maxSelectionRate : 1;

            return (
              <tr key={group.name} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px 0', fontSize: '0.85rem', color: '#0f172a' }}>{group.name}</td>
                <td style={{ textAlign: 'right', padding: '12px 0', fontSize: '0.85rem', color: '#64748b' }}>{group.count}</td>
                <td style={{ textAlign: 'right', padding: '12px 0', fontSize: '0.85rem', color: '#0f172a', fontWeight: 500 }}>
                  {(group.selectionRate * 100).toFixed(1)}%
                </td>
                {showAdverseImpact && (
                  <td style={{ textAlign: 'right', padding: '12px 0' }}>
                    <span style={{
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: getAdverseImpactColor(impactRatio),
                      background: impactRatio >= 0.8 ? '#ECFDF5' : impactRatio >= 0.6 ? '#FEF3C7' : '#FEE2E2',
                      padding: '2px 8px',
                      borderRadius: 4,
                    }}>
                      {(impactRatio * 100).toFixed(0)}%
                    </span>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
      {showAdverseImpact && (
        <p style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: 12, fontStyle: 'italic' }}>
          4/5ths Rule: Impact ratio should be at least 80% of highest group to indicate no adverse impact.
        </p>
      )}
    </div>
  );
}

// Confidence Levels Chart
export function ConfidenceLevelsChart({ levels }: { levels: ConfidenceLevel[] }) {
  const getColor = (level: string) => {
    switch (level) {
      case 'HIGH': return '#10b981';
      case 'MEDIUM': return '#f59e0b';
      case 'LOW': return '#ef4444';
      default: return '#94a3b8';
    }
  };

  const total = levels.reduce((sum, l) => sum + l.count, 0);

  return (
    <div style={{
      background: 'white',
      borderRadius: 12,
      padding: 24,
      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      border: '1px solid #e2e8f0',
    }}>
      <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#0f172a', marginBottom: 16 }}>
        AI Confidence Levels
      </h3>

      {/* Stacked bar */}
      <div style={{
        display: 'flex',
        height: 32,
        borderRadius: 6,
        overflow: 'hidden',
        marginBottom: 16,
      }}>
        {levels.map((level) => (
          <div
            key={level.level}
            style={{
              width: `${level.percentage}%`,
              background: getColor(level.level),
              transition: 'width 0.5s ease-out',
            }}
            title={`${level.level}: ${level.count} (${level.percentage.toFixed(1)}%)`}
          />
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16 }}>
        {levels.map((level) => (
          <div key={level.level} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 10,
              height: 10,
              borderRadius: 2,
              background: getColor(level.level)
            }} />
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
              {level.level}: {level.count} ({level.percentage.toFixed(0)}%)
            </span>
          </div>
        ))}
      </div>

      <p style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: 12, fontStyle: 'italic' }}>
        High confidence indicates the AI had sufficient evidence. Low confidence decisions should be manually reviewed.
      </p>
    </div>
  );
}

// Timeline Chart
export function TimelineChart({ data }: { data: TimelinePoint[] }) {
  const maxValue = Math.max(...data.flatMap(d => [d.applications, d.screened, d.shortlisted]));

  return (
    <div style={{
      background: 'white',
      borderRadius: 12,
      padding: 24,
      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      border: '1px solid #e2e8f0',
    }}>
      <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#0f172a', marginBottom: 16 }}>
        Application Timeline
      </h3>

      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, height: 120, marginBottom: 16 }}>
        {data.map((point) => (
          <div key={point.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 100 }}>
              <div style={{
                width: 12,
                height: `${maxValue > 0 ? (point.applications / maxValue) * 100 : 0}%`,
                background: '#C7D2FE',
                borderRadius: '2px 2px 0 0',
                minHeight: point.applications > 0 ? 4 : 0,
              }} />
              <div style={{
                width: 12,
                height: `${maxValue > 0 ? (point.screened / maxValue) * 100 : 0}%`,
                background: '#818CF8',
                borderRadius: '2px 2px 0 0',
                minHeight: point.screened > 0 ? 4 : 0,
              }} />
              <div style={{
                width: 12,
                height: `${maxValue > 0 ? (point.shortlisted / maxValue) * 100 : 0}%`,
                background: '#4F46E5',
                borderRadius: '2px 2px 0 0',
                minHeight: point.shortlisted > 0 ? 4 : 0,
              }} />
            </div>
            <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>
              {new Date(point.date).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' })}
            </span>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: '#C7D2FE' }} />
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Applied</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: '#818CF8' }} />
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Screened</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: '#4F46E5' }} />
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Shortlisted</span>
        </div>
      </div>
    </div>
  );
}

// Pass Rate by Experience Level
export function ExperienceLevelChart({
  data
}: {
  data: { level: string; applied: number; passed: number; passRate: number }[]
}) {
  return (
    <div style={{
      background: 'white',
      borderRadius: 12,
      padding: 24,
      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      border: '1px solid #e2e8f0',
    }}>
      <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#0f172a', marginBottom: 16 }}>
        Pass Rate by Experience Level
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {data.map((item) => (
          <div key={item.level}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: '0.8rem', color: '#0f172a' }}>{item.level}</span>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                {item.passed}/{item.applied} ({item.passRate.toFixed(0)}%)
              </span>
            </div>
            <div style={{
              height: 8,
              background: '#f1f5f9',
              borderRadius: 4,
              overflow: 'hidden',
            }}>
              <div style={{
                width: `${item.passRate}%`,
                height: '100%',
                background: item.passRate >= 50 ? '#10b981' : item.passRate >= 25 ? '#f59e0b' : '#ef4444',
                borderRadius: 4,
                transition: 'width 0.5s ease-out',
              }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Compliance Summary Card
export function ComplianceSummary({
  checks
}: {
  checks: { name: string; status: 'pass' | 'warning' | 'fail'; detail: string }[]
}) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return { icon: '✓', color: '#10b981', bg: '#ECFDF5' };
      case 'warning': return { icon: '!', color: '#f59e0b', bg: '#FEF3C7' };
      case 'fail': return { icon: '✗', color: '#ef4444', bg: '#FEE2E2' };
      default: return { icon: '?', color: '#94a3b8', bg: '#f1f5f9' };
    }
  };

  return (
    <div style={{
      background: 'white',
      borderRadius: 12,
      padding: 24,
      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      border: '1px solid #e2e8f0',
    }}>
      <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#0f172a', marginBottom: 16 }}>
        Compliance Status
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {checks.map((check) => {
          const { icon, color, bg } = getStatusIcon(check.status);

          return (
            <div key={check.name} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: 10,
              background: bg,
              borderRadius: 8,
            }}>
              <span style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                background: color,
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.8rem',
                fontWeight: 700,
              }}>
                {icon}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 500, color: '#0f172a' }}>{check.name}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{check.detail}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Export Button Component
export function ExportButton({
  onClick,
  loading = false,
  format = 'CSV'
}: {
  onClick: () => void;
  loading?: boolean;
  format?: 'CSV' | 'PDF';
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 16px',
        background: loading ? '#94a3b8' : '#0f172a',
        color: 'white',
        border: 'none',
        borderRadius: 8,
        fontSize: '0.85rem',
        fontWeight: 500,
        cursor: loading ? 'wait' : 'pointer',
        transition: 'background 0.2s',
      }}
    >
      {loading ? (
        <span style={{
          width: 16,
          height: 16,
          border: '2px solid rgba(255,255,255,0.3)',
          borderTopColor: 'white',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      )}
      Export {format}
    </button>
  );
}

// Date Range Picker Component
export function DateRangePicker({
  startDate,
  endDate,
  onChange
}: {
  startDate: string;
  endDate: string;
  onChange: (start: string, end: string) => void;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <input
        type="date"
        value={startDate}
        onChange={(e) => onChange(e.target.value, endDate)}
        style={{
          padding: '8px 12px',
          border: '1px solid #e2e8f0',
          borderRadius: 6,
          fontSize: '0.85rem',
          color: '#0f172a',
        }}
      />
      <span style={{ color: '#64748b' }}>to</span>
      <input
        type="date"
        value={endDate}
        onChange={(e) => onChange(startDate, e.target.value)}
        style={{
          padding: '8px 12px',
          border: '1px solid #e2e8f0',
          borderRadius: 6,
          fontSize: '0.85rem',
          color: '#0f172a',
        }}
      />
    </div>
  );
}
