# HIREINBOX - MILESTONES & DEFINITION OF DONE
> Review this document DAILY
> Last Updated: 20 December 2024

---

## MILESTONE 1: AI EXCELLENCE
**Target: Before any client sees the product**

| Capability | Definition of DONE | Status |
|------------|-------------------|--------|
| Training Data Generated | 300 jobs + 1000 CVs in JSON files | Jobs DONE, CVs IN PROGRESS |
| AI Screening Run | 1000 CV-job pairs screened, results in JSON | Pending |
| Human Review Complete | Simon reviews 100 samples, marks agree/disagree | Pending |
| AI Accuracy >85% | AI matches human judgment 85%+ of the time | Pending |
| SA Context Verified | Tested with real SA CVs, recognizes BCom/CA(SA) | Pending |

**DONE WHEN:** A recruiter can upload 10 real CVs and the AI recommendations match what they would decide manually 85%+ of the time.

---

## MILESTONE 2: B2C LIVE
**Target: Job seekers can use the product**

| Capability | Definition of DONE | Status |
|------------|-------------------|--------|
| Signup Flow | User can create account with name, email, password | Not built |
| Email Verification | User receives email, clicks to verify | Not built |
| Login/Logout | User can login and logout | Not built |
| CV Upload | Supports .pdf, .doc, .docx up to 5MB | PARTIAL (.doc works, .pdf broken) |
| AI Analysis | Returns score, strengths, improvements in <30 seconds | WORKING |
| Results Display | Clean, mobile-responsive results page | WORKING |
| 1 Free Assessment | Counter shows free assessment used | Not built |
| Upsell Display | Shows Video R49, Passport R99 options | WORKING (UI only) |

**DONE WHEN:** A job seeker can signup, upload their CV, see AI feedback, and be prompted to pay for more. PDF upload works.

---

## MILESTONE 3: B2B LIVE
**Target: Employers can use the product**

| Capability | Definition of DONE | Status |
|------------|-------------------|--------|
| Employer Signup | Company name, email, password | Not built |
| Email Verification | Employer verifies email | Not built |
| Login/Logout | Employer can login and logout | Not built |
| Create Role | 4-step wizard completes, role saved to DB | WORKING |
| Connect Email | IMAP connection to Gmail/Outlook works | WORKING |
| Fetch Candidates | CVs pulled from email automatically | WORKING |
| AI Screening | All CVs screened with scores and evidence | WORKING |
| Candidate Cards | Shows score, recommendation, key evidence | WORKING |
| Candidate Modal | Full breakdown with all details | WORKING |
| 10 Free Assessments | Counter shows remaining free CVs | Not built |
| Upgrade Prompt | Shows when free tier exhausted | Not built |

**DONE WHEN:** An employer can signup, create a role, connect their email, and see AI-screened candidates with evidence. 10 free CVs work.

---

## MILESTONE 4: PAYMENTS LIVE
**Target: Money flows**

| Capability | Definition of DONE | Status |
|------------|-------------------|--------|
| Yoco Integration | Card payments work in ZAR | Not built |
| B2C One-Time | Can pay R29/R49/R99 for upsells | Not built |
| B2B Subscription | Can pay R299/R599/R999 monthly | Not built |
| Receipts | Email receipt after payment | Not built |
| Usage Tracking | System tracks paid vs free usage | Not built |

**DONE WHEN:** A customer can pay with a South African card and access paid features. Receipt is emailed.

---

## MILESTONE 5: PRODUCTION DEPLOY
**Target: Live on the internet**

| Capability | Definition of DONE | Status |
|------------|-------------------|--------|
| Vercel Deploy | App runs on Vercel | Not done |
| Custom Domain | hireinbox.co.za points to app | Not done |
| SSL Certificate | HTTPS works | Not done |
| Environment Vars | All secrets in Vercel, not code | Not done |
| Error Monitoring | Sentry catches errors | Not done |
| Analytics | PostHog/Mixpanel tracks usage | Not done |

**DONE WHEN:** Anyone can visit hireinbox.co.za, signup, and use the product. Errors are logged.

---

## MILESTONE 6: LEGAL READY
**Target: Can legally operate**

| Capability | Definition of DONE | Status |
|------------|-------------------|--------|
| Privacy Policy | Page exists at /privacy | Not done |
| Terms of Service | Page exists at /terms | Not done |
| POPIA Consent | Checkbox + consent text on signup | Not done |
| Cookie Banner | Shows on first visit | Not done |

**DONE WHEN:** A lawyer would say "this is compliant enough to launch."

---

## MILESTONE 7: INTERNAL BACKEND (LAUNCH BLOCKER)
**Target: Team can operate the business**

| Capability | Definition of DONE | Status |
|------------|-------------------|--------|
| Admin Login | Separate admin auth, only Simon access | Not built |
| Customer List | View all B2B/B2C accounts with status | Not built |
| Customer Search | Find customer by email/company | Not built |
| Customer Detail | See usage, payments, history | Not built |
| Revenue Dashboard | MRR, total revenue, growth | Not built |
| Cost Tracking | OpenAI spend, cost per CV | Not built |
| Error Monitoring | Sentry integration, alerts | Not built |
| POPIA Requests | Handle data deletion requests | Not built |

**DONE WHEN:** Simon can see all customers, revenue, costs, and errors in one place. Can handle POPIA requests.

---

## MILESTONE 8: FIRST 10 CUSTOMERS
**Target: Real revenue**

| Capability | Definition of DONE | Status |
|------------|-------------------|--------|
| Demo Video | Loom video showing product | Not done |
| Outreach List | 20 warm leads identified | Not done |
| First B2C User | 1 job seeker signed up, used free assessment | Not done |
| First B2B User | 1 employer signed up, screened CVs | Not done |
| First Payment | R1 received from real customer | Not done |
| 10 Paying Users | 10 people have paid (B2B or B2C) | Not done |

**DONE WHEN:** R10,000 total revenue received.

---

## MILESTONE 8: B2RECRUITER LIVE (PHASE 3)
**Target: Pro recruiter tools work**

| Capability | Definition of DONE | Status |
|------------|-------------------|--------|
| Recruiter Signup | Agency can create account | Not built |
| AI Interview - Record | Candidate can record video answers | Not built |
| AI Interview - Transcribe | Whisper transcribes audio | Not built |
| AI Interview - Analyze | GPT-4o analyzes answers | Not built |
| Interview Report | Recruiter sees transcript + AI notes | Not built |
| Talent Pool Search | Can search B2C opt-in candidates | Not built |

**DONE WHEN:** A recruiter can send interview link, candidate records answers, recruiter sees AI analysis.

---

## CURRENT FOCUS

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   NOW:        MILESTONE 1 - AI EXCELLENCE                       │
│               (Training data generating...)                     │
│                                                                 │
│   NEXT:       MILESTONE 2 - B2C LIVE                            │
│               (Signup, PDF fix, free tier)                      │
│                                                                 │
│   THEN:       MILESTONE 3 - B2B LIVE                            │
│               (Signup, 10 free tier)                            │
│                                                                 │
│   BLOCKED:    MILESTONE 4 - PAYMENTS                            │
│               (Need Yoco account)                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## DAILY CHECK-IN QUESTIONS

Ask yourself every day:

1. **What milestone am I on?**
2. **What's the next DONE I need to achieve?**
3. **What's blocking me?**
4. **Is the AI getting better?** (Check accuracy)
5. **Have I talked to a real user today?**

---

## LAUNCH CRITERIA

**Minimum to launch (MVP):**
- [ ] Milestone 1: AI Excellence (85%+ accuracy)
- [ ] Milestone 2: B2C Live (signup + PDF working)
- [ ] Milestone 3: B2B Live (signup + 10 free)
- [ ] Milestone 4: Payments Live (Yoco working)
- [ ] Milestone 5: Production Deploy (hireinbox.co.za)
- [ ] Milestone 6: Legal Ready (privacy + terms)
- [ ] Milestone 7: Internal Backend (admin dashboard)

**Nice to have for launch:**
- [ ] Demo video
- [ ] 3 beta testers who say "this is good"

**NOT needed for launch:**
- [ ] B2Recruiter features
- [ ] WhatsApp integration
- [ ] Job posting to platforms
- [ ] AI Interview

---

*"Ship when it's good enough to charge for. Polish forever after that." - Simon Rubin*
