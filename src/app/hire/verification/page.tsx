'use client';

import { useRouter } from 'next/navigation';

// ============================================
// HIREINBOX - VERIFICATION SERVICES
// /hire/verification
//
// ID verification, criminal checks, credit checks,
// and reference verification for candidates
// ============================================

export default function VerificationPage() {
  const router = useRouter();

  const services = [
    {
      id: 'id',
      title: 'ID Verification',
      description: 'Verify South African ID numbers against Home Affairs database. Confirm identity authenticity.',
      turnaround: '24 hours',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="16" rx="2"/>
          <circle cx="9" cy="10" r="2"/>
          <path d="M15 8h2"/>
          <path d="M15 12h2"/>
          <path d="M7 16h10"/>
        </svg>
      )
    },
    {
      id: 'criminal',
      title: 'Criminal Record Check',
      description: 'SAPS criminal record verification. Essential for positions of trust and compliance requirements.',
      turnaround: '3-5 business days',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          <path d="M9 12l2 2 4-4"/>
        </svg>
      )
    },
    {
      id: 'credit',
      title: 'Credit Check',
      description: 'Credit bureau verification for financial positions. ITC status and credit history summary.',
      turnaround: '24-48 hours',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="1" y="4" width="22" height="16" rx="2"/>
          <path d="M1 10h22"/>
          <path d="M6 16h4"/>
        </svg>
      )
    },
    {
      id: 'reference',
      title: 'Reference Verification',
      description: 'Professional reference checks with previous employers. Verify employment history and performance.',
      turnaround: '3-5 business days',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      )
    }
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
          onClick={() => router.back()}
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
          Back
        </button>
      </header>

      {/* Hero */}
      <section style={{
        padding: '48px 24px',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        textAlign: 'center'
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          margin: '0 auto 24px',
          borderRadius: '16px',
          backgroundColor: '#0891b2',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </div>
        <h1 style={{
          fontSize: '32px',
          fontWeight: 700,
          color: '#0f172a',
          marginBottom: '12px'
        }}>
          Candidate Verification
        </h1>
        <p style={{
          fontSize: '18px',
          color: '#64748b',
          maxWidth: '600px',
          margin: '0 auto 24px',
          lineHeight: 1.6
        }}>
          Verify your shortlisted candidates before making an offer.
          ID checks, criminal records, credit history, and reference verification.
        </p>
        <div style={{
          display: 'inline-block',
          padding: '12px 24px',
          backgroundColor: '#f0fdfa',
          border: '1px solid #5eead4',
          borderRadius: '8px'
        }}>
          <span style={{ fontSize: '14px', color: '#0f766e' }}>
            <strong>R800 per role</strong> — Verify unlimited candidates on that role
          </span>
        </div>
      </section>

      {/* Services Grid */}
      <section style={{ padding: '48px 24px', maxWidth: '900px', margin: '0 auto' }}>
        <h2 style={{
          fontSize: '22px',
          fontWeight: 600,
          color: '#0f172a',
          textAlign: 'center',
          marginBottom: '32px'
        }}>
          What's Included
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px'
        }}>
          {services.map((service) => (
            <div key={service.id} style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '24px'
            }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '12px',
                backgroundColor: '#f0fdfa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
                color: '#0891b2'
              }}>
                {service.icon}
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>
                {service.title}
              </h3>
              <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.5, marginBottom: '12px' }}>
                {service.description}
              </p>
              <div style={{
                fontSize: '13px',
                color: '#0891b2',
                fontWeight: 500
              }}>
                Turnaround: {service.turnaround}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section style={{
        padding: '48px 24px',
        backgroundColor: '#ffffff',
        borderTop: '1px solid #e2e8f0'
      }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: '22px',
            fontWeight: 600,
            color: '#0f172a',
            textAlign: 'center',
            marginBottom: '32px'
          }}>
            How It Works
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {[
              { step: 1, title: 'Add Verification to Role', desc: 'Select the Verification add-on when creating or editing a role.' },
              { step: 2, title: 'Select Candidates', desc: 'Choose which shortlisted candidates you want to verify.' },
              { step: 3, title: 'We Handle the Rest', desc: 'We conduct all checks and deliver a comprehensive report.' },
              { step: 4, title: 'Receive Results', desc: 'Get verified candidate profiles with all check results documented.' }
            ].map((item) => (
              <div key={item.step} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: '#0891b2',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  fontWeight: 700,
                  flexShrink: 0
                }}>
                  {item.step}
                </div>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: '14px', color: '#64748b' }}>
                    {item.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{
        padding: '48px 24px',
        backgroundColor: '#0891b2',
        textAlign: 'center'
      }}>
        <h2 style={{
          fontSize: '24px',
          fontWeight: 700,
          color: '#ffffff',
          marginBottom: '12px'
        }}>
          Ready to Verify Candidates?
        </h2>
        <p style={{
          fontSize: '16px',
          color: 'rgba(255,255,255,0.8)',
          marginBottom: '24px'
        }}>
          Add verification to any role for R800
        </p>
        <button
          onClick={() => router.push('/hire/dashboard')}
          style={{
            padding: '14px 32px',
            backgroundColor: '#ffffff',
            color: '#0891b2',
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
