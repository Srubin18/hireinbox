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
  full_name: string | null;
  pilot_role: string | null;
  created_at: string;
  last_login: string | null;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ email: string; pilot_role?: string } | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

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
      const { data: profile } = await supabase
        .from('profiles')
        .select('pilot_role')
        .eq('id', session.user.id)
        .single();

      // Only allow admins to access this page
      if (profile?.pilot_role !== 'admin') {
        router.push('/pilot/dashboard');
        return;
      }

      setUser({
        email: session.user.email || '',
        pilot_role: profile?.pilot_role,
      });

      // Fetch all users
      const { data: usersData } = await supabase
        .from('profiles')
        .select('id, email, full_name, pilot_role, created_at, last_login')
        .order('created_at', { ascending: false });

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
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
          User Management
        </h1>
        <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px' }}>
          Manage pilot user roles and permissions
        </p>

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
                      {u.full_name && (
                        <div style={{ fontSize: '12px', color: '#64748b' }}>{u.full_name}</div>
                      )}
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
    </div>
  );
}
