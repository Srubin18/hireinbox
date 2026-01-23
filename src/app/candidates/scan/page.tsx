'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// ============================================
// HIREINBOX B2C - CV SCAN RESULTS
// /candidates/scan
//
// Free scan results:
// - Structure feedback
// - Clarity improvements
// - Strengths & gaps
// - ATS compatibility
// ============================================

interface StrengthItem {
  area: string;
  detail: string;
}

interface ImprovementItem {
  area: string;
  suggestion: string;
  priority: 'high' | 'medium' | 'low';
}

interface ScanResult {
  overallScore: number;
  candidateName: string;
  currentTitle: string;
  yearsExperience: number;
  strengths: StrengthItem[];
  improvements: ImprovementItem[];
  atsScore: number;
  atsIssues: string[];
  summary: string;
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
        <span style={{ color: '#0f172a' }}>Hire</span><span style={{ color: '#4F46E5' }}>Inbox</span>
      </div>
    </div>
  </div>
);

// Sample scan result
const sampleResult: ScanResult = {
  overallScore: 72,
  candidateName: 'Sarah Johnson',
  currentTitle: 'Marketing Coordinator',
  yearsExperience: 4,
  summary: 'Your CV shows solid marketing experience with good progression. The structure is clear but could be more impactful. Focus on quantifying achievements and tailoring to specific roles.',
  strengths: [
    { area: 'Experience progression', detail: 'Clear career growth from intern to coordinator over 4 years' },
    { area: 'Digital skills', detail: 'Strong digital marketing toolkit including SEO, Google Ads, and social media' },
    { area: 'Education', detail: 'Relevant BCom Marketing degree from reputable institution' },
    { area: 'Layout', detail: 'Clean, professional format that is easy to read' }
  ],
  improvements: [
    { area: 'Quantify achievements', suggestion: 'Add metrics: "Increased social engagement by X%" instead of "Managed social media"', priority: 'high' },
    { area: 'Summary section', suggestion: 'Add a 2-3 line professional summary at the top highlighting your value proposition', priority: 'high' },
    { area: 'Keywords', suggestion: 'Include industry keywords like "campaign management", "ROI", "lead generation"', priority: 'medium' },
    { area: 'Skills section', suggestion: 'Move skills higher and categorize into Technical, Marketing, and Soft skills', priority: 'medium' },
    { area: 'References', suggestion: 'Remove "References available on request" - it\'s assumed and wastes space', priority: 'low' }
  ],
  atsScore: 68,
  atsIssues: [
    'Missing keywords commonly found in marketing job descriptions',
    'Some formatting may not parse correctly in older ATS systems',
    'Consider using standard section headings (Experience, Education, Skills)'
  ]
};

const PRIORITY_STYLES = {
  high: { label: 'High', color: '#dc2626', bgColor: '#fee2e2' },
  medium: { label: 'Medium', color: '#d97706', bgColor: '#fef3c7' },
  low: { label: 'Low', color: '#64748b', bgColor: '#f1f5f9' }
};

function ScanResultsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stage = searchParams.get('stage') || 'experienced';

  const [result] = useState<ScanResult>(sampleResult);
  const [talentPoolOptIn, setTalentPoolOptIn] = useState(false);

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#059669';
    if (score >= 60) return '#d97706';
    return '#dc2626';
  };

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
          onClick={() => router.push('/candidates/dashboard')}
          style={{
            padding: '8px 16px',
            backgroundColor: '#4F46E5',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Go to Dashboard
        </button>
      </header>

      {/* Main content */}
      <main style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '32px 24px'
      }}>
        {/* Score header */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '32px',
          marginBottom: '24px',
          textAlign: 'center',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            border: `8px solid ${getScoreColor(result.overallScore)}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            backgroundColor: '#ffffff'
          }}>
            <span style={{
              fontSize: '36px',
              fontWeight: 700,
              color: getScoreColor(result.overallScore)
            }}>
              {result.overallScore}
            </span>
          </div>

          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
            Hi {result.candidateName}!
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '16px' }}>
            {result.currentTitle} • {result.yearsExperience} years experience
          </p>
          <p style={{
            fontSize: '15px',
            color: '#475569',
            lineHeight: 1.6,
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            {result.summary}
          </p>
        </div>

        {/* Strengths */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px',
          border: '1px solid #e2e8f0'
        }}>
          <h2 style={{
            fontSize: '18px',
            fontWeight: 700,
            color: '#0f172a',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ color: '#10B981' }}>✓</span> Strengths
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {result.strengths.map((item, i) => (
              <div
                key={i}
                style={{
                  padding: '16px',
                  backgroundColor: '#f0fdf4',
                  borderRadius: '10px',
                  borderLeft: '4px solid #10B981'
                }}
              >
                <div style={{ fontWeight: 600, color: '#166534', marginBottom: '4px' }}>
                  {item.area}
                </div>
                <div style={{ fontSize: '14px', color: '#475569' }}>
                  {item.detail}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Improvements */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px',
          border: '1px solid #e2e8f0'
        }}>
          <h2 style={{
            fontSize: '18px',
            fontWeight: 700,
            color: '#0f172a',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ color: '#f59e0b' }}>↑</span> Areas to Improve
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {result.improvements.map((item, i) => (
              <div
                key={i}
                style={{
                  padding: '16px',
                  backgroundColor: '#fefce8',
                  borderRadius: '10px',
                  borderLeft: `4px solid ${PRIORITY_STYLES[item.priority].color}`
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 600, color: '#854d0e' }}>{item.area}</span>
                  <span style={{
                    padding: '2px 8px',
                    backgroundColor: PRIORITY_STYLES[item.priority].bgColor,
                    color: PRIORITY_STYLES[item.priority].color,
                    borderRadius: '10px',
                    fontSize: '11px',
                    fontWeight: 500
                  }}>
                    {PRIORITY_STYLES[item.priority].label} priority
                  </span>
                </div>
                <div style={{ fontSize: '14px', color: '#475569' }}>
                  {item.suggestion}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ATS Score */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px',
          border: '1px solid #e2e8f0'
        }}>
          <h2 style={{
            fontSize: '18px',
            fontWeight: 700,
            color: '#0f172a',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>🤖</span> ATS Compatibility: {result.atsScore}%
          </h2>
          <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '16px' }}>
            How well your CV will be parsed by Applicant Tracking Systems
          </p>
          <div style={{
            height: '8px',
            backgroundColor: '#e2e8f0',
            borderRadius: '4px',
            overflow: 'hidden',
            marginBottom: '16px'
          }}>
            <div style={{
              height: '100%',
              width: `${result.atsScore}%`,
              backgroundColor: getScoreColor(result.atsScore),
              borderRadius: '4px'
            }} />
          </div>
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            {result.atsIssues.map((issue, i) => (
              <li key={i} style={{ fontSize: '14px', color: '#475569', marginBottom: '8px' }}>
                {issue}
              </li>
            ))}
          </ul>
        </div>

        {/* Talent Pool Opt-in */}
        <div style={{
          backgroundColor: '#faf5ff',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px',
          border: '1px solid #e9d5ff'
        }}>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={talentPoolOptIn}
              onChange={(e) => setTalentPoolOptIn(e.target.checked)}
              style={{ width: '20px', height: '20px', marginTop: '2px', accentColor: '#7c3aed' }}
            />
            <div>
              <div style={{ fontWeight: 600, color: '#5b21b6', marginBottom: '4px' }}>
                Join the Talent Pool
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280', lineHeight: 1.5 }}>
                Allow vetted employers to discover your profile. Your contact details remain private until you accept a connection.
              </div>
            </div>
          </label>
        </div>

        {/* Upsell CTA */}
        <div style={{
          backgroundColor: '#4F46E5',
          borderRadius: '16px',
          padding: '32px',
          textAlign: 'center',
          color: '#ffffff'
        }}>
          <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '12px' }}>
            Ready to stand out?
          </h3>
          <p style={{ fontSize: '15px', opacity: 0.9, marginBottom: '24px', lineHeight: 1.6 }}>
            Get personalized coaching, interview preparation, and video analysis to land your dream job.
          </p>
          <button
            onClick={() => router.push(`/candidates/upsells?stage=${stage}`)}
            style={{
              padding: '14px 32px',
              backgroundColor: '#ffffff',
              color: '#4F46E5',
              border: 'none',
              borderRadius: '10px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Explore Premium Services
          </button>
        </div>
      </main>

      {/* Support button */}
      <button
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
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}
      >
        <span>💬</span> Support
      </button>
    </div>
  );
}

export default function ScanResultsPage() {
  return (
    <Suspense fallback={<div style={{ padding: '48px', textAlign: 'center' }}>Loading...</div>}>
      <ScanResultsContent />
    </Suspense>
  );
}
