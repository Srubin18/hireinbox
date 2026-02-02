'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// ============================================
// HIREINBOX B2C - CREATE CV (NO CV PATH)
// Ultra simple for IQ 90-100 market
// ============================================

export default function CreateCVPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    jobTitle: '',
    experience: ''
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isFormValid = formData.fullName && formData.email && formData.jobTitle;

  const handleSubmit = async () => {
    if (!isFormValid) return;

    setIsGenerating(true);

    // TODO: In production, call AI to generate CV
    // For now, simulate and redirect to talent pool
    setTimeout(() => {
      router.push('/talent-pool/join');
    }, 2000);
  };

  // GENERATING STATE
  if (isGenerating) {
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
          Creating your profile...
        </div>
        <div style={{ fontSize: 16, color: '#64748b' }}>
          This takes a few seconds
        </div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // FORM
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#ffffff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header */}
      <header style={{
        padding: '16px 24px',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        gap: 12
      }}>
        <button
          onClick={() => router.back()}
          style={{
            padding: '8px 12px',
            backgroundColor: 'transparent',
            border: 'none',
            fontSize: 14,
            color: '#64748b',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Back
        </button>
      </header>

      <div style={{ maxWidth: 500, margin: '0 auto', padding: '40px 24px' }}>
        {/* Icon */}
        <div style={{
          width: 72,
          height: 72,
          borderRadius: 16,
          backgroundColor: '#4F46E5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px'
        }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2">
            <path d="M12 20h9"/>
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
          </svg>
        </div>

        {/* Heading */}
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#0f172a', marginBottom: 12, textAlign: 'center' }}>
          No CV? No Problem!
        </h1>
        <p style={{ fontSize: 16, color: '#64748b', marginBottom: 32, textAlign: 'center', lineHeight: 1.6 }}>
          Tell us a bit about yourself and we'll help you get started.
        </p>

        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Full Name */}
          <div>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
              Your full name *
            </label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => updateField('fullName', e.target.value)}
              placeholder="e.g. Thabo Molefe"
              style={{
                width: '100%',
                padding: '14px 16px',
                fontSize: 16,
                border: '2px solid #e2e8f0',
                borderRadius: 10,
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Email */}
          <div>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
              Your email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => updateField('email', e.target.value)}
              placeholder="e.g. thabo@gmail.com"
              style={{
                width: '100%',
                padding: '14px 16px',
                fontSize: 16,
                border: '2px solid #e2e8f0',
                borderRadius: 10,
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Phone */}
          <div>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
              Phone number
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              placeholder="e.g. 082 123 4567"
              style={{
                width: '100%',
                padding: '14px 16px',
                fontSize: 16,
                border: '2px solid #e2e8f0',
                borderRadius: 10,
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Job Title */}
          <div>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
              What job are you looking for? *
            </label>
            <input
              type="text"
              value={formData.jobTitle}
              onChange={(e) => updateField('jobTitle', e.target.value)}
              placeholder="e.g. Admin Assistant, Sales Rep, Driver"
              style={{
                width: '100%',
                padding: '14px 16px',
                fontSize: 16,
                border: '2px solid #e2e8f0',
                borderRadius: 10,
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Experience */}
          <div>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
              Tell us about your experience (optional)
            </label>
            <textarea
              value={formData.experience}
              onChange={(e) => updateField('experience', e.target.value)}
              placeholder="e.g. I worked at Pick n Pay for 2 years as a cashier..."
              rows={4}
              style={{
                width: '100%',
                padding: '14px 16px',
                fontSize: 16,
                border: '2px solid #e2e8f0',
                borderRadius: 10,
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!isFormValid}
            style={{
              width: '100%',
              padding: 18,
              backgroundColor: isFormValid ? '#4F46E5' : '#cbd5e1',
              color: '#ffffff',
              border: 'none',
              borderRadius: 12,
              fontSize: 18,
              fontWeight: 700,
              cursor: isFormValid ? 'pointer' : 'not-allowed',
              marginTop: 12
            }}
          >
            Continue
          </button>

          <p style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center' }}>
            We'll add you to our Talent Pool so employers can find you
          </p>
        </div>
      </div>

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
