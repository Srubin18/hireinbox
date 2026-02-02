'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import PilotHeader from '@/components/PilotHeader';

interface MonthlyData {
  month: string;
  monthLabel: string;
  talentSearches: number;
  candidatesFound: number;
  rolesCreated: number;
}

interface UsageStats {
  currentMonth: {
    talentSearches: number;
    candidatesFound: number;
    rolesCreated: number;
  };
  allTime: {
    talentSearches: number;
    candidatesFound: number;
    rolesCreated: number;
  };
  monthlyHistory: MonthlyData[];
}

const Icons = {
  calendar: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  search: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8"/>
      <path d="M21 21l-4.35-4.35"/>
    </svg>
  ),
  briefcase: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
    </svg>
  ),
};

interface PageState {
  user: { email: string; pilot_role?: string } | null;
  stats: UsageStats | null;
  selectedMonth: string;
  dataReady: boolean;
}

export default function UsagePage() {
  const router = useRouter();
  const [state, setState] = useState<PageState>({
    user: null,
    stats: null,
    selectedMonth: '',
    dataReady: false,
  });

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          router.push('/pilot');
          return;
        }

        // Fetch user profile with pilot_role
        const { data: profile } = await supabase
          .from('profiles')
          .select('pilot_role')
          .eq('id', session.user.id)
          .single();

        const response = await fetch('/api/pilot/usage-stats', {
          headers: { 'Authorization': `Bearer ${session.access_token}` },
        });

        if (response.ok) {
          const data = await response.json();

          if (data.monthlyHistory && data.monthlyHistory.length > 0) {
            const mostRecentMonth = data.monthlyHistory[data.monthlyHistory.length - 1].month;

            // Set EVERYTHING in ONE state update
            setState({
              user: {
                email: session.user.email || '',
                pilot_role: profile?.pilot_role,
              },
              stats: data,
              selectedMonth: mostRecentMonth,
              dataReady: true,
            });
          }
        }
      } catch (err) {
        console.error('Error fetching usage data:', err);
      }
    };

    fetchData();
  }, [supabase, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/pilot');
  };

  // Show loading until EVERYTHING is ready
  if (!state.dataReady || !state.stats || !state.selectedMonth) {
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
          <p style={{ color: '#64748b' }}>Loading usage data...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  // Get month data
  const monthData = state.stats.monthlyHistory.find(m => m.month === state.selectedMonth);

  if (!monthData) {
    return <div>Error: No data for selected month</div>;
  }

  // Calculate billing based on successful searches (searches that found candidates)
  const talentSearchBatches = Math.ceil(monthData.talentSearches / 20);
  const searchesRemaining = (talentSearchBatches * 20) - monthData.talentSearches;
  const talentSearchCost = talentSearchBatches * 4999;
  const rolesCost = monthData.rolesCreated * 1750;
  const totalCost = talentSearchCost + rolesCost;

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      <style>{`
        .usage-main { padding: 32px; }
        .usage-billable-cards { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; }
        @media (max-width: 768px) {
          .usage-main { padding: 16px !important; }
          .usage-billable-cards { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <PilotHeader user={state.user} onLogout={handleLogout} currentPage="usage" />

      <main className="usage-main" style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Page Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '32px',
          flexWrap: 'wrap',
          gap: '16px',
        }}>
          <div>
            <h1 style={{
              fontSize: '28px',
              fontWeight: 700,
              color: '#0f172a',
              marginBottom: '8px',
            }}>
              Usage & Billing
            </h1>
            <p style={{ fontSize: '16px', color: '#64748b' }}>
              Track your billable usage and activity
            </p>
          </div>

          {/* Month Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ color: '#4F46E5' }}>{Icons.calendar}</span>
            <select
              value={state.selectedMonth}
              onChange={(e) => setState({ ...state, selectedMonth: e.target.value })}
              style={{
                padding: '10px 16px',
                fontSize: '14px',
                fontWeight: 500,
                color: '#0f172a',
                backgroundColor: '#ffffff',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              {[...state.stats.monthlyHistory].reverse().map((month) => (
                <option key={month.month} value={month.month}>
                  {month.monthLabel}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* BILLABLE ITEMS - Large Cards */}
        <div className="usage-billable-cards" style={{ marginBottom: '32px' }}>
          {/* Talent Searches Card */}
          <div style={{
            backgroundColor: '#ffffff',
            border: '3px solid #4F46E5',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.1)',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '20px',
            }}>
              <div style={{
                width: '56px',
                height: '56px',
                background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
              }}>
                {Icons.search}
              </div>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>
                  Successful Talent Searches
                </h2>
                <div style={{ fontSize: '40px', fontWeight: 700, color: '#4F46E5', lineHeight: 1 }}>
                  {monthData.talentSearches}
                </div>
                <div style={{ fontSize: '13px', color: '#64748b', marginTop: '8px' }}>
                  {searchesRemaining} remaining in current batch
                </div>
              </div>
            </div>
            <div style={{
              padding: '16px',
              backgroundColor: '#f8fafc',
              borderRadius: '8px',
              fontSize: '13px',
              color: '#475569',
              lineHeight: 1.6,
            }}>
              Up to 20 talent searches per month for <strong>R4,999</strong>.
              Additional billing for the next 20 searches. Only searches that find candidates are counted.
              {talentSearchBatches > 0 && (
                <div style={{ marginTop: '8px', color: '#4F46E5', fontWeight: 600 }}>
                  Current: R{talentSearchCost.toLocaleString()} ({talentSearchBatches} batch{talentSearchBatches > 1 ? 'es' : ''})
                </div>
              )}
            </div>
          </div>

          {/* Roles Created Card */}
          <div style={{
            backgroundColor: '#ffffff',
            border: '3px solid #10B981',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.1)',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '20px',
            }}>
              <div style={{
                width: '56px',
                height: '56px',
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
              }}>
                {Icons.briefcase}
              </div>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>
                  Roles Created
                </h2>
                <div style={{ fontSize: '40px', fontWeight: 700, color: '#10B981', lineHeight: 1 }}>
                  {monthData.rolesCreated}
                </div>
              </div>
            </div>
            <div style={{
              padding: '16px',
              backgroundColor: '#f0fdf4',
              borderRadius: '8px',
              fontSize: '13px',
              color: '#065f46',
              lineHeight: 1.6,
            }}>
              <strong>R1,750</strong> per role created for AI CV screening with unlimited CV processing.
              {monthData.rolesCreated > 0 && (
                <div style={{ marginTop: '8px', color: '#10B981', fontWeight: 600 }}>
                  Current: R{rolesCost.toLocaleString()}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Total Usage and Bill */}
        {totalCost > 0 && (
          <div style={{
            marginBottom: '32px',
          }}>
            <div style={{
              padding: '20px 24px',
              backgroundColor: '#ffffff',
              border: '2px solid #e2e8f0',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>
                Current Usage and Bill for {monthData.monthLabel}
              </span>
              <span style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a' }}>
                R{totalCost.toLocaleString()}
              </span>
            </div>

            {/* Influencer Message */}
            {state.user?.pilot_role === 'influencer' && (
              <div style={{
                marginTop: '16px',
                padding: '16px 20px',
                background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)',
              }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '20px',
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#ffffff',
                    letterSpacing: '0.02em',
                  }}>
                    Influencer
                  </span>
                </div>
                <span style={{
                  fontSize: '14px',
                  color: '#ffffff',
                  fontWeight: 500,
                }}>
                  You will not be billed. Your account has complimentary access to all features.
                </span>
              </div>
            )}
          </div>
        )}


        {/* Monthly History */}
        <div>
          <h2 style={{
            fontSize: '18px',
            fontWeight: 600,
            color: '#0f172a',
            marginBottom: '16px',
          }}>
            Monthly History (Last 6 Months)
          </h2>

          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '24px',
            overflowX: 'auto',
          }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              minWidth: '600px',
            }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{
                    textAlign: 'left',
                    padding: '12px 16px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#475569',
                  }}>
                    Month
                  </th>
                  <th style={{
                    textAlign: 'center',
                    padding: '12px 16px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#475569',
                  }}>
                    Talent Searches
                  </th>
                  <th style={{
                    textAlign: 'center',
                    padding: '12px 16px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#475569',
                  }}>
                    Roles Created
                  </th>
                </tr>
              </thead>
              <tbody>
                {[...state.stats.monthlyHistory].reverse().map((month, idx) => (
                  <tr
                    key={month.month}
                    style={{
                      borderBottom: idx < state.stats!.monthlyHistory.length - 1 ? '1px solid #f1f5f9' : 'none',
                    }}
                  >
                    <td style={{
                      padding: '16px',
                      fontSize: '14px',
                      fontWeight: 500,
                      color: '#0f172a',
                    }}>
                      {month.monthLabel}
                    </td>
                    <td style={{
                      padding: '16px',
                      fontSize: '14px',
                      color: '#4F46E5',
                      fontWeight: 600,
                      textAlign: 'center',
                    }}>
                      {month.talentSearches}
                    </td>
                    <td style={{
                      padding: '16px',
                      fontSize: '14px',
                      color: '#10B981',
                      fontWeight: 600,
                      textAlign: 'center',
                    }}>
                      {month.rolesCreated}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Billing Note */}
        <div style={{
          marginTop: '32px',
          padding: '20px 24px',
          backgroundColor: '#f0f9ff',
          border: '1px solid #bae6fd',
          borderRadius: '12px',
        }}>
          <p style={{
            fontSize: '14px',
            color: '#0369a1',
            margin: 0,
            lineHeight: 1.6,
          }}>
            <strong>Pilot Program:</strong> You're currently on a free pilot with unlimited usage.
            We'll notify you before any billing begins.
          </p>
        </div>
      </main>
    </div>
  );
}
