'use client';

import { useRouter } from 'next/navigation';

// ============================================
// HIREINBOX B2B - RECRUITER ENTRY
// /hire/recruiter
//
// Fork: What type of search are you running?
// - Post a role & receive CVs → Same flow as employers
// - Map the market for a role → Talent Mapping (RALPH AGENT 3)
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
      label: 'Post a role & receive CVs',
      description: 'Screen candidates from job postings. AI ranks and shortlists for you.',
      route: '/hire/business' // Same flow as employers for volume recruitment
    },
    {
      id: 'mapping',
      emoji: '🎯',
      label: 'Map the market for a role',
      description: 'AI-powered talent mapping using public sources. Find who\'s out there.',
      route: '/hire/recruiter/mapping' // Talent Mapping flow (RALPH AGENT 3)
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
        maxWidth: '400px',
        lineHeight: 1.6
      }}>
        What type of search are you running?
      </p>

      {/* Search type selection */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        width: '100%',
        maxWidth: '500px'
      }}>
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => router.push(option.route)}
            style={{
              padding: '24px',
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
              gap: '16px'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#f8fafc';
              e.currentTarget.style.borderColor = '#4F46E5';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#ffffff';
              e.currentTarget.style.borderColor = '#e2e8f0';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <span style={{ fontSize: '32px' }}>{option.emoji}</span>
            <div>
              <div style={{ marginBottom: '6px' }}>{option.label}</div>
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

      {/* Tagline footer */}
      <div style={{
        position: 'fixed',
        bottom: '24px',
        color: '#94a3b8',
        fontSize: '13px'
      }}>
        HireInbox — Less noise. More hires.
      </div>
    </div>
  );
}
