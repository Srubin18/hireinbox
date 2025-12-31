'use client';

import { useState } from 'react';
import Link from 'next/link';

// ============================================
// B2Recruiter - Commissions & Analytics
// Commission tracking and performance analytics
// Revenue insights, placement metrics
// ============================================

// Types
interface Commission {
  id: string;
  candidateName: string;
  clientName: string;
  role: string;
  placementDate: string;
  salary: number;
  commissionRate: number;
  commissionAmount: number;
  status: 'pending' | 'confirmed' | 'paid' | 'cancelled';
  paymentDate?: string;
  invoiceNumber?: string;
}

interface MonthlyStats {
  month: string;
  placements: number;
  submissions: number;
  revenue: number;
  conversionRate: number;
}

interface ClientPerformance {
  clientName: string;
  placements: number;
  submissions: number;
  conversionRate: number;
  totalRevenue: number;
  avgTimeToFill: number;
}

// Mock data
const MOCK_COMMISSIONS: Commission[] = [
  {
    id: '1',
    candidateName: 'John Dlamini',
    clientName: 'Woolworths Holdings',
    role: 'Financial Controller',
    placementDate: '2024-12-01',
    salary: 950000,
    commissionRate: 13,
    commissionAmount: 123500,
    status: 'confirmed',
    invoiceNumber: 'INV-2024-0089',
  },
  {
    id: '2',
    candidateName: 'Sarah van der Berg',
    clientName: 'Mafadi Property Group',
    role: 'Senior Property Manager',
    placementDate: '2024-12-15',
    salary: 520000,
    commissionRate: 15,
    commissionAmount: 78000,
    status: 'pending',
  },
  {
    id: '3',
    candidateName: 'Michael Botha',
    clientName: 'Standard Bank',
    role: 'Data Engineer',
    placementDate: '2024-11-20',
    salary: 820000,
    commissionRate: 12,
    commissionAmount: 98400,
    status: 'paid',
    paymentDate: '2024-12-05',
    invoiceNumber: 'INV-2024-0082',
  },
  {
    id: '4',
    candidateName: 'Thandi Zulu',
    clientName: 'Discovery Health',
    role: 'Actuary',
    placementDate: '2024-11-01',
    salary: 1200000,
    commissionRate: 14,
    commissionAmount: 168000,
    status: 'paid',
    paymentDate: '2024-11-25',
    invoiceNumber: 'INV-2024-0075',
  },
  {
    id: '5',
    candidateName: 'Peter Nkosi',
    clientName: 'Standard Bank',
    role: 'Compliance Officer',
    placementDate: '2024-10-15',
    salary: 600000,
    commissionRate: 12,
    commissionAmount: 72000,
    status: 'paid',
    paymentDate: '2024-11-10',
    invoiceNumber: 'INV-2024-0068',
  },
];

const MOCK_MONTHLY_STATS: MonthlyStats[] = [
  { month: 'Jul 2024', placements: 2, submissions: 18, revenue: 145000, conversionRate: 11.1 },
  { month: 'Aug 2024', placements: 3, submissions: 22, revenue: 198000, conversionRate: 13.6 },
  { month: 'Sep 2024', placements: 2, submissions: 15, revenue: 134000, conversionRate: 13.3 },
  { month: 'Oct 2024', placements: 4, submissions: 28, revenue: 287000, conversionRate: 14.3 },
  { month: 'Nov 2024', placements: 3, submissions: 25, revenue: 266400, conversionRate: 12.0 },
  { month: 'Dec 2024', placements: 4, submissions: 31, revenue: 299900, conversionRate: 12.9 },
];

const MOCK_CLIENT_PERFORMANCE: ClientPerformance[] = [
  { clientName: 'Standard Bank', placements: 5, submissions: 28, conversionRate: 17.9, totalRevenue: 340400, avgTimeToFill: 25 },
  { clientName: 'Mafadi Property Group', placements: 3, submissions: 12, conversionRate: 25.0, totalRevenue: 198000, avgTimeToFill: 18 },
  { clientName: 'Discovery Health', placements: 2, submissions: 8, conversionRate: 25.0, totalRevenue: 238000, avgTimeToFill: 35 },
  { clientName: 'Woolworths Holdings', placements: 4, submissions: 15, conversionRate: 26.7, totalRevenue: 312500, avgTimeToFill: 22 },
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
const StatusBadge = ({ status }: { status: Commission['status'] }) => {
  const styles: Record<Commission['status'], { bg: string; text: string }> = {
    pending: { bg: '#FEF3C7', text: '#92400E' },
    confirmed: { bg: '#DBEAFE', text: '#1E40AF' },
    paid: { bg: '#D1FAE5', text: '#065F46' },
    cancelled: { bg: '#FEE2E2', text: '#991B1B' },
  };
  const style = styles[status];
  return (
    <span style={{
      padding: '4px 12px',
      borderRadius: '12px',
      fontSize: '0.75rem',
      fontWeight: 600,
      backgroundColor: style.bg,
      color: style.text,
      textTransform: 'capitalize',
    }}>
      {status}
    </span>
  );
};

// Stat Card Component
const StatCard = ({ label, value, subtext, trend, bgColor }: {
  label: string;
  value: string | number;
  subtext?: string;
  trend?: 'up' | 'down' | 'neutral';
  bgColor?: string;
}) => (
  <div style={{
    backgroundColor: bgColor || 'white',
    borderRadius: '12px',
    padding: '24px',
    border: bgColor ? 'none' : '1px solid #E2E8F0',
  }}>
    <div style={{ fontSize: '0.875rem', color: bgColor ? 'rgba(255,255,255,0.8)' : '#64748B', fontWeight: 500, marginBottom: '8px' }}>
      {label}
    </div>
    <div style={{ fontSize: '2rem', fontWeight: 700, color: bgColor ? 'white' : '#0F172A', marginBottom: '4px' }}>
      {value}
    </div>
    {subtext && (
      <div style={{
        fontSize: '0.8125rem',
        color: trend === 'up' ? '#10B981' : trend === 'down' ? '#EF4444' : (bgColor ? 'rgba(255,255,255,0.7)' : '#64748B'),
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
      }}>
        {trend === 'up' && (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
            <polyline points="17 6 23 6 23 12"/>
          </svg>
        )}
        {trend === 'down' && (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/>
            <polyline points="17 18 23 18 23 12"/>
          </svg>
        )}
        {subtext}
      </div>
    )}
  </div>
);

export default function CommissionsPage() {
  const [commissions] = useState<Commission[]>(MOCK_COMMISSIONS);
  const [monthlyStats] = useState<MonthlyStats[]>(MOCK_MONTHLY_STATS);
  const [clientPerformance] = useState<ClientPerformance[]>(MOCK_CLIENT_PERFORMANCE);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('6months');

  // Format currency in ZAR
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', minimumFractionDigits: 0 }).format(amount);
  };

  // Calculate totals
  const totalRevenue = commissions.filter(c => c.status !== 'cancelled').reduce((sum, c) => sum + c.commissionAmount, 0);
  const paidRevenue = commissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.commissionAmount, 0);
  const pendingRevenue = commissions.filter(c => c.status === 'pending' || c.status === 'confirmed').reduce((sum, c) => sum + c.commissionAmount, 0);
  const totalPlacements = commissions.filter(c => c.status !== 'cancelled').length;

  // Filter commissions
  const filteredCommissions = commissions.filter(c =>
    statusFilter === 'all' || c.status === statusFilter
  );

  // Get max revenue for chart scaling
  const maxRevenue = Math.max(...monthlyStats.map(s => s.revenue));

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
            <Link href="/recruiter/clients" style={{ color: '#64748B', textDecoration: 'none', fontSize: '0.9375rem' }}>Clients</Link>
            <Link href="/recruiter/talent" style={{ color: '#64748B', textDecoration: 'none', fontSize: '0.9375rem' }}>Talent Pool</Link>
            <Link href="/recruiter/commissions" style={{ color: '#4F46E5', fontWeight: 600, textDecoration: 'none', fontSize: '0.9375rem' }}>Commissions</Link>
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
              Commissions & Analytics
            </h1>
            <p style={{ color: '#64748B', fontSize: '1rem' }}>
              Track your earnings and performance metrics
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              style={{
                padding: '10px 16px',
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                fontSize: '0.9375rem',
                backgroundColor: 'white',
                cursor: 'pointer',
              }}
            >
              <option value="3months">Last 3 Months</option>
              <option value="6months">Last 6 Months</option>
              <option value="12months">Last 12 Months</option>
              <option value="ytd">Year to Date</option>
            </select>
            <button style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: '1px solid #E2E8F0',
              backgroundColor: 'white',
              fontSize: '0.9375rem',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Export Report
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '20px',
          marginBottom: '32px',
        }}>
          <StatCard
            label="Total Revenue (YTD)"
            value={formatCurrency(totalRevenue)}
            subtext="+18% vs last year"
            trend="up"
            bgColor="linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)"
          />
          <StatCard
            label="Paid Commissions"
            value={formatCurrency(paidRevenue)}
            subtext="Received"
          />
          <StatCard
            label="Pending Commissions"
            value={formatCurrency(pendingRevenue)}
            subtext="Awaiting payment"
          />
          <StatCard
            label="Total Placements"
            value={totalPlacements}
            subtext="+2 vs last month"
            trend="up"
          />
        </div>

        {/* Charts Section */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '32px' }}>
          {/* Revenue Chart */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid #E2E8F0',
          }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0F172A', marginBottom: '20px' }}>
              Monthly Revenue
            </h2>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', height: '200px' }}>
              {monthlyStats.map((stat, idx) => (
                <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{
                    width: '100%',
                    backgroundColor: '#EEF2FF',
                    borderRadius: '4px 4px 0 0',
                    height: `${(stat.revenue / maxRevenue) * 160}px`,
                    minHeight: '20px',
                    position: 'relative',
                    transition: 'all 0.3s',
                  }}>
                    <div style={{
                      position: 'absolute',
                      bottom: '100%',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      marginBottom: '4px',
                      fontSize: '0.6875rem',
                      fontWeight: 600,
                      color: '#4F46E5',
                      whiteSpace: 'nowrap',
                    }}>
                      {formatCurrency(stat.revenue)}
                    </div>
                  </div>
                  <div style={{
                    marginTop: '8px',
                    fontSize: '0.6875rem',
                    color: '#64748B',
                    textAlign: 'center',
                  }}>
                    {stat.month.split(' ')[0]}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Performance Metrics */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid #E2E8F0',
          }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0F172A', marginBottom: '20px' }}>
              Key Metrics
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ padding: '16px', backgroundColor: '#F8FAFC', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.875rem', color: '#64748B' }}>Avg Conversion Rate</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#10B981' }}>13.2%</span>
                </div>
                <div style={{ height: '8px', backgroundColor: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: '66%', backgroundColor: '#10B981', borderRadius: '4px' }}/>
                </div>
              </div>
              <div style={{ padding: '16px', backgroundColor: '#F8FAFC', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.875rem', color: '#64748B' }}>Avg Time to Fill</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#4F46E5' }}>24 days</span>
                </div>
                <div style={{ height: '8px', backgroundColor: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: '75%', backgroundColor: '#4F46E5', borderRadius: '4px' }}/>
                </div>
              </div>
              <div style={{ padding: '16px', backgroundColor: '#F8FAFC', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.875rem', color: '#64748B' }}>Avg Commission</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#F59E0B' }}>R108k</span>
                </div>
                <div style={{ height: '8px', backgroundColor: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: '54%', backgroundColor: '#F59E0B', borderRadius: '4px' }}/>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Client Performance */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '32px',
          border: '1px solid #E2E8F0',
        }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0F172A', marginBottom: '20px' }}>
            Client Performance
          </h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.8125rem', fontWeight: 600, color: '#64748B', borderBottom: '1px solid #E2E8F0' }}>Client</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '0.8125rem', fontWeight: 600, color: '#64748B', borderBottom: '1px solid #E2E8F0' }}>Placements</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '0.8125rem', fontWeight: 600, color: '#64748B', borderBottom: '1px solid #E2E8F0' }}>Submissions</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '0.8125rem', fontWeight: 600, color: '#64748B', borderBottom: '1px solid #E2E8F0' }}>Conversion</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '0.8125rem', fontWeight: 600, color: '#64748B', borderBottom: '1px solid #E2E8F0' }}>Avg Time to Fill</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '0.8125rem', fontWeight: 600, color: '#64748B', borderBottom: '1px solid #E2E8F0' }}>Total Revenue</th>
                </tr>
              </thead>
              <tbody>
                {clientPerformance.map((client, idx) => (
                  <tr key={idx}>
                    <td style={{ padding: '16px', fontWeight: 600, color: '#0F172A', borderBottom: '1px solid #F1F5F9' }}>{client.clientName}</td>
                    <td style={{ padding: '16px', textAlign: 'center', color: '#10B981', fontWeight: 600, borderBottom: '1px solid #F1F5F9' }}>{client.placements}</td>
                    <td style={{ padding: '16px', textAlign: 'center', color: '#64748B', borderBottom: '1px solid #F1F5F9' }}>{client.submissions}</td>
                    <td style={{ padding: '16px', textAlign: 'center', borderBottom: '1px solid #F1F5F9' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        backgroundColor: client.conversionRate >= 20 ? '#D1FAE5' : '#FEF3C7',
                        color: client.conversionRate >= 20 ? '#065F46' : '#92400E',
                      }}>
                        {client.conversionRate.toFixed(1)}%
                      </span>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center', color: '#64748B', borderBottom: '1px solid #F1F5F9' }}>{client.avgTimeToFill} days</td>
                    <td style={{ padding: '16px', textAlign: 'right', fontWeight: 600, color: '#0F172A', borderBottom: '1px solid #F1F5F9' }}>{formatCurrency(client.totalRevenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Commission History */}
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
              Commission History
            </h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['all', 'pending', 'confirmed', 'paid'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: statusFilter === status ? '#EEF2FF' : 'transparent',
                    color: statusFilter === status ? '#4F46E5' : '#64748B',
                    fontSize: '0.8125rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                  }}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC' }}>
                  <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '0.8125rem', fontWeight: 600, color: '#64748B' }}>Candidate</th>
                  <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '0.8125rem', fontWeight: 600, color: '#64748B' }}>Client / Role</th>
                  <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '0.8125rem', fontWeight: 600, color: '#64748B' }}>Placement Date</th>
                  <th style={{ padding: '12px 20px', textAlign: 'right', fontSize: '0.8125rem', fontWeight: 600, color: '#64748B' }}>Salary</th>
                  <th style={{ padding: '12px 20px', textAlign: 'center', fontSize: '0.8125rem', fontWeight: 600, color: '#64748B' }}>Rate</th>
                  <th style={{ padding: '12px 20px', textAlign: 'right', fontSize: '0.8125rem', fontWeight: 600, color: '#64748B' }}>Commission</th>
                  <th style={{ padding: '12px 20px', textAlign: 'center', fontSize: '0.8125rem', fontWeight: 600, color: '#64748B' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredCommissions.map((commission) => (
                  <tr key={commission.id} style={{ borderTop: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontWeight: 600, color: '#0F172A' }}>{commission.candidateName}</div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ color: '#0F172A' }}>{commission.clientName}</div>
                      <div style={{ fontSize: '0.8125rem', color: '#64748B' }}>{commission.role}</div>
                    </td>
                    <td style={{ padding: '16px 20px', color: '#64748B' }}>
                      {new Date(commission.placementDate).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'right', color: '#64748B' }}>
                      {formatCurrency(commission.salary)}
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'center', color: '#64748B' }}>
                      {commission.commissionRate}%
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'right', fontWeight: 600, color: '#0F172A' }}>
                      {formatCurrency(commission.commissionAmount)}
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                      <StatusBadge status={commission.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
