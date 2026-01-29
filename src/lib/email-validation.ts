// ============================================
// HireInbox Email Validation
// Business email verification for employer signups
// ============================================

/**
 * Comprehensive list of free email providers that should be flagged
 * for employer accounts. This list covers major global and regional providers.
 */
export const FREE_EMAIL_PROVIDERS = [
  // Major global providers
  'gmail.com',
  'googlemail.com',
  'yahoo.com',
  'yahoo.co.uk',
  'yahoo.co.za',
  'hotmail.com',
  'hotmail.co.uk',
  'hotmail.co.za',
  'outlook.com',
  'outlook.co.za',
  'live.com',
  'live.co.za',
  'msn.com',
  'icloud.com',
  'me.com',
  'mac.com',

  // Other major free providers
  'aol.com',
  'protonmail.com',
  'proton.me',
  'zoho.com',
  'mail.com',
  'yandex.com',
  'gmx.com',
  'gmx.net',
  'fastmail.com',
  'tutanota.com',
  'tutamail.com',
  'tuta.io',
  'hey.com',

  // Regional providers (South Africa focus)
  'webmail.co.za',
  'mweb.co.za',
  'telkomsa.net',
  'vodamail.co.za',
  'cybersmart.co.za',
  'netactive.co.za',
  'icon.co.za',
  'iburst.co.za',
  'afrihost.co.za',

  // Other common free providers
  'inbox.com',
  'mail.ru',
  'ymail.com',
  'rocketmail.com',
  'rediffmail.com',
  'seznam.cz',
  'wp.pl',
  'onet.pl',
  'interia.pl',
  'o2.pl',
  'qq.com',
  '163.com',
  '126.com',
  'sina.com',
  'naver.com',
  'daum.net',
  'hanmail.net',
  'nate.com',

  // Temporary/disposable email domains (common ones)
  'tempmail.com',
  'throwaway.email',
  'guerrillamail.com',
  'mailinator.com',
  '10minutemail.com',
  'trashmail.com',
  'fakeinbox.com',
  'sharklasers.com',
  'dispostable.com',
  'yopmail.com',
];

/**
 * Extract the domain from an email address
 */
export function getEmailDomain(email: string): string {
  const parts = email.toLowerCase().trim().split('@');
  return parts.length === 2 ? parts[1] : '';
}

/**
 * Check if an email is from a free email provider
 */
export function isFreeEmailProvider(email: string): boolean {
  const domain = getEmailDomain(email);
  if (!domain) return false;

  return FREE_EMAIL_PROVIDERS.includes(domain);
}

/**
 * Check if an email appears to be a business email
 * This is a soft check - returns true if NOT a free provider
 */
export function isBusinessEmail(email: string): boolean {
  return !isFreeEmailProvider(email);
}

/**
 * Validation result with details
 */
export interface EmailValidationResult {
  isValid: boolean;
  isFreeProvider: boolean;
  domain: string;
  message?: string;
}

/**
 * Comprehensive email validation for employer signup
 * Returns detailed validation result
 */
export function validateEmployerEmail(email: string): EmailValidationResult {
  const domain = getEmailDomain(email);

  // Basic format check
  if (!email || !domain || !email.includes('@')) {
    return {
      isValid: false,
      isFreeProvider: false,
      domain: '',
      message: 'Please enter a valid email address',
    };
  }

  const isFreeProvider = isFreeEmailProvider(email);

  if (isFreeProvider) {
    return {
      isValid: true, // Still valid, just a warning
      isFreeProvider: true,
      domain,
      message: 'Please use your business email for employer accounts. This helps verify your company and builds trust with candidates.',
    };
  }

  return {
    isValid: true,
    isFreeProvider: false,
    domain,
  };
}

/**
 * Get a user-friendly warning message for free email providers
 */
export function getFreeEmailWarning(): string {
  return 'Please use your business email for employer accounts. This helps verify your company and builds trust with candidates.';
}
