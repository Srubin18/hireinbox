'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

// ============================================
// B2Recruiter - Talent Passport View
// Shareable candidate profile for clients
// Professional presentation with AI scoring
// ============================================

// Types
interface TalentCandidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  currentTitle: string;
  currentCompany: string;
  yearsExperience: number;
  salary: string;
  noticePeriod: string;
  availability: string;
  skills: string[];
  qualifications: string[];
  score: number;
  summary: string;
  experience: {
    title: string;
    company: string;
    duration: string;
    highlights: string[];
  }[];
  education: {
    degree: string;
    institution: string;
    year: string;
  }[];
  achievements: string[];
  recruiterNotes: string;
}

// Mock data - in production this would come from API
const getMockCandidate = (id: string): TalentCandidate => ({
  id,
  name: 'Thabo Molefe',
  email: 'thabo.molefe@gmail.com',
  phone: '+27 82 123 4567',
  location: 'Johannesburg',
  currentTitle: 'Senior Financial Analyst',
  currentCompany: 'Investec',
  yearsExperience: 8,
  salary: 'R750,000',
  noticePeriod: '1 month',
  availability: '1_month',
  skills: ['Financial Modeling', 'Risk Analysis', 'SQL', 'Power BI', 'Python', 'IFRS', 'Management Reporting', 'Budgeting & Forecasting'],
  qualifications: ['CA(SA)', 'CFA Level II', 'BCom Honours - Finance'],
  score: 87,
  summary: 'Results-driven financial professional with 8+ years of experience in investment banking and corporate finance. Proven track record of delivering complex financial models and risk assessments for multi-billion rand portfolios. Strong analytical skills combined with excellent stakeholder management.',
  experience: [
    {
      title: 'Senior Financial Analyst',
      company: 'Investec',
      duration: 'Jan 2021 - Present',
      highlights: [
        'Led financial analysis for R2.5B acquisition deal',
        'Built automated reporting system saving 20 hours/week',
        'Mentored team of 4 junior analysts',
      ],
    },
    {
      title: 'Financial Analyst',
      company: 'Standard Bank',
      duration: 'Mar 2018 - Dec 2020',
      highlights: [
        'Developed risk models for corporate lending',
        'Managed portfolio analysis for R800M book',
        'Awarded Top Performer 2019',
      ],
    },
    {
      title: 'Trainee Accountant',
      company: 'KPMG',
      duration: 'Feb 2015 - Feb 2018',
      highlights: [
        'Completed articles with distinction',
        'Specialized in financial services audit',
        'Passed board exams first attempt',
      ],
    },
  ],
  education: [
    {
      degree: 'BCom Honours - Finance',
      institution: 'University of Cape Town',
      year: '2014',
    },
    {
      degree: 'BCom Accounting',
      institution: 'University of Cape Town',
      year: '2013',
    },
  ],
  achievements: [
    'CA(SA) qualification with distinction',
    'CFA Level II candidate',
    'Published research on SA credit markets',
    'Speaker at SAICA Finance Conference 2023',
  ],
  recruiterNotes: 'Strong candidate, looking for senior role with strategic focus. Prefers hybrid work arrangement. Very professional in interviews, excellent communication skills. Multiple offers expected - need to move quickly.',
});

// Logo Component
const Logo = ({ size = 36 }: { size?: number }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="12" fill="#4F46E5"/>
      <path d="M12 18L24 26L36 18V32C36 33.1 35.1 34 34 34H14C12.9 34 12 33.1 12 32V18Z" fill="white" fillOpacity="0.9"/>
      <path d="M34 14H14C12.9 14 12 14.9 12 16V18L24 26L36 18V16C36 14.9 35.1 14 34 14Z" fill="white"/>
      <circle cx="36" cy="12" r="9" fill="#10B981"/>
      <path d="M32.5 12L35 14.5L39.5 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
        <span style={{ color: '#0f172a' }}>Hire</span>
        <span style={{ color: '#4F46E5' }}>Inbox</span>
      </span>
      <span style={{ fontSize: '0.65rem', color: '#F59E0B', fontWeight: 600, letterSpacing: '0.05em' }}>
        TALENT PASSPORT
      </span>
    </div>
  </div>
);

export default function TalentPassportPage() {
  const params = useParams();
  const id = params.id as string;
  const [candidate] = useState<TalentCandidate>(getMockCandidate(id));
  const [showContact, setShowContact] = useState(false);
  const [isShared, setIsShared] = useState(false);

  // Check if this is a shared view (would be determined by URL params in production)
  const isClientView = false;

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#F8FAFC',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      {/* Header */}
      <header style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #E2E8F0',
        padding: '16px 32px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{
          maxWidth: '900px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <Logo size={40} />
          {!isClientView && (
            <div style={{ display: 'flex', gap: '12px' }}>
              <Link href="/recruiter/talent" style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                backgroundColor: 'white',
                fontSize: '0.875rem',
                fontWeight: 500,
                textDecoration: 'none',
                color: '#64748B',
              }}>
                Back to Talent
              </Link>
              <button onClick={() => setIsShared(true)} style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#4F46E5',
                color: 'white',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer',
              }}>
                Share with Client
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '32px' }}>
        {/* Hero Section */}
        <div style={{
          background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
          borderRadius: '16px',
          padding: '40px',
          marginBottom: '24px',
          color: 'white',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                opacity: 0.8,
                marginBottom: '12px',
                letterSpacing: '0.1em',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                TALENT PASSPORT
              </div>
              <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '8px' }}>
                {candidate.name}
              </h1>
              <p style={{ fontSize: '1.25rem', opacity: 0.9, marginBottom: '16px' }}>
                {candidate.currentTitle}
              </p>
              <div style={{ display: 'flex', gap: '24px', fontSize: '0.9375rem', opacity: 0.85 }}>
                <span>{candidate.location}</span>
                <span>{candidate.yearsExperience} years experience</span>
                <span>{candidate.currentCompany}</span>
              </div>
            </div>
            <div style={{
              backgroundColor: 'rgba(255,255,255,0.15)',
              borderRadius: '16px',
              padding: '20px 32px',
              textAlign: 'center',
              backdropFilter: 'blur(10px)',
            }}>
              <div style={{ fontSize: '3rem', fontWeight: 700, lineHeight: 1 }}>{candidate.score}</div>
              <div style={{ fontSize: '0.875rem', opacity: 0.8, marginTop: '4px' }}>AI Match Score</div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
          marginBottom: '24px',
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '20px',
            textAlign: 'center',
            border: '1px solid #E2E8F0',
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A' }}>{candidate.yearsExperience}</div>
            <div style={{ fontSize: '0.8125rem', color: '#64748B' }}>Years Experience</div>
          </div>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '20px',
            textAlign: 'center',
            border: '1px solid #E2E8F0',
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A' }}>{candidate.salary}</div>
            <div style={{ fontSize: '0.8125rem', color: '#64748B' }}>Current Package</div>
          </div>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '20px',
            textAlign: 'center',
            border: '1px solid #E2E8F0',
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#059669' }}>{candidate.noticePeriod}</div>
            <div style={{ fontSize: '0.8125rem', color: '#64748B' }}>Notice Period</div>
          </div>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '20px',
            textAlign: 'center',
            border: '1px solid #E2E8F0',
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A' }}>{candidate.location}</div>
            <div style={{ fontSize: '0.8125rem', color: '#64748B' }}>Location</div>
          </div>
        </div>

        {/* Summary */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px',
          border: '1px solid #E2E8F0',
        }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0F172A', marginBottom: '12px' }}>
            Professional Summary
          </h2>
          <p style={{ color: '#475569', lineHeight: 1.7, fontSize: '0.9375rem' }}>
            {candidate.summary}
          </p>
        </div>

        {/* Two Column Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
          {/* Left Column */}
          <div>
            {/* Experience */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '24px',
              border: '1px solid #E2E8F0',
            }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0F172A', marginBottom: '20px' }}>
                Experience
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {candidate.experience.map((exp, idx) => (
                  <div key={idx} style={{
                    paddingLeft: '20px',
                    borderLeft: '2px solid #E2E8F0',
                    position: 'relative',
                  }}>
                    <div style={{
                      position: 'absolute',
                      left: '-7px',
                      top: '4px',
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      backgroundColor: idx === 0 ? '#4F46E5' : '#E2E8F0',
                      border: '2px solid white',
                    }}/>
                    <div style={{ fontWeight: 600, color: '#0F172A', marginBottom: '4px' }}>{exp.title}</div>
                    <div style={{ fontSize: '0.875rem', color: '#64748B', marginBottom: '8px' }}>
                      {exp.company} | {exp.duration}
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '20px' }}>
                      {exp.highlights.map((highlight, hIdx) => (
                        <li key={hIdx} style={{
                          color: '#475569',
                          fontSize: '0.875rem',
                          marginBottom: '4px',
                          lineHeight: 1.5,
                        }}>
                          {highlight}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Education */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '24px',
              border: '1px solid #E2E8F0',
            }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0F172A', marginBottom: '16px' }}>
                Education
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {candidate.education.map((edu, idx) => (
                  <div key={idx} style={{
                    padding: '16px',
                    backgroundColor: '#F8FAFC',
                    borderRadius: '8px',
                  }}>
                    <div style={{ fontWeight: 600, color: '#0F172A', marginBottom: '4px' }}>{edu.degree}</div>
                    <div style={{ fontSize: '0.875rem', color: '#64748B' }}>
                      {edu.institution} | {edu.year}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div>
            {/* Qualifications */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '24px',
              border: '1px solid #E2E8F0',
            }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0F172A', marginBottom: '12px' }}>
                Qualifications
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {candidate.qualifications.map((qual, idx) => (
                  <div key={idx} style={{
                    padding: '10px 14px',
                    backgroundColor: '#ECFDF5',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    color: '#065F46',
                    fontWeight: 500,
                  }}>
                    {qual}
                  </div>
                ))}
              </div>
            </div>

            {/* Skills */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '24px',
              border: '1px solid #E2E8F0',
            }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0F172A', marginBottom: '12px' }}>
                Key Skills
              </h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {candidate.skills.map((skill, idx) => (
                  <span key={idx} style={{
                    padding: '6px 12px',
                    backgroundColor: '#EEF2FF',
                    borderRadius: '6px',
                    fontSize: '0.8125rem',
                    color: '#4338CA',
                  }}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Achievements */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '24px',
              border: '1px solid #E2E8F0',
            }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0F172A', marginBottom: '12px' }}>
                Key Achievements
              </h2>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                {candidate.achievements.map((achievement, idx) => (
                  <li key={idx} style={{
                    color: '#475569',
                    fontSize: '0.875rem',
                    marginBottom: '8px',
                    lineHeight: 1.5,
                  }}>
                    {achievement}
                  </li>
                ))}
              </ul>
            </div>

            {/* Recruiter Notes - only visible to recruiter */}
            {!isClientView && (
              <div style={{
                backgroundColor: '#FFFBEB',
                borderRadius: '12px',
                padding: '24px',
                border: '1px solid #FDE68A',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2">
                    <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                  </svg>
                  <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#92400E', margin: 0 }}>
                    Recruiter Notes (Not Shared)
                  </h2>
                </div>
                <p style={{ color: '#92400E', fontSize: '0.875rem', lineHeight: 1.6 }}>
                  {candidate.recruiterNotes}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Contact CTA */}
        {isClientView && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '32px',
            marginTop: '24px',
            border: '1px solid #E2E8F0',
            textAlign: 'center',
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0F172A', marginBottom: '8px' }}>
              Interested in this candidate?
            </h2>
            <p style={{ color: '#64748B', marginBottom: '20px' }}>
              Contact your recruiter to arrange an interview
            </p>
            <button onClick={() => setShowContact(true)} style={{
              padding: '14px 32px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#4F46E5',
              color: 'white',
              fontSize: '1rem',
              fontWeight: 500,
              cursor: 'pointer',
            }}>
              Request Interview
            </button>
          </div>
        )}

        {/* Actions for Recruiter */}
        {!isClientView && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            marginTop: '24px',
            border: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0F172A', marginBottom: '4px' }}>
                Ready to share?
              </h3>
              <p style={{ color: '#64748B', fontSize: '0.875rem' }}>
                Generate a shareable link or download as PDF
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button style={{
                padding: '12px 20px',
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                backgroundColor: 'white',
                fontSize: '0.9375rem',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Download PDF
              </button>
              <button style={{
                padding: '12px 20px',
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                backgroundColor: 'white',
                fontSize: '0.9375rem',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
                Copy Link
              </button>
              <button style={{
                padding: '12px 20px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#4F46E5',
                color: 'white',
                fontSize: '0.9375rem',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                Email to Client
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Share Modal */}
      {isShared && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }} onClick={() => setIsShared(false)}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '32px',
            width: '100%',
            maxWidth: '480px',
            boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#D1FAE5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0F172A', marginBottom: '8px' }}>
                Shareable Link Created
              </h2>
              <p style={{ color: '#64748B' }}>
                Send this link to your client
              </p>
            </div>
            <div style={{
              backgroundColor: '#F8FAFC',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}>
              <input
                type="text"
                readOnly
                value={`https://hireinbox.co.za/talent/${id}?share=abc123`}
                style={{
                  flex: 1,
                  border: 'none',
                  backgroundColor: 'transparent',
                  fontSize: '0.875rem',
                  color: '#475569',
                  outline: 'none',
                }}
              />
              <button style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: '#4F46E5',
                color: 'white',
                fontSize: '0.8125rem',
                fontWeight: 500,
                cursor: 'pointer',
              }}>
                Copy
              </button>
            </div>
            <div style={{ fontSize: '0.8125rem', color: '#64748B', marginBottom: '24px' }}>
              This link will expire in 7 days. Contact information is hidden from clients.
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setIsShared(false)} style={{
                flex: 1,
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                backgroundColor: 'white',
                fontSize: '0.9375rem',
                fontWeight: 500,
                cursor: 'pointer',
              }}>
                Done
              </button>
              <button style={{
                flex: 1,
                padding: '12px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#4F46E5',
                color: 'white',
                fontSize: '0.9375rem',
                fontWeight: 500,
                cursor: 'pointer',
              }}>
                Email Link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
