'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// ============================================
// HIREINBOX TALENT POOL - EMPLOYER BROWSE
// Signal-rich. Transparent. Evidence-based.
// ============================================

interface MatchReason {
  reason: string;
  source: 'cv' | 'video' | 'interview' | 'skills';
  evidence: string;
}

interface PoolCandidate {
  id: string;
  name: string;
  currentRole: string;
  yearsExperience: number;
  location: string;
  skills: string[];
  matchScore: number;
  confidence: 'high' | 'medium' | 'low';
  matchReasons: MatchReason[];
  intent: 'actively_looking' | 'open' | 'not_looking';
  workArrangement?: 'remote' | 'hybrid' | 'office' | 'flexible';
  salaryMin?: number;
  salaryMax?: number;
  hasVideo: boolean;
  hasInterview: boolean;
  profileCompleteness: number;
  highlights: string[];
}


const CONFIDENCE_STYLES = {
  high: { label: 'High Confidence', color: '#059669', bgColor: '#d1fae5', icon: '●●●' },
  medium: { label: 'Medium Confidence', color: '#d97706', bgColor: '#fef3c7', icon: '●●○' },
  low: { label: 'Low Confidence', color: '#64748b', bgColor: '#f1f5f9', icon: '●○○' }
};

const INTENT_LABELS = {
  actively_looking: { label: 'Actively Looking', color: '#059669' },
  open: { label: 'Open to Opportunities', color: '#d97706' },
  not_looking: { label: 'Not Looking', color: '#64748b' }
};

// Professional SVG icons for evidence sources
const SourceIcon = ({ type }: { type: 'cv' | 'video' | 'interview' | 'skills' }) => {
  const icons = {
    cv: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ),
    video: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2">
        <polygon points="23 7 16 12 23 17 23 7"/>
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
      </svg>
    ),
    interview: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
        <line x1="12" y1="19" x2="12" y2="23"/>
        <line x1="8" y1="23" x2="16" y2="23"/>
      </svg>
    ),
    skills: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2">
        <circle cx="12" cy="12" r="10"/>
        <circle cx="12" cy="12" r="6"/>
        <circle cx="12" cy="12" r="2"/>
      </svg>
    )
  };
  return icons[type];
};

export default function TalentPoolBrowse() {
  const router = useRouter();
  const [candidates, setCandidates] = useState<PoolCandidate[]>([]);
  const [allSkills, setAllSkills] = useState<string[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<PoolCandidate | null>(null);
  const [filterSkill, setFilterSkill] = useState<string>('');
  const [filterConfidence, setFilterConfidence] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch candidates from API
  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/talent-pool/browse');
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch candidates');
        }

        setCandidates(data.candidates || []);
        setAllSkills(data.allSkills || []);
      } catch (err) {
        console.error('Failed to fetch candidates:', err);
        setError('Failed to load candidates. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchCandidates();
  }, []);

  const filteredCandidates = candidates.filter(c => {
    if (filterSkill && !c.skills.includes(filterSkill)) return false;
    if (filterConfidence !== 'all' && c.confidence !== filterConfidence) return false;
    return true;
  });

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Mobile responsive styles */}
      <style>{`
        @media (max-width: 768px) {
          .talent-pool-main { flex-direction: column !important; }
          .talent-pool-list { flex: 1 !important; border-right: none !important; }
          .talent-pool-detail { position: fixed !important; inset: 0 !important; z-index: 100 !important; overflow-y: auto !important; }
          .talent-pool-filters { flex-direction: column !important; gap: 12px !important; }
          .talent-pool-header-btn { display: none !important; }
        }
      `}</style>
      {/* Header */}
      <header style={{
        padding: '16px 24px',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <svg width="36" height="36" viewBox="0 0 48 48" fill="none">
            <rect width="48" height="48" rx="12" fill="#4F46E5"/>
            <path d="M12 18L24 26L36 18V32C36 33.1 35.1 34 34 34H14C12.9 34 12 33.1 12 32V18Z" fill="white" fillOpacity="0.9"/>
            <path d="M34 14H14C12.9 14 12 14.9 12 16V18L24 26L36 18V16C36 14.9 35.1 14 34 14Z" fill="white"/>
            <circle cx="36" cy="12" r="9" fill="#10B981"/>
            <path d="M32.5 12L35 14.5L39.5 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 700 }}>
              <span style={{ color: '#0f172a' }}>Hire</span>
              <span style={{ color: '#4F46E5' }}>Inbox</span>
              <span style={{ color: '#64748b', fontWeight: 500 }}> Public Talent Pool</span>
            </div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>Browse pre-vetted candidates actively seeking opportunities</div>
          </div>
          <div style={{
            marginLeft: 'auto',
            padding: '6px 14px',
            backgroundColor: '#dbeafe',
            color: '#1d4ed8',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M2 12h20"/>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
            Public Pool
          </div>
        </div>
        <button
          className="talent-pool-header-btn"
          onClick={() => router.push('/hire/dashboard')}
          style={{
            padding: '8px 16px',
            backgroundColor: 'transparent',
            color: '#64748b',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            fontSize: '13px',
            cursor: 'pointer'
          }}
        >
          ← Back to Dashboard
        </button>
      </header>

      {/* Filters */}
      <div style={{
        padding: '16px 24px',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        gap: '16px',
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        <div>
          <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Skill</label>
          <select
            value={filterSkill}
            onChange={(e) => setFilterSkill(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              fontSize: '14px',
              minWidth: '150px'
            }}
          >
            <option value="">All Skills</option>
            {allSkills.map(skill => (
              <option key={skill} value={skill}>{skill}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Confidence</label>
          <select
            value={filterConfidence}
            onChange={(e) => setFilterConfidence(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              fontSize: '14px',
              minWidth: '150px'
            }}
          >
            <option value="all">All Levels</option>
            <option value="high">High Confidence</option>
            <option value="medium">Medium Confidence</option>
            <option value="low">Low Confidence</option>
          </select>
        </div>
        <div style={{ marginLeft: 'auto', fontSize: '14px', color: '#64748b' }}>
          {filteredCandidates.length} candidates found
        </div>
      </div>

      {/* Main content */}
      <div className="talent-pool-main" style={{ display: 'flex', minHeight: 'calc(100vh - 140px)' }}>
        {/* Candidate list */}
        <div className="talent-pool-list" style={{
          flex: selectedCandidate ? '0 0 400px' : '1',
          padding: '24px',
          overflowY: 'auto',
          borderRight: selectedCandidate ? '1px solid #e2e8f0' : 'none'
        }}>
          {/* Loading state */}
          {loading && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '48px',
              color: '#64748b'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                border: '3px solid #e2e8f0',
                borderTopColor: '#4F46E5',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                marginBottom: '16px'
              }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              <div style={{ fontSize: '14px' }}>Loading candidates...</div>
            </div>
          )}

          {/* Error state */}
          {error && !loading && (
            <div style={{
              padding: '24px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '12px',
              color: '#dc2626',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
                Failed to load candidates
              </div>
              <div style={{ fontSize: '14px', marginBottom: '16px' }}>{error}</div>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Try Again
              </button>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && filteredCandidates.length === 0 && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '48px',
              textAlign: 'center'
            }}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" style={{ marginBottom: '16px' }}>
                <circle cx="12" cy="12" r="10"/>
                <path d="M16 16s-1.5-2-4-2-4 2-4 2"/>
                <line x1="9" y1="9" x2="9.01" y2="9"/>
                <line x1="15" y1="9" x2="15.01" y2="9"/>
              </svg>
              <div style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>
                No candidates yet
              </div>
              <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px', maxWidth: '300px' }}>
                {candidates.length === 0
                  ? 'Be the first to join our talent pool! Candidates who sign up will appear here.'
                  : 'No candidates match your current filters. Try adjusting your search criteria.'}
              </div>
              {candidates.length === 0 && (
                <button
                  onClick={() => router.push('/talent-pool/join')}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#4F46E5',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Join Talent Pool
                </button>
              )}
            </div>
          )}

          {/* Candidate list */}
          {!loading && !error && filteredCandidates.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filteredCandidates.map(candidate => (
              <div
                key={candidate.id}
                onClick={() => setSelectedCandidate(candidate)}
                style={{
                  backgroundColor: '#ffffff',
                  border: selectedCandidate?.id === candidate.id ? '2px solid #4F46E5' : '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '20px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>{candidate.name}</div>
                    <div style={{ fontSize: '14px', color: '#64748b' }}>{candidate.currentRole}</div>
                  </div>
                  <div style={{
                    padding: '6px 12px',
                    backgroundColor: CONFIDENCE_STYLES[candidate.confidence].bgColor,
                    color: CONFIDENCE_STYLES[candidate.confidence].color,
                    borderRadius: '20px',
                    fontSize: '13px',
                    fontWeight: 600
                  }}>
                    {candidate.matchScore}%
                  </div>
                </div>

                {/* Quick info */}
                <div style={{ display: 'flex', gap: '12px', fontSize: '13px', color: '#64748b', marginBottom: '8px', flexWrap: 'wrap' }}>
                  <span>{candidate.yearsExperience} years</span>
                  <span>{candidate.location}</span>
                  <span style={{ color: INTENT_LABELS[candidate.intent].color }}>{INTENT_LABELS[candidate.intent].label}</span>
                  {candidate.workArrangement && (
                    <span style={{
                      padding: '2px 8px',
                      backgroundColor: '#f0fdf4',
                      color: '#166534',
                      borderRadius: '10px',
                      fontSize: '11px'
                    }}>
                      {candidate.workArrangement.charAt(0).toUpperCase() + candidate.workArrangement.slice(1)}
                    </span>
                  )}
                </div>
                {/* Salary */}
                {(candidate.salaryMin || candidate.salaryMax) && (
                  <div style={{ fontSize: '12px', color: '#059669', marginBottom: '12px', fontWeight: 500 }}>
                    R{candidate.salaryMin?.toLocaleString() || '?'} - R{candidate.salaryMax?.toLocaleString() || '?'} /month
                  </div>
                )}

                {/* Skills */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                  {candidate.skills.slice(0, 4).map(skill => (
                    <span
                      key={skill}
                      style={{
                        padding: '4px 10px',
                        backgroundColor: '#f1f5f9',
                        borderRadius: '12px',
                        fontSize: '12px',
                        color: '#475569'
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                  {candidate.skills.length > 4 && (
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>+{candidate.skills.length - 4}</span>
                  )}
                </div>

                {/* Signals */}
                <div style={{ display: 'flex', gap: '8px', fontSize: '12px' }}>
                  <span style={{ color: CONFIDENCE_STYLES[candidate.confidence].color }}>
                    {CONFIDENCE_STYLES[candidate.confidence].icon}
                  </span>
                  {candidate.hasVideo && <span title="Video intro available"><SourceIcon type="video" /></span>}
                  {candidate.hasInterview && <span title="AI interview completed"><SourceIcon type="interview" /></span>}
                </div>
              </div>
            ))}
          </div>
          )}
        </div>

        {/* Detail panel */}
        {selectedCandidate && (
          <div style={{ flex: 1, padding: '24px', overflowY: 'auto', backgroundColor: '#ffffff' }}>
            {/* Close button */}
            <button
              onClick={() => setSelectedCandidate(null)}
              style={{
                position: 'absolute',
                right: '32px',
                top: '180px',
                backgroundColor: 'transparent',
                border: 'none',
                fontSize: '24px',
                color: '#94a3b8',
                cursor: 'pointer'
              }}
            >
              ×
            </button>

            {/* Profile header */}
            <div style={{ marginBottom: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
                    {selectedCandidate.name}
                  </h2>
                  <p style={{ fontSize: '16px', color: '#64748b', marginBottom: '8px' }}>
                    {selectedCandidate.currentRole} · {selectedCandidate.yearsExperience} years · {selectedCandidate.location}
                  </p>
                  <div style={{
                    display: 'inline-block',
                    padding: '4px 12px',
                    backgroundColor: INTENT_LABELS[selectedCandidate.intent].color + '20',
                    color: INTENT_LABELS[selectedCandidate.intent].color,
                    borderRadius: '12px',
                    fontSize: '13px',
                    fontWeight: 500
                  }}>
                    {INTENT_LABELS[selectedCandidate.intent].label}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    fontSize: '36px',
                    fontWeight: 700,
                    color: CONFIDENCE_STYLES[selectedCandidate.confidence].color
                  }}>
                    {selectedCandidate.matchScore}%
                  </div>
                  <div style={{
                    fontSize: '13px',
                    color: CONFIDENCE_STYLES[selectedCandidate.confidence].color
                  }}>
                    {CONFIDENCE_STYLES[selectedCandidate.confidence].label}
                  </div>
                </div>
              </div>
            </div>

            {/* Why they match - TRANSPARENT & EVIDENCE-BASED */}
            <div style={{
              backgroundColor: '#f8fafc',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '24px'
            }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Why They Match
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {selectedCandidate.matchReasons.map((reason, i) => (
                  <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <span style={{ display: 'flex', alignItems: 'center' }}><SourceIcon type={reason.source} /></span>
                    <div>
                      <div style={{ fontSize: '14px', color: '#0f172a', fontWeight: 500 }}>{reason.reason}</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>Source: {reason.evidence}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Skills */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Skills
              </h3>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {selectedCandidate.skills.map(skill => (
                  <span
                    key={skill}
                    style={{
                      padding: '6px 14px',
                      backgroundColor: '#eff6ff',
                      color: '#1e40af',
                      borderRadius: '16px',
                      fontSize: '13px',
                      fontWeight: 500
                    }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Highlights */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Key Highlights
              </h3>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                {selectedCandidate.highlights.map((highlight, i) => (
                  <li key={i} style={{ fontSize: '14px', color: '#475569', marginBottom: '8px' }}>{highlight}</li>
                ))}
              </ul>
            </div>

            {/* Profile signals */}
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Profile Signals
              </h3>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{
                  padding: '12px 16px',
                  backgroundColor: selectedCandidate.hasVideo ? '#d1fae5' : '#f1f5f9',
                  borderRadius: '8px',
                  fontSize: '13px',
                  color: selectedCandidate.hasVideo ? '#059669' : '#94a3b8'
                }}>
                  <SourceIcon type="video" /> Video Intro {selectedCandidate.hasVideo ? '✓' : '—'}
                </div>
                <div style={{
                  padding: '12px 16px',
                  backgroundColor: selectedCandidate.hasInterview ? '#d1fae5' : '#f1f5f9',
                  borderRadius: '8px',
                  fontSize: '13px',
                  color: selectedCandidate.hasInterview ? '#059669' : '#94a3b8'
                }}>
                  <SourceIcon type="interview" /> AI Interview {selectedCandidate.hasInterview ? '✓' : '—'}
                </div>
                <div style={{
                  padding: '12px 16px',
                  backgroundColor: '#eff6ff',
                  borderRadius: '8px',
                  fontSize: '13px',
                  color: '#1e40af'
                }}>
                  {selectedCandidate.profileCompleteness}% Complete
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                style={{
                  flex: 1,
                  padding: '14px',
                  backgroundColor: '#4F46E5',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Request to Connect
              </button>
              <button
                style={{
                  padding: '14px 20px',
                  backgroundColor: '#f1f5f9',
                  color: '#475569',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                Save
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
