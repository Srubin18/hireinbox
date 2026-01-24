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

interface MappedCandidate {
  id: string;
  name: string;
  currentRole: string;
  company: string;
  industry: string;
  location: string;
  whyMatch: string;
  sourceLinks: string[];
  confidence: 'high' | 'medium' | 'low';
}

interface MappingResult {
  marketOverview: string;
  totalFound: number;
  candidates: MappedCandidate[];
  searchCriteria: string;
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

// Result will be populated from API - no more fake data

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

  const handleDraftOutreach = useCallback((candidate: MappedCandidate, searchRole?: string) => {
    const roleDescription = searchRole || 'a similar role';
    const draft = `Subject: Opportunity - ${candidate.currentRole} role

Hi ${candidate.name.split(' ')[0]},

I came across your profile and was impressed by your experience as ${candidate.currentRole} at ${candidate.company}.

I'm working with a client who is looking for ${roleDescription} in ${candidate.location}, and I believe your background could be an excellent fit.

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
          <span style={{ fontSize: '20px' }} aria-hidden="true">⚖️</span>
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
      <div style={{
        width: '100px',
        height: '100px',
        margin: '0 auto 32px',
        borderRadius: '50%',
        backgroundColor: '#4F46E5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'pulse 2s infinite'
      }}>
        <span style={{ fontSize: '48px' }} aria-hidden="true">✨</span>
      </div>

      <h2 style={{
        fontSize: '28px',
        fontWeight: 700,
        color: '#0f172a',
        marginBottom: '16px'
      }}>
        Magic in progress...
      </h2>

      <p style={{
        fontSize: '16px',
        color: '#64748b',
        marginBottom: '24px',
        lineHeight: 1.6
      }}>
        AI is mapping the market based on your requirements.
      </p>

      {/* Show what was understood from the prompt */}
      <div style={{
        backgroundColor: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '24px',
        textAlign: 'left'
      }}>
        <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: '12px' }}>
          Your search
        </div>
        <div style={{ fontSize: '14px', color: '#374151', lineHeight: 1.6, fontStyle: 'italic' }}>
          "{searchPrompt}"
        </div>
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        marginBottom: '32px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'center' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981', animation: 'pulse 1s infinite' }} />
          <span style={{ fontSize: '14px', color: '#475569' }}>Scanning public sources...</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'center' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#fbbf24', animation: 'pulse 1.5s infinite' }} />
          <span style={{ fontSize: '14px', color: '#475569' }}>Building candidate profiles...</span>
        </div>
      </div>

      <div style={{
        backgroundColor: '#f0fdf4',
        border: '1px solid #86efac',
        borderRadius: '10px',
        padding: '16px',
        fontSize: '14px',
        color: '#166534'
      }}>
        <strong>Demo mode:</strong> Results will appear in a few seconds. In production, this takes 30-90 minutes and you'll be notified by email.
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.8; }
        }
      `}</style>
    </div>
  );

  const renderResultsStep = () => (
    <div style={{ padding: '24px' }}>
      {/* Market Overview */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px'
      }}>
        <h2 style={{
          fontSize: '18px',
          fontWeight: 700,
          color: '#0f172a',
          marginBottom: '12px'
        }}>
          Market Overview
        </h2>
        <p style={{
          fontSize: '14px',
          color: '#475569',
          lineHeight: 1.7
        }}>
          {result?.marketOverview}
        </p>
        <div style={{
          marginTop: '16px',
          padding: '12px',
          backgroundColor: '#f8fafc',
          borderRadius: '8px',
          fontSize: '13px',
          color: '#64748b'
        }}>
          Search: {result?.searchCriteria} • Found {result?.totalFound} potential matches
        </div>
      </div>

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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input
                  type="checkbox"
                  id={`candidate-${candidate.id}`}
                  checked={selectedCandidates.has(candidate.id)}
                  onChange={() => toggleCandidate(candidate.id)}
                  aria-label={`Select ${candidate.name}`}
                  style={{ width: '18px', height: '18px', accentColor: '#4F46E5' }}
                />
                <label htmlFor={`candidate-${candidate.id}`} style={{ cursor: 'pointer' }}>
                  <div style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>
                    {candidate.name}
                  </div>
                  <div style={{ fontSize: '14px', color: '#64748b', marginTop: '2px' }}>
                    {candidate.currentRole} at {candidate.company}
                  </div>
                </label>
              </div>
              <span style={{
                padding: '4px 10px',
                backgroundColor: CONFIDENCE_STYLES[candidate.confidence].bgColor,
                color: CONFIDENCE_STYLES[candidate.confidence].color,
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 500
              }}>
                {CONFIDENCE_STYLES[candidate.confidence].label} confidence
              </span>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px',
              marginBottom: '12px',
              fontSize: '13px'
            }}>
              <div>
                <span style={{ color: '#94a3b8' }}>Industry:</span>{' '}
                <span style={{ color: '#475569' }}>{candidate.industry}</span>
              </div>
              <div>
                <span style={{ color: '#94a3b8' }}>Location:</span>{' '}
                <span style={{ color: '#475569' }}>{candidate.location}</span>
              </div>
              <div>
                <span style={{ color: '#94a3b8' }}>Sources:</span>{' '}
                <span style={{ color: '#4F46E5' }}>{candidate.sourceLinks.length} link(s)</span>
              </div>
            </div>

            <div style={{
              backgroundColor: '#f8fafc',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '13px',
              color: '#475569',
              lineHeight: 1.5,
              marginBottom: '12px'
            }}>
              <strong>Why they match:</strong> {candidate.whyMatch}
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              {candidate.sourceLinks.length > 0 && (
                <button
                  onClick={() => window.open(candidate.sourceLinks[0], '_blank')}
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
                  View Source
                </button>
              )}
              <button
                onClick={() => handleDraftOutreach(candidate, result?.searchCriteria)}
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
        <span aria-hidden="true">💬</span> Support
      </button>
    </div>
  );
}
