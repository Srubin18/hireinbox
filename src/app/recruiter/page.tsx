'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

// ============================================
// HIREINBOX B2Recruiter - DASHBOARD
// /recruiter
// Main dashboard showing clients, talent, and commissions overview
// ============================================

interface Stats {
  clients: {
    total: number;
    active: number;
    paused: number;
    inactive: number;
  };
  talent: {
    total: number;
    available: number;
    interviewing: number;
    placed: number;
    unavailable: number;
  };
  commissions: {
    total_placements: number;
    this_year_placements: number;
    pending_amount: number;
    invoiced_amount: number;
    paid_amount: number;
    this_year_earned: number;
  };
}

const Logo = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
    <svg width="36" height="36" viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="12" fill="#4F46E5"/>
      <path d="M12 18L24 26L36 18V32C36 33.1 35.1 34 34 34H14C12.9 34 12 33.1 12 32V18Z" fill="white" fillOpacity="0.9"/>
      <path d="M34 14H14C12.9 14 12 14.9 12 16V18L24 26L36 18V16C36 14.9 35.1 14 34 14Z" fill="white"/>
      <circle cx="36" cy="12" r="9" fill="#10B981"/>
      <path d="M32.5 12L35 14.5L39.5 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
    <div>
      <div style={{ fontSize: '16px', fontWeight: 700, letterSpacing: '-0.02em' }}>
        <span style={{ color: '#4F46E5' }}>Hyred</span>
        <span style={{ color: '#64748b', fontWeight: 500, fontSize: '14px', marginLeft: '8px' }}>Recruiter</span>
      </div>
    </div>
  </div>
);

const Icons = {
  clients: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 21h18"/>
      <path d="M5 21V7l8-4v18"/>
      <path d="M19 21V11l-6-4"/>
      <path d="M9 9v.01"/>
      <path d="M9 12v.01"/>
      <path d="M9 15v.01"/>
      <path d="M9 18v.01"/>
    </svg>
  ),
  talent: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  money: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="1" x2="12" y2="23"/>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  ),
  chart: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
  arrow: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="5" y1="12" x2="19" y2="12"/>
      <polyline points="12 5 19 12 12 19"/>
    </svg>
  ),
  refresh: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="23 4 23 10 17 10"/>
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
    </svg>
  ),
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function RecruiterDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [user, setUser] = useState<{ email: string } | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push('/auth/login?redirect=/recruiter');
        return;
      }

      setUser({ email: session.user.email || '' });

      const response = await fetch('/api/recruiter/stats', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch stats');
      }

      const data = await response.json();
      setStats(data.stats);
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [supabase, router]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '3px solid #e2e8f0',
            borderTopColor: '#4F46E5',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px',
          }} />
          <p style={{ color: '#64748b' }}>Loading dashboard...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      {/* Header */}
      <header style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        padding: '16px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <Logo />
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '14px', color: '#64748b' }}>{user?.email}</span>
          <button
            onClick={fetchStats}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              backgroundColor: '#f1f5f9',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              color: '#475569',
              cursor: 'pointer',
            }}
          >
            {Icons.refresh}
            Refresh
          </button>
        </div>
      </header>

      {/* Navigation */}
      <nav style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        padding: '0 32px',
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { label: 'Dashboard', href: '/recruiter', active: true },
            { label: 'Clients', href: '/recruiter/clients', active: false },
            { label: 'Talent Pool', href: '/recruiter/talent', active: false },
            { label: 'Commissions', href: '/recruiter/commissions', active: false },
          ].map((item) => (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              style={{
                padding: '16px 20px',
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: item.active ? '2px solid #4F46E5' : '2px solid transparent',
                fontSize: '14px',
                fontWeight: item.active ? 600 : 500,
                color: item.active ? '#4F46E5' : '#64748b',
                cursor: 'pointer',
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto' }}>
        {error ? (
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '12px',
            padding: '16px 20px',
            color: '#dc2626',
            marginBottom: '24px',
          }}>
            {error}
          </div>
        ) : null}

        <div style={{ marginBottom: '32px' }}>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 700,
            color: '#0f172a',
            marginBottom: '8px',
          }}>
            Welcome back
          </h1>
          <p style={{ fontSize: '16px', color: '#64748b' }}>
            Here&apos;s an overview of your recruitment activity
          </p>
        </div>

        {/* Stats Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
          marginBottom: '32px',
        }}>
          {/* Clients Card */}
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '24px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                backgroundColor: '#EEF2FF',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#4F46E5',
              }}>
                {Icons.clients}
              </div>
              <button
                onClick={() => router.push('/recruiter/clients')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '8px 12px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '13px',
                  color: '#475569',
                  cursor: 'pointer',
                }}
              >
                View all {Icons.arrow}
              </button>
            </div>
            <div style={{ fontSize: '32px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
              {stats?.clients.total || 0}
            </div>
            <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '16px' }}>
              Total Clients
            </div>
            <div style={{ display: 'flex', gap: '16px', fontSize: '13px' }}>
              <div>
                <span style={{ color: '#10B981', fontWeight: 600 }}>{stats?.clients.active || 0}</span>
                <span style={{ color: '#64748b', marginLeft: '4px' }}>Active</span>
              </div>
              <div>
                <span style={{ color: '#F59E0B', fontWeight: 600 }}>{stats?.clients.paused || 0}</span>
                <span style={{ color: '#64748b', marginLeft: '4px' }}>Paused</span>
              </div>
            </div>
          </div>

          {/* Talent Card */}
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '24px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                backgroundColor: '#F0FDF4',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10B981',
              }}>
                {Icons.talent}
              </div>
              <button
                onClick={() => router.push('/recruiter/talent')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '8px 12px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '13px',
                  color: '#475569',
                  cursor: 'pointer',
                }}
              >
                View all {Icons.arrow}
              </button>
            </div>
            <div style={{ fontSize: '32px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
              {stats?.talent.total || 0}
            </div>
            <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '16px' }}>
              Talent Pool
            </div>
            <div style={{ display: 'flex', gap: '16px', fontSize: '13px', flexWrap: 'wrap' }}>
              <div>
                <span style={{ color: '#10B981', fontWeight: 600 }}>{stats?.talent.available || 0}</span>
                <span style={{ color: '#64748b', marginLeft: '4px' }}>Available</span>
              </div>
              <div>
                <span style={{ color: '#3B82F6', fontWeight: 600 }}>{stats?.talent.interviewing || 0}</span>
                <span style={{ color: '#64748b', marginLeft: '4px' }}>Interviewing</span>
              </div>
              <div>
                <span style={{ color: '#8B5CF6', fontWeight: 600 }}>{stats?.talent.placed || 0}</span>
                <span style={{ color: '#64748b', marginLeft: '4px' }}>Placed</span>
              </div>
            </div>
          </div>

          {/* Commissions Card */}
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '24px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                backgroundColor: '#FEF3C7',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#F59E0B',
              }}>
                {Icons.money}
              </div>
              <button
                onClick={() => router.push('/recruiter/commissions')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '8px 12px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '13px',
                  color: '#475569',
                  cursor: 'pointer',
                }}
              >
                View all {Icons.arrow}
              </button>
            </div>
            <div style={{ fontSize: '32px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
              {stats?.commissions.this_year_placements || 0}
            </div>
            <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '16px' }}>
              Placements This Year
            </div>
            <div style={{ display: 'flex', gap: '16px', fontSize: '13px', flexWrap: 'wrap' }}>
              <div>
                <span style={{ color: '#F59E0B', fontWeight: 600 }}>{formatCurrency(stats?.commissions.pending_amount || 0)}</span>
                <span style={{ color: '#64748b', marginLeft: '4px' }}>Pending</span>
              </div>
              <div>
                <span style={{ color: '#10B981', fontWeight: 600 }}>{formatCurrency(stats?.commissions.paid_amount || 0)}</span>
                <span style={{ color: '#64748b', marginLeft: '4px' }}>Paid</span>
              </div>
            </div>
          </div>
        </div>

        {/* Year Earnings */}
        <div style={{
          backgroundColor: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
          background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
          borderRadius: '16px',
          padding: '32px',
          color: '#ffffff',
          marginBottom: '32px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              backgroundColor: 'rgba(255,255,255,0.2)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {Icons.chart}
            </div>
            <span style={{ fontSize: '16px', fontWeight: 500, opacity: 0.9 }}>
              {new Date().getFullYear()} Year-to-Date Earnings
            </span>
          </div>
          <div style={{ fontSize: '42px', fontWeight: 700, marginBottom: '8px' }}>
            {formatCurrency(stats?.commissions.this_year_earned || 0)}
          </div>
          <div style={{ fontSize: '14px', opacity: 0.8 }}>
            From {stats?.commissions.this_year_placements || 0} successful placements
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', marginBottom: '16px' }}>
            Quick Actions
          </h2>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={() => router.push('/recruiter/clients?action=add')}
              style={{
                padding: '12px 20px',
                backgroundColor: '#4F46E5',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              + Add Client
            </button>
            <button
              onClick={() => router.push('/recruiter/talent?action=add')}
              style={{
                padding: '12px 20px',
                backgroundColor: '#ffffff',
                color: '#0f172a',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              + Add Candidate
            </button>
            <button
              onClick={() => router.push('/recruiter/commissions?action=add')}
              style={{
                padding: '12px 20px',
                backgroundColor: '#ffffff',
                color: '#0f172a',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              + Record Placement
            </button>
          </div>
        </div>

        {/* Empty State Helper */}
        {stats && stats.clients.total === 0 && stats.talent.total === 0 && stats.commissions.total_placements === 0 ? (
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '48px',
            textAlign: 'center',
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              backgroundColor: '#EEF2FF',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
              color: '#4F46E5',
            }}>
              {Icons.clients}
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>
              Get Started with Your Recruiter Portal
            </h3>
            <p style={{ fontSize: '15px', color: '#64748b', maxWidth: '400px', margin: '0 auto 24px' }}>
              Start by adding your client companies, then build your talent pool of candidates you&apos;ve sourced.
            </p>
            <button
              onClick={() => router.push('/recruiter/clients?action=add')}
              style={{
                padding: '14px 28px',
                backgroundColor: '#4F46E5',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Add Your First Client
            </button>
          </div>
        ) : null}
      </main>
    </div>
  );
}
