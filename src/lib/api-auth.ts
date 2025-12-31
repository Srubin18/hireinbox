// lib/api-auth.ts
// Server-side authentication helper for API routes
// Validates Supabase session from request headers/cookies

import { NextRequest, NextResponse } from 'next/server';
import { createClient, User } from '@supabase/supabase-js';

// ============================================
// TYPES
// ============================================

export interface AuthResult {
  authenticated: boolean;
  user: User | null;
  error?: string;
}

export interface AuthenticatedRequest {
  user: User;
  userId: string;
}

// ============================================
// AUTH VERIFICATION
// ============================================

/**
 * Verify authentication from request
 * Checks Authorization header for Bearer token or cookies for session
 */
export async function verifyAuth(request: NextRequest): Promise<AuthResult> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      authenticated: false,
      user: null,
      error: 'Server configuration error',
    };
  }

  // Create a Supabase client
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // Method 1: Check Authorization header for Bearer token
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);

    try {
      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (error || !user) {
        return {
          authenticated: false,
          user: null,
          error: error?.message || 'Invalid token',
        };
      }

      return {
        authenticated: true,
        user,
      };
    } catch {
      return {
        authenticated: false,
        user: null,
        error: 'Token verification failed',
      };
    }
  }

  // Method 2: Check cookies for Supabase session
  const accessToken = request.cookies.get('sb-access-token')?.value;
  const refreshToken = request.cookies.get('sb-refresh-token')?.value;

  // Also check the combined session cookie format
  const sessionCookie = request.cookies.get('sb-session')?.value;

  if (sessionCookie) {
    try {
      const session = JSON.parse(sessionCookie);
      if (session?.access_token) {
        const { data: { user }, error } = await supabase.auth.getUser(session.access_token);

        if (!error && user) {
          return {
            authenticated: true,
            user,
          };
        }
      }
    } catch {
      // Invalid session cookie
    }
  }

  if (accessToken) {
    try {
      const { data: { user }, error } = await supabase.auth.getUser(accessToken);

      if (!error && user) {
        return {
          authenticated: true,
          user,
        };
      }
    } catch {
      // Invalid access token
    }
  }

  // Method 3: Check for Supabase auth cookies with project ref
  const cookies = request.cookies.getAll();
  for (const cookie of cookies) {
    if (cookie.name.includes('auth-token') || cookie.name.includes('access_token')) {
      try {
        let token = cookie.value;

        // Try to parse if it's JSON
        try {
          const parsed = JSON.parse(cookie.value);
          token = parsed.access_token || parsed;
        } catch {
          // Not JSON, use as-is
        }

        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (!error && user) {
          return {
            authenticated: true,
            user,
          };
        }
      } catch {
        // Continue to next cookie
      }
    }
  }

  return {
    authenticated: false,
    user: null,
    error: 'Not authenticated',
  };
}

/**
 * Require authentication - returns error response if not authenticated
 */
export async function requireAuth(
  request: NextRequest
): Promise<{ user: User } | NextResponse> {
  const auth = await verifyAuth(request);

  if (!auth.authenticated || !auth.user) {
    return NextResponse.json(
      { error: 'Authentication required', code: 'AUTH_REQUIRED' },
      { status: 401 }
    );
  }

  return { user: auth.user };
}

/**
 * Optional authentication - returns user if authenticated, null otherwise
 */
export async function optionalAuth(
  request: NextRequest
): Promise<User | null> {
  const auth = await verifyAuth(request);
  return auth.user;
}

/**
 * Helper to check if result is an error response
 */
export function isAuthError(
  result: { user: User } | NextResponse
): result is NextResponse {
  return result instanceof NextResponse;
}

// ============================================
// RATE LIMITING (Simple in-memory)
// ============================================

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export interface RateLimitConfig {
  windowMs?: number; // Time window in milliseconds (default: 60000 = 1 minute)
  maxRequests?: number; // Max requests per window (default: 60)
}

/**
 * Check rate limit for an identifier (usually IP or user ID)
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = {}
): { allowed: boolean; remaining: number; resetAt: number } {
  const windowMs = config.windowMs || 60000;
  const maxRequests = config.maxRequests || 60;
  const now = Date.now();

  // Clean up old entries
  for (const [key, value] of rateLimitMap.entries()) {
    if (value.resetAt < now) {
      rateLimitMap.delete(key);
    }
  }

  const entry = rateLimitMap.get(identifier);

  if (!entry || entry.resetAt < now) {
    // New window
    rateLimitMap.set(identifier, {
      count: 1,
      resetAt: now + windowMs,
    });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetAt: now + windowMs,
    };
  }

  if (entry.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
    };
  }

  entry.count++;
  return {
    allowed: true,
    remaining: maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Rate limit middleware - returns error response if rate limited
 */
export function requireRateLimit(
  request: NextRequest,
  config: RateLimitConfig = {}
): NextResponse | null {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown';

  const result = checkRateLimit(ip, config);

  if (!result.allowed) {
    return NextResponse.json(
      {
        error: 'Too many requests',
        code: 'RATE_LIMITED',
        retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000),
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((result.resetAt - Date.now()) / 1000)),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(result.resetAt),
        },
      }
    );
  }

  return null;
}
