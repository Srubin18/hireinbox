'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// ============================================
// HIREINBOX - RECRUITER DASHBOARD
// /hire/recruiter/dashboard
//
// Simple dashboard focused on HireInbox services:
// - CV Screening (for client roles)
// - Talent Mapping
// - AI Interviews
// - Verification (ID, criminal, credit, reference)
//
// NOT a full CRM - recruiters have their own systems
// ============================================

export default function RecruiterDashboard() {
  const router = useRouter();
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [clients, setClients] = useState([
    { id: '1', name: 'Standard Bank', industry: 'Finance' },
    { id: '2', name: 'Discovery', industry: 'Insurance/Tech' },
    { id: '3', name: 'Woolworths', industry: 'Retail' },
  ]);
  const [showAddClient, setShowAddClient] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientIndustry, setNewClientIndustry] = useState('');

  const services = [
    {
      id: 'screening',
      title: 'CV Screening',
      description: 'AI screens and ranks CVs against role requirements. Get a shortlist with evidence-based scores.',
      price: 'R1,750 per role',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
        </svg>
      ),
      action: () => router.push('/hire/dashboard'),
      color: '#4F46E5'
    },
    {
      id: 'mapping',
      title: 'Talent Mapping',
      description: 'Find hidden candidates from company pages, news, conferences - not just LinkedIn.',
      price: 'R2,500 per search',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="M21 21l-4.35-4.35"/>
          <circle cx="11" cy="11" r="3"/>
        </svg>
      ),
      action: () => router.push('/hire/recruiter/mapping'),
      color: '#7c3aed',
      badge: 'Premium'
    },
    {
      id: 'interview',
      title: 'AI Interview',
      description: 'AI avatar conducts video interviews with candidates. Get transcripts and psychometric insights.',
      price: 'R1,250 per role',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M23 7l-7 5 7 5V7z"/>
          <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
        </svg>
      ),
      action: () => router.push('/hire/ai-interview'),
      color: '#059669'
    },
    {
      id: 'verification',
      title: 'Verification',
      description: 'ID verification, criminal record check, credit check, and reference verification.',
      price: 'R800 per candidate',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
      ),
      action: () => router.push('/hire/verification'),
      color: '#0891b2'
    }
  ];

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <svg width="36" height="36" viewBox="0 0 48 48" fill="none">
            <rect width="48" height="48" rx="12" fill="#7c3aed"/>
            <path d="M12 18L24 26L36 18V32C36 33.1 35.1 34 34 34H14C12.9 34 12 33.1 12 32V18Z" fill="white" fillOpacity="0.9"/>
            <path d="M34 14H14C12.9 14 12 14.9 12 16V18L24 26L36 18V16C36 14.9 35.1 14 34 14Z" fill="white"/>
            <circle cx="36" cy="12" r="9" fill="#10B981"/>
            <path d="M32.5 12L35 14.5L39.5 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 700 }}>
              <span style={{ color: '#0f172a' }}>Hire</span>
              <span style={{ color: '#7c3aed' }}>Inbox</span>
              <span style={{ color: '#64748b', fontWeight: 500, marginLeft: '8px' }}>for Recruiters</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => router.push('/hire')}
          style={{
            padding: '10px 16px',
            backgroundColor: 'transparent',
            color: '#64748b',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          Switch to Employer View
        </button>
      </header>

      <main style={{ padding: '32px 24px', maxWidth: '1000px', margin: '0 auto' }}>
        {/* Welcome */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
            Recruiter Dashboard
          </h1>
          <p style={{ fontSize: '16px', color: '#64748b' }}>
            Use HireInbox services to screen, interview, and verify candidates for your clients.
          </p>
        </div>

        {/* Client Selector */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '24px'
        }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
            Select Client (optional)
          </label>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              style={{
                flex: 1,
                padding: '12px 16px',
                fontSize: '15px',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                backgroundColor: '#ffffff',
                cursor: 'pointer'
              }}
            >
              <option value="">All clients</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>{client.name} ({client.industry})</option>
              ))}
            </select>
            <button
              onClick={() => setShowAddClient(true)}
              style={{
                padding: '12px 20px',
                backgroundColor: '#7c3aed',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              + Add Client
            </button>
          </div>
          <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '8px' }}>
            Associate your work with a client for easier tracking
          </p>
        </div>

        {/* Services Grid */}
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', marginBottom: '16px' }}>
          HireInbox Services
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px',
          marginBottom: '32px'
        }}>
          {services.map((service) => (
            <button
              key={service.id}
              onClick={service.action}
              style={{
                backgroundColor: '#ffffff',
                border: '2px solid #e2e8f0',
                borderRadius: '12px',
                padding: '24px',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.2s',
                position: 'relative'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = service.color;
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = `0 8px 24px ${service.color}20`;
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = '#e2e8f0';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {service.badge && (
                <div style={{
                  position: 'absolute',
                  top: '-10px',
                  right: '16px',
                  backgroundColor: service.color,
                  color: '#ffffff',
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: 600
                }}>
                  {service.badge}
                </div>
              )}
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '10px',
                backgroundColor: `${service.color}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
                color: service.color
              }}>
                {service.icon}
              </div>
              <div style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '6px' }}>
                {service.title}
              </div>
              <div style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.5, marginBottom: '12px' }}>
                {service.description}
              </div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: service.color }}>
                {service.price}
              </div>
            </button>
          ))}
        </div>

        {/* How It Works */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '24px'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', marginBottom: '16px' }}>
            How It Works for Recruiters
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: '#ede9fe',
                color: '#7c3aed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: 700,
                flexShrink: 0
              }}>1</div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>
                  Create a role for your client
                </div>
                <div style={{ fontSize: '13px', color: '#64748b' }}>
                  Set up the job requirements as you would for an employer
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: '#ede9fe',
                color: '#7c3aed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: 700,
                flexShrink: 0
              }}>2</div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>
                  Use our AI services
                </div>
                <div style={{ fontSize: '13px', color: '#64748b' }}>
                  Screen CVs, find talent, conduct AI interviews, verify candidates
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: '#ede9fe',
                color: '#7c3aed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: 700,
                flexShrink: 0
              }}>3</div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>
                  Present to your client
                </div>
                <div style={{ fontSize: '13px', color: '#64748b' }}>
                  Export reports and shortlists to share with your client
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Support button */}
      <button
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
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        Support
      </button>

      {/* Add Client Modal */}
      {showAddClient && (
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
          onClick={() => setShowAddClient(false)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '450px',
              width: '100%'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
              Add Client
            </h2>
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px' }}>
              Add a new client to associate your work with.
            </p>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                Client Name
              </label>
              <input
                type="text"
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                placeholder="e.g., Acme Corporation"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  fontSize: '15px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                Industry
              </label>
              <select
                value={newClientIndustry}
                onChange={(e) => setNewClientIndustry(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  fontSize: '15px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  backgroundColor: '#ffffff',
                  cursor: 'pointer'
                }}
              >
                <option value="">Select industry</option>
                <option value="Finance">Finance</option>
                <option value="Tech">Tech</option>
                <option value="Retail">Retail</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Manufacturing">Manufacturing</option>
                <option value="Mining">Mining</option>
                <option value="Consulting">Consulting</option>
                <option value="FMCG">FMCG</option>
                <option value="Telecoms">Telecoms</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => {
                  if (newClientName.trim() && newClientIndustry) {
                    const newClient = {
                      id: String(Date.now()),
                      name: newClientName.trim(),
                      industry: newClientIndustry
                    };
                    setClients([...clients, newClient]);
                    setSelectedClient(newClient.id);
                    setNewClientName('');
                    setNewClientIndustry('');
                    setShowAddClient(false);
                  }
                }}
                disabled={!newClientName.trim() || !newClientIndustry}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: newClientName.trim() && newClientIndustry ? '#7c3aed' : '#e2e8f0',
                  color: newClientName.trim() && newClientIndustry ? '#ffffff' : '#94a3b8',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: newClientName.trim() && newClientIndustry ? 'pointer' : 'not-allowed'
                }}
              >
                Add Client
              </button>
              <button
                onClick={() => {
                  setNewClientName('');
                  setNewClientIndustry('');
                  setShowAddClient(false);
                }}
                style={{
                  padding: '12px 20px',
                  backgroundColor: '#f1f5f9',
                  color: '#475569',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
