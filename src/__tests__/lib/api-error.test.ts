// Tests for src/lib/api-error.ts
// Validates error handling utilities work correctly

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiError, Errors, generateTraceId, withErrorHandling } from '@/lib/api-error';
import { NextResponse } from 'next/server';

describe('ApiError', () => {
  describe('constructor', () => {
    it('should create an error with required fields', () => {
      const error = new ApiError('Test error', 'VALIDATION_ERROR', 400);

      expect(error.message).toBe('Test error');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('ApiError');
    });

    it('should create an error with optional fields', () => {
      const error = new ApiError(
        'Test error',
        'DATABASE_ERROR',
        500,
        'Additional details',
        'trace-123'
      );

      expect(error.details).toBe('Additional details');
      expect(error.traceId).toBe('trace-123');
    });

    it('should default status code to 500', () => {
      const error = new ApiError('Test error', 'INTERNAL_ERROR');
      expect(error.statusCode).toBe(500);
    });
  });

  describe('toResponse', () => {
    it('should return a NextResponse with correct format', () => {
      const error = new ApiError('Test error', 'NOT_FOUND', 404);
      const response = error.toResponse();

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(404);
    });

    it('should include timestamp in response body', async () => {
      const error = new ApiError('Test error', 'UNAUTHORIZED', 401);
      const response = error.toResponse();
      const body = await response.json();

      expect(body.timestamp).toBeDefined();
      expect(body.error).toBe('Test error');
      expect(body.code).toBe('UNAUTHORIZED');
    });

    it('should include traceId when provided', async () => {
      const error = new ApiError('Test error', 'INTERNAL_ERROR', 500, undefined, 'trace-xyz');
      const response = error.toResponse();
      const body = await response.json();

      expect(body.traceId).toBe('trace-xyz');
    });

    it('should include details when provided', async () => {
      const error = new ApiError('Test error', 'PARSE_ERROR', 400, 'Invalid JSON');
      const response = error.toResponse();
      const body = await response.json();

      expect(body.details).toBe('Invalid JSON');
    });
  });
});

describe('Errors factory', () => {
  describe('validation', () => {
    it('should create a 400 error', () => {
      const error = Errors.validation('Invalid input', 'Field X is required');

      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.message).toBe('Invalid input');
      expect(error.details).toBe('Field X is required');
    });
  });

  describe('notFound', () => {
    it('should create a 404 error with resource name', () => {
      const error = Errors.notFound('Role');

      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
      expect(error.message).toBe('Role not found');
    });
  });

  describe('unauthorized', () => {
    it('should create a 401 error with default message', () => {
      const error = Errors.unauthorized();

      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('UNAUTHORIZED');
      expect(error.message).toBe('Authentication required');
    });

    it('should create a 401 error with custom message', () => {
      const error = Errors.unauthorized('Token expired');
      expect(error.message).toBe('Token expired');
    });
  });

  describe('forbidden', () => {
    it('should create a 403 error', () => {
      const error = Errors.forbidden();

      expect(error.statusCode).toBe(403);
      expect(error.code).toBe('FORBIDDEN');
    });
  });

  describe('rateLimited', () => {
    it('should create a 429 error', () => {
      const error = Errors.rateLimited();

      expect(error.statusCode).toBe(429);
      expect(error.code).toBe('RATE_LIMITED');
    });

    it('should include retry information in details', () => {
      const error = Errors.rateLimited(60);
      expect(error.details).toBe('Retry after 60 seconds');
    });
  });

  describe('internal', () => {
    it('should create a 500 error', () => {
      const error = Errors.internal('Something went wrong', 'trace-abc');

      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('INTERNAL_ERROR');
      expect(error.traceId).toBe('trace-abc');
    });
  });

  describe('database', () => {
    it('should create a DATABASE_ERROR', () => {
      const error = Errors.database('Connection failed', 'Timeout');

      expect(error.code).toBe('DATABASE_ERROR');
      expect(error.details).toBe('Timeout');
    });
  });

  describe('ai', () => {
    it('should create an AI_ERROR', () => {
      const error = Errors.ai('Model unavailable', 'Rate limited');

      expect(error.code).toBe('AI_ERROR');
      expect(error.message).toBe('Model unavailable');
    });
  });

  describe('email', () => {
    it('should create an EMAIL_ERROR', () => {
      const error = Errors.email('Failed to send', 'SMTP error');

      expect(error.code).toBe('EMAIL_ERROR');
    });
  });

  describe('parse', () => {
    it('should create a PARSE_ERROR with 400 status', () => {
      const error = Errors.parse('Invalid format', 'Expected PDF');

      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('PARSE_ERROR');
    });
  });

  describe('configuration', () => {
    it('should create a CONFIGURATION_ERROR', () => {
      const error = Errors.configuration('Missing API key');

      expect(error.code).toBe('CONFIGURATION_ERROR');
      expect(error.statusCode).toBe(500);
    });
  });
});

describe('generateTraceId', () => {
  it('should return a string', () => {
    const traceId = generateTraceId();
    expect(typeof traceId).toBe('string');
  });

  it('should generate unique IDs', () => {
    const id1 = generateTraceId();
    const id2 = generateTraceId();
    expect(id1).not.toBe(id2);
  });

  it('should have reasonable length', () => {
    const traceId = generateTraceId();
    expect(traceId.length).toBeGreaterThan(5);
    expect(traceId.length).toBeLessThan(30);
  });
});

describe('withErrorHandling', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should return successful response unchanged', async () => {
    const handler = async () => NextResponse.json({ success: true });
    const wrappedHandler = withErrorHandling(handler);

    const request = new Request('http://localhost/api/test');
    const response = await wrappedHandler(request);
    const body = await response.json();

    expect(body.success).toBe(true);
  });

  it('should catch and format ApiError', async () => {
    const handler = async () => {
      throw Errors.notFound('Resource');
    };
    const wrappedHandler = withErrorHandling(handler);

    const request = new Request('http://localhost/api/test');
    const response = await wrappedHandler(request);

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.code).toBe('NOT_FOUND');
  });

  it('should convert unknown errors to internal errors', async () => {
    const handler = async () => {
      throw new Error('Unexpected error');
    };
    const wrappedHandler = withErrorHandling(handler);

    const request = new Request('http://localhost/api/test');
    const response = await wrappedHandler(request);

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.code).toBe('INTERNAL_ERROR');
  });

  it('should use custom trace ID generator', async () => {
    const handler = async () => {
      throw new Error('Test error');
    };
    const customGenerator = () => 'custom-trace-id';
    const wrappedHandler = withErrorHandling(handler, customGenerator);

    const request = new Request('http://localhost/api/test');
    const response = await wrappedHandler(request);
    const body = await response.json();

    expect(body.traceId).toBe('custom-trace-id');
  });
});
