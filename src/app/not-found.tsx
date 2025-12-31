import Link from 'next/link';

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f9fafb',
        padding: '24px',
      }}
    >
      <div
        style={{
          maxWidth: '480px',
          width: '100%',
          textAlign: 'center',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '48px 32px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            backgroundColor: '#eff6ff',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
          }}
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
            <line x1="11" y1="8" x2="11" y2="14" />
            <line x1="8" y1="11" x2="14" y2="11" />
          </svg>
        </div>

        <h1
          style={{
            fontSize: '72px',
            fontWeight: '700',
            color: '#4f46e5',
            margin: '0 0 8px',
            lineHeight: '1',
          }}
        >
          404
        </h1>

        <h2
          style={{
            fontSize: '24px',
            fontWeight: '600',
            color: '#111827',
            margin: '0 0 12px',
          }}
        >
          Page not found
        </h2>

        <p
          style={{
            fontSize: '16px',
            color: '#6b7280',
            margin: '0 0 32px',
            lineHeight: '1.5',
          }}
        >
          The page you are looking for does not exist or has been moved. Let us
          help you find your way back.
        </p>

        <div
          style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          <Link
            href="/"
            style={{
              backgroundColor: '#4f46e5',
              color: '#ffffff',
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              textDecoration: 'none',
              display: 'inline-block',
            }}
          >
            Go to Dashboard
          </Link>

          <Link
            href="/upload"
            style={{
              backgroundColor: '#f3f4f6',
              color: '#374151',
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              textDecoration: 'none',
              display: 'inline-block',
            }}
          >
            Upload CV
          </Link>
        </div>

        <p
          style={{
            fontSize: '14px',
            color: '#9ca3af',
            margin: '32px 0 0',
          }}
        >
          Need help?{' '}
          <a
            href="mailto:support@hireinbox.co.za"
            style={{
              color: '#4f46e5',
              textDecoration: 'none',
            }}
          >
            Contact support
          </a>
        </p>
      </div>
    </div>
  );
}
