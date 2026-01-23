'use client';

import { useRouter } from 'next/navigation';

// ============================================
// HIREINBOX B2B - RECRUITER / AGENCY ENTRY
// /hire/recruiter
//
// Two types of recruiters:
// 1. Volume (mass market) - Post job, receive CVs → same as employer
// 2. Boutique (executive search) - Natural language talent mapping
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
      <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>Less noise. More hires.</div>
    </div>
  </div>
);

export default function RecruiterEntryPage() {
  const router = useRouter();

  const options = [
    {
      id: 'volume',
      emoji: '📥',
      label: 'Volume recruitment',
      subtitle: 'Post a role & receive CVs',
      description: 'Screen candidates from job postings. AI ranks and shortlists for you. Perfect for high-volume hiring.',
      route: '/hire/dashboard', // Same dashboard as employers
      badge: null
    },
    {
      id: 'boutique',
      emoji: '🎯',
      label: 'Executive / Boutique search',
      subtitle: 'Map the market for a role',
      description: 'Describe who you need in plain English. AI searches public sources and returns a curated candidate list.',
      route: '/hire/recruiter/mapping',
      badge: 'Talent Mapping'
    }
  ];

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#ffffff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px'
    }}>
      {/* Logo */}
      <div style={{ marginBottom: '48px' }}>
        <svg width="64" height="64" viewBox="0 0 48 48" fill="none">
          <rect width="48" height="48" rx="12" fill="#4F46E5"/>
          <path d="M12 18L24 26L36 18V32C36 33.1 35.1 34 34 34H14C12.9 34 12 33.1 12 32V18Z" fill="white" fillOpacity="0.9"/>
          <path d="M34 14H14C12.9 14 12 14.9 12 16V18L24 26L36 18V16C36 14.9 35.1 14 34 14Z" fill="white"/>
          <circle cx="36" cy="12" r="9" fill="#10B981"/>
          <path d="M32.5 12L35 14.5L39.5 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      <h1 style={{
        fontSize: '32px',
        fontWeight: 700,
        color: '#0f172a',
        marginBottom: '12px',
        textAlign: 'center'
      }}>
        Recruiter / Agency
      </h1>

      <p style={{
        fontSize: '18px',
        color: '#64748b',
        marginBottom: '48px',
        textAlign: 'center',
        maxWidth: '450px',
        lineHeight: 1.6
      }}>
        How do you typically source candidates?
      </p>

      {/* Search type selection */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        width: '100%',
        maxWidth: '550px'
      }}>
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => router.push(option.route)}
            style={{
              padding: '28px',
              backgroundColor: '#ffffff',
              color: '#0f172a',
              border: '2px solid #e2e8f0',
              borderRadius: '16px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '20px',
              position: 'relative'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#f8fafc';
              e.currentTarget.style.borderColor = '#4F46E5';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(79, 70, 229, 0.15)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#ffffff';
              e.currentTarget.style.borderColor = '#e2e8f0';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {option.badge && (
              <div style={{
                position: 'absolute',
                top: '-10px',
                right: '16px',
                backgroundColor: '#10B981',
                color: '#ffffff',
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: 600
              }}>
                {option.badge}
              </div>
            )}
            <span style={{ fontSize: '36px' }}>{option.emoji}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px' }}>
                {option.label}
              </div>
              <div style={{
                fontSize: '15px',
                fontWeight: 600,
                color: '#4F46E5',
                marginBottom: '8px'
              }}>
                {option.subtitle}
              </div>
              <div style={{
                fontSize: '14px',
                fontWeight: 400,
                color: '#64748b',
                lineHeight: 1.5
              }}>
                {option.description}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Back link */}
      <button
        onClick={() => router.push('/hire')}
        style={{
          marginTop: '48px',
          padding: '12px 24px',
          backgroundColor: 'transparent',
          color: '#64748b',
          border: 'none',
          fontSize: '14px',
          cursor: 'pointer'
        }}
      >
        ← Back
      </button>

      {/* Support button */}
      <button
        aria-label="Get support"
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
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 50
        }}
      >
        <span aria-hidden="true">💬</span> Support
      </button>

      {/* Tagline footer */}
      <div style={{
        position: 'fixed',
        bottom: '24px',
        left: '24px',
        color: '#94a3b8',
        fontSize: '13px'
      }}>
        HireInbox — Less noise. More hires.
      </div>
    </div>
  );
}
