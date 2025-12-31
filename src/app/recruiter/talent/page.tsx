'use client';

import { useState } from 'react';
import Link from 'next/link';

// ============================================
// B2Recruiter - Talent Pool
// Cross-company candidate management
// Talent Passports - shareable candidate profiles
// Bulk operations and shortlisting
// ============================================

// Types
interface TalentCandidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  currentTitle: string;
  currentCompany: string;
  yearsExperience: number;
  salary: string;
  noticePeriod: string;
  availability: 'immediate' | '2_weeks' | '1_month' | '2_months' | '3_months';
  skills: string[];
  qualifications: string[];
  score: number;
  source: string;
  addedDate: string;
  lastContact: string;
  status: 'available' | 'interviewing' | 'placed' | 'unavailable';
  notes: string;
  submittedTo: { client: string; role: string; status: string }[];
}

interface ShortlistItem {
  candidateId: string;
  clientId: string;
  roleId: string;
  addedAt: string;
}

// Mock data
const MOCK_TALENT: TalentCandidate[] = [
  {
    id: '1',
    name: 'Thabo Molefe',
    email: 'thabo.molefe@gmail.com',
    phone: '+27 82 123 4567',
    location: 'Johannesburg',
    currentTitle: 'Senior Financial Analyst',
    currentCompany: 'Investec',
    yearsExperience: 8,
    salary: 'R750,000',
    noticePeriod: '1 month',
    availability: '1_month',
    skills: ['Financial Modeling', 'Risk Analysis', 'SQL', 'Power BI', 'Python'],
    qualifications: ['CA(SA)', 'CFA Level II', 'BCom Honours - Finance'],
    score: 87,
    source: 'LinkedIn',
    addedDate: '2024-11-15',
    lastContact: '2024-12-20',
    status: 'available',
    notes: 'Strong candidate, looking for senior role. Prefers hybrid work.',
    submittedTo: [
      { client: 'Standard Bank', role: 'Senior Analyst - Risk', status: 'interviewing' },
    ],
  },
  {
    id: '2',
    name: 'Sarah van der Berg',
    email: 'sarah.vdb@outlook.com',
    phone: '+27 83 987 6543',
    location: 'Cape Town',
    currentTitle: 'Property Manager',
    currentCompany: 'Pam Golding',
    yearsExperience: 12,
    salary: 'R550,000',
    noticePeriod: '2 weeks',
    availability: '2_weeks',
    skills: ['Property Management', 'Lease Negotiations', 'Tenant Relations', 'Budgeting', 'Maintenance Coordination'],
    qualifications: ['NQF5 Real Estate', 'FETC Management'],
    score: 92,
    source: 'Referral',
    addedDate: '2024-10-20',
    lastContact: '2024-12-23',
    status: 'interviewing',
    notes: 'Excellent track record. Multiple offers expected.',
    submittedTo: [
      { client: 'Mafadi Property Group', role: 'Senior Property Manager', status: 'offer' },
    ],
  },
  {
    id: '3',
    name: 'Priya Naidoo',
    email: 'priya.naidoo@gmail.com',
    phone: '+27 84 555 1234',
    location: 'Durban',
    currentTitle: 'Data Analyst',
    currentCompany: 'Vodacom',
    yearsExperience: 4,
    salary: 'R480,000',
    noticePeriod: '1 month',
    availability: '1_month',
    skills: ['Data Analysis', 'Python', 'SQL', 'Tableau', 'Machine Learning', 'Statistics'],
    qualifications: ['BSc Computer Science', 'Google Data Analytics Certificate'],
    score: 78,
    source: 'Job Board',
    addedDate: '2024-12-10',
    lastContact: '2024-12-24',
    status: 'available',
    notes: 'Relocating to JHB. Strong technical skills.',
    submittedTo: [
      { client: 'Discovery Health', role: 'Product Manager', status: 'submitted' },
    ],
  },
  {
    id: '4',
    name: 'John Dlamini',
    email: 'john.dlamini@yahoo.com',
    phone: '+27 76 222 3333',
    location: 'Pretoria',
    currentTitle: 'Financial Controller',
    currentCompany: 'TFG',
    yearsExperience: 15,
    salary: 'R950,000',
    noticePeriod: '2 months',
    availability: '2_months',
    skills: ['Financial Reporting', 'IFRS', 'Management Accounting', 'Team Leadership', 'SAP'],
    qualifications: ['CA(SA)', 'MBA', 'BCom Accounting'],
    score: 85,
    source: 'Database',
    addedDate: '2024-09-01',
    lastContact: '2024-12-15',
    status: 'placed',
    notes: 'Placed at Woolworths. Start date Jan 2025.',
    submittedTo: [
      { client: 'Woolworths Holdings', role: 'Financial Controller', status: 'placed' },
    ],
  },
  {
    id: '5',
    name: 'Lisa Chen',
    email: 'lisa.chen@proton.me',
    phone: '+27 71 444 5555',
    location: 'Johannesburg',
    currentTitle: 'HR Business Partner',
    currentCompany: 'Accenture',
    yearsExperience: 6,
    salary: 'R620,000',
    noticePeriod: '1 month',
    availability: '1_month',
    skills: ['HRBP', 'Talent Management', 'Employee Relations', 'Change Management', 'HRIS'],
    qualifications: ['BCom HR Management', 'SABPP Registered'],
    score: 81,
    source: 'LinkedIn',
    addedDate: '2024-11-28',
    lastContact: '2024-12-22',
    status: 'available',
    notes: 'Seeking leadership role. Open to relocation.',
    submittedTo: [
      { client: 'Standard Bank', role: 'HR Manager', status: 'rejected' },
    ],
  },
  {
    id: '6',
    name: 'Michael Botha',
    email: 'mbotha@gmail.com',
    phone: '+27 82 777 8888',
    location: 'Cape Town',
    currentTitle: 'Software Engineer',
    currentCompany: 'Takealot',
    yearsExperience: 5,
    salary: 'R720,000',
    noticePeriod: '1 month',
    availability: '1_month',
    skills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'AWS', 'PostgreSQL'],
    qualifications: ['BSc Computer Science', 'AWS Certified Developer'],
    score: 89,
    source: 'GitHub',
    addedDate: '2024-12-01',
    lastContact: '2024-12-24',
    status: 'available',
    notes: 'Strong full-stack developer. Multiple companies interested.',
    submittedTo: [],
  },
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
const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, { bg: string; text: string }> = {
    available: { bg: '#D1FAE5', text: '#065F46' },
    interviewing: { bg: '#FEF3C7', text: '#92400E' },
    placed: { bg: '#DBEAFE', text: '#1E40AF' },
    unavailable: { bg: '#F1F5F9', text: '#64748B' },
  };
  const style = styles[status] || styles.unavailable;
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
      {status.replace('_', ' ')}
    </span>
  );
};

// Availability Badge
const AvailabilityBadge = ({ availability }: { availability: string }) => {
  const labels: Record<string, string> = {
    immediate: 'Immediate',
    '2_weeks': '2 Weeks',
    '1_month': '1 Month',
    '2_months': '2 Months',
    '3_months': '3+ Months',
  };
  return (
    <span style={{
      padding: '2px 8px',
      borderRadius: '4px',
      fontSize: '0.6875rem',
      fontWeight: 500,
      backgroundColor: availability === 'immediate' ? '#ECFDF5' : '#F1F5F9',
      color: availability === 'immediate' ? '#059669' : '#64748B',
    }}>
      {labels[availability] || availability}
    </span>
  );
};

export default function TalentPoolPage() {
  const [talent, setTalent] = useState<TalentCandidate[]>(MOCK_TALENT);
  const [selectedTalent, setSelectedTalent] = useState<TalentCandidate | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showPassport, setShowPassport] = useState(false);
  const [showShortlistModal, setShowShortlistModal] = useState(false);

  // Filter talent
  const filteredTalent = talent.filter(t => {
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesLocation = locationFilter === 'all' || t.location === locationFilter;
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.currentTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
      t.qualifications.some(q => q.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesLocation && matchesSearch;
  });

  // Get unique locations
  const locations = [...new Set(talent.map(t => t.location))];

  // Toggle selection
  const toggleSelection = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // Select all
  const selectAll = () => {
    if (selectedIds.length === filteredTalent.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredTalent.map(t => t.id));
    }
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
            <Link href="/recruiter" style={{ color: '#64748B', textDecoration: 'none', fontSize: '0.9375rem' }}>Dashboard</Link>
            <Link href="/recruiter/clients" style={{ color: '#64748B', textDecoration: 'none', fontSize: '0.9375rem' }}>Clients</Link>
            <Link href="/recruiter/talent" style={{ color: '#4F46E5', fontWeight: 600, textDecoration: 'none', fontSize: '0.9375rem' }}>Talent Pool</Link>
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
              Talent Pool
            </h1>
            <p style={{ color: '#64748B', fontSize: '1rem' }}>
              {filteredTalent.length} candidate{filteredTalent.length !== 1 ? 's' : ''} | {filteredTalent.filter(t => t.status === 'available').length} available
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button style={{
              padding: '12px 20px',
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
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Export
            </button>
            <button style={{
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
              Add Candidate
            </button>
          </div>
        </div>

        {/* Filters & Search */}
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
            placeholder="Search by name, title, skills, or qualifications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              minWidth: '300px',
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
            <option value="available">Available</option>
            <option value="interviewing">Interviewing</option>
            <option value="placed">Placed</option>
            <option value="unavailable">Unavailable</option>
          </select>
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            style={{
              padding: '10px 16px',
              borderRadius: '8px',
              border: '1px solid #E2E8F0',
              fontSize: '0.9375rem',
              backgroundColor: 'white',
              cursor: 'pointer',
            }}
          >
            <option value="all">All Locations</option>
            {locations.map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>

        {/* Bulk Actions */}
        {selectedIds.length > 0 && (
          <div style={{
            backgroundColor: '#EEF2FF',
            borderRadius: '12px',
            padding: '16px 24px',
            marginBottom: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span style={{ color: '#4338CA', fontWeight: 500 }}>
              {selectedIds.length} candidate{selectedIds.length !== 1 ? 's' : ''} selected
            </span>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setShowShortlistModal(true)} style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: '#4F46E5',
                color: 'white',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer',
              }}>
                Shortlist for Client
              </button>
              <button style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: '1px solid #C7D2FE',
                backgroundColor: 'white',
                color: '#4F46E5',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer',
              }}>
                Create Talent Passports
              </button>
              <button style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: '1px solid #C7D2FE',
                backgroundColor: 'white',
                color: '#4F46E5',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer',
              }}>
                Export Selected
              </button>
              <button onClick={() => setSelectedIds([])} style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: 'transparent',
                color: '#64748B',
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}>
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Two Column Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: selectedTalent ? '1fr 400px' : '1fr', gap: '24px' }}>
          {/* Talent List */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            border: '1px solid #E2E8F0',
            overflow: 'hidden',
          }}>
            {/* List Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              backgroundColor: '#F8FAFC',
            }}>
              <input
                type="checkbox"
                checked={selectedIds.length === filteredTalent.length && filteredTalent.length > 0}
                onChange={selectAll}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '0.8125rem', color: '#64748B', fontWeight: 500 }}>Select All</span>
            </div>

            {/* Talent Cards */}
            <div>
              {filteredTalent.map((candidate) => (
                <div
                  key={candidate.id}
                  onClick={() => setSelectedTalent(candidate)}
                  style={{
                    padding: '20px',
                    borderBottom: '1px solid #F1F5F9',
                    cursor: 'pointer',
                    backgroundColor: selectedTalent?.id === candidate.id ? '#F5F3FF' : 'transparent',
                    transition: 'background-color 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(candidate.id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        toggleSelection(candidate.id);
                      }}
                      style={{ width: '18px', height: '18px', cursor: 'pointer', flexShrink: 0, marginTop: '4px' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                            <span style={{ fontWeight: 600, color: '#0F172A', fontSize: '1rem' }}>{candidate.name}</span>
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
                          <div style={{ fontSize: '0.875rem', color: '#64748B' }}>
                            {candidate.currentTitle} at {candidate.currentCompany}
                          </div>
                        </div>
                        <StatusBadge status={candidate.status} />
                      </div>
                      <div style={{ display: 'flex', gap: '16px', marginBottom: '12px', fontSize: '0.8125rem', color: '#64748B' }}>
                        <span>{candidate.location}</span>
                        <span>{candidate.yearsExperience} years exp</span>
                        <span>{candidate.salary}</span>
                        <AvailabilityBadge availability={candidate.availability} />
                      </div>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {candidate.skills.slice(0, 5).map((skill, idx) => (
                          <span key={idx} style={{
                            padding: '4px 10px',
                            backgroundColor: '#F1F5F9',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            color: '#475569',
                          }}>
                            {skill}
                          </span>
                        ))}
                        {candidate.skills.length > 5 && (
                          <span style={{
                            padding: '4px 10px',
                            backgroundColor: '#F1F5F9',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            color: '#94A3B8',
                          }}>
                            +{candidate.skills.length - 5} more
                          </span>
                        )}
                      </div>
                      {candidate.submittedTo.length > 0 && (
                        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #F1F5F9' }}>
                          <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginBottom: '6px' }}>Submitted to:</div>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {candidate.submittedTo.map((sub, idx) => (
                              <span key={idx} style={{
                                padding: '4px 10px',
                                backgroundColor: sub.status === 'placed' ? '#D1FAE5' : sub.status === 'offer' ? '#FEF3C7' : '#EEF2FF',
                                borderRadius: '6px',
                                fontSize: '0.6875rem',
                                color: sub.status === 'placed' ? '#065F46' : sub.status === 'offer' ? '#92400E' : '#4338CA',
                              }}>
                                {sub.client} - {sub.role} ({sub.status})
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Candidate Detail Panel */}
          {selectedTalent && (
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
              position: 'sticky',
              top: '100px',
              height: 'fit-content',
              maxHeight: 'calc(100vh - 132px)',
              overflowY: 'auto',
            }}>
              <div style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                  <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>
                      {selectedTalent.name}
                    </h2>
                    <p style={{ color: '#64748B', fontSize: '0.9375rem' }}>
                      {selectedTalent.currentTitle}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedTalent(null)}
                    style={{
                      padding: '8px',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      cursor: 'pointer',
                      color: '#94A3B8',
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>

                {/* Quick Info */}
                <div style={{
                  backgroundColor: '#F8FAFC',
                  borderRadius: '8px',
                  padding: '16px',
                  marginBottom: '20px',
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.875rem' }}>
                    <div>
                      <span style={{ color: '#94A3B8' }}>Location: </span>
                      <span style={{ color: '#0F172A', fontWeight: 500 }}>{selectedTalent.location}</span>
                    </div>
                    <div>
                      <span style={{ color: '#94A3B8' }}>Experience: </span>
                      <span style={{ color: '#0F172A', fontWeight: 500 }}>{selectedTalent.yearsExperience} years</span>
                    </div>
                    <div>
                      <span style={{ color: '#94A3B8' }}>Salary: </span>
                      <span style={{ color: '#0F172A', fontWeight: 500 }}>{selectedTalent.salary}</span>
                    </div>
                    <div>
                      <span style={{ color: '#94A3B8' }}>Notice: </span>
                      <span style={{ color: '#0F172A', fontWeight: 500 }}>{selectedTalent.noticePeriod}</span>
                    </div>
                  </div>
                </div>

                {/* Contact */}
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#64748B', marginBottom: '8px' }}>Contact</h3>
                  <div style={{ fontSize: '0.875rem', color: '#0F172A' }}>
                    <div style={{ marginBottom: '4px' }}>{selectedTalent.email}</div>
                    <div>{selectedTalent.phone}</div>
                  </div>
                </div>

                {/* Qualifications */}
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#64748B', marginBottom: '8px' }}>Qualifications</h3>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {selectedTalent.qualifications.map((qual, idx) => (
                      <span key={idx} style={{
                        padding: '6px 12px',
                        backgroundColor: '#ECFDF5',
                        borderRadius: '6px',
                        fontSize: '0.8125rem',
                        color: '#065F46',
                        fontWeight: 500,
                      }}>
                        {qual}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Skills */}
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#64748B', marginBottom: '8px' }}>Skills</h3>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {selectedTalent.skills.map((skill, idx) => (
                      <span key={idx} style={{
                        padding: '4px 10px',
                        backgroundColor: '#F1F5F9',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        color: '#475569',
                      }}>
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#64748B', marginBottom: '8px' }}>Notes</h3>
                  <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: 1.5 }}>
                    {selectedTalent.notes}
                  </p>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <button onClick={() => setShowPassport(true)} style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#4F46E5',
                    color: 'white',
                    fontSize: '0.9375rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}>
                    Create Talent Passport
                  </button>
                  <button style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    backgroundColor: 'white',
                    color: '#0F172A',
                    fontSize: '0.9375rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}>
                    Shortlist for Client
                  </button>
                  <button style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    backgroundColor: 'white',
                    color: '#0F172A',
                    fontSize: '0.9375rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}>
                    Schedule Call
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Talent Passport Modal */}
      {showPassport && selectedTalent && (
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
          padding: '32px',
        }} onClick={() => setShowPassport(false)}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '700px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
          }} onClick={(e) => e.stopPropagation()}>
            {/* Passport Header */}
            <div style={{
              padding: '32px',
              background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
              color: 'white',
              borderRadius: '16px 16px 0 0',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, opacity: 0.8, marginBottom: '8px', letterSpacing: '0.1em' }}>
                    TALENT PASSPORT
                  </div>
                  <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '4px' }}>
                    {selectedTalent.name}
                  </h2>
                  <p style={{ opacity: 0.9, fontSize: '1.125rem' }}>
                    {selectedTalent.currentTitle}
                  </p>
                </div>
                <div style={{
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  borderRadius: '12px',
                  padding: '12px 24px',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: '2rem', fontWeight: 700 }}>{selectedTalent.score}</div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>AI Score</div>
                </div>
              </div>
            </div>

            {/* Passport Body */}
            <div style={{ padding: '32px' }}>
              {/* Overview */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '16px',
                marginBottom: '32px',
              }}>
                <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#F8FAFC', borderRadius: '8px' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A' }}>{selectedTalent.yearsExperience}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Years Experience</div>
                </div>
                <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#F8FAFC', borderRadius: '8px' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A' }}>{selectedTalent.location}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Location</div>
                </div>
                <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#F8FAFC', borderRadius: '8px' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A' }}>{selectedTalent.salary}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Current Package</div>
                </div>
                <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#ECFDF5', borderRadius: '8px' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#059669' }}>{selectedTalent.noticePeriod}</div>
                  <div style={{ fontSize: '0.75rem', color: '#065F46' }}>Notice Period</div>
                </div>
              </div>

              {/* Qualifications */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0F172A', marginBottom: '12px' }}>Qualifications</h3>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {selectedTalent.qualifications.map((qual, idx) => (
                    <span key={idx} style={{
                      padding: '8px 16px',
                      backgroundColor: '#ECFDF5',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      color: '#065F46',
                      fontWeight: 500,
                    }}>
                      {qual}
                    </span>
                  ))}
                </div>
              </div>

              {/* Key Skills */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0F172A', marginBottom: '12px' }}>Key Skills</h3>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {selectedTalent.skills.map((skill, idx) => (
                    <span key={idx} style={{
                      padding: '6px 14px',
                      backgroundColor: '#EEF2FF',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      color: '#4338CA',
                    }}>
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Current Role */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0F172A', marginBottom: '12px' }}>Current Position</h3>
                <div style={{
                  padding: '16px',
                  backgroundColor: '#F8FAFC',
                  borderRadius: '8px',
                }}>
                  <div style={{ fontWeight: 600, color: '#0F172A', marginBottom: '4px' }}>{selectedTalent.currentTitle}</div>
                  <div style={{ color: '#64748B' }}>{selectedTalent.currentCompany}</div>
                </div>
              </div>

              {/* Recruiter Notes */}
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0F172A', marginBottom: '12px' }}>Recruiter Assessment</h3>
                <div style={{
                  padding: '16px',
                  backgroundColor: '#FFFBEB',
                  borderRadius: '8px',
                  borderLeft: '4px solid #F59E0B',
                }}>
                  <p style={{ fontSize: '0.9375rem', color: '#92400E', lineHeight: 1.6 }}>
                    {selectedTalent.notes}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button style={{
                  flex: 1,
                  padding: '14px',
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                  backgroundColor: 'white',
                  fontSize: '0.9375rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}>
                  Copy Link
                </button>
                <button style={{
                  flex: 1,
                  padding: '14px',
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                  backgroundColor: 'white',
                  fontSize: '0.9375rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}>
                  Download PDF
                </button>
                <button style={{
                  flex: 1,
                  padding: '14px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#4F46E5',
                  color: 'white',
                  fontSize: '0.9375rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}>
                  Send to Client
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shortlist Modal */}
      {showShortlistModal && (
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
        }} onClick={() => setShowShortlistModal(false)}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '32px',
            width: '100%',
            maxWidth: '480px',
            boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
          }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0F172A', marginBottom: '8px' }}>
              Shortlist for Client
            </h2>
            <p style={{ color: '#64748B', marginBottom: '24px' }}>
              Select a client and role to shortlist {selectedIds.length} candidate{selectedIds.length !== 1 ? 's' : ''}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                  Client
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
                  <option>Select a client...</option>
                  <option>Mafadi Property Group</option>
                  <option>Standard Bank</option>
                  <option>Discovery Health</option>
                  <option>Woolworths Holdings</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                  Role
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
                  <option>Select a role...</option>
                  <option>Senior Property Manager</option>
                  <option>Financial Controller</option>
                  <option>Senior Analyst - Risk</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                  Notes for Client
                </label>
                <textarea rows={3} placeholder="Why these candidates are a good fit..." style={{
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
              <button onClick={() => setShowShortlistModal(false)} style={{
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
                Submit Shortlist
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
