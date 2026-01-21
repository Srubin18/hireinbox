'use client';

import { useState, useEffect } from 'react';

/* ===========================================
   HIREINBOX MOTHER DASHBOARD - ADMIN PANEL
   Platform-wide metrics and management
   =========================================== */

// Types
interface PlatformStats {
  totalCompanies: number;
  totalCandidates: number;
  totalUsers: number;
  activeSubscriptions: number;
  cvProcessedToday: number;
  cvProcessedWeek: number;
  cvProcessedMonth: number;
  revenue: {
    mrr: number;
    thisMonth: number;
    lastMonth: number;
  };
  aiUsage: {
    tokensUsed: number;
    estimatedCost: number;
    avgTokensPerCV: number;
  };
}

interface Company {
  id: string;
  name: string;
  email: string;
  plan: 'free' | 'starter' | 'growth' | 'business';
  status: 'active' | 'churned' | 'trial';
  candidatesCount: number;
  rolesCount: number;
  createdAt: string;
  lastActive: string;
}

interface ActivityLog {
  id: string;
  type: 'signup' | 'cv_processed' | 'subscription' | 'video_analysis' | 'role_created';
  description: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

interface SystemHealth {
  status: 'healthy' | 'degraded' | 'down';
  database: { status: string; latency: number };
  api: { status: string; latency: number };
  ai: { status: string; latency: number };
  email: { status: string; latency: number };
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
      <span style={{ fontSize: '0.6rem', color: light ? 'rgba(255,255,255,0.7)' : '#dc2626', fontWeight: 600 }}>ADMIN PANEL</span>
    </div>
  </div>
);

// Stat Card Component
const StatCard = ({ icon, iconBg, value, label, sublabel, trend, gradient }: {
  icon: string;
  iconBg: string;
  value: string;
  label: string;
  sublabel?: string;
  trend?: { value: string; positive: boolean };
  gradient?: boolean
}) => (
  <div style={{
    background: gradient ? 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)' : 'white',
    border: gradient ? 'none' : '1px solid #e2e8f0',
    borderRadius: 16,
    padding: 20,
    color: gradient ? 'white' : '#0f172a'
  }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
      <div style={{
        width: 48,
        height: 48,
        borderRadius: 12,
        background: gradient ? 'rgba(255,255,255,0.2)' : iconBg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.5rem'
      }}>{icon}</div>
      {trend && (
        <span style={{
          fontSize: '0.75rem',
          fontWeight: 600,
          padding: '4px 10px',
          borderRadius: 100,
          background: gradient ? 'rgba(255,255,255,0.2)' : (trend.positive ? '#dcfce7' : '#fee2e2'),
          color: gradient ? 'white' : (trend.positive ? '#166534' : '#dc2626')
        }}>
          {trend.positive ? '+' : ''}{trend.value}
        </span>
      )}
    </div>
    <div style={{ fontSize: '2.25rem', fontWeight: 800, lineHeight: 1, marginBottom: 4, letterSpacing: '-0.02em' }}>{value}</div>
    <div style={{ fontSize: '0.85rem', color: gradient ? 'rgba(255,255,255,0.8)' : '#64748b', fontWeight: 500 }}>{label}</div>
    {sublabel && <div style={{ fontSize: '0.75rem', color: gradient ? 'rgba(255,255,255,0.6)' : '#94a3b8', marginTop: 4 }}>{sublabel}</div>}
  </div>
);

// Health Indicator Component
const HealthIndicator = ({ name, status, latency }: { name: string; status: string; latency: number }) => {
  const getStatusColor = () => {
    if (status === 'healthy' || status === 'operational') return '#10B981';
    if (status === 'degraded' || status === 'slow') return '#F59E0B';
    return '#EF4444';
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: getStatusColor() }} />
        <span style={{ fontWeight: 500, color: '#0f172a', fontSize: '0.9rem' }}>{name}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{latency}ms</span>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: getStatusColor(), textTransform: 'uppercase' }}>{status}</span>
      </div>
    </div>
  );
};

// Company Row Component
const CompanyRow = ({ company, onSelect }: { company: Company; onSelect: () => void }) => {
  const planColors: Record<string, { bg: string; text: string }> = {
    free: { bg: '#f1f5f9', text: '#64748b' },
    starter: { bg: '#dbeafe', text: '#1d4ed8' },
    growth: { bg: '#dcfce7', text: '#166534' },
    business: { bg: '#fef3c7', text: '#92400e' },
  };
  const statusColors: Record<string, { bg: string; text: string }> = {
    active: { bg: '#dcfce7', text: '#166534' },
    trial: { bg: '#e0e7ff', text: '#4F46E5' },
    churned: { bg: '#fee2e2', text: '#dc2626' },
  };

  const plan = planColors[company.plan] || planColors.free;
  const status = statusColors[company.status] || statusColors.active;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' });
  };

  return (
    <div onClick={onSelect} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', transition: 'background 0.2s' }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: '#eef2ff', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem' }}>
        {company.name.slice(0, 2).toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.9rem' }}>{company.name}</div>
        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{company.email}</div>
      </div>
      <div style={{ textAlign: 'center', minWidth: 60 }}>
        <div style={{ fontWeight: 700, color: '#0f172a' }}>{company.candidatesCount}</div>
        <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>CVs</div>
      </div>
      <div style={{ textAlign: 'center', minWidth: 50 }}>
        <div style={{ fontWeight: 700, color: '#0f172a' }}>{company.rolesCount}</div>
        <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Roles</div>
      </div>
      <span style={{ padding: '4px 10px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 600, background: plan.bg, color: plan.text, textTransform: 'capitalize' }}>{company.plan}</span>
      <span style={{ padding: '4px 10px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 600, background: status.bg, color: status.text, textTransform: 'capitalize' }}>{company.status}</span>
      <div style={{ fontSize: '0.75rem', color: '#94a3b8', minWidth: 80, textAlign: 'right' }}>{formatDate(company.lastActive)}</div>
    </div>
  );
};

// Activity Item Component
const ActivityItem = ({ activity }: { activity: ActivityLog }) => {
  const icons: Record<string, string> = {
    signup: '👤',
    cv_processed: '📄',
    subscription: '💳',
    video_analysis: '🎥',
    role_created: '💼',
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' });
  };

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <span>{icons[activity.type] || '📋'}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.85rem', color: '#0f172a', lineHeight: 1.4 }}>{activity.description}</div>
        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 2 }}>{formatTime(activity.timestamp)}</div>
      </div>
    </div>
  );
};

// Mini Chart Component for User Growth
const GrowthChart = ({ data, label }: { data: number[]; label: string }) => {
  const max = Math.max(...data, 1);
  const height = 60;

  return (
    <div style={{ background: '#f8fafc', borderRadius: 12, padding: 16 }}>
      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: 12 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height }}>
        {data.map((value, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{
              width: '100%',
              height: Math.max((value / max) * height, 4),
              background: i === data.length - 1 ? '#4F46E5' : '#c7d2fe',
              borderRadius: 4,
              transition: 'height 0.3s ease'
            }} />
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: '0.65rem', color: '#94a3b8' }}>
        <span>7 days ago</span>
        <span>Today</span>
      </div>
    </div>
  );
};

export default function AdminDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'companies' | 'activity'>('overview');
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // In production, fetch from /api/admin/stats, /api/admin/companies, etc.
      // Using mock data to demonstrate the UI
      await new Promise(resolve => setTimeout(resolve, 800));

      // Mock stats
      setStats({
        totalCompanies: 47,
        totalCandidates: 2834,
        totalUsers: 156,
        activeSubscriptions: 23,
        cvProcessedToday: 89,
        cvProcessedWeek: 412,
        cvProcessedMonth: 1567,
        revenue: {
          mrr: 18500,
          thisMonth: 22400,
          lastMonth: 19200,
        },
        aiUsage: {
          tokensUsed: 4500000,
          estimatedCost: 2340,
          avgTokensPerCV: 1590,
        },
      });

      // Mock companies
      setCompanies([
        { id: '1', name: 'TechStart SA', email: 'hr@techstart.co.za', plan: 'growth', status: 'active', candidatesCount: 234, rolesCount: 5, createdAt: '2025-01-01', lastActive: '2025-01-21' },
        { id: '2', name: 'FinanceHub', email: 'recruit@financehub.co.za', plan: 'business', status: 'active', candidatesCount: 567, rolesCount: 12, createdAt: '2024-11-15', lastActive: '2025-01-21' },
        { id: '3', name: 'Acme Corp', email: 'simon@acme.co.za', plan: 'starter', status: 'trial', candidatesCount: 45, rolesCount: 2, createdAt: '2025-01-18', lastActive: '2025-01-20' },
        { id: '4', name: 'RetailPro', email: 'jobs@retailpro.co.za', plan: 'growth', status: 'active', candidatesCount: 189, rolesCount: 8, createdAt: '2024-12-01', lastActive: '2025-01-19' },
        { id: '5', name: 'StartupXYZ', email: 'founders@startupxyz.com', plan: 'free', status: 'churned', candidatesCount: 12, rolesCount: 1, createdAt: '2024-10-15', lastActive: '2024-12-20' },
        { id: '6', name: 'Healthcare Plus', email: 'hr@healthcareplus.co.za', plan: 'business', status: 'active', candidatesCount: 423, rolesCount: 15, createdAt: '2024-09-01', lastActive: '2025-01-21' },
        { id: '7', name: 'EduTech SA', email: 'talent@edutechsa.co.za', plan: 'starter', status: 'active', candidatesCount: 78, rolesCount: 3, createdAt: '2025-01-10', lastActive: '2025-01-21' },
      ]);

      // Mock activities
      setActivities([
        { id: '1', type: 'cv_processed', description: 'TechStart SA processed 12 CVs for Senior Developer role', timestamp: new Date().toISOString() },
        { id: '2', type: 'signup', description: 'New company signup: CloudOps SA (cloudops.co.za)', timestamp: new Date(Date.now() - 15 * 60000).toISOString() },
        { id: '3', type: 'subscription', description: 'FinanceHub upgraded from Growth to Business plan', timestamp: new Date(Date.now() - 45 * 60000).toISOString() },
        { id: '4', type: 'video_analysis', description: 'Video analysis completed for candidate at RetailPro', timestamp: new Date(Date.now() - 2 * 3600000).toISOString() },
        { id: '5', type: 'role_created', description: 'Healthcare Plus created new role: Nursing Manager', timestamp: new Date(Date.now() - 3 * 3600000).toISOString() },
        { id: '6', type: 'cv_processed', description: 'EduTech SA processed 5 CVs for Teacher position', timestamp: new Date(Date.now() - 5 * 3600000).toISOString() },
        { id: '7', type: 'signup', description: 'New user registered: Thabo M. (TechStart SA)', timestamp: new Date(Date.now() - 8 * 3600000).toISOString() },
      ]);

      // Mock system health
      setSystemHealth({
        status: 'healthy',
        database: { status: 'operational', latency: 12 },
        api: { status: 'operational', latency: 45 },
        ai: { status: 'operational', latency: 890 },
        email: { status: 'operational', latency: 234 },
      });

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCompanies = companies.filter(c =>
    !searchQuery ||
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Mock growth data for charts
  const userGrowthData = [12, 15, 18, 14, 22, 28, 31];
  const cvGrowthData = [45, 67, 89, 78, 95, 112, 89];

  if (isLoading) {
    return (
      <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", background: '#0f172a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, border: '4px solid rgba(255,255,255,0.1)', borderTop: '4px solid #4F46E5', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 20px' }} />
          <div style={{ color: 'white', fontSize: '1.1rem', fontWeight: 600 }}>Loading admin dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", background: '#f1f5f9', minHeight: '100vh' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');*{margin:0;padding:0;box-sizing:border-box}@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}@media(max-width:900px){.admin-grid{grid-template-columns:1fr!important}.admin-stats{grid-template-columns:repeat(2,1fr)!important}}`}</style>

      {/* Header */}
      <header style={{ background: '#0f172a', padding: '16px 32px', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Logo size={32} light />
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <div style={{ display: 'flex', gap: 4 }}>
              {(['overview', 'companies', 'activity'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '8px 16px', background: activeTab === tab ? 'rgba(255,255,255,0.1)' : 'transparent', color: activeTab === tab ? 'white' : 'rgba(255,255,255,0.6)', border: 'none', borderRadius: 6, fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer', textTransform: 'capitalize' }}>{tab}</button>
              ))}
            </div>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#dc2626', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem' }}>SR</div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: 1400, margin: '0 auto', padding: '32px' }}>
        {/* System Status Banner */}
        {systemHealth && (
          <div style={{ background: systemHealth.status === 'healthy' ? 'linear-gradient(135deg, #dcfce7, #d1fae5)' : '#fef3c7', borderRadius: 12, padding: '12px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: systemHealth.status === 'healthy' ? '1px solid #86efac' : '1px solid #fde68a' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: systemHealth.status === 'healthy' ? '#10B981' : '#F59E0B', animation: 'pulse 2s infinite' }} />
              <span style={{ fontWeight: 600, color: systemHealth.status === 'healthy' ? '#166534' : '#92400e' }}>All systems operational</span>
            </div>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Last checked: Just now</span>
          </div>
        )}

        {activeTab === 'overview' && stats && (
          <>
            {/* Main Stats Grid */}
            <div className="admin-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 32 }}>
              <StatCard icon="🏢" iconBg="#eef2ff" value={stats.totalCompanies.toString()} label="Total Companies" trend={{ value: '3 this week', positive: true }} />
              <StatCard icon="📄" iconBg="#dcfce7" value={stats.totalCandidates.toLocaleString()} label="Total CVs Processed" sublabel={`${stats.cvProcessedToday} today`} trend={{ value: `${stats.cvProcessedWeek} this week`, positive: true }} />
              <StatCard icon="👥" iconBg="#fef3c7" value={stats.totalUsers.toString()} label="Platform Users" />
              <StatCard icon="💳" iconBg="#e0e7ff" value={stats.activeSubscriptions.toString()} label="Active Subscriptions" gradient />
            </div>

            {/* Revenue and AI Stats */}
            <div className="admin-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginBottom: 32 }}>
              {/* Revenue Section */}
              <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24 }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: 20 }}>Revenue Overview</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
                  <div style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', borderRadius: 12, padding: 20, textAlign: 'center' }}>
                    <div style={{ fontSize: '0.8rem', color: '#166534', fontWeight: 500, marginBottom: 8 }}>Monthly Recurring</div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: '#166534' }}>R{stats.revenue.mrr.toLocaleString()}</div>
                    <div style={{ fontSize: '0.75rem', color: '#15803d', marginTop: 4 }}>MRR</div>
                  </div>
                  <div style={{ background: '#f8fafc', borderRadius: 12, padding: 20, textAlign: 'center' }}>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500, marginBottom: 8 }}>This Month</div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a' }}>R{stats.revenue.thisMonth.toLocaleString()}</div>
                    <div style={{ fontSize: '0.75rem', color: '#10B981', marginTop: 4 }}>+{Math.round((stats.revenue.thisMonth - stats.revenue.lastMonth) / stats.revenue.lastMonth * 100)}% vs last month</div>
                  </div>
                  <div style={{ background: '#f8fafc', borderRadius: 12, padding: 20, textAlign: 'center' }}>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500, marginBottom: 8 }}>Last Month</div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a' }}>R{stats.revenue.lastMonth.toLocaleString()}</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 4 }}>December 2025</div>
                  </div>
                </div>
              </div>

              {/* AI Usage */}
              <div style={{ background: 'linear-gradient(135deg, #1e293b, #0f172a)', borderRadius: 16, padding: 24, color: 'white' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 20 }}>AI Usage Stats</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>Tokens Used (This Month)</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{(stats.aiUsage.tokensUsed / 1000000).toFixed(1)}M</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>Estimated AI Cost</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>R{stats.aiUsage.estimatedCost.toLocaleString()}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>Avg Tokens per CV</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats.aiUsage.avgTokensPerCV.toLocaleString()}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Growth Charts and System Health */}
            <div className="admin-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24, marginBottom: 32 }}>
              <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24 }}>
                <GrowthChart data={userGrowthData} label="New Users (Last 7 Days)" />
                <div style={{ marginTop: 16, textAlign: 'center' }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#4F46E5' }}>{userGrowthData.reduce((a, b) => a + b, 0)}</span>
                  <span style={{ fontSize: '0.85rem', color: '#64748b', marginLeft: 8 }}>total new users</span>
                </div>
              </div>
              <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24 }}>
                <GrowthChart data={cvGrowthData} label="CVs Processed (Last 7 Days)" />
                <div style={{ marginTop: 16, textAlign: 'center' }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10B981' }}>{cvGrowthData.reduce((a, b) => a + b, 0)}</span>
                  <span style={{ fontSize: '0.85rem', color: '#64748b', marginLeft: 8 }}>CVs processed</span>
                </div>
              </div>
              <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24 }}>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>System Health</div>
                {systemHealth && (
                  <div>
                    <HealthIndicator name="Database" status={systemHealth.database.status} latency={systemHealth.database.latency} />
                    <HealthIndicator name="API" status={systemHealth.api.status} latency={systemHealth.api.latency} />
                    <HealthIndicator name="AI Services" status={systemHealth.ai.status} latency={systemHealth.ai.latency} />
                    <HealthIndicator name="Email" status={systemHealth.email.status} latency={systemHealth.email.latency} />
                  </div>
                )}
              </div>
            </div>

            {/* Recent Activity */}
            <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Recent Activity</h2>
                <button onClick={() => setActiveTab('activity')} style={{ background: 'none', border: 'none', color: '#4F46E5', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>View All →</button>
              </div>
              <div>
                {activities.slice(0, 5).map(activity => (
                  <ActivityItem key={activity.id} activity={activity} />
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === 'companies' && (
          <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>All Companies ({companies.length})</h2>
              <div style={{ display: 'flex', gap: 12 }}>
                <input type="text" placeholder="Search companies..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ padding: '10px 16px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.875rem', width: 250, outline: 'none' }} />
                <select style={{ padding: '10px 16px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.875rem', background: 'white', cursor: 'pointer' }}>
                  <option>All Plans</option>
                  <option>Free</option>
                  <option>Starter</option>
                  <option>Growth</option>
                  <option>Business</option>
                </select>
                <select style={{ padding: '10px 16px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.875rem', background: 'white', cursor: 'pointer' }}>
                  <option>All Status</option>
                  <option>Active</option>
                  <option>Trial</option>
                  <option>Churned</option>
                </select>
              </div>
            </div>
            <div style={{ padding: '8px 16px', background: '#f8fafc', display: 'flex', alignItems: 'center', gap: 14, fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
              <div style={{ width: 40 }} />
              <div style={{ flex: 1 }}>Company</div>
              <div style={{ textAlign: 'center', minWidth: 60 }}>CVs</div>
              <div style={{ textAlign: 'center', minWidth: 50 }}>Roles</div>
              <div style={{ minWidth: 70 }}>Plan</div>
              <div style={{ minWidth: 70 }}>Status</div>
              <div style={{ minWidth: 80, textAlign: 'right' }}>Last Active</div>
            </div>
            {filteredCompanies.map(company => (
              <CompanyRow key={company.id} company={company} onSelect={() => console.log('Selected:', company.id)} />
            ))}
          </div>
        )}

        {activeTab === 'activity' && (
          <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24 }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: 20 }}>Activity Log</h2>
            <div>
              {activities.map(activity => (
                <ActivityItem key={activity.id} activity={activity} />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #e2e8f0', padding: '20px 32px', marginTop: 32 }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>HireInbox Admin Panel v1.0</div>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Environment: Production | Region: ZA-1</div>
        </div>
      </footer>
    </div>
  );
}
