'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

// ============================================
// HIREINBOX B2Recruiter - TALENT PAGE
// /recruiter/talent
// Manage personal talent pool
// ============================================

interface Talent {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  current_title: string | null;
  current_company: string | null;
  skills: string[];
  experience_years: number | null;
  location: string | null;
  salary_expectation: number | null;
  cv_url: string | null;
  linkedin_url: string | null;
  notes: string | null;
  source: string | null;
  status: 'available' | 'interviewing' | 'placed' | 'unavailable' | 'do_not_contact';
  last_contacted_at: string | null;
  created_at: string;
}

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
        <span style={{ color: '#4F46E5' }}>Hyred</span>
        <span style={{ color: '#64748b', fontWeight: 500, fontSize: '14px', marginLeft: '8px' }}>Recruiter</span>
      </div>
    </div>
  </div>
);

const Icons = {
  plus: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  edit: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  ),
  trash: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    </svg>
  ),
  close: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  search: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8"/>
      <path d="M21 21l-4.35-4.35"/>
    </svg>
  ),
  user: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  available: { bg: '#DCFCE7', text: '#16A34A' },
  interviewing: { bg: '#DBEAFE', text: '#2563EB' },
  placed: { bg: '#E9D5FF', text: '#7C3AED' },
  unavailable: { bg: '#FEF3C7', text: '#D97706' },
  do_not_contact: { bg: '#FEE2E2', text: '#DC2626' },
};

const STATUS_LABELS: Record<string, string> = {
  available: 'Available',
  interviewing: 'Interviewing',
  placed: 'Placed',
  unavailable: 'Unavailable',
  do_not_contact: 'Do Not Contact',
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function RecruiterTalent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [talent, setTalent] = useState<Talent[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingTalent, setEditingTalent] = useState<Talent | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    current_title: '',
    current_company: '',
    skills: '',
    experience_years: '',
    location: '',
    salary_expectation: '',
    linkedin_url: '',
    notes: '',
    source: '',
    status: 'available',
  });

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchTalent = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push('/auth/login?redirect=/recruiter/talent');
        return;
      }

      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`/api/recruiter/talent?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch talent');
      }

      const data = await response.json();
      setTalent(data.talent);
    } catch (err) {
      console.error('Error fetching talent:', err);
      setError(err instanceof Error ? err.message : 'Failed to load talent');
    } finally {
      setLoading(false);
    }
  }, [supabase, router, statusFilter, searchTerm]);

  useEffect(() => {
    fetchTalent();
  }, [fetchTalent]);

  useEffect(() => {
    if (searchParams.get('action') === 'add') {
      setShowModal(true);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const method = editingTalent ? 'PUT' : 'POST';
      const body = {
        ...(editingTalent ? { id: editingTalent.id } : {}),
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        current_title: formData.current_title || null,
        current_company: formData.current_company || null,
        skills: formData.skills ? formData.skills.split(',').map(s => s.trim()).filter(Boolean) : [],
        experience_years: formData.experience_years ? parseInt(formData.experience_years) : null,
        location: formData.location || null,
        salary_expectation: formData.salary_expectation ? parseInt(formData.salary_expectation) : null,
        linkedin_url: formData.linkedin_url || null,
        notes: formData.notes || null,
        source: formData.source || null,
        status: formData.status,
      };

      const response = await fetch('/api/recruiter/talent', {
        method,
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save talent');
      }

      setShowModal(false);
      setEditingTalent(null);
      resetForm();
      fetchTalent();
    } catch (err) {
      console.error('Error saving talent:', err);
      setError(err instanceof Error ? err.message : 'Failed to save talent');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (talentId: string) => {
    if (!confirm('Are you sure you want to delete this candidate? This action cannot be undone.')) {
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(`/api/recruiter/talent?id=${talentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete talent');
      }

      fetchTalent();
    } catch (err) {
      console.error('Error deleting talent:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete talent');
    }
  };

  const openEditModal = (t: Talent) => {
    setEditingTalent(t);
    setFormData({
      name: t.name,
      email: t.email,
      phone: t.phone || '',
      current_title: t.current_title || '',
      current_company: t.current_company || '',
      skills: t.skills ? t.skills.join(', ') : '',
      experience_years: t.experience_years?.toString() || '',
      location: t.location || '',
      salary_expectation: t.salary_expectation?.toString() || '',
      linkedin_url: t.linkedin_url || '',
      notes: t.notes || '',
      source: t.source || '',
      status: t.status,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      current_title: '',
      current_company: '',
      skills: '',
      experience_years: '',
      location: '',
      salary_expectation: '',
      linkedin_url: '',
      notes: '',
      source: '',
      status: 'available',
    });
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
            borderTopColor: '#4F46E5',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px',
          }} />
          <p style={{ color: '#64748b' }}>Loading talent pool...</p>
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
      {/* Header */}
      <header style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        padding: '16px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <Logo />
      </header>

      {/* Navigation */}
      <nav style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        padding: '0 32px',
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { label: 'Dashboard', href: '/recruiter', active: false },
            { label: 'Clients', href: '/recruiter/clients', active: false },
            { label: 'Talent Pool', href: '/recruiter/talent', active: true },
            { label: 'Commissions', href: '/recruiter/commissions', active: false },
          ].map((item) => (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              style={{
                padding: '16px 20px',
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: item.active ? '2px solid #4F46E5' : '2px solid transparent',
                fontSize: '14px',
                fontWeight: item.active ? 600 : 500,
                color: item.active ? '#4F46E5' : '#64748b',
                cursor: 'pointer',
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto' }}>
        {error ? (
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '12px',
            padding: '16px 20px',
            color: '#dc2626',
            marginBottom: '24px',
          }}>
            {error}
          </div>
        ) : null}

        {/* Page Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
              Talent Pool
            </h1>
            <p style={{ fontSize: '16px', color: '#64748b' }}>
              Manage candidates you&apos;ve sourced for future opportunities
            </p>
          </div>
          <button
            onClick={() => {
              setEditingTalent(null);
              resetForm();
              setShowModal(true);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 20px',
              backgroundColor: '#4F46E5',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {Icons.plus}
            Add Candidate
          </button>
        </div>

        {/* Filters */}
        <div style={{
          display: 'flex',
          gap: '16px',
          marginBottom: '24px',
          flexWrap: 'wrap',
        }}>
          <div style={{ position: 'relative', flex: '1', maxWidth: '400px' }}>
            <span style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#94a3b8',
            }}>
              {Icons.search}
            </span>
            <input
              type="text"
              placeholder="Search by name, email, title, or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px 12px 44px',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '12px 16px',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              fontSize: '14px',
              backgroundColor: '#ffffff',
              minWidth: '160px',
            }}
          >
            <option value="all">All Status</option>
            <option value="available">Available</option>
            <option value="interviewing">Interviewing</option>
            <option value="placed">Placed</option>
            <option value="unavailable">Unavailable</option>
            <option value="do_not_contact">Do Not Contact</option>
          </select>
        </div>

        {/* Talent List */}
        {talent.length === 0 ? (
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '64px',
            textAlign: 'center',
          }}>
            <div style={{ color: '#94a3b8', marginBottom: '24px' }}>
              {Icons.user}
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>
              {searchTerm || statusFilter !== 'all' ? 'No matching candidates' : 'No candidates yet'}
            </h3>
            <p style={{ fontSize: '15px', color: '#64748b', maxWidth: '400px', margin: '0 auto 24px' }}>
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your search or filters.'
                : 'Add candidates to your talent pool to track them for future opportunities.'}
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <button
                onClick={() => setShowModal(true)}
                style={{
                  padding: '14px 28px',
                  backgroundColor: '#4F46E5',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Add Your First Candidate
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            {talent.map((t) => (
              <div
                key={t.id}
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '24px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a' }}>
                        {t.name}
                      </h3>
                      <span style={{
                        padding: '4px 12px',
                        backgroundColor: STATUS_COLORS[t.status]?.bg || '#f1f5f9',
                        color: STATUS_COLORS[t.status]?.text || '#64748b',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 600,
                      }}>
                        {STATUS_LABELS[t.status]}
                      </span>
                    </div>
                    {(t.current_title || t.current_company) && (
                      <div style={{ fontSize: '15px', color: '#475569', marginBottom: '8px' }}>
                        {t.current_title}{t.current_title && t.current_company ? ' at ' : ''}{t.current_company}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', fontSize: '14px', color: '#64748b' }}>
                      <span>{t.email}</span>
                      {t.phone && <span>{t.phone}</span>}
                      {t.location && <span>{t.location}</span>}
                      {t.experience_years && <span>{t.experience_years} years exp</span>}
                      {t.salary_expectation && <span>Expects {formatCurrency(t.salary_expectation)}</span>}
                    </div>
                    {t.skills && t.skills.length > 0 && (
                      <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {t.skills.slice(0, 6).map((skill, i) => (
                          <span
                            key={i}
                            style={{
                              padding: '4px 10px',
                              backgroundColor: '#EEF2FF',
                              borderRadius: '6px',
                              fontSize: '12px',
                              color: '#4F46E5',
                              fontWeight: 500,
                            }}
                          >
                            {skill}
                          </span>
                        ))}
                        {t.skills.length > 6 && (
                          <span style={{ fontSize: '12px', color: '#64748b', padding: '4px 0' }}>
                            +{t.skills.length - 6} more
                          </span>
                        )}
                      </div>
                    )}
                    {t.source && (
                      <div style={{ marginTop: '8px', fontSize: '13px', color: '#94a3b8' }}>
                        Source: {t.source}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => openEditModal(t)}
                      style={{
                        padding: '8px 12px',
                        backgroundColor: '#f1f5f9',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#475569',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '13px',
                      }}
                    >
                      {Icons.edit}
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(t.id)}
                      style={{
                        padding: '8px 12px',
                        backgroundColor: '#fef2f2',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#dc2626',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '13px',
                      }}
                    >
                      {Icons.trash}
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Add/Edit Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflow: 'auto',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '20px 24px',
              borderBottom: '1px solid #e2e8f0',
            }}>
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a' }}>
                {editingTalent ? 'Edit Candidate' : 'Add New Candidate'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingTalent(null);
                  resetForm();
                }}
                style={{
                  padding: '8px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  color: '#64748b',
                }}
              >
                {Icons.close}
              </button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gap: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '15px',
                        boxSizing: 'border-box',
                      }}
                      placeholder="e.g., Jane Doe"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                      Email *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '15px',
                        boxSizing: 'border-box',
                      }}
                      placeholder="e.g., jane@email.com"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '15px',
                        boxSizing: 'border-box',
                      }}
                      placeholder="e.g., 082 123 4567"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                      Location
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '15px',
                        boxSizing: 'border-box',
                      }}
                      placeholder="e.g., Cape Town"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                      Current Title
                    </label>
                    <input
                      type="text"
                      value={formData.current_title}
                      onChange={(e) => setFormData({ ...formData, current_title: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '15px',
                        boxSizing: 'border-box',
                      }}
                      placeholder="e.g., Senior Software Engineer"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                      Current Company
                    </label>
                    <input
                      type="text"
                      value={formData.current_company}
                      onChange={(e) => setFormData({ ...formData, current_company: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '15px',
                        boxSizing: 'border-box',
                      }}
                      placeholder="e.g., Tech Corp"
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                    Skills (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.skills}
                    onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '15px',
                      boxSizing: 'border-box',
                    }}
                    placeholder="e.g., Python, React, AWS, Machine Learning"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                      Experience (years)
                    </label>
                    <input
                      type="number"
                      value={formData.experience_years}
                      onChange={(e) => setFormData({ ...formData, experience_years: e.target.value })}
                      min="0"
                      max="50"
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '15px',
                        boxSizing: 'border-box',
                      }}
                      placeholder="e.g., 5"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                      Salary Expectation (ZAR)
                    </label>
                    <input
                      type="number"
                      value={formData.salary_expectation}
                      onChange={(e) => setFormData({ ...formData, salary_expectation: e.target.value })}
                      min="0"
                      step="10000"
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '15px',
                        boxSizing: 'border-box',
                      }}
                      placeholder="e.g., 850000"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '15px',
                        boxSizing: 'border-box',
                        backgroundColor: '#ffffff',
                      }}
                    >
                      <option value="available">Available</option>
                      <option value="interviewing">Interviewing</option>
                      <option value="placed">Placed</option>
                      <option value="unavailable">Unavailable</option>
                      <option value="do_not_contact">Do Not Contact</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                      LinkedIn URL
                    </label>
                    <input
                      type="url"
                      value={formData.linkedin_url}
                      onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '15px',
                        boxSizing: 'border-box',
                      }}
                      placeholder="e.g., linkedin.com/in/janedoe"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                      Source
                    </label>
                    <input
                      type="text"
                      value={formData.source}
                      onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '15px',
                        boxSizing: 'border-box',
                      }}
                      placeholder="e.g., LinkedIn, Referral, Job Board"
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '15px',
                      boxSizing: 'border-box',
                      resize: 'vertical',
                    }}
                    placeholder="Any additional notes about this candidate..."
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingTalent(null);
                    resetForm();
                  }}
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: '#f1f5f9',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '15px',
                    fontWeight: 500,
                    color: '#475569',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: '#4F46E5',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '15px',
                    fontWeight: 600,
                    color: '#ffffff',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    opacity: saving ? 0.7 : 1,
                  }}
                >
                  {saving ? 'Saving...' : editingTalent ? 'Update Candidate' : 'Add Candidate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
