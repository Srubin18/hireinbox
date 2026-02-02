'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import PilotHeader from '@/components/PilotHeader';

// ============================================
// HIREINBOX PILOT - SAVED REPORTS
// /pilot/reports
// View and manage saved talent mapping reports
// ============================================

interface Report {
  id: string;
  created_at: string;
  search_prompt: string;
  role_parsed: string;
  location: string;
  industry: string;
  candidate_count: number;
}

export default function PilotReports() {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<{ email: string; pilot_role?: string } | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/pilot');
  };

  const fetchReports = useCallback(async () => {
    try {
      setError(null);
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

      setUser({
        email: session.user.email || '',
        pilot_role: profile?.pilot_role,
      });

      const response = await fetch('/api/pilot/reports?limit=50', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setReports(data.reports || []);
      } else {
        setError('Failed to load reports. Please try again.');
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [supabase, router]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this report?')) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      await fetch(`/api/pilot/reports?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      setReports(reports.filter(r => r.id !== id));
    } catch (err) {
      console.error('Error deleting report:', err);
    }
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
          <p style={{ color: '#64748b' }}>Loading reports...</p>
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
        .reports-header { padding: 16px 32px; }
        .reports-main { padding: 32px; }
        .reports-table { display: table; width: 100%; }

        @media (max-width: 768px) {
          .reports-header { padding: 12px 16px !important; flex-wrap: wrap; gap: 12px !important; }
          .reports-main { padding: 16px !important; }
          .reports-table { display: block !important; }
          .reports-table thead { display: none !important; }
          .reports-table tbody { display: block !important; }
          .reports-table tr { display: block !important; padding: 16px !important; margin-bottom: 12px !important; background: #fff !important; border-radius: 12px !important; border: 1px solid #e2e8f0 !important; }
          .reports-table td { display: block !important; padding: 4px 0 !important; text-align: left !important; }
          .reports-table td:before { content: attr(data-label); font-weight: 600; color: #64748b; font-size: 12px; display: block; margin-bottom: 4px; }
          .reports-actions { justify-content: flex-start !important; margin-top: 12px; }
        }
      `}</style>

      {/* Header */}
      <PilotHeader user={user} onLogout={handleLogout} currentPage="reports" />

      <main className="reports-main" style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
              Your Talent Reports
            </h1>
            <p style={{ fontSize: '15px', color: '#64748b' }}>
              {reports.length} saved {reports.length === 1 ? 'report' : 'reports'}
            </p>
          </div>
          <button
            onClick={() => router.push('/pilot/talent-mapping')}
            style={{
              padding: '10px 20px',
              backgroundColor: '#4F46E5',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            + New Search
          </button>
        </div>

        {/* Error State */}
        {error && (
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span style={{ color: '#dc2626', fontSize: '14px' }}>{error}</span>
            </div>
            <button
              onClick={() => fetchReports()}
              style={{
                padding: '8px 16px',
                backgroundColor: '#dc2626',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Retry
            </button>
          </div>
        )}

        {!error && reports.length === 0 ? (
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '64px',
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
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>
              No reports yet
            </h3>
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px' }}>
              Start a talent mapping search to generate your first report
            </p>
            <button
              onClick={() => router.push('/pilot/talent-mapping')}
              style={{
                padding: '12px 24px',
                backgroundColor: '#4F46E5',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Start Searching
            </button>
          </div>
        ) : (
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
          }}>
            <table className="reports-table" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc' }}>
                  <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#64748b' }}>
                    Role
                  </th>
                  <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#64748b' }}>
                    Location
                  </th>
                  <th style={{ padding: '16px 24px', textAlign: 'center', fontSize: '13px', fontWeight: 600, color: '#64748b' }}>
                    Candidates
                  </th>
                  <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#64748b' }}>
                    Date
                  </th>
                  <th style={{ padding: '16px 24px', textAlign: 'right', fontSize: '13px', fontWeight: 600, color: '#64748b' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr
                    key={report.id}
                    style={{ borderTop: '1px solid #e2e8f0' }}
                  >
                    <td data-label="Role" style={{ padding: '16px 24px' }}>
                      <div style={{ fontSize: '15px', fontWeight: 500, color: '#0f172a' }}>
                        {report.role_parsed || 'Search'}
                      </div>
                      {report.industry && (
                        <div style={{ fontSize: '13px', color: '#64748b' }}>
                          {report.industry}
                        </div>
                      )}
                    </td>
                    <td data-label="Location" style={{ padding: '16px 24px', fontSize: '14px', color: '#475569' }}>
                      {report.location || 'South Africa'}
                    </td>
                    <td data-label="Candidates" style={{ padding: '16px 24px', textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: '32px',
                        padding: '4px 12px',
                        backgroundColor: '#EEF2FF',
                        color: '#4F46E5',
                        borderRadius: '16px',
                        fontSize: '13px',
                        fontWeight: 600,
                      }}>
                        {report.candidate_count}
                      </span>
                    </td>
                    <td data-label="Date" style={{ padding: '16px 24px', fontSize: '14px', color: '#64748b' }}>
                      {new Date(report.created_at).toLocaleDateString('en-ZA', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td data-label="" style={{ padding: '16px 24px', textAlign: 'right' }}>
                      <div className="reports-actions" style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => router.push(`/pilot/reports/${report.id}`)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#4F46E5',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '13px',
                            fontWeight: 500,
                            cursor: 'pointer',
                          }}
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleDelete(report.id)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#ffffff',
                            color: '#dc2626',
                            border: '1px solid #fecaca',
                            borderRadius: '6px',
                            fontSize: '13px',
                            fontWeight: 500,
                            cursor: 'pointer',
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
