'use client';

import { useRouter } from 'next/navigation';

// ============================================
// HIREINBOX B2C ENTRY - /candidates
// Entry point for job seekers
// RALF AGENT 4 will build the full flow
// ============================================

export default function CandidatesPage() {
  const router = useRouter();

  const careerStages = [
    { id: 'student', label: 'Student', description: 'Still studying, looking for internships or entry-level roles' },
    { id: 'graduate', label: 'Graduate', description: 'Recently completed studies, starting my career' },
    { id: 'early-career', label: 'Early-career professional', description: '1-5 years of experience' },
    { id: 'experienced', label: 'Experienced professional', description: '5+ years in my field' },
    { id: 'transition', label: 'Career transition', description: 'Moving into a new industry or role' }
  ];

  const handleStageSelect = (stageId: string) => {
    // For now, route to upload page with stage parameter
    // RALF AGENT 4 will build the full onboarding flow
    router.push(`/upload?stage=${stageId}`);
  };

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
      {/* Logo */}
      <div style={{ marginBottom: '48px' }}>
        <svg width="64" height="64" viewBox="0 0 48 48" fill="none">
          <rect width="48" height="48" rx="12" fill="#4F46E5"/>
          <path d="M12 18L24 26L36 18V32C36 33.1 35.1 34 34 34H14C12.9 34 12 33.1 12 32V18Z" fill="white" fillOpacity="0.9"/>
          <path d="M34 14H14C12.9 14 12 14.9 12 16V18L24 26L36 18V16C36 14.9 35.1 14 34 14Z" fill="white"/>
          <circle cx="36" cy="12" r="9" fill="#10B981"/>
          <path d="M32.5 12L35 14.5L39.5 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      <h1 style={{
        fontSize: '32px',
        fontWeight: 700,
        color: '#0f172a',
        marginBottom: '16px',
        textAlign: 'center'
      }}>
        Let's get you ready
      </h1>

      <p style={{
        fontSize: '18px',
        color: '#64748b',
        marginBottom: '48px',
        textAlign: 'center',
        maxWidth: '500px',
        lineHeight: 1.6
      }}>
        Tell us where you are in your career so we can give you the most relevant feedback.
      </p>

      {/* Career stage selection */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        width: '100%',
        maxWidth: '500px'
      }}>
        {careerStages.map((stage) => (
          <button
            key={stage.id}
            onClick={() => handleStageSelect(stage.id)}
            style={{
              padding: '20px 24px',
              backgroundColor: '#ffffff',
              color: '#0f172a',
              border: '2px solid #e2e8f0',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              textAlign: 'left'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#f8fafc';
              e.currentTarget.style.borderColor = '#4F46E5';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#ffffff';
              e.currentTarget.style.borderColor = '#e2e8f0';
            }}
          >
            <div>{stage.label}</div>
            <div style={{
              fontSize: '13px',
              fontWeight: 400,
              color: '#64748b',
              marginTop: '4px'
            }}>
              {stage.description}
            </div>
          </button>
        ))}
      </div>

      {/* Back link */}
      <button
        onClick={() => router.push('/')}
        style={{
          marginTop: '48px',
          padding: '12px 24px',
          backgroundColor: 'transparent',
          color: '#64748b',
          border: 'none',
          fontSize: '14px',
          cursor: 'pointer'
        }}
      >
        ← Back to start
      </button>

      {/* Tagline footer */}
      <div style={{
        position: 'fixed',
        bottom: '24px',
        color: '#94a3b8',
        fontSize: '13px'
      }}>
        HireInbox — Less noise. More hires.
      </div>
    </div>
  );
}
