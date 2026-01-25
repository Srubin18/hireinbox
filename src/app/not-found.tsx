import Link from 'next/link';

// ============================================
// HIREINBOX 404 PAGE
// Friendly, helpful, on-brand
// ============================================

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
        padding: '32px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Logo */}
      <div style={{ marginBottom: '32px' }}>
        <svg width="64" height="64" viewBox="0 0 48 48" fill="none">
          <rect width="48" height="48" rx="12" fill="#4F46E5"/>
          <path d="M12 18L24 26L36 18V32C36 33.1 35.1 34 34 34H14C12.9 34 12 33.1 12 32V18Z" fill="white" fillOpacity="0.9"/>
          <path d="M34 14H14C12.9 14 12 14.9 12 16V18L24 26L36 18V16C36 14.9 35.1 14 34 14Z" fill="white"/>
          <circle cx="36" cy="12" r="9" fill="#F59E0B"/>
          <text x="36" y="16" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">?</text>
        </svg>
      </div>

      {/* Big 404 */}
      <h1
        style={{
          fontSize: '72px',
          fontWeight: 800,
          color: '#0f172a',
          margin: '0 0 8px',
          letterSpacing: '-0.02em',
        }}
      >
        404
      </h1>

      <h2
        style={{
          fontSize: '24px',
          fontWeight: 600,
          color: '#0f172a',
          margin: '0 0 12px',
        }}
      >
        This page went missing
      </h2>

      <p
        style={{
          fontSize: '16px',
          color: '#64748b',
          margin: '0 0 32px',
          lineHeight: 1.6,
          textAlign: 'center',
          maxWidth: '400px',
        }}
      >
        Like a CV that never arrived. Let&apos;s get you back on track.
      </p>

      {/* Buttons */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          width: '100%',
          maxWidth: '280px',
        }}
      >
        <Link
          href="/"
          style={{
            background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
            color: '#ffffff',
            padding: '14px 24px',
            borderRadius: '10px',
            fontSize: '15px',
            fontWeight: 600,
            textDecoration: 'none',
            textAlign: 'center',
            boxShadow: '0 2px 4px rgba(79, 70, 229, 0.2)',
          }}
        >
          Go to Homepage
        </Link>

        <Link
          href="/candidates"
          style={{
            backgroundColor: '#ffffff',
            color: '#64748b',
            padding: '14px 24px',
            borderRadius: '10px',
            fontSize: '15px',
            fontWeight: 500,
            textDecoration: 'none',
            textAlign: 'center',
            border: '1px solid #e2e8f0',
          }}
        >
          Upload Your CV
        </Link>
      </div>

      {/* Quick Links */}
      <div
        style={{
          marginTop: '48px',
          display: 'flex',
          gap: '24px',
          fontSize: '14px',
        }}
      >
        <Link href="/hire" style={{ color: '#4F46E5', textDecoration: 'none' }}>
          For Employers
        </Link>
        <Link href="/candidates" style={{ color: '#4F46E5', textDecoration: 'none' }}>
          For Job Seekers
        </Link>
        <Link href="/faq" style={{ color: '#4F46E5', textDecoration: 'none' }}>
          FAQ
        </Link>
      </div>

      {/* Contact */}
      <p
        style={{
          marginTop: '32px',
          fontSize: '14px',
          color: '#94a3b8',
        }}
      >
        Need help?{' '}
        <a
          href="mailto:simon@hireinbox.co.za"
          style={{
            color: '#4F46E5',
            textDecoration: 'none',
          }}
        >
          Email Simon directly
        </a>
      </p>

      {/* Footer */}
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          color: '#94a3b8',
          fontSize: '13px',
        }}
      >
        Built in Cape Town, South Africa
      </div>
    </div>
  );
}
