'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// ============================================
// HIREINBOX B2C - CAREER GUIDE
// /candidates/guide
//
// Educational content for students and graduates
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
        <span style={{ color: '#0f172a' }}>Hire</span><span style={{ color: '#4F46E5' }}>Inbox</span>
      </div>
    </div>
  </div>
);

interface GuideSection {
  title: string;
  points: string[];
}

function GuideContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stage = searchParams.get('stage') || 'student';
  const isGraduate = stage === 'graduate';

  const studentGuide: GuideSection[] = [
    {
      title: 'What employers look for in interns',
      points: [
        'Enthusiasm and willingness to learn',
        'Basic technical skills relevant to the role',
        'Good communication and teamwork',
        'Problem-solving ability',
        'Reliability and professionalism'
      ]
    },
    {
      title: 'Building experience while studying',
      points: [
        'Take on projects in your coursework seriously',
        'Volunteer for relevant causes',
        'Join clubs and societies in your field',
        'Do freelance or part-time work if possible',
        'Build a portfolio of personal projects'
      ]
    },
    {
      title: 'Making your application stand out',
      points: [
        'Tailor your CV to each internship',
        'Write a compelling cover letter',
        'Show genuine interest in the company',
        'Highlight transferable skills from any experience',
        'Follow up professionally after applying'
      ]
    }
  ];

  const graduateGuide: GuideSection[] = [
    {
      title: 'What employers want from graduates',
      points: [
        'Relevant degree or coursework',
        'Practical experience (internships, projects)',
        'Strong communication skills',
        'Cultural fit and enthusiasm',
        'Ability to learn quickly'
      ]
    },
    {
      title: 'Positioning yourself competitively',
      points: [
        "Your degree opens doors, but doesn't guarantee entry",
        'Combine academic knowledge with practical examples',
        "Show you understand the industry, not just theory",
        'Demonstrate self-initiative through side projects',
        'Network through alumni and LinkedIn'
      ]
    },
    {
      title: 'Interview preparation',
      points: [
        'Research the company thoroughly',
        "Prepare STAR examples (Situation, Task, Action, Result)",
        'Practice common questions out loud',
        'Prepare thoughtful questions to ask them',
        'Dress appropriately and arrive early'
      ]
    }
  ];

  const guide = isGraduate ? graduateGuide : studentGuide;

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
          onClick={() => router.push(`/candidates/new-career?stage=${stage}`)}
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
        <h1 style={{
          fontSize: '28px',
          fontWeight: 700,
          color: '#0f172a',
          marginBottom: '12px',
          textAlign: 'center'
        }}>
          {isGraduate ? 'Graduate Career Guide' : 'Student Internship Guide'}
        </h1>

        <p style={{
          fontSize: '16px',
          color: '#64748b',
          textAlign: 'center',
          marginBottom: '48px',
          lineHeight: 1.6
        }}>
          {isGraduate
            ? 'Everything you need to know about landing your first graduate role.'
            : 'A quick guide to securing your first internship.'}
        </p>

        {/* Guide sections */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          marginBottom: '48px'
        }}>
          {guide.map((section, i) => (
            <div
              key={i}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                padding: '24px',
                border: '1px solid #e2e8f0'
              }}
            >
              <h3 style={{
                fontSize: '18px',
                fontWeight: 600,
                color: '#0f172a',
                marginBottom: '16px'
              }}>
                {section.title}
              </h3>

              <ul style={{
                margin: 0,
                padding: 0,
                listStyle: 'none',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                {section.points.map((point, j) => (
                  <li key={j} style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    fontSize: '14px',
                    color: '#475569',
                    lineHeight: 1.5
                  }}>
                    <span style={{ color: '#4F46E5', fontSize: '16px' }}>•</span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{
          backgroundColor: '#4F46E5',
          borderRadius: '16px',
          padding: '32px',
          textAlign: 'center'
        }}>
          <h3 style={{
            fontSize: '20px',
            fontWeight: 700,
            color: '#ffffff',
            marginBottom: '12px'
          }}>
            Ready to get started?
          </h3>
          <p style={{
            fontSize: '14px',
            color: 'rgba(255,255,255,0.85)',
            marginBottom: '24px'
          }}>
            {isGraduate
              ? "Let's get your CV ready and help you stand out from other graduates."
              : "Let's build your first CV and prepare you for internship applications."}
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => router.push(`/candidates/cv?stage=${stage}`)}
              style={{
                padding: '14px 28px',
                backgroundColor: '#ffffff',
                color: '#4F46E5',
                border: 'none',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Review my CV
            </button>
            <button
              onClick={() => router.push(`/candidates/create?stage=${stage}`)}
              style={{
                padding: '14px 28px',
                backgroundColor: 'transparent',
                color: '#ffffff',
                border: '2px solid rgba(255,255,255,0.5)',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Create a CV
            </button>
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

export default function GuidePage() {
  return (
    <Suspense fallback={<div style={{ padding: '48px', textAlign: 'center' }}>Loading...</div>}>
      <GuideContent />
    </Suspense>
  );
}
