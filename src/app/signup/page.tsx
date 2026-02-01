// ============================================
// SIGNUP TEMPORARILY DISABLED DURING PILOT PHASE
// ============================================
// Original signup code backed up to: page.tsx.backup-original
// To re-enable: restore from backup file
// ============================================

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const Logo = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="12" fill="#4F46E5"/>
      <path d="M12 18L24 26L36 18V32C36 33.1 35.1 34 34 34H14C12.9 34 12 33.1 12 32V18Z" fill="white" fillOpacity="0.9"/>
      <path d="M34 14H14C12.9 14 12 14.9 12 16V18L24 26L36 18V16C36 14.9 35.1 14 34 14Z" fill="white"/>
      <circle cx="36" cy="12" r="9" fill="#10B981"/>
      <path d="M32.5 12L35 14.5L39.5 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <span style={{ fontSize: '1.35rem', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
        <span style={{ color: '#0f172a' }}>Hire</span>
        <span style={{ color: '#4F46E5' }}>Inbox</span>
      </span>
      <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 500 }}>AI-Powered Recruitment</span>
    </div>
  </div>
);

export default function SignupDisabledPage() {
  const router = useRouter();

  useEffect(() => {
    // Auto-redirect to login after 5 seconds
    const timer = setTimeout(() => {
      router.push('/login');
    }, 5000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      padding: '24px',
    }}>
      <div style={{
        maxWidth: '500px',
        width: '100%',
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        padding: '48px',
        textAlign: 'center',
      }}>
        <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'center' }}>
          <Logo />
        </div>

        <div style={{
          width: '64px',
          height: '64px',
          backgroundColor: '#fef3c7',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>

        <h1 style={{
          fontSize: '24px',
          fontWeight: 700,
          color: '#0f172a',
          marginBottom: '12px',
        }}>
          Signup Temporarily Disabled
        </h1>

        <p style={{
          fontSize: '16px',
          color: '#64748b',
          lineHeight: 1.6,
          marginBottom: '24px',
        }}>
          We&apos;re currently running a pilot program with select recruiters. New signups are temporarily disabled while we perfect the platform.
        </p>

        <div style={{
          padding: '16px',
          backgroundColor: '#f0f9ff',
          border: '1px solid #bae6fd',
          borderRadius: '8px',
          marginBottom: '32px',
        }}>
          <p style={{
            fontSize: '14px',
            color: '#0369a1',
            margin: 0,
          }}>
            <strong style={{ color: '#0c4a6e' }}>Interested in early access?</strong>
            <br />
            Contact us at{' '}
            <a
              href="mailto:simon@hireinbox.co.za"
              style={{ color: '#0284c7', textDecoration: 'underline' }}
            >
              simon@hireinbox.co.za
            </a>
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button
            onClick={() => router.push('/login')}
            style={{
              width: '100%',
              padding: '14px 24px',
              backgroundColor: '#4F46E5',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#4338ca'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#4F46E5'}
          >
            Go to Login
          </button>

          <button
            onClick={() => router.push('/')}
            style={{
              width: '100%',
              padding: '14px 24px',
              backgroundColor: '#f1f5f9',
              color: '#475569',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#e2e8f0';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#f1f5f9';
            }}
          >
            Back to Home
          </button>
        </div>

        <p style={{
          fontSize: '13px',
          color: '#94a3b8',
          marginTop: '24px',
        }}>
          Redirecting to login in 5 seconds...
        </p>
      </div>
    </div>
  );
}
