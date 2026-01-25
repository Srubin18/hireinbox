'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// ============================================
// HIREINBOX - TALENT MAPPING (RECRUITER TYPE B)
// /hire/recruiter/mapping
//
// Boutique / Executive Search:
// - Natural language prompt input
// - AI clarifying questions (max 3)
// - Async execution (30-90 min)
// - Legal sources only (public data)
// - Results: market overview + candidate list
// ============================================

type MappingStatus = 'input' | 'clarifying' | 'processing' | 'complete';

interface ClarifyingQuestion {
  question: string;
  answer?: string;
}

interface CandidateSource {
  url: string;
  type: string;
  excerpt: string;
  valueLevel?: 'high' | 'medium' | 'low';
}

interface SalaryEstimate {
  min: number;
  max: number;
  currency: string;
  confidence: 'high' | 'medium' | 'low';
  basis: string;
}

interface AvailabilitySignals {
  score: number;
  signals: string[];
  interpretation: string;
}

interface SkillInferred {
  skill: string;
  evidence: string;
  confidence: 'high' | 'medium' | 'low';
}

interface CareerTrajectory {
  direction: 'rising' | 'stable' | 'transitioning' | 'unknown';
  evidence: string;
  yearsInRole?: string;
}

interface InferredProfile {
  yearsExperience?: string;
  careerPath?: string;
  specializations?: string[];
  accomplishments?: string[];
}

interface ApproachStrategy {
  angle: string;
  timing: string;
  leverage: string;
}

interface MappedCandidate {
  id: string;
  name: string;
  currentRole: string;
  company: string;
  industry: string;
  location: string;
  discoveryMethod?: string;
  sources: CandidateSource[];
  salaryEstimate: SalaryEstimate;
  inferredProfile?: InferredProfile;
  availabilitySignals: AvailabilitySignals;
  skillsInferred: SkillInferred[];
  careerTrajectory: CareerTrajectory;
  approachStrategy?: ApproachStrategy;
  matchScore: number;
  matchReasons: string[];
  potentialConcerns: string[];
  confidence: 'high' | 'medium' | 'low';
  uniqueValue?: string;
}

interface MarketIntelligence {
  talentPoolSize: string;
  talentHotspots?: string[];
  competitorActivity: { company: string; signal: string; implication?: string }[];
  salaryTrends: string;
  marketTightness: 'tight' | 'balanced' | 'abundant';
  recommendations: string[];
  hiddenPools?: string[];
}

interface SourcingStrategy {
  primaryChannels: string[];
  hiddenChannels: string[];
  timingConsiderations: string[];
  competitiveAdvantage: string;
}

interface IntelligenceQuality {
  totalSources: number;
  highValueSources: number;
  linkedInSources: number;
  sourceBreakdown: Record<string, number>;
  diversityScore: number;
}

interface SearchCriteria {
  originalPrompt: string;
  parsed: {
    role: string;
    location: string;
    experience: string;
    industry: string;
    mustHaves: string[];
    niceToHaves: string[];
  };
}

interface MappingResult {
  marketIntelligence: MarketIntelligence;
  candidates: MappedCandidate[];
  sourcingStrategy?: SourcingStrategy;
  searchCriteria: SearchCriteria;
  intelligenceQuality?: IntelligenceQuality;
  completedAt: string;
}

const Logo = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }} aria-label="HireInbox" role="img">
    <svg width="36" height="36" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <rect width="48" height="48" rx="12" fill="#4F46E5"/>
      <path d="M12 18L24 26L36 18V32C36 33.1 35.1 34 34 34H14C12.9 34 12 33.1 12 32V18Z" fill="white" fillOpacity="0.9"/>
      <path d="M34 14H14C12.9 14 12 14.9 12 16V18L24 26L36 18V16C36 14.9 35.1 14 34 14Z" fill="white"/>
      <circle cx="36" cy="12" r="9" fill="#10B981"/>
      <path d="M32.5 12L35 14.5L39.5 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
    <div aria-hidden="true">
      <div style={{ fontSize: '16px', fontWeight: 700, letterSpacing: '-0.02em' }}>
        <span style={{ color: '#0f172a' }}>Hire</span><span style={{ color: '#4F46E5' }}>Inbox</span>
      </div>
    </div>
  </div>
);

const CONFIDENCE_STYLES = {
  high: { label: 'High', color: '#059669', bgColor: '#d1fae5' },
  medium: { label: 'Medium', color: '#d97706', bgColor: '#fef3c7' },
  low: { label: 'Low', color: '#64748b', bgColor: '#f1f5f9' }
};

const MARKET_TIGHTNESS_LABELS = {
  tight: { label: 'Competitive', color: '#dc2626' },
  balanced: { label: 'Balanced', color: '#d97706' },
  abundant: { label: 'Available', color: '#059669' }
};

function formatSalary(amount: number): string {
  return `R${(amount / 1000).toFixed(0)}k`;
}

export default function TalentMappingPage() {
  const router = useRouter();
  const [status, setStatus] = useState<MappingStatus>('input');
  const [searchPrompt, setSearchPrompt] = useState('');
  const [clarifyingQuestions, setClarifyingQuestions] = useState<ClarifyingQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [result, setResult] = useState<MappingResult | null>(null);
  const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(new Set());
  const [draftingOutreach, setDraftingOutreach] = useState<string | null>(null);
  const [clarifyingAnswer, setClarifyingAnswer] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);
  const processingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup processing timer on unmount
  useEffect(() => {
    return () => {
      if (processingTimerRef.current) {
        clearTimeout(processingTimerRef.current);
      }
    };
  }, []);

  // Modal keyboard handling (escape to close) and focus trap
  useEffect(() => {
    if (!draftingOutreach) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDraftingOutreach(null);
      }
      // Focus trap
      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    // Focus the modal when it opens
    modalRef.current?.focus();

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [draftingOutreach]);

  const handleSubmitSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchPrompt.trim()) return;

    // MAGICAL EXPERIENCE: Go straight to processing
    // The AI extracts everything it needs from the natural language prompt
    // No redundant questions - the prompt is the source of truth
    setStatus('processing');

    try {
      // Call the real talent mapping API
      const response = await fetch('/api/talent-mapping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: searchPrompt.trim() })
      });

      if (!response.ok) {
        throw new Error('Failed to process search');
      }

      const data = await response.json();
      setResult(data);
      setStatus('complete');
    } catch (error) {
      console.error('Talent mapping error:', error);
      // Show error state
      alert('Failed to process your search. Please try again.');
      setStatus('input');
    }
  };

  // Clarifying questions are no longer used - we go straight to API
  // These handlers are kept for backwards compatibility but redirect to API
  const handleAnswerQuestion = (answer: string) => {
    const updated = [...clarifyingQuestions];
    updated[currentQuestionIndex].answer = answer;
    setClarifyingQuestions(updated);
    setClarifyingAnswer('');

    if (currentQuestionIndex < clarifyingQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // All questions answered - call API
      handleSubmitSearch({ preventDefault: () => {} } as React.FormEvent);
    }
  };

  const handleSkipQuestions = () => {
    // Skip questions - call API directly
    handleSubmitSearch({ preventDefault: () => {} } as React.FormEvent);
  };

  const toggleCandidate = (id: string) => {
    const newSelected = new Set(selectedCandidates);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedCandidates(newSelected);
  };

  const handleExport = () => {
    // In production: generate CSV/Excel
    alert('Export functionality - would download CSV with selected candidates');
  };

  const handleDraftOutreach = useCallback((candidate: MappedCandidate, roleDescription?: string) => {
    const role = roleDescription || candidate.currentRole;
    const topSkills = candidate.skillsInferred.slice(0, 2).map(s => s.skill).join(' and ');

    const draft = `Subject: Opportunity - ${role}

Hi ${candidate.name.split(' ')[0]},

I came across your profile and was impressed by your experience as ${candidate.currentRole} at ${candidate.company}.

${topSkills ? `Your expertise in ${topSkills} caught my attention. ` : ''}I'm working with a client who is looking for a ${role} in ${candidate.location}, and I believe your background could be an excellent fit.

Would you be open to a brief conversation to learn more?

Best regards,
[Your name]`;
    setDraftingOutreach(draft);
  }, []);

  const renderInputStep = () => (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '48px 24px' }}>
      <h1 style={{
        fontSize: '32px',
        fontWeight: 700,
        color: '#0f172a',
        marginBottom: '12px',
        textAlign: 'center'
      }}>
        Talent Mapping
      </h1>
      <p style={{
        fontSize: '16px',
        color: '#64748b',
        marginBottom: '48px',
        textAlign: 'center',
        lineHeight: 1.6,
        maxWidth: '550px',
        margin: '0 auto 48px'
      }}>
        Tell us exactly who you're looking for in plain English. Include the role, location, experience, qualifications, and any specific traits. The more detail, the better the results.
      </p>

      <form onSubmit={handleSubmitSearch}>
        <div style={{
          backgroundColor: '#ffffff',
          border: '2px solid #e2e8f0',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px'
        }}>
          <label
            htmlFor="search-prompt"
            style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 600,
              color: '#374151',
              marginBottom: '12px'
            }}
          >
            What are you looking for?
          </label>
          <textarea
            id="search-prompt"
            value={searchPrompt}
            onChange={(e) => setSearchPrompt(e.target.value)}
            placeholder="Example: I'm looking for a Finance Manager in Cape Town with at least 5 years experience. Ideally CA(SA) qualified, with experience in retail or FMCG. Someone who has managed a small team and is comfortable with financial systems like SAP."
            style={{
              width: '100%',
              minHeight: '150px',
              padding: '16px',
              fontSize: '15px',
              border: '2px solid #e2e8f0',
              borderRadius: '10px',
              outline: 'none',
              resize: 'vertical',
              lineHeight: 1.6
            }}
          />
        </div>

        <div style={{
          backgroundColor: '#fef3c7',
          border: '1px solid #fcd34d',
          borderRadius: '10px',
          padding: '16px',
          marginBottom: '24px',
          display: 'flex',
          gap: '12px'
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#92400e" strokeWidth="2" aria-hidden="true">
            <path d="M12 3v18M5 7l7-4 7 4M5 7v3l7 4 7-4V7M5 17l7 4 7-4"/>
          </svg>
          <div style={{ fontSize: '13px', color: '#92400e', lineHeight: 1.5 }}>
            <strong>Legal & Ethical:</strong> We only use publicly available sources (company websites, press releases, conference bios, public articles). We do not scrape social media, collect contact information, or message candidates directly.
          </div>
        </div>

        <button
          type="submit"
          disabled={!searchPrompt.trim()}
          style={{
            width: '100%',
            padding: '16px',
            backgroundColor: searchPrompt.trim() ? '#4F46E5' : '#e2e8f0',
            color: searchPrompt.trim() ? '#ffffff' : '#94a3b8',
            border: 'none',
            borderRadius: '10px',
            fontSize: '16px',
            fontWeight: 600,
            cursor: searchPrompt.trim() ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s'
          }}
        >
          Start Mapping
        </button>
      </form>
    </div>
  );

  const renderClarifyingStep = () => {
    const currentQ = clarifyingQuestions[currentQuestionIndex];
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '48px 24px' }}>
        <div style={{
          backgroundColor: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '32px',
          fontSize: '14px',
          color: '#1e40af'
        }}>
          Your search: "{searchPrompt.slice(0, 100)}..."
        </div>

        <h2 style={{
          fontSize: '24px',
          fontWeight: 700,
          color: '#0f172a',
          marginBottom: '8px'
        }}>
          Quick clarification
        </h2>
        <p style={{
          fontSize: '14px',
          color: '#64748b',
          marginBottom: '32px'
        }}>
          Question {currentQuestionIndex + 1} of {clarifyingQuestions.length}
        </p>

        <div style={{
          backgroundColor: '#ffffff',
          border: '2px solid #e2e8f0',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px'
        }}>
          <label
            htmlFor="clarifying-answer"
            style={{
              display: 'block',
              fontSize: '16px',
              fontWeight: 500,
              color: '#0f172a',
              marginBottom: '16px'
            }}
          >
            {currentQ.question}
          </label>
          <input
            id="clarifying-answer"
            type="text"
            value={clarifyingAnswer}
            onChange={(e) => setClarifyingAnswer(e.target.value)}
            placeholder="Your answer..."
            onKeyDown={(e) => {
              if (e.key === 'Enter' && clarifyingAnswer.trim()) {
                handleAnswerQuestion(clarifyingAnswer);
              }
            }}
            style={{
              width: '100%',
              padding: '14px 16px',
              fontSize: '15px',
              border: '2px solid #e2e8f0',
              borderRadius: '8px',
              outline: 'none'
            }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <button
            onClick={handleSkipQuestions}
            style={{
              padding: '12px 24px',
              backgroundColor: 'transparent',
              color: '#64748b',
              border: 'none',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            Skip questions & start
          </button>
          <div style={{ fontSize: '13px', color: '#94a3b8' }}>
            Press Enter to continue
          </div>
        </div>
      </div>
    );
  };

  const renderProcessingStep = () => (
    <div style={{
      maxWidth: '600px',
      margin: '0 auto',
      padding: '60px 24px',
      textAlign: 'center'
    }}>
      {/* Spinner */}
      <div style={{
        width: '64px',
        height: '64px',
        margin: '0 auto 32px',
        border: '4px solid #e2e8f0',
        borderTopColor: '#4F46E5',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }} />

      <h2 style={{
        fontSize: '24px',
        fontWeight: 700,
        color: '#0f172a',
        marginBottom: '12px'
      }}>
        Mapping talent pool
      </h2>

      <p style={{
        fontSize: '15px',
        color: '#64748b',
        marginBottom: '32px',
        lineHeight: 1.6
      }}>
        Analysing public sources for matching candidates
      </p>

      {/* Search summary */}
      <div style={{
        backgroundColor: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '10px',
        padding: '16px',
        marginBottom: '24px',
        textAlign: 'left'
      }}>
        <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
          Search criteria
        </div>
        <div style={{ fontSize: '14px', color: '#374151', lineHeight: 1.5 }}>
          {searchPrompt}
        </div>
      </div>

      <div style={{
        fontSize: '13px',
        color: '#94a3b8'
      }}>
        This typically takes 15-30 seconds
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );

  const renderResultsStep = () => (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Intelligence Quality Badge */}
      {result?.intelligenceQuality && (
        <div style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '16px',
          flexWrap: 'wrap'
        }}>
          <div style={{
            padding: '8px 14px',
            backgroundColor: result.intelligenceQuality.highValueSources > 5 ? '#d1fae5' : '#fef3c7',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 600,
            color: result.intelligenceQuality.highValueSources > 5 ? '#047857' : '#b45309'
          }}>
            {result.intelligenceQuality.highValueSources} high-value sources
          </div>
          <div style={{
            padding: '8px 14px',
            backgroundColor: '#ede9fe',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 600,
            color: '#7c3aed'
          }}>
            {result.intelligenceQuality.diversityScore} source types
          </div>
          {result.intelligenceQuality.linkedInSources < result.intelligenceQuality.totalSources / 2 && (
            <div style={{
              padding: '8px 14px',
              backgroundColor: '#dbeafe',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              color: '#1d4ed8'
            }}>
              Hidden candidates found
            </div>
          )}
        </div>
      )}

      {/* Market Intelligence */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <h2 style={{
            fontSize: '18px',
            fontWeight: 700,
            color: '#0f172a'
          }}>
            Market Intelligence
          </h2>
          {result?.marketIntelligence?.marketTightness && (
            <span style={{
              padding: '4px 10px',
              backgroundColor: '#f1f5f9',
              color: MARKET_TIGHTNESS_LABELS[result.marketIntelligence.marketTightness]?.color || '#64748b',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600
            }}>
              {MARKET_TIGHTNESS_LABELS[result.marketIntelligence.marketTightness]?.label || 'Unknown'} market
            </span>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Talent Pool</div>
            <div style={{ fontSize: '14px', color: '#0f172a' }}>{result?.marketIntelligence?.talentPoolSize || 'Analysing...'}</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Salary Trends</div>
            <div style={{ fontSize: '14px', color: '#0f172a' }}>{result?.marketIntelligence?.salaryTrends || 'Analysing...'}</div>
          </div>
        </div>

        {/* Talent Hotspots */}
        {result?.marketIntelligence?.talentHotspots && result.marketIntelligence.talentHotspots.length > 0 && (
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '6px' }}>Talent Hotspots</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {result.marketIntelligence.talentHotspots.map((spot, i) => (
                <span key={i} style={{
                  padding: '4px 10px',
                  backgroundColor: '#dbeafe',
                  color: '#1d4ed8',
                  borderRadius: '6px',
                  fontSize: '12px'
                }}>
                  {spot}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Hidden Pools - Premium Value */}
        {result?.marketIntelligence?.hiddenPools && result.marketIntelligence.hiddenPools.length > 0 && (
          <div style={{
            backgroundColor: '#faf5ff',
            border: '1px solid #e9d5ff',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '12px'
          }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#7c3aed', marginBottom: '6px' }}>
              Hidden Talent Pools (Premium Intel)
            </div>
            <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '13px', color: '#6b21a8' }}>
              {result.marketIntelligence.hiddenPools.map((pool, i) => (
                <li key={i} style={{ marginBottom: '4px' }}>{pool}</li>
              ))}
            </ul>
          </div>
        )}

        {result?.marketIntelligence?.recommendations && result.marketIntelligence.recommendations.length > 0 && (
          <div style={{ backgroundColor: '#fef3c7', borderRadius: '8px', padding: '12px', marginTop: '12px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#92400e', marginBottom: '6px' }}>Recommendations</div>
            <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '13px', color: '#78350f' }}>
              {result.marketIntelligence.recommendations.map((rec, i) => (
                <li key={i} style={{ marginBottom: '4px' }}>{rec}</li>
              ))}
            </ul>
          </div>
        )}

        <div style={{
          marginTop: '16px',
          padding: '10px 12px',
          backgroundColor: '#f8fafc',
          borderRadius: '6px',
          fontSize: '12px',
          color: '#64748b'
        }}>
          Searched {result?.intelligenceQuality?.totalSources || 0} sources • {result?.searchCriteria?.parsed?.role || 'Role'} in {result?.searchCriteria?.parsed?.location || 'Location'}
        </div>
      </div>

      {/* Sourcing Strategy - Premium Value */}
      {result?.sourcingStrategy && (result.sourcingStrategy.hiddenChannels?.length > 0 || result.sourcingStrategy.competitiveAdvantage) && (
        <div style={{
          backgroundColor: '#ffffff',
          border: '2px solid #7c3aed',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              Sourcing Strategy
            </h2>
            <span style={{
              padding: '2px 8px',
              backgroundColor: '#ede9fe',
              color: '#7c3aed',
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: 700
            }}>
              PREMIUM
            </span>
          </div>

          {result.sourcingStrategy.competitiveAdvantage && (
            <div style={{
              padding: '12px',
              backgroundColor: '#faf5ff',
              borderRadius: '8px',
              marginBottom: '16px',
              fontSize: '14px',
              color: '#6b21a8',
              fontStyle: 'italic'
            }}>
              {result.sourcingStrategy.competitiveAdvantage}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {result.sourcingStrategy.hiddenChannels?.length > 0 && (
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#7c3aed', marginBottom: '8px' }}>Hidden Channels</div>
                <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '13px', color: '#374151' }}>
                  {result.sourcingStrategy.hiddenChannels.map((ch, i) => (
                    <li key={i} style={{ marginBottom: '4px' }}>{ch}</li>
                  ))}
                </ul>
              </div>
            )}
            {result.sourcingStrategy.timingConsiderations?.length > 0 && (
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '8px' }}>Timing Tips</div>
                <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '13px', color: '#374151' }}>
                  {result.sourcingStrategy.timingConsiderations.map((tip, i) => (
                    <li key={i} style={{ marginBottom: '4px' }}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        <div style={{ fontSize: '14px', color: '#64748b' }}>
          {selectedCandidates.size > 0 ? `${selectedCandidates.size} selected` : `${result?.candidates.length} candidates found`}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleExport}
            disabled={selectedCandidates.size === 0}
            style={{
              padding: '8px 16px',
              backgroundColor: selectedCandidates.size > 0 ? '#0f172a' : '#e2e8f0',
              color: selectedCandidates.size > 0 ? '#ffffff' : '#94a3b8',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 500,
              cursor: selectedCandidates.size > 0 ? 'pointer' : 'not-allowed'
            }}
          >
            Export Selected
          </button>
        </div>
      </div>

      {/* Candidates list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {result?.candidates.map((candidate) => (
          <div
            key={candidate.id}
            style={{
              backgroundColor: selectedCandidates.has(candidate.id) ? '#eff6ff' : '#ffffff',
              border: `2px solid ${selectedCandidates.has(candidate.id) ? '#3b82f6' : '#e2e8f0'}`,
              borderRadius: '12px',
              padding: '20px',
              transition: 'all 0.2s'
            }}
          >
            {/* Header row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <input
                  type="checkbox"
                  id={`candidate-${candidate.id}`}
                  checked={selectedCandidates.has(candidate.id)}
                  onChange={() => toggleCandidate(candidate.id)}
                  aria-label={`Select ${candidate.name}`}
                  style={{ width: '18px', height: '18px', accentColor: '#4F46E5', marginTop: '3px' }}
                />
                <label htmlFor={`candidate-${candidate.id}`} style={{ cursor: 'pointer' }}>
                  <div style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>
                    {candidate.name}
                  </div>
                  <div style={{ fontSize: '14px', color: '#64748b', marginTop: '2px' }}>
                    {candidate.currentRole} at {candidate.company}
                  </div>
                  <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '2px' }}>
                    {candidate.industry} • {candidate.location}
                  </div>
                  {candidate.discoveryMethod && (
                    <div style={{
                      marginTop: '6px',
                      padding: '4px 8px',
                      backgroundColor: '#faf5ff',
                      borderRadius: '4px',
                      fontSize: '11px',
                      color: '#7c3aed',
                      display: 'inline-block'
                    }}>
                      Found via: {candidate.discoveryMethod}
                    </div>
                  )}
                </label>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                <div style={{
                  padding: '6px 12px',
                  backgroundColor: candidate.matchScore >= 80 ? '#d1fae5' : candidate.matchScore >= 60 ? '#fef3c7' : '#f1f5f9',
                  color: candidate.matchScore >= 80 ? '#059669' : candidate.matchScore >= 60 ? '#d97706' : '#64748b',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 700
                }}>
                  {candidate.matchScore}% match
                </div>
                <span style={{
                  fontSize: '11px',
                  color: CONFIDENCE_STYLES[candidate.confidence].color
                }}>
                  {CONFIDENCE_STYLES[candidate.confidence].label} confidence
                </span>
              </div>
            </div>

            {/* Key metrics row */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px',
              marginBottom: '16px',
              padding: '12px',
              backgroundColor: '#f8fafc',
              borderRadius: '8px'
            }}>
              <div>
                <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '2px' }}>Salary Estimate</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
                  {formatSalary(candidate.salaryEstimate.min)} - {formatSalary(candidate.salaryEstimate.max)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '2px' }}>Availability</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: candidate.availabilitySignals.score >= 7 ? '#059669' : candidate.availabilitySignals.score >= 4 ? '#d97706' : '#64748b' }}>
                  {candidate.availabilitySignals.score}/10
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '2px' }}>Trajectory</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', textTransform: 'capitalize' }}>
                  {candidate.careerTrajectory.direction}
                </div>
              </div>
            </div>

            {/* Match reasons */}
            {candidate.matchReasons.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#059669', marginBottom: '6px' }}>Why they match</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {candidate.matchReasons.map((reason, i) => (
                    <span key={i} style={{
                      padding: '4px 8px',
                      backgroundColor: '#d1fae5',
                      color: '#065f46',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}>
                      {reason}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Potential concerns */}
            {candidate.potentialConcerns.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#d97706', marginBottom: '6px' }}>Considerations</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {candidate.potentialConcerns.map((concern, i) => (
                    <span key={i} style={{
                      padding: '4px 8px',
                      backgroundColor: '#fef3c7',
                      color: '#92400e',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}>
                      {concern}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Skills inferred */}
            {candidate.skillsInferred.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '6px' }}>Skills Inferred</div>
                <div style={{ fontSize: '13px', color: '#475569' }}>
                  {candidate.skillsInferred.slice(0, 3).map(s => s.skill).join(' • ')}
                </div>
              </div>
            )}

            {/* Unique Value - Premium Intel */}
            {candidate.uniqueValue && (
              <div style={{
                marginBottom: '12px',
                padding: '10px 12px',
                backgroundColor: '#faf5ff',
                border: '1px solid #e9d5ff',
                borderRadius: '8px'
              }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#7c3aed', marginBottom: '4px' }}>Why This Candidate is Special</div>
                <div style={{ fontSize: '13px', color: '#6b21a8' }}>{candidate.uniqueValue}</div>
              </div>
            )}

            {/* Approach Strategy */}
            {candidate.approachStrategy && (candidate.approachStrategy.angle || candidate.approachStrategy.leverage) && (
              <div style={{
                marginBottom: '12px',
                padding: '10px 12px',
                backgroundColor: '#eff6ff',
                borderRadius: '8px'
              }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#1d4ed8', marginBottom: '6px' }}>Approach Strategy</div>
                <div style={{ fontSize: '12px', color: '#1e40af' }}>
                  {candidate.approachStrategy.angle && <div style={{ marginBottom: '2px' }}><strong>Angle:</strong> {candidate.approachStrategy.angle}</div>}
                  {candidate.approachStrategy.timing && <div style={{ marginBottom: '2px' }}><strong>Timing:</strong> {candidate.approachStrategy.timing}</div>}
                  {candidate.approachStrategy.leverage && <div><strong>Leverage:</strong> {candidate.approachStrategy.leverage}</div>}
                </div>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              {candidate.sources.length > 0 && (
                <button
                  onClick={() => window.open(candidate.sources[0].url, '_blank')}
                  style={{
                    padding: '8px 14px',
                    backgroundColor: '#f1f5f9',
                    color: '#475569',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  View Source ({candidate.sources.length})
                </button>
              )}
              <button
                onClick={() => handleDraftOutreach(candidate, result?.searchCriteria?.parsed?.role)}
                style={{
                  padding: '8px 14px',
                  backgroundColor: '#4F46E5',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                Draft Outreach
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Outreach Draft Modal */}
      {draftingOutreach && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            zIndex: 100
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setDraftingOutreach(null);
          }}
        >
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="outreach-modal-title"
            tabIndex={-1}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '80vh',
              overflow: 'auto',
              outline: 'none'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 id="outreach-modal-title" style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>Draft Outreach</h3>
              <button
                onClick={() => setDraftingOutreach(null)}
                aria-label="Close dialog"
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#64748b'
                }}
              >
                ×
              </button>
            </div>
            <label htmlFor="outreach-draft" className="visually-hidden" style={{
              position: 'absolute',
              width: '1px',
              height: '1px',
              padding: 0,
              margin: '-1px',
              overflow: 'hidden',
              clip: 'rect(0, 0, 0, 0)',
              whiteSpace: 'nowrap',
              border: 0
            }}>
              Outreach message draft
            </label>
            <textarea
              id="outreach-draft"
              value={draftingOutreach}
              onChange={(e) => setDraftingOutreach(e.target.value)}
              aria-label="Outreach message draft"
              style={{
                width: '100%',
                minHeight: '300px',
                padding: '16px',
                fontSize: '14px',
                border: '2px solid #e2e8f0',
                borderRadius: '10px',
                outline: 'none',
                lineHeight: 1.6,
                fontFamily: 'inherit'
              }}
            />
            <div style={{
              marginTop: '16px',
              padding: '12px',
              backgroundColor: '#fef3c7',
              borderRadius: '8px',
              fontSize: '13px',
              color: '#92400e'
            }}>
              Note: You will need to send this message manually via your own email or LinkedIn. HireInbox does not send automated outreach.
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(draftingOutreach);
                  alert('Copied to clipboard!');
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#4F46E5',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Copy to Clipboard
              </button>
              <button
                onClick={() => setDraftingOutreach(null)}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#f1f5f9',
                  color: '#475569',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

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
        <button
          onClick={() => router.push('/hire/recruiter')}
          style={{
            padding: '8px 16px',
            backgroundColor: 'transparent',
            color: '#64748b',
            border: 'none',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          ← Back
        </button>
      </header>

      {/* Main content */}
      <main>
        {status === 'input' && renderInputStep()}
        {status === 'clarifying' && renderClarifyingStep()}
        {status === 'processing' && renderProcessingStep()}
        {status === 'complete' && renderResultsStep()}
      </main>

      {/* Support button */}
      <button
        aria-label="Get support"
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
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        Support
      </button>
    </div>
  );
}
