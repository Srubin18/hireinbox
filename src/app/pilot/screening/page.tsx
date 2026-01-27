'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

// ============================================
// HIREINBOX PILOT - CV SCREENING
// /pilot/screening
// AI-powered CV screening with role filter
// ============================================

interface Role {
  id: string;
  created_at: string;
  title: string;
  location: string;
  email_alias: string;
  description?: string;
  required_skills?: string[];
  experience_min?: number;
  experience_max?: number;
}

interface Candidate {
  id: string;
  name: string;
  email: string;
  ai_score: number;
  ai_match: string;
  ai_recommendation: string;
  strengths: string[];
  created_at: string;
}

const Logo = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
    <svg width="36" height="36" viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="12" fill="#4F46E5"/>
      <path d="M12 18L24 26L36 18V32C36 33.1 35.1 34 34 34H14C12.9 34 12 33.1 12 32V18Z" fill="white" fillOpacity="0.9"/>
      <path d="M34 14H14C12.9 14 12 14.9 12 16V18L24 26L36 18V16C36 14.9 35.1 14 34 14Z" fill="white"/>
      <circle cx="36" cy="12" r="9" fill="#10B981"/>
      <path d="M32.5 12L35 14.5L39.5 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
    <div>
      <div style={{ fontSize: '16px', fontWeight: 700 }}>
        <span style={{ color: '#0f172a' }}>Hire</span><span style={{ color: '#4F46E5' }}>Inbox</span>
      </div>
      <div style={{ fontSize: '11px', color: '#64748b' }}>CV Screening</div>
    </div>
  </div>
);

export default function PilotScreening() {
  const router = useRouter();
  const [roles, setRoles] = useState<Role[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRole, setNewRole] = useState({
    title: '',
    location: 'Johannesburg',
    description: '',
    required_skills: '',
    experience_min: '0',
    experience_max: '20',
    seniority: 'mid',
    employment_type: 'full-time',
    qualifications: '',
    must_have_skills: '',
    nice_to_have_skills: '',
    dealbreakers: '',
  });
  const [creating, setCreating] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Fetch roles
  const fetchRoles = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push('/pilot');
        return;
      }

      setUser({ email: session.user.email || '' });

      const { data: rolesData } = await supabase
        .from('roles')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (rolesData && rolesData.length > 0) {
        setRoles(rolesData);
        // Auto-select first role if none selected
        if (!selectedRoleId) {
          setSelectedRoleId(rolesData[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching roles:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase, router, selectedRoleId]);

  // Fetch candidates for selected role
  const fetchCandidates = useCallback(async () => {
    if (!selectedRoleId) return;

    setLoadingCandidates(true);
    try {
      const { data: candidatesData } = await supabase
        .from('candidates')
        .select('*')
        .eq('role_id', selectedRoleId)
        .order('ai_score', { ascending: false });

      if (candidatesData) {
        setCandidates(candidatesData.map(c => ({
          id: c.id,
          name: c.name || c.email?.split('@')[0] || 'Unknown',
          email: c.email || '',
          ai_score: c.ai_score || 0,
          ai_match: c.ai_match || 'pending',
          ai_recommendation: c.ai_recommendation || '',
          strengths: c.strengths || [],
          created_at: c.created_at,
        })));
      }
    } catch (err) {
      console.error('Error fetching candidates:', err);
    } finally {
      setLoadingCandidates(false);
    }
  }, [supabase, selectedRoleId]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  useEffect(() => {
    if (selectedRoleId) {
      fetchCandidates();
    }
  }, [selectedRoleId, fetchCandidates]);

  const selectedRole = roles.find(r => r.id === selectedRoleId);

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      // Generate unique email alias
      const emailAlias = `${newRole.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 15)}-${Date.now().toString(36)}`;

      const { data, error } = await supabase
        .from('roles')
        .insert({
          user_id: session.user.id,
          title: newRole.title,
          location: newRole.location,
          description: newRole.description,
          required_skills: newRole.must_have_skills.split(',').map(s => s.trim()).filter(Boolean),
          experience_min: parseInt(newRole.experience_min) || 0,
          experience_max: parseInt(newRole.experience_max) || 20,
          email_alias: emailAlias,
          status: 'active',
          // Store additional fields in description or separate columns if available
        })
        .select()
        .single();

      if (error) throw error;

      setShowCreateModal(false);
      setNewRole({
        title: '',
        location: 'Johannesburg',
        description: '',
        required_skills: '',
        experience_min: '0',
        experience_max: '20',
        seniority: 'mid',
        employment_type: 'full-time',
        qualifications: '',
        must_have_skills: '',
        nice_to_have_skills: '',
        dealbreakers: '',
      });

      // Refresh and select new role
      await fetchRoles();
      if (data) {
        setSelectedRoleId(data.id);
      }
    } catch (err) {
      console.error('Error creating role:', err);
      alert('Failed to create role. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const getMatchColor = (match: string) => {
    switch (match) {
      case 'strong': return '#10B981';
      case 'possible': return '#F59E0B';
      case 'low': return '#EF4444';
      default: return '#64748b';
    }
  };

  const getMatchBg = (match: string) => {
    switch (match) {
      case 'strong': return '#D1FAE5';
      case 'possible': return '#FEF3C7';
      case 'low': return '#FEE2E2';
      default: return '#F1F5F9';
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '3px solid #e2e8f0',
            borderTopColor: '#10B981',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px',
          }} />
          <p style={{ color: '#64748b' }}>Loading...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      {/* Mobile Responsive Styles */}
      <style>{`
        .screening-main { padding: 24px 32px; }
        .screening-header { padding: 16px 32px; }
        .filter-row { display: flex; gap: 16px; align-items: center; flex-wrap: wrap; }
        .candidates-grid { display: flex; flex-direction: column; gap: 12px; }
        .modal-content { width: 100%; max-width: 600px; padding: 32px; }

        @media (max-width: 768px) {
          .screening-main { padding: 16px !important; }
          .screening-header { padding: 12px 16px !important; flex-wrap: wrap; gap: 12px !important; }
          .filter-row { flex-direction: column !important; align-items: stretch !important; }
          .filter-row select { width: 100% !important; }
          .modal-content { max-width: 95% !important; padding: 20px !important; margin: 16px; }
        }
      `}</style>

      {/* Header */}
      <header className="screening-header" style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div onClick={() => router.push('/pilot/dashboard')}><Logo /></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#10B981',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            + Create Role
          </button>
          <span style={{ fontSize: '14px', color: '#64748b' }}>{user?.email}</span>
        </div>
      </header>

      <main className="screening-main" style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Role Filter */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          padding: '20px 24px',
          marginBottom: '24px',
        }}>
          <div className="filter-row">
            <div style={{ flex: 1, minWidth: '200px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#64748b', marginBottom: '6px' }}>
                SELECT ROLE
              </label>
              <select
                value={selectedRoleId}
                onChange={(e) => setSelectedRoleId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '15px',
                  fontWeight: 500,
                  border: '2px solid #4F46E5',
                  borderRadius: '8px',
                  backgroundColor: '#ffffff',
                  cursor: 'pointer',
                }}
              >
                {roles.length === 0 ? (
                  <option value="">No roles - create one first</option>
                ) : (
                  roles.map(role => (
                    <option key={role.id} value={role.id}>
                      {role.title} ({role.location})
                    </option>
                  ))
                )}
              </select>
            </div>

            {selectedRole && (
              <div style={{
                padding: '12px 16px',
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                fontSize: '13px',
              }}>
                <div style={{ color: '#64748b', marginBottom: '4px' }}>Forward CVs to:</div>
                <div style={{ color: '#4F46E5', fontWeight: 600, fontFamily: 'monospace' }}>
                  {selectedRole.email_alias}+hireinbox@gmail.com
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Candidates List */}
        {roles.length === 0 ? (
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '64px',
            textAlign: 'center',
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              backgroundColor: '#F0FDF4',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
              color: '#10B981',
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 12h-6l-2 3h-4l-2-3H2"/>
                <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
              </svg>
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>
              Create your first role
            </h3>
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px' }}>
              Create a role to get a unique email address for CV forwarding
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                padding: '12px 24px',
                backgroundColor: '#10B981',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Create Role
            </button>
          </div>
        ) : loadingCandidates ? (
          <div style={{ textAlign: 'center', padding: '48px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              border: '3px solid #e2e8f0',
              borderTopColor: '#10B981',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px',
            }} />
            <p style={{ color: '#64748b' }}>Loading candidates...</p>
          </div>
        ) : candidates.length === 0 ? (
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '48px',
            textAlign: 'center',
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>
              No CVs yet for this role
            </h3>
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '16px' }}>
              Forward CVs to: <span style={{ color: '#4F46E5', fontWeight: 600 }}>{selectedRole?.email_alias}+hireinbox@gmail.com</span>
            </p>
            <p style={{ fontSize: '13px', color: '#94a3b8' }}>
              CVs will be automatically screened by AI and appear here
            </p>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a' }}>
                {candidates.length} Candidates
              </h2>
              <div style={{ fontSize: '13px', color: '#64748b' }}>
                Sorted by AI score (highest first)
              </div>
            </div>

            <div className="candidates-grid">
              {candidates.map((candidate) => (
                <div
                  key={candidate.id}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    padding: '20px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>
                        {candidate.name}
                      </h3>
                      <span style={{
                        padding: '4px 10px',
                        backgroundColor: getMatchBg(candidate.ai_match),
                        color: getMatchColor(candidate.ai_match),
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 600,
                        textTransform: 'capitalize',
                      }}>
                        {candidate.ai_match}
                      </span>
                    </div>
                    <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '4px' }}>
                      {candidate.email}
                    </div>
                    {candidate.ai_recommendation && (
                      <div style={{ fontSize: '13px', color: '#475569', marginTop: '8px' }}>
                        {candidate.ai_recommendation.substring(0, 150)}...
                      </div>
                    )}
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      fontSize: '24px',
                      fontWeight: 700,
                      color: getMatchColor(candidate.ai_match),
                      marginBottom: '4px',
                    }}>
                      {candidate.ai_score}%
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      AI Score
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      {/* Create Role Modal - COMPREHENSIVE */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          padding: '16px',
        }}>
          <div className="modal-content" style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            maxHeight: '90vh',
            overflowY: 'auto',
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginBottom: '24px' }}>
              Create Screening Role
            </h2>

            <form onSubmit={handleCreateRole}>
              {/* Basic Info */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#4F46E5', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Basic Information
                </h3>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                    Job Title *
                  </label>
                  <input
                    type="text"
                    value={newRole.title}
                    onChange={(e) => setNewRole({ ...newRole, title: e.target.value })}
                    required
                    placeholder="e.g. Senior Accountant"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      fontSize: '15px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                      Location *
                    </label>
                    <select
                      value={newRole.location}
                      onChange={(e) => setNewRole({ ...newRole, location: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        fontSize: '15px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                      }}
                    >
                      <option value="Johannesburg">Johannesburg</option>
                      <option value="Cape Town">Cape Town</option>
                      <option value="Durban">Durban</option>
                      <option value="Pretoria">Pretoria</option>
                      <option value="Port Elizabeth">Port Elizabeth</option>
                      <option value="Bloemfontein">Bloemfontein</option>
                      <option value="Remote">Remote</option>
                      <option value="Hybrid">Hybrid</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                      Employment Type
                    </label>
                    <select
                      value={newRole.employment_type}
                      onChange={(e) => setNewRole({ ...newRole, employment_type: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        fontSize: '15px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                      }}
                    >
                      <option value="full-time">Full-time</option>
                      <option value="part-time">Part-time</option>
                      <option value="contract">Contract</option>
                      <option value="temporary">Temporary</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                      Seniority
                    </label>
                    <select
                      value={newRole.seniority}
                      onChange={(e) => setNewRole({ ...newRole, seniority: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        fontSize: '15px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                      }}
                    >
                      <option value="junior">Junior</option>
                      <option value="mid">Mid-level</option>
                      <option value="senior">Senior</option>
                      <option value="lead">Lead</option>
                      <option value="manager">Manager</option>
                      <option value="director">Director</option>
                      <option value="executive">Executive</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                      Min Experience (yrs)
                    </label>
                    <input
                      type="number"
                      value={newRole.experience_min}
                      onChange={(e) => setNewRole({ ...newRole, experience_min: e.target.value })}
                      min="0"
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        fontSize: '15px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                      Max Experience (yrs)
                    </label>
                    <input
                      type="number"
                      value={newRole.experience_max}
                      onChange={(e) => setNewRole({ ...newRole, experience_max: e.target.value })}
                      min="0"
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        fontSize: '15px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Requirements */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#10B981', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Requirements
                </h3>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                    Must-Have Skills (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={newRole.must_have_skills}
                    onChange={(e) => setNewRole({ ...newRole, must_have_skills: e.target.value })}
                    placeholder="e.g. Excel, Financial Reporting, IFRS"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      fontSize: '15px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                    Nice-to-Have Skills (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={newRole.nice_to_have_skills}
                    onChange={(e) => setNewRole({ ...newRole, nice_to_have_skills: e.target.value })}
                    placeholder="e.g. SAP, Power BI, Python"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      fontSize: '15px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                    Qualifications
                  </label>
                  <input
                    type="text"
                    value={newRole.qualifications}
                    onChange={(e) => setNewRole({ ...newRole, qualifications: e.target.value })}
                    placeholder="e.g. CA(SA), BCom, CFA"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      fontSize: '15px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                    Dealbreakers (auto-reject if missing)
                  </label>
                  <input
                    type="text"
                    value={newRole.dealbreakers}
                    onChange={(e) => setNewRole({ ...newRole, dealbreakers: e.target.value })}
                    placeholder="e.g. Must have CA(SA), Must be based in SA"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      fontSize: '15px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                    }}
                  />
                </div>
              </div>

              {/* Job Description */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                  Job Description
                </label>
                <textarea
                  value={newRole.description}
                  onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                  placeholder="Describe the role, responsibilities, and what makes a great candidate..."
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '15px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#ffffff',
                    color: '#475569',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !newRole.title}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#10B981',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: creating ? 'not-allowed' : 'pointer',
                    opacity: creating ? 0.7 : 1,
                  }}
                >
                  {creating ? 'Creating...' : 'Create Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
