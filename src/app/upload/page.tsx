'use client';

import { useState, useCallback } from 'react';

/* ===========================================
   HIREINBOX B2C - World-Class CV Analysis
   Matching the premium design reference
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
  natural_fit_roles: Array<{ role: string; match: number }> | string[];
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

// Logo Component
const Logo = ({ size = 32 }: { size?: number }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="12" fill="#4F46E5"/>
      <path d="M12 18L24 26L36 18V32C36 33.1 35.1 34 34 34H14C12.9 34 12 33.1 12 32V18Z" fill="white" fillOpacity="0.9"/>
      <path d="M34 14H14C12.9 14 12 14.9 12 16V18L24 26L36 18V16C36 14.9 35.1 14 34 14Z" fill="white"/>
      <circle cx="36" cy="12" r="9" fill="#10B981"/>
      <path d="M32.5 12L35 14.5L39.5 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <span style={{ fontSize: size > 28 ? '1.15rem' : '1rem', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
        <span style={{ color: '#0f172a' }}>Hire</span>
        <span style={{ color: '#4F46E5' }}>Inbox</span>
      </span>
      <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 500 }}>Less noise. Better hires.</span>
    </div>
  </div>
);

// Circular Score Component
const CircularScore = ({ score }: { score: number }) => {
  const radius = 80;
  const stroke = 10;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getColor = () => {
    if (score >= 80) return '#8B5CF6';
    if (score >= 60) return '#8B5CF6';
    if (score >= 40) return '#F59E0B';
    return '#EF4444';
  };

  return (
    <div style={{ position: 'relative', width: radius * 2, height: radius * 2 }}>
      <svg width={radius * 2} height={radius * 2} style={{ transform: 'rotate(-90deg)' }}>
        {/* Background circle */}
        <circle
          stroke="#E5E7EB"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        {/* Progress circle */}
        <circle
          stroke={getColor()}
          fill="transparent"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference + ' ' + circumference}
          style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.5s ease' }}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
      </svg>
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '3rem', fontWeight: 700, color: '#0F172A', lineHeight: 1 }}>{score}</div>
        <div style={{ fontSize: '0.875rem', color: '#6B7280' }}>out of 100</div>
      </div>
    </div>
  );
};

// Role icon component
const RoleIcon = ({ index }: { index: number }) => {
  const icons = ['💼', '📊', '🎯', '🚀'];
  const colors = ['#FEF3C7', '#DBEAFE', '#FCE7F3', '#D1FAE5'];
  return (
    <div style={{
      width: 40,
      height: 40,
      borderRadius: 10,
      backgroundColor: colors[index % colors.length],
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '1.25rem'
    }}>
      {icons[index % icons.length]}
    </div>
  );
};

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [pasteMode, setPasteMode] = useState(false);
  const [pastedText, setPastedText] = useState('');
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
      setPasteMode(false);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      setPasteMode(false);
    }
  }, []);

  const analyzeCV = async () => {
    if (!file && !pastedText) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const formData = new FormData();
      if (file) {
        formData.append('cv', file);
      } else {
        formData.append('cvText', pastedText);
      }

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
    setPastedText('');
    setPasteMode(false);
    setAnalysis(null);
    setError(null);
  };

  const getScoreHeadline = (score: number) => {
    if (score >= 80) return 'Excellent CV — ready to impress';
    if (score >= 70) return 'Strong foundation — room to stand out';
    if (score >= 60) return 'Good start — a few tweaks will help';
    if (score >= 40) return 'Needs work — let\'s improve it together';
    return 'Major improvements needed';
  };

  // Count stats
  const strengthCount = analysis?.strengths?.length || 0;
  const improvementCount = analysis?.improvements?.length || 0;
  const highPriorityCount = analysis?.improvements?.filter(i => i.priority === 'HIGH').length || 0;

  /* ============================================
     UPLOAD VIEW
     ============================================ */
  if (!analysis) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#ffffff',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        {/* Header */}
        <header style={{
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #f1f5f9'
        }}>
          <Logo size={32} />
          <a href="/" style={{
            color: '#4F46E5',
            textDecoration: 'none',
            fontSize: '0.875rem',
            fontWeight: 500,
            padding: '8px 16px',
            border: '1px solid #4F46E5',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}>
            Get matched to roles <span style={{ fontSize: '1rem' }}>→</span>
          </a>
        </header>

        {/* Trust Strip - Bold proof */}
        <div style={{
          backgroundColor: '#0F172A',
          padding: '12px 24px',
          textAlign: 'center',
          color: 'white',
          fontSize: '0.8125rem'
        }}>
          <span style={{ opacity: 0.7 }}>Trusted by candidates from</span>
          <span style={{ fontWeight: 600, marginLeft: 8 }}>Deloitte</span>
          <span style={{ opacity: 0.4, margin: '0 8px' }}>•</span>
          <span style={{ fontWeight: 600 }}>Standard Bank</span>
          <span style={{ opacity: 0.4, margin: '0 8px' }}>•</span>
          <span style={{ fontWeight: 600 }}>UCT</span>
          <span style={{ opacity: 0.4, margin: '0 8px' }}>•</span>
          <span style={{ fontWeight: 600 }}>Wits</span>
          <span style={{ opacity: 0.4, margin: '0 8px' }}>•</span>
          <span style={{ opacity: 0.7 }}>47,382 CVs analyzed</span>
        </div>

        {/* Hero Section - Split Layout */}
        <div style={{
          backgroundColor: '#FAFAFA',
          padding: '64px 24px 80px',
        }}>
          <div style={{
            maxWidth: 1200,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 64,
            alignItems: 'center'
          }} className="hero-grid">
            {/* Left Column - Copy + CTAs */}
            <div>
              {/* Category stake */}
              <p style={{
                fontSize: '0.875rem',
                color: '#4F46E5',
                fontWeight: 600,
                marginBottom: 16,
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                The CV quality engine
              </p>

              {/* Headline */}
              <h1 style={{
                fontSize: 'clamp(2rem, 4vw, 3rem)',
                fontWeight: 800,
                color: '#0F172A',
                letterSpacing: '-0.04em',
                lineHeight: 1.1,
                marginBottom: 20
              }}>
                Your CV gets <span style={{ color: '#4F46E5' }}>6 seconds</span>.<br />Make them count.
              </h1>

              {/* Subheadline */}
              <p style={{
                fontSize: '1.125rem',
                color: '#475569',
                lineHeight: 1.6,
                marginBottom: 32
              }}>
                See exactly what recruiters see. Get ruthless, specific fixes — not generic advice. Export a polished CV in minutes.
              </p>

              {/* CTAs */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 32, flexWrap: 'wrap' }}>
                <button
                  onClick={() => document.getElementById('file-input')?.click()}
                  style={{
                    backgroundColor: '#4F46E5',
                    color: 'white',
                    padding: '16px 32px',
                    borderRadius: 10,
                    fontSize: '1rem',
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}
                >
                  Scan my CV free
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </button>
                <button
                  style={{
                    backgroundColor: 'white',
                    color: '#0F172A',
                    padding: '16px 24px',
                    borderRadius: 10,
                    fontSize: '1rem',
                    fontWeight: 500,
                    border: '1px solid #E2E8F0',
                    cursor: 'pointer'
                  }}
                >
                  See a sample report
                </button>
              </div>

              {/* Testimonial Card - Floating */}
              <div style={{
                backgroundColor: 'white',
                borderRadius: 12,
                padding: 20,
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 10px 15px -3px rgba(0, 0, 0, 0.08)',
                maxWidth: 400
              }}>
                <div style={{ display: 'flex', gap: 3, marginBottom: 8 }}>
                  {[1,2,3,4,5].map(i => (
                    <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill="#F59E0B">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  ))}
                </div>
                <p style={{ fontSize: '0.9375rem', color: '#0F172A', fontWeight: 500, marginBottom: 8, lineHeight: 1.5 }}>
                  "Got <strong style={{ color: '#4F46E5' }}>3x more interview callbacks</strong> in 2 weeks. The fixes were specific — not the generic 'add more keywords' stuff."
                </p>
                <p style={{ fontSize: '0.8125rem', color: '#64748B' }}>
                  — Thandi M., Marketing Manager
                </p>
              </div>
            </div>

            {/* Right Column - Live Product Preview */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: 20,
              padding: 24,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
              border: '1px solid #E2E8F0'
            }}>
              {/* Score Preview */}
              <div style={{ display: 'flex', gap: 20, marginBottom: 24 }}>
                {/* Animated Score Ring */}
                <div style={{ position: 'relative', width: 100, height: 100, flexShrink: 0 }}>
                  <svg width="100" height="100" style={{ transform: 'rotate(-90deg)' }}>
                    <circle stroke="#E5E7EB" fill="transparent" strokeWidth="8" r="42" cx="50" cy="50"/>
                    <circle
                      stroke="#4F46E5"
                      fill="transparent"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray="264"
                      strokeDashoffset="66"
                      r="42"
                      cx="50"
                      cy="50"
                      className="score-ring"
                    />
                  </svg>
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A' }}>78</div>
                    <div style={{ fontSize: '0.625rem', color: '#6B7280' }}>/ 100</div>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Your Score</div>
                  <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>Strong foundation</div>
                  <div style={{ fontSize: '0.8125rem', color: '#64748B' }}>3 high-impact fixes will push you to 90+</div>
                </div>
              </div>

              {/* Top Fixes Preview */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
                  Top 3 Fixes
                </div>
                {[
                  { num: 1, text: 'Add measurable achievements', tag: 'Non-negotiable', tagColor: '#DC2626' },
                  { num: 2, text: 'Strengthen your summary', tag: 'High impact', tagColor: '#D97706' },
                  { num: 3, text: 'Add missing keywords', tag: '60-sec fix', tagColor: '#059669' }
                ].map((fix, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < 2 ? '1px solid #F1F5F9' : 'none' }}>
                    <div style={{ width: 24, height: 24, borderRadius: 6, backgroundColor: '#4F46E5', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>{fix.num}</div>
                    <span style={{ flex: 1, fontSize: '0.875rem', color: '#0F172A' }}>{fix.text}</span>
                    <span style={{ fontSize: '0.625rem', fontWeight: 600, color: fix.tagColor, backgroundColor: `${fix.tagColor}15`, padding: '3px 8px', borderRadius: 4 }}>{fix.tag}</span>
                  </div>
                ))}
              </div>

              {/* Best-Fit Roles Preview */}
              <div style={{ backgroundColor: '#F8FAFC', borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
                  Best-Fit Roles
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {['Account Executive', 'Sales Manager', 'BDR'].map((role, i) => (
                    <span key={i} style={{ backgroundColor: 'white', border: '1px solid #E2E8F0', borderRadius: 6, padding: '6px 12px', fontSize: '0.8125rem', color: '#0F172A' }}>
                      {role} <span style={{ color: '#10B981', fontWeight: 600 }}>{92 - i * 5}%</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Upload Section - Below hero */}
        <div style={{ backgroundColor: 'white', padding: '64px 24px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>Ready to see your score?</h2>
          <p style={{ fontSize: '1rem', color: '#64748B', marginBottom: 32 }}>Drop your CV below and get instant feedback</p>

          {/* Upload Box - With depth and polish */}
          <div style={{
            maxWidth: 520,
            margin: '0 auto',
            backgroundColor: '#FAFAFA',
            borderRadius: 20,
            padding: 8,
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 20px 25px -5px rgba(0, 0, 0, 0.05)',
          }}>
            {!pasteMode ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !file && document.getElementById('file-input')?.click()}
                style={{
                  backgroundColor: isDragging ? '#F5F3FF' : '#FAFAFA',
                  border: `2px dashed ${isDragging ? '#4F46E5' : file ? '#10B981' : '#E2E8F0'}`,
                  borderRadius: 14,
                  padding: file ? '24px' : '40px 24px',
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
                      backgroundColor: '#F9FAFB',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 20px'
                    }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17 8 12 3 7 8"/>
                        <line x1="12" y1="3" x2="12" y2="15"/>
                      </svg>
                    </div>
                    <p style={{ fontSize: '1rem', fontWeight: 600, color: '#0F172A', marginBottom: 4 }}>
                      Upload your CV
                    </p>
                    <p style={{ fontSize: '0.875rem', color: '#9CA3AF', marginBottom: 4 }}>
                      Drop your file here or click to browse
                    </p>
                    <p style={{ fontSize: '0.8125rem', color: '#D1D5DB' }}>
                      PDF, Word, or plain text
                    </p>
                  </>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 44,
                        height: 44,
                        backgroundColor: '#D1FAE5',
                        borderRadius: 10,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      </div>
                      <div style={{ textAlign: 'left' }}>
                        <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#0F172A', margin: 0 }}>
                          {file.name}
                        </p>
                        <p style={{ fontSize: '0.8125rem', color: '#94A3B8', margin: 0 }}>
                          {(file.size / 1024).toFixed(0)} KB • Ready to analyze
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
            ) : (
              /* Paste Text Mode */
              <div style={{
                backgroundColor: '#ffffff',
                border: '2px solid #D1D5DB',
                borderRadius: 16,
                padding: '16px',
              }}>
                <textarea
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder="Paste your CV content here..."
                  style={{
                    width: '100%',
                    minHeight: 200,
                    border: 'none',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    fontSize: '0.9375rem',
                    color: '#0F172A',
                    lineHeight: 1.6
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                  <button
                    onClick={() => { setPasteMode(false); setPastedText(''); }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#64748B',
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      padding: '8px 12px'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div style={{
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

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 12,
              marginTop: 24
            }}>
              <button
                onClick={analyzeCV}
                disabled={isAnalyzing || (!file && !pastedText)}
                style={{
                  backgroundColor: '#4F46E5',
                  color: 'white',
                  padding: '14px 28px',
                  borderRadius: 10,
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  border: 'none',
                  cursor: (isAnalyzing || (!file && !pastedText)) ? 'not-allowed' : 'pointer',
                  opacity: (isAnalyzing || (!file && !pastedText)) ? 0.5 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                {isAnalyzing ? (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" className="spin-icon">
                      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="60" strokeLinecap="round"/>
                    </svg>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    Upload CV
                  </>
                )}
              </button>
              <button
                onClick={() => { setPasteMode(!pasteMode); setFile(null); }}
                style={{
                  backgroundColor: 'white',
                  color: '#0F172A',
                  padding: '14px 28px',
                  borderRadius: 10,
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  border: '1px solid #E2E8F0',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
                Paste text
              </button>
            </div>

            {/* What happens next - Benefit driven */}
            <p style={{
              fontSize: '0.875rem',
              color: '#64748B',
              marginTop: 20,
              marginBottom: 0
            }}>
              Score, rewrite suggestions, and export — <strong style={{ color: '#0F172A' }}>in under 2 minutes</strong>
            </p>

            {/* Trust Indicators - With icons */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 24,
              marginTop: 24,
              color: '#6B7280',
              fontSize: '0.8125rem'
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                100% free
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5">
                  <rect x="3" y="11" width="18" height="11" rx="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                Your data stays private
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                POPIA compliant
              </span>
            </div>
          </div>
        </div>

        {/* Animation styles */}
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          .spin-icon { animation: spin 1s linear infinite; }
          .score-ring { animation: score-fill 1.5s ease-out forwards; }
          @keyframes score-fill { from { stroke-dashoffset: 264; } to { stroke-dashoffset: 66; } }
          @media (max-width: 900px) {
            .hero-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
          }
        `}</style>
      </div>
    );
  }

  /* ============================================
     RESULTS VIEW - Matching the reference design
     ============================================ */
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#ffffff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header */}
      <header style={{
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid #f1f5f9'
      }}>
        <div style={{ cursor: 'pointer' }} onClick={resetUpload}>
          <Logo size={32} />
        </div>
        <a href="/" style={{
          color: '#4F46E5',
          textDecoration: 'none',
          fontSize: '0.875rem',
          fontWeight: 500,
          padding: '8px 16px',
          border: '1px solid #4F46E5',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          gap: 6
        }}>
          Get matched to roles <span style={{ fontSize: '1rem' }}>→</span>
        </a>
      </header>

      {/* Main Content */}
      <div style={{
        maxWidth: 1100,
        margin: '0 auto',
        padding: '40px 24px',
        display: 'grid',
        gridTemplateColumns: '1fr 340px',
        gap: 40
      }}>
        {/* Left Column - Main Content */}
        <div>
          {/* Score Section */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: 16,
            padding: 32,
            marginBottom: 24,
            border: '1px solid #F1F5F9'
          }}>
            <div style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: '#6B7280',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: 24
            }}>
              Your CV Health Score
            </div>

            <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start' }}>
              <CircularScore score={analysis.overall_score} />

              <div style={{ flex: 1 }}>
                <h1 style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  color: '#0F172A',
                  marginBottom: 8,
                  lineHeight: 1.3
                }}>
                  {getScoreHeadline(analysis.overall_score)}
                </h1>
                <p style={{
                  fontSize: '0.9375rem',
                  color: '#6B7280',
                  lineHeight: 1.6,
                  marginBottom: 16
                }}>
                  {analysis.first_impression}
                </p>

                {/* Stats Pills */}
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.875rem', color: '#374151' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10B981' }}></span>
                    {strengthCount} strength{strengthCount !== 1 ? 's' : ''}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.875rem', color: '#374151' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#F59E0B' }}></span>
                    {improvementCount} improvement{improvementCount !== 1 ? 's' : ''}
                  </span>
                  {highPriorityCount > 0 && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.875rem', color: '#374151' }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#EF4444' }}></span>
                      {highPriorityCount} to fix
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Privacy Notice */}
          <div style={{
            backgroundColor: '#EFF6FF',
            borderRadius: 12,
            padding: '14px 18px',
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
            <span style={{ fontSize: '0.875rem', color: '#1E40AF' }}>
              Your profile is private by default. You control who sees your details.
            </span>
          </div>

          {/* Top Improvements Section */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: 16,
            padding: 32,
            border: '1px solid #F1F5F9'
          }}>
            <div style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: '#6B7280',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: 24
            }}>
              Top {Math.min(5, analysis.improvements.length)} Improvements (by impact)
            </div>

            {analysis.improvements.slice(0, 5).map((imp, i) => (
              <div key={i} style={{
                display: 'flex',
                gap: 16,
                padding: '20px 0',
                borderBottom: i < Math.min(4, analysis.improvements.length - 1) ? '1px solid #F1F5F9' : 'none'
              }}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  backgroundColor: '#4F46E5',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  flexShrink: 0
                }}>
                  {i + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: '#0F172A', marginBottom: 4, fontSize: '1rem' }}>
                    {imp.area}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#6B7280', lineHeight: 1.5, marginBottom: 10 }}>
                    {imp.suggestion}
                  </div>
                  <span style={{
                    display: 'inline-block',
                    padding: '4px 10px',
                    borderRadius: 6,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    backgroundColor: imp.priority === 'HIGH' ? '#FEE2E2' : imp.priority === 'MEDIUM' ? '#FEF3C7' : '#DBEAFE',
                    color: imp.priority === 'HIGH' ? '#DC2626' : imp.priority === 'MEDIUM' ? '#D97706' : '#2563EB'
                  }}>
                    {imp.priority === 'HIGH' ? 'High impact' : imp.priority === 'MEDIUM' ? 'Medium impact' : 'Quick win'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Strengths Section */}
          {analysis.strengths.length > 0 && (
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: 16,
              padding: 32,
              marginTop: 24,
              border: '1px solid #F1F5F9'
            }}>
              <div style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#10B981',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: 24
              }}>
                What's Working Well
              </div>

              {analysis.strengths.map((s, i) => (
                <div key={i} style={{
                  padding: '16px 0',
                  borderBottom: i < analysis.strengths.length - 1 ? '1px solid #F1F5F9' : 'none'
                }}>
                  <div style={{ fontWeight: 600, color: '#0F172A', marginBottom: 4 }}>{s.strength}</div>
                  <div style={{ fontSize: '0.875rem', color: '#6B7280', fontStyle: 'italic' }}>
                    "{s.evidence}"
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div>
          {/* Download Card */}
          <div style={{
            backgroundColor: '#4F46E5',
            borderRadius: 16,
            padding: 24,
            color: 'white',
            marginBottom: 24
          }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: 8 }}>
              Download your improved CV
            </h3>
            <p style={{ fontSize: '0.875rem', opacity: 0.85, marginBottom: 20, lineHeight: 1.5 }}>
              We've applied the suggestions above. Download your polished CV ready to send.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button style={{
                flex: 1,
                backgroundColor: 'white',
                color: '#4F46E5',
                border: 'none',
                padding: '12px 16px',
                borderRadius: 8,
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14,2H6A2,2,0,0,0,4,4V20a2,2,0,0,0,2,2H18a2,2,0,0,0,2-2V8ZM6,20V4h7V9h5V20Z"/>
                </svg>
                PDF
              </button>
              <button style={{
                flex: 1,
                backgroundColor: 'white',
                color: '#4F46E5',
                border: 'none',
                padding: '12px 16px',
                borderRadius: 8,
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14,2H6A2,2,0,0,0,4,4V20a2,2,0,0,0,2,2H18a2,2,0,0,0,2-2V8ZM6,20V4h7V9h5V20Z"/>
                </svg>
                Word
              </button>
            </div>
          </div>

          {/* Best-Fit Roles */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: 16,
            padding: 24,
            border: '1px solid #F1F5F9',
            marginBottom: 24
          }}>
            <div style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: '#6B7280',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: 6
            }}>
              Best-Fit Roles For You
            </div>
            <p style={{ fontSize: '0.8125rem', color: '#9CA3AF', marginBottom: 20 }}>
              Based on your CV content and role requirements
            </p>

            {(analysis.career_insights.natural_fit_roles || []).slice(0, 4).map((role, i) => {
              const roleName = typeof role === 'string' ? role : role.role;
              const match = typeof role === 'object' && role.match ? role.match : (92 - i * 5);
              return (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 0',
                  borderBottom: i < 3 ? '1px solid #F1F5F9' : 'none',
                  cursor: 'pointer'
                }}>
                  <RoleIcon index={i} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: '#0F172A', fontSize: '0.9375rem' }}>{roleName}</div>
                    <div style={{ fontSize: '0.8125rem', color: '#10B981', fontWeight: 600 }}>{match}% match</div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </div>
              );
            })}
          </div>

          {/* CTA Card */}
          <div style={{
            backgroundColor: '#FEF7EC',
            borderRadius: 16,
            padding: 24,
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.5rem', marginBottom: 12 }}>🎯</div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>
              Discover your hidden strengths
            </h3>
            <p style={{ fontSize: '0.8125rem', color: '#6B7280', marginBottom: 16, lineHeight: 1.5 }}>
              Get personalized career insights and job recommendations
            </p>
            <button
              onClick={resetUpload}
              style={{
                backgroundColor: '#0F172A',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: 8,
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
                width: '100%'
              }}
            >
              Analyze another CV
            </button>
          </div>
        </div>
      </div>

      {/* Mobile responsive styles */}
      <style>{`
        @media (max-width: 900px) {
          .results-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
