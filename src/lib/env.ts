// Environment variable validation and type-safe access
// Validates required environment variables at startup and provides typed access

type EnvConfig = {
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;

  // OpenAI
  OPENAI_API_KEY: string;

  // Optional: Email
  GMAIL_USER?: string;
  GMAIL_APP_PASSWORD?: string;

  // Optional: PDF conversion
  CONVERTAPI_SECRET?: string;

  // Optional: Anthropic
  ANTHROPIC_API_KEY?: string;

  // Runtime
  NODE_ENV: 'development' | 'production' | 'test';
  VERCEL?: string;
};

class EnvironmentError extends Error {
  constructor(public missingVars: string[]) {
    super(`Missing required environment variables: ${missingVars.join(', ')}`);
    this.name = 'EnvironmentError';
  }
}

const REQUIRED_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'OPENAI_API_KEY',
] as const;

const OPTIONAL_VARS = [
  'GMAIL_USER',
  'GMAIL_APP_PASSWORD',
  'CONVERTAPI_SECRET',
  'ANTHROPIC_API_KEY',
  'VERCEL',
] as const;

let validated = false;
let validationError: EnvironmentError | null = null;

/**
 * Validates all required environment variables are present.
 * Call this at app startup to fail fast if configuration is missing.
 */
export function validateEnv(): { valid: boolean; missing: string[]; warnings: string[] } {
  const missing: string[] = [];
  const warnings: string[] = [];

  // Check required vars
  for (const varName of REQUIRED_VARS) {
    const value = process.env[varName];
    if (!value || value.trim() === '') {
      missing.push(varName);
    }
  }

  // Check optional vars and warn if missing common ones
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    warnings.push('Email configuration incomplete (GMAIL_USER, GMAIL_APP_PASSWORD) - email features disabled');
  }

  if (!process.env.CONVERTAPI_SECRET) {
    warnings.push('CONVERTAPI_SECRET not set - PDF extraction may fail in production');
  }

  validated = true;
  if (missing.length > 0) {
    validationError = new EnvironmentError(missing);
  }

  return {
    valid: missing.length === 0,
    missing,
    warnings,
  };
}

/**
 * Gets a typed environment configuration object.
 * Throws if required variables are missing.
 */
export function getEnv(): EnvConfig {
  if (!validated) {
    const result = validateEnv();
    if (!result.valid) {
      throw validationError!;
    }
  } else if (validationError) {
    throw validationError;
  }

  return {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY!,
    GMAIL_USER: process.env.GMAIL_USER,
    GMAIL_APP_PASSWORD: process.env.GMAIL_APP_PASSWORD,
    CONVERTAPI_SECRET: process.env.CONVERTAPI_SECRET,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    NODE_ENV: (process.env.NODE_ENV as EnvConfig['NODE_ENV']) || 'development',
    VERCEL: process.env.VERCEL,
  };
}

/**
 * Safely get an environment variable with a default value.
 */
export function getEnvVar<T extends string>(name: string, defaultValue: T): string;
export function getEnvVar(name: string, defaultValue?: string): string | undefined;
export function getEnvVar(name: string, defaultValue?: string): string | undefined {
  return process.env[name] || defaultValue;
}

/**
 * Check if we're running in production (Vercel)
 */
export function isProduction(): boolean {
  return process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';
}

/**
 * Check if email features are available
 */
export function isEmailConfigured(): boolean {
  return !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
}

/**
 * Check if PDF conversion API is available
 */
export function isPdfConversionAvailable(): boolean {
  return !!process.env.CONVERTAPI_SECRET;
}

// Export validation result type for use in health checks
export type EnvValidation = ReturnType<typeof validateEnv>;
