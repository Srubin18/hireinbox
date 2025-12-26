// Centralized API error handling utilities
// Provides consistent error responses across all API routes

import { NextResponse } from 'next/server';

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'
  | 'DATABASE_ERROR'
  | 'AI_ERROR'
  | 'EMAIL_ERROR'
  | 'PARSE_ERROR'
  | 'CONFIGURATION_ERROR';

export interface ApiErrorResponse {
  error: string;
  code: ApiErrorCode;
  details?: string;
  traceId?: string;
  timestamp: string;
}

export class ApiError extends Error {
  public readonly code: ApiErrorCode;
  public readonly statusCode: number;
  public readonly details?: string;
  public traceId?: string;

  constructor(
    message: string,
    code: ApiErrorCode,
    statusCode: number = 500,
    details?: string,
    traceId?: string
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.traceId = traceId;
  }

  toResponse(): NextResponse<ApiErrorResponse> {
    return NextResponse.json(
      {
        error: this.message,
        code: this.code,
        ...(this.details && { details: this.details }),
        ...(this.traceId && { traceId: this.traceId }),
        timestamp: new Date().toISOString(),
      },
      { status: this.statusCode }
    );
  }
}

// Pre-defined error factories for common cases
export const Errors = {
  validation: (message: string, details?: string) =>
    new ApiError(message, 'VALIDATION_ERROR', 400, details),

  notFound: (resource: string) =>
    new ApiError(`${resource} not found`, 'NOT_FOUND', 404),

  unauthorized: (message: string = 'Authentication required') =>
    new ApiError(message, 'UNAUTHORIZED', 401),

  forbidden: (message: string = 'Access denied') =>
    new ApiError(message, 'FORBIDDEN', 403),

  rateLimited: (retryAfter?: number) =>
    new ApiError(
      'Too many requests',
      'RATE_LIMITED',
      429,
      retryAfter ? `Retry after ${retryAfter} seconds` : undefined
    ),

  internal: (message: string = 'Internal server error', traceId?: string) =>
    new ApiError(message, 'INTERNAL_ERROR', 500, undefined, traceId),

  database: (message: string, details?: string, traceId?: string) =>
    new ApiError(message, 'DATABASE_ERROR', 500, details, traceId),

  ai: (message: string, details?: string, traceId?: string) =>
    new ApiError(message, 'AI_ERROR', 500, details, traceId),

  email: (message: string, details?: string) =>
    new ApiError(message, 'EMAIL_ERROR', 500, details),

  parse: (message: string, details?: string) =>
    new ApiError(message, 'PARSE_ERROR', 400, details),

  configuration: (message: string) =>
    new ApiError(message, 'CONFIGURATION_ERROR', 500),
};

/**
 * Wrap an async API handler with error handling
 */
export function withErrorHandling<T>(
  handler: (request: Request) => Promise<NextResponse<T>>,
  traceIdGenerator?: () => string
): (request: Request) => Promise<NextResponse<T | ApiErrorResponse>> {
  return async (request: Request) => {
    const traceId = traceIdGenerator?.() ?? Date.now().toString(36);

    try {
      return await handler(request);
    } catch (error) {
      // Log the error
      console.error(`[${traceId}] API Error:`, error);

      // Handle known ApiError
      if (error instanceof ApiError) {
        error.traceId = traceId;
        return error.toResponse();
      }

      // Handle unknown errors
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      return Errors.internal(message, traceId).toResponse();
    }
  };
}

/**
 * Generate a trace ID for request tracking
 */
export function generateTraceId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
}

/**
 * Log an API request for debugging
 */
export function logRequest(
  traceId: string,
  method: string,
  path: string,
  extra?: Record<string, unknown>
): void {
  console.log(`[${traceId}] ${method} ${path}`, extra ? JSON.stringify(extra) : '');
}

/**
 * Log an API response for debugging
 */
export function logResponse(
  traceId: string,
  status: number,
  duration: number,
  extra?: Record<string, unknown>
): void {
  console.log(`[${traceId}] Response: ${status} (${duration}ms)`, extra ? JSON.stringify(extra) : '');
}
