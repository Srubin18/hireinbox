// Tests for src/lib/env.ts
// Validates environment variable handling

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Store original env
const originalEnv = process.env;

describe('env utilities', () => {
  beforeEach(() => {
    // Reset module cache for each test
    vi.resetModules();
    // Clone env for isolation
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('validateEnv', () => {
    it('should return valid when all required vars are present', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key';
      process.env.OPENAI_API_KEY = 'openai-key';

      const { validateEnv } = await import('@/lib/env');
      const result = validateEnv();

      expect(result.valid).toBe(true);
      expect(result.missing).toHaveLength(0);
    });

    it('should return invalid when required vars are missing', async () => {
      delete process.env.OPENAI_API_KEY;
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;

      const { validateEnv } = await import('@/lib/env');
      const result = validateEnv();

      expect(result.valid).toBe(false);
      expect(result.missing).toContain('OPENAI_API_KEY');
      expect(result.missing).toContain('SUPABASE_SERVICE_ROLE_KEY');
    });

    it('should warn when optional email vars are missing', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key';
      process.env.OPENAI_API_KEY = 'openai-key';
      delete process.env.GMAIL_USER;
      delete process.env.GMAIL_APP_PASSWORD;

      const { validateEnv } = await import('@/lib/env');
      const result = validateEnv();

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.includes('email'))).toBe(true);
    });
  });

  describe('getEnvVar', () => {
    it('should return env value when present', async () => {
      process.env.TEST_VAR = 'test-value';

      const { getEnvVar } = await import('@/lib/env');
      const value = getEnvVar('TEST_VAR');

      expect(value).toBe('test-value');
    });

    it('should return default when var is missing', async () => {
      delete process.env.MISSING_VAR;

      const { getEnvVar } = await import('@/lib/env');
      const value = getEnvVar('MISSING_VAR', 'default-value');

      expect(value).toBe('default-value');
    });

    it('should return undefined when var is missing and no default', async () => {
      delete process.env.MISSING_VAR;

      const { getEnvVar } = await import('@/lib/env');
      const value = getEnvVar('MISSING_VAR');

      expect(value).toBeUndefined();
    });
  });

  describe('isProduction', () => {
    it('should return true when VERCEL=1', async () => {
      process.env.VERCEL = '1';
      process.env.NODE_ENV = 'development';

      const { isProduction } = await import('@/lib/env');
      expect(isProduction()).toBe(true);
    });

    it('should return true when NODE_ENV=production', async () => {
      delete process.env.VERCEL;
      process.env.NODE_ENV = 'production';

      const { isProduction } = await import('@/lib/env');
      expect(isProduction()).toBe(true);
    });

    it('should return false in development', async () => {
      delete process.env.VERCEL;
      process.env.NODE_ENV = 'development';

      const { isProduction } = await import('@/lib/env');
      expect(isProduction()).toBe(false);
    });
  });

  describe('isEmailConfigured', () => {
    it('should return true when both email vars are set', async () => {
      process.env.GMAIL_USER = 'user@gmail.com';
      process.env.GMAIL_APP_PASSWORD = 'app-password';

      const { isEmailConfigured } = await import('@/lib/env');
      expect(isEmailConfigured()).toBe(true);
    });

    it('should return false when GMAIL_USER is missing', async () => {
      delete process.env.GMAIL_USER;
      process.env.GMAIL_APP_PASSWORD = 'app-password';

      const { isEmailConfigured } = await import('@/lib/env');
      expect(isEmailConfigured()).toBe(false);
    });

    it('should return false when GMAIL_APP_PASSWORD is missing', async () => {
      process.env.GMAIL_USER = 'user@gmail.com';
      delete process.env.GMAIL_APP_PASSWORD;

      const { isEmailConfigured } = await import('@/lib/env');
      expect(isEmailConfigured()).toBe(false);
    });
  });

  describe('isPdfConversionAvailable', () => {
    it('should return true when CONVERTAPI_SECRET is set', async () => {
      process.env.CONVERTAPI_SECRET = 'secret-key';

      const { isPdfConversionAvailable } = await import('@/lib/env');
      expect(isPdfConversionAvailable()).toBe(true);
    });

    it('should return false when CONVERTAPI_SECRET is missing', async () => {
      delete process.env.CONVERTAPI_SECRET;

      const { isPdfConversionAvailable } = await import('@/lib/env');
      expect(isPdfConversionAvailable()).toBe(false);
    });
  });
});
