'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';

// ============================================
// Usage Context - Track free tier assessments
// MVP: localStorage, upgradeable to Supabase
// ============================================

// Tier configurations
export const TIER_LIMITS = {
  b2b: {
    free: 10,
    name: 'B2B Employer',
    upgradePrice: 'R299/month',
    upgradeUrl: '/pricing?plan=b2b-starter'
  },
  b2c: {
    free: 1,
    name: 'Job Seeker',
    upgradePrice: 'R29 per CV',
    upgradeUrl: '/pricing?plan=b2c-single'
  }
} as const;

type TierType = 'b2b' | 'b2c';

interface UsageData {
  b2b: {
    used: number;
    lastReset: string | null;
    isPaid: boolean;
    paidUntil: string | null;
    totalPurchased: number; // For pay-per-use
  };
  b2c: {
    used: number;
    lastReset: string | null;
    isPaid: boolean;
    paidUntil: string | null;
    totalPurchased: number;
  };
}

interface UsageContextType {
  usage: UsageData;
  loading: boolean;

  // Get remaining assessments for a tier
  getRemaining: (tier: TierType) => number;

  // Check if can perform assessment
  canUseAssessment: (tier: TierType) => boolean;

  // Record an assessment use
  useAssessment: (tier: TierType) => boolean;

  // Check if user has exhausted free tier
  isExhausted: (tier: TierType) => boolean;

  // Get tier info
  getTierInfo: (tier: TierType) => {
    used: number;
    limit: number;
    remaining: number;
    percentUsed: number;
    isPaid: boolean;
  };

  // Add purchased assessments (after payment)
  addPurchasedAssessments: (tier: TierType, count: number) => void;

  // Set paid status (for subscriptions)
  setPaidStatus: (tier: TierType, isPaid: boolean, paidUntil?: string) => void;

  // Reset usage (admin/testing)
  resetUsage: (tier?: TierType) => void;
}

const STORAGE_KEY = 'hireinbox_usage';

const defaultUsage: UsageData = {
  b2b: {
    used: 0,
    lastReset: null,
    isPaid: false,
    paidUntil: null,
    totalPurchased: 0
  },
  b2c: {
    used: 0,
    lastReset: null,
    isPaid: false,
    paidUntil: null,
    totalPurchased: 0
  }
};

const UsageContext = createContext<UsageContextType | undefined>(undefined);

export function UsageProvider({ children }: { children: ReactNode }) {
  const [usage, setUsage] = useState<UsageData>(defaultUsage);
  const [loading, setLoading] = useState(true);

  // Load usage from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setUsage(prev => ({
          ...prev,
          ...parsed,
          b2b: { ...prev.b2b, ...parsed.b2b },
          b2c: { ...prev.b2c, ...parsed.b2c }
        }));
      }
    } catch (error) {
      console.error('[Usage] Failed to load usage data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Save usage to localStorage whenever it changes
  useEffect(() => {
    if (!loading) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(usage));
      } catch (error) {
        console.error('[Usage] Failed to save usage data:', error);
      }
    }
  }, [usage, loading]);

  // Get remaining assessments for a tier
  const getRemaining = useCallback((tier: TierType): number => {
    const tierData = usage[tier];
    const limit = TIER_LIMITS[tier].free;

    // If paid user with subscription, unlimited (return high number)
    if (tierData.isPaid && tierData.paidUntil) {
      const paidUntil = new Date(tierData.paidUntil);
      if (paidUntil > new Date()) {
        return 999;
      }
    }

    // Calculate based on free limit + purchased
    const totalAvailable = limit + tierData.totalPurchased;
    return Math.max(0, totalAvailable - tierData.used);
  }, [usage]);

  // Check if can perform assessment
  const canUseAssessment = useCallback((tier: TierType): boolean => {
    return getRemaining(tier) > 0;
  }, [getRemaining]);

  // Record an assessment use
  const useAssessment = useCallback((tier: TierType): boolean => {
    if (!canUseAssessment(tier)) {
      return false;
    }

    setUsage(prev => ({
      ...prev,
      [tier]: {
        ...prev[tier],
        used: prev[tier].used + 1
      }
    }));

    console.log(`[Usage] ${tier} assessment used. Remaining: ${getRemaining(tier) - 1}`);
    return true;
  }, [canUseAssessment, getRemaining]);

  // Check if user has exhausted free tier
  const isExhausted = useCallback((tier: TierType): boolean => {
    return getRemaining(tier) <= 0;
  }, [getRemaining]);

  // Get tier info
  const getTierInfo = useCallback((tier: TierType) => {
    const tierData = usage[tier];
    const limit = TIER_LIMITS[tier].free + tierData.totalPurchased;
    const remaining = getRemaining(tier);

    return {
      used: tierData.used,
      limit,
      remaining,
      percentUsed: limit > 0 ? Math.round((tierData.used / limit) * 100) : 0,
      isPaid: tierData.isPaid
    };
  }, [usage, getRemaining]);

  // Add purchased assessments (after payment)
  const addPurchasedAssessments = useCallback((tier: TierType, count: number) => {
    setUsage(prev => ({
      ...prev,
      [tier]: {
        ...prev[tier],
        totalPurchased: prev[tier].totalPurchased + count
      }
    }));
    console.log(`[Usage] Added ${count} purchased assessments to ${tier}`);
  }, []);

  // Set paid status (for subscriptions)
  const setPaidStatus = useCallback((tier: TierType, isPaid: boolean, paidUntil?: string) => {
    setUsage(prev => ({
      ...prev,
      [tier]: {
        ...prev[tier],
        isPaid,
        paidUntil: paidUntil || null
      }
    }));
    console.log(`[Usage] Set ${tier} paid status: ${isPaid}`);
  }, []);

  // Reset usage (admin/testing)
  const resetUsage = useCallback((tier?: TierType) => {
    if (tier) {
      setUsage(prev => ({
        ...prev,
        [tier]: {
          used: 0,
          lastReset: new Date().toISOString(),
          isPaid: false,
          paidUntil: null,
          totalPurchased: 0
        }
      }));
    } else {
      setUsage(defaultUsage);
    }
    console.log(`[Usage] Reset usage${tier ? ` for ${tier}` : ' for all tiers'}`);
  }, []);

  const value: UsageContextType = {
    usage,
    loading,
    getRemaining,
    canUseAssessment,
    useAssessment,
    isExhausted,
    getTierInfo,
    addPurchasedAssessments,
    setPaidStatus,
    resetUsage
  };

  return (
    <UsageContext.Provider value={value}>
      {children}
    </UsageContext.Provider>
  );
}

// Custom hook to use usage context
export function useUsage() {
  const context = useContext(UsageContext);
  if (context === undefined) {
    throw new Error('useUsage must be used within a UsageProvider');
  }
  return context;
}

// ============================================
// UI Components for Usage Display
// ============================================

interface UsageBadgeProps {
  tier: TierType;
  showUpgrade?: boolean;
  compact?: boolean;
}

export function UsageBadge({ tier, showUpgrade = true, compact = false }: UsageBadgeProps) {
  const { getTierInfo, isExhausted, loading } = useUsage();

  if (loading) {
    return null;
  }

  const info = getTierInfo(tier);
  const exhausted = isExhausted(tier);
  const tierConfig = TIER_LIMITS[tier];

  const bgColor = exhausted ? '#FEF2F2' : info.percentUsed > 70 ? '#FEF3C7' : '#F0FDF4';
  const textColor = exhausted ? '#991B1B' : info.percentUsed > 70 ? '#92400E' : '#166534';
  const borderColor = exhausted ? '#FECACA' : info.percentUsed > 70 ? '#FDE68A' : '#BBF7D0';

  if (compact) {
    return (
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 10px',
        backgroundColor: bgColor,
        border: `1px solid ${borderColor}`,
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: 600,
        color: textColor
      }}>
        <span>{info.remaining}</span>
        <span style={{ opacity: 0.7 }}>left</span>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '10px 16px',
      backgroundColor: bgColor,
      border: `1px solid ${borderColor}`,
      borderRadius: '10px'
    }}>
      <div style={{ flex: 1 }}>
        <div style={{
          fontSize: '0.75rem',
          color: textColor,
          opacity: 0.8,
          marginBottom: '2px'
        }}>
          Free Assessments
        </div>
        <div style={{
          fontSize: '0.9375rem',
          fontWeight: 600,
          color: textColor
        }}>
          {info.remaining} of {info.limit} remaining
        </div>
        {/* Progress bar */}
        <div style={{
          marginTop: '6px',
          height: '4px',
          backgroundColor: `${textColor}20`,
          borderRadius: '2px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${Math.min(info.percentUsed, 100)}%`,
            height: '100%',
            backgroundColor: textColor,
            borderRadius: '2px',
            transition: 'width 0.3s ease'
          }} />
        </div>
      </div>

      {showUpgrade && exhausted && (
        <a
          href={tierConfig.upgradeUrl}
          style={{
            padding: '8px 14px',
            backgroundColor: '#4F46E5',
            color: 'white',
            borderRadius: '8px',
            fontSize: '0.8125rem',
            fontWeight: 600,
            textDecoration: 'none',
            whiteSpace: 'nowrap',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#4338CA';
            e.currentTarget.style.transform = 'scale(1.02)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = '#4F46E5';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          Upgrade
        </a>
      )}
    </div>
  );
}

// Upgrade Prompt Modal
interface UpgradePromptProps {
  tier: TierType;
  isOpen: boolean;
  onClose: () => void;
}

export function UpgradePrompt({ tier, isOpen, onClose }: UpgradePromptProps) {
  if (!isOpen) return null;

  const tierConfig = TIER_LIMITS[tier];
  const isB2B = tier === 'b2b';

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '32px',
        maxWidth: '440px',
        width: '100%',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
        animation: 'slideUp 0.3s ease'
      }}>
        <style>{`
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>

        {/* Icon */}
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: '#EEF2FF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '20px'
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
          </svg>
        </div>

        {/* Title */}
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: 700,
          color: '#0F172A',
          marginBottom: '12px'
        }}>
          {isB2B ? 'Upgrade to Screen More CVs' : 'Get More CV Analyses'}
        </h2>

        {/* Description */}
        <p style={{
          fontSize: '0.9375rem',
          color: '#64748B',
          lineHeight: 1.6,
          marginBottom: '24px'
        }}>
          {isB2B
            ? `You've used all ${TIER_LIMITS.b2b.free} free CV screenings. Upgrade to our Starter plan for unlimited screening and advanced features.`
            : `You've used your free CV analysis. Purchase additional analyses to keep improving your CV.`
          }
        </p>

        {/* Benefits */}
        <div style={{
          backgroundColor: '#F8FAFC',
          borderRadius: '10px',
          padding: '16px',
          marginBottom: '24px'
        }}>
          <div style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            color: '#64748B',
            marginBottom: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            {isB2B ? 'Starter Plan Includes:' : 'Each Analysis Includes:'}
          </div>
          <ul style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            {isB2B ? (
              <>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#334155', fontSize: '0.875rem' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#10B981"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                  Unlimited CV screenings
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#334155', fontSize: '0.875rem' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#10B981"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                  Bulk email inbox scanning
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#334155', fontSize: '0.875rem' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#10B981"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                  Candidate notes and tags
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#334155', fontSize: '0.875rem' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#10B981"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                  Priority support
                </li>
              </>
            ) : (
              <>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#334155', fontSize: '0.875rem' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#10B981"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                  Detailed strength analysis
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#334155', fontSize: '0.875rem' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#10B981"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                  Improvement suggestions
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#334155', fontSize: '0.875rem' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#10B981"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                  ATS compatibility check
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#334155', fontSize: '0.875rem' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#10B981"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                  Career insights
                </li>
              </>
            )}
          </ul>
        </div>

        {/* Price */}
        <div style={{
          textAlign: 'center',
          marginBottom: '24px'
        }}>
          <div style={{
            fontSize: '2rem',
            fontWeight: 700,
            color: '#0F172A'
          }}>
            {tierConfig.upgradePrice}
          </div>
          {isB2B && (
            <div style={{ fontSize: '0.875rem', color: '#64748B' }}>
              Cancel anytime
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '12px 20px',
              backgroundColor: '#F1F5F9',
              border: 'none',
              borderRadius: '10px',
              fontSize: '0.9375rem',
              fontWeight: 600,
              color: '#475569',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#E2E8F0'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#F1F5F9'}
          >
            Maybe Later
          </button>
          <a
            href={tierConfig.upgradeUrl}
            style={{
              flex: 1,
              padding: '12px 20px',
              backgroundColor: '#4F46E5',
              border: 'none',
              borderRadius: '10px',
              fontSize: '0.9375rem',
              fontWeight: 600,
              color: 'white',
              cursor: 'pointer',
              textDecoration: 'none',
              textAlign: 'center',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#4338CA';
              e.currentTarget.style.transform = 'scale(1.02)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#4F46E5';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            Upgrade Now
          </a>
        </div>
      </div>
    </div>
  );
}
