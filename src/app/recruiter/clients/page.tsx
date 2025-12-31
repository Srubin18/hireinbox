'use client';

import { useState } from 'react';
import Link from 'next/link';

// ============================================
// B2Recruiter - Client Management
// Multi-client management for professional recruiters
// Client onboarding, role management, candidate pipelines
// ============================================

// Types
interface ClientRole {
  id: string;
  title: string;
  status: 'active' | 'paused' | 'filled' | 'cancelled';
  candidatesSubmitted: number;
  candidatesInterviewing: number;
  daysOpen: number;
  salary: string;
  location: string;
}

interface Client {
  id: string;
  name: string;
  industry: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  commissionRate: number;
  status: 'active' | 'prospect' | 'inactive';
  activeRoles: number;
  totalPlacements: number;
  lifetimeValue: number;
  lastActivity: string;
  roles: ClientRole[];
}

interface PipelineCandidate {
  id: string;
  name: string;
  role: string;
  stage: 'submitted' | 'screening' | 'interview' | 'offer' | 'placed';
  score: number;
  submittedDate: string;
  lastUpdate: string;
}

// Mock data for MVP
const MOCK_CLIENTS: Client[] = [
  {
    id: '1',
    name: 'Mafadi Property Group',
    industry: 'Real Estate',
    contactName: 'Themba Mokoena',
    contactEmail: 'themba@mafadi.co.za',
    contactPhone: '+27 11 234 5678',
    commissionRate: 15,
    status: 'active',
    activeRoles: 3,
    totalPlacements: 8,
    lifetimeValue: 320000,
    lastActivity: '2 hours ago',
    roles: [
      { id: '1', title: 'Senior Property Manager', status: 'active', candidatesSubmitted: 5, candidatesInterviewing: 2, daysOpen: 14, salary: 'R450k - R550k', location: 'Johannesburg' },
      { id: '2', title: 'Financial Controller', status: 'active', candidatesSubmitted: 3, candidatesInterviewing: 1, daysOpen: 7, salary: 'R600k - R750k', location: 'Johannesburg' },
      { id: '3', title: 'Leasing Agent', status: 'active', candidatesSubmitted: 4, candidatesInterviewing: 0, daysOpen: 21, salary: 'R280k - R350k', location: 'Cape Town' },
    ]
  },
  {
    id: '2',
    name: 'Standard Bank',
    industry: 'Banking',
    contactName: 'Sarah van Wyk',
    contactEmail: 'sarah.vanwyk@standardbank.co.za',
    contactPhone: '+27 11 636 9111',
    commissionRate: 12,
    status: 'active',
    activeRoles: 5,
    totalPlacements: 15,
    lifetimeValue: 890000,
    lastActivity: '1 day ago',
    roles: [
      { id: '4', title: 'Senior Analyst - Risk', status: 'active', candidatesSubmitted: 8, candidatesInterviewing: 3, daysOpen: 28, salary: 'R700k - R900k', location: 'Johannesburg' },
      { id: '5', title: 'Head of Credit', status: 'active', candidatesSubmitted: 4, candidatesInterviewing: 2, daysOpen: 45, salary: 'R1.2M - R1.5M', location: 'Johannesburg' },
      { id: '6', title: 'Data Engineer', status: 'active', candidatesSubmitted: 6, candidatesInterviewing: 1, daysOpen: 10, salary: 'R800k - R950k', location: 'Remote' },
      { id: '7', title: 'Compliance Officer', status: 'filled', candidatesSubmitted: 10, candidatesInterviewing: 0, daysOpen: 35, salary: 'R550k - R650k', location: 'Cape Town' },
      { id: '8', title: 'UX Designer', status: 'active', candidatesSubmitted: 5, candidatesInterviewing: 2, daysOpen: 18, salary: 'R500k - R600k', location: 'Johannesburg' },
    ]
  },
  {
    id: '3',
    name: 'Discovery Health',
    industry: 'Insurance',
    contactName: 'Priya Govender',
    contactEmail: 'priya.govender@discovery.co.za',
    contactPhone: '+27 11 529 2888',
    commissionRate: 14,
    status: 'active',
    activeRoles: 2,
    totalPlacements: 6,
    lifetimeValue: 420000,
    lastActivity: '3 days ago',
    roles: [
      { id: '9', title: 'Actuary', status: 'active', candidatesSubmitted: 3, candidatesInterviewing: 1, daysOpen: 60, salary: 'R1M - R1.3M', location: 'Johannesburg' },
      { id: '10', title: 'Product Manager', status: 'active', candidatesSubmitted: 5, candidatesInterviewing: 2, daysOpen: 25, salary: 'R700k - R850k', location: 'Johannesburg' },
    ]
  },
  {
    id: '4',
    name: 'Woolworths Holdings',
    industry: 'Retail',
    contactName: 'John Daniels',
    contactEmail: 'john.daniels@woolworths.co.za',
    contactPhone: '+27 21 407 9111',
    commissionRate: 13,
    status: 'active',
    activeRoles: 4,
    totalPlacements: 12,
    lifetimeValue: 650000,
    lastActivity: '5 hours ago',
    roles: [
      { id: '11', title: 'Buyer - Clothing', status: 'active', candidatesSubmitted: 7, candidatesInterviewing: 2, daysOpen: 15, salary: 'R450k - R550k', location: 'Cape Town' },
      { id: '12', title: 'Supply Chain Manager', status: 'active', candidatesSubmitted: 4, candidatesInterviewing: 1, daysOpen: 22, salary: 'R600k - R750k', location: 'Cape Town' },
      { id: '13', title: 'Store Manager', status: 'paused', candidatesSubmitted: 2, candidatesInterviewing: 0, daysOpen: 40, salary: 'R380k - R450k', location: 'Durban' },
      { id: '14', title: 'E-commerce Specialist', status: 'active', candidatesSubmitted: 5, candidatesInterviewing: 2, daysOpen: 8, salary: 'R400k - R500k', location: 'Cape Town' },
    ]
  },
  {
    id: '5',
    name: 'TechStart SA',
    industry: 'Technology',
    contactName: 'Mike Chen',
    contactEmail: 'mike@techstart.co.za',
    contactPhone: '+27 21 555 0123',
    commissionRate: 18,
    status: 'prospect',
    activeRoles: 0,
    totalPlacements: 0,
    lifetimeValue: 0,
    lastActivity: 'Never',
    roles: []
  },
];

const MOCK_PIPELINE: PipelineCandidate[] = [
  { id: '1', name: 'Thabo Molefe', role: 'Senior Analyst - Risk', stage: 'interview', score: 87, submittedDate: '2024-12-10', lastUpdate: '2 hours ago' },
  { id: '2', name: 'Sarah van der Berg', role: 'Senior Property Manager', stage: 'offer', score: 92, submittedDate: '2024-12-15', lastUpdate: '1 day ago' },
  { id: '3', name: 'Priya Naidoo', role: 'Product Manager', stage: 'submitted', score: 78, submittedDate: '2024-12-24', lastUpdate: '5 hours ago' },
  { id: '4', name: 'John Dlamini', role: 'Financial Controller', stage: 'placed', score: 85, submittedDate: '2024-12-01', lastUpdate: '3 days ago' },
  { id: '5', name: 'Lisa Chen', role: 'Data Engineer', stage: 'screening', score: 81, submittedDate: '2024-12-22', lastUpdate: '1 day ago' },
];

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
const StatusBadge = ({ status, size = 'normal' }: { status: string; size?: 'small' | 'normal' }) => {
  const styles: Record<string, { bg: string; text: string }> = {
    active: { bg: '#D1FAE5', text: '#065F46' },
    paused: { bg: '#FEF3C7', text: '#92400E' },
    filled: { bg: '#DBEAFE', text: '#1E40AF' },
    cancelled: { bg: '#FEE2E2', text: '#991B1B' },
    prospect: { bg: '#E0E7FF', text: '#4338CA' },
    inactive: { bg: '#F1F5F9', text: '#64748B' },
    // Pipeline stages
    submitted: { bg: '#F1F5F9', text: '#64748B' },
    screening: { bg: '#FEF3C7', text: '#92400E' },
    interview: { bg: '#DBEAFE', text: '#1E40AF' },
    offer: { bg: '#D1FAE5', text: '#065F46' },
    placed: { bg: '#10B981', text: '#FFFFFF' },
  };
  const style = styles[status] || styles.inactive;
  return (
    <span style={{
      padding: size === 'small' ? '2px 8px' : '4px 12px',
      borderRadius: '12px',
      fontSize: size === 'small' ? '0.6875rem' : '0.75rem',
      fontWeight: 600,
      backgroundColor: style.bg,
      color: style.text,
      textTransform: 'capitalize',
    }}>
      {status}
    </span>
  );
};

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>(MOCK_CLIENTS);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddClient, setShowAddClient] = useState(false);
  const [pipelineView, setPipelineView] = useState(false);

  // Format currency in ZAR
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', minimumFractionDigits: 0 }).format(amount);
  };

  // Filter clients
  const filteredClients = clients.filter(client => {
    const matchesStatus = statusFilter === 'all' || client.status === statusFilter;
    const matchesSearch = client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          client.industry.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          client.contactName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

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
            <Link href="/recruiter" style={{ color: '#64748B', textDecoration: 'none', fontSize: '0.9375rem' }}>Dashboard</Link>
            <Link href="/recruiter/clients" style={{ color: '#4F46E5', fontWeight: 600, textDecoration: 'none', fontSize: '0.9375rem' }}>Clients</Link>
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
        {/* Page Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A', marginBottom: '8px' }}>
              Client Management
            </h1>
            <p style={{ color: '#64748B', fontSize: '1rem' }}>
              {filteredClients.length} client{filteredClients.length !== 1 ? 's' : ''} | {filteredClients.reduce((sum, c) => sum + c.activeRoles, 0)} active roles
            </p>
          </div>
          <button onClick={() => setShowAddClient(true)} style={{
            backgroundColor: '#4F46E5',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 24px',
            fontSize: '0.9375rem',
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <span style={{ fontSize: '1.25rem' }}>+</span>
            Add Client
          </button>
        </div>

        {/* Filters */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '16px 24px',
          marginBottom: '24px',
          border: '1px solid #E2E8F0',
          display: 'flex',
          gap: '16px',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}>
          <input
            type="text"
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              minWidth: '200px',
              padding: '10px 16px',
              borderRadius: '8px',
              border: '1px solid #E2E8F0',
              fontSize: '0.9375rem',
              outline: 'none',
            }}
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '10px 16px',
              borderRadius: '8px',
              border: '1px solid #E2E8F0',
              fontSize: '0.9375rem',
              backgroundColor: 'white',
              cursor: 'pointer',
            }}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="prospect">Prospect</option>
            <option value="inactive">Inactive</option>
          </select>
          <div style={{ display: 'flex', gap: '4px', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '2px' }}>
            <button
              onClick={() => setViewMode('grid')}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: viewMode === 'grid' ? '#EEF2FF' : 'transparent',
                color: viewMode === 'grid' ? '#4F46E5' : '#64748B',
                cursor: 'pointer',
              }}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: viewMode === 'list' ? '#EEF2FF' : 'transparent',
                color: viewMode === 'list' ? '#4F46E5' : '#64748B',
                cursor: 'pointer',
              }}
            >
              List
            </button>
          </div>
        </div>

        {/* Client Grid/List */}
        {viewMode === 'grid' ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '20px',
          }}>
            {filteredClients.map((client) => (
              <div
                key={client.id}
                onClick={() => setSelectedClient(client)}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  boxShadow: selectedClient?.id === client.id ? '0 0 0 2px #4F46E5' : 'none',
                }}
              >
                <div style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0F172A', marginBottom: '4px' }}>{client.name}</h3>
                      <p style={{ fontSize: '0.8125rem', color: '#64748B' }}>{client.industry}</p>
                    </div>
                    <StatusBadge status={client.status} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                    <div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A' }}>{client.activeRoles}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Active Roles</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10B981' }}>{client.totalPlacements}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Placements</div>
                    </div>
                  </div>
                  <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: '0.8125rem', color: '#64748B' }}>
                        {client.commissionRate}% commission
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: '#94A3B8' }}>
                        {client.lastActivity}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            border: '1px solid #E2E8F0',
            overflow: 'hidden',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC' }}>
                  <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '0.8125rem', fontWeight: 600, color: '#64748B' }}>Client</th>
                  <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '0.8125rem', fontWeight: 600, color: '#64748B' }}>Status</th>
                  <th style={{ padding: '12px 20px', textAlign: 'center', fontSize: '0.8125rem', fontWeight: 600, color: '#64748B' }}>Active Roles</th>
                  <th style={{ padding: '12px 20px', textAlign: 'center', fontSize: '0.8125rem', fontWeight: 600, color: '#64748B' }}>Placements</th>
                  <th style={{ padding: '12px 20px', textAlign: 'right', fontSize: '0.8125rem', fontWeight: 600, color: '#64748B' }}>Lifetime Value</th>
                  <th style={{ padding: '12px 20px', textAlign: 'right', fontSize: '0.8125rem', fontWeight: 600, color: '#64748B' }}>Commission</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map((client) => (
                  <tr
                    key={client.id}
                    onClick={() => setSelectedClient(client)}
                    style={{
                      borderTop: '1px solid #F1F5F9',
                      cursor: 'pointer',
                      backgroundColor: selectedClient?.id === client.id ? '#F5F3FF' : 'transparent',
                    }}
                  >
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontWeight: 600, color: '#0F172A', marginBottom: '2px' }}>{client.name}</div>
                      <div style={{ fontSize: '0.8125rem', color: '#64748B' }}>{client.industry}</div>
                    </td>
                    <td style={{ padding: '16px 20px' }}><StatusBadge status={client.status} size="small" /></td>
                    <td style={{ padding: '16px 20px', textAlign: 'center', fontWeight: 600 }}>{client.activeRoles}</td>
                    <td style={{ padding: '16px 20px', textAlign: 'center', fontWeight: 600, color: '#10B981' }}>{client.totalPlacements}</td>
                    <td style={{ padding: '16px 20px', textAlign: 'right', fontWeight: 600 }}>{formatCurrency(client.lifetimeValue)}</td>
                    <td style={{ padding: '16px 20px', textAlign: 'right', color: '#64748B' }}>{client.commissionRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Client Detail Panel */}
        {selectedClient && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            border: '1px solid #E2E8F0',
            marginTop: '24px',
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '24px',
              borderBottom: '1px solid #E2E8F0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>{selectedClient.name}</h2>
                  <StatusBadge status={selectedClient.status} />
                </div>
                <p style={{ color: '#64748B', marginBottom: '16px' }}>{selectedClient.industry}</p>
                <div style={{ display: 'flex', gap: '24px', fontSize: '0.875rem' }}>
                  <div>
                    <span style={{ color: '#94A3B8' }}>Contact: </span>
                    <span style={{ color: '#0F172A', fontWeight: 500 }}>{selectedClient.contactName}</span>
                  </div>
                  <div>
                    <span style={{ color: '#94A3B8' }}>Email: </span>
                    <span style={{ color: '#4F46E5' }}>{selectedClient.contactEmail}</span>
                  </div>
                  <div>
                    <span style={{ color: '#94A3B8' }}>Phone: </span>
                    <span style={{ color: '#0F172A' }}>{selectedClient.contactPhone}</span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => setPipelineView(!pipelineView)}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    backgroundColor: pipelineView ? '#EEF2FF' : 'white',
                    color: pipelineView ? '#4F46E5' : '#64748B',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  {pipelineView ? 'Show Roles' : 'View Pipeline'}
                </button>
                <button style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#4F46E5',
                  color: 'white',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}>
                  Submit Candidate
                </button>
              </div>
            </div>

            {!pipelineView ? (
              // Roles View
              <div style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0F172A', marginBottom: '16px' }}>
                  Active Roles ({selectedClient.roles.filter(r => r.status === 'active').length})
                </h3>
                <div style={{ display: 'grid', gap: '12px' }}>
                  {selectedClient.roles.map((role) => (
                    <div key={role.id} style={{
                      padding: '16px 20px',
                      backgroundColor: '#F8FAFC',
                      borderRadius: '8px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 600, color: '#0F172A' }}>{role.title}</span>
                          <StatusBadge status={role.status} size="small" />
                        </div>
                        <div style={{ fontSize: '0.8125rem', color: '#64748B' }}>
                          {role.salary} | {role.location} | {role.daysOpen} days open
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0F172A' }}>{role.candidatesSubmitted}</div>
                          <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>Submitted</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '1.125rem', fontWeight: 600, color: '#F59E0B' }}>{role.candidatesInterviewing}</div>
                          <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>Interviewing</div>
                        </div>
                        <button style={{
                          padding: '8px 16px',
                          borderRadius: '6px',
                          border: '1px solid #E2E8F0',
                          backgroundColor: 'white',
                          fontSize: '0.8125rem',
                          fontWeight: 500,
                          cursor: 'pointer',
                          color: '#4F46E5',
                        }}>
                          Submit
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              // Pipeline View
              <div style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0F172A', marginBottom: '16px' }}>
                  Candidate Pipeline
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(5, 1fr)',
                  gap: '16px',
                }}>
                  {['submitted', 'screening', 'interview', 'offer', 'placed'].map((stage) => (
                    <div key={stage} style={{
                      backgroundColor: '#F8FAFC',
                      borderRadius: '8px',
                      padding: '12px',
                    }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '12px',
                        paddingBottom: '12px',
                        borderBottom: '1px solid #E2E8F0',
                      }}>
                        <StatusBadge status={stage} size="small" />
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B' }}>
                          {MOCK_PIPELINE.filter(c => c.stage === stage).length}
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {MOCK_PIPELINE.filter(c => c.stage === stage).map((candidate) => (
                          <div key={candidate.id} style={{
                            backgroundColor: 'white',
                            borderRadius: '6px',
                            padding: '12px',
                            border: '1px solid #E2E8F0',
                          }}>
                            <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#0F172A', marginBottom: '4px' }}>
                              {candidate.name}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: '8px' }}>
                              {candidate.role}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{
                                backgroundColor: '#EEF2FF',
                                color: '#4F46E5',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '0.6875rem',
                                fontWeight: 600,
                              }}>
                                Score: {candidate.score}
                              </span>
                              <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>
                                {candidate.lastUpdate}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Add Client Modal */}
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
            maxWidth: '560px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
          }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0F172A', marginBottom: '24px' }}>
              Add New Client
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                    Company Name *
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
                    Industry
                  </label>
                  <select style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    fontSize: '0.9375rem',
                    boxSizing: 'border-box',
                    backgroundColor: 'white',
                  }}>
                    <option>Banking</option>
                    <option>Insurance</option>
                    <option>Real Estate</option>
                    <option>Retail</option>
                    <option>Technology</option>
                    <option>Healthcare</option>
                    <option>Manufacturing</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                    Commission Rate (%)
                  </label>
                  <input type="number" placeholder="e.g., 15" defaultValue={15} style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    fontSize: '0.9375rem',
                    boxSizing: 'border-box',
                  }}/>
                </div>
              </div>
              <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '20px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0F172A', marginBottom: '12px' }}>Primary Contact</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                      Contact Name *
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
                      Job Title
                    </label>
                    <input type="text" placeholder="e.g., HR Director" style={{
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
                      Email *
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
                      Phone
                    </label>
                    <input type="tel" placeholder="e.g., +27 11 234 5678" style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: '1px solid #E2E8F0',
                      fontSize: '0.9375rem',
                      boxSizing: 'border-box',
                    }}/>
                  </div>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                  Notes
                </label>
                <textarea placeholder="Any additional notes about this client..." rows={3} style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                  fontSize: '0.9375rem',
                  boxSizing: 'border-box',
                  resize: 'vertical',
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
