'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { VideoUpload } from '@/components/VideoUpload';

// ============================================
// HIREINBOX B2C - CANDIDATE DASHBOARD
// /candidates/dashboard
//
// Full MVP Features:
// - Application status tracking (Hiring Pass)
// - Connection requests from employers
// - Profile completeness indicator
// - CV versions & feedback
// - Video intro management
// - Messages from employers
// - Settings & POPIA controls
// ============================================

// Types
interface Application {
  id: string;
  roleTitle: string;
  companyName: string;
  location: string;
  status: ApplicationStatus;
  aiScore?: number;
  appliedAt: string;
  lastUpdated: string;
}

type ApplicationStatus =
  | 'received'      // Pass 0
  | 'screened'      // Pass 1
  | 'shortlisted'   // Pass 2
  | 'interview'     // Pass 3-5
  | 'offer'         // Pass 6 (positive)
  | 'not_selected'; // Pass 6 (negative)

interface Connection {
  id: string;
  companyName: string;
  roleTitle: string;
  message: string;
  status: 'pending' | 'accepted' | 'declined';
  requestedAt: string;
}

interface CVVersion {
  id: string;
  name: string;
  uploadedAt: string;
  score: number;
  status: 'analyzed' | 'pending';
}

// Extended interface for CV analyses from Supabase
interface CVAnalysis {
  id: string;
  cv_filename: string | null;
  candidate_name: string | null;
  current_title: string | null;
  years_experience: number | null;
  score: number;
  strengths: any[];
  improvements: any[];
  ats_score: number | null;
  ats_issues: string[];
  summary: string | null;
  career_insights: any;
  sa_context_highlights: string[];
  created_at: string;
}

interface Message {
  id: string;
  from: string;
  preview: string;
  date: string;
  unread: boolean;
}

// SVG Icons
const Icons = {
  document: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  ),
  video: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="23 7 16 12 23 17 23 7"/>
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
    </svg>
  ),
  briefcase: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
    </svg>
  ),
  link: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
    </svg>
  ),
  message: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  settings: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  check: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  clock: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  x: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  building: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="2" width="16" height="20" rx="2" ry="2"/>
      <line x1="9" y1="6" x2="9" y2="6"/>
      <line x1="15" y1="6" x2="15" y2="6"/>
      <line x1="9" y1="10" x2="9" y2="10"/>
      <line x1="15" y1="10" x2="15" y2="10"/>
      <line x1="9" y1="14" x2="9" y2="14"/>
      <line x1="15" y1="14" x2="15" y2="14"/>
      <line x1="9" y1="18" x2="15" y2="18"/>
    </svg>
  )
};

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

// Status configuration
const STATUS_CONFIG: Record<ApplicationStatus, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
  received: { label: 'CV Received', color: '#64748b', bgColor: '#f1f5f9', icon: Icons.clock },
  screened: { label: 'AI Screened', color: '#7c3aed', bgColor: '#ede9fe', icon: Icons.clock },
  shortlisted: { label: 'Shortlisted', color: '#059669', bgColor: '#d1fae5', icon: Icons.check },
  interview: { label: 'Interview Stage', color: '#0891b2', bgColor: '#cffafe', icon: Icons.clock },
  offer: { label: 'Offer Extended', color: '#059669', bgColor: '#d1fae5', icon: Icons.check },
  not_selected: { label: 'Not Selected', color: '#64748b', bgColor: '#f1f5f9', icon: Icons.x }
};

// Sample data - production: fetch from API
const sampleApplications: Application[] = [
  { id: '1', roleTitle: 'Senior Developer', companyName: 'Tech Corp', location: 'Cape Town', status: 'shortlisted', aiScore: 87, appliedAt: '2026-01-20', lastUpdated: '2026-01-23' },
  { id: '2', roleTitle: 'Full Stack Engineer', companyName: 'StartupXYZ', location: 'Remote', status: 'screened', aiScore: 78, appliedAt: '2026-01-22', lastUpdated: '2026-01-22' },
  { id: '3', roleTitle: 'React Developer', companyName: 'Digital Agency', location: 'Johannesburg', status: 'interview', aiScore: 92, appliedAt: '2026-01-18', lastUpdated: '2026-01-24' },
  { id: '4', roleTitle: 'Backend Engineer', companyName: 'FinTech Co', location: 'Cape Town', status: 'received', appliedAt: '2026-01-24', lastUpdated: '2026-01-24' },
];

const sampleConnections: Connection[] = [
  { id: '1', companyName: 'Innovation Labs', roleTitle: 'Lead Developer', message: 'We were impressed by your profile and would love to discuss opportunities at our company.', status: 'pending', requestedAt: '2026-01-23' },
  { id: '2', companyName: 'Growth Startup', roleTitle: 'Senior Engineer', message: 'Your experience in React and Node.js matches what we are looking for.', status: 'pending', requestedAt: '2026-01-22' },
];

const sampleCVs: CVVersion[] = [
  { id: '1', name: 'Developer_CV_v2.pdf', uploadedAt: '2026-01-23', score: 72, status: 'analyzed' },
  { id: '2', name: 'Developer_CV_v1.pdf', uploadedAt: '2026-01-20', score: 65, status: 'analyzed' }
];

const sampleMessages: Message[] = [
  { id: '1', from: 'HireInbox Team', preview: 'Welcome to HireInbox! Here are some tips to get started...', date: '2026-01-23', unread: true },
  { id: '2', from: 'Tech Corp', preview: 'We would like to schedule an interview...', date: '2026-01-23', unread: true },
  { id: '3', from: 'Talent Pool Update', preview: 'Your profile is now visible to 12 employers', date: '2026-01-22', unread: false }
];

type Tab = 'applications' | 'connections' | 'cvs' | 'videos' | 'messages' | 'settings';

export default function CandidateDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('applications');
  const [applications] = useState<Application[]>(sampleApplications);
  const [connections, setConnections] = useState<Connection[]>(sampleConnections);
  const [cvVersions, setCvVersions] = useState<CVVersion[]>([]);
  const [cvAnalyses, setCvAnalyses] = useState<CVAnalysis[]>([]);
  const [loadingCVs, setLoadingCVs] = useState(true);
  const [messages] = useState<Message[]>(sampleMessages);
  const [talentPoolStatus, setTalentPoolStatus] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [profileCompleteness, setProfileCompleteness] = useState(65);
  const [candidateId] = useState('demo-candidate-id');
  const [hasVideo, setHasVideo] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [selectedAnalysis, setSelectedAnalysis] = useState<CVAnalysis | null>(null);

  // Load user email from sessionStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedEmail = sessionStorage.getItem('userEmail');
      if (storedEmail) setUserEmail(storedEmail);
    }
  }, []);

  // Fetch CV analyses from Supabase
  useEffect(() => {
    const fetchCVAnalyses = async () => {
      if (!userEmail) {
        setLoadingCVs(false);
        // Fall back to sample data if no user email
        setCvVersions(sampleCVs);
        return;
      }

      try {
        const response = await fetch(`/api/cv-analyses?email=${encodeURIComponent(userEmail)}`);
        if (response.ok) {
          const data = await response.json();
          if (data.analyses && data.analyses.length > 0) {
            setCvAnalyses(data.analyses);
            // Map to CVVersion format for display
            const versions: CVVersion[] = data.analyses.map((analysis: CVAnalysis) => ({
              id: analysis.id,
              name: analysis.cv_filename || 'Uploaded CV',
              uploadedAt: new Date(analysis.created_at).toISOString().split('T')[0],
              score: analysis.score,
              status: 'analyzed' as const,
            }));
            setCvVersions(versions);
          } else {
            // No analyses found, use sample data
            setCvVersions(sampleCVs);
          }
        } else {
          console.error('Failed to fetch CV analyses');
          setCvVersions(sampleCVs);
        }
      } catch (error) {
        console.error('Error fetching CV analyses:', error);
        setCvVersions(sampleCVs);
      } finally {
        setLoadingCVs(false);
      }
    };

    fetchCVAnalyses();
  }, [userEmail]);

  // Calculate profile completeness
  useEffect(() => {
    let completeness = 20; // Base for having account
    if (cvVersions.length > 0) completeness += 25;
    if (hasVideo) completeness += 20;
    if (talentPoolStatus) completeness += 15;
    // Skills, experience would add more
    completeness += 20; // Assuming basic profile info
    setProfileCompleteness(Math.min(completeness, 100));
  }, [cvVersions, hasVideo, talentPoolStatus]);

  const handleDeleteAccount = useCallback(async () => {
    setIsDeleting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      router.push('/');
    } catch (error) {
      console.error('Failed to delete account:', error);
      setIsDeleting(false);
    }
  }, [router]);

  const handleConnectionResponse = useCallback(async (connectionId: string, action: 'accepted' | 'declined') => {
    // In production: call API
    setConnections(prev => prev.map(c =>
      c.id === connectionId ? { ...c, status: action } : c
    ));
  }, []);

  const tabs: { id: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'applications', label: 'Applications', icon: Icons.briefcase, count: applications.length },
    { id: 'connections', label: 'Connections', icon: Icons.link, count: connections.filter(c => c.status === 'pending').length },
    { id: 'cvs', label: 'My CVs', icon: Icons.document },
    { id: 'videos', label: 'Videos', icon: Icons.video },
    { id: 'messages', label: 'Messages', icon: Icons.message, count: messages.filter(m => m.unread).length },
    { id: 'settings', label: 'Settings', icon: Icons.settings }
  ];

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#059669';
    if (score >= 60) return '#d97706';
    return '#dc2626';
  };

  // Profile completeness component
  const ProfileCompleteness = () => (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      padding: '20px',
      border: '1px solid #e2e8f0',
      marginBottom: '24px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <span style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>Profile Completeness</span>
        <span style={{
          fontSize: '14px',
          fontWeight: 700,
          color: profileCompleteness >= 80 ? '#059669' : profileCompleteness >= 50 ? '#d97706' : '#dc2626'
        }}>
          {profileCompleteness}%
        </span>
      </div>
      <div style={{
        height: '8px',
        backgroundColor: '#e2e8f0',
        borderRadius: '4px',
        overflow: 'hidden'
      }}>
        <div style={{
          height: '100%',
          width: `${profileCompleteness}%`,
          backgroundColor: profileCompleteness >= 80 ? '#059669' : profileCompleteness >= 50 ? '#d97706' : '#dc2626',
          borderRadius: '4px',
          transition: 'width 0.3s ease'
        }} />
      </div>
      {profileCompleteness < 100 && (
        <div style={{ marginTop: '12px', fontSize: '13px', color: '#64748b' }}>
          {!hasVideo && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ color: '#d97706' }}>+20%</span> Add a video introduction
            </div>
          )}
          {!talentPoolStatus && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#d97706' }}>+15%</span> Join the Talent Pool
            </div>
          )}
        </div>
      )}
    </div>
  );

  // Applications Tab
  const renderApplicationsTab = () => (
    <div>
      <ProfileCompleteness />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
          My Applications
        </h2>
        <div style={{ fontSize: '13px', color: '#64748b' }}>
          {applications.filter(a => a.status === 'shortlisted' || a.status === 'interview').length} in progress
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {applications.map((app) => {
          const statusConfig = STATUS_CONFIG[app.status];
          return (
            <div
              key={app.id}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid #e2e8f0'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '16px', marginBottom: '4px' }}>
                    {app.roleTitle}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#64748b' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {Icons.building}
                      {app.companyName}
                    </span>
                    <span>•</span>
                    <span>{app.location}</span>
                  </div>
                </div>
                {app.aiScore && (
                  <div style={{
                    padding: '4px 12px',
                    backgroundColor: '#f1f5f9',
                    borderRadius: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <span style={{ color: getScoreColor(app.aiScore), fontWeight: 700, fontSize: '14px' }}>
                      {app.aiScore}%
                    </span>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>match</span>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  backgroundColor: statusConfig.bgColor,
                  color: statusConfig.color,
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: 500
                }}>
                  <span style={{ display: 'flex' }}>{statusConfig.icon}</span>
                  {statusConfig.label}
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                  Applied {app.appliedAt} • Updated {app.lastUpdated}
                </div>
              </div>

              {/* Status timeline */}
              <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                {(['received', 'screened', 'shortlisted', 'interview', 'offer'] as ApplicationStatus[]).map((status, i, arr) => {
                  const isPast = arr.indexOf(app.status) >= i;
                  const isCurrent = app.status === status;
                  return (
                    <div key={status} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                      <div style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        backgroundColor: isPast ? '#4F46E5' : '#e2e8f0',
                        border: isCurrent ? '3px solid #c7d2fe' : 'none',
                        transition: 'all 0.2s'
                      }} />
                      {i < arr.length - 1 && (
                        <div style={{
                          flex: 1,
                          height: '2px',
                          backgroundColor: isPast && arr.indexOf(app.status) > i ? '#4F46E5' : '#e2e8f0',
                          marginLeft: '4px'
                        }} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {applications.length === 0 && (
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '48px',
          border: '1px solid #e2e8f0',
          textAlign: 'center'
        }}>
          <div style={{ marginBottom: '16px', color: '#94a3b8' }}>{Icons.briefcase}</div>
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>
            No applications yet
          </div>
          <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px' }}>
            Upload your CV to start applying for roles
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

  // Connections Tab
  const renderConnectionsTab = () => (
    <div>
      <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginBottom: '24px' }}>
        Connection Requests
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {connections.map((conn) => (
          <div
            key={conn.id}
            style={{
              backgroundColor: conn.status === 'pending' ? '#fffbeb' : '#ffffff',
              borderRadius: '12px',
              padding: '20px',
              border: `1px solid ${conn.status === 'pending' ? '#fcd34d' : '#e2e8f0'}`
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div>
                <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '16px', marginBottom: '4px' }}>
                  {conn.companyName}
                </div>
                <div style={{ fontSize: '14px', color: '#64748b' }}>
                  {conn.roleTitle}
                </div>
              </div>
              {conn.status !== 'pending' && (
                <span style={{
                  padding: '4px 12px',
                  backgroundColor: conn.status === 'accepted' ? '#d1fae5' : '#f1f5f9',
                  color: conn.status === 'accepted' ? '#059669' : '#64748b',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 500
                }}>
                  {conn.status === 'accepted' ? 'Connected' : 'Declined'}
                </span>
              )}
            </div>

            <div style={{
              padding: '12px',
              backgroundColor: '#f8fafc',
              borderRadius: '8px',
              fontSize: '14px',
              color: '#475569',
              marginBottom: '16px',
              lineHeight: 1.5
            }}>
              &ldquo;{conn.message}&rdquo;
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                Received {conn.requestedAt}
              </div>

              {conn.status === 'pending' && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleConnectionResponse(conn.id, 'declined')}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#f1f5f9',
                      color: '#64748b',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: 500,
                      cursor: 'pointer'
                    }}
                  >
                    Decline
                  </button>
                  <button
                    onClick={() => handleConnectionResponse(conn.id, 'accepted')}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#059669',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Accept & Share Details
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {connections.length === 0 && (
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '48px',
          border: '1px solid #e2e8f0',
          textAlign: 'center'
        }}>
          <div style={{ marginBottom: '16px', color: '#94a3b8' }}>{Icons.link}</div>
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>
            No connection requests yet
          </div>
          <div style={{ fontSize: '14px', color: '#64748b' }}>
            Employers who are interested in your profile will send connection requests here
          </div>
        </div>
      )}

      {/* Info box */}
      <div style={{
        marginTop: '24px',
        padding: '16px',
        backgroundColor: '#eff6ff',
        borderRadius: '12px',
        border: '1px solid #bfdbfe'
      }}>
        <div style={{ fontSize: '13px', color: '#1e40af', fontWeight: 600, marginBottom: '4px' }}>
          How connections work
        </div>
        <div style={{ fontSize: '13px', color: '#3b82f6', lineHeight: 1.5 }}>
          When you accept a connection, your contact details (email and phone) will be shared with the employer.
          Your details remain private until you explicitly accept.
        </div>
      </div>
    </div>
  );

  // Find the matching analysis for a CV version
  const getAnalysisForCV = (cvId: string): CVAnalysis | undefined => {
    return cvAnalyses.find(a => a.id === cvId);
  };

  // CVs Tab
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

      {/* Loading state */}
      {loadingCVs && (
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '48px',
          border: '1px solid #e2e8f0',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '14px', color: '#64748b' }}>Loading your CV analyses...</div>
        </div>
      )}

      {!loadingCVs && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {cvVersions.map((cv) => {
            const analysis = getAnalysisForCV(cv.id);
            return (
              <div
                key={cv.id}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  padding: '20px',
                  border: '1px solid #e2e8f0'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      backgroundColor: '#f1f5f9',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#4F46E5'
                    }}>
                      {Icons.document}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>
                        {cv.name}
                      </div>
                      <div style={{ fontSize: '13px', color: '#64748b' }}>
                        Analyzed {cv.uploadedAt}
                        {analysis?.candidate_name && ` - ${analysis.candidate_name}`}
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
                      onClick={() => {
                        if (analysis) {
                          setSelectedAnalysis(analysis);
                        } else {
                          router.push('/candidates/scan');
                        }
                      }}
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

                {/* Quick summary for real analyses */}
                {analysis?.summary && (
                  <div style={{
                    marginTop: '16px',
                    padding: '12px',
                    backgroundColor: '#f8fafc',
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: '#475569',
                    lineHeight: 1.5
                  }}>
                    {analysis.summary.length > 200
                      ? analysis.summary.substring(0, 200) + '...'
                      : analysis.summary}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!loadingCVs && cvVersions.length === 0 && (
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '48px',
          border: '1px solid #e2e8f0',
          textAlign: 'center'
        }}>
          <div style={{ marginBottom: '16px', color: '#94a3b8' }}>{Icons.document}</div>
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

  // Videos Tab
  const renderVideosTab = () => (
    <div>
      <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
        Video Introduction
      </h2>
      <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px' }}>
        A short video helps employers get to know you beyond your CV
      </p>

      <VideoUpload
        candidateId={candidateId}
        onUploadComplete={() => setHasVideo(true)}
        onDelete={() => setHasVideo(false)}
      />

      {/* Benefits */}
      <div style={{
        marginTop: '24px',
        padding: '20px',
        backgroundColor: '#f0fdf4',
        borderRadius: '12px',
        border: '1px solid #bbf7d0'
      }}>
        <div style={{ fontSize: '14px', fontWeight: 600, color: '#166534', marginBottom: '12px' }}>
          Why add a video?
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            'Profiles with videos get 3x more employer interest',
            'Show your personality and communication skills',
            'Stand out from other candidates',
            'Let employers see the real you'
          ].map((benefit, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#15803d' }}>
              <span style={{ color: '#22c55e' }}>{Icons.check}</span>
              {benefit}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Messages Tab
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
          <div style={{ marginBottom: '16px', color: '#94a3b8' }}>{Icons.message}</div>
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

  // Settings Tab
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
                setTalentPoolStatus(!talentPoolStatus);
              }
            }}
          >
            <input
              id="talent-pool-toggle"
              type="checkbox"
              checked={talentPoolStatus}
              onChange={(e) => setTalentPoolStatus(e.target.checked)}
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
            color: '#166534',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ color: '#22c55e' }}>{Icons.check}</span>
            Your profile is visible to vetted employers. Contact details remain private until you accept a connection.
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
          {['Job alerts', 'Employer messages', 'Application updates', 'Connection requests'].map((item, i) => (
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
        gap: '4px',
        overflowX: 'auto'
      }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '16px 16px',
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
              whiteSpace: 'nowrap',
              transition: 'all 0.2s'
            }}
          >
            <span style={{ display: 'flex' }}>{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
            {tab.count !== undefined && tab.count > 0 && (
              <span style={{
                backgroundColor: activeTab === tab.id ? '#4F46E5' : '#dc2626',
                color: '#ffffff',
                padding: '2px 8px',
                borderRadius: '10px',
                fontSize: '11px',
                fontWeight: 600
              }}>
                {tab.count}
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
        {activeTab === 'applications' && renderApplicationsTab()}
        {activeTab === 'connections' && renderConnectionsTab()}
        {activeTab === 'cvs' && renderCVsTab()}
        {activeTab === 'videos' && renderVideosTab()}
        {activeTab === 'messages' && renderMessagesTab()}
        {activeTab === 'settings' && renderSettingsTab()}
      </main>

      {/* CV Analysis Detail Modal */}
      {selectedAnalysis && (
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
            if (e.target === e.currentTarget) {
              setSelectedAnalysis(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="analysis-dialog-title"
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            {/* Header with score */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <h3
                  id="analysis-dialog-title"
                  style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}
                >
                  {selectedAnalysis.candidate_name || 'CV Analysis'}
                </h3>
                <p style={{ fontSize: '14px', color: '#64748b' }}>
                  {selectedAnalysis.current_title || 'Professional'}
                  {selectedAnalysis.years_experience ? ` - ${selectedAnalysis.years_experience} years experience` : ''}
                </p>
              </div>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                border: `4px solid ${getScoreColor(selectedAnalysis.score)}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <span style={{ fontSize: '20px', fontWeight: 700, color: getScoreColor(selectedAnalysis.score) }}>
                  {selectedAnalysis.score}
                </span>
              </div>
            </div>

            {/* Summary */}
            {selectedAnalysis.summary && (
              <div style={{
                padding: '16px',
                backgroundColor: '#f8fafc',
                borderRadius: '12px',
                marginBottom: '20px',
                fontSize: '14px',
                color: '#475569',
                lineHeight: 1.6
              }}>
                {selectedAnalysis.summary}
              </div>
            )}

            {/* Strengths */}
            {selectedAnalysis.strengths && selectedAnalysis.strengths.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#10B981' }}>+</span> Strengths
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedAnalysis.strengths.slice(0, 4).map((strength: any, idx: number) => (
                    <div key={idx} style={{
                      padding: '12px',
                      backgroundColor: '#f0fdf4',
                      borderRadius: '8px',
                      borderLeft: '3px solid #10B981'
                    }}>
                      <div style={{ fontWeight: 500, color: '#166534', fontSize: '14px' }}>
                        {strength.strength || strength.area || strength.title || 'Strength'}
                      </div>
                      <div style={{ fontSize: '13px', color: '#475569', marginTop: '4px' }}>
                        {strength.evidence || strength.detail || strength.impact || ''}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Improvements */}
            {selectedAnalysis.improvements && selectedAnalysis.improvements.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#f59e0b' }}>^</span> Areas to Improve
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedAnalysis.improvements.slice(0, 4).map((improvement: any, idx: number) => (
                    <div key={idx} style={{
                      padding: '12px',
                      backgroundColor: '#fefce8',
                      borderRadius: '8px',
                      borderLeft: '3px solid #f59e0b'
                    }}>
                      <div style={{ fontWeight: 500, color: '#854d0e', fontSize: '14px' }}>
                        {improvement.area || improvement.title || 'Improvement'}
                      </div>
                      <div style={{ fontSize: '13px', color: '#475569', marginTop: '4px' }}>
                        {improvement.suggestion || improvement.current_state || ''}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ATS Score */}
            {selectedAnalysis.ats_score && (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '12px' }}>
                  ATS Compatibility: {selectedAnalysis.ats_score}%
                </h4>
                <div style={{
                  height: '8px',
                  backgroundColor: '#e2e8f0',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${selectedAnalysis.ats_score}%`,
                    backgroundColor: getScoreColor(selectedAnalysis.ats_score),
                    borderRadius: '4px'
                  }} />
                </div>
              </div>
            )}

            {/* Close button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button
                onClick={() => setSelectedAnalysis(null)}
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
                Close
              </button>
            </div>
          </div>
        </div>
      )}

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
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        Support
      </button>

      {/* Mobile responsive styles */}
      <style>{`
        @media (max-width: 640px) {
          .tab-label {
            display: none;
          }
          nav button {
            padding: 16px 12px !important;
          }
        }
      `}</style>
    </div>
  );
}
