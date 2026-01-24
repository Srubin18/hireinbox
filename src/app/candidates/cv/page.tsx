'use client';

import { useState, useCallback, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// ============================================
// HIREINBOX B2C - CV OPTIONS
// /candidates/cv
//
// Options:
// - Upload existing CV
// - Create CV from scratch (free)
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

function CVOptionsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stage = searchParams.get('stage') || 'experienced';

  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const analysisTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
      }
    };
  }, []);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleFile = useCallback((file: File) => {
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a PDF or Word document');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be under 10MB');
      return;
    }
    setUploadedFile(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [handleFile]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleAnalyze = async () => {
    if (!uploadedFile) return;
    setUploading(true);

    try {
      // Create form data with the file
      const formData = new FormData();
      formData.append('file', uploadedFile);

      // Call the real AI API
      const response = await fetch('/api/analyze-cv', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        // Store result in sessionStorage for the scan page
        sessionStorage.setItem('cvAnalysisResult', JSON.stringify(result));
        router.push(`/candidates/scan?stage=${stage}&analyzed=true`);
      } else {
        // If API fails, still show sample results for demo
        console.error('CV analysis failed, showing sample results');
        router.push(`/candidates/scan?stage=${stage}`);
      }
    } catch (error) {
      console.error('Error analyzing CV:', error);
      // Fallback to sample results for demo
      router.push(`/candidates/scan?stage=${stage}`);
    } finally {
      setUploading(false);
    }
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
        maxWidth: '600px',
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
          Let's look at your CV
        </h1>
        <p style={{
          fontSize: '16px',
          color: '#64748b',
          marginBottom: '48px',
          textAlign: 'center',
          lineHeight: 1.6
        }}>
          Upload your existing CV or create one from scratch. Your first scan is free.
        </p>

        {/* Upload option */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          style={{
            border: `2px dashed ${dragActive ? '#4F46E5' : uploadedFile ? '#10B981' : '#e2e8f0'}`,
            borderRadius: '16px',
            padding: '48px 24px',
            textAlign: 'center',
            backgroundColor: dragActive ? '#eff6ff' : uploadedFile ? '#f0fdf4' : '#ffffff',
            transition: 'all 0.2s',
            marginBottom: '16px',
            cursor: 'pointer'
          }}
          onClick={() => document.getElementById('file-input')?.click()}
        >
          <input
            id="file-input"
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleFileInput}
            style={{ display: 'none' }}
          />

          {uploadedFile ? (
            <>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
              <div style={{ fontSize: '16px', fontWeight: 600, color: '#166534', marginBottom: '8px' }}>
                {uploadedFile.name}
              </div>
              <div style={{ fontSize: '14px', color: '#64748b' }}>
                {(uploadedFile.size / 1024).toFixed(0)} KB • Click to change
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
              <div style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>
                Drop your CV here or click to browse
              </div>
              <div style={{ fontSize: '14px', color: '#64748b' }}>
                PDF or Word document, max 10MB
              </div>
            </>
          )}
        </div>

        {/* Analyze button */}
        {uploadedFile && (
          <button
            onClick={handleAnalyze}
            disabled={uploading}
            style={{
              width: '100%',
              padding: '16px',
              backgroundColor: uploading ? '#94a3b8' : '#4F46E5',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: uploading ? 'not-allowed' : 'pointer',
              marginBottom: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            {uploading ? (
              <>
                <span style={{ animation: 'spin 1s linear infinite' }}>⏳</span>
                Analyzing...
              </>
            ) : (
              'Analyze my CV (Free)'
            )}
          </button>
        )}

        {/* Divider */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          margin: '32px 0'
        }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
          <span style={{ color: '#94a3b8', fontSize: '14px' }}>or</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
        </div>

        {/* Create CV option */}
        <button
          onClick={() => router.push(`/candidates/create?stage=${stage}`)}
          style={{
            width: '100%',
            padding: '20px 24px',
            backgroundColor: '#ffffff',
            color: '#0f172a',
            border: '2px solid #e2e8f0',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: 600,
            cursor: 'pointer',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.borderColor = '#4F46E5';
            e.currentTarget.style.backgroundColor = '#faf5ff';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.borderColor = '#e2e8f0';
            e.currentTarget.style.backgroundColor = '#ffffff';
          }}
        >
          <span style={{ fontSize: '32px' }}>✏️</span>
          <div>
            <div>Create a CV from scratch</div>
            <div style={{ fontSize: '13px', fontWeight: 400, color: '#64748b', marginTop: '4px' }}>
              Free • We'll guide you through it
            </div>
          </div>
        </button>

        {/* Info box */}
        <div style={{
          marginTop: '32px',
          padding: '16px',
          backgroundColor: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: '10px',
          fontSize: '13px',
          color: '#1e40af',
          lineHeight: 1.6
        }}>
          <strong>What you'll get:</strong>
          <ul style={{ margin: '8px 0 0 16px', paddingLeft: '0' }}>
            <li>Structure and formatting feedback</li>
            <li>Clarity and impact suggestions</li>
            <li>Strengths and gaps analysis</li>
            <li>ATS compatibility check</li>
          </ul>
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

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default function CVOptionsPage() {
  return (
    <Suspense fallback={<div style={{ padding: '48px', textAlign: 'center' }}>Loading...</div>}>
      <CVOptionsContent />
    </Suspense>
  );
}
