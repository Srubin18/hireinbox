'use client';

import { useState, useCallback, useRef, Suspense } from 'react';
import { useRouter } from 'next/navigation';

// ============================================
// HIREINBOX B2C - ULTRA SIMPLE CV UPLOAD
// IQ 90-100 audience: Just upload → Get results
// ============================================

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
  salary_positioning?: string;
}

interface ATSCheck {
  likely_ats_friendly: boolean;
  issues: string[];
  recommendation: string;
}

interface RecruiterView {
  seven_second_impression: string;
  standout_element: string;
  red_flag_check: string;
}

interface CVAnalysis {
  candidate_name: string | null;
  current_title: string | null;
  years_experience: number | null;
  education_level: string | null;
  overall_score: number;
  score_explanation: string;
  first_impression: string;
  sa_context_highlights?: string[];
  strengths: StrengthItem[];
  improvements: ImprovementItem[];
  quick_wins: string[];
  career_insights: CareerInsights;
  ats_check?: ATSCheck;
  recruiter_view?: RecruiterView;
  summary: string;
}

// Circular Score Component
const CircularScore = ({ score, size = 140 }: { score: number; size?: number }) => {
  const radius = size / 2;
  const stroke = size / 16;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getColor = () => {
    if (score >= 80) return '#10B981';
    if (score >= 60) return '#8B5CF6';
    if (score >= 40) return '#F59E0B';
    return '#EF4444';
  };

  const getGrade = () => {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B+';
    if (score >= 60) return 'B';
    if (score >= 50) return 'C';
    return 'D';
  };

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle stroke="#E5E7EB" fill="transparent" strokeWidth={stroke} r={normalizedRadius} cx={radius} cy={radius} />
        <circle
          stroke={getColor()}
          fill="transparent"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference + ' ' + circumference}
          style={{ strokeDashoffset, transition: 'stroke-dashoffset 1.5s ease-out' }}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
      </svg>
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
        <div style={{ fontSize: size / 3, fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>{score}</div>
        <div style={{ fontSize: size / 14, color: '#6B7280', marginTop: 2 }}>out of 100</div>
        <div style={{
          fontSize: size / 10,
          fontWeight: 700,
          color: getColor(),
          marginTop: 4,
          padding: '2px 8px',
          backgroundColor: `${getColor()}15`,
          borderRadius: 4
        }}>
          Grade {getGrade()}
        </div>
      </div>
    </div>
  );
};

// Loading Animation
const LoadingAnimation = () => (
  <div style={{
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  }}>
    <div style={{
      width: 80,
      height: 80,
      border: '6px solid #E5E7EB',
      borderTop: '6px solid #4F46E5',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
      marginBottom: 24
    }} />
    <div style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>
      Analyzing your CV...
    </div>
    <div style={{ fontSize: 16, color: '#64748b' }}>
      This takes about 30 seconds
    </div>
    <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
  </div>
);

// Main Page Component
function UploadPageContent() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<CVAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Handle file selection
  const handleFile = useCallback((selectedFile: File) => {
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(selectedFile.type)) {
      setError('Please upload a PDF or Word document');
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File must be under 10MB');
      return;
    }
    setFile(selectedFile);
    setError(null);
  }, []);

  // Drag handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [handleFile]);

  // Analyze CV
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

  // Show loading
  if (isAnalyzing) {
    return <LoadingAnimation />;
  }

  // Show results
  if (analysis) {
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
          <div style={{ fontSize: 18, fontWeight: 700 }}>
            <span style={{ color: '#0f172a' }}>Hire</span>
            <span style={{ color: '#4F46E5' }}>Inbox</span>
          </div>
          <button
            onClick={() => { setAnalysis(null); setFile(null); }}
            style={{
              padding: '8px 16px',
              backgroundColor: '#4F46E5',
              color: '#ffffff',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Scan Another CV
          </button>
        </header>

        {/* Results */}
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px' }}>
          {/* Score Card */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: 16,
            padding: 32,
            marginBottom: 24,
            textAlign: 'center'
          }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
              <CircularScore score={analysis.overall_score} />
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>
              {analysis.overall_score >= 80 ? 'Great CV!' : analysis.overall_score >= 60 ? 'Good start!' : 'Room to improve'}
            </h1>
            <p style={{ fontSize: 16, color: '#64748b', lineHeight: 1.6 }}>
              {analysis.first_impression}
            </p>
          </div>

          {/* What's Good */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: 16,
            padding: 24,
            marginBottom: 24
          }}>
            <h2 style={{
              fontSize: 18,
              fontWeight: 700,
              color: '#059669',
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              What's Good ({analysis.strengths.length})
            </h2>
            {analysis.strengths.map((s, i) => (
              <div key={i} style={{
                padding: 16,
                backgroundColor: '#f0fdf4',
                borderRadius: 12,
                marginBottom: i < analysis.strengths.length - 1 ? 12 : 0
              }}>
                <div style={{ fontWeight: 600, color: '#166534', marginBottom: 4 }}>{s.strength}</div>
                <div style={{ fontSize: 14, color: '#15803d', fontStyle: 'italic' }}>"{s.evidence}"</div>
              </div>
            ))}
          </div>

          {/* How to Improve */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: 16,
            padding: 24,
            marginBottom: 24
          }}>
            <h2 style={{
              fontSize: 18,
              fontWeight: 700,
              color: '#d97706',
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              How to Improve ({analysis.improvements.length})
            </h2>
            {analysis.improvements.map((imp, i) => (
              <div key={i} style={{
                padding: 16,
                backgroundColor: imp.priority === 'HIGH' ? '#fef2f2' : '#fefce8',
                borderRadius: 12,
                marginBottom: i < analysis.improvements.length - 1 ? 12 : 0,
                borderLeft: `4px solid ${imp.priority === 'HIGH' ? '#ef4444' : '#f59e0b'}`
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 8
                }}>
                  <div style={{ fontWeight: 600, color: '#0f172a' }}>{imp.area}</div>
                  <span style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: imp.priority === 'HIGH' ? '#dc2626' : '#d97706',
                    backgroundColor: imp.priority === 'HIGH' ? '#fee2e2' : '#fef3c7',
                    padding: '2px 8px',
                    borderRadius: 4
                  }}>
                    {imp.priority}
                  </span>
                </div>
                <div style={{ fontSize: 14, color: '#64748b', marginBottom: 8 }}>{imp.current_state}</div>
                <div style={{ fontSize: 14, color: '#0f172a', fontWeight: 500 }}>→ {imp.suggestion}</div>
              </div>
            ))}
          </div>

          {/* Quick Wins */}
          {analysis.quick_wins && analysis.quick_wins.length > 0 && (
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: 16,
              padding: 24,
              marginBottom: 24
            }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#4F46E5', marginBottom: 16 }}>
                Quick Wins (Do These First)
              </h2>
              {analysis.quick_wins.map((win, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  marginBottom: i < analysis.quick_wins.length - 1 ? 12 : 0
                }}>
                  <div style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    backgroundColor: '#4F46E5',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    fontWeight: 700,
                    flexShrink: 0
                  }}>
                    {i + 1}
                  </div>
                  <div style={{ fontSize: 15, color: '#374151' }}>{win}</div>
                </div>
              ))}
            </div>
          )}

          {/* Next Steps */}
          <div style={{
            backgroundColor: '#4F46E5',
            borderRadius: 16,
            padding: 24,
            textAlign: 'center'
          }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#ffffff', marginBottom: 12 }}>
              Want employers to find you?
            </h2>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)', marginBottom: 20 }}>
              Join our Talent Pool and let companies reach out to you
            </p>
            <button
              onClick={() => router.push('/talent-pool/join')}
              style={{
                padding: '14px 32px',
                backgroundColor: '#ffffff',
                color: '#4F46E5',
                border: 'none',
                borderRadius: 10,
                fontSize: 16,
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Join Talent Pool (Free)
            </button>
          </div>
        </div>
      </div>
    );
  }

  // UPLOAD FORM - Ultra Simple
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Logo */}
      <div style={{ marginBottom: 32 }}>
        <svg width="64" height="64" viewBox="0 0 48 48" fill="none">
          <rect width="48" height="48" rx="12" fill="#4F46E5"/>
          <path d="M12 18L24 26L36 18V32C36 33.1 35.1 34 34 34H14C12.9 34 12 33.1 12 32V18Z" fill="white" fillOpacity="0.9"/>
          <path d="M34 14H14C12.9 14 12 14.9 12 16V18L24 26L36 18V16C36 14.9 35.1 14 34 14Z" fill="white"/>
          <circle cx="36" cy="12" r="9" fill="#10B981"/>
          <path d="M32.5 12L35 14.5L39.5 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      {/* Heading */}
      <h1 style={{
        fontSize: 32,
        fontWeight: 700,
        color: '#0f172a',
        marginBottom: 12,
        textAlign: 'center'
      }}>
        Get Free CV Feedback
      </h1>

      <p style={{
        fontSize: 18,
        color: '#64748b',
        marginBottom: 40,
        textAlign: 'center',
        maxWidth: 400
      }}>
        Upload your CV and get tips to make it better. Takes 30 seconds.
      </p>

      {/* Upload Area */}
      <div style={{
        backgroundColor: '#f8fafc',
        borderRadius: 16,
        padding: 32,
        maxWidth: 450,
        width: '100%'
      }}>
        {/* Drag & Drop Zone */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${dragActive ? '#4F46E5' : file ? '#10B981' : '#cbd5e1'}`,
            borderRadius: 12,
            padding: 32,
            backgroundColor: dragActive ? '#ede9fe' : file ? '#f0fdf4' : '#ffffff',
            cursor: 'pointer',
            textAlign: 'center',
            marginBottom: 24,
            transition: 'all 0.2s'
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx"
            style={{ display: 'none' }}
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />

          {file ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              <span style={{ color: '#166534', fontWeight: 600 }}>{file.name}</span>
            </div>
          ) : (
            <>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" style={{ margin: '0 auto 12px', display: 'block' }}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              <div style={{ color: '#64748b', fontSize: 16, fontWeight: 500 }}>
                Click to upload your CV
              </div>
              <div style={{ color: '#94a3b8', fontSize: 14, marginTop: 4 }}>
                PDF or Word, max 10MB
              </div>
            </>
          )}
        </div>

        {/* Error */}
        {error && (
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 8,
            padding: 12,
            marginBottom: 16,
            color: '#dc2626',
            fontSize: 14
          }}>
            {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={analyzeCV}
          disabled={!file}
          style={{
            width: '100%',
            padding: 16,
            backgroundColor: file ? '#4F46E5' : '#cbd5e1',
            color: '#ffffff',
            border: 'none',
            borderRadius: 10,
            fontSize: 18,
            fontWeight: 700,
            cursor: file ? 'pointer' : 'not-allowed'
          }}
        >
          Analyze My CV
        </button>

        <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 16, textAlign: 'center' }}>
          100% free • Results in 30 seconds • No signup needed
        </p>
      </div>

      {/* Back link */}
      <button
        onClick={() => router.push('/candidates')}
        style={{
          marginTop: 32,
          padding: '12px 24px',
          backgroundColor: 'transparent',
          color: '#64748b',
          border: 'none',
          fontSize: 14,
          cursor: 'pointer'
        }}
      >
        ← Back
      </button>

      {/* Support */}
      <button
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          padding: '12px 20px',
          backgroundColor: '#0f172a',
          color: '#ffffff',
          border: 'none',
          borderRadius: 24,
          fontSize: 14,
          fontWeight: 500,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        Help
      </button>
    </div>
  );
}

// Wrap in Suspense for useSearchParams
export default function UploadPage() {
  return (
    <Suspense fallback={<LoadingAnimation />}>
      <UploadPageContent />
    </Suspense>
  );
}
