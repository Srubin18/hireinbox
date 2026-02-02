'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import PilotHeader from '@/components/PilotHeader';

// ============================================
// ADMIN - USER MANAGEMENT
// Manage pilot user roles
// ============================================

interface User {
  id: string;
  email: string;
  pilot_role: string | null;
  created_at: string;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ email: string; pilot_role?: string } | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    email: '',
    password: '',
    role: 'pilot_user' as string,
  });

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push('/pilot');
        return;
      }

      // Fetch current user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('pilot_role')
        .eq('id', session.user.id)
        .single();

      console.log('[Admin Users] Profile fetch:', { profile, profileError, userId: session.user.id });

      // Only allow admins to access this page
      if (profile?.pilot_role !== 'admin') {
        console.log('[Admin Users] Not admin, redirecting. Role:', profile?.pilot_role);
        router.push('/pilot/dashboard');
        return;
      }

      console.log('[Admin Users] Setting user:', { email: session.user.email, pilot_role: profile?.pilot_role });

      setUser({
        email: session.user.email || '',
        pilot_role: profile?.pilot_role,
      });

      // Fetch all users (note: full_name doesn't exist, removed last_login)
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('id, email, pilot_role, created_at')
        .order('created_at', { ascending: false });

      console.log('[Admin Users] Users fetch:', { usersData, usersError, count: usersData?.length });

      setUsers(usersData || []);
      setLoading(false);
    };

    fetchData();
  }, [supabase, router]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdating(userId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ pilot_role: newRole })
        .eq('id', userId);

      if (!error) {
        setUsers(prev => prev.map(u =>
          u.id === userId ? { ...u, pilot_role: newRole } : u
        ));
      }
    } catch (err) {
      console.error('Error updating role:', err);
    } finally {
      setUpdating(null);
    }
  };

  const handleCreateUser = async () => {
    if (!createForm.email || !createForm.password) {
      alert('Please fill in all fields');
      return;
    }

    setCreating(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: createForm.email,
        password: createForm.password,
        options: {
          data: {
            pilot_role: createForm.role,
          },
        },
      });

      if (error) {
        alert(`Error creating user: ${error.message}`);
        return;
      }

      // Add new user to the list
      if (data.user) {
        const newUser = data.user;
        setUsers(prev => [{
          id: newUser.id,
          email: createForm.email,
          pilot_role: createForm.role,
          created_at: new Date().toISOString(),
        }, ...prev]);
      }

      // Reset form and close modal
      setCreateForm({ email: '', password: '', role: 'pilot_user' });
      setShowCreateModal(false);
      alert('User created successfully!');
    } catch (err) {
      console.error('Error creating user:', err);
      alert('Failed to create user');
    } finally {
      setCreating(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/pilot');
  };

  const getRoleBadge = (role: string | null) => {
    if (!role) return { bg: '#f1f5f9', color: '#64748b', label: 'Unassigned' };

    switch (role) {
      case 'admin':
        return { bg: '#fef3c7', color: '#92400e', label: 'Admin' };
      case 'pilot_user':
        return { bg: '#dbeafe', color: '#1e40af', label: 'Pilot User' };
      case 'influencer':
        return { bg: '#ede9fe', color: '#5b21b6', label: 'Influencer' };
      default:
        return { bg: '#f1f5f9', color: '#64748b', label: role };
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
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      <PilotHeader user={user} onLogout={handleLogout} currentPage="admin" />

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
              User Management
            </h1>
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '0' }}>
              Manage pilot user roles and permissions
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              backgroundColor: '#10B981',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#059669';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#10B981';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Create User
          </button>
        </div>

        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          overflow: 'hidden',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                  Email
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                  Current Role
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                  Change Role
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                  Joined
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => {
                const badge = getRoleBadge(u.pilot_role);
                return (
                  <tr key={u.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#0f172a' }}>
                      {u.email}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 12px',
                        backgroundColor: badge.bg,
                        color: badge.color,
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 600,
                      }}>
                        {badge.label}
                      </span>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <select
                        value={u.pilot_role || ''}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        disabled={updating === u.id}
                        style={{
                          padding: '8px 12px',
                          fontSize: '14px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          backgroundColor: '#ffffff',
                          cursor: updating === u.id ? 'not-allowed' : 'pointer',
                          opacity: updating === u.id ? 0.6 : 1,
                        }}
                      >
                        <option value="">Unassigned</option>
                        <option value="admin">Admin</option>
                        <option value="pilot_user">Pilot User</option>
                        <option value="influencer">Influencer</option>
                      </select>
                    </td>
                    <td style={{ padding: '16px', fontSize: '13px', color: '#64748b' }}>
                      {new Date(u.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{
          marginTop: '24px',
          padding: '16px',
          backgroundColor: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: '8px',
          fontSize: '13px',
          color: '#1e40af',
        }}>
          <strong>Role Descriptions:</strong>
          <ul style={{ margin: '8px 0 0 20px', padding: 0 }}>
            <li><strong>Admin:</strong> Full access, non-billable, can manage users, shows orange badge</li>
            <li><strong>Pilot User:</strong> Standard access, billable</li>
            <li><strong>Influencer:</strong> Full access, non-billable, shows purple badge</li>
          </ul>
        </div>
      </main>

      {/* Create User Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }} onClick={() => setShowCreateModal(false)}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '32px',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginBottom: '20px' }}>
              Create New User
            </h2>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                Email
              </label>
              <input
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="user@example.com"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  fontSize: '14px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                Password
              </label>
              <input
                type="password"
                value={createForm.password}
                onChange={(e) => setCreateForm(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Minimum 6 characters"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  fontSize: '14px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                Role
              </label>
              <select
                value={createForm.role}
                onChange={(e) => setCreateForm(prev => ({ ...prev, role: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  fontSize: '14px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  outline: 'none',
                  cursor: 'pointer',
                  boxSizing: 'border-box',
                }}
              >
                <option value="pilot_user">Pilot User (Billable)</option>
                <option value="admin">Admin (Non-billable)</option>
                <option value="influencer">Influencer (Non-billable)</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowCreateModal(false)}
                disabled={creating}
                style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#64748b',
                  backgroundColor: '#f1f5f9',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: creating ? 'not-allowed' : 'pointer',
                  opacity: creating ? 0.5 : 1,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateUser}
                disabled={creating}
                style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#ffffff',
                  backgroundColor: '#10B981',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: creating ? 'not-allowed' : 'pointer',
                  opacity: creating ? 0.6 : 1,
                }}
              >
                {creating ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
