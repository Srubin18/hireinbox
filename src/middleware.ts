import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, CookieOptions } from '@supabase/ssr';

// ============================================
// HIREINBOX SECURITY MIDDLEWARE
// Combines auth, rate limiting, bot detection,
// and security headers for production
// ============================================

// ===== CONFIGURATION =====

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/',                 // Homepage (public demo)
  '/hire',             // B2B landing & all hire pages
  '/candidates',       // B2C landing
  '/upload',           // B2C CV upload (public)
  '/login',            // Auth pages
  '/signup',
  '/auth/callback',
  '/auth/reset-password',
  '/pricing',          // Pricing page
  '/about',            // About page
  '/faq',              // FAQ page
  '/talent-pool',      // Talent pool (all pages)
  '/terms',            // Legal
  '/privacy',          // Legal
  '/admin',            // Admin dashboard (demo)
  '/api/analyze-cv',   // B2C API (public)
  '/api/analyze-video', // B2C API (public)
  '/api/rewrite-cv',   // B2C API (public)
  '/api/talent-pool',  // Talent pool API (public)
];

// Static files and API routes that should always pass through
const EXCLUDED_PATTERNS = [
  '/_next',
  '/favicon.ico',
  '/icon.svg',
  '/api/health',
];

// Rate limit configurations
const RATE_LIMITS = {
  public: { requests: 100, windowMs: 60000 },      // 100 requests per minute
  authenticated: { requests: 500, windowMs: 60000 }, // 500 requests per minute
  cvUpload: { requests: 5, windowMs: 3600000 },    // 5 CV uploads per hour (unauthenticated)
  strictApi: { requests: 30, windowMs: 60000 },    // 30 requests per minute for expensive APIs
  blocked: { minDuration: 300000, multiplier: 1.5 }, // 5 min base block, increases with violations
};

// Bot detection patterns - lowercase for matching
const BOT_USER_AGENTS = [
  'bot', 'crawler', 'spider', 'scraper', 'curl', 'wget', 'python-requests',
  'go-http-client', 'java/', 'libwww', 'httpclient', 'okhttp', 'httpunit',
  'mechanize', 'scrapy', 'phantomjs', 'headless', 'selenium', 'puppeteer',
  'playwright', 'nightmare', 'casperjs', 'goutte', 'htmlunit', 'axios/0',
  'node-fetch', 'request/', 'superagent', 'aiohttp', 'httpx',
];

// Legitimate bots to allow (search engines, Vercel)
const ALLOWED_BOTS = ['googlebot', 'bingbot', 'vercel', 'uptimerobot', 'pingdom'];

// Suspicious patterns in requests (potential attacks)
const SUSPICIOUS_PATTERNS = [
  /\.\.\//,                    // Path traversal
  /<script/i,                  // XSS attempts
  /union\s+select/i,           // SQL injection
  /javascript:/i,              // JavaScript protocol
  /on\w+\s*=/i,                // Event handlers (onclick=, onerror=, etc.)
  /base64,/i,                  // Base64 data URIs (potential payload)
  /eval\s*\(/i,                // Eval calls
  /document\.(cookie|write)/i, // Document manipulation
  /window\.(location|open)/i,  // Window manipulation
];

// Security headers
const SECURITY_HEADERS: Record<string, string> = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(self), microphone=(self), geolocation=(), payment=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.openai.com https://api.anthropic.com;",
};

// CORS Configuration
const CORS_CONFIG = {
  allowedOrigins: [
    'https://hireinbox.co.za',
    'https://www.hireinbox.co.za',
    'https://hireinbox.vercel.app',
    // Development origins
    ...(process.env.NODE_ENV === 'development' ? ['http://localhost:3000', 'http://127.0.0.1:3000'] : []),
  ],
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Feedback-Token'],
  exposedHeaders: ['X-RateLimit-Remaining', 'X-RateLimit-Reset', 'Retry-After'],
  maxAge: 86400, // 24 hours
  credentials: true,
};

/**
 * Get CORS headers for a request
 */
function getCorsHeaders(request: NextRequest): Record<string, string> {
  const origin = request.headers.get('origin') || '';
  const isAllowedOrigin = CORS_CONFIG.allowedOrigins.includes(origin) ||
    CORS_CONFIG.allowedOrigins.some(allowed => origin.endsWith(allowed.replace('https://', '')));

  // For same-origin requests or allowed origins
  if (!origin || isAllowedOrigin) {
    return {
      'Access-Control-Allow-Origin': isAllowedOrigin ? origin : CORS_CONFIG.allowedOrigins[0],
      'Access-Control-Allow-Methods': CORS_CONFIG.allowedMethods.join(', '),
      'Access-Control-Allow-Headers': CORS_CONFIG.allowedHeaders.join(', '),
      'Access-Control-Expose-Headers': CORS_CONFIG.exposedHeaders.join(', '),
      'Access-Control-Max-Age': CORS_CONFIG.maxAge.toString(),
      'Access-Control-Allow-Credentials': 'true',
    };
  }

  // For disallowed origins, don't include Access-Control-Allow-Origin
  return {};
}

// ===== IN-MEMORY STORES =====
// Note: For multi-instance deployments, use Redis instead

interface RateLimitRecord {
  count: number;
  resetTime: number;
  blocked: boolean;
  blockedUntil: number;
  violations: number;
  failedRequests: number;
}

interface CVUploadRecord {
  uploads: number;
  resetTime: number;
  cvHashes: Set<string>;
}

const rateLimitStore = new Map<string, RateLimitRecord>();
const cvUploadStore = new Map<string, CVUploadRecord>();
const securityLogBuffer: Array<object> = [];

// ===== UTILITY FUNCTIONS =====

function getClientIP(request: NextRequest): string {
  // Check various headers in order of reliability
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const vercelForwardedFor = request.headers.get('x-vercel-forwarded-for');

  if (cfConnectingIP) return cfConnectingIP;
  if (vercelForwardedFor) return vercelForwardedFor.split(',')[0].trim();
  if (forwardedFor) return forwardedFor.split(',')[0].trim();
  if (realIP) return realIP;

  return 'unknown';
}

function isBotUserAgent(userAgent: string | null): boolean {
  if (!userAgent) return true; // No user agent is suspicious
  const lowerUA = userAgent.toLowerCase();

  // Check if it's an allowed bot first
  if (ALLOWED_BOTS.some(bot => lowerUA.includes(bot))) {
    return false;
  }

  return BOT_USER_AGENTS.some(bot => lowerUA.includes(bot));
}

function hasSuspiciousPatterns(request: NextRequest): boolean {
  const url = request.url;
  const path = request.nextUrl.pathname;

  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(url) || pattern.test(path)) {
      return true;
    }
  }

  return false;
}

function isAuthenticated(request: NextRequest): boolean {
  // Check for Supabase auth cookies
  const cookies = request.cookies.getAll();
  const hasAuthCookie = cookies.some(c =>
    c.name.includes('sb-') && c.name.includes('-auth-token')
  );

  // Check for Authorization header
  const authHeader = request.headers.get('authorization');

  return !!(hasAuthCookie || authHeader);
}

// ===== RATE LIMITING =====

function cleanupStores(): void {
  const now = Date.now();
  const cutoff = now - 7200000; // 2 hours

  // Clean rate limit store
  if (rateLimitStore.size > 5000) {
    for (const [k, v] of rateLimitStore) {
      if (v.resetTime < cutoff && !v.blocked) {
        rateLimitStore.delete(k);
      }
    }
  }

  // Clean CV upload store
  if (cvUploadStore.size > 5000) {
    for (const [k, v] of cvUploadStore) {
      if (v.resetTime < cutoff) {
        cvUploadStore.delete(k);
      }
    }
  }
}

function checkRateLimit(
  key: string,
  limit: { requests: number; windowMs: number }
): { allowed: boolean; remaining: number; resetIn: number; blocked: boolean } {
  const now = Date.now();
  let record = rateLimitStore.get(key);

  // Periodic cleanup
  if (Math.random() < 0.01) cleanupStores();

  // Check if still blocked
  if (record?.blocked && record.blockedUntil > now) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: record.blockedUntil - now,
      blocked: true,
    };
  }

  // Initialize or reset if window expired
  if (!record || now > record.resetTime) {
    record = {
      count: 0,
      resetTime: now + limit.windowMs,
      blocked: false,
      blockedUntil: 0,
      violations: record?.violations || 0,
      failedRequests: record?.failedRequests || 0,
    };
  }

  // Unblock if block period expired
  if (record.blocked && now >= record.blockedUntil) {
    record.blocked = false;
    record.violations = Math.max(0, record.violations - 1); // Reduce violations slowly
  }

  record.count++;
  const allowed = record.count <= limit.requests;
  const remaining = Math.max(0, limit.requests - record.count);
  const resetIn = record.resetTime - now;

  // Track violations for progressive blocking
  if (!allowed) {
    record.violations++;
    record.failedRequests++;

    // Progressive blocking: block longer for repeat offenders
    if (record.violations >= 3) {
      record.blocked = true;
      const blockDuration = RATE_LIMITS.blocked.minDuration *
        Math.pow(RATE_LIMITS.blocked.multiplier, record.violations - 3);
      record.blockedUntil = now + Math.min(blockDuration, 86400000); // Max 24 hours
    }
  }

  rateLimitStore.set(key, record);
  return { allowed, remaining, resetIn, blocked: record.blocked };
}

function checkCVUploadLimit(ip: string, authenticated: boolean): {
  allowed: boolean;
  reason?: string;
  remaining: number;
} {
  // Authenticated users get more generous limits
  if (authenticated) {
    return { allowed: true, remaining: 100 };
  }

  const now = Date.now();
  let record = cvUploadStore.get(ip);

  if (!record || now > record.resetTime) {
    record = {
      uploads: 0,
      resetTime: now + RATE_LIMITS.cvUpload.windowMs,
      cvHashes: new Set(),
    };
  }

  record.uploads++;
  cvUploadStore.set(ip, record);

  if (record.uploads > RATE_LIMITS.cvUpload.requests) {
    return {
      allowed: false,
      reason: 'CV upload limit reached. Please try again in an hour or create an account for unlimited uploads.',
      remaining: 0,
    };
  }

  return {
    allowed: true,
    remaining: RATE_LIMITS.cvUpload.requests - record.uploads,
  };
}

// ===== SECURITY LOGGING =====

function logSecurityEvent(event: {
  type: string;
  ip: string;
  path: string;
  userAgent: string | null;
  method?: string;
  details?: Record<string, unknown>;
}): void {
  const timestamp = new Date().toISOString();
  const logEntry = { timestamp, ...event };

  // Buffer logs (in production, batch send to logging service)
  securityLogBuffer.push(logEntry);
  if (securityLogBuffer.length > 100) {
    securityLogBuffer.shift(); // Keep last 100 entries
  }

  // Log to console for debugging/monitoring
  console.log(`[SECURITY] ${event.type} | IP: ${event.ip} | Path: ${event.path}`);
}

// Track failed requests for abuse detection
function trackFailedRequest(ip: string): void {
  const key = `failed:${ip}`;
  const record = rateLimitStore.get(key);

  if (record) {
    record.failedRequests++;
    // Auto-block if too many failed requests
    if (record.failedRequests > 50) {
      record.blocked = true;
      record.blockedUntil = Date.now() + 1800000; // 30 minutes
    }
  } else {
    rateLimitStore.set(key, {
      count: 0,
      resetTime: Date.now() + 3600000,
      blocked: false,
      blockedUntil: 0,
      violations: 0,
      failedRequests: 1,
    });
  }
}

// ===== MAIN MIDDLEWARE =====

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = getClientIP(request);
  const userAgent = request.headers.get('user-agent');
  const method = request.method;

  // Skip middleware for excluded patterns (static files, etc.)
  if (EXCLUDED_PATTERNS.some(pattern => pathname.startsWith(pattern))) {
    return NextResponse.next();
  }

  // Get CORS headers for this request
  const corsHeaders = getCorsHeaders(request);

  // Handle CORS preflight requests (OPTIONS)
  if (method === 'OPTIONS' && pathname.startsWith('/api/')) {
    return new NextResponse(null, {
      status: 204,
      headers: {
        ...corsHeaders,
        ...SECURITY_HEADERS,
      },
    });
  }

  // ===== SECURITY CHECKS (run on all requests) =====

  // 1. Check for suspicious patterns (potential attacks)
  if (hasSuspiciousPatterns(request)) {
    logSecurityEvent({
      type: 'SUSPICIOUS_PATTERN_BLOCKED',
      ip,
      path: pathname,
      userAgent,
      method,
      details: { url: request.url.substring(0, 500) },
    });
    trackFailedRequest(ip);

    return new NextResponse(
      JSON.stringify({ error: 'Invalid request' }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
          ...SECURITY_HEADERS,
        },
      }
    );
  }

  // 2. Bot detection for API routes
  if (pathname.startsWith('/api/') && isBotUserAgent(userAgent)) {
    logSecurityEvent({
      type: 'BOT_BLOCKED',
      ip,
      path: pathname,
      userAgent,
      method,
    });

    return new NextResponse(
      JSON.stringify({ error: 'Access denied' }),
      {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
          ...SECURITY_HEADERS,
        },
      }
    );
  }

  // 3. Rate limiting for API routes
  if (pathname.startsWith('/api/')) {
    const authenticated = isAuthenticated(request);
    const limitConfig = authenticated ? RATE_LIMITS.authenticated : RATE_LIMITS.public;

    // Stricter limits for expensive API endpoints (AI calls)
    const expensiveEndpoints = [
      '/api/analyze-cv',
      '/api/fetch-emails',
      '/api/screen',
      '/api/analyze-video',
      '/api/rewrite-cv',
    ];
    const isExpensive = expensiveEndpoints.some(ep => pathname.startsWith(ep));
    const rateLimitKey = isExpensive ? `${ip}:expensive` : `${ip}:${authenticated ? 'auth' : 'public'}`;

    const { allowed, remaining, resetIn, blocked } = checkRateLimit(
      rateLimitKey,
      isExpensive ? RATE_LIMITS.strictApi : limitConfig
    );

    if (!allowed) {
      logSecurityEvent({
        type: blocked ? 'IP_BLOCKED' : 'RATE_LIMITED',
        ip,
        path: pathname,
        userAgent,
        method,
        details: { authenticated, isExpensive, blocked },
      });

      const retryAfter = Math.ceil(resetIn / 1000);
      return new NextResponse(
        JSON.stringify({
          error: blocked
            ? 'Your IP has been temporarily blocked due to too many requests.'
            : 'Too many requests. Please slow down.',
          retryAfter,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': Math.ceil(Date.now() / 1000 + retryAfter).toString(),
            ...corsHeaders,
            ...SECURITY_HEADERS,
          },
        }
      );
    }

    // 4. CV upload fraud prevention
    if (pathname === '/api/analyze-cv' && method === 'POST') {
      const cvCheck = checkCVUploadLimit(ip, authenticated);

      if (!cvCheck.allowed) {
        logSecurityEvent({
          type: 'CV_UPLOAD_LIMIT_EXCEEDED',
          ip,
          path: pathname,
          userAgent,
          method,
        });

        return new NextResponse(
          JSON.stringify({ error: cvCheck.reason }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
              ...SECURITY_HEADERS,
            },
          }
        );
      }
    }
  }

  // ===== AUTH CHECK FOR PROTECTED ROUTES =====

  // Skip auth for public routes
  // Handle exact match for '/' and startsWith for other routes
  const isPublicRoute = PUBLIC_ROUTES.some(route => {
    if (route === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(route);
  });

  if (isPublicRoute) {
    const response = NextResponse.next();
    // Add security and CORS headers
    for (const [header, value] of Object.entries(SECURITY_HEADERS)) {
      response.headers.set(header, value);
    }
    for (const [header, value] of Object.entries(corsHeaders)) {
      response.headers.set(header, value);
    }
    return response;
  }

  // Create response that we'll modify
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  // Add security and CORS headers
  for (const [header, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(header, value);
  }
  for (const [header, value] of Object.entries(corsHeaders)) {
    response.headers.set(header, value);
  }

  // Create Supabase client for middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          // Re-add security and CORS headers after creating new response
          for (const [header, value] of Object.entries(SECURITY_HEADERS)) {
            response.headers.set(header, value);
          }
          for (const [header, value] of Object.entries(corsHeaders)) {
            response.headers.set(header, value);
          }
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Refresh session if it exists
  const { data: { session } } = await supabase.auth.getSession();

  // If session exists and trying to access auth pages, redirect to dashboard
  if (session && (pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/hire/dashboard', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    // Match all request paths except static files
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
