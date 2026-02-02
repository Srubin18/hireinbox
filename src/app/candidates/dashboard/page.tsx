'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// ============================================
// HIREINBOX - CANDIDATE DASHBOARD
// Ultra simple for IQ 90-100 market
// No tabs, no clutter - just the essentials
// ============================================

interface CVResult {
  score: number;
  filename: string;
  analyzedAt: string;
}

interface Message {
  id: string;
  from: string;
  preview: string;
  date: string;
  unread: boolean;
}

export default function CandidateDashboard() {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [cvResult, setCvResult] = useState<CVResult | null>(null);
  const [inTalentPool, setInTalentPool] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  // Load user data
  useEffect(() => {
    // In production: fetch from Supabase auth
    const storedName = sessionStorage.getItem('userName') || 'there';
    const storedEmail = sessionStorage.getItem('userEmail');
    setUserName(storedName);

    // Simulate loading user data
    setTimeout(() => {
      // Mock data - in production fetch from API
      setCvResult({
        score: 72,
        filename: 'My_CV.pdf',
        analyzedAt: '2 days ago'
      });
      setMessages([
        { id: '1', from: 'ABC Company', preview: 'We liked your profile...', date: 'Today', unread: true },
      ]);
      setLoading(false);
    }, 500);
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10B981';
    if (score >= 60) return '#8B5CF6';
    return '#F59E0B';
  };

  const getScoreMessage = (score: number) => {
    if (score >= 80) return 'Great CV!';
    if (score >= 60) return 'Good start!';
    return 'Needs work';
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff'
      }}>
        <div style={{
          width: 48,
          height: 48,
          border: '4px solid #E5E7EB',
          borderTop: '4px solid #4F46E5',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

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
        <div style={{ fontSize: 20, fontWeight: 700 }}>
          <span style={{ color: '#0f172a' }}>Hire</span>
          <span style={{ color: '#4F46E5' }}>Inbox</span>
        </div>
        <button
          onClick={() => router.push('/')}
          style={{
            padding: '8px 16px',
            backgroundColor: '#f1f5f9',
            color: '#64748b',
            border: 'none',
            borderRadius: 8,
            fontSize: 14,
            cursor: 'pointer'
          }}
        >
          Log out
        </button>
      </header>

      <main style={{ maxWidth: 500, margin: '0 auto', padding: '24px 20px' }}>
        {/* Welcome */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>
            Hi {userName}!
          </h1>
          <p style={{ fontSize: 16, color: '#64748b' }}>
            Here's your job search status
          </p>
        </div>

        {/* CV Score Card */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: 20,
          padding: 28,
          marginBottom: 20,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            {/* Score Circle */}
            <div style={{
              width: 100,
              height: 100,
              borderRadius: '50%',
              border: `6px solid ${cvResult ? getScoreColor(cvResult.score) : '#E5E7EB'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 32, fontWeight: 800, color: '#0f172a' }}>
                  {cvResult?.score || '?'}
                </div>
              </div>
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
                {cvResult ? getScoreMessage(cvResult.score) : 'No CV yet'}
              </div>
              {cvResult ? (
                <div style={{ fontSize: 14, color: '#64748b' }}>
                  {cvResult.filename} - checked {cvResult.analyzedAt}
                </div>
              ) : (
                <div style={{ fontSize: 14, color: '#64748b' }}>
                  Upload your CV to see your score
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => router.push('/candidates')}
            style={{
              width: '100%',
              marginTop: 20,
              padding: 14,
              backgroundColor: cvResult ? '#f1f5f9' : '#4F46E5',
              color: cvResult ? '#475569' : '#ffffff',
              border: 'none',
              borderRadius: 10,
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {cvResult ? 'Upload New CV' : 'Upload CV Now'}
          </button>
        </div>

        {/* Talent Pool Status */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: 20,
          padding: 24,
          marginBottom: 20,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
                Can employers find me?
              </div>
              <div style={{ fontSize: 14, color: '#64748b' }}>
                {inTalentPool ? 'Yes - you\'re in the Talent Pool' : 'No - you\'re hidden'}
              </div>
            </div>

            {/* Simple Toggle */}
            <button
              onClick={() => setInTalentPool(!inTalentPool)}
              style={{
                width: 60,
                height: 34,
                borderRadius: 17,
                border: 'none',
                backgroundColor: inTalentPool ? '#10B981' : '#cbd5e1',
                cursor: 'pointer',
                position: 'relative',
                transition: 'background-color 0.2s'
              }}
            >
              <div style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                backgroundColor: '#ffffff',
                position: 'absolute',
                top: 3,
                left: inTalentPool ? 29 : 3,
                transition: 'left 0.2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
              }} />
            </button>
          </div>

          {inTalentPool && (
            <div style={{
              padding: 14,
              backgroundColor: '#f0fdf4',
              borderRadius: 10,
              fontSize: 14,
              color: '#166534',
              display: 'flex',
              alignItems: 'center',
              gap: 10
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              Employers looking for people like you can see your profile
            </div>
          )}

          {!inTalentPool && (
            <div style={{
              padding: 14,
              backgroundColor: '#fef3c7',
              borderRadius: 10,
              fontSize: 14,
              color: '#92400e'
            }}>
              Turn this on so employers can find you
            </div>
          )}
        </div>

        {/* Messages */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: 20,
          padding: 24,
          marginBottom: 20,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>
            Messages from employers
          </div>

          {messages.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    padding: 16,
                    backgroundColor: msg.unread ? '#eff6ff' : '#f8fafc',
                    borderRadius: 12,
                    border: msg.unread ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {msg.unread && (
                        <div style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: '#3b82f6'
                        }} />
                      )}
                      <span style={{ fontWeight: 600, color: '#0f172a' }}>{msg.from}</span>
                    </div>
                    <span style={{ fontSize: 12, color: '#94a3b8' }}>{msg.date}</span>
                  </div>
                  <div style={{ fontSize: 14, color: '#64748b' }}>{msg.preview}</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              padding: 32,
              backgroundColor: '#f8fafc',
              borderRadius: 12,
              textAlign: 'center'
            }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" style={{ margin: '0 auto' }}>
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>
                No messages yet
              </div>
              <div style={{ fontSize: 14, color: '#94a3b8' }}>
                When employers are interested, they'll message you here
              </div>
            </div>
          )}
        </div>

        {/* Improve Your Chances */}
        <div style={{
          backgroundColor: '#0f172a',
          borderRadius: 20,
          padding: 24
        }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#ffffff', marginBottom: 16 }}>
            Want more interviews?
          </div>

          <div
            onClick={() => router.push('/candidates/video')}
            style={{
              padding: 18,
              backgroundColor: 'rgba(255,255,255,0.1)',
              borderRadius: 14,
              marginBottom: 12,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 14
            }}
          >
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 10,
              backgroundColor: '#8B5CF6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2">
                <polygon points="23 7 16 12 23 17 23 7"/>
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#ffffff' }}>
                Add a Video
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
                Profiles with videos get 3x more views
              </div>
            </div>
            <div style={{
              padding: '4px 10px',
              backgroundColor: '#8B5CF6',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 600,
              color: '#ffffff'
            }}>
              R99
            </div>
          </div>

          <div
            onClick={() => router.push('/candidates')}
            style={{
              padding: 18,
              backgroundColor: 'rgba(255,255,255,0.1)',
              borderRadius: 14,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 14
            }}
          >
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 10,
              backgroundColor: '#4F46E5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2">
                <path d="M12 20h9"/>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#ffffff' }}>
                Improve your CV
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
                Get tips to make your CV stronger
              </div>
            </div>
            <div style={{
              padding: '4px 10px',
              backgroundColor: '#10B981',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 600,
              color: '#ffffff'
            }}>
              FREE
            </div>
          </div>
        </div>

        {/* Bottom spacing for mobile */}
        <div style={{ height: 100 }} />
      </main>

      {/* Help Button */}
      <button
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          padding: '12px 20px',
          backgroundColor: '#0f172a',
          color: '#ffffff',
          border: 'none',
          borderRadius: 24,
          fontSize: 14,
          fontWeight: 500,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        Help
      </button>
    </div>
  );
}
