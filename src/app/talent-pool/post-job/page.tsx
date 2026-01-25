'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// ============================================
// HIREINBOX - POST JOB TO TALENT POOL
// /talent-pool/post-job
//
// R2,500 per role
// AI matches candidates from pool
// Account required
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

export default function PostJobPage() {
  const router = useRouter();
  const [step, setStep] = useState<'info' | 'job' | 'payment' | 'success'>('info');
  const [formData, setFormData] = useState({
    jobTitle: '',
    location: '',
    workType: 'hybrid',
    salaryMin: '',
    salaryMax: '',
    experience: '',
    description: '',
    requirements: '',
    companyName: '',
    industry: ''
  });

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
        {step === 'info' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>
                Post a Job to the Talent Pool
              </h1>
              <p style={{ fontSize: '16px', color: '#64748b', lineHeight: 1.6 }}>
                AI matches your role to qualified candidates instantly
              </p>
            </div>

            {/* Pricing box */}
            <div style={{
              backgroundColor: '#0f172a',
              borderRadius: '16px',
              padding: '24px',
              marginBottom: '24px',
              color: '#ffffff',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>
                Per Role Pricing
              </div>
              <div style={{ fontSize: '42px', fontWeight: 700, marginBottom: '8px' }}>
                R2,500
              </div>
              <div style={{ fontSize: '14px', color: '#cbd5e1', marginBottom: '16px' }}>
                One-time payment • Role active for 30 days
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', fontSize: '13px', color: '#94a3b8' }}>
                <span>Unlimited matches</span>
                <span>AI ranking</span>
                <span>Contact details</span>
              </div>
            </div>

            {/* AI Intelligence Box */}
            <div style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '24px',
              marginBottom: '24px'
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '16px' }}>
                What you get with AI Matching
              </h3>
              <div style={{ display: 'grid', gap: '12px' }}>
                {[
                  { label: 'Skills-based matching', desc: 'AI understands context, not just keywords' },
                  { label: 'SA qualification aware', desc: 'Knows CA(SA), BCom, SAICA, local universities' },
                  { label: 'Experience scoring', desc: 'Quality of experience, not just years' },
                  { label: 'Ranked candidates', desc: 'Best matches first, with reasons why' },
                  { label: 'Salary alignment', desc: 'Only shows candidates in your budget' }
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 500, color: '#0f172a' }}>{item.label}</div>
                      <div style={{ fontSize: '13px', color: '#64748b' }}>{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Account required */}
            <div style={{
              backgroundColor: '#f8fafc',
              border: '2px solid #e2e8f0',
              borderRadius: '16px',
              padding: '24px',
              textAlign: 'center'
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>
                Create an employer account to continue
              </h3>
              <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '20px' }}>
                Your account lets you manage roles and track candidates.
              </p>
              <button
                onClick={() => router.push('/signup?return=/talent-pool/post-job&type=employer')}
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
                Create Employer Account
              </button>
              <button
                onClick={() => router.push('/login?return=/talent-pool/post-job&type=employer')}
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
              onClick={() => setStep('job')}
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

        {step === 'job' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>
                Describe the Role
              </h1>
              <p style={{ fontSize: '16px', color: '#64748b', lineHeight: 1.6 }}>
                The more detail you provide, the better AI can match candidates.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input
                type="text"
                placeholder="Job title *"
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <input
                  type="text"
                  placeholder="Company name *"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  style={{
                    padding: '14px 16px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '10px',
                    fontSize: '15px',
                    outline: 'none'
                  }}
                />
                <select
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  style={{
                    padding: '14px 16px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '10px',
                    fontSize: '15px',
                    outline: 'none',
                    backgroundColor: '#ffffff'
                  }}
                >
                  <option value="">Industry</option>
                  <option value="finance">Finance & Banking</option>
                  <option value="tech">Technology</option>
                  <option value="retail">Retail & FMCG</option>
                  <option value="manufacturing">Manufacturing</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="professional">Professional Services</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <input
                  type="text"
                  placeholder="Location *"
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
                <select
                  value={formData.workType}
                  onChange={(e) => setFormData({ ...formData, workType: e.target.value })}
                  style={{
                    padding: '14px 16px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '10px',
                    fontSize: '15px',
                    outline: 'none',
                    backgroundColor: '#ffffff'
                  }}
                >
                  <option value="onsite">On-site</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="remote">Remote</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <input
                  type="text"
                  placeholder="Salary min (R)"
                  value={formData.salaryMin}
                  onChange={(e) => setFormData({ ...formData, salaryMin: e.target.value })}
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
                  placeholder="Salary max (R)"
                  value={formData.salaryMax}
                  onChange={(e) => setFormData({ ...formData, salaryMax: e.target.value })}
                  style={{
                    padding: '14px 16px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '10px',
                    fontSize: '15px',
                    outline: 'none'
                  }}
                />
                <select
                  value={formData.experience}
                  onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
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
                  <option value="entry">Entry level</option>
                  <option value="2-5">2-5 years</option>
                  <option value="5-10">5-10 years</option>
                  <option value="10+">10+ years</option>
                </select>
              </div>

              <textarea
                placeholder="Job description *"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={5}
                style={{
                  padding: '14px 16px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '10px',
                  fontSize: '15px',
                  outline: 'none',
                  resize: 'vertical'
                }}
              />

              <textarea
                placeholder="Requirements (qualifications, skills, experience)"
                value={formData.requirements}
                onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                rows={4}
                style={{
                  padding: '14px 16px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '10px',
                  fontSize: '15px',
                  outline: 'none',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button
                onClick={() => setStep('info')}
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
                onClick={() => setStep('payment')}
                disabled={!formData.jobTitle || !formData.companyName || !formData.location}
                style={{
                  flex: 1,
                  padding: '16px',
                  backgroundColor: (formData.jobTitle && formData.companyName && formData.location) ? '#4F46E5' : '#e2e8f0',
                  color: (formData.jobTitle && formData.companyName && formData.location) ? '#ffffff' : '#94a3b8',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: (formData.jobTitle && formData.companyName && formData.location) ? 'pointer' : 'not-allowed'
                }}
              >
                Continue to Payment
              </button>
            </div>
          </>
        )}

        {step === 'payment' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>
                Confirm & Pay
              </h1>
            </div>

            {/* Order summary */}
            <div style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '24px',
              marginBottom: '24px'
            }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#64748b', marginBottom: '16px', textTransform: 'uppercase' }}>
                Order Summary
              </h3>
              <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '16px' }}>
                <div style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>
                  {formData.jobTitle}
                </div>
                <div style={{ fontSize: '14px', color: '#64748b' }}>
                  {formData.companyName} • {formData.location}
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', color: '#64748b' }}>Talent Pool posting (30 days)</span>
                <span style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a' }}>R2,500</span>
              </div>
            </div>

            {/* What happens next */}
            <div style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '24px'
            }}>
              <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '12px' }}>
                What happens after payment:
              </h4>
              <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: '#475569', lineHeight: 1.8 }}>
                <li>Your job is posted to the Talent Pool immediately</li>
                <li>AI scans all candidates and ranks them by fit</li>
                <li>You receive your matched candidates list within minutes</li>
                <li>Contact candidates directly - no middleman</li>
              </ol>
            </div>

            <button
              onClick={() => {
                // In production, redirect to PayFast
                alert('In production, this would redirect to PayFast for payment.');
                setStep('success');
              }}
              style={{
                width: '100%',
                padding: '18px',
                backgroundColor: '#4F46E5',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                fontSize: '18px',
                fontWeight: 600,
                cursor: 'pointer',
                marginBottom: '12px'
              }}
            >
              Pay R2,500 with PayFast
            </button>
            <button
              onClick={() => setStep('job')}
              style={{
                width: '100%',
                padding: '14px',
                backgroundColor: 'transparent',
                color: '#64748b',
                border: 'none',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Back to edit
            </button>
          </>
        )}

        {step === 'success' && (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <div style={{ fontSize: '64px', marginBottom: '24px' }}>✓</div>
            <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>
              Job Posted Successfully!
            </h1>
            <p style={{ fontSize: '16px', color: '#64748b', lineHeight: 1.6, marginBottom: '32px' }}>
              AI is now matching candidates to your role. Check your email for the results.
            </p>

            <div style={{
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '24px',
              textAlign: 'left'
            }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#166534', marginBottom: '8px' }}>
                AI Matching in Progress
              </div>
              <div style={{ fontSize: '13px', color: '#15803d' }}>
                We're scanning our talent pool for the best matches. You'll receive an email with ranked candidates shortly.
              </div>
            </div>

            {/* Upsell: Full CV Screening Service */}
            <div style={{
              backgroundColor: '#0f172a',
              borderRadius: '16px',
              padding: '24px',
              marginBottom: '24px',
              textAlign: 'left',
              color: '#ffffff'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <div style={{
                    display: 'inline-block',
                    padding: '4px 10px',
                    backgroundColor: '#4F46E5',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 600,
                    marginBottom: '8px'
                  }}>
                    UPGRADE
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>
                    Get Full CV Screening Service
                  </div>
                  <div style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.6 }}>
                    Beyond the talent pool - screen unlimited incoming CVs with AI, send AI interviews, and get detailed candidate rankings.
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                {[
                  'Screen unlimited CVs',
                  'AI Interview add-on',
                  'Verification checks',
                  'Candidate ranking'
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#cbd5e1' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    {item}
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ fontSize: '14px', color: '#94a3b8' }}>From R1,750/role</span>
                <span style={{ fontSize: '12px', color: '#94a3b8', textDecoration: 'line-through' }}>vs R2,500 talent pool only</span>
              </div>

              <button
                onClick={() => router.push('/hire/business')}
                style={{
                  width: '100%',
                  padding: '14px',
                  backgroundColor: '#4F46E5',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Learn About Full Service
              </button>
            </div>

            {/* Upsell: Talent Intelligence */}
            <div style={{
              backgroundColor: '#faf5ff',
              border: '2px solid #e9d5ff',
              borderRadius: '16px',
              padding: '24px',
              marginBottom: '24px',
              textAlign: 'left'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 600, color: '#7c3aed', marginBottom: '4px' }}>
                    Need more candidates?
                  </div>
                  <div style={{ fontSize: '13px', color: '#6b7280' }}>
                    Search beyond our pool with Talent Intelligence - find passive candidates across the web.
                  </div>
                </div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#7c3aed' }}>R799</div>
              </div>
              <button
                onClick={() => router.push('/hire/recruiter/mapping')}
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
                Try Talent Intelligence
              </button>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => router.push('/hire/dashboard')}
                style={{
                  padding: '14px 32px',
                  backgroundColor: '#4F46E5',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '16px',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                View Dashboard
              </button>
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
