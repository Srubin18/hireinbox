'use client';

import { useRouter } from 'next/navigation';

// ============================================
// HIREINBOX ROOT PAGE
// PUBLIC LANDING - Sign In required for all other pages
// Intent selection only. No selling. No pricing.
// Calm tone. SEO-safe routing.
//
// Routes:
// - "I'm hiring" → /login (then /hire)
// - "I'm looking for work" → /login (then /candidates)
// ============================================

const Logo = ({ size = 48 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <rect width="48" height="48" rx="12" fill="#4F46E5"/>
    <path d="M12 18L24 26L36 18V32C36 33.1 35.1 34 34 34H14C12.9 34 12 33.1 12 32V18Z" fill="white" fillOpacity="0.9"/>
    <path d="M34 14H14C12.9 14 12 14.9 12 16V18L24 26L36 18V16C36 14.9 35.1 14 34 14Z" fill="white"/>
    <circle cx="36" cy="12" r="9" fill="#10B981"/>
    <path d="M32.5 12L35 14.5L39.5 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function RootPage() {
  const router = useRouter();

  const intents = [
    {
      id: 'hiring',
      label: "I'm hiring",
      description: 'Find and screen candidates for your roles',
      route: '/login?redirect=/hire',
      primary: true
    },
    {
      id: 'looking',
      label: "I'm looking for work",
      description: 'Get your CV reviewed and find opportunities',
      route: '/login?redirect=/candidates',
      primary: false
    },
    {
      id: 'talent-pool',
      label: 'Talent Pool',
      description: 'Join as a candidate or browse talent as a business',
      route: '/login?redirect=/talent-pool',
      primary: false
    }
  ];

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#ffffff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header with Sign In button */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px 32px',
        borderBottom: '1px solid #f1f5f9'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Logo size={40} />
          <span style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
            <span style={{ color: '#0f172a' }}>Hire</span>
            <span style={{ color: '#4F46E5' }}>Inbox</span>
          </span>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <a
            href="/login"
            style={{
              padding: '10px 20px',
              backgroundColor: '#4F46E5',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              fontSize: '0.9375rem',
              fontWeight: 600,
              textDecoration: 'none',
              cursor: 'pointer',
              transition: 'background-color 0.2s ease'
            }}
          >
            Sign In
          </a>
          <a
            href="/signup"
            style={{
              padding: '10px 20px',
              backgroundColor: '#ffffff',
              color: '#4F46E5',
              border: '2px solid #4F46E5',
              borderRadius: '10px',
              fontSize: '0.9375rem',
              fontWeight: 600,
              textDecoration: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Create Account
          </a>
        </div>
      </header>

      {/* Main content */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px'
      }}>
        {/* Logo and brand */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginBottom: '64px'
        }}>
          <Logo size={72} />
          <h1 style={{
            fontSize: '36px',
            fontWeight: 700,
            color: '#0f172a',
            marginTop: '24px',
            marginBottom: '8px',
            letterSpacing: '-0.02em'
          }}>
            <span>Hire</span><span style={{ color: '#4F46E5' }}>Inbox</span>
          </h1>
          <p style={{
            fontSize: '16px',
            color: '#64748b',
            fontWeight: 500,
            margin: 0
          }}>
            Less noise. More hires.
          </p>
        </div>

      {/* Intent selection */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        width: '100%',
        maxWidth: '400px'
      }}>
        {intents.map((intent) => (
          <button
            key={intent.id}
            onClick={() => router.push(intent.route)}
            style={{
              padding: '24px',
              backgroundColor: intent.primary ? '#4F46E5' : '#ffffff',
              color: intent.primary ? '#ffffff' : '#0f172a',
              border: intent.primary ? 'none' : '2px solid #e2e8f0',
              borderRadius: '16px',
              fontSize: '18px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textAlign: 'left'
            }}
            onMouseOver={(e) => {
              if (intent.primary) {
                e.currentTarget.style.backgroundColor = '#4338ca';
                e.currentTarget.style.transform = 'translateY(-2px)';
              } else {
                e.currentTarget.style.backgroundColor = '#f8fafc';
                e.currentTarget.style.borderColor = '#4F46E5';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }
            }}
            onMouseOut={(e) => {
              if (intent.primary) {
                e.currentTarget.style.backgroundColor = '#4F46E5';
                e.currentTarget.style.transform = 'translateY(0)';
              } else {
                e.currentTarget.style.backgroundColor = '#ffffff';
                e.currentTarget.style.borderColor = '#e2e8f0';
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
          >
            <div>{intent.label}</div>
            <div style={{
              fontSize: '14px',
              fontWeight: 400,
              opacity: intent.primary ? 0.85 : 1,
              color: intent.primary ? '#ffffff' : '#64748b',
              marginTop: '6px'
            }}>
              {intent.description}
            </div>
          </button>
        ))}
      </div>

      </div>

      {/* Footer */}
      <footer style={{
        padding: '20px 32px',
        borderTop: '1px solid #f1f5f9',
        display: 'flex',
        gap: '24px',
        color: '#94a3b8',
        fontSize: '13px',
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>
        <a href="/about" style={{ color: '#94a3b8', textDecoration: 'none' }}>About</a>
        <a href="/terms" style={{ color: '#94a3b8', textDecoration: 'none' }}>Terms</a>
        <a href="/privacy" style={{ color: '#94a3b8', textDecoration: 'none' }}>Privacy</a>
      </footer>
    </div>
  );
}
