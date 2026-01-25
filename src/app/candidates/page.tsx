'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';

// ============================================
// HIREINBOX B2C - CANDIDATE FUNNEL
// Ultra simple for IQ 90-100 market
// Upload → Results → Upsells
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

interface CVAnalysis {
  candidate_name: string | null;
  overall_score: number;
  first_impression: string;
  strengths: StrengthItem[];
  improvements: ImprovementItem[];
  quick_wins: string[];
  summary: string;
}

// Circular Score
const CircularScore = ({ score }: { score: number }) => {
  const size = 160;
  const radius = size / 2;
  const stroke = 12;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getColor = () => {
    if (score >= 80) return '#10B981';
    if (score >= 60) return '#8B5CF6';
    if (score >= 40) return '#F59E0B';
    return '#EF4444';
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
        <div style={{ fontSize: 48, fontWeight: 800, color: '#0F172A' }}>{score}</div>
        <div style={{ fontSize: 14, color: '#6B7280' }}>out of 100</div>
      </div>
    </div>
  );
};

export default function CandidatesPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<CVAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Handle file
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
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  // Analyze CV
  const analyzeCV = async () => {
    if (!file) return;
    setIsAnalyzing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('cv', file);
      const response = await fetch('/api/analyze-cv', { method: 'POST', body: formData });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Analysis failed');
      setAnalysis(data.analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ==================
  // LOADING STATE
  // ==================
  if (isAnalyzing) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        padding: 24
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
          Checking your CV...
        </div>
        <div style={{ fontSize: 16, color: '#64748b' }}>
          This takes about 30 seconds
        </div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ==================
  // RESULTS + UPSELLS
  // ==================
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
          <div style={{ fontSize: 20, fontWeight: 700 }}>
            <span style={{ color: '#0f172a' }}>Hire</span>
            <span style={{ color: '#4F46E5' }}>Inbox</span>
          </div>
          <button
            onClick={() => { setAnalysis(null); setFile(null); }}
            style={{
              padding: '10px 20px',
              backgroundColor: '#4F46E5',
              color: '#ffffff',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Check Another CV
          </button>
        </header>

        <div style={{ maxWidth: 700, margin: '0 auto', padding: '32px 24px' }}>
          {/* Score */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: 20,
            padding: 32,
            marginBottom: 24,
            textAlign: 'center'
          }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
              <CircularScore score={analysis.overall_score} />
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>
              {analysis.overall_score >= 80 ? 'Great CV!' : analysis.overall_score >= 60 ? 'Good start!' : 'Room to improve'}
            </h1>
            <p style={{ fontSize: 16, color: '#64748b', lineHeight: 1.6, maxWidth: 500, margin: '0 auto' }}>
              {analysis.first_impression}
            </p>
          </div>

          {/* What's Good */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: 16, padding: 24, marginBottom: 20 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#059669', marginBottom: 16 }}>
              ✓ What's Good ({analysis.strengths.length})
            </h2>
            {analysis.strengths.slice(0, 3).map((s, i) => (
              <div key={i} style={{
                padding: 14,
                backgroundColor: '#f0fdf4',
                borderRadius: 10,
                marginBottom: i < 2 ? 10 : 0
              }}>
                <div style={{ fontWeight: 600, color: '#166534', marginBottom: 4 }}>{s.strength}</div>
                <div style={{ fontSize: 14, color: '#15803d' }}>"{s.evidence}"</div>
              </div>
            ))}
          </div>

          {/* How to Improve */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: 16, padding: 24, marginBottom: 20 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#d97706', marginBottom: 16 }}>
              ⚡ How to Improve ({analysis.improvements.length})
            </h2>
            {analysis.improvements.slice(0, 3).map((imp, i) => (
              <div key={i} style={{
                padding: 14,
                backgroundColor: '#fefce8',
                borderRadius: 10,
                marginBottom: i < 2 ? 10 : 0,
                borderLeft: '4px solid #f59e0b'
              }}>
                <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>{imp.area}</div>
                <div style={{ fontSize: 14, color: '#64748b', marginBottom: 6 }}>{imp.current_state}</div>
                <div style={{ fontSize: 14, color: '#0f172a' }}>→ {imp.suggestion}</div>
              </div>
            ))}
          </div>

          {/* ==================
              UPSELLS SECTION
              ================== */}
          <div style={{
            backgroundColor: '#0f172a',
            borderRadius: 20,
            padding: 32,
            marginTop: 32
          }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#ffffff', marginBottom: 8, textAlign: 'center' }}>
              What's Next?
            </h2>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)', marginBottom: 28, textAlign: 'center' }}>
              Take the next step in your job search
            </p>

            {/* Upsell 1: Join Talent Pool (FREE) */}
            <div
              onClick={() => router.push('/talent-pool/join')}
              style={{
                backgroundColor: 'rgba(255,255,255,0.1)',
                borderRadius: 14,
                padding: 20,
                marginBottom: 16,
                cursor: 'pointer',
                border: '2px solid #10B981',
                display: 'flex',
                alignItems: 'center',
                gap: 16
              }}
            >
              <div style={{
                width: 56,
                height: 56,
                borderRadius: 12,
                backgroundColor: '#10B981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <span style={{ fontSize: 17, fontWeight: 700, color: '#ffffff' }}>Join Talent Pool</span>
                  <span style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#10B981',
                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                    padding: '3px 10px',
                    borderRadius: 20
                  }}>FREE</span>
                </div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>
                  Let employers find you. We'll email you when there's a match.
                </div>
              </div>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </div>

            {/* Upsell 2: Video Analysis */}
            <div
              onClick={() => router.push('/candidates/video')}
              style={{
                backgroundColor: 'rgba(255,255,255,0.1)',
                borderRadius: 14,
                padding: 20,
                marginBottom: 16,
                cursor: 'pointer',
                border: '1px solid rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: 16
              }}
            >
              <div style={{
                width: 56,
                height: 56,
                borderRadius: 12,
                backgroundColor: '#8B5CF6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2">
                  <polygon points="23 7 16 12 23 17 23 7"/>
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <span style={{ fontSize: 17, fontWeight: 700, color: '#ffffff' }}>Video Analysis</span>
                  <span style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#8B5CF6',
                    backgroundColor: 'rgba(139, 92, 246, 0.2)',
                    padding: '3px 10px',
                    borderRadius: 20
                  }}>R99</span>
                </div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>
                  Upload a video of yourself. Get tips on how you come across in interviews.
                </div>
              </div>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </div>

            {/* Upsell 3: CV Rewrite Help */}
            <div
              onClick={() => router.push('/candidates/cv')}
              style={{
                backgroundColor: 'rgba(255,255,255,0.1)',
                borderRadius: 14,
                padding: 20,
                cursor: 'pointer',
                border: '1px solid rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: 16
              }}
            >
              <div style={{
                width: 56,
                height: 56,
                borderRadius: 12,
                backgroundColor: '#4F46E5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2">
                  <path d="M12 20h9"/>
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <span style={{ fontSize: 17, fontWeight: 700, color: '#ffffff' }}>Help Me Improve My CV</span>
                </div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>
                  We'll rewrite your CV to make it stronger. AI-powered suggestions.
                </div>
              </div>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </div>
          </div>

          {/* Back home */}
          <button
            onClick={() => router.push('/')}
            style={{
              display: 'block',
              margin: '32px auto 0',
              padding: '12px 24px',
              backgroundColor: 'transparent',
              color: '#64748b',
              border: 'none',
              fontSize: 14,
              cursor: 'pointer'
            }}
          >
            ← Back to home
          </button>
        </div>
      </div>
    );
  }

  // ==================
  // UPLOAD FORM
  // ==================
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Logo */}
      <div style={{ marginBottom: 32 }}>
        <svg width="72" height="72" viewBox="0 0 48 48" fill="none">
          <rect width="48" height="48" rx="12" fill="#4F46E5"/>
          <path d="M12 18L24 26L36 18V32C36 33.1 35.1 34 34 34H14C12.9 34 12 33.1 12 32V18Z" fill="white" fillOpacity="0.9"/>
          <path d="M34 14H14C12.9 14 12 14.9 12 16V18L24 26L36 18V16C36 14.9 35.1 14 34 14Z" fill="white"/>
          <circle cx="36" cy="12" r="9" fill="#10B981"/>
          <path d="M32.5 12L35 14.5L39.5 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      {/* Heading */}
      <h1 style={{ fontSize: 36, fontWeight: 700, color: '#0f172a', marginBottom: 12, textAlign: 'center' }}>
        Get Free CV Feedback
      </h1>
      <p style={{ fontSize: 18, color: '#64748b', marginBottom: 40, textAlign: 'center', maxWidth: 400 }}>
        Upload your CV and get tips to make it better. Takes 30 seconds.
      </p>

      {/* Upload Card */}
      <div style={{ backgroundColor: '#f8fafc', borderRadius: 20, padding: 32, maxWidth: 450, width: '100%' }}>
        {/* Drag & Drop */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${dragActive ? '#4F46E5' : file ? '#10B981' : '#cbd5e1'}`,
            borderRadius: 14,
            padding: 36,
            backgroundColor: dragActive ? '#ede9fe' : file ? '#f0fdf4' : '#ffffff',
            cursor: 'pointer',
            textAlign: 'center',
            marginBottom: 20,
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
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              <span style={{ color: '#166534', fontWeight: 600, fontSize: 16 }}>{file.name}</span>
            </div>
          ) : (
            <>
              <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" style={{ margin: '0 auto 14px', display: 'block' }}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              <div style={{ color: '#64748b', fontSize: 17, fontWeight: 500 }}>Click to upload your CV</div>
              <div style={{ color: '#94a3b8', fontSize: 14, marginTop: 6 }}>PDF or Word, max 10MB</div>
            </>
          )}
        </div>

        {/* Error */}
        {error && (
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 10,
            padding: 14,
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
            padding: 18,
            backgroundColor: file ? '#4F46E5' : '#cbd5e1',
            color: '#ffffff',
            border: 'none',
            borderRadius: 12,
            fontSize: 18,
            fontWeight: 700,
            cursor: file ? 'pointer' : 'not-allowed',
            boxShadow: file ? '0 4px 14px rgba(79, 70, 229, 0.4)' : 'none'
          }}
        >
          Check My CV
        </button>

        {/* Trust signals */}
        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'center', gap: 20, flexWrap: 'wrap' }}>
          {['100% Free', '30 seconds', 'No signup'].map((text) => (
            <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', fontSize: 13 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              {text}
            </div>
          ))}
        </div>
      </div>

      {/* I don't have a CV */}
      <button
        onClick={() => router.push('/candidates/create')}
        style={{
          marginTop: 32,
          padding: '14px 28px',
          backgroundColor: '#f1f5f9',
          color: '#475569',
          border: 'none',
          borderRadius: 10,
          fontSize: 15,
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 20h9"/>
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
        </svg>
        I don't have a CV yet
      </button>

      {/* Back */}
      <button
        onClick={() => router.push('/')}
        style={{
          marginTop: 20,
          padding: '12px 24px',
          backgroundColor: 'transparent',
          color: '#94a3b8',
          border: 'none',
          fontSize: 14,
          cursor: 'pointer'
        }}
      >
        ← Back to home
      </button>

      {/* Help */}
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
