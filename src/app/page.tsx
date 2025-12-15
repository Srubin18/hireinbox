'use client';

import { useState, useEffect } from 'react';

interface Reference {
  name: string | null;
  title: string | null;
  company: string | null;
  phone: string | null;
  email: string | null;
  relationship: string | null;
}

interface Candidate {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  score: number | null;
  status: string;
  ai_reasoning: string | null;
  strengths: string[] | null;
  missing: string[] | null;
  cv_text: string | null;
  created_at: string;
  candidate_references: Reference[] | null;
  has_references: boolean;
}

interface Role {
  id: string;
  title: string;
  status: string;
  criteria: {
    min_experience_years: number;
    required_skills: string[];
    preferred_skills: string[];
    locations: string[];
    education?: string;
    dealbreakers?: string[];
  };
}

export default function Dashboard() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [cvText, setCvText] = useState('');
  const [isScreening, setIsScreening] = useState(false);
  const [activeTab, setActiveTab] = useState('new');
  const [showNewRoleModal, setShowNewRoleModal] = useState(false);
  const [criteriaExpanded, setCriteriaExpanded] = useState(false);
  const [isFetchingEmails, setIsFetchingEmails] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  
  const [newRole, setNewRole] = useState({
    title: '',
    min_experience_years: 3,
    required_skills: [''],
    preferred_skills: [''],
    locations: [] as string[],
    education: 'degree_preferred',
    dealbreakers: [] as string[],
  });

  useEffect(() => {
    fetchRoles();
    fetchCandidates();
  }, []);

  const fetchRoles = async () => {
    const res = await fetch('/api/roles');
    if (res.ok) {
      const data = await res.json();
      setRoles(data.roles || []);
      if (data.roles?.length > 0) {
        setSelectedRole(data.roles[0].id);
      }
    }
  };

  const fetchCandidates = async () => {
    const res = await fetch('/api/candidates');
    if (res.ok) {
      const data = await res.json();
      setCandidates(data.candidates || []);
    }
  };

  const handleFetchEmails = async () => {
    setIsFetchingEmails(true);
    try {
      const res = await fetch('/api/fetch-emails', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.processed > 0) {
          fetchCandidates();
        }
        alert(`Processed ${data.processed} new emails`);
      } else {
        alert('Failed to fetch emails');
      }
    } catch (error) {
      console.error('Email fetch failed:', error);
      alert('Failed to fetch emails');
    }
    setIsFetchingEmails(false);
  };

  const handleScreenCV = async () => {
    if (!cvText.trim() || !selectedRole) return;
    
    setIsScreening(true);
    try {
      const res = await fetch('/api/screen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cvText, roleId: selectedRole }),
      });
      
      if (res.ok) {
        const data = await res.json();
        setCandidates(prev => [data.candidate, ...prev]);
        setCvText('');
      }
    } catch (error) {
      console.error('Screening failed:', error);
    }
    setIsScreening(false);
  };

  const filteredCandidates = candidates.filter(c => {
    if (activeTab === 'new') return true;
    if (activeTab === 'shortlist') return c.status === 'shortlist';
    if (activeTab === 'talent_pool') return c.status === 'talent_pool';
    if (activeTab === 'reject') return c.status === 'reject';
    return true;
  });

  const getInitials = (name: string | null) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const formatPhoneForWhatsApp = (phone: string) => {
    return phone.replace(/[^0-9]/g, '').replace(/^0/, '27');
  };

  const currentRole = roles.find(r => r.id === selectedRole);

  const shortlistedCandidates = candidates.filter(c => c.status === 'shortlist');
  const avgScore = shortlistedCandidates.length > 0 
    ? Math.round(shortlistedCandidates.reduce((sum, c) => sum + (c.score || 0), 0) / shortlistedCandidates.length)
    : 0;

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      {/* Sidebar */}
      <aside className="w-[260px] bg-white border-r border-[#e2e8f0] flex flex-col fixed top-0 left-0 bottom-0 z-50">
        <div className="p-5 border-b border-[#e2e8f0]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-[#4f46e5] rounded-[10px] flex items-center justify-center relative">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
              </svg>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#10B981] rounded-full border-2 border-white"></div>
            </div>
            <span className="text-[1.2rem] font-extrabold tracking-tight text-[#0f172a]">HireInbox</span>
          </div>
        </div>

        <nav className="flex-1 p-3 overflow-y-auto">
          <div className="mb-6">
            <div className="text-[0.7rem] font-semibold text-[#64748b] uppercase tracking-wider px-3 mb-2">Overview</div>
            <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[#eef2ff] text-[#4f46e5] font-medium text-sm">
              <span>📊</span> Dashboard
            </a>
            <button 
              onClick={handleFetchEmails}
              disabled={isFetchingEmails}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#475569] hover:bg-[#f8fafc] font-medium text-sm mt-0.5 w-full text-left"
            >
              <span>📧</span> {isFetchingEmails ? 'Checking...' : 'Check Inbox'}
              <span className="ml-auto bg-[#f97316] text-white text-[0.7rem] font-bold px-2 py-0.5 rounded-full">
                {candidates.filter(c => c.status === 'new').length || '0'}
              </span>
            </button>
          </div>

          <div className="mb-6">
            <div className="text-[0.7rem] font-semibold text-[#64748b] uppercase tracking-wider px-3 mb-2">Candidates</div>
            <a href="#" onClick={() => setActiveTab('shortlist')} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#475569] hover:bg-[#f8fafc] font-medium text-sm">
              <span>✓</span> Shortlisted
              <span className="ml-auto bg-[#4f46e5] text-white text-[0.7rem] font-bold px-2 py-0.5 rounded-full">
                {candidates.filter(c => c.status === 'shortlist').length}
              </span>
            </a>
            <a href="#" onClick={() => setActiveTab('talent_pool')} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#475569] hover:bg-[#f8fafc] font-medium text-sm mt-0.5">
              <span>🧠</span> Talent Pool
              <span className="ml-auto bg-[#4f46e5] text-white text-[0.7rem] font-bold px-2 py-0.5 rounded-full">
                {candidates.filter(c => c.status === 'talent_pool').length}
              </span>
            </a>
            <a href="#" onClick={() => setActiveTab('reject')} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#475569] hover:bg-[#f8fafc] font-medium text-sm mt-0.5">
              <span>✗</span> Rejected
            </a>
          </div>

          <div className="mb-6">
            <div className="text-[0.7rem] font-semibold text-[#64748b] uppercase tracking-wider px-3 mb-2">Roles</div>
            {roles.map(role => (
              <a 
                key={role.id} 
                href="#" 
                onClick={(e) => { e.preventDefault(); setSelectedRole(role.id); }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm mt-0.5 ${
                  selectedRole === role.id ? 'bg-[#f8fafc] text-[#0f172a]' : 'text-[#475569] hover:bg-[#f8fafc]'
                }`}
              >
                <span>💼</span> {role.title}
              </a>
            ))}
            <button 
              onClick={() => setShowNewRoleModal(true)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#4f46e5] hover:bg-[#f8fafc] font-medium text-sm mt-0.5 w-full"
            >
              <span>+</span> Add New Role
            </button>
          </div>

          <div>
            <div className="text-[0.7rem] font-semibold text-[#64748b] uppercase tracking-wider px-3 mb-2">Settings</div>
            <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#475569] hover:bg-[#f8fafc] font-medium text-sm">
              <span>⚙️</span> Company Settings
            </a>
            <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#475569] hover:bg-[#f8fafc] font-medium text-sm mt-0.5">
              <span>👥</span> Team
            </a>
            <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#475569] hover:bg-[#f8fafc] font-medium text-sm mt-0.5">
              <span>💳</span> Billing
            </a>
          </div>
        </nav>

        <div className="p-4 border-t border-[#e2e8f0]">
          <div className="flex items-center gap-3 p-2.5 rounded-lg bg-[#f8fafc]">
            <div className="w-9 h-9 rounded-full bg-[#4f46e5] text-white flex items-center justify-center font-bold text-sm">SM</div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-[#0f172a]">Simon M.</div>
              <div className="text-xs text-[#64748b] truncate">simon@acme.co.za</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-[260px]">
        <header className="bg-white border-b border-[#e2e8f0] px-8 py-4 flex items-center justify-between sticky top-0 z-40">
          <h1 className="text-[1.25rem] font-bold text-[#0f172a]">Dashboard</h1>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleFetchEmails}
              disabled={isFetchingEmails}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[#e2e8f0] rounded-lg text-sm font-semibold text-[#0f172a] hover:border-[#4f46e5] hover:text-[#4f46e5] transition-colors disabled:opacity-50"
            >
              <span>📧</span> {isFetchingEmails ? 'Checking...' : 'Check Emails'}
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[#e2e8f0] rounded-lg text-sm font-semibold text-[#0f172a] hover:border-[#4f46e5] hover:text-[#4f46e5] transition-colors">
              <span>📄</span> Upload CV
            </button>
            <button 
              onClick={() => setShowNewRoleModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#4f46e5] rounded-lg text-sm font-semibold text-white hover:bg-[#4338ca] transition-colors shadow-sm"
            >
              <span>+</span> New Role
            </button>
          </div>
        </header>

        <div className="p-8">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-5 mb-8">
            <div className="bg-white border border-[#e2e8f0] rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-[10px] bg-[#eef2ff] flex items-center justify-center text-lg">📧</div>
                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-[#ecfdf5] text-[#059669]">↑ 12%</span>
              </div>
              <div className="text-[2rem] font-extrabold text-[#0f172a] tracking-tight">{candidates.length}</div>
              <div className="text-sm text-[#64748b]">CVs this month</div>
            </div>
            <div className="bg-white border border-[#e2e8f0] rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-[10px] bg-[#ecfdf5] flex items-center justify-center text-lg">✓</div>
                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-[#ecfdf5] text-[#059669]">↑ 8%</span>
              </div>
              <div className="text-[2rem] font-extrabold text-[#0f172a] tracking-tight">
                {candidates.filter(c => c.status === 'shortlist').length}
              </div>
              <div className="text-sm text-[#64748b]">Shortlisted</div>
            </div>
            <div className="bg-white border border-[#e2e8f0] rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-[10px] bg-[#fffbeb] flex items-center justify-center text-lg">🧠</div>
              </div>
              <div className="text-[2rem] font-extrabold text-[#0f172a] tracking-tight">
                {candidates.filter(c => c.status === 'talent_pool').length}
              </div>
              <div className="text-sm text-[#64748b]">In Talent Pool</div>
            </div>
            <div className="bg-gradient-to-br from-[#eef2ff] to-[#fff7ed] border border-[rgba(79,70,229,0.2)] rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-[10px] bg-[#fff7ed] flex items-center justify-center text-lg">⏱️</div>
              </div>
              <div className="text-[2rem] font-extrabold text-[#4f46e5] tracking-tight">
                {(candidates.length * 4.5).toFixed(1)}h
              </div>
              <div className="text-sm text-[#64748b]">Time saved</div>
              <div className="text-xs font-semibold text-[#4f46e5] mt-1">≈ R{(candidates.length * 200).toLocaleString()} in admin costs</div>
            </div>
          </div>

          {/* Shortlist Summary */}
          {shortlistedCandidates.length > 0 && (
            <div className="bg-gradient-to-r from-[#ecfdf5] to-[#f0fdf4] border border-[#bbf7d0] rounded-xl p-5 mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-[#166534] text-lg">📋 Shortlist Summary</h3>
                  <p className="text-[#15803d] text-sm mt-1">
                    {shortlistedCandidates.length} candidate{shortlistedCandidates.length > 1 ? 's' : ''} ready for interview • Average score: {avgScore}/100
                  </p>
                </div>
                <button 
                  onClick={() => setActiveTab('shortlist')}
                  className="px-4 py-2 bg-[#166534] text-white rounded-lg text-sm font-semibold hover:bg-[#15803d] transition-colors"
                >
                  View All →
                </button>
              </div>
            </div>
          )}

          {/* Main Grid */}
          <div className="grid grid-cols-[1fr_380px] gap-6">
            {/* Candidate List Panel */}
            <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden">
              <div className="flex gap-1 px-4 border-b border-[#e2e8f0] bg-[#f8fafc]">
                {[
                  { id: 'new', label: 'All', count: candidates.length },
                  { id: 'shortlist', label: 'Shortlisted', count: candidates.filter(c => c.status === 'shortlist').length },
                  { id: 'talent_pool', label: 'Talent Pool', count: candidates.filter(c => c.status === 'talent_pool').length },
                  { id: 'reject', label: 'Rejected', count: candidates.filter(c => c.status === 'reject').length },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-3 text-[0.85rem] font-semibold transition-colors border-b-2 -mb-[1px] ${
                      activeTab === tab.id
                        ? 'text-[#4f46e5] border-[#4f46e5] bg-white'
                        : 'text-[#64748b] border-transparent hover:text-[#475569]'
                    }`}
                  >
                    {tab.label}
                    <span className={`ml-1.5 px-2 py-0.5 rounded-full text-xs ${
                      activeTab === tab.id ? 'bg-[#eef2ff] text-[#4f46e5]' : 'bg-[#f1f5f9]'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              <div className="p-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#ecfdf5] border border-[rgba(5,150,105,0.2)] rounded-full text-xs font-semibold text-[#059669] mb-4">
                  <span className="w-1.5 h-1.5 bg-[#059669] rounded-full animate-pulse"></span>
                  Live — updates as CVs arrive
                </div>

                <div className="space-y-2.5">
                  {filteredCandidates.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-[#f8fafc] rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">📧</div>
                      <div className="font-semibold text-[#0f172a] mb-2">No candidates yet</div>
                      <div className="text-sm text-[#64748b]">Paste a CV on the right or click Check Emails</div>
                    </div>
                  ) : (
                    filteredCandidates.map(candidate => (
                      <div
                        key={candidate.id}
                        onClick={() => setSelectedCandidate(candidate)}
                        className={`flex items-center gap-3.5 p-3.5 rounded-[10px] border transition-all cursor-pointer hover:border-[#4f46e5] hover:shadow-[0_0_0_3px_#eef2ff] ${
                          candidate.status === 'shortlist' ? 'bg-[#f0fdf4] border-[#bbf7d0]' :
                          candidate.status === 'talent_pool' ? 'bg-[#eef2ff] border-[#c7d2fe]' :
                          candidate.status === 'reject' ? 'bg-[#fef2f2] border-[#fecaca]' :
                          'bg-[#fff7ed] border-[#fed7aa]'
                        }`}
                      >
                        <div className={`w-11 h-11 rounded-[10px] flex items-center justify-center font-bold text-sm ${
                          candidate.status === 'shortlist' ? 'bg-[#dcfce7] text-[#166534]' :
                          candidate.status === 'talent_pool' ? 'bg-[#e0e7ff] text-[#4f46e5]' :
                          candidate.status === 'reject' ? 'bg-[#fee2e2] text-[#991b1b]' :
                          'bg-[#ffedd5] text-[#c2410c]'
                        }`}>
                          {getInitials(candidate.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-[0.9rem] text-[#0f172a]">{candidate.name || 'Unknown'}</div>
                          <div className="text-xs text-[#64748b] truncate">{candidate.ai_reasoning}</div>
                          <div className="text-xs text-[#94a3b8]">{getTimeAgo(candidate.created_at)}</div>
                        </div>
                        <div className="text-right">
                          <div className={`text-xl font-bold ${
                            candidate.status === 'shortlist' ? 'text-[#166534]' :
                            candidate.status === 'talent_pool' ? 'text-[#4f46e5]' :
                            'text-[#991b1b]'
                          }`}>
                            {candidate.score || '--'}
                          </div>
                          <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold ${
                            candidate.status === 'shortlist' ? 'bg-[#dcfce7] text-[#166534]' :
                            candidate.status === 'talent_pool' ? 'bg-[#e0e7ff] text-[#4f46e5]' :
                            'bg-[#fee2e2] text-[#991b1b]'
                          }`}>
                            {candidate.status === 'shortlist' && '✓ Shortlisted'}
                            {candidate.status === 'talent_pool' && '→ Talent Pool'}
                            {candidate.status === 'reject' && '✗ Rejected'}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Right Panel */}
            <div className="space-y-6">
              {currentRole && (
                <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden">
                  <div className="p-5 border-b border-[#e2e8f0]">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-[#0f172a]">{currentRole.title}</h3>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[0.7rem] font-semibold uppercase bg-[#ecfdf5] text-[#059669] mt-1">
                          <span className="w-1.5 h-1.5 bg-[#059669] rounded-full animate-pulse"></span>
                          Active
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="text-center p-3 bg-[#f8fafc] rounded-lg">
                        <div className="text-xl font-bold text-[#059669]">{candidates.filter(c => c.status === 'shortlist').length}</div>
                        <div className="text-[0.7rem] text-[#64748b] uppercase">Shortlisted</div>
                      </div>
                      <div className="text-center p-3 bg-[#f8fafc] rounded-lg">
                        <div className="text-xl font-bold text-[#4f46e5]">{candidates.filter(c => c.status === 'talent_pool').length}</div>
                        <div className="text-[0.7rem] text-[#64748b] uppercase">Pooled</div>
                      </div>
                      <div className="text-center p-3 bg-[#f8fafc] rounded-lg">
                        <div className="text-xl font-bold text-[#64748b]">{candidates.filter(c => c.status === 'reject').length}</div>
                        <div className="text-[0.7rem] text-[#64748b] uppercase">Rejected</div>
                      </div>
                    </div>

                    <button 
                      onClick={() => setCriteriaExpanded(!criteriaExpanded)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-[#4f46e5] hover:underline"
                    >
                      <span>{criteriaExpanded ? '▼' : '▶'}</span>
                      {criteriaExpanded ? 'Hide criteria' : 'View criteria'}
                    </button>

                    {criteriaExpanded && (
                      <div className="mt-3 space-y-3">
                        <div>
                          <div className="text-[0.7rem] font-semibold text-[#64748b] uppercase tracking-wider mb-2">Must Have</div>
                          <div className="flex flex-wrap gap-1.5">
                            <span className="px-2.5 py-1 bg-[#eef2ff] border border-[rgba(79,70,229,0.2)] rounded-md text-xs font-medium text-[#4f46e5]">
                              {currentRole.criteria.min_experience_years}+ years
                            </span>
                            {currentRole.criteria.required_skills?.map(skill => (
                              <span key={skill} className="px-2.5 py-1 bg-[#eef2ff] border border-[rgba(79,70,229,0.2)] rounded-md text-xs font-medium text-[#4f46e5]">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex gap-2">
                    <button className="flex-1 px-4 py-2.5 bg-white border border-[#e2e8f0] rounded-lg text-sm font-semibold text-[#0f172a] hover:border-[#4f46e5] hover:text-[#4f46e5] transition-colors">
                      Edit Criteria
                    </button>
                    <button className="flex-1 px-4 py-2.5 bg-white border border-[#e2e8f0] rounded-lg text-sm font-semibold text-[#0f172a] hover:border-[#4f46e5] hover:text-[#4f46e5] transition-colors">
                      Pause
                    </button>
                  </div>
                </div>
              )}

              <div className="bg-white border border-[#e2e8f0] rounded-xl p-5">
                <h3 className="font-bold text-[#0f172a] mb-3">Screen a CV</h3>
                <textarea
                  value={cvText}
                  onChange={(e) => setCvText(e.target.value)}
                  placeholder="Paste CV text here..."
                  className="w-full h-48 px-3 py-2 border border-[#e2e8f0] rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent placeholder:text-[#94a3b8]"
                />
                <button
                  onClick={handleScreenCV}
                  disabled={isScreening || !cvText.trim() || !selectedRole}
                  className="w-full mt-3 px-4 py-2.5 bg-[#4f46e5] text-white rounded-lg font-semibold hover:bg-[#4338ca] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isScreening ? 'Screening...' : 'Screen CV'}
                </button>
              </div>

              <div className="bg-gradient-to-br from-[#eef2ff] to-[#fff7ed] border border-[rgba(79,70,229,0.2)] rounded-xl p-4">
                <div className="font-bold text-[0.9rem] text-[#0f172a] mb-1">📧 Your Application Email</div>
                <div className="text-sm text-[#475569] mb-2">Applicants send CVs to:</div>
                <code className="block bg-white px-3 py-2 rounded-lg text-sm font-mono text-[#4f46e5] border border-[#e2e8f0]">
                  ssrubin18+hireinbox@gmail.com
                </code>
                <div className="text-xs text-[#64748b] mt-2">CVs will appear here automatically</div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Candidate Detail Modal */}
      {selectedCandidate && (
        <div className="fixed inset-0 bg-[rgba(15,23,42,0.6)] backdrop-blur-sm flex items-center justify-center z-[200]">
          <div className="bg-white rounded-2xl w-full max-w-[700px] max-h-[90vh] overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[#e2e8f0]">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center font-bold text-lg ${
                  selectedCandidate.status === 'shortlist' ? 'bg-[#dcfce7] text-[#166534]' :
                  selectedCandidate.status === 'talent_pool' ? 'bg-[#e0e7ff] text-[#4f46e5]' :
                  'bg-[#fee2e2] text-[#991b1b]'
                }`}>
                  {getInitials(selectedCandidate.name)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#0f172a]">{selectedCandidate.name || 'Unknown'}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold ${
                      selectedCandidate.status === 'shortlist' ? 'bg-[#dcfce7] text-[#166534]' :
                      selectedCandidate.status === 'talent_pool' ? 'bg-[#e0e7ff] text-[#4f46e5]' :
                      'bg-[#fee2e2] text-[#991b1b]'
                    }`}>
                      {selectedCandidate.status === 'shortlist' && '✓ Shortlisted'}
                      {selectedCandidate.status === 'talent_pool' && '→ Talent Pool'}
                      {selectedCandidate.status === 'reject' && '✗ Rejected'}
                    </span>
                    <span className="text-sm text-[#64748b]">{getTimeAgo(selectedCandidate.created_at)}</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setSelectedCandidate(null)}
                className="w-10 h-10 rounded-lg bg-[#f8fafc] text-[#64748b] flex items-center justify-center hover:bg-[#fee2e2] hover:text-[#dc2626] transition-colors text-xl"
              >
                ×
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              {/* Score */}
              <div className="flex items-center gap-6 mb-6">
                <div className={`text-6xl font-extrabold ${
                  selectedCandidate.status === 'shortlist' ? 'text-[#166534]' :
                  selectedCandidate.status === 'talent_pool' ? 'text-[#4f46e5]' :
                  'text-[#991b1b]'
                }`}>
                  {selectedCandidate.score || '--'}
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#64748b] uppercase">AI Score</div>
                  <div className="text-[#0f172a] mt-1">{selectedCandidate.ai_reasoning}</div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-[#f8fafc] rounded-xl">
                  <div className="text-xs font-semibold text-[#64748b] uppercase mb-1">Email</div>
                  <div className="text-[#0f172a] font-medium">{selectedCandidate.email || 'Not provided'}</div>
                </div>
                <div className="p-4 bg-[#f8fafc] rounded-xl">
                  <div className="text-xs font-semibold text-[#64748b] uppercase mb-1">Phone</div>
                  <div className="text-[#0f172a] font-medium">{selectedCandidate.phone || 'Not provided'}</div>
                </div>
              </div>

              {/* Strengths */}
              {selectedCandidate.strengths && selectedCandidate.strengths.length > 0 && (
                <div className="mb-6">
                  <div className="text-sm font-semibold text-[#166534] uppercase mb-2">✓ Strengths</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedCandidate.strengths.map((s, i) => (
                      <span key={i} className="px-3 py-1.5 bg-[#dcfce7] text-[#166534] rounded-lg text-sm font-medium">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Missing */}
              {selectedCandidate.missing && selectedCandidate.missing.length > 0 && (
                <div className="mb-6">
                  <div className="text-sm font-semibold text-[#991b1b] uppercase mb-2">✗ Missing / Gaps</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedCandidate.missing.map((m, i) => (
                      <span key={i} className="px-3 py-1.5 bg-[#fee2e2] text-[#991b1b] rounded-lg text-sm font-medium">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Actions - WhatsApp & Call */}
              {selectedCandidate.phone && (
                <div className="mb-6 p-4 bg-gradient-to-r from-[#dcfce7] to-[#d1fae5] rounded-xl border border-[#bbf7d0]">
                  <div className="text-sm font-semibold text-[#166534] uppercase mb-3">⚡ Quick Contact</div>
                  <div className="flex gap-3">
                    <a
                      href={`https://wa.me/${formatPhoneForWhatsApp(selectedCandidate.phone)}?text=${encodeURIComponent(`Hi ${selectedCandidate.name || 'there'}, I'm reaching out regarding your application. Are you available for a quick chat?`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#25D366] text-white rounded-lg font-semibold hover:bg-[#128C7E] transition-colors"
                    >
                      💬 WhatsApp
                    </a>
                    <a
                      href={`tel:${selectedCandidate.phone}`}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#4f46e5] text-white rounded-lg font-semibold hover:bg-[#4338ca] transition-colors"
                    >
                      📞 Call Now
                    </a>
                  </div>
                </div>
              )}

              {/* References */}
              {selectedCandidate.candidate_references && selectedCandidate.candidate_references.length > 0 && (
                <div className="mb-6">
                  <div className="text-sm font-semibold text-[#4f46e5] uppercase mb-3">📋 References</div>
                  <div className="space-y-3">
                    {selectedCandidate.candidate_references.map((ref, i) => (
                      <div key={i} className="p-4 bg-[#f8fafc] rounded-xl border border-[#e2e8f0]">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-semibold text-[#0f172a]">{ref.name || 'Unknown'}</div>
                            <div className="text-sm text-[#64748b]">
                              {ref.title}{ref.title && ref.company && ' at '}{ref.company}
                            </div>
                            {ref.relationship && (
                              <div className="text-xs text-[#94a3b8] mt-1">{ref.relationship}</div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            {ref.phone && (
                              <a
                                href={`https://wa.me/${formatPhoneForWhatsApp(ref.phone)}?text=${encodeURIComponent(`Hi ${ref.name}, I'm conducting a reference check for ${selectedCandidate.name}. Would you have a few minutes?`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1.5 bg-[#25D366] text-white rounded-lg text-xs font-semibold hover:bg-[#128C7E] transition-colors"
                              >
                                💬 WhatsApp
                              </a>
                            )}
                            {ref.email && (
                              <a
                                href={`mailto:${ref.email}?subject=Reference Check: ${selectedCandidate.name}`}
                                className="px-3 py-1.5 bg-[#4f46e5] text-white rounded-lg text-xs font-semibold hover:bg-[#4338ca] transition-colors"
                              >
                                ✉️ Email
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No References Warning */}
              {(!selectedCandidate.candidate_references || selectedCandidate.candidate_references.length === 0) && (
                <div className="mb-6 p-4 bg-[#fffbeb] border border-[#fcd34d] rounded-xl">
                  <div className="flex items-center gap-2 text-[#b45309] font-semibold text-sm">
                    ⚠️ No references provided
                  </div>
                  <div className="text-xs text-[#92400e] mt-1">
                    Consider requesting references before proceeding with this candidate.
                  </div>
                </div>
              )}

              {/* CV Text Preview */}
              {selectedCandidate.cv_text && (
                <div>
                  <div className="text-sm font-semibold text-[#64748b] uppercase mb-2">CV Content</div>
                  <div className="p-4 bg-[#f8fafc] rounded-xl max-h-[200px] overflow-y-auto">
                    <pre className="text-xs text-[#475569] whitespace-pre-wrap font-mono">
                      {selectedCandidate.cv_text.slice(0, 2000)}
                      {selectedCandidate.cv_text.length > 2000 && '...'}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 p-5 border-t border-[#e2e8f0] bg-[#f8fafc]">
              {selectedCandidate.status !== 'shortlist' && (
                <button 
                  onClick={async () => {
                    if (confirm(`Send shortlist email to ${selectedCandidate.email}?`)) {
                      const res = await fetch('/api/send-outcome', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ candidateId: selectedCandidate.id, status: 'shortlist' }),
                      });
                      if (res.ok) {
                        alert('Shortlist email sent!');
                        fetchCandidates();
                        setSelectedCandidate(null);
                      } else {
                        alert('Failed to send email');
                      }
                    }
                  }}
                  className="px-5 py-2.5 bg-[#166534] rounded-lg text-sm font-semibold text-white hover:bg-[#15803d] transition-colors"
                >
                  ✓ Send Shortlist Email
                </button>
              )}
              {selectedCandidate.status !== 'talent_pool' && (
                <button 
                  onClick={async () => {
                    if (confirm(`Send talent pool email to ${selectedCandidate.email}?`)) {
                      const res = await fetch('/api/send-outcome', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ candidateId: selectedCandidate.id, status: 'talent_pool' }),
                      });
                      if (res.ok) {
                        alert('Talent pool email sent!');
                        fetchCandidates();
                        setSelectedCandidate(null);
                      } else {
                        alert('Failed to send email');
                      }
                    }
                  }}
                  className="px-5 py-2.5 bg-[#4f46e5] rounded-lg text-sm font-semibold text-white hover:bg-[#4338ca] transition-colors"
                >
                  → Send Talent Pool Email
                </button>
              )}
              {selectedCandidate.status !== 'reject' && (
                <button 
                  onClick={async () => {
                    if (confirm(`Send rejection email to ${selectedCandidate.email}?`)) {
                      const res = await fetch('/api/send-outcome', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ candidateId: selectedCandidate.id, status: 'reject' }),
                      });
                      if (res.ok) {
                        alert('Rejection email sent!');
                        fetchCandidates();
                        setSelectedCandidate(null);
                      } else {
                        alert('Failed to send email');
                      }
                    }
                  }}
                  className="px-5 py-2.5 bg-white border border-[#e2e8f0] rounded-lg text-sm font-semibold text-[#64748b] hover:border-[#dc2626] hover:text-[#dc2626] transition-colors"
                >
                  ✗ Send Rejection Email
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* New Role Modal */}
      {showNewRoleModal && (
        <div className="fixed inset-0 bg-[rgba(15,23,42,0.6)] backdrop-blur-sm flex items-center justify-center z-[200]">
          <div className="bg-white rounded-2xl w-full max-w-[560px] max-h-[90vh] overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[#e2e8f0]">
              <h2 className="text-lg font-bold text-[#0f172a]">Create New Role</h2>
              <button 
                onClick={() => setShowNewRoleModal(false)}
                className="w-8 h-8 rounded-lg bg-[#f8fafc] text-[#64748b] flex items-center justify-center hover:bg-[#fee2e2] hover:text-[#dc2626] transition-colors text-xl"
              >
                ×
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="mb-5">
                <label className="block text-sm font-semibold text-[#0f172a] mb-2">Role Title</label>
                <input
                  type="text"
                  value={newRole.title}
                  onChange={(e) => setNewRole({...newRole, title: e.target.value})}
                  placeholder="e.g. Senior Backend Developer"
                  className="w-full px-3 py-3 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent"
                />
              </div>

              <div className="p-4 bg-[#f8fafc] rounded-xl mb-5">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-bold text-[#0f172a]">Must Have</span>
                  <span className="text-[0.65rem] px-2 py-0.5 bg-[#4f46e5] text-white rounded-full font-semibold">Required</span>
                </div>
                <p className="text-xs text-[#64748b] mb-4">Candidates will be rejected without these</p>

                <div className="mb-4">
                  <label className="block text-sm font-semibold text-[#0f172a] mb-2">Minimum Experience</label>
                  <select 
                    value={newRole.min_experience_years}
                    onChange={(e) => setNewRole({...newRole, min_experience_years: parseInt(e.target.value)})}
                    className="w-full px-3 py-3 border border-[#e2e8f0] rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                  >
                    <option value={1}>1+ years</option>
                    <option value={2}>2+ years</option>
                    <option value={3}>3+ years</option>
                    <option value={5}>5+ years</option>
                    <option value={7}>7+ years</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-semibold text-[#0f172a] mb-2">Required Skills</label>
                  <input
                    type="text"
                    placeholder="e.g. Python, Django, PostgreSQL"
                    className="w-full px-3 py-3 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-5 border-t border-[#e2e8f0] bg-[#f8fafc]">
              <button 
                onClick={() => setShowNewRoleModal(false)}
                className="px-5 py-2.5 bg-white border border-[#e2e8f0] rounded-lg text-sm font-semibold text-[#0f172a] hover:border-[#4f46e5] transition-colors"
              >
                Cancel
              </button>
              <button className="px-5 py-2.5 bg-[#4f46e5] rounded-lg text-sm font-semibold text-white hover:bg-[#4338ca] transition-colors">
                Create Role
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
