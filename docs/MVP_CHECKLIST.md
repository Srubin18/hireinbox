# HIREINBOX MVP CHECKLIST - COMPLETE

**Started:** 25 January 2026
**Goal:** 100% functional MVP - everything works perfectly
**Status:** In Progress

---

## PROGRESS TRACKER

| Category | Total | Done | Remaining |
|----------|-------|------|-----------|
| CRITICAL | 25 | 19 | 6 |
| HIGH | 30 | 15 | 15 |
| MEDIUM | 25 | 0 | 25 |
| LOW | 20 | 0 | 20 |
| POST-MVP | 15 | 0 | 15 |
| **TOTAL** | **115** | **34** | **81** |

**Progress: 29.6% complete** (34/115 items done)

---

## CRITICAL (Ship Blockers) - 25 Items

| # | Item | Status | Notes |
|---|------|--------|-------|
| 1 | Homepage: Add clear value proposition - "AI screens your CVs in seconds" | [x] | Done - RALPH + Design refresh |
| 2 | Homepage: Add social proof section (even if "Beta users" for now) | [x] | Done - "We're new but real" section |
| 3 | Homepage: Add product demo video or animated GIF | [x] | Done - workflow preview + sample output |
| 4 | Signup: Add company name field for employers | [x] | Done - RALPH |
| 5 | Signup: Show what user gets after signup | [x] | Done - "What you'll get" section |
| 6 | Employer Dashboard: Build onboarding flow (step 1-2-3) | [x] | Done - RALPH |
| 7 | Employer Dashboard: Simplify email setup (hide IMAP complexity) | [x] | Done - Gmail/Outlook modals |
| 8 | Employer Dashboard: Show pricing BEFORE user invests time | [x] | Done - pricing banner |
| 9 | Payment: Integrate PayFast/Yoco properly | [ ] | Simon handling |
| 10 | Payment: Test payment flow end-to-end | [ ] | Simon handling |
| 11 | Payment: Add payment success/failure handling | [ ] | |
| 12 | Talent Pool Join: Actually save candidate data to Supabase | [x] | Done - RALPH |
| 13 | Talent Pool Join: Create candidates table if missing | [x] | Done - migration created |
| 14 | Talent Pool Browse: Replace fake data with real query | [x] | Done - RALPH |
| 15 | Talent Pool Post-Job: Connect to real payment | [ ] | |
| 16 | Candidate Flow: Fix /candidates/new-career or remove it | [x] | Done - RALPH |
| 17 | Candidate Flow: Create /candidates/video page | [x] | Done - RALPH |
| 18 | Candidate Flow: Save analysis results to user account | [x] | Done - RALPH |
| 19 | Candidate Dashboard: Fetch real data from Supabase | [x] | Done - RALPH |
| 20 | Recruiter Portal: Make fully functional (not mock data) | [x] | Done - RALPH |
| 21 | API: Add rate limiting to all endpoints | [x] | Done - rate-limit.ts |
| 22 | API: Add proper error responses (not stack traces) | [x] | Done - api-error.ts |
| 23 | Auth: Verify business emails for employers | [x] | Done - email-validation.ts |
| 24 | Legal: Get POPIA compliance review | [ ] | Simon handling |
| 25 | Legal: Get terms/privacy reviewed by lawyer | [ ] | Simon handling |

---

## HIGH PRIORITY (User Experience) - 30 Items

| # | Item | Status | Notes |
|---|------|--------|-------|
| 26 | Login: Change "Welcome back" based on context | [x] | Done - "Back to hiring" / "Check your progress" |
| 27 | Login: Add password requirement hints | [x] | Done - placeholder shows "At least 8 characters" |
| 28 | Login: Explain magic link feature | [x] | Already has explanation in success state |
| 29 | Signup: Add password strength indicator | [ ] | |
| 30 | Signup: Send welcome email after signup | [ ] | Needs email service |
| 31 | Dashboard: Add empty state with clear CTA | [x] | Done - onboarding wizard handles empty state |
| 32 | Dashboard: Show recent activity feed | [ ] | |
| 33 | Dashboard: Add quick stats (CVs screened, roles active) | [ ] | |
| 34 | Role Creation: Make it more prominent | [ ] | |
| 35 | Role Creation: Add role templates (common SA roles) | [ ] | |
| 36 | Email Setup: Add "Connect Gmail" one-click option | [x] | Done - RALPH |
| 37 | Email Setup: Add "Connect Outlook" one-click option | [x] | Done - RALPH |
| 38 | Email Setup: Test connection before saving | [ ] | |
| 39 | Candidate Results: Add "Save to account" CTA | [x] | Done - RALPH |
| 40 | Candidate Results: Add "Share results" feature | [ ] | |
| 41 | Candidate Results: Add "Improve my CV" upsell | [ ] | |
| 42 | Candidate Results: Email results to user | [ ] | Needs email service |
| 43 | Pricing Page: Add "Get Started" buttons | [x] | Already has buttons |
| 44 | Pricing Page: Add FAQ section | [x] | Already has FAQ section |
| 45 | Pricing Page: Add comparison table | [ ] | |
| 46 | About Page: Add team photos/bios | [x] | Done - Simon's section with story |
| 47 | About Page: Add mission statement | [x] | Done - founder story replaces mission |
| 48 | About Page: Add press/media section | [ ] | Not needed for MVP |
| 49 | FAQ: Add more questions based on user feedback | [ ] | |
| 50 | Navigation: Add breadcrumbs | [ ] | |
| 51 | Navigation: Add "Back" buttons consistently | [x] | Done - all main pages |
| 52 | Navigation: Mobile menu improvements | [ ] | |
| 53 | Footer: Add contact information | [x] | Done - Simon's email on all pages |
| 54 | Footer: Add social links | [ ] | |
| 55 | 404 Page: Create custom 404 with navigation | [x] | Done |

---

## MEDIUM PRIORITY (Polish) - 25 Items

| # | Item | Status | Notes |
|---|------|--------|-------|
| 56 | All pages: Consistent button styles | [ ] | |
| 57 | All pages: Consistent spacing/padding | [ ] | |
| 58 | All pages: Loading states for all async operations | [ ] | |
| 59 | All pages: Error states with recovery actions | [ ] | |
| 60 | All forms: Validation messages | [ ] | |
| 61 | All forms: Autosave drafts | [ ] | |
| 62 | Dashboard: Keyboard shortcuts | [ ] | |
| 63 | Dashboard: Bulk actions for candidates | [ ] | |
| 64 | Dashboard: Search/filter candidates | [ ] | |
| 65 | Dashboard: Sort candidates by score/date | [ ] | |
| 66 | Reports: Make charts interactive | [ ] | |
| 67 | Reports: Add date range selector | [ ] | |
| 68 | Reports: CSV export formatting | [ ] | |
| 69 | Settings: Profile photo upload | [ ] | |
| 70 | Settings: Company logo requirements | [ ] | |
| 71 | Settings: Notification preferences | [ ] | |
| 72 | Candidate Card: Expand/collapse details | [ ] | |
| 73 | Candidate Card: Quick actions (email, shortlist) | [ ] | |
| 74 | Candidate Modal: Better layout | [ ] | |
| 75 | Candidate Modal: CV preview | [ ] | |
| 76 | Mobile: Test all flows on actual phones | [ ] | |
| 77 | Mobile: Touch targets 44px minimum | [ ] | |
| 78 | Mobile: Swipe gestures for cards | [ ] | |
| 79 | Performance: Lazy load images | [ ] | |
| 80 | Performance: Optimize bundle size | [ ] | |

---

## LOW PRIORITY (Nice to Have) - 20 Items

| # | Item | Status | Notes |
|---|------|--------|-------|
| 81 | Dark mode support | [ ] | |
| 82 | Language toggle (Afrikaans?) | [ ] | |
| 83 | Accessibility audit (WCAG) | [ ] | |
| 84 | SEO optimization | [ ] | |
| 85 | Blog/content section | [ ] | |
| 86 | Case studies page | [ ] | |
| 87 | Integrations page | [ ] | |
| 88 | API documentation | [ ] | |
| 89 | Changelog page | [ ] | |
| 90 | Status page | [ ] | |
| 91 | Help center/docs | [ ] | |
| 92 | Chat support widget | [ ] | |
| 93 | Feedback collection | [ ] | |
| 94 | NPS surveys | [ ] | |
| 95 | Referral program | [ ] | |
| 96 | Affiliate program | [ ] | |
| 97 | Partner portal | [ ] | |
| 98 | White-label options | [ ] | |
| 99 | Enterprise features | [ ] | |
| 100 | Custom domains | [ ] | |

---

## POST-MVP (Tier 2 Features) - 15 Items

| # | Item | Status | Notes |
|---|------|--------|-------|
| 101 | Recruiter portal advanced features | [ ] | |
| 102 | AI Interview (voice) - production ready | [ ] | |
| 103 | Reference checking automation | [ ] | |
| 104 | Background check integration (MIE) | [ ] | |
| 105 | Skills assessments | [ ] | |
| 106 | Video interview recording | [ ] | |
| 107 | Calendar integrations | [ ] | |
| 108 | WhatsApp notifications | [ ] | |
| 109 | Slack integration | [ ] | |
| 110 | ATS integrations (BambooHR, etc) | [ ] | |
| 111 | Bulk candidate import | [ ] | |
| 112 | Job posting distribution | [ ] | |
| 113 | Candidate sourcing | [ ] | |
| 114 | Talent marketplace | [ ] | |
| 115 | Mobile apps (iOS/Android) | [ ] | |

---

## WORK LOG

| Date | Item # | Description | Status |
|------|--------|-------------|--------|
| 25 Jan 2026 | - | Recruiter portal → Coming Soon (was misleading) | Done |
| 25 Jan 2026 | - | Created audit documents | Done |
| 25 Jan 2026 | 1-3 | Homepage: value prop, social proof, workflow preview | Done |
| 25 Jan 2026 | 4-5 | Signup: company name field, benefits section | Done |
| 25 Jan 2026 | 6-8 | Dashboard: onboarding wizard, email setup, pricing | Done |
| 25 Jan 2026 | 12-14 | Talent Pool: save to Supabase, real queries | Done |
| 25 Jan 2026 | 16-19 | Candidate Flow: new-career, video page, save results | Done |
| 25 Jan 2026 | 20 | Recruiter Portal: fully functional with Supabase | Done |
| 25 Jan 2026 | 21-22 | API: rate limiting, error handling | Done |
| 25 Jan 2026 | 23 | Auth: business email validation | Done |
| 25 Jan 2026 | - | Design refresh: reduce AI-looking score 7/10 → 4-5/10 | Done |
| 25 Jan 2026 | - | Founder presence added (Simon's story, personality) | Done |
| 25 Jan 2026 | - | Warmer copy across all pages | Done |

---

## NOTES

- **Simon handling:** Payment integration (Yoco), API setup for MIE, POPIA legal review
- **Claude handling:** All code/UI fixes
- **UI concern:** ~~Site looks AI-generated~~ Design refresh done - warmer, more authentic
- **Launch target:** TBD - when all CRITICAL items are done
- **Remaining CRITICAL:** 6 items (payment 3x, job posting payment, legal 2x)

---

*Updated: 25 January 2026 (overnight work session)*
