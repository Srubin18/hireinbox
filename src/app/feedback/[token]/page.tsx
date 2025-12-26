'use client';

import { useState, useEffect, use } from 'react';

/* ===========================================
   HIREINBOX - CANDIDATE FEEDBACK PORTAL
   Public page for rejected/considered candidates
   Evidence-based, constructive, POPIA compliant
   "90% of rejected candidates never hear why. We're changing that."
   =========================================== */

// Types
interface FeedbackStrength {
  title: string;
  detail: string;
  evidenceQuote?: string;
}

interface FeedbackGap {
  area: string;
  observation: string;
  suggestion: string;
}

interface AlternativeRole {
  role: string;
  reason: string;
}

interface CandidateFeedback {
  candidateName: string;
  roleTitle: string;
  companyName: string;
  feedbackDate: string;
  strengths: FeedbackStrength[];
  gaps: FeedbackGap[];
  actionableSteps: string[];
  alternativeRoles?: AlternativeRole[];
  feedbackType: 'SHORTLIST' | 'CONSIDER' | 'REJECT';
  encouragement: string;
  canRequestReview: boolean;
}

interface PageParams {
  token: string;
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
      <span style={{ fontSize: '0.65rem', color: light ? 'rgba(255,255,255,0.7)' : '#94a3b8', fontWeight: 500 }}>
        Candidate Feedback Portal
      </span>
    </div>
  </div>
);

// Loading component
const LoadingState = () => (
  <div style={{
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC'
  }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{
        width: 48,
        height: 48,
        border: '4px solid #E2E8F0',
        borderTopColor: '#4F46E5',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        margin: '0 auto 16px'
      }} />
      <p style={{ color: '#64748B', fontSize: '0.9375rem' }}>Loading your feedback...</p>
    </div>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

// Error component
const ErrorState = ({ message }: { message: string }) => (
  <div style={{
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    padding: 24
  }}>
    <div style={{
      backgroundColor: 'white',
      borderRadius: 16,
      padding: 40,
      maxWidth: 480,
      textAlign: 'center',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
    }}>
      <div style={{
        width: 64,
        height: 64,
        backgroundColor: '#FEE2E2',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 24px'
      }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', marginBottom: 12 }}>
        Unable to Load Feedback
      </h1>
      <p style={{ fontSize: '1rem', color: '#64748B', lineHeight: 1.6, marginBottom: 24 }}>
        {message}
      </p>
      <a
        href="/"
        style={{
          display: 'inline-block',
          backgroundColor: '#4F46E5',
          color: 'white',
          padding: '12px 24px',
          borderRadius: 8,
          textDecoration: 'none',
          fontWeight: 600,
          fontSize: '0.9375rem'
        }}
      >
        Return Home
      </a>
    </div>
  </div>
);

// Main feedback page component
export default function FeedbackPage({ params }: { params: Promise<PageParams> }) {
  const resolvedParams = use(params);
  const { token } = resolvedParams;

  const [feedback, setFeedback] = useState<CandidateFeedback | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewMessage, setReviewMessage] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    fetchFeedback();
  }, [token]);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/feedback/${token}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load feedback');
      }

      setFeedback(data.feedback);

    } catch (err) {
      console.error('Error fetching feedback:', err);
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestReview = async () => {
    if (!reviewMessage.trim()) return;

    setSubmittingReview(true);
    try {
      const response = await fetch(`/api/feedback/${token}/request-review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: reviewMessage })
      });

      if (response.ok) {
        setReviewSubmitted(true);
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit review request');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to submit request');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return <LoadingState />;
  }

  if (error || !feedback) {
    return <ErrorState message={error || 'Feedback not found or has expired.'} />;
  }

  const getOutcomeStyles = () => {
    switch (feedback.feedbackType) {
      case 'SHORTLIST':
        return { bg: '#D1FAE5', border: '#10B981', color: '#059669', icon: 'check', label: 'Moving Forward' };
      case 'CONSIDER':
        return { bg: '#FEF3C7', border: '#F59E0B', color: '#D97706', icon: 'clock', label: 'Application Reviewed' };
      default:
        return { bg: '#F1F5F9', border: '#94A3B8', color: '#64748B', icon: 'info', label: 'Application Reviewed' };
    }
  };

  const outcomeStyle = getOutcomeStyles();

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
        padding: '16px 24px'
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Logo size={32} />
          <span style={{ fontSize: '0.8125rem', color: '#94A3B8' }}>
            Feedback Portal
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px' }}>

        {/* Outcome Banner */}
        <div style={{
          backgroundColor: outcomeStyle.bg,
          border: `2px solid ${outcomeStyle.border}`,
          borderRadius: 16,
          padding: 24,
          marginBottom: 32,
          textAlign: 'center'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            backgroundColor: 'white',
            padding: '8px 16px',
            borderRadius: 100,
            marginBottom: 16
          }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: outcomeStyle.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {outcomeStyle.label}
            </span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A', marginBottom: 8, lineHeight: 1.3 }}>
            Hi {feedback.candidateName.split(' ')[0]}, here is your feedback
          </h1>
          <p style={{ fontSize: '1rem', color: '#64748B', margin: 0 }}>
            <strong>{feedback.roleTitle}</strong> at <strong>{feedback.companyName}</strong>
          </p>
          <p style={{ fontSize: '0.8125rem', color: '#94A3B8', marginTop: 8 }}>
            Feedback generated on {feedback.feedbackDate}
          </p>
        </div>

        {/* Encouragement Message */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: 16,
          padding: 24,
          marginBottom: 24,
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <p style={{
            fontSize: '1.0625rem',
            color: '#0F172A',
            lineHeight: 1.7,
            margin: 0,
            fontStyle: 'italic'
          }}>
            "{feedback.encouragement}"
          </p>
        </div>

        {/* Strengths Section */}
        {feedback.strengths.length > 0 && (
          <section style={{
            backgroundColor: 'white',
            borderRadius: 16,
            padding: 32,
            marginBottom: 24,
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 24
            }}>
              <div style={{
                width: 40,
                height: 40,
                backgroundColor: '#D1FAE5',
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                What Stood Out
              </h2>
            </div>

            {feedback.strengths.map((strength, i) => (
              <div key={i} style={{
                backgroundColor: '#F0FDF4',
                borderRadius: 12,
                padding: 20,
                marginBottom: i < feedback.strengths.length - 1 ? 16 : 0,
                borderLeft: '4px solid #10B981'
              }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0F172A', marginBottom: 8 }}>
                  {strength.title}
                </h3>
                <p style={{ fontSize: '0.9375rem', color: '#64748B', marginBottom: strength.evidenceQuote ? 12 : 0, lineHeight: 1.5 }}>
                  {strength.detail}
                </p>
                {strength.evidenceQuote && (
                  <div style={{
                    backgroundColor: 'rgba(255,255,255,0.7)',
                    borderRadius: 8,
                    padding: 12,
                    borderLeft: '3px solid #10B981'
                  }}>
                    <p style={{ fontSize: '0.875rem', color: '#059669', margin: 0, fontStyle: 'italic' }}>
                      From your CV: "{strength.evidenceQuote}"
                    </p>
                  </div>
                )}
              </div>
            ))}
          </section>
        )}

        {/* Gaps Section */}
        {feedback.gaps.length > 0 && (
          <section style={{
            backgroundColor: 'white',
            borderRadius: 16,
            padding: 32,
            marginBottom: 24,
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 24
            }}>
              <div style={{
                width: 40,
                height: 40,
                backgroundColor: '#FEF3C7',
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                Areas for Improvement
              </h2>
            </div>

            <p style={{ fontSize: '0.9375rem', color: '#64748B', marginBottom: 20, lineHeight: 1.5 }}>
              These areas were either not addressed in your application or could be strengthened for future opportunities.
            </p>

            {feedback.gaps.map((gap, i) => (
              <div key={i} style={{
                backgroundColor: '#FFFBEB',
                borderRadius: 12,
                padding: 20,
                marginBottom: i < feedback.gaps.length - 1 ? 16 : 0,
                borderLeft: '4px solid #F59E0B'
              }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0F172A', marginBottom: 8 }}>
                  {gap.area}
                </h3>
                <p style={{ fontSize: '0.9375rem', color: '#64748B', marginBottom: 12, lineHeight: 1.5 }}>
                  {gap.observation}
                </p>
                <div style={{
                  backgroundColor: 'rgba(255,255,255,0.7)',
                  borderRadius: 8,
                  padding: 12,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10
                }}>
                  <span style={{ fontSize: '1rem' }}>💡</span>
                  <p style={{ fontSize: '0.875rem', color: '#D97706', margin: 0, fontWeight: 500 }}>
                    {gap.suggestion}
                  </p>
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Actionable Steps */}
        {feedback.actionableSteps.length > 0 && (
          <section style={{
            backgroundColor: '#4F46E5',
            borderRadius: 16,
            padding: 32,
            marginBottom: 24,
            color: 'white'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 24
            }}>
              <div style={{
                width: 40,
                height: 40,
                backgroundColor: 'rgba(255,255,255,0.2)',
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                Your Action Plan
              </h2>
            </div>

            {feedback.actionableSteps.map((step, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 14,
                marginBottom: i < feedback.actionableSteps.length - 1 ? 16 : 0
              }}>
                <div style={{
                  width: 28,
                  height: 28,
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  flexShrink: 0
                }}>
                  {i + 1}
                </div>
                <p style={{ fontSize: '0.9375rem', lineHeight: 1.6, margin: 0, opacity: 0.95 }}>
                  {step}
                </p>
              </div>
            ))}
          </section>
        )}

        {/* Alternative Roles */}
        {feedback.alternativeRoles && feedback.alternativeRoles.length > 0 && (
          <section style={{
            backgroundColor: 'white',
            borderRadius: 16,
            padding: 32,
            marginBottom: 24,
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 24
            }}>
              <div style={{
                width: 40,
                height: 40,
                backgroundColor: '#EEF2FF',
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                </svg>
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                Roles That May Suit You
              </h2>
            </div>

            <p style={{ fontSize: '0.9375rem', color: '#64748B', marginBottom: 20, lineHeight: 1.5 }}>
              Based on your experience and skills, you may be a good fit for these types of roles:
            </p>

            <div style={{ display: 'grid', gap: 12 }}>
              {feedback.alternativeRoles.map((alt, i) => (
                <div key={i} style={{
                  backgroundColor: '#F8FAFC',
                  borderRadius: 12,
                  padding: 16,
                  border: '1px solid #E2E8F0'
                }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#4F46E5', marginBottom: 6 }}>
                    {alt.role}
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: '#64748B', margin: 0 }}>
                    {alt.reason}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Request Review Button */}
        {feedback.canRequestReview && !reviewSubmitted && (
          <section style={{
            backgroundColor: 'white',
            borderRadius: 16,
            padding: 32,
            marginBottom: 24,
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            textAlign: 'center'
          }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0F172A', marginBottom: 12 }}>
              Have questions about this feedback?
            </h2>
            <p style={{ fontSize: '0.9375rem', color: '#64748B', marginBottom: 24, lineHeight: 1.5 }}>
              You can request a human review of your application if you believe something was missed.
            </p>
            <button
              onClick={() => setShowReviewModal(true)}
              style={{
                backgroundColor: '#0F172A',
                color: 'white',
                border: 'none',
                padding: '14px 28px',
                borderRadius: 10,
                fontSize: '0.9375rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              Request Human Review
            </button>
          </section>
        )}

        {/* Review Submitted Confirmation */}
        {reviewSubmitted && (
          <section style={{
            backgroundColor: '#D1FAE5',
            borderRadius: 16,
            padding: 32,
            marginBottom: 24,
            textAlign: 'center',
            border: '2px solid #10B981'
          }}>
            <div style={{
              width: 56,
              height: 56,
              backgroundColor: '#10B981',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>
              Review Request Submitted
            </h2>
            <p style={{ fontSize: '0.9375rem', color: '#059669', margin: 0 }}>
              The hiring team will review your request and may reach out if there is additional information.
            </p>
          </section>
        )}

        {/* Footer */}
        <footer style={{
          textAlign: 'center',
          padding: '32px 0',
          borderTop: '1px solid #E2E8F0'
        }}>
          <p style={{ fontSize: '0.8125rem', color: '#94A3B8', marginBottom: 8 }}>
            Powered by HireInbox - AI-assisted hiring for South African businesses
          </p>
          <p style={{ fontSize: '0.75rem', color: '#CBD5E1', margin: 0 }}>
            This feedback is generated using AI and is provided for informational purposes only.
            <br />Your data is handled in accordance with POPIA regulations.
          </p>
        </footer>
      </main>

      {/* Review Request Modal */}
      {showReviewModal && (
        <div style={{
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
          padding: 24
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: 20,
            padding: 32,
            maxWidth: 500,
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>
              Request Human Review
            </h2>
            <p style={{ fontSize: '0.9375rem', color: '#64748B', marginBottom: 24, lineHeight: 1.5 }}>
              Please explain why you believe your application deserves a second look. Be specific about any qualifications or experience you think may have been overlooked.
            </p>

            <textarea
              value={reviewMessage}
              onChange={(e) => setReviewMessage(e.target.value)}
              placeholder="Example: I have 5 years of experience in sales that I believe meets the requirements. My CV mentions this under my role at XYZ Company..."
              style={{
                width: '100%',
                minHeight: 150,
                padding: 16,
                border: '1px solid #E2E8F0',
                borderRadius: 12,
                fontSize: '0.9375rem',
                resize: 'vertical',
                marginBottom: 24,
                fontFamily: 'inherit',
                lineHeight: 1.5
              }}
            />

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setShowReviewModal(false)}
                style={{
                  flex: 1,
                  padding: '14px 20px',
                  backgroundColor: '#F1F5F9',
                  color: '#64748B',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: '0.9375rem',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleRequestReview}
                disabled={!reviewMessage.trim() || submittingReview}
                style={{
                  flex: 1,
                  padding: '14px 20px',
                  backgroundColor: reviewMessage.trim() ? '#4F46E5' : '#E2E8F0',
                  color: reviewMessage.trim() ? 'white' : '#94A3B8',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  cursor: reviewMessage.trim() ? 'pointer' : 'not-allowed'
                }}
              >
                {submittingReview ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
