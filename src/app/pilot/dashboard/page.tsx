'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

// ============================================
// HIREINBOX PILOT PROGRAM - DASHBOARD
// /pilot/dashboard
// Clean, focused dashboard for pilot recruiters
// Only shows: Talent Mapping + CV Screening + Reports
// ============================================

interface RecentSearch {
  id: string;
  created_at: string;
  search_prompt: string;
  candidate_count: number;
  role_parsed: string;
}

interface RecentRole {
  id: string;
  created_at: string;
  title: string;
  candidate_count: number;
  pending_review: number;
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
      </div>
      <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>
        Pilot Program
      </div>
    </div>
  </div>
);

const Icons = {
  search: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8"/>
      <path d="M21 21l-4.35-4.35"/>
    </svg>
  ),
  inbox: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 12h-6l-2 3h-4l-2-3H2"/>
      <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
    </svg>
  ),
  report: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
  ),
  arrow: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="5" y1="12" x2="19" y2="12"/>
      <polyline points="12 5 19 12 12 19"/>
    </svg>
  ),
  logout: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  sparkle: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
    </svg>
  ),
};

export default function PilotDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [recentRoles, setRecentRoles] = useState<RecentRole[]>([]);
  const [stats, setStats] = useState({
    totalSearches: 0,
    candidatesFound: 0,
    cvsScreened: 0,
    rolesActive: 0,
  });

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push('/pilot');
        return;
      }

      setUser({ email: session.user.email || '' });

      // Fetch recent talent mapping searches
      const { data: searches } = await supabase
        .from('talent_mapping_reports')
        .select('id, created_at, search_prompt, candidate_count, role_parsed')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (searches) {
        setRecentSearches(searches);
        setStats(prev => ({
          ...prev,
          totalSearches: searches.length,
          candidatesFound: searches.reduce((sum, s) => sum + (s.candidate_count || 0), 0),
        }));
      }

      // Fetch CV screening stats from API (uses service role to bypass RLS)
      const statsResponse = await fetch('/api/pilot/dashboard-stats', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setRecentRoles(statsData.recentRoles.map((r: any) => ({
          ...r,
          pending_review: 0,
        })));
        setStats(prev => ({
          ...prev,
          rolesActive: statsData.activeRoles,
          cvsScreened: statsData.cvsScreened,
        }));
      }

    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/pilot');
  };

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
          <p style={{ color: '#64748b' }}>Loading your dashboard...</p>
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
      {/* Mobile Responsive Styles */}
      <style>{`
        .dash-header { padding: 16px 32px; }
        .dash-main { padding: 32px; }
        .dash-cards { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; }
        .dash-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
        .dash-recent { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; }
        .dash-support-btns { display: flex; gap: 12px; }

        @media (max-width: 1024px) {
          .dash-stats { grid-template-columns: repeat(2, 1fr) !important; }
        }

        @media (max-width: 768px) {
          .dash-header { padding: 12px 16px !important; flex-wrap: wrap; gap: 12px !important; }
          .dash-main { padding: 16px !important; }
          .dash-cards { grid-template-columns: 1fr !important; }
          .dash-stats { grid-template-columns: repeat(2, 1fr) !important; }
          .dash-recent { grid-template-columns: 1fr !important; }
          .dash-support-btns { flex-direction: column !important; }
          .dash-support-btns a { text-align: center !important; }
          .user-email { display: none !important; }
        }

        @media (max-width: 480px) {
          .dash-stats { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Header */}
      <header className="dash-header" style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <Logo />
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span className="user-email" style={{ fontSize: '14px', color: '#64748b' }}>{user?.email}</span>
          <button
            onClick={handleLogout}
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
            {Icons.logout}
            Sign out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="dash-main" style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Welcome Section */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 700,
            color: '#0f172a',
            marginBottom: '8px',
          }}>
            Welcome to Hyred
          </h1>
          <p style={{ fontSize: '16px', color: '#64748b' }}>
            Your AI-powered recruitment intelligence platform
          </p>
        </div>

        {/* Main Action Cards */}
        <div className="dash-cards" style={{ marginBottom: '32px' }}>
          {/* Talent Mapping Card */}
          <div
            onClick={() => router.push('/pilot/talent-mapping')}
            style={{
              backgroundColor: '#ffffff',
              border: '2px solid #e2e8f0',
              borderRadius: '16px',
              padding: '32px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = '#4F46E5';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(79, 70, 229, 0.15)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = '#e2e8f0';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{
              width: '56px',
              height: '56px',
              background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              marginBottom: '20px',
            }}>
              {Icons.search}
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
              Talent Mapping
            </h2>
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '20px', lineHeight: 1.5 }}>
              Find hidden candidates with AI-powered intelligence. Upload a job spec or describe who you&apos;re looking for.
            </p>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#4F46E5',
              fontSize: '14px',
              fontWeight: 600,
            }}>
              Start searching {Icons.arrow}
            </div>
          </div>

          {/* CV Screening Card */}
          <div
            onClick={() => router.push('/pilot/screening')}
            style={{
              backgroundColor: '#ffffff',
              border: '2px solid #e2e8f0',
              borderRadius: '16px',
              padding: '32px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = '#10B981';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.15)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = '#e2e8f0';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{
              width: '56px',
              height: '56px',
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              marginBottom: '20px',
            }}>
              {Icons.inbox}
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
              AI CV Screening
            </h2>
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '20px', lineHeight: 1.5 }}>
              Screen CVs in seconds with explainable AI. Create a role, send CVs to inbox, get AI-ranked shortlists.
            </p>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#10B981',
              fontSize: '14px',
              fontWeight: 600,
            }}>
              Screen CVs {Icons.arrow}
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="dash-stats" style={{ marginBottom: '32px' }}>
          {[
            { label: 'Talent Searches', value: stats.totalSearches, color: '#4F46E5' },
            { label: 'Candidates Found', value: stats.candidatesFound, color: '#7C3AED' },
            { label: 'CVs Screened', value: stats.cvsScreened, color: '#10B981' },
            { label: 'Active Roles', value: stats.rolesActive, color: '#F59E0B' },
          ].map((stat, i) => (
            <div key={i} style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '20px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '32px', fontWeight: 700, color: stat.color }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="dash-recent">
          {/* Recent Searches */}
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '24px',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px',
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>
                Recent Talent Searches
              </h3>
              <button
                onClick={() => router.push('/pilot/reports')}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#f1f5f9',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  color: '#475569',
                  cursor: 'pointer',
                }}
              >
                View all
              </button>
            </div>

            {recentSearches.length === 0 ? (
              <div style={{
                padding: '32px',
                textAlign: 'center',
                color: '#64748b',
                fontSize: '14px',
              }}>
                <div style={{ marginBottom: '12px', opacity: 0.5 }}>{Icons.search}</div>
                No searches yet. Start your first talent mapping!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {recentSearches.map((search) => (
                  <div
                    key={search.id}
                    onClick={() => router.push(`/pilot/reports/${search.id}`)}
                    style={{
                      padding: '12px 16px',
                      backgroundColor: '#f8fafc',
                      borderRadius: '8px',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontSize: '14px', fontWeight: 500, color: '#0f172a', marginBottom: '4px' }}>
                      {search.role_parsed || 'Search'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      {search.candidate_count || 0} candidates • {new Date(search.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Roles */}
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '24px',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px',
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>
                Recent CV Screening Roles
              </h3>
              <button
                onClick={() => router.push('/pilot/screening')}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#f1f5f9',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  color: '#475569',
                  cursor: 'pointer',
                }}
              >
                View all
              </button>
            </div>

            {recentRoles.length === 0 ? (
              <div style={{
                padding: '32px',
                textAlign: 'center',
                color: '#64748b',
                fontSize: '14px',
              }}>
                <div style={{ marginBottom: '12px', opacity: 0.5 }}>{Icons.inbox}</div>
                No roles yet. Create your first screening role!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {recentRoles.map((role) => (
                  <div
                    key={role.id}
                    onClick={() => router.push(`/pilot/screening/${role.id}`)}
                    style={{
                      padding: '12px 16px',
                      backgroundColor: '#f8fafc',
                      borderRadius: '8px',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontSize: '14px', fontWeight: 500, color: '#0f172a', marginBottom: '4px' }}>
                      {role.title}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      {role.candidate_count} CVs screened • {new Date(role.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Help Section */}
        <div style={{
          marginTop: '32px',
          padding: '24px',
          background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
          borderRadius: '16px',
          border: '1px solid #bae6fd',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <span style={{ color: '#0284c7' }}>{Icons.sparkle}</span>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0c4a6e' }}>
              Pilot Program Support
            </h3>
          </div>
          <p style={{ fontSize: '14px', color: '#0369a1', marginBottom: '16px' }}>
            You&apos;re part of an exclusive pilot. We&apos;re here to help you get the most out of Hyred.
          </p>
          <div className="dash-support-btns">
            <a
              href="mailto:simon@mafadi.co.za"
              style={{
                padding: '10px 20px',
                backgroundColor: '#0284c7',
                color: '#ffffff',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Contact Simon
            </a>
            <a
              href="https://wa.me/27721172137"
              style={{
                padding: '10px 20px',
                backgroundColor: '#ffffff',
                color: '#0284c7',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                textDecoration: 'none',
                border: '1px solid #0284c7',
              }}
            >
              WhatsApp Support
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
