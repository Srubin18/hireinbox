// Integration smoke tests
// Tests that verify the system works together

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET as healthGET } from '@/app/api/health/route';

// Mock Supabase for integration tests
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
    })),
  })),
}));

describe('Health endpoint integration', () => {
  beforeEach(() => {
    // Ensure required env vars are set
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
    process.env.OPENAI_API_KEY = 'test-openai-key';
  });

  it('should return valid JSON response', async () => {
    const response = await healthGET();

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toBeDefined();
    expect(typeof body).toBe('object');
  });

  it('should include all required health check fields', async () => {
    const response = await healthGET();
    const body = await response.json();

    expect(body.status).toBeDefined();
    expect(body.timestamp).toBeDefined();
    expect(body.checks).toBeDefined();
    expect(body.checks.database).toBeDefined();
    expect(body.checks.openai).toBeDefined();
    expect(body.checks.email).toBeDefined();
    expect(body.checks.environment).toBeDefined();
  });

  it('should report OpenAI as configured when key is present', async () => {
    process.env.OPENAI_API_KEY = 'sk-test-key';

    const response = await healthGET();
    const body = await response.json();

    expect(body.checks.openai.configured).toBe(true);
  });
});

describe('Environment integration', () => {
  it('should have test environment variables set in test setup', () => {
    expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toBeDefined();
    expect(process.env.OPENAI_API_KEY).toBeDefined();
  });

  it('should be running in test environment', () => {
    expect(process.env.NODE_ENV).toBe('test');
  });
});

describe('API error handling integration', () => {
  it('should use consistent error response format', async () => {
    // Import the error utilities
    const { Errors } = await import('@/lib/api-error');

    // Create various error types
    const validationError = Errors.validation('Invalid input');
    const notFoundError = Errors.notFound('Resource');
    const internalError = Errors.internal('Server error');

    // All errors should have toResponse method
    expect(typeof validationError.toResponse).toBe('function');
    expect(typeof notFoundError.toResponse).toBe('function');
    expect(typeof internalError.toResponse).toBe('function');

    // Verify response format consistency
    const response = validationError.toResponse();
    const body = await response.json();

    expect(body.error).toBeDefined();
    expect(body.code).toBeDefined();
    expect(body.timestamp).toBeDefined();
  });
});

describe('SA Context integration', () => {
  it('should export all context modules', async () => {
    const saContext = await import('@/lib/sa-context');

    expect(saContext.SA_CONTEXT_PROMPT).toBeDefined();
    expect(saContext.SA_UNIVERSITIES).toBeDefined();
    expect(saContext.SA_QUALIFICATIONS).toBeDefined();
    expect(saContext.SA_COMPANIES).toBeDefined();
    expect(saContext.SA_CITIES).toBeDefined();
    expect(saContext.SA_SALARY_RANGES).toBeDefined();
  });

  it('should have consistent data structure', async () => {
    const { SA_UNIVERSITIES, SA_COMPANIES } = await import('@/lib/sa-context');

    // Verify arrays are non-empty
    expect(SA_UNIVERSITIES.tier1.length).toBeGreaterThan(0);
    expect(SA_COMPANIES.big4.length).toBeGreaterThanOrEqual(4); // Big 4 firms (may include aliases like EY/Ernst & Young)
  });
});
