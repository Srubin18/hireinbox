'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

/* ===========================================
   HIREINBOX - TEAM MANAGEMENT PAGE
   - List team members
   - Invite new members
   - Role-based badges (Admin/Viewer)
   =========================================== */

// Types
interface TeamMember {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'viewer';
  status: 'active' | 'pending';
  avatar?: string;
  invitedAt?: string;
  joinedAt?: string;
}

// Logo Component
const Logo = ({ size = 32 }: { size?: number }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="12" fill="#4F46E5"/>
      <path d="M12 18L24 26L36 18V32C36 33.1 35.1 34 34 34H14C12.9 34 12 33.1 12 32V18Z" fill="white" fillOpacity="0.9"/>
      <path d="M34 14H14C12.9 14 12 14.9 12 16V18L24 26L36 18V16C36 14.9 35.1 14 34 14Z" fill="white"/>
      <circle cx="36" cy="12" r="9" fill="#10B981"/>
      <path d="M32.5 12L35 14.5L39.5 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <span style={{ fontSize: size > 28 ? '1.15rem' : '1rem', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
        <span style={{ color: '#0f172a' }}>Hire</span>
        <span style={{ color: '#4F46E5' }}>Inbox</span>
      </span>
      <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 500 }}>Less noise. Better hires.</span>
    </div>
  </div>
);

// Role Badge Component
const RoleBadge = ({ role }: { role: 'admin' | 'viewer' }) => {
  const isAdmin = role === 'admin';
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: '4px 10px',
      borderRadius: 100,
      fontSize: '0.75rem',
      fontWeight: 600,
      background: isAdmin ? '#eef2ff' : '#f1f5f9',
      color: isAdmin ? '#4F46E5' : '#64748b',
    }}>
      {isAdmin && (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
        </svg>
      )}
      {isAdmin ? 'Admin' : 'Viewer'}
    </span>
  );
};

// Status Badge Component
const StatusBadge = ({ status }: { status: 'active' | 'pending' }) => {
  const isActive = status === 'active';
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: '4px 10px',
      borderRadius: 100,
      fontSize: '0.75rem',
      fontWeight: 500,
      background: isActive ? '#ecfdf5' : '#fef3c7',
      color: isActive ? '#059669' : '#d97706',
    }}>
      <span style={{
        width: 6,
        height: 6,
        borderRadius: '50%',
        background: isActive ? '#10b981' : '#f59e0b',
      }} />
      {isActive ? 'Active' : 'Pending'}
    </span>
  );
};

// Mock team data
const MOCK_TEAM: TeamMember[] = [
  {
    id: '1',
    email: 'simon@mafadi.co.za',
    name: 'Simon Rubin',
    role: 'admin',
    status: 'active',
    joinedAt: '2024-01-15',
  },
  {
    id: '2',
    email: 'thabo@mafadi.co.za',
    name: 'Thabo Molefe',
    role: 'admin',
    status: 'active',
    joinedAt: '2024-02-10',
  },
  {
    id: '3',
    email: 'lerato@mafadi.co.za',
    name: 'Lerato Nkosi',
    role: 'viewer',
    status: 'active',
    joinedAt: '2024-03-05',
  },
];

export default function TeamPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'viewer'>('viewer');
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState<'company' | 'team'>('team');

  // Load members from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedMembers = localStorage.getItem('hireinbox_team_members');
      if (savedMembers) {
        try {
          setMembers(JSON.parse(savedMembers));
        } catch (e) {
          console.error('Failed to parse saved members:', e);
          setMembers(MOCK_TEAM);
        }
      } else {
        // Use mock data if no saved data
        setMembers(MOCK_TEAM);
        localStorage.setItem('hireinbox_team_members', JSON.stringify(MOCK_TEAM));
      }
    }
  }, []);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/settings/team');
    }
  }, [user, authLoading, router]);

  // Handle invite
  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      alert('Please enter an email address');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail)) {
      alert('Please enter a valid email address');
      return;
    }

    // Check for duplicate
    if (members.some(m => m.email.toLowerCase() === inviteEmail.toLowerCase())) {
      alert('This email is already on the team');
      return;
    }

    setSending(true);

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));

      const newMember: TeamMember = {
        id: Date.now().toString(),
        email: inviteEmail.trim(),
        name: inviteEmail.split('@')[0],
        role: inviteRole,
        status: 'pending',
        invitedAt: new Date().toISOString(),
      };

      const updatedMembers = [...members, newMember];
      setMembers(updatedMembers);
      localStorage.setItem('hireinbox_team_members', JSON.stringify(updatedMembers));

      setInviteEmail('');
      setInviteRole('viewer');
      setShowInviteModal(false);
    } catch (error) {
      console.error('Failed to invite:', error);
      alert('Failed to send invitation. Please try again.');
    } finally {
      setSending(false);
    }
  };

  // Handle remove member
  const handleRemove = (memberId: string) => {
    // Don't allow removing yourself
    const memberToRemove = members.find(m => m.id === memberId);
    if (memberToRemove?.email === user?.email) {
      alert('You cannot remove yourself from the team');
      return;
    }

    if (confirm('Are you sure you want to remove this team member?')) {
      const updatedMembers = members.filter(m => m.id !== memberId);
      setMembers(updatedMembers);
      localStorage.setItem('hireinbox_team_members', JSON.stringify(updatedMembers));
    }
  };

  // Handle role change
  const handleRoleChange = (memberId: string, newRole: 'admin' | 'viewer') => {
    const updatedMembers = members.map(m =>
      m.id === memberId ? { ...m, role: newRole } : m
    );
    setMembers(updatedMembers);
    localStorage.setItem('hireinbox_team_members', JSON.stringify(updatedMembers));
  };

  // Get initials from name or email
  const getInitials = (name: string, email: string) => {
    if (name && name !== email.split('@')[0]) {
      return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    }
    return email.slice(0, 2).toUpperCase();
  };

  // Format date
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Loading state
  if (authLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
            <circle cx="24" cy="24" r="20" stroke="#E5E7EB" strokeWidth="4" fill="none"/>
            <circle cx="24" cy="24" r="20" stroke="#4F46E5" strokeWidth="4" fill="none" strokeDasharray="80" strokeDashoffset="60" strokeLinecap="round"/>
          </svg>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", background: '#f8fafc', minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        input:focus, select:focus { outline: none; border-color: #4F46E5 !important; box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1); }
      `}</style>

      {/* Header */}
      <header style={{ background: 'white', borderBottom: '1px solid #e5e7eb', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <button
            onClick={() => router.push('/')}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', padding: '8px 12px', borderRadius: 8, color: '#64748b', fontSize: '0.875rem', fontWeight: 500 }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back to Dashboard
          </button>
          <div style={{ height: 24, width: 1, background: '#e5e7eb' }} />
          <Logo size={28} />
        </div>

        <button
          onClick={() => setShowInviteModal(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 20px',
            background: '#4F46E5',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="8.5" cy="7" r="4"/>
            <line x1="20" y1="8" x2="20" y2="14"/>
            <line x1="23" y1="11" x2="17" y2="11"/>
          </svg>
          Invite Team Member
        </button>
      </header>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>
        {/* Page Title */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Settings</h1>
          <p style={{ color: '#64748b', fontSize: '0.9375rem' }}>Manage your company profile and team members</p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 32, background: '#f1f5f9', padding: 4, borderRadius: 10, width: 'fit-content' }}>
          <button
            onClick={() => router.push('/settings')}
            style={{
              padding: '10px 20px',
              background: activeTab === 'company' ? 'white' : 'transparent',
              border: 'none',
              borderRadius: 8,
              fontSize: '0.875rem',
              fontWeight: 600,
              color: activeTab === 'company' ? '#0f172a' : '#64748b',
              cursor: 'pointer',
              boxShadow: activeTab === 'company' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            Company Profile
          </button>
          <button
            onClick={() => setActiveTab('team')}
            style={{
              padding: '10px 20px',
              background: activeTab === 'team' ? 'white' : 'transparent',
              border: 'none',
              borderRadius: 8,
              fontSize: '0.875rem',
              fontWeight: 600,
              color: activeTab === 'team' ? '#0f172a' : '#64748b',
              cursor: 'pointer',
              boxShadow: activeTab === 'team' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            Team Members
          </button>
        </div>

        {/* Team Members List */}
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>Team Members</h2>
              <p style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                {members.length} {members.length === 1 ? 'member' : 'members'} in your team
              </p>
            </div>
          </div>

          {/* Members Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ textAlign: 'left', padding: '12px 24px', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Member</th>
                  <th style={{ textAlign: 'left', padding: '12px 24px', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Role</th>
                  <th style={{ textAlign: 'left', padding: '12px 24px', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                  <th style={{ textAlign: 'left', padding: '12px 24px', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Joined</th>
                  <th style={{ textAlign: 'right', padding: '12px 24px', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member, index) => (
                  <tr key={member.id} style={{ borderTop: index > 0 ? '1px solid #f1f5f9' : 'none' }}>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          background: member.avatar ? `url(${member.avatar}) center/cover` : '#4F46E5',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: 600,
                          fontSize: '0.875rem',
                        }}>
                          {!member.avatar && getInitials(member.name, member.email)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.9375rem' }}>{member.name}</div>
                          <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>{member.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <RoleBadge role={member.role} />
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <StatusBadge status={member.status} />
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '0.875rem', color: '#64748b' }}>
                      {member.status === 'pending'
                        ? `Invited ${formatDate(member.invitedAt)}`
                        : formatDate(member.joinedAt)
                      }
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        {/* Role Toggle */}
                        <select
                          value={member.role}
                          onChange={(e) => handleRoleChange(member.id, e.target.value as 'admin' | 'viewer')}
                          style={{
                            padding: '6px 10px',
                            border: '1px solid #e2e8f0',
                            borderRadius: 6,
                            fontSize: '0.8125rem',
                            background: 'white',
                            cursor: 'pointer',
                          }}
                        >
                          <option value="admin">Admin</option>
                          <option value="viewer">Viewer</option>
                        </select>

                        {/* Remove Button */}
                        <button
                          onClick={() => handleRemove(member.id)}
                          style={{
                            padding: '6px 12px',
                            background: 'white',
                            border: '1px solid #e2e8f0',
                            borderRadius: 6,
                            fontSize: '0.8125rem',
                            color: '#ef4444',
                            cursor: 'pointer',
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {members.length === 0 && (
            <div style={{ padding: 48, textAlign: 'center' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" style={{ margin: '0 auto 16px' }}>
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              <p style={{ color: '#64748b', marginBottom: 16 }}>No team members yet</p>
              <button
                onClick={() => setShowInviteModal(true)}
                style={{
                  padding: '10px 20px',
                  background: '#4F46E5',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Invite Your First Team Member
              </button>
            </div>
          )}
        </div>

        {/* Role Permissions Info */}
        <div style={{ marginTop: 32, background: '#f8fafc', borderRadius: 12, padding: 24, border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a', marginBottom: 16 }}>Role Permissions</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <RoleBadge role="admin" />
              </div>
              <ul style={{ margin: 0, paddingLeft: 20, color: '#475569', fontSize: '0.875rem', lineHeight: 1.8 }}>
                <li>View and screen all candidates</li>
                <li>Create and manage job roles</li>
                <li>Invite and remove team members</li>
                <li>Edit company settings</li>
                <li>Access all reports and analytics</li>
              </ul>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <RoleBadge role="viewer" />
              </div>
              <ul style={{ margin: 0, paddingLeft: 20, color: '#475569', fontSize: '0.875rem', lineHeight: 1.8 }}>
                <li>View candidates and their profiles</li>
                <li>Add notes and tags to candidates</li>
                <li>View job roles (read-only)</li>
                <li>Cannot modify company settings</li>
                <li>Cannot invite or remove members</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)',
        }}>
          <div style={{
            background: 'white',
            borderRadius: 16,
            width: '100%',
            maxWidth: 480,
            padding: 32,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            animation: 'fadeIn 0.2s ease-out',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>Invite Team Member</h2>
              <button
                onClick={() => setShowInviteModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, color: '#64748b' }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: 8 }}>
                Email Address
              </label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@company.co.za"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  border: '1px solid #d1d5db',
                  borderRadius: 8,
                  fontSize: '0.9375rem',
                  color: '#0f172a',
                }}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: 8 }}>
                Role
              </label>
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={() => setInviteRole('admin')}
                  style={{
                    flex: 1,
                    padding: '14px 16px',
                    background: inviteRole === 'admin' ? '#eef2ff' : 'white',
                    border: `2px solid ${inviteRole === 'admin' ? '#4F46E5' : '#e2e8f0'}`,
                    borderRadius: 10,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={inviteRole === 'admin' ? '#4F46E5' : '#64748b'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                    </svg>
                    <span style={{ fontWeight: 600, color: inviteRole === 'admin' ? '#4F46E5' : '#374151' }}>Admin</span>
                  </div>
                  <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: 0 }}>Full access to all features</p>
                </button>
                <button
                  onClick={() => setInviteRole('viewer')}
                  style={{
                    flex: 1,
                    padding: '14px 16px',
                    background: inviteRole === 'viewer' ? '#f1f5f9' : 'white',
                    border: `2px solid ${inviteRole === 'viewer' ? '#64748b' : '#e2e8f0'}`,
                    borderRadius: 10,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={inviteRole === 'viewer' ? '#64748b' : '#94a3b8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                    <span style={{ fontWeight: 600, color: inviteRole === 'viewer' ? '#374151' : '#64748b' }}>Viewer</span>
                  </div>
                  <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: 0 }}>View-only access</p>
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowInviteModal(false)}
                style={{
                  padding: '10px 20px',
                  background: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: '#64748b',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleInvite}
                disabled={sending}
                style={{
                  padding: '10px 20px',
                  background: sending ? '#94a3b8' : '#4F46E5',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: sending ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                {sending ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="50" strokeLinecap="round" fill="none"/>
                    </svg>
                    Sending...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13"/>
                      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                    </svg>
                    Send Invitation
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
