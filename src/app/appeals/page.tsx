'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

/**
 * Appeals Dashboard - Employer Human Review Management
 *
 * POPIA-compliant human review system for AI screening decisions.
 * Employers can view, review, and respond to candidate appeal requests.
 */

interface Appeal {
  id: string;
  candidate_id: string;
  role_id?: string;
  company_id?: string;
  candidate_name: string;
  candidate_email: string;
  role_title: string;
  reason: string;
  status: 'pending' | 'reviewed' | 'upheld' | 'overturned';
  ai_score?: number;
  ai_recommendation?: string;
  ai_decision_data?: Record<string, unknown>;
  reviewer_name?: string;
  reviewer_email?: string;
  reviewer_notes?: string;
  outcome?: string;
  outcome_reason?: string;
  next_steps?: string;
  created_at: string;
  updated_at?: string;
  reviewed_at?: string;
}

interface CandidateDetail {
  id: string;
  name: string;
  email: string;
  score: number;
  cv_text?: string;
  status: string;
  screening_result?: Record<string, unknown>;
}

// Design system colors
const COLORS = {
  primary: '#0F172A',
  secondary: '#64748B',
  brand: '#4F46E5',
  muted: '#94A3B8',
  border: '#E2E8F0',
  success: '#059669',
  warning: '#D97706',
  error: '#DC2626',
  background: '#F8FAFC',
};

// Logo component
const Logo = ({ size = 32 }: { size?: number }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="12" fill="#4F46E5"/>
      <path d="M12 18L24 26L36 18V32C36 33.1 35.1 34 34 34H14C12.9 34 12 33.1 12 32V18Z" fill="white" fillOpacity="0.9"/>
      <path d="M34 14H14C12.9 14 12 14.9 12 16V18L24 26L36 18V16C36 14.9 35.1 14 34 14Z" fill="white"/>
      <circle cx="36" cy="12" r="9" fill="#10B981"/>
      <path d="M32.5 12L35 14.5L39.5 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <span style={{ fontSize: '1.1rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
        <span style={{ color: COLORS.primary }}>Hire</span>
        <span style={{ color: COLORS.brand }}>Inbox</span>
      </span>
      <span style={{ fontSize: '0.65rem', color: COLORS.muted, fontWeight: 500 }}>
        Human Review Dashboard
      </span>
    </div>
  </div>
);

// Status badge component
function StatusBadge({ status }: { status: Appeal['status'] }) {
  const config = {
    pending: { bg: '#FEF3C7', text: '#92400E', label: 'Pending Review' },
    reviewed: { bg: '#DBEAFE', text: '#1E40AF', label: 'Under Review' },
    upheld: { bg: '#F1F5F9', text: '#475569', label: 'Decision Upheld' },
    overturned: { bg: '#D1FAE5', text: '#065F46', label: 'Decision Overturned' },
  };

  const { bg, text, label } = config[status] || config.pending;

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '4px 12px',
      backgroundColor: bg,
      color: text,
      borderRadius: '9999px',
      fontSize: '13px',
      fontWeight: 500,
    }}>
      {status === 'pending' && (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12,6 12,12 16,14" />
        </svg>
      )}
      {status === 'overturned' && (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22,4 12,14.01 9,11.01" />
        </svg>
      )}
      {label}
    </span>
  );
}

// Format date helper
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Time ago helper
function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateString);
}

export default function AppealsPage() {
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAppeal, setSelectedAppeal] = useState<Appeal | null>(null);
  const [candidateDetail, setCandidateDetail] = useState<CandidateDetail | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'reviewed' | 'upheld' | 'overturned'>('all');
  const [reviewerName, setReviewerName] = useState('');
  const [reviewerNotes, setReviewerNotes] = useState('');
  const [nextSteps, setNextSteps] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch appeals
  const fetchAppeals = useCallback(async () => {
    try {
      setLoading(true);
      const url = filter === 'all'
        ? '/api/appeal/request'
        : `/api/appeal/request?status=${filter}`;

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch appeals');
      }

      setAppeals(data.appeals || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load appeals');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchAppeals();
  }, [fetchAppeals]);

  // Fetch appeal details when selected
  useEffect(() => {
    if (!selectedAppeal) {
      setCandidateDetail(null);
      return;
    }

    const fetchDetails = async () => {
      try {
        const response = await fetch(`/api/appeal/${selectedAppeal.id}`);
        const data = await response.json();

        if (response.ok && data.candidate) {
          setCandidateDetail(data.candidate);
        }
      } catch (err) {
        console.error('Failed to fetch appeal details:', err);
      }
    };

    fetchDetails();
  }, [selectedAppeal]);

  // Handle appeal decision
  const handleDecision = async (decision: 'upheld' | 'overturned') => {
    if (!selectedAppeal) return;

    if (!reviewerName.trim()) {
      alert('Please enter your name as the reviewer');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`/api/appeal/${selectedAppeal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: decision,
          reviewer_name: reviewerName,
          reviewer_notes: reviewerNotes,
          next_steps: nextSteps,
          outcome: decision,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update appeal');
      }

      // Refresh appeals list
      await fetchAppeals();

      // Close modal
      setSelectedAppeal(null);
      setReviewerName('');
      setReviewerNotes('');
      setNextSteps('');

      alert(data.message);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to submit decision');
    } finally {
      setSubmitting(false);
    }
  };

  // Count stats
  const stats = {
    total: appeals.length,
    pending: appeals.filter(a => a.status === 'pending').length,
    overturned: appeals.filter(a => a.status === 'overturned').length,
    upheld: appeals.filter(a => a.status === 'upheld').length,
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: COLORS.background,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      {/* Header */}
      <header style={{
        backgroundColor: 'white',
        borderBottom: `1px solid ${COLORS.border}`,
        padding: '16px 24px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <Logo />

          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: COLORS.secondary,
              textDecoration: 'none',
              fontSize: '14px',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
        </div>
      </header>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
        {/* Page Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{
            margin: '0 0 8px',
            fontSize: '28px',
            fontWeight: 700,
            color: COLORS.primary,
          }}>
            Human Review Appeals
          </h1>
          <p style={{ margin: 0, color: COLORS.secondary, fontSize: '15px' }}>
            Review and respond to candidate requests for human review of AI screening decisions.
          </p>
        </div>

        {/* Stats Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '32px',
        }}>
          {[
            { label: 'Total Appeals', value: stats.total, color: COLORS.brand },
            { label: 'Pending Review', value: stats.pending, color: COLORS.warning },
            { label: 'Decisions Overturned', value: stats.overturned, color: COLORS.success },
            { label: 'Decisions Upheld', value: stats.upheld, color: COLORS.secondary },
          ].map((stat, i) => (
            <div key={i} style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '20px',
              border: `1px solid ${COLORS.border}`,
            }}>
              <p style={{
                margin: '0 0 8px',
                fontSize: '13px',
                color: COLORS.muted,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                {stat.label}
              </p>
              <p style={{
                margin: 0,
                fontSize: '32px',
                fontWeight: 700,
                color: stat.color,
              }}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '24px',
          flexWrap: 'wrap',
        }}>
          {(['all', 'pending', 'reviewed', 'upheld', 'overturned'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: filter === status ? `2px solid ${COLORS.brand}` : `1px solid ${COLORS.border}`,
                backgroundColor: filter === status ? '#EEF2FF' : 'white',
                color: filter === status ? COLORS.brand : COLORS.secondary,
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {status === 'all' ? 'All Appeals' : status}
            </button>
          ))}
        </div>

        {/* Appeals List */}
        {loading ? (
          <div style={{
            textAlign: 'center',
            padding: '64px 24px',
            backgroundColor: 'white',
            borderRadius: '16px',
            border: `1px solid ${COLORS.border}`,
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: `3px solid ${COLORS.border}`,
              borderTopColor: COLORS.brand,
              borderRadius: '50%',
              margin: '0 auto 16px',
              animation: 'spin 1s linear infinite',
            }} />
            <p style={{ margin: 0, color: COLORS.secondary }}>Loading appeals...</p>
          </div>
        ) : error ? (
          <div style={{
            textAlign: 'center',
            padding: '64px 24px',
            backgroundColor: '#FEF2F2',
            borderRadius: '16px',
            border: '1px solid #FEE2E2',
          }}>
            <p style={{ margin: '0 0 16px', color: '#DC2626', fontSize: '16px' }}>{error}</p>
            <button
              onClick={fetchAppeals}
              style={{
                padding: '10px 20px',
                backgroundColor: COLORS.brand,
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              Try Again
            </button>
          </div>
        ) : appeals.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '64px 24px',
            backgroundColor: 'white',
            borderRadius: '16px',
            border: `1px solid ${COLORS.border}`,
          }}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke={COLORS.muted} strokeWidth="1.5" style={{ margin: '0 auto 16px', display: 'block' }}>
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 style={{ margin: '0 0 8px', color: COLORS.primary, fontSize: '18px' }}>No Appeals Found</h3>
            <p style={{ margin: 0, color: COLORS.secondary }}>
              {filter === 'all'
                ? 'No candidates have requested human review yet.'
                : `No ${filter} appeals at this time.`}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {appeals.map((appeal) => (
              <div
                key={appeal.id}
                onClick={() => setSelectedAppeal(appeal)}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '16px',
                  padding: '24px',
                  border: `1px solid ${COLORS.border}`,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                  e.currentTarget.style.borderColor = COLORS.brand;
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
                  e.currentTarget.style.borderColor = COLORS.border;
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 600, color: COLORS.primary }}>
                      {appeal.candidate_name}
                    </h3>
                    <p style={{ margin: 0, fontSize: '14px', color: COLORS.secondary }}>
                      {appeal.candidate_email}
                    </p>
                  </div>
                  <StatusBadge status={appeal.status} />
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: '16px',
                  marginBottom: '16px',
                }}>
                  <div>
                    <p style={{ margin: '0 0 4px', fontSize: '12px', color: COLORS.muted, textTransform: 'uppercase' }}>Role</p>
                    <p style={{ margin: 0, fontSize: '14px', color: COLORS.primary, fontWeight: 500 }}>{appeal.role_title}</p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 4px', fontSize: '12px', color: COLORS.muted, textTransform: 'uppercase' }}>AI Score</p>
                    <p style={{ margin: 0, fontSize: '14px', color: COLORS.primary, fontWeight: 500 }}>
                      {appeal.ai_score !== undefined ? `${appeal.ai_score}/100` : 'N/A'}
                      {appeal.ai_recommendation && (
                        <span style={{ color: COLORS.secondary, fontWeight: 400 }}> ({appeal.ai_recommendation})</span>
                      )}
                    </p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 4px', fontSize: '12px', color: COLORS.muted, textTransform: 'uppercase' }}>Submitted</p>
                    <p style={{ margin: 0, fontSize: '14px', color: COLORS.primary }}>{timeAgo(appeal.created_at)}</p>
                  </div>
                </div>

                {appeal.reason && (
                  <div style={{
                    backgroundColor: '#FFFBEB',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    borderLeft: `3px solid ${COLORS.warning}`,
                  }}>
                    <p style={{ margin: '0 0 4px', fontSize: '12px', color: COLORS.muted, textTransform: 'uppercase' }}>
                      Candidate&apos;s Reason
                    </p>
                    <p style={{ margin: 0, fontSize: '14px', color: '#92400E', lineHeight: 1.5 }}>
                      &quot;{appeal.reason}&quot;
                    </p>
                  </div>
                )}

                {appeal.status === 'pending' && (
                  <div style={{ marginTop: '16px', textAlign: 'right' }}>
                    <span style={{ fontSize: '13px', color: COLORS.brand, fontWeight: 500 }}>
                      Click to review
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Review Modal */}
      {selectedAppeal && (
        <div
          onClick={() => setSelectedAppeal(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'white',
              borderRadius: '20px',
              maxWidth: '800px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
          >
            {/* Modal Header */}
            <div style={{
              padding: '24px 32px',
              borderBottom: `1px solid ${COLORS.border}`,
              position: 'sticky',
              top: 0,
              backgroundColor: 'white',
              zIndex: 10,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div>
                <h2 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: 600, color: COLORS.primary }}>
                  Review Appeal
                </h2>
                <p style={{ margin: 0, fontSize: '14px', color: COLORS.secondary }}>
                  {selectedAppeal.candidate_name} - {selectedAppeal.role_title}
                </p>
              </div>
              <button
                onClick={() => setSelectedAppeal(null)}
                style={{
                  padding: '8px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  borderRadius: '8px',
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={COLORS.secondary} strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ padding: '32px' }}>
              {/* Appeal Info */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '24px',
                marginBottom: '32px',
              }}>
                <div>
                  <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600, color: COLORS.primary }}>
                    Appeal Details
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <p style={{ margin: '0 0 2px', fontSize: '12px', color: COLORS.muted }}>Status</p>
                      <StatusBadge status={selectedAppeal.status} />
                    </div>
                    <div>
                      <p style={{ margin: '0 0 2px', fontSize: '12px', color: COLORS.muted }}>Email</p>
                      <a href={`mailto:${selectedAppeal.candidate_email}`} style={{ color: COLORS.brand, fontSize: '14px' }}>
                        {selectedAppeal.candidate_email}
                      </a>
                    </div>
                    <div>
                      <p style={{ margin: '0 0 2px', fontSize: '12px', color: COLORS.muted }}>Submitted</p>
                      <p style={{ margin: 0, fontSize: '14px', color: COLORS.primary }}>{formatDate(selectedAppeal.created_at)}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600, color: COLORS.primary }}>
                    AI Decision
                  </h3>
                  <div style={{
                    backgroundColor: '#F8FAFC',
                    borderRadius: '12px',
                    padding: '16px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        backgroundColor: selectedAppeal.ai_recommendation === 'SHORTLIST' ? '#D1FAE5'
                          : selectedAppeal.ai_recommendation === 'CONSIDER' ? '#FEF3C7' : '#FEE2E2',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '18px',
                        fontWeight: 700,
                        color: selectedAppeal.ai_recommendation === 'SHORTLIST' ? '#065F46'
                          : selectedAppeal.ai_recommendation === 'CONSIDER' ? '#92400E' : '#991B1B',
                      }}>
                        {selectedAppeal.ai_score ?? '?'}
                      </div>
                      <div>
                        <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: COLORS.primary }}>
                          {selectedAppeal.ai_recommendation || 'Unknown'}
                        </p>
                        <p style={{ margin: '2px 0 0', fontSize: '13px', color: COLORS.secondary }}>
                          Score: {selectedAppeal.ai_score ?? 'N/A'}/100
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Candidate's Reason */}
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: 600, color: COLORS.primary }}>
                  Candidate&apos;s Appeal Reason
                </h3>
                <div style={{
                  backgroundColor: '#FFFBEB',
                  borderRadius: '12px',
                  padding: '20px',
                  borderLeft: `4px solid ${COLORS.warning}`,
                }}>
                  <p style={{ margin: 0, fontSize: '15px', color: '#92400E', lineHeight: 1.6 }}>
                    &quot;{selectedAppeal.reason}&quot;
                  </p>
                </div>
              </div>

              {/* CV Preview (if available) */}
              {candidateDetail?.cv_text && (
                <div style={{ marginBottom: '32px' }}>
                  <h3 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: 600, color: COLORS.primary }}>
                    CV Extract
                  </h3>
                  <div style={{
                    backgroundColor: '#F8FAFC',
                    borderRadius: '12px',
                    padding: '20px',
                    maxHeight: '200px',
                    overflow: 'auto',
                    border: `1px solid ${COLORS.border}`,
                  }}>
                    <pre style={{
                      margin: 0,
                      fontSize: '13px',
                      color: COLORS.secondary,
                      whiteSpace: 'pre-wrap',
                      fontFamily: 'inherit',
                    }}>
                      {candidateDetail.cv_text.substring(0, 2000)}
                      {candidateDetail.cv_text.length > 2000 && '...'}
                    </pre>
                  </div>
                </div>
              )}

              {/* Review Form (only for pending appeals) */}
              {selectedAppeal.status === 'pending' && (
                <div style={{
                  backgroundColor: '#F8FAFC',
                  borderRadius: '16px',
                  padding: '24px',
                  marginBottom: '24px',
                }}>
                  <h3 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: 600, color: COLORS.primary }}>
                    Your Review
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500, color: COLORS.primary }}>
                        Your Name <span style={{ color: COLORS.error }}>*</span>
                      </label>
                      <input
                        type="text"
                        value={reviewerName}
                        onChange={(e) => setReviewerName(e.target.value)}
                        placeholder="Enter your name"
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          border: `1px solid ${COLORS.border}`,
                          fontSize: '14px',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500, color: COLORS.primary }}>
                        Review Notes (shared with candidate)
                      </label>
                      <textarea
                        value={reviewerNotes}
                        onChange={(e) => setReviewerNotes(e.target.value)}
                        placeholder="Explain your decision..."
                        rows={3}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          border: `1px solid ${COLORS.border}`,
                          fontSize: '14px',
                          resize: 'vertical',
                          fontFamily: 'inherit',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500, color: COLORS.primary }}>
                        Next Steps (if overturning)
                      </label>
                      <input
                        type="text"
                        value={nextSteps}
                        onChange={(e) => setNextSteps(e.target.value)}
                        placeholder="e.g., We will contact you to schedule an interview"
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          border: `1px solid ${COLORS.border}`,
                          fontSize: '14px',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Previous Review (for reviewed appeals) */}
              {selectedAppeal.status !== 'pending' && selectedAppeal.reviewer_name && (
                <div style={{
                  backgroundColor: '#F0FDF4',
                  borderRadius: '16px',
                  padding: '24px',
                  marginBottom: '24px',
                }}>
                  <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600, color: '#166534' }}>
                    Review Completed
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <p style={{ margin: '0 0 2px', fontSize: '12px', color: '#15803D' }}>Reviewed by</p>
                      <p style={{ margin: 0, fontSize: '14px', color: '#166534', fontWeight: 500 }}>{selectedAppeal.reviewer_name}</p>
                    </div>
                    {selectedAppeal.reviewed_at && (
                      <div>
                        <p style={{ margin: '0 0 2px', fontSize: '12px', color: '#15803D' }}>Reviewed on</p>
                        <p style={{ margin: 0, fontSize: '14px', color: '#166534' }}>{formatDate(selectedAppeal.reviewed_at)}</p>
                      </div>
                    )}
                    {selectedAppeal.reviewer_notes && (
                      <div>
                        <p style={{ margin: '0 0 2px', fontSize: '12px', color: '#15803D' }}>Notes</p>
                        <p style={{ margin: 0, fontSize: '14px', color: '#166534' }}>{selectedAppeal.reviewer_notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* POPIA Notice */}
              <div style={{
                backgroundColor: '#EEF2FF',
                borderRadius: '12px',
                padding: '16px 20px',
                marginBottom: '24px',
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start',
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={COLORS.brand} strokeWidth="2" style={{ flexShrink: 0, marginTop: '2px' }}>
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <p style={{ margin: 0, fontSize: '13px', color: '#3730A3', lineHeight: 1.5 }}>
                  <strong>POPIA Compliance:</strong> This review will be logged for audit purposes.
                  The candidate will be notified of your decision via email.
                </p>
              </div>

              {/* Action Buttons */}
              {selectedAppeal.status === 'pending' && (
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => handleDecision('upheld')}
                    disabled={submitting}
                    style={{
                      padding: '12px 24px',
                      borderRadius: '10px',
                      border: `1px solid ${COLORS.border}`,
                      backgroundColor: 'white',
                      color: COLORS.secondary,
                      fontSize: '15px',
                      fontWeight: 500,
                      cursor: submitting ? 'not-allowed' : 'pointer',
                      opacity: submitting ? 0.7 : 1,
                    }}
                  >
                    Uphold AI Decision
                  </button>
                  <button
                    onClick={() => handleDecision('overturned')}
                    disabled={submitting}
                    style={{
                      padding: '12px 24px',
                      borderRadius: '10px',
                      border: 'none',
                      backgroundColor: COLORS.success,
                      color: 'white',
                      fontSize: '15px',
                      fontWeight: 500,
                      cursor: submitting ? 'not-allowed' : 'pointer',
                      opacity: submitting ? 0.7 : 1,
                    }}
                  >
                    {submitting ? 'Submitting...' : 'Overturn Decision'}
                  </button>
                </div>
              )}

              {selectedAppeal.status !== 'pending' && (
                <div style={{ textAlign: 'right' }}>
                  <button
                    onClick={() => setSelectedAppeal(null)}
                    style={{
                      padding: '12px 24px',
                      borderRadius: '10px',
                      border: 'none',
                      backgroundColor: COLORS.brand,
                      color: 'white',
                      fontSize: '15px',
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
