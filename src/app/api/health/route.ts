// /api/health - Health check endpoint for monitoring and uptime checks
// Returns system status, database connectivity, and environment validation

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  environment: string;
  checks: {
    database: {
      status: 'ok' | 'error';
      latency_ms?: number;
      error?: string;
    };
    openai: {
      status: 'ok' | 'error';
      configured: boolean;
    };
    email: {
      status: 'ok' | 'error';
      configured: boolean;
    };
    environment: {
      status: 'ok' | 'error';
      missing?: string[];
    };
  };
  uptime_seconds: number;
}

// Track server start time for uptime
const startTime = Date.now();

// Required environment variables
const REQUIRED_ENV_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'OPENAI_API_KEY',
];

const OPTIONAL_ENV_VARS = [
  'GMAIL_USER',
  'GMAIL_APP_PASSWORD',
  'CONVERTAPI_SECRET',
  'ANTHROPIC_API_KEY',
];

function validateEnvironment(): { valid: boolean; missing: string[] } {
  const missing: string[] = [];

  for (const envVar of REQUIRED_ENV_VARS) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}

async function checkDatabase(): Promise<{ status: 'ok' | 'error'; latency_ms?: number; error?: string }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return { status: 'error', error: 'Database credentials not configured' };
  }

  try {
    const start = Date.now();
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Simple query to test connectivity
    const { error } = await supabase.from('roles').select('id').limit(1);
    const latency = Date.now() - start;

    if (error) {
      return { status: 'error', error: error.message, latency_ms: latency };
    }

    return { status: 'ok', latency_ms: latency };
  } catch (e) {
    return { status: 'error', error: e instanceof Error ? e.message : 'Unknown database error' };
  }
}

export async function GET(): Promise<NextResponse<HealthCheck>> {
  const envCheck = validateEnvironment();
  const dbCheck = await checkDatabase();

  const openaiConfigured = !!process.env.OPENAI_API_KEY;
  const emailConfigured = !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);

  const checks = {
    database: dbCheck,
    openai: {
      status: openaiConfigured ? 'ok' as const : 'error' as const,
      configured: openaiConfigured,
    },
    email: {
      status: emailConfigured ? 'ok' as const : 'error' as const,
      configured: emailConfigured,
    },
    environment: {
      status: envCheck.valid ? 'ok' as const : 'error' as const,
      ...(envCheck.missing.length > 0 && { missing: envCheck.missing }),
    },
  };

  // Determine overall status
  let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

  if (dbCheck.status === 'error' || !envCheck.valid) {
    status = 'unhealthy';
  } else if (!emailConfigured) {
    status = 'degraded';
  }

  const health: HealthCheck = {
    status,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    checks,
    uptime_seconds: Math.floor((Date.now() - startTime) / 1000),
  };

  // Return 200 for healthy/degraded, 503 for unhealthy
  const httpStatus = status === 'unhealthy' ? 503 : 200;

  return NextResponse.json(health, { status: httpStatus });
}

// HEAD request for simple uptime monitoring (returns just status code)
export async function HEAD(): Promise<NextResponse> {
  const envCheck = validateEnvironment();
  const dbCheck = await checkDatabase();

  const isHealthy = envCheck.valid && dbCheck.status === 'ok';

  return new NextResponse(null, { status: isHealthy ? 200 : 503 });
}
