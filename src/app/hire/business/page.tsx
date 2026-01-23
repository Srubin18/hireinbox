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
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
      <p style={{ fontSize: '16px', color: '#64748b' }}>Loading your dashboard...</p>
    </div>
  );
}
