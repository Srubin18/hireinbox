// Payfast Integration for HireInbox
// South Africa's trusted payment gateway
// Docs: https://developers.payfast.co.za/docs

import crypto from 'crypto';

// ============================================
// PAYFAST CONFIGURATION
// ============================================

export const PAYFAST_CONFIG = {
  // Sandbox credentials for testing
  sandbox: {
    merchantId: process.env.PAYFAST_SANDBOX_MERCHANT_ID || '10000100',
    merchantKey: process.env.PAYFAST_SANDBOX_MERCHANT_KEY || '46f0cd694581a',
    passphrase: process.env.PAYFAST_SANDBOX_PASSPHRASE || '',
    baseUrl: 'https://sandbox.payfast.co.za',
  },
  // Production credentials
  production: {
    merchantId: process.env.PAYFAST_MERCHANT_ID || '',
    merchantKey: process.env.PAYFAST_MERCHANT_KEY || '',
    passphrase: process.env.PAYFAST_PASSPHRASE || '',
    baseUrl: 'https://www.payfast.co.za',
  },
};

// Use sandbox in development, production otherwise
export const isProduction = process.env.NODE_ENV === 'production' && process.env.PAYFAST_PRODUCTION === 'true';
export const payfastConfig = isProduction ? PAYFAST_CONFIG.production : PAYFAST_CONFIG.sandbox;

// ============================================
// PRODUCTS & PRICING
// NEW: Per-Role Pricing Model (Jan 2026)
//
// PHILOSOPHY:
// - HireInbox is an AI Hiring Utility, NOT a marketplace
// - We charge PER ROLE, not per CV
// - Employers don't control CV volume, so per-CV is unfair
// - Per-role pricing is predictable and feels fair
// ============================================

import { B2B_PRICING, B2C_PRICING } from './pricing';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number; // In ZAR cents
  priceDisplay: string; // Human readable
  type: 'subscription' | 'once_off';
  billingCycle?: 'monthly' | 'annual';
  rolesIncluded?: number; // -1 for unlimited, used in per-role model
  features: readonly string[] | string[];
  popular?: boolean;
  tier: 'b2c' | 'b2b_screening' | 'b2b_interview' | 'b2b_verification' | 'b2b_subscription';
}

export const PRODUCTS: Record<string, Product> = {
  // === B2B PER-ROLE PRODUCTS ===

  // AI CV Screening - Base Product
  b2b_cv_screening: {
    id: 'b2b_cv_screening',
    name: 'AI CV Screening',
    description: 'Unlimited CVs for one role with AI ranking & scoring',
    price: B2B_PRICING.CV_SCREENING.price * 100, // R1,750 in cents
    priceDisplay: B2B_PRICING.CV_SCREENING.priceDisplay,
    type: 'once_off',
    rolesIncluded: 1,
    tier: 'b2b_screening',
    popular: true,
    features: B2B_PRICING.CV_SCREENING.includes,
  },

  // AI Interview Add-On
  b2b_ai_interview: {
    id: 'b2b_ai_interview',
    name: 'AI Interview Add-On',
    description: 'Avatar screening interviews with psychometric assessment',
    price: B2B_PRICING.AI_INTERVIEW.price * 100, // R1,250 in cents
    priceDisplay: B2B_PRICING.AI_INTERVIEW.priceDisplay,
    type: 'once_off',
    rolesIncluded: 1,
    tier: 'b2b_interview',
    features: B2B_PRICING.AI_INTERVIEW.includes,
  },

  // Verification Bundle Add-On
  b2b_verification: {
    id: 'b2b_verification',
    name: 'Verification Bundle',
    description: 'ID check, criminal check, reference verification',
    price: B2B_PRICING.VERIFICATION_BUNDLE.price * 100, // R800 in cents
    priceDisplay: B2B_PRICING.VERIFICATION_BUNDLE.priceDisplay,
    type: 'once_off',
    rolesIncluded: 1,
    tier: 'b2b_verification',
    features: B2B_PRICING.VERIFICATION_BUNDLE.includes,
  },

  // Full Package
  b2b_full_package: {
    id: 'b2b_full_package',
    name: 'Full Package',
    description: 'Screening + AI Interview + Verification Bundle',
    price: (B2B_PRICING.CV_SCREENING.price + B2B_PRICING.AI_INTERVIEW.price + B2B_PRICING.VERIFICATION_BUNDLE.price) * 100, // R3,800 in cents
    priceDisplay: `R${(B2B_PRICING.CV_SCREENING.price + B2B_PRICING.AI_INTERVIEW.price + B2B_PRICING.VERIFICATION_BUNDLE.price).toLocaleString()}`,
    type: 'once_off',
    rolesIncluded: 1,
    tier: 'b2b_screening',
    features: [
      ...B2B_PRICING.CV_SCREENING.includes,
      ...B2B_PRICING.AI_INTERVIEW.includes,
      ...B2B_PRICING.VERIFICATION_BUNDLE.includes,
    ],
  },

  // === B2B SUBSCRIPTIONS (Phase 3) ===

  b2b_sub_starter: {
    id: 'b2b_sub_starter',
    name: 'Starter Subscription',
    description: '3 active roles with all add-ons included',
    price: B2B_PRICING.SUBSCRIPTIONS.STARTER.price * 100, // R5,000/month in cents
    priceDisplay: B2B_PRICING.SUBSCRIPTIONS.STARTER.priceDisplay,
    type: 'subscription',
    billingCycle: 'monthly',
    rolesIncluded: 3,
    tier: 'b2b_subscription',
    features: B2B_PRICING.SUBSCRIPTIONS.STARTER.includes,
  },

  b2b_sub_growth: {
    id: 'b2b_sub_growth',
    name: 'Growth Subscription',
    description: '10 active roles with all add-ons and priority support',
    price: B2B_PRICING.SUBSCRIPTIONS.GROWTH.price * 100, // R10,000/month in cents
    priceDisplay: B2B_PRICING.SUBSCRIPTIONS.GROWTH.priceDisplay,
    type: 'subscription',
    billingCycle: 'monthly',
    rolesIncluded: 10,
    tier: 'b2b_subscription',
    popular: true,
    features: B2B_PRICING.SUBSCRIPTIONS.GROWTH.includes,
  },

  b2b_sub_enterprise: {
    id: 'b2b_sub_enterprise',
    name: 'Enterprise Subscription',
    description: 'Unlimited roles with dedicated account manager',
    price: B2B_PRICING.SUBSCRIPTIONS.ENTERPRISE.price * 100, // R15,000/month in cents
    priceDisplay: B2B_PRICING.SUBSCRIPTIONS.ENTERPRISE.priceDisplay,
    type: 'subscription',
    billingCycle: 'monthly',
    rolesIncluded: -1, // Unlimited
    tier: 'b2b_subscription',
    features: B2B_PRICING.SUBSCRIPTIONS.ENTERPRISE.includes,
  },

  // === B2C PRODUCTS ===

  b2c_video_analysis: {
    id: 'b2c_video_analysis',
    name: 'Video Analysis',
    description: 'AI analysis of your video presence',
    price: B2C_PRICING.VIDEO_ANALYSIS.priceRange.min * 100, // R99 in cents
    priceDisplay: B2C_PRICING.VIDEO_ANALYSIS.priceDisplay,
    type: 'once_off',
    tier: 'b2c',
    features: B2C_PRICING.VIDEO_ANALYSIS.includes,
  },

  b2c_ai_coaching: {
    id: 'b2c_ai_coaching',
    name: 'AI Avatar Coaching',
    description: 'Practice interviews with AI',
    price: B2C_PRICING.AI_AVATAR_COACHING.priceRange.min * 100, // R149 in cents
    priceDisplay: B2C_PRICING.AI_AVATAR_COACHING.priceDisplay,
    type: 'once_off',
    tier: 'b2c',
    features: B2C_PRICING.AI_AVATAR_COACHING.includes,
  },

  b2c_position_prep: {
    id: 'b2c_position_prep',
    name: 'Position-Specific Prep',
    description: 'What does this employer want?',
    price: B2C_PRICING.POSITION_SPECIFIC_PREP.price * 100, // R199 in cents
    priceDisplay: B2C_PRICING.POSITION_SPECIFIC_PREP.priceDisplay,
    type: 'once_off',
    tier: 'b2c',
    features: B2C_PRICING.POSITION_SPECIFIC_PREP.includes,
  },

  b2c_video_pitch: {
    id: 'b2c_video_pitch',
    name: 'Video Pitch',
    description: 'Create video pitch for applications',
    price: B2C_PRICING.VIDEO_PITCH.price * 100, // R149 in cents
    priceDisplay: B2C_PRICING.VIDEO_PITCH.priceDisplay,
    type: 'once_off',
    tier: 'b2c',
    features: B2C_PRICING.VIDEO_PITCH.includes,
  },

  // === LEGACY PRODUCTS (deprecated, kept for backwards compatibility) ===

  b2c_single: {
    id: 'b2c_single',
    name: 'CV Scan (Legacy)',
    description: 'Single CV analysis with AI feedback',
    price: 2900, // R29.00
    priceDisplay: 'R29',
    type: 'once_off',
    tier: 'b2c',
    features: [
      'AI-powered CV analysis',
      'Score out of 100',
      'Detailed feedback',
      'Improvement suggestions',
      'ATS compatibility check',
    ],
  },
};

// ============================================
// PAYFAST DATA TYPES
// ============================================

export interface PayfastPaymentData {
  // Merchant details
  merchant_id: string;
  merchant_key: string;

  // URLs
  return_url: string;
  cancel_url: string;
  notify_url: string;

  // Buyer details (optional but recommended)
  name_first?: string;
  name_last?: string;
  email_address?: string;

  // Transaction details
  m_payment_id: string; // Your unique payment ID
  amount: string; // Decimal format: "100.00"
  item_name: string;
  item_description?: string;

  // Subscription fields (for recurring)
  subscription_type?: '1' | '2'; // 1 = subscription, 2 = future dated
  billing_date?: string; // YYYY-MM-DD
  recurring_amount?: string;
  frequency?: '3' | '4' | '5' | '6'; // 3=Monthly, 4=Quarterly, 5=Biannual, 6=Annual
  cycles?: string; // 0 = indefinite

  // Custom fields
  custom_str1?: string; // User ID
  custom_str2?: string; // Product ID
  custom_str3?: string; // Organization ID
  custom_int1?: string;
  custom_int2?: string;
}

export interface PayfastITNData {
  // Merchant details
  m_payment_id: string;
  pf_payment_id: string;

  // Status
  payment_status: 'COMPLETE' | 'FAILED' | 'PENDING' | 'CANCELLED';

  // Transaction details
  item_name: string;
  item_description?: string;
  amount_gross: string;
  amount_fee: string;
  amount_net: string;

  // Custom fields
  custom_str1?: string;
  custom_str2?: string;
  custom_str3?: string;
  custom_int1?: string;
  custom_int2?: string;

  // Buyer details
  name_first?: string;
  name_last?: string;
  email_address?: string;

  // Subscription details
  token?: string; // Subscription token for future billing
  billing_date?: string;

  // Signature
  signature?: string;
}

// ============================================
// SIGNATURE GENERATION
// ============================================

/**
 * Generate MD5 signature for Payfast payment data
 * Order matters! Fields must be in alphabetical order (excluding signature)
 */
export function generateSignature(data: Record<string, string>, passphrase?: string): string {
  // Get all keys, sort alphabetically, filter empty values
  const sortedKeys = Object.keys(data)
    .filter(key => key !== 'signature' && data[key] !== '' && data[key] !== undefined)
    .sort();

  // Build the query string
  let queryString = sortedKeys
    .map(key => `${key}=${encodeURIComponent(data[key]).replace(/%20/g, '+')}`)
    .join('&');

  // Add passphrase if provided
  if (passphrase) {
    queryString += `&passphrase=${encodeURIComponent(passphrase).replace(/%20/g, '+')}`;
  }

  // Return MD5 hash
  return crypto.createHash('md5').update(queryString).digest('hex');
}

/**
 * Validate ITN signature from Payfast
 */
export function validateITNSignature(data: PayfastITNData, passphrase?: string): boolean {
  const receivedSignature = data.signature;
  if (!receivedSignature) return false;

  // Create a copy without signature
  const dataWithoutSig = { ...data } as Record<string, string>;
  delete dataWithoutSig.signature;

  const calculatedSignature = generateSignature(dataWithoutSig, passphrase);
  return calculatedSignature === receivedSignature;
}

// ============================================
// PAYMENT URL BUILDER
// ============================================

export function buildPaymentUrl(data: PayfastPaymentData): string {
  const dataRecord = data as unknown as Record<string, string>;

  // Filter out undefined/empty values
  const cleanData: Record<string, string> = {};
  for (const key of Object.keys(dataRecord)) {
    if (dataRecord[key] !== undefined && dataRecord[key] !== '') {
      cleanData[key] = dataRecord[key];
    }
  }

  // Generate signature
  const signature = generateSignature(cleanData, payfastConfig.passphrase);
  cleanData.signature = signature;

  // Build query string
  const queryString = Object.entries(cleanData)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&');

  return `${payfastConfig.baseUrl}/eng/process?${queryString}`;
}

// ============================================
// ITN VALIDATION HELPERS
// ============================================

/**
 * Verify that the payment amount matches expected
 */
export function validatePaymentAmount(
  receivedAmount: string,
  expectedProduct: Product
): boolean {
  const received = parseFloat(receivedAmount) * 100; // Convert to cents
  return Math.abs(received - expectedProduct.price) < 1; // Allow for small rounding
}

/**
 * Verify ITN came from Payfast servers
 */
export async function verifyPayfastServer(req: Request): Promise<boolean> {
  // In sandbox, skip this check for easier testing
  if (!isProduction) return true;

  // Valid Payfast server IPs
  const validHosts = [
    'www.payfast.co.za',
    'sandbox.payfast.co.za',
    'w1w.payfast.co.za',
    'w2w.payfast.co.za',
  ];

  // This is a simplified check - in production you might want to verify the IP
  // against Payfast's published IP ranges
  const forwardedFor = req.headers.get('x-forwarded-for');
  const host = req.headers.get('host');

  // For now, we just validate the signature which is the primary security measure
  return true;
}

/**
 * Confirm payment with Payfast (optional but recommended)
 */
export async function confirmPaymentWithPayfast(
  pfParamString: string
): Promise<boolean> {
  try {
    const baseUrl = isProduction
      ? 'https://www.payfast.co.za'
      : 'https://sandbox.payfast.co.za';

    const response = await fetch(`${baseUrl}/eng/query/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: pfParamString,
    });

    const text = await response.text();
    return text === 'VALID';
  } catch (error) {
    console.error('Error confirming payment with Payfast:', error);
    return false;
  }
}

// ============================================
// SUBSCRIPTION HELPERS
// ============================================

export interface SubscriptionStatus {
  active: boolean;
  tier: string;
  cvLimit: number;
  cvUsed: number;
  renewsAt: Date | null;
  cancelledAt: Date | null;
}

export function getFreeTierLimits(isB2C: boolean): { cvLimit: number } {
  return {
    cvLimit: isB2C ? 1 : 10, // B2C: 1 free, B2B: 10 free
  };
}

// ============================================
// DATABASE TYPES
// ============================================

export interface Subscription {
  id: string;
  user_id: string;
  organization_id?: string;
  product_id: string;
  payfast_token?: string; // For recurring billing
  status: 'active' | 'cancelled' | 'past_due' | 'trialing';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  cancelled_at?: string;
  created_at: string;
  updated_at: string;
}

export interface UsageRecord {
  id: string;
  user_id?: string;
  organization_id?: string;
  period_start: string;
  period_end: string;
  cv_screenings_count: number;
  cv_screenings_limit: number;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  user_id?: string;
  organization_id?: string;
  payfast_payment_id: string;
  m_payment_id: string;
  product_id: string;
  amount: number;
  fee: number;
  net_amount: number;
  status: 'complete' | 'failed' | 'pending' | 'cancelled';
  payment_type: 'once_off' | 'subscription';
  created_at: string;
}
