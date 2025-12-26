// Supabase client - shared between client and server
// Uses singleton pattern to prevent multiple client instances

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';

// Singleton instances (untyped for flexibility in API routes)
let anonClient: SupabaseClient | null = null;
let serviceClient: SupabaseClient | null = null;

// Supabase configuration with connection pooling options
const createSupabaseClientInstance = (supabaseUrl: string, supabaseKey: string, isServiceRole: boolean = false): SupabaseClient => {
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: !isServiceRole,
      persistSession: !isServiceRole,
      detectSessionInUrl: !isServiceRole,
    },
    global: {
      headers: {
        'x-application-name': 'hireinbox',
      },
    },
    db: {
      schema: 'public',
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  });
};

/**
 * Get the anonymous Supabase client (for client-side operations)
 * Uses NEXT_PUBLIC_SUPABASE_ANON_KEY
 */
export function getSupabaseClient(): SupabaseClient {
  if (anonClient) return anonClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase configuration: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  anonClient = createSupabaseClientInstance(supabaseUrl, supabaseAnonKey, false);
  return anonClient;
}

/**
 * Get the service role Supabase client (for server-side operations)
 * Uses SUPABASE_SERVICE_ROLE_KEY - bypasses RLS
 * IMPORTANT: Only use on server-side, never expose to client
 */
export function getSupabaseServiceClient(): SupabaseClient {
  if (serviceClient) return serviceClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase service configuration: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  serviceClient = createSupabaseClientInstance(supabaseUrl, supabaseServiceKey, true);
  return serviceClient;
}

/**
 * Create Supabase client for browser (Client Components)
 * Use this in 'use client' components
 */
export function createBrowserSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Legacy export for backward compatibility
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = supabaseUrl && supabaseAnonKey
  ? createSupabaseClientInstance(supabaseUrl, supabaseAnonKey, false)
  : null as unknown as SupabaseClient;

// Export types
export type { SupabaseClient };
