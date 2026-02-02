// In-memory rate limiter for API endpoints
// Uses a sliding window algorithm with per-IP tracking
// For production at scale, consider Vercel KV or Upstash Redis

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store - keyed by "ip:endpoint"
const rateLimitStore = new Map<string, RateLimitEntry>();

// Configuration for different endpoint types
export interface RateLimitConfig {
  requests: number;    // Number of requests allowed
  windowMs: number;    // Time window in milliseconds
}

// Preset configurations
export const RATE_LIMITS = {
  // Standard API endpoints: 100 requests per minute
  standard: {
    requests: 100,
    windowMs: 60 * 1000,
  } as RateLimitConfig,

  // AI endpoints (expensive): 10 requests per minute
  ai: {
    requests: 10,
    windowMs: 60 * 1000,
  } as RateLimitConfig,

  // Auth endpoints (sensitive): 5 requests per minute
  auth: {
    requests: 5,
    windowMs: 60 * 1000,
  } as RateLimitConfig,

  // Email sending: 20 requests per minute
  email: {
    requests: 20,
    windowMs: 60 * 1000,
  } as RateLimitConfig,
};

/**
 * Get client IP from request headers
 * Works with Vercel, Cloudflare, and standard proxies
 */
export function getClientIP(request: Request): string {
  const headers = request.headers;

  // Try various headers in order of reliability
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    // Take the first IP in the chain (original client)
    return forwardedFor.split(',')[0].trim();
  }

  const realIP = headers.get('x-real-ip');
  if (realIP) {
    return realIP.trim();
  }

  const cfConnectingIP = headers.get('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP.trim();
  }

  // Fallback for local development
  return '127.0.0.1';
}

/**
 * Clean up expired entries periodically
 * Called on each rate limit check to prevent memory leaks
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();

  // Only cleanup every 1000 requests or so to avoid overhead
  if (Math.random() > 0.001) return;

  // Use Array.from to avoid downlevelIteration requirement
  const entries = Array.from(rateLimitStore.entries());
  for (let i = 0; i < entries.length; i++) {
    const [key, entry] = entries[i];
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSeconds?: number;
}

/**
 * Check if a request is rate limited
 * @param request - The incoming request
 * @param endpoint - Identifier for the endpoint (e.g., 'analyze-cv', 'screen')
 * @param config - Rate limit configuration
 * @returns RateLimitResult with success status and metadata
 */
export function checkRateLimit(
  request: Request,
  endpoint: string,
  config: RateLimitConfig = RATE_LIMITS.standard
): RateLimitResult {
  cleanupExpiredEntries();

  const ip = getClientIP(request);
  const key = `${ip}:${endpoint}`;
  const now = Date.now();

  const entry = rateLimitStore.get(key);

  // No existing entry or window expired - create new
  if (!entry || entry.resetAt < now) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetAt: now + config.windowMs,
    };
    rateLimitStore.set(key, newEntry);

    return {
      success: true,
      limit: config.requests,
      remaining: config.requests - 1,
      resetAt: newEntry.resetAt,
    };
  }

  // Increment count
  entry.count++;

  // Check if over limit
  if (entry.count > config.requests) {
    const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);

    return {
      success: false,
      limit: config.requests,
      remaining: 0,
      resetAt: entry.resetAt,
      retryAfterSeconds,
    };
  }

  return {
    success: true,
    limit: config.requests,
    remaining: config.requests - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Rate limit middleware helper that returns a 429 response if limited
 * Usage: const rateLimited = withRateLimit(request, 'my-endpoint', RATE_LIMITS.standard);
 *        if (rateLimited) return rateLimited;
 */
export function withRateLimit(
  request: Request,
  endpoint: string,
  config: RateLimitConfig = RATE_LIMITS.standard
): Response | null {
  const result = checkRateLimit(request, endpoint, config);

  if (!result.success) {
    return new Response(
      JSON.stringify({
        error: 'Too many requests',
        code: 'RATE_LIMITED',
        details: `Rate limit exceeded. Try again in ${result.retryAfterSeconds} seconds.`,
        retryAfter: result.retryAfterSeconds,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(result.retryAfterSeconds),
          'X-RateLimit-Limit': String(result.limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
        },
      }
    );
  }

  return null;
}

/**
 * Add rate limit headers to a successful response
 */
export function addRateLimitHeaders(
  response: Response,
  result: RateLimitResult
): Response {
  const headers = new Headers(response.headers);
  headers.set('X-RateLimit-Limit', String(result.limit));
  headers.set('X-RateLimit-Remaining', String(result.remaining));
  headers.set('X-RateLimit-Reset', String(Math.ceil(result.resetAt / 1000)));

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * Reset rate limit for a specific IP and endpoint (useful for testing)
 */
export function resetRateLimit(ip: string, endpoint: string): void {
  rateLimitStore.delete(`${ip}:${endpoint}`);
}

/**
 * Get current rate limit status without incrementing (for debugging)
 */
export function getRateLimitStatus(
  ip: string,
  endpoint: string,
  config: RateLimitConfig = RATE_LIMITS.standard
): RateLimitResult {
  const key = `${ip}:${endpoint}`;
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || entry.resetAt < now) {
    return {
      success: true,
      limit: config.requests,
      remaining: config.requests,
      resetAt: now + config.windowMs,
    };
  }

  return {
    success: entry.count <= config.requests,
    limit: config.requests,
    remaining: Math.max(0, config.requests - entry.count),
    resetAt: entry.resetAt,
    retryAfterSeconds: entry.count > config.requests
      ? Math.ceil((entry.resetAt - now) / 1000)
      : undefined,
  };
}
