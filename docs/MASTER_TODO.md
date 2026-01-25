# HIREINBOX MASTER TODO LIST
> Last updated: 25 January 2026
> Status: MVP Audit Complete - Brutal Truth Assessment

---

## CRITICAL STATUS SUMMARY

| Area | Status | Notes |
|------|--------|-------|
| **B2B CV Screening** | REAL - WORKING | Fine-tuned GPT-4o-mini live |
| **B2C CV Analysis** | REAL - WORKING | Same model, real AI |
| **Video Analysis** | REAL - WORKING | Claude Vision live |
| **AI Interview** | REAL - WORKING | OpenAI Realtime API |
| **PayFast Payments** | REAL - WORKING | Sandbox tested |
| **Verification Services** | UI MOCKUP | No backend integration |
| **Recruiter Portal** | REMOVED | Replaced with Coming Soon |
| **Talent Pool** | PARTIAL | UI exists, data not saving |

---

## VERIFICATION UPSELLS - ACTION PLAN

**From employer dashboard modal - these show but don't work:**

### 1. ID Verification (R150)
| Aspect | Current | Needed |
|--------|---------|--------|
| UI | Working | - |
| Backend | Stubbed (alert only) | Real API endpoint |
| Integration | None | MIE or XDS API |
| Payment | Not wired | PayFast flow |

**Action Plan:**
1. Sign up for MIE (Managed Integrity Evaluation) or XDS Verify API
2. Create `/api/verification/id/route.ts` endpoint
3. Wire PayFast payment for R150 product
4. On payment success, call MIE/XDS API with candidate ID number
5. Store result in Supabase `verifications` table
6. Update candidate modal to show real result

**MIE Contact:** https://www.mie.co.za/api-solutions/
**XDS Contact:** https://www.xds.co.za/

---

### 2. Criminal Check (R250)
| Aspect | Current | Needed |
|--------|---------|--------|
| UI | Working | - |
| Backend | Stubbed | Real API endpoint |
| Integration | None | MIE/LexisNexis API |
| Payment | Not wired | PayFast flow |

**Action Plan:**
1. MIE offers criminal record checks via their API
2. Create `/api/verification/criminal/route.ts` endpoint
3. Wire PayFast payment for R250 product
4. On payment success, submit check request
5. Handle async response (2-5 business days)
6. Store result, notify employer when ready

**Note:** Criminal checks take time - need async notification system

---

### 3. Credit Check (R200)
| Aspect | Current | Needed |
|--------|---------|--------|
| UI | Working | - |
| Backend | Stubbed | Real API endpoint |
| Integration | None | TransUnion API |
| Payment | Not wired | PayFast flow |

**Action Plan:**
1. Apply for TransUnion API access (business account required)
2. Create `/api/verification/credit/route.ts` endpoint
3. Wire PayFast payment for R200 product
4. On payment success, call TransUnion API
5. Parse credit score and summary
6. Store result in Supabase

**TransUnion SA:** https://www.transunion.co.za/business
**Alternative:** XDS also offers credit reports

---

### 4. Reference Check (R200)
| Aspect | Current | Needed |
|--------|---------|--------|
| UI | Working | - |
| Backend | PARTIAL | Email sending |
| Integration | Claude (extraction) | Email service |
| Payment | Not wired | PayFast flow |

**Action Plan:**
1. Reference extraction from CV already works (Claude)
2. Reference form collection already works (`/reference/[token]`)
3. MISSING: Email sending to referees
4. Add SendGrid or Postmark integration
5. Wire PayFast payment for R200 product
6. On payment, send emails to extracted references
7. Track responses, notify employer when complete

**Current Implementation:**
- `/api/reference-check/route.ts` - extracts references
- `/reference/[token]/page.tsx` - form for referees
- STUB at line 223: "In production, send email here"

---

### 5. AI Interview (Button in modal)
| Aspect | Current | Needed |
|--------|---------|--------|
| UI | Working | - |
| Backend | WORKING | Analysis completion |
| Integration | OpenAI Realtime | Analysis endpoint |
| Payment | Not wired | PayFast flow |

**Current Status: MOSTLY REAL**
- Interview page works (`/interview/[candidateId]`)
- Question generation works (`/api/interview/start`)
- Voice recording works (OpenAI Realtime)
- Analysis endpoint incomplete (`/api/interview/analyze`)

**Action Plan:**
1. Complete `/api/interview/analyze/route.ts`
2. Use Claude to analyze transcript + video
3. Generate interview report (communication, technical, fit)
4. Wire PayFast payment for interview product
5. Store analysis in Supabase

---

### 6. Complete Verification Package (R700)
| Aspect | Current | Needed |
|--------|---------|--------|
| UI | Working | - |
| Bundle discount | Shows "SAVE R100" | Real calculation |
| Backend | None | Bundle order flow |

**Action Plan:**
1. Once individual checks work, create bundle endpoint
2. Single payment for R700 triggers all 4 checks
3. Track bundle progress (which checks complete)
4. Notify when all checks done

---

## PAYMENT INTEGRATION STATUS

**PayFast is REAL and WORKING:**
- `/src/lib/payfast.ts` - Full integration
- `/api/payments/create/route.ts` - Creates payments
- `/api/payments/notify/route.ts` - ITN webhook

**What's NOT wired:**
- Individual verification orders (currently show alert)
- B2C upsells (video analysis, etc.)
- Interview purchases

**Fix needed:**
Replace alert dialogs with actual PayFast payment flow.

---

## B2B (Employer Dashboard)

### Core Features
| # | Task | Status | Notes |
|---|------|--------|-------|
| 1 | Email inbox fetching | WORKING | IMAP integration real |
| 2 | Role creation wizard | WORKING | 4-step wizard |
| 3 | AI CV screening | WORKING | Fine-tuned model LIVE |
| 4 | Candidate cards + scoring | WORKING | AI reasoning displayed |
| 5 | Candidate detail modal | WORKING | Full breakdown |
| 6 | Authentication system | PARTIAL | Basic auth, no multi-tenant |
| 7 | Verification ordering | MOCKUP | Needs backend |
| 8 | AI Interview sending | PARTIAL | Works but not payment-gated |

### Infrastructure
| # | Task | Status | Notes |
|---|------|--------|-------|
| 9 | Deploy to Vercel | DONE | Live at hireinbox.co.za |
| 10 | Domain setup | DONE | hireinbox.co.za active |
| 11 | PayFast integration | DONE | Sandbox working |
| 12 | Production PayFast | PENDING | Need to go live |

---

## B2C (Job Seeker Tools)

### Core Features
| # | Task | Status | Notes |
|---|------|--------|-------|
| 13 | CV upload + AI analysis | WORKING | Real GPT-4o feedback |
| 14 | Video analysis | WORKING | Claude Vision LIVE |
| 15 | Results display | WORKING | Score, strengths shown |
| 16 | Payment for video | MOCKUP | Not wired to PayFast |

### Talent Pool
| # | Task | Status | Notes |
|---|------|--------|-------|
| 17 | Candidate signup form | UI ONLY | Form exists, no save |
| 18 | Employer job posting | UI ONLY | Form exists, no save |
| 19 | Supabase integration | MISSING | Need to wire up |

---

## B2Recruiter (Pro Tools)

### Status: ALL REMOVED/COMING SOON
| Page | Old Status | New Status |
|------|-----------|------------|
| /recruiter | MOCK data | Coming Soon page |
| /recruiter/clients | MOCK data | Redirects to Coming Soon |
| /recruiter/talent | MOCK data | Redirects to Coming Soon |
| /recruiter/commissions | MOCK data | Redirects to Coming Soon |
| /hire/recruiter/mapping | Non-functional | Coming Soon page |

**Decision:** Don't mislead users with fake data. Show Coming Soon until real.

---

## PRIORITY FIXES (Ship Quality)

### P0 - CRITICAL (Before more marketing)
| # | Task | Est. Effort |
|---|------|-------------|
| 1 | Wire verification orders to PayFast | 2-4 hours |
| 2 | Add email service for reference checks | 2-3 hours |
| 3 | Complete AI interview analysis endpoint | 3-4 hours |
| 4 | Fix talent pool data saving to Supabase | 2-3 hours |
| 5 | Production PayFast activation | 1 hour |

### P1 - IMPORTANT (Next sprint)
| # | Task | Est. Effort |
|---|------|-------------|
| 6 | MIE/XDS API integration for ID verification | 1-2 days |
| 7 | TransUnion API for credit checks | 1-2 days |
| 8 | Async notification system for verifications | 4-6 hours |
| 9 | Bundle verification order flow | 2-3 hours |

### P2 - NICE TO HAVE
| # | Task | Est. Effort |
|---|------|-------------|
| 10 | WhatsApp notifications | 1-2 days |
| 11 | Multi-tenant authentication | 2-3 days |
| 12 | Recruiter portal (real implementation) | 1-2 weeks |

---

## THIRD-PARTY SERVICES NEEDED

| Service | Purpose | Provider Options | Est. Cost |
|---------|---------|-----------------|-----------|
| ID Verification | Home Affairs check | MIE, XDS | ~R30-50/check |
| Criminal Check | SAPS records | MIE | ~R80-150/check |
| Credit Check | TransUnion report | TransUnion, XDS | ~R50-100/check |
| Email Service | Reference requests | SendGrid, Postmark | ~$15-30/mo |
| SMS (optional) | Notifications | Clickatell, BulkSMS | Pay per use |

**Margin Analysis:**
- ID Check: Sell R150, cost ~R40 = R110 profit
- Criminal: Sell R250, cost ~R100 = R150 profit
- Credit: Sell R200, cost ~R70 = R130 profit
- Reference: Sell R200, cost ~R5 (email) = R195 profit

---

## WHAT'S REAL vs FAKE - FINAL AUDIT

### REAL AND WORKING
- B2B CV screening with fine-tuned AI
- B2C CV analysis with real feedback
- Video analysis with Claude Vision
- AI Interview recording and transcription
- PayFast payment infrastructure
- Email inbox fetching (IMAP)
- Role creation wizard
- Candidate scoring and display

### UI MOCKUP ONLY (No Backend)
- All verification services (ID, Criminal, Credit)
- Verification bundle ordering
- B2C payment flows
- Talent pool data persistence
- Recruiter multi-client management
- Commission tracking
- Talent mapping/intelligence

### PARTIAL (Needs Completion)
- Reference check (extraction works, email sending missing)
- AI Interview analysis (recording works, analysis incomplete)
- Authentication (basic works, multi-tenant missing)

---

## CONTACT INFORMATION FOR INTEGRATIONS

**MIE (Managed Integrity Evaluation)**
- Website: https://www.mie.co.za
- Services: ID, Criminal, Credit, Qualifications
- API: Available for business accounts

**XDS**
- Website: https://www.xds.co.za
- Services: ID verification, Credit reports
- API: REST API available

**TransUnion SA**
- Website: https://www.transunion.co.za/business
- Services: Credit reports, Consumer data
- API: Business API program

**SendGrid (Email)**
- Website: https://sendgrid.com
- Free tier: 100 emails/day
- Paid: From $15/month

**Postmark (Email)**
- Website: https://postmarkapp.com
- Free trial: 100 emails
- Paid: From $15/month

---

## REMINDERS

1. **Core AI is REAL** - This is the moat, it works
2. **Verifications are the upsell** - High margin, need to implement
3. **Don't show fake data** - Coming Soon is honest
4. **PayFast is ready** - Just needs wiring to products
5. **Reference check is closest to working** - Just add email
6. **Monitor OpenAI spend** - https://platform.openai.com/usage
7. **POPIA compliance** - All verification needs consent

---

*"We have just begun..." - Simon Rubin, Founder*
*Last audit: 25 January 2026*
