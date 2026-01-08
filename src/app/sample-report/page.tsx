'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Redirect /sample-report to /upload with sample flag
export default function SampleReportRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/upload?sample=true');
  }, [router]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '1.5rem', fontWeight: 600, color: '#0f172a', marginBottom: 8 }}>
          Loading Sample Report...
        </div>
        <div style={{ color: '#64748b' }}>
          Redirecting to CV Analysis
        </div>
      </div>
    </div>
  );
}
