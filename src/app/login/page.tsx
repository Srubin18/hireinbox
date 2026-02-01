'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

// ============================================
// HireInbox Login Page - Clean and Simple
// ============================================

const Logo = ({ size = 40 }: { size?: number }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="12" fill="#4F46E5"/>
      <path d="M12 18L24 26L36 18V32C36 33.1 35.1 34 34 34H14C12.9 34 12 33.1 12 32V18Z" fill="white" fillOpacity="0.9"/>
      <path d="M34 14H14C12.9 14 12 14.9 12 16V18L24 26L36 18V16C36 14.9 35.1 14 34 14Z" fill="white"/>
      <circle cx="36" cy="12" r="9" fill="#10B981"/>
      <path d="M32.5 12L35 14.5L39.5 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
    <span style={{ fontSize: size > 32 ? '1.35rem' : '1.15rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
      <span style={{ color: '#0f172a' }}>Hire</span>
      <span style={{ color: '#4F46E5' }}>Inbox</span>
    </span>
  </div>
);

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn, user, loading: authLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const redirectTo = searchParams.get('return') || searchParams.get('redirect') || '/hire/dashboard';

  // Redirect if already logged in
  useEffect(() => {
    if (user && !authLoading) {
      router.push(redirectTo);
    }
  }, [user, authLoading, router, redirectTo]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      if (error.message.toLowerCase().includes('email not confirmed')) {
        setError('Please check your email and click the confirmation link before signing in.');
      } else if (error.message.toLowerCase().includes('invalid login')) {
        setError('Invalid email or password. Please try again.');
      } else {
        setError(error.message);
      }
      setLoading(false);
    } else {
      router.push(redirectTo);
    }
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
            <circle cx="24" cy="24" r="20" stroke="#E5E7EB" strokeWidth="4" fill="none"/>
            <circle cx="24" cy="24" r="20" stroke="#4F46E5" strokeWidth="4" fill="none" strokeDasharray="80" strokeDashoffset="60" strokeLinecap="round"/>
          </svg>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#ffffff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <header style={{ padding: '20px 32px', borderBottom: '1px solid #f1f5f9' }}>
        <a href="/" style={{ textDecoration: 'none' }}><Logo /></a>
      </header>

      {/* Main Content */}
      <main style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px'
      }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          {/* Title */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <h1 style={{
              fontSize: '1.75rem',
              fontWeight: 700,
              color: '#0f172a',
              marginBottom: 8,
              letterSpacing: '-0.02em'
            }}>
              Welcome back
            </h1>
            <p style={{ fontSize: '0.9375rem', color: '#64748b' }}>
              Sign in to your account
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              backgroundColor: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: 10,
              padding: '12px 16px',
              marginBottom: 20,
              display: 'flex',
              alignItems: 'center',
              gap: 10
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span style={{ color: '#DC2626', fontSize: '0.875rem' }}>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin}>
            {/* Email */}
            <div style={{ marginBottom: 16 }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: '#374151',
                marginBottom: 6
              }}>
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoFocus
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  fontSize: '16px',
                  border: '1px solid #e2e8f0',
                  borderRadius: 10,
                  outline: 'none',
                  transition: 'border-color 0.2s ease',
                  boxSizing: 'border-box'
                }}
                onFocus={e => e.target.style.borderColor = '#4F46E5'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={{
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: '#374151'
                }}>
                  Password
                </label>
                <a
                  href="/auth/reset-password"
                  style={{
                    fontSize: '0.8125rem',
                    color: '#4F46E5',
                    textDecoration: 'none'
                  }}
                >
                  Forgot password?
                </a>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  style={{
                    width: '100%',
                    padding: '14px 48px 14px 16px',
                    fontSize: '16px',
                    border: '1px solid #e2e8f0',
                    borderRadius: 10,
                    outline: 'none',
                    transition: 'border-color 0.2s ease',
                    boxSizing: 'border-box'
                  }}
                  onFocus={e => e.target.style.borderColor = '#4F46E5'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 4,
                    color: '#94a3b8'
                  }}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px 20px',
                backgroundColor: loading ? '#93C5FD' : '#4F46E5',
                color: '#ffffff',
                border: 'none',
                borderRadius: 10,
                fontSize: '0.9375rem',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.backgroundColor = '#4338CA'; }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.backgroundColor = '#4F46E5'; }}
            >
              {loading ? (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
                    <circle cx="12" cy="12" r="10" stroke="#ffffff" strokeWidth="3" fill="none" strokeDasharray="60" strokeLinecap="round"/>
                  </svg>
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          {/* SIGNUP DISABLED DURING PILOT - Uncomment to re-enable */}
          {/* <p style={{
            textAlign: 'center',
            marginTop: 24,
            fontSize: '0.9375rem',
            color: '#64748b'
          }}>
            Don&apos;t have an account?{' '}
            <a
              href="/signup"
              style={{
                color: '#4F46E5',
                textDecoration: 'none',
                fontWeight: 500
              }}
            >
              Sign up
            </a>
          </p> */}

          {/* Pilot Access Notice - Remove this when re-enabling signup */}
          <div style={{
            marginTop: 24,
            padding: '12px 16px',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            textAlign: 'center',
          }}>
            <p style={{
              fontSize: '0.875rem',
              color: '#475569',
              margin: 0,
            }}>
              <strong style={{ color: '#0f172a' }}>Pilot Program</strong>
              <br />
              <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                Access by invitation only. Contact{' '}
                <a
                  href="mailto:simon@hireinbox.co.za"
                  style={{ color: '#4F46E5', textDecoration: 'underline' }}
                >
                  simon@hireinbox.co.za
                </a>
                {' '}for access.
              </span>
            </p>
          </div>
        </div>
      </main>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: #9CA3AF; }
      `}</style>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff'
      }}>
        <div style={{ textAlign: 'center' }}>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
            <circle cx="24" cy="24" r="20" stroke="#E5E7EB" strokeWidth="4" fill="none"/>
            <circle cx="24" cy="24" r="20" stroke="#4F46E5" strokeWidth="4" fill="none" strokeDasharray="80" strokeDashoffset="60" strokeLinecap="round"/>
          </svg>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}
