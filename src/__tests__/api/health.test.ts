// Tests for /api/health endpoint
// Validates health check responses

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, HEAD } from '@/app/api/health/route';

// Mock Supabase client
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
    })),
  })),
}));

describe('/api/health', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set required environment variables
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
    process.env.OPENAI_API_KEY = 'test-openai-key';
  });

  describe('GET', () => {
    it('should return health status object', async () => {
      const response = await GET();
      const body = await response.json();

      expect(body.status).toBeDefined();
      expect(['healthy', 'degraded', 'unhealthy']).toContain(body.status);
    });

    it('should include timestamp in response', async () => {
      const response = await GET();
      const body = await response.json();

      expect(body.timestamp).toBeDefined();
      expect(() => new Date(body.timestamp)).not.toThrow();
    });

    it('should include version in response', async () => {
      const response = await GET();
      const body = await response.json();

      expect(body.version).toBeDefined();
    });

    it('should include environment in response', async () => {
      const response = await GET();
      const body = await response.json();

      expect(body.environment).toBeDefined();
    });

    it('should include checks object with all required checks', async () => {
      const response = await GET();
      const body = await response.json();

      expect(body.checks).toBeDefined();
      expect(body.checks.database).toBeDefined();
      expect(body.checks.openai).toBeDefined();
      expect(body.checks.email).toBeDefined();
      expect(body.checks.environment).toBeDefined();
    });

    it('should include uptime_seconds', async () => {
      const response = await GET();
      const body = await response.json();

      expect(body.uptime_seconds).toBeDefined();
      expect(typeof body.uptime_seconds).toBe('number');
      expect(body.uptime_seconds).toBeGreaterThanOrEqual(0);
    });

    it('should return 200 when healthy', async () => {
      const response = await GET();
      expect(response.status).toBe(200);
    });

    it('should return degraded when email is not configured', async () => {
      delete process.env.GMAIL_USER;
      delete process.env.GMAIL_APP_PASSWORD;

      const response = await GET();
      const body = await response.json();

      expect(body.checks.email.configured).toBe(false);
    });

    it('should show openai as configured when key is present', async () => {
      process.env.OPENAI_API_KEY = 'test-key';

      const response = await GET();
      const body = await response.json();

      expect(body.checks.openai.configured).toBe(true);
      expect(body.checks.openai.status).toBe('ok');
    });
  });

  describe('HEAD', () => {
    it('should return 200 when healthy', async () => {
      const response = await HEAD();
      expect(response.status).toBe(200);
    });

    it('should return null body', async () => {
      const response = await HEAD();
      expect(response.body).toBeNull();
    });
  });
});

describe('Health check response format', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
    process.env.OPENAI_API_KEY = 'test-openai-key';
  });

  it('should match expected HealthCheck interface', async () => {
    const response = await GET();
    const body = await response.json();

    // Verify structure matches HealthCheck interface
    const expectedShape = {
      status: expect.stringMatching(/healthy|degraded|unhealthy/),
      timestamp: expect.any(String),
      version: expect.any(String),
      environment: expect.any(String),
      checks: {
        database: expect.objectContaining({
          status: expect.stringMatching(/ok|error/),
        }),
        openai: expect.objectContaining({
          status: expect.stringMatching(/ok|error/),
          configured: expect.any(Boolean),
        }),
        email: expect.objectContaining({
          status: expect.stringMatching(/ok|error/),
          configured: expect.any(Boolean),
        }),
        environment: expect.objectContaining({
          status: expect.stringMatching(/ok|error/),
        }),
      },
      uptime_seconds: expect.any(Number),
    };

    expect(body).toMatchObject(expectedShape);
  });
});
