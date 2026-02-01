'use client';

import { useState, useEffect } from 'react';

/* ===========================================
   HIREINBOX MOTHER DASHBOARD - ADMIN PANEL
   Platform-wide metrics and management
   For: Simon, Shay (Hyred Team)
   =========================================== */

// Types
interface PlatformStats {
  totalEmployers: number;
  totalJobSeekers: number;
  totalUsers: number;
  activeSubscriptions: number;
  cvProcessedToday: number;
  cvProcessedWeek: number;
  cvProcessedMonth: number;
  videoAnalysesToday: number;
  revenue: {
    mrr: number;
    thisMonth: number;
    lastMonth: number;
    b2bRevenue: number;
    b2cRevenue: number;
  };
  aiUsage: {
    tokensUsed: number;
    estimatedCost: number;
    avgTokensPerCV: number;
    openAICost: number;
    anthropicCost: number;
  };
}

interface Customer {
  id: string;
  name: string;
  email: string;
  type: 'b2b' | 'b2c';
  plan: 'free' | 'starter' | 'growth' | 'business' | 'enterprise';
  status: 'active' | 'churned' | 'trial' | 'paused';
  candidatesCount: number;
  rolesCount: number;
  cvScansUsed: number;
  videoAnalysesUsed: number;
  createdAt: string;
  lastActive: string;
  monthlySpend: number;
  notes?: string;
}

interface ActivityLog {
  id: string;
  type: 'signup' | 'cv_processed' | 'subscription' | 'video_analysis' | 'role_created' | 'payment' | 'churn' | 'upgrade';
  description: string;
  timestamp: string;
  customer?: string;
  amount?: number;
  metadata?: Record<string, unknown>;
}

interface SystemHealth {
  status: 'healthy' | 'degraded' | 'down';
  database: { status: string; latency: number };
  api: { status: string; latency: number };
  ai: { status: string; latency: number };
  email: { status: string; latency: number };
  stripe: { status: string; latency: number };
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
      <span style={{ fontSize: '0.6rem', color: light ? 'rgba(255,255,255,0.7)' : '#dc2626', fontWeight: 600, letterSpacing: '0.05em' }}>ADMIN PANEL</span>
    </div>
  </div>
);

// Stat Card Component - Professional SVG icons
const StatCard = ({ icon, iconBg, iconColor, value, label, sublabel, trend, gradient, onClick }: {
  icon: React.ReactNode;
  iconBg: string;
  iconColor?: string;
  value: string;
  label: string;
  sublabel?: string;
  trend?: { value: string; positive: boolean };
  gradient?: boolean;
  onClick?: () => void;
}) => (
  <div onClick={onClick} style={{
    background: gradient ? 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)' : 'white',
    border: gradient ? 'none' : '1px solid #e2e8f0',
    borderRadius: 16,
    padding: 20,
    color: gradient ? 'white' : '#0f172a',
    cursor: onClick ? 'pointer' : 'default',
    transition: 'transform 0.2s, box-shadow 0.2s',
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
        color: gradient ? 'white' : (iconColor || '#4F46E5')
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

// Customer Row Component with Actions
const CustomerRow = ({ customer, onView, onPause, onResume }: {
  customer: Customer;
  onView: () => void;
  onPause: () => void;
  onResume: () => void;
}) => {
  const planColors: Record<string, { bg: string; text: string }> = {
    free: { bg: '#f1f5f9', text: '#64748b' },
    starter: { bg: '#dbeafe', text: '#1d4ed8' },
    growth: { bg: '#dcfce7', text: '#166534' },
    business: { bg: '#fef3c7', text: '#92400e' },
    enterprise: { bg: '#fae8ff', text: '#a21caf' },
  };
  const statusColors: Record<string, { bg: string; text: string }> = {
    active: { bg: '#dcfce7', text: '#166534' },
    trial: { bg: '#e0e7ff', text: '#4F46E5' },
    churned: { bg: '#fee2e2', text: '#dc2626' },
    paused: { bg: '#fef3c7', text: '#92400e' },
  };

  const plan = planColors[customer.plan] || planColors.free;
  const status = statusColors[customer.status] || statusColors.active;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' });
  };

  const getTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return formatDate(dateStr);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}>
      <div style={{
        width: 40,
        height: 40,
        borderRadius: 10,
        background: customer.type === 'b2b' ? '#eef2ff' : '#fce7f3',
        color: customer.type === 'b2b' ? '#4F46E5' : '#be185d',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: '0.9rem'
      }}>
        {customer.name.slice(0, 2).toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.9rem' }}>{customer.name}</span>
          <span style={{
            fontSize: '0.6rem',
            fontWeight: 700,
            padding: '2px 6px',
            borderRadius: 4,
            background: customer.type === 'b2b' ? '#eef2ff' : '#fce7f3',
            color: customer.type === 'b2b' ? '#4F46E5' : '#be185d'
          }}>
            {customer.type.toUpperCase()}
          </span>
        </div>
        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{customer.email}</div>
      </div>
      <div style={{ textAlign: 'center', minWidth: 60 }}>
        <div style={{ fontWeight: 700, color: '#0f172a' }}>{customer.cvScansUsed}</div>
        <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>CVs</div>
      </div>
      {customer.type === 'b2b' && (
        <div style={{ textAlign: 'center', minWidth: 50 }}>
          <div style={{ fontWeight: 700, color: '#0f172a' }}>{customer.rolesCount}</div>
          <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Roles</div>
        </div>
      )}
      {customer.type === 'b2c' && (
        <div style={{ textAlign: 'center', minWidth: 50 }}>
          <div style={{ fontWeight: 700, color: '#0f172a' }}>{customer.videoAnalysesUsed}</div>
          <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Videos</div>
        </div>
      )}
      <div style={{ textAlign: 'center', minWidth: 70 }}>
        <div style={{ fontWeight: 700, color: '#166534' }}>R{customer.monthlySpend}</div>
        <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>MRR</div>
      </div>
      <span style={{ padding: '4px 10px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 600, background: plan.bg, color: plan.text, textTransform: 'capitalize', minWidth: 65, textAlign: 'center' }}>{customer.plan}</span>
      <span style={{ padding: '4px 10px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 600, background: status.bg, color: status.text, textTransform: 'capitalize', minWidth: 60, textAlign: 'center' }}>{customer.status}</span>
      <div style={{ fontSize: '0.75rem', color: '#94a3b8', minWidth: 70, textAlign: 'right' }}>{getTimeAgo(customer.lastActive)}</div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={onView} style={{ padding: '6px 10px', background: '#f1f5f9', border: 'none', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600, color: '#475569', cursor: 'pointer' }}>View</button>
        {customer.status === 'paused' ? (
          <button onClick={onResume} style={{ padding: '6px 10px', background: '#dcfce7', border: 'none', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600, color: '#166534', cursor: 'pointer' }}>Resume</button>
        ) : customer.status !== 'churned' ? (
          <button onClick={onPause} style={{ padding: '6px 10px', background: '#fef3c7', border: 'none', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600, color: '#92400e', cursor: 'pointer' }}>Pause</button>
        ) : null}
      </div>
    </div>
  );
};

// Activity Item Component - Professional SVG icons
const ActivityIcon = ({ type }: { type: string }) => {
  const iconMap: Record<string, React.ReactNode> = {
    signup: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    cv_processed: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
    subscription: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
    video_analysis: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>,
    role_created: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>,
    payment: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
    churn: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>,
    upgrade: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>,
  };
  return iconMap[type] || <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/></svg>;
};

const ActivityItem = ({ activity }: { activity: ActivityLog }) => {
  const iconColors: Record<string, string> = {
    signup: '#4F46E5',
    cv_processed: '#10B981',
    subscription: '#6366f1',
    video_analysis: '#be185d',
    role_created: '#f59e0b',
    payment: '#166534',
    churn: '#dc2626',
    upgrade: '#059669',
  };

  const bgColors: Record<string, string> = {
    signup: '#eef2ff',
    cv_processed: '#f0fdf4',
    subscription: '#e0e7ff',
    video_analysis: '#fce7f3',
    role_created: '#fef3c7',
    payment: '#dcfce7',
    churn: '#fee2e2',
    upgrade: '#d1fae5',
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
      <div style={{ width: 36, height: 36, borderRadius: 8, background: bgColors[activity.type] || '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: iconColors[activity.type] || '#64748b' }}>
        <ActivityIcon type={activity.type} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.85rem', color: '#0f172a', lineHeight: 1.4 }}>{activity.description}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{formatTime(activity.timestamp)}</span>
          {activity.customer && <span style={{ fontSize: '0.7rem', color: '#64748b', padding: '2px 6px', background: '#f1f5f9', borderRadius: 4 }}>{activity.customer}</span>}
          {activity.amount && <span style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 600 }}>R{activity.amount}</span>}
        </div>
      </div>
    </div>
  );
};

// Mini Chart Component
const GrowthChart = ({ data, label, color = '#4F46E5' }: { data: number[]; label: string; color?: string }) => {
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
              background: i === data.length - 1 ? color : `${color}40`,
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

// Customer Detail Modal
const CustomerDetailModal = ({ customer, onClose, onPause, onResume }: {
  customer: Customer;
  onClose: () => void;
  onPause: () => void;
  onResume: () => void;
}) => {
  const [notes, setNotes] = useState(customer.notes || '');

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 600, maxHeight: '90vh', overflow: 'hidden', boxShadow: '0 25px 80px rgba(0,0,0,0.25)' }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', background: customer.type === 'b2b' ? '#eef2ff' : '#fce7f3' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 56,
                height: 56,
                borderRadius: 12,
                background: 'white',
                color: customer.type === 'b2b' ? '#4F46E5' : '#be185d',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '1.25rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}>
                {customer.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>{customer.name}</h2>
                  <span style={{
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: 4,
                    background: customer.type === 'b2b' ? '#4F46E5' : '#be185d',
                    color: 'white'
                  }}>
                    {customer.type === 'b2b' ? 'EMPLOYER' : 'JOB SEEKER'}
                  </span>
                </div>
                <div style={{ fontSize: '0.9rem', color: '#64748b' }}>{customer.email}</div>
              </div>
            </div>
            <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.8)', color: '#64748b', cursor: 'pointer', fontSize: '1.2rem' }}>x</button>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: 24, overflowY: 'auto', maxHeight: 'calc(90vh - 200px)' }}>
          {/* Status & Plan */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
            <div style={{ padding: 16, background: '#f8fafc', borderRadius: 12 }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: 4 }}>Status</div>
              <div style={{
                display: 'inline-flex',
                padding: '6px 12px',
                borderRadius: 6,
                fontSize: '0.85rem',
                fontWeight: 600,
                background: customer.status === 'active' ? '#dcfce7' : customer.status === 'paused' ? '#fef3c7' : '#fee2e2',
                color: customer.status === 'active' ? '#166534' : customer.status === 'paused' ? '#92400e' : '#dc2626',
                textTransform: 'capitalize'
              }}>{customer.status}</div>
            </div>
            <div style={{ padding: 16, background: '#f8fafc', borderRadius: 12 }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: 4 }}>Plan</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', textTransform: 'capitalize' }}>{customer.plan}</div>
            </div>
          </div>

          {/* Usage Stats */}
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>Usage This Month</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              <div style={{ padding: 16, background: '#f0fdf4', borderRadius: 10, textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#166534' }}>{customer.cvScansUsed}</div>
                <div style={{ fontSize: '0.75rem', color: '#15803d' }}>CV Scans</div>
              </div>
              {customer.type === 'b2b' && (
                <div style={{ padding: 16, background: '#eef2ff', borderRadius: 10, textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#4F46E5' }}>{customer.rolesCount}</div>
                  <div style={{ fontSize: '0.75rem', color: '#4F46E5' }}>Active Roles</div>
                </div>
              )}
              <div style={{ padding: 16, background: '#fce7f3', borderRadius: 10, textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#be185d' }}>{customer.videoAnalysesUsed}</div>
                <div style={{ fontSize: '0.75rem', color: '#be185d' }}>Video Analyses</div>
              </div>
              <div style={{ padding: 16, background: '#dcfce7', borderRadius: 10, textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#166534' }}>R{customer.monthlySpend}</div>
                <div style={{ fontSize: '0.75rem', color: '#15803d' }}>Monthly Spend</div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>Timeline</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#f8fafc', borderRadius: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: 6, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4F46E5' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>Joined</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{new Date(customer.createdAt).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#f8fafc', borderRadius: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: 6, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>Last Active</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{new Date(customer.lastActive).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>Internal Notes</h3>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Add internal notes about this customer..."
              style={{
                width: '100%',
                padding: 14,
                border: '1px solid #e2e8f0',
                borderRadius: 10,
                fontSize: '0.9rem',
                minHeight: 100,
                resize: 'vertical',
                fontFamily: 'inherit',
                outline: 'none'
              }}
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', background: '#f8fafc' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {customer.status === 'paused' ? (
              <button onClick={onResume} style={{ padding: '10px 20px', background: '#166534', color: 'white', border: 'none', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>Resume Account</button>
            ) : customer.status !== 'churned' ? (
              <button onClick={onPause} style={{ padding: '10px 20px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>Pause Account</button>
            ) : null}
            <button style={{ padding: '10px 20px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>Mark Churned</button>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <a href={`mailto:${customer.email}`} style={{ padding: '10px 20px', background: '#4F46E5', color: 'white', border: 'none', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', textDecoration: 'none' }}>Email Customer</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function AdminDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'b2b' | 'b2c' | 'activity' | 'health'>('overview');
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [filterPlan, setFilterPlan] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // In production, fetch from /api/admin/stats, /api/admin/customers, etc.
      await new Promise(resolve => setTimeout(resolve, 800));

      // Mock stats with B2B and B2C breakdown
      setStats({
        totalEmployers: 47,
        totalJobSeekers: 312,
        totalUsers: 359,
        activeSubscriptions: 38,
        cvProcessedToday: 89,
        cvProcessedWeek: 412,
        cvProcessedMonth: 1567,
        videoAnalysesToday: 23,
        revenue: {
          mrr: 28750,
          thisMonth: 34200,
          lastMonth: 29800,
          b2bRevenue: 24500,
          b2cRevenue: 4250,
        },
        aiUsage: {
          tokensUsed: 4500000,
          estimatedCost: 2340,
          avgTokensPerCV: 1590,
          openAICost: 1890,
          anthropicCost: 450,
        },
      });

      // Mock customers - B2B (Employers) and B2C (Job Seekers)
      setCustomers([
        // B2B Customers
        { id: '1', name: 'Discovery Health', email: 'recruitment@discovery.co.za', type: 'b2b', plan: 'enterprise', status: 'active', candidatesCount: 1234, rolesCount: 15, cvScansUsed: 456, videoAnalysesUsed: 12, createdAt: '2024-08-15', lastActive: new Date().toISOString(), monthlySpend: 4999 },
        { id: '2', name: 'Woolworths SA', email: 'hr@woolworths.co.za', type: 'b2b', plan: 'business', status: 'active', candidatesCount: 567, rolesCount: 12, cvScansUsed: 234, videoAnalysesUsed: 8, createdAt: '2024-11-15', lastActive: new Date().toISOString(), monthlySpend: 1499 },
        { id: '3', name: 'TechStart Cape Town', email: 'hr@techstart.co.za', type: 'b2b', plan: 'growth', status: 'active', candidatesCount: 234, rolesCount: 5, cvScansUsed: 89, videoAnalysesUsed: 4, createdAt: '2025-01-01', lastActive: new Date().toISOString(), monthlySpend: 799 },
        { id: '4', name: 'FinanceHub JHB', email: 'recruit@financehub.co.za', type: 'b2b', plan: 'growth', status: 'active', candidatesCount: 189, rolesCount: 8, cvScansUsed: 67, videoAnalysesUsed: 2, createdAt: '2024-12-01', lastActive: new Date(Date.now() - 2 * 3600000).toISOString(), monthlySpend: 799 },
        { id: '5', name: 'Acme Corp', email: 'simon@acme.co.za', type: 'b2b', plan: 'starter', status: 'trial', candidatesCount: 45, rolesCount: 2, cvScansUsed: 18, videoAnalysesUsed: 0, createdAt: '2025-01-18', lastActive: new Date(Date.now() - 24 * 3600000).toISOString(), monthlySpend: 0, notes: 'Simon\'s test account' },
        { id: '6', name: 'RetailPro', email: 'jobs@retailpro.co.za', type: 'b2b', plan: 'growth', status: 'paused', candidatesCount: 156, rolesCount: 6, cvScansUsed: 45, videoAnalysesUsed: 3, createdAt: '2024-10-15', lastActive: new Date(Date.now() - 7 * 86400000).toISOString(), monthlySpend: 799, notes: 'Paused - budget review' },
        { id: '7', name: 'StartupXYZ', email: 'founders@startupxyz.com', type: 'b2b', plan: 'starter', status: 'churned', candidatesCount: 12, rolesCount: 1, cvScansUsed: 5, videoAnalysesUsed: 0, createdAt: '2024-09-15', lastActive: new Date(Date.now() - 30 * 86400000).toISOString(), monthlySpend: 0 },
        { id: '8', name: 'Healthcare Plus', email: 'hr@healthcareplus.co.za', type: 'b2b', plan: 'business', status: 'active', candidatesCount: 423, rolesCount: 15, cvScansUsed: 178, videoAnalysesUsed: 6, createdAt: '2024-09-01', lastActive: new Date().toISOString(), monthlySpend: 1499 },
        { id: '9', name: 'EduTech SA', email: 'talent@edutechsa.co.za', type: 'b2b', plan: 'starter', status: 'active', candidatesCount: 78, rolesCount: 3, cvScansUsed: 34, videoAnalysesUsed: 1, createdAt: '2025-01-10', lastActive: new Date().toISOString(), monthlySpend: 399 },
        { id: '10', name: 'Standard Bank', email: 'careers@standardbank.co.za', type: 'b2b', plan: 'enterprise', status: 'active', candidatesCount: 2100, rolesCount: 25, cvScansUsed: 890, videoAnalysesUsed: 24, createdAt: '2024-06-01', lastActive: new Date().toISOString(), monthlySpend: 4999 },
        // B2C Customers (Job Seekers)
        { id: '101', name: 'Thabo Molefe', email: 'thabo.m@gmail.com', type: 'b2c', plan: 'free', status: 'active', candidatesCount: 1, rolesCount: 0, cvScansUsed: 1, videoAnalysesUsed: 0, createdAt: '2025-01-20', lastActive: new Date().toISOString(), monthlySpend: 0 },
        { id: '102', name: 'Lerato Nkosi', email: 'lerato.nkosi@outlook.com', type: 'b2c', plan: 'starter', status: 'active', candidatesCount: 1, rolesCount: 0, cvScansUsed: 3, videoAnalysesUsed: 2, createdAt: '2025-01-15', lastActive: new Date().toISOString(), monthlySpend: 79 },
        { id: '103', name: 'Sipho Dlamini', email: 'sipho.d@yahoo.com', type: 'b2c', plan: 'growth', status: 'active', candidatesCount: 1, rolesCount: 0, cvScansUsed: 5, videoAnalysesUsed: 5, createdAt: '2025-01-10', lastActive: new Date(Date.now() - 3600000).toISOString(), monthlySpend: 149 },
        { id: '104', name: 'Naledi Khumalo', email: 'naledi.k@icloud.com', type: 'b2c', plan: 'free', status: 'active', candidatesCount: 1, rolesCount: 0, cvScansUsed: 1, videoAnalysesUsed: 0, createdAt: '2025-01-21', lastActive: new Date().toISOString(), monthlySpend: 0 },
        { id: '105', name: 'Bongani Zulu', email: 'bongani.zulu@gmail.com', type: 'b2c', plan: 'starter', status: 'active', candidatesCount: 1, rolesCount: 0, cvScansUsed: 2, videoAnalysesUsed: 1, createdAt: '2025-01-18', lastActive: new Date().toISOString(), monthlySpend: 29 },
      ]);

      // Mock activities
      setActivities([
        { id: '1', type: 'cv_processed', description: 'Discovery Health processed 12 CVs for Senior Developer role', timestamp: new Date().toISOString(), customer: 'Discovery Health' },
        { id: '2', type: 'video_analysis', description: 'Lerato Nkosi completed video interview analysis', timestamp: new Date(Date.now() - 10 * 60000).toISOString(), customer: 'Lerato Nkosi', amount: 29 },
        { id: '3', type: 'signup', description: 'New B2B signup: CloudOps SA (enterprise trial)', timestamp: new Date(Date.now() - 15 * 60000).toISOString() },
        { id: '4', type: 'upgrade', description: 'FinanceHub upgraded from Starter to Growth plan', timestamp: new Date(Date.now() - 45 * 60000).toISOString(), customer: 'FinanceHub JHB', amount: 799 },
        { id: '5', type: 'payment', description: 'Monthly subscription payment received', timestamp: new Date(Date.now() - 2 * 3600000).toISOString(), customer: 'Standard Bank', amount: 4999 },
        { id: '6', type: 'role_created', description: 'Healthcare Plus created new role: Nursing Manager', timestamp: new Date(Date.now() - 3 * 3600000).toISOString(), customer: 'Healthcare Plus' },
        { id: '7', type: 'cv_processed', description: 'EduTech SA processed 5 CVs for Teacher position', timestamp: new Date(Date.now() - 5 * 3600000).toISOString(), customer: 'EduTech SA' },
        { id: '8', type: 'signup', description: 'New B2C signup: Naledi Khumalo (job seeker)', timestamp: new Date(Date.now() - 6 * 3600000).toISOString() },
        { id: '9', type: 'video_analysis', description: 'Sipho Dlamini purchased video coaching pack (5x)', timestamp: new Date(Date.now() - 8 * 3600000).toISOString(), customer: 'Sipho Dlamini', amount: 149 },
        { id: '10', type: 'churn', description: 'StartupXYZ subscription cancelled - reason: budget', timestamp: new Date(Date.now() - 24 * 3600000).toISOString(), customer: 'StartupXYZ' },
      ]);

      // Mock system health
      setSystemHealth({
        status: 'healthy',
        database: { status: 'operational', latency: 12 },
        api: { status: 'operational', latency: 45 },
        ai: { status: 'operational', latency: 890 },
        email: { status: 'operational', latency: 234 },
        stripe: { status: 'operational', latency: 156 },
      });

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePauseCustomer = (customerId: string) => {
    setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, status: 'paused' as const } : c));
    if (selectedCustomer?.id === customerId) {
      setSelectedCustomer(prev => prev ? { ...prev, status: 'paused' } : null);
    }
  };

  const handleResumeCustomer = (customerId: string) => {
    setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, status: 'active' as const } : c));
    if (selectedCustomer?.id === customerId) {
      setSelectedCustomer(prev => prev ? { ...prev, status: 'active' } : null);
    }
  };

  const filteredCustomers = customers
    .filter(c => {
      if (activeTab === 'b2b') return c.type === 'b2b';
      if (activeTab === 'b2c') return c.type === 'b2c';
      return true;
    })
    .filter(c => filterPlan === 'all' || c.plan === filterPlan)
    .filter(c => filterStatus === 'all' || c.status === filterStatus)
    .filter(c =>
      !searchQuery ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const b2bCustomers = customers.filter(c => c.type === 'b2b');
  const b2cCustomers = customers.filter(c => c.type === 'b2c');
  const activeB2B = b2bCustomers.filter(c => c.status === 'active').length;
  const activeB2C = b2cCustomers.filter(c => c.status === 'active').length;

  // Growth data for charts
  const userGrowthData = [12, 15, 18, 14, 22, 28, 31];
  const cvGrowthData = [45, 67, 89, 78, 95, 112, 89];
  const revenueGrowthData = [2800, 3100, 2900, 3400, 3200, 3600, 3900];

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
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');*{margin:0;padding:0;box-sizing:border-box}@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}@media(max-width:1200px){.admin-grid-4{grid-template-columns:repeat(2,1fr)!important}}@media(max-width:900px){.admin-grid{grid-template-columns:1fr!important}.admin-grid-4{grid-template-columns:1fr!important}}`}</style>

      {/* Header */}
      <header style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', padding: '16px 32px', position: 'sticky', top: 0, zIndex: 100, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ maxWidth: 1600, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Logo size={32} light />
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: 4 }}>
              {(['overview', 'b2b', 'b2c', 'activity', 'health'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '8px 16px',
                    background: activeTab === tab ? 'rgba(255,255,255,0.15)' : 'transparent',
                    color: activeTab === tab ? 'white' : 'rgba(255,255,255,0.6)',
                    border: 'none',
                    borderRadius: 6,
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {tab === 'b2b' ? 'Employers' : tab === 'b2c' ? 'Job Seekers' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#dc2626', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem' }}>SR</div>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'white' }}>Simon Rubin</div>
                <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)' }}>Founder</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: 1600, margin: '0 auto', padding: '32px' }}>
        {/* System Status Banner */}
        {systemHealth && (
          <div style={{
            background: systemHealth.status === 'healthy' ? 'linear-gradient(135deg, #dcfce7, #d1fae5)' : '#fef3c7',
            borderRadius: 12,
            padding: '12px 20px',
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            border: systemHealth.status === 'healthy' ? '1px solid #86efac' : '1px solid #fde68a'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: systemHealth.status === 'healthy' ? '#10B981' : '#F59E0B', animation: 'pulse 2s infinite' }} />
              <span style={{ fontWeight: 600, color: systemHealth.status === 'healthy' ? '#166534' : '#92400e' }}>All systems operational</span>
              <span style={{ fontSize: '0.8rem', color: '#64748b', marginLeft: 16 }}>Database: {systemHealth.database.latency}ms | API: {systemHealth.api.latency}ms | AI: {systemHealth.ai.latency}ms</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Last checked: Just now</span>
              <button onClick={loadDashboardData} style={{ padding: '6px 12px', background: 'rgba(0,0,0,0.1)', border: 'none', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600, color: '#166534', cursor: 'pointer' }}>Refresh</button>
            </div>
          </div>
        )}

        {activeTab === 'overview' && stats && (
          <>
            {/* Main Stats Grid */}
            <div className="admin-grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 32 }}>
              <StatCard
                icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>}
                iconBg="#eef2ff"
                iconColor="#4F46E5"
                value={stats.totalEmployers.toString()}
                label="B2B Employers"
                sublabel={`${activeB2B} active`}
                trend={{ value: '3 this week', positive: true }}
                onClick={() => setActiveTab('b2b')}
              />
              <StatCard
                icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
                iconBg="#fce7f3"
                iconColor="#be185d"
                value={stats.totalJobSeekers.toString()}
                label="B2C Job Seekers"
                sublabel={`${activeB2C} active`}
                trend={{ value: '28 this week', positive: true }}
                onClick={() => setActiveTab('b2c')}
              />
              <StatCard
                icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>}
                iconBg="#dcfce7"
                iconColor="#10B981"
                value={stats.cvProcessedMonth.toLocaleString()}
                label="CVs This Month"
                sublabel={`${stats.cvProcessedToday} today`}
                trend={{ value: `${stats.cvProcessedWeek} this week`, positive: true }}
              />
              <StatCard
                icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
                iconBg="#fef3c7"
                iconColor="#f59e0b"
                value={`R${(stats.revenue.mrr / 1000).toFixed(1)}k`}
                label="Monthly Revenue"
                sublabel="MRR"
                trend={{ value: `${Math.round((stats.revenue.thisMonth - stats.revenue.lastMonth) / stats.revenue.lastMonth * 100)}%`, positive: true }}
                gradient
              />
            </div>

            {/* Revenue and AI Stats Row */}
            <div className="admin-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginBottom: 32 }}>
              {/* Revenue Breakdown */}
              <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Revenue Breakdown</h2>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>January 2026</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                  <div style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', borderRadius: 12, padding: 20, textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 500, marginBottom: 8 }}>Total MRR</div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: '#166534' }}>R{stats.revenue.mrr.toLocaleString()}</div>
                  </div>
                  <div style={{ background: '#eef2ff', borderRadius: 12, padding: 20, textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: '#4F46E5', fontWeight: 500, marginBottom: 8 }}>B2B Revenue</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#4F46E5' }}>R{stats.revenue.b2bRevenue.toLocaleString()}</div>
                    <div style={{ fontSize: '0.7rem', color: '#6366f1', marginTop: 4 }}>{Math.round(stats.revenue.b2bRevenue / stats.revenue.mrr * 100)}% of total</div>
                  </div>
                  <div style={{ background: '#fce7f3', borderRadius: 12, padding: 20, textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: '#be185d', fontWeight: 500, marginBottom: 8 }}>B2C Revenue</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#be185d' }}>R{stats.revenue.b2cRevenue.toLocaleString()}</div>
                    <div style={{ fontSize: '0.7rem', color: '#db2777', marginTop: 4 }}>{Math.round(stats.revenue.b2cRevenue / stats.revenue.mrr * 100)}% of total</div>
                  </div>
                  <div style={{ background: '#f8fafc', borderRadius: 12, padding: 20, textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500, marginBottom: 8 }}>vs Last Month</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10B981' }}>+{Math.round((stats.revenue.thisMonth - stats.revenue.lastMonth) / stats.revenue.lastMonth * 100)}%</div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: 4 }}>R{(stats.revenue.thisMonth - stats.revenue.lastMonth).toLocaleString()} growth</div>
                  </div>
                </div>
              </div>

              {/* AI Usage */}
              <div style={{ background: 'linear-gradient(135deg, #1e293b, #0f172a)', borderRadius: 16, padding: 24, color: 'white' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 20 }}>AI Costs This Month</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'rgba(255,255,255,0.1)', borderRadius: 10 }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>OpenAI (GPT-4o)</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>R{stats.aiUsage.openAICost.toLocaleString()}</div>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#a5b4fc' }}>{((stats.aiUsage.tokensUsed * 0.9) / 1000000).toFixed(1)}M tokens</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'rgba(255,255,255,0.1)', borderRadius: 10 }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>Anthropic (Claude)</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>R{stats.aiUsage.anthropicCost.toLocaleString()}</div>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#a5b4fc' }}>Video analysis</div>
                  </div>
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 16, display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'rgba(255,255,255,0.7)' }}>Total AI Cost</span>
                    <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>R{stats.aiUsage.estimatedCost.toLocaleString()}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>Avg {stats.aiUsage.avgTokensPerCV.toLocaleString()} tokens/CV</div>
                </div>
              </div>
            </div>

            {/* Growth Charts */}
            <div className="admin-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24, marginBottom: 32 }}>
              <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24 }}>
                <GrowthChart data={userGrowthData} label="New Users (Last 7 Days)" color="#4F46E5" />
                <div style={{ marginTop: 16, textAlign: 'center' }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#4F46E5' }}>{userGrowthData.reduce((a, b) => a + b, 0)}</span>
                  <span style={{ fontSize: '0.85rem', color: '#64748b', marginLeft: 8 }}>total new users</span>
                </div>
              </div>
              <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24 }}>
                <GrowthChart data={cvGrowthData} label="CVs Processed (Last 7 Days)" color="#10B981" />
                <div style={{ marginTop: 16, textAlign: 'center' }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10B981' }}>{cvGrowthData.reduce((a, b) => a + b, 0)}</span>
                  <span style={{ fontSize: '0.85rem', color: '#64748b', marginLeft: 8 }}>CVs processed</span>
                </div>
              </div>
              <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24 }}>
                <GrowthChart data={revenueGrowthData} label="Daily Revenue (Last 7 Days)" color="#f59e0b" />
                <div style={{ marginTop: 16, textAlign: 'center' }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f59e0b' }}>R{(revenueGrowthData.reduce((a, b) => a + b, 0) / 1000).toFixed(1)}k</span>
                  <span style={{ fontSize: '0.85rem', color: '#64748b', marginLeft: 8 }}>weekly revenue</span>
                </div>
              </div>
            </div>

            {/* Recent Activity & Top Customers */}
            <div className="admin-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              {/* Recent Activity */}
              <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Recent Activity</h2>
                  <button onClick={() => setActiveTab('activity')} style={{ background: 'none', border: 'none', color: '#4F46E5', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>View All</button>
                </div>
                <div>
                  {activities.slice(0, 6).map(activity => (
                    <ActivityItem key={activity.id} activity={activity} />
                  ))}
                </div>
              </div>

              {/* Top Customers by Revenue */}
              <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Top Customers by Revenue</h2>
                  <button onClick={() => setActiveTab('b2b')} style={{ background: 'none', border: 'none', color: '#4F46E5', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>View All</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[...customers].sort((a, b) => b.monthlySpend - a.monthlySpend).slice(0, 5).map((customer, i) => (
                    <div key={customer.id} onClick={() => setSelectedCustomer(customer)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: i === 0 ? 'linear-gradient(135deg, #fef3c7, #fde68a)' : '#f8fafc', borderRadius: 10, cursor: 'pointer', border: i === 0 ? '1px solid #fde68a' : '1px solid transparent' }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: customer.type === 'b2b' ? '#eef2ff' : '#fce7f3', color: customer.type === 'b2b' ? '#4F46E5' : '#be185d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem' }}>{customer.name.slice(0, 2).toUpperCase()}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#0f172a' }}>{customer.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{customer.plan} plan</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#166534' }}>R{customer.monthlySpend.toLocaleString()}</div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>MRR</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {(activeTab === 'b2b' || activeTab === 'b2c') && (
          <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                {activeTab === 'b2b' ? `Employers (${b2bCustomers.length})` : `Job Seekers (${b2cCustomers.length})`}
              </h2>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ padding: '10px 16px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.875rem', width: 200, outline: 'none' }}
                />
                <select value={filterPlan} onChange={e => setFilterPlan(e.target.value)} style={{ padding: '10px 16px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.875rem', background: 'white', cursor: 'pointer' }}>
                  <option value="all">All Plans</option>
                  <option value="free">Free</option>
                  <option value="starter">Starter</option>
                  <option value="growth">Growth</option>
                  <option value="business">Business</option>
                  <option value="enterprise">Enterprise</option>
                </select>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: '10px 16px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.875rem', background: 'white', cursor: 'pointer' }}>
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="trial">Trial</option>
                  <option value="paused">Paused</option>
                  <option value="churned">Churned</option>
                </select>
              </div>
            </div>
            <div style={{ padding: '8px 16px', background: '#f8fafc', display: 'flex', alignItems: 'center', gap: 14, fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
              <div style={{ width: 40 }} />
              <div style={{ flex: 1 }}>Customer</div>
              <div style={{ textAlign: 'center', minWidth: 60 }}>CVs</div>
              <div style={{ textAlign: 'center', minWidth: 50 }}>{activeTab === 'b2b' ? 'Roles' : 'Videos'}</div>
              <div style={{ textAlign: 'center', minWidth: 70 }}>MRR</div>
              <div style={{ minWidth: 65 }}>Plan</div>
              <div style={{ minWidth: 60 }}>Status</div>
              <div style={{ minWidth: 70, textAlign: 'right' }}>Last Active</div>
              <div style={{ minWidth: 120 }}>Actions</div>
            </div>
            {filteredCustomers.length === 0 ? (
              <div style={{ padding: 48, textAlign: 'center' }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: '#f1f5f9', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 600, color: '#64748b' }}>No customers found</div>
                <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Try adjusting your filters</div>
              </div>
            ) : (
              filteredCustomers.map(customer => (
                <CustomerRow
                  key={customer.id}
                  customer={customer}
                  onView={() => setSelectedCustomer(customer)}
                  onPause={() => handlePauseCustomer(customer.id)}
                  onResume={() => handleResumeCustomer(customer.id)}
                />
              ))
            )}
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

        {activeTab === 'health' && systemHealth && (
          <div className="admin-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24 }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: 20 }}>System Health</h2>
              <HealthIndicator name="Supabase (Database)" status={systemHealth.database.status} latency={systemHealth.database.latency} />
              <HealthIndicator name="Next.js API" status={systemHealth.api.status} latency={systemHealth.api.latency} />
              <HealthIndicator name="OpenAI GPT-4o" status={systemHealth.ai.status} latency={systemHealth.ai.latency} />
              <HealthIndicator name="Anthropic Claude" status="operational" latency={456} />
              <HealthIndicator name="Email (IMAP)" status={systemHealth.email.status} latency={systemHealth.email.latency} />
              <HealthIndicator name="Stripe Payments" status={systemHealth.stripe.status} latency={systemHealth.stripe.latency} />
            </div>
            <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24 }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: 20 }}>API Metrics (24h)</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ padding: 16, background: '#f8fafc', borderRadius: 10, textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10B981' }}>99.9%</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Uptime</div>
                </div>
                <div style={{ padding: 16, background: '#f8fafc', borderRadius: 10, textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#4F46E5' }}>124ms</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Avg Response</div>
                </div>
                <div style={{ padding: 16, background: '#f8fafc', borderRadius: 10, textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>8,432</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>API Requests</div>
                </div>
                <div style={{ padding: 16, background: '#f8fafc', borderRadius: 10, textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#dc2626' }}>0.02%</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Error Rate</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #e2e8f0', padding: '20px 32px', marginTop: 32, background: '#f8fafc' }}>
        <div style={{ maxWidth: 1600, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Hyred Admin Panel v1.1 | Built with love in Cape Town</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: '0.8rem', color: '#94a3b8' }}>
            <span>Environment: Production</span>
            <span>|</span>
            <span>Region: ZA-CPT-1</span>
            <span>|</span>
            <span>{new Date().toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>
        </div>
      </footer>

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <CustomerDetailModal
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          onPause={() => handlePauseCustomer(selectedCustomer.id)}
          onResume={() => handleResumeCustomer(selectedCustomer.id)}
        />
      )}
    </div>
  );
}
