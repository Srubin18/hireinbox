'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// ============================================
// HIREINBOX B2B - EMPLOYER DASHBOARD
// /hire/dashboard
//
// Hiring Pass System (MANDATORY STATES):
// PASS 0 — CV RECEIVED (Acknowledgement email sent)
// PASS 1 — AI SCREENED (Strong / Possible / Low match)
// PASS 2 — SHORTLISTED (Manual selection, outcome emails)
// PASS 3 — AI INTERVIEW (Optional - Transcript + summary)
// PASS 4 — VERIFICATION (Optional - ID/Criminal/Credit/Refs)
// PASS 5 — HUMAN INTERVIEW (Manual status updates)
// PASS 6 — OUTCOME (Offer / Hired / Not successful)
// PASS 7 — TALENT POOL DECISION (Employer opt-in, candidate consent)
// ============================================

type HiringPass = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
type AIMatch = 'strong' | 'possible' | 'low';
type Outcome = 'offer' | 'hired' | 'not_successful' | null;

interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  pass: HiringPass;
  aiMatch?: AIMatch;
  aiScore?: number;
  outcome?: Outcome;
  talentPool?: boolean;
  receivedAt: string;
  lastUpdated: string;
}

interface Role {
  id: string;
  title: string;
  location: string;
  createdAt: string;
  candidateCount: number;
}

const PASS_LABELS: Record<HiringPass, { label: string; color: string; bgColor: string }> = {
  0: { label: 'CV Received', color: '#64748b', bgColor: '#f1f5f9' },
  1: { label: 'AI Screened', color: '#7c3aed', bgColor: '#ede9fe' },
  2: { label: 'Shortlisted', color: '#059669', bgColor: '#d1fae5' },
  3: { label: 'AI Interview', color: '#0891b2', bgColor: '#cffafe' },
  4: { label: 'Verification', color: '#d97706', bgColor: '#fef3c7' },
  5: { label: 'Human Interview', color: '#4f46e5', bgColor: '#e0e7ff' },
  6: { label: 'Outcome', color: '#dc2626', bgColor: '#fee2e2' },
  7: { label: 'Talent Pool', color: '#10b981', bgColor: '#d1fae5' }
};

const AI_MATCH_LABELS: Record<AIMatch, { label: string; color: string; bgColor: string }> = {
  strong: { label: 'Strong Match', color: '#059669', bgColor: '#d1fae5' },
  possible: { label: 'Possible', color: '#d97706', bgColor: '#fef3c7' },
  low: { label: 'Low Match', color: '#dc2626', bgColor: '#fee2e2' }
};

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
        <span style={{ color: '#0f172a' }}>Hire</span><span style={{ color: '#4F46E5' }}>Inbox</span>
      </div>
    </div>
  </div>
);

// Sample data - in production this comes from database
const sampleCandidates: Candidate[] = [
  { id: '1', name: 'Sarah Johnson', email: 'sarah@email.com', phone: '+27 82 123 4567', role: 'Senior Developer', pass: 2, aiMatch: 'strong', aiScore: 92, receivedAt: '2026-01-22', lastUpdated: '2026-01-23' },
  { id: '2', name: 'Michael Chen', email: 'michael@email.com', phone: '+27 83 234 5678', role: 'Senior Developer', pass: 1, aiMatch: 'strong', aiScore: 88, receivedAt: '2026-01-22', lastUpdated: '2026-01-22' },
  { id: '3', name: 'Thabo Molefe', email: 'thabo@email.com', phone: '+27 84 345 6789', role: 'Senior Developer', pass: 1, aiMatch: 'possible', aiScore: 72, receivedAt: '2026-01-21', lastUpdated: '2026-01-22' },
  { id: '4', name: 'Priya Naidoo', email: 'priya@email.com', phone: '+27 85 456 7890', role: 'Senior Developer', pass: 0, receivedAt: '2026-01-23', lastUpdated: '2026-01-23' },
  { id: '5', name: 'John Smith', email: 'john@email.com', phone: '+27 86 567 8901', role: 'Senior Developer', pass: 5, aiMatch: 'strong', aiScore: 95, receivedAt: '2026-01-18', lastUpdated: '2026-01-22' },
  { id: '6', name: 'Nomsa Dlamini', email: 'nomsa@email.com', phone: '+27 87 678 9012', role: 'Senior Developer', pass: 1, aiMatch: 'low', aiScore: 45, receivedAt: '2026-01-21', lastUpdated: '2026-01-22' },
];

const sampleRoles: Role[] = [
  { id: '1', title: 'Senior Developer', location: 'Cape Town', createdAt: '2026-01-15', candidateCount: 6 },
  { id: '2', title: 'Marketing Manager', location: 'Johannesburg', createdAt: '2026-01-10', candidateCount: 12 },
];

export default function EmployerDashboard() {
  const router = useRouter();
  const [candidates, setCandidates] = useState<Candidate[]>(sampleCandidates);
  const [roles] = useState<Role[]>(sampleRoles);
  const [selectedRole, setSelectedRole] = useState<string>('1');
  const [filterPass, setFilterPass] = useState<HiringPass | 'all'>('all');
  const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(new Set());

  const filteredCandidates = candidates.filter(c => {
    if (c.role !== roles.find(r => r.id === selectedRole)?.title) return false;
    if (filterPass !== 'all' && c.pass !== filterPass) return false;
    return true;
  });

  const toggleCandidate = (id: string) => {
    const newSelected = new Set(selectedCandidates);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedCandidates(newSelected);
  };

  const bulkAction = (action: 'shortlist' | 'reject' | 'pool') => {
    setCandidates(prev => prev.map(c => {
      if (!selectedCandidates.has(c.id)) return c;
      if (action === 'shortlist') return { ...c, pass: 2 as HiringPass };
      if (action === 'reject') return { ...c, pass: 6 as HiringPass, outcome: 'not_successful' as Outcome };
      if (action === 'pool') return { ...c, pass: 7 as HiringPass, talentPool: true };
      return c;
    }));
    setSelectedCandidates(new Set());
  };

  const passCounts = candidates.reduce((acc, c) => {
    if (c.role === roles.find(r => r.id === selectedRole)?.title) {
      acc[c.pass] = (acc[c.pass] || 0) + 1;
    }
    return acc;
  }, {} as Record<number, number>);

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
        <Logo />
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '13px', color: '#64748b' }}>acme@hireinbox.co.za</span>
          <button
            onClick={() => router.push('/hire/business')}
            style={{
              padding: '8px 16px',
              backgroundColor: '#4F46E5',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            + New Role
          </button>
        </div>
      </header>

      {/* Role selector */}
      <div style={{
        padding: '16px 24px',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0'
      }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', color: '#64748b' }}>Role:</span>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 600,
              backgroundColor: '#ffffff',
              cursor: 'pointer'
            }}
          >
            {roles.map(role => (
              <option key={role.id} value={role.id}>
                {role.title} — {role.location} ({role.candidateCount} CVs)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Pass filters */}
      <div style={{
        padding: '16px 24px',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        gap: '8px',
        overflowX: 'auto'
      }}>
        <button
          onClick={() => setFilterPass('all')}
          style={{
            padding: '8px 16px',
            backgroundColor: filterPass === 'all' ? '#0f172a' : '#f1f5f9',
            color: filterPass === 'all' ? '#ffffff' : '#64748b',
            border: 'none',
            borderRadius: '20px',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          All ({candidates.filter(c => c.role === roles.find(r => r.id === selectedRole)?.title).length})
        </button>
        {([0, 1, 2, 3, 4, 5, 6, 7] as HiringPass[]).map(pass => (
          <button
            key={pass}
            onClick={() => setFilterPass(pass)}
            style={{
              padding: '8px 16px',
              backgroundColor: filterPass === pass ? PASS_LABELS[pass].bgColor : '#f1f5f9',
              color: filterPass === pass ? PASS_LABELS[pass].color : '#64748b',
              border: filterPass === pass ? `1px solid ${PASS_LABELS[pass].color}` : '1px solid transparent',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            Pass {pass}: {PASS_LABELS[pass].label} ({passCounts[pass] || 0})
          </button>
        ))}
      </div>

      {/* Bulk actions */}
      {selectedCandidates.size > 0 && (
        <div style={{
          padding: '12px 24px',
          backgroundColor: '#eff6ff',
          borderBottom: '1px solid #bfdbfe',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#1e40af' }}>
            {selectedCandidates.size} selected
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => bulkAction('shortlist')}
              style={{
                padding: '6px 12px',
                backgroundColor: '#059669',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              Shortlist
            </button>
            <button
              onClick={() => bulkAction('reject')}
              style={{
                padding: '6px 12px',
                backgroundColor: '#dc2626',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              Reject
            </button>
            <button
              onClick={() => bulkAction('pool')}
              style={{
                padding: '6px 12px',
                backgroundColor: '#7c3aed',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              Add to Pool
            </button>
          </div>
        </div>
      )}

      {/* Candidates table (spreadsheet-style) */}
      <div style={{ padding: '24px', overflowX: 'auto' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc' }}>
              <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', borderBottom: '1px solid #e2e8f0', width: '40px' }}>
                <input
                  type="checkbox"
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedCandidates(new Set(filteredCandidates.map(c => c.id)));
                    } else {
                      setSelectedCandidates(new Set());
                    }
                  }}
                  checked={selectedCandidates.size === filteredCandidates.length && filteredCandidates.length > 0}
                  style={{ width: '16px', height: '16px', accentColor: '#4F46E5' }}
                />
              </th>
              <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', borderBottom: '1px solid #e2e8f0', textTransform: 'uppercase' }}>Candidate</th>
              <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', borderBottom: '1px solid #e2e8f0', textTransform: 'uppercase' }}>Pass</th>
              <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', borderBottom: '1px solid #e2e8f0', textTransform: 'uppercase' }}>AI Score</th>
              <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', borderBottom: '1px solid #e2e8f0', textTransform: 'uppercase' }}>Received</th>
              <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', borderBottom: '1px solid #e2e8f0', textTransform: 'uppercase' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCandidates.map((candidate, i) => (
              <tr
                key={candidate.id}
                style={{
                  backgroundColor: selectedCandidates.has(candidate.id) ? '#eff6ff' : i % 2 === 0 ? '#ffffff' : '#fafafa',
                  transition: 'background-color 0.15s'
                }}
              >
                <td style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8f0' }}>
                  <input
                    type="checkbox"
                    checked={selectedCandidates.has(candidate.id)}
                    onChange={() => toggleCandidate(candidate.id)}
                    style={{ width: '16px', height: '16px', accentColor: '#4F46E5' }}
                  />
                </td>
                <td style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8f0' }}>
                  <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '14px' }}>{candidate.name}</div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{candidate.email}</div>
                </td>
                <td style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8f0' }}>
                  <span style={{
                    padding: '4px 10px',
                    backgroundColor: PASS_LABELS[candidate.pass].bgColor,
                    color: PASS_LABELS[candidate.pass].color,
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 500
                  }}>
                    Pass {candidate.pass}
                  </span>
                </td>
                <td style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8f0' }}>
                  {candidate.aiMatch ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        padding: '4px 10px',
                        backgroundColor: AI_MATCH_LABELS[candidate.aiMatch].bgColor,
                        color: AI_MATCH_LABELS[candidate.aiMatch].color,
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 500
                      }}>
                        {AI_MATCH_LABELS[candidate.aiMatch].label}
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
                        {candidate.aiScore}%
                      </span>
                    </div>
                  ) : (
                    <span style={{ fontSize: '13px', color: '#94a3b8' }}>Pending</span>
                  )}
                </td>
                <td style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8f0', fontSize: '13px', color: '#64748b' }}>
                  {candidate.receivedAt}
                </td>
                <td style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#f1f5f9',
                        color: '#475569',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 500,
                        cursor: 'pointer'
                      }}
                    >
                      View CV
                    </button>
                    <button
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#f1f5f9',
                        color: '#475569',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 500,
                        cursor: 'pointer'
                      }}
                    >
                      Move
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredCandidates.length === 0 && (
          <div style={{
            padding: '48px',
            textAlign: 'center',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
            <div style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>
              No candidates in this pass
            </div>
            <div style={{ fontSize: '14px', color: '#64748b' }}>
              Candidates will appear here once they reach this stage
            </div>
          </div>
        )}
      </div>

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
        <span>💬</span> Support
      </button>
    </div>
  );
}
