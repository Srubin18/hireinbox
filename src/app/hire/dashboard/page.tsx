'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

// ============================================
// HIREINBOX B2B - COMPREHENSIVE EMPLOYER DASHBOARD
// /hire/dashboard
//
// Hiring Pass System (MANDATORY STATES):
// PASS 0 — CV RECEIVED (Acknowledgement email sent)
// PASS 1 — AI SCREENED (Strong / Possible / Low match)
// PASS 2 — SHORTLISTED (Manual selection, outcome emails)
// PASS 3 — AI INTERVIEW (Optional - Transcript + summary)
// PASS 4 — VERIFICATION (Optional - ID/Credit/Refs)
// PASS 5 — HUMAN INTERVIEW (Manual status updates)
// PASS 6 — OUTCOME (Offer / Hired / Not successful)
// PASS 7 — TALENT POOL DECISION (Employer opt-in, candidate consent)
// ============================================

type HiringPass = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
type AIMatch = 'strong' | 'possible' | 'low';
type NavSection = 'inbox' | 'screening' | 'interviews' | 'verification' | 'pipeline' | 'talent-pool' | 'analytics' | 'settings';

interface VerificationStatus {
  idCheck?: 'pending' | 'in_progress' | 'passed' | 'failed' | 'not_ordered';
  creditCheck?: 'pending' | 'in_progress' | 'good' | 'fair' | 'poor' | 'not_ordered';
  referenceCheck?: 'pending' | 'in_progress' | 'positive' | 'mixed' | 'negative' | 'not_ordered';
}

interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  pass: HiringPass;
  aiMatch?: AIMatch;
  aiScore?: number;
  hasVideo?: boolean;
  hasAiInterview?: boolean;
  verified?: boolean;
  verification?: VerificationStatus;
  receivedAt: string;
  lastUpdated: string;
  // AI Analysis fields
  aiRecommendation?: string;
  aiReasoning?: string;
  strengths?: string[];
  weaknesses?: string[];
  screeningResult?: Record<string, unknown>;
}

interface Role {
  id: string;
  title: string;
  location: string;
  createdAt: string;
  candidateCount: number;
  newToday: number;
  // Extended fields for role details
  seniority?: string;
  employmentType?: string;
  workArrangement?: string;
  department?: string;
  salaryMin?: number;
  salaryMax?: number;
  minExperience?: number;
  maxExperience?: number;
  requiredSkills?: string[];
  qualifications?: string[];
  strongFit?: string;
  disqualifiers?: string;
}

// SVG Icons
const Icons = {
  inbox: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
      <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
    </svg>
  ),
  screening: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <path d="M9 15l2 2 4-4"/>
    </svg>
  ),
  video: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="23 7 16 12 23 17 23 7"/>
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
    </svg>
  ),
  shield: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <path d="M9 12l2 2 4-4"/>
    </svg>
  ),
  pipeline: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
      <line x1="9" y1="3" x2="9" y2="21"/>
      <line x1="15" y1="3" x2="15" y2="21"/>
    </svg>
  ),
  users: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  chart: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
  settings: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  plus: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  message: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  check: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  x: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  id: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="16" rx="2"/>
      <circle cx="9" cy="10" r="2"/>
      <path d="M15 8h2"/>
      <path d="M15 12h2"/>
      <path d="M7 16h10"/>
    </svg>
  ),
  creditCard: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
      <line x1="1" y1="10" x2="23" y2="10"/>
    </svg>
  ),
  userCheck: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="8.5" cy="7" r="4"/>
      <polyline points="17 11 19 13 23 9"/>
    </svg>
  ),
  fileSearch: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <circle cx="11.5" cy="14.5" r="2.5"/>
      <path d="M13.25 16.25L15 18"/>
    </svg>
  ),
  package: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M16.5 9.4l-9-5.19"/>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
      <line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  ),
  star: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  )
};

// Verification pricing
const VERIFICATION_PRICING = {
  idCheck: { label: 'ID Verification', price: 150, icon: 'id', description: 'Verify South African ID against Home Affairs' },
  creditCheck: { label: 'Credit Check', price: 200, icon: 'creditCard', description: 'TransUnion credit report summary' },
  referenceCheck: { label: 'Reference Check', price: 200, icon: 'userCheck', description: 'AI-assisted reference verification (2 refs)' },
  fullPackage: { label: 'Complete Package', price: 550, icon: 'package', description: 'All 3 checks - Save R50' }
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

const PASS_LABELS: Record<HiringPass, { label: string; color: string; bgColor: string }> = {
  0: { label: 'CV Received', color: '#64748b', bgColor: '#f1f5f9' },
  1: { label: 'AI Screened', color: '#7c3aed', bgColor: '#ede9fe' },
  2: { label: 'Shortlisted', color: '#059669', bgColor: '#d1fae5' },
  3: { label: 'AI Interview', color: '#0891b2', bgColor: '#cffafe' },
  4: { label: 'Verification', color: '#d97706', bgColor: '#fef3c7' },
  5: { label: 'Human Interview', color: '#4f46e5', bgColor: '#e0e7ff' },
  6: { label: 'Outcome', color: '#dc2626', bgColor: '#fee2e2' },
  7: { label: 'Talent Pool', color: '#10b981', bgColor: '#d1fae5' }
};

const AI_MATCH_LABELS: Record<AIMatch, { label: string; color: string; bgColor: string }> = {
  strong: { label: 'Strong Match', color: '#059669', bgColor: '#d1fae5' },
  possible: { label: 'Possible', color: '#d97706', bgColor: '#fef3c7' },
  low: { label: 'Low Match', color: '#dc2626', bgColor: '#fee2e2' }
};

// Sample data
const sampleCandidates: Candidate[] = [
  { id: '1', name: 'Sarah Johnson', email: 'sarah@email.com', phone: '+27 82 123 4567', role: 'Senior Developer', pass: 2, aiMatch: 'strong', aiScore: 92, hasVideo: true, receivedAt: '2026-01-22', lastUpdated: '2026-01-23' },
  { id: '2', name: 'Michael Chen', email: 'michael@email.com', phone: '+27 83 234 5678', role: 'Senior Developer', pass: 1, aiMatch: 'strong', aiScore: 88, receivedAt: '2026-01-22', lastUpdated: '2026-01-22' },
  { id: '3', name: 'Thabo Molefe', email: 'thabo@email.com', phone: '+27 84 345 6789', role: 'Senior Developer', pass: 3, aiMatch: 'strong', aiScore: 85, hasAiInterview: true, receivedAt: '2026-01-21', lastUpdated: '2026-01-22' },
  { id: '4', name: 'Priya Naidoo', email: 'priya@email.com', phone: '+27 85 456 7890', role: 'Senior Developer', pass: 0, receivedAt: '2026-01-23', lastUpdated: '2026-01-23' },
  { id: '5', name: 'John Smith', email: 'john@email.com', phone: '+27 86 567 8901', role: 'Senior Developer', pass: 5, aiMatch: 'strong', aiScore: 95, hasAiInterview: true, verified: true, verification: { idCheck: 'passed', creditCheck: 'good', referenceCheck: 'positive' }, receivedAt: '2026-01-18', lastUpdated: '2026-01-22' },
  { id: '6', name: 'Nomsa Dlamini', email: 'nomsa@email.com', phone: '+27 87 678 9012', role: 'Senior Developer', pass: 1, aiMatch: 'low', aiScore: 45, receivedAt: '2026-01-21', lastUpdated: '2026-01-22' },
  { id: '7', name: 'David Botha', email: 'david@email.com', phone: '+27 82 999 1234', role: 'Senior Developer', pass: 4, aiMatch: 'strong', aiScore: 87, hasAiInterview: true, verification: { idCheck: 'passed', creditCheck: 'pending', referenceCheck: 'not_ordered' }, receivedAt: '2026-01-19', lastUpdated: '2026-01-24' },
];

const sampleRoles: Role[] = [
  { id: '1', title: 'Senior Developer', location: 'Cape Town', createdAt: '2026-01-15', candidateCount: 47, newToday: 3 },
  { id: '2', title: 'Marketing Manager', location: 'Johannesburg', createdAt: '2026-01-10', candidateCount: 28, newToday: 5 },
  { id: '3', title: 'Sales Executive', location: 'Durban', createdAt: '2026-01-20', candidateCount: 12, newToday: 2 },
];

// Supabase client for demo mode
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default function EmployerDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDemo = searchParams.get('demo') === 'true';

  const [candidates, setCandidates] = useState<Candidate[]>(sampleCandidates);
  const [roles, setRoles] = useState<Role[]>(sampleRoles);
  const [demoLoading, setDemoLoading] = useState(false);
  const [fetchingEmails, setFetchingEmails] = useState(false);
  const [lastFetchResult, setLastFetchResult] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('1');
  const [activeNav, setActiveNav] = useState<NavSection>('inbox');
  const [filterPass, setFilterPass] = useState<HiringPass | 'all'>('all');
  const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(new Set());
  const [viewingCandidate, setViewingCandidate] = useState<Candidate | null>(null);
  const [selectedVerifications, setSelectedVerifications] = useState<Set<string>>(new Set());

  // Onboarding state
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);

  // Email setup modal state
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [selectedEmailProvider, setSelectedEmailProvider] = useState<'gmail' | 'outlook' | null>(null);

  // New Role modal state - comprehensive filters for AI matching
  const [showNewRoleModal, setShowNewRoleModal] = useState(false);
  const [newRoleTitle, setNewRoleTitle] = useState('');
  const [newRoleLocation, setNewRoleLocation] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');
  // Additional role criteria
  const [newRoleDepartment, setNewRoleDepartment] = useState('');
  const [newRoleExperienceMin, setNewRoleExperienceMin] = useState('');
  const [newRoleExperienceMax, setNewRoleExperienceMax] = useState('');
  const [newRoleSeniorityLevel, setNewRoleSeniorityLevel] = useState('');
  const [newRoleEmploymentType, setNewRoleEmploymentType] = useState('full-time');
  const [newRoleWorkArrangement, setNewRoleWorkArrangement] = useState('');
  const [newRoleSalaryMin, setNewRoleSalaryMin] = useState('');
  const [newRoleSalaryMax, setNewRoleSalaryMax] = useState('');
  const [newRoleQualifications, setNewRoleQualifications] = useState('');
  const [newRoleMustHaveSkills, setNewRoleMustHaveSkills] = useState('');
  const [newRoleNiceToHaveSkills, setNewRoleNiceToHaveSkills] = useState('');
  const [newRoleDealbreakers, setNewRoleDealbreakers] = useState('');

  // Verification detail modal state
  const [showVerificationDetail, setShowVerificationDetail] = useState<string | null>(null);

  // View Role modal state
  const [showRoleDetail, setShowRoleDetail] = useState(false);

  // Check localStorage for onboarding completion on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasCompleted = localStorage.getItem('hasCompletedOnboarding');
      if (!hasCompleted) {
        setShowOnboarding(true);
      }
    }
  }, []);

  // DEMO MODE: Load real data via API (bypasses RLS)
  useEffect(() => {
    if (!isDemo) return;

    async function loadDemoData() {
      setDemoLoading(true);
      try {
        const res = await fetch('/api/demo-data');
        const data = await res.json();
        console.log('[DEMO] API response:', data.roles?.length, 'roles,', data.candidates?.length, 'candidates');

        // Map roles with extended fields
        const mappedRoles: Role[] = (data.roles || []).map((r: Record<string, unknown>) => {
          const context = r.context as Record<string, unknown> || {};
          const facts = r.facts as Record<string, unknown> || {};
          const aiGuidance = r.ai_guidance as Record<string, unknown> || {};
          return {
            id: r.id as string,
            title: (r.title as string) || 'Untitled Role',
            location: (facts.location as string) || 'Remote',
            createdAt: ((r.created_at as string) || '').split('T')[0] || new Date().toISOString().split('T')[0],
            candidateCount: 0,
            newToday: 0,
            // Extended fields
            seniority: context.seniority as string,
            employmentType: context.employment_type as string,
            workArrangement: context.work_arrangement as string,
            department: context.department as string,
            salaryMin: facts.salary_min as number,
            salaryMax: facts.salary_max as number,
            minExperience: facts.min_experience_years as number,
            maxExperience: facts.max_experience_years as number,
            requiredSkills: facts.required_skills as string[],
            qualifications: facts.qualifications as string[],
            strongFit: aiGuidance.strong_fit as string,
            disqualifiers: aiGuidance.disqualifiers as string,
          };
        });
        setRoles(mappedRoles);
        if (mappedRoles.length > 0) {
          setSelectedRole(mappedRoles[0].id);
        }

        // Map candidates
        const mappedCandidates: Candidate[] = (data.candidates || []).map((c: Record<string, unknown>) => ({
          id: c.id as string,
          name: (c.name as string) || 'Unknown',
          email: (c.email as string) || '',
          phone: (c.phone as string) || '',
          role: (c.role_id as string) || '',
          pass: mapStatusToPass(c.status as string),
          aiMatch: mapScoreToMatch((c.score as number) || (c.ai_score as number) || 0),
          aiScore: (c.score as number) || (c.ai_score as number) || 0,
          hasVideo: false,
          hasAiInterview: false,
          verified: false,
          receivedAt: ((c.created_at as string) || '').split('T')[0] || new Date().toISOString().split('T')[0],
          lastUpdated: ((c.updated_at as string) || (c.created_at as string) || '').split('T')[0] || new Date().toISOString().split('T')[0],
          aiRecommendation: (c.ai_recommendation as string) || '',
          aiReasoning: (c.ai_reasoning as string) || '',
          strengths: (c.strengths as string[]) || [],
          weaknesses: (c.missing as string[]) || [],
          screeningResult: (c.screening_result as Record<string, unknown>) || null
        }));
        setCandidates(mappedCandidates);
        console.log('[DEMO] Loaded', mappedCandidates.length, 'candidates');
      } catch (err) {
        console.error('Demo data load error:', err);
        setCandidates([]);
      }
      setDemoLoading(false);
    }

    loadDemoData();
  }, [isDemo]);

  // Helper to map status to pass
  function mapStatusToPass(status: string): HiringPass {
    switch (status) {
      case 'shortlist': return 2;
      case 'talent_pool': return 7;
      case 'screened': return 1;
      case 'reject': return 1;
      case 'unprocessed': return 0;
      default: return 0;
    }
  }

  // Helper to map score to match
  function mapScoreToMatch(score: number): AIMatch {
    if (score >= 80) return 'strong';
    if (score >= 60) return 'possible';
    return 'low';
  }

  // DEMO MODE: Fetch emails from inbox
  async function fetchEmailsFromInbox() {
    setFetchingEmails(true);
    setLastFetchResult(null);
    try {
      const res = await fetch('/api/fetch-emails', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setLastFetchResult(`Fetched ${data.processedCount || 0} emails, stored ${data.storedCount || 0} candidates`);
        // Reload candidates
        const { data: dbCandidates } = await supabase
          .from('candidates')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);

        if (dbCandidates) {
          const mappedCandidates: Candidate[] = dbCandidates.map(c => ({
            id: c.id,
            name: c.name || 'Unknown',
            email: c.email || '',
            phone: c.phone || '',
            role: c.role_id || '',
            pass: mapStatusToPass(c.status),
            aiMatch: mapScoreToMatch(c.score || c.ai_score),
            aiScore: c.score || c.ai_score || 0,
            hasVideo: false,
            hasAiInterview: false,
            verified: false,
            receivedAt: c.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
            lastUpdated: c.updated_at?.split('T')[0] || c.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
            // AI Analysis fields
            aiRecommendation: c.ai_recommendation || '',
            aiReasoning: c.ai_reasoning || '',
            strengths: c.strengths || [],
            weaknesses: c.missing || [],
            screeningResult: c.screening_result || null
          }));
          setCandidates(mappedCandidates);
        }
      } else {
        setLastFetchResult(`Error: ${data.error || 'Failed to fetch'}`);
      }
    } catch (err) {
      setLastFetchResult(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
    setFetchingEmails(false);
  }

  // Complete onboarding
  const completeOnboarding = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('hasCompletedOnboarding', 'true');
    }
    setShowOnboarding(false);
    setOnboardingStep(1);
  };

  // Handle email provider selection
  const handleEmailProviderSelect = (provider: 'gmail' | 'outlook') => {
    setSelectedEmailProvider(provider);
  };

  // Map nav sections to pass filters
  const navToPassFilter: Record<NavSection, HiringPass | 'all'> = {
    'inbox': 0,
    'screening': 1,
    'interviews': 3,
    'verification': 4,
    'pipeline': 'all',
    'talent-pool': 7,
    'analytics': 'all',
    'settings': 'all',
  };

  const filteredCandidates = candidates.filter(c => {
    // Role filter: compare by ID or by title (for sample data compatibility)
    // Always apply role filter, even in demo mode
    const selectedRoleTitle = roles.find(r => r.id === selectedRole)?.title;
    if (c.role !== selectedRole && c.role !== selectedRoleTitle) return false;
    // Apply nav-based filter for candidate views
    if (['inbox', 'screening', 'interviews', 'verification'].includes(activeNav)) {
      const navPass = navToPassFilter[activeNav];
      if (navPass !== 'all' && c.pass !== navPass) return false;
    }
    // Also apply manual filter if set
    if (filterPass !== 'all' && c.pass !== filterPass) return false;
    return true;
  });

  const toggleCandidate = (id: string) => {
    const newSelected = new Set(selectedCandidates);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedCandidates(newSelected);
  };

  const bulkAction = async (action: 'shortlist' | 'reject' | 'interview' | 'pool' | 'delete') => {
    if (action === 'delete') {
      // Delete from database and state
      const idsToDelete = Array.from(selectedCandidates);
      for (const id of idsToDelete) {
        await supabase.from('candidates').delete().eq('id', id);
      }
      setCandidates(prev => prev.filter(c => !selectedCandidates.has(c.id)));
      setSelectedCandidates(new Set());
      return;
    }
    setCandidates(prev => prev.map(c => {
      if (!selectedCandidates.has(c.id)) return c;
      if (action === 'shortlist') return { ...c, pass: 2 as HiringPass };
      if (action === 'interview') return { ...c, pass: 3 as HiringPass };
      if (action === 'pool') return { ...c, pass: 7 as HiringPass };
      return c;
    }));
    setSelectedCandidates(new Set());
  };

  const toggleVerification = (key: string) => {
    const newSelected = new Set(selectedVerifications);
    if (key === 'fullPackage') {
      // Full package replaces individual selections
      newSelected.clear();
      if (!selectedVerifications.has('fullPackage')) {
        newSelected.add('fullPackage');
      }
    } else {
      // Individual selection removes full package
      newSelected.delete('fullPackage');
      if (newSelected.has(key)) {
        newSelected.delete(key);
      } else {
        newSelected.add(key);
      }
    }
    setSelectedVerifications(newSelected);
  };

  const getVerificationTotal = () => {
    if (selectedVerifications.has('fullPackage')) {
      return VERIFICATION_PRICING.fullPackage.price;
    }
    let total = 0;
    selectedVerifications.forEach(key => {
      const pricing = VERIFICATION_PRICING[key as keyof typeof VERIFICATION_PRICING];
      if (pricing) total += pricing.price;
    });
    return total;
  };

  const handleOrderVerification = () => {
    if (!viewingCandidate || selectedVerifications.size === 0) return;

    // In production, this would call PayFast and then update the candidate
    const newVerification: VerificationStatus = { ...viewingCandidate.verification };
    if (selectedVerifications.has('fullPackage') || selectedVerifications.has('idCheck')) {
      newVerification.idCheck = 'pending';
    }
    if (selectedVerifications.has('fullPackage') || selectedVerifications.has('creditCheck')) {
      newVerification.creditCheck = 'pending';
    }
    if (selectedVerifications.has('fullPackage') || selectedVerifications.has('referenceCheck')) {
      newVerification.referenceCheck = 'pending';
    }

    setCandidates(prev => prev.map(c =>
      c.id === viewingCandidate.id
        ? { ...c, pass: 4 as HiringPass, verification: newVerification }
        : c
    ));

    alert(`Verification order placed for R${getVerificationTotal()}. In production, this would redirect to PayFast.`);
    setViewingCandidate(null);
    setSelectedVerifications(new Set());
  };

  // Get verification status display
  const getVerificationStatusDisplay = (status: string | undefined) => {
    const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
      'pending': { label: 'Pending', color: '#d97706', bg: '#fef3c7' },
      'in_progress': { label: 'In Progress', color: '#3b82f6', bg: '#dbeafe' },
      'passed': { label: 'Passed', color: '#059669', bg: '#d1fae5' },
      'clear': { label: 'Clear', color: '#059669', bg: '#d1fae5' },
      'good': { label: 'Good', color: '#059669', bg: '#d1fae5' },
      'positive': { label: 'Positive', color: '#059669', bg: '#d1fae5' },
      'fair': { label: 'Fair', color: '#d97706', bg: '#fef3c7' },
      'mixed': { label: 'Mixed', color: '#d97706', bg: '#fef3c7' },
      'failed': { label: 'Failed', color: '#dc2626', bg: '#fee2e2' },
      'flagged': { label: 'Flagged', color: '#dc2626', bg: '#fee2e2' },
      'poor': { label: 'Poor', color: '#dc2626', bg: '#fee2e2' },
      'negative': { label: 'Negative', color: '#dc2626', bg: '#fee2e2' },
      'not_ordered': { label: 'Not Ordered', color: '#94a3b8', bg: '#f1f5f9' },
    };
    return statusConfig[status || 'not_ordered'] || statusConfig['not_ordered'];
  };

  // Navigation items
  const navItems: { id: NavSection; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'inbox', label: 'Inbox', icon: Icons.inbox, badge: candidates.filter(c => c.pass === 0).length },
    { id: 'screening', label: 'AI Screening', icon: Icons.screening, badge: candidates.filter(c => c.pass === 1).length },
    { id: 'interviews', label: 'AI Interviews', icon: Icons.video, badge: candidates.filter(c => c.pass === 3).length },
    { id: 'verification', label: 'Verification', icon: Icons.shield },
    { id: 'pipeline', label: 'Pipeline', icon: Icons.pipeline },
    { id: 'talent-pool', label: 'Talent Pool', icon: Icons.users },
    { id: 'analytics', label: 'Analytics', icon: Icons.chart },
    { id: 'settings', label: 'Settings', icon: Icons.settings },
  ];

  // Stats for current role - calculate from actual candidates
  const currentRole = roles.find(r => r.id === selectedRole);
  const today = new Date().toISOString().split('T')[0];
  const roleCandidates = candidates.filter(c => c.role === selectedRole || c.role === currentRole?.title);
  const stats = {
    total: roleCandidates.length,
    newToday: roleCandidates.filter(c => c.receivedAt === today).length,
    shortlisted: roleCandidates.filter(c => c.pass >= 2).length,
    pending: roleCandidates.filter(c => c.pass < 2).length,
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* DEMO MODE BANNER */}
      {isDemo && (
        <div style={{
          backgroundColor: '#7c3aed',
          color: '#ffffff',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '14px', fontWeight: 600 }}>
              DEMO MODE - Real Data from Database
            </span>
            {demoLoading && <span style={{ fontSize: '12px' }}>Loading...</span>}
            {lastFetchResult && (
              <span style={{ fontSize: '12px', backgroundColor: 'rgba(255,255,255,0.2)', padding: '4px 8px', borderRadius: '4px' }}>
                {lastFetchResult}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={fetchEmailsFromInbox}
              disabled={fetchingEmails}
              style={{
                padding: '8px 16px',
                backgroundColor: fetchingEmails ? '#a78bfa' : '#ffffff',
                color: fetchingEmails ? '#ffffff' : '#7c3aed',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: fetchingEmails ? 'wait' : 'pointer'
              }}
            >
              {fetchingEmails ? 'Fetching...' : 'Fetch from Inbox'}
            </button>
            <span style={{ fontSize: '12px', opacity: 0.8 }}>
              Email: ssrubin18+hireinbox@gmail.com
            </span>
          </div>
        </div>
      )}

      {/* Main content wrapper with flex */}
      <div style={{ display: 'flex', flex: 1, marginTop: isDemo ? '52px' : 0 }}>
      {/* Sidebar */}
      <aside style={{
        width: '260px',
        backgroundColor: '#ffffff',
        borderRight: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        height: '100vh',
        left: 0,
        top: 0
      }}>
        {/* Logo */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0' }}>
          <Logo />
        </div>

        {/* Role selector */}
        <div style={{ padding: '16px 16px 8px' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              style={{
                flex: 1,
                padding: '10px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                backgroundColor: '#ffffff',
                cursor: 'pointer'
              }}
            >
              {roles.map(role => (
                <option key={role.id} value={role.id}>
                  {role.title}
                </option>
            ))}
            </select>
            <button
              onClick={() => setShowRoleDetail(true)}
              style={{
                padding: '10px 12px',
                backgroundColor: '#f1f5f9',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#4F46E5',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              View
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '8px', overflowY: 'auto' }}>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: activeNav === item.id ? '#eff6ff' : 'transparent',
                color: activeNav === item.id ? '#4F46E5' : '#475569',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '4px',
                textAlign: 'left'
              }}
            >
              <span style={{ display: 'flex', opacity: activeNav === item.id ? 1 : 0.7 }}>{item.icon}</span>
              {item.label}
              {item.badge !== undefined && item.badge > 0 && (
                <span style={{
                  marginLeft: 'auto',
                  backgroundColor: activeNav === item.id ? '#4F46E5' : '#e2e8f0',
                  color: activeNav === item.id ? '#ffffff' : '#64748b',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  fontSize: '11px',
                  fontWeight: 600
                }}>
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* New Role button */}
        <div style={{ padding: '16px', borderTop: '1px solid #e2e8f0' }}>
          <button
            onClick={() => setShowNewRoleModal(true)}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#4F46E5',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            {Icons.plus} New Role
          </button>

          {/* AI Staff Member - Partner link */}
          <button
            onClick={() => router.push('/hire/ai-staff')}
            style={{
              width: '100%',
              marginTop: '8px',
              padding: '12px',
              backgroundColor: '#10b981',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 8V4H8"/>
              <rect x="8" y="8" width="8" height="8" rx="2"/>
              <path d="M12 16v4h4"/>
              <path d="M4 12h4"/>
              <path d="M16 12h4"/>
            </svg>
            Hire AI Staff
          </button>
        </div>

        {/* User info */}
        <div style={{ padding: '16px', borderTop: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '13px', color: '#64748b' }}>acme@hireinbox.co.za</div>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ marginLeft: '260px', flex: 1, padding: '24px' }}>
        {/* Stats cards - show for candidate views */}
        {['inbox', 'screening', 'interviews', 'verification', 'pipeline'].includes(activeNav) && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
            {[
              { label: 'Total Candidates', value: stats.total, color: '#4F46E5' },
              { label: 'New Today', value: stats.newToday, color: '#10b981' },
              { label: 'Shortlisted', value: stats.shortlisted, color: '#059669' },
              { label: 'Pending Review', value: stats.pending, color: '#d97706' },
            ].map((stat, i) => (
              <div key={i} style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>{stat.label}</div>
                <div style={{ fontSize: '32px', fontWeight: 700, color: stat.color }}>{stat.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Page header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
            {activeNav === 'settings' ? 'Settings' :
             activeNav === 'analytics' ? 'Analytics' :
             activeNav === 'talent-pool' ? 'Talent Pool' :
             activeNav === 'pipeline' ? 'Pipeline' :
             `${navItems.find(n => n.id === activeNav)?.label} — ${currentRole?.title}`}
          </h1>
          {['inbox', 'screening', 'interviews', 'verification'].includes(activeNav) && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setActiveNav('talent-pool')}
                style={{
                  padding: '10px 16px',
                  backgroundColor: '#ffffff',
                  color: '#7c3aed',
                  border: '1px solid #7c3aed',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Browse Talent Pool
              </button>
            </div>
          )}
        </div>

        {/* SETTINGS VIEW */}
        {activeNav === 'settings' && (
          <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', margin: '0 0 16px' }}>Account Settings</h2>
              <div style={{ display: 'grid', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Company Name</label>
                  <input type="text" defaultValue="Acme Corporation" style={{ width: '100%', maxWidth: '400px', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Email</label>
                  <input type="email" defaultValue="acme@hireinbox.co.za" style={{ width: '100%', maxWidth: '400px', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Phone</label>
                  <input type="tel" defaultValue="+27 21 123 4567" style={{ width: '100%', maxWidth: '400px', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px' }} />
                </div>
              </div>
            </div>
            <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', margin: '0 0 16px' }}>Email Integration</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                <span style={{ color: '#059669' }}>{Icons.check}</span>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#166534' }}>Gmail Connected</div>
                  <div style={{ fontSize: '13px', color: '#166534' }}>jobs@acme.co.za</div>
                </div>
                <button style={{ marginLeft: 'auto', padding: '8px 16px', backgroundColor: '#ffffff', color: '#dc2626', border: '1px solid #dc2626', borderRadius: '6px', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>Disconnect</button>
              </div>
            </div>
            <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', margin: '0 0 16px' }}>Notification Preferences</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {['New CV received', 'AI screening complete', 'Candidate shortlisted', 'Verification results ready'].map((item, i) => (
                  <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                    <input type="checkbox" defaultChecked style={{ width: '18px', height: '18px', accentColor: '#4F46E5' }} />
                    <span style={{ fontSize: '14px', color: '#374151' }}>{item}</span>
                  </label>
                ))}
              </div>
            </div>
            <div style={{ padding: '24px' }}>
              <button style={{ padding: '12px 24px', backgroundColor: '#4F46E5', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Save Changes</button>
            </div>
          </div>
        )}

        {/* ANALYTICS VIEW */}
        {activeNav === 'analytics' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
              {[
                { label: 'Total Applications', value: '127', change: '+23%', color: '#4F46E5' },
                { label: 'Avg. Time to Shortlist', value: '2.3 days', change: '-18%', color: '#10b981' },
                { label: 'Interview Rate', value: '34%', change: '+5%', color: '#0891b2' },
                { label: 'Hire Rate', value: '12%', change: '+2%', color: '#059669' },
              ].map((stat, i) => (
                <div key={i} style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>{stat.label}</div>
                  <div style={{ fontSize: '28px', fontWeight: 700, color: stat.color }}>{stat.value}</div>
                  <div style={{ fontSize: '12px', color: stat.change.startsWith('+') ? '#059669' : '#dc2626', marginTop: '4px' }}>{stat.change} vs last month</div>
                </div>
              ))}
            </div>
            <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', margin: '0 0 20px' }}>Hiring Funnel — {currentRole?.title}</h2>
              <div style={{ display: 'flex', gap: '4px', height: '200px', alignItems: 'flex-end' }}>
                {[
                  { stage: 'Applied', count: 47, color: '#f1f5f9' },
                  { stage: 'AI Screened', count: 38, color: '#ede9fe' },
                  { stage: 'Shortlisted', count: 12, color: '#d1fae5' },
                  { stage: 'Interviewed', count: 6, color: '#cffafe' },
                  { stage: 'Offered', count: 2, color: '#fef3c7' },
                  { stage: 'Hired', count: 1, color: '#dcfce7' },
                ].map((item, i) => (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '100%', height: `${(item.count / 47) * 160}px`, backgroundColor: item.color, borderRadius: '6px 6px 0 0', minHeight: '20px' }} />
                    <div style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>{item.count}</div>
                    <div style={{ fontSize: '11px', color: '#64748b', textAlign: 'center' }}>{item.stage}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TALENT POOL VIEW */}
        {activeNav === 'talent-pool' && (
          <div>
            {/* Two Pool Types Explanation */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              {/* Company Pool */}
              <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '2px solid #4F46E5', padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                  </div>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', margin: 0 }}>Your Company Pool</h3>
                    <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0' }}>CVs you have received and saved</p>
                  </div>
                </div>
                <div style={{ fontSize: '32px', fontWeight: 700, color: '#4F46E5' }}>
                  {candidates.filter(c => c.pass === 7).length}
                  <span style={{ fontSize: '14px', fontWeight: 400, color: '#64748b', marginLeft: '8px' }}>candidates saved</span>
                </div>
              </div>

              {/* Public Pool */}
              <div style={{ backgroundColor: '#f0fdf4', borderRadius: '12px', border: '1px solid #86efac', padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M2 12h20"/>
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', margin: 0 }}>HireInbox Public Pool</h3>
                    <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0' }}>Job seekers on our marketplace</p>
                  </div>
                </div>
                <button onClick={() => router.push('/talent-pool/browse')} style={{ padding: '10px 20px', backgroundColor: '#059669', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', width: '100%', marginBottom: '8px' }}>
                  Browse Public Pool
                </button>
                <button onClick={() => router.push('/talent-pool/post-job')} style={{ padding: '10px 20px', backgroundColor: '#ffffff', color: '#059669', border: '2px solid #059669', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', width: '100%' }}>
                  Post a Job — R2,500
                </button>
              </div>
            </div>

            {/* Company Pool Table */}
            <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', margin: '0 0 4px' }}>Your Saved Candidates</h2>
              <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Candidates you have added to your company talent pool for future consideration</p>
            </div>
            <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc' }}>
                    <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>CANDIDATE</th>
                    <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>ORIGINAL ROLE</th>
                    <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>AI SCORE</th>
                    <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>ADDED</th>
                    <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {candidates.filter(c => c.pass === 7).length > 0 ? candidates.filter(c => c.pass === 7).map((c, i) => (
                    <tr key={c.id} style={{ backgroundColor: i % 2 === 0 ? '#ffffff' : '#fafafa' }}>
                      <td style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8f0' }}>
                        <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '14px' }}>{c.name}</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>{c.email}</div>
                      </td>
                      <td style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8f0', fontSize: '13px', color: '#475569' }}>{c.role}</td>
                      <td style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8f0' }}>
                        <span style={{ padding: '4px 10px', backgroundColor: '#d1fae5', color: '#059669', borderRadius: '12px', fontSize: '12px', fontWeight: 500 }}>{c.aiScore}%</span>
                      </td>
                      <td style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8f0', fontSize: '13px', color: '#64748b' }}>{c.lastUpdated}</td>
                      <td style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8f0' }}>
                        <button style={{ padding: '6px 12px', backgroundColor: '#4F46E5', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}>Consider for Role</button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} style={{ padding: '48px', textAlign: 'center' }}>
                        <div style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>No candidates in your talent pool yet</div>
                        <div style={{ fontSize: '14px', color: '#64748b' }}>Add strong candidates to your pool to consider them for future roles</div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PIPELINE VIEW */}
        {activeNav === 'pipeline' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', overflowX: 'auto' }}>
            {[
              { pass: 0 as HiringPass, label: 'CV Received', color: '#64748b' },
              { pass: 1 as HiringPass, label: 'AI Screened', color: '#7c3aed' },
              { pass: 2 as HiringPass, label: 'Shortlisted', color: '#059669' },
              { pass: 3 as HiringPass, label: 'AI Interview', color: '#0891b2' },
              { pass: 5 as HiringPass, label: 'Human Interview', color: '#4f46e5' },
            ].map(stage => {
              const stageCandidates = candidates.filter(c => c.role === currentRole?.title && c.pass === stage.pass);
              return (
                <div key={stage.pass} style={{ backgroundColor: '#f8fafc', borderRadius: '12px', padding: '16px', minHeight: '400px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: stage.color }}>{stage.label}</span>
                    <span style={{ padding: '2px 8px', backgroundColor: '#e2e8f0', borderRadius: '10px', fontSize: '12px', fontWeight: 600, color: '#64748b' }}>{stageCandidates.length}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {stageCandidates.map(c => (
                      <div key={c.id} onClick={() => { setViewingCandidate(c); setSelectedVerifications(new Set()); }} style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '12px', border: '1px solid #e2e8f0', cursor: 'pointer' }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>{c.name}</div>
                        {c.aiScore && <span style={{ padding: '2px 6px', backgroundColor: '#d1fae5', color: '#059669', borderRadius: '8px', fontSize: '11px', fontWeight: 500 }}>{c.aiScore}%</span>}
                      </div>
                    ))}
                    {stageCandidates.length === 0 && <div style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center', padding: '20px' }}>No candidates</div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* CANDIDATE LIST VIEWS (inbox, screening, interviews, verification) */}
        {['inbox', 'screening', 'interviews', 'verification'].includes(activeNav) && (
          <>

        {/* Stage filters */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '12px',
          marginBottom: '16px',
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
          border: '1px solid #e2e8f0'
        }}>
          <button
            onClick={() => setFilterPass('all')}
            style={{
              padding: '8px 16px',
              backgroundColor: filterPass === 'all' ? '#4F46E5' : '#f1f5f9',
              color: filterPass === 'all' ? '#ffffff' : '#64748b',
              border: 'none',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            All ({candidates.filter(c => c.role === currentRole?.title).length})
          </button>
          {Object.entries(PASS_LABELS).map(([pass, config]) => {
            const count = candidates.filter(c => c.role === currentRole?.title && c.pass === Number(pass)).length;
            if (count === 0) return null;
            return (
              <button
                key={pass}
                onClick={() => setFilterPass(Number(pass) as HiringPass)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: filterPass === Number(pass) ? config.bgColor : '#f1f5f9',
                  color: filterPass === Number(pass) ? config.color : '#64748b',
                  border: filterPass === Number(pass) ? `1px solid ${config.color}` : '1px solid transparent',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                {config.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Bulk actions */}
        {selectedCandidates.size > 0 && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: '#eff6ff',
            borderRadius: '8px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            border: '1px solid #bfdbfe'
          }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#1e40af' }}>
              {selectedCandidates.size} selected
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => bulkAction('shortlist')} style={{ padding: '6px 12px', backgroundColor: '#059669', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
                Shortlist
              </button>
              <button onClick={() => router.push('/hire/ai-interview')} style={{ padding: '6px 12px', backgroundColor: '#0891b2', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
                Send AI Interview
              </button>
              <button onClick={() => bulkAction('pool')} style={{ padding: '6px 12px', backgroundColor: '#7c3aed', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
                Add to Pool
              </button>
              <button onClick={() => bulkAction('delete')} style={{ padding: '6px 12px', backgroundColor: '#dc2626', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
                Delete
              </button>
            </div>
          </div>
        )}

        {/* Candidates table */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          overflow: 'hidden'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc' }}>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', borderBottom: '1px solid #e2e8f0', width: '40px' }}>
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedCandidates(new Set(filteredCandidates.map(c => c.id)));
                      } else {
                        setSelectedCandidates(new Set());
                      }
                    }}
                    checked={selectedCandidates.size === filteredCandidates.length && filteredCandidates.length > 0}
                    style={{ width: '16px', height: '16px', accentColor: '#4F46E5' }}
                  />
                </th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', borderBottom: '1px solid #e2e8f0', textTransform: 'uppercase' }}>Candidate</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', borderBottom: '1px solid #e2e8f0', textTransform: 'uppercase' }}>Stage</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', borderBottom: '1px solid #e2e8f0', textTransform: 'uppercase' }}>AI Score</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', borderBottom: '1px solid #e2e8f0', textTransform: 'uppercase' }}>Signals</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', borderBottom: '1px solid #e2e8f0', textTransform: 'uppercase' }}>Received</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', borderBottom: '1px solid #e2e8f0', textTransform: 'uppercase' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCandidates.map((candidate, i) => (
                <tr
                  key={candidate.id}
                  style={{
                    backgroundColor: selectedCandidates.has(candidate.id) ? '#eff6ff' : i % 2 === 0 ? '#ffffff' : '#fafafa',
                    transition: 'background-color 0.15s'
                  }}
                >
                  <td style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8f0' }}>
                    <input
                      type="checkbox"
                      checked={selectedCandidates.has(candidate.id)}
                      onChange={() => toggleCandidate(candidate.id)}
                      style={{ width: '16px', height: '16px', accentColor: '#4F46E5' }}
                    />
                  </td>
                  <td style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8f0' }}>
                    <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '14px' }}>{candidate.name}</div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{candidate.email}</div>
                  </td>
                  <td style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8f0' }}>
                    <span style={{
                      padding: '4px 10px',
                      backgroundColor: PASS_LABELS[candidate.pass].bgColor,
                      color: PASS_LABELS[candidate.pass].color,
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 500
                    }}>
                      {PASS_LABELS[candidate.pass].label}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8f0' }}>
                    {candidate.aiMatch ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          padding: '4px 10px',
                          backgroundColor: AI_MATCH_LABELS[candidate.aiMatch].bgColor,
                          color: AI_MATCH_LABELS[candidate.aiMatch].color,
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 500
                        }}>
                          {candidate.aiScore}%
                        </span>
                      </div>
                    ) : (
                      <span style={{ fontSize: '13px', color: '#94a3b8' }}>Pending</span>
                    )}
                  </td>
                  <td style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {candidate.hasVideo && (
                        <span title="Has video" style={{ color: '#0891b2' }}>{Icons.video}</span>
                      )}
                      {candidate.hasAiInterview && (
                        <span title="AI Interview complete" style={{ color: '#7c3aed' }}>{Icons.message}</span>
                      )}
                      {candidate.verified && (
                        <span title="Verified" style={{ color: '#059669' }}>{Icons.check}</span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8f0', fontSize: '13px', color: '#64748b' }}>
                    {candidate.receivedAt}
                  </td>
                  <td style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => {
                          setViewingCandidate(candidate);
                          setSelectedVerifications(new Set());
                        }}
                        style={{ padding: '6px 12px', backgroundColor: '#4F46E5', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}
                      >
                        View
                      </button>
                      <button style={{ padding: '6px 12px', backgroundColor: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}>
                        Move
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredCandidates.length === 0 && (
            <div style={{ padding: '48px', textAlign: 'center' }}>
              <div style={{ marginBottom: '16px', color: '#94a3b8' }}>{Icons.inbox}</div>
              <div style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>
                No candidates at this stage
              </div>
              <div style={{ fontSize: '14px', color: '#64748b' }}>
                Candidates will appear here as they progress through the hiring process
              </div>
            </div>
          )}
        </div>
        </>
        )}
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
        {Icons.message} Support
      </button>

      {/* Candidate Detail Modal */}
      {viewingCandidate && (
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
              setViewingCandidate(null);
              setSelectedVerifications(new Set());
            }
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '800px',
              maxHeight: '90vh',
              overflow: 'auto'
            }}
          >
            {/* Modal Header */}
            <div style={{
              padding: '24px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start'
            }}>
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                  {viewingCandidate.name}
                </h2>
                <div style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
                  {viewingCandidate.email} • {viewingCandidate.phone}
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <span style={{
                    padding: '4px 10px',
                    backgroundColor: PASS_LABELS[viewingCandidate.pass].bgColor,
                    color: PASS_LABELS[viewingCandidate.pass].color,
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 500
                  }}>
                    {PASS_LABELS[viewingCandidate.pass].label}
                  </span>
                  {viewingCandidate.aiMatch && (
                    <span style={{
                      padding: '4px 10px',
                      backgroundColor: AI_MATCH_LABELS[viewingCandidate.aiMatch].bgColor,
                      color: AI_MATCH_LABELS[viewingCandidate.aiMatch].color,
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 500
                    }}>
                      {viewingCandidate.aiScore}% Match
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => {
                  setViewingCandidate(null);
                  setSelectedVerifications(new Set());
                }}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#64748b',
                  padding: '4px'
                }}
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px' }}>
              {/* Quick Stats */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '12px',
                marginBottom: '24px'
              }}>
                <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Received</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>{viewingCandidate.receivedAt}</div>
                </div>
                <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>AI Score</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>{viewingCandidate.aiScore !== undefined && viewingCandidate.aiScore !== null ? `${viewingCandidate.aiScore}%` : 'Pending'}</div>
                </div>
                <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Video</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: viewingCandidate.hasVideo ? '#059669' : '#94a3b8' }}>
                    {viewingCandidate.hasVideo ? 'Uploaded' : 'None'}
                  </div>
                </div>
                <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>AI Interview</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: viewingCandidate.hasAiInterview ? '#059669' : '#94a3b8' }}>
                    {viewingCandidate.hasAiInterview ? 'Complete' : 'Not Done'}
                  </div>
                </div>
              </div>

              {/* AI Analysis Report */}
              {(viewingCandidate.aiRecommendation || viewingCandidate.aiReasoning || (viewingCandidate.strengths && viewingCandidate.strengths.length > 0)) && (
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {Icons.star} AI Screening Report
                  </h3>

                  {/* Recommendation Badge */}
                  {viewingCandidate.aiRecommendation && (
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 16px',
                      backgroundColor: viewingCandidate.aiRecommendation === 'SHORTLIST' ? '#dcfce7' :
                                      viewingCandidate.aiRecommendation === 'CONSIDER' ? '#fef3c7' : '#fee2e2',
                      color: viewingCandidate.aiRecommendation === 'SHORTLIST' ? '#166534' :
                             viewingCandidate.aiRecommendation === 'CONSIDER' ? '#92400e' : '#991b1b',
                      borderRadius: '8px',
                      marginBottom: '16px',
                      fontSize: '14px',
                      fontWeight: 600
                    }}>
                      AI Recommendation: {viewingCandidate.aiRecommendation}
                    </div>
                  )}

                  {/* Fit Assessment */}
                  {viewingCandidate.aiReasoning && (
                    <div style={{
                      padding: '16px',
                      backgroundColor: '#f8fafc',
                      borderRadius: '10px',
                      marginBottom: '16px',
                      borderLeft: '4px solid #4F46E5'
                    }}>
                      <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px', fontWeight: 600 }}>Fit Assessment</div>
                      <div style={{ fontSize: '14px', color: '#334155', lineHeight: '1.6' }}>
                        {viewingCandidate.aiReasoning}
                      </div>
                    </div>
                  )}

                  {/* Strengths */}
                  {viewingCandidate.strengths && viewingCandidate.strengths.length > 0 && (
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ fontSize: '13px', color: '#059669', fontWeight: 600, marginBottom: '8px' }}>
                        Strengths (with evidence)
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {viewingCandidate.strengths.map((s, i) => (
                          <div key={i} style={{
                            padding: '10px 14px',
                            backgroundColor: '#ecfdf5',
                            borderRadius: '8px',
                            fontSize: '13px',
                            color: '#065f46',
                            borderLeft: '3px solid #10b981'
                          }}>
                            {s}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Weaknesses/Gaps */}
                  {viewingCandidate.weaknesses && viewingCandidate.weaknesses.length > 0 && (
                    <div>
                      <div style={{ fontSize: '13px', color: '#dc2626', fontWeight: 600, marginBottom: '8px' }}>
                        Areas of Concern
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {viewingCandidate.weaknesses.map((w, i) => (
                          <div key={i} style={{
                            padding: '10px 14px',
                            backgroundColor: '#fef2f2',
                            borderRadius: '8px',
                            fontSize: '13px',
                            color: '#991b1b',
                            borderLeft: '3px solid #ef4444'
                          }}>
                            {w}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Verification Status (if any ordered) */}
              {viewingCandidate.verification && Object.values(viewingCandidate.verification).some(v => v && v !== 'not_ordered') && (
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {Icons.shield} Verification Status
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                    {[
                      { key: 'idCheck', label: 'ID Verification' },
                      { key: 'creditCheck', label: 'Credit Check' },
                      { key: 'referenceCheck', label: 'Reference Check' },
                    ].map(item => {
                      const status = viewingCandidate.verification?.[item.key as keyof VerificationStatus];
                      if (!status || status === 'not_ordered') return null;
                      const display = getVerificationStatusDisplay(status);
                      return (
                        <div key={item.key} style={{
                          padding: '12px 16px',
                          backgroundColor: '#ffffff',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <span style={{ fontSize: '14px', color: '#475569' }}>{item.label}</span>
                          <span style={{
                            padding: '4px 10px',
                            backgroundColor: display.bg,
                            color: display.color,
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: 500
                          }}>
                            {display.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Order Verification Section */}
              <div style={{
                backgroundColor: '#f8fafc',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid #e2e8f0'
              }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {Icons.shield} Order Background Verification
                </h3>

                {/* Individual Checks */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '16px' }}>
                  {(['idCheck', 'creditCheck', 'referenceCheck'] as const).map(key => {
                    const pricing = VERIFICATION_PRICING[key];
                    const isSelected = selectedVerifications.has(key) || selectedVerifications.has('fullPackage');
                    const alreadyOrdered = viewingCandidate.verification?.[key] && viewingCandidate.verification[key] !== 'not_ordered';

                    return (
                      <div key={key} style={{ position: 'relative' }}>
                        <button
                          onClick={() => !alreadyOrdered && toggleVerification(key)}
                          disabled={alreadyOrdered as boolean}
                          style={{
                            width: '100%',
                            padding: '16px',
                            backgroundColor: alreadyOrdered ? '#f1f5f9' : isSelected ? '#eff6ff' : '#ffffff',
                            border: `2px solid ${alreadyOrdered ? '#e2e8f0' : isSelected ? '#4F46E5' : '#e2e8f0'}`,
                            borderRadius: '10px',
                            cursor: alreadyOrdered ? 'not-allowed' : 'pointer',
                            textAlign: 'left',
                            opacity: alreadyOrdered ? 0.6 : 1
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>
                                {pricing.label}
                              </div>
                              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>
                                {pricing.description}
                              </div>
                              <span
                                onClick={(e) => { e.stopPropagation(); setShowVerificationDetail(key); }}
                                style={{ fontSize: '12px', color: '#4F46E5', cursor: 'pointer', textDecoration: 'underline' }}
                              >
                                Learn more
                              </span>
                            </div>
                            <div style={{ fontSize: '16px', fontWeight: 700, color: alreadyOrdered ? '#94a3b8' : '#4F46E5' }}>
                              {alreadyOrdered ? 'Ordered' : `R${pricing.price}`}
                            </div>
                          </div>
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Full Package */}
                <button
                  onClick={() => toggleVerification('fullPackage')}
                  style={{
                    width: '100%',
                    padding: '20px',
                    backgroundColor: selectedVerifications.has('fullPackage') ? '#0f172a' : '#ffffff',
                    color: selectedVerifications.has('fullPackage') ? '#ffffff' : '#0f172a',
                    border: `2px solid ${selectedVerifications.has('fullPackage') ? '#0f172a' : '#e2e8f0'}`,
                    borderRadius: '10px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    marginBottom: '16px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{Icons.package}</span>
                        <span style={{ fontSize: '16px', fontWeight: 700 }}>Complete Verification Package</span>
                        <span style={{
                          padding: '2px 8px',
                          backgroundColor: '#10B981',
                          color: '#ffffff',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 600
                        }}>
                          SAVE R50
                        </span>
                      </div>
                      <div style={{ fontSize: '13px', marginTop: '4px', opacity: 0.8 }}>
                        All 3 checks: ID + Credit + References
                      </div>
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 700 }}>
                      R{VERIFICATION_PRICING.fullPackage.price}
                    </div>
                  </div>
                </button>

                {/* Order Summary */}
                {selectedVerifications.size > 0 && (
                  <div style={{
                    padding: '16px',
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    marginBottom: '16px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '14px', color: '#64748b' }}>
                        {selectedVerifications.has('fullPackage') ? 'Complete Package' : `${selectedVerifications.size} check(s) selected`}
                      </span>
                      <span style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>
                        Total: R{getVerificationTotal()}
                      </span>
                    </div>
                  </div>
                )}

                {/* Order Button */}
                <button
                  onClick={handleOrderVerification}
                  disabled={selectedVerifications.size === 0}
                  style={{
                    width: '100%',
                    padding: '16px',
                    backgroundColor: selectedVerifications.size > 0 ? '#4F46E5' : '#e2e8f0',
                    color: selectedVerifications.size > 0 ? '#ffffff' : '#94a3b8',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '16px',
                    fontWeight: 600,
                    cursor: selectedVerifications.size > 0 ? 'pointer' : 'not-allowed'
                  }}
                >
                  {selectedVerifications.size > 0 ? `Order Verification - R${getVerificationTotal()}` : 'Select checks to order'}
                </button>

                <p style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center', marginTop: '12px' }}>
                  Results typically available within 2-5 business days. Payment via PayFast.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => {
                    setCandidates(prev => prev.map(c =>
                      c.id === viewingCandidate.id ? { ...c, pass: 2 as HiringPass } : c
                    ));
                    setViewingCandidate(null);
                  }}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#059669',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  Shortlist
                </button>
                <button
                  onClick={() => router.push('/hire/ai-interview')}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#0891b2',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  Send AI Interview
                </button>
              </div>
              <button
                onClick={() => {
                  setViewingCandidate(null);
                  setSelectedVerifications(new Set());
                }}
                style={{
                  padding: '10px 20px',
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

      {/* Onboarding Wizard Overlay */}
      {showOnboarding && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            zIndex: 200
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '600px',
              padding: '40px',
              textAlign: 'center'
            }}
          >
            {/* Progress Dots */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '32px' }}>
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: onboardingStep >= step ? '#4F46E5' : '#e2e8f0',
                    transition: 'background-color 0.3s'
                  }}
                />
              ))}
            </div>

            {/* Step 1: Create a Role */}
            {onboardingStep === 1 && (
              <>
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  backgroundColor: '#eff6ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 24px'
                }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="12" y1="18" x2="12" y2="12"/>
                    <line x1="9" y1="15" x2="15" y2="15"/>
                  </svg>
                </div>
                <h2 style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a', margin: '0 0 12px' }}>
                  Step 1: Create Your First Role
                </h2>
                <p style={{ fontSize: '16px', color: '#64748b', margin: '0 0 32px', lineHeight: '1.6' }}>
                  Start by creating a job role. This tells our AI what to look for when screening CVs.
                  Add the job title, requirements, and skills you need.
                </p>
                <button
                  onClick={() => setOnboardingStep(2)}
                  style={{
                    padding: '14px 40px',
                    backgroundColor: '#4F46E5',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '16px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Next: Connect Email
                </button>
              </>
            )}

            {/* Step 2: Connect Email */}
            {onboardingStep === 2 && (
              <>
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  backgroundColor: '#eff6ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 24px'
                }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </div>
                <h2 style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a', margin: '0 0 12px' }}>
                  Step 2: Connect Your Email
                </h2>
                <p style={{ fontSize: '16px', color: '#64748b', margin: '0 0 32px', lineHeight: '1.6' }}>
                  Connect your job inbox so HireInbox can automatically screen incoming CVs.
                  We support Gmail, Outlook, and other major email providers.
                </p>
                <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginBottom: '24px' }}>
                  <button
                    onClick={() => {
                      setShowEmailModal(true);
                      handleEmailProviderSelect('gmail');
                    }}
                    style={{
                      padding: '16px 32px',
                      backgroundColor: '#ffffff',
                      color: '#0f172a',
                      border: '2px solid #e2e8f0',
                      borderRadius: '10px',
                      fontSize: '15px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24">
                      <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115Z"/>
                      <path fill="#34A853" d="M16.04 18.013c-1.09.703-2.474 1.078-4.04 1.078a7.077 7.077 0 0 1-6.723-4.823l-4.04 3.067A11.965 11.965 0 0 0 12 24c2.933 0 5.735-1.043 7.834-3l-3.793-2.987Z"/>
                      <path fill="#4A90E2" d="M19.834 21c2.195-2.048 3.62-5.096 3.62-9 0-.71-.109-1.473-.272-2.182H12v4.637h6.436c-.317 1.559-1.17 2.766-2.395 3.558L19.834 21Z"/>
                      <path fill="#FBBC05" d="M5.277 14.268A7.12 7.12 0 0 1 4.909 12c0-.782.125-1.533.357-2.235L1.24 6.65A11.934 11.934 0 0 0 0 12c0 1.92.445 3.73 1.237 5.335l4.04-3.067Z"/>
                    </svg>
                    Connect Gmail
                  </button>
                  <button
                    onClick={() => {
                      setShowEmailModal(true);
                      handleEmailProviderSelect('outlook');
                    }}
                    style={{
                      padding: '16px 32px',
                      backgroundColor: '#ffffff',
                      color: '#0f172a',
                      border: '2px solid #e2e8f0',
                      borderRadius: '10px',
                      fontSize: '15px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24">
                      <path fill="#0078D4" d="M24 7.387v10.478c0 .23-.08.424-.238.583-.159.159-.353.238-.583.238h-8.393V6.566h8.393c.23 0 .424.08.583.238.159.159.238.353.238.583z"/>
                      <path fill="#0364B8" d="M14.786 6.566v12.12H8.393l-7.572-5.24c-.159-.11-.238-.27-.238-.48V7.387c0-.23.08-.424.238-.583.159-.159.353-.238.583-.238h13.382z"/>
                      <path fill="#28A8EA" d="M14.786 6.566L8.393 12.96l6.393 5.726V6.566z"/>
                    </svg>
                    Connect Outlook
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                  <button
                    onClick={() => setOnboardingStep(1)}
                    style={{
                      padding: '12px 24px',
                      backgroundColor: '#f1f5f9',
                      color: '#64748b',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: 500,
                      cursor: 'pointer'
                    }}
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setOnboardingStep(3)}
                    style={{
                      padding: '12px 24px',
                      backgroundColor: '#e2e8f0',
                      color: '#475569',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: 500,
                      cursor: 'pointer'
                    }}
                  >
                    Skip for now
                  </button>
                </div>
              </>
            )}

            {/* Step 3: Start Screening */}
            {onboardingStep === 3 && (
              <>
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  backgroundColor: '#d1fae5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 24px'
                }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                </div>
                <h2 style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a', margin: '0 0 12px' }}>
                  Step 3: Start Screening!
                </h2>
                <p style={{ fontSize: '16px', color: '#64748b', margin: '0 0 24px', lineHeight: '1.6' }}>
                  You are all set! CVs will be automatically screened and ranked by our AI.
                  You will see Strong, Possible, and Low matches in your inbox.
                </p>
                <div style={{
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '12px',
                  padding: '20px',
                  marginBottom: '32px'
                }}>
                  <div style={{ fontSize: '14px', color: '#166534', fontWeight: 600, marginBottom: '8px' }}>
                    What happens next:
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '20px', textAlign: 'left', color: '#166534', fontSize: '14px', lineHeight: '1.8' }}>
                    <li>AI screens every CV against your job requirements</li>
                    <li>Candidates get instant acknowledgement emails</li>
                    <li>You see a ranked shortlist with AI scores</li>
                    <li>Click any candidate to view their full profile</li>
                  </ul>
                </div>
                <button
                  onClick={completeOnboarding}
                  style={{
                    padding: '14px 40px',
                    backgroundColor: '#059669',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '16px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Go to Dashboard
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Email Connection Modal */}
      {showEmailModal && selectedEmailProvider && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            zIndex: 250
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowEmailModal(false);
              setSelectedEmailProvider(null);
            }
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '520px',
              padding: '32px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {selectedEmailProvider === 'gmail' ? (
                  <svg width="32" height="32" viewBox="0 0 24 24">
                    <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115Z"/>
                    <path fill="#34A853" d="M16.04 18.013c-1.09.703-2.474 1.078-4.04 1.078a7.077 7.077 0 0 1-6.723-4.823l-4.04 3.067A11.965 11.965 0 0 0 12 24c2.933 0 5.735-1.043 7.834-3l-3.793-2.987Z"/>
                    <path fill="#4A90E2" d="M19.834 21c2.195-2.048 3.62-5.096 3.62-9 0-.71-.109-1.473-.272-2.182H12v4.637h6.436c-.317 1.559-1.17 2.766-2.395 3.558L19.834 21Z"/>
                    <path fill="#FBBC05" d="M5.277 14.268A7.12 7.12 0 0 1 4.909 12c0-.782.125-1.533.357-2.235L1.24 6.65A11.934 11.934 0 0 0 0 12c0 1.92.445 3.73 1.237 5.335l4.04-3.067Z"/>
                  </svg>
                ) : (
                  <svg width="32" height="32" viewBox="0 0 24 24">
                    <path fill="#0078D4" d="M24 7.387v10.478c0 .23-.08.424-.238.583-.159.159-.353.238-.583.238h-8.393V6.566h8.393c.23 0 .424.08.583.238.159.159.238.353.238.583z"/>
                    <path fill="#0364B8" d="M14.786 6.566v12.12H8.393l-7.572-5.24c-.159-.11-.238-.27-.238-.48V7.387c0-.23.08-.424.238-.583.159-.159.353-.238.583-.238h13.382z"/>
                    <path fill="#28A8EA" d="M14.786 6.566L8.393 12.96l6.393 5.726V6.566z"/>
                  </svg>
                )}
                <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                  Connect {selectedEmailProvider === 'gmail' ? 'Gmail' : 'Outlook'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowEmailModal(false);
                  setSelectedEmailProvider(null);
                }}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#64748b',
                  padding: '0'
                }}
              >
                x
              </button>
            </div>

            {selectedEmailProvider === 'gmail' && (
              <>
                <div style={{
                  backgroundColor: '#fef3c7',
                  border: '1px solid #fcd34d',
                  borderRadius: '10px',
                  padding: '16px',
                  marginBottom: '20px'
                }}>
                  <div style={{ fontSize: '14px', color: '#92400e', fontWeight: 600, marginBottom: '8px' }}>
                    Gmail requires an App Password
                  </div>
                  <div style={{ fontSize: '13px', color: '#a16207', lineHeight: '1.5' }}>
                    For security, Gmail requires a special app password instead of your regular password.
                  </div>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', marginBottom: '12px' }}>
                    How to create an App Password:
                  </h4>
                  <ol style={{ margin: 0, paddingLeft: '20px', color: '#475569', fontSize: '14px', lineHeight: '2' }}>
                    <li>Go to <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" style={{ color: '#4F46E5' }}>myaccount.google.com/apppasswords</a></li>
                    <li>Sign in with your Google account</li>
                    <li>Select &quot;Mail&quot; and &quot;Other (Custom name)&quot;</li>
                    <li>Enter &quot;HireInbox&quot; as the name</li>
                    <li>Click &quot;Generate&quot; and copy the 16-character password</li>
                  </ol>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="jobs@yourcompany.com"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                    App Password
                  </label>
                  <input
                    type="password"
                    placeholder="xxxx xxxx xxxx xxxx"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </>
            )}

            {selectedEmailProvider === 'outlook' && (
              <>
                <div style={{
                  backgroundColor: '#dbeafe',
                  border: '1px solid #93c5fd',
                  borderRadius: '10px',
                  padding: '16px',
                  marginBottom: '20px'
                }}>
                  <div style={{ fontSize: '14px', color: '#1e40af', fontWeight: 600, marginBottom: '8px' }}>
                    Outlook / Office 365
                  </div>
                  <div style={{ fontSize: '13px', color: '#1e3a8a', lineHeight: '1.5' }}>
                    Use your regular Outlook password. If you have 2FA enabled, you may need an app password.
                  </div>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', marginBottom: '12px' }}>
                    Connection details:
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: '20px', color: '#475569', fontSize: '14px', lineHeight: '2' }}>
                    <li>Server: outlook.office365.com</li>
                    <li>Port: 993 (IMAP SSL)</li>
                    <li>We handle the technical setup for you</li>
                  </ul>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="jobs@yourcompany.com"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                    Password
                  </label>
                  <input
                    type="password"
                    placeholder="Your Outlook password"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => {
                  setShowEmailModal(false);
                  setSelectedEmailProvider(null);
                }}
                style={{
                  flex: 1,
                  padding: '12px',
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
              <button
                onClick={() => {
                  alert('Email connection saved! In production, this would verify the IMAP credentials.');
                  setShowEmailModal(false);
                  setSelectedEmailProvider(null);
                  if (showOnboarding && onboardingStep === 2) {
                    setOnboardingStep(3);
                  }
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
                Connect Email
              </button>
            </div>

            <p style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center', marginTop: '16px' }}>
              Your credentials are encrypted and stored securely. We only read emails with CV attachments.
            </p>
          </div>
        </div>
      )}

      {/* View Role Detail Modal */}
      {showRoleDetail && currentRole && (
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
          onClick={(e) => { if (e.target === e.currentTarget) setShowRoleDetail(false); }}
        >
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            {/* Header */}
            <div style={{
              padding: '24px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', margin: 0, textTransform: 'capitalize' }}>
                  {currentRole.title}
                </h2>
                <div style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
                  Role Requirements & AI Matching Criteria
                </div>
              </div>
              <button onClick={() => setShowRoleDetail(false)} style={{ backgroundColor: 'transparent', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#64748b' }}>×</button>
            </div>

            {/* Body */}
            <div style={{ padding: '24px' }}>
              {/* Basic Info */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '24px' }}>
                <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '10px' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Location</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', textTransform: 'capitalize' }}>{currentRole.location || 'Not specified'}</div>
                </div>
                <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '10px' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Seniority</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', textTransform: 'capitalize' }}>{currentRole.seniority || 'Not specified'}</div>
                </div>
                <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '10px' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Employment Type</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', textTransform: 'capitalize' }}>{currentRole.employmentType || 'Full-time'}</div>
                </div>
                <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '10px' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Work Arrangement</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', textTransform: 'capitalize' }}>{currentRole.workArrangement || 'Onsite'}</div>
                </div>
              </div>

              {/* Experience & Salary */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '24px' }}>
                <div style={{ padding: '16px', backgroundColor: '#eff6ff', borderRadius: '10px', borderLeft: '4px solid #4F46E5' }}>
                  <div style={{ fontSize: '12px', color: '#4F46E5', marginBottom: '4px', fontWeight: 600 }}>Experience Required</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>
                    {currentRole.minExperience || 0} - {currentRole.maxExperience || 10} years
                  </div>
                </div>
                <div style={{ padding: '16px', backgroundColor: '#f0fdf4', borderRadius: '10px', borderLeft: '4px solid #10b981' }}>
                  <div style={{ fontSize: '12px', color: '#10b981', marginBottom: '4px', fontWeight: 600 }}>Salary Range</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>
                    R{(currentRole.salaryMin || 0).toLocaleString()} - R{(currentRole.salaryMax || 0).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Required Skills */}
              {currentRole.requiredSkills && currentRole.requiredSkills.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '12px' }}>Required Skills</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {currentRole.requiredSkills.map((skill, i) => (
                      <span key={i} style={{
                        padding: '6px 12px',
                        backgroundColor: '#ede9fe',
                        color: '#7c3aed',
                        borderRadius: '16px',
                        fontSize: '13px',
                        fontWeight: 500
                      }}>
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Guidance - Strong Fit */}
              {currentRole.strongFit && (
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#059669', marginBottom: '8px' }}>What Makes a Strong Fit</div>
                  <div style={{
                    padding: '16px',
                    backgroundColor: '#ecfdf5',
                    borderRadius: '10px',
                    fontSize: '14px',
                    color: '#065f46',
                    lineHeight: '1.6',
                    borderLeft: '4px solid #10b981'
                  }}>
                    {currentRole.strongFit}
                  </div>
                </div>
              )}

              {/* AI Guidance - Disqualifiers */}
              {currentRole.disqualifiers && (
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#dc2626', marginBottom: '8px' }}>Disqualifiers</div>
                  <div style={{
                    padding: '16px',
                    backgroundColor: '#fef2f2',
                    borderRadius: '10px',
                    fontSize: '14px',
                    color: '#991b1b',
                    lineHeight: '1.6',
                    borderLeft: '4px solid #ef4444'
                  }}>
                    {currentRole.disqualifiers}
                  </div>
                </div>
              )}

              {/* Close Button */}
              <button
                onClick={() => setShowRoleDetail(false)}
                style={{
                  width: '100%',
                  padding: '14px',
                  backgroundColor: '#4F46E5',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
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

      {/* New Role Modal - Comprehensive */}
      {showNewRoleModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            zIndex: 200
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowNewRoleModal(false); }}
        >
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', width: '100%', maxWidth: '700px', maxHeight: '90vh', overflow: 'auto', padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Create New Role</h2>
                <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0' }}>The more detail you provide, the smarter the AI matching</p>
              </div>
              <button onClick={() => setShowNewRoleModal(false)} style={{ backgroundColor: 'transparent', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#64748b' }}>×</button>
            </div>

            {/* Basic Information */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Basic Information</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Job Title *</label>
                  <input type="text" value={newRoleTitle} onChange={(e) => setNewRoleTitle(e.target.value)} placeholder="e.g. Finance Manager" style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Department</label>
                  <select value={newRoleDepartment} onChange={(e) => setNewRoleDepartment(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box', backgroundColor: '#fff' }}>
                    <option value="">Select department</option>
                    <option value="Finance">Finance</option>
                    <option value="IT">IT / Technology</option>
                    <option value="HR">Human Resources</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Sales">Sales</option>
                    <option value="Operations">Operations</option>
                    <option value="Legal">Legal</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Location *</label>
                  <input type="text" value={newRoleLocation} onChange={(e) => setNewRoleLocation(e.target.value)} placeholder="e.g. Cape Town, Johannesburg" style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Work Arrangement</label>
                  <select value={newRoleWorkArrangement} onChange={(e) => setNewRoleWorkArrangement(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box', backgroundColor: '#fff' }}>
                    <option value="">Select arrangement</option>
                    <option value="onsite">On-site</option>
                    <option value="remote">Fully Remote</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Experience & Level */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Experience & Level</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Seniority Level</label>
                  <select value={newRoleSeniorityLevel} onChange={(e) => setNewRoleSeniorityLevel(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box', backgroundColor: '#fff' }}>
                    <option value="">Select level</option>
                    <option value="entry">Entry Level / Graduate</option>
                    <option value="junior">Junior (1-3 years)</option>
                    <option value="mid">Mid-Level (3-5 years)</option>
                    <option value="senior">Senior (5-8 years)</option>
                    <option value="lead">Lead / Principal (8+ years)</option>
                    <option value="manager">Manager / Head of</option>
                    <option value="director">Director / Executive</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Min Years Experience</label>
                  <input type="number" value={newRoleExperienceMin} onChange={(e) => setNewRoleExperienceMin(e.target.value)} placeholder="e.g. 3" min="0" style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Max Years Experience</label>
                  <input type="number" value={newRoleExperienceMax} onChange={(e) => setNewRoleExperienceMax(e.target.value)} placeholder="e.g. 8" min="0" style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Employment Type</label>
                  <select value={newRoleEmploymentType} onChange={(e) => setNewRoleEmploymentType(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box', backgroundColor: '#fff' }}>
                    <option value="full-time">Full-time Permanent</option>
                    <option value="contract">Fixed-term Contract</option>
                    <option value="temp">Temporary</option>
                    <option value="part-time">Part-time</option>
                    <option value="internship">Internship / Learnership</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Salary Range (ZAR Annual)</label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input type="text" value={newRoleSalaryMin} onChange={(e) => setNewRoleSalaryMin(e.target.value)} placeholder="e.g. 400000" style={{ flex: 1, padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} />
                    <span style={{ color: '#94a3b8' }}>to</span>
                    <input type="text" value={newRoleSalaryMax} onChange={(e) => setNewRoleSalaryMax(e.target.value)} placeholder="e.g. 600000" style={{ flex: 1, padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Qualifications & Skills */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Qualifications & Skills</h3>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Required Qualifications</label>
                <input type="text" value={newRoleQualifications} onChange={(e) => setNewRoleQualifications(e.target.value)} placeholder="e.g. CA(SA), BCom, MBA, Matric" style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} />
                <p style={{ fontSize: '11px', color: '#94a3b8', margin: '4px 0 0' }}>Separate multiple with commas</p>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Must-Have Skills (non-negotiable)</label>
                <input type="text" value={newRoleMustHaveSkills} onChange={(e) => setNewRoleMustHaveSkills(e.target.value)} placeholder="e.g. SAP, Excel, Financial Modelling, Team Leadership" style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} />
                <p style={{ fontSize: '11px', color: '#94a3b8', margin: '4px 0 0' }}>AI will reject candidates without these</p>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Nice-to-Have Skills</label>
                <input type="text" value={newRoleNiceToHaveSkills} onChange={(e) => setNewRoleNiceToHaveSkills(e.target.value)} placeholder="e.g. Python, Power BI, IFRS 17, Management Consulting" style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} />
                <p style={{ fontSize: '11px', color: '#94a3b8', margin: '4px 0 0' }}>AI will give bonus points for these</p>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Dealbreakers (auto-reject if present)</label>
                <input type="text" value={newRoleDealbreakers} onChange={(e) => setNewRoleDealbreakers(e.target.value)} placeholder="e.g. No driver's licence, Job hopper (3+ jobs in 2 years)" style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} />
              </div>
            </div>

            {/* Job Description */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Job Description</h3>
              <textarea value={newRoleDescription} onChange={(e) => setNewRoleDescription(e.target.value)} placeholder="Describe the role responsibilities, reporting line, team size, growth opportunities..." rows={5} style={{ width: '100%', padding: '12px 14px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box', resize: 'vertical' }} />
            </div>

            {/* Pricing */}
            <div style={{ backgroundColor: '#f8fafc', borderRadius: '10px', padding: '16px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>AI CV Screening</div>
                  <div style={{ fontSize: '13px', color: '#64748b' }}>Up to 200 CVs, AI ranking with evidence, acknowledgment emails</div>
                </div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: '#4F46E5' }}>R1,750</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setShowNewRoleModal(false)} style={{ flex: 1, padding: '14px', backgroundColor: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button
                onClick={async () => {
                  if (isDemo) {
                    // In demo mode, actually create the role
                    try {
                      const res = await fetch('/api/roles', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          title: newRoleTitle,
                          description: newRoleDescription,
                          department: newRoleDepartment,
                          location: newRoleLocation,
                          experienceMin: newRoleExperienceMin,
                          experienceMax: newRoleExperienceMax,
                          seniorityLevel: newRoleSeniorityLevel,
                          employmentType: newRoleEmploymentType,
                          workArrangement: newRoleWorkArrangement,
                          salaryMin: newRoleSalaryMin,
                          salaryMax: newRoleSalaryMax,
                          qualifications: newRoleQualifications,
                          mustHaveSkills: newRoleMustHaveSkills,
                          niceToHaveSkills: newRoleNiceToHaveSkills,
                          dealbreakers: newRoleDealbreakers
                        })
                      });
                      const data = await res.json();
                      if (data.success && data.role) {
                        // Add to roles list and select it
                        const newRole: Role = {
                          id: data.role.id,
                          title: data.role.title,
                          location: newRoleLocation || 'Remote',
                          createdAt: new Date().toISOString().split('T')[0],
                          candidateCount: 0,
                          newToday: 0
                        };
                        setRoles(prev => [newRole, ...prev]);
                        setSelectedRole(newRole.id);
                        setLastFetchResult(`Role "${newRoleTitle}" created successfully!`);
                        // Reset form
                        setNewRoleTitle(''); setNewRoleLocation(''); setNewRoleDescription('');
                        setNewRoleDepartment(''); setNewRoleExperienceMin(''); setNewRoleExperienceMax('');
                        setNewRoleSeniorityLevel(''); setNewRoleEmploymentType('full-time');
                        setNewRoleWorkArrangement(''); setNewRoleSalaryMin(''); setNewRoleSalaryMax('');
                        setNewRoleQualifications(''); setNewRoleMustHaveSkills(''); setNewRoleNiceToHaveSkills('');
                        setNewRoleDealbreakers('');
                      } else {
                        alert('Error creating role: ' + (data.error || 'Unknown error'));
                      }
                    } catch (err) {
                      alert('Error creating role: ' + (err instanceof Error ? err.message : 'Unknown error'));
                    }
                  } else {
                    alert('In production, this creates a new role and redirects to PayFast for payment.');
                  }
                  setShowNewRoleModal(false);
                }}
                disabled={!newRoleTitle.trim() || !newRoleLocation.trim()}
                style={{
                  flex: 1,
                  padding: '14px',
                  backgroundColor: newRoleTitle.trim() && newRoleLocation.trim() ? '#4F46E5' : '#cbd5e1',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: newRoleTitle.trim() && newRoleLocation.trim() ? 'pointer' : 'not-allowed'
                }}
              >
                {isDemo ? 'Create Role (Demo)' : 'Create Role — R1,750'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Verification Detail Modals */}
      {showVerificationDetail && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            zIndex: 300
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowVerificationDetail(null); }}
        >
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflow: 'auto' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                {showVerificationDetail === 'idCheck' && 'ID Verification'}
                {showVerificationDetail === 'creditCheck' && 'Credit Check'}
                {showVerificationDetail === 'referenceCheck' && 'Reference Check'}
              </h2>
              <button onClick={() => setShowVerificationDetail(null)} style={{ backgroundColor: 'transparent', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#64748b' }}>×</button>
            </div>

            <div style={{ padding: '24px' }}>
              {showVerificationDetail === 'idCheck' && (
                <>
                  <div style={{ backgroundColor: '#eff6ff', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
                    <div style={{ fontSize: '28px', fontWeight: 700, color: '#4F46E5', marginBottom: '4px' }}>R150</div>
                    <div style={{ fontSize: '14px', color: '#64748b' }}>per candidate</div>
                  </div>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '12px' }}>What&apos;s included:</h3>
                  <ul style={{ margin: '0 0 20px', paddingLeft: '20px', color: '#475569', fontSize: '14px', lineHeight: '2' }}>
                    <li>South African ID number validation</li>
                    <li>Home Affairs database verification</li>
                    <li>Photo ID match confirmation</li>
                    <li>Date of birth verification</li>
                    <li>Citizenship status check</li>
                  </ul>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '12px' }}>How it works:</h3>
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                    {['Upload ID document', 'AI extracts details', 'Home Affairs check', 'Results in 1-2 days'].map((step, i) => (
                      <div key={i} style={{ flex: 1, textAlign: 'center', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#4F46E5', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px', fontWeight: 700, fontSize: '14px' }}>{i + 1}</div>
                        <div style={{ fontSize: '12px', color: '#475569' }}>{step}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {showVerificationDetail === 'creditCheck' && (
                <>
                  <div style={{ backgroundColor: '#dbeafe', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
                    <div style={{ fontSize: '28px', fontWeight: 700, color: '#2563eb', marginBottom: '4px' }}>R200</div>
                    <div style={{ fontSize: '14px', color: '#1e40af' }}>per candidate</div>
                  </div>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '12px' }}>What&apos;s included:</h3>
                  <ul style={{ margin: '0 0 20px', paddingLeft: '20px', color: '#475569', fontSize: '14px', lineHeight: '2' }}>
                    <li>TransUnion credit report</li>
                    <li>Credit score and rating</li>
                    <li>Payment history summary</li>
                    <li>Outstanding debt overview</li>
                    <li>Judgments and defaults</li>
                  </ul>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '12px' }}>How it works:</h3>
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                    {['Candidate consent', 'ID verification', 'TransUnion query', 'Results in 1-2 days'].map((step, i) => (
                      <div key={i} style={{ flex: 1, textAlign: 'center', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px', fontWeight: 700, fontSize: '14px' }}>{i + 1}</div>
                        <div style={{ fontSize: '12px', color: '#475569' }}>{step}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {showVerificationDetail === 'referenceCheck' && (
                <>
                  <div style={{ backgroundColor: '#d1fae5', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
                    <div style={{ fontSize: '28px', fontWeight: 700, color: '#059669', marginBottom: '4px' }}>R200</div>
                    <div style={{ fontSize: '14px', color: '#166534' }}>per candidate (2 references)</div>
                  </div>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '12px' }}>What&apos;s included:</h3>
                  <ul style={{ margin: '0 0 20px', paddingLeft: '20px', color: '#475569', fontSize: '14px', lineHeight: '2' }}>
                    <li>AI extracts references from CV</li>
                    <li>Automated questionnaire sent to referees</li>
                    <li>Performance and character questions</li>
                    <li>Employment dates verification</li>
                    <li>Re-hire recommendation</li>
                  </ul>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '12px' }}>How it works:</h3>
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                    {['Extract refs from CV', 'Send email questionnaire', 'Referee completes form', 'AI summarizes responses'].map((step, i) => (
                      <div key={i} style={{ flex: 1, textAlign: 'center', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#059669', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px', fontWeight: 700, fontSize: '14px' }}>{i + 1}</div>
                        <div style={{ fontSize: '12px', color: '#475569' }}>{step}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '16px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#166534', marginBottom: '8px' }}>Sample Questionnaire Questions:</div>
                    <ul style={{ margin: 0, paddingLeft: '20px', color: '#166534', fontSize: '13px', lineHeight: '1.8' }}>
                      <li>How would you rate their overall job performance?</li>
                      <li>Did they meet deadlines and deliver quality work?</li>
                      <li>How well did they work with the team?</li>
                      <li>Would you re-hire this person?</li>
                    </ul>
                  </div>
                </>
              )}
            </div>

            <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '12px' }}>
              <button onClick={() => setShowVerificationDetail(null)} style={{ flex: 1, padding: '12px', backgroundColor: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Close</button>
              <button onClick={() => { setShowVerificationDetail(null); }} style={{ flex: 1, padding: '12px', backgroundColor: '#4F46E5', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Order This Check</button>
            </div>
          </div>
        </div>
      )}

      </div>{/* End main content wrapper */}
    </div>
  );
}
