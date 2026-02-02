# HIREINBOX - REMAINING MVP ITEMS (40%)

**Date:** 25 January 2026
**Status:** For Simon's review
**Note:** Excludes payments, legal, and API work (Simon's responsibility)

---

## CRITICAL ITEMS (Must Fix Before Ship)

### 1. Mobile Responsiveness
| Item | Description | Effort |
|------|-------------|--------|
| Dashboard sidebars | Broken on mobile - can't navigate | 4 hours |
| Touch targets | Need 44px minimum for buttons | 2 hours |
| Mobile navigation | Hamburger menu for all pages | 3 hours |
| Card layouts | Stack vertically on mobile | 2 hours |
| Form inputs | Full width on mobile | 1 hour |
| **Total** | | **12 hours** |

### 2. Recruiter Portal Cleanup
| Item | Description | Effort |
|------|-------------|--------|
| /recruiter/* pages | All use MOCK_CLIENTS, MOCK_CANDIDATES | 2 hours |
| /hire/recruiter/* | Same mock data issue | 1 hour |
| Decision needed | Remove entirely OR add "Coming Soon" labels | - |
| **Total** | | **3 hours** |

### 3. Candidate Flow Completion
| Item | Description | Effort |
|------|-------------|--------|
| /candidates/video | Verify page exists and works | 1 hour |
| /candidates/new-career | Fix or remove (currently broken) | 2 hours |
| Save analysis to account | Store results in Supabase | 3 hours |
| Email results to user | Send analysis via email | 2 hours |
| **Total** | | **8 hours** |

---

## HIGH PRIORITY ITEMS (User Experience)

### 4. Talent Pool Backend
| Item | Description | Effort |
|------|-------------|--------|
| /talent-pool/browse | Replace fake candidates with real DB query | 3 hours |
| Matching algorithm | /api/talent-pool/match is a stub | 4 hours |
| **Total** | | **7 hours** |

### 5. Employer Dashboard UX
| Item | Description | Effort |
|------|-------------|--------|
| Onboarding flow | Step 1-2-3 guide for new users | 4 hours |
| Empty state | Helpful CTA instead of sad empty box | 2 hours |
| Email setup simplification | Hide IMAP complexity, add Gmail/Outlook buttons | 4 hours |
| Quick stats widget | CVs screened, roles active, etc. | 2 hours |
| Search/filter candidates | Basic search functionality | 3 hours |
| **Total** | | **15 hours** |

### 6. Homepage Improvements
| Item | Description | Effort |
|------|-------------|--------|
| Value proposition | Clear "AI screens your CVs in seconds" | 1 hour |
| Social proof | Beta users, testimonials, logos | 2 hours |
| Demo video/GIF | Show product in action | 3 hours |
| **Total** | | **6 hours** |

---

## MEDIUM PRIORITY ITEMS (Polish)

### 7. Auth & Signup Flow
| Item | Description | Effort |
|------|-------------|--------|
| Company name field | For employers on signup | 1 hour |
| Show benefits after signup | What user gets | 1 hour |
| Welcome email | After signup confirmation | 2 hours |
| **Total** | | **4 hours** |

### 8. Navigation & UX
| Item | Description | Effort |
|------|-------------|--------|
| Breadcrumbs | Add to all pages | 2 hours |
| Consistent back buttons | On all interior pages | 1 hour |
| Custom 404 page | With helpful navigation | 1 hour |
| Loading states | For all async operations | 3 hours |
| Error states | With recovery actions | 2 hours |
| Form validation | Clear error messages | 2 hours |
| **Total** | | **11 hours** |

---

## SUMMARY

| Category | Hours | Priority |
|----------|-------|----------|
| Mobile Responsiveness | 12 | CRITICAL |
| Recruiter Portal Cleanup | 3 | CRITICAL |
| Candidate Flow Completion | 8 | CRITICAL |
| Talent Pool Backend | 7 | HIGH |
| Employer Dashboard UX | 15 | HIGH |
| Homepage Improvements | 6 | HIGH |
| Auth & Signup Flow | 4 | MEDIUM |
| Navigation & UX | 11 | MEDIUM |
| **TOTAL** | **66 hours** | |

---

## RECOMMENDATION

**To reach 80% MVP (shippable beta):**
1. Fix mobile responsiveness (CRITICAL - 12 hours)
2. Clean up recruiter portal (CRITICAL - 3 hours)
3. Complete candidate flow (CRITICAL - 8 hours)

**Total for minimum viable: 23 hours**

**To reach 100% MVP:**
- Complete all items above: 66 hours
- Plus Simon's items (payments, legal, APIs): ~30 hours
- **Total: ~96 hours (12 working days)**

---

## WHAT'S WORKING WELL (The 60%)

| Feature | Status |
|---------|--------|
| AI CV Screening | LIVE - Fine-tuned model working |
| B2C CV Analysis | LIVE - Same AI, great results |
| Video Analysis | LIVE - Claude Vision coaching |
| Talent Pool Join | WORKING - Saves to API |
| Create Role | WORKING - Full flow |
| Email Integration | WORKING - IMAP fetch |
| Candidate Cards | WORKING - Good display |
| Pricing Display | WORKING - All prices shown |
| B2B Dashboard | WORKING - Core functions |
| Talent Mapping | WORKING - R999/search |

---

*This list is for Simon's morning review. Do not implement until approved.*
