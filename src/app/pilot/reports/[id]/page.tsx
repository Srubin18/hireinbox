'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

// ============================================
// HIREINBOX PILOT - INDIVIDUAL REPORT VIEW
// /pilot/reports/[id]
// View a saved talent mapping report
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
  resignationPropensity?: {
    score: string;
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
  careerVelocity?: {
    estimatedTenure: string;
    stagnationSignal: boolean;
    interpretation: string;
  };
  sources: Array<{ url: string; type: string; excerpt: string }>;
  uniqueValue: string;
  discoveryMethod: string;
}

interface Report {
  id: string;
  created_at: string;
  search_prompt: string;
  role_parsed: string;
  location: string;
  industry: string;
  candidate_count: number;
  report_data: {
    candidates: Candidate[];
    marketIntelligence?: {
      talentPoolSize: string;
      salaryTrends: string;
      marketTightness: string;
      recommendations: string[];
    };
    competitiveIntelligence?: {
      competitorBrainDrain?: {
        leakyEmployers: string[];
        recommendation: string;
      };
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
      <div style={{ fontSize: '11px', color: '#64748b' }}>Report View</div>
    </div>
  </div>
);

export default function ReportView() {
  const router = useRouter();
  const params = useParams();
  const reportId = params.id as string;

  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [viewFilter, setViewFilter] = useState<'shortlist' | 'archived'>('shortlist');
  const [candidatesFromDB, setCandidatesFromDB] = useState<Candidate[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [processingCandidateId, setProcessingCandidateId] = useState<string | null>(null);
  const [hasDBCandidates, setHasDBCandidates] = useState<boolean | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchReport = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push('/pilot');
        return;
      }

      const response = await fetch(`/api/pilot/reports?id=${reportId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setReport(data.report);
      } else {
        router.push('/pilot/reports');
      }
    } catch (err) {
      console.error('Error fetching report:', err);
      router.push('/pilot/reports');
    } finally {
      setLoading(false);
    }
  }, [supabase, router, reportId]);

  useEffect(() => {
    if (reportId) {
      fetchReport();
      fetchCandidatesFromDB();
    }
  }, [reportId, fetchReport]);

  useEffect(() => {
    if (reportId) {
      fetchCandidatesFromDB();
    }
  }, [viewFilter]);

  const fetchCandidatesFromDB = async () => {
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
        const mappedCandidates = data.candidates.map((dbCandidate: any) => ({
          ...dbCandidate.candidate_data,
          id: dbCandidate.id,
          status: dbCandidate.status,
          user_feedback: dbCandidate.user_feedback,
        }));
        setCandidatesFromDB(mappedCandidates);

        // If we haven't determined yet whether this report has DB candidates, check now
        if (hasDBCandidates === null && mappedCandidates.length > 0) {
          setHasDBCandidates(true);
        } else if (hasDBCandidates === null && viewFilter === 'shortlist') {
          // If shortlist is empty, check if anything is archived
          const archivedResponse = await fetch(`/api/talent-mapping/candidates?status=archived&report_id=${reportId}`, {
            headers: { 'Authorization': `Bearer ${session.access_token}` },
          });
          const archivedData = await archivedResponse.json();
          setHasDBCandidates(archivedData.success && archivedData.candidates && archivedData.candidates.length > 0);
        }
      }
    } catch (err) {
      console.error('Error fetching candidates:', err);
    } finally {
      setLoadingCandidates(false);
    }
  };

  const handleFeedback = async (candidateId: string, feedback: 'good' | 'bad') => {
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
      }
    } catch (err) {
      console.error('Failed to save feedback:', err);
    }
  };

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
        fetchCandidatesFromDB();
      }
    } catch (err) {
      console.error('Failed to archive:', err);
    } finally {
      setProcessingCandidateId(null);
    }
  };

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
        fetchCandidatesFromDB();
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
          <p style={{ color: '#64748b' }}>Loading report...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (!report) {
    return null;
  }

  // For old reports (no DB candidates), show all from JSON without filtering
  // For new reports (DB candidates), they're already filtered by API
  const isLiveReport = hasDBCandidates === true;
  const candidates = isLiveReport ? candidatesFromDB : (report.report_data?.candidates || []);
  const marketIntelligence = report.report_data?.marketIntelligence;

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
        <div onClick={() => router.push('/pilot/dashboard')}><Logo /></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
            All Reports
          </button>
          <button
            onClick={() => router.push('/pilot/talent-mapping')}
            style={{
              padding: '8px 16px',
              backgroundColor: '#4F46E5',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            + New Search
          </button>
        </div>
      </header>

      <main style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto' }}>
        {/* Report Header */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
            {report.role_parsed || 'Talent Search'}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '14px', color: '#64748b' }}>
            <span>{report.location || 'South Africa'}</span>
            <span>|</span>
            <span>{report.candidate_count} candidates</span>
            <span>|</span>
            <span>
              {new Date(report.created_at).toLocaleDateString('en-ZA', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>

        {/* Market Intelligence */}
        {marketIntelligence && (
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Talent Pool</div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a' }}>
                  {marketIntelligence.talentPoolSize}
                </div>
              </div>
              <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Salary Trends</div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a' }}>
                  {marketIntelligence.salaryTrends}
                </div>
              </div>
              <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Market</div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', textTransform: 'capitalize' }}>
                  {marketIntelligence.marketTightness}
                </div>
              </div>
            </div>

            {/* Competitor Brain Drain */}
            {report.report_data.competitiveIntelligence?.competitorBrainDrain && (
              <div style={{ marginTop: '20px', padding: '16px', backgroundColor: '#fef3c7', borderRadius: '8px' }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#92400e', marginBottom: '8px' }}>
                  Competitor Brain Drain Alert
                </div>
                <div style={{ fontSize: '13px', color: '#78350f' }}>
                  {report.report_data.competitiveIntelligence.competitorBrainDrain.recommendation}
                </div>
                {report.report_data.competitiveIntelligence.competitorBrainDrain.leakyEmployers?.length > 0 && (
                  <div style={{ marginTop: '8px', fontSize: '13px', color: '#78350f' }}>
                    <strong>Target these employers:</strong> {report.report_data.competitiveIntelligence.competitorBrainDrain.leakyEmployers.join(', ')}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Candidates Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: selectedCandidate ? '1fr 400px' : '1fr',
          gap: '24px',
        }}>
          {/* Candidates List */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
          }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a' }}>
                  Candidates ({candidates.length})
                </h2>
                {/* View Toggle */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setViewFilter('shortlist')}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: viewFilter === 'shortlist' ? '#4F46E5' : '#f1f5f9',
                      color: viewFilter === 'shortlist' ? '#ffffff' : '#64748b',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '13px',
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
                      padding: '8px 16px',
                      backgroundColor: viewFilter === 'archived' ? '#4F46E5' : '#f1f5f9',
                      color: viewFilter === 'archived' ? '#ffffff' : '#64748b',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    Archived {viewFilter === 'archived' && candidatesFromDB.length > 0 && `(${candidatesFromDB.length})`}
                  </button>
                </div>
              </div>
            </div>
            <div>
              {candidates.map((candidate, index) => (
                <div
                  key={index}
                  onClick={() => setSelectedCandidate(candidate)}
                  style={{
                    padding: '20px 24px',
                    borderBottom: '1px solid #e2e8f0',
                    cursor: 'pointer',
                    backgroundColor: selectedCandidate?.name === candidate.name ? '#f8fafc' : '#ffffff',
                    transition: 'background-color 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                        {/* Feedback Buttons */}
                        {candidate.id && (
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleFeedback(candidate.id!, 'good');
                              }}
                              style={{
                                padding: '4px 10px',
                                backgroundColor: candidate.user_feedback === 'good' ? '#10B981' : '#f1f5f9',
                                color: candidate.user_feedback === 'good' ? '#ffffff' : '#64748b',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '12px',
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
                                padding: '4px 10px',
                                backgroundColor: candidate.user_feedback === 'bad' ? '#EF4444' : '#f1f5f9',
                                color: candidate.user_feedback === 'bad' ? '#ffffff' : '#64748b',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: 500,
                                transition: 'all 0.2s',
                              }}
                            >
                              👎 Bad
                            </button>
                          </div>
                        )}
                        <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>
                          {candidate.name}
                        </h3>
                        {candidate.resignationPropensity && (
                          <span style={{
                            padding: '2px 8px',
                            backgroundColor: getPropensityColor(candidate.resignationPropensity.score) + '20',
                            color: getPropensityColor(candidate.resignationPropensity.score),
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 600,
                          }}>
                            {candidate.resignationPropensity.score} Move Likelihood
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '14px', color: '#475569', marginBottom: '4px' }}>
                        {candidate.currentRole} at {candidate.company}
                      </div>
                      <div style={{ fontSize: '13px', color: '#64748b' }}>
                        {candidate.location} - Found via {candidate.discoveryMethod}
                      </div>
                    </div>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: `conic-gradient(#4F46E5 ${candidate.matchScore}%, #e2e8f0 0)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        backgroundColor: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: 700,
                        color: '#4F46E5',
                      }}>
                        {candidate.matchScore}%
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Candidate Detail Panel */}
          {selectedCandidate && (
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              padding: '24px',
              position: 'sticky',
              top: '24px',
              maxHeight: 'calc(100vh - 120px)',
              overflowY: 'auto',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a' }}>
                  {selectedCandidate.name}
                </h2>
                <button
                  onClick={() => setSelectedCandidate(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '20px',
                    cursor: 'pointer',
                    color: '#64748b',
                  }}
                >
                  &times;
                </button>
              </div>

              {/* Timing Recommendation */}
              {selectedCandidate.timingRecommendation && (
                <div style={{
                  padding: '16px',
                  backgroundColor: selectedCandidate.timingRecommendation.urgency === 'high' ? '#fef2f2' : '#f0fdf4',
                  borderRadius: '8px',
                  marginBottom: '16px',
                }}>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: selectedCandidate.timingRecommendation.urgency === 'high' ? '#dc2626' : '#10B981',
                    marginBottom: '4px',
                  }}>
                    WHEN TO CALL: {selectedCandidate.timingRecommendation.bestTime}
                  </div>
                  <div style={{ fontSize: '13px', color: '#374151' }}>
                    {selectedCandidate.timingRecommendation.reasoning}
                  </div>
                </div>
              )}

              {/* Personalized Hook */}
              {selectedCandidate.personalizedHook && (
                <div style={{
                  padding: '16px',
                  backgroundColor: '#EEF2FF',
                  borderRadius: '8px',
                  marginBottom: '16px',
                }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#4F46E5', marginBottom: '8px' }}>
                    SUGGESTED OPENER
                  </div>
                  <div style={{ fontSize: '14px', color: '#1e1b4b', fontStyle: 'italic' }}>
                    &quot;{selectedCandidate.personalizedHook.suggestedOpener}&quot;
                  </div>
                  {selectedCandidate.personalizedHook.recentActivity && (
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>
                      Based on: {selectedCandidate.personalizedHook.recentActivity}
                    </div>
                  )}
                </div>
              )}

              {/* Career Velocity */}
              {selectedCandidate.careerVelocity && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '8px' }}>
                    CAREER VELOCITY
                  </div>
                  <div style={{ fontSize: '14px', color: '#0f172a' }}>
                    {selectedCandidate.careerVelocity.interpretation}
                  </div>
                  {selectedCandidate.careerVelocity.stagnationSignal && (
                    <div style={{
                      marginTop: '8px',
                      padding: '8px 12px',
                      backgroundColor: '#fef3c7',
                      borderRadius: '4px',
                      fontSize: '12px',
                      color: '#92400e',
                    }}>
                      Stagnation signal detected - may be open to move
                    </div>
                  )}
                </div>
              )}

              {/* Sources */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '8px' }}>
                  SOURCES
                </div>
                {(selectedCandidate.sources || []).slice(0, 3).map((source, i) => (
                  <a
                    key={i}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'block',
                      padding: '8px',
                      backgroundColor: '#f8fafc',
                      borderRadius: '4px',
                      marginBottom: '8px',
                      fontSize: '12px',
                      color: '#4F46E5',
                      textDecoration: 'none',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    [{source.type}] {source.url}
                  </a>
                ))}
              </div>

              {/* Unique Value */}
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '8px' }}>
                  WHY THIS CANDIDATE
                </div>
                <div style={{ fontSize: '14px', color: '#0f172a' }}>
                  {selectedCandidate.uniqueValue}
                </div>
              </div>

              {/* Archive/Shortlist Button */}
              {selectedCandidate.id && (
                <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e2e8f0' }}>
                  {viewFilter === 'shortlist' ? (
                    <button
                      onClick={() => handleArchive(selectedCandidate.id!)}
                      disabled={processingCandidateId === selectedCandidate.id}
                      style={{
                        width: '100%',
                        padding: '12px',
                        backgroundColor: processingCandidateId === selectedCandidate.id ? '#f3f4f6' : '#ffffff',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: 600,
                        color: processingCandidateId === selectedCandidate.id ? '#9ca3af' : '#374151',
                        cursor: processingCandidateId === selectedCandidate.id ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s',
                        opacity: processingCandidateId === selectedCandidate.id ? 0.6 : 1,
                      }}
                    >
                      {processingCandidateId === selectedCandidate.id ? 'Archiving...' : 'Archive Candidate'}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleShortlist(selectedCandidate.id!)}
                      disabled={processingCandidateId === selectedCandidate.id}
                      style={{
                        width: '100%',
                        padding: '12px',
                        backgroundColor: processingCandidateId === selectedCandidate.id ? '#86efac' : '#10B981',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#ffffff',
                        cursor: processingCandidateId === selectedCandidate.id ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s',
                        opacity: processingCandidateId === selectedCandidate.id ? 0.6 : 1,
                      }}
                    >
                      {processingCandidateId === selectedCandidate.id ? 'Shortlisting...' : 'Shortlist Candidate'}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
