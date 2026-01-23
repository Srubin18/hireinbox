'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// ============================================
// HIREINBOX B2B - RECRUITER REDIRECT
// /hire/recruiter
//
// Redirects to talent mapping with natural language prompt
// Recruiters describe what they're looking for in plain English
// and AI searches public sources to find candidates
// ============================================

export default function RecruiterRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to talent mapping - the natural language prompt interface
    router.replace('/hire/recruiter/mapping');
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
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎯</div>
      <p style={{ fontSize: '16px', color: '#64748b' }}>Loading talent mapping...</p>
    </div>
  );
}
