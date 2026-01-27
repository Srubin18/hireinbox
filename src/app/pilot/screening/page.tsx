'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

// ============================================
// HIREINBOX PILOT - CV SCREENING
// /pilot/screening
// AI-powered CV screening for pilot recruiters
// ============================================

interface Role {
  id: string;
  created_at: string;
  title: string;
  location: string;
  email_alias: string;
  candidates_count: number;
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
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRole, setNewRole] = useState({
    title: '',
    location: 'Johannesburg',
    description: '',
    required_skills: '',
    experience_min: '2',
    experience_max: '10',
  });
  const [creating, setCreating] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchRoles = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push('/pilot');
        return;
      }

      setUser({ email: session.user.email || '' });

      // Fetch roles with candidate count
      const { data: rolesData } = await supabase
        .from('roles')
        .select(`
          id,
          created_at,
          title,
          location,
          email_alias,
          candidates:candidates(count)
        `)
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (rolesData) {
        const formattedRoles = rolesData.map(r => ({
          id: r.id,
          created_at: r.created_at,
          title: r.title,
          location: r.location || 'South Africa',
          email_alias: r.email_alias || '',
          candidates_count: (r.candidates as unknown as { count: number }[])?.[0]?.count || 0,
        }));
        setRoles(formattedRoles);
      }
    } catch (err) {
      console.error('Error fetching roles:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase, router]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      // Generate unique email alias (title + timestamp to prevent collisions)
      const emailAlias = `${newRole.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 15)}-${Date.now().toString(36)}`;

      const { error } = await supabase
        .from('roles')
        .insert({
          user_id: session.user.id,
          title: newRole.title,
          location: newRole.location,
          description: newRole.description,
          required_skills: newRole.required_skills.split(',').map(s => s.trim()).filter(Boolean),
          experience_min: parseInt(newRole.experience_min),
          experience_max: parseInt(newRole.experience_max),
          email_alias: emailAlias,
          status: 'active',
        });

      if (error) throw error;

      setShowCreateModal(false);
      setNewRole({
        title: '',
        location: 'Johannesburg',
        description: '',
        required_skills: '',
        experience_min: '2',
        experience_max: '10',
      });
      fetchRoles();
    } catch (err) {
      console.error('Error creating role:', err);
      alert('Failed to create role. Please try again.');
    } finally {
      setCreating(false);
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
          <p style={{ color: '#64748b' }}>Loading screening dashboard...</p>
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
        .screening-main { padding: 32px; }
        .how-it-works-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
        .roles-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 16px; }
        .modal-content { width: 100%; max-width: 500px; padding: 32px; }
        .header-content { padding: 16px 32px; }

        @media (max-width: 768px) {
          .screening-main { padding: 16px !important; }
          .how-it-works-grid { grid-template-columns: 1fr !important; gap: 16px !important; }
          .roles-grid { grid-template-columns: 1fr !important; }
          .modal-content { max-width: 95% !important; padding: 20px !important; margin: 16px; }
          .header-content { padding: 12px 16px !important; flex-wrap: wrap; gap: 12px !important; }
          .header-right { flex-wrap: wrap; justify-content: flex-end; }
        }
      `}</style>

      {/* Header */}
      <header className="header-content" style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div onClick={() => router.push('/pilot/dashboard')}><Logo /></div>
        <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
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
        {/* How it works */}
        <div style={{
          backgroundColor: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px',
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#166534', marginBottom: '12px' }}>
            How AI CV Screening Works
          </h2>
          <div className="how-it-works-grid">
            <div>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>1.</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#166534', marginBottom: '4px' }}>Create a Role</div>
              <div style={{ fontSize: '13px', color: '#15803d' }}>
                Define the job requirements and get a unique email address
              </div>
            </div>
            <div>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>2.</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#166534', marginBottom: '4px' }}>Forward CVs</div>
              <div style={{ fontSize: '13px', color: '#15803d' }}>
                Send CVs to your role&apos;s email - we&apos;ll screen them with AI
              </div>
            </div>
            <div>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>3.</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#166534', marginBottom: '4px' }}>Review Shortlist</div>
              <div style={{ fontSize: '13px', color: '#15803d' }}>
                Get AI-ranked candidates with explainable scores
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
            Your Screening Roles
          </h1>
          <p style={{ fontSize: '15px', color: '#64748b' }}>
            {roles.length} active {roles.length === 1 ? 'role' : 'roles'}
          </p>
        </div>

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
              No screening roles yet
            </h3>
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px' }}>
              Create your first role to start AI-powered CV screening
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
              Create Your First Role
            </button>
          </div>
        ) : (
          <div className="roles-grid">
            {roles.map((role) => (
              <div
                key={role.id}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  padding: '24px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onClick={() => router.push(`/hire/dashboard?role=${role.id}`)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a' }}>
                    {role.title}
                  </h3>
                  <span style={{
                    padding: '4px 12px',
                    backgroundColor: '#F0FDF4',
                    color: '#10B981',
                    borderRadius: '16px',
                    fontSize: '13px',
                    fontWeight: 600,
                  }}>
                    {role.candidates_count} CVs
                  </span>
                </div>
                <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '16px' }}>
                  {role.location}
                </div>
                <div style={{
                  padding: '12px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '8px',
                  fontSize: '13px',
                }}>
                  <div style={{ color: '#64748b', marginBottom: '4px' }}>Send CVs to:</div>
                  <div style={{ color: '#4F46E5', fontWeight: 500 }}>
                    {role.email_alias}+hireinbox@gmail.com
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Role Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
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
              <div style={{ marginBottom: '20px' }}>
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

              <div style={{ marginBottom: '20px' }}>
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
                  <option value="Remote">Remote</option>
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                  Required Skills (comma-separated)
                </label>
                <input
                  type="text"
                  value={newRole.required_skills}
                  onChange={(e) => setNewRole({ ...newRole, required_skills: e.target.value })}
                  placeholder="e.g. Excel, Financial Reporting, SAP"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '15px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                    Min Experience (years)
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
                    Max Experience (years)
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

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                  Job Description
                </label>
                <textarea
                  value={newRole.description}
                  onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                  placeholder="Describe the role requirements..."
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
