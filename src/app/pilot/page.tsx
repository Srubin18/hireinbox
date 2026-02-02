'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

// ============================================
// HIREINBOX PILOT PROGRAM - LOGIN
// /pilot
// Clean, professional login for pilot recruiters
// ============================================

const Logo = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="12" fill="#4F46E5"/>
      <path d="M12 18L24 26L36 18V32C36 33.1 35.1 34 34 34H14C12.9 34 12 33.1 12 32V18Z" fill="white" fillOpacity="0.9"/>
      <path d="M34 14H14C12.9 14 12 14.9 12 16V18L24 26L36 18V16C36 14.9 35.1 14 34 14Z" fill="white"/>
      <circle cx="36" cy="12" r="9" fill="#10B981"/>
      <path d="M32.5 12L35 14.5L39.5 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
    <div>
      <div style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em' }}>
        <span style={{ color: '#4F46E5' }}>Hyred</span>
      </div>
      <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>
        Recruiter Intelligence Platform
      </div>
    </div>
  </div>
);

export default function PilotLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // SIGNUP DISABLED FOR PILOT - Uncomment to re-enable signup feature
  // const [mode, setMode] = useState<'login' | 'signup'>('login');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // SIGNUP DISABLED - Only login is active during pilot
      // Uncomment the if/else block below to re-enable signup

      // if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      // } else {
      //   const { error } = await supabase.auth.signUp({
      //     email,
      //     password,
      //     options: {
      //       data: {
      //         user_type: 'pilot_recruiter',
      //       },
      //       emailRedirectTo: `${window.location.origin}/auth/callback?next=/pilot/dashboard`,
      //     },
      //   });
      //   if (error) throw error;
      //   setError('Check your email to confirm your account');
      //   setLoading(false);
      //   return;
      // }

      router.push('/pilot/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      display: 'flex',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      {/* Left Panel - Branding */}
      <div style={{
        flex: 1,
        background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '64px',
        color: '#ffffff',
      }}>
        <div style={{ maxWidth: '480px' }}>
          <div style={{
            display: 'inline-flex',
            padding: '8px 16px',
            backgroundColor: 'rgba(255,255,255,0.15)',
            borderRadius: '20px',
            fontSize: '13px',
            fontWeight: 600,
            marginBottom: '32px',
          }}>
            PILOT PROGRAM
          </div>

          <h1 style={{
            fontSize: '42px',
            fontWeight: 700,
            lineHeight: 1.2,
            marginBottom: '24px',
          }}>
            AI-Powered Recruitment Intelligence
          </h1>

          <p style={{
            fontSize: '18px',
            lineHeight: 1.6,
            opacity: 0.9,
            marginBottom: '48px',
          }}>
            Find hidden talent with our advanced AI search. Screen CVs in seconds with explainable decisions. Built for South African recruiters.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { icon: '🔍', text: 'Talent Mapping - Find candidates others miss' },
              { icon: '📄', text: 'AI CV Screening - 50 CVs in seconds' },
              { icon: '🇿🇦', text: 'SA-Specific Intelligence - CA(SA), BCom, local companies' },
            ].map((feature, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '20px' }}>{feature.icon}</span>
                <span style={{ fontSize: '15px', fontWeight: 500 }}>{feature.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '64px',
      }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>
          <div style={{ marginBottom: '40px' }}>
            <Logo />
          </div>

          <h2 style={{
            fontSize: '24px',
            fontWeight: 700,
            color: '#0f172a',
            marginBottom: '8px',
          }}>
            {/* SIGNUP DISABLED - Change 'Welcome back' to dynamic text when re-enabling signup */}
            {/* {mode === 'login' ? 'Welcome back' : 'Join the pilot'} */}
            Welcome back
          </h2>
          <p style={{ fontSize: '15px', color: '#64748b', marginBottom: '32px' }}>
            {/* SIGNUP DISABLED - Change text when re-enabling signup */}
            {/* {mode === 'login' ? 'Sign in to access your recruitment dashboard' : 'Create your account to get started'} */}
            Sign in to access your recruitment dashboard
          </p>

          {error && (
            <div style={{
              padding: '12px 16px',
              backgroundColor: error.includes('Check your email') ? '#f0fdf4' : '#fef2f2',
              border: `1px solid ${error.includes('Check your email') ? '#bbf7d0' : '#fecaca'}`,
              borderRadius: '8px',
              color: error.includes('Check your email') ? '#166534' : '#dc2626',
              fontSize: '14px',
              marginBottom: '24px',
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 500,
                color: '#374151',
                marginBottom: '6px',
              }}>
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '15px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                placeholder="you@company.com"
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 500,
                color: '#374151',
                marginBottom: '6px',
              }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '15px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px 24px',
                backgroundColor: '#4F46E5',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                transition: 'all 0.2s',
              }}
            >
              {/* SIGNUP DISABLED - Change button text when re-enabling signup */}
              {/* {loading ? 'Please wait...' : (mode === 'login' ? 'Sign in' : 'Create account')} */}
              {loading ? 'Please wait...' : 'Sign in'}
            </button>
          </form>

          {/* SIGNUP DISABLED - Uncomment block below to re-enable signup toggle */}
          {/* <div style={{
            marginTop: '24px',
            textAlign: 'center',
            fontSize: '14px',
            color: '#64748b',
          }}>
            {mode === 'login' ? (
              <>
                Don&apos;t have an account?{' '}
                <button
                  onClick={() => setMode('signup')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#4F46E5',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  onClick={() => setMode('login')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#4F46E5',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Sign in
                </button>
              </>
            )}
          </div> */}

          {/* PILOT ONLY - Remove this when re-enabling signup */}
          <div style={{
            marginTop: '24px',
            textAlign: 'center',
            fontSize: '14px',
            color: '#64748b',
          }}>
            Access is by invitation only. Contact us for access.
          </div>

          <div style={{
            marginTop: '48px',
            padding: '16px',
            backgroundColor: '#f1f5f9',
            borderRadius: '8px',
            fontSize: '13px',
            color: '#64748b',
            textAlign: 'center',
          }}>
            <strong style={{ color: '#0f172a' }}>Pilot Program</strong>
            <br />
            You&apos;re part of an exclusive group testing our new AI recruitment tools.
          </div>
        </div>
      </div>
    </div>
  );
}
