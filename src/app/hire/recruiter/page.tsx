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
        <span style={{ color: '#4F46E5' }}>Hyred</span>
      </div>
      <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>Less noise. More hires.</div>
    </div>
  </div>
);

export default function RecruiterEntryPage() {
  const router = useRouter();

  const options = [
    {
      id: 'dashboard',
      label: 'Recruiter Dashboard',
      subtitle: 'Manage clients & pipeline',
      description: 'Your command center: track clients, active searches, pipeline, and placements. Manage all your recruitment activity.',
      route: '/hire/recruiter/dashboard',
      badge: 'New'
    },
    {
      id: 'boutique',
      label: 'Talent Mapping',
      subtitle: 'Find hidden candidates',
      description: 'Our AI searches company pages, news, conferences, and more — not just LinkedIn. Find candidates your competitors miss.',
      route: '/hire/recruiter/mapping',
      badge: 'Premium',
      disabled: false
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
            onClick={() => !option.disabled && router.push(option.route)}
            disabled={option.disabled}
            style={{
              padding: '28px',
              backgroundColor: option.disabled ? '#f8fafc' : '#ffffff',
              color: '#0f172a',
              border: '2px solid #e2e8f0',
              borderRadius: '16px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: option.disabled ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '20px',
              position: 'relative',
              opacity: option.disabled ? 0.7 : 1
            }}
            onMouseOver={(e) => {
              if (option.disabled) return;
              e.currentTarget.style.backgroundColor = '#f8fafc';
              e.currentTarget.style.borderColor = '#4F46E5';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(79, 70, 229, 0.15)';
            }}
            onMouseOut={(e) => {
              if (option.disabled) return;
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
                backgroundColor: option.badge === 'New' ? '#3b82f6' : option.badge === 'Premium' ? '#7c3aed' : '#10B981',
                color: '#ffffff',
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: 600
              }}>
                {option.badge}
              </div>
            )}
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              backgroundColor: option.id === 'dashboard' ? '#dbeafe' : '#ede9fe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {option.id === 'dashboard' ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="9"/>
                  <rect x="14" y="3" width="7" height="5"/>
                  <rect x="14" y="12" width="7" height="9"/>
                  <rect x="3" y="16" width="7" height="5"/>
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="M21 21l-4.35-4.35"/>
                  <circle cx="11" cy="11" r="3"/>
                </svg>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px' }}>
                {option.label}
              </div>
              <div style={{
                fontSize: '15px',
                fontWeight: 600,
                color: option.disabled ? '#94a3b8' : '#4F46E5',
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
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        Support
      </button>

      {/* Tagline footer */}
      <div style={{
        position: 'fixed',
        bottom: '24px',
        left: '24px',
        color: '#94a3b8',
        fontSize: '13px'
      }}>
        Hyred — Less noise. More hires.
      </div>
    </div>
  );
}
