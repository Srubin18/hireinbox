'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// ============================================
// HIREINBOX B2C - CANDIDATE DASHBOARD
// /candidates/dashboard
//
// Features:
// - CV versions
// - Feedback history
// - Videos
// - Talent pool status
// - Messages
// - Support access
// ============================================

interface CVVersion {
  id: string;
  name: string;
  uploadedAt: string;
  score: number;
  status: 'analyzed' | 'pending';
}

interface Message {
  id: string;
  from: string;
  preview: string;
  date: string;
  unread: boolean;
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
      <div style={{ fontSize: '16px', fontWeight: 700, letterSpacing: '-0.02em' }}>
        <span style={{ color: '#0f172a' }}>Hire</span><span style={{ color: '#4F46E5' }}>Inbox</span>
      </div>
    </div>
  </div>
);

// Sample data
const sampleCVs: CVVersion[] = [
  { id: '1', name: 'Marketing_CV_v2.pdf', uploadedAt: '2026-01-23', score: 72, status: 'analyzed' },
  { id: '2', name: 'Marketing_CV_v1.pdf', uploadedAt: '2026-01-20', score: 65, status: 'analyzed' }
];

const sampleMessages: Message[] = [
  { id: '1', from: 'HireInbox Team', preview: 'Welcome to HireInbox! Here are some tips to get started...', date: '2026-01-23', unread: true },
  { id: '2', from: 'Talent Pool Update', preview: 'Your profile is now visible to 12 employers', date: '2026-01-22', unread: false }
];

type Tab = 'cvs' | 'videos' | 'messages' | 'settings';

export default function CandidateDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('cvs');
  const [cvVersions] = useState<CVVersion[]>(sampleCVs);
  const [messages] = useState<Message[]>(sampleMessages);
  const [talentPoolStatus, setTalentPoolStatus] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = useCallback(async () => {
    setIsDeleting(true);
    try {
      // In production: call /api/account/delete
      await new Promise(resolve => setTimeout(resolve, 1500));
      // Clear session and redirect
      router.push('/');
    } catch (error) {
      console.error('Failed to delete account:', error);
      setIsDeleting(false);
    }
  }, [router]);

  const handleToggleTalentPool = useCallback((checked: boolean) => {
    setTalentPoolStatus(checked);
  }, []);

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'cvs', label: 'My CVs', icon: '📄' },
    { id: 'videos', label: 'Videos', icon: '🎥' },
    { id: 'messages', label: 'Messages', icon: '💬' },
    { id: 'settings', label: 'Settings', icon: '⚙️' }
  ];

  const unreadCount = messages.filter(m => m.unread).length;

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#059669';
    if (score >= 60) return '#d97706';
    return '#dc2626';
  };

  const renderCVsTab = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
          My CVs
        </h2>
        <button
          onClick={() => router.push('/candidates/cv')}
          style={{
            padding: '10px 20px',
            backgroundColor: '#4F46E5',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          + Upload New CV
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {cvVersions.map((cv) => (
          <div
            key={cv.id}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                backgroundColor: '#f1f5f9',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px'
              }}>
                📄
              </div>
              <div>
                <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>
                  {cv.name}
                </div>
                <div style={{ fontSize: '13px', color: '#64748b' }}>
                  Uploaded {cv.uploadedAt}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                padding: '8px 16px',
                backgroundColor: '#f8fafc',
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ color: getScoreColor(cv.score), fontWeight: 700 }}>
                  {cv.score}
                </span>
                <span style={{ fontSize: '13px', color: '#64748b' }}>score</span>
              </div>
              <button
                onClick={() => router.push('/candidates/scan')}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#f1f5f9',
                  color: '#475569',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                View Feedback
              </button>
            </div>
          </div>
        ))}
      </div>

      {cvVersions.length === 0 && (
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '48px',
          border: '1px solid #e2e8f0',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>
            No CVs yet
          </div>
          <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px' }}>
            Upload your CV to get personalized feedback
          </div>
          <button
            onClick={() => router.push('/candidates/cv')}
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
            Upload CV
          </button>
        </div>
      )}
    </div>
  );

  const renderVideosTab = () => (
    <div>
      <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginBottom: '24px' }}>
        Video Introductions
      </h2>

      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '48px',
        border: '1px solid #e2e8f0',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎥</div>
        <div style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>
          No videos yet
        </div>
        <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px', maxWidth: '400px', margin: '0 auto 24px' }}>
          Record a 60-second video pitch and get AI analysis on your presentation skills
        </div>
        <button
          onClick={() => router.push('/candidates/upsells')}
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
          Get Video Analysis (R149)
        </button>
      </div>
    </div>
  );

  const renderMessagesTab = () => (
    <div>
      <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginBottom: '24px' }}>
        Messages
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {messages.map((message) => (
          <div
            key={message.id}
            style={{
              backgroundColor: message.unread ? '#eff6ff' : '#ffffff',
              borderRadius: '12px',
              padding: '16px 20px',
              border: `1px solid ${message.unread ? '#bfdbfe' : '#e2e8f0'}`,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {message.unread && (
                  <div style={{
                    width: '8px',
                    height: '8px',
                    backgroundColor: '#3b82f6',
                    borderRadius: '50%'
                  }} />
                )}
                <span style={{ fontWeight: 600, color: '#0f172a' }}>{message.from}</span>
              </div>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>{message.date}</span>
            </div>
            <div style={{ fontSize: '14px', color: '#64748b' }}>
              {message.preview}
            </div>
          </div>
        ))}
      </div>

      {messages.length === 0 && (
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '48px',
          border: '1px solid #e2e8f0',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>
            No messages yet
          </div>
          <div style={{ fontSize: '14px', color: '#64748b' }}>
            Messages from employers will appear here
          </div>
        </div>
      )}
    </div>
  );

  const renderSettingsTab = () => (
    <div>
      <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginBottom: '24px' }}>
        Settings
      </h2>

      {/* Talent Pool */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '24px',
        border: '1px solid #e2e8f0',
        marginBottom: '16px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>
              Talent Pool
            </div>
            <div style={{ fontSize: '14px', color: '#64748b' }}>
              Allow employers to discover your profile
            </div>
          </div>
          <label
            style={{ position: 'relative', display: 'inline-block', width: '48px', height: '28px' }}
            role="switch"
            aria-checked={talentPoolStatus}
            aria-label="Toggle Talent Pool visibility"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                handleToggleTalentPool(!talentPoolStatus);
              }
            }}
          >
            <input
              id="talent-pool-toggle"
              type="checkbox"
              checked={talentPoolStatus}
              onChange={(e) => handleToggleTalentPool(e.target.checked)}
              style={{
                position: 'absolute',
                opacity: 0,
                width: '100%',
                height: '100%',
                margin: 0,
                cursor: 'pointer'
              }}
            />
            <span
              aria-hidden="true"
              style={{
                position: 'absolute',
                cursor: 'pointer',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: talentPoolStatus ? '#4F46E5' : '#cbd5e1',
                borderRadius: '28px',
                transition: '0.3s'
              }}
            >
              <span style={{
                position: 'absolute',
                content: '',
                height: '22px',
                width: '22px',
                left: talentPoolStatus ? '23px' : '3px',
                bottom: '3px',
                backgroundColor: 'white',
                borderRadius: '50%',
                transition: '0.3s'
              }} />
            </span>
          </label>
        </div>
        {talentPoolStatus && (
          <div style={{
            marginTop: '16px',
            padding: '12px',
            backgroundColor: '#f0fdf4',
            borderRadius: '8px',
            fontSize: '13px',
            color: '#166534'
          }}>
            ✓ Your profile is visible to vetted employers. Contact details remain private until you accept a connection.
          </div>
        )}
      </div>

      {/* Notifications */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '24px',
        border: '1px solid #e2e8f0',
        marginBottom: '16px'
      }}>
        <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: '16px' }}>
          Notifications
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {['Job alerts', 'Employer messages', 'CV feedback updates'].map((item, i) => (
            <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
              <input type="checkbox" defaultChecked style={{ width: '18px', height: '18px', accentColor: '#4F46E5' }} />
              <span style={{ fontSize: '14px', color: '#475569' }}>{item}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Delete Account */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '24px',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>
          Delete Account
        </div>
        <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '16px' }}>
          Permanently delete your account and all data (POPIA compliant)
        </div>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          style={{
            padding: '10px 20px',
            backgroundColor: '#fee2e2',
            color: '#dc2626',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer'
          }}
        >
          Delete my account
        </button>
      </div>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '14px', color: '#64748b' }}>Sarah Johnson</span>
          <button
            onClick={() => router.push('/')}
            style={{
              padding: '8px 16px',
              backgroundColor: '#f1f5f9',
              color: '#475569',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            Log out
          </button>
        </div>
      </header>

      {/* Tab navigation */}
      <nav style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        padding: '0 24px',
        display: 'flex',
        gap: '8px',
        overflowX: 'auto'
      }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '16px 20px',
              backgroundColor: 'transparent',
              color: activeTab === tab.id ? '#4F46E5' : '#64748b',
              border: 'none',
              borderBottom: `2px solid ${activeTab === tab.id ? '#4F46E5' : 'transparent'}`,
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              whiteSpace: 'nowrap'
            }}
          >
            <span>{tab.icon}</span>
            {tab.label}
            {tab.id === 'messages' && unreadCount > 0 && (
              <span style={{
                backgroundColor: '#dc2626',
                color: '#ffffff',
                padding: '2px 8px',
                borderRadius: '10px',
                fontSize: '11px',
                fontWeight: 600
              }}>
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Main content */}
      <main style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '32px 24px'
      }}>
        {activeTab === 'cvs' && renderCVsTab()}
        {activeTab === 'videos' && renderVideosTab()}
        {activeTab === 'messages' && renderMessagesTab()}
        {activeTab === 'settings' && renderSettingsTab()}
      </main>

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
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
            if (e.target === e.currentTarget && !isDeleting) {
              setShowDeleteConfirm(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '400px',
              width: '100%'
            }}
          >
            <h3
              id="delete-dialog-title"
              style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}
            >
              Delete your account?
            </h3>
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px', lineHeight: 1.6 }}>
              This will permanently delete your account and all your data, including CVs, videos, and messages. This action cannot be undone (POPIA compliant).
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#f1f5f9',
                  color: '#475569',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: isDeleting ? 'not-allowed' : 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: isDeleting ? '#f87171' : '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: isDeleting ? 'not-allowed' : 'pointer'
                }}
              >
                {isDeleting ? 'Deleting...' : 'Yes, delete'}
              </button>
            </div>
          </div>
        </div>
      )}

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
