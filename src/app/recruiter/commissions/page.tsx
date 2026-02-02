'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

// ============================================
// HIREINBOX B2Recruiter - COMMISSIONS PAGE
// /recruiter/commissions
// Track placements and commission earnings
// ============================================

interface Commission {
  id: string;
  candidate_name: string;
  role_title: string;
  client_name: string;
  placement_date: string;
  start_date: string | null;
  salary: number;
  fee_percentage: number;
  fee_amount: number;
  status: 'pending' | 'invoiced' | 'paid' | 'cancelled' | 'refunded';
  invoice_number: string | null;
  invoice_date: string | null;
  payment_date: string | null;
  guarantee_end_date: string | null;
  notes: string | null;
  created_at: string;
}

interface Totals {
  total_placements: number;
  total_pending: number;
  total_invoiced: number;
  total_paid: number;
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
  money: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <line x1="12" y1="1" x2="12" y2="23"/>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  ),
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: '#FEF3C7', text: '#D97706' },
  invoiced: { bg: '#DBEAFE', text: '#2563EB' },
  paid: { bg: '#DCFCE7', text: '#16A34A' },
  cancelled: { bg: '#F3F4F6', text: '#6B7280' },
  refunded: { bg: '#FEE2E2', text: '#DC2626' },
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  invoiced: 'Invoiced',
  paid: 'Paid',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function RecruiterCommissions() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingCommission, setEditingCommission] = useState<Commission | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString());
  const [formData, setFormData] = useState({
    candidate_name: '',
    role_title: '',
    client_name: '',
    placement_date: new Date().toISOString().split('T')[0],
    start_date: '',
    salary: '',
    fee_percentage: '15',
    status: 'pending',
    invoice_number: '',
    invoice_date: '',
    payment_date: '',
    guarantee_end_date: '',
    notes: '',
  });

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchCommissions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push('/auth/login?redirect=/recruiter/commissions');
        return;
      }

      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (yearFilter) params.append('year', yearFilter);

      const response = await fetch(`/api/recruiter/commissions?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch commissions');
      }

      const data = await response.json();
      setCommissions(data.commissions);
      setTotals(data.totals);
    } catch (err) {
      console.error('Error fetching commissions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load commissions');
    } finally {
      setLoading(false);
    }
  }, [supabase, router, statusFilter, yearFilter]);

  useEffect(() => {
    fetchCommissions();
  }, [fetchCommissions]);

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

      const method = editingCommission ? 'PUT' : 'POST';
      const body = {
        ...(editingCommission ? { id: editingCommission.id } : {}),
        candidate_name: formData.candidate_name,
        role_title: formData.role_title,
        client_name: formData.client_name,
        placement_date: formData.placement_date,
        start_date: formData.start_date || null,
        salary: parseInt(formData.salary) || 0,
        fee_percentage: parseFloat(formData.fee_percentage) || 15,
        status: formData.status,
        invoice_number: formData.invoice_number || null,
        invoice_date: formData.invoice_date || null,
        payment_date: formData.payment_date || null,
        guarantee_end_date: formData.guarantee_end_date || null,
        notes: formData.notes || null,
      };

      const response = await fetch('/api/recruiter/commissions', {
        method,
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save commission');
      }

      setShowModal(false);
      setEditingCommission(null);
      resetForm();
      fetchCommissions();
    } catch (err) {
      console.error('Error saving commission:', err);
      setError(err instanceof Error ? err.message : 'Failed to save commission');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (commissionId: string) => {
    if (!confirm('Are you sure you want to delete this commission record? This action cannot be undone.')) {
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(`/api/recruiter/commissions?id=${commissionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete commission');
      }

      fetchCommissions();
    } catch (err) {
      console.error('Error deleting commission:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete commission');
    }
  };

  const openEditModal = (c: Commission) => {
    setEditingCommission(c);
    setFormData({
      candidate_name: c.candidate_name,
      role_title: c.role_title,
      client_name: c.client_name,
      placement_date: c.placement_date,
      start_date: c.start_date || '',
      salary: c.salary.toString(),
      fee_percentage: c.fee_percentage.toString(),
      status: c.status,
      invoice_number: c.invoice_number || '',
      invoice_date: c.invoice_date || '',
      payment_date: c.payment_date || '',
      guarantee_end_date: c.guarantee_end_date || '',
      notes: c.notes || '',
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      candidate_name: '',
      role_title: '',
      client_name: '',
      placement_date: new Date().toISOString().split('T')[0],
      start_date: '',
      salary: '',
      fee_percentage: '15',
      status: 'pending',
      invoice_number: '',
      invoice_date: '',
      payment_date: '',
      guarantee_end_date: '',
      notes: '',
    });
  };

  // Generate year options
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);

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
          <p style={{ color: '#64748b' }}>Loading commissions...</p>
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
            { label: 'Talent Pool', href: '/recruiter/talent', active: false },
            { label: 'Commissions', href: '/recruiter/commissions', active: true },
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
              Commissions
            </h1>
            <p style={{ fontSize: '16px', color: '#64748b' }}>
              Track your placements and commission earnings
            </p>
          </div>
          <button
            onClick={() => {
              setEditingCommission(null);
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
            Record Placement
          </button>
        </div>

        {/* Summary Cards */}
        {totals && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '24px',
          }}>
            <div style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '20px',
            }}>
              <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Total Placements</div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a' }}>{totals.total_placements}</div>
            </div>
            <div style={{
              backgroundColor: '#FEF3C7',
              border: '1px solid #FCD34D',
              borderRadius: '12px',
              padding: '20px',
            }}>
              <div style={{ fontSize: '13px', color: '#92400E', marginBottom: '4px' }}>Pending</div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: '#D97706' }}>{formatCurrency(totals.total_pending)}</div>
            </div>
            <div style={{
              backgroundColor: '#DBEAFE',
              border: '1px solid #93C5FD',
              borderRadius: '12px',
              padding: '20px',
            }}>
              <div style={{ fontSize: '13px', color: '#1E40AF', marginBottom: '4px' }}>Invoiced</div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: '#2563EB' }}>{formatCurrency(totals.total_invoiced)}</div>
            </div>
            <div style={{
              backgroundColor: '#DCFCE7',
              border: '1px solid #86EFAC',
              borderRadius: '12px',
              padding: '20px',
            }}>
              <div style={{ fontSize: '13px', color: '#166534', marginBottom: '4px' }}>Paid</div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: '#16A34A' }}>{formatCurrency(totals.total_paid)}</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div style={{
          display: 'flex',
          gap: '16px',
          marginBottom: '24px',
          flexWrap: 'wrap',
        }}>
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
            <option value="pending">Pending</option>
            <option value="invoiced">Invoiced</option>
            <option value="paid">Paid</option>
            <option value="cancelled">Cancelled</option>
            <option value="refunded">Refunded</option>
          </select>
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            style={{
              padding: '12px 16px',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              fontSize: '14px',
              backgroundColor: '#ffffff',
              minWidth: '120px',
            }}
          >
            {yearOptions.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        {/* Commissions List */}
        {commissions.length === 0 ? (
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '64px',
            textAlign: 'center',
          }}>
            <div style={{ color: '#94a3b8', marginBottom: '24px' }}>
              {Icons.money}
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>
              {statusFilter !== 'all' ? 'No matching commissions' : 'No placements recorded yet'}
            </h3>
            <p style={{ fontSize: '15px', color: '#64748b', maxWidth: '400px', margin: '0 auto 24px' }}>
              {statusFilter !== 'all'
                ? 'Try adjusting your filters.'
                : 'Record your first successful placement to start tracking commissions.'}
            </p>
            {statusFilter === 'all' && (
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
                Record Your First Placement
              </button>
            )}
          </div>
        ) : (
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            overflow: 'hidden',
          }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc' }}>
                    <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                      Candidate
                    </th>
                    <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                      Role / Client
                    </th>
                    <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                      Placement Date
                    </th>
                    <th style={{ padding: '14px 20px', textAlign: 'right', fontSize: '13px', fontWeight: 600, color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                      Salary
                    </th>
                    <th style={{ padding: '14px 20px', textAlign: 'right', fontSize: '13px', fontWeight: 600, color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                      Fee ({`%`})
                    </th>
                    <th style={{ padding: '14px 20px', textAlign: 'right', fontSize: '13px', fontWeight: 600, color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                      Commission
                    </th>
                    <th style={{ padding: '14px 20px', textAlign: 'center', fontSize: '13px', fontWeight: 600, color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                      Status
                    </th>
                    <th style={{ padding: '14px 20px', textAlign: 'center', fontSize: '13px', fontWeight: 600, color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {commissions.map((c) => (
                    <tr key={c.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '16px 20px', fontSize: '14px', fontWeight: 500, color: '#0f172a' }}>
                        {c.candidate_name}
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ fontSize: '14px', color: '#0f172a' }}>{c.role_title}</div>
                        <div style={{ fontSize: '13px', color: '#64748b' }}>{c.client_name}</div>
                      </td>
                      <td style={{ padding: '16px 20px', fontSize: '14px', color: '#475569' }}>
                        {formatDate(c.placement_date)}
                      </td>
                      <td style={{ padding: '16px 20px', fontSize: '14px', color: '#475569', textAlign: 'right' }}>
                        {formatCurrency(c.salary)}
                      </td>
                      <td style={{ padding: '16px 20px', fontSize: '14px', color: '#475569', textAlign: 'right' }}>
                        {c.fee_percentage}%
                      </td>
                      <td style={{ padding: '16px 20px', fontSize: '14px', fontWeight: 600, color: '#0f172a', textAlign: 'right' }}>
                        {formatCurrency(c.fee_amount)}
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                        <span style={{
                          padding: '4px 12px',
                          backgroundColor: STATUS_COLORS[c.status]?.bg || '#f1f5f9',
                          color: STATUS_COLORS[c.status]?.text || '#64748b',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: 600,
                        }}>
                          {STATUS_LABELS[c.status]}
                        </span>
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button
                            onClick={() => openEditModal(c)}
                            style={{
                              padding: '6px 10px',
                              backgroundColor: '#f1f5f9',
                              border: 'none',
                              borderRadius: '6px',
                              color: '#475569',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                            }}
                          >
                            {Icons.edit}
                          </button>
                          <button
                            onClick={() => handleDelete(c.id)}
                            style={{
                              padding: '6px 10px',
                              backgroundColor: '#fef2f2',
                              border: 'none',
                              borderRadius: '6px',
                              color: '#dc2626',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                            }}
                          >
                            {Icons.trash}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
                {editingCommission ? 'Edit Placement' : 'Record New Placement'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingCommission(null);
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
                      Candidate Name *
                    </label>
                    <input
                      type="text"
                      value={formData.candidate_name}
                      onChange={(e) => setFormData({ ...formData, candidate_name: e.target.value })}
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
                      Client Name *
                    </label>
                    <input
                      type="text"
                      value={formData.client_name}
                      onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                      required
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '15px',
                        boxSizing: 'border-box',
                      }}
                      placeholder="e.g., Acme Corp"
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                    Role Title *
                  </label>
                  <input
                    type="text"
                    value={formData.role_title}
                    onChange={(e) => setFormData({ ...formData, role_title: e.target.value })}
                    required
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                      Placement Date *
                    </label>
                    <input
                      type="date"
                      value={formData.placement_date}
                      onChange={(e) => setFormData({ ...formData, placement_date: e.target.value })}
                      required
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '15px',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '15px',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                      Annual Salary (ZAR) *
                    </label>
                    <input
                      type="number"
                      value={formData.salary}
                      onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                      required
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
                      Fee Percentage *
                    </label>
                    <input
                      type="number"
                      value={formData.fee_percentage}
                      onChange={(e) => setFormData({ ...formData, fee_percentage: e.target.value })}
                      required
                      min="0"
                      max="100"
                      step="0.5"
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '15px',
                        boxSizing: 'border-box',
                      }}
                      placeholder="e.g., 15"
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
                      <option value="pending">Pending</option>
                      <option value="invoiced">Invoiced</option>
                      <option value="paid">Paid</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="refunded">Refunded</option>
                    </select>
                  </div>
                </div>

                {/* Commission calculation preview */}
                {formData.salary && formData.fee_percentage && (
                  <div style={{
                    backgroundColor: '#f8fafc',
                    borderRadius: '8px',
                    padding: '16px',
                    textAlign: 'center',
                  }}>
                    <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Estimated Commission</div>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: '#4F46E5' }}>
                      {formatCurrency(Math.round((parseInt(formData.salary) || 0) * (parseFloat(formData.fee_percentage) || 0) / 100))}
                    </div>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                      Invoice Number
                    </label>
                    <input
                      type="text"
                      value={formData.invoice_number}
                      onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '15px',
                        boxSizing: 'border-box',
                      }}
                      placeholder="e.g., INV-2026-001"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                      Invoice Date
                    </label>
                    <input
                      type="date"
                      value={formData.invoice_date}
                      onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '15px',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                      Payment Date
                    </label>
                    <input
                      type="date"
                      value={formData.payment_date}
                      onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '15px',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                      Guarantee End Date
                    </label>
                    <input
                      type="date"
                      value={formData.guarantee_end_date}
                      onChange={(e) => setFormData({ ...formData, guarantee_end_date: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '15px',
                        boxSizing: 'border-box',
                      }}
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
                    placeholder="Any additional notes..."
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingCommission(null);
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
                  {saving ? 'Saving...' : editingCommission ? 'Update Placement' : 'Record Placement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
