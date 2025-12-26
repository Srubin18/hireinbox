'use client';

import { useState, useEffect } from 'react';

// ============================================
// Talent Pool - Future Opportunity Candidates
// ============================================

interface TalentCandidate {
  id: string;
  candidate_id: string;
  ai_recommended_roles: string[];
  ai_talent_notes: string;
  talent_category: string;
  seniority_level: string;
  share_with_network: boolean;
  added_at: string;
  notes: string;
  candidates: {
    id: string;
    name: string;
    email: string;
    score: number;
    cv_summary: string;
    strengths: string[];
    experience_years: number;
    education: string;
  };
  roles: {
    id: string;
    title: string;
  } | null;
}

const CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'tech', label: 'Technology' },
  { value: 'finance', label: 'Finance' },
  { value: 'sales', label: 'Sales' },
  { value: 'operations', label: 'Operations' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'hr', label: 'Human Resources' },
  { value: 'admin', label: 'Administration' },
];

export default function TalentPoolPage() {
  const [talent, setTalent] = useState<TalentCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [includeNetwork, setIncludeNetwork] = useState(false);
  const [selectedTalent, setSelectedTalent] = useState<TalentCandidate | null>(null);

  // Fetch talent pool
  useEffect(() => {
    fetchTalentPool();
  }, [category, includeNetwork]);

  const fetchTalentPool = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category) params.set('category', category);
      if (includeNetwork) params.set('include_network', 'true');

      const response = await fetch(`/api/talent-pool?${params}`);
      const data = await response.json();

      if (data.success) {
        setTalent(data.talent);
      }
    } catch (error) {
      console.error('Failed to fetch talent pool:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSharing = async (id: string, currentValue: boolean) => {
    try {
      const response = await fetch('/api/talent-pool', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, share_with_network: !currentValue })
      });

      if (response.ok) {
        fetchTalentPool();
      }
    } catch (error) {
      console.error('Failed to toggle sharing:', error);
    }
  };

  const removeFromPool = async (id: string) => {
    if (!confirm('Remove this candidate from your talent pool?')) return;

    try {
      const response = await fetch(`/api/talent-pool?id=${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchTalentPool();
        setSelectedTalent(null);
      }
    } catch (error) {
      console.error('Failed to remove from pool:', error);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#F8FAFC',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header */}
      <header style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #E2E8F0',
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <a href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="32" height="32" viewBox="0 0 48 48" fill="none">
              <rect width="48" height="48" rx="12" fill="#4F46E5"/>
              <path d="M12 18L24 26L36 18V32C36 33.1 35.1 34 34 34H14C12.9 34 12 33.1 12 32V18Z" fill="white" fillOpacity="0.9"/>
              <path d="M34 14H14C12.9 14 12 14.9 12 16V18L24 26L36 18V16C36 14.9 35.1 14 34 14Z" fill="white"/>
            </svg>
            <span style={{ fontWeight: 700, fontSize: '1.125rem' }}>
              <span style={{ color: '#0f172a' }}>Hire</span>
              <span style={{ color: '#4F46E5' }}>Inbox</span>
            </span>
          </a>
          <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>/ Talent Pool</span>
        </div>

        <a
          href="/"
          style={{
            padding: '8px 16px',
            backgroundColor: '#F1F5F9',
            color: '#64748B',
            borderRadius: 8,
            textDecoration: 'none',
            fontSize: '0.875rem',
            fontWeight: 500
          }}
        >
          Back to Dashboard
        </a>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
        {/* Page Title */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>
            Talent Pool
          </h1>
          <p style={{ color: '#64748B', fontSize: '0.9375rem' }}>
            Candidates saved for future opportunities. Not right for one role, but potential for another.
          </p>
        </div>

        {/* Filters */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: 12,
          padding: 16,
          marginBottom: 24,
          display: 'flex',
          gap: 16,
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{
              padding: '10px 16px',
              borderRadius: 8,
              border: '1px solid #E2E8F0',
              fontSize: '0.875rem',
              minWidth: 180
            }}
          >
            {CATEGORIES.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>

          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: '0.875rem',
            color: '#64748B',
            cursor: 'pointer'
          }}>
            <input
              type="checkbox"
              checked={includeNetwork}
              onChange={(e) => setIncludeNetwork(e.target.checked)}
              style={{ width: 18, height: 18 }}
            />
            Include HireInbox Network Talent
          </label>

          <div style={{ marginLeft: 'auto', fontSize: '0.875rem', color: '#64748B' }}>
            {talent.length} candidate{talent.length !== 1 ? 's' : ''} in pool
          </div>
        </div>

        {/* Talent Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#64748B' }}>
            Loading talent pool...
          </div>
        ) : talent.length === 0 ? (
          <div style={{
            backgroundColor: 'white',
            borderRadius: 12,
            padding: 60,
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>👥</div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0F172A', marginBottom: 8 }}>
              No talent in pool yet
            </h3>
            <p style={{ color: '#64748B', fontSize: '0.9375rem' }}>
              When you screen candidates, save promising ones who don&apos;t fit the current role to your talent pool.
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: 16
          }}>
            {talent.map((t) => (
              <div
                key={t.id}
                onClick={() => setSelectedTalent(t)}
                style={{
                  backgroundColor: 'white',
                  borderRadius: 12,
                  padding: 20,
                  cursor: 'pointer',
                  border: '1px solid #E2E8F0',
                  transition: 'all 0.2s',
                  position: 'relative'
                }}
              >
                {/* Network Badge */}
                {t.share_with_network && (
                  <div style={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    backgroundColor: '#EEF2FF',
                    color: '#4F46E5',
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                    padding: '4px 8px',
                    borderRadius: 4
                  }}>
                    SHARED
                  </div>
                )}

                {/* Candidate Info */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    backgroundColor: '#EEF2FF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 600,
                    color: '#4F46E5',
                    fontSize: '1rem'
                  }}>
                    {t.candidates?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0F172A', marginBottom: 2 }}>
                      {t.candidates?.name || 'Unknown'}
                    </h3>
                    <p style={{ fontSize: '0.8125rem', color: '#64748B', margin: 0 }}>
                      {t.candidates?.experience_years || 0} years exp • Score: {t.candidates?.score || 0}
                    </p>
                  </div>
                </div>

                {/* Original Role */}
                {t.roles && (
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#94A3B8',
                    marginBottom: 8
                  }}>
                    Originally applied for: {t.roles.title}
                  </div>
                )}

                {/* AI Recommended Roles */}
                {t.ai_recommended_roles && t.ai_recommended_roles.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: 6 }}>
                      AI Recommended Roles:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {t.ai_recommended_roles.slice(0, 3).map((role, i) => (
                        <span
                          key={i}
                          style={{
                            backgroundColor: '#F0FDF4',
                            color: '#059669',
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            padding: '4px 8px',
                            borderRadius: 4
                          }}
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Category & Seniority */}
                <div style={{ display: 'flex', gap: 8 }}>
                  {t.talent_category && (
                    <span style={{
                      backgroundColor: '#F1F5F9',
                      color: '#64748B',
                      fontSize: '0.6875rem',
                      fontWeight: 500,
                      padding: '4px 8px',
                      borderRadius: 4,
                      textTransform: 'uppercase'
                    }}>
                      {t.talent_category}
                    </span>
                  )}
                  {t.seniority_level && (
                    <span style={{
                      backgroundColor: '#F1F5F9',
                      color: '#64748B',
                      fontSize: '0.6875rem',
                      fontWeight: 500,
                      padding: '4px 8px',
                      borderRadius: 4,
                      textTransform: 'uppercase'
                    }}>
                      {t.seniority_level}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Detail Modal */}
      {selectedTalent && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 20
          }}
          onClick={() => setSelectedTalent(null)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: 16,
              padding: 24,
              width: '100%',
              maxWidth: 600,
              maxHeight: '90vh',
              overflow: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  backgroundColor: '#EEF2FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  color: '#4F46E5',
                  fontSize: '1.25rem'
                }}>
                  {selectedTalent.candidates?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?'}
                </div>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>
                    {selectedTalent.candidates?.name || 'Unknown'}
                  </h2>
                  <p style={{ fontSize: '0.875rem', color: '#64748B', margin: 0 }}>
                    {selectedTalent.candidates?.email}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTalent(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8 }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Stats */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 12,
              marginBottom: 20
            }}>
              <div style={{ backgroundColor: '#F8FAFC', padding: 12, borderRadius: 8, textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#4F46E5' }}>
                  {selectedTalent.candidates?.score || 0}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>CV Score</div>
              </div>
              <div style={{ backgroundColor: '#F8FAFC', padding: 12, borderRadius: 8, textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A' }}>
                  {selectedTalent.candidates?.experience_years || 0}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Years Exp</div>
              </div>
              <div style={{ backgroundColor: '#F8FAFC', padding: 12, borderRadius: 8, textAlign: 'center' }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A' }}>
                  {selectedTalent.seniority_level || 'N/A'}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Level</div>
              </div>
            </div>

            {/* AI Notes */}
            {selectedTalent.ai_talent_notes && (
              <div style={{
                backgroundColor: '#F0FDF4',
                borderRadius: 12,
                padding: 16,
                marginBottom: 20,
                borderLeft: '4px solid #10B981'
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#059669', marginBottom: 8 }}>
                  AI TALENT ASSESSMENT
                </div>
                <p style={{ fontSize: '0.875rem', color: '#064E3B', lineHeight: 1.6, margin: 0 }}>
                  {selectedTalent.ai_talent_notes}
                </p>
              </div>
            )}

            {/* Recommended Roles */}
            {selectedTalent.ai_recommended_roles && selectedTalent.ai_recommended_roles.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', marginBottom: 8 }}>
                  RECOMMENDED ROLES
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {selectedTalent.ai_recommended_roles.map((role, i) => (
                    <span
                      key={i}
                      style={{
                        backgroundColor: '#EEF2FF',
                        color: '#4F46E5',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        padding: '8px 12px',
                        borderRadius: 8
                      }}
                    >
                      {role}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Share Toggle */}
            <div style={{
              backgroundColor: '#F8FAFC',
              borderRadius: 12,
              padding: 16,
              marginBottom: 20,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A' }}>
                  Share with HireInbox Network
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                  Allow other companies to view this candidate
                </div>
              </div>
              <button
                onClick={() => toggleSharing(selectedTalent.id, selectedTalent.share_with_network)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: selectedTalent.share_with_network ? '#4F46E5' : '#E2E8F0',
                  color: selectedTalent.share_with_network ? 'white' : '#64748B',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                {selectedTalent.share_with_network ? 'Sharing' : 'Share'}
              </button>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => window.location.href = `mailto:${selectedTalent.candidates?.email}`}
                style={{
                  flex: 1,
                  padding: '14px 20px',
                  backgroundColor: '#4F46E5',
                  color: 'white',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Contact Candidate
              </button>
              <button
                onClick={() => removeFromPool(selectedTalent.id)}
                style={{
                  padding: '14px 20px',
                  backgroundColor: 'white',
                  color: '#DC2626',
                  border: '1px solid #FCA5A5',
                  borderRadius: 10,
                  fontSize: '0.9375rem',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
