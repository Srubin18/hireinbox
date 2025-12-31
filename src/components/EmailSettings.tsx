'use client';

import { useState, useEffect } from 'react';

// ============================================
// TYPES
// ============================================

interface EmailAccount {
  id: string;
  name: string;
  email: string;
  host: string;
  port: number;
  folder: string;
  isActive: boolean;
  lastSyncAt: string | null;
  lastSyncStatus: 'success' | 'error' | 'pending' | null;
  emailsProcessed: number;
}

interface EmailFilters {
  allowedDomains: string[];
  blockedDomains: string[];
  requireAttachment: boolean;
  maxEmailsPerFetch: number;
}

interface SyncHistory {
  id: string;
  syncedAt: string;
  emailsFound: number;
  emailsProcessed: number;
  emailsSkipped: number;
  emailsFailed: number;
  duration: number;
  errors: string[];
}

interface EmailSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh?: () => void;
}

// ============================================
// COMPONENT
// ============================================

export default function EmailSettings({ isOpen, onClose, onRefresh }: EmailSettingsProps) {
  // State
  const [activeTab, setActiveTab] = useState<'account' | 'filters' | 'queue' | 'history'>('account');
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);

  // Account state - for now using env vars, but UI ready for multi-account
  const [account, setAccount] = useState<EmailAccount>({
    id: 'primary',
    name: 'Primary Inbox',
    email: '',
    host: 'imap.gmail.com',
    port: 993,
    folder: 'Hireinbox',
    isActive: true,
    lastSyncAt: null,
    lastSyncStatus: null,
    emailsProcessed: 0
  });

  // Filter state
  const [filters, setFilters] = useState<EmailFilters>({
    allowedDomains: [],
    blockedDomains: [],
    requireAttachment: false,
    maxEmailsPerFetch: 10
  });

  // Input states for adding domains
  const [newAllowedDomain, setNewAllowedDomain] = useState('');
  const [newBlockedDomain, setNewBlockedDomain] = useState('');

  // Sync history
  const [syncHistory, setSyncHistory] = useState<SyncHistory[]>([]);

  // Processing queue
  const [queueItems, setQueueItems] = useState<Array<{
    id: string;
    fromEmail: string;
    subject: string;
    status: string;
    retryCount: number;
    error?: string;
    createdAt: string;
  }>>([]);

  // Load settings on mount
  useEffect(() => {
    if (isOpen) {
      loadSettings();
      loadSyncHistory();
      loadQueue();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    try {
      const res = await fetch('/api/email-settings');
      if (res.ok) {
        const data = await res.json();
        if (data.account) setAccount(data.account);
        if (data.filters) setFilters(data.filters);
      }
    } catch (e) {
      console.error('Failed to load email settings:', e);
    }
  };

  const loadSyncHistory = async () => {
    try {
      const res = await fetch('/api/email-settings/history');
      if (res.ok) {
        const data = await res.json();
        setSyncHistory(data.history || []);
      }
    } catch (e) {
      console.error('Failed to load sync history:', e);
    }
  };

  const loadQueue = async () => {
    try {
      const res = await fetch('/api/email-settings/queue');
      if (res.ok) {
        const data = await res.json();
        setQueueItems(data.queue || []);
      }
    } catch (e) {
      console.error('Failed to load queue:', e);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/email-settings/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId: account.id })
      });

      const data = await res.json();
      setTestResult({
        success: data.success,
        message: data.message || (data.success ? 'Connection successful!' : 'Connection failed')
      });

      if (data.success && data.unreadCount !== undefined) {
        setAccount(prev => ({
          ...prev,
          lastSyncStatus: 'success'
        }));
      }
    } catch (e) {
      setTestResult({
        success: false,
        message: e instanceof Error ? e.message : 'Connection test failed'
      });
    }

    setIsTesting(false);
  };

  const handleSaveSettings = async () => {
    setIsLoading(true);

    try {
      const res = await fetch('/api/email-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account, filters })
      });

      if (res.ok) {
        setTestResult({ success: true, message: 'Settings saved!' });
        setTimeout(() => setTestResult(null), 3000);
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (e) {
      setTestResult({
        success: false,
        message: e instanceof Error ? e.message : 'Failed to save settings'
      });
    }

    setIsLoading(false);
  };

  const handleSyncNow = async () => {
    setIsSyncing(true);
    setSyncResult(null);

    try {
      const res = await fetch('/api/fetch-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filters })
      });

      const data = await res.json();

      setSyncResult({
        success: data.success,
        message: data.success
          ? `Processed ${data.storedCount} emails (${data.skippedDuplicates} duplicates, ${data.skippedSystem} system)`
          : data.error || 'Sync failed'
      });

      // Refresh history after sync
      loadSyncHistory();
      loadQueue();

      // Trigger parent refresh
      if (onRefresh) onRefresh();

      // Update last sync time
      setAccount(prev => ({
        ...prev,
        lastSyncAt: new Date().toISOString(),
        lastSyncStatus: data.success ? 'success' : 'error',
        emailsProcessed: (prev.emailsProcessed || 0) + (data.storedCount || 0)
      }));

    } catch (e) {
      setSyncResult({
        success: false,
        message: e instanceof Error ? e.message : 'Sync failed'
      });
    }

    setIsSyncing(false);
  };

  const handleRetryFailed = async (itemId: string) => {
    try {
      await fetch(`/api/email-settings/queue/${itemId}/retry`, { method: 'POST' });
      loadQueue();
    } catch (e) {
      console.error('Failed to retry:', e);
    }
  };

  const handleClearQueue = async () => {
    if (!confirm('Clear all failed items from the queue?')) return;

    try {
      await fetch('/api/email-settings/queue/clear', { method: 'POST' });
      loadQueue();
    } catch (e) {
      console.error('Failed to clear queue:', e);
    }
  };

  const addAllowedDomain = () => {
    if (newAllowedDomain.trim()) {
      setFilters(prev => ({
        ...prev,
        allowedDomains: [...prev.allowedDomains, newAllowedDomain.trim().toLowerCase()]
      }));
      setNewAllowedDomain('');
    }
  };

  const removeAllowedDomain = (domain: string) => {
    setFilters(prev => ({
      ...prev,
      allowedDomains: prev.allowedDomains.filter(d => d !== domain)
    }));
  };

  const addBlockedDomain = () => {
    if (newBlockedDomain.trim()) {
      setFilters(prev => ({
        ...prev,
        blockedDomains: [...prev.blockedDomains, newBlockedDomain.trim().toLowerCase()]
      }));
      setNewBlockedDomain('');
    }
  };

  const removeBlockedDomain = (domain: string) => {
    setFilters(prev => ({
      ...prev,
      blockedDomains: prev.blockedDomains.filter(d => d !== domain)
    }));
  };

  const formatTimeAgo = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        borderRadius: 16,
        width: '100%',
        maxWidth: 640,
        maxHeight: '90vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
              Email Settings
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: '#64748b' }}>
              Configure your inbox integration
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 8,
              borderRadius: 8,
              color: '#64748b'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: 4,
          padding: '12px 24px',
          borderBottom: '1px solid #e5e7eb',
          background: '#f8fafc'
        }}>
          {[
            { id: 'account', label: 'Account' },
            { id: 'filters', label: 'Filters' },
            { id: 'queue', label: 'Queue' },
            { id: 'history', label: 'History' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'account' | 'filters' | 'queue' | 'history')}
              style={{
                padding: '8px 16px',
                background: activeTab === tab.id ? 'white' : 'transparent',
                border: activeTab === tab.id ? '1px solid #e5e7eb' : '1px solid transparent',
                borderRadius: 8,
                fontSize: '0.875rem',
                fontWeight: activeTab === tab.id ? 600 : 500,
                color: activeTab === tab.id ? '#0f172a' : '#64748b',
                cursor: 'pointer'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>

          {/* Account Tab */}
          {activeTab === 'account' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Connection Status */}
              <div style={{
                padding: 16,
                background: account.lastSyncStatus === 'success' ? '#f0fdf4' :
                            account.lastSyncStatus === 'error' ? '#fef2f2' : '#f8fafc',
                borderRadius: 12,
                border: `1px solid ${
                  account.lastSyncStatus === 'success' ? '#bbf7d0' :
                  account.lastSyncStatus === 'error' ? '#fecaca' : '#e5e7eb'
                }`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: account.lastSyncStatus === 'success' ? '#dcfce7' :
                                account.lastSyncStatus === 'error' ? '#fee2e2' : '#e5e7eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={
                      account.lastSyncStatus === 'success' ? '#16a34a' :
                      account.lastSyncStatus === 'error' ? '#dc2626' : '#64748b'
                    } strokeWidth="2">
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                      <path d="M22 7l-10 6-10-6" />
                    </svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.95rem' }}>
                      {account.name}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      {account.email || 'No email configured'} - {account.folder || 'INBOX'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: account.lastSyncStatus === 'success' ? '#16a34a' :
                             account.lastSyncStatus === 'error' ? '#dc2626' : '#64748b'
                    }}>
                      {account.lastSyncStatus === 'success' ? 'Connected' :
                       account.lastSyncStatus === 'error' ? 'Error' : 'Not tested'}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                      Last sync: {formatTimeAgo(account.lastSyncAt)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Email Account Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>
                    Email Address
                  </span>
                  <input
                    type="email"
                    value={account.email}
                    onChange={(e) => setAccount(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="your-email@gmail.com"
                    style={{
                      padding: '10px 12px',
                      border: '1px solid #e5e7eb',
                      borderRadius: 8,
                      fontSize: '0.875rem',
                      outline: 'none'
                    }}
                  />
                </label>

                <div style={{ display: 'flex', gap: 12 }}>
                  <label style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>
                      IMAP Host
                    </span>
                    <input
                      type="text"
                      value={account.host}
                      onChange={(e) => setAccount(prev => ({ ...prev, host: e.target.value }))}
                      placeholder="imap.gmail.com"
                      style={{
                        padding: '10px 12px',
                        border: '1px solid #e5e7eb',
                        borderRadius: 8,
                        fontSize: '0.875rem',
                        outline: 'none'
                      }}
                    />
                  </label>
                  <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>
                      Port
                    </span>
                    <input
                      type="number"
                      value={account.port}
                      onChange={(e) => setAccount(prev => ({ ...prev, port: parseInt(e.target.value) || 993 }))}
                      style={{
                        padding: '10px 12px',
                        border: '1px solid #e5e7eb',
                        borderRadius: 8,
                        fontSize: '0.875rem',
                        outline: 'none'
                      }}
                    />
                  </label>
                </div>

                <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>
                    Folder to Monitor
                  </span>
                  <input
                    type="text"
                    value={account.folder}
                    onChange={(e) => setAccount(prev => ({ ...prev, folder: e.target.value }))}
                    placeholder="Hireinbox or INBOX"
                    style={{
                      padding: '10px 12px',
                      border: '1px solid #e5e7eb',
                      borderRadius: 8,
                      fontSize: '0.875rem',
                      outline: 'none'
                    }}
                  />
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Create a label/folder in Gmail and filter job applications there
                  </span>
                </label>
              </div>

              {/* Test Result */}
              {testResult && (
                <div style={{
                  padding: 12,
                  background: testResult.success ? '#f0fdf4' : '#fef2f2',
                  border: `1px solid ${testResult.success ? '#bbf7d0' : '#fecaca'}`,
                  borderRadius: 8,
                  fontSize: '0.875rem',
                  color: testResult.success ? '#166534' : '#991b1b'
                }}>
                  {testResult.message}
                </div>
              )}

              {/* Sync Result */}
              {syncResult && (
                <div style={{
                  padding: 12,
                  background: syncResult.success ? '#f0fdf4' : '#fef2f2',
                  border: `1px solid ${syncResult.success ? '#bbf7d0' : '#fecaca'}`,
                  borderRadius: 8,
                  fontSize: '0.875rem',
                  color: syncResult.success ? '#166534' : '#991b1b'
                }}>
                  {syncResult.message}
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  style={{
                    flex: 1,
                    padding: '12px 20px',
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: 8,
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#374151',
                    cursor: isTesting ? 'wait' : 'pointer',
                    opacity: isTesting ? 0.7 : 1
                  }}
                >
                  {isTesting ? 'Testing...' : 'Test Connection'}
                </button>
                <button
                  onClick={handleSyncNow}
                  disabled={isSyncing}
                  style={{
                    flex: 1,
                    padding: '12px 20px',
                    background: '#4F46E5',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: 'white',
                    cursor: isSyncing ? 'wait' : 'pointer',
                    opacity: isSyncing ? 0.7 : 1
                  }}
                >
                  {isSyncing ? 'Syncing...' : 'Sync Now'}
                </button>
              </div>

              {/* Stats */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 12,
                padding: 16,
                background: '#f8fafc',
                borderRadius: 12
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>
                    {account.emailsProcessed || 0}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Emails Processed
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>
                    {syncHistory.length}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Total Syncs
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>
                    {queueItems.filter(q => q.status === 'failed').length}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Failed in Queue
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filters Tab */}
          {activeTab === 'filters' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Allowed Domains */}
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: 8, display: 'block' }}>
                  Allowed Sender Domains
                </label>
                <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: 12 }}>
                  Only process emails from these domains. Leave empty to allow all.
                </p>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  <input
                    type="text"
                    value={newAllowedDomain}
                    onChange={(e) => setNewAllowedDomain(e.target.value)}
                    placeholder="e.g., gmail.com"
                    onKeyDown={(e) => e.key === 'Enter' && addAllowedDomain()}
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      border: '1px solid #e5e7eb',
                      borderRadius: 8,
                      fontSize: '0.875rem',
                      outline: 'none'
                    }}
                  />
                  <button
                    onClick={addAllowedDomain}
                    style={{
                      padding: '10px 16px',
                      background: '#f1f5f9',
                      border: '1px solid #e5e7eb',
                      borderRadius: 8,
                      fontSize: '0.875rem',
                      cursor: 'pointer'
                    }}
                  >
                    Add
                  </button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {filters.allowedDomains.map(domain => (
                    <span
                      key={domain}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '6px 12px',
                        background: '#dcfce7',
                        borderRadius: 16,
                        fontSize: '0.8rem',
                        color: '#166534'
                      }}
                    >
                      {domain}
                      <button
                        onClick={() => removeAllowedDomain(domain)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 0,
                          color: '#166534',
                          fontSize: '1rem',
                          lineHeight: 1
                        }}
                      >
                        x
                      </button>
                    </span>
                  ))}
                  {filters.allowedDomains.length === 0 && (
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>
                      All domains allowed
                    </span>
                  )}
                </div>
              </div>

              {/* Blocked Domains */}
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: 8, display: 'block' }}>
                  Blocked Sender Domains
                </label>
                <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: 12 }}>
                  Never process emails from these domains.
                </p>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  <input
                    type="text"
                    value={newBlockedDomain}
                    onChange={(e) => setNewBlockedDomain(e.target.value)}
                    placeholder="e.g., newsletter.com"
                    onKeyDown={(e) => e.key === 'Enter' && addBlockedDomain()}
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      border: '1px solid #e5e7eb',
                      borderRadius: 8,
                      fontSize: '0.875rem',
                      outline: 'none'
                    }}
                  />
                  <button
                    onClick={addBlockedDomain}
                    style={{
                      padding: '10px 16px',
                      background: '#f1f5f9',
                      border: '1px solid #e5e7eb',
                      borderRadius: 8,
                      fontSize: '0.875rem',
                      cursor: 'pointer'
                    }}
                  >
                    Add
                  </button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {filters.blockedDomains.map(domain => (
                    <span
                      key={domain}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '6px 12px',
                        background: '#fee2e2',
                        borderRadius: 16,
                        fontSize: '0.8rem',
                        color: '#991b1b'
                      }}
                    >
                      {domain}
                      <button
                        onClick={() => removeBlockedDomain(domain)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 0,
                          color: '#991b1b',
                          fontSize: '1rem',
                          lineHeight: 1
                        }}
                      >
                        x
                      </button>
                    </span>
                  ))}
                  {filters.blockedDomains.length === 0 && (
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>
                      No domains blocked
                    </span>
                  )}
                </div>
              </div>

              {/* Other Filters */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={filters.requireAttachment}
                    onChange={(e) => setFilters(prev => ({ ...prev, requireAttachment: e.target.checked }))}
                    style={{ width: 18, height: 18 }}
                  />
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>
                      Require Attachment
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Only process emails with PDF or Word attachments
                    </div>
                  </div>
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>
                    Max Emails per Sync
                  </span>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={filters.maxEmailsPerFetch}
                    onChange={(e) => setFilters(prev => ({ ...prev, maxEmailsPerFetch: parseInt(e.target.value) || 10 }))}
                    style={{
                      width: 100,
                      padding: '10px 12px',
                      border: '1px solid #e5e7eb',
                      borderRadius: 8,
                      fontSize: '0.875rem',
                      outline: 'none'
                    }}
                  />
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Limit how many emails to process per sync (1-50)
                  </span>
                </label>
              </div>

              {/* Save Button */}
              <button
                onClick={handleSaveSettings}
                disabled={isLoading}
                style={{
                  padding: '12px 20px',
                  background: '#4F46E5',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'white',
                  cursor: isLoading ? 'wait' : 'pointer',
                  opacity: isLoading ? 0.7 : 1
                }}
              >
                {isLoading ? 'Saving...' : 'Save Filters'}
              </button>
            </div>
          )}

          {/* Queue Tab */}
          {activeTab === 'queue' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                  {queueItems.length} items in queue
                </div>
                {queueItems.filter(q => q.status === 'failed').length > 0 && (
                  <button
                    onClick={handleClearQueue}
                    style={{
                      padding: '6px 12px',
                      background: '#fef2f2',
                      border: '1px solid #fecaca',
                      borderRadius: 6,
                      fontSize: '0.75rem',
                      color: '#991b1b',
                      cursor: 'pointer'
                    }}
                  >
                    Clear Failed
                  </button>
                )}
              </div>

              {queueItems.length === 0 ? (
                <div style={{
                  padding: 40,
                  textAlign: 'center',
                  color: '#64748b',
                  background: '#f8fafc',
                  borderRadius: 12
                }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" style={{ margin: '0 auto 12px' }}>
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p style={{ fontSize: '0.875rem', margin: 0 }}>Queue is empty</p>
                  <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '4px 0 0' }}>All emails have been processed</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {queueItems.map(item => (
                    <div
                      key={item.id}
                      style={{
                        padding: 12,
                        background: item.status === 'failed' ? '#fef2f2' : '#f8fafc',
                        borderRadius: 8,
                        border: `1px solid ${item.status === 'failed' ? '#fecaca' : '#e5e7eb'}`
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            color: '#0f172a',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {item.subject || '(No subject)'}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            {item.fromEmail}
                          </div>
                          {item.error && (
                            <div style={{ fontSize: '0.7rem', color: '#dc2626', marginTop: 4 }}>
                              Error: {item.error}
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: 4,
                            fontSize: '0.7rem',
                            fontWeight: 500,
                            background: item.status === 'failed' ? '#fee2e2' :
                                       item.status === 'pending' ? '#fef3c7' :
                                       item.status === 'processing' ? '#dbeafe' : '#dcfce7',
                            color: item.status === 'failed' ? '#991b1b' :
                                   item.status === 'pending' ? '#92400e' :
                                   item.status === 'processing' ? '#1e40af' : '#166534'
                          }}>
                            {item.status}
                          </span>
                          {item.status === 'failed' && (
                            <button
                              onClick={() => handleRetryFailed(item.id)}
                              style={{
                                padding: '4px 8px',
                                background: 'white',
                                border: '1px solid #e5e7eb',
                                borderRadius: 4,
                                fontSize: '0.7rem',
                                cursor: 'pointer'
                              }}
                            >
                              Retry
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {syncHistory.length === 0 ? (
                <div style={{
                  padding: 40,
                  textAlign: 'center',
                  color: '#64748b',
                  background: '#f8fafc',
                  borderRadius: 12
                }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" style={{ margin: '0 auto 12px' }}>
                    <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p style={{ fontSize: '0.875rem', margin: 0 }}>No sync history yet</p>
                  <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '4px 0 0' }}>Sync your inbox to see history</p>
                </div>
              ) : (
                syncHistory.map(sync => (
                  <div
                    key={sync.id}
                    style={{
                      padding: 16,
                      background: '#f8fafc',
                      borderRadius: 8,
                      border: '1px solid #e5e7eb'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#0f172a' }}>
                        {new Date(sync.syncedAt).toLocaleString()}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {sync.duration}s
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, fontSize: '0.75rem' }}>
                      <div>
                        <span style={{ color: '#64748b' }}>Found:</span>{' '}
                        <span style={{ fontWeight: 500 }}>{sync.emailsFound}</span>
                      </div>
                      <div>
                        <span style={{ color: '#64748b' }}>Processed:</span>{' '}
                        <span style={{ fontWeight: 500, color: '#166534' }}>{sync.emailsProcessed}</span>
                      </div>
                      <div>
                        <span style={{ color: '#64748b' }}>Skipped:</span>{' '}
                        <span style={{ fontWeight: 500, color: '#92400e' }}>{sync.emailsSkipped}</span>
                      </div>
                      <div>
                        <span style={{ color: '#64748b' }}>Failed:</span>{' '}
                        <span style={{ fontWeight: 500, color: '#dc2626' }}>{sync.emailsFailed}</span>
                      </div>
                    </div>
                    {sync.errors.length > 0 && (
                      <div style={{ marginTop: 8, fontSize: '0.7rem', color: '#dc2626' }}>
                        Errors: {sync.errors.slice(0, 2).join(', ')}
                        {sync.errors.length > 2 && ` +${sync.errors.length - 2} more`}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 12
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              background: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              fontSize: '0.875rem',
              fontWeight: 500,
              color: '#374151',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
