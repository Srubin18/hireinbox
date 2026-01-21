'use client';

import { useState, useEffect } from 'react';

/* ===========================================
   HIREINBOX B2C - CANDIDATE DASHBOARD
   Personal dashboard for job seekers
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

interface UserProfile {
  name: string;
  email: string;
  plan: 'free' | 'basic' | 'pro';
  cv_analyses_count: number;
  video_analyses_count: number;
  profile_completion: number;
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
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: 'Job Seeker',
    email: 'user@example.com',
    plan: 'free',
    cv_analyses_count: 0,
    video_analyses_count: 0,
    profile_completion: 25,
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

      // Mock data - replace with actual API call
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
          ],
          improvements: [
            { area: 'Quantify Achievements', suggestion: 'Add metrics to your achievements. Instead of "improved performance", say "improved API response time by 40%"', priority: 'HIGH' },
            { area: 'ATS Keywords', suggestion: 'Add more industry keywords like "agile", "CI/CD", "cloud infrastructure"', priority: 'MEDIUM' },
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

      setAnalyses(mockAnalyses);
      if (mockAnalyses.length > 0) {
        setSelectedAnalysis(mockAnalyses[0]);
      }

      setUserProfile({
        name: 'Thabo Molefe',
        email: 'thabo@example.com',
        plan: 'free',
        cv_analyses_count: mockAnalyses.length,
        video_analyses_count: 0,
        profile_completion: 50,
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
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
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>
            Welcome back, {userProfile.name.split(' ')[0]}! 👋
          </h1>
          <p style={{ color: '#64748b', fontSize: '1rem' }}>
            {analyses.length === 0
              ? "Upload your CV to get started with AI-powered analysis."
              : `You have ${analyses.length} CV ${analyses.length === 1 ? 'analysis' : 'analyses'}. Keep improving!`
            }
          </p>
        </div>

        {/* Upgrade Prompt */}
        <UpgradePrompt plan={userProfile.plan} />

        {analyses.length === 0 ? (
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
        ) : (
          /* Dashboard Grid */
          <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
            {/* Main Column */}
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
                      {latestAnalysis.strengths.slice(0, 2).map((s, i) => (
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
              <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24 }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>Improvement Suggestions</h3>
                {latestAnalysis.improvements.map((tip, i) => (
                  <ImprovementTipCard key={i} tip={tip} />
                ))}
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

              {/* Profile Completion */}
              <ProfileCompletionMeter completion={userProfile.profile_completion} />

              {/* Analysis History */}
              {analyses.length > 1 && (
                <div style={{ marginTop: 20 }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>Analysis History</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {analyses.map((analysis) => (
                      <AnalysisHistoryItem
                        key={analysis.id}
                        analysis={analysis}
                        onClick={() => setSelectedAnalysis(analysis)}
                      />
                    ))}
                  </div>
                </div>
              )}

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
          <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>© 2025 HireInbox</div>
        </div>
      </footer>
    </div>
  );
}
