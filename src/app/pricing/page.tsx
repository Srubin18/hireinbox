'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useUsage, TIER_LIMITS } from '@/lib/usage-context';
import { B2B_PRICING, B2C_PRICING, formatPrice } from '@/lib/pricing';
import Breadcrumbs from '@/components/Breadcrumbs';

/* ===========================================
   HIREINBOX PRICING PAGE
   Per-Role Pricing Model (Jan 2026)

   PHILOSOPHY:
   - Hyred is an AI Hiring Utility, NOT a marketplace
   - We charge PER ROLE, not per CV
   - Employers don't control CV volume, so per-CV is unfair
   - Per-role pricing is predictable and feels fair
   =========================================== */

// Logo Component
const Logo = ({ size = 32 }: { size?: number }) => (
  <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="12" fill="#4F46E5"/>
      <path d="M12 18L24 26L36 18V32C36 33.1 35.1 34 34 34H14C12.9 34 12 33.1 12 32V18Z" fill="white" fillOpacity="0.9"/>
      <path d="M34 14H14C12.9 14 12 14.9 12 16V18L24 26L36 18V16C36 14.9 35.1 14 34 14Z" fill="white"/>
      <circle cx="36" cy="12" r="9" fill="#10B981"/>
      <path d="M32.5 12L35 14.5L39.5 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <span style={{ fontSize: '1.15rem', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
        <span style={{ color: '#0f172a' }}>Hire</span>
        <span style={{ color: '#4F46E5' }}>Inbox</span>
      </span>
      <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 500 }}>AI that shows its working</span>
    </div>
  </a>
);

// Check icon
const CheckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

// Pricing content component (uses search params)
function PricingContent() {
  const searchParams = useSearchParams();
  const plan = searchParams.get('plan');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(plan);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const { getTierInfo } = useUsage();

  const b2cInfo = getTierInfo('b2c');
  const b2bInfo = getTierInfo('b2b');

  // Handle upgrade click
  const handleUpgrade = async (planId: string) => {
    setIsLoading(planId);
    try {
      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          billingCycle: planId.includes('b2b') ? billingCycle : 'once'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create payment');
      }

      const data = await response.json();
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Failed to initiate payment. Please try again.');
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#ffffff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header */}
      <header style={{
        padding: '20px 24px',
        borderBottom: '1px solid #E5E7EB',
        backgroundColor: 'white'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Logo size={36} />
          <nav style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
            <a href="/" style={{ color: '#64748B', textDecoration: 'none', fontSize: '0.9375rem', fontWeight: 500 }}>
              For Employers
            </a>
            <a href="/upload" style={{ color: '#64748B', textDecoration: 'none', fontSize: '0.9375rem', fontWeight: 500 }}>
              For Job Seekers
            </a>
          </nav>
        </div>
      </header>

      {/* Breadcrumbs */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
        <Breadcrumbs items={[{ label: 'Pricing' }]} />
      </div>

      {/* Hero Section */}
      <section style={{
        padding: '40px 24px 40px',
        textAlign: 'center',
        background: 'linear-gradient(180deg, #F8FAFC 0%, #ffffff 100%)'
      }}>
        <h1 style={{
          fontSize: 'clamp(2rem, 5vw, 3rem)',
          fontWeight: 800,
          color: '#0F172A',
          marginBottom: '16px',
          letterSpacing: '-0.02em'
        }}>
          Simple, Transparent Pricing
        </h1>
        <p style={{
          fontSize: '1.125rem',
          color: '#64748B',
          maxWidth: '600px',
          margin: '0 auto 32px',
          lineHeight: 1.6
        }}>
          Start free, upgrade when you need more. No hidden fees. Pay in Rands.
        </p>

        {/* Billing Toggle (for B2B plans) */}
        <div style={{
          display: 'inline-flex',
          backgroundColor: '#F1F5F9',
          borderRadius: '12px',
          padding: '4px',
          gap: '4px'
        }}>
          <button
            onClick={() => setBillingCycle('monthly')}
            style={{
              padding: '10px 20px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: billingCycle === 'monthly' ? 'white' : 'transparent',
              color: billingCycle === 'monthly' ? '#0F172A' : '#64748B',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
              boxShadow: billingCycle === 'monthly' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('annual')}
            style={{
              padding: '10px 20px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: billingCycle === 'annual' ? 'white' : 'transparent',
              color: billingCycle === 'annual' ? '#0F172A' : '#64748B',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
              boxShadow: billingCycle === 'annual' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            Annual
            <span style={{
              backgroundColor: '#10B981',
              color: 'white',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '0.7rem',
              fontWeight: 700
            }}>
              Save 20%
            </span>
          </button>
        </div>
      </section>

      {/* Pricing Cards */}
      <section style={{
        padding: '40px 24px 80px',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Section: Job Seekers */}
        <div style={{ marginBottom: '60px' }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            color: '#0F172A',
            marginBottom: '8px',
            textAlign: 'center'
          }}>
            For Job Seekers
          </h2>
          <p style={{
            fontSize: '0.9375rem',
            color: '#64748B',
            textAlign: 'center',
            marginBottom: '32px'
          }}>
            Get AI feedback on your CV to land more interviews
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '24px',
            maxWidth: '700px',
            margin: '0 auto'
          }}>
            {/* B2C Free */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              border: '1px solid #E5E7EB',
              padding: '32px',
              position: 'relative'
            }}>
              <div style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#64748B',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '8px'
              }}>
                Free
              </div>
              <div style={{
                fontSize: '2.5rem',
                fontWeight: 800,
                color: '#0F172A',
                marginBottom: '4px'
              }}>
                R0
              </div>
              <div style={{ fontSize: '0.875rem', color: '#64748B', marginBottom: '24px' }}>
                1 CV analysis
              </div>

              {b2cInfo.remaining > 0 ? (
                <a
                  href="/upload"
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '14px',
                    backgroundColor: '#F1F5F9',
                    color: '#475569',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '0.9375rem',
                    fontWeight: 600,
                    textAlign: 'center',
                    textDecoration: 'none',
                    cursor: 'pointer',
                    marginBottom: '24px'
                  }}
                >
                  {b2cInfo.used === 0 ? 'Try Free' : `${b2cInfo.remaining} left`}
                </a>
              ) : (
                <div style={{
                  padding: '14px',
                  backgroundColor: '#FEF2F2',
                  color: '#991B1B',
                  borderRadius: '10px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  textAlign: 'center',
                  marginBottom: '24px'
                }}>
                  Free tier used
                </div>
              )}

              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.875rem', color: '#334155' }}>
                  <CheckIcon /> 1 full CV analysis
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.875rem', color: '#334155' }}>
                  <CheckIcon /> Strength highlights
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.875rem', color: '#334155' }}>
                  <CheckIcon /> Improvement tips
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.875rem', color: '#334155' }}>
                  <CheckIcon /> ATS compatibility check
                </li>
              </ul>
            </div>

            {/* B2C Paid */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              border: '2px solid #4F46E5',
              padding: '32px',
              position: 'relative',
              boxShadow: '0 10px 40px rgba(79, 70, 229, 0.15)'
            }}>
              <div style={{
                position: 'absolute',
                top: '-12px',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: '#4F46E5',
                color: 'white',
                padding: '4px 12px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 600
              }}>
                Popular
              </div>
              <div style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#64748B',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '8px'
              }}>
                Per CV
              </div>
              <div style={{
                fontSize: '2.5rem',
                fontWeight: 800,
                color: '#0F172A',
                marginBottom: '4px'
              }}>
                R29
              </div>
              <div style={{ fontSize: '0.875rem', color: '#64748B', marginBottom: '24px' }}>
                per analysis
              </div>

              <button
                onClick={() => handleUpgrade('b2c-single')}
                disabled={isLoading === 'b2c-single'}
                style={{
                  width: '100%',
                  padding: '14px',
                  backgroundColor: '#4F46E5',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  cursor: isLoading === 'b2c-single' ? 'wait' : 'pointer',
                  marginBottom: '24px',
                  opacity: isLoading === 'b2c-single' ? 0.7 : 1,
                  transition: 'all 0.2s'
                }}
              >
                {isLoading === 'b2c-single' ? 'Processing...' : 'Buy Now'}
              </button>

              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.875rem', color: '#334155' }}>
                  <CheckIcon /> Everything in Free
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.875rem', color: '#334155' }}>
                  <CheckIcon /> Career path insights
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.875rem', color: '#334155' }}>
                  <CheckIcon /> Industry-specific tips
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.875rem', color: '#334155' }}>
                  <CheckIcon /> Priority processing
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Section: Employers - Per Role Pricing */}
        <div>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            color: '#0F172A',
            marginBottom: '8px',
            textAlign: 'center'
          }}>
            For Employers
          </h2>
          <p style={{
            fontSize: '0.9375rem',
            color: '#64748B',
            textAlign: 'center',
            marginBottom: '8px'
          }}>
            Pay per role, not per CV. Unlimited screening for each role.
          </p>
          <p style={{
            fontSize: '0.8125rem',
            color: '#94A3B8',
            textAlign: 'center',
            marginBottom: '32px'
          }}>
            You cannot control how many CVs you receive - so we do not charge per CV.
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '20px',
            maxWidth: '1200px',
            margin: '0 auto'
          }}>
            {/* Talent Pool Job Posting */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              border: '1px solid #E5E7EB',
              padding: '32px'
            }}>
              <div style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#10B981',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '8px'
              }}>
                Quick Hire
              </div>
              <div style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#64748B',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '8px'
              }}>
                Post to Talent Pool
              </div>
              <div style={{
                fontSize: '2.5rem',
                fontWeight: 800,
                color: '#0F172A',
                marginBottom: '4px'
              }}>
                R2,500
              </div>
              <div style={{ fontSize: '0.875rem', color: '#64748B', marginBottom: '24px' }}>
                per job listing (30 days)
              </div>

              <a
                href="/talent-pool/post-job"
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '14px',
                  backgroundColor: '#F1F5F9',
                  color: '#475569',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  textAlign: 'center',
                  textDecoration: 'none',
                  marginBottom: '24px',
                  cursor: 'pointer'
                }}
              >
                Post a Job
              </a>

              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.875rem', color: '#334155' }}>
                  <CheckIcon /> AI matches candidates instantly
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.875rem', color: '#334155' }}>
                  <CheckIcon /> Access pre-screened talent pool
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.875rem', color: '#334155' }}>
                  <CheckIcon /> SA qualification aware
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.875rem', color: '#334155' }}>
                  <CheckIcon /> Direct candidate contact
                </li>
              </ul>
            </div>

            {/* AI CV Screening - Base Product */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              border: '2px solid #4F46E5',
              padding: '32px',
              position: 'relative',
              boxShadow: '0 10px 40px rgba(79, 70, 229, 0.15)'
            }}>
              <div style={{
                position: 'absolute',
                top: '-12px',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: '#4F46E5',
                color: 'white',
                padding: '4px 12px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 600
              }}>
                Base Product
              </div>
              <div style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#64748B',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '8px'
              }}>
                AI CV Screening
              </div>
              <div style={{
                fontSize: '2.5rem',
                fontWeight: 800,
                color: '#0F172A',
                marginBottom: '4px'
              }}>
                {B2B_PRICING.CV_SCREENING.priceDisplay}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#64748B', marginBottom: '24px' }}>
                per role (unlimited CVs)
              </div>

              <button
                onClick={() => handleUpgrade('b2b-cv-screening')}
                disabled={isLoading === 'b2b-cv-screening'}
                style={{
                  width: '100%',
                  padding: '14px',
                  backgroundColor: '#4F46E5',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  cursor: isLoading === 'b2b-cv-screening' ? 'wait' : 'pointer',
                  marginBottom: '24px',
                  opacity: isLoading === 'b2b-cv-screening' ? 0.7 : 1,
                  transition: 'all 0.2s'
                }}
              >
                {isLoading === 'b2b-cv-screening' ? 'Processing...' : 'Get Started'}
              </button>

              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {B2B_PRICING.CV_SCREENING.includes.map((item, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.875rem', color: '#334155' }}>
                    <CheckIcon /> {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* AI Interview Add-On */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              border: '1px solid #E5E7EB',
              padding: '32px'
            }}>
              <div style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#10B981',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '8px'
              }}>
                Add-On
              </div>
              <div style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#64748B',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '8px'
              }}>
                AI Interview
              </div>
              <div style={{
                fontSize: '2.5rem',
                fontWeight: 800,
                color: '#0F172A',
                marginBottom: '4px'
              }}>
                {B2B_PRICING.AI_INTERVIEW.priceDisplay}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#64748B', marginBottom: '24px' }}>
                per role
              </div>

              <button
                onClick={() => handleUpgrade('b2b-ai-interview')}
                disabled={isLoading === 'b2b-ai-interview'}
                style={{
                  width: '100%',
                  padding: '14px',
                  backgroundColor: '#F1F5F9',
                  color: '#475569',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  cursor: isLoading === 'b2b-ai-interview' ? 'wait' : 'pointer',
                  marginBottom: '24px',
                  opacity: isLoading === 'b2b-ai-interview' ? 0.7 : 1,
                  transition: 'all 0.2s'
                }}
              >
                {isLoading === 'b2b-ai-interview' ? 'Processing...' : 'Add to Role'}
              </button>

              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {B2B_PRICING.AI_INTERVIEW.includes.map((item, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.875rem', color: '#334155' }}>
                    <CheckIcon /> {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Verification Bundle Add-On */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              border: '1px solid #E5E7EB',
              padding: '32px'
            }}>
              <div style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#10B981',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '8px'
              }}>
                Add-On
              </div>
              <div style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#64748B',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '8px'
              }}>
                Verification Bundle
              </div>
              <div style={{
                fontSize: '2.5rem',
                fontWeight: 800,
                color: '#0F172A',
                marginBottom: '4px'
              }}>
                {B2B_PRICING.VERIFICATION_BUNDLE.priceDisplay}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#64748B', marginBottom: '24px' }}>
                per role
              </div>

              <button
                onClick={() => handleUpgrade('b2b-verification')}
                disabled={isLoading === 'b2b-verification'}
                style={{
                  width: '100%',
                  padding: '14px',
                  backgroundColor: '#F1F5F9',
                  color: '#475569',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  cursor: isLoading === 'b2b-verification' ? 'wait' : 'pointer',
                  marginBottom: '24px',
                  opacity: isLoading === 'b2b-verification' ? 0.7 : 1,
                  transition: 'all 0.2s'
                }}
              >
                {isLoading === 'b2b-verification' ? 'Processing...' : 'Add to Role'}
              </button>

              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {B2B_PRICING.VERIFICATION_BUNDLE.includes.map((item, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.875rem', color: '#334155' }}>
                    <CheckIcon /> {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Full Package Callout */}
          <div style={{
            maxWidth: '600px',
            margin: '32px auto 0',
            padding: '24px',
            backgroundColor: '#F0FDF4',
            borderRadius: '12px',
            border: '1px solid #BBF7D0',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.875rem', color: '#166534', marginBottom: '8px' }}>
              Best Value: Full Package
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>
              {formatPrice(B2B_PRICING.CV_SCREENING.price + B2B_PRICING.AI_INTERVIEW.price + B2B_PRICING.VERIFICATION_BUNDLE.price)}/role
            </div>
            <div style={{ fontSize: '0.875rem', color: '#64748B' }}>
              Screening + AI Interview + Verification Bundle
            </div>
            <button
              onClick={() => handleUpgrade('b2b-full-package')}
              disabled={isLoading === 'b2b-full-package'}
              style={{
                marginTop: '16px',
                padding: '12px 32px',
                backgroundColor: '#166534',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '0.9375rem',
                fontWeight: 600,
                cursor: isLoading === 'b2b-full-package' ? 'wait' : 'pointer',
                opacity: isLoading === 'b2b-full-package' ? 0.7 : 1,
                transition: 'all 0.2s'
              }}
            >
              {isLoading === 'b2b-full-package' ? 'Processing...' : 'Get Full Package'}
            </button>
          </div>

          {/* Bulk Discount Info */}
          <div style={{
            maxWidth: '600px',
            margin: '24px auto 0',
            padding: '16px 24px',
            backgroundColor: '#F8FAFC',
            borderRadius: '10px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.875rem', color: '#64748B' }}>
              Hiring multiple roles? Get up to 20% off.
              <a href="mailto:hello@hireinbox.co.za" style={{ color: '#4F46E5', marginLeft: '8px', textDecoration: 'none' }}>
                Contact us for bulk pricing
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section style={{
        padding: '60px 24px',
        backgroundColor: '#ffffff'
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: '1.75rem',
            fontWeight: 700,
            color: '#0F172A',
            marginBottom: '12px',
            textAlign: 'center'
          }}>
            Feature Comparison
          </h2>
          <p style={{
            fontSize: '1rem',
            color: '#64748B',
            textAlign: 'center',
            marginBottom: '32px'
          }}>
            See what's included in each plan
          </p>

          <div style={{
            overflowX: 'auto',
            borderRadius: '12px',
            border: '1px solid #E5E7EB'
          }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '14px'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc' }}>
                  <th style={{ padding: '16px 20px', textAlign: 'left', fontWeight: 600, borderBottom: '1px solid #E5E7EB' }}>Feature</th>
                  <th style={{ padding: '16px 20px', textAlign: 'center', fontWeight: 600, borderBottom: '1px solid #E5E7EB' }}>Free</th>
                  <th style={{ padding: '16px 20px', textAlign: 'center', fontWeight: 600, borderBottom: '1px solid #E5E7EB', backgroundColor: '#EEF2FF' }}>Per-Role</th>
                  <th style={{ padding: '16px 20px', textAlign: 'center', fontWeight: 600, borderBottom: '1px solid #E5E7EB' }}>Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: 'AI CV Screening', free: '10 CVs', perRole: 'Unlimited', enterprise: 'Unlimited' },
                  { feature: 'Candidate Ranking', free: '✓', perRole: '✓', enterprise: '✓' },
                  { feature: 'Evidence-based Scoring', free: '✓', perRole: '✓', enterprise: '✓' },
                  { feature: 'ATS Compatibility Check', free: '—', perRole: '✓', enterprise: '✓' },
                  { feature: 'Acknowledgement Emails', free: '—', perRole: '✓', enterprise: '✓' },
                  { feature: 'Outcome Emails', free: '—', perRole: '✓', enterprise: '✓' },
                  { feature: 'AI Interview Add-on', free: '—', perRole: '✓', enterprise: '✓' },
                  { feature: 'Verification Add-on', free: '—', perRole: '✓', enterprise: '✓' },
                  { feature: 'Talent Pool Access', free: '—', perRole: '✓', enterprise: '✓' },
                  { feature: 'Team Members', free: '1', perRole: '3', enterprise: 'Unlimited' },
                  { feature: 'API Access', free: '—', perRole: '—', enterprise: '✓' },
                  { feature: 'Priority Support', free: '—', perRole: '—', enterprise: '✓' },
                  { feature: 'Custom Integrations', free: '—', perRole: '—', enterprise: '✓' },
                ].map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #E5E7EB' }}>
                    <td style={{ padding: '14px 20px', color: '#374151' }}>{row.feature}</td>
                    <td style={{ padding: '14px 20px', textAlign: 'center', color: row.free === '—' ? '#9CA3AF' : '#374151' }}>{row.free}</td>
                    <td style={{ padding: '14px 20px', textAlign: 'center', backgroundColor: '#FAFAFE', color: row.perRole === '—' ? '#9CA3AF' : '#374151', fontWeight: row.perRole !== '—' ? 500 : 400 }}>{row.perRole}</td>
                    <td style={{ padding: '14px 20px', textAlign: 'center', color: row.enterprise === '—' ? '#9CA3AF' : '#374151' }}>{row.enterprise}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section style={{
        padding: '60px 24px',
        backgroundColor: '#F8FAFC'
      }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: '1.75rem',
            fontWeight: 700,
            color: '#0F172A',
            marginBottom: '32px',
            textAlign: 'center'
          }}>
            Frequently Asked Questions
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              {
                q: 'How does the free trial work?',
                a: 'Job seekers get 1 free CV analysis, and employers get 10 free CV screenings. No credit card required. Just sign up and start using Hyred immediately.'
              },
              {
                q: 'What payment methods do you accept?',
                a: 'We accept all major credit cards, EFT, and SnapScan through PayFast - South Africa\'s leading payment gateway. All prices are in South African Rand (ZAR).'
              },
              {
                q: 'Can I cancel anytime?',
                a: 'Yes! There are no long-term contracts. Cancel your subscription anytime from your dashboard. You\'ll retain access until the end of your billing period.'
              },
              {
                q: 'Is my data secure?',
                a: 'Absolutely. We use bank-level encryption and are fully POPIA compliant. Your CVs and candidate data are never shared with third parties.'
              },
              {
                q: 'Do you offer custom enterprise plans?',
                a: 'Yes! For high-volume hiring or custom requirements, contact us at hello@hireinbox.co.za for a tailored solution.'
              }
            ].map((faq, i) => (
              <div key={i} style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '20px 24px',
                border: '1px solid #E5E7EB'
              }}>
                <h3 style={{
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: '#0F172A',
                  marginBottom: '8px'
                }}>
                  {faq.q}
                </h3>
                <p style={{
                  fontSize: '0.9375rem',
                  color: '#64748B',
                  lineHeight: 1.6,
                  margin: 0
                }}>
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '40px 24px',
        backgroundColor: 'white',
        borderTop: '1px solid #E5E7EB'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px'
        }}>
          <Logo size={28} />
          <div style={{
            display: 'flex',
            gap: '24px',
            alignItems: 'center'
          }}>
            <a href="/privacy" style={{ color: '#64748B', textDecoration: 'none', fontSize: '0.875rem' }}>Privacy</a>
            <a href="/terms" style={{ color: '#64748B', textDecoration: 'none', fontSize: '0.875rem' }}>Terms</a>
            <span style={{ color: '#94A3B8', fontSize: '0.875rem' }}>
              Built in Cape Town, South Africa
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Loading fallback
function LoadingFallback() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#ffffff'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid #E5E7EB',
          borderTopColor: '#4F46E5',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 16px'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ color: '#64748B', fontSize: '0.9375rem' }}>Loading pricing...</p>
      </div>
    </div>
  );
}

// Main page component
export default function PricingPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PricingContent />
    </Suspense>
  );
}
