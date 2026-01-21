'use client';

import { useState, useCallback, useRef, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useNotifications } from '@/lib/notification-context';
import { useUsage, UsageBadge, UpgradePrompt } from '@/lib/usage-context';

/* ===========================================
   HIREINBOX B2C - KILLER SOCIAL MEDIA LANDING
   World-class CV analysis for job seekers
   Phase 5: Full feature implementation
   =========================================== */

// Types
interface StrengthItem {
  strength: string;
  evidence: string;
  impact: string;
}

interface ImprovementItem {
  area: string;
  current_state: string;
  suggestion: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

interface CareerInsights {
  natural_fit_roles: Array<{ role: string; match: number }> | string[];
  industries: string[];
  trajectory_observation: string;
  salary_positioning?: string;
}

interface ATSCheck {
  likely_ats_friendly: boolean;
  issues: string[];
  recommendation: string;
}

interface RecruiterView {
  seven_second_impression: string;
  standout_element: string;
  red_flag_check: string;
}

interface CVAnalysis {
  candidate_name: string | null;
  current_title: string | null;
  years_experience: number | null;
  education_level: string | null;
  overall_score: number;
  score_explanation: string;
  first_impression: string;
  sa_context_highlights?: string[];
  strengths: StrengthItem[];
  improvements: ImprovementItem[];
  quick_wins: string[];
  career_insights: CareerInsights;
  ats_check?: ATSCheck;
  recruiter_view?: RecruiterView;
  summary: string;
}

// Target role options
const TARGET_ROLES = [
  { value: '', label: 'General Analysis (Any Role)' },
  { value: 'software-engineer', label: 'Software Engineer / Developer' },
  { value: 'data-analyst', label: 'Data Analyst / Data Scientist' },
  { value: 'project-manager', label: 'Project Manager' },
  { value: 'marketing', label: 'Marketing / Digital Marketing' },
  { value: 'sales', label: 'Sales / Business Development' },
  { value: 'finance', label: 'Finance / Accounting' },
  { value: 'hr', label: 'Human Resources' },
  { value: 'operations', label: 'Operations / Supply Chain' },
  { value: 'design', label: 'UX/UI Design / Creative' },
  { value: 'legal', label: 'Legal / Compliance' },
  { value: 'healthcare', label: 'Healthcare / Medical' },
  { value: 'engineering', label: 'Engineering (Civil/Mechanical/Electrical)' },
  { value: 'consulting', label: 'Consulting / Strategy' },
  { value: 'admin', label: 'Administrative / Office Management' },
];

// Industry options for industry-specific feedback
const INDUSTRIES = [
  { value: '', label: 'Detect from CV' },
  { value: 'tech', label: 'Technology / IT' },
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
];

// Logo Component
const Logo = ({ size = 32, light = false }: { size?: number; light?: boolean }) => (
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
        <span style={{ color: light ? 'white' : '#0f172a' }}>Hire</span>
        <span style={{ color: light ? '#a5b4fc' : '#4F46E5' }}>Inbox</span>
      </span>
      <span style={{ fontSize: '0.65rem', color: light ? 'rgba(255,255,255,0.7)' : '#94a3b8', fontWeight: 500 }}>Less noise. Better hires.</span>
    </div>
  </div>
);

// Circular Score Component with animation
const CircularScore = ({ score, size = 160 }: { score: number; size?: number }) => {
  const radius = size / 2;
  const stroke = size / 16;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getColor = () => {
    if (score >= 80) return '#10B981';
    if (score >= 60) return '#8B5CF6';
    if (score >= 40) return '#F59E0B';
    return '#EF4444';
  };

  const getGrade = () => {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B+';
    if (score >= 60) return 'B';
    if (score >= 50) return 'C';
    return 'D';
  };

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          stroke="#E5E7EB"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke={getColor()}
          fill="transparent"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference + ' ' + circumference}
          style={{
            strokeDashoffset,
            transition: 'stroke-dashoffset 1.5s ease-out',
            filter: `drop-shadow(0 0 8px ${getColor()}40)`
          }}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
      </svg>
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: size / 3, fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>{score}</div>
        <div style={{ fontSize: size / 12, color: '#6B7280', marginTop: 2 }}>out of 100</div>
        <div style={{
          fontSize: size / 8,
          fontWeight: 700,
          color: getColor(),
          marginTop: 4,
          padding: '2px 8px',
          backgroundColor: `${getColor()}15`,
          borderRadius: 4
        }}>
          Grade {getGrade()}
        </div>
      </div>
    </div>
  );
};

// Stunning Loading Animation with detailed progress
const AnalyzingAnimation = ({ step }: { step: number }) => {
  const steps = [
    { icon: '📄', label: 'Step 1: Uploading', shortLabel: 'Uploading', detail: 'Securely processing your CV file' },
    { icon: '🔍', label: 'Step 2: Analyzing', shortLabel: 'Analyzing', detail: 'AI reading your experience and skills' },
    { icon: '🎯', label: 'Step 3: Finding Improvements', shortLabel: 'Finding Improvements', detail: 'Identifying high-impact changes' },
    { icon: '📊', label: 'Step 4: Scoring', shortLabel: 'Scoring', detail: 'Comparing to SA top performers' },
    { icon: '✨', label: 'Step 5: Generating Report', shortLabel: 'Generating Report', detail: 'Creating your personalized insights' },
  ];

  const tips = [
    'Tip: Recruiters spend only 6 seconds on a CV. We\'re making yours count.',
    'Did you know? Adding metrics can increase interview rates by 40%.',
    'Pro tip: SA companies love seeing local qualifications like CA(SA) or BCom.',
    'Fun fact: CVs with a professional summary get 36% more views.',
    'Insight: Role-specific keywords can boost your ATS score significantly.'
  ];

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.95)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      backdropFilter: 'blur(8px)',
      padding: 20
    }}>
      <div style={{
        backgroundColor: '#1E293B',
        borderRadius: 24,
        padding: '40px 28px',
        maxWidth: 520,
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}>
        {/* Animated Logo */}
        <div style={{
          width: 72,
          height: 72,
          margin: '0 auto 20px',
          background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
          borderRadius: 18,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'pulse 2s ease-in-out infinite',
          boxShadow: '0 0 40px rgba(79, 70, 229, 0.4)'
        }}>
          <span style={{ fontSize: '2rem' }}>{steps[step]?.icon || '🚀'}</span>
        </div>

        {/* Progress Text */}
        <h2 style={{
          color: 'white',
          fontSize: 'clamp(1.125rem, 4vw, 1.375rem)',
          fontWeight: 700,
          marginBottom: 6
        }}>
          {steps[step]?.label || 'Almost there...'}
        </h2>
        <p style={{
          color: 'rgba(255,255,255,0.6)',
          fontSize: '0.875rem',
          marginBottom: 24
        }}>
          {steps[step]?.detail || 'Finalizing your analysis'}
        </p>

        {/* Detailed Steps List */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          marginBottom: 24,
          textAlign: 'left'
        }}>
          {steps.map((s, i) => (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 12px',
              backgroundColor: i === step ? 'rgba(79, 70, 229, 0.2)' : 'rgba(255,255,255,0.02)',
              borderRadius: 8,
              border: i === step ? '1px solid rgba(79, 70, 229, 0.4)' : '1px solid transparent',
              transition: 'all 0.3s ease'
            }}>
              <div style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                backgroundColor: i < step ? '#10B981' : i === step ? '#4F46E5' : 'rgba(255,255,255,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'all 0.3s ease'
              }}>
                {i < step ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                ) : i === step ? (
                  <div style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    backgroundColor: 'white',
                    animation: 'pulse 1s ease-in-out infinite'
                  }} />
                ) : (
                  <span style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.4)' }}>{i + 1}</span>
                )}
              </div>
              <span style={{
                fontSize: '0.8125rem',
                color: i <= step ? 'white' : 'rgba(255,255,255,0.4)',
                fontWeight: i === step ? 600 : 400,
                flex: 1
              }}>
                {s.shortLabel}
              </span>
              {i < step && (
                <span style={{ fontSize: '0.625rem', color: '#10B981', fontWeight: 500 }}>Done</span>
              )}
              {i === step && (
                <span style={{
                  fontSize: '0.625rem',
                  color: '#818CF8',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}>
                  <span style={{
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    backgroundColor: '#818CF8',
                    animation: 'pulse 1s ease-in-out infinite'
                  }} />
                  In Progress
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Progress Bar */}
        <div style={{
          backgroundColor: 'rgba(255,255,255,0.1)',
          borderRadius: 100,
          height: 6,
          overflow: 'hidden',
          marginBottom: 16
        }}>
          <div style={{
            height: '100%',
            width: `${((step + 1) / steps.length) * 100}%`,
            background: 'linear-gradient(90deg, #4F46E5, #7C3AED, #10B981)',
            borderRadius: 100,
            transition: 'width 0.5s ease-out'
          }} />
        </div>

        {/* Estimated time */}
        <p style={{
          color: 'rgba(255,255,255,0.5)',
          fontSize: '0.75rem',
          marginBottom: 16
        }}>
          Estimated time remaining: ~{Math.max(25 - (step * 5), 5)} seconds
        </p>

        {/* Tip */}
        <div style={{
          backgroundColor: 'rgba(255,255,255,0.05)',
          borderRadius: 10,
          padding: 12,
          borderLeft: '3px solid #4F46E5'
        }}>
          <p style={{
            color: 'rgba(255,255,255,0.6)',
            fontSize: '0.75rem',
            margin: 0,
            fontStyle: 'italic',
            lineHeight: 1.5
          }}>
            {tips[step % tips.length]}
          </p>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
};

// Social Proof Component
const SocialProof = () => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    justifyContent: 'center',
    flexWrap: 'wrap'
  }}>
    {/* User avatars */}
    <div style={{ display: 'flex' }}>
      {['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'].map((color, i) => (
        <div key={i} style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          backgroundColor: color,
          border: '2px solid white',
          marginLeft: i > 0 ? -10 : 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '0.75rem',
          fontWeight: 600
        }}>
          {['TM', 'SK', 'JR', 'NP', 'LK'][i]}
        </div>
      ))}
    </div>
    <div style={{ textAlign: 'left' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {[1,2,3,4,5].map(i => (
          <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="#F59E0B">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
          </svg>
        ))}
        <span style={{ color: '#6B7280', fontSize: '0.8125rem', marginLeft: 4 }}>4.9/5</span>
      </div>
      <p style={{ fontSize: '0.8125rem', color: '#64748B', margin: 0 }}>
        <strong>2,500+</strong> South African job seekers helped this month
      </p>
    </div>
  </div>
);

// Testimonials Component
const TestimonialsSection = () => (
  <section style={{
    position: 'relative',
    padding: '60px 24px 80px',
    backgroundColor: 'rgba(255,255,255,0.02)'
  }}>
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <h2 style={{
          fontSize: 'clamp(1.5rem, 4vw, 2rem)',
          fontWeight: 700,
          color: 'white',
          marginBottom: 12
        }}>
          Real Results from Real Job Seekers
        </h2>
        <p style={{
          fontSize: '1rem',
          color: 'rgba(255,255,255,0.6)',
          maxWidth: 500,
          margin: '0 auto'
        }}>
          Join thousands of South Africans who landed their dream jobs
        </p>
      </div>

      <div className="testimonials-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 24
      }}>
        {TESTIMONIALS.map((testimonial, i) => (
          <div key={i} style={{
            backgroundColor: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 20,
            padding: 28,
            transition: 'transform 0.2s ease, box-shadow 0.2s ease'
          }}>
            {/* Stars */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
              {Array(testimonial.rating).fill(0).map((_, j) => (
                <svg key={j} width="18" height="18" viewBox="0 0 24 24" fill="#F59E0B">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                </svg>
              ))}
            </div>

            {/* Quote */}
            <p style={{
              fontSize: '0.9375rem',
              color: 'rgba(255,255,255,0.85)',
              lineHeight: 1.7,
              marginBottom: 20,
              fontStyle: 'italic'
            }}>
              &ldquo;{testimonial.text}&rdquo;
            </p>

            {/* Author */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 600,
                fontSize: '0.875rem'
              }}>
                {testimonial.avatar}
              </div>
              <div>
                <p style={{
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  color: 'white',
                  margin: 0,
                  marginBottom: 2
                }}>
                  {testimonial.name}
                </p>
                <p style={{
                  fontSize: '0.8125rem',
                  color: 'rgba(255,255,255,0.5)',
                  margin: 0
                }}>
                  {testimonial.role} - {testimonial.location}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// Free assessment tracking constants
const FREE_ASSESSMENTS_KEY = 'hireinbox_free_assessments';
const SAVED_RESULTS_KEY = 'hireinbox_saved_results';
const MAX_FREE_ASSESSMENTS = 1;
const UNLOCK_PRICE = 29; // R29 per additional assessment

// Testimonials data with realistic SA names
const TESTIMONIALS = [
  {
    name: 'Lindiwe Nkosi',
    role: 'Marketing Manager',
    location: 'Johannesburg',
    rating: 5,
    text: 'I was applying for months with no luck. HireInbox showed me exactly what was wrong - my CV was too vague. Added specific metrics like they suggested, and got 3 interviews in 2 weeks!',
    avatar: 'LN'
  },
  {
    name: 'Pieter van der Berg',
    role: 'Senior Accountant',
    location: 'Cape Town',
    rating: 5,
    text: 'As a CA(SA), I thought my CV was solid. The SA-specific feedback was eye-opening - it highlighted exactly what Big 4 firms look for. Now at Deloitte.',
    avatar: 'PB'
  },
  {
    name: 'Thando Mthembu',
    role: 'Software Developer',
    location: 'Durban',
    rating: 5,
    text: 'The AI rewrite feature is incredible. It turned my boring job descriptions into achievement-focused bullet points. My GitHub got noticed for the first time!',
    avatar: 'TM'
  }
];

function UploadPageContent() {
  const searchParams = useSearchParams();
  const isCreatorMode = searchParams.get('mode') === 'creator';
  const sharedResultId = searchParams.get('result');
  const { success, error: notifyError } = useNotifications();

  // Usage tracking from shared context
  const { canUseAssessment, useAssessment, isExhausted, getTierInfo } = useUsage();
  const canUseFreeAssessment = canUseAssessment('b2c');
  const b2cInfo = getTierInfo('b2c');

  // Core state
  const [file, setFile] = useState<File | null>(null);
  const [pasteMode, setPasteMode] = useState(false);
  const [linkedInMode, setLinkedInMode] = useState(false);
  const [linkedInUrl, setLinkedInUrl] = useState('');
  const [pastedText, setPastedText] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [analysis, setAnalysis] = useState<CVAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [originalCVText, setOriginalCVText] = useState<string>('');

  // New Phase 5 features
  const [targetRole, setTargetRole] = useState('');
  const [targetIndustry, setTargetIndustry] = useState('');
  const [emailForResults, setEmailForResults] = useState('');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [shareableUrl, setShareableUrl] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);

  // Get Interview Ready features
  const [rewrittenCV, setRewrittenCV] = useState<string | null>(null);
  const [isRewriting, setIsRewriting] = useState(false);
  const [showRewriteModal, setShowRewriteModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showInterviewCoach, setShowInterviewCoach] = useState(false);

  // Video analysis state
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const [videoAnalysis, setVideoAnalysis] = useState<any>(null);
  const [isAnalyzingVideo, setIsAnalyzingVideo] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Modal and UI state
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [savedResultToken, setSavedResultToken] = useState<string | null>(null);
  const [showSavedConfirmation, setShowSavedConfirmation] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  // Check for sample parameter to auto-show demo
  const showSample = searchParams.get('sample') === 'true';

  // Load saved results on mount
  useEffect(() => {

    // Check if loading a saved result
    if (sharedResultId) {
      const savedResults = localStorage.getItem(SAVED_RESULTS_KEY);
      if (savedResults) {
        const results = JSON.parse(savedResults);
        const savedResult = results[sharedResultId];
        if (savedResult && savedResult.analysis) {
          setAnalysis(savedResult.analysis);
          setShareableUrl(`${window.location.origin}/upload?result=${sharedResultId}`);
          setSavedResultToken(sharedResultId);
        }
      }
    }
  }, [sharedResultId]);

  // Auto-show sample report if ?sample=true
  useEffect(() => {
    if (showSample && !analysis) {
      // Trigger sample report after short delay for smooth UX
      const timer = setTimeout(() => {
        const sampleBtn = document.querySelector('[data-sample-btn]') as HTMLButtonElement;
        if (sampleBtn) sampleBtn.click();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [showSample, analysis]);

  // Use shared context for assessment tracking
  const incrementFreeAssessmentCount = () => {
    useAssessment('b2c');
  };

  // Save results with unique token
  const saveResultsWithToken = (analysisData: CVAnalysis): string => {
    const token = generateResultId();
    const savedResults = localStorage.getItem(SAVED_RESULTS_KEY);
    const results = savedResults ? JSON.parse(savedResults) : {};

    results[token] = {
      analysis: analysisData,
      savedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
    };

    localStorage.setItem(SAVED_RESULTS_KEY, JSON.stringify(results));
    return token;
  };

  // Drag and drop handlers with visual feedback
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      const validTypes = ['.pdf', '.doc', '.docx', '.txt'];
      const fileName = droppedFile.name.toLowerCase();
      if (validTypes.some(ext => fileName.endsWith(ext))) {
        setFile(droppedFile);
        setError(null);
        setPasteMode(false);
        setLinkedInMode(false);
      } else {
        setError('Please upload a PDF, Word document, or text file.');
      }
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      setPasteMode(false);
      setLinkedInMode(false);
    }
  }, []);

  // Analyze CV with role-specific and industry-specific feedback
  const analyzeCV = async () => {
    if (!file && !pastedText && !linkedInUrl) return;

    // Check if user can use free assessment
    if (!canUseFreeAssessment && !isCreatorMode) {
      setShowUnlockModal(true);
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setAnalysisStep(0);

    // Simulate step progression for better UX
    const stepInterval = setInterval(() => {
      setAnalysisStep(prev => Math.min(prev + 1, 4));
    }, 2000);

    try {
      const formData = new FormData();

      if (file) {
        formData.append('cv', file);
      } else if (pastedText) {
        formData.append('cvText', pastedText);
      } else if (linkedInUrl) {
        formData.append('linkedInUrl', linkedInUrl);
      }

      // Add role and industry for targeted analysis
      if (targetRole) {
        formData.append('targetRole', targetRole);
      }
      if (targetIndustry) {
        formData.append('targetIndustry', targetIndustry);
      }

      const response = await fetch('/api/analyze-cv', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Analysis failed');
      }

      clearInterval(stepInterval);
      setAnalysisStep(4);

      // Small delay for final animation
      await new Promise(resolve => setTimeout(resolve, 500));

      setAnalysis(data.analysis);
      if (data.originalCV) {
        setOriginalCVText(data.originalCV);
      }

      // Increment free assessment count (unless in creator mode)
      if (!isCreatorMode) {
        incrementFreeAssessmentCount();
      }

      // Generate shareable URL and save results
      const token = saveResultsWithToken(data.analysis);
      setSavedResultToken(token);
      setShareableUrl(`${window.location.origin}/upload?result=${token}`);

      // Show success notification
      success(
        'CV Analysis Complete',
        `Your CV scored ${data.analysis.overall_score}/100. Scroll down for insights.`
      );

    } catch (err) {
      clearInterval(stepInterval);
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
      setError(errorMessage);
      notifyError('Analysis Failed', errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Generate unique result ID for sharing
  const generateResultId = () => {
    return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
  };

  // Download PDF Report
  const downloadPDFReport = async () => {
    if (!analysis) return;

    // Create a printable HTML version
    const reportHTML = generateReportHTML(analysis);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(reportHTML);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // Generate HTML report for PDF
  const generateReportHTML = (data: CVAnalysis) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>CV Analysis Report - ${data.candidate_name || 'Your CV'}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; }
          h1 { color: #0F172A; margin-bottom: 8px; }
          h2 { color: #4F46E5; border-bottom: 2px solid #E2E8F0; padding-bottom: 8px; margin-top: 32px; }
          .score { font-size: 64px; font-weight: 800; color: #4F46E5; }
          .score-label { color: #6B7280; }
          .strength { background: #F0FDF4; padding: 16px; border-radius: 8px; margin-bottom: 12px; border-left: 4px solid #10B981; }
          .improvement { background: #FEF3C7; padding: 16px; border-radius: 8px; margin-bottom: 12px; border-left: 4px solid #F59E0B; }
          .high { border-left-color: #EF4444; }
          .footer { margin-top: 48px; text-align: center; color: #9CA3AF; font-size: 12px; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <h1>CV Analysis Report</h1>
        <p style="color: #6B7280;">Generated by HireInbox | ${new Date().toLocaleDateString()}</p>

        <div style="text-align: center; margin: 40px 0;">
          <div class="score">${data.overall_score}</div>
          <div class="score-label">out of 100</div>
        </div>

        <p><strong>First Impression:</strong> ${data.first_impression}</p>

        <h2>Strengths (${data.strengths.length})</h2>
        ${data.strengths.map(s => `
          <div class="strength">
            <strong>${s.strength}</strong>
            <p style="font-style: italic; margin: 8px 0;">"${s.evidence}"</p>
            <p style="color: #059669; margin: 0;">${s.impact}</p>
          </div>
        `).join('')}

        <h2>Improvements (${data.improvements.length})</h2>
        ${data.improvements.map(i => `
          <div class="improvement ${i.priority === 'HIGH' ? 'high' : ''}">
            <strong>${i.area}</strong> <span style="color: ${i.priority === 'HIGH' ? '#EF4444' : '#F59E0B'};">[${i.priority}]</span>
            <p style="margin: 8px 0;">${i.suggestion}</p>
          </div>
        `).join('')}

        <h2>Career Insights</h2>
        <p>${data.career_insights.trajectory_observation}</p>

        <h2>Summary</h2>
        <p>${data.summary}</p>

        <div class="footer">
          <p>HireInbox - AI-Powered CV Analysis for South African Job Seekers</p>
          <p>hireinbox.co.za</p>
        </div>
      </body>
      </html>
    `;
  };

  // Email results
  const sendResultsToEmail = async () => {
    if (!emailForResults || !analysis) return;

    // In production, this would call an API endpoint
    // For now, show a success message
    alert(`Results will be sent to ${emailForResults}`);
    setShowEmailModal(false);
  };

  // Copy shareable link
  const copyShareableLink = () => {
    if (shareableUrl) {
      navigator.clipboard.writeText(shareableUrl);
      alert('Link copied to clipboard!');
    }
  };

  // Reset upload
  const resetUpload = () => {
    setFile(null);
    setPastedText('');
    setLinkedInUrl('');
    setPasteMode(false);
    setLinkedInMode(false);
    setAnalysis(null);
    setError(null);
    setOriginalCVText('');
    setTargetRole('');
    setTargetIndustry('');
    setShareableUrl(null);
    setRewrittenCV(null);
    setSavedResultToken(null);
    setShowSavedConfirmation(false);
    setLinkCopied(false);
  };

  // Copy recruiter link with feedback
  const copyRecruiterLink = () => {
    if (shareableUrl) {
      navigator.clipboard.writeText(shareableUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 3000);
    }
  };

  // Save results and show confirmation
  const handleSaveResults = () => {
    if (analysis && !savedResultToken) {
      const token = saveResultsWithToken(analysis);
      setSavedResultToken(token);
      setShareableUrl(`${window.location.origin}/upload?result=${token}`);
    }
    setShowSavedConfirmation(true);
    setTimeout(() => setShowSavedConfirmation(false), 5000);
  };

  // Get Rewritten CV
  const handleRewriteCV = async () => {
    if (!analysis || !originalCVText) return;

    setIsRewriting(true);
    try {
      const response = await fetch('/api/rewrite-cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalCV: originalCVText,
          analysis: analysis
        })
      });

      const data = await response.json();
      if (data.rewrittenCV) {
        setRewrittenCV(data.rewrittenCV);
        setShowRewriteModal(true);
      } else {
        alert('Failed to rewrite CV. Please try again.');
      }
    } catch (err) {
      console.error('Rewrite error:', err);
      alert('Failed to rewrite CV. Please try again.');
    } finally {
      setIsRewriting(false);
    }
  };

  // Download rewritten CV
  const downloadRewrittenCV = () => {
    if (!rewrittenCV) return;
    const blob = new Blob([rewrittenCV], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${analysis?.candidate_name || 'CV'}_Improved.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Copy rewritten CV
  const copyRewrittenCV = () => {
    if (!rewrittenCV) return;
    navigator.clipboard.writeText(rewrittenCV);
    alert('Rewritten CV copied to clipboard!');
  };

  // Sample report for demo
  const showSampleReport = () => {
    const sampleAnalysis: CVAnalysis = {
      candidate_name: "Thabo Mokoena",
      current_title: "Senior Software Developer",
      years_experience: 6,
      education_level: "BSc Computer Science (Wits) - Tier 1 SA University",
      overall_score: 82,
      score_explanation: "Strong technical foundation with excellent SA qualifications. Minor gaps in leadership evidence.",
      first_impression: "Experienced developer with solid Tier 1 education and Big 4 consulting background. The CV effectively communicates core competencies with quantified achievements.",
      sa_context_highlights: [
        "Wits University (Tier 1) - Globally ranked, signals academic excellence",
        "Investec experience - High-performance, entrepreneurial culture",
        "AWS Solutions Architect certification - Globally recognized"
      ],
      strengths: [
        {
          strength: "Full-Stack Expertise with Metrics",
          evidence: "\"Built and deployed 12 production applications handling 10K+ requests/min using React, Node.js, and PostgreSQL\"",
          impact: "Demonstrates end-to-end delivery capability valued by growing SA tech teams"
        },
        {
          strength: "Cloud & DevOps Skills",
          evidence: "\"AWS Certified Solutions Architect with hands-on Kubernetes experience managing R2M+ infrastructure\"",
          impact: "Modern infrastructure skills are in high demand - Takealot, Discovery, Luno all hiring for this"
        },
        {
          strength: "Fintech Domain Knowledge",
          evidence: "\"3 years at Investec Digital developing payment systems processing R50M monthly\"",
          impact: "Banking experience opens doors to SA's thriving fintech sector - RMB, Capitec, Yoco"
        }
      ],
      improvements: [
        {
          area: "Add Leadership Evidence",
          current_state: "Technical achievements shown, but no team leadership mentioned",
          suggestion: "Add: \"Led team of 4 developers\" or \"Mentored 2 junior developers through onboarding\" - SA companies want seniors who can grow teams",
          priority: "HIGH"
        },
        {
          area: "Quantify Business Impact",
          current_state: "Some metrics present, but business outcomes unclear",
          suggestion: "Add: \"Reduced fraud by 40% saving R2M annually\" or \"Improved checkout conversion by 15%\"",
          priority: "HIGH"
        },
        {
          area: "Add Professional Summary",
          current_state: "CV jumps straight into experience",
          suggestion: "Add 2-3 line summary at top: \"Senior full-stack developer with 6 years building payment systems. Investec and Standard Bank experience. Passionate about fintech innovation.\"",
          priority: "MEDIUM"
        }
      ],
      quick_wins: [
        "Add LinkedIn profile URL in header (recruiters check this first)",
        "Add 3 metrics to your top achievements (%, R-value, time saved)",
        "Include your GitHub profile if you have public projects"
      ],
      career_insights: {
        natural_fit_roles: [
          { role: "Tech Lead", match: 92 },
          { role: "Senior Full-Stack Developer", match: 95 },
          { role: "Solutions Architect", match: 85 }
        ],
        industries: ["Fintech", "E-commerce", "Banking", "Scale-up Tech"],
        trajectory_observation: "Ready for technical leadership roles. Consider targeting scale-ups like Yoco, Peach Payments, or enterprise fintechs like Investec Digital where you can grow into a CTO track.",
        salary_positioning: "Senior level - Market rate R85,000-R120,000/month"
      },
      ats_check: {
        likely_ats_friendly: true,
        issues: ["Could add more role-specific keywords for ATS matching"],
        recommendation: "Add keywords: 'microservices', 'CI/CD', 'agile scrum' to improve ATS score"
      },
      recruiter_view: {
        seven_second_impression: "Experienced fintech developer with strong SA tech background",
        standout_element: "Investec + AWS certification combo - signals enterprise-ready",
        red_flag_check: "None detected - good tenure, clear progression"
      },
      summary: "Thabo has a strong technical foundation with 6 years of full-stack experience and valuable fintech domain knowledge from Investec. The Wits education and AWS certification add credibility. To move from 82 to 90+, add evidence of team leadership and quantify business impact. Three specific fixes (leadership, business metrics, summary) could significantly improve interview rates."
    };
    setAnalysis(sampleAnalysis);
    setShareableUrl(`${window.location.origin}/upload?result=sample`);
    setError(null);
  };

  // Get headline based on score
  const getScoreHeadline = (score: number) => {
    if (score >= 90) return 'Outstanding CV - Top 10% of candidates';
    if (score >= 80) return 'Excellent CV - Ready to impress';
    if (score >= 70) return 'Strong foundation - Room to stand out';
    if (score >= 60) return 'Good start - A few tweaks will help';
    if (score >= 40) return 'Needs work - Let\'s improve together';
    return 'Major improvements needed';
  };

  // Count stats
  const strengthCount = analysis?.strengths?.length || 0;
  const improvementCount = analysis?.improvements?.length || 0;
  const highPriorityCount = analysis?.improvements?.filter(i => i.priority === 'HIGH').length || 0;

  // Show loading animation
  if (isAnalyzing) {
    return <AnalyzingAnimation step={analysisStep} />;
  }

  /* ============================================
     KILLER LANDING PAGE - Social Media Optimized
     ============================================ */
  if (!analysis) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#0F172A',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        {/* Gradient Background */}
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(ellipse at 20% 0%, rgba(79, 70, 229, 0.2) 0%, transparent 50%), radial-gradient(ellipse at 80% 100%, rgba(16, 185, 129, 0.15) 0%, transparent 50%)',
          pointerEvents: 'none'
        }} />

        {/* Header */}
        <header className="upload-header" style={{
          position: 'relative',
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          maxWidth: 1200,
          margin: '0 auto'
        }}>
          <Logo size={32} light />
          <a href="/" style={{
            color: 'rgba(255,255,255,0.7)',
            textDecoration: 'none',
            fontSize: '0.8rem',
            fontWeight: 500,
            padding: '8px 14px',
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            transition: 'all 0.2s ease'
          }}>
            For Employers →
          </a>
        </header>

        {/* Hero Section */}
        <section className="upload-hero" style={{
          position: 'relative',
          padding: '60px 24px 40px',
          textAlign: 'center',
          maxWidth: 800,
          margin: '0 auto'
        }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            backgroundColor: canUseFreeAssessment ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
            border: `1px solid ${canUseFreeAssessment ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
            borderRadius: 100,
            padding: '8px 16px',
            marginBottom: 24
          }}>
            <span style={{ color: canUseFreeAssessment ? '#10B981' : '#F59E0B', fontSize: '0.875rem', fontWeight: 600 }}>
              {canUseFreeAssessment ? `${b2cInfo.remaining} Free Assessment` : `R${UNLOCK_PRICE} per assessment`}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.3)' }}>|</span>
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem' }}>
              AI-Powered Analysis
            </span>
          </div>

          {/* Headline */}
          <h1 style={{
            fontSize: 'clamp(2.5rem, 6vw, 4rem)',
            fontWeight: 800,
            color: 'white',
            lineHeight: 1.1,
            marginBottom: 20,
            letterSpacing: '-0.03em'
          }}>
            Your CV gets{' '}
            <span style={{
              background: 'linear-gradient(135deg, #4F46E5, #7C3AED, #10B981)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              6 seconds
            </span>
            .<br />Make them count.
          </h1>

          {/* Subheadline */}
          <p style={{
            fontSize: '1.25rem',
            color: 'rgba(255,255,255,0.7)',
            lineHeight: 1.6,
            marginBottom: 40,
            maxWidth: 600,
            margin: '0 auto 40px'
          }}>
            Get ruthless, specific feedback on your CV. No generic advice - just
            actionable fixes that land interviews.
          </p>

          {/* Social Proof */}
          <div style={{ marginBottom: 48 }}>
            <SocialProof />
          </div>
        </section>

        {/* Upload Section - The Star of the Show */}
        <section style={{
          position: 'relative',
          maxWidth: 700,
          margin: '0 auto',
          padding: '0 24px 80px'
        }}>
          {/* Upload Card */}
          <div className="upload-card" style={{
            backgroundColor: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 24,
            padding: 32,
            backdropFilter: 'blur(10px)'
          }}>
            {/* Mode Tabs */}
            <div className="upload-tabs" style={{
              display: 'flex',
              gap: 8,
              marginBottom: 24,
              backgroundColor: 'rgba(255,255,255,0.05)',
              padding: 4,
              borderRadius: 12
            }}>
              {[
                { id: 'upload', label: 'Upload CV', icon: '📄' },
                { id: 'paste', label: 'Paste Text', icon: '📋' },
                { id: 'linkedin', label: 'LinkedIn', icon: '💼' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setPasteMode(tab.id === 'paste');
                    setLinkedInMode(tab.id === 'linkedin');
                    if (tab.id === 'upload') {
                      setPasteMode(false);
                      setLinkedInMode(false);
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    border: 'none',
                    borderRadius: 8,
                    backgroundColor: (tab.id === 'upload' && !pasteMode && !linkedInMode) ||
                                     (tab.id === 'paste' && pasteMode) ||
                                     (tab.id === 'linkedin' && linkedInMode)
                      ? 'rgba(79, 70, 229, 0.3)'
                      : 'transparent',
                    color: 'white',
                    fontSize: '0.9375rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    transition: 'all 0.2s ease'
                  }}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Upload Zone */}
            {!pasteMode && !linkedInMode && (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !file && document.getElementById('file-input')?.click()}
                style={{
                  background: isDragging
                    ? 'linear-gradient(135deg, rgba(79, 70, 229, 0.2), rgba(124, 58, 237, 0.2))'
                    : file
                    ? 'rgba(16, 185, 129, 0.1)'
                    : 'rgba(255,255,255,0.02)',
                  border: `2px dashed ${isDragging ? '#4F46E5' : file ? '#10B981' : 'rgba(255,255,255,0.2)'}`,
                  borderRadius: 16,
                  padding: file ? '24px' : '48px 24px',
                  textAlign: 'center',
                  cursor: file ? 'default' : 'pointer',
                  transition: 'all 0.3s ease',
                  transform: isDragging ? 'scale(1.02)' : 'scale(1)'
                }}
              >
                <input
                  id="file-input"
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />

                {!file ? (
                  <>
                    <div style={{
                      width: 80,
                      height: 80,
                      backgroundColor: 'rgba(79, 70, 229, 0.2)',
                      borderRadius: 20,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 24px'
                    }}>
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17 8 12 3 7 8"/>
                        <line x1="12" y1="3" x2="12" y2="15"/>
                      </svg>
                    </div>
                    <p style={{
                      fontSize: '1.25rem',
                      fontWeight: 600,
                      color: 'white',
                      marginBottom: 8
                    }}>
                      Drop your CV here
                    </p>
                    <p style={{
                      fontSize: '0.9375rem',
                      color: 'rgba(255,255,255,0.5)',
                      marginBottom: 4
                    }}>
                      or click to browse
                    </p>
                    <p style={{
                      fontSize: '0.8125rem',
                      color: 'rgba(255,255,255,0.3)'
                    }}>
                      PDF, Word, or plain text - Max 10MB
                    </p>
                  </>
                ) : (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{
                        width: 52,
                        height: 52,
                        backgroundColor: 'rgba(16, 185, 129, 0.2)',
                        borderRadius: 12,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      </div>
                      <div style={{ textAlign: 'left' }}>
                        <p style={{
                          fontSize: '1rem',
                          fontWeight: 600,
                          color: 'white',
                          margin: 0
                        }}>
                          {file.name}
                        </p>
                        <p style={{
                          fontSize: '0.875rem',
                          color: 'rgba(255,255,255,0.5)',
                          margin: 0
                        }}>
                          {(file.size / 1024).toFixed(0)} KB - Ready to analyze
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setFile(null); }}
                      style={{
                        background: 'rgba(255,255,255,0.1)',
                        border: 'none',
                        color: 'rgba(255,255,255,0.5)',
                        cursor: 'pointer',
                        padding: 8,
                        borderRadius: 8
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Paste Text Mode */}
            {pasteMode && (
              <div style={{
                backgroundColor: 'rgba(255,255,255,0.02)',
                border: '2px solid rgba(255,255,255,0.1)',
                borderRadius: 16,
                padding: 16
              }}>
                <textarea
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder="Paste your CV content here...

Copy-paste from LinkedIn, Word, or any document. We'll analyze the text and give you specific feedback."
                  style={{
                    width: '100%',
                    minHeight: 200,
                    border: 'none',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    fontSize: '0.9375rem',
                    color: 'white',
                    backgroundColor: 'transparent',
                    lineHeight: 1.6
                  }}
                />
                {pastedText.length > 0 && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: 12,
                    paddingTop: 12,
                    borderTop: '1px solid rgba(255,255,255,0.1)'
                  }}>
                    <span style={{
                      fontSize: '0.8125rem',
                      color: pastedText.length > 100 ? '#10B981' : 'rgba(255,255,255,0.4)'
                    }}>
                      {pastedText.length} characters
                      {pastedText.length > 100 && ' - Ready to analyze'}
                    </span>
                    <button
                      onClick={() => setPastedText('')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'rgba(255,255,255,0.4)',
                        fontSize: '0.8125rem',
                        cursor: 'pointer'
                      }}
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* LinkedIn Mode */}
            {linkedInMode && (
              <div style={{
                backgroundColor: 'rgba(255,255,255,0.02)',
                border: '2px solid rgba(255,255,255,0.1)',
                borderRadius: 16,
                padding: 24
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  marginBottom: 16
                }}>
                  <div style={{
                    width: 48,
                    height: 48,
                    backgroundColor: '#0A66C2',
                    borderRadius: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  </div>
                  <div>
                    <p style={{
                      fontSize: '1rem',
                      fontWeight: 600,
                      color: 'white',
                      margin: 0
                    }}>
                      Import from LinkedIn
                    </p>
                    <p style={{
                      fontSize: '0.8125rem',
                      color: 'rgba(255,255,255,0.5)',
                      margin: 0
                    }}>
                      Paste your LinkedIn profile URL
                    </p>
                  </div>
                </div>
                <input
                  type="url"
                  value={linkedInUrl}
                  onChange={(e) => setLinkedInUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/your-profile"
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: 10,
                    fontSize: '0.9375rem',
                    color: 'white',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    outline: 'none'
                  }}
                />
                <p style={{
                  fontSize: '0.75rem',
                  color: 'rgba(255,255,255,0.3)',
                  marginTop: 12,
                  marginBottom: 0
                }}>
                  Note: We'll extract public profile information. For best results, paste your CV text instead.
                </p>
              </div>
            )}

            {/* Role & Industry Selection */}
            <div className="role-industry-grid" style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 16,
              marginTop: 20
            }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.8125rem',
                  color: 'rgba(255,255,255,0.5)',
                  marginBottom: 8
                }}>
                  Target Role (optional)
                </label>
                <select
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: 10,
                    fontSize: '0.875rem',
                    color: 'white',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {TARGET_ROLES.map(role => (
                    <option key={role.value} value={role.value} style={{ backgroundColor: '#1E293B' }}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.8125rem',
                  color: 'rgba(255,255,255,0.5)',
                  marginBottom: 8
                }}>
                  Industry (optional)
                </label>
                <select
                  value={targetIndustry}
                  onChange={(e) => setTargetIndustry(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: 10,
                    fontSize: '0.875rem',
                    color: 'white',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {INDUSTRIES.map(ind => (
                    <option key={ind.value} value={ind.value} style={{ backgroundColor: '#1E293B' }}>
                      {ind.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 12,
                padding: 16,
                marginTop: 20,
                display: 'flex',
                alignItems: 'center',
                gap: 12
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span style={{ color: '#FCA5A5', fontSize: '0.9375rem' }}>{error}</span>
              </div>
            )}

            {/* CTA Button */}
            <button
              onClick={analyzeCV}
              disabled={!file && !pastedText && !linkedInUrl}
              style={{
                width: '100%',
                marginTop: 24,
                padding: '18px 32px',
                background: (file || pastedText || linkedInUrl)
                  ? 'linear-gradient(135deg, #4F46E5, #7C3AED)'
                  : 'rgba(255,255,255,0.1)',
                color: 'white',
                border: 'none',
                borderRadius: 14,
                fontSize: '1.125rem',
                fontWeight: 700,
                cursor: (file || pastedText || linkedInUrl) ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                transition: 'all 0.3s ease',
                boxShadow: (file || pastedText || linkedInUrl)
                  ? '0 8px 30px rgba(79, 70, 229, 0.4)'
                  : 'none'
              }}
            >
              {canUseFreeAssessment ? (
                <>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    <polyline points="9 12 11 14 15 10"/>
                  </svg>
                  Analyze My CV Free
                </>
              ) : (
                <>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  Unlock Assessment - R{UNLOCK_PRICE}
                </>
              )}
            </button>

            {/* Sample Link */}
            <div style={{
              textAlign: 'center',
              marginTop: 16
            }}>
              <button
                onClick={showSampleReport}
                data-sample-btn
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255,255,255,0.5)',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  textUnderlineOffset: 4
                }}
              >
                See a sample report first
              </button>
            </div>
          </div>

          {/* Trust Indicators */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 32,
            marginTop: 32,
            flexWrap: 'wrap'
          }}>
            {[
              { icon: '🔒', text: 'Your data stays private' },
              { icon: '🇿🇦', text: 'Built for SA market' },
              { icon: '⚡', text: 'Results in 30 seconds' }
            ].map((item, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                color: 'rgba(255,255,255,0.4)',
                fontSize: '0.8125rem'
              }}>
                <span>{item.icon}</span>
                {item.text}
              </div>
            ))}
          </div>
        </section>

        {/* Features Section */}
        <section style={{
          position: 'relative',
          padding: '80px 24px',
          backgroundColor: 'rgba(255,255,255,0.02)'
        }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <h2 style={{
              fontSize: '2rem',
              fontWeight: 700,
              color: 'white',
              textAlign: 'center',
              marginBottom: 48
            }}>
              What you'll get
            </h2>

            <div className="features-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 24
            }}>
              {[
                {
                  icon: '📊',
                  title: 'Honest Score',
                  description: 'No sugarcoating. See exactly how your CV compares to top performers in SA.'
                },
                {
                  icon: '🎯',
                  title: 'Specific Fixes',
                  description: 'Not "add more details" - actual examples like "Add: Reduced costs by 30%"'
                },
                {
                  icon: '💼',
                  title: 'Role Matching',
                  description: 'See which roles match your experience and what salary range to expect.'
                },
                {
                  icon: '🤖',
                  title: 'ATS Check',
                  description: 'Will your CV pass automated screening? We check formatting and keywords.'
                },
                {
                  icon: '⏱️',
                  title: '7-Second Test',
                  description: 'See what a recruiter sees in their first glance. Make those seconds count.'
                },
                {
                  icon: '🇿🇦',
                  title: 'SA Context',
                  description: 'We know CA(SA), Big 4, Investec, UCT. Local expertise, not generic AI.'
                }
              ].map((feature, i) => (
                <div key={i} style={{
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 16,
                  padding: 24
                }}>
                  <div style={{
                    width: 48,
                    height: 48,
                    backgroundColor: 'rgba(79, 70, 229, 0.2)',
                    borderRadius: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16,
                    fontSize: '1.5rem'
                  }}>
                    {feature.icon}
                  </div>
                  <h3 style={{
                    fontSize: '1.125rem',
                    fontWeight: 600,
                    color: 'white',
                    marginBottom: 8
                  }}>
                    {feature.title}
                  </h3>
                  <p style={{
                    fontSize: '0.9375rem',
                    color: 'rgba(255,255,255,0.6)',
                    lineHeight: 1.5,
                    margin: 0
                  }}>
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <TestimonialsSection />

        {/* Footer */}
        <footer style={{
          position: 'relative',
          padding: '32px 24px',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          textAlign: 'center'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            marginBottom: 12
          }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              backgroundColor: '#4F46E5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 700,
              fontSize: '0.75rem'
            }}>
              SR
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'white' }}>
                Built by Simon Rubin
              </div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
                Cape Town, South Africa
              </div>
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' }}>
            <a href="/privacy" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none', marginRight: 16 }}>Privacy</a>
            <a href="/terms" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none', marginRight: 16 }}>Terms</a>
            <a href="mailto:simon@hireinbox.co.za" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>Contact</a>
          </div>
          <div style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.2)', marginTop: 16 }}>
            2024 HireInbox. All rights reserved.
          </div>
        </footer>

        {/* Upgrade Prompt Modal */}
        <UpgradePrompt tier="b2c" isOpen={showUnlockModal} onClose={() => setShowUnlockModal(false)} />

        {/* Responsive Styles */}
        <style>{`
          @media (max-width: 768px) {
            .grid-3 { grid-template-columns: 1fr !important; }
            .features-grid { grid-template-columns: 1fr !important; gap: 16px !important; }
            .testimonials-grid { grid-template-columns: 1fr !important; gap: 16px !important; }
            .role-industry-grid { grid-template-columns: 1fr !important; }
            .upload-hero { padding: 40px 16px 32px !important; }
            .upload-hero h1 { font-size: 2rem !important; line-height: 1.2 !important; }
            .upload-card { padding: 20px !important; margin: 0 16px !important; }
            .upload-zone { padding: 32px 16px !important; }
            .upload-tabs { flex-direction: column !important; gap: 8px !important; }
            .upload-tabs button { width: 100% !important; min-height: 48px !important; }
            .upload-header { flex-direction: column !important; gap: 12px !important; padding: 12px 16px !important; }
            .upload-header a { min-height: 44px !important; }
          }
          @media (max-width: 480px) {
            .upload-card { padding: 16px !important; }
            .upload-hero h1 { font-size: 1.75rem !important; }
            .upload-hero p { font-size: 1rem !important; }
          }
        `}</style>
      </div>
    );
  }

  /* ============================================
     RESULTS VIEW - World-Class Analysis Display
     ============================================ */
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#F8FAFC',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header */}
      <header style={{
        backgroundColor: 'white',
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid #E2E8F0'
      }}>
        <div style={{ cursor: 'pointer' }} onClick={resetUpload}>
          <Logo size={32} />
        </div>
        <div className="header-buttons" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {/* Save My Results Button */}
          <button
            onClick={handleSaveResults}
            style={{
              backgroundColor: savedResultToken ? '#10B981' : '#0F172A',
              color: 'white',
              border: 'none',
              padding: '10px 16px',
              borderRadius: 8,
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.2s ease'
            }}
          >
            {savedResultToken ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Saved
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                  <polyline points="17 21 17 13 7 13 7 21"/>
                  <polyline points="7 3 7 8 15 8"/>
                </svg>
                Save Results
              </>
            )}
          </button>
          {/* Share with Recruiter Button */}
          <button
            onClick={copyRecruiterLink}
            style={{
              backgroundColor: linkCopied ? '#10B981' : '#4F46E5',
              color: 'white',
              border: 'none',
              padding: '10px 16px',
              borderRadius: 8,
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.2s ease'
            }}
          >
            {linkCopied ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Link Copied!
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                </svg>
                Share with Recruiter
              </>
            )}
          </button>
          <button
            onClick={downloadPDFReport}
            style={{
              backgroundColor: 'white',
              color: '#0F172A',
              border: '1px solid #E2E8F0',
              padding: '10px 16px',
              borderRadius: 8,
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            PDF
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="results-grid" style={{
        maxWidth: 1100,
        margin: '0 auto',
        padding: '40px 24px',
        display: 'grid',
        gridTemplateColumns: '1fr 340px',
        gap: 32
      }}>
        {/* Left Column - Main Results */}
        <div>
          {/* Score Card */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: 20,
            padding: 32,
            marginBottom: 24,
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
          }}>
            <div className="score-card-flex" style={{ display: 'flex', gap: 32, alignItems: 'flex-start' }}>
              <CircularScore score={analysis.overall_score} />
              <div style={{ flex: 1 }}>
                <h1 style={{
                  fontSize: '1.75rem',
                  fontWeight: 700,
                  color: '#0F172A',
                  marginBottom: 12,
                  lineHeight: 1.2
                }}>
                  {getScoreHeadline(analysis.overall_score)}
                </h1>
                <p style={{
                  fontSize: '1rem',
                  color: '#64748B',
                  lineHeight: 1.6,
                  marginBottom: 20
                }}>
                  {analysis.first_impression}
                </p>

                {/* Quick Stats */}
                <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    backgroundColor: '#F0FDF4',
                    padding: '8px 14px',
                    borderRadius: 8
                  }}>
                    <span style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: '#10B981'
                    }} />
                    <span style={{ fontSize: '0.875rem', color: '#059669', fontWeight: 600 }}>
                      {strengthCount} Strengths
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    backgroundColor: '#FEF3C7',
                    padding: '8px 14px',
                    borderRadius: 8
                  }}>
                    <span style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: '#F59E0B'
                    }} />
                    <span style={{ fontSize: '0.875rem', color: '#D97706', fontWeight: 600 }}>
                      {improvementCount} Improvements
                    </span>
                  </div>
                  {highPriorityCount > 0 && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      backgroundColor: '#FEE2E2',
                      padding: '8px 14px',
                      borderRadius: 8
                    }}>
                      <span style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: '#EF4444'
                      }} />
                      <span style={{ fontSize: '0.875rem', color: '#DC2626', fontWeight: 600 }}>
                        {highPriorityCount} High Priority
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* SA Context Highlights */}
          {analysis.sa_context_highlights && analysis.sa_context_highlights.length > 0 && (
            <div style={{
              backgroundColor: '#EFF6FF',
              borderRadius: 16,
              padding: 20,
              marginBottom: 24,
              border: '1px solid #DBEAFE'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 12
              }}>
                <span style={{ fontSize: '1.25rem' }}>🇿🇦</span>
                <span style={{
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: '#1E40AF',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  SA Context Highlights
                </span>
              </div>
              {analysis.sa_context_highlights.map((highlight, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  marginBottom: i < analysis.sa_context_highlights!.length - 1 ? 10 : 0
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2.5" style={{ marginTop: 2, flexShrink: 0 }}>
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  <span style={{ fontSize: '0.9375rem', color: '#1E40AF', lineHeight: 1.5 }}>
                    {highlight}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Top Improvements */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: 20,
            padding: 32,
            marginBottom: 24,
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
          }}>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              color: '#0F172A',
              marginBottom: 24,
              display: 'flex',
              alignItems: 'center',
              gap: 10
            }}>
              <span style={{
                width: 32,
                height: 32,
                backgroundColor: '#FEF3C7',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1rem'
              }}>
                🎯
              </span>
              Top Improvements
            </h2>

            {analysis.improvements.slice(0, 5).map((imp, i) => (
              <div key={i} style={{
                padding: '20px 0',
                borderBottom: i < Math.min(4, analysis.improvements.length - 1) ? '1px solid #F1F5F9' : 'none'
              }}>
                <div style={{ display: 'flex', gap: 16 }}>
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    backgroundColor: imp.priority === 'HIGH' ? '#EF4444' : imp.priority === 'MEDIUM' ? '#F59E0B' : '#4F46E5',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    flexShrink: 0
                  }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: 8
                    }}>
                      <h3 style={{
                        fontSize: '1rem',
                        fontWeight: 600,
                        color: '#0F172A',
                        margin: 0
                      }}>
                        {imp.area}
                      </h3>
                      <span style={{
                        fontSize: '0.6875rem',
                        fontWeight: 600,
                        color: imp.priority === 'HIGH' ? '#DC2626' : imp.priority === 'MEDIUM' ? '#D97706' : '#4F46E5',
                        backgroundColor: imp.priority === 'HIGH' ? '#FEE2E2' : imp.priority === 'MEDIUM' ? '#FEF3C7' : '#EEF2FF',
                        padding: '4px 8px',
                        borderRadius: 4,
                        textTransform: 'uppercase'
                      }}>
                        {imp.priority}
                      </span>
                    </div>
                    <p style={{
                      fontSize: '0.9375rem',
                      color: '#64748B',
                      lineHeight: 1.6,
                      margin: 0
                    }}>
                      {imp.suggestion}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Strengths */}
          {analysis.strengths.length > 0 && (
            <div style={{
              backgroundColor: 'white',
              borderRadius: 20,
              padding: 32,
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
            }}>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                color: '#0F172A',
                marginBottom: 24,
                display: 'flex',
                alignItems: 'center',
                gap: 10
              }}>
                <span style={{
                  width: 32,
                  height: 32,
                  backgroundColor: '#D1FAE5',
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1rem'
                }}>
                  ✨
                </span>
                Your Strengths
              </h2>

              {analysis.strengths.map((s, i) => (
                <div key={i} style={{
                  backgroundColor: '#F0FDF4',
                  borderRadius: 12,
                  padding: 20,
                  marginBottom: i < analysis.strengths.length - 1 ? 16 : 0,
                  borderLeft: '4px solid #10B981'
                }}>
                  <h3 style={{
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: '#0F172A',
                    marginBottom: 8
                  }}>
                    {s.strength}
                  </h3>
                  <p style={{
                    fontSize: '0.9375rem',
                    color: '#64748B',
                    fontStyle: 'italic',
                    marginBottom: 8,
                    lineHeight: 1.5
                  }}>
                    "{s.evidence}"
                  </p>
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#059669',
                    margin: 0,
                    fontWeight: 500
                  }}>
                    {s.impact}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Your Next Steps - Actionable Card */}
          <div style={{
            background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
            borderRadius: 20,
            padding: 32,
            marginTop: 24,
            color: 'white'
          }}>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              marginBottom: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 10
            }}>
              <span style={{
                width: 32,
                height: 32,
                background: 'linear-gradient(135deg, #10B981, #059669)',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1rem'
              }}>
                ✓
              </span>
              Your Next Steps
            </h2>
            <p style={{
              fontSize: '0.9375rem',
              color: 'rgba(255,255,255,0.7)',
              marginBottom: 24,
              lineHeight: 1.6
            }}>
              Take action now to improve your interview chances
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Step 1 */}
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 16,
                padding: 16,
                backgroundColor: 'rgba(255,255,255,0.05)',
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.1)'
              }}>
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  backgroundColor: '#4F46E5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  flexShrink: 0
                }}>1</div>
                <div>
                  <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: 4 }}>
                    Fix High-Priority Issues First
                  </h4>
                  <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.6)', margin: 0, lineHeight: 1.5 }}>
                    {highPriorityCount > 0
                      ? `Address the ${highPriorityCount} high-priority improvement${highPriorityCount > 1 ? 's' : ''} above - these have the biggest impact on your interview rate.`
                      : 'Great news! You have no high-priority issues. Focus on the medium priority items for extra polish.'}
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 16,
                padding: 16,
                backgroundColor: 'rgba(255,255,255,0.05)',
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.1)'
              }}>
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  backgroundColor: '#4F46E5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  flexShrink: 0
                }}>2</div>
                <div>
                  <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: 4 }}>
                    Use Our AI CV Rewriter
                  </h4>
                  <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.6)', margin: 0, lineHeight: 1.5 }}>
                    Click &quot;Get AI-Rewritten CV&quot; in the sidebar to get an improved version implementing all suggestions.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 16,
                padding: 16,
                backgroundColor: 'rgba(255,255,255,0.05)',
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.1)'
              }}>
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  backgroundColor: '#4F46E5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  flexShrink: 0
                }}>3</div>
                <div>
                  <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: 4 }}>
                    Share with a Recruiter
                  </h4>
                  <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.6)', margin: 0, lineHeight: 1.5 }}>
                    Use the &quot;Share with Recruiter&quot; button to send your verified analysis. Shows you&apos;re proactive about self-improvement.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 16,
                padding: 16,
                backgroundColor: 'rgba(255,255,255,0.05)',
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.1)'
              }}>
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  backgroundColor: '#10B981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  flexShrink: 0
                }}>4</div>
                <div>
                  <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: 4 }}>
                    Prepare for Interviews
                  </h4>
                  <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.6)', margin: 0, lineHeight: 1.5 }}>
                    Use our Interview Question Coach to practice common questions with personalized tips based on your CV.
                  </p>
                </div>
              </div>
            </div>

            {/* Save results reminder */}
            {!savedResultToken && (
              <div style={{
                marginTop: 20,
                padding: 16,
                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                borderRadius: 12,
                border: '1px solid rgba(245, 158, 11, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: 12
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <div>
                  <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#F59E0B', margin: 0 }}>
                    Don&apos;t lose your results!
                  </p>
                  <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.6)', margin: 0 }}>
                    Click &quot;Save Results&quot; above to access this analysis anytime.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div>
          {/* Career Insights Card */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: 16,
            padding: 24,
            marginBottom: 20,
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
          }}>
            <h3 style={{
              fontSize: '1rem',
              fontWeight: 700,
              color: '#0F172A',
              marginBottom: 20,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              </svg>
              Best-Fit Roles
            </h3>

            {Array.isArray(analysis.career_insights?.natural_fit_roles) && analysis.career_insights.natural_fit_roles.map((role, i) => {
              const roleData = typeof role === 'object' ? role : { role, match: 80 - i * 5 };
              return (
                <div key={i} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 0',
                  borderBottom: i < analysis.career_insights.natural_fit_roles.length - 1 ? '1px solid #F1F5F9' : 'none'
                }}>
                  <span style={{ fontSize: '0.9375rem', color: '#0F172A' }}>{roleData.role}</span>
                  <span style={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: roleData.match >= 90 ? '#10B981' : roleData.match >= 80 ? '#4F46E5' : '#F59E0B'
                  }}>
                    {roleData.match}% match
                  </span>
                </div>
              );
            })}

            {analysis.career_insights?.salary_positioning && (
              <div style={{
                marginTop: 16,
                padding: 12,
                backgroundColor: '#F0FDF4',
                borderRadius: 8
              }}>
                <p style={{
                  fontSize: '0.8125rem',
                  color: '#059669',
                  fontWeight: 500,
                  margin: 0
                }}>
                  {analysis.career_insights.salary_positioning}
                </p>
              </div>
            )}
          </div>

          {/* Quick Wins */}
          {analysis.quick_wins && analysis.quick_wins.length > 0 && (
            <div style={{
              backgroundColor: '#4F46E5',
              borderRadius: 16,
              padding: 24,
              marginBottom: 20,
              color: 'white'
            }}>
              <h3 style={{
                fontSize: '1rem',
                fontWeight: 700,
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                <span>⚡</span>
                Quick Wins (5-min fixes)
              </h3>

              {analysis.quick_wins.slice(0, 3).map((win, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  marginBottom: i < 2 ? 12 : 0
                }}>
                  <div style={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    flexShrink: 0
                  }}>
                    {i + 1}
                  </div>
                  <p style={{
                    fontSize: '0.875rem',
                    lineHeight: 1.5,
                    margin: 0,
                    opacity: 0.95
                  }}>
                    {win}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* ATS Check */}
          {analysis.ats_check && (
            <div style={{
              backgroundColor: 'white',
              borderRadius: 16,
              padding: 24,
              marginBottom: 20,
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
            }}>
              <h3 style={{
                fontSize: '1rem',
                fontWeight: 700,
                color: '#0F172A',
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                <span>🤖</span>
                ATS Compatibility
              </h3>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 12
              }}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  backgroundColor: analysis.ats_check.likely_ats_friendly ? '#D1FAE5' : '#FEE2E2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {analysis.ats_check.likely_ats_friendly ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  )}
                </div>
                <span style={{
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  color: analysis.ats_check.likely_ats_friendly ? '#059669' : '#DC2626'
                }}>
                  {analysis.ats_check.likely_ats_friendly ? 'ATS Friendly' : 'ATS Issues Detected'}
                </span>
              </div>

              {analysis.ats_check.recommendation && (
                <p style={{
                  fontSize: '0.875rem',
                  color: '#64748B',
                  lineHeight: 1.5,
                  margin: 0
                }}>
                  {analysis.ats_check.recommendation}
                </p>
              )}
            </div>
          )}

          {/* GET INTERVIEW READY - Power tools for job seekers */}
          <div style={{
            backgroundColor: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
            background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
            borderRadius: 16,
            padding: 24,
            marginBottom: 20,
            color: 'white'
          }}>
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: 700,
              marginBottom: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <span style={{ fontSize: '1.25rem' }}>🚀</span>
              Get Interview Ready
            </h3>
            <p style={{
              fontSize: '0.875rem',
              opacity: 0.9,
              marginBottom: 16,
              lineHeight: 1.5
            }}>
              Give yourself the best chance. Tools that career coaches charge thousands for - free for you.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Get Rewritten CV Button */}
              <button
                onClick={handleRewriteCV}
                disabled={isRewriting}
                style={{
                  width: '100%',
                  padding: '14px 20px',
                  backgroundColor: 'white',
                  color: '#4F46E5',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  cursor: isRewriting ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  opacity: isRewriting ? 0.7 : 1
                }}
              >
                {isRewriting ? (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
                      <circle cx="12" cy="12" r="10" stroke="#4F46E5" strokeWidth="3" fill="none" strokeDasharray="60" strokeLinecap="round"/>
                    </svg>
                    AI Rewriting Your CV...
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                    Get AI-Rewritten CV
                  </>
                )}
              </button>

              {/* Video Practice Button */}
              <button
                onClick={() => setShowVideoModal(true)}
                style={{
                  width: '100%',
                  padding: '14px 20px',
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: 10,
                  fontSize: '0.9375rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="23 7 16 12 23 17 23 7"/>
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                </svg>
                Practice Video Interview
              </button>

              {/* Interview Coach Button */}
              <button
                onClick={() => setShowInterviewCoach(true)}
                style={{
                  width: '100%',
                  padding: '14px 20px',
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: 10,
                  fontSize: '0.9375rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                Interview Question Coach
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button
              onClick={resetUpload}
              style={{
                width: '100%',
                padding: '14px 20px',
                backgroundColor: '#0F172A',
                color: 'white',
                border: 'none',
                borderRadius: 10,
                fontSize: '0.9375rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              Analyze Another CV
            </button>

            <button
              onClick={() => setShowEmailModal(true)}
              style={{
                width: '100%',
                padding: '14px 20px',
                backgroundColor: 'white',
                color: '#0F172A',
                border: '1px solid #E2E8F0',
                borderRadius: 10,
                fontSize: '0.9375rem',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              Email Results
            </button>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: 20,
            padding: 32,
            maxWidth: 480,
            width: '90%'
          }}>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              marginBottom: 16
            }}>
              Share Your Results
            </h3>
            <p style={{
              fontSize: '0.9375rem',
              color: '#64748B',
              marginBottom: 20
            }}>
              Copy this link to share your CV analysis with others.
            </p>

            <div style={{
              display: 'flex',
              gap: 8,
              marginBottom: 24
            }}>
              <input
                type="text"
                value={shareableUrl || ''}
                readOnly
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  border: '1px solid #E2E8F0',
                  borderRadius: 8,
                  fontSize: '0.875rem'
                }}
              />
              <button
                onClick={copyShareableLink}
                style={{
                  padding: '12px 20px',
                  backgroundColor: '#4F46E5',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Copy
              </button>
            </div>

            <div style={{
              display: 'flex',
              gap: 12,
              justifyContent: 'center'
            }}>
              <button
                onClick={() => {
                  window.open(`https://wa.me/?text=${encodeURIComponent(`Check out my CV analysis: ${shareableUrl}`)}`, '_blank');
                }}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#25D366',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                WhatsApp
              </button>
              <button
                onClick={() => {
                  window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareableUrl || '')}`, '_blank');
                }}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#0A66C2',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                LinkedIn
              </button>
            </div>

            <button
              onClick={() => setShowShareModal(false)}
              style={{
                width: '100%',
                marginTop: 20,
                padding: '12px',
                backgroundColor: '#F1F5F9',
                color: '#64748B',
                border: 'none',
                borderRadius: 8,
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Email Modal */}
      {showEmailModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: 20,
            padding: 32,
            maxWidth: 420,
            width: '90%'
          }}>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              marginBottom: 16
            }}>
              Email Your Results
            </h3>
            <p style={{
              fontSize: '0.9375rem',
              color: '#64748B',
              marginBottom: 20
            }}>
              We'll send a detailed PDF report to your email.
            </p>

            <input
              type="email"
              value={emailForResults}
              onChange={(e) => setEmailForResults(e.target.value)}
              placeholder="your.email@example.com"
              style={{
                width: '100%',
                padding: '14px 16px',
                border: '1px solid #E2E8F0',
                borderRadius: 10,
                fontSize: '0.9375rem',
                marginBottom: 20
              }}
            />

            <button
              onClick={sendResultsToEmail}
              disabled={!emailForResults}
              style={{
                width: '100%',
                padding: '14px',
                backgroundColor: emailForResults ? '#4F46E5' : '#E2E8F0',
                color: emailForResults ? 'white' : '#94A3B8',
                border: 'none',
                borderRadius: 10,
                fontSize: '0.9375rem',
                fontWeight: 600,
                cursor: emailForResults ? 'pointer' : 'not-allowed',
                marginBottom: 12
              }}
            >
              Send Report
            </button>

            <button
              onClick={() => setShowEmailModal(false)}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#F1F5F9',
                color: '#64748B',
                border: 'none',
                borderRadius: 8,
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* CV Rewrite Modal */}
      {showRewriteModal && rewrittenCV && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 20
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: 16,
            padding: 24,
            width: '100%',
            maxWidth: 700,
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>
                  Your Improved CV
                </h2>
                <p style={{ fontSize: '0.875rem', color: '#64748B' }}>
                  AI-rewritten to maximize your interview chances
                </p>
              </div>
              <button
                onClick={() => setShowRewriteModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8 }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div style={{
              backgroundColor: '#F8FAFC',
              borderRadius: 12,
              padding: 20,
              marginBottom: 20,
              whiteSpace: 'pre-wrap',
              fontFamily: 'monospace',
              fontSize: '0.8125rem',
              lineHeight: 1.6,
              maxHeight: 400,
              overflow: 'auto',
              border: '1px solid #E2E8F0'
            }}>
              {rewrittenCV}
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={downloadRewrittenCV}
                style={{
                  flex: 1,
                  padding: '14px 20px',
                  backgroundColor: '#4F46E5',
                  color: 'white',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Download CV
              </button>
              <button
                onClick={copyRewrittenCV}
                style={{
                  flex: 1,
                  padding: '14px 20px',
                  backgroundColor: 'white',
                  color: '#0F172A',
                  border: '1px solid #E2E8F0',
                  borderRadius: 10,
                  fontSize: '0.9375rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
                Copy to Clipboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Practice Modal - LIVE */}
      {showVideoModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 20
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: 16,
            padding: 24,
            width: '100%',
            maxWidth: 700,
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0F172A' }}>
                Video Interview Practice
              </h2>
              <button
                onClick={() => {
                  if (streamRef.current) {
                    streamRef.current.getTracks().forEach(t => t.stop());
                    streamRef.current = null;
                  }
                  setShowVideoModal(false);
                  setVideoFile(null);
                  setVideoAnalysis(null);
                  setVideoError(null);
                  setIsRecordingVideo(false);
                }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8 }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {!videoAnalysis ? (
              <>
                <p style={{ fontSize: '0.9rem', color: '#64748B', marginBottom: 16 }}>
                  Record yourself answering: <strong>"Tell me about yourself"</strong> (30-60 seconds)
                </p>

                {/* Video Preview */}
                <div style={{
                  backgroundColor: '#0F172A',
                  borderRadius: 12,
                  overflow: 'hidden',
                  marginBottom: 16,
                  aspectRatio: '16/9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {videoFile ? (
                    <video
                      src={URL.createObjectURL(videoFile)}
                      controls
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <video
                      ref={videoRef}
                      autoPlay
                      muted
                      playsInline
                      style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
                    />
                  )}
                </div>

                {videoError && (
                  <div style={{ backgroundColor: '#FEF2F2', color: '#DC2626', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: '0.875rem' }}>
                    {videoError}
                  </div>
                )}

                {/* Recording Controls */}
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 16 }}>
                  {!isRecordingVideo && !videoFile && (
                    <button
                      onClick={async () => {
                        try {
                          setVideoError(null);
                          setRecordingTime(0);
                          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                          streamRef.current = stream;
                          if (videoRef.current) {
                            videoRef.current.srcObject = stream;
                          }
                          chunksRef.current = [];
                          const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
                          mediaRecorderRef.current = mediaRecorder;
                          mediaRecorder.ondataavailable = (e) => {
                            if (e.data.size > 0) chunksRef.current.push(e.data);
                          };
                          mediaRecorder.onstop = () => {
                            const blob = new Blob(chunksRef.current, { type: 'video/webm' });
                            setVideoFile(new File([blob], 'video.webm', { type: 'video/webm' }));
                            stream.getTracks().forEach(t => t.stop());
                            if (recordingTimerRef.current) {
                              clearInterval(recordingTimerRef.current);
                              recordingTimerRef.current = null;
                            }
                          };
                          mediaRecorder.start();
                          setIsRecordingVideo(true);
                          // Start timer
                          recordingTimerRef.current = setInterval(() => {
                            setRecordingTime(t => t + 1);
                          }, 1000);
                        } catch (err) {
                          setVideoError('Camera access denied. Please allow camera permissions.');
                        }
                      }}
                      style={{
                        padding: '12px 24px',
                        backgroundColor: '#DC2626',
                        color: 'white',
                        border: 'none',
                        borderRadius: 10,
                        fontSize: '0.9375rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8
                      }}
                    >
                      <div style={{ width: 12, height: 12, backgroundColor: 'white', borderRadius: '50%' }} />
                      Start Recording
                    </button>
                  )}

                  {isRecordingVideo && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                      {/* Recording Timer */}
                      <div style={{
                        fontSize: '2rem',
                        fontWeight: 700,
                        color: recordingTime >= 30 && recordingTime <= 60 ? '#059669' : recordingTime > 60 ? '#DC2626' : '#0F172A',
                        fontFamily: 'monospace',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8
                      }}>
                        <div style={{ width: 12, height: 12, backgroundColor: '#DC2626', borderRadius: '50%', animation: 'pulse 1s infinite' }} />
                        {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: recordingTime >= 30 && recordingTime <= 60 ? '#059669' : '#64748B' }}>
                        {recordingTime < 30 ? `${30 - recordingTime}s until minimum` : recordingTime <= 60 ? '✓ Good length! Stop when ready' : 'Consider stopping soon'}
                      </div>
                      <button
                        onClick={() => {
                          if (mediaRecorderRef.current) {
                            mediaRecorderRef.current.stop();
                            setIsRecordingVideo(false);
                            if (recordingTimerRef.current) {
                              clearInterval(recordingTimerRef.current);
                              recordingTimerRef.current = null;
                            }
                          }
                        }}
                        style={{
                          padding: '12px 24px',
                          backgroundColor: '#0F172A',
                          color: 'white',
                          border: 'none',
                          borderRadius: 10,
                          fontSize: '0.9375rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        ■ Stop Recording
                      </button>
                    </div>
                  )}

                  {videoFile && !isAnalyzingVideo && (
                    <>
                      <button
                        onClick={() => { setVideoFile(null); setVideoError(null); }}
                        style={{
                          padding: '12px 24px',
                          backgroundColor: '#F1F5F9',
                          color: '#475569',
                          border: 'none',
                          borderRadius: 10,
                          fontSize: '0.9375rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Re-record
                      </button>
                      <button
                        onClick={async () => {
                          setIsAnalyzingVideo(true);
                          setVideoError(null);
                          try {
                            const formData = new FormData();
                            formData.append('video', videoFile);
                            formData.append('question', 'Tell me about yourself');
                            if (analysis && (analysis as any).cv_text) formData.append('cv_context', String((analysis as any).cv_text).substring(0, 2000));

                            const res = await fetch('/api/analyze-video', { method: 'POST', body: formData });
                            const data = await res.json();

                            if (data.success && data.analysis) {
                              setVideoAnalysis(data.analysis);
                            } else {
                              setVideoError(data.error || 'Analysis failed. Please try again.');
                            }
                          } catch (err) {
                            setVideoError('Failed to analyze video. Please try again.');
                          }
                          setIsAnalyzingVideo(false);
                        }}
                        style={{
                          padding: '12px 24px',
                          backgroundColor: '#4F46E5',
                          color: 'white',
                          border: 'none',
                          borderRadius: 10,
                          fontSize: '0.9375rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Analyze My Video
                      </button>
                    </>
                  )}
                </div>

                {isAnalyzingVideo && (
                  <div style={{ textAlign: 'center', padding: 24 }}>
                    <div style={{ width: 48, height: 48, border: '4px solid #E2E8F0', borderTopColor: '#4F46E5', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
                    <p style={{ color: '#64748B' }}>Analyzing your presentation...</p>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }`}</style>
                  </div>
                )}
              </>
            ) : (
              /* Video Analysis Results */
              <div>
                <div style={{ backgroundColor: '#F0FDF4', borderRadius: 12, padding: 16, marginBottom: 16, textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#059669' }}>{videoAnalysis.overall_score || videoAnalysis.scores?.overall || 75}/100</div>
                  <div style={{ fontSize: '0.875rem', color: '#065F46' }}>Presentation Score</div>
                </div>

                {videoAnalysis.strengths && videoAnalysis.strengths.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#059669', marginBottom: 8 }}>What you did well:</h4>
                    <ul style={{ margin: 0, paddingLeft: 20, color: '#374151', fontSize: '0.875rem' }}>
                      {videoAnalysis.strengths.slice(0, 4).map((s: any, i: number) => (
                        <li key={i} style={{ marginBottom: 4 }}>{typeof s === 'string' ? s : s.point || s.label}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {videoAnalysis.improvements && videoAnalysis.improvements.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#DC2626', marginBottom: 8 }}>Areas to improve:</h4>
                    <ul style={{ margin: 0, paddingLeft: 20, color: '#374151', fontSize: '0.875rem' }}>
                      {videoAnalysis.improvements.slice(0, 4).map((s: any, i: number) => (
                        <li key={i} style={{ marginBottom: 4 }}>{typeof s === 'string' ? s : s.point || s.suggestion}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {videoAnalysis.coach_feedback && (
                  <div style={{ backgroundColor: '#EEF2FF', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#4F46E5', marginBottom: 8 }}>Coach Feedback:</h4>
                    <p style={{ color: '#374151', fontSize: '0.875rem', margin: 0 }}>{videoAnalysis.coach_feedback}</p>
                  </div>
                )}

                <button
                  onClick={() => { setVideoAnalysis(null); setVideoFile(null); }}
                  style={{
                    width: '100%',
                    padding: '14px 20px',
                    backgroundColor: '#4F46E5',
                    color: 'white',
                    border: 'none',
                    borderRadius: 10,
                    fontSize: '0.9375rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Practice Again
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Interview Coach Modal */}
      {showInterviewCoach && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 20
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: 16,
            padding: 24,
            width: '100%',
            maxWidth: 600,
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0F172A' }}>
                Interview Question Coach
              </h2>
              <button
                onClick={() => setShowInterviewCoach(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8 }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <p style={{ fontSize: '0.9375rem', color: '#64748B', marginBottom: 20 }}>
              Based on your CV, here are the questions you should prepare for:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { q: "Tell me about yourself", tip: "Focus on your professional journey, not personal life. Use: Present → Past → Future structure." },
                { q: "Why do you want this role?", tip: "Connect your skills and experience to what the company needs. Show you've researched them." },
                { q: "What's your biggest achievement?", tip: "Use STAR method: Situation, Task, Action, Result. Include numbers if possible." },
                { q: "Describe a challenge you overcame", tip: "Choose a real work challenge. Focus on what YOU did and what you learned." },
                { q: "Where do you see yourself in 5 years?", tip: "Show ambition but be realistic. Connect your growth to the company's success." },
                { q: "Why should we hire you?", tip: "Summarize your unique value. What can you do that others can't?" },
                { q: "What are your salary expectations?", tip: "Research market rates first. Give a range, not a single number." },
                { q: "Do you have any questions for us?", tip: "Always say yes! Ask about team culture, growth opportunities, or current challenges." }
              ].map((item, i) => (
                <div key={i} style={{
                  backgroundColor: '#F8FAFC',
                  borderRadius: 12,
                  padding: 16,
                  borderLeft: '4px solid #4F46E5'
                }}>
                  <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#0F172A', marginBottom: 8 }}>
                    {i + 1}. {item.q}
                  </h4>
                  <p style={{ fontSize: '0.8125rem', color: '#64748B', lineHeight: 1.5, margin: 0 }}>
                    <strong style={{ color: '#059669' }}>Tip:</strong> {item.tip}
                  </p>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowInterviewCoach(false)}
              style={{
                width: '100%',
                padding: '14px 20px',
                backgroundColor: '#4F46E5',
                color: 'white',
                border: 'none',
                borderRadius: 10,
                fontSize: '0.9375rem',
                fontWeight: 600,
                cursor: 'pointer',
                marginTop: 20
              }}
            >
              I&apos;m Ready for My Interview!
            </button>
          </div>
        </div>
      )}

      {/* Save Confirmation Toast */}
      {showSavedConfirmation && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#10B981',
          color: 'white',
          padding: '16px 24px',
          borderRadius: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
          zIndex: 1001,
          animation: 'slideUp 0.3s ease-out'
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <div>
            <p style={{ fontWeight: 600, margin: 0, marginBottom: 2 }}>Results Saved!</p>
            <p style={{ fontSize: '0.8125rem', opacity: 0.9, margin: 0 }}>
              Access anytime at this link (saved for 30 days)
            </p>
          </div>
        </div>
      )}

      {/* Animation Styles */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideUp {
          from { transform: translateX(-50%) translateY(100px); opacity: 0; }
          to { transform: translateX(-50%) translateY(0); opacity: 1; }
        }
        .spin-icon { animation: spin 1s linear infinite; }
        @media (max-width: 768px) {
          .results-grid { grid-template-columns: 1fr !important; padding: 20px 16px !important; }
          .score-card-flex { flex-direction: column !important; gap: 20px !important; align-items: center !important; text-align: center !important; }
          .header-buttons { flex-wrap: wrap !important; gap: 6px !important; justify-content: flex-end !important; }
          .header-buttons button { padding: 8px 12px !important; font-size: 0.75rem !important; }
        }
        @media (max-width: 480px) {
          .header-buttons button { padding: 6px 10px !important; font-size: 0.7rem !important; }
          .header-buttons button svg { width: 14px !important; height: 14px !important; }
        }
      `}</style>
    </div>
  );
}

// Main Page Component with Suspense
export default function UploadPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0F172A'
      }}>
        <div style={{ color: 'white', fontSize: '1rem' }}>Loading...</div>
      </div>
    }>
      <UploadPageContent />
    </Suspense>
  );
}
