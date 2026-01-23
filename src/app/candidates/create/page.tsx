'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// ============================================
// HIREINBOX B2C - CV BUILDER
// /candidates/create
//
// Step-by-step CV creation for those without a CV
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

interface FormData {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  education: string;
  skills: string;
  experience: string;
  summary: string;
}

function CreateCVContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stage = searchParams.get('stage') || 'student';
  const isNewCareer = stage === 'student' || stage === 'graduate';

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    phone: '',
    location: '',
    education: '',
    skills: '',
    experience: '',
    summary: ''
  });
  const [generating, setGenerating] = useState(false);

  const totalSteps = 4;

  const updateField = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleGenerate = () => {
    setGenerating(true);
    // In production: Call AI API to generate CV
    setTimeout(() => {
      router.push(`/candidates/scan?stage=${stage}&source=created`);
    }, 2000);
  };

  const inputStyle = {
    width: '100%',
    padding: '14px 16px',
    fontSize: '16px',
    border: '2px solid #e2e8f0',
    borderRadius: '10px',
    outline: 'none',
    transition: 'border-color 0.2s'
  };

  const labelStyle = {
    display: 'block',
    fontSize: '14px',
    fontWeight: 600,
    color: '#0f172a',
    marginBottom: '8px'
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
          onClick={() => router.push(isNewCareer ? `/candidates/new-career?stage=${stage}` : `/candidates/cv?stage=${stage}`)}
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

      {/* Progress bar */}
      <div style={{
        backgroundColor: '#ffffff',
        padding: '16px 24px',
        borderBottom: '1px solid #e2e8f0'
      }}>
        <div style={{
          maxWidth: '600px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: '4px',
                backgroundColor: i < step ? '#4F46E5' : '#e2e8f0',
                borderRadius: '2px',
                transition: 'background-color 0.3s'
              }}
            />
          ))}
        </div>
        <div style={{
          maxWidth: '600px',
          margin: '8px auto 0',
          fontSize: '13px',
          color: '#64748b',
          textAlign: 'center'
        }}>
          Step {step} of {totalSteps}
        </div>
      </div>

      {/* Main content */}
      <main style={{
        maxWidth: '600px',
        margin: '0 auto',
        padding: '48px 24px'
      }}>
        {/* Step 1: Personal Details */}
        {step === 1 && (
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
              Personal Details
            </h2>
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '32px' }}>
              Let's start with the basics.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={labelStyle}>Full Name</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => updateField('fullName', e.target.value)}
                  placeholder="e.g. Thabo Mokoena"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="e.g. thabo@email.com"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Phone Number</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  placeholder="e.g. 071 234 5678"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => updateField('location', e.target.value)}
                  placeholder="e.g. Johannesburg, Gauteng"
                  style={inputStyle}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Education */}
        {step === 2 && (
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
              Education
            </h2>
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '32px' }}>
              Tell us about your academic background.
            </p>

            <div>
              <label style={labelStyle}>Your Education</label>
              <textarea
                value={formData.education}
                onChange={(e) => updateField('education', e.target.value)}
                placeholder={isNewCareer
                  ? "e.g.\nBCom Accounting, University of Cape Town\n2022 - Present (expected 2025)\n\nMatric, Springfield High School\n2021 - Distinction"
                  : "e.g.\nBCom Honours, University of Johannesburg\n2020\n\nBCom Accounting, University of Johannesburg\n2019"}
                rows={8}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>
                Include institution name, qualification, and years attended.
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Skills & Experience */}
        {step === 3 && (
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
              Skills & Experience
            </h2>
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '32px' }}>
              {isNewCareer
                ? "Include any skills you've learned and experience, even if it's informal."
                : "Highlight your key skills and work experience."}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <label style={labelStyle}>Skills</label>
                <textarea
                  value={formData.skills}
                  onChange={(e) => updateField('skills', e.target.value)}
                  placeholder={isNewCareer
                    ? "e.g.\n- Microsoft Excel (intermediate)\n- Basic Python programming\n- Good written communication\n- Team collaboration"
                    : "e.g.\n- Financial analysis\n- Advanced Excel (pivot tables, VBA)\n- SAP experience\n- Team leadership"}
                  rows={5}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>

              <div>
                <label style={labelStyle}>Experience</label>
                <textarea
                  value={formData.experience}
                  onChange={(e) => updateField('experience', e.target.value)}
                  placeholder={isNewCareer
                    ? "e.g.\nTutor, UCT Maths Department (Part-time)\nJan 2024 - Present\n- Helped 15 students improve their grades\n- Created study materials\n\nVolunteer, Habitat for Humanity\n2023\n- Assisted with community building projects"
                    : "e.g.\nJunior Accountant, ABC Company\nJan 2021 - Present\n- Processed monthly reconciliations\n- Prepared financial reports"}
                  rows={8}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>
                  {isNewCareer
                    ? "Include internships, part-time jobs, volunteering, or projects."
                    : "Include job title, company, dates, and key achievements."}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Summary */}
        {step === 4 && (
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
              Professional Summary
            </h2>
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '32px' }}>
              A brief introduction that goes at the top of your CV.
            </p>

            <div>
              <label style={labelStyle}>About You</label>
              <textarea
                value={formData.summary}
                onChange={(e) => updateField('summary', e.target.value)}
                placeholder={isNewCareer
                  ? "e.g. Enthusiastic BCom student at UCT with strong analytical skills and a passion for finance. Seeking an internship opportunity to apply my academic knowledge in a practical setting while developing professional skills."
                  : "e.g. Qualified accountant with 3 years of experience in financial reporting and analysis. Strong attention to detail and proven ability to meet tight deadlines."}
                rows={5}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>
                Keep it to 2-3 sentences. Focus on what makes you unique.
              </div>
            </div>

            {/* Preview */}
            <div style={{
              marginTop: '32px',
              padding: '20px',
              backgroundColor: '#f0fdf4',
              border: '1px solid #86efac',
              borderRadius: '12px'
            }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#166534', marginBottom: '8px' }}>
                Ready to generate your CV
              </div>
              <div style={{ fontSize: '13px', color: '#166534', lineHeight: 1.5 }}>
                We'll create a professional CV based on your information and give you feedback on how to improve it.
              </div>
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '48px',
          gap: '16px'
        }}>
          <button
            onClick={handleBack}
            disabled={step === 1}
            style={{
              padding: '14px 28px',
              backgroundColor: 'transparent',
              color: step === 1 ? '#cbd5e1' : '#64748b',
              border: '2px solid #e2e8f0',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: step === 1 ? 'not-allowed' : 'pointer'
            }}
          >
            Back
          </button>

          {step < totalSteps ? (
            <button
              onClick={handleNext}
              style={{
                padding: '14px 28px',
                backgroundColor: '#4F46E5',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Continue
            </button>
          ) : (
            <button
              onClick={handleGenerate}
              disabled={generating}
              style={{
                padding: '14px 28px',
                backgroundColor: generating ? '#94a3b8' : '#10B981',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: generating ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {generating ? 'Generating...' : 'Generate My CV'}
            </button>
          )}
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
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 50
        }}
      >
        <span aria-hidden="true">💬</span> Support
      </button>
    </div>
  );
}

export default function CreateCVPage() {
  return (
    <Suspense fallback={<div style={{ padding: '48px', textAlign: 'center' }}>Loading...</div>}>
      <CreateCVContent />
    </Suspense>
  );
}
