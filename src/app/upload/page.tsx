'use client';

import { useState, useCallback } from 'react';

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

// Brand Logo
const Logo = ({ size = 36, showText = true, showTagline = false }: { size?: number; showText?: boolean; showTagline?: boolean }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="12" fill="#4F46E5"/>
      <path d="M12 18L24 26L36 18V32C36 33.1 35.1 34 34 34H14C12.9 34 12 33.1 12 32V18Z" fill="white" fillOpacity="0.9"/>
      <path d="M34 14H14C12.9 14 12 14.9 12 16V18L24 26L36 18V16C36 14.9 35.1 14 34 14Z" fill="white"/>
      <circle cx="36" cy="12" r="9" fill="#10B981"/>
      <path d="M32.5 12L35 14.5L39.5 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
    {showText && (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: size > 30 ? '1.25rem' : '1rem', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
          <span style={{ color: '#0f172a' }}>Hire</span>
          <span style={{ color: '#4F46E5' }}>Inbox</span>
        </span>
        {showTagline && (
          <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 500, letterSpacing: '0.01em' }}>
            Less noise. Better hires.
          </span>
        )}
      </div>
    )}
  </div>
);

// Score Ring Component
const ScoreRing = ({ score }: { score: number }) => {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getColor = () => {
    if (score >= 80) return '#10B981';
    if (score >= 60) return '#4F46E5';
    if (score >= 40) return '#F59E0B';
    return '#EF4444';
  };

  return (
    <div style={{ position: 'relative', width: 120, height: 120 }}>
      <svg width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="#E2E8F0"
          strokeWidth="10"
        />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke={getColor()}
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
      </svg>
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '2rem', fontWeight: 700, color: getColor() }}>{score}</div>
        <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 500 }}>/ 100</div>
      </div>
    </div>
  );
};

// Priority Badge
const PriorityBadge = ({ priority }: { priority: 'HIGH' | 'MEDIUM' | 'LOW' }) => {
  const colors = {
    HIGH: { bg: '#FEE2E2', text: '#DC2626' },
    MEDIUM: { bg: '#FEF3C7', text: '#D97706' },
    LOW: { bg: '#DBEAFE', text: '#2563EB' }
  };

  return (
    <span style={{
      padding: '2px 8px',
      borderRadius: '4px',
      fontSize: '0.65rem',
      fontWeight: 600,
      backgroundColor: colors[priority].bg,
      color: colors[priority].text,
      textTransform: 'uppercase'
    }}>
      {priority}
    </span>
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

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#F8FAFC',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header */}
      <header style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #E2E8F0',
        padding: '16px 24px'
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Logo size={40} showText showTagline />
          <a
            href="/"
            style={{
              color: '#4F46E5',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: 500
            }}
          >
            For Employers
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px' }}>
        {!analysis ? (
          <>
            {/* Hero Section */}
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <h1 style={{
                fontSize: '2.5rem',
                fontWeight: 800,
                color: '#0F172A',
                marginBottom: 16,
                letterSpacing: '-0.02em'
              }}>
                Get instant feedback on your CV
              </h1>
              <p style={{
                fontSize: '1.125rem',
                color: '#64748B',
                maxWidth: 600,
                margin: '0 auto'
              }}>
                Our AI analyzes your CV like a recruiter would — identifying strengths,
                gaps, and specific improvements to help you stand out.
              </p>
            </div>

            {/* Upload Area */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              style={{
                backgroundColor: 'white',
                border: `2px dashed ${isDragging ? '#4F46E5' : '#E2E8F0'}`,
                borderRadius: 16,
                padding: 48,
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                transform: isDragging ? 'scale(1.01)' : 'scale(1)',
                boxShadow: isDragging ? '0 10px 40px rgba(79, 70, 229, 0.1)' : 'none'
              }}
              onClick={() => document.getElementById('file-input')?.click()}
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
                    width: 80,
                    height: 80,
                    backgroundColor: '#EEF2FF',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 24px'
                  }}>
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                  </div>
                  <p style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0F172A', marginBottom: 8 }}>
                    Drop your CV here or click to browse
                  </p>
                  <p style={{ fontSize: '0.875rem', color: '#94A3B8' }}>
                    PDF, Word, or text files up to 10MB
                  </p>
                </>
              ) : (
                <>
                  <div style={{
                    width: 80,
                    height: 80,
                    backgroundColor: '#D1FAE5',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 24px'
                  }}>
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                  <p style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0F172A', marginBottom: 8 }}>
                    {file.name}
                  </p>
                  <p style={{ fontSize: '0.875rem', color: '#94A3B8' }}>
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div style={{
                backgroundColor: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: 12,
                padding: 16,
                marginTop: 24,
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
              <div style={{ textAlign: 'center', marginTop: 32 }}>
                <button
                  onClick={analyzeCV}
                  disabled={isAnalyzing}
                  style={{
                    backgroundColor: '#4F46E5',
                    color: 'white',
                    padding: '16px 48px',
                    borderRadius: 12,
                    fontSize: '1rem',
                    fontWeight: 600,
                    border: 'none',
                    cursor: isAnalyzing ? 'wait' : 'pointer',
                    opacity: isAnalyzing ? 0.7 : 1,
                    transition: 'all 0.2s ease',
                    boxShadow: '0 4px 14px rgba(79, 70, 229, 0.3)'
                  }}
                >
                  {isAnalyzing ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" style={{ animation: 'spin 1s linear infinite' }}>
                        <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="60" strokeLinecap="round"/>
                      </svg>
                      Analyzing your CV...
                    </span>
                  ) : (
                    'Analyze My CV'
                  )}
                </button>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            )}

            {/* Features */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: 24,
              marginTop: 64
            }}>
              {[
                { icon: '⚡', title: 'Instant Analysis', desc: 'Get detailed feedback in seconds, not days' },
                { icon: '🎯', title: 'Actionable Advice', desc: 'Specific improvements you can make today' },
                { icon: '🔒', title: 'Private & Secure', desc: 'Your CV is analyzed and never stored' }
              ].map((feature, i) => (
                <div key={i} style={{
                  backgroundColor: 'white',
                  borderRadius: 12,
                  padding: 24,
                  border: '1px solid #E2E8F0'
                }}>
                  <div style={{ fontSize: '2rem', marginBottom: 12 }}>{feature.icon}</div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0F172A', marginBottom: 8 }}>
                    {feature.title}
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: '#64748B', margin: 0 }}>
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>
          </>
        ) : (
          /* Results View */
          <>
            {/* Results Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: 32
            }}>
              <div>
                <button
                  onClick={resetUpload}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#4F46E5',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    marginBottom: 16,
                    padding: 0
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="15 18 9 12 15 6"/>
                  </svg>
                  Analyze another CV
                </button>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>
                  CV Analysis for {analysis.candidate_name || 'Your CV'}
                </h1>
                {analysis.current_title && (
                  <p style={{ color: '#64748B', fontSize: '0.95rem' }}>
                    {analysis.current_title} {analysis.years_experience && `• ${analysis.years_experience} years experience`}
                  </p>
                )}
              </div>
              <ScoreRing score={analysis.overall_score} />
            </div>

            {/* Score Explanation Card */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: 12,
              padding: 20,
              marginBottom: 24,
              border: '1px solid #E2E8F0'
            }}>
              <h3 style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', marginBottom: 8 }}>
                First Impression
              </h3>
              <p style={{ fontSize: '1rem', color: '#0F172A', margin: 0, lineHeight: 1.6 }}>
                {analysis.first_impression}
              </p>
            </div>

            {/* Two Column Layout */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 24 }}>

              {/* Strengths */}
              <div style={{
                backgroundColor: 'white',
                borderRadius: 12,
                padding: 24,
                border: '1px solid #E2E8F0'
              }}>
                <h2 style={{
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: '#10B981',
                  marginBottom: 20,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Strengths
                </h2>
                {analysis.strengths.map((s, i) => (
                  <div key={i} style={{ marginBottom: 20, paddingBottom: 20, borderBottom: i < analysis.strengths.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                    <div style={{ fontWeight: 600, color: '#0F172A', marginBottom: 6 }}>{s.strength}</div>
                    <div style={{ fontSize: '0.85rem', color: '#64748B', fontStyle: 'italic', marginBottom: 6 }}>
                      &ldquo;{s.evidence}&rdquo;
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#10B981' }}>{s.impact}</div>
                  </div>
                ))}
              </div>

              {/* Improvements */}
              <div style={{
                backgroundColor: 'white',
                borderRadius: 12,
                padding: 24,
                border: '1px solid #E2E8F0'
              }}>
                <h2 style={{
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: '#F59E0B',
                  marginBottom: 20,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2v20M2 12h20"/>
                  </svg>
                  Areas to Improve
                </h2>
                {analysis.improvements.map((imp, i) => (
                  <div key={i} style={{ marginBottom: 20, paddingBottom: 20, borderBottom: i < analysis.improvements.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span style={{ fontWeight: 600, color: '#0F172A' }}>{imp.area}</span>
                      <PriorityBadge priority={imp.priority} />
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#94A3B8', marginBottom: 6 }}>
                      Current: {imp.current_state}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#0F172A' }}>{imp.suggestion}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Wins */}
            <div style={{
              backgroundColor: '#EEF2FF',
              borderRadius: 12,
              padding: 24,
              marginTop: 24
            }}>
              <h2 style={{
                fontSize: '1rem',
                fontWeight: 700,
                color: '#4F46E5',
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
                Quick Wins — Do These Today
              </h2>
              <div style={{ display: 'grid', gap: 12 }}>
                {analysis.quick_wins.map((win, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    backgroundColor: 'white',
                    padding: 16,
                    borderRadius: 8
                  }}>
                    <div style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      backgroundColor: '#4F46E5',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      flexShrink: 0
                    }}>
                      {i + 1}
                    </div>
                    <span style={{ color: '#0F172A', fontSize: '0.9rem' }}>{win}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Career Insights */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: 12,
              padding: 24,
              marginTop: 24,
              border: '1px solid #E2E8F0'
            }}>
              <h2 style={{
                fontSize: '1rem',
                fontWeight: 700,
                color: '#0F172A',
                marginBottom: 20
              }}>
                Career Insights
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24 }}>
                <div>
                  <h3 style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', marginBottom: 12 }}>
                    Best-Fit Roles
                  </h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {analysis.career_insights.natural_fit_roles.map((role, i) => (
                      <span key={i} style={{
                        backgroundColor: '#F1F5F9',
                        padding: '6px 12px',
                        borderRadius: 6,
                        fontSize: '0.85rem',
                        color: '#0F172A'
                      }}>
                        {role}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', marginBottom: 12 }}>
                    Target Industries
                  </h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {analysis.career_insights.industries.map((ind, i) => (
                      <span key={i} style={{
                        backgroundColor: '#F1F5F9',
                        padding: '6px 12px',
                        borderRadius: 6,
                        fontSize: '0.85rem',
                        color: '#0F172A'
                      }}>
                        {ind}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid #E2E8F0' }}>
                <h3 style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', marginBottom: 8 }}>
                  Career Trajectory
                </h3>
                <p style={{ color: '#0F172A', fontSize: '0.9rem', margin: 0, lineHeight: 1.6 }}>
                  {analysis.career_insights.trajectory_observation}
                </p>
              </div>
            </div>

            {/* Summary */}
            <div style={{
              backgroundColor: '#0F172A',
              borderRadius: 12,
              padding: 24,
              marginTop: 24,
              color: 'white'
            }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 12 }}>
                Summary
              </h2>
              <p style={{ fontSize: '0.95rem', lineHeight: 1.7, margin: 0, opacity: 0.9 }}>
                {analysis.summary}
              </p>
            </div>

            {/* CTA */}
            <div style={{ textAlign: 'center', marginTop: 48 }}>
              <p style={{ color: '#64748B', fontSize: '0.9rem', marginBottom: 16 }}>
                Ready to land your dream job?
              </p>
              <button
                onClick={resetUpload}
                style={{
                  backgroundColor: '#4F46E5',
                  color: 'white',
                  padding: '14px 36px',
                  borderRadius: 10,
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Analyze Another CV
              </button>
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer style={{
        textAlign: 'center',
        padding: '32px 24px',
        color: '#94A3B8',
        fontSize: '0.8rem'
      }}>
        <Logo size={28} showText />
        <p style={{ marginTop: 16 }}>
          Powered by AI. Built for job seekers.
        </p>
      </footer>
    </div>
  );
}
