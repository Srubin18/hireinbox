'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// ============================================
// HIREINBOX - TALENT POOL DIRECT JOIN
// /talent-pool/join
//
// Free CV upload directly to talent pool
// Skip other services - just get discovered
// Offer free CV scan during upload
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

export default function TalentPoolJoinPage() {
  const router = useRouter();
  const [step, setStep] = useState<'account' | 'upload' | 'details' | 'success'>('account');
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [wantFreeScan, setWantFreeScan] = useState(true);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    location: '',
    jobTitle: '',
    yearsExperience: '',
    openToRemote: true,
    availableFrom: 'immediately',
    salaryExpectation: '',
    linkedIn: ''
  });
  const [submitting, setSubmitting] = useState(false);

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

  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!uploadedFile || !formData.fullName || !formData.email) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      // Call the talent pool join API
      const response = await fetch('/api/talent-pool/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone || undefined,
          location: formData.location || undefined,
          jobTitle: formData.jobTitle || undefined,
          yearsExperience: formData.yearsExperience || undefined,
          openToRemote: formData.openToRemote,
          availableFrom: formData.availableFrom,
          salaryExpectation: formData.salaryExpectation || undefined,
          linkedIn: formData.linkedIn || undefined,
          wantFreeScan: wantFreeScan,
          cvFileName: uploadedFile.name,
          cvFileSize: uploadedFile.size
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific errors
        if (response.status === 409) {
          setSubmitError('This email is already registered in the talent pool. Please use a different email or log in to your existing account.');
        } else {
          setSubmitError(data.error || 'Something went wrong. Please try again.');
        }
        setSubmitting(false);
        return;
      }

      // Success!
      setStep('success');
    } catch (error) {
      console.error('Join error:', error);
      setSubmitError('Network error. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
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
          onClick={() => router.push('/')}
          style={{
            padding: '8px 16px',
            backgroundColor: 'transparent',
            color: '#64748b',
            border: 'none',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          Back
        </button>
      </header>

      <main style={{ maxWidth: '600px', margin: '0 auto', padding: '48px 24px' }}>
        {step === 'account' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '20px',
                fontSize: '13px',
                color: '#166534',
                fontWeight: 600,
                marginBottom: '16px'
              }}>
                100% FREE for job seekers
              </div>
              <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>
                Join the Talent Pool
              </h1>
              <p style={{ fontSize: '16px', color: '#64748b', lineHeight: 1.6 }}>
                Get discovered by employers through AI-powered matching
              </p>
            </div>

            {/* AI Intelligence Box */}
            <div style={{
              backgroundColor: '#0f172a',
              borderRadius: '16px',
              padding: '24px',
              marginBottom: '24px',
              color: '#ffffff'
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 16v-4"/>
                  <path d="M12 8h.01"/>
                </svg>
                How AI Matching Works
              </h3>
              <div style={{ display: 'grid', gap: '12px', fontSize: '14px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <span style={{ color: '#10B981' }}>1.</span>
                  <span style={{ color: '#cbd5e1' }}>AI reads your CV and extracts skills, experience, and qualifications</span>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <span style={{ color: '#10B981' }}>2.</span>
                  <span style={{ color: '#cbd5e1' }}>When employers post jobs, AI matches you based on fit - not just keywords</span>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <span style={{ color: '#10B981' }}>3.</span>
                  <span style={{ color: '#cbd5e1' }}>You only hear about opportunities that match your skills and expectations</span>
                </div>
              </div>
            </div>

            {/* Account required notice */}
            <div style={{
              backgroundColor: '#ffffff',
              border: '2px solid #e2e8f0',
              borderRadius: '16px',
              padding: '24px',
              textAlign: 'center'
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>
                Create a free account to continue
              </h3>
              <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '20px' }}>
                Your account keeps your profile secure and lets you manage your visibility.
              </p>
              <button
                onClick={() => router.push('/signup?return=/talent-pool/join&type=candidate')}
                style={{
                  width: '100%',
                  padding: '16px',
                  backgroundColor: '#4F46E5',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginBottom: '12px'
                }}
              >
                Create Free Account
              </button>
              <button
                onClick={() => router.push('/login?return=/talent-pool/join&type=candidate')}
                style={{
                  width: '100%',
                  padding: '14px',
                  backgroundColor: 'transparent',
                  color: '#4F46E5',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                Already have an account? Log in
              </button>
            </div>

            {/* Skip for demo */}
            <button
              onClick={() => setStep('upload')}
              style={{
                marginTop: '24px',
                width: '100%',
                padding: '12px',
                backgroundColor: 'transparent',
                color: '#94a3b8',
                border: '1px dashed #e2e8f0',
                borderRadius: '10px',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              Continue without account (demo only)
            </button>
          </>
        )}

        {step === 'upload' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '20px',
                fontSize: '13px',
                color: '#166534',
                fontWeight: 600,
                marginBottom: '16px'
              }}>
                100% FREE
              </div>
              <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>
                Join the Talent Pool
              </h1>
              <p style={{ fontSize: '16px', color: '#64748b', lineHeight: 1.6 }}>
                Upload your CV and get discovered by employers. No fees, no hassle.
              </p>
            </div>

            {/* CV Upload */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => document.getElementById('cv-input')?.click()}
              style={{
                border: `2px dashed ${dragActive ? '#4F46E5' : uploadedFile ? '#10B981' : '#e2e8f0'}`,
                borderRadius: '16px',
                padding: '48px 24px',
                textAlign: 'center',
                backgroundColor: dragActive ? '#eff6ff' : uploadedFile ? '#f0fdf4' : '#ffffff',
                cursor: 'pointer',
                marginBottom: '24px',
                transition: 'all 0.2s'
              }}
            >
              <input
                id="cv-input"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                style={{ display: 'none' }}
              />
              {uploadedFile ? (
                <>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>✓</div>
                  <div style={{ fontSize: '16px', fontWeight: 600, color: '#166534', marginBottom: '4px' }}>
                    {uploadedFile.name}
                  </div>
                  <div style={{ fontSize: '14px', color: '#64748b' }}>
                    Click to change
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
                  <div style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>
                    Drop your CV here or click to browse
                  </div>
                  <div style={{ fontSize: '14px', color: '#64748b' }}>
                    PDF or Word, max 10MB
                  </div>
                </>
              )}
            </div>

            {/* Free scan offer */}
            <div style={{
              backgroundColor: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '24px'
            }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={wantFreeScan}
                  onChange={(e) => setWantFreeScan(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: '#4F46E5', marginTop: '2px' }}
                />
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#1e40af', marginBottom: '4px' }}>
                    Get a free AI CV scan
                  </div>
                  <div style={{ fontSize: '13px', color: '#3b82f6' }}>
                    We'll analyze your CV and give you feedback on how to improve it - completely free.
                  </div>
                </div>
              </label>
            </div>

            <button
              onClick={() => uploadedFile && setStep('details')}
              disabled={!uploadedFile}
              style={{
                width: '100%',
                padding: '16px',
                backgroundColor: uploadedFile ? '#4F46E5' : '#e2e8f0',
                color: uploadedFile ? '#ffffff' : '#94a3b8',
                border: 'none',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: 600,
                cursor: uploadedFile ? 'pointer' : 'not-allowed'
              }}
            >
              Continue
            </button>
          </>
        )}

        {step === 'details' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>
                Tell us about yourself
              </h1>
              <p style={{ fontSize: '16px', color: '#64748b', lineHeight: 1.6 }}>
                Help employers find you faster with a few quick details.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Basic info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <input
                  type="text"
                  placeholder="Full name *"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  style={{
                    padding: '14px 16px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '10px',
                    fontSize: '15px',
                    outline: 'none'
                  }}
                />
                <input
                  type="email"
                  placeholder="Email *"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  style={{
                    padding: '14px 16px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '10px',
                    fontSize: '15px',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <input
                  type="tel"
                  placeholder="Phone number"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  style={{
                    padding: '14px 16px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '10px',
                    fontSize: '15px',
                    outline: 'none'
                  }}
                />
                <input
                  type="text"
                  placeholder="Location (e.g. Cape Town)"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  style={{
                    padding: '14px 16px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '10px',
                    fontSize: '15px',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                <input
                  type="text"
                  placeholder="Current/Target job title"
                  value={formData.jobTitle}
                  onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                  style={{
                    padding: '14px 16px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '10px',
                    fontSize: '15px',
                    outline: 'none'
                  }}
                />
                <select
                  value={formData.yearsExperience}
                  onChange={(e) => setFormData({ ...formData, yearsExperience: e.target.value })}
                  style={{
                    padding: '14px 16px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '10px',
                    fontSize: '15px',
                    outline: 'none',
                    backgroundColor: '#ffffff'
                  }}
                >
                  <option value="">Experience</option>
                  <option value="0-1">0-1 years</option>
                  <option value="2-5">2-5 years</option>
                  <option value="5-10">5-10 years</option>
                  <option value="10+">10+ years</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <select
                  value={formData.availableFrom}
                  onChange={(e) => setFormData({ ...formData, availableFrom: e.target.value })}
                  style={{
                    padding: '14px 16px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '10px',
                    fontSize: '15px',
                    outline: 'none',
                    backgroundColor: '#ffffff'
                  }}
                >
                  <option value="immediately">Available immediately</option>
                  <option value="2-weeks">2 weeks notice</option>
                  <option value="1-month">1 month notice</option>
                  <option value="2-months">2+ months notice</option>
                  <option value="not-looking">Not actively looking</option>
                </select>
                <input
                  type="text"
                  placeholder="Salary expectation (optional)"
                  value={formData.salaryExpectation}
                  onChange={(e) => setFormData({ ...formData, salaryExpectation: e.target.value })}
                  style={{
                    padding: '14px 16px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '10px',
                    fontSize: '15px',
                    outline: 'none'
                  }}
                />
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.openToRemote}
                  onChange={(e) => setFormData({ ...formData, openToRemote: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: '#4F46E5' }}
                />
                <span style={{ fontSize: '14px', color: '#475569' }}>Open to remote work</span>
              </label>

              <input
                type="url"
                placeholder="LinkedIn profile (optional)"
                value={formData.linkedIn}
                onChange={(e) => setFormData({ ...formData, linkedIn: e.target.value })}
                style={{
                  padding: '14px 16px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '10px',
                  fontSize: '15px',
                  outline: 'none'
                }}
              />
            </div>

            {/* Error message */}
            {submitError && (
              <div style={{
                marginTop: '16px',
                padding: '12px 16px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '10px',
                color: '#dc2626',
                fontSize: '14px'
              }}>
                {submitError}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button
                onClick={() => setStep('upload')}
                style={{
                  padding: '16px 24px',
                  backgroundColor: '#f1f5f9',
                  color: '#475569',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '16px',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={!formData.fullName || !formData.email || submitting}
                style={{
                  flex: 1,
                  padding: '16px',
                  backgroundColor: (formData.fullName && formData.email && !submitting) ? '#4F46E5' : '#e2e8f0',
                  color: (formData.fullName && formData.email && !submitting) ? '#ffffff' : '#94a3b8',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: (formData.fullName && formData.email && !submitting) ? 'pointer' : 'not-allowed'
                }}
              >
                {submitting ? 'Joining...' : 'Join Talent Pool'}
              </button>
            </div>
          </>
        )}

        {step === 'success' && (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <div style={{ fontSize: '64px', marginBottom: '24px' }}>✓</div>
            <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>
              You're in the Talent Pool!
            </h1>
            <p style={{ fontSize: '16px', color: '#64748b', lineHeight: 1.6, marginBottom: '32px' }}>
              Employers can now discover your profile. We'll email you when there's a match.
            </p>

            {wantFreeScan && (
              <div style={{
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '24px',
                textAlign: 'left'
              }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#1e40af', marginBottom: '8px' }}>
                  Your free CV scan is processing
                </div>
                <div style={{ fontSize: '13px', color: '#3b82f6', marginBottom: '12px' }}>
                  We're analyzing your CV now. Results will be emailed to you within a few minutes.
                </div>
                <button
                  onClick={() => router.push('/candidates/scan')}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#4F46E5',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  View Results Now
                </button>
              </div>
            )}

            {/* Upsell: Video Analysis */}
            <div style={{
              backgroundColor: '#faf5ff',
              border: '2px solid #e9d5ff',
              borderRadius: '16px',
              padding: '24px',
              marginBottom: '16px',
              textAlign: 'left'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 600, color: '#7c3aed', marginBottom: '4px' }}>
                    Stand out with a Video Pitch
                  </div>
                  <div style={{ fontSize: '13px', color: '#6b7280' }}>
                    Employers are 3x more likely to contact candidates with video profiles
                  </div>
                </div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#7c3aed' }}>R99</div>
              </div>
              <button
                onClick={() => router.push('/candidates/video')}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#7c3aed',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Record Video Pitch
              </button>
            </div>

            {/* Upsell: AI Coaching */}
            <div style={{
              backgroundColor: '#f0fdf4',
              border: '2px solid #bbf7d0',
              borderRadius: '16px',
              padding: '24px',
              marginBottom: '24px',
              textAlign: 'left'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 600, color: '#166534', marginBottom: '4px' }}>
                    Prepare for Interviews
                  </div>
                  <div style={{ fontSize: '13px', color: '#6b7280' }}>
                    AI coaching with practice questions for your target roles
                  </div>
                </div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#166534' }}>R149</div>
              </div>
              <button
                onClick={() => router.push('/candidates/coaching')}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#166534',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Start AI Coaching
              </button>
            </div>

            <button
              onClick={() => router.push('/')}
              style={{
                padding: '14px 32px',
                backgroundColor: '#f1f5f9',
                color: '#475569',
                border: 'none',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              Back to Home
            </button>
          </div>
        )}
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
        Support
      </button>
    </div>
  );
}
