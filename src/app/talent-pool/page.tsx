'use client';

import { useRouter } from 'next/navigation';

// ============================================
// TALENT POOL LANDING PAGE
// Simple option selector - no selling, no pricing
// Routes to appropriate flow based on user type
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

export default function TalentPoolPage() {
  const router = useRouter();

  const options = [
    {
      id: 'candidate',
      label: "I'm looking for opportunities",
      description: 'Upload your CV to get matched with relevant roles',
      route: '/talent-pool/join',
      primary: true
    },
    {
      id: 'browse',
      label: "I'm looking for talent",
      description: 'Browse pre-screened candidates ready to hire',
      route: '/talent-pool/browse',
      primary: false
    },
    {
      id: 'employer',
      label: "I'm posting a role",
      description: 'Post a job and let AI match you with candidates',
      route: '/talent-pool/post-job',
      primary: false
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
      {/* Logo and brand */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginBottom: '48px'
      }}>
        <Logo size={56} />
        <h1 style={{
          fontSize: '28px',
          fontWeight: 700,
          color: '#0f172a',
          marginTop: '20px',
          marginBottom: '8px',
          letterSpacing: '-0.02em'
        }}>
          Talent Pool
        </h1>
        <p style={{
          fontSize: '15px',
          color: '#64748b',
          fontWeight: 500,
          margin: 0
        }}>
          AI-powered matching for better connections
        </p>
      </div>

      {/* Options */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        width: '100%',
        maxWidth: '400px'
      }}>
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => router.push(option.route)}
            style={{
              padding: '24px',
              backgroundColor: option.primary ? '#4F46E5' : '#ffffff',
              color: option.primary ? '#ffffff' : '#0f172a',
              border: option.primary ? 'none' : '2px solid #e2e8f0',
              borderRadius: '16px',
              fontSize: '18px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textAlign: 'left'
            }}
            onMouseOver={(e) => {
              if (option.primary) {
                e.currentTarget.style.backgroundColor = '#4338ca';
                e.currentTarget.style.transform = 'translateY(-2px)';
              } else {
                e.currentTarget.style.backgroundColor = '#f8fafc';
                e.currentTarget.style.borderColor = '#4F46E5';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }
            }}
            onMouseOut={(e) => {
              if (option.primary) {
                e.currentTarget.style.backgroundColor = '#4F46E5';
                e.currentTarget.style.transform = 'translateY(0)';
              } else {
                e.currentTarget.style.backgroundColor = '#ffffff';
                e.currentTarget.style.borderColor = '#e2e8f0';
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
          >
            <div>{option.label}</div>
            <div style={{
              fontSize: '14px',
              fontWeight: 400,
              opacity: option.primary ? 0.85 : 1,
              color: option.primary ? '#ffffff' : '#64748b',
              marginTop: '6px'
            }}>
              {option.description}
            </div>
          </button>
        ))}
      </div>

      {/* Back link */}
      <button
        onClick={() => router.push('/')}
        style={{
          marginTop: '32px',
          padding: '12px 24px',
          backgroundColor: 'transparent',
          color: '#64748b',
          border: 'none',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: 500,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.color = '#4F46E5';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.color = '#64748b';
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        Back to home
      </button>
    </div>
  );
}
