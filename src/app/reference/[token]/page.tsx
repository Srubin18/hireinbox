'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

// ============================================
// REFERENCE CHECK FORM
// Secure form for referees to submit feedback
// ============================================

interface Question {
  id: string;
  text: string;
  type: 'text' | 'rating' | 'boolean';
}

interface RequestData {
  id: string;
  questions: Question[];
  candidate: { name: string };
  reference: { name: string; company: string };
}

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
      <div style={{ fontSize: '16px', fontWeight: 700 }}>
        <span style={{ color: '#0f172a' }}>Hire</span>
        <span style={{ color: '#4F46E5' }}>Inbox</span>
      </div>
      <div style={{ fontSize: '11px', color: '#64748b' }}>Reference Check</div>
    </div>
  </div>
);

export default function ReferenceFormPage() {
  const params = useParams();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requestData, setRequestData] = useState<RequestData | null>(null);
  const [answers, setAnswers] = useState<Record<string, string | number | boolean>>({});

  useEffect(() => {
    async function fetchRequest() {
      try {
        const res = await fetch(`/api/reference-check?token=${token}`);
        const data = await res.json();

        if (data.error) {
          setError(data.error);
        } else {
          setRequestData({
            id: data.request.id,
            questions: data.request.questions,
            candidate: data.request.candidate,
            reference: data.request.reference
          });
        }
      } catch {
        setError('Failed to load reference request');
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      fetchRequest();
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch('/api/reference-check/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          answers
        })
      });

      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
      } else {
        setError(data.error || 'Failed to submit response');
      }
    } catch {
      setError('Failed to submit response');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8fafc'
      }}>
        <div style={{ textAlign: 'center', color: '#64748b' }}>Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8fafc',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <div style={{
          textAlign: 'center',
          padding: '48px',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          maxWidth: '400px'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
          </div>
          <h1 style={{ fontSize: '20px', color: '#0f172a', marginBottom: '8px' }}>
            {error === 'Request expired' ? 'Link Expired' : 'Error'}
          </h1>
          <p style={{ color: '#64748b' }}>
            {error === 'Request expired'
              ? 'This reference request has expired. Please contact the employer for a new link.'
              : error}
          </p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8fafc',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <div style={{
          textAlign: 'center',
          padding: '48px',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          maxWidth: '400px'
        }}>
          <div style={{ marginBottom: '16px' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <h1 style={{ fontSize: '20px', color: '#0f172a', marginBottom: '8px' }}>
            Thank You!
          </h1>
          <p style={{ color: '#64748b' }}>
            Your reference has been submitted successfully. The employer will be notified.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <header style={{
        padding: '16px 24px',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0'
      }}>
        <Logo />
      </header>

      <main style={{
        maxWidth: '640px',
        margin: '0 auto',
        padding: '32px 24px'
      }}>
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '32px',
          border: '1px solid #e2e8f0'
        }}>
          <h1 style={{
            fontSize: '24px',
            fontWeight: 700,
            color: '#0f172a',
            marginBottom: '8px'
          }}>
            Reference for {requestData?.candidate?.name || 'Candidate'}
          </h1>
          <p style={{
            fontSize: '14px',
            color: '#64748b',
            marginBottom: '32px'
          }}>
            Please provide honest feedback to help the employer make an informed hiring decision.
            Your responses will be kept confidential.
          </p>

          <form onSubmit={handleSubmit}>
            {requestData?.questions?.map((q, i) => (
              <div key={q.id} style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#0f172a',
                  marginBottom: '8px'
                }}>
                  {i + 1}. {q.text}
                </label>

                {q.type === 'text' && (
                  <textarea
                    value={answers[q.id] as string || ''}
                    onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      minHeight: '80px',
                      resize: 'vertical'
                    }}
                    required
                  />
                )}

                {q.type === 'rating' && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[1, 2, 3, 4, 5].map(n => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setAnswers({ ...answers, [q.id]: n })}
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '8px',
                          border: answers[q.id] === n ? '2px solid #4F46E5' : '1px solid #e2e8f0',
                          backgroundColor: answers[q.id] === n ? '#eff6ff' : '#ffffff',
                          fontSize: '16px',
                          fontWeight: 600,
                          color: answers[q.id] === n ? '#4F46E5' : '#64748b',
                          cursor: 'pointer'
                        }}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                )}

                {q.type === 'boolean' && (
                  <div style={{ display: 'flex', gap: '12px' }}>
                    {[
                      { value: true, label: 'Yes' },
                      { value: false, label: 'No' }
                    ].map(opt => (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() => setAnswers({ ...answers, [q.id]: opt.value })}
                        style={{
                          padding: '12px 24px',
                          borderRadius: '8px',
                          border: answers[q.id] === opt.value ? '2px solid #4F46E5' : '1px solid #e2e8f0',
                          backgroundColor: answers[q.id] === opt.value ? '#eff6ff' : '#ffffff',
                          fontSize: '14px',
                          fontWeight: 500,
                          color: answers[q.id] === opt.value ? '#4F46E5' : '#64748b',
                          cursor: 'pointer'
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            <button
              type="submit"
              disabled={submitting}
              style={{
                width: '100%',
                padding: '14px',
                backgroundColor: submitting ? '#94a3b8' : '#4F46E5',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 600,
                cursor: submitting ? 'not-allowed' : 'pointer',
                marginTop: '16px'
              }}
            >
              {submitting ? 'Submitting...' : 'Submit Reference'}
            </button>
          </form>
        </div>

        <p style={{
          textAlign: 'center',
          fontSize: '12px',
          color: '#94a3b8',
          marginTop: '24px'
        }}>
          By submitting, you confirm that your responses are truthful and accurate.
        </p>
      </main>
    </div>
  );
}
