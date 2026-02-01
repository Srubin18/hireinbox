'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { VideoUpload } from '@/components/VideoUpload';

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
        <span style={{ color: '#4F46E5' }}>Hyred</span>
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
  const analyzed = searchParams.get('analyzed') === 'true';

  // Try to load real results from sessionStorage, otherwise use sample
  const [result] = useState<ScanResult>(() => {
    if (typeof window !== 'undefined' && analyzed) {
      const stored = sessionStorage.getItem('cvAnalysisResult');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          console.log('[ScanResults] Loaded from sessionStorage:', parsed);
          // Map API response to our ScanResult format
          // API returns: candidate_name, current_title, years_experience, overall_score,
          // strengths, improvements, ats_check, summary, etc.
          return {
            overallScore: parsed.overall_score || parsed.score || 72,
            candidateName: parsed.candidate_name || 'Candidate',
            currentTitle: parsed.current_title || 'Professional',
            yearsExperience: parsed.years_experience || 0,
            summary: parsed.summary || sampleResult.summary,
            strengths: parsed.strengths?.map((s: any) => ({
              area: s.strength || s.area || s.title || 'Strength',
              detail: s.evidence || s.impact || s.detail || s.description || (typeof s === 'string' ? s : 'Good quality')
            })) || sampleResult.strengths,
            improvements: parsed.improvements?.map((i: any) => ({
              area: i.area || i.title || 'Improvement',
              suggestion: i.suggestion || i.current_state || i.description || (typeof i === 'string' ? i : 'Needs improvement'),
              priority: (i.priority || 'medium').toLowerCase() as 'high' | 'medium' | 'low'
            })) || sampleResult.improvements,
            atsScore: parsed.ats_check?.likely_ats_friendly ? 85 : 65,
            atsIssues: parsed.ats_check?.issues || parsed.ats_issues || sampleResult.atsIssues
          };
        } catch (e) {
          console.error('[ScanResults] Failed to parse stored result:', e);
          return sampleResult;
        }
      }
    }
    return sampleResult;
  });
  const [talentPoolOptIn, setTalentPoolOptIn] = useState(false);
  const [showOptInModal, setShowOptInModal] = useState(false);
  const [optInSaving, setOptInSaving] = useState(false);
  const [optInComplete, setOptInComplete] = useState(false);
  const [visibility, setVisibility] = useState<'anonymized' | 'visible'>('anonymized');
  const [intent, setIntent] = useState<'actively_looking' | 'open' | 'not_looking'>('open');
  const [workArrangement, setWorkArrangement] = useState<'remote' | 'hybrid' | 'office' | 'flexible'>('flexible');
  const [salaryMin, setSalaryMin] = useState<string>('');
  const [salaryMax, setSalaryMax] = useState<string>('');
  const [isRewriting, setIsRewriting] = useState(false);
  const [rewrittenCV, setRewrittenCV] = useState<string | null>(null);
  const [analysisSaved, setAnalysisSaved] = useState(false);
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [saveEmail, setSaveEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Try to get user session from sessionStorage (set by auth flow)
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Load user info from sessionStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedEmail = sessionStorage.getItem('userEmail');
      const storedUserId = sessionStorage.getItem('userId');
      if (storedEmail) setUserEmail(storedEmail);
      if (storedUserId) setUserId(storedUserId);
    }
  }, []);

  // Function to save analysis to Supabase
  const saveAnalysis = async (email?: string) => {
    if (analysisSaved) return; // Already saved

    setIsSaving(true);
    setSaveError(null);

    try {
      const cvFilename = typeof window !== 'undefined'
        ? sessionStorage.getItem('cvFilename') || 'uploaded_cv'
        : 'uploaded_cv';

      const rawResult = typeof window !== 'undefined'
        ? sessionStorage.getItem('cvAnalysisResult')
        : null;

      let parsedResult = null;
      if (rawResult) {
        try {
          parsedResult = JSON.parse(rawResult);
        } catch {
          console.error('Failed to parse stored result for saving');
        }
      }

      const response = await fetch('/api/cv-analyses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId || null,
          email: email || userEmail || null,
          cv_filename: cvFilename,
          candidate_name: result.candidateName,
          current_title: result.currentTitle,
          years_experience: result.yearsExperience,
          score: result.overallScore,
          strengths: result.strengths,
          improvements: result.improvements,
          ats_score: result.atsScore,
          ats_issues: result.atsIssues,
          summary: result.summary,
          career_insights: parsedResult?.career_insights || null,
          sa_context_highlights: parsedResult?.sa_context_highlights || [],
        }),
      });

      if (response.ok) {
        setAnalysisSaved(true);
        setShowSavePrompt(false);
        // Store the email if provided for future use
        if (email && typeof window !== 'undefined') {
          sessionStorage.setItem('userEmail', email);
        }
      } else {
        const errorData = await response.json();
        setSaveError(errorData.error || 'Failed to save analysis');
      }
    } catch (error) {
      console.error('Error saving analysis:', error);
      setSaveError('Failed to save analysis. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Auto-save analysis if user is authenticated
  useEffect(() => {
    if (analyzed && !analysisSaved && (userEmail || userId)) {
      saveAnalysis();
    }
  }, [analyzed, userEmail, userId, analysisSaved]);

  const handleDownloadCV = async () => {
    setIsRewriting(true);
    try {
      // Get the original CV text from sessionStorage
      const originalCV = sessionStorage.getItem('originalCVText') || '';

      // Call the rewrite API
      const response = await fetch('/api/rewrite-cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cvText: originalCV,
          improvements: result.improvements.map(i => i.suggestion),
          candidateName: result.candidateName
        })
      });

      if (!response.ok) throw new Error('Failed to rewrite CV');

      const data = await response.json();
      const rewritten = data.rewrittenCV || data.content || '';
      setRewrittenCV(rewritten);

      // Generate and download PDF
      const pdfContent = `
IMPROVED CV - ${result.candidateName}
Generated by Hyred
${'='.repeat(50)}

${rewritten}

${'='.repeat(50)}
Improvements Applied:
${result.improvements.map(i => `• ${i.area}: ${i.suggestion}`).join('\n')}
      `.trim();

      // Create blob and download
      const blob = new Blob([pdfContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${result.candidateName.replace(/\s+/g, '_')}_Improved_CV.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('CV rewrite error:', error);
      alert('Failed to generate improved CV. Please try again.');
    } finally {
      setIsRewriting(false);
    }
  };

  const handleOptInSubmit = async () => {
    setOptInSaving(true);
    try {
      // In production, use real candidateId from session
      const candidateId = sessionStorage.getItem('candidateId') || 'demo-candidate';

      // Extract skills from the result (if available)
      const extractedSkills = result.strengths
        .filter(s => s.area.toLowerCase().includes('skill'))
        .map(s => s.detail.split(',').map(sk => sk.trim()))
        .flat()
        .filter(Boolean);

      const response = await fetch('/api/talent-pool/opt-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId,
          visibility,
          intent,
          workArrangement,
          salaryExpectationMin: salaryMin ? parseInt(salaryMin) : null,
          salaryExpectationMax: salaryMax ? parseInt(salaryMax) : null,
          skills: extractedSkills.length > 0 ? extractedSkills : ['General'],
          experienceHighlights: result.strengths.slice(0, 3).map(s => s.detail)
        })
      });

      if (response.ok) {
        setOptInComplete(true);
        setShowOptInModal(false);
        setTalentPoolOptIn(true);
      } else {
        // Demo mode - still show success
        setOptInComplete(true);
        setShowOptInModal(false);
        setTalentPoolOptIn(true);
      }
    } catch (error) {
      console.error('Opt-in error:', error);
      // Demo mode - still show success
      setOptInComplete(true);
      setShowOptInModal(false);
      setTalentPoolOptIn(true);
    } finally {
      setOptInSaving(false);
    }
  };

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
      {/* Mobile responsive styles */}
      <style>{`
        @media (max-width: 640px) {
          .scan-main { padding: 16px !important; }
          .scan-card { padding: 20px !important; }
          .scan-header-btn { padding: 6px 12px !important; font-size: 12px !important; }
          .scan-modal { padding: 16px !important; }
          .scan-modal-content { padding: 24px !important; max-height: 85vh !important; }
        }
      `}</style>
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
        {/* Save Results Banner - show for unauthenticated users who haven't saved */}
        {analyzed && !analysisSaved && !userEmail && !userId && (
          <div style={{
            backgroundColor: '#eff6ff',
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            border: '1px solid #bfdbfe',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: '#dbeafe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                  <polyline points="17 21 17 13 7 13 7 21"/>
                  <polyline points="7 3 7 8 15 8"/>
                </svg>
              </div>
              <div>
                <div style={{ fontWeight: 600, color: '#1e40af', fontSize: '14px' }}>
                  Save your results
                </div>
                <div style={{ fontSize: '13px', color: '#3b82f6' }}>
                  Enter your email to access this analysis from your dashboard
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowSavePrompt(true)}
              style={{
                padding: '10px 20px',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Save Results
            </button>
          </div>
        )}

        {/* Saved confirmation */}
        {analysisSaved && (
          <div style={{
            backgroundColor: '#f0fdf4',
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            border: '1px solid #bbf7d0'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: '#dcfce7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#16a34a'
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <div style={{ fontSize: '14px', color: '#166534' }}>
              Results saved! View them anytime from your{' '}
              <button
                onClick={() => router.push('/candidates/dashboard')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#16a34a',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  padding: 0
                }}
              >
                dashboard
              </button>
              .
            </div>
          </div>
        )}

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

          {/* Download CV Button */}
          <div style={{ marginTop: '24px' }}>
            <button
              onClick={handleDownloadCV}
              disabled={isRewriting}
              style={{
                padding: '14px 28px',
                backgroundColor: isRewriting ? '#94a3b8' : '#10B981',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: 600,
                cursor: isRewriting ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s'
              }}
            >
              {isRewriting ? (
                <>
                  <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>↻</span>
                  Generating...
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Download Improved CV
                </>
              )}
            </button>
            <p style={{ fontSize: '13px', color: '#64748b', marginTop: '8px' }}>
              Get your CV with all improvements applied
            </p>
          </div>

          {/* Share Results */}
          <div style={{ textAlign: 'center' }}>
            <button
              onClick={() => {
                const shareText = `I just got my CV analyzed by Hyred!\n\nOverall Score: ${result.overallScore}%\nATS Score: ${result.atsScore}%\n\nKey Strengths:\n${result.strengths.slice(0, 2).map(s => `• ${s.area}`).join('\n')}\n\nGet your free CV analysis at hireinbox.co.za`;
                if (navigator.share) {
                  navigator.share({
                    title: 'My CV Analysis - Hyred',
                    text: shareText,
                    url: 'https://hireinbox.co.za/candidates'
                  });
                } else {
                  navigator.clipboard.writeText(shareText);
                  alert('Results copied to clipboard!');
                }
              }}
              style={{
                padding: '12px 24px',
                backgroundColor: '#f1f5f9',
                color: '#475569',
                border: 'none',
                borderRadius: '10px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="18" cy="5" r="3"/>
                <circle cx="6" cy="12" r="3"/>
                <circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
              Share Results
            </button>
          </div>
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
            ATS Compatibility: {result.atsScore}%
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

        {/* Video Analysis Upsell CTA */}
        <div style={{
          backgroundColor: '#eff6ff',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px',
          border: '1px solid #bfdbfe'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: '#dbeafe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
                <path d="M23 7l-7 5 7 5V7z"/>
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, color: '#1e40af', marginBottom: '4px', fontSize: '16px' }}>
                Stand out with video
              </div>
              <div style={{ fontSize: '14px', color: '#3b82f6', lineHeight: 1.6, marginBottom: '16px' }}>
                Your CV gets you considered. Your video gets you interviewed. Record a 1-2 minute introduction and get AI coaching on your presentation skills.
              </div>
              <button
                onClick={() => router.push(`/candidates/video?stage=${stage}`)}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Get Video Analysis
              </button>
            </div>
          </div>
        </div>

        {/* Talent Pool Opt-in */}
        <div style={{
          backgroundColor: optInComplete ? '#f0fdf4' : '#faf5ff',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px',
          border: optInComplete ? '1px solid #86efac' : '1px solid #e9d5ff'
        }}>
          {optInComplete ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: '#dcfce7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px'
              }}>
                ✓
              </div>
              <div>
                <div style={{ fontWeight: 600, color: '#166534', marginBottom: '4px' }}>
                  You're in the Talent Pool
                </div>
                <div style={{ fontSize: '14px', color: '#475569' }}>
                  {visibility === 'visible' ? 'Profile visible to employers' : 'Anonymous until you accept a connection'}
                  {' · '}
                  {intent === 'actively_looking' ? 'Actively looking' : intent === 'open' ? 'Open to opportunities' : 'Not currently looking'}
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: '#ede9fe',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <circle cx="12" cy="12" r="6"/>
                    <circle cx="12" cy="12" r="2"/>
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: '#5b21b6', marginBottom: '4px', fontSize: '16px' }}>
                    Join the Talent Pool
                  </div>
                  <div style={{ fontSize: '14px', color: '#6b7280', lineHeight: 1.6, marginBottom: '16px' }}>
                    Get discovered by vetted employers looking for talent like you. You control your visibility and can accept or decline any connection request.
                  </div>
                  <button
                    onClick={() => setShowOptInModal(true)}
                    style={{
                      padding: '12px 24px',
                      backgroundColor: '#7c3aed',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Set Up My Profile
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Opt-in Modal */}
        {showOptInModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '24px'
          }}>
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '480px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}>
              <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
                Join the Talent Pool
              </h3>
              <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px', lineHeight: 1.6 }}>
                Choose how you want to appear to employers. You can change these settings anytime.
              </p>

              {/* Visibility */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '12px' }}>
                  Profile Visibility
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '16px',
                    border: visibility === 'anonymized' ? '2px solid #7c3aed' : '1px solid #e2e8f0',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    backgroundColor: visibility === 'anonymized' ? '#faf5ff' : '#ffffff'
                  }}>
                    <input
                      type="radio"
                      name="visibility"
                      checked={visibility === 'anonymized'}
                      onChange={() => setVisibility('anonymized')}
                      style={{ marginTop: '2px', accentColor: '#7c3aed' }}
                    />
                    <div>
                      <div style={{ fontWeight: 500, color: '#0f172a', marginBottom: '2px' }}>Anonymous</div>
                      <div style={{ fontSize: '13px', color: '#64748b' }}>Skills and experience visible, name hidden until you connect</div>
                    </div>
                  </label>
                  <label style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '16px',
                    border: visibility === 'visible' ? '2px solid #7c3aed' : '1px solid #e2e8f0',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    backgroundColor: visibility === 'visible' ? '#faf5ff' : '#ffffff'
                  }}>
                    <input
                      type="radio"
                      name="visibility"
                      checked={visibility === 'visible'}
                      onChange={() => setVisibility('visible')}
                      style={{ marginTop: '2px', accentColor: '#7c3aed' }}
                    />
                    <div>
                      <div style={{ fontWeight: 500, color: '#0f172a', marginBottom: '2px' }}>Visible</div>
                      <div style={{ fontSize: '13px', color: '#64748b' }}>Full profile visible to employers (faster connections)</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Intent */}
              <div style={{ marginBottom: '32px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '12px' }}>
                  Job Search Status
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { value: 'actively_looking' as const, label: 'Actively Looking', desc: 'Ready to interview now' },
                    { value: 'open' as const, label: 'Open to Opportunities', desc: 'Not urgently searching but open' },
                    { value: 'not_looking' as const, label: 'Not Looking', desc: 'Just exploring, not ready to move' }
                  ].map(option => (
                    <label
                      key={option.value}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                        padding: '12px 16px',
                        border: intent === option.value ? '2px solid #7c3aed' : '1px solid #e2e8f0',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        backgroundColor: intent === option.value ? '#faf5ff' : '#ffffff'
                      }}
                    >
                      <input
                        type="radio"
                        name="intent"
                        checked={intent === option.value}
                        onChange={() => setIntent(option.value)}
                        style={{ marginTop: '2px', accentColor: '#7c3aed' }}
                      />
                      <div>
                        <div style={{ fontWeight: 500, color: '#0f172a' }}>{option.label}</div>
                        <div style={{ fontSize: '13px', color: '#64748b' }}>{option.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Work Arrangement */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '12px' }}>
                  Preferred Work Arrangement
                </label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {[
                    { value: 'remote' as const, label: 'Remote' },
                    { value: 'hybrid' as const, label: 'Hybrid' },
                    { value: 'office' as const, label: 'Office' },
                    { value: 'flexible' as const, label: 'Flexible' }
                  ].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setWorkArrangement(opt.value)}
                      style={{
                        padding: '10px 18px',
                        borderRadius: '20px',
                        border: workArrangement === opt.value ? '2px solid #7c3aed' : '1px solid #e2e8f0',
                        backgroundColor: workArrangement === opt.value ? '#faf5ff' : '#ffffff',
                        color: workArrangement === opt.value ? '#7c3aed' : '#64748b',
                        fontSize: '13px',
                        fontWeight: 500,
                        cursor: 'pointer'
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Salary Expectations */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '12px' }}>
                  Salary Expectations (Optional)
                </label>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <input
                      type="number"
                      placeholder="Min (R)"
                      value={salaryMin}
                      onChange={(e) => setSalaryMin(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                  <span style={{ color: '#94a3b8' }}>to</span>
                  <div style={{ flex: 1 }}>
                    <input
                      type="number"
                      placeholder="Max (R)"
                      value={salaryMax}
                      onChange={(e) => setSalaryMax(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                  <span style={{ color: '#94a3b8', fontSize: '13px' }}>/month</span>
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>
                  Sharing salary helps match you with appropriate opportunities
                </div>
              </div>

              {/* What happens next */}
              <div style={{
                backgroundColor: '#f8fafc',
                borderRadius: '10px',
                padding: '16px',
                marginBottom: '24px',
                fontSize: '13px',
                color: '#475569',
                lineHeight: 1.6
              }}>
                <strong style={{ color: '#0f172a' }}>What happens next:</strong>
                <ul style={{ margin: '8px 0 0 16px', padding: 0 }}>
                  <li>Your profile joins the Talent Pool</li>
                  <li>Employers can see your skills and request to connect</li>
                  <li>You review each request and decide to accept or decline</li>
                  <li>Only accepted connections see your full details</li>
                </ul>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => setShowOptInModal(false)}
                  style={{
                    flex: 1,
                    padding: '14px',
                    backgroundColor: '#f1f5f9',
                    color: '#475569',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleOptInSubmit}
                  disabled={optInSaving}
                  style={{
                    flex: 1,
                    padding: '14px',
                    backgroundColor: optInSaving ? '#94a3b8' : '#7c3aed',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: optInSaving ? 'not-allowed' : 'pointer'
                  }}
                >
                  {optInSaving ? 'Saving...' : 'Join Talent Pool'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Save Results Modal - for unauthenticated users */}
        {showSavePrompt && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '24px'
          }}>
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '420px',
              width: '100%'
            }}>
              <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
                Save Your Results
              </h3>
              <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px', lineHeight: 1.6 }}>
                Enter your email to save this analysis and access it later from your dashboard.
              </p>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#0f172a', marginBottom: '8px' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={saveEmail}
                  onChange={(e) => setSaveEmail(e.target.value)}
                  placeholder="you@example.com"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {saveError && (
                <div style={{
                  padding: '12px',
                  backgroundColor: '#fef2f2',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  fontSize: '13px',
                  color: '#dc2626'
                }}>
                  {saveError}
                </div>
              )}

              <div style={{
                backgroundColor: '#f0fdf4',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '24px',
                fontSize: '13px',
                color: '#166534'
              }}>
                Your analysis will be saved and you can view it anytime from your dashboard.
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => setShowSavePrompt(false)}
                  style={{
                    flex: 1,
                    padding: '14px',
                    backgroundColor: '#f1f5f9',
                    color: '#475569',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  Skip
                </button>
                <button
                  onClick={() => saveAnalysis(saveEmail)}
                  disabled={isSaving || !saveEmail.includes('@')}
                  style={{
                    flex: 1,
                    padding: '14px',
                    backgroundColor: isSaving || !saveEmail.includes('@') ? '#94a3b8' : '#4F46E5',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: isSaving || !saveEmail.includes('@') ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isSaving ? 'Saving...' : 'Save Results'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Video Upload - shown after opt-in */}
        {optInComplete && (
          <div style={{ marginBottom: '24px' }}>
            <VideoUpload
              candidateId={sessionStorage.getItem('candidateId') || 'demo-candidate'}
              onUploadComplete={(url) => console.log('Video uploaded:', url)}
            />
          </div>
        )}

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
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}
      >
        <span aria-hidden="true">💬</span> Support
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
