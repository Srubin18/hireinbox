'use client';

import { useState, useCallback } from 'react';

/* ===========================================
   HIREINBOX B2C - ChatGPT-Clean Interface
   "Psychologically attractive. Minimal. Trustworthy."
   =========================================== */

// Types
interface StrengthItem {
  strength: string;
  evidence: string;
  impact: string;
}

interface ImprovementItem {
  area: string;
  current_state: string;
  suggestion: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

interface CareerInsights {
  natural_fit_roles: string[];
  industries: string[];
  trajectory_observation: string;
}

interface CVAnalysis {
  candidate_name: string | null;
  current_title: string | null;
  years_experience: number | null;
  education_level: string | null;
  overall_score: number;
  score_explanation: string;
  first_impression: string;
  strengths: StrengthItem[];
  improvements: ImprovementItem[];
  quick_wins: string[];
  career_insights: CareerInsights;
  summary: string;
}

// Minimal Logo
const Logo = ({ size = 32 }: { size?: number }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="12" fill="#4F46E5"/>
      <path d="M12 18L24 26L36 18V32C36 33.1 35.1 34 34 34H14C12.9 34 12 33.1 12 32V18Z" fill="white" fillOpacity="0.9"/>
      <path d="M34 14H14C12.9 14 12 14.9 12 16V18L24 26L36 18V16C36 14.9 35.1 14 34 14Z" fill="white"/>
      <circle cx="36" cy="12" r="9" fill="#10B981"/>
      <path d="M32.5 12L35 14.5L39.5 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
    <span style={{ fontSize: '1.1rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
      <span style={{ color: '#0f172a' }}>Hire</span>
      <span style={{ color: '#4F46E5' }}>Inbox</span>
    </span>
  </div>
);

// Score Display
const ScoreDisplay = ({ score }: { score: number }) => {
  const getColor = () => {
    if (score >= 80) return '#10B981';
    if (score >= 60) return '#4F46E5';
    if (score >= 40) return '#F59E0B';
    return '#EF4444';
  };

  const getLabel = () => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Needs Work';
    return 'Major Improvements Needed';
  };

  return (
    <div style={{ textAlign: 'center', padding: '32px 0' }}>
      <div style={{
        fontSize: '4rem',
        fontWeight: 700,
        color: getColor(),
        lineHeight: 1
      }}>
        {score}
      </div>
      <div style={{
        fontSize: '0.875rem',
        color: '#64748B',
        marginTop: 8,
        fontWeight: 500
      }}>
        {getLabel()}
      </div>
    </div>
  );
};

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<CVAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      setError(null);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  }, []);

  const analyzeCV = async () => {
    if (!file) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('cv', file);

      const response = await fetch('/api/analyze-cv', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Analysis failed');
      }

      setAnalysis(data.analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetUpload = () => {
    setFile(null);
    setAnalysis(null);
    setError(null);
  };

  // ChatGPT-style clean design
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#ffffff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Minimal Header */}
      <header style={{
        padding: '20px 32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid #f1f5f9'
      }}>
        <Logo size={32} />
        <a href="/" style={{
          color: '#64748B',
          textDecoration: 'none',
          fontSize: '0.875rem',
          fontWeight: 500,
          padding: '8px 16px',
          borderRadius: 8,
          transition: 'background 0.2s',
        }}>
          For Employers
        </a>
      </header>

      {/* Main Content - Centered */}
      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: analysis ? 'flex-start' : 'center',
        padding: '48px 24px',
        maxWidth: 720,
        margin: '0 auto',
        width: '100%'
      }}>
        {!analysis ? (
          <>
            {/* Hero - Minimal */}
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <h1 style={{
                fontSize: '2.25rem',
                fontWeight: 700,
                color: '#0F172A',
                marginBottom: 12,
                letterSpacing: '-0.03em',
                lineHeight: 1.2
              }}>
                Get instant CV feedback
              </h1>
              <p style={{
                fontSize: '1.0625rem',
                color: '#64748B',
                lineHeight: 1.6
              }}>
                See exactly what recruiters see. Improve before you apply.
              </p>
            </div>

            {/* Upload Area - Clean Box */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !file && document.getElementById('file-input')?.click()}
              style={{
                width: '100%',
                backgroundColor: isDragging ? '#F8FAFC' : '#FAFAFA',
                border: `2px dashed ${isDragging ? '#4F46E5' : file ? '#10B981' : '#E2E8F0'}`,
                borderRadius: 16,
                padding: file ? '24px 32px' : '48px 32px',
                textAlign: 'center',
                cursor: file ? 'default' : 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <input
                id="file-input"
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />

              {!file ? (
                <>
                  <div style={{
                    width: 56,
                    height: 56,
                    backgroundColor: '#EEF2FF',
                    borderRadius: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px'
                  }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                  </div>
                  <p style={{ fontSize: '1rem', fontWeight: 600, color: '#0F172A', marginBottom: 4 }}>
                    Drop your CV here
                  </p>
                  <p style={{ fontSize: '0.875rem', color: '#94A3B8' }}>
                    or click to browse • PDF, Word, TXT
                  </p>
                </>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 40,
                      height: 40,
                      backgroundColor: '#D1FAE5',
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#0F172A', margin: 0 }}>
                        {file.name}
                      </p>
                      <p style={{ fontSize: '0.8125rem', color: '#94A3B8', margin: 0 }}>
                        {(file.size / 1024).toFixed(0)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setFile(null); }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#94A3B8',
                      cursor: 'pointer',
                      padding: 8
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div style={{
                width: '100%',
                backgroundColor: '#FEF2F2',
                borderRadius: 12,
                padding: 16,
                marginTop: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 12
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span style={{ color: '#DC2626', fontSize: '0.875rem' }}>{error}</span>
              </div>
            )}

            {/* Analyze Button */}
            {file && (
              <button
                onClick={analyzeCV}
                disabled={isAnalyzing}
                style={{
                  marginTop: 24,
                  backgroundColor: '#4F46E5',
                  color: 'white',
                  padding: '14px 32px',
                  borderRadius: 10,
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  border: 'none',
                  cursor: isAnalyzing ? 'wait' : 'pointer',
                  opacity: isAnalyzing ? 0.7 : 1,
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10
                }}
              >
                {isAnalyzing ? (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" style={{ animation: 'spin 1s linear infinite' }}>
                      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="60" strokeLinecap="round"/>
                    </svg>
                    Analyzing...
                  </>
                ) : (
                  'Analyze my CV'
                )}
              </button>
            )}
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

            {/* Trust Indicators - Subtle */}
            <div style={{
              display: 'flex',
              gap: 24,
              marginTop: 48,
              color: '#94A3B8',
              fontSize: '0.8125rem'
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                Private & secure
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                Results in seconds
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                Free forever
              </span>
            </div>
          </>
        ) : (
          /* ============ RESULTS VIEW ============ */
          <div style={{ width: '100%' }}>
            {/* Back Button */}
            <button
              onClick={resetUpload}
              style={{
                background: 'none',
                border: 'none',
                color: '#64748B',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginBottom: 24,
                padding: 0
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
              New analysis
            </button>

            {/* Score + Name */}
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <ScoreDisplay score={analysis.overall_score} />
              <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                {analysis.candidate_name || 'Your CV'}
              </h1>
              {analysis.current_title && (
                <p style={{ color: '#64748B', fontSize: '0.9375rem', marginTop: 4 }}>
                  {analysis.current_title}
                </p>
              )}
            </div>

            {/* First Impression */}
            <div style={{
              backgroundColor: '#F8FAFC',
              borderRadius: 12,
              padding: 20,
              marginBottom: 24
            }}>
              <p style={{ margin: 0, color: '#0F172A', lineHeight: 1.6 }}>
                {analysis.first_impression}
              </p>
            </div>

            {/* Quick Wins - Most Important */}
            <div style={{ marginBottom: 32 }}>
              <h2 style={{
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#4F46E5',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: 16
              }}>
                Do This Today
              </h2>
              {analysis.quick_wins.map((win, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  padding: '12px 0',
                  borderBottom: i < analysis.quick_wins.length - 1 ? '1px solid #F1F5F9' : 'none'
                }}>
                  <div style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    backgroundColor: '#EEF2FF',
                    color: '#4F46E5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    flexShrink: 0
                  }}>
                    {i + 1}
                  </div>
                  <span style={{ color: '#0F172A', fontSize: '0.9375rem', lineHeight: 1.5 }}>{win}</span>
                </div>
              ))}
            </div>

            {/* Strengths */}
            <div style={{ marginBottom: 32 }}>
              <h2 style={{
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#10B981',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: 16
              }}>
                What Works
              </h2>
              {analysis.strengths.map((s, i) => (
                <div key={i} style={{
                  padding: '16px 0',
                  borderBottom: i < analysis.strengths.length - 1 ? '1px solid #F1F5F9' : 'none'
                }}>
                  <div style={{ fontWeight: 600, color: '#0F172A', marginBottom: 4 }}>{s.strength}</div>
                  <div style={{ fontSize: '0.875rem', color: '#64748B', fontStyle: 'italic' }}>
                    &ldquo;{s.evidence}&rdquo;
                  </div>
                </div>
              ))}
            </div>

            {/* Improvements */}
            <div style={{ marginBottom: 32 }}>
              <h2 style={{
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#F59E0B',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: 16
              }}>
                What to Improve
              </h2>
              {analysis.improvements.map((imp, i) => (
                <div key={i} style={{
                  padding: '16px 0',
                  borderBottom: i < analysis.improvements.length - 1 ? '1px solid #F1F5F9' : 'none'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, color: '#0F172A' }}>{imp.area}</span>
                    <span style={{
                      padding: '2px 6px',
                      borderRadius: 4,
                      fontSize: '0.625rem',
                      fontWeight: 600,
                      backgroundColor: imp.priority === 'HIGH' ? '#FEE2E2' : imp.priority === 'MEDIUM' ? '#FEF3C7' : '#DBEAFE',
                      color: imp.priority === 'HIGH' ? '#DC2626' : imp.priority === 'MEDIUM' ? '#D97706' : '#2563EB'
                    }}>
                      {imp.priority}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#64748B' }}>{imp.suggestion}</div>
                </div>
              ))}
            </div>

            {/* Career Fit */}
            <div style={{
              backgroundColor: '#0F172A',
              borderRadius: 12,
              padding: 24,
              color: 'white',
              marginBottom: 32
            }}>
              <h2 style={{
                fontSize: '0.875rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: 16,
                opacity: 0.7
              }}>
                Best Fit Roles
              </h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                {analysis.career_insights.natural_fit_roles.map((role, i) => (
                  <span key={i} style={{
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    padding: '6px 12px',
                    borderRadius: 6,
                    fontSize: '0.875rem'
                  }}>
                    {role}
                  </span>
                ))}
              </div>
              <p style={{ fontSize: '0.9375rem', lineHeight: 1.6, margin: 0, opacity: 0.85 }}>
                {analysis.career_insights.trajectory_observation}
              </p>
            </div>

            {/* Summary */}
            <div style={{
              backgroundColor: '#F8FAFC',
              borderRadius: 12,
              padding: 24,
              marginBottom: 32
            }}>
              <h2 style={{
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#64748B',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: 12
              }}>
                Summary
              </h2>
              <p style={{ margin: 0, color: '#0F172A', lineHeight: 1.7 }}>
                {analysis.summary}
              </p>
            </div>

            {/* CTA */}
            <div style={{ textAlign: 'center' }}>
              <button
                onClick={resetUpload}
                style={{
                  backgroundColor: '#4F46E5',
                  color: 'white',
                  padding: '14px 32px',
                  borderRadius: 10,
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Analyze another CV
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Minimal Footer */}
      <footer style={{
        textAlign: 'center',
        padding: '24px',
        color: '#CBD5E1',
        fontSize: '0.75rem'
      }}>
        Powered by HireInbox AI
      </footer>
    </div>
  );
}
