'use client';

import React, { useState } from 'react';

/**
 * HumanAvailableBadge - POPIA Compliance & Trust Builder
 *
 * Shows "AI Assisted - Human Review Available" on all AI decisions.
 * Builds trust by showing transparency and offering human review option.
 *
 * 74% of candidates want human interaction for final decisions.
 * POPIA requires human review option for automated decisions.
 */

interface HumanAvailableBadgeProps {
  // Display mode
  variant?: 'inline' | 'card' | 'compact';

  // Appeal functionality
  candidateId?: string;
  candidateName?: string;
  candidateEmail?: string;
  roleTitle?: string;
  onAppealRequested?: (appealId: string) => void;

  // Appeal status
  appealStatus?: 'none' | 'pending' | 'reviewed' | 'overturned' | 'upheld';

  // Styling
  className?: string;
  showAppealButton?: boolean;
}

// Shared colors matching the codebase design system
const COLORS = {
  primary: '#0F172A',
  secondary: '#64748B',
  brand: '#4F46E5',
  muted: '#94A3B8',
  border: '#E2E8F0',
  success: '#059669',
  warning: '#D97706',
  info: '#0284C7',
};

export default function HumanAvailableBadge({
  variant = 'inline',
  candidateId,
  candidateName,
  candidateEmail,
  roleTitle,
  onAppealRequested,
  appealStatus = 'none',
  className = '',
  showAppealButton = true,
}: HumanAvailableBadgeProps) {
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reason, setReason] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleRequestAppeal = async () => {
    if (!candidateId || !candidateEmail) {
      setSubmitError('Missing candidate information');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch('/api/appeal/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate_id: candidateId,
          candidate_name: candidateName,
          candidate_email: candidateEmail,
          role_title: roleTitle,
          reason: reason.trim() || 'Candidate requested human review of AI decision',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit appeal');
      }

      setSubmitted(true);
      if (onAppealRequested && data.appeal?.id) {
        onAppealRequested(data.appeal.id);
      }

      // Close modal after short delay
      setTimeout(() => {
        setShowModal(false);
        setSubmitted(false);
        setReason('');
      }, 2500);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to submit appeal');
    } finally {
      setSubmitting(false);
    }
  };

  // Status badge when appeal is already in progress
  const getStatusBadge = () => {
    switch (appealStatus) {
      case 'pending':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            backgroundColor: '#FEF3C7',
            color: '#92400E',
            borderRadius: '9999px',
            fontSize: '12px',
            fontWeight: 500,
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12,6 12,12 16,14" />
            </svg>
            Human Review Pending
          </span>
        );
      case 'reviewed':
      case 'upheld':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            backgroundColor: '#DBEAFE',
            color: '#1E40AF',
            borderRadius: '9999px',
            fontSize: '12px',
            fontWeight: 500,
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22,4 12,14.01 9,11.01" />
            </svg>
            Human Reviewed
          </span>
        );
      case 'overturned':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            backgroundColor: '#D1FAE5',
            color: '#065F46',
            borderRadius: '9999px',
            fontSize: '12px',
            fontWeight: 500,
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22,4 12,14.01 9,11.01" />
            </svg>
            Decision Overturned
          </span>
        );
      default:
        return null;
    }
  };

  // Compact inline badge (for card headers)
  if (variant === 'compact') {
    return (
      <div className={className} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '11px',
          color: COLORS.muted,
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z" />
            <path d="M12 6v6l4 2" />
          </svg>
          AI Assisted
        </span>
        {appealStatus !== 'none' && getStatusBadge()}
      </div>
    );
  }

  // Inline badge (default)
  if (variant === 'inline') {
    return (
      <>
        <div className={className} style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          backgroundColor: '#F1F5F9',
          borderRadius: '8px',
          border: `1px solid ${COLORS.border}`,
        }}>
          {/* AI Icon */}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={COLORS.brand} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>

          <span style={{ fontSize: '13px', color: COLORS.primary, fontWeight: 500 }}>
            AI Assisted
          </span>

          <span style={{ color: COLORS.muted, fontSize: '13px' }}>|</span>

          {appealStatus !== 'none' ? (
            getStatusBadge()
          ) : (
            <>
              {/* Human Icon */}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={COLORS.success} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>

              <span style={{ fontSize: '13px', color: COLORS.secondary }}>
                Human Review Available
              </span>

              {showAppealButton && candidateId && (
                <button
                  onClick={(e) => { e.stopPropagation(); setShowModal(true); }}
                  style={{
                    marginLeft: '8px',
                    padding: '4px 10px',
                    backgroundColor: 'transparent',
                    border: `1px solid ${COLORS.brand}`,
                    borderRadius: '6px',
                    color: COLORS.brand,
                    fontSize: '12px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = COLORS.brand;
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = COLORS.brand;
                  }}
                >
                  Request Review
                </button>
              )}
            </>
          )}
        </div>

        {/* Appeal Request Modal */}
        {showModal && (
          <div
            onClick={(e) => { e.stopPropagation(); setShowModal(false); }}
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
              zIndex: 10000,
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: 'white',
                borderRadius: '16px',
                padding: '32px',
                maxWidth: '480px',
                width: '90%',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              }}
            >
              {submitted ? (
                // Success state
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    backgroundColor: '#D1FAE5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                  }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={COLORS.success} strokeWidth="2">
                      <polyline points="20,6 9,17 4,12" />
                    </svg>
                  </div>
                  <h3 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 600, color: COLORS.primary }}>
                    Review Requested
                  </h3>
                  <p style={{ margin: 0, color: COLORS.secondary, fontSize: '15px' }}>
                    We have notified the hiring team. They will review your application personally.
                  </p>
                </div>
              ) : (
                // Form state
                <>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '24px' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      backgroundColor: '#EEF2FF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={COLORS.brand} strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </div>
                    <div>
                      <h3 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 600, color: COLORS.primary }}>
                        Request Human Review
                      </h3>
                      <p style={{ margin: 0, color: COLORS.secondary, fontSize: '14px' }}>
                        A member of the hiring team will personally review your application.
                      </p>
                    </div>
                  </div>

                  {roleTitle && (
                    <div style={{
                      padding: '12px 16px',
                      backgroundColor: '#F8FAFC',
                      borderRadius: '8px',
                      marginBottom: '20px',
                    }}>
                      <p style={{ margin: 0, fontSize: '13px', color: COLORS.muted }}>Role</p>
                      <p style={{ margin: '4px 0 0', fontSize: '15px', color: COLORS.primary, fontWeight: 500 }}>
                        {roleTitle}
                      </p>
                    </div>
                  )}

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontSize: '14px',
                      fontWeight: 500,
                      color: COLORS.primary,
                    }}>
                      Why should we reconsider? (optional)
                    </label>
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Share any context that may help with the review..."
                      rows={4}
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '8px',
                        border: `1px solid ${COLORS.border}`,
                        fontSize: '14px',
                        resize: 'vertical',
                        fontFamily: 'inherit',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  {submitError && (
                    <div style={{
                      padding: '12px 16px',
                      backgroundColor: '#FEF2F2',
                      borderRadius: '8px',
                      marginBottom: '20px',
                      color: '#DC2626',
                      fontSize: '14px',
                    }}>
                      {submitError}
                    </div>
                  )}

                  <div style={{
                    padding: '12px 16px',
                    backgroundColor: '#F0FDF4',
                    borderRadius: '8px',
                    marginBottom: '24px',
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'flex-start',
                  }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={COLORS.success} strokeWidth="2" style={{ flexShrink: 0, marginTop: '2px' }}>
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                    <p style={{ margin: 0, fontSize: '13px', color: '#166534', lineHeight: 1.5 }}>
                      Under POPIA, you have the right to request human review of automated decisions.
                      Your request will be logged and reviewed within 2 business days.
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => setShowModal(false)}
                      style={{
                        padding: '10px 20px',
                        borderRadius: '8px',
                        border: `1px solid ${COLORS.border}`,
                        backgroundColor: 'white',
                        color: COLORS.secondary,
                        fontSize: '14px',
                        fontWeight: 500,
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleRequestAppeal}
                      disabled={submitting}
                      style={{
                        padding: '10px 24px',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: COLORS.brand,
                        color: 'white',
                        fontSize: '14px',
                        fontWeight: 500,
                        cursor: submitting ? 'not-allowed' : 'pointer',
                        opacity: submitting ? 0.7 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      {submitting ? (
                        <>
                          <span style={{
                            width: '16px',
                            height: '16px',
                            border: '2px solid white',
                            borderTopColor: 'transparent',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                          }} />
                          Submitting...
                        </>
                      ) : (
                        'Request Review'
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </>
    );
  }

  // Card variant (for detailed views)
  return (
    <div className={className} style={{
      padding: '20px',
      backgroundColor: '#FAFAFA',
      borderRadius: '12px',
      border: `1px solid ${COLORS.border}`,
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '16px',
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          backgroundColor: '#EEF2FF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={COLORS.brand} strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
        <div>
          <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: COLORS.primary }}>
            AI-Assisted Screening
          </h4>
          <p style={{ margin: '2px 0 0', fontSize: '13px', color: COLORS.secondary }}>
            This decision was made with AI assistance
          </p>
        </div>
      </div>

      {appealStatus !== 'none' ? (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 16px',
          backgroundColor: 'white',
          borderRadius: '8px',
          border: `1px solid ${COLORS.border}`,
        }}>
          {getStatusBadge()}
          {appealStatus === 'pending' && (
            <span style={{ fontSize: '13px', color: COLORS.secondary }}>
              The hiring team has been notified
            </span>
          )}
        </div>
      ) : (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          backgroundColor: 'white',
          borderRadius: '8px',
          border: `1px solid ${COLORS.border}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={COLORS.success} strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span style={{ fontSize: '14px', color: COLORS.primary }}>
              Human review available on request
            </span>
          </div>

          {showAppealButton && candidateId && (
            <button
              onClick={(e) => { e.stopPropagation(); setShowModal(true); }}
              style={{
                padding: '8px 16px',
                backgroundColor: COLORS.brand,
                border: 'none',
                borderRadius: '6px',
                color: 'white',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'background-color 0.15s ease',
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#4338CA'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = COLORS.brand}
            >
              Request Review
            </button>
          )}
        </div>
      )}

      <p style={{
        margin: '12px 0 0',
        fontSize: '12px',
        color: COLORS.muted,
        lineHeight: 1.5,
      }}>
        Under POPIA (Protection of Personal Information Act), you have the right to request
        human review of any automated decision affecting you.
      </p>

      {/* Reuse modal from inline variant */}
      {showModal && (
        <div
          onClick={(e) => { e.stopPropagation(); setShowModal(false); }}
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
            zIndex: 10000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '480px',
              width: '90%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
          >
            {submitted ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: '#D1FAE5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={COLORS.success} strokeWidth="2">
                    <polyline points="20,6 9,17 4,12" />
                  </svg>
                </div>
                <h3 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 600, color: COLORS.primary }}>
                  Review Requested
                </h3>
                <p style={{ margin: 0, color: COLORS.secondary, fontSize: '15px' }}>
                  We have notified the hiring team. They will review your application personally.
                </p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '24px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    backgroundColor: '#EEF2FF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={COLORS.brand} strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <div>
                    <h3 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 600, color: COLORS.primary }}>
                      Request Human Review
                    </h3>
                    <p style={{ margin: 0, color: COLORS.secondary, fontSize: '14px' }}>
                      A member of the hiring team will personally review your application.
                    </p>
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: COLORS.primary,
                  }}>
                    Why should we reconsider? (optional)
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Share any context that may help with the review..."
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: `1px solid ${COLORS.border}`,
                      fontSize: '14px',
                      resize: 'vertical',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {submitError && (
                  <div style={{
                    padding: '12px 16px',
                    backgroundColor: '#FEF2F2',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    color: '#DC2626',
                    fontSize: '14px',
                  }}>
                    {submitError}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => setShowModal(false)}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '8px',
                      border: `1px solid ${COLORS.border}`,
                      backgroundColor: 'white',
                      color: COLORS.secondary,
                      fontSize: '14px',
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRequestAppeal}
                    disabled={submitting}
                    style={{
                      padding: '10px 24px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: COLORS.brand,
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: 500,
                      cursor: submitting ? 'not-allowed' : 'pointer',
                      opacity: submitting ? 0.7 : 1,
                    }}
                  >
                    {submitting ? 'Submitting...' : 'Request Review'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Minimal trust badge for use in candidate cards
 * Just shows the AI + Human icons without interactivity
 */
export function TrustBadge({ className = '' }: { className?: string }) {
  return (
    <div className={className} style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '4px 8px',
      backgroundColor: '#F1F5F9',
      borderRadius: '6px',
      fontSize: '11px',
      color: COLORS.secondary,
    }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={COLORS.brand} strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      </svg>
      <span>AI + Human</span>
    </div>
  );
}
