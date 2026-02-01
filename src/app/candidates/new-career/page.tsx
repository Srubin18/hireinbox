'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// ============================================
// HIREINBOX B2C - STUDENTS & GRADUATES FLOW
// /candidates/new-career
//
// A unique journey for those starting their careers:
// - Students looking for internships
// - Graduates entering the workforce
//
// Focus: Build your profile, create a CV, get guidance
// ============================================

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
    </div>
  </div>
);

interface PathOption {
  id: string;
  icon: string;
  title: string;
  description: string;
  action: string;
}

function NewCareerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stage = searchParams.get('stage') || 'student';
  const isGraduate = stage === 'graduate';

  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  const paths: PathOption[] = [
    {
      id: 'have-cv',
      icon: '📄',
      title: 'I have a CV',
      description: 'Get AI feedback on your existing CV and tips for improvement',
      action: `/candidates/cv?stage=${stage}`
    },
    {
      id: 'create-cv',
      icon: '✨',
      title: 'Help me create a CV',
      description: "We'll guide you through building your first professional CV step-by-step",
      action: `/candidates/create?stage=${stage}`
    },
    {
      id: 'learn-first',
      icon: '📚',
      title: 'I want to learn first',
      description: isGraduate
        ? 'Tips for landing your first job after graduation'
        : 'Understanding what employers look for in internships',
      action: `/candidates/guide?stage=${stage}`
    }
  ];

  const tips = isGraduate ? [
    'Your degree is a starting point, not the whole story',
    "Projects and internships matter more than grades alone",
    "Soft skills like communication are highly valued",
    "Tailor each application to the specific role"
  ] : [
    'Internships are about learning, not just credentials',
    "Show enthusiasm and willingness to grow",
    "Relevant coursework and projects count",
    "Part-time work shows responsibility"
  ];

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header */}
      <header style={{
        padding: '16px 24px',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Logo />
        <button
          onClick={() => router.push('/candidates')}
          style={{
            padding: '8px 16px',
            backgroundColor: 'transparent',
            color: '#64748b',
            border: 'none',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          ← Back
        </button>
      </header>

      {/* Main content */}
      <main style={{
        maxWidth: '700px',
        margin: '0 auto',
        padding: '48px 24px'
      }}>
        {/* Welcome section */}
        <div style={{
          textAlign: 'center',
          marginBottom: '48px'
        }}>
          <div style={{
            display: 'inline-block',
            padding: '8px 16px',
            backgroundColor: '#eff6ff',
            color: '#3b82f6',
            borderRadius: '20px',
            fontSize: '14px',
            fontWeight: 600,
            marginBottom: '16px'
          }}>
            {isGraduate ? 'Recent Graduate' : 'Student'}
          </div>

          <h1 style={{
            fontSize: '32px',
            fontWeight: 700,
            color: '#0f172a',
            marginBottom: '12px'
          }}>
            {isGraduate
              ? "Let's launch your career"
              : "Let's get you started"}
          </h1>

          <p style={{
            fontSize: '16px',
            color: '#64748b',
            lineHeight: 1.6,
            maxWidth: '500px',
            margin: '0 auto'
          }}>
            {isGraduate
              ? "You've got the degree. Now let's show employers why they should hire you."
              : "Everyone starts somewhere. We'll help you build a profile that stands out."}
          </p>
        </div>

        {/* Path selection */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          marginBottom: '48px'
        }}>
          {paths.map((path) => (
            <button
              key={path.id}
              onClick={() => {
                setSelectedPath(path.id);
                router.push(path.action);
              }}
              style={{
                padding: '24px',
                backgroundColor: '#ffffff',
                border: `2px solid ${selectedPath === path.id ? '#4F46E5' : '#e2e8f0'}`,
                borderRadius: '16px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '16px'
              }}
              onMouseOver={(e) => {
                if (selectedPath !== path.id) {
                  e.currentTarget.style.borderColor = '#a5b4fc';
                  e.currentTarget.style.backgroundColor = '#fafafa';
                }
              }}
              onMouseOut={(e) => {
                if (selectedPath !== path.id) {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.backgroundColor = '#ffffff';
                }
              }}
            >
              <span style={{ fontSize: '32px' }}>{path.icon}</span>
              <div>
                <div style={{
                  fontSize: '18px',
                  fontWeight: 600,
                  color: '#0f172a',
                  marginBottom: '4px'
                }}>
                  {path.title}
                </div>
                <div style={{
                  fontSize: '14px',
                  color: '#64748b',
                  lineHeight: 1.5
                }}>
                  {path.description}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Tips section */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid #e2e8f0'
        }}>
          <h3 style={{
            fontSize: '14px',
            fontWeight: 600,
            color: '#64748b',
            textTransform: 'uppercase',
            marginBottom: '16px',
            letterSpacing: '0.05em'
          }}>
            {isGraduate ? 'Graduate Tips' : 'Student Tips'}
          </h3>

          <ul style={{
            margin: 0,
            padding: 0,
            listStyle: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {tips.map((tip, i) => (
              <li key={i} style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                fontSize: '14px',
                color: '#475569',
                lineHeight: 1.5
              }}>
                <span style={{ color: '#10B981', fontSize: '16px' }}>✓</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>

        {/* Encouragement */}
        <div style={{
          marginTop: '32px',
          padding: '20px',
          backgroundColor: '#f0fdf4',
          border: '1px solid #86efac',
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '14px', color: '#166534', lineHeight: 1.6 }}>
            <strong>Remember:</strong> Every expert was once a beginner. Your potential matters more than your experience.
          </div>
        </div>
      </main>

      {/* Support button */}
      <button
        aria-label="Get support"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          padding: '12px 20px',
          backgroundColor: '#0f172a',
          color: '#ffffff',
          border: 'none',
          borderRadius: '24px',
          fontSize: '14px',
          fontWeight: 500,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 50
        }}
      >
        <span aria-hidden="true">💬</span> Support
      </button>
    </div>
  );
}

export default function NewCareerPage() {
  return (
    <Suspense fallback={<div style={{ padding: '48px', textAlign: 'center' }}>Loading...</div>}>
      <NewCareerContent />
    </Suspense>
  );
}
