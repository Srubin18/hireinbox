'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// ============================================
// HIREINBOX - RECRUITER DASHBOARD
// /hire/recruiter/dashboard
//
// Designed specifically for recruitment agencies:
// - Multi-client management
// - Pipeline across all clients
// - Commission/placement tracking
// - Talent mapping access
// ============================================

// Mock data for recruiter dashboard
const MOCK_CLIENTS = [
  { id: '1', name: 'Standard Bank', industry: 'Finance', activeRoles: 3, placementsYTD: 2, status: 'active', logo: 'SB' },
  { id: '2', name: 'Discovery', industry: 'Insurance/Tech', activeRoles: 5, placementsYTD: 4, status: 'active', logo: 'D' },
  { id: '3', name: 'Woolworths', industry: 'Retail', activeRoles: 2, placementsYTD: 1, status: 'active', logo: 'W' },
  { id: '4', name: 'Sasol', industry: 'Energy', activeRoles: 0, placementsYTD: 3, status: 'dormant', logo: 'S' },
];

const MOCK_ACTIVE_SEARCHES = [
  { id: '1', role: 'CFO', client: 'Standard Bank', location: 'Johannesburg', status: 'mapping', candidatesFound: 12, daysActive: 5 },
  { id: '2', role: 'Head of Digital', client: 'Discovery', location: 'Sandton', status: 'shortlisting', candidatesFound: 8, daysActive: 12 },
  { id: '3', role: 'Supply Chain Director', client: 'Woolworths', location: 'Cape Town', status: 'interviewing', candidatesFound: 6, daysActive: 21 },
];

const MOCK_PIPELINE = [
  { id: '1', name: 'Thabo Molefe', role: 'CFO', client: 'Standard Bank', stage: 'Presented', fee: 450000, probability: 30 },
  { id: '2', name: 'Zanele Nkosi', role: 'Head of Digital', client: 'Discovery', stage: 'Interview 2', fee: 320000, probability: 60 },
  { id: '3', name: 'David van der Berg', role: 'Supply Chain Director', client: 'Woolworths', stage: 'Final', fee: 280000, probability: 80 },
  { id: '4', name: 'Priya Naidoo', role: 'CFO', client: 'Standard Bank', stage: 'Interview 1', fee: 450000, probability: 40 },
  { id: '5', name: 'Michael Chen', role: 'CTO', client: 'Discovery', stage: 'Offer', fee: 380000, probability: 90 },
];

const MOCK_PLACEMENTS = [
  { id: '1', name: 'Sarah Johnson', role: 'Finance Director', client: 'Sasol', fee: 320000, date: '2026-01-10', status: 'invoiced' },
  { id: '2', name: 'James Mthembu', role: 'IT Manager', client: 'Discovery', fee: 180000, date: '2025-12-15', status: 'paid' },
  { id: '3', name: 'Linda Botha', role: 'HR Director', client: 'Standard Bank', fee: 240000, date: '2025-11-20', status: 'paid' },
];

export default function RecruiterDashboard() {
  const router = useRouter();
  const [selectedClient, setSelectedClient] = useState<string | null>(null);

  // Calculate stats
  const totalClients = MOCK_CLIENTS.length;
  const activeClients = MOCK_CLIENTS.filter(c => c.status === 'active').length;
  const totalActiveRoles = MOCK_CLIENTS.reduce((sum, c) => sum + c.activeRoles, 0);
  const placementsYTD = MOCK_PLACEMENTS.length;
  const revenueYTD = MOCK_PLACEMENTS.reduce((sum, p) => sum + p.fee, 0);
  const pipelineValue = MOCK_PIPELINE.reduce((sum, p) => sum + (p.fee * p.probability / 100), 0);

  const formatCurrency = (amount: number) => {
    return `R${amount.toLocaleString()}`;
  };

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      'Presented': '#f59e0b',
      'Interview 1': '#3b82f6',
      'Interview 2': '#8b5cf6',
      'Final': '#10b981',
      'Offer': '#059669',
    };
    return colors[stage] || '#64748b';
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string }> = {
      'mapping': { bg: '#dbeafe', text: '#1d4ed8' },
      'shortlisting': { bg: '#fef3c7', text: '#b45309' },
      'interviewing': { bg: '#d1fae5', text: '#047857' },
      'active': { bg: '#d1fae5', text: '#047857' },
      'dormant': { bg: '#f1f5f9', text: '#64748b' },
      'invoiced': { bg: '#fef3c7', text: '#b45309' },
      'paid': { bg: '#d1fae5', text: '#047857' },
    };
    return styles[status] || { bg: '#f1f5f9', text: '#64748b' };
  };

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <svg width="36" height="36" viewBox="0 0 48 48" fill="none">
            <rect width="48" height="48" rx="12" fill="#7c3aed"/>
            <path d="M12 18L24 26L36 18V32C36 33.1 35.1 34 34 34H14C12.9 34 12 33.1 12 32V18Z" fill="white" fillOpacity="0.9"/>
            <path d="M34 14H14C12.9 14 12 14.9 12 16V18L24 26L36 18V16C36 14.9 35.1 14 34 14Z" fill="white"/>
            <circle cx="36" cy="12" r="9" fill="#10B981"/>
            <path d="M32.5 12L35 14.5L39.5 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 700 }}>
              <span style={{ color: '#0f172a' }}>Hire</span>
              <span style={{ color: '#7c3aed' }}>Inbox</span>
              <span style={{ color: '#64748b', fontWeight: 500, marginLeft: '8px' }}>Recruiter</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => router.push('/hire/recruiter/mapping')}
            style={{
              padding: '10px 20px',
              backgroundColor: '#7c3aed',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
            Talent Mapping
          </button>
          <button
            onClick={() => router.push('/hire')}
            style={{
              padding: '10px 16px',
              backgroundColor: 'transparent',
              color: '#64748b',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            Switch View
          </button>
        </div>
      </header>

      <main style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
        {/* Stats Overview */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '32px'
        }}>
          <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Active Clients</div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a' }}>{activeClients}</div>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>{totalClients} total</div>
          </div>
          <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Active Searches</div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a' }}>{totalActiveRoles}</div>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>across {activeClients} clients</div>
          </div>
          <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Placements YTD</div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#10b981' }}>{placementsYTD}</div>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>{formatCurrency(revenueYTD)} billed</div>
          </div>
          <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Pipeline Value</div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#7c3aed' }}>{formatCurrency(Math.round(pipelineValue))}</div>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>weighted by probability</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Left Column */}
          <div>
            {/* My Clients */}
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              marginBottom: '24px'
            }}>
              <div style={{
                padding: '16px 20px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', margin: 0 }}>My Clients</h2>
                <button style={{
                  padding: '6px 12px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '13px',
                  color: '#64748b',
                  cursor: 'pointer'
                }}>
                  + Add Client
                </button>
              </div>
              <div>
                {MOCK_CLIENTS.map((client) => (
                  <div
                    key={client.id}
                    style={{
                      padding: '16px 20px',
                      borderBottom: '1px solid #f1f5f9',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      cursor: 'pointer'
                    }}
                    onClick={() => setSelectedClient(client.id === selectedClient ? null : client.id)}
                  >
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      backgroundColor: client.status === 'active' ? '#ede9fe' : '#f1f5f9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      fontWeight: 700,
                      color: client.status === 'active' ? '#7c3aed' : '#94a3b8'
                    }}>
                      {client.logo}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>{client.name}</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>{client.industry}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>{client.activeRoles} roles</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>{client.placementsYTD} placed YTD</div>
                    </div>
                    <div style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 600,
                      backgroundColor: getStatusBadge(client.status).bg,
                      color: getStatusBadge(client.status).text,
                      textTransform: 'capitalize'
                    }}>
                      {client.status}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Searches */}
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{
                padding: '16px 20px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', margin: 0 }}>Active Searches</h2>
                <button
                  onClick={() => router.push('/hire/recruiter/mapping')}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#7c3aed',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  + New Search
                </button>
              </div>
              <div>
                {MOCK_ACTIVE_SEARCHES.map((search) => (
                  <div
                    key={search.id}
                    style={{
                      padding: '16px 20px',
                      borderBottom: '1px solid #f1f5f9',
                      cursor: 'pointer'
                    }}
                    onClick={() => router.push('/hire/recruiter/mapping')}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>{search.role}</div>
                        <div style={{ fontSize: '13px', color: '#64748b' }}>{search.client} - {search.location}</div>
                      </div>
                      <div style={{
                        padding: '4px 10px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 600,
                        backgroundColor: getStatusBadge(search.status).bg,
                        color: getStatusBadge(search.status).text,
                        textTransform: 'capitalize'
                      }}>
                        {search.status}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#94a3b8' }}>
                      <span>{search.candidatesFound} candidates found</span>
                      <span>{search.daysActive} days active</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div>
            {/* Pipeline */}
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              marginBottom: '24px'
            }}>
              <div style={{
                padding: '16px 20px',
                borderBottom: '1px solid #e2e8f0'
              }}>
                <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', margin: 0 }}>Pipeline</h2>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                  {MOCK_PIPELINE.length} candidates in progress
                </div>
              </div>
              <div>
                {MOCK_PIPELINE.map((candidate) => (
                  <div
                    key={candidate.id}
                    style={{
                      padding: '14px 20px',
                      borderBottom: '1px solid #f1f5f9',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}
                  >
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      backgroundColor: '#f1f5f9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#64748b'
                    }}>
                      {candidate.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>{candidate.name}</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>{candidate.role} at {candidate.client}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{
                        padding: '4px 10px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 600,
                        backgroundColor: `${getStageColor(candidate.stage)}15`,
                        color: getStageColor(candidate.stage),
                        marginBottom: '4px'
                      }}>
                        {candidate.stage}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        {formatCurrency(candidate.fee)} ({candidate.probability}%)
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Placements */}
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{
                padding: '16px 20px',
                borderBottom: '1px solid #e2e8f0'
              }}>
                <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', margin: 0 }}>Recent Placements</h2>
              </div>
              <div>
                {MOCK_PLACEMENTS.map((placement) => (
                  <div
                    key={placement.id}
                    style={{
                      padding: '14px 20px',
                      borderBottom: '1px solid #f1f5f9',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}
                  >
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      backgroundColor: '#d1fae5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                        <polyline points="22 4 12 14.01 9 11.01"/>
                      </svg>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>{placement.name}</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>{placement.role} at {placement.client}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#059669' }}>{formatCurrency(placement.fee)}</div>
                      <div style={{
                        fontSize: '11px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: getStatusBadge(placement.status).bg,
                        color: getStatusBadge(placement.status).text,
                        display: 'inline-block'
                      }}>
                        {placement.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ padding: '12px 20px', borderTop: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>YTD Revenue</span>
                  <span style={{ fontSize: '16px', fontWeight: 700, color: '#059669' }}>{formatCurrency(revenueYTD)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Talent Mapping CTA */}
        <div style={{
          marginTop: '32px',
          padding: '32px',
          backgroundColor: '#7c3aed',
          borderRadius: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', margin: '0 0 8px 0' }}>
              Premium Talent Mapping
            </h3>
            <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.8)', margin: 0, maxWidth: '500px' }}>
              Find hidden candidates your competitors miss. Our AI searches company pages, news, conferences,
              and more — not just LinkedIn profiles.
            </p>
          </div>
          <button
            onClick={() => router.push('/hire/recruiter/mapping')}
            style={{
              padding: '14px 28px',
              backgroundColor: '#ffffff',
              color: '#7c3aed',
              border: 'none',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            Start Mapping
          </button>
        </div>
      </main>

      {/* Support button */}
      <button
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
    </div>
  );
}
