'use client';

import { useRouter } from 'next/navigation';

// ============================================
// HIREINBOX B2C - ULTRA SIMPLE CANDIDATE ENTRY
// ONE GOAL: Get them to upload their CV
// NO career stages, NO options, just GO
// ============================================

export default function CandidatesPage() {
  const router = useRouter();

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#ffffff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      textAlign: 'center'
    }}>
      {/* Logo */}
      <div style={{ marginBottom: '32px' }}>
        <svg width="72" height="72" viewBox="0 0 48 48" fill="none">
          <rect width="48" height="48" rx="12" fill="#4F46E5"/>
          <path d="M12 18L24 26L36 18V32C36 33.1 35.1 34 34 34H14C12.9 34 12 33.1 12 32V18Z" fill="white" fillOpacity="0.9"/>
          <path d="M34 14H14C12.9 14 12 14.9 12 16V18L24 26L36 18V16C36 14.9 35.1 14 34 14Z" fill="white"/>
          <circle cx="36" cy="12" r="9" fill="#10B981"/>
          <path d="M32.5 12L35 14.5L39.5 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      {/* Main Heading - Big and Clear */}
      <h1 style={{
        fontSize: '36px',
        fontWeight: 700,
        color: '#0f172a',
        marginBottom: '16px',
        lineHeight: 1.2
      }}>
        Get Free CV Feedback
      </h1>

      {/* Simple explanation */}
      <p style={{
        fontSize: '20px',
        color: '#64748b',
        marginBottom: '40px',
        maxWidth: '400px',
        lineHeight: 1.5
      }}>
        Upload your CV and get tips to make it better. Takes 30 seconds.
      </p>

      {/* ONE BIG BUTTON */}
      <button
        onClick={() => router.push('/upload')}
        style={{
          padding: '20px 48px',
          backgroundColor: '#4F46E5',
          color: '#ffffff',
          border: 'none',
          borderRadius: '12px',
          fontSize: '20px',
          fontWeight: 700,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 4px 14px rgba(79, 70, 229, 0.4)',
          transition: 'transform 0.2s, box-shadow 0.2s'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(79, 70, 229, 0.5)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 14px rgba(79, 70, 229, 0.4)';
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
        Upload My CV
      </button>

      {/* Trust signals - simple */}
      <div style={{
        marginTop: '48px',
        display: 'flex',
        gap: '32px',
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '14px' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          100% Free
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '14px' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          Results in 30 seconds
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '14px' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          No signup needed
        </div>
      </div>

      {/* What you get - super simple */}
      <div style={{
        marginTop: '64px',
        padding: '32px',
        backgroundColor: '#f8fafc',
        borderRadius: '16px',
        maxWidth: '500px',
        width: '100%'
      }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', marginBottom: '20px' }}>
          What you'll get:
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', fontWeight: 700 }}>1</div>
            <span style={{ color: '#374151', fontSize: '16px' }}>A score out of 100</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', fontWeight: 700 }}>2</div>
            <span style={{ color: '#374151', fontSize: '16px' }}>What's good about your CV</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', fontWeight: 700 }}>3</div>
            <span style={{ color: '#374151', fontSize: '16px' }}>How to make it better</span>
          </div>
        </div>
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
        ← Back to home
      </button>

      {/* Support */}
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
        Help
      </button>
    </div>
  );
}
