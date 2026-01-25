'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

// ============================================
// HIREINBOX - PUBLIC COMPANY PROFILE
// /company/[slug]
//
// Candidate-facing company page showing:
// - Company info & description
// - Open roles
// - Company culture/benefits
// - Contact information
// ============================================

interface Company {
  id: string;
  name: string;
  slug: string;
  industry: string;
  companySize: string;
  location: string;
  website: string;
  description: string;
  logoUrl?: string;
  coverUrl?: string;
  founded?: string;
  benefits?: string[];
  culture?: string;
}

interface Role {
  id: string;
  title: string;
  location: string;
  type: string;
  salary?: string;
  postedAt: string;
  isActive: boolean;
}

// SVG Icons
const Icons = {
  building: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="2" width="16" height="20" rx="2" ry="2"/>
      <line x1="9" y1="6" x2="9" y2="6"/>
      <line x1="15" y1="6" x2="15" y2="6"/>
      <line x1="9" y1="10" x2="9" y2="10"/>
      <line x1="15" y1="10" x2="15" y2="10"/>
      <line x1="9" y1="14" x2="9" y2="14"/>
      <line x1="15" y1="14" x2="15" y2="14"/>
      <line x1="9" y1="18" x2="15" y2="18"/>
    </svg>
  ),
  location: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  users: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  globe: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  ),
  briefcase: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
    </svg>
  ),
  calendar: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  check: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  arrowLeft: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="19" y1="12" x2="5" y2="12"/>
      <polyline points="12 19 5 12 12 5"/>
    </svg>
  ),
  externalLink: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
      <polyline points="15 3 21 3 21 9"/>
      <line x1="10" y1="14" x2="21" y2="3"/>
    </svg>
  )
};

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

// Sample data - in production, fetched from API
const sampleCompany: Company = {
  id: '1',
  name: 'Tech Innovations SA',
  slug: 'tech-innovations-sa',
  industry: 'Technology',
  companySize: '50-200 employees',
  location: 'Cape Town, South Africa',
  website: 'https://techinnovations.co.za',
  description: 'Tech Innovations SA is a leading software development company based in Cape Town, specializing in custom enterprise solutions, cloud infrastructure, and AI-powered applications. Founded in 2015, we have grown to become one of the most innovative tech companies in South Africa, serving clients across Africa and Europe.',
  founded: '2015',
  benefits: [
    'Flexible remote work options',
    'Competitive salaries (above market rate)',
    'Medical aid contribution',
    'Annual learning & development budget',
    'Modern office in Cape Town CBD',
    '22 days annual leave'
  ],
  culture: 'We believe in fostering a culture of innovation, collaboration, and continuous learning. Our team is diverse, passionate, and committed to building technology that makes a difference. We value work-life balance and support our employees in achieving their personal and professional goals.'
};

const sampleRoles: Role[] = [
  { id: '1', title: 'Senior Full Stack Developer', location: 'Cape Town (Hybrid)', type: 'Full-time', salary: 'R75,000 - R95,000/month', postedAt: '2026-01-20', isActive: true },
  { id: '2', title: 'DevOps Engineer', location: 'Remote', type: 'Full-time', salary: 'R65,000 - R85,000/month', postedAt: '2026-01-18', isActive: true },
  { id: '3', title: 'Junior React Developer', location: 'Cape Town', type: 'Full-time', salary: 'R35,000 - R45,000/month', postedAt: '2026-01-22', isActive: true },
];

export default function CompanyProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [company, setCompany] = useState<Company | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // In production: fetch from /api/company/[slug]
    const fetchCompany = async () => {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));

        // For demo, use sample data
        setCompany({ ...sampleCompany, slug: params.slug as string });
        setRoles(sampleRoles);
      } catch {
        setError('Company not found');
      } finally {
        setLoading(false);
      }
    };

    fetchCompany();
  }, [params.slug]);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #e2e8f0',
            borderTopColor: '#4F46E5',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p style={{ color: '#64748b' }}>Loading company profile...</p>
        </div>
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px', color: '#94a3b8' }}>{Icons.building}</div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
            Company Not Found
          </h1>
          <p style={{ color: '#64748b', marginBottom: '24px' }}>
            The company profile you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <button
            onClick={() => router.push('/')}
            style={{
              padding: '12px 24px',
              backgroundColor: '#4F46E5',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

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
          onClick={() => router.push('/candidates/dashboard')}
          style={{
            padding: '8px 16px',
            backgroundColor: '#4F46E5',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          My Dashboard
        </button>
      </header>

      {/* Back button */}
      <div style={{ padding: '16px 24px', maxWidth: '1000px', margin: '0 auto' }}>
        <button
          onClick={() => router.back()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 0',
            backgroundColor: 'transparent',
            color: '#64748b',
            border: 'none',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          {Icons.arrowLeft}
          Back
        </button>
      </div>

      {/* Main content */}
      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 24px 48px' }}>
        {/* Company header */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          marginBottom: '24px'
        }}>
          {/* Cover area */}
          <div style={{
            height: '120px',
            background: 'linear-gradient(135deg, #4F46E5 0%, #7c3aed 100%)',
            position: 'relative'
          }}>
            {/* Company logo placeholder */}
            <div style={{
              position: 'absolute',
              bottom: '-40px',
              left: '24px',
              width: '80px',
              height: '80px',
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              border: '4px solid #ffffff',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#4F46E5',
              fontSize: '32px',
              fontWeight: 700
            }}>
              {company.name.charAt(0)}
            </div>
          </div>

          {/* Company info */}
          <div style={{ padding: '56px 24px 24px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
              {company.name}
            </h1>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', color: '#64748b', fontSize: '14px', marginBottom: '16px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {Icons.briefcase}
                {company.industry}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {Icons.location}
                {company.location}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {Icons.users}
                {company.companySize}
              </span>
              {company.founded && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {Icons.calendar}
                  Founded {company.founded}
                </span>
              )}
            </div>
            {company.website && (
              <a
                href={company.website}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#4F46E5',
                  fontSize: '14px',
                  textDecoration: 'none'
                }}
              >
                {Icons.globe}
                {company.website.replace('https://', '')}
                {Icons.externalLink}
              </a>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px' }}>
          {/* Left column - About & Open roles */}
          <div>
            {/* About */}
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              padding: '24px',
              marginBottom: '24px'
            }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>
                About {company.name}
              </h2>
              <p style={{ fontSize: '15px', color: '#475569', lineHeight: 1.7 }}>
                {company.description}
              </p>
            </div>

            {/* Culture */}
            {company.culture && (
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                padding: '24px',
                marginBottom: '24px'
              }}>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>
                  Our Culture
                </h2>
                <p style={{ fontSize: '15px', color: '#475569', lineHeight: 1.7 }}>
                  {company.culture}
                </p>
              </div>
            )}

            {/* Open roles */}
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              padding: '24px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                  Open Positions
                </h2>
                <span style={{
                  padding: '4px 12px',
                  backgroundColor: '#d1fae5',
                  color: '#059669',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: 600
                }}>
                  {roles.filter(r => r.isActive).length} open
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {roles.filter(r => r.isActive).map((role) => (
                  <div
                    key={role.id}
                    style={{
                      padding: '16px',
                      backgroundColor: '#f8fafc',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div>
                        <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '15px', marginBottom: '4px' }}>
                          {role.title}
                        </div>
                        <div style={{ fontSize: '13px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {Icons.location}
                            {role.location}
                          </span>
                          <span>{role.type}</span>
                        </div>
                      </div>
                      {role.salary && (
                        <span style={{
                          fontSize: '13px',
                          color: '#059669',
                          fontWeight: 600,
                          backgroundColor: '#d1fae5',
                          padding: '4px 10px',
                          borderRadius: '6px'
                        }}>
                          {role.salary}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                      Posted {role.postedAt}
                    </div>
                  </div>
                ))}
              </div>

              {roles.filter(r => r.isActive).length === 0 && (
                <div style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                  <p>No open positions at the moment.</p>
                  <p style={{ fontSize: '13px' }}>Check back later or join our talent pool to be notified.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right column - Benefits & CTA */}
          <div>
            {/* Benefits */}
            {company.benefits && company.benefits.length > 0 && (
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                padding: '24px',
                marginBottom: '24px'
              }}>
                <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>
                  Benefits & Perks
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {company.benefits.map((benefit, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#475569' }}>
                      <span style={{ color: '#22c55e', flexShrink: 0 }}>{Icons.check}</span>
                      {benefit}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CTA */}
            <div style={{
              backgroundColor: '#eff6ff',
              borderRadius: '12px',
              border: '1px solid #bfdbfe',
              padding: '24px',
              textAlign: 'center'
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1e40af', marginBottom: '8px' }}>
                Interested in working here?
              </h3>
              <p style={{ fontSize: '14px', color: '#3b82f6', marginBottom: '16px' }}>
                Upload your CV and get matched with opportunities at {company.name}
              </p>
              <button
                onClick={() => router.push('/candidates/cv')}
                style={{
                  width: '100%',
                  padding: '12px 24px',
                  backgroundColor: '#4F46E5',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Upload Your CV
              </button>
            </div>

            {/* Share */}
            <div style={{
              marginTop: '16px',
              padding: '16px',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              textAlign: 'center'
            }}>
              <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>
                Know someone who&apos;d be a great fit?
              </p>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  alert('Link copied to clipboard!');
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#f1f5f9',
                  color: '#475569',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                Share This Company
              </button>
            </div>
          </div>
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
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        Support
      </button>

      {/* Mobile responsive styles */}
      <style>{`
        @media (max-width: 768px) {
          main > div:last-child {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
