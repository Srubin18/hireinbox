'use client';

import { useRouter } from 'next/navigation';
import Breadcrumbs from '@/components/Breadcrumbs';

// ============================================
// HIREINBOX - ABOUT US PAGE
// Simple, clean, trustworthy
// ============================================

export default function AboutPage() {
  const router = useRouter();

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#ffffff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header */}
      <header style={{
        padding: '20px 32px',
        borderBottom: '1px solid #f1f5f9',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div
          onClick={() => router.push('/')}
          style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
        >
          <svg width="36" height="36" viewBox="0 0 48 48" fill="none">
            <rect width="48" height="48" rx="12" fill="#4F46E5"/>
            <path d="M12 18L24 26L36 18V32C36 33.1 35.1 34 34 34H14C12.9 34 12 33.1 12 32V18Z" fill="white" fillOpacity="0.9"/>
            <path d="M34 14H14C12.9 14 12 14.9 12 16V18L24 26L36 18V16C36 14.9 35.1 14 34 14Z" fill="white"/>
            <circle cx="36" cy="12" r="9" fill="#10B981"/>
            <path d="M32.5 12L35 14.5L39.5 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ fontSize: '18px', fontWeight: 700 }}>
            <span style={{ color: '#0f172a' }}>Hire</span>
            <span style={{ color: '#4F46E5' }}>Inbox</span>
          </span>
        </div>
        <button
          onClick={() => router.push('/')}
          style={{
            padding: '10px 20px',
            backgroundColor: 'transparent',
            color: '#475569',
            border: 'none',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer'
          }}
        >
          Back
        </button>
      </header>

      {/* Breadcrumbs */}
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '0 32px' }}>
        <Breadcrumbs items={[{ label: 'About' }]} />
      </div>

      {/* Main Content */}
      <main style={{
        maxWidth: '600px',
        margin: '0 auto',
        padding: '40px 32px 80px'
      }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: 700,
          color: '#0f172a',
          marginBottom: '24px'
        }}>
          About Hyred
        </h1>

        <p style={{
          fontSize: '16px',
          color: '#475569',
          lineHeight: 1.7,
          marginBottom: '24px'
        }}>
          Hyred is an AI-powered CV screening tool built for the South African market. We help employers save time by automatically screening CVs against job requirements, with clear reasoning for every decision.
        </p>

        <p style={{
          fontSize: '16px',
          color: '#475569',
          lineHeight: 1.7,
          marginBottom: '40px'
        }}>
          Our AI understands local qualifications like CA(SA), BCom degrees, and South African companies. Every screening decision comes with evidence - no black boxes.
        </p>

        {/* Founder */}
        <div style={{
          padding: '24px',
          backgroundColor: '#f8fafc',
          borderRadius: '12px',
          marginBottom: '40px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: '#4F46E5',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontSize: '16px',
              fontWeight: 600
            }}>
              SR
            </div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>Simon Rubin</div>
              <div style={{ fontSize: '14px', color: '#64748b' }}>Founder, Cape Town</div>
            </div>
          </div>
          <p style={{
            fontSize: '15px',
            color: '#475569',
            lineHeight: 1.6,
            margin: 0
          }}>
            I built Hyred after seeing how much time recruiters spend reading CVs that don&apos;t fit. The AI does the first pass. You make the final call.
          </p>
        </div>

        {/* Contact */}
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '12px' }}>
            Questions? Get in touch.
          </p>
          <a
            href="mailto:hello@hireinbox.co.za"
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              backgroundColor: '#0f172a',
              color: '#ffffff',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: 500
            }}
          >
            hello@hireinbox.co.za
          </a>
        </div>
      </main>
    </div>
  );
}
