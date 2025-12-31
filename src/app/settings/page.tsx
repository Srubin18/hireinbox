'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

/* ===========================================
   HIREINBOX - COMPANY SETTINGS PAGE
   - Company profile management
   - Logo upload (localStorage for MVP)
   - Contact and industry info
   =========================================== */

// Types
interface CompanyProfile {
  name: string;
  logo: string | null;
  contactEmail: string;
  industry: string;
  companySize: string;
  website: string;
  description: string;
}

// Industry options
const INDUSTRIES = [
  { value: '', label: 'Select industry' },
  { value: 'technology', label: 'Technology / IT' },
  { value: 'finance', label: 'Banking / Financial Services' },
  { value: 'healthcare', label: 'Healthcare / Pharmaceutical' },
  { value: 'retail', label: 'Retail / E-commerce' },
  { value: 'manufacturing', label: 'Manufacturing / Industrial' },
  { value: 'mining', label: 'Mining / Resources' },
  { value: 'consulting', label: 'Consulting / Professional Services' },
  { value: 'fmcg', label: 'FMCG / Consumer Goods' },
  { value: 'telecom', label: 'Telecommunications' },
  { value: 'education', label: 'Education / EdTech' },
  { value: 'government', label: 'Government / Public Sector' },
  { value: 'ngo', label: 'NGO / Non-Profit' },
  { value: 'hospitality', label: 'Hospitality / Tourism' },
  { value: 'real-estate', label: 'Real Estate / Property' },
  { value: 'legal', label: 'Legal Services' },
  { value: 'media', label: 'Media / Entertainment' },
  { value: 'other', label: 'Other' },
];

// Company size options
const COMPANY_SIZES = [
  { value: '', label: 'Select company size' },
  { value: '1-10', label: '1-10 employees' },
  { value: '11-50', label: '11-50 employees' },
  { value: '51-200', label: '51-200 employees' },
  { value: '201-500', label: '201-500 employees' },
  { value: '501-1000', label: '501-1000 employees' },
  { value: '1000+', label: '1000+ employees' },
];

// Logo Component
const Logo = ({ size = 32 }: { size?: number }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="12" fill="#4F46E5"/>
      <path d="M12 18L24 26L36 18V32C36 33.1 35.1 34 34 34H14C12.9 34 12 33.1 12 32V18Z" fill="white" fillOpacity="0.9"/>
      <path d="M34 14H14C12.9 14 12 14.9 12 16V18L24 26L36 18V16C36 14.9 35.1 14 34 14Z" fill="white"/>
      <circle cx="36" cy="12" r="9" fill="#10B981"/>
      <path d="M32.5 12L35 14.5L39.5 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <span style={{ fontSize: size > 28 ? '1.15rem' : '1rem', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
        <span style={{ color: '#0f172a' }}>Hire</span>
        <span style={{ color: '#4F46E5' }}>Inbox</span>
      </span>
      <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 500 }}>Less noise. Better hires.</span>
    </div>
  </div>
);

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<CompanyProfile>({
    name: '',
    logo: null,
    contactEmail: '',
    industry: '',
    companySize: '',
    website: '',
    description: '',
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'company' | 'team'>('company');

  // Load profile from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedProfile = localStorage.getItem('hireinbox_company_profile');
      if (savedProfile) {
        try {
          setProfile(JSON.parse(savedProfile));
        } catch (e) {
          console.error('Failed to parse saved profile:', e);
        }
      }
    }
  }, []);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/settings');
    }
  }, [user, authLoading, router]);

  // Handle logo upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Image must be smaller than 2MB');
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setProfile(prev => ({ ...prev, logo: base64 }));
    };
    reader.readAsDataURL(file);
  };

  // Handle form save
  const handleSave = async () => {
    setSaving(true);

    try {
      // Save to localStorage for MVP
      localStorage.setItem('hireinbox_company_profile', JSON.stringify(profile));

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save profile:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Loading state
  if (authLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
            <circle cx="24" cy="24" r="20" stroke="#E5E7EB" strokeWidth="4" fill="none"/>
            <circle cx="24" cy="24" r="20" stroke="#4F46E5" strokeWidth="4" fill="none" strokeDasharray="80" strokeDashoffset="60" strokeLinecap="round"/>
          </svg>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", background: '#f8fafc', minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @keyframes spin { to { transform: rotate(360deg); } }
        input:focus, textarea:focus, select:focus { outline: none; border-color: #4F46E5 !important; box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1); }
      `}</style>

      {/* Header */}
      <header style={{ background: 'white', borderBottom: '1px solid #e5e7eb', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <button
            onClick={() => router.push('/')}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', padding: '8px 12px', borderRadius: 8, color: '#64748b', fontSize: '0.875rem', fontWeight: 500 }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back to Dashboard
          </button>
          <div style={{ height: 24, width: 1, background: '#e5e7eb' }} />
          <Logo size={28} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {saved && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#059669', fontSize: '0.875rem', fontWeight: 500 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Saved
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 20px',
              background: saving ? '#94a3b8' : '#4F46E5',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer',
            }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </header>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>
        {/* Page Title */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Settings</h1>
          <p style={{ color: '#64748b', fontSize: '0.9375rem' }}>Manage your company profile and team members</p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 32, background: '#f1f5f9', padding: 4, borderRadius: 10, width: 'fit-content' }}>
          <button
            onClick={() => setActiveTab('company')}
            style={{
              padding: '10px 20px',
              background: activeTab === 'company' ? 'white' : 'transparent',
              border: 'none',
              borderRadius: 8,
              fontSize: '0.875rem',
              fontWeight: 600,
              color: activeTab === 'company' ? '#0f172a' : '#64748b',
              cursor: 'pointer',
              boxShadow: activeTab === 'company' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            Company Profile
          </button>
          <button
            onClick={() => router.push('/settings/team')}
            style={{
              padding: '10px 20px',
              background: activeTab === 'team' ? 'white' : 'transparent',
              border: 'none',
              borderRadius: 8,
              fontSize: '0.875rem',
              fontWeight: 600,
              color: activeTab === 'team' ? '#0f172a' : '#64748b',
              cursor: 'pointer',
              boxShadow: activeTab === 'team' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            Team Members
          </button>
        </div>

        {/* Company Profile Form */}
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: 32 }}>
          {/* Logo Section */}
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0f172a', marginBottom: 16 }}>Company Logo</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              <div style={{
                width: 100,
                height: 100,
                borderRadius: 16,
                background: profile.logo ? `url(${profile.logo}) center/cover` : '#f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px dashed #d1d5db',
              }}>
                {!profile.logo && (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                )}
              </div>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  style={{ display: 'none' }}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    padding: '10px 16px',
                    background: 'white',
                    border: '1px solid #d1d5db',
                    borderRadius: 8,
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: '#374151',
                    cursor: 'pointer',
                    marginBottom: 8,
                    display: 'block',
                  }}
                >
                  Upload Logo
                </button>
                {profile.logo && (
                  <button
                    onClick={() => setProfile(prev => ({ ...prev, logo: null }))}
                    style={{
                      padding: '6px 12px',
                      background: 'none',
                      border: 'none',
                      fontSize: '0.8125rem',
                      color: '#ef4444',
                      cursor: 'pointer',
                    }}
                  >
                    Remove
                  </button>
                )}
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 4 }}>
                  Recommended: 200x200px, PNG or JPG, max 2MB
                </p>
              </div>
            </div>
          </div>

          {/* Company Info */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
            {/* Company Name */}
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: 8 }}>
                Company Name <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Acme Corporation"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  border: '1px solid #d1d5db',
                  borderRadius: 8,
                  fontSize: '0.9375rem',
                  color: '#0f172a',
                }}
              />
            </div>

            {/* Contact Email */}
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: 8 }}>
                Contact Email <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="email"
                value={profile.contactEmail}
                onChange={(e) => setProfile(prev => ({ ...prev, contactEmail: e.target.value }))}
                placeholder="hr@acme.co.za"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  border: '1px solid #d1d5db',
                  borderRadius: 8,
                  fontSize: '0.9375rem',
                  color: '#0f172a',
                }}
              />
            </div>

            {/* Industry */}
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: 8 }}>
                Industry
              </label>
              <select
                value={profile.industry}
                onChange={(e) => setProfile(prev => ({ ...prev, industry: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  border: '1px solid #d1d5db',
                  borderRadius: 8,
                  fontSize: '0.9375rem',
                  color: '#0f172a',
                  background: 'white',
                  cursor: 'pointer',
                }}
              >
                {INDUSTRIES.map(ind => (
                  <option key={ind.value} value={ind.value}>{ind.label}</option>
                ))}
              </select>
            </div>

            {/* Company Size */}
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: 8 }}>
                Company Size
              </label>
              <select
                value={profile.companySize}
                onChange={(e) => setProfile(prev => ({ ...prev, companySize: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  border: '1px solid #d1d5db',
                  borderRadius: 8,
                  fontSize: '0.9375rem',
                  color: '#0f172a',
                  background: 'white',
                  cursor: 'pointer',
                }}
              >
                {COMPANY_SIZES.map(size => (
                  <option key={size.value} value={size.value}>{size.label}</option>
                ))}
              </select>
            </div>

            {/* Website */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: 8 }}>
                Website
              </label>
              <input
                type="url"
                value={profile.website}
                onChange={(e) => setProfile(prev => ({ ...prev, website: e.target.value }))}
                placeholder="https://www.acme.co.za"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  border: '1px solid #d1d5db',
                  borderRadius: 8,
                  fontSize: '0.9375rem',
                  color: '#0f172a',
                }}
              />
            </div>

            {/* Description */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: 8 }}>
                Company Description
              </label>
              <textarea
                value={profile.description}
                onChange={(e) => setProfile(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Tell candidates about your company..."
                rows={4}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  border: '1px solid #d1d5db',
                  borderRadius: 8,
                  fontSize: '0.9375rem',
                  color: '#0f172a',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                }}
              />
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 6 }}>
                This appears on job postings and candidate communications
              </p>
            </div>
          </div>

          {/* Danger Zone */}
          <div style={{ marginTop: 40, padding: 24, background: '#fef2f2', borderRadius: 12, border: '1px solid #fecaca' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#991b1b', marginBottom: 8 }}>Danger Zone</h3>
            <p style={{ fontSize: '0.875rem', color: '#991b1b', marginBottom: 16 }}>
              These actions are permanent and cannot be undone.
            </p>
            <button
              onClick={() => {
                if (confirm('Are you sure you want to delete all company data? This cannot be undone.')) {
                  localStorage.removeItem('hireinbox_company_profile');
                  localStorage.removeItem('hireinbox_team_members');
                  setProfile({
                    name: '',
                    logo: null,
                    contactEmail: '',
                    industry: '',
                    companySize: '',
                    website: '',
                    description: '',
                  });
                }
              }}
              style={{
                padding: '10px 16px',
                background: 'white',
                border: '1px solid #fca5a5',
                borderRadius: 8,
                fontSize: '0.875rem',
                fontWeight: 500,
                color: '#dc2626',
                cursor: 'pointer',
              }}
            >
              Delete All Company Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
