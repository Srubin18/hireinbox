# HireInbox V1 Ship Plan - 24-48 Hour Sprint

**Status:** Dev server running. Auth + DB ready to wire. V3 brain deployed.

---

## CRITICAL PATH (Do in order)

### PHASE 1: DATABASE SETUP (30 min)
**Goal:** Get Supabase tables ready for production data

1. **Run SQL Migrations in Supabase:**
   - Go to: https://app.supabase.com → HireInbox project → SQL Editor
   - Copy-paste entire contents of `/scripts/migrations/001_create_payments_tables.sql`
   - Copy-paste entire contents of `/scripts/migrations/002_create_whatsapp_tables.sql`
   - Copy-paste entire contents of `/scripts/migrations/004_interview_scheduling.sql`
   - Copy-paste entire contents of `/scripts/migrations/005_talent_pool.sql`
   - Run each one in order
   
2. **Create critical tables (if not exist):**
   ```sql
   -- Organizations table (for B2B multi-user)
   CREATE TABLE IF NOT EXISTS organizations (
       id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
       name TEXT NOT NULL,
       domain TEXT,
       user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
       created_at TIMESTAMPTZ DEFAULT NOW(),
       updated_at TIMESTAMPTZ DEFAULT NOW()
   );
   
   -- Team members table
   CREATE TABLE IF NOT EXISTS team_members (
       id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
       organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
       user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
       role TEXT NOT NULL DEFAULT 'recruiter', -- admin, recruiter, viewer
       created_at TIMESTAMPTZ DEFAULT NOW(),
       UNIQUE(organization_id, user_id)
   );
   
   -- Candidates table (screening results)
   CREATE TABLE IF NOT EXISTS candidates (
       id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
       organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
       user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
       name TEXT,
       email TEXT,
       phone TEXT,
       cv_text TEXT,
       cv_url TEXT,
       role_id UUID,
       source TEXT, -- email, upload, api
       overall_score INTEGER,
       recommendation TEXT, -- SHORTLIST, CONSIDER, REJECT
       strengths JSONB,
       improvements JSONB,
       risks JSONB,
       raw_response JSONB,
       created_at TIMESTAMPTZ DEFAULT NOW(),
       updated_at TIMESTAMPTZ DEFAULT NOW()
   );
   
   -- Profiles table (sync with auth.users)
   CREATE TABLE IF NOT EXISTS profiles (
       id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
       full_name TEXT,
       avatar_url TEXT,
       user_type TEXT, -- b2b, b2c
       created_at TIMESTAMPTZ DEFAULT NOW(),
       updated_at TIMESTAMPTZ DEFAULT NOW()
   );
   
   -- Create indexes
   CREATE INDEX IF NOT EXISTS idx_organizations_user_id ON organizations(user_id);
   CREATE INDEX IF NOT EXISTS idx_candidates_user_id ON candidates(user_id);
   CREATE INDEX IF NOT EXISTS idx_candidates_organization_id ON candidates(organization_id);
   CREATE INDEX IF NOT EXISTS idx_team_members_org_id ON team_members(organization_id);
   
   -- Enable RLS
   ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
   ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
   ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
   ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
   
   -- RLS Policies
   CREATE POLICY "Users can create their own org"
       ON organizations FOR INSERT
       WITH CHECK (auth.uid() = user_id);
   
   CREATE POLICY "Users can read their org"
       ON organizations FOR SELECT
       USING (auth.uid() = user_id OR id IN (
           SELECT organization_id FROM team_members WHERE user_id = auth.uid()
       ));
   
   CREATE POLICY "Team members can see candidates"
       ON candidates FOR SELECT
       USING (user_id = auth.uid() OR organization_id IN (
           SELECT organization_id FROM team_members WHERE user_id = auth.uid()
       ));
   
   CREATE POLICY "Users can insert their own candidates"
       ON candidates FOR INSERT
       WITH CHECK (auth.uid() = user_id);
   ```

3. **Verify all tables exist:**
   - Supabase Dashboard → Table editor
   - Should see: subscriptions, usage_tracking, payments, organizations, candidates, profiles, team_members, interview_slots, etc.

---

### PHASE 2: API ROUTES (1 hour)
**Goal:** Wire auth checks and usage limits

1. **Add middleware protection:**
   - Create/update `src/middleware.ts`:
   ```typescript
   import { type NextRequest, NextResponse } from 'next/server';
   
   export function middleware(request: NextRequest) {
     const { pathname } = request.nextUrl;
     
     // Public routes
     const publicRoutes = ['/login', '/signup', '/upload', '/pricing', '/privacy', '/terms', '/api/health'];
     if (publicRoutes.some(route => pathname.startsWith(route))) {
       return NextResponse.next();
     }
     
     // Protected routes need auth (will check session in layout)
     return NextResponse.next();
   }
   
   export const config = {
     matcher: [
       '/((?!_next/static|_next/image|favicon.ico|logo|icon).*)',
     ],
   };
   ```

2. **Update API routes to check usage:**
   - `/api/analyze-cv/route.ts`: Add usage check before OpenAI call
   - `/api/fetch-emails/route.ts`: Add usage check before screening
   - `/api/screen/route.ts`: Add usage check
   - Pattern:
   ```typescript
   // Check free tier or subscription
   const { data: { user } } = await supabase.auth.getUser();
   const remaining = await checkUsageRemaining(user.id);
   if (remaining <= 0) {
       return NextResponse.json({ error: 'Upgrade required' }, { status: 402 });
   }
   // ... proceed with AI call
   ```

3. **Wire PayFast callbacks:**
   - `/api/payments/notify` webhook handler exists
   - Ensure it creates subscription record when payment succeeds
   - Test with PayFast sandbox webhook tool

---

### PHASE 3: GOOGLE OAUTH (30 min)
**Goal:** Enable Google sign-in for faster onboarding

1. **Get Google OAuth Credentials:**
   - Go to: https://console.cloud.google.com/
   - Create OAuth 2.0 Client ID
   - Authorized redirect URIs:
     - `http://localhost:3000/auth/callback`
     - `https://hireinbox.vercel.app/auth/callback`
     - `https://hireinbox.co.za/auth/callback` (when domain live)

2. **Add to Supabase:**
   - Dashboard → Authentication → Providers
   - Enable Google
   - Paste Client ID + Secret
   - Callback URL already set

3. **Test locally:**
   - Go to http://localhost:3000/login
   - Click "Sign in with Google"
   - Should redirect to Google, then back to dashboard

---

### PHASE 4: PAYMENT FLOW (1 hour)
**Goal:** Test Stripe/PayFast end-to-end

1. **PayFast Sandbox Testing:**
   - Merchant ID: 10000100 (test account)
   - Test card: Use PayFast sandbox
   - Flow: B2B signup → Pick tier → Checkout → PayFast form → Confirm payment → Redirect back

2. **Update checkout flow:**
   - `/api/payments/create` should generate PayFast URL
   - Ensure it saves subscription on callback
   - Set usage limits per tier:
     - **Free:** 10 CV screenings/month
     - **Starter:** 50 CV screenings/month (R399)
     - **Growth:** 250 CV screenings/month (R1,999)
     - **Business:** Unlimited (R4,999)

3. **B2C pricing:**
   - Single scan: R29 (1 CV)
   - Practice pack: R79 (5 scans)
   - Full suite: R149 (unlimited for 30 days)

---

### PHASE 5: ENV VARIABLES FOR VERCEL (15 min)
**Goal:** Prepare production secrets

Add to Vercel:
```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://uloenybeeozjwfsuhbpi.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_jQUhRCynPt01SQ0arL3oRQ_BCu1DJWm
SUPABASE_SERVICE_ROLE_KEY=sb_secret_ATD8sA7LUFJ1oTGo206rHw_RseC6nSO

# OpenAI (for V3 fine-tuned model)
OPENAI_API_KEY=sk-proj-...

# PayFast
PAYFAST_MERCHANT_ID=[get from PayFast]
PAYFAST_MERCHANT_KEY=[get from PayFast]
PAYFAST_PASSPHRASE=[get from PayFast]
PAYFAST_PRODUCTION=true

# Anthropic (Claude Vision for video)
ANTHROPIC_API_KEY=[get from Anthropic]

# Optional
GMAIL_USER=ssrubin18@gmail.com
GMAIL_APP_PASSWORD=[get from Gmail]
```

---

### PHASE 6: DEPLOY TO VERCEL (30 min)
**Goal:** Ship to production

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Deploy:**
   ```bash
   cd /Users/simon/Desktop/hireinbox
   vercel
   ```

3. **Answer prompts:**
   - Link to existing Vercel project (or create new)
   - Confirm env vars are set
   - Deploy to production

4. **Test production:**
   - Sign up on https://hireinbox.vercel.app
   - Upload CV (B2C)
   - Check if analysis works
   - Test B2B dashboard after signup

---

## TESTING CHECKLIST

**Before "ship":**
- [ ] User can sign up (email/password)
- [ ] User can sign up (Google OAuth)
- [ ] B2C user can upload CV and get analysis
- [ ] B2C user can see PayFast checkout
- [ ] B2B user can see dashboard
- [ ] B2B user can see pricing and subscribe
- [ ] Payment creates subscription record
- [ ] API rate limits work (usage check)
- [ ] V3 brain responds with correct scoring

---

## TIMELINE

- **Database Setup:** 30 min
- **API Routes:** 1 hour
- **Google OAuth:** 30 min
- **Payment Flow:** 1 hour
- **Vercel Prep:** 15 min
- **Deploy:** 30 min
- **Testing:** 1-2 hours

**Total: ~5-6 hours of focused work**

---

## SUCCESS CRITERIA

✅ **MVP is shipped when:**
1. Users can register (B2B + B2C)
2. B2C can upload + analyze CVs
3. B2B can see dashboard + pricing
4. Payments process through PayFast
5. V3 brain works for screening
6. All routes protected by auth
7. Usage limits enforced
8. Zero unhandled errors in production

---

## NEXT STEP

**Do Phase 1 now:** Run the SQL migrations in Supabase.

Link when done: https://app.supabase.com/projects

I'll then build Phase 2-3 while you complete DB setup.
