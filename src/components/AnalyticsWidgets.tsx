'use client';

/* ===========================================
   ANALYTICS WIDGETS
   Usage, Role Performance, Activity Feed
   For the HireInbox employer dashboard
   =========================================== */

// Types needed for the widgets
interface Candidate {
  id: string;
  name: string | null;
  email: string | null;
  score: number | null;
  status: string;
  created_at: string;
  screening_result?: {
    overall_score?: number;
  };
}

interface Role {
  id: string;
  title: string;
  status: string;
}

// Time Saved Calculator - Prominent display showing value delivered
export function TimeSavedCalculator({ totalCVs, monthlyAvg }: { totalCVs: number; monthlyAvg: number }) {
  const minutesPerCV = 2; // Manual screening time per CV
  const totalMinutes = totalCVs * minutesPerCV;
  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMins = totalMinutes % 60;
  const hourlyRate = 250; // Assumed hourly rate in ZAR
  const moneySaved = Math.round(totalHours * hourlyRate);

  return (
    <div style={{
      background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
      borderRadius: 16,
      padding: 24,
      color: 'white',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background decoration */}
      <div style={{
        position: 'absolute',
        top: -20,
        right: -20,
        width: 120,
        height: 120,
        background: 'rgba(255,255,255,0.1)',
        borderRadius: '50%'
      }} />
      <div style={{
        position: 'absolute',
        bottom: -30,
        right: 40,
        width: 80,
        height: 80,
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '50%'
      }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <span style={{ fontSize: '1.5rem' }}>&#9201;</span>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.9 }}>Time Saved with HireInbox</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: '3rem', fontWeight: 800, letterSpacing: '-0.02em' }}>{totalHours}</span>
          <span style={{ fontSize: '1.25rem', fontWeight: 600, opacity: 0.9 }}>hours</span>
          {remainingMins > 0 && (
            <>
              <span style={{ fontSize: '2rem', fontWeight: 800 }}>{remainingMins}</span>
              <span style={{ fontSize: '1rem', fontWeight: 600, opacity: 0.9 }}>min</span>
            </>
          )}
        </div>

        <div style={{ fontSize: '0.875rem', opacity: 0.85, marginBottom: 16 }}>
          Based on {totalCVs} CVs screened at 2 min each manually
        </div>

        <div style={{
          display: 'flex',
          gap: 24,
          padding: '16px 0',
          borderTop: '1px solid rgba(255,255,255,0.2)'
        }}>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>R{moneySaved.toLocaleString()}</div>
            <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Estimated savings</div>
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{monthlyAvg}</div>
            <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>CVs this month</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Usage Analytics Widget - CVs screened, average score
export function UsageAnalyticsWidget({ candidates }: { candidates: Candidate[] }) {
  const thisMonth = candidates.filter(c => {
    const d = new Date(c.created_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const totalCVs = candidates.length;
  const monthlyCount = thisMonth.length;
  const scores = candidates.map(c => c.score || c.screening_result?.overall_score || 0).filter(s => s > 0);
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  return (
    <div style={{
      background: 'white',
      border: '1px solid #e2e8f0',
      borderRadius: 12,
      padding: 20
    }}>
      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>
        Usage Analytics
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ padding: 16, background: '#f8fafc', borderRadius: 10 }}>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>{monthlyCount}</div>
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>CVs this month</div>
        </div>
        <div style={{ padding: 16, background: '#f8fafc', borderRadius: 10 }}>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>{totalCVs}</div>
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Total screened</div>
        </div>
        <div style={{ padding: 16, background: '#f8fafc', borderRadius: 10 }}>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: avgScore >= 70 ? '#059669' : avgScore >= 50 ? '#d97706' : '#dc2626', marginBottom: 4 }}>{avgScore}</div>
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Average score</div>
        </div>
        <div style={{ padding: 16, background: '#f8fafc', borderRadius: 10 }}>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#4F46E5', marginBottom: 4 }}>{Math.round(totalCVs * 2 / 60 * 10) / 10}h</div>
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Time saved</div>
        </div>
      </div>
    </div>
  );
}

// Role Performance Widget - Stats per role
export function RolePerformanceWidget({ roles, candidates }: { roles: Role[]; candidates: Candidate[] }) {
  // Calculate stats for each role
  const roleStats = roles.map(role => {
    // In production, filter by role_id. For demo, distribute candidates across roles
    const roleCandidates = candidates.filter((_, i) => i % roles.length === roles.indexOf(role));
    const scores = roleCandidates.map(c => c.score || c.screening_result?.overall_score || 0).filter(s => s > 0);
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const bestCandidate = roleCandidates.reduce((best, c) => {
      const score = c.score || c.screening_result?.overall_score || 0;
      const bestScore = best ? (best.score || best.screening_result?.overall_score || 0) : 0;
      return score > bestScore ? c : best;
    }, null as Candidate | null);

    return {
      role,
      candidateCount: roleCandidates.length,
      avgScore,
      bestCandidate
    };
  });

  if (roles.length === 0) {
    return (
      <div style={{
        background: 'white',
        border: '1px solid #e2e8f0',
        borderRadius: 12,
        padding: 20
      }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>
          Role Performance
        </div>
        <div style={{ textAlign: 'center', padding: '24px 16px', color: '#64748b', fontSize: '0.875rem' }}>
          No roles created yet. Add a role to see performance stats.
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: 'white',
      border: '1px solid #e2e8f0',
      borderRadius: 12,
      padding: 20
    }}>
      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>
        Role Performance
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {roleStats.map(({ role, candidateCount, avgScore, bestCandidate }) => (
          <div key={role.id} style={{
            padding: 14,
            background: '#f8fafc',
            borderRadius: 10,
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#0f172a' }}>{role.title}</span>
              <span style={{
                fontSize: '0.7rem',
                fontWeight: 600,
                padding: '3px 8px',
                borderRadius: 100,
                background: role.status === 'active' ? '#ecfdf5' : '#f1f5f9',
                color: role.status === 'active' ? '#059669' : '#64748b'
              }}>
                {role.status === 'active' ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div style={{ display: 'flex', gap: 16, fontSize: '0.8rem' }}>
              <div>
                <span style={{ color: '#64748b' }}>Candidates: </span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>{candidateCount}</span>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Avg Score: </span>
                <span style={{
                  fontWeight: 600,
                  color: avgScore >= 70 ? '#059669' : avgScore >= 50 ? '#d97706' : '#64748b'
                }}>{avgScore || '-'}</span>
              </div>
            </div>

            {bestCandidate && (
              <div style={{
                marginTop: 10,
                padding: '8px 10px',
                background: '#ecfdf5',
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                <span style={{ fontSize: '0.9rem' }}>&#9733;</span>
                <span style={{ fontSize: '0.75rem', color: '#166534' }}>
                  Top: <strong>{bestCandidate.name || 'Unknown'}</strong> ({bestCandidate.score || bestCandidate.screening_result?.overall_score || 0})
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Quick Stats Bar - Horizontal summary
export function QuickStatsBar({ candidates }: { candidates: Candidate[] }) {
  const total = candidates.length;
  const shortlisted = candidates.filter(c => c.status === 'shortlist').length;
  const pending = candidates.filter(c => !c.score && !c.screening_result?.overall_score).length;
  const interviewed = candidates.filter(c => c.status === 'interviewed').length;
  const inPool = candidates.filter(c => c.status === 'talent_pool').length;

  const stats = [
    { label: 'Total Candidates', value: total, color: '#4F46E5', bg: '#eef2ff' },
    { label: 'Shortlisted', value: shortlisted, color: '#059669', bg: '#ecfdf5' },
    { label: 'In Pool', value: inPool, color: '#d97706', bg: '#fef3c7' },
    { label: 'Pending Review', value: pending, color: '#6366f1', bg: '#e0e7ff' },
    { label: 'Interviewed', value: interviewed, color: '#0891b2', bg: '#cffafe' },
  ];

  return (
    <div style={{
      display: 'flex',
      gap: 12,
      overflowX: 'auto',
      paddingBottom: 4
    }}>
      {stats.map((stat, i) => (
        <div key={i} style={{
          flex: '1 0 auto',
          minWidth: 120,
          padding: '12px 16px',
          background: stat.bg,
          borderRadius: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 12
        }}>
          <div style={{
            fontSize: '1.5rem',
            fontWeight: 800,
            color: stat.color
          }}>{stat.value}</div>
          <div style={{
            fontSize: '0.75rem',
            color: stat.color,
            fontWeight: 500,
            lineHeight: 1.3
          }}>{stat.label}</div>
        </div>
      ))}
    </div>
  );
}

// Activity Feed Widget - Recent actions
export function ActivityFeedWidget({ candidates }: { candidates: Candidate[] }) {
  // Generate activity from candidates based on their status
  const activities = candidates
    .slice(0, 5)
    .map(c => {
      const actionInfo = c.status === 'shortlist'
        ? { action: 'shortlisted', icon: '&#10004;', color: '#059669' }
        : c.status === 'reject'
        ? { action: 'rejected', icon: '&#10006;', color: '#dc2626' }
        : c.status === 'talent_pool'
        ? { action: 'added to pool', icon: '&#128161;', color: '#d97706' }
        : { action: 'screened', icon: '&#128269;', color: '#4F46E5' };

      return {
        id: c.id,
        candidateName: c.name || 'Unknown Candidate',
        action: actionInfo.action,
        icon: actionInfo.icon,
        color: actionInfo.color,
        timestamp: c.created_at,
        score: c.score || c.screening_result?.overall_score
      };
    });

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' });
  };

  if (activities.length === 0) {
    return (
      <div style={{
        background: 'white',
        border: '1px solid #e2e8f0',
        borderRadius: 12,
        padding: 20
      }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>
          Recent Activity
        </div>
        <div style={{ textAlign: 'center', padding: '24px 16px', color: '#64748b', fontSize: '0.875rem' }}>
          No recent activity. Screen some CVs to see updates here.
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: 'white',
      border: '1px solid #e2e8f0',
      borderRadius: 12,
      padding: 20
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Recent Activity
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 10px',
          background: '#ecfdf5',
          borderRadius: 100,
          fontSize: '0.7rem',
          fontWeight: 600,
          color: '#059669'
        }}>
          <span style={{ width: 6, height: 6, background: '#059669', borderRadius: '50%', animation: 'pulse 2s infinite' }}></span>
          Live
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {activities.map((activity, i) => (
          <div key={activity.id} style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 0',
            borderBottom: i < activities.length - 1 ? '1px solid #f1f5f9' : 'none'
          }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: activity.color + '15',
              color: activity.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.9rem'
            }} dangerouslySetInnerHTML={{ __html: activity.icon }} />

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.85rem', color: '#0f172a' }}>
                <strong>{activity.candidateName}</strong>
                <span style={{ color: '#64748b' }}> was {activity.action}</span>
                {activity.score && (
                  <span style={{
                    marginLeft: 8,
                    padding: '2px 6px',
                    background: '#f1f5f9',
                    borderRadius: 4,
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    color: '#475569'
                  }}>
                    {activity.score}
                  </span>
                )}
              </div>
            </div>

            <div style={{ fontSize: '0.75rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
              {formatTime(activity.timestamp)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
