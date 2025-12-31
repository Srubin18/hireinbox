'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

/* ===========================================
   HIREINBOX - COOKIE CONSENT BANNER
   POPIA/GDPR Compliant Cookie Notice
   =========================================== */

interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
  preferences: boolean;
}

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showManage, setShowManage] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true, // Always required
    analytics: true,
    preferences: true
  });

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem('hireinbox_cookie_consent');
    if (!consent) {
      // Small delay to prevent flash
      const timer = setTimeout(() => setShowBanner(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    const allAccepted = {
      essential: true,
      analytics: true,
      preferences: true,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('hireinbox_cookie_consent', JSON.stringify(allAccepted));
    setShowBanner(false);
    setShowManage(false);
  };

  const handleSavePreferences = () => {
    const savedPreferences = {
      ...preferences,
      essential: true, // Always required
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('hireinbox_cookie_consent', JSON.stringify(savedPreferences));
    setShowBanner(false);
    setShowManage(false);
  };

  const handleRejectOptional = () => {
    const minimalConsent = {
      essential: true,
      analytics: false,
      preferences: false,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('hireinbox_cookie_consent', JSON.stringify(minimalConsent));
    setShowBanner(false);
    setShowManage(false);
  };

  if (!showBanner) return null;

  return (
    <>
      {/* Cookie Banner */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        borderTop: '1px solid #e2e8f0',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.1)',
        zIndex: 9999,
        padding: '16px 24px',
        animation: 'slideUp 0.3s ease-out'
      }}>
        <style>{`
          @keyframes slideUp {
            from { transform: translateY(100%); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
        `}</style>

        <div style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 24,
          flexWrap: 'wrap'
        }}>
          {/* Message */}
          <div style={{ flex: 1, minWidth: 280 }}>
            <p style={{
              margin: 0,
              fontSize: 14,
              color: '#475569',
              lineHeight: 1.5
            }}>
              We use cookies to improve your experience, analyze traffic, and personalize content.
              By clicking &quot;Accept All&quot;, you consent to our use of cookies.
              Read our{' '}
              <Link href="/privacy" style={{ color: '#4F46E5', textDecoration: 'underline' }}>
                Privacy Policy
              </Link>
              {' '}for more information.
            </p>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowManage(true)}
              style={{
                padding: '10px 20px',
                fontSize: 14,
                fontWeight: 500,
                backgroundColor: 'transparent',
                color: '#64748b',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#f8fafc';
                e.currentTarget.style.borderColor = '#cbd5e1';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = '#e2e8f0';
              }}
            >
              Manage Cookies
            </button>
            <button
              onClick={handleAcceptAll}
              style={{
                padding: '10px 24px',
                fontSize: 14,
                fontWeight: 600,
                backgroundColor: '#4F46E5',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#4338CA'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#4F46E5'}
            >
              Accept All
            </button>
          </div>
        </div>
      </div>

      {/* Manage Cookies Modal */}
      {showManage && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: 16,
            maxWidth: 500,
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0f172a' }}>
                Cookie Preferences
              </h2>
              <button
                onClick={() => setShowManage(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 24,
                  color: '#94a3b8',
                  cursor: 'pointer',
                  lineHeight: 1
                }}
              >
                x
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: 24 }}>
              <p style={{ margin: 0, marginBottom: 24, color: '#64748b', fontSize: 14, lineHeight: 1.6 }}>
                We use different types of cookies to optimize your experience on our platform.
                You can choose which categories of cookies you want to allow.
              </p>

              {/* Cookie Categories */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Essential Cookies */}
                <div style={{
                  padding: 16,
                  backgroundColor: '#f8fafc',
                  borderRadius: 8,
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontWeight: 600, color: '#0f172a', fontSize: 15 }}>Essential Cookies</span>
                    <span style={{
                      padding: '4px 10px',
                      backgroundColor: '#DBEAFE',
                      color: '#1E40AF',
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 500
                    }}>
                      Always Active
                    </span>
                  </div>
                  <p style={{ margin: 0, color: '#64748b', fontSize: 13, lineHeight: 1.5 }}>
                    Required for the platform to function properly. These cannot be disabled.
                  </p>
                </div>

                {/* Analytics Cookies */}
                <div style={{
                  padding: 16,
                  backgroundColor: '#f8fafc',
                  borderRadius: 8,
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontWeight: 600, color: '#0f172a', fontSize: 15 }}>Analytics Cookies</span>
                    <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24 }}>
                      <input
                        type="checkbox"
                        checked={preferences.analytics}
                        onChange={(e) => setPreferences(p => ({ ...p, analytics: e.target.checked }))}
                        style={{ opacity: 0, width: 0, height: 0 }}
                      />
                      <span style={{
                        position: 'absolute',
                        cursor: 'pointer',
                        inset: 0,
                        backgroundColor: preferences.analytics ? '#4F46E5' : '#cbd5e1',
                        transition: '0.2s',
                        borderRadius: 12
                      }}>
                        <span style={{
                          position: 'absolute',
                          content: '',
                          height: 18,
                          width: 18,
                          left: preferences.analytics ? 23 : 3,
                          bottom: 3,
                          backgroundColor: 'white',
                          transition: '0.2s',
                          borderRadius: '50%'
                        }} />
                      </span>
                    </label>
                  </div>
                  <p style={{ margin: 0, color: '#64748b', fontSize: 13, lineHeight: 1.5 }}>
                    Help us understand how visitors use our platform to improve the experience.
                  </p>
                </div>

                {/* Preference Cookies */}
                <div style={{
                  padding: 16,
                  backgroundColor: '#f8fafc',
                  borderRadius: 8,
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontWeight: 600, color: '#0f172a', fontSize: 15 }}>Preference Cookies</span>
                    <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24 }}>
                      <input
                        type="checkbox"
                        checked={preferences.preferences}
                        onChange={(e) => setPreferences(p => ({ ...p, preferences: e.target.checked }))}
                        style={{ opacity: 0, width: 0, height: 0 }}
                      />
                      <span style={{
                        position: 'absolute',
                        cursor: 'pointer',
                        inset: 0,
                        backgroundColor: preferences.preferences ? '#4F46E5' : '#cbd5e1',
                        transition: '0.2s',
                        borderRadius: 12
                      }}>
                        <span style={{
                          position: 'absolute',
                          content: '',
                          height: 18,
                          width: 18,
                          left: preferences.preferences ? 23 : 3,
                          bottom: 3,
                          backgroundColor: 'white',
                          transition: '0.2s',
                          borderRadius: '50%'
                        }} />
                      </span>
                    </label>
                  </div>
                  <p style={{ margin: 0, color: '#64748b', fontSize: 13, lineHeight: 1.5 }}>
                    Remember your settings and preferences for a personalized experience.
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              gap: 12,
              flexWrap: 'wrap'
            }}>
              <button
                onClick={handleRejectOptional}
                style={{
                  padding: '10px 20px',
                  fontSize: 14,
                  fontWeight: 500,
                  backgroundColor: 'transparent',
                  color: '#64748b',
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  cursor: 'pointer'
                }}
              >
                Reject Optional
              </button>
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={handleSavePreferences}
                  style={{
                    padding: '10px 20px',
                    fontSize: 14,
                    fontWeight: 500,
                    backgroundColor: '#f1f5f9',
                    color: '#0f172a',
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer'
                  }}
                >
                  Save Preferences
                </button>
                <button
                  onClick={handleAcceptAll}
                  style={{
                    padding: '10px 24px',
                    fontSize: 14,
                    fontWeight: 600,
                    backgroundColor: '#4F46E5',
                    color: 'white',
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer'
                  }}
                >
                  Accept All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
