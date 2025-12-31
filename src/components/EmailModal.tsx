'use client';

import React, { useState, useEffect } from 'react';

interface EmailHistory {
  id: string;
  email_type: string;
  subject: string;
  recipient: string;
  sent_at: string;
  success: boolean;
  error?: string;
}

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: {
    id: string;
    name: string;
    email: string;
    ai_recommendation?: string;
    strengths?: string[];
  };
  roleTitle?: string;
  companyName?: string;
}

type EmailType = 'shortlist' | 'rejection' | 'talent_pool' | 'interview_invite' | 'custom';

const EMAIL_TEMPLATES: Record<EmailType, { label: string; description: string; icon: string }> = {
  shortlist: {
    label: 'Shortlist Notification',
    description: 'Congratulate the candidate and outline next steps',
    icon: '✓',
  },
  rejection: {
    label: 'Rejection (Kind)',
    description: 'Politely decline with option for feedback',
    icon: '✗',
  },
  talent_pool: {
    label: 'Talent Pool',
    description: 'Keep for future opportunities, highlight strengths',
    icon: '💼',
  },
  interview_invite: {
    label: 'Interview Invitation',
    description: 'Send booking link for interview scheduling',
    icon: '📅',
  },
  custom: {
    label: 'Custom Email',
    description: 'Write your own message',
    icon: '✏️',
  },
};

export default function EmailModal({
  isOpen,
  onClose,
  candidate,
  roleTitle = 'the position',
  companyName = 'Our Team',
}: EmailModalProps) {
  const [selectedType, setSelectedType] = useState<EmailType>('shortlist');
  const [customSubject, setCustomSubject] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [nextSteps, setNextSteps] = useState('We will be in touch shortly to schedule an interview.');
  const [rejectionReason, setRejectionReason] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailHistory, setEmailHistory] = useState<EmailHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Set default email type based on recommendation
  useEffect(() => {
    if (candidate.ai_recommendation === 'SHORTLIST') {
      setSelectedType('shortlist');
    } else if (candidate.ai_recommendation === 'CONSIDER') {
      setSelectedType('talent_pool');
    } else if (candidate.ai_recommendation === 'REJECT') {
      setSelectedType('rejection');
    }
  }, [candidate.ai_recommendation]);

  // Fetch email history when modal opens
  useEffect(() => {
    if (isOpen && candidate.id) {
      fetchEmailHistory();
    }
  }, [isOpen, candidate.id]);

  const fetchEmailHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/send-email?candidateId=${candidate.id}`);
      const data = await res.json();
      setEmailHistory(data.history || []);
    } catch (err) {
      console.error('Failed to fetch email history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSend = async () => {
    setSending(true);
    setError(null);

    try {
      const payload: Record<string, unknown> = {
        candidateId: candidate.id,
        emailType: selectedType,
      };

      if (selectedType === 'custom') {
        payload.customSubject = customSubject;
        payload.customMessage = customMessage;
      } else if (selectedType === 'shortlist') {
        payload.nextSteps = nextSteps;
      } else if (selectedType === 'rejection' && rejectionReason) {
        payload.rejectionReason = rejectionReason;
      } else if (selectedType === 'talent_pool' && candidate.strengths) {
        payload.strengths = candidate.strengths;
      }

      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to send email');
      }

      setSent(true);
      fetchEmailHistory(); // Refresh history

      // Auto-close after success
      setTimeout(() => {
        onClose();
        setSent(false);
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send email');
    } finally {
      setSending(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-ZA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#0F172A' }}>
              Email {candidate.name}
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#64748B' }}>
              {candidate.email}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#64748B',
              padding: '4px',
            }}
          >
            &times;
          </button>
        </div>

        {/* Success State */}
        {sent && (
          <div
            style={{
              padding: '48px 24px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#D1FAE5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                fontSize: '32px',
              }}
            >
              &#10003;
            </div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#059669' }}>
              Email Sent Successfully
            </h3>
            <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#64748B' }}>
              Your email has been delivered to {candidate.email}
            </p>
          </div>
        )}

        {/* Main Content */}
        {!sent && (
          <>
            {/* Tab Toggle */}
            <div
              style={{
                padding: '16px 24px',
                display: 'flex',
                gap: '8px',
                borderBottom: '1px solid #E2E8F0',
              }}
            >
              <button
                onClick={() => setShowHistory(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: !showHistory ? '#4F46E5' : '#F1F5F9',
                  color: !showHistory ? '#fff' : '#64748B',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Compose
              </button>
              <button
                onClick={() => setShowHistory(true)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: showHistory ? '#4F46E5' : '#F1F5F9',
                  color: showHistory ? '#fff' : '#64748B',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                History {emailHistory.length > 0 && `(${emailHistory.length})`}
              </button>
            </div>

            {/* Email History View */}
            {showHistory && (
              <div style={{ padding: '24px' }}>
                {loadingHistory ? (
                  <p style={{ textAlign: 'center', color: '#64748B' }}>Loading history...</p>
                ) : emailHistory.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px 0' }}>
                    <p style={{ color: '#94A3B8', fontSize: '14px' }}>
                      No emails sent yet
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {emailHistory.map((email) => (
                      <div
                        key={email.id}
                        style={{
                          padding: '16px',
                          backgroundColor: '#F8FAFC',
                          borderRadius: '12px',
                          border: '1px solid #E2E8F0',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                fontWeight: 500,
                                backgroundColor: email.success ? '#D1FAE5' : '#FEE2E2',
                                color: email.success ? '#059669' : '#DC2626',
                                marginBottom: '8px',
                              }}
                            >
                              {email.email_type.replace('_', ' ').toUpperCase()}
                            </span>
                            <p style={{ margin: 0, fontSize: '14px', fontWeight: 500, color: '#0F172A' }}>
                              {email.subject.replace(/\{\{.*?\}\}/g, '...')}
                            </p>
                          </div>
                          <span style={{ fontSize: '12px', color: '#94A3B8', whiteSpace: 'nowrap' }}>
                            {formatDate(email.sent_at)}
                          </span>
                        </div>
                        {email.error && (
                          <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#DC2626' }}>
                            Error: {email.error}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Compose View */}
            {!showHistory && (
              <div style={{ padding: '24px' }}>
                {/* Template Selection */}
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#0F172A', marginBottom: '12px' }}>
                    Email Template
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {(Object.keys(EMAIL_TEMPLATES) as EmailType[]).map((type) => {
                      const template = EMAIL_TEMPLATES[type];
                      const isSelected = selectedType === type;
                      return (
                        <button
                          key={type}
                          onClick={() => setSelectedType(type)}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '12px',
                            padding: '12px 16px',
                            borderRadius: '10px',
                            border: `2px solid ${isSelected ? '#4F46E5' : '#E2E8F0'}`,
                            backgroundColor: isSelected ? '#EEF2FF' : '#fff',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <span style={{ fontSize: '18px' }}>{template.icon}</span>
                          <div>
                            <p style={{ margin: 0, fontSize: '14px', fontWeight: 500, color: '#0F172A' }}>
                              {template.label}
                            </p>
                            <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: '#64748B' }}>
                              {template.description}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Dynamic Fields Based on Template */}
                {selectedType === 'shortlist' && (
                  <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#0F172A', marginBottom: '8px' }}>
                      Next Steps Message
                    </label>
                    <textarea
                      value={nextSteps}
                      onChange={(e) => setNextSteps(e.target.value)}
                      placeholder="Describe the next steps for the candidate..."
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: '10px',
                        border: '1px solid #E2E8F0',
                        fontSize: '14px',
                        resize: 'vertical',
                        minHeight: '80px',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                )}

                {selectedType === 'rejection' && (
                  <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#0F172A', marginBottom: '8px' }}>
                      Reason (Optional - will auto-generate if blank)
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="e.g., candidates with more experience in..."
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: '10px',
                        border: '1px solid #E2E8F0',
                        fontSize: '14px',
                        resize: 'vertical',
                        minHeight: '80px',
                        boxSizing: 'border-box',
                      }}
                    />
                    <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#94A3B8' }}>
                      Leave blank to auto-generate a kind rejection reason based on the role requirements.
                    </p>
                  </div>
                )}

                {selectedType === 'custom' && (
                  <>
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#0F172A', marginBottom: '8px' }}>
                        Subject
                      </label>
                      <input
                        type="text"
                        value={customSubject}
                        onChange={(e) => setCustomSubject(e.target.value)}
                        placeholder="Email subject line..."
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          borderRadius: '10px',
                          border: '1px solid #E2E8F0',
                          fontSize: '14px',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                    <div style={{ marginBottom: '24px' }}>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#0F172A', marginBottom: '8px' }}>
                        Message
                      </label>
                      <textarea
                        value={customMessage}
                        onChange={(e) => setCustomMessage(e.target.value)}
                        placeholder="Your message to the candidate..."
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          borderRadius: '10px',
                          border: '1px solid #E2E8F0',
                          fontSize: '14px',
                          resize: 'vertical',
                          minHeight: '120px',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  </>
                )}

                {/* Error Message */}
                {error && (
                  <div
                    style={{
                      padding: '12px 16px',
                      backgroundColor: '#FEE2E2',
                      borderRadius: '10px',
                      marginBottom: '24px',
                    }}
                  >
                    <p style={{ margin: 0, fontSize: '14px', color: '#DC2626' }}>
                      {error}
                    </p>
                  </div>
                )}

                {/* Preview Info */}
                <div
                  style={{
                    padding: '16px',
                    backgroundColor: '#F8FAFC',
                    borderRadius: '10px',
                    marginBottom: '24px',
                  }}
                >
                  <p style={{ margin: 0, fontSize: '13px', color: '#64748B' }}>
                    Email will be sent from <strong>{companyName}</strong> regarding <strong>{roleTitle}</strong>
                  </p>
                </div>

                {/* Send Button */}
                <button
                  onClick={handleSend}
                  disabled={sending || (selectedType === 'custom' && (!customSubject || !customMessage))}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: sending ? '#94A3B8' : '#4F46E5',
                    color: '#fff',
                    fontSize: '16px',
                    fontWeight: 600,
                    cursor: sending ? 'not-allowed' : 'pointer',
                    opacity: selectedType === 'custom' && (!customSubject || !customMessage) ? 0.5 : 1,
                  }}
                >
                  {sending ? 'Sending...' : `Send ${EMAIL_TEMPLATES[selectedType].label}`}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
