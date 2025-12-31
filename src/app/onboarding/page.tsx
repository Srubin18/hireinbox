'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

// ============================================
// HireInbox Onboarding - Smooth multi-step wizard
// Creates a welcoming first-time experience
// ============================================

// Logo Component
const Logo = ({ size = 40 }: { size?: number }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="12" fill="#4F46E5"/>
      <path d="M12 18L24 26L36 18V32C36 33.1 35.1 34 34 34H14C12.9 34 12 33.1 12 32V18Z" fill="white" fillOpacity="0.9"/>
      <path d="M34 14H14C12.9 14 12 14.9 12 16V18L24 26L36 18V16C36 14.9 35.1 14 34 14Z" fill="white"/>
      <circle cx="36" cy="12" r="9" fill="#10B981"/>
      <path d="M32.5 12L35 14.5L39.5 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <span style={{ fontSize: size > 32 ? '1.35rem' : '1.15rem', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
        <span style={{ color: '#0f172a' }}>Hire</span>
        <span style={{ color: '#4F46E5' }}>Inbox</span>
      </span>
      <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 500 }}>Less noise. Better hires.</span>
    </div>
  </div>
);

// Industry options for employers
const INDUSTRIES = [
  'Technology',
  'Finance & Banking',
  'Property & Real Estate',
  'Healthcare',
  'Retail',
  'Manufacturing',
  'Professional Services',
  'Education',
  'Hospitality',
  'Other'
];

// Company size options
const COMPANY_SIZES = [
  { value: '1-10', label: '1-10 employees' },
  { value: '11-50', label: '11-50 employees' },
  { value: '51-200', label: '51-200 employees' },
  { value: '201-500', label: '201-500 employees' },
  { value: '500+', label: '500+ employees' }
];

// Step indicator component
const StepIndicator = ({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 32 }}>
    {Array.from({ length: totalSteps }, (_, i) => (
      <div
        key={i}
        style={{
          width: i + 1 === currentStep ? 32 : 10,
          height: 10,
          borderRadius: 5,
          backgroundColor: i + 1 <= currentStep ? '#4F46E5' : '#E2E8F0',
          transition: 'all 0.3s ease'
        }}
      />
    ))}
  </div>
);

function OnboardingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  // Step state
  const [currentStep, setCurrentStep] = useState(1);
  const [userType, setUserType] = useState<'employer' | 'jobseeker' | null>(
    searchParams.get('type') === 'jobseeker' ? 'jobseeker' :
    searchParams.get('type') === 'employer' ? 'employer' : null
  );

  // Employer form state
  const [companyName, setCompanyName] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [industry, setIndustry] = useState('');

  // Role form state (for employers)
  const [roleTitle, setRoleTitle] = useState('');
  const [roleLocation, setRoleLocation] = useState('');
  const [roleExperience, setRoleExperience] = useState('');
  const [roleSkills, setRoleSkills] = useState('');

  // Loading/error states
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if onboarding already completed
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const completed = localStorage.getItem('onboarding_completed');
      if (completed === 'true') {
        // Already completed, redirect to appropriate page
        if (userType === 'jobseeker') {
          router.replace('/upload');
        } else {
          router.replace('/');
        }
      }
    }
  }, [router, userType]);

  // Total steps based on user type
  const totalSteps = userType === 'employer' ? 3 : userType === 'jobseeker' ? 2 : 1;

  // Handle skip onboarding
  const handleSkip = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('onboarding_completed', 'true');
      localStorage.setItem('onboarding_skipped', 'true');
    }
    if (userType === 'jobseeker') {
      router.push('/upload');
    } else {
      router.push('/');
    }
  };

  // Handle step 1 - User type selection
  const handleUserTypeSelect = (type: 'employer' | 'jobseeker') => {
    setUserType(type);
    setCurrentStep(2);
  };

  // Handle employer company details submission
  const handleCompanySubmit = () => {
    if (!companyName.trim()) {
      setError('Please enter your company name');
      return;
    }
    setError(null);
    // Store company details in localStorage for now
    if (typeof window !== 'undefined') {
      localStorage.setItem('company_name', companyName);
      localStorage.setItem('company_size', companySize);
      localStorage.setItem('company_industry', industry);
    }
    setCurrentStep(3);
  };

  // Handle role creation
  const handleRoleSubmit = async () => {
    if (!roleTitle.trim()) {
      setError('Please enter a role title');
      return;
    }
    setError(null);
    setSubmitting(true);

    try {
      // Create role via API
      const response = await fetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: roleTitle,
          status: 'active',
          criteria: {
            min_experience_years: roleExperience ? parseInt(roleExperience) : 0,
            required_skills: roleSkills.split(',').map(s => s.trim()).filter(Boolean),
            preferred_skills: [],
            locations: roleLocation ? [roleLocation] : ['Remote']
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create role');
      }

      // Mark onboarding as complete
      if (typeof window !== 'undefined') {
        localStorage.setItem('onboarding_completed', 'true');
        localStorage.setItem('first_role_created', 'true');
      }

      // Redirect to dashboard
      router.push('/?onboarding=complete');
    } catch {
      setError('Failed to create role. You can create one from the dashboard.');
      // Still complete onboarding
      if (typeof window !== 'undefined') {
        localStorage.setItem('onboarding_completed', 'true');
      }
      setTimeout(() => router.push('/'), 2000);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle job seeker CV upload redirect
  const handleJobSeekerContinue = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('onboarding_completed', 'true');
    }
    router.push('/upload?onboarding=complete');
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff'
      }}>
        <div style={{ textAlign: 'center' }}>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
            <circle cx="24" cy="24" r="20" stroke="#E5E7EB" strokeWidth="4" fill="none"/>
            <circle cx="24" cy="24" r="20" stroke="#4F46E5" strokeWidth="4" fill="none" strokeDasharray="80" strokeDashoffset="60" strokeLinecap="round"/>
          </svg>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#ffffff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <header style={{
        padding: '20px 32px',
        borderBottom: '1px solid #f1f5f9',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Logo />
        <button
          onClick={handleSkip}
          style={{
            background: 'none',
            border: 'none',
            color: '#64748b',
            fontSize: '0.875rem',
            fontWeight: 500,
            cursor: 'pointer',
            padding: '8px 16px',
            borderRadius: 8,
            transition: 'all 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          Skip for now
        </button>
      </header>

      {/* Main Content */}
      <main style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px'
      }}>
        <div style={{ width: '100%', maxWidth: 520 }}>
          {/* Step Indicator */}
          {userType && <StepIndicator currentStep={currentStep} totalSteps={totalSteps} />}

          {/* Error Message */}
          {error && (
            <div style={{
              backgroundColor: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: 12,
              padding: '12px 16px',
              marginBottom: 24,
              display: 'flex',
              alignItems: 'center',
              gap: 10
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span style={{ color: '#DC2626', fontSize: '0.875rem' }}>{error}</span>
            </div>
          )}

          {/* Step 1: User Type Selection */}
          {currentStep === 1 && !userType && (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 80,
                height: 80,
                backgroundColor: '#EEF2FF',
                borderRadius: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px'
              }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>

              <h1 style={{
                fontSize: '1.875rem',
                fontWeight: 700,
                color: '#0f172a',
                marginBottom: 12,
                letterSpacing: '-0.02em'
              }}>
                Welcome to HireInbox{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name.split(' ')[0]}` : ''}!
              </h1>
              <p style={{
                fontSize: '1.125rem',
                color: '#64748b',
                marginBottom: 40,
                lineHeight: 1.6
              }}>
                Let&apos;s set things up so you get the most out of HireInbox.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <button
                  onClick={() => handleUserTypeSelect('employer')}
                  style={{
                    width: '100%',
                    padding: '20px 24px',
                    backgroundColor: '#ffffff',
                    border: '2px solid #e2e8f0',
                    borderRadius: 16,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    transition: 'all 0.2s ease',
                    textAlign: 'left'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#4F46E5'; e.currentTarget.style.backgroundColor = '#FAFAFE'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.backgroundColor = '#ffffff'; }}
                >
                  <div style={{
                    width: 56,
                    height: 56,
                    backgroundColor: '#EEF2FF',
                    borderRadius: 14,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2">
                      <path d="M3 21h18"/>
                      <path d="M5 21V7l8-4v18"/>
                      <path d="M19 21V11l-6-4"/>
                      <path d="M9 9v.01"/>
                      <path d="M9 12v.01"/>
                      <path d="M9 15v.01"/>
                      <path d="M9 18v.01"/>
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>
                      I&apos;m hiring
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                      Screen CVs, manage candidates, and build your team
                    </div>
                  </div>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" style={{ marginLeft: 'auto' }}>
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </button>

                <button
                  onClick={() => handleUserTypeSelect('jobseeker')}
                  style={{
                    width: '100%',
                    padding: '20px 24px',
                    backgroundColor: '#ffffff',
                    border: '2px solid #e2e8f0',
                    borderRadius: 16,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    transition: 'all 0.2s ease',
                    textAlign: 'left'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#10B981'; e.currentTarget.style.backgroundColor = '#F0FDF9'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.backgroundColor = '#ffffff'; }}
                >
                  <div style={{
                    width: 56,
                    height: 56,
                    backgroundColor: '#ECFDF5',
                    borderRadius: 14,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14,2 14,8 20,8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                      <polyline points="10,9 9,9 8,9"/>
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>
                      I&apos;m job seeking
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                      Get your CV scored and find out how to improve it
                    </div>
                  </div>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" style={{ marginLeft: 'auto' }}>
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Step 2 for Employers: Company Details */}
          {currentStep === 2 && userType === 'employer' && (
            <div>
              <button
                onClick={() => setCurrentStep(1)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  marginBottom: 24,
                  padding: 0
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 18l-6-6 6-6"/>
                </svg>
                Back
              </button>

              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: '#0f172a',
                marginBottom: 8,
                letterSpacing: '-0.02em'
              }}>
                Tell us about your company
              </h2>
              <p style={{
                fontSize: '1rem',
                color: '#64748b',
                marginBottom: 32
              }}>
                This helps us personalize your experience.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Company Name */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: '#374151',
                    marginBottom: 6
                  }}>
                    Company name *
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g., Acme Corp"
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      fontSize: '16px',
                      border: '1px solid #e2e8f0',
                      borderRadius: 10,
                      outline: 'none',
                      transition: 'border-color 0.2s ease',
                      boxSizing: 'border-box'
                    }}
                    onFocus={e => e.target.style.borderColor = '#4F46E5'}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                  />
                </div>

                {/* Company Size */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: '#374151',
                    marginBottom: 6
                  }}>
                    Company size
                  </label>
                  <select
                    value={companySize}
                    onChange={(e) => setCompanySize(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      fontSize: '16px',
                      border: '1px solid #e2e8f0',
                      borderRadius: 10,
                      outline: 'none',
                      backgroundColor: '#ffffff',
                      cursor: 'pointer',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="">Select size...</option>
                    {COMPANY_SIZES.map(size => (
                      <option key={size.value} value={size.value}>{size.label}</option>
                    ))}
                  </select>
                </div>

                {/* Industry */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: '#374151',
                    marginBottom: 6
                  }}>
                    Industry
                  </label>
                  <select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      fontSize: '16px',
                      border: '1px solid #e2e8f0',
                      borderRadius: 10,
                      outline: 'none',
                      backgroundColor: '#ffffff',
                      cursor: 'pointer',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="">Select industry...</option>
                    {INDUSTRIES.map(ind => (
                      <option key={ind} value={ind}>{ind}</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleCompanySubmit}
                  style={{
                    width: '100%',
                    padding: '14px 20px',
                    backgroundColor: '#4F46E5',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 10,
                    fontSize: '0.9375rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    marginTop: 8,
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#4338CA'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = '#4F46E5'}
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 3 for Employers: Create First Role */}
          {currentStep === 3 && userType === 'employer' && (
            <div>
              <button
                onClick={() => setCurrentStep(2)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  marginBottom: 24,
                  padding: 0
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 18l-6-6 6-6"/>
                </svg>
                Back
              </button>

              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: '#0f172a',
                marginBottom: 8,
                letterSpacing: '-0.02em'
              }}>
                Create your first role
              </h2>
              <p style={{
                fontSize: '1rem',
                color: '#64748b',
                marginBottom: 32
              }}>
                This is the role you&apos;ll be screening CVs for.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Role Title */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: '#374151',
                    marginBottom: 6
                  }}>
                    Role title *
                  </label>
                  <input
                    type="text"
                    value={roleTitle}
                    onChange={(e) => setRoleTitle(e.target.value)}
                    placeholder="e.g., Senior Software Engineer"
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      fontSize: '16px',
                      border: '1px solid #e2e8f0',
                      borderRadius: 10,
                      outline: 'none',
                      transition: 'border-color 0.2s ease',
                      boxSizing: 'border-box'
                    }}
                    onFocus={e => e.target.style.borderColor = '#4F46E5'}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                  />
                </div>

                {/* Location */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: '#374151',
                    marginBottom: 6
                  }}>
                    Location
                  </label>
                  <input
                    type="text"
                    value={roleLocation}
                    onChange={(e) => setRoleLocation(e.target.value)}
                    placeholder="e.g., Cape Town, Remote"
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      fontSize: '16px',
                      border: '1px solid #e2e8f0',
                      borderRadius: 10,
                      outline: 'none',
                      transition: 'border-color 0.2s ease',
                      boxSizing: 'border-box'
                    }}
                    onFocus={e => e.target.style.borderColor = '#4F46E5'}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                  />
                </div>

                {/* Experience */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: '#374151',
                    marginBottom: 6
                  }}>
                    Minimum years of experience
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={roleExperience}
                    onChange={(e) => setRoleExperience(e.target.value)}
                    placeholder="e.g., 3"
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      fontSize: '16px',
                      border: '1px solid #e2e8f0',
                      borderRadius: 10,
                      outline: 'none',
                      transition: 'border-color 0.2s ease',
                      boxSizing: 'border-box'
                    }}
                    onFocus={e => e.target.style.borderColor = '#4F46E5'}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                  />
                </div>

                {/* Required Skills */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: '#374151',
                    marginBottom: 6
                  }}>
                    Required skills (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={roleSkills}
                    onChange={(e) => setRoleSkills(e.target.value)}
                    placeholder="e.g., React, TypeScript, Node.js"
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      fontSize: '16px',
                      border: '1px solid #e2e8f0',
                      borderRadius: 10,
                      outline: 'none',
                      transition: 'border-color 0.2s ease',
                      boxSizing: 'border-box'
                    }}
                    onFocus={e => e.target.style.borderColor = '#4F46E5'}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                  />
                </div>

                <button
                  onClick={handleRoleSubmit}
                  disabled={submitting}
                  style={{
                    width: '100%',
                    padding: '14px 20px',
                    backgroundColor: submitting ? '#93C5FD' : '#4F46E5',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 10,
                    fontSize: '0.9375rem',
                    fontWeight: 600,
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    marginTop: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={e => { if (!submitting) e.currentTarget.style.backgroundColor = '#4338CA'; }}
                  onMouseLeave={e => { if (!submitting) e.currentTarget.style.backgroundColor = '#4F46E5'; }}
                >
                  {submitting ? (
                    <>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
                        <circle cx="12" cy="12" r="10" stroke="#ffffff" strokeWidth="3" fill="none" strokeDasharray="60" strokeLinecap="round"/>
                      </svg>
                      Creating role...
                    </>
                  ) : (
                    'Create role & go to dashboard'
                  )}
                </button>

                <button
                  onClick={handleSkip}
                  style={{
                    width: '100%',
                    padding: '12px 20px',
                    backgroundColor: 'transparent',
                    color: '#64748b',
                    border: '1px solid #e2e8f0',
                    borderRadius: 10,
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  Skip - I&apos;ll create a role later
                </button>
              </div>
            </div>
          )}

          {/* Step 2 for Job Seekers: Ready to upload */}
          {currentStep === 2 && userType === 'jobseeker' && (
            <div style={{ textAlign: 'center' }}>
              <button
                onClick={() => { setUserType(null); setCurrentStep(1); }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  marginBottom: 24,
                  padding: 0
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 18l-6-6 6-6"/>
                </svg>
                Back
              </button>

              <div style={{
                width: 80,
                height: 80,
                backgroundColor: '#ECFDF5',
                borderRadius: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px'
              }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14,2 14,8 20,8"/>
                  <path d="M12 18v-6"/>
                  <path d="M9 15l3-3 3 3"/>
                </svg>
              </div>

              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: '#0f172a',
                marginBottom: 12,
                letterSpacing: '-0.02em'
              }}>
                Ready to check your CV?
              </h2>
              <p style={{
                fontSize: '1rem',
                color: '#64748b',
                marginBottom: 32,
                lineHeight: 1.6
              }}>
                Upload your CV and get instant feedback on how to improve it. Your first assessment is free!
              </p>

              <div style={{
                backgroundColor: '#f8fafc',
                borderRadius: 16,
                padding: 24,
                marginBottom: 24,
                textAlign: 'left'
              }}>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a', marginBottom: 16 }}>
                  What you&apos;ll get:
                </p>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#10B981" style={{ flexShrink: 0, marginTop: 2 }}>
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                    </svg>
                    <span style={{ color: '#374151', fontSize: '0.9375rem' }}>
                      <strong>Overall score</strong> - See how you compare to other candidates
                    </span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#10B981" style={{ flexShrink: 0, marginTop: 2 }}>
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                    </svg>
                    <span style={{ color: '#374151', fontSize: '0.9375rem' }}>
                      <strong>Strengths identified</strong> - What makes you stand out
                    </span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#10B981" style={{ flexShrink: 0, marginTop: 2 }}>
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                    </svg>
                    <span style={{ color: '#374151', fontSize: '0.9375rem' }}>
                      <strong>Improvement areas</strong> - Specific tips to boost your score
                    </span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#10B981" style={{ flexShrink: 0, marginTop: 2 }}>
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                    </svg>
                    <span style={{ color: '#374151', fontSize: '0.9375rem' }}>
                      <strong>Role suggestions</strong> - Roles where you&apos;d be a great fit
                    </span>
                  </li>
                </ul>
              </div>

              <button
                onClick={handleJobSeekerContinue}
                style={{
                  width: '100%',
                  padding: '16px 24px',
                  backgroundColor: '#10B981',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#059669'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#10B981'}
              >
                Upload my CV now
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14"/>
                  <path d="M12 5l7 7-7 7"/>
                </svg>
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        padding: '20px 32px',
        borderTop: '1px solid #f1f5f9',
        textAlign: 'center'
      }}>
        <p style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>
          Built in Cape Town, South Africa
        </p>
      </footer>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: #9CA3AF; }
        @media (max-width: 480px) {
          header { padding: 16px !important; }
          main { padding: 24px 16px !important; }
        }
      `}</style>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff'
      }}>
        <div style={{ textAlign: 'center' }}>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
            <circle cx="24" cy="24" r="20" stroke="#E5E7EB" strokeWidth="4" fill="none"/>
            <circle cx="24" cy="24" r="20" stroke="#4F46E5" strokeWidth="4" fill="none" strokeDasharray="80" strokeDashoffset="60" strokeLinecap="round"/>
          </svg>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    }>
      <OnboardingPageContent />
    </Suspense>
  );
}
