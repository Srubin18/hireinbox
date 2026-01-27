'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// ============================================
// HIREINBOX - TALENT POOL JOIN (ULTRA SIMPLE)
// Just: Upload CV + Enter Email = Done
// ============================================

export default function TalentPoolJoinPage() {
  const router = useRouter();
  const [step, setStep] = useState<'upload' | 'submitting' | 'success'>('upload');
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

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
      setError('Please upload a PDF or Word document');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File must be under 10MB');
      return;
    }
    setError(null);
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

  const handleSubmit = async () => {
    if (!uploadedFile || !email || !name) {
      setError('Please fill in all fields');
      return;
    }

    // Basic email validation
    if (!email.includes('@')) {
      setError('Please enter a valid email');
      return;
    }

    setStep('submitting');
    setError(null);

    try {
      const response = await fetch('/api/talent-pool/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: name,
          email: email,
          cvFileName: uploadedFile.name,
          cvFileSize: uploadedFile.size,
          wantFreeScan: true
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          setError('This email is already registered. Try a different email.');
        } else {
          setError(data.error || 'Something went wrong. Please try again.');
        }
        setStep('upload');
        return;
      }

      setStep('success');
    } catch {
      setError('Connection error. Please try again.');
      setStep('upload');
    }
  };

  // SUCCESS SCREEN
  if (step === 'success') {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        textAlign: 'center',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          backgroundColor: '#d1fae5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '24px'
        }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="3">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </div>

        <h1 style={{ fontSize: '32px', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>
          You're in!
        </h1>

        <p style={{ fontSize: '18px', color: '#64748b', marginBottom: '32px', maxWidth: '400px' }}>
          We'll email you at <strong>{email}</strong> when employers are interested in your profile.
        </p>

        <div style={{
          backgroundColor: '#f0fdf4',
          border: '1px solid #86efac',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '32px',
          maxWidth: '400px'
        }}>
          <div style={{ fontSize: '14px', color: '#166534', fontWeight: 600, marginBottom: '8px' }}>
            What happens next?
          </div>
          <ul style={{ margin: 0, paddingLeft: '20px', textAlign: 'left', color: '#166534', fontSize: '14px' }}>
            <li>Employers search the talent pool</li>
            <li>If they like your CV, they contact you</li>
            <li>You decide if you want to chat with them</li>
          </ul>
        </div>

        <button
          onClick={() => router.push('/candidates')}
          style={{
            padding: '14px 32px',
            backgroundColor: '#4F46E5',
            color: '#ffffff',
            border: 'none',
            borderRadius: '10px',
            fontSize: '16px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Get Free CV Feedback
        </button>

        <button
          onClick={() => router.push('/')}
          style={{
            marginTop: '16px',
            padding: '12px 24px',
            backgroundColor: 'transparent',
            color: '#64748b',
            border: 'none',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          Back to home
        </button>
      </div>
    );
  }

  // MAIN FORM
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      textAlign: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Logo */}
      <div style={{ marginBottom: '32px' }}>
        <svg width="64" height="64" viewBox="0 0 48 48" fill="none">
          <rect width="48" height="48" rx="12" fill="#10B981"/>
          <path d="M17 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          <circle cx="24" cy="14" r="4" stroke="white" strokeWidth="2"/>
          <path d="M12 34v-2a4 4 0 0 1 4-4h16a4 4 0 0 1 4 4v2" stroke="white" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </div>

      <h1 style={{ fontSize: '32px', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>
        Join the Talent Pool
      </h1>

      <p style={{ fontSize: '18px', color: '#64748b', marginBottom: '40px', maxWidth: '400px' }}>
        Upload your CV and let employers find you. It's free.
      </p>

      {/* Form Card */}
      <div style={{
        backgroundColor: '#f8fafc',
        borderRadius: '16px',
        padding: '32px',
        maxWidth: '450px',
        width: '100%'
      }}>
        {/* File Upload */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          style={{
            border: `2px dashed ${dragActive ? '#4F46E5' : uploadedFile ? '#10B981' : '#cbd5e1'}`,
            borderRadius: '12px',
            padding: '32px',
            backgroundColor: dragActive ? '#ede9fe' : uploadedFile ? '#f0fdf4' : '#ffffff',
            marginBottom: '24px',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onClick={() => document.getElementById('cv-upload')?.click()}
        >
          <input
            id="cv-upload"
            type="file"
            accept=".pdf,.doc,.docx"
            style={{ display: 'none' }}
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />

          {uploadedFile ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'center' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              <span style={{ color: '#166534', fontWeight: 600 }}>{uploadedFile.name}</span>
            </div>
          ) : (
            <>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" style={{ margin: '0 auto 12px', display: 'block' }}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              <div style={{ color: '#64748b', fontSize: '16px', fontWeight: 500 }}>
                Click to upload your CV
              </div>
              <div style={{ color: '#94a3b8', fontSize: '14px', marginTop: '4px' }}>
                PDF or Word, max 10MB
              </div>
            </>
          )}
        </div>

        {/* Name */}
        <div style={{ marginBottom: '16px', textAlign: 'left' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
            Your name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Thabo Molefe"
            style={{
              width: '100%',
              padding: '14px 16px',
              border: '2px solid #e2e8f0',
              borderRadius: '10px',
              fontSize: '16px',
              boxSizing: 'border-box',
              outline: 'none'
            }}
          />
        </div>

        {/* Email */}
        <div style={{ marginBottom: '24px', textAlign: 'left' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
            Your email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g. thabo@gmail.com"
            style={{
              width: '100%',
              padding: '14px 16px',
              border: '2px solid #e2e8f0',
              borderRadius: '10px',
              fontSize: '16px',
              boxSizing: 'border-box',
              outline: 'none'
            }}
          />
        </div>

        {/* Error */}
        {error && (
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '16px',
            color: '#dc2626',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={step === 'submitting' || !uploadedFile || !email || !name}
          style={{
            width: '100%',
            padding: '16px',
            backgroundColor: (uploadedFile && email && name) ? '#10B981' : '#cbd5e1',
            color: '#ffffff',
            border: 'none',
            borderRadius: '10px',
            fontSize: '18px',
            fontWeight: 700,
            cursor: (uploadedFile && email && name) ? 'pointer' : 'not-allowed'
          }}
        >
          {step === 'submitting' ? 'Joining...' : 'Join for Free'}
        </button>

        <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '16px' }}>
          We'll only contact you about job opportunities. No spam.
        </p>
      </div>

      {/* Back link */}
      <button
        onClick={() => router.push('/candidates')}
        style={{
          marginTop: '32px',
          padding: '12px 24px',
          backgroundColor: 'transparent',
          color: '#64748b',
          border: 'none',
          fontSize: '14px',
          cursor: 'pointer'
        }}
      >
        ← Back
      </button>

      {/* Support */}
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
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        Help
      </button>
    </div>
  );
}
