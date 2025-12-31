import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ============================================
// Auth Callback Route
// Handles OAuth redirects (Google), magic links, and email confirmations
// ============================================

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');
  const next = requestUrl.searchParams.get('next') || '/dashboard';

  // Handle errors from Supabase
  if (error) {
    console.error('[Auth Callback] Error:', error, errorDescription);
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(errorDescription || error)}`, request.url)
    );
  }

  if (code) {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options);
              });
            } catch {
              // Handle cookie errors in server components
            }
          },
        },
      }
    );

    try {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        console.error('[Auth Callback] Exchange error:', exchangeError);
        return NextResponse.redirect(
          new URL(`/login?error=${encodeURIComponent(exchangeError.message)}`, request.url)
        );
      }

      // Get the user to determine redirect
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        console.log('[Auth Callback] Success - User:', user.email);

        // Determine redirect based on user metadata or default
        const userType = user.user_metadata?.user_type;
        let redirectTo = next;

        // Check if this is a new user (created within last 5 minutes)
        const createdAt = new Date(user.created_at);
        const now = new Date();
        const isNewUser = (now.getTime() - createdAt.getTime()) < 5 * 60 * 1000;

        if (isNewUser && (next === '/dashboard' || next === '/')) {
          // New users go to onboarding
          const onboardingType = userType === 'jobseeker' ? 'jobseeker' : 'employer';
          redirectTo = `/onboarding?type=${onboardingType}`;
        } else if (next === '/dashboard' || next === '/') {
          // Existing users go to appropriate page
          redirectTo = userType === 'jobseeker' ? '/upload' : '/dashboard';
        }

        return NextResponse.redirect(new URL(redirectTo, request.url));
      }
    } catch (err) {
      console.error('[Auth Callback] Exception:', err);
      return NextResponse.redirect(
        new URL('/login?error=Authentication failed', request.url)
      );
    }
  }

  // No code provided - redirect to login
  return NextResponse.redirect(new URL('/login', request.url));
}
