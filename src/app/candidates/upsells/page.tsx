'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// ============================================
// HIREINBOX B2C - OPTIONAL UPSELLS
// /candidates/upsells
//
// Services:
// - AI interview coaching
// - Industry guidance
// - Confidence coaching
// - Video introduction analysis
//
// Payment: Yoco, one-off purchases only
// ============================================

interface Service {
  id: string;
  name: string;
  description: string;
  features: string[];
  price: number;
  popular?: boolean;
}

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
        <span style={{ color: '#4F46E5' }}>Hyred</span>
      </div>
    </div>
  </div>
);

const services: Service[] = [
  {
    id: 'interview-coaching',
    name: 'AI Interview Coaching',
    description: 'Practice interviews with AI feedback on your answers, body language tips, and common question preparation.',
    features: [
      '10 practice interview sessions',
      'Industry-specific questions',
      'Real-time feedback on answers',
      'Tips for common tough questions',
      'Confidence scoring'
    ],
    price: 199,
    popular: true
  },
  {
    id: 'video-analysis',
    name: 'Video Introduction Analysis',
    description: 'Record a 60-second video pitch and get AI analysis on presentation, clarity, and impact.',
    features: [
      'Unlimited video recordings',
      'AI analysis of delivery',
      'Body language feedback',
      'Speech pace & clarity check',
      'Professional tips'
    ],
    price: 149
  },
  {
    id: 'industry-guidance',
    name: 'Industry Guidance',
    description: 'Personalized insights on your target industry including salary benchmarks, required skills, and career paths.',
    features: [
      'Salary benchmarking report',
      'Skills gap analysis',
      'Career path visualization',
      'Industry trends summary',
      'Top companies to target'
    ],
    price: 129
  },
  {
    id: 'confidence-coaching',
    name: 'Confidence Coaching',
    description: 'Build interview confidence with mindset exercises, anxiety management techniques, and positive framing.',
    features: [
      'Pre-interview routines',
      'Anxiety management tips',
      'Power posing techniques',
      'Positive self-talk scripts',
      'Recovery strategies'
    ],
    price: 99
  }
];

function UpsellsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stage = searchParams.get('stage') || 'experienced';

  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());
  const [processing, setProcessing] = useState(false);

  const toggleService = (id: string) => {
    const newSelected = new Set(selectedServices);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedServices(newSelected);
  };

  const totalPrice = services
    .filter(s => selectedServices.has(s.id))
    .reduce((sum, s) => sum + s.price, 0);

  const handleCheckout = () => {
    if (selectedServices.size === 0) return;
    setProcessing(true);

    // In production: redirect to Yoco payment
    setTimeout(() => {
      router.push('/candidates/dashboard');
    }, 1500);
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
          onClick={() => router.push('/candidates/scan')}
          style={{
            padding: '8px 16px',
            backgroundColor: 'transparent',
            color: '#64748b',
            border: 'none',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          ← Back to results
        </button>
      </header>

      {/* Main content */}
      <main style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: '32px 24px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: 700,
            color: '#0f172a',
            marginBottom: '12px'
          }}>
            Level up your job search
          </h1>
          <p style={{
            fontSize: '16px',
            color: '#64748b',
            maxWidth: '500px',
            margin: '0 auto',
            lineHeight: 1.6
          }}>
            Choose the services that fit your needs. One-time purchases, no subscriptions.
          </p>
        </div>

        {/* Services grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
          marginBottom: '32px'
        }}>
          {services.map((service) => (
            <div
              key={service.id}
              onClick={() => toggleService(service.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  toggleService(service.id);
                }
              }}
              role="checkbox"
              aria-checked={selectedServices.has(service.id)}
              aria-label={`Select ${service.name} - R${service.price}`}
              tabIndex={0}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                padding: '24px',
                border: `2px solid ${selectedServices.has(service.id) ? '#4F46E5' : '#e2e8f0'}`,
                cursor: 'pointer',
                transition: 'all 0.2s',
                position: 'relative',
                outline: 'none'
              }}
            >
              {service.popular && (
                <div style={{
                  position: 'absolute',
                  top: '-10px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  backgroundColor: '#10B981',
                  color: '#ffffff',
                  padding: '4px 12px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: 600
                }}>
                  Most Popular
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                  {service.name}
                </h3>
                <input
                  type="checkbox"
                  checked={selectedServices.has(service.id)}
                  onChange={() => toggleService(service.id)}
                  onClick={(e) => e.stopPropagation()}
                  aria-hidden="true"
                  tabIndex={-1}
                  style={{ width: '20px', height: '20px', accentColor: '#4F46E5' }}
                />
              </div>

              <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '16px', lineHeight: 1.5 }}>
                {service.description}
              </p>

              <ul style={{ margin: '0 0 20px 0', padding: 0, listStyle: 'none' }}>
                {service.features.map((feature, i) => (
                  <li key={i} style={{
                    fontSize: '13px',
                    color: '#475569',
                    marginBottom: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span style={{ color: '#10B981' }}>✓</span>
                    {feature}
                  </li>
                ))}
              </ul>

              <div style={{
                fontSize: '28px',
                fontWeight: 700,
                color: selectedServices.has(service.id) ? '#4F46E5' : '#0f172a'
              }}>
                R{service.price}
              </div>
            </div>
          ))}
        </div>

        {/* Checkout section */}
        {selectedServices.size > 0 && (
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'sticky',
            bottom: '24px',
            boxShadow: '0 -4px 12px rgba(0,0,0,0.1)'
          }}>
            <div>
              <div style={{ fontSize: '14px', color: '#64748b' }}>
                {selectedServices.size} service{selectedServices.size > 1 ? 's' : ''} selected
              </div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a' }}>
                R{totalPrice}
              </div>
            </div>
            <button
              onClick={handleCheckout}
              disabled={processing}
              style={{
                padding: '14px 32px',
                backgroundColor: processing ? '#94a3b8' : '#4F46E5',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: 600,
                cursor: processing ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {processing ? 'Processing...' : 'Pay with Yoco'}
            </button>
          </div>
        )}

        {/* Skip option */}
        <div style={{ textAlign: 'center', marginTop: '32px' }}>
          <button
            onClick={() => router.push('/candidates/dashboard')}
            style={{
              padding: '12px 24px',
              backgroundColor: 'transparent',
              color: '#64748b',
              border: 'none',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            Skip for now → Go to Dashboard
          </button>
        </div>

        {/* Payment info */}
        <div style={{
          marginTop: '32px',
          padding: '16px',
          backgroundColor: '#f0fdf4',
          border: '1px solid #86efac',
          borderRadius: '10px',
          fontSize: '13px',
          color: '#166534',
          textAlign: 'center'
        }}>
          <strong>Secure payment via Yoco.</strong> One-time purchases only. No subscriptions. No hidden fees.
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

export default function UpsellsPage() {
  return (
    <Suspense fallback={<div style={{ padding: '48px', textAlign: 'center' }}>Loading...</div>}>
      <UpsellsContent />
    </Suspense>
  );
}
