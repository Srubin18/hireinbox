'use client';

import { useState, useEffect } from 'react';

// ============================================
// First-Time User Onboarding Guide Component
// A multi-step guide modal for new users
// ============================================

interface OnboardingGuideProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateRole: () => void;
}

export default function OnboardingGuide({ isOpen, onClose, onCreateRole }: OnboardingGuideProps) {
  const [guideStep, setGuideStep] = useState(0);

  // Reset step when opening
  useEffect(() => {
    if (isOpen) {
      setGuideStep(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: 20,
        width: '100%',
        maxWidth: 520,
        margin: '0 20px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden'
      }}>
        {/* Guide Header */}
        <div style={{
          background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
          padding: '32px 32px 24px',
          color: 'white'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16
          }}>
            <div style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              padding: '4px 10px',
              backgroundColor: 'rgba(255,255,255,0.2)',
              borderRadius: 100
            }}>
              Quick Start Guide
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                borderRadius: 8,
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'white',
                fontSize: '1.25rem'
              }}
            >
              x
            </button>
          </div>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            marginBottom: 8,
            letterSpacing: '-0.02em'
          }}>
            {guideStep === 0 ? "Welcome to your dashboard!" :
             guideStep === 1 ? "Create your first role" :
             guideStep === 2 ? "Check emails for CVs" :
             "You're all set!"}
          </h2>
          <p style={{
            fontSize: '0.9375rem',
            opacity: 0.9,
            lineHeight: 1.5
          }}>
            {guideStep === 0 ? "Let's get you set up to screen CVs in seconds." :
             guideStep === 1 ? "Define the position you're hiring for so AI knows what to look for." :
             guideStep === 2 ? "Connect your email inbox or manually fetch new applications." :
             "Start screening CVs and find your next great hire."}
          </p>
        </div>

        {/* Guide Content */}
        <div style={{ padding: '24px 32px 32px' }}>
          {guideStep === 0 && (
            <div>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 16
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 16,
                  padding: 16,
                  backgroundColor: '#f8fafc',
                  borderRadius: 12
                }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    backgroundColor: '#EEF2FF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.25rem',
                    flexShrink: 0,
                    fontWeight: 700,
                    color: '#4F46E5'
                  }}>1</div>
                  <div>
                    <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>Create a role</div>
                    <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Tell us what skills and experience you need</div>
                  </div>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 16,
                  padding: 16,
                  backgroundColor: '#f8fafc',
                  borderRadius: 12
                }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    backgroundColor: '#EEF2FF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.25rem',
                    flexShrink: 0,
                    fontWeight: 700,
                    color: '#4F46E5'
                  }}>2</div>
                  <div>
                    <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>Fetch CVs from email</div>
                    <div style={{ fontSize: '0.875rem', color: '#64748b' }}>We scan your inbox for applications</div>
                  </div>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 16,
                  padding: 16,
                  backgroundColor: '#f8fafc',
                  borderRadius: 12
                }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    backgroundColor: '#EEF2FF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.25rem',
                    flexShrink: 0,
                    fontWeight: 700,
                    color: '#4F46E5'
                  }}>3</div>
                  <div>
                    <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>Review ranked candidates</div>
                    <div style={{ fontSize: '0.875rem', color: '#64748b' }}>See scores, evidence, and AI reasoning</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {guideStep === 1 && (
            <div>
              <div style={{
                backgroundColor: '#f8fafc',
                borderRadius: 12,
                padding: 20,
                marginBottom: 16
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  marginBottom: 12
                }}>
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    backgroundColor: '#4F46E5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '1.25rem'
                  }}>+</div>
                  <div>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>Add New Role</div>
                    <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>In the sidebar under Active Roles</div>
                  </div>
                </div>
                <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: 1.6 }}>
                  Click Add New Role to define the position. Include the job title, required experience, skills, and location. The more specific you are, the better the AI screening.
                </p>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: '0.8125rem',
                color: '#4F46E5',
                fontWeight: 500
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
                Your first 10 CV screenings are free!
              </div>
            </div>
          )}

          {guideStep === 2 && (
            <div>
              <div style={{
                backgroundColor: '#f8fafc',
                borderRadius: 12,
                padding: 20,
                marginBottom: 16
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  marginBottom: 12
                }}>
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    backgroundColor: '#10B981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '1.1rem'
                  }}>@</div>
                  <div>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>Inbox</div>
                    <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>Click to fetch new CVs</div>
                  </div>
                </div>
                <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: 1.6 }}>
                  Click Inbox in the Pipeline section to scan your connected email for new job applications. CVs are automatically extracted and scored against your role criteria.
                </p>
              </div>
              <div style={{
                padding: 12,
                backgroundColor: '#ECFDF5',
                borderRadius: 8,
                fontSize: '0.8125rem',
                color: '#065F46'
              }}>
                <strong>Pro tip:</strong> Set up email forwarding to automatically receive all applications.
              </div>
            </div>
          )}

          {guideStep === 3 && (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 80,
                height: 80,
                borderRadius: 20,
                backgroundColor: '#ECFDF5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                fontSize: '2.5rem'
              }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="#10B981">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                </svg>
              </div>
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: 600,
                color: '#0f172a',
                marginBottom: 8
              }}>Ready to hire smarter!</h3>
              <p style={{
                fontSize: '0.875rem',
                color: '#64748b',
                marginBottom: 20,
                lineHeight: 1.6
              }}>
                You are all set. Create your first role or fetch emails to start screening CVs with evidence-based AI.
              </p>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                fontSize: '0.8125rem',
                color: '#64748b'
              }}>
                <span>Press</span>
                <span style={{
                  padding: '2px 8px',
                  backgroundColor: '#f1f5f9',
                  borderRadius: 4,
                  fontFamily: 'monospace',
                  fontWeight: 600
                }}>?</span>
                <span>for keyboard shortcuts</span>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 24,
            paddingTop: 20,
            borderTop: '1px solid #f1f5f9'
          }}>
            {/* Step indicators */}
            <div style={{ display: 'flex', gap: 6 }}>
              {[0, 1, 2, 3].map(step => (
                <div
                  key={step}
                  style={{
                    width: step === guideStep ? 24 : 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: step <= guideStep ? '#4F46E5' : '#E2E8F0',
                    transition: 'all 0.3s ease'
                  }}
                />
              ))}
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: 10 }}>
              {guideStep > 0 && (
                <button
                  onClick={() => setGuideStep(guideStep - 1)}
                  style={{
                    padding: '10px 16px',
                    backgroundColor: 'transparent',
                    border: '1px solid #e2e8f0',
                    borderRadius: 8,
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: '#475569',
                    cursor: 'pointer'
                  }}
                >
                  Back
                </button>
              )}
              {guideStep < 3 ? (
                <button
                  onClick={() => setGuideStep(guideStep + 1)}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#4F46E5',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: 'white',
                    cursor: 'pointer'
                  }}
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={() => { onClose(); onCreateRole(); }}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#4F46E5',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}
                >
                  Create first role
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook to manage onboarding guide state
export function useOnboardingGuide(rolesCount: number, candidatesCount: number, isLoading: boolean) {
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || isLoading) return;

    const urlParams = new URLSearchParams(window.location.search);
    const justOnboarded = urlParams.get('onboarding') === 'complete';
    const hasSeenGuide = localStorage.getItem('hireinbox_guide_seen');

    if (justOnboarded && !hasSeenGuide) {
      // Just completed onboarding - show guide
      setShowGuide(true);
      localStorage.setItem('hireinbox_guide_seen', 'true');
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    } else if (!hasSeenGuide && rolesCount === 0 && candidatesCount === 0) {
      // First-time user with no data - show guide after a short delay
      const timer = setTimeout(() => {
        setShowGuide(true);
        localStorage.setItem('hireinbox_guide_seen', 'true');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [rolesCount, candidatesCount, isLoading]);

  return {
    showGuide,
    setShowGuide,
    closeGuide: () => setShowGuide(false)
  };
}
