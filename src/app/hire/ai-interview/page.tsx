'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// ============================================
// HIREINBOX - AI INTERVIEW LANDING PAGE
// Shows AI Avatar interviewer and explains
// how AI-powered candidate interviews work
// R799 per role add-on
// ============================================

export default function AIInterviewPage() {
  const router = useRouter();
  const [showDemo, setShowDemo] = useState(false);

  const features = [
    {
      title: 'Consistent & Fair',
      description: 'Every candidate gets the same professional experience. No interviewer bias, no bad days.',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
      )
    },
    {
      title: 'Psychometric Insights',
      description: 'AI analyzes communication patterns, confidence levels, problem-solving approach, and personality indicators.',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 2a10 10 0 0 1 0 20"/>
          <path d="M12 12L12 6"/>
          <path d="M12 12L16 14"/>
        </svg>
      )
    },
    {
      title: 'Available 24/7',
      description: 'Candidates interview on their schedule. No calendar coordination needed.',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
      )
    },
    {
      title: 'Deep Analysis',
      description: 'AI evaluates communication skills, technical knowledge, and cultural fit with detailed evidence.',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
          <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
          <line x1="12" y1="22.08" x2="12" y2="12"/>
        </svg>
      )
    },
    {
      title: 'Full Transcript',
      description: 'Every interview is transcribed. Review exactly what was said, with AI-highlighted insights.',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
        </svg>
      )
    }
  ];

  const howItWorks = [
    { step: 1, title: 'You Send the Invite', description: 'Select candidates from your shortlist and send AI interview invitations with one click.' },
    { step: 2, title: 'Candidate Joins', description: 'Candidate clicks their unique link and meets our AI interviewer via video call.' },
    { step: 3, title: 'AI Conducts Interview', description: 'Our AI avatar asks role-specific questions, follows up intelligently, and evaluates responses in real-time.' },
    { step: 4, title: 'You Get Results', description: 'Receive a detailed report with scores, transcript, key insights, and hiring recommendation.' }
  ];

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header */}
      <header style={{
        padding: '16px 24px',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <svg width="36" height="36" viewBox="0 0 48 48" fill="none">
            <rect width="48" height="48" rx="12" fill="#4F46E5"/>
            <path d="M12 18L24 26L36 18V32C36 33.1 35.1 34 34 34H14C12.9 34 12 33.1 12 32V18Z" fill="white" fillOpacity="0.9"/>
            <path d="M34 14H14C12.9 14 12 14.9 12 16V18L24 26L36 18V16C36 14.9 35.1 14 34 14Z" fill="white"/>
            <circle cx="36" cy="12" r="9" fill="#10B981"/>
            <path d="M32.5 12L35 14.5L39.5 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 700 }}>
              <span style={{ color: '#0f172a' }}>Hire</span>
              <span style={{ color: '#4F46E5' }}>Inbox</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => router.push('/hire/dashboard')}
          style={{
            padding: '8px 16px',
            backgroundColor: 'transparent',
            color: '#64748b',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            fontSize: '13px',
            cursor: 'pointer'
          }}
        >
          Back to Dashboard
        </button>
      </header>

      {/* Hero Section with AI Avatar */}
      <section style={{
        padding: '60px 24px',
        backgroundColor: '#ffffff',
        textAlign: 'center',
        borderBottom: '1px solid #e2e8f0'
      }}>
        {/* AI Avatar */}
        <div style={{
          width: '160px',
          height: '160px',
          margin: '0 auto 32px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #4F46E5 0%, #7c3aed 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 20px 40px rgba(79, 70, 229, 0.3)',
          position: 'relative'
        }}>
          {/* Avatar face */}
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5">
            <circle cx="12" cy="8" r="5"/>
            <path d="M20 21a8 8 0 1 0-16 0"/>
          </svg>
          {/* Pulse animation ring */}
          <div style={{
            position: 'absolute',
            inset: '-8px',
            borderRadius: '50%',
            border: '3px solid rgba(79, 70, 229, 0.3)',
            animation: 'pulse 2s infinite'
          }} />
          {/* AI badge */}
          <div style={{
            position: 'absolute',
            bottom: '0',
            right: '0',
            backgroundColor: '#10B981',
            color: '#ffffff',
            padding: '6px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 700,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
          }}>
            AI Powered
          </div>
        </div>

        <h1 style={{
          fontSize: '36px',
          fontWeight: 700,
          color: '#0f172a',
          marginBottom: '16px',
          letterSpacing: '-0.02em'
        }}>
          Meet Your AI Interviewer
        </h1>

        <p style={{
          fontSize: '18px',
          color: '#64748b',
          maxWidth: '600px',
          margin: '0 auto 32px',
          lineHeight: 1.6
        }}>
          Our AI conducts professional video interviews with your candidates,
          evaluates their responses, and delivers detailed insights — so you
          can focus on the final decision.
        </p>

        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowDemo(true)}
            style={{
              padding: '14px 28px',
              backgroundColor: '#4F46E5',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
            Watch Demo
          </button>
          <button
            onClick={() => router.push('/hire/dashboard')}
            style={{
              padding: '14px 28px',
              backgroundColor: '#ffffff',
              color: '#4F46E5',
              border: '2px solid #4F46E5',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Send Interview Invites
          </button>
        </div>

        {/* Pricing badge */}
        <div style={{
          marginTop: '32px',
          display: 'inline-block',
          padding: '12px 24px',
          backgroundColor: '#f0fdf4',
          border: '1px solid #86efac',
          borderRadius: '8px'
        }}>
          <span style={{ fontSize: '14px', color: '#166534' }}>
            <strong>R799 per role</strong> — Unlimited candidates per role
          </span>
        </div>
      </section>

      {/* Features Grid */}
      <section style={{ padding: '60px 24px', maxWidth: '1000px', margin: '0 auto' }}>
        <h2 style={{
          fontSize: '28px',
          fontWeight: 700,
          color: '#0f172a',
          textAlign: 'center',
          marginBottom: '48px'
        }}>
          Why AI Interviews?
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '24px'
        }}>
          {features.map((feature, i) => (
            <div key={i} style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '24px'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                backgroundColor: '#ede9fe',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px'
              }}>
                {feature.icon}
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>
                {feature.title}
              </h3>
              <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.5, margin: 0 }}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section style={{
        padding: '60px 24px',
        backgroundColor: '#ffffff',
        borderTop: '1px solid #e2e8f0'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: '28px',
            fontWeight: 700,
            color: '#0f172a',
            textAlign: 'center',
            marginBottom: '48px'
          }}>
            How It Works
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {howItWorks.map((item) => (
              <div key={item.step} style={{
                display: 'flex',
                gap: '20px',
                alignItems: 'flex-start'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  backgroundColor: '#4F46E5',
                  color: '#ffffff',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  fontWeight: 700,
                  flexShrink: 0
                }}>
                  {item.step}
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', marginBottom: '6px' }}>
                    {item.title}
                  </h3>
                  <p style={{ fontSize: '15px', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sample Report Preview */}
      <section style={{ padding: '60px 24px', maxWidth: '900px', margin: '0 auto' }}>
        <h2 style={{
          fontSize: '28px',
          fontWeight: 700,
          color: '#0f172a',
          textAlign: 'center',
          marginBottom: '16px'
        }}>
          What You Receive
        </h2>
        <p style={{
          fontSize: '16px',
          color: '#64748b',
          textAlign: 'center',
          marginBottom: '32px'
        }}>
          After each interview, you get a comprehensive report
        </p>

        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          overflow: 'hidden'
        }}>
          {/* Report header */}
          <div style={{
            padding: '20px 24px',
            borderBottom: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>Interview Report</div>
                <div style={{ fontSize: '13px', color: '#64748b' }}>Finance Manager — Thabo Molefe</div>
              </div>
              <div style={{
                padding: '8px 16px',
                backgroundColor: '#d1fae5',
                color: '#059669',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: 600
              }}>
                Score: 82/100
              </div>
            </div>
          </div>

          {/* Report content preview */}
          <div style={{ padding: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Key Strengths
                </div>
                <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '14px', color: '#374151' }}>
                  <li>Strong financial modelling experience</li>
                  <li>Clear communication style</li>
                  <li>Leadership examples with evidence</li>
                </ul>
              </div>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Areas to Probe
                </div>
                <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '14px', color: '#374151' }}>
                  <li>Limited IFRS 17 exposure</li>
                  <li>Verify team size claims</li>
                </ul>
              </div>
            </div>

            {/* Psychometric Indicators */}
            <div style={{
              marginTop: '20px',
              padding: '16px',
              backgroundColor: '#faf5ff',
              borderRadius: '8px',
              border: '1px solid #e9d5ff'
            }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#7c3aed', marginBottom: '12px' }}>
                Psychometric Indicators
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>Confidence</div>
                  <div style={{ height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: '85%', height: '100%', backgroundColor: '#7c3aed' }} />
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#374151', marginTop: '2px' }}>High</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>Adaptability</div>
                  <div style={{ height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: '70%', height: '100%', backgroundColor: '#7c3aed' }} />
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#374151', marginTop: '2px' }}>Moderate</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>Problem Solving</div>
                  <div style={{ height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: '90%', height: '100%', backgroundColor: '#7c3aed' }} />
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#374151', marginTop: '2px' }}>Strong</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>Team Orientation</div>
                  <div style={{ height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: '75%', height: '100%', backgroundColor: '#7c3aed' }} />
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#374151', marginTop: '2px' }}>Good</div>
                </div>
              </div>
            </div>

            <div style={{
              marginTop: '16px',
              padding: '16px',
              backgroundColor: '#eff6ff',
              borderRadius: '8px'
            }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#1e40af', marginBottom: '6px' }}>
                AI Recommendation
              </div>
              <div style={{ fontSize: '14px', color: '#1e3a8a' }}>
                Recommend for final interview. Strong candidate with relevant experience.
                Suggest probing IFRS 17 knowledge in person.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{
        padding: '60px 24px',
        backgroundColor: '#4F46E5',
        textAlign: 'center'
      }}>
        <h2 style={{
          fontSize: '28px',
          fontWeight: 700,
          color: '#ffffff',
          marginBottom: '16px'
        }}>
          Ready to Try AI Interviews?
        </h2>
        <p style={{
          fontSize: '16px',
          color: 'rgba(255,255,255,0.8)',
          marginBottom: '32px'
        }}>
          Add AI Interviews to any role for R799
        </p>
        <button
          onClick={() => router.push('/hire/dashboard')}
          style={{
            padding: '16px 32px',
            backgroundColor: '#ffffff',
            color: '#4F46E5',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Go to Dashboard
        </button>
      </section>

      {/* Demo Modal */}
      {showDemo && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            zIndex: 100
          }}
          onClick={() => setShowDemo(false)}
        >
          <div
            style={{
              backgroundColor: '#000',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '800px',
              aspectRatio: '16/9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ textAlign: 'center', color: '#ffffff' }}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.5, marginBottom: '16px' }}>
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
              <p style={{ opacity: 0.7 }}>Demo video coming soon</p>
            </div>
            <button
              onClick={() => setShowDemo(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                fontSize: '20px',
                cursor: 'pointer'
              }}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.1); opacity: 0.2; }
        }
      `}</style>

      {/* Support button */}
      <button
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          padding: '12px 20px',
          backgroundColor: '#0f172a',
          color: '#ffffff',
          border: 'none',
          borderRadius: '24px',
          fontSize: '14px',
          fontWeight: 500,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        Support
      </button>
    </div>
  );
}
