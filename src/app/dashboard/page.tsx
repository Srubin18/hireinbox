'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import EmailSettings from '@/components/EmailSettings';

interface DashboardProps {}

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const [loadingState, setLoadingState] = useState(true);
  const [showEmailSettings, setShowEmailSettings] = useState(false);
  const [showNewRoleModal, setShowNewRoleModal] = useState(false);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace('/login?redirect=/dashboard');
    } else {
      setLoadingState(false);
    }
  }, [user, loading, router]);

  if (loadingState || loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8fafc',
        fontFamily: "'Inter', -apple-system, sans-serif"
      }}>
        <div style={{ textAlign: 'center' }}>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ animation: 'spin 1s linear infinite', margin: '0 auto' }}>
            <circle cx="24" cy="24" r="20" stroke="#E5E7EB" strokeWidth="4" fill="none"/>
            <circle cx="24" cy="24" r="20" stroke="#4F46E5" strokeWidth="4" fill="none" strokeDasharray="80" strokeDashoffset="60" strokeLinecap="round"/>
          </svg>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ marginTop: 16, color: '#64748b', fontSize: '0.875rem' }}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      fontFamily: "'Inter', -apple-system, sans-serif"
    }}>
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap");
      `}</style>

      {/* Header */}
      <header style={{
        background: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: '16px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <svg width="32" height="32" viewBox="0 0 48 48" fill="none">
            <rect width="48" height="48" rx="12" fill="#4F46E5"/>
            <path d="M12 18L24 26L36 18V32C36 33.1 35.1 34 34 34H14C12.9 34 12 33.1 12 32V18Z" fill="white" fillOpacity="0.9"/>
            <path d="M34 14H14C12.9 14 12 14.9 12 16V18L24 26L36 18V16C36 14.9 35.1 14 34 14Z" fill="white"/>
            <circle cx="36" cy="12" r="9" fill="#10B981"/>
            <path d="M32.5 12L35 14.5L39.5 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <div>
            <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a' }}>
              <span style={{ color: '#0f172a' }}>Hire</span>
              <span style={{ color: '#4F46E5' }}>Inbox</span>
            </div>
            <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 500 }}>Employer Dashboard</div>
          </div>
        </div>
        <button
          onClick={async () => {
            await signOut();
            router.push('/');
          }}
          style={{
            padding: '8px 16px',
            backgroundColor: '#f1f5f9',
            border: '1px solid #e2e8f0',
            borderRadius: 6,
            fontSize: '0.875rem',
            fontWeight: 500,
            color: '#475569',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#e2e8f0';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#f1f5f9';
          }}
        >
          Logout
        </button>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 32px' }}>
        {/* Welcome Section */}
        <div style={{ marginBottom: 48 }}>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: 700,
            color: '#0f172a',
            marginBottom: 8
          }}>
            Welcome to HireInbox
          </h1>
          <p style={{
            fontSize: '1rem',
            color: '#64748b',
            marginBottom: 32
          }}>
            Less noise. Better hires. Screen CVs with AI-powered insights.
          </p>

          {/* Quick Actions */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 16,
            maxWidth: 600
          }}>
            <button
              onClick={() => setShowEmailSettings(true)}
              style={{
                padding: '20px 24px',
                background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                color: 'white',
                border: 'none',
                borderRadius: 12,
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s',
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(79, 70, 229, 0.4)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(79, 70, 229, 0.3)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>📧</div>
              <div style={{ fontWeight: 600 }}>Connect Email</div>
              <div style={{ fontSize: '0.8rem', opacity: 0.9, marginTop: 4 }}>Link your inbox to auto-screen CVs</div>
            </button>

            <button
              onClick={() => setShowNewRoleModal(true)}
              style={{
                padding: '20px 24px',
                background: 'white',
                color: '#0f172a',
                border: '2px solid #e5e7eb',
                borderRadius: 12,
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#4F46E5';
                e.currentTarget.style.backgroundColor = '#f0f4ff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.backgroundColor = 'white';
              }}
            >
              <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>💼</div>
              <div style={{ fontWeight: 600 }}>Create Role</div>
              <div style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: 4, color: '#64748b' }}>Define requirements for positions</div>
            </button>
          </div>
        </div>

        {/* Recent Candidates Section */}
        <div style={{
          background: 'white',
          borderRadius: 12,
          border: '1px solid #e5e7eb',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '20px 24px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <h2 style={{
              fontSize: '1.125rem',
              fontWeight: 700,
              color: '#0f172a'
            }}>
              Recent Candidates
            </h2>
            <a href="/"
              style={{
                fontSize: '0.875rem',
                color: '#4F46E5',
                textDecoration: 'none',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              View All →
            </a>
          </div>

          {/* Placeholder - 3-4 recent candidates */}
          <div style={{ padding: '20px 24px' }}>
            <div style={{
              textAlign: 'center',
              padding: '40px 24px',
              color: '#94a3b8'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: 12 }}>📭</div>
              <p style={{ fontSize: '0.875rem', marginBottom: 16 }}>No candidates yet</p>
              <p style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                Connect your email or manually upload CVs to get started
              </p>
            </div>
          </div>
        </div>

        {/* B2C Section */}
        <div style={{
          marginTop: 48,
          padding: '24px',
          background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.05), rgba(124, 58, 237, 0.05))',
          border: '1px solid rgba(79, 70, 229, 0.1)',
          borderRadius: 12
        }}>
          <h3 style={{
            fontSize: '1rem',
            fontWeight: 700,
            color: '#0f172a',
            marginBottom: 12
          }}>
            Share CV Feedback Link
          </h3>
          <p style={{
            fontSize: '0.875rem',
            color: '#64748b',
            marginBottom: 16
          }}>
            Generate a link to share with job seekers so they can get instant CV feedback from HireInbox's AI
          </p>
          <button
            onClick={() => router.push('/upload')}
            style={{
              padding: '10px 20px',
              background: '#4F46E5',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#4338ca';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#4F46E5';
            }}
          >
            Try CV Analysis →
          </button>
        </div>
      </main>

      {/* Email Settings Modal */}
      <EmailSettings
        isOpen={showEmailSettings}
        onClose={() => setShowEmailSettings(false)}
      />

      {/* New Role Modal */}
      {showNewRoleModal && (
        <NewRoleModal
          onClose={() => setShowNewRoleModal(false)}
          onCreated={() => {
            setShowNewRoleModal(false);
            router.push('/');
          }}
        />
      )}
    </div>
  );
}

// Simple Role Creation Modal
function NewRoleModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    department: '',
    location: '',
    type: 'full-time',
    description: '',
    requirements: '',
    niceToHave: '',
    salaryMin: '',
    salaryMax: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          department: formData.department,
          location: formData.location,
          employment_type: formData.type,
          description: formData.description,
          requirements: formData.requirements.split('\n').filter(r => r.trim()),
          nice_to_have: formData.niceToHave.split('\n').filter(r => r.trim()),
          salary_min: formData.salaryMin ? parseInt(formData.salaryMin) : null,
          salary_max: formData.salaryMax ? parseInt(formData.salaryMax) : null,
        })
      });
      if (response.ok) {
        onCreated();
      }
    } catch (error) {
      console.error('Failed to create role:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        borderRadius: 16,
        width: '100%',
        maxWidth: 600,
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
            Create New Role
          </h2>
          <button onClick={onClose} style={{
            background: 'none',
            border: 'none',
            fontSize: '1.5rem',
            cursor: 'pointer',
            color: '#64748b'
          }}>×</button>
        </div>

        {/* Progress */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {[1, 2, 3].map(s => (
              <div key={s} style={{
                flex: 1,
                height: 4,
                borderRadius: 2,
                backgroundColor: s <= step ? '#4F46E5' : '#e5e7eb'
              }} />
            ))}
          </div>
          <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 8 }}>
            Step {step} of 3: {step === 1 ? 'Basic Info' : step === 2 ? 'Requirements' : 'Compensation'}
          </p>
        </div>

        {/* Form */}
        <div style={{ padding: 24 }}>
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: 6 }}>Job Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Senior Software Engineer"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: 8,
                    fontSize: '0.875rem'
                  }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: 6 }}>Department</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={e => setFormData({ ...formData, department: e.target.value })}
                    placeholder="e.g. Engineering"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #e5e7eb',
                      borderRadius: 8,
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: 6 }}>Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g. Cape Town"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #e5e7eb',
                      borderRadius: 8,
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: 6 }}>Employment Type</label>
                <select
                  value={formData.type}
                  onChange={e => setFormData({ ...formData, type: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: 8,
                    fontSize: '0.875rem'
                  }}
                >
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="contract">Contract</option>
                  <option value="internship">Internship</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: 6 }}>Job Description</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the role and responsibilities..."
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: 8,
                    fontSize: '0.875rem',
                    resize: 'vertical'
                  }}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: 6 }}>
                  Requirements (one per line) *
                </label>
                <textarea
                  value={formData.requirements}
                  onChange={e => setFormData({ ...formData, requirements: e.target.value })}
                  placeholder="5+ years experience in software development&#10;Strong knowledge of Python/JavaScript&#10;Experience with cloud platforms (AWS/GCP)"
                  rows={6}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: 8,
                    fontSize: '0.875rem',
                    resize: 'vertical'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: 6 }}>
                  Nice to Have (one per line)
                </label>
                <textarea
                  value={formData.niceToHave}
                  onChange={e => setFormData({ ...formData, niceToHave: e.target.value })}
                  placeholder="Experience with machine learning&#10;Knowledge of DevOps practices&#10;Open source contributions"
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: 8,
                    fontSize: '0.875rem',
                    resize: 'vertical'
                  }}
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
                Salary range helps filter candidates. Leave blank to show as "Competitive".
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: 6 }}>
                    Minimum (ZAR/month)
                  </label>
                  <input
                    type="number"
                    value={formData.salaryMin}
                    onChange={e => setFormData({ ...formData, salaryMin: e.target.value })}
                    placeholder="e.g. 45000"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #e5e7eb',
                      borderRadius: 8,
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: 6 }}>
                    Maximum (ZAR/month)
                  </label>
                  <input
                    type="number"
                    value={formData.salaryMax}
                    onChange={e => setFormData({ ...formData, salaryMax: e.target.value })}
                    placeholder="e.g. 65000"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #e5e7eb',
                      borderRadius: 8,
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <button
            onClick={() => step > 1 ? setStep(step - 1) : onClose()}
            style={{
              padding: '10px 20px',
              background: '#f1f5f9',
              border: 'none',
              borderRadius: 8,
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            {step > 1 ? 'Back' : 'Cancel'}
          </button>
          <button
            onClick={() => step < 3 ? setStep(step + 1) : handleSubmit()}
            disabled={isSubmitting || (step === 1 && !formData.title)}
            style={{
              padding: '10px 20px',
              background: '#4F46E5',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: 'pointer',
              opacity: isSubmitting || (step === 1 && !formData.title) ? 0.5 : 1
            }}
          >
            {isSubmitting ? 'Creating...' : step < 3 ? 'Next' : 'Create Role'}
          </button>
        </div>
      </div>
    </div>
  );
}
