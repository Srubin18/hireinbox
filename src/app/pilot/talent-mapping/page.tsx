'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

// ============================================
// HIREINBOX PILOT - TALENT MAPPING
// /pilot/talent-mapping
// AI-powered talent search with file upload
// ============================================

interface Candidate {
  id?: string;
  name: string;
  currentRole: string;
  company: string;
  location: string;
  matchScore: number;
  status?: string;
  user_feedback?: string;
  availabilitySignals?: {
    score: number;
    signals: string[];
    interpretation: string;
  };
  careerVelocity?: {
    estimatedTenure: string;
    stagnationSignal: boolean;
    velocityScore: number;
    interpretation: string;
  };
  resignationPropensity?: {
    score: string;
    numericScore: number;
    factors: Array<{ factor: string; impact: string; evidence: string }>;
    recommendation: string;
  };
  personalizedHook?: {
    recentActivity: string;
    suggestedOpener: string;
    connectionAngle: string;
  };
  timingRecommendation?: {
    bestTime: string;
    reasoning: string;
    urgency: string;
  };
  sources: Array<{
    url: string;
    type: string;
    excerpt: string;
  }>;
  uniqueValue: string;
  discoveryMethod: string;
}

interface TalentReport {
  id?: string;
  candidates: Candidate[];
  marketIntelligence: {
    talentPoolSize: string;
    talentHotspots: string[];
    salaryTrends: string;
    marketTightness: string;
    recommendations: string[];
  };
  competitiveIntelligence?: {
    competitorBrainDrain?: {
      companiesLosingTalent: Array<{ company: string; signals: string[]; talentAvailability: string }>;
      companiesGainingTalent: Array<{ company: string; signals: string[] }>;
      leakyEmployers: string[];
      recommendation: string;
    };
  };
  searchCriteria: {
    originalPrompt: string;
    parsed: {
      role: string;
      location: string;
      industry: string;
    };
  };
}

const Logo = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
    <svg width="36" height="36" viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="12" fill="#4F46E5"/>
      <path d="M12 18L24 26L36 18V32C36 33.1 35.1 34 34 34H14C12.9 34 12 33.1 12 32V18Z" fill="white" fillOpacity="0.9"/>
      <path d="M34 14H14C12.9 14 12 14.9 12 16V18L24 26L36 18V16C36 14.9 35.1 14 34 14Z" fill="white"/>
      <circle cx="36" cy="12" r="9" fill="#10B981"/>
      <path d="M32.5 12L35 14.5L39.5 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
    <div>
      <div style={{ fontSize: '16px', fontWeight: 700 }}>
        <span style={{ color: '#0f172a' }}>Hire</span><span style={{ color: '#4F46E5' }}>Inbox</span>
      </div>
      <div style={{ fontSize: '11px', color: '#64748b' }}>Talent Mapping</div>
    </div>
  </div>
);

export default function PilotTalentMapping() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [report, setReport] = useState<TalentReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [expandedCandidate, setExpandedCandidate] = useState<string | null>(null);
  const [industry, setIndustry] = useState('');
  const [salaryBand, setSalaryBand] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [viewFilter, setViewFilter] = useState<'shortlist' | 'archived'>('shortlist');
  const [candidatesFromDB, setCandidatesFromDB] = useState<Candidate[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [processingCandidateId, setProcessingCandidateId] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Fetch candidates when view filter changes or report gets an ID
  useEffect(() => {
    if (report && (report as any).id) {
      fetchCandidatesFromDB((report as any).id);
    }
  }, [viewFilter, report]);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/pilot');
        return;
      }
      setUser({ email: session.user.email || '' });
    };
    checkAuth();
  }, [supabase, router]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    setError(null);

    // Extract text from file
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/extract-text', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setPrompt(data.text || '');
      } else {
        // Fallback: read as text for txt files
        if (file.type === 'text/plain') {
          const text = await file.text();
          setPrompt(text);
        } else {
          setError('Could not extract text from file. Please paste the content manually.');
        }
      }
    } catch {
      setError('Error processing file. Please paste the content manually.');
    }
  };

  const handleSearch = async () => {
    if (!prompt.trim()) {
      setError('Please enter a search description or upload a job spec');
      return;
    }

    setLoading(true);
    setError(null);
    setReport(null);

    try {
      // Get auth token to track usage
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch('/api/talent-mapping', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token && { 'Authorization': `Bearer ${session.access_token}` }),
        },
        body: JSON.stringify({
          prompt,
          industry: industry || undefined,
          salaryBand: salaryBand || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Search failed. Please try again.');
      }

      const data = await response.json();
      setReport(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveReport = async () => {
    if (!report) return;

    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch('/api/pilot/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          search_prompt: prompt,
          role_parsed: report.searchCriteria?.parsed?.role || 'Search',
          location: report.searchCriteria?.parsed?.location,
          industry: report.searchCriteria?.parsed?.industry,
          report_data: report,
          candidate_count: report.candidates?.length || 0,
        }),
      });

      if (!response.ok) throw new Error('Failed to save');

      const savedReport = await response.json();

      // Update report with the saved ID
      if (savedReport.report?.id && report) {
        setReport({ ...report, id: savedReport.report.id } as any);
        // Fetch candidates from database now that report is saved
        fetchCandidatesFromDB(savedReport.report.id);
      }

      setSuccessMessage('Report saved! View it in your Reports section.');
      setTimeout(() => setSuccessMessage(null), 5000); // Auto-hide after 5s
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save report');
    } finally {
      setSaving(false);
    }
  };

  // Fetch candidates from database for current report
  const fetchCandidatesFromDB = async (reportId?: string) => {
    if (!reportId) return;

    setLoadingCandidates(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/talent-mapping/candidates?status=${viewFilter}&report_id=${reportId}`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });

      const data = await response.json();
      if (data.success && data.candidates) {
        // Map database candidates to match the Candidate interface
        const mappedCandidates = data.candidates.map((dbCandidate: any) => ({
          ...dbCandidate.candidate_data, // Spread the full candidate data from JSONB
          id: dbCandidate.id, // Use the database ID
          status: dbCandidate.status,
          user_feedback: dbCandidate.user_feedback,
        }));
        setCandidatesFromDB(mappedCandidates);
      }
    } catch (err) {
      console.error('Error fetching candidates:', err);
    } finally {
      setLoadingCandidates(false);
    }
  };

  // Handler for feedback (good/bad)
  const handleFeedback = async (candidateId: string, feedback: 'good' | 'bad') => {
    // Validate UUID format before attempting to save
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(candidateId)) {
      console.error('Invalid candidate ID - report must be saved first');
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/talent-mapping/candidates/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ candidateId, feedback }),
      });

      if (response.ok) {
        setCandidatesFromDB(prev => prev.map(c =>
          c.id === candidateId ? { ...c, user_feedback: feedback } : c
        ));
      } else {
        console.error('Failed to save feedback:', await response.text());
      }
    } catch (err) {
      console.error('Failed to save feedback:', err);
    }
  };

  // Handler for archiving a candidate
  const handleArchive = async (candidateId: string) => {
    setProcessingCandidateId(candidateId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/talent-mapping/candidates/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ candidateId, status: 'archived' }),
      });

      if (response.ok) {
        setActionMessage('Candidate archived');
        setTimeout(() => setActionMessage(null), 2000);
        // Re-fetch to update the list
        if (report) fetchCandidatesFromDB((report as any).id);
      }
    } catch (err) {
      console.error('Failed to archive:', err);
    } finally {
      setProcessingCandidateId(null);
    }
  };

  // Handler for shortlisting a candidate
  const handleShortlist = async (candidateId: string) => {
    setProcessingCandidateId(candidateId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/talent-mapping/candidates/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ candidateId, status: 'shortlist' }),
      });

      if (response.ok) {
        setActionMessage('Candidate shortlisted');
        setTimeout(() => setActionMessage(null), 2000);
        // Re-fetch to update the list
        if (report) fetchCandidatesFromDB((report as any).id);
      }
    } catch (err) {
      console.error('Failed to shortlist:', err);
    } finally {
      setProcessingCandidateId(null);
    }
  };

  const getPropensityColor = (score: string) => {
    switch (score) {
      case 'High': return '#10B981';
      case 'Medium': return '#F59E0B';
      case 'Low': return '#EF4444';
      default: return '#64748b';
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      {/* Mobile Responsive Styles */}
      <style>{`
        .tm-main { padding: 32px; }
        .tm-header { padding: 16px 32px; }
        .tm-search-grid { display: grid; grid-template-columns: 320px 1fr; gap: 24px; }
        .tm-market-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        .tm-stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        .tm-optional-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

        @media (max-width: 1024px) {
          .tm-search-grid { grid-template-columns: 1fr !important; }
          .info-panel { display: none !important; }
        }

        @media (max-width: 768px) {
          .tm-main { padding: 16px !important; }
          .tm-header { padding: 12px 16px !important; flex-wrap: wrap; gap: 12px !important; }
          .tm-market-grid { grid-template-columns: 1fr !important; }
          .tm-stats-grid { grid-template-columns: 1fr !important; }
          .tm-optional-grid { grid-template-columns: 1fr !important; }
          .tm-actions { flex-direction: column !important; }
          .tm-actions button { width: 100% !important; }
        }
      `}</style>

      {/* Success Toast */}
      {successMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          padding: '16px 24px',
          backgroundColor: '#10B981',
          color: '#ffffff',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          animation: 'slideIn 0.3s ease',
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" fill="#ffffff"/>
            <path d="M8 12l3 3 5-6" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {successMessage}
          <button
            onClick={() => setSuccessMessage(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              marginLeft: '8px',
              fontSize: '18px',
            }}
          >
            &times;
          </button>
        </div>
      )}

      {/* Action Toast (Archive/Shortlist feedback) */}
      {actionMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          padding: '16px 24px',
          backgroundColor: '#10B981',
          color: '#ffffff',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 1000,
          animation: 'slideIn 0.3s ease',
        }}>
          {actionMessage}
        </div>
      )}

      <style>{`@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>

      {/* Header */}
      <header className="tm-header" style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div onClick={() => router.push('/pilot/dashboard')}><Logo /></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => router.push('/pilot/reports')}
            style={{
              padding: '8px 16px',
              backgroundColor: '#f1f5f9',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              color: '#475569',
              cursor: 'pointer',
            }}
          >
            My Reports
          </button>
          <span style={{ fontSize: '14px', color: '#64748b' }}>{user?.email}</span>
        </div>
      </header>

      <main className="tm-main" style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Search Section */}
        {!report && (
          <div className="tm-search-grid">
            {/* Info Panel - Benefits & Sources */}
            <div className="info-panel" style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              padding: '24px',
              height: 'fit-content',
            }}>
              {/* Why Use Section */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>
                  Why Talent Mapping?
                </h3>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                  {[
                    'Find passive candidates not on job boards',
                    'AI-powered match scoring',
                    'Resignation propensity signals',
                    'Personalized outreach hooks',
                    'Competitor brain drain alerts',
                    'Career velocity analysis',
                  ].map((benefit, i) => (
                    <li key={i} style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      marginBottom: '12px',
                      fontSize: '13px',
                      color: '#475569',
                    }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: '2px' }}>
                        <circle cx="12" cy="12" r="10" fill="#10B981"/>
                        <path d="M8 12l3 3 5-6" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Data Sources Section */}
              <div style={{
                borderTop: '1px solid #e2e8f0',
                paddingTop: '20px',
              }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>
                  Our Data Sources
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    { icon: 'linkedin', name: 'LinkedIn Profiles', color: '#0077B5' },
                    { icon: 'news', name: 'Business News', color: '#EF4444' },
                    { icon: 'company', name: 'Company Websites', color: '#4F46E5' },
                    { icon: 'industry', name: 'Industry Publications', color: '#F59E0B' },
                    { icon: 'research', name: 'Research Papers', color: '#10B981' },
                    { icon: 'events', name: 'Conference Speakers', color: '#8B5CF6' },
                  ].map((source, i) => (
                    <div key={i} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 12px',
                      backgroundColor: '#f8fafc',
                      borderRadius: '6px',
                      fontSize: '13px',
                      color: '#374151',
                    }}>
                      <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: source.color,
                      }} />
                      {source.name}
                    </div>
                  ))}
                </div>
                <p style={{
                  marginTop: '16px',
                  fontSize: '11px',
                  color: '#94a3b8',
                  lineHeight: 1.5,
                }}>
                  We search 40+ sources using AI to find candidates that match your exact requirements.
                </p>
              </div>
            </div>

            {/* Search Form */}
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              padding: '32px',
            }}>
              <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
                AI Talent Mapping
              </h1>
              <p style={{ fontSize: '15px', color: '#64748b', marginBottom: '24px' }}>
                Describe who you&apos;re looking for or upload a job specification
              </p>

            {/* File Upload */}
            <div style={{ marginBottom: '20px' }}>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".pdf,.doc,.docx,.txt"
                style={{ display: 'none' }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  padding: '12px 24px',
                  backgroundColor: uploadedFile ? '#10B981' : '#f1f5f9',
                  color: uploadedFile ? '#ffffff' : '#475569',
                  border: '1px dashed #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                {uploadedFile ? `Uploaded: ${uploadedFile.name}` : 'Upload Job Spec (PDF, DOC, TXT)'}
              </button>
            </div>

            {/* Text Area */}
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Example: Looking for a CEO for a property finance company in Johannesburg. Must have 10+ years experience in financial services, ideally short-term credit or bridging finance. Entrepreneurial mindset, proven track record of scaling businesses..."
              style={{
                width: '100%',
                minHeight: '200px',
                padding: '16px',
                fontSize: '15px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                resize: 'vertical',
                fontFamily: 'inherit',
                lineHeight: 1.5,
              }}
            />

            {/* Optional Fields: Industry & Salary */}
            <div className="tm-optional-grid" style={{ marginTop: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                  Industry (Optional)
                </label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    fontSize: '14px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    backgroundColor: '#ffffff',
                    cursor: 'pointer',
                  }}
                >
                  <option value="">Any industry</option>
                  <option value="Financial Services">Financial Services</option>
                  <option value="Property/Real Estate">Property/Real Estate</option>
                  <option value="Banking">Banking</option>
                  <option value="Insurance">Insurance</option>
                  <option value="Technology">Technology</option>
                  <option value="Mining">Mining</option>
                  <option value="Retail">Retail</option>
                  <option value="Manufacturing">Manufacturing</option>
                  <option value="Professional Services">Professional Services</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Telecommunications">Telecommunications</option>
                  <option value="FMCG">FMCG</option>
                  <option value="Energy">Energy</option>
                  <option value="Agriculture">Agriculture</option>
                  <option value="Construction">Construction</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                  Salary Band (Optional)
                </label>
                <select
                  value={salaryBand}
                  onChange={(e) => setSalaryBand(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    fontSize: '14px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    backgroundColor: '#ffffff',
                    cursor: 'pointer',
                  }}
                >
                  <option value="">Any salary</option>
                  <option value="R30k-R50k/month">R30k-R50k/month (Junior)</option>
                  <option value="R50k-R80k/month">R50k-R80k/month (Mid-level)</option>
                  <option value="R80k-R120k/month">R80k-R120k/month (Senior)</option>
                  <option value="R120k-R180k/month">R120k-R180k/month (Management)</option>
                  <option value="R180k-R300k/month">R180k-R300k/month (Executive)</option>
                  <option value="R300k+/month">R300k+/month (C-Suite)</option>
                </select>
              </div>
            </div>

            {error && (
              <div style={{
                marginTop: '16px',
                padding: '12px 16px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                color: '#dc2626',
                fontSize: '14px',
              }}>
                {error}
              </div>
            )}

            <button
              onClick={handleSearch}
              disabled={loading || !prompt.trim()}
              style={{
                marginTop: '20px',
                padding: '14px 32px',
                backgroundColor: '#4F46E5',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading || !prompt.trim() ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {loading ? (
                <>
                  <div style={{
                    width: '18px',
                    height: '18px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#ffffff',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                  }} />
                  Searching... (this may take 2-5 minutes)
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"/>
                    <path d="M21 21l-4.35-4.35"/>
                  </svg>
                  Find Candidates
                </>
              )}
            </button>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          </div>
        )}

        {/* Results Section */}
        {report && (
          <>
            {/* Actions Bar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '24px',
            }}>
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
                  {report.searchCriteria?.parsed?.role || 'Search Results'}
                </h1>
                <p style={{ fontSize: '14px', color: '#64748b' }}>
                  {report.candidates?.length || 0} candidates found • {report.searchCriteria?.parsed?.location || 'South Africa'}
                </p>
              </div>
              <div className="tm-actions" style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={handleSaveReport}
                  disabled={saving}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#10B981',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {saving ? 'Saving...' : 'Save Report'}
                </button>
                <button
                  onClick={() => { setReport(null); setPrompt(''); setUploadedFile(null); }}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#ffffff',
                    color: '#475569',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  New Search
                </button>
              </div>
            </div>

            {/* Market Intelligence */}
            {report.marketIntelligence && (
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                padding: '24px',
                marginBottom: '24px',
              }}>
                <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', marginBottom: '16px' }}>
                  Market Intelligence
                </h2>
                <div className="tm-market-grid">
                  <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                    <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Talent Pool</div>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a' }}>
                      {report.marketIntelligence.talentPoolSize}
                    </div>
                  </div>
                  <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                    <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Salary Trends</div>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a' }}>
                      {report.marketIntelligence.salaryTrends}
                    </div>
                  </div>
                  <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                    <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Market</div>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', textTransform: 'capitalize' }}>
                      {report.marketIntelligence.marketTightness}
                    </div>
                  </div>
                </div>

                {/* Competitor Brain Drain */}
                {report.competitiveIntelligence?.competitorBrainDrain && (
                  <div style={{ marginTop: '20px', padding: '16px', backgroundColor: '#fef3c7', borderRadius: '8px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#92400e', marginBottom: '8px' }}>
                      Competitor Brain Drain Alert
                    </div>
                    <div style={{ fontSize: '13px', color: '#78350f' }}>
                      {report.competitiveIntelligence.competitorBrainDrain.recommendation}
                    </div>
                    {report.competitiveIntelligence.competitorBrainDrain.leakyEmployers?.length > 0 && (
                      <div style={{ marginTop: '8px', fontSize: '13px', color: '#78350f' }}>
                        <strong>Target these employers:</strong> {report.competitiveIntelligence.competitorBrainDrain.leakyEmployers.join(', ')}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Helpful message if report not saved yet */}
            {!report?.id && report && (
              <div style={{
                padding: '12px 16px',
                backgroundColor: '#EFF6FF',
                border: '1px solid #BFDBFE',
                borderRadius: '8px',
                marginBottom: '16px',
                fontSize: '14px',
                color: '#1E40AF',
              }}>
                💡 <strong>Save this report</strong> to enable feedback buttons and candidate management features
              </div>
            )}

            {/* View Toggle - Show after report is saved (has ID) */}
            {report?.id && (
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
              <button
                onClick={() => setViewFilter('shortlist')}
                style={{
                  padding: '10px 20px',
                  backgroundColor: viewFilter === 'shortlist' ? '#4F46E5' : '#f1f5f9',
                  color: viewFilter === 'shortlist' ? '#ffffff' : '#64748b',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                Shortlisted {viewFilter === 'shortlist' && candidatesFromDB.length > 0 && `(${candidatesFromDB.length})`}
              </button>
              <button
                onClick={() => setViewFilter('archived')}
                style={{
                  padding: '10px 20px',
                  backgroundColor: viewFilter === 'archived' ? '#4F46E5' : '#f1f5f9',
                  color: viewFilter === 'archived' ? '#ffffff' : '#64748b',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                Archived {viewFilter === 'archived' && candidatesFromDB.length > 0 && `(${candidatesFromDB.length})`}
              </button>
            </div>
            )}

            {/* Candidates List - Expandable Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#64748b' }}>
                  {report?.id ? candidatesFromDB.length : report.candidates?.length || 0} candidates found
                </h2>
              </div>

              {/* If report is saved (has ID), only show DB candidates. Otherwise show JSON */}
              {(report?.id ? candidatesFromDB : report.candidates || []).length === 0 ? (
                <div style={{
                  padding: '40px',
                  textAlign: 'center',
                  color: '#64748b',
                  fontSize: '14px',
                }}>
                  {report?.id && viewFilter === 'archived'
                    ? 'No archived candidates yet. Archive candidates from the Shortlisted view.'
                    : 'No candidates found'}
                </div>
              ) : (
                (report?.id ? candidatesFromDB : report.candidates || []).map((candidate, index) => {
                const isExpanded = expandedCandidate === candidate.name;

                return (
                  <div
                    key={index}
                    style={{
                      backgroundColor: '#ffffff',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      overflow: 'hidden',
                    }}
                  >
                    {/* Candidate Header - Always Visible */}
                    <div
                      style={{
                        padding: '20px 24px',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                            {/* Feedback Buttons - Only show if candidate is from database (has UUID) */}
                            {candidatesFromDB.length > 0 && candidate.id && (
                              <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleFeedback(candidate.id!, 'good');
                              }}
                              style={{
                                padding: '6px 12px',
                                backgroundColor: candidate.user_feedback === 'good' ? '#10B981' : '#f1f5f9',
                                color: candidate.user_feedback === 'good' ? '#ffffff' : '#64748b',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '13px',
                                fontWeight: 500,
                                transition: 'all 0.2s',
                              }}
                            >
                              👍 Good
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleFeedback(candidate.id!, 'bad');
                              }}
                              style={{
                                padding: '6px 12px',
                                backgroundColor: candidate.user_feedback === 'bad' ? '#EF4444' : '#f1f5f9',
                                color: candidate.user_feedback === 'bad' ? '#ffffff' : '#64748b',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '13px',
                                fontWeight: 500,
                                transition: 'all 0.2s',
                              }}
                            >
                              👎 Bad
                            </button>
                              </>
                            )}
                            <h3
                              onClick={() => setExpandedCandidate(isExpanded ? null : candidate.name)}
                              style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', cursor: 'pointer' }}
                            >
                              {candidate.name}
                            </h3>
                          </div>
                          <div style={{ fontSize: '14px', color: '#475569', marginBottom: '2px', marginLeft: '24px' }}>
                            {candidate.currentRole} at {candidate.company}
                          </div>
                          <div style={{ fontSize: '13px', color: '#64748b', marginLeft: '24px' }}>
                            {candidate.location}
                          </div>
                          <div style={{ marginTop: '6px', marginLeft: '24px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{
                              padding: '2px 10px',
                              backgroundColor: '#f0fdf4',
                              color: '#15803d',
                              borderRadius: '4px',
                              fontSize: '12px',
                            }}>
                              Found via: {candidate.discoveryMethod}
                            </span>
                            {candidate.resignationPropensity && (
                              <span style={{
                                padding: '2px 10px',
                                backgroundColor: candidate.resignationPropensity.score === 'High' ? '#d1fae5' :
                                               candidate.resignationPropensity.score === 'Medium' ? '#fef3c7' : '#fee2e2',
                                color: candidate.resignationPropensity.score === 'High' ? '#065f46' :
                                       candidate.resignationPropensity.score === 'Medium' ? '#92400e' : '#991b1b',
                                borderRadius: '4px',
                                fontSize: '12px',
                                fontWeight: 600,
                              }}>
                                {candidate.resignationPropensity.score === 'High' ? '🔥' :
                                 candidate.resignationPropensity.score === 'Medium' ? '⚡' : '❄️'} {candidate.resignationPropensity.score} Move Likelihood
                              </span>
                            )}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{
                            padding: '4px 12px',
                            backgroundColor: candidate.matchScore >= 80 ? '#10B981' : candidate.matchScore >= 70 ? '#F59E0B' : '#64748b',
                            color: '#ffffff',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontWeight: 700,
                            marginBottom: '4px',
                          }}>
                            {candidate.matchScore}% match
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>
                            {candidate.matchScore >= 80 ? 'High confidence' : candidate.matchScore >= 70 ? 'Good match' : 'Medium confidence'}
                          </div>
                        </div>
                      </div>

                      {/* Expanded Content */}
                      {isExpanded && (
                        <div style={{ marginTop: '20px', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
                          {/* Stats Row */}
                          <div className="tm-stats-grid" style={{
                            padding: '16px',
                            backgroundColor: '#f8fafc',
                            borderRadius: '8px',
                            marginBottom: '16px',
                          }}>
                            <div>
                              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Salary Estimate</div>
                              <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>
                                {candidate.availabilitySignals?.signals?.find(s => s.includes('R'))?.split(' ')[0] || 'R400k - R800k'}
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Availability</div>
                              <div style={{ fontSize: '14px', fontWeight: 600, color: candidate.availabilitySignals?.score && candidate.availabilitySignals.score >= 5 ? '#10B981' : '#64748b' }}>
                                {candidate.availabilitySignals?.score || 5}/10
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Trajectory</div>
                              <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>
                                {candidate.careerVelocity?.velocityScore && candidate.careerVelocity.velocityScore > 60 ? 'Rising' : 'Stable'}
                              </div>
                            </div>
                          </div>

                          {/* Why They Match */}
                          <div style={{ marginBottom: '16px' }}>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: '#059669', marginBottom: '8px' }}>
                              Why they match
                            </div>
                            <div style={{
                              display: 'inline-block',
                              padding: '8px 12px',
                              backgroundColor: '#d1fae5',
                              color: '#065f46',
                              borderRadius: '6px',
                              fontSize: '13px',
                            }}>
                              {candidate.uniqueValue || 'Strong alignment with role requirements'}
                            </div>
                          </div>

                          {/* Move Likelihood Signals - PROMINENT */}
                          <div style={{
                            padding: '16px',
                            backgroundColor: candidate.resignationPropensity?.score === 'High' ? '#ecfdf5' :
                                           candidate.resignationPropensity?.score === 'Medium' ? '#fffbeb' : '#fef2f2',
                            border: `1px solid ${candidate.resignationPropensity?.score === 'High' ? '#a7f3d0' :
                                                 candidate.resignationPropensity?.score === 'Medium' ? '#fde68a' : '#fecaca'}`,
                            borderRadius: '8px',
                            marginBottom: '16px',
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                              <div style={{
                                padding: '4px 10px',
                                backgroundColor: candidate.resignationPropensity?.score === 'High' ? '#10B981' :
                                               candidate.resignationPropensity?.score === 'Medium' ? '#F59E0B' : '#EF4444',
                                color: '#ffffff',
                                borderRadius: '4px',
                                fontSize: '12px',
                                fontWeight: 700,
                              }}>
                                {candidate.resignationPropensity?.score || 'Medium'} Move Likelihood
                              </div>
                              <span style={{ fontSize: '12px', color: '#64748b' }}>
                                {candidate.resignationPropensity?.score === 'High' ? 'Good time to approach' :
                                 candidate.resignationPropensity?.score === 'Medium' ? 'May be open to conversation' : 'May need extra persuasion'}
                              </span>
                            </div>

                            <div style={{ fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
                              Signals Detected:
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              {candidate.resignationPropensity?.factors && candidate.resignationPropensity.factors.length > 0 ? (
                                candidate.resignationPropensity.factors.map((f, i) => (
                                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px' }}>
                                    <span style={{
                                      color: f.impact === 'positive' ? '#10B981' : f.impact === 'negative' ? '#EF4444' : '#F59E0B',
                                      fontWeight: 600,
                                    }}>
                                      {f.impact === 'positive' ? '↑' : f.impact === 'negative' ? '↓' : '→'}
                                    </span>
                                    <span style={{ color: '#374151' }}>
                                      <strong>{f.factor}:</strong> {f.evidence}
                                    </span>
                                  </div>
                                ))
                              ) : (
                                <>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                                    <span style={{ color: '#10B981', fontWeight: 600 }}>↑</span>
                                    <span style={{ color: '#374151' }}><strong>Tenure:</strong> 2-4 years in role (peak move window)</span>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                                    <span style={{ color: '#F59E0B', fontWeight: 600 }}>→</span>
                                    <span style={{ color: '#374151' }}><strong>Trajectory:</strong> Career progression appears stable</span>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                                    <span style={{ color: '#64748b', fontWeight: 600 }}>•</span>
                                    <span style={{ color: '#374151' }}><strong>Market:</strong> Active sector with opportunities</span>
                                  </div>
                                </>
                              )}
                            </div>

                            {candidate.resignationPropensity?.recommendation && (
                              <div style={{
                                marginTop: '12px',
                                paddingTop: '12px',
                                borderTop: '1px solid rgba(0,0,0,0.1)',
                                fontSize: '13px',
                                color: '#475569',
                                fontStyle: 'italic',
                              }}>
                                💡 {candidate.resignationPropensity.recommendation}
                              </div>
                            )}
                          </div>

                          {/* Skills Inferred */}
                          <div style={{ marginBottom: '16px' }}>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                              Skills Inferred
                            </div>
                            <div style={{ fontSize: '13px', color: '#475569' }}>
                              {candidate.personalizedHook?.connectionAngle || 'Leadership • Strategy • Industry expertise'}
                            </div>
                          </div>

                          {/* Why This Candidate is Special */}
                          <div style={{
                            padding: '16px',
                            backgroundColor: '#eff6ff',
                            borderLeft: '3px solid #3b82f6',
                            borderRadius: '0 8px 8px 0',
                            marginBottom: '16px',
                          }}>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: '#2563eb', marginBottom: '6px' }}>
                              Why This Candidate is Special
                            </div>
                            <div style={{ fontSize: '14px', color: '#1e40af' }}>
                              {candidate.uniqueValue || 'Unique combination of skills and experience that matches the role requirements'}
                            </div>
                          </div>

                          {/* Approach Strategy */}
                          {candidate.personalizedHook && (
                            <div style={{
                              padding: '16px',
                              backgroundColor: '#f8fafc',
                              borderRadius: '8px',
                              marginBottom: '16px',
                            }}>
                              <div style={{ fontSize: '13px', fontWeight: 600, color: '#4F46E5', marginBottom: '12px' }}>
                                Approach Strategy
                              </div>
                              <div style={{ fontSize: '13px', color: '#374151', marginBottom: '8px' }}>
                                <span style={{ fontWeight: 600, color: '#4F46E5' }}>Angle:</span> {candidate.personalizedHook.connectionAngle || 'Highlight growth opportunities'}
                              </div>
                              <div style={{ fontSize: '13px', color: '#374151', marginBottom: '8px' }}>
                                <span style={{ fontWeight: 600, color: '#4F46E5' }}>Timing:</span> {candidate.timingRecommendation?.bestTime || 'Best during strategic planning periods'}
                              </div>
                              <div style={{ fontSize: '13px', color: '#374151' }}>
                                <span style={{ fontWeight: 600, color: '#4F46E5' }}>Leverage:</span> {candidate.personalizedHook.suggestedOpener || 'Emphasize unique opportunity'}
                              </div>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                              onClick={() => {
                                if (candidate.sources?.[0]?.url) {
                                  window.open(candidate.sources[0].url, '_blank');
                                }
                              }}
                              style={{
                                padding: '10px 16px',
                                backgroundColor: '#ffffff',
                                border: '1px solid #d1d5db',
                                borderRadius: '8px',
                                fontSize: '13px',
                                fontWeight: 500,
                                color: '#374151',
                                cursor: 'pointer',
                              }}
                            >
                              View Source ({candidate.sources?.length || 1})
                            </button>
                            {/* Archive/Shortlist - Only show if candidate is from database */}
                            {candidatesFromDB.length > 0 && candidate.id && (
                              <>
                                {viewFilter === 'shortlist' ? (
                                  <button
                                    onClick={() => {
                                      handleArchive(candidate.id!);
                                    }}
                                    disabled={processingCandidateId === candidate.id}
                                    style={{
                                      padding: '10px 16px',
                                      backgroundColor: processingCandidateId === candidate.id ? '#f3f4f6' : '#ffffff',
                                      border: '1px solid #d1d5db',
                                      borderRadius: '8px',
                                      fontSize: '13px',
                                      fontWeight: 500,
                                      color: processingCandidateId === candidate.id ? '#9ca3af' : '#374151',
                                      cursor: processingCandidateId === candidate.id ? 'not-allowed' : 'pointer',
                                      transition: 'all 0.2s',
                                      opacity: processingCandidateId === candidate.id ? 0.6 : 1,
                                    }}
                                  >
                                    {processingCandidateId === candidate.id ? 'Archiving...' : 'Archive'}
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => {
                                      handleShortlist(candidate.id!);
                                    }}
                                    disabled={processingCandidateId === candidate.id}
                                    style={{
                                      padding: '10px 16px',
                                      backgroundColor: processingCandidateId === candidate.id ? '#86efac' : '#10B981',
                                      border: 'none',
                                      borderRadius: '8px',
                                      fontSize: '13px',
                                      fontWeight: 500,
                                      color: '#ffffff',
                                      cursor: processingCandidateId === candidate.id ? 'not-allowed' : 'pointer',
                                      transition: 'all 0.2s',
                                      opacity: processingCandidateId === candidate.id ? 0.6 : 1,
                                    }}
                                  >
                                    {processingCandidateId === candidate.id ? 'Shortlisting...' : 'Shortlist'}
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
