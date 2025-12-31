'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// ============================================
// B2Recruiter Dashboard
// Professional recruiter management portal
// Multi-client, cross-company candidate search
// Commission tracking, talent passports
// ============================================

// Types
interface Client {
  id: string;
  name: string;
  logo?: string;
  activeRoles: number;
  candidatesSubmitted: number;
  placementsThisMonth: number;
  lastActivity: string;
}

interface RecentCandidate {
  id: string;
  name: string;
  role: string;
  client: string;
  score: number;
  status: 'submitted' | 'interviewing' | 'offered' | 'placed' | 'rejected';
  submittedAt: string;
}

interface Analytics {
  placementsThisMonth: number;
  placementsLastMonth: number;
  candidatesSubmitted: number;
  activeSearches: number;
  avgTimeToPlace: number;
  totalCommission: number;
  pendingCommission: number;
}

// Mock data for MVP
const MOCK_CLIENTS: Client[] = [
  { id: '1', name: 'Mafadi Property Group', activeRoles: 3, candidatesSubmitted: 12, placementsThisMonth: 1, lastActivity: '2 hours ago' },
  { id: '2', name: 'Standard Bank', activeRoles: 5, candidatesSubmitted: 28, placementsThisMonth: 2, lastActivity: '1 day ago' },
  { id: '3', name: 'Discovery Health', activeRoles: 2, candidatesSubmitted: 8, placementsThisMonth: 0, lastActivity: '3 days ago' },
  { id: '4', name: 'Woolworths Holdings', activeRoles: 4, candidatesSubmitted: 15, placementsThisMonth: 1, lastActivity: '5 hours ago' },
];

const MOCK_CANDIDATES: RecentCandidate[] = [
  { id: '1', name: 'Thabo Molefe', role: 'Senior Accountant', client: 'Standard Bank', score: 87, status: 'interviewing', submittedAt: '2024-12-24' },
  { id: '2', name: 'Sarah van der Berg', role: 'Property Manager', client: 'Mafadi Property Group', score: 92, status: 'offered', submittedAt: '2024-12-23' },
  { id: '3', name: 'Priya Naidoo', role: 'Data Analyst', client: 'Discovery Health', score: 78, status: 'submitted', submittedAt: '2024-12-25' },
  { id: '4', name: 'John Dlamini', role: 'Financial Controller', client: 'Woolworths Holdings', score: 85, status: 'placed', submittedAt: '2024-12-20' },
  { id: '5', name: 'Lisa Chen', role: 'HR Manager', client: 'Standard Bank', score: 81, status: 'rejected', submittedAt: '2024-12-22' },
];

const MOCK_ANALYTICS: Analytics = {
  placementsThisMonth: 4,
  placementsLastMonth: 3,
  candidatesSubmitted: 63,
  activeSearches: 14,
  avgTimeToPlace: 18,
  totalCommission: 245000,
  pendingCommission: 85000,
};

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
        RECRUITER PRO
      </span>
    </div>
  </div>
);

// Status Badge Component
const StatusBadge = ({ status }: { status: RecentCandidate['status'] }) => {
  const styles: Record<RecentCandidate['status'], { bg: string; text: string; label: string }> = {
    submitted: { bg: '#DBEAFE', text: '#1E40AF', label: 'Submitted' },
    interviewing: { bg: '#FEF3C7', text: '#92400E', label: 'Interviewing' },
    offered: { bg: '#D1FAE5', text: '#065F46', label: 'Offered' },
    placed: { bg: '#10B981', text: '#FFFFFF', label: 'Placed' },
    rejected: { bg: '#FEE2E2', text: '#991B1B', label: 'Rejected' },
  };
  const style = styles[status];
  return (
    <span style={{
      padding: '4px 10px',
      borderRadius: '12px',
      fontSize: '0.75rem',
      fontWeight: 600,
      backgroundColor: style.bg,
      color: style.text,
    }}>
      {style.label}
    </span>
  );
};

// Stat Card Component
const StatCard = ({ label, value, subtext, trend, icon }: {
  label: string;
  value: string | number;
  subtext?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
}) => (
  <div style={{
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid #E2E8F0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
      <span style={{ fontSize: '0.875rem', color: '#64748B', fontWeight: 500 }}>{label}</span>
      {icon}
    </div>
    <div style={{ fontSize: '2rem', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>{value}</div>
    {subtext && (
      <div style={{ fontSize: '0.75rem', color: trend === 'up' ? '#10B981' : trend === 'down' ? '#EF4444' : '#64748B' }}>
        {trend === 'up' && '+'}{subtext}
      </div>
    )}
  </div>
);

export default function RecruiterDashboard() {
  const [clients, setClients] = useState<Client[]>(MOCK_CLIENTS);
  const [candidates, setCandidates] = useState<RecentCandidate[]>(MOCK_CANDIDATES);
  const [analytics, setAnalytics] = useState<Analytics>(MOCK_ANALYTICS);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddClient, setShowAddClient] = useState(false);

  // Format currency in ZAR
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', minimumFractionDigits: 0 }).format(amount);
  };

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
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <Logo size={40} />
          <nav style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
            <Link href="/recruiter" style={{ color: '#4F46E5', fontWeight: 600, textDecoration: 'none', fontSize: '0.9375rem' }}>Dashboard</Link>
            <Link href="/recruiter/clients" style={{ color: '#64748B', textDecoration: 'none', fontSize: '0.9375rem' }}>Clients</Link>
            <Link href="/recruiter/talent" style={{ color: '#64748B', textDecoration: 'none', fontSize: '0.9375rem' }}>Talent Pool</Link>
            <Link href="/recruiter/commissions" style={{ color: '#64748B', textDecoration: 'none', fontSize: '0.9375rem' }}>Commissions</Link>
          </nav>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: '#4F46E5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 600,
              fontSize: '1rem',
            }}>
              JR
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px' }}>
        {/* Welcome Section */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A', marginBottom: '8px' }}>
            Welcome back, James
          </h1>
          <p style={{ color: '#64748B', fontSize: '1rem' }}>
            Here is your recruiting activity overview
          </p>
        </div>

        {/* Analytics Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginBottom: '32px',
        }}>
          <StatCard
            label="Placements This Month"
            value={analytics.placementsThisMonth}
            subtext={`${analytics.placementsThisMonth > analytics.placementsLastMonth ? '+' : ''}${analytics.placementsThisMonth - analytics.placementsLastMonth} vs last month`}
            trend={analytics.placementsThisMonth > analytics.placementsLastMonth ? 'up' : 'down'}
          />
          <StatCard
            label="Candidates Submitted"
            value={analytics.candidatesSubmitted}
            subtext="This month"
          />
          <StatCard
            label="Active Searches"
            value={analytics.activeSearches}
            subtext="Across all clients"
          />
          <StatCard
            label="Avg Time to Place"
            value={`${analytics.avgTimeToPlace} days`}
          />
          <StatCard
            label="Total Commission (YTD)"
            value={formatCurrency(analytics.totalCommission)}
            trend="up"
          />
          <StatCard
            label="Pending Commission"
            value={formatCurrency(analytics.pendingCommission)}
            subtext="Awaiting confirmation"
          />
        </div>

        {/* Two Column Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Clients Overview */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            border: '1px solid #E2E8F0',
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #E2E8F0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0F172A', margin: 0 }}>
                Your Clients
              </h2>
              <Link href="/recruiter/clients" style={{
                color: '#4F46E5',
                fontSize: '0.875rem',
                fontWeight: 500,
                textDecoration: 'none',
              }}>
                View All
              </Link>
            </div>
            <div>
              {clients.slice(0, 4).map((client) => (
                <div key={client.id} style={{
                  padding: '16px 24px',
                  borderBottom: '1px solid #F1F5F9',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'background-color 0.15s',
                  cursor: 'pointer',
                }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                   onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <div>
                    <div style={{ fontWeight: 600, color: '#0F172A', marginBottom: '4px' }}>{client.name}</div>
                    <div style={{ fontSize: '0.8125rem', color: '#64748B' }}>
                      {client.activeRoles} active roles | {client.candidatesSubmitted} candidates
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      fontSize: '1.25rem',
                      fontWeight: 700,
                      color: client.placementsThisMonth > 0 ? '#10B981' : '#CBD5E1'
                    }}>
                      {client.placementsThisMonth}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>placements</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Candidates */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            border: '1px solid #E2E8F0',
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #E2E8F0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0F172A', margin: 0 }}>
                Recent Submissions
              </h2>
              <button style={{
                backgroundColor: '#4F46E5',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer',
              }}>
                Submit Candidate
              </button>
            </div>
            <div>
              {candidates.map((candidate) => (
                <div key={candidate.id} style={{
                  padding: '16px 24px',
                  borderBottom: '1px solid #F1F5F9',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'background-color 0.15s',
                  cursor: 'pointer',
                }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                   onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 600, color: '#0F172A' }}>{candidate.name}</span>
                      <span style={{
                        backgroundColor: '#EEF2FF',
                        color: '#4F46E5',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                      }}>
                        {candidate.score}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: '#64748B' }}>
                      {candidate.role} at {candidate.client}
                    </div>
                  </div>
                  <StatusBadge status={candidate.status} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Cross-Company Talent Search */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          marginTop: '24px',
          padding: '24px',
        }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0F172A', marginBottom: '16px' }}>
            Cross-Company Talent Search
          </h2>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
            <input
              type="text"
              placeholder="Search candidates across all clients (e.g., 'CA(SA) with 5+ years experience')"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                fontSize: '0.9375rem',
                outline: 'none',
              }}
            />
            <button style={{
              backgroundColor: '#4F46E5',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '0.9375rem',
              fontWeight: 500,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}>
              Search Talent
            </button>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {['CA(SA)', 'BCom', 'CFA', '5+ years', 'Johannesburg', 'Cape Town', 'Remote'].map((tag) => (
              <button key={tag} style={{
                backgroundColor: '#F1F5F9',
                color: '#475569',
                border: 'none',
                borderRadius: '16px',
                padding: '6px 14px',
                fontSize: '0.8125rem',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }} onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#E2E8F0';
              }} onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#F1F5F9';
              }}>
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px',
          marginTop: '24px',
        }}>
          <button onClick={() => setShowAddClient(true)} style={{
            backgroundColor: 'white',
            border: '2px dashed #CBD5E1',
            borderRadius: '12px',
            padding: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            cursor: 'pointer',
            transition: 'all 0.15s',
            textAlign: 'left',
          }} onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#4F46E5';
            e.currentTarget.style.backgroundColor = '#F5F3FF';
          }} onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#CBD5E1';
            e.currentTarget.style.backgroundColor = 'white';
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: '#EEF2FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
            }}>
              +
            </div>
            <div>
              <div style={{ fontWeight: 600, color: '#0F172A', marginBottom: '4px' }}>Add New Client</div>
              <div style={{ fontSize: '0.875rem', color: '#64748B' }}>Onboard a new company</div>
            </div>
          </button>

          <Link href="/recruiter/talent" style={{
            backgroundColor: 'white',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            padding: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            cursor: 'pointer',
            textDecoration: 'none',
            transition: 'all 0.15s',
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: '#ECFDF5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <div>
              <div style={{ fontWeight: 600, color: '#0F172A', marginBottom: '4px' }}>Talent Passports</div>
              <div style={{ fontSize: '0.875rem', color: '#64748B' }}>Create shareable profiles</div>
            </div>
          </Link>

          <button style={{
            backgroundColor: 'white',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            padding: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'all 0.15s',
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: '#FEF3C7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
            </div>
            <div>
              <div style={{ fontWeight: 600, color: '#0F172A', marginBottom: '4px' }}>Bulk Operations</div>
              <div style={{ fontSize: '0.875rem', color: '#64748B' }}>Submit to multiple roles</div>
            </div>
          </button>
        </div>
      </main>

      {/* Add Client Modal Placeholder */}
      {showAddClient && (
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
        }} onClick={() => setShowAddClient(false)}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '32px',
            width: '100%',
            maxWidth: '480px',
            boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
          }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0F172A', marginBottom: '24px' }}>
              Add New Client
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                  Company Name
                </label>
                <input type="text" placeholder="e.g., Standard Bank" style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                  fontSize: '0.9375rem',
                  boxSizing: 'border-box',
                }}/>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                  Contact Person
                </label>
                <input type="text" placeholder="e.g., Sarah Johnson" style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                  fontSize: '0.9375rem',
                  boxSizing: 'border-box',
                }}/>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                  Email
                </label>
                <input type="email" placeholder="e.g., sarah@company.com" style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                  fontSize: '0.9375rem',
                  boxSizing: 'border-box',
                }}/>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                  Commission Rate (%)
                </label>
                <input type="number" placeholder="e.g., 15" style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                  fontSize: '0.9375rem',
                  boxSizing: 'border-box',
                }}/>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button onClick={() => setShowAddClient(false)} style={{
                flex: 1,
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                backgroundColor: 'white',
                fontSize: '0.9375rem',
                fontWeight: 500,
                cursor: 'pointer',
              }}>
                Cancel
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
                Add Client
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
