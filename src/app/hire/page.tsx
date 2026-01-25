'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// ============================================
// HIREINBOX B2B ENTRY - /hire
// Temporary redirect to existing dashboard
// RALF AGENT 2 will build the full flow
// ============================================

export default function HirePage() {
  const router = useRouter();

  // Temporary: redirect to existing B2B dashboard at root
  // This will be replaced by RALF AGENT 2 with full employer/recruiter flow
  useEffect(() => {
    // For now, show B2B entry point
    // router.push('/dashboard');
  }, []);

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
        marginBottom: '16px',
        textAlign: 'center'
      }}>
        I'm hiring
      </h1>

      <p style={{
        fontSize: '18px',
        color: '#64748b',
        marginBottom: '48px',
        textAlign: 'center',
        maxWidth: '400px',
        lineHeight: 1.6
      }}>
        Let's find the right people for your team.
      </p>

      {/* Fork: Business or Recruiter - RALF AGENT 2 will build this */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        width: '100%',
        maxWidth: '400px'
      }}>
        <button
          onClick={() => router.push('/hire/business')}
          style={{
            padding: '20px 32px',
            backgroundColor: '#4F46E5',
            color: '#ffffff',
            border: 'none',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#4338ca'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#4F46E5'}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2"/>
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
          </svg>
          <div>
            <div>Business / Company</div>
            <div style={{ fontSize: '13px', fontWeight: 400, opacity: 0.8, marginTop: '4px' }}>
              Hire for your organisation
            </div>
          </div>
        </button>

        <button
          onClick={() => router.push('/hire/recruiter')}
          style={{
            padding: '20px 32px',
            backgroundColor: '#ffffff',
            color: '#0f172a',
            border: '2px solid #e2e8f0',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#f8fafc';
            e.currentTarget.style.borderColor = '#4F46E5';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = '#ffffff';
            e.currentTarget.style.borderColor = '#e2e8f0';
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          <div>
            <div>Recruiter / Agency</div>
            <div style={{ fontSize: '13px', fontWeight: 400, color: '#64748b', marginTop: '4px' }}>
              Source talent for clients
            </div>
          </div>
        </button>
      </div>

      {/* Back link */}
      <button
        onClick={() => router.push('/')}
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
        ← Back to start
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
