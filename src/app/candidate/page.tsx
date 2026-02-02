'use client';

import { useState, useEffect } from 'react';

/* ===========================================
   HIREINBOX B2C - CANDIDATE DASHBOARD
   Personal dashboard for job seekers
   Phase 2: Full feature implementation
   =========================================== */

// Types
interface CVAnalysis {
  id: string;
  candidate_name: string | null;
  current_title: string | null;
  years_experience: number | null;
  overall_score: number;
  score_explanation: string;
  strengths: Array<{ strength: string; evidence: string; impact: string }>;
  improvements: Array<{ area: string; suggestion: string; priority: 'HIGH' | 'MEDIUM' | 'LOW' }>;
  quick_wins: string[];
  created_at: string;
  target_role?: string;
}

interface VideoAnalysis {
  id: string;
  overall_score: number;
  communication_score: number;
  confidence_score: number;
  clarity_score: number;
  professionalism_score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  created_at: string;
}

interface Application {
  id: string;
  company_name: string;
  role_title: string;
  status: 'applied' | 'viewed' | 'shortlisted' | 'interview' | 'rejected' | 'offer';
  applied_at: string;
  last_updated: string;
  company_logo_color?: string;
}

interface UserProfile {
  name: string;
  email: string;
  plan: 'free' | 'basic' | 'pro';
  cv_analyses_count: number;
  video_analyses_count: number;
  profile_completion: number;
  talent_pool_opted_in: boolean;
  talent_pool_visibility: 'public' | 'anonymous' | 'hidden';
}

// Logo Component
const Logo = ({ size = 32, light = false }: { size?: number; light?: boolean }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="12" fill="#4F46E5"/>
      <path d="M12 18L24 26L36 18V32C36 33.1 35.1 34 34 34H14C12.9 34 12 33.1 12 32V18Z" fill="white" fillOpacity="0.9"/>
      <path d="M34 14H14C12.9 14 12 14.9 12 16V18L24 26L36 18V16C36 14.9 35.1 14 34 14Z" fill="white"/>
      <circle cx="36" cy="12" r="9" fill="#10B981"/>
      <path d="M32.5 12L35 14.5L39.5 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <span style={{ fontSize: size > 28 ? '1.15rem' : '1rem', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
        <span style={{ color: light ? 'white' : '#0f172a' }}>Hire</span>
        <span style={{ color: light ? '#a5b4fc' : '#4F46E5' }}>Inbox</span>
      </span>
      <span style={{ fontSize: '0.65rem', color: light ? 'rgba(255,255,255,0.7)' : '#94a3b8', fontWeight: 500 }}>Less noise. Better hires.</span>
    </div>
  </div>
);

// Circular Score Component
const CircularScore = ({ score, size = 140 }: { score: number; size?: number }) => {
  const radius = size / 2;
  const stroke = size / 14;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getColor = () => {
    if (score >= 80) return '#10B981';
    if (score >= 60) return '#8B5CF6';
    if (score >= 40) return '#F59E0B';
    return '#EF4444';
  };

  const getGrade = () => {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B+';
    if (score >= 60) return 'B';
    if (score >= 50) return 'C';
    return 'D';
  };

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle stroke="#E5E7EB" fill="transparent" strokeWidth={stroke} r={normalizedRadius} cx={radius} cy={radius} />
        <circle
          stroke={getColor()}
          fill="transparent"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference + ' ' + circumference}
          style={{ strokeDashoffset, transition: 'stroke-dashoffset 1.5s ease-out', filter: `drop-shadow(0 0 8px ${getColor()}40)` }}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
      </svg>
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
        <div style={{ fontSize: size / 3.5, fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>{score}</div>
        <div style={{ fontSize: size / 14, color: '#6B7280', marginTop: 2 }}>out of 100</div>
        <div style={{ fontSize: size / 10, fontWeight: 700, color: getColor(), marginTop: 4, padding: '2px 8px', backgroundColor: `${getColor()}15`, borderRadius: 4 }}>
          Grade {getGrade()}
        </div>
      </div>
    </div>
  );
};

// Mini Score History Chart
const ScoreHistoryChart = ({ analyses }: { analyses: CVAnalysis[] }) => {
  if (analyses.length < 2) return null;

  const maxScore = 100;
  const height = 80;
  const width = 200;
  const padding = 10;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const points = analyses.slice(0, 5).reverse().map((a, i, arr) => {
    const x = padding + (i / (arr.length - 1)) * chartWidth;
    const y = height - padding - (a.overall_score / maxScore) * chartHeight;
    return { x, y, score: a.overall_score };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <div style={{ background: '#f8fafc', borderRadius: 12, padding: 16, marginTop: 16 }}>
      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: 8 }}>Score History</div>
      <svg width={width} height={height} style={{ display: 'block' }}>
        <path d={pathD} fill="none" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="4" fill="#4F46E5" />
            <text x={p.x} y={p.y - 8} textAnchor="middle" fontSize="10" fill="#64748b">{p.score}</text>
          </g>
        ))}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#94a3b8', marginTop: 4 }}>
        <span>Oldest</span>
        <span>Latest</span>
      </div>
    </div>
  );
};

// Profile Completion Meter
const ProfileCompletionMeter = ({ completion }: { completion: number }) => {
  const tasks = [
    { label: 'Upload CV', done: completion >= 25 },
    { label: 'Add target role', done: completion >= 50 },
    { label: 'Record video intro', done: completion >= 75 },
    { label: 'Complete profile', done: completion >= 100 },
  ];

  return (
    <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{ fontWeight: 600, color: '#0f172a' }}>Profile Completion</span>
        <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#4F46E5' }}>{completion}%</span>
      </div>
      <div style={{ background: '#e2e8f0', borderRadius: 100, height: 8, marginBottom: 16 }}>
        <div style={{ background: 'linear-gradient(90deg, #4F46E5, #10B981)', width: `${completion}%`, height: '100%', borderRadius: 100, transition: 'width 0.5s ease' }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {tasks.map((task, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.85rem' }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: task.done ? '#10B981' : '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {task.done && <span style={{ color: 'white', fontSize: '0.7rem' }}>✓</span>}
            </div>
            <span style={{ color: task.done ? '#64748b' : '#0f172a', textDecoration: task.done ? 'line-through' : 'none' }}>{task.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Improvement Tip Card
const ImprovementTipCard = ({ tip }: { tip: { area: string; suggestion: string; priority: string } }) => {
  const priorityColors = {
    HIGH: { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' },
    MEDIUM: { bg: '#fffbeb', text: '#d97706', border: '#fde68a' },
    LOW: { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0' },
  };
  const colors = priorityColors[tip.priority as keyof typeof priorityColors] || priorityColors.LOW;

  return (
    <div style={{ background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: 10, padding: 14, marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: '0.7rem', fontWeight: 600, color: colors.text, background: 'white', padding: '2px 6px', borderRadius: 4 }}>{tip.priority}</span>
        <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.9rem' }}>{tip.area}</span>
      </div>
      <p style={{ fontSize: '0.85rem', color: '#475569', margin: 0, lineHeight: 1.5 }}>{tip.suggestion}</p>
    </div>
  );
};

// Analysis History Item
const AnalysisHistoryItem = ({ analysis, onClick }: { analysis: CVAnalysis; onClick: () => void }) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10B981';
    if (score >= 60) return '#8B5CF6';
    if (score >= 40) return '#F59E0B';
    return '#EF4444';
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 14, background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, cursor: 'pointer', transition: 'all 0.2s' }}>
      <div style={{ width: 48, height: 48, borderRadius: 10, background: `${getScoreColor(analysis.overall_score)}15`, color: getScoreColor(analysis.overall_score), display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.1rem' }}>
        {analysis.overall_score}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.95rem', marginBottom: 2 }}>{analysis.target_role || 'General Analysis'}</div>
        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{formatDate(analysis.created_at)}</div>
      </div>
      <span style={{ color: '#94a3b8' }}>→</span>
    </div>
  );
};

// Video Analysis Results Card
const VideoAnalysisCard = ({ videoAnalysis }: { videoAnalysis: VideoAnalysis | null }) => {
  if (!videoAnalysis) {
    return (
      <div style={{ background: 'linear-gradient(135deg, #fdf4ff 0%, #fae8ff 100%)', borderRadius: 16, border: '1px solid #f5d0fe', padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: 'linear-gradient(135deg, #a855f7, #9333ea)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>
            <span style={{ color: 'white' }}>🎥</span>
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: '0 0 6px', fontSize: '1.1rem', fontWeight: 700, color: '#581c87' }}>Video Analysis Not Done Yet</h3>
            <p style={{ margin: '0 0 16px', fontSize: '0.9rem', color: '#7e22ce', lineHeight: 1.5 }}>
              Stand out from the crowd! Record a 60-second video intro and get AI coaching on your presentation skills.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'white', borderRadius: 100, fontSize: '0.8rem', color: '#7e22ce' }}>
                <span>✓</span> Communication coaching
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'white', borderRadius: 100, fontSize: '0.8rem', color: '#7e22ce' }}>
                <span>✓</span> Confidence analysis
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'white', borderRadius: 100, fontSize: '0.8rem', color: '#7e22ce' }}>
                <span>✓</span> Body language tips
              </span>
            </div>
            <a href="/upload?tab=video" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg, #a855f7, #9333ea)', color: 'white', padding: '12px 24px', borderRadius: 10, fontSize: '0.95rem', fontWeight: 600, textDecoration: 'none', boxShadow: '0 4px 12px rgba(168,85,247,0.3)' }}>
              Record Video - R29
              <span>→</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10B981';
    if (score >= 60) return '#8B5CF6';
    if (score >= 40) return '#F59E0B';
    return '#EF4444';
  };

  const scoreCategories = [
    { label: 'Communication', score: videoAnalysis.communication_score, icon: '💬' },
    { label: 'Confidence', score: videoAnalysis.confidence_score, icon: '💪' },
    { label: 'Clarity', score: videoAnalysis.clarity_score, icon: '🎯' },
    { label: 'Professionalism', score: videoAnalysis.professionalism_score, icon: '👔' },
  ];

  return (
    <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, #a855f7, #9333ea)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: 'white', fontSize: '1.25rem' }}>🎥</span>
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>Video Analysis</h3>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Your presentation skills breakdown</p>
        </div>
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: getScoreColor(videoAnalysis.overall_score) }}>{videoAnalysis.overall_score}</div>
          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Overall</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {scoreCategories.map((cat, i) => (
          <div key={i} style={{ textAlign: 'center', padding: 12, background: '#f8fafc', borderRadius: 10 }}>
            <div style={{ fontSize: '1.25rem', marginBottom: 4 }}>{cat.icon}</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: getScoreColor(cat.score) }}>{cat.score}</div>
            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{cat.label}</div>
          </div>
        ))}
      </div>

      <div style={{ background: '#f8fafc', borderRadius: 10, padding: 14, marginBottom: 16 }}>
        <p style={{ margin: 0, fontSize: '0.9rem', color: '#475569', lineHeight: 1.6 }}>{videoAnalysis.feedback}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#10B981', marginBottom: 8 }}>What You Did Well</h4>
          {videoAnalysis.strengths.slice(0, 2).map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
              <span style={{ color: '#10B981', fontSize: '0.8rem' }}>✓</span>
              <span style={{ fontSize: '0.8rem', color: '#475569' }}>{s}</span>
            </div>
          ))}
        </div>
        <div>
          <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#F59E0B', marginBottom: 8 }}>To Improve</h4>
          {videoAnalysis.improvements.slice(0, 2).map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
              <span style={{ color: '#F59E0B', fontSize: '0.8rem' }}>→</span>
              <span style={{ fontSize: '0.8rem', color: '#475569' }}>{s}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <a href="/upload?tab=video" style={{ color: '#a855f7', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none' }}>Record New Video →</a>
        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Last updated: {new Date(videoAnalysis.created_at).toLocaleDateString('en-ZA')}</span>
      </div>
    </div>
  );
};

// Application Tracking Section
const ApplicationTracker = ({ applications }: { applications: Application[] }) => {
  const statusConfig: Record<string, { color: string; bg: string; label: string; icon: string }> = {
    applied: { color: '#64748b', bg: '#f1f5f9', label: 'Applied', icon: '📤' },
    viewed: { color: '#3b82f6', bg: '#dbeafe', label: 'Viewed', icon: '👁️' },
    shortlisted: { color: '#8b5cf6', bg: '#ede9fe', label: 'Shortlisted', icon: '⭐' },
    interview: { color: '#10b981', bg: '#d1fae5', label: 'Interview', icon: '📞' },
    rejected: { color: '#ef4444', bg: '#fee2e2', label: 'Not Selected', icon: '✗' },
    offer: { color: '#059669', bg: '#a7f3d0', label: 'Offer!', icon: '🎉' },
  };

  const getTimeAgo = (dateStr: string) => {
    const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return Math.floor(seconds / 60) + 'm ago';
    if (seconds < 86400) return Math.floor(seconds / 3600) + 'h ago';
    return Math.floor(seconds / 86400) + 'd ago';
  };

  if (applications.length === 0) {
    return (
      <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: 32, textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, background: '#f1f5f9', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <span style={{ fontSize: '1.75rem' }}>📋</span>
        </div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>No Applications Yet</h3>
        <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: 16, maxWidth: 320, margin: '0 auto 16px' }}>
          When you apply to jobs through Hyred partner companies, you'll be able to track your application status here.
        </p>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: '#f8fafc', borderRadius: 8, fontSize: '0.85rem', color: '#64748b' }}>
          <span>💡</span> Tip: Join the Talent Pool to get discovered by employers
        </div>
      </div>
    );
  }

  // Group by status for summary
  const statusCounts = applications.reduce((acc, app) => {
    acc[app.status] = (acc[app.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>Application Tracker</h3>
          <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#64748b' }}>{applications.length} total applications</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {Object.entries(statusCounts).map(([status, count]) => (
            <div key={status} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: statusConfig[status]?.bg || '#f1f5f9', borderRadius: 100 }}>
              <span style={{ fontSize: '0.7rem' }}>{statusConfig[status]?.icon}</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: statusConfig[status]?.color }}>{count}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {applications.slice(0, 5).map((app) => {
          const config = statusConfig[app.status] || statusConfig.applied;
          return (
            <div key={app.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 14, background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: app.company_logo_color || '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem', color: '#4F46E5' }}>
                {app.company_name.split(' ').map(w => w[0]).join('').slice(0, 2)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.95rem', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{app.role_title}</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{app.company_name}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: config.bg, borderRadius: 100, marginBottom: 4 }}>
                  <span style={{ fontSize: '0.7rem' }}>{config.icon}</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: config.color }}>{config.label}</span>
                </div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{getTimeAgo(app.last_updated)}</div>
              </div>
            </div>
          );
        })}
      </div>

      {applications.length > 5 && (
        <button style={{ width: '100%', marginTop: 12, padding: '10px', background: 'none', border: '1px dashed #e2e8f0', borderRadius: 8, color: '#64748b', fontSize: '0.85rem', cursor: 'pointer' }}>
          View all {applications.length} applications
        </button>
      )}
    </div>
  );
};

// Talent Pool Opt-In Component
const TalentPoolOptIn = ({
  isOptedIn,
  visibility,
  onToggle,
  onVisibilityChange
}: {
  isOptedIn: boolean;
  visibility: 'public' | 'anonymous' | 'hidden';
  onToggle: () => void;
  onVisibilityChange: (v: 'public' | 'anonymous' | 'hidden') => void;
}) => {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div style={{ background: isOptedIn ? 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)' : 'white', borderRadius: 16, border: `1px solid ${isOptedIn ? '#86efac' : '#e2e8f0'}`, padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: isOptedIn ? '#10B981' : '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0, transition: 'all 0.3s' }}>
          <span style={{ color: isOptedIn ? 'white' : '#64748b' }}>{isOptedIn ? '✓' : '👥'}</span>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: isOptedIn ? '#166534' : '#0f172a' }}>
              {isOptedIn ? 'In the Talent Pool' : 'Join the Talent Pool'}
            </h3>
            {isOptedIn && (
              <span style={{ padding: '3px 10px', background: '#10B981', color: 'white', borderRadius: 100, fontSize: '0.7rem', fontWeight: 600 }}>ACTIVE</span>
            )}
          </div>
          <p style={{ margin: '0 0 16px', fontSize: '0.9rem', color: isOptedIn ? '#15803d' : '#64748b', lineHeight: 1.5 }}>
            {isOptedIn
              ? 'Employers can now discover you based on your skills and experience. Update your profile to improve visibility.'
              : 'Get discovered by top South African employers. Your profile will be visible to recruiters looking for talent like you.'
            }
          </p>

          {!isOptedIn && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: '#f8fafc', borderRadius: 100, fontSize: '0.8rem', color: '#475569' }}>
                <span style={{ color: '#10B981' }}>✓</span> Get matched to relevant jobs
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: '#f8fafc', borderRadius: 100, fontSize: '0.8rem', color: '#475569' }}>
                <span style={{ color: '#10B981' }}>✓</span> Control your visibility
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: '#f8fafc', borderRadius: 100, fontSize: '0.8rem', color: '#475569' }}>
                <span style={{ color: '#10B981' }}>✓</span> POPIA compliant
              </span>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={onToggle}
              style={{
                padding: '12px 24px',
                background: isOptedIn ? 'white' : 'linear-gradient(135deg, #10B981, #059669)',
                color: isOptedIn ? '#dc2626' : 'white',
                border: isOptedIn ? '1px solid #fca5a5' : 'none',
                borderRadius: 10,
                fontSize: '0.95rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {isOptedIn ? 'Leave Pool' : 'Join Talent Pool'}
            </button>

            {isOptedIn && (
              <button
                onClick={() => setShowSettings(!showSettings)}
                style={{
                  padding: '12px 16px',
                  background: 'white',
                  color: '#0f172a',
                  border: '1px solid #e2e8f0',
                  borderRadius: 10,
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <span>⚙️</span> Settings
              </button>
            )}
          </div>

          {isOptedIn && showSettings && (
            <div style={{ marginTop: 16, padding: 16, background: 'white', borderRadius: 12, border: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 12px', fontSize: '0.9rem', fontWeight: 600, color: '#0f172a' }}>Visibility Settings</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { value: 'public' as const, label: 'Full Profile', desc: 'Name, contact, and full CV visible' },
                  { value: 'anonymous' as const, label: 'Anonymous', desc: 'Skills visible, name hidden until you accept' },
                  { value: 'hidden' as const, label: 'Hidden', desc: 'Temporarily hide from search results' },
                ].map(option => (
                  <label key={option.value} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: 12, background: visibility === option.value ? '#f0fdf4' : '#f8fafc', borderRadius: 8, cursor: 'pointer', border: visibility === option.value ? '1px solid #86efac' : '1px solid transparent' }}>
                    <input
                      type="radio"
                      name="visibility"
                      checked={visibility === option.value}
                      onChange={() => onVisibilityChange(option.value)}
                      style={{ marginTop: 2 }}
                    />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#0f172a' }}>{option.label}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{option.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Upsell Section Component
const UpsellSection = () => {
  const packages = [
    {
      id: 'video-single',
      icon: '🎥',
      title: 'Video Analysis',
      subtitle: 'Single session',
      price: 'R29',
      priceNote: 'once-off',
      features: ['60-second video review', 'AI coaching feedback', 'Communication tips', 'Confidence score'],
      gradient: 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)',
      popular: false,
      cta: 'Record Now',
      href: '/upload?tab=video'
    },
    {
      id: 'video-practice',
      icon: '🎯',
      title: 'Practice Pack',
      subtitle: '5 video sessions',
      price: 'R79',
      priceNote: 'save R66',
      features: ['5 video analyses', 'Track improvement', 'Detailed feedback', 'Compare sessions'],
      gradient: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
      popular: true,
      cta: 'Get Practice Pack',
      href: '/upload?tab=video&package=practice'
    },
    {
      id: 'avatar-interview',
      icon: '🎯',
      title: 'AI Avatar Interview',
      subtitle: 'Mock interview practice',
      price: 'R149',
      priceNote: 'per session',
      features: ['AI interviewer simulation', 'Industry-specific Qs', 'Real-time feedback', 'Body language analysis'],
      gradient: 'linear-gradient(135deg, #EC4899 0%, #F43F5E 100%)',
      popular: false,
      cta: 'Try Interview',
      href: '/upload?tab=interview',
      comingSoon: true
    }
  ];

  const industryInsights = [
    { industry: 'Tech & Software', roles: 234, avgSalary: 'R45k-R85k', growth: '+15%' },
    { industry: 'Finance', roles: 156, avgSalary: 'R50k-R120k', growth: '+8%' },
    { industry: 'Marketing', roles: 98, avgSalary: 'R25k-R55k', growth: '+12%' },
    { industry: 'Engineering', roles: 112, avgSalary: 'R40k-R95k', growth: '+10%' },
  ];

  return (
    <div>
      {/* Premium Packages */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <span style={{ fontSize: '1.5rem' }}>⭐</span>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Level Up Your Job Search</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          {packages.map(pkg => (
            <div key={pkg.id} style={{ background: 'white', borderRadius: 16, border: pkg.popular ? '2px solid #4F46E5' : '1px solid #e2e8f0', overflow: 'hidden', position: 'relative' }}>
              {pkg.popular && (
                <div style={{ position: 'absolute', top: 12, right: 12, padding: '4px 12px', background: '#4F46E5', color: 'white', borderRadius: 100, fontSize: '0.7rem', fontWeight: 700 }}>BEST VALUE</div>
              )}
              {pkg.comingSoon && (
                <div style={{ position: 'absolute', top: 12, right: 12, padding: '4px 12px', background: '#f59e0b', color: 'white', borderRadius: 100, fontSize: '0.7rem', fontWeight: 700 }}>COMING SOON</div>
              )}
              <div style={{ background: pkg.gradient, padding: '24px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>{pkg.icon}</div>
                <h3 style={{ color: 'white', fontSize: '1.1rem', fontWeight: 700, margin: '0 0 4px' }}>{pkg.title}</h3>
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem', margin: 0 }}>{pkg.subtitle}</p>
              </div>
              <div style={{ padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 16 }}>
                  <span style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a' }}>{pkg.price}</span>
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{pkg.priceNote}</span>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px' }}>
                  {pkg.features.map((f, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem', color: '#475569', marginBottom: 8 }}>
                      <span style={{ color: '#10B981' }}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href={pkg.comingSoon ? '#' : pkg.href}
                  style={{
                    display: 'block',
                    textAlign: 'center',
                    padding: '12px 20px',
                    background: pkg.comingSoon ? '#e2e8f0' : pkg.gradient,
                    color: pkg.comingSoon ? '#94a3b8' : 'white',
                    borderRadius: 10,
                    fontWeight: 600,
                    textDecoration: 'none',
                    cursor: pkg.comingSoon ? 'not-allowed' : 'pointer'
                  }}
                >
                  {pkg.comingSoon ? 'Coming Soon' : pkg.cta}
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Industry Insights */}
      <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24, marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>Industry Insights</h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>SA job market trends to help your search</p>
          </div>
          <span style={{ padding: '6px 14px', background: '#eef2ff', color: '#4F46E5', borderRadius: 100, fontSize: '0.75rem', fontWeight: 600 }}>Updated Weekly</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          {industryInsights.map((ind, i) => (
            <div key={i} style={{ background: '#f8fafc', borderRadius: 12, padding: 16 }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0f172a', margin: '0 0 12px' }}>{ind.industry}</h4>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Open roles</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>{ind.roles}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Salary range</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>{ind.avgSalary}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>YoY growth</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#10B981' }}>{ind.growth}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Position-Specific Prep */}
      <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', borderRadius: 16, padding: 24, color: 'white' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 280 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 8px' }}>Position-Specific Interview Prep</h3>
            <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', margin: '0 0 20px', lineHeight: 1.6 }}>
              Get tailored interview questions and preparation guides based on the specific roles you're applying for.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
              {['Software Developer', 'Accountant', 'Marketing Manager', 'Data Analyst', 'Project Manager'].map((role, i) => (
                <span key={i} style={{ padding: '6px 14px', background: 'rgba(255,255,255,0.1)', borderRadius: 100, fontSize: '0.8rem', color: 'rgba(255,255,255,0.9)' }}>{role}</span>
              ))}
            </div>
            <a href="/upload?tab=prep" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: 'white', color: '#0f172a', borderRadius: 10, fontWeight: 600, textDecoration: 'none' }}>
              Get Prep Guide - R49
              <span>→</span>
            </a>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, minWidth: 200 }}>
            {[
              { label: 'Industry Questions', value: '500+' },
              { label: 'Role Templates', value: '50+' },
              { label: 'STAR Examples', value: '100+' },
              { label: 'SA Specific', value: '100%' },
            ].map((stat, i) => (
              <div key={i} style={{ textAlign: 'center', padding: 16, background: 'rgba(255,255,255,0.1)', borderRadius: 10 }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#a5b4fc' }}>{stat.value}</div>
                <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Dashboard Navigation Tabs
const DashboardTabs = ({ activeTab, onTabChange }: { activeTab: string; onTabChange: (tab: string) => void }) => {
  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'cv', label: 'CV Analysis', icon: '📄' },
    { id: 'video', label: 'Video', icon: '🎥' },
    { id: 'applications', label: 'Applications', icon: '📋' },
    { id: 'talent-pool', label: 'Talent Pool', icon: '👥' },
    { id: 'upsell', label: 'Boost Career', icon: '⭐' },
  ];

  return (
    <div style={{ display: 'flex', gap: 4, padding: 4, background: '#f1f5f9', borderRadius: 12, marginBottom: 24, overflowX: 'auto' }}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 16px',
            background: activeTab === tab.id ? 'white' : 'transparent',
            border: 'none',
            borderRadius: 8,
            fontSize: '0.875rem',
            fontWeight: activeTab === tab.id ? 600 : 500,
            color: activeTab === tab.id ? '#0f172a' : '#64748b',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            transition: 'all 0.2s',
            boxShadow: activeTab === tab.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
          }}
        >
          <span>{tab.icon}</span>
          {tab.label}
        </button>
      ))}
    </div>
  );
};

// Upgrade Prompt Component
const UpgradePrompt = ({ plan }: { plan: string }) => {
  if (plan !== 'free') return null;

  return (
    <div style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)', borderRadius: 16, padding: 24, color: 'white', marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>
          ⭐
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: '0 0 6px', fontSize: '1.1rem', fontWeight: 700 }}>Unlock Video Analysis</h3>
          <p style={{ margin: '0 0 12px', fontSize: '0.9rem', opacity: 0.9 }}>Record a 60-second intro and get AI coaching on your presentation skills. Employers are 3x more likely to shortlist candidates with video profiles.</p>
          <a href="/upload?tab=video" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'white', color: '#4F46E5', padding: '10px 20px', borderRadius: 8, fontSize: '0.9rem', fontWeight: 600, textDecoration: 'none' }}>
            Try Video Analysis - R29
            <span>→</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default function CandidateDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analyses, setAnalyses] = useState<CVAnalysis[]>([]);
  const [videoAnalysis, setVideoAnalysis] = useState<VideoAnalysis | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: 'Job Seeker',
    email: 'user@example.com',
    plan: 'free',
    cv_analyses_count: 0,
    video_analyses_count: 0,
    profile_completion: 25,
    talent_pool_opted_in: false,
    talent_pool_visibility: 'public',
  });
  const [selectedAnalysis, setSelectedAnalysis] = useState<CVAnalysis | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // In production, this would fetch from /api/candidate/dashboard
      // For now, using mock data to demonstrate the UI
      await new Promise(resolve => setTimeout(resolve, 800));

      // Mock CV analyses data
      const mockAnalyses: CVAnalysis[] = [
        {
          id: '1',
          candidate_name: 'Thabo Molefe',
          current_title: 'Software Developer',
          years_experience: 4,
          overall_score: 78,
          score_explanation: 'Strong technical skills with room for improvement in quantifying achievements.',
          strengths: [
            { strength: 'Technical Skills', evidence: '4 years Python, Django, React experience', impact: 'Matches most SA tech job requirements' },
            { strength: 'Education', evidence: 'BSc Computer Science from Wits', impact: 'Strong academic foundation' },
            { strength: 'Project Experience', evidence: 'Led development of 3 production applications', impact: 'Demonstrates leadership potential' },
          ],
          improvements: [
            { area: 'Quantify Achievements', suggestion: 'Add metrics to your achievements. Instead of "improved performance", say "improved API response time by 40%"', priority: 'HIGH' },
            { area: 'ATS Keywords', suggestion: 'Add more industry keywords like "agile", "CI/CD", "cloud infrastructure"', priority: 'MEDIUM' },
            { area: 'LinkedIn Profile', suggestion: 'Add your LinkedIn URL to increase credibility', priority: 'LOW' },
          ],
          quick_wins: ['Add a professional summary', 'Include GitHub profile link', 'Quantify at least 3 achievements'],
          created_at: new Date().toISOString(),
          target_role: 'Senior Developer',
        },
        {
          id: '2',
          candidate_name: 'Thabo Molefe',
          current_title: 'Software Developer',
          years_experience: 4,
          overall_score: 72,
          score_explanation: 'Good foundation but missing key details.',
          strengths: [
            { strength: 'Experience', evidence: '4 years in software development', impact: 'Solid experience level' },
          ],
          improvements: [
            { area: 'Professional Summary', suggestion: 'Add a compelling 2-3 line summary at the top', priority: 'HIGH' },
          ],
          quick_wins: ['Add professional summary', 'Update job titles'],
          created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          target_role: 'Full Stack Developer',
        },
      ];

      // Mock video analysis data (set to null to show upsell, or provide data to show results)
      const mockVideoAnalysis: VideoAnalysis | null = {
        id: 'v1',
        overall_score: 82,
        communication_score: 85,
        confidence_score: 78,
        clarity_score: 84,
        professionalism_score: 81,
        feedback: 'You present yourself confidently with good eye contact. Your explanation of your skills was clear and engaging. Consider slowing down slightly when explaining technical concepts.',
        strengths: [
          'Strong eye contact throughout the video',
          'Clear articulation of career goals',
          'Professional appearance and background',
          'Enthusiastic tone without being over-the-top',
        ],
        improvements: [
          'Slow down when explaining technical skills',
          'Add specific examples of achievements',
          'Practice a stronger opening statement',
        ],
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      };

      // Mock applications data
      const mockApplications: Application[] = [
        {
          id: 'a1',
          company_name: 'Standard Bank',
          role_title: 'Senior Software Engineer',
          status: 'shortlisted',
          applied_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          last_updated: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          company_logo_color: '#0033A0',
        },
        {
          id: 'a2',
          company_name: 'Discovery Health',
          role_title: 'Full Stack Developer',
          status: 'interview',
          applied_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          last_updated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          company_logo_color: '#006E51',
        },
        {
          id: 'a3',
          company_name: 'Takealot',
          role_title: 'Backend Developer',
          status: 'viewed',
          applied_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          last_updated: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          company_logo_color: '#0066CC',
        },
        {
          id: 'a4',
          company_name: 'Capitec Bank',
          role_title: 'Software Developer',
          status: 'applied',
          applied_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          last_updated: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          company_logo_color: '#ED1C24',
        },
        {
          id: 'a5',
          company_name: 'FNB',
          role_title: 'Cloud Engineer',
          status: 'rejected',
          applied_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          last_updated: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          company_logo_color: '#009FDA',
        },
      ];

      setAnalyses(mockAnalyses);
      setVideoAnalysis(mockVideoAnalysis);
      setApplications(mockApplications);
      if (mockAnalyses.length > 0) {
        setSelectedAnalysis(mockAnalyses[0]);
      }

      setUserProfile({
        name: 'Thabo Molefe',
        email: 'thabo@example.com',
        plan: 'free',
        cv_analyses_count: mockAnalyses.length,
        video_analyses_count: mockVideoAnalysis ? 1 : 0,
        profile_completion: mockVideoAnalysis ? 75 : 50,
        talent_pool_opted_in: true,
        talent_pool_visibility: 'public',
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTalentPoolToggle = () => {
    setUserProfile(prev => ({
      ...prev,
      talent_pool_opted_in: !prev.talent_pool_opted_in
    }));
    // In production, this would call an API to update the user's talent pool status
  };

  const handleVisibilityChange = (visibility: 'public' | 'anonymous' | 'hidden') => {
    setUserProfile(prev => ({
      ...prev,
      talent_pool_visibility: visibility
    }));
    // In production, this would call an API to update visibility settings
  };

  const latestAnalysis = analyses[0];

  if (isLoading) {
    return (
      <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", background: '#f8fafc', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', animation: 'pulse 2s ease-in-out infinite' }}>
            <span style={{ fontSize: '1.75rem' }}>📊</span>
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0f172a' }}>Loading your dashboard...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", background: '#f8fafc', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ background: 'white', borderRadius: 16, padding: 32, textAlign: 'center', maxWidth: 400, border: '1px solid #fee2e2' }}>
          <div style={{ width: 64, height: 64, background: '#fef2f2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <span style={{ fontSize: '1.75rem' }}>⚠️</span>
          </div>
          <h2 style={{ margin: '0 0 8px', color: '#dc2626' }}>Something went wrong</h2>
          <p style={{ color: '#64748b', marginBottom: 16 }}>{error}</p>
          <button onClick={fetchDashboardData} style={{ background: '#4F46E5', color: 'white', border: 'none', padding: '12px 24px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", background: '#f8fafc', minHeight: '100vh' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');*{margin:0;padding:0;box-sizing:border-box}@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}@media(max-width:900px){.dashboard-grid{grid-template-columns:1fr!important}.sidebar-col{order:2!important}}`}</style>

      {/* Header */}
      <header style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '16px 24px', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <a href="/" style={{ textDecoration: 'none' }}>
            <Logo size={32} />
          </a>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <a href="/upload" style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#4F46E5', color: 'white', padding: '10px 20px', borderRadius: 8, fontSize: '0.9rem', fontWeight: 600, textDecoration: 'none' }}>
              <span>📄</span> Analyze New CV
            </a>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#4F46E5', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem' }}>
              {userProfile.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
        {/* Welcome Section */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>
            Welcome back, {userProfile.name.split(' ')[0]}!
          </h1>
          <p style={{ color: '#64748b', fontSize: '1rem' }}>
            {analyses.length === 0
              ? "Upload your CV to get started with AI-powered analysis."
              : `You have ${analyses.length} CV ${analyses.length === 1 ? 'analysis' : 'analyses'} and ${applications.length} active applications.`
            }
          </p>
        </div>

        {/* Dashboard Navigation Tabs */}
        <DashboardTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Upgrade Prompt - Only show on overview */}
        {activeTab === 'overview' && <UpgradePrompt plan={userProfile.plan} />}

        {/* Tab Content */}
        {activeTab === 'upsell' ? (
          /* Upsell Tab */
          <UpsellSection />
        ) : activeTab === 'applications' ? (
          /* Applications Tab */
          <ApplicationTracker applications={applications} />
        ) : activeTab === 'video' ? (
          /* Video Tab */
          <VideoAnalysisCard videoAnalysis={videoAnalysis} />
        ) : activeTab === 'talent-pool' ? (
          /* Talent Pool Tab */
          <TalentPoolOptIn
            isOptedIn={userProfile.talent_pool_opted_in}
            visibility={userProfile.talent_pool_visibility}
            onToggle={handleTalentPoolToggle}
            onVisibilityChange={handleVisibilityChange}
          />
        ) : analyses.length === 0 ? (
          /* Empty State */
          <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: '64px 32px', textAlign: 'center' }}>
            <div style={{ width: 80, height: 80, background: '#eef2ff', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <span style={{ fontSize: '2.5rem' }}>📄</span>
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>No CV analyses yet</h2>
            <p style={{ color: '#64748b', marginBottom: 24, maxWidth: 400, margin: '0 auto 24px' }}>
              Upload your CV to get AI-powered feedback and improve your chances of landing interviews.
            </p>
            <a href="/upload" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#4F46E5', color: 'white', padding: '14px 28px', borderRadius: 10, fontSize: '1rem', fontWeight: 600, textDecoration: 'none' }}>
              <span>📤</span> Upload Your CV
            </a>
          </div>
        ) : activeTab === 'cv' ? (
          /* CV Analysis Tab - Full width single column */
          <div>
            {/* Latest Score Card */}
            <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24, marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24 }}>
                <div>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Latest CV Score</h2>
                  <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: 16 }}>{latestAnalysis.target_role || 'General Analysis'}</p>
                  <CircularScore score={latestAnalysis.overall_score} size={140} />
                  {analyses.length > 1 && <ScoreHistoryChart analyses={analyses} />}
                </div>
                <div style={{ flex: 1, minWidth: 280 }}>
                  <div style={{ background: '#f8fafc', borderRadius: 12, padding: 16 }}>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#0f172a', marginBottom: 8 }}>Score Breakdown</h3>
                    <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.6, margin: 0 }}>{latestAnalysis.score_explanation}</p>
                  </div>
                  <div style={{ marginTop: 16 }}>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#0f172a', marginBottom: 10 }}>Top Strengths</h3>
                    {latestAnalysis.strengths.map((s, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.75rem' }}>✓</div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#0f172a' }}>{s.strength}</div>
                          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{s.evidence}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Wins */}
            {latestAnalysis.quick_wins.length > 0 && (
              <div style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', borderRadius: 16, padding: 20, marginBottom: 24, border: '1px solid #fde68a' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <span style={{ fontSize: '1.25rem' }}>⚡</span>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#92400e', margin: 0 }}>Quick Wins - Do These Today!</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {latestAnalysis.quick_wins.map((win, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'white', borderRadius: 8 }}>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#f59e0b', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem' }}>{i + 1}</div>
                      <span style={{ fontSize: '0.9rem', color: '#78350f' }}>{win}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Improvement Tips */}
            <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24, marginBottom: 24 }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>Improvement Suggestions</h3>
              {latestAnalysis.improvements.map((tip, i) => (
                <ImprovementTipCard key={i} tip={tip} />
              ))}
            </div>

            {/* Analysis History */}
            {analyses.length > 1 && (
              <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24 }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>Previous Analyses</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {analyses.slice(1).map((analysis) => (
                    <AnalysisHistoryItem
                      key={analysis.id}
                      analysis={analysis}
                      onClick={() => setSelectedAnalysis(analysis)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Overview Dashboard Grid */
          <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
            {/* Main Column */}
            <div>
              {/* Quick Stats Row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
                <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: 16, textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#4F46E5' }}>{latestAnalysis.overall_score}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>CV Score</div>
                </div>
                <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: 16, textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#a855f7' }}>{videoAnalysis?.overall_score || '--'}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Video Score</div>
                </div>
                <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: 16, textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10B981' }}>{applications.filter(a => a.status === 'shortlisted' || a.status === 'interview').length}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Shortlisted</div>
                </div>
                <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: 16, textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f59e0b' }}>{applications.length}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Applications</div>
                </div>
              </div>

              {/* Latest Score Card */}
              <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24, marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Latest CV Score</h2>
                  <button onClick={() => setActiveTab('cv')} style={{ background: 'none', border: 'none', color: '#4F46E5', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>View Details →</button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                  <CircularScore score={latestAnalysis.overall_score} size={120} />
                  <div style={{ flex: 1 }}>
                    <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: 12 }}>{latestAnalysis.target_role || 'General Analysis'}</p>
                    <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.6, margin: 0 }}>{latestAnalysis.score_explanation}</p>
                  </div>
                </div>
              </div>

              {/* Quick Wins */}
              {latestAnalysis.quick_wins.length > 0 && (
                <div style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', borderRadius: 16, padding: 20, marginBottom: 24, border: '1px solid #fde68a' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <span style={{ fontSize: '1.25rem' }}>⚡</span>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#92400e', margin: 0 }}>Quick Wins - Do These Today!</h3>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {latestAnalysis.quick_wins.slice(0, 3).map((win, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'white', borderRadius: 8 }}>
                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#f59e0b', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem' }}>{i + 1}</div>
                        <span style={{ fontSize: '0.9rem', color: '#78350f' }}>{win}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Applications */}
              {applications.length > 0 && (
                <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24, marginBottom: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Recent Applications</h3>
                    <button onClick={() => setActiveTab('applications')} style={{ background: 'none', border: 'none', color: '#4F46E5', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>View All →</button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {applications.slice(0, 3).map((app) => {
                      const statusColors: Record<string, { color: string; bg: string }> = {
                        applied: { color: '#64748b', bg: '#f1f5f9' },
                        viewed: { color: '#3b82f6', bg: '#dbeafe' },
                        shortlisted: { color: '#8b5cf6', bg: '#ede9fe' },
                        interview: { color: '#10b981', bg: '#d1fae5' },
                        rejected: { color: '#ef4444', bg: '#fee2e2' },
                        offer: { color: '#059669', bg: '#a7f3d0' },
                      };
                      const colors = statusColors[app.status] || statusColors.applied;
                      return (
                        <div key={app.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: '#f8fafc', borderRadius: 10 }}>
                          <div style={{ width: 40, height: 40, borderRadius: 8, background: app.company_logo_color || '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '0.8rem', color: 'white' }}>
                            {app.company_name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.9rem' }}>{app.role_title}</div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{app.company_name}</div>
                          </div>
                          <span style={{ padding: '4px 10px', background: colors.bg, color: colors.color, borderRadius: 100, fontSize: '0.75rem', fontWeight: 600, textTransform: 'capitalize' }}>{app.status}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Video Analysis Preview */}
              <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Video Analysis</h3>
                  <button onClick={() => setActiveTab('video')} style={{ background: 'none', border: 'none', color: '#a855f7', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>View Details →</button>
                </div>
                {videoAnalysis ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    <div style={{ width: 80, height: 80, borderRadius: 12, background: 'linear-gradient(135deg, #a855f7, #9333ea)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                      <span style={{ color: 'white', fontSize: '1.5rem', fontWeight: 800 }}>{videoAnalysis.overall_score}</span>
                      <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.65rem' }}>Score</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '0.9rem', color: '#475569', margin: '0 0 8px', lineHeight: 1.5 }}>{videoAnalysis.feedback.slice(0, 120)}...</p>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <span style={{ padding: '4px 10px', background: '#d1fae5', color: '#059669', borderRadius: 100, fontSize: '0.75rem', fontWeight: 500 }}>+{videoAnalysis.strengths.length} strengths</span>
                        <span style={{ padding: '4px 10px', background: '#fef3c7', color: '#b45309', borderRadius: 100, fontSize: '0.75rem', fontWeight: 500 }}>{videoAnalysis.improvements.length} to improve</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16, background: '#fdf4ff', borderRadius: 12 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: '#a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ color: 'white', fontSize: '1.25rem' }}>🎥</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: '0.9rem', color: '#7e22ce', fontWeight: 500 }}>Stand out with a video intro</p>
                      <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#9333ea' }}>Employers are 3x more likely to shortlist candidates with video profiles</p>
                    </div>
                    <a href="/upload?tab=video" style={{ padding: '10px 16px', background: '#a855f7', color: 'white', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none' }}>Record</a>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="sidebar-col">
              {/* Quick Actions */}
              <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: 20, marginBottom: 20 }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>Quick Actions</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <a href="/upload" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: '#eef2ff', borderRadius: 8, textDecoration: 'none', transition: 'all 0.2s' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ color: 'white' }}>📄</span>
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: '#4F46E5', fontSize: '0.9rem' }}>Upload New CV</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Get fresh analysis</div>
                    </div>
                  </a>
                  <a href="/upload?tab=video" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: '#fdf4ff', borderRadius: 8, textDecoration: 'none' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: '#a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ color: 'white' }}>🎥</span>
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: '#a855f7', fontSize: '0.9rem' }}>Record Video Intro</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Stand out from the crowd</div>
                    </div>
                  </a>
                </div>
              </div>

              {/* Talent Pool Status */}
              <div style={{ background: userProfile.talent_pool_opted_in ? 'linear-gradient(135deg, #ecfdf5, #d1fae5)' : 'white', borderRadius: 12, border: `1px solid ${userProfile.talent_pool_opted_in ? '#86efac' : '#e2e8f0'}`, padding: 20, marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <span style={{ fontSize: '1.25rem' }}>{userProfile.talent_pool_opted_in ? '✓' : '👥'}</span>
                  <span style={{ fontWeight: 600, color: userProfile.talent_pool_opted_in ? '#166534' : '#0f172a' }}>Talent Pool</span>
                  {userProfile.talent_pool_opted_in && (
                    <span style={{ padding: '2px 8px', background: '#10B981', color: 'white', borderRadius: 100, fontSize: '0.65rem', fontWeight: 600 }}>ACTIVE</span>
                  )}
                </div>
                <p style={{ fontSize: '0.85rem', color: userProfile.talent_pool_opted_in ? '#15803d' : '#64748b', margin: '0 0 12px', lineHeight: 1.5 }}>
                  {userProfile.talent_pool_opted_in
                    ? 'You are visible to employers. Update your profile to improve matches.'
                    : 'Join to get discovered by top SA employers.'}
                </p>
                <button onClick={() => setActiveTab('talent-pool')} style={{ width: '100%', padding: '10px', background: userProfile.talent_pool_opted_in ? 'white' : '#10B981', color: userProfile.talent_pool_opted_in ? '#166534' : 'white', border: userProfile.talent_pool_opted_in ? '1px solid #86efac' : 'none', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
                  {userProfile.talent_pool_opted_in ? 'Manage Settings' : 'Join Now'}
                </button>
              </div>

              {/* Profile Completion */}
              <ProfileCompletionMeter completion={userProfile.profile_completion} />

              {/* Stats Summary */}
              <div style={{ marginTop: 20, padding: 16, background: '#f8fafc', borderRadius: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#4F46E5' }}>{userProfile.cv_analyses_count}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>CV Analyses</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#a855f7' }}>{userProfile.video_analyses_count}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Video Analyses</div>
                  </div>
                </div>
              </div>

              {/* Upsell Teaser */}
              <div style={{ marginTop: 20, background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #EC4899 100%)', borderRadius: 12, padding: 20, color: 'white' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: '1.25rem' }}>⭐</span>
                  <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Boost Your Career</span>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)', margin: '0 0 14px', lineHeight: 1.5 }}>
                  Get video coaching, AI interview practice, and industry insights.
                </p>
                <button
                  onClick={() => setActiveTab('upsell')}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: 'white',
                    color: '#4F46E5',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Explore Premium Features →
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #e2e8f0', padding: '24px', marginTop: 48 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <Logo size={24} />
          <div style={{ display: 'flex', gap: 24 }}>
            <a href="/privacy" style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.85rem' }}>Privacy</a>
            <a href="/terms" style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.85rem' }}>Terms</a>
            <a href="/" style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.85rem' }}>For Employers</a>
          </div>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>© 2026 Hyred</div>
        </div>
      </footer>
    </div>
  );
}
