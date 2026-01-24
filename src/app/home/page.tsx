'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

// ============================================
// HIREINBOX LANDING PAGE
// Clean. Simple. Converts.
// ============================================

const Logo = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
    <svg width="40" height="40" viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="12" fill="#4F46E5"/>
      <path d="M12 18L24 26L36 18V32C36 33.1 35.1 34 34 34H14C12.9 34 12 33.1 12 32V18Z" fill="white" fillOpacity="0.9"/>
      <path d="M34 14H14C12.9 14 12 14.9 12 16V18L24 26L36 18V16C36 14.9 35.1 14 34 14Z" fill="white"/>
      <circle cx="36" cy="12" r="9" fill="#10B981"/>
      <path d="M32.5 12L35 14.5L39.5 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
    <div>
      <div style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.02em' }}>
        <span style={{ color: '#0f172a' }}>Hire</span><span style={{ color: '#4F46E5' }}>Inbox</span>
      </div>
      <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>Less noise. Better hires.</div>
    </div>
  </div>
);

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuth();

  // Redirect authenticated users to dashboard
  if (user) {
    router.replace('/');
    return null;
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#ffffff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* Header */}
      <header style={{ padding: '20px 32px', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <Logo />
        </div>
      </header>

      {/* Hero */}
      <section style={{ maxWidth: '1000px', margin: '0 auto', padding: '80px 32px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '56px', fontWeight: 700, margin: '0 0 24px', lineHeight: 1.2, color: '#0f172a' }}>
          Screen CVs in seconds.<br/>Hire the right people.
        </h1>
        <p style={{ fontSize: '18px', color: '#475569', margin: '0 0 48px', lineHeight: 1.6 }}>
          HireInbox uses explainable AI to screen candidates with evidence. No more guessing. No more bias. Just better hires.
        </p>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => router.push('/signup?type=employer')}
            style={{
              backgroundColor: '#4F46E5',
              color: '#ffffff',
              padding: '14px 32px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#4338ca')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#4F46E5')}
          >
            Start for free (B2B)
          </button>
          <button
            onClick={() => router.push('/upload')}
            style={{
              backgroundColor: '#f3f4f6',
              color: '#1f2937',
              padding: '14px 32px',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#e5e7eb')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
          >
            Upload your CV (Job Seeker)
          </button>
        </div>
      </section>

      {/* Features */}
      <section style={{ backgroundColor: '#f9fafb', padding: '80px 32px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '36px', fontWeight: 700, textAlign: 'center', marginBottom: '64px', color: '#0f172a' }}>
            Why HireInbox?
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
            {[
              {
                title: 'Evidence-Based',
                description: 'Every decision backed by quotes from CVs. Know exactly why we recommend each candidate.'
              },
              {
                title: 'South African',
                description: 'Understands CA(SA), local universities, POPIA compliance. Built for SA businesses.'
              },
              {
                title: '50 CVs → 6 Shortlisted',
                description: 'In seconds. Save hours every week on CV screening. Your inbox, your workflow.'
              },
              {
                title: 'No Bias',
                description: 'AI trained on 10,000 CVs. Consistent scoring. Fair to all candidates.'
              },
              {
                title: 'POPIA Compliant',
                description: 'Full audit trail. Know exactly how each decision was made. Defend it in court if needed.'
              },
              {
                title: 'Simple',
                description: 'No bloat. Works in your email. No new system to learn. Just better hiring.'
              }
            ].map((feature, i) => (
              <div key={i} style={{ padding: '32px', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '12px', color: '#0f172a' }}>{feature.title}</h3>
                <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.6, margin: 0 }}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section style={{ padding: '80px 32px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '36px', fontWeight: 700, textAlign: 'center', marginBottom: '64px', color: '#0f172a' }}>
            Simple pricing
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            {/* Per-Role Pricing Model (Jan 2026) */}
            {[
              { name: 'AI CV Screening', price: 'R1,750', period: '/role', cvs: 'Unlimited CVs', emoji: '📋', popular: true },
              { name: '+ AI Interview', price: 'R1,250', period: '/role', cvs: 'Avatar interviews', emoji: '🎥' },
              { name: '+ Verification', price: 'R800', period: '/role', cvs: 'ID, criminal, refs', emoji: '✓' }
            ].map((plan, i) => (
              <div
                key={i}
                style={{
                  padding: '32px',
                  backgroundColor: plan.popular ? '#4F46E5' : '#ffffff',
                  color: plan.popular ? '#ffffff' : '#0f172a',
                  borderRadius: '12px',
                  border: plan.popular ? 'none' : '1px solid #e5e7eb',
                  position: 'relative'
                }}
              >
                {plan.popular && (
                  <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#10B981', color: '#ffffff', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>
                    Most Popular
                  </div>
                )}
                <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>{plan.name}</h3>
                <div style={{ fontSize: '32px', fontWeight: 700, marginBottom: '8px' }}>{plan.price}<span style={{ fontSize: '14px', fontWeight: 400, marginLeft: '8px' }}>{plan.period}</span></div>
                <p style={{ fontSize: '14px', opacity: 0.8, marginBottom: '24px' }}>{plan.cvs}</p>
                <button
                  onClick={() => router.push('/signup?type=employer')}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: plan.popular ? '#ffffff' : '#4F46E5',
                    color: plan.popular ? '#4F46E5' : '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Get Started
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #f1f5f9', padding: '40px 32px', backgroundColor: '#f9fafb' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
          <p style={{ margin: '0 0 16px' }}>HireInbox • 2026 • Built for South African SMEs</p>
          <div style={{ display: 'flex', gap: '24px', justifyContent: 'center', fontSize: '13px' }}>
            <a href="/terms" style={{ color: '#4F46E5', textDecoration: 'none' }}>Terms</a>
            <a href="/privacy" style={{ color: '#4F46E5', textDecoration: 'none' }}>Privacy</a>
            <a href="mailto:hello@hireinbox.co.za" style={{ color: '#4F46E5', textDecoration: 'none' }}>Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
