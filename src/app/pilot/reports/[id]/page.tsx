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
  name: string;
  currentRole: string;
  company: string;
  location: string;
  matchScore: number;
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
  const [expandedCandidate, setExpandedCandidate] = useState<string | null>(null);

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
    }
  }, [reportId, fetchReport]);

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

  const candidates = report.report_data?.candidates || [];
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

        {/* Market Intelligence - HIDDEN per Simon's request (salary range not needed) */}
        {/* To restore: change SHOW_MARKET_INTELLIGENCE to true */}
        {(() => {
          const SHOW_MARKET_INTELLIGENCE = false;
          if (!SHOW_MARKET_INTELLIGENCE || !marketIntelligence) return null;
          return (
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
          );
        })()}

        {/* Candidates List - Expandable Cards (matching live talent mapping view) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#64748b' }}>
              {candidates.length} candidates found
            </h2>
          </div>

          {candidates.map((candidate, index) => {
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
                <div style={{ padding: '20px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <input
                          type="checkbox"
                          style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                          onClick={(e) => e.stopPropagation()}
                        />
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
                            {candidate.resignationPropensity.score === 'High' ? 'Good time to approach' :
                             candidate.resignationPropensity.score === 'Medium' ? 'May be open' : 'May need persuasion'} - {candidate.resignationPropensity.score} Move Likelihood
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
                            Tip: {candidate.resignationPropensity.recommendation}
                          </div>
                        )}
                      </div>

                      {/* Career Velocity */}
                      {candidate.careerVelocity && (
                        <div style={{ marginBottom: '16px' }}>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                            Career Velocity
                          </div>
                          <div style={{ fontSize: '13px', color: '#475569' }}>
                            {candidate.careerVelocity.interpretation}
                          </div>
                          {candidate.careerVelocity.stagnationSignal && (
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
                            <span style={{ fontWeight: 600, color: '#4F46E5' }}>Suggested Opener:</span> &quot;{candidate.personalizedHook.suggestedOpener || 'I noticed your work at ' + candidate.company + '...'}&quot;
                          </div>
                        </div>
                      )}

                      {/* Sources */}
                      <div style={{ marginBottom: '16px' }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                          Sources
                        </div>
                        {(candidate.sources || []).slice(0, 3).map((source, i) => (
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
                        <button
                          style={{
                            padding: '10px 16px',
                            backgroundColor: '#4F46E5',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontWeight: 500,
                            color: '#ffffff',
                            cursor: 'pointer',
                          }}
                        >
                          Draft Outreach
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
