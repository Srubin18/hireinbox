'use client';

import { useRouter } from 'next/navigation';

// ============================================
// HIREINBOX - ABOUT US PAGE
// Company-focused, SA-built, experienced team
// Da Vinci: Simple, elegant, trustworthy
// ============================================

export default function AboutPage() {
  const router = useRouter();

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#ffffff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header */}
      <header style={{
        padding: '20px 32px',
        borderBottom: '1px solid #f1f5f9',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div
          onClick={() => router.push('/home')}
          style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
        >
          <svg width="36" height="36" viewBox="0 0 48 48" fill="none">
            <rect width="48" height="48" rx="12" fill="#4F46E5"/>
            <path d="M12 18L24 26L36 18V32C36 33.1 35.1 34 34 34H14C12.9 34 12 33.1 12 32V18Z" fill="white" fillOpacity="0.9"/>
            <path d="M34 14H14C12.9 14 12 14.9 12 16V18L24 26L36 18V16C36 14.9 35.1 14 34 14Z" fill="white"/>
            <circle cx="36" cy="12" r="9" fill="#10B981"/>
            <path d="M32.5 12L35 14.5L39.5 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ fontSize: '18px', fontWeight: 700 }}>
            <span style={{ color: '#0f172a' }}>Hire</span>
            <span style={{ color: '#4F46E5' }}>Inbox</span>
          </span>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button
            onClick={() => router.push('/login')}
            style={{
              padding: '10px 20px',
              backgroundColor: 'transparent',
              color: '#475569',
              border: 'none',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            Log in
          </button>
          <button
            onClick={() => router.push('/signup')}
            style={{
              padding: '10px 20px',
              backgroundColor: '#4F46E5',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Get Started
          </button>
        </div>
      </header>

      {/* Hero */}
      <section style={{
        padding: '80px 32px',
        textAlign: 'center',
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        <h1 style={{
          fontSize: '48px',
          fontWeight: 700,
          color: '#0f172a',
          marginBottom: '24px',
          letterSpacing: '-0.02em',
          lineHeight: 1.2
        }}>
          Built in South Africa,<br />for South Africa
        </h1>
        <p style={{
          fontSize: '20px',
          color: '#64748b',
          lineHeight: 1.7,
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          HireInbox is an AI-powered recruitment platform that understands the unique challenges of hiring in South Africa.
        </p>
      </section>

      {/* Mission */}
      <section style={{
        padding: '64px 32px',
        backgroundColor: '#f8fafc'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: '14px',
            fontWeight: 600,
            color: '#4F46E5',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: '16px'
          }}>
            Our Mission
          </h2>
          <p style={{
            fontSize: '32px',
            fontWeight: 600,
            color: '#0f172a',
            lineHeight: 1.4,
            marginBottom: '32px'
          }}>
            Less noise. More hires.
          </p>
          <p style={{
            fontSize: '18px',
            color: '#475569',
            lineHeight: 1.8
          }}>
            Every day, recruiters spend hours reading CVs that don't match. Every day, qualified candidates get overlooked because their CV didn't use the right keywords. We're building technology to fix both problems — AI that screens with evidence-based reasoning, explains its decisions, and helps everyone make better hiring choices.
          </p>
        </div>
      </section>

      {/* Why We're Different */}
      <section style={{
        padding: '80px 32px'
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: '32px',
            fontWeight: 700,
            color: '#0f172a',
            marginBottom: '48px',
            textAlign: 'center'
          }}>
            Why we built HireInbox
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '32px'
          }}>
            <div style={{
              padding: '32px',
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '16px'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                backgroundColor: '#eff6ff',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px'
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                  <path d="M2 17l10 5 10-5"/>
                  <path d="M2 12l10 5 10-5"/>
                </svg>
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', marginBottom: '12px' }}>
                Local Context Matters
              </h3>
              <p style={{ fontSize: '15px', color: '#64748b', lineHeight: 1.6, margin: 0 }}>
                We understand CA(SA), BCom degrees, SAICA articles, and what "previously disadvantaged" means in employment equity context. Generic AI doesn't.
              </p>
            </div>

            <div style={{
              padding: '32px',
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '16px'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                backgroundColor: '#f0fdf4',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px'
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2">
                  <path d="M9 12l2 2 4-4"/>
                  <circle cx="12" cy="12" r="10"/>
                </svg>
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', marginBottom: '12px' }}>
                Explainable AI
              </h3>
              <p style={{ fontSize: '15px', color: '#64748b', lineHeight: 1.6, margin: 0 }}>
                Every decision comes with evidence. No black boxes. You can see exactly why a candidate scored the way they did — and defend it if needed.
              </p>
            </div>

            <div style={{
              padding: '32px',
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '16px'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                backgroundColor: '#fef3c7',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px'
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0110 0v4"/>
                </svg>
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', marginBottom: '12px' }}>
                POPIA Compliant
              </h3>
              <p style={{ fontSize: '15px', color: '#64748b', lineHeight: 1.6, margin: 0 }}>
                Full audit trails, data retention policies, and the ability to explain any automated decision. Built for South African compliance requirements.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section style={{
        padding: '80px 32px',
        backgroundColor: '#f8fafc'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{
            fontSize: '32px',
            fontWeight: 700,
            color: '#0f172a',
            marginBottom: '24px'
          }}>
            The Team
          </h2>
          <p style={{
            fontSize: '18px',
            color: '#64748b',
            lineHeight: 1.7,
            marginBottom: '48px'
          }}>
            HireInbox is led by experienced entrepreneurs who have built and scaled technology businesses in South Africa. We combine deep expertise in AI, recruitment, and enterprise software.
          </p>

          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '32px',
            flexWrap: 'wrap'
          }}>
            <div style={{
              padding: '32px',
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              minWidth: '280px'
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                backgroundColor: '#4F46E5',
                borderRadius: '50%',
                margin: '0 auto 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontSize: '28px',
                fontWeight: 600
              }}>
                SR
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>
                Simon Rubin
              </h3>
              <p style={{ fontSize: '14px', color: '#4F46E5', marginBottom: '12px' }}>
                Founder
              </p>
              <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6, margin: 0 }}>
                Cape Town-based entrepreneur with experience building technology products for the South African market.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{
        padding: '80px 32px',
        textAlign: 'center'
      }}>
        <h2 style={{
          fontSize: '36px',
          fontWeight: 700,
          color: '#0f172a',
          marginBottom: '24px'
        }}>
          Ready to hire smarter?
        </h2>
        <p style={{
          fontSize: '18px',
          color: '#64748b',
          marginBottom: '32px'
        }}>
          Join South African businesses using AI to find the right people, faster.
        </p>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => router.push('/signup')}
            style={{
              padding: '16px 32px',
              backgroundColor: '#4F46E5',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Get Started Free
          </button>
          <button
            onClick={() => router.push('/faq')}
            style={{
              padding: '16px 32px',
              backgroundColor: '#f1f5f9',
              color: '#475569',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Read FAQs
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '32px',
        borderTop: '1px solid #f1f5f9',
        textAlign: 'center'
      }}>
        <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0 }}>
          HireInbox · 2026 · Built in South Africa
        </p>
      </footer>
    </div>
  );
}
