/**
 * HIREINBOX PRICING CONSTANTS
 *
 * Central source of truth for all pricing across the application.
 *
 * PRICING PHILOSOPHY:
 * - HireInbox is an AI Hiring Utility, NOT a marketplace
 * - We charge PER ROLE, not per CV
 * - Employers don't control CV volume, so per-CV pricing is unfair
 * - Per-role pricing is predictable and feels fair
 *
 * Last Updated: January 2026
 * Pricing Strategist: RALPH #5
 */

// ============================================
// B2B PRICING - PER ROLE MODEL
// ============================================

export const B2B_PRICING = {
  // Base product: AI CV Screening
  CV_SCREENING: {
    id: 'cv-screening',
    name: 'AI CV Screening',
    description: 'Up to 200 CVs for one role, AI ranking & scoring, shortlist generation, acknowledgment emails',
    price: 1750, // R1,750 per role
    priceDisplay: 'R1,750',
    unit: 'per role',
    includes: [
      'Up to 200 CVs per role',
      'AI-powered ranking & scoring',
      'Automatic shortlist generation',
      'Candidate acknowledgment emails',
      'Evidence-based decision reports',
      'POPIA-compliant audit trail',
    ],
  },

  // Add-on: AI Interview
  AI_INTERVIEW: {
    id: 'ai-interview',
    name: 'AI Interview',
    description: 'Avatar conducts screening interview, transcript & scoring, psychometric assessment',
    price: 799, // R799 per role
    priceDisplay: 'R799',
    unit: 'per role',
    includes: [
      'AI avatar screening interviews',
      'Full interview transcripts',
      'Candidate scoring & ranking',
      'Psychometric assessment',
      'Interview highlights summary',
    ],
  },

  // Add-on: Verification Bundle
  VERIFICATION_BUNDLE: {
    id: 'verification-bundle',
    name: 'Verification Bundle',
    description: 'ID check, credit check, reference verification for top candidates',
    price: 800, // R800 per role
    priceDisplay: 'R800',
    unit: 'per role',
    includes: [
      'ID verification',
      'Credit check',
      'Reference verification',
      'Verification report',
    ],
  },

  // A-la-carte verification services
  VERIFICATION_INDIVIDUAL: {
    ID_CHECK: {
      id: 'id-check',
      name: 'ID Verification',
      price: 50, // R50 per candidate
      priceDisplay: 'R50',
      unit: 'per candidate',
    },
    CREDIT_CHECK: {
      id: 'credit-check',
      name: 'Credit Check',
      price: 100, // R100 per candidate
      priceDisplay: 'R100',
      unit: 'per candidate',
    },
    REFERENCE_CHECK: {
      id: 'reference-check',
      name: 'Reference Check',
      price: 200, // R200 per candidate
      priceDisplay: 'R200',
      unit: 'per candidate',
    },
  },

  // Talent Mapping (for recruiters)
  TALENT_MAPPING: {
    id: 'talent-mapping',
    name: 'Talent Mapping',
    description: 'AI searches company pages, news, conferences - find candidates your competitors miss',
    price: 999, // R999 per search
    priceDisplay: 'R999',
    unit: 'per search',
    includes: [
      'Multi-source web intelligence',
      'Company team page searches',
      'Conference & event attendees',
      'News & award mentions',
      'Approach strategy for each candidate',
    ],
  },

  // Bulk discounts for agencies & high-volume hirers
  BULK_DISCOUNTS: [
    { minRoles: 1, maxRoles: 4, discount: 0, pricePerRole: 1750 },
    { minRoles: 5, maxRoles: 9, discount: 0.10, pricePerRole: 1575 },
    { minRoles: 10, maxRoles: 19, discount: 0.15, pricePerRole: 1488 },
    { minRoles: 20, maxRoles: Infinity, discount: 0.20, pricePerRole: 1400 },
  ],

  // Phase 2: Job Listings
  JOB_LISTING: {
    id: 'job-listing',
    name: 'Job Listing',
    description: 'Post job publicly on HireInbox + all Phase 1 features',
    price: 2500, // R2,500 per listing
    priceDisplay: 'R2,500',
    unit: 'per listing',
    phase: 2,
  },

  // Phase 3: Subscription Plans
  SUBSCRIPTIONS: {
    STARTER: {
      id: 'sub-starter',
      name: 'Starter',
      price: 5000, // R5,000/month
      priceDisplay: 'R5,000',
      unit: 'per month',
      activeRoles: 3,
      includes: ['3 active roles', 'All add-ons included'],
      phase: 3,
    },
    GROWTH: {
      id: 'sub-growth',
      name: 'Growth',
      price: 10000, // R10,000/month
      priceDisplay: 'R10,000',
      unit: 'per month',
      activeRoles: 10,
      includes: ['10 active roles', 'All add-ons included', 'Priority support'],
      phase: 3,
    },
    ENTERPRISE: {
      id: 'sub-enterprise',
      name: 'Enterprise',
      price: 15000, // R15,000/month
      priceDisplay: 'R15,000',
      unit: 'per month',
      activeRoles: -1, // Unlimited
      includes: ['Unlimited roles', 'Dedicated account manager', 'API access'],
      phase: 3,
    },
  },

  // Boutique AI Agent
  BOUTIQUE_AI_AGENT: {
    id: 'boutique-ai',
    name: 'Boutique AI Agent',
    description: 'Custom-trained AI for specific company',
    price: 20000, // R20,000/month
    priceDisplay: 'R20,000',
    unit: 'per month',
  },
} as const;

// ============================================
// B2C PRICING - JOB SEEKERS
// ============================================

// ============================================
// TALENT POOL PRICING
// ============================================

export const TALENT_POOL_PRICING = {
  CANDIDATE_JOIN: {
    id: 'tp-candidate',
    name: 'Join Talent Pool',
    price: 0,
    priceDisplay: 'FREE',
    description: 'Get discovered by employers actively hiring',
  },
  EMPLOYER_POST_JOB: {
    id: 'tp-employer-post',
    name: 'Post Job to Talent Pool',
    price: 2500, // R2,500 per listing
    priceDisplay: 'R2,500',
    unit: 'per listing',
    description: 'Post a role and get matched with pre-screened candidates',
  },
} as const;

// ============================================
// B2C PRICING - JOB SEEKERS
// ============================================

export const B2C_PRICING = {
  // Free tier
  FREE_CV_SCAN: {
    id: 'free-cv-scan',
    name: 'CV Scan',
    price: 0,
    priceDisplay: 'FREE',
    limit: 1, // 1 free scan per user
    includes: [
      'AI-powered CV analysis',
      'Strength highlights',
      'Improvement tips',
      'ATS compatibility check',
    ],
  },

  FREE_CV_REWRITE: {
    id: 'free-cv-rewrite',
    name: 'CV Rewrite',
    price: 0,
    priceDisplay: 'FREE',
    limit: 1, // 1 free rewrite per user
    includes: [
      'AI rewrites your CV professionally',
      'Optimized formatting',
      'Keyword optimization',
    ],
  },

  // Paid features
  VIDEO_ANALYSIS: {
    id: 'video-analysis',
    name: 'Video Analysis',
    description: 'How do I come across on camera?',
    priceRange: { min: 99, max: 199 },
    priceDisplay: 'R99-R199',
    includes: [
      'AI analysis of your video presence',
      'Body language feedback',
      'Speaking pace and clarity',
      'Improvement suggestions',
    ],
  },

  AI_AVATAR_COACHING: {
    id: 'ai-coaching',
    name: 'AI Avatar Coaching',
    description: 'Practice interviews with AI',
    priceRange: { min: 149, max: 299 },
    priceDisplay: 'R149-R299',
    includes: [
      'Mock interviews with AI avatar',
      'Real-time feedback',
      'Industry-specific questions',
      'Performance scoring',
    ],
  },

  POSITION_SPECIFIC_PREP: {
    id: 'position-prep',
    name: 'Position-Specific Prep',
    description: 'What does this employer want?',
    price: 199,
    priceDisplay: 'R199',
    includes: [
      'Company-specific insights',
      'Role requirement analysis',
      'Interview preparation tips',
      'Expected questions',
    ],
  },

  VIDEO_PITCH: {
    id: 'video-pitch',
    name: 'Video Pitch',
    description: 'Create video pitch for applications',
    price: 149,
    priceDisplay: 'R149',
    includes: [
      'Script assistance',
      'Recording guidance',
      'AI feedback on delivery',
      'Multiple takes allowed',
    ],
  },
} as const;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Calculate bulk discount price for a given number of roles
 */
export function getBulkPrice(roleCount: number): { pricePerRole: number; discount: number; totalPrice: number } {
  const tier = B2B_PRICING.BULK_DISCOUNTS.find(
    d => roleCount >= d.minRoles && roleCount <= d.maxRoles
  ) || B2B_PRICING.BULK_DISCOUNTS[0];

  return {
    pricePerRole: tier.pricePerRole,
    discount: tier.discount,
    totalPrice: tier.pricePerRole * roleCount,
  };
}

/**
 * Format price in Rands
 */
export function formatPrice(amount: number): string {
  return `R${amount.toLocaleString('en-ZA')}`;
}

/**
 * Calculate package total for common bundles
 */
export function calculatePackagePrice(options: {
  cvScreening?: boolean;
  aiInterview?: boolean;
  verificationBundle?: boolean;
  roleCount?: number;
}): { items: string[]; total: number } {
  const items: string[] = [];
  let total = 0;
  const roleCount = options.roleCount || 1;

  if (options.cvScreening !== false) {
    // CV Screening is always included by default
    const { pricePerRole } = getBulkPrice(roleCount);
    items.push(`AI CV Screening (${roleCount} role${roleCount > 1 ? 's' : ''}) @ ${formatPrice(pricePerRole)}`);
    total += pricePerRole * roleCount;
  }

  if (options.aiInterview) {
    items.push(`AI Interview @ ${B2B_PRICING.AI_INTERVIEW.priceDisplay}/role`);
    total += B2B_PRICING.AI_INTERVIEW.price * roleCount;
  }

  if (options.verificationBundle) {
    items.push(`Verification Bundle @ ${B2B_PRICING.VERIFICATION_BUNDLE.priceDisplay}/role`);
    total += B2B_PRICING.VERIFICATION_BUNDLE.price * roleCount;
  }

  return { items, total };
}

// ============================================
// PRICING RATIONALE (for documentation)
// ============================================

export const PRICING_RATIONALE = {
  perRoleModel: {
    reason: 'Employers cannot control CV volume - charging per-CV is unfair',
    benefit: 'Predictable costs, no usage anxiety',
    value: 'R1,750 for 200 CVs = R8.75/CV effective rate',
  },

  roiCalculation: {
    traditionalTimePerCV: '10-15 minutes',
    cvsPerRole: '100-200 (average)',
    hoursSaved: '17-50 hours per role',
    hrCostPerHour: 'R100-150',
    moneySaved: 'R1,700-7,500 per role',
    roi: '1x-4x return on first use',
  },

  competitiveAdvantage: {
    vsTalentGenie: 'We are 40% cheaper for high-volume roles',
    vsJobCrystal: 'We are 90% cheaper than % of salary model',
    vsPnet: 'We include AI screening, they charge extra',
    vsIndeed: 'Fixed cost vs unpredictable CPC/CPA',
  },

  addOnPhilosophy: {
    principle: 'Add-ons enhance, they do not gate essential features',
    baseIsComplete: 'CV Screening works perfectly standalone',
    feelsFair: 'No bait-and-switch, no essential features behind paywall',
  },
} as const;

// ============================================
// LEGACY COMPATIBILITY
// For transitioning from old per-CV model
// ============================================

export const LEGACY_PRICING = {
  // Old B2B subscription model (deprecated)
  OLD_STARTER: { price: 299, cvLimit: 100 },
  OLD_PRO: { price: 999, cvLimit: -1 },

  // Old B2C per-analysis (deprecated)
  OLD_SINGLE_ANALYSIS: { price: 29 },
} as const;
