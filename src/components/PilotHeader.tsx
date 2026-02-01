'use client';

import { useRouter } from 'next/navigation';

interface PilotHeaderProps {
  user?: { email: string } | null;
  onLogout: () => void;
  currentPage?: 'dashboard' | 'talent-mapping' | 'screening' | 'reports' | 'usage';
}

const Logo = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
    <svg width="36" height="36" viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="12" fill="#4F46E5"/>
      <path d="M12 18L24 26L36 18V32C36 33.1 35.1 34 34 34H14C12.9 34 12 33.1 12 32V18Z" fill="white" fillOpacity="0.9"/>
      <path d="M34 14H14C12.9 14 12 14.9 12 16V18L24 26L36 18V16C36 14.9 35.1 14 34 14Z" fill="white"/>
      <circle cx="36" cy="12" r="9" fill="#10B981"/>
      <path d="M32.5 12L35 14.5L39.5 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
    <div>
      <div style={{ fontSize: '16px', fontWeight: 700, letterSpacing: '-0.02em' }}>
        <span style={{ color: '#4F46E5' }}>Hyred</span>
      </div>
      <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>
        Pilot Program
      </div>
    </div>
  </div>
);

const Icons = {
  search: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8"/>
      <path d="M21 21l-4.35-4.35"/>
    </svg>
  ),
  inbox: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 12h-6l-2 3h-4l-2-3H2"/>
      <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
    </svg>
  ),
  logout: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
};

export default function PilotHeader({ user, onLogout, currentPage }: PilotHeaderProps) {
  const router = useRouter();

  return (
    <>
      <style>{`
        .pilot-header { padding: 16px 32px; }
        .pilot-left-section { display: flex; align-items: center; gap: 32px; }
        .pilot-nav-links { display: flex; gap: 24px; align-items: center; }

        @media (max-width: 768px) {
          .pilot-header { padding: 12px 16px !important; flex-wrap: wrap; }
          .pilot-left-section { gap: 16px !important; }
          .pilot-nav-links { gap: 12px !important; }
        }
      `}</style>

      <header className="pilot-header" style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
      }}>
        <div className="pilot-left-section">
          <div
            onClick={() => router.push('/pilot/dashboard')}
            style={{ cursor: 'pointer' }}
          >
            <Logo />
          </div>

          <div className="pilot-nav-links">
            <button
              onClick={() => router.push('/pilot/dashboard')}
              style={{
                padding: '0',
                backgroundColor: 'transparent',
                border: 'none',
                fontSize: '14px',
                color: currentPage === 'dashboard' ? '#4F46E5' : '#64748b',
                fontWeight: currentPage === 'dashboard' ? 600 : 500,
                cursor: 'pointer',
              }}
            >
              Dashboard
            </button>

            <button
              onClick={() => router.push('/pilot/talent-mapping')}
              style={{
                padding: '0',
                backgroundColor: 'transparent',
                border: 'none',
                fontSize: '14px',
                color: currentPage === 'talent-mapping' ? '#4F46E5' : '#64748b',
                fontWeight: currentPage === 'talent-mapping' ? 600 : 500,
                cursor: 'pointer',
              }}
            >
              Talent Mapping
            </button>

            <button
              onClick={() => router.push('/pilot/screening')}
              style={{
                padding: '0',
                backgroundColor: 'transparent',
                border: 'none',
                fontSize: '14px',
                color: currentPage === 'screening' ? '#4F46E5' : '#64748b',
                fontWeight: currentPage === 'screening' ? 600 : 500,
                cursor: 'pointer',
              }}
            >
              CV Screening
            </button>

            <button
              onClick={() => router.push('/pilot/usage')}
              style={{
                padding: '0',
                backgroundColor: 'transparent',
                border: 'none',
                fontSize: '14px',
                color: currentPage === 'usage' ? '#4F46E5' : '#64748b',
                fontWeight: currentPage === 'usage' ? 600 : 500,
                cursor: 'pointer',
              }}
            >
              Usage
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>
            {user?.email}
          </span>
          <button
            onClick={onLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              backgroundColor: '#f1f5f9',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              color: '#475569',
              cursor: 'pointer',
            }}
          >
            {Icons.logout}
            Sign out
          </button>
        </div>
      </header>
    </>
  );
}
