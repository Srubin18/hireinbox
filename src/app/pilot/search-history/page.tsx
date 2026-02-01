'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import PilotHeader from '@/components/PilotHeader';

interface SearchHistoryItem {
  id: string;
  created_at: string;
  event_date: string;
  search_prompt: string;
  role: string;
  location: string;
  candidates_found: number;
  report_data: any;
  is_saved: boolean;
  saved_report_id: string | null;
}

export default function SearchHistoryPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [searches, setSearches] = useState<SearchHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSearch, setSelectedSearch] = useState<SearchHistoryItem | null>(null);

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

        setUser({ email: session.user.email || '' });

        // Check if there's an ID in the URL
        const urlParams = new URLSearchParams(window.location.search);
        const searchId = urlParams.get('id');

        if (searchId) {
          // Fetch specific search
          const response = await fetch(`/api/pilot/search-history?id=${searchId}`, {
            headers: { 'Authorization': `Bearer ${session.access_token}` },
          });

          if (response.ok) {
            const data = await response.json();
            setSelectedSearch(data.search);
          }
        } else {
          // Fetch all searches
          const response = await fetch('/api/pilot/search-history', {
            headers: { 'Authorization': `Bearer ${session.access_token}` },
          });

          if (response.ok) {
            const data = await response.json();
            setSearches(data.searches || []);
          }
        }
      } catch (err) {
        console.error('Error fetching search history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [supabase, router]);

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
          <p style={{ color: '#64748b' }}>Loading search history...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (selectedSearch) {
    // Show full search results view
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}>
        <PilotHeader user={user} onLogout={handleLogout} currentPage="search-history" />

        <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px' }}>
          <button
            onClick={() => router.push('/pilot/dashboard')}
            style={{
              padding: '10px 20px',
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              marginBottom: '24px',
            }}
          >
            ← Back to Dashboard
          </button>

          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '32px',
          }}>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
              {selectedSearch.role}
            </h1>
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px' }}>
              {new Date(selectedSearch.created_at).toLocaleDateString()} • {selectedSearch.candidates_found} candidates found
            </p>

            {selectedSearch.report_data ? (
              <div>
                <pre style={{
                  backgroundColor: '#f8fafc',
                  padding: '16px',
                  borderRadius: '8px',
                  overflow: 'auto',
                  fontSize: '13px',
                  color: '#374151',
                }}>
                  {JSON.stringify(selectedSearch.report_data, null, 2)}
                </pre>
              </div>
            ) : (
              <div style={{
                padding: '40px',
                textAlign: 'center',
                color: '#64748b',
              }}>
                No detailed results available for this search.
                This may be an older search from before we started storing full results.
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      <PilotHeader user={user} onLogout={handleLogout} currentPage="search-history" />

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px' }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
            Search History
          </h1>
          <p style={{ fontSize: '16px', color: '#64748b' }}>
            All your talent mapping searches, including unsaved results
          </p>
        </div>

        {searches.length === 0 ? (
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '60px 40px',
            textAlign: 'center',
          }}>
            <p style={{ fontSize: '16px', color: '#64748b', marginBottom: '16px' }}>
              No searches yet
            </p>
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
              Start Your First Search
            </button>
          </div>
        ) : (
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{
                    textAlign: 'left',
                    padding: '16px 24px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#475569',
                  }}>
                    Role
                  </th>
                  <th style={{
                    textAlign: 'left',
                    padding: '16px 24px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#475569',
                  }}>
                    Location
                  </th>
                  <th style={{
                    textAlign: 'center',
                    padding: '16px 24px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#475569',
                  }}>
                    Candidates
                  </th>
                  <th style={{
                    textAlign: 'left',
                    padding: '16px 24px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#475569',
                  }}>
                    Date
                  </th>
                  <th style={{
                    textAlign: 'center',
                    padding: '16px 24px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#475569',
                  }}>
                    Status
                  </th>
                  <th style={{
                    textAlign: 'right',
                    padding: '16px 24px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#475569',
                  }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {searches.map((search, idx) => (
                  <tr
                    key={search.id}
                    style={{
                      borderBottom: idx < searches.length - 1 ? '1px solid #f1f5f9' : 'none',
                    }}
                  >
                    <td style={{
                      padding: '16px 24px',
                      fontSize: '14px',
                      fontWeight: 500,
                      color: '#0f172a',
                    }}>
                      {search.role}
                    </td>
                    <td style={{
                      padding: '16px 24px',
                      fontSize: '14px',
                      color: '#64748b',
                    }}>
                      {search.location || '-'}
                    </td>
                    <td style={{
                      padding: '16px 24px',
                      fontSize: '14px',
                      color: '#4F46E5',
                      fontWeight: 600,
                      textAlign: 'center',
                    }}>
                      {search.candidates_found}
                    </td>
                    <td style={{
                      padding: '16px 24px',
                      fontSize: '14px',
                      color: '#64748b',
                    }}>
                      {new Date(search.created_at).toLocaleDateString()}
                    </td>
                    <td style={{
                      padding: '16px 24px',
                      textAlign: 'center',
                    }}>
                      {search.is_saved ? (
                        <span style={{
                          padding: '4px 12px',
                          backgroundColor: '#d1fae5',
                          color: '#065f46',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 600,
                        }}>
                          Saved
                        </span>
                      ) : (
                        <span style={{
                          padding: '4px 12px',
                          backgroundColor: '#fef3c7',
                          color: '#92400e',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 600,
                        }}>
                          Unsaved
                        </span>
                      )}
                    </td>
                    <td style={{
                      padding: '16px 24px',
                      textAlign: 'right',
                    }}>
                      <button
                        onClick={() => setSelectedSearch(search)}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#4F46E5',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: 500,
                          cursor: 'pointer',
                        }}
                      >
                        View Results
                      </button>
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
