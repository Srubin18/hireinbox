'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// ============================================
// HIREINBOX B2B - BUSINESS REDIRECT
// /hire/business
//
// Redirects to the employer dashboard
// The dashboard shows the CV screening experience:
// - "47 CVs, 3 worth calling" style view
// - Hiring Pass System
// - AI-ranked candidates
// ============================================

export default function BusinessRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the employer dashboard
    router.replace('/hire/dashboard');
  }, [router]);

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
      <div style={{ marginBottom: '16px' }}>
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
          <circle cx="24" cy="24" r="20" stroke="#E5E7EB" strokeWidth="4" fill="none"/>
          <circle cx="24" cy="24" r="20" stroke="#4F46E5" strokeWidth="4" fill="none" strokeDasharray="80" strokeDashoffset="60" strokeLinecap="round"/>
        </svg>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
      <p style={{ fontSize: '16px', color: '#64748b' }}>Loading your dashboard...</p>
    </div>
  );
}
