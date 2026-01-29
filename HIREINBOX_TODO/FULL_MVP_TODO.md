# HIREINBOX FULL MVP TODO LIST
## Last Updated: 24 January 2026 (Night)
## Mode: FULL MVP (Not Demo)

---

## PHASE 1: CORE INFRASTRUCTURE (Critical)

### 1.1 Multi-Tenant Authentication ✓ DONE
- [x] Database schema for profiles table
- [x] Database schema for businesses table
- [x] Database schema for business_members table
- [x] Profile API (GET, POST, PATCH)
- [x] Business API (GET, POST)
- [x] useProfile hook for frontend

### 1.2 Multi-Role Email Routing ✓ DONE
- [x] Email router with AI parsing
- [x] Route email API endpoint
- [x] Simple keyword fallback matching
- [x] Needs Assignment queue logic

### 1.3 Reference Check System ✓ DONE
- [x] Database schema for references
- [x] Reference extraction from CV (AI)
- [x] Reference request API
- [x] Secure token-based form
- [x] Response submission API
- [x] Reference form page (/reference/[token])

---

## PHASE 2: TALENT POOL ENHANCEMENTS (High Priority)

### 2.1 Salary & Compensation Transparency
- [ ] Add salary fields to candidate opt-in form
- [ ] Display salary expectations on browse page
- [ ] Filter by salary range

### 2.2 Work Arrangement Preferences
- [ ] Add remote/hybrid/office preference to opt-in
- [ ] Display work preferences on cards
- [ ] Filter by work arrangement

### 2.3 Video Profile Integration
- [ ] Video upload component
- [ ] Video storage (Supabase Storage or external)
- [ ] Video preview in employer browse
- [ ] Update confidence level when video added

### 2.4 Enhanced Candidate Profiles
- [ ] Career must-haves section
- [ ] Preferred industries selection
- [ ] Preferred locations with map
- [ ] Notice period field
- [ ] Portfolio/LinkedIn URL

### 2.5 Employer Company Profiles
- [ ] Company profile page (/company/[slug])
- [ ] Logo upload
- [ ] Company description
- [ ] Team size, industry, culture
- [ ] Benefits list
- [ ] Company photos

---

## PHASE 3: B2B EMPLOYER EXPERIENCE

### 3.1 Dashboard Improvements
- [ ] Needs Assignment queue in dashboard
- [ ] Bulk actions (assign, archive, reject)
- [ ] Quick stats (new today, pending, total)
- [ ] Role performance metrics

### 3.2 Role Management
- [ ] Role creation wizard
- [ ] Required skills input
- [ ] Nice-to-have skills
- [ ] Auto-generate screening criteria
- [ ] Role status (active/paused/closed)

### 3.3 Candidate Pipeline
- [ ] Kanban board view
- [ ] Drag-and-drop stage changes
- [ ] Stage-based email templates
- [ ] Notes per candidate
- [ ] Activity timeline

### 3.4 Team Collaboration
- [ ] Invite team members
- [ ] Role-based permissions (viewer/member/admin)
- [ ] @mentions in notes
- [ ] Activity feed

---

## PHASE 4: B2C CANDIDATE EXPERIENCE

### 4.1 Candidate Dashboard
- [ ] Application status tracking
- [ ] Real-time updates
- [ ] Employer messages
- [ ] Connection requests view
- [ ] Profile completeness indicator

### 4.2 CV Builder Improvements
- [ ] Template selection
- [ ] Section-by-section guidance
- [ ] AI suggestions inline
- [ ] Export to PDF (properly formatted)
- [ ] Version history

### 4.3 Job Discovery
- [ ] Browse open roles
- [ ] Match score for each role
- [ ] "Why You Match" for candidates
- [ ] One-click apply to pool

### 4.4 Profile Enhancements
- [ ] Skills endorsement system
- [ ] Achievement badges
- [ ] Portfolio showcase
- [ ] Interview availability calendar

---

## PHASE 5: AI & MATCHING

### 5.1 Enhanced Matching Algorithm
- [ ] Skills graph matching (not just keywords)
- [ ] Experience weighting
- [ ] Industry relevance scoring
- [ ] Location/commute consideration
- [ ] Salary alignment check

### 5.2 AI-Assisted Features
- [ ] AI message drafting for employers
- [ ] Interview question generator
- [ ] Job description improver
- [ ] CV rewrite with specific role targeting
- [ ] Candidate summary generation

### 5.3 Transparency Improvements
- [ ] Show matching calculation breakdown
- [ ] Quote CV directly in match reasons
- [ ] Skill confidence levels
- [ ] Missing skills highlight

---

## PHASE 6: COMMUNICATION

### 6.1 Email Infrastructure
- [ ] Set up Postmark/SendGrid
- [ ] Custom domain emails (jobs@company.hireinbox.co.za)
- [ ] Email templates (acknowledgment, status updates)
- [ ] Email tracking (opens, clicks)

### 6.2 In-App Messaging
- [ ] Employer-candidate messaging
- [ ] Message templates
- [ ] Read receipts
- [ ] File attachments

### 6.3 Notifications
- [ ] Email notifications preferences
- [ ] In-app notification center
- [ ] Push notifications (future)
- [ ] SMS notifications (optional)

---

## PHASE 7: MOBILE & RESPONSIVE

### 7.1 Responsive Design Audit
- [ ] Homepage mobile layout
- [ ] Candidate flow mobile
- [ ] Employer dashboard mobile
- [ ] Talent pool browse mobile
- [ ] All forms mobile-friendly

### 7.2 Mobile-First Components
- [ ] Touch-friendly buttons (44px+)
- [ ] Swipe actions
- [ ] Bottom navigation
- [ ] Mobile file upload

---

## PHASE 8: POLISH & UX

### 8.1 Da Vinci Polish
- [ ] Typography consistency audit
- [ ] Color palette standardization
- [ ] Spacing system (8px grid)
- [ ] Animation refinement
- [ ] Loading states everywhere

### 8.2 Accessibility
- [ ] ARIA labels audit
- [ ] Keyboard navigation
- [ ] Screen reader testing
- [ ] Color contrast check
- [ ] Focus indicators

### 8.3 Error Handling
- [ ] Friendly error messages
- [ ] Offline state handling
- [ ] Form validation feedback
- [ ] API error recovery

---

## PHASE 9: VERIFICATION & COMPLIANCE

### 9.1 ID Verification (Future - Needs API)
- [ ] LexisNexis integration research
- [ ] ID document upload
- [ ] Verification status display
- [ ] Verification badge

### 9.2 Credit Checks (Future - Needs API)
- [ ] TransUnion integration research
- [ ] Consent flow
- [ ] Report display
- [ ] Credit score interpretation

### 9.3 POPIA Compliance
- [ ] Consent tracking
- [ ] Data export (right to access)
- [ ] Data deletion (right to be forgotten)
- [ ] Audit logging
- [ ] Privacy policy updates

---

## PHASE 10: ANALYTICS & REPORTING

### 10.1 Employer Analytics
- [ ] Time-to-hire metrics
- [ ] Source tracking
- [ ] Conversion funnel
- [ ] AI screening accuracy
- [ ] Cost-per-hire calculation

### 10.2 Candidate Analytics
- [ ] Profile views
- [ ] Match notifications
- [ ] Application success rate
- [ ] Improvement suggestions

### 10.3 Admin Dashboard
- [ ] Platform-wide metrics
- [ ] User growth
- [ ] Feature usage
- [ ] Error monitoring

---

## IMMEDIATE PRIORITIES (Tonight)

1. [x] Emoji audit (professional icons)
2. [x] Multi-tenant auth schema
3. [x] Multi-role routing
4. [x] Reference check system
5. [ ] Salary fields in Talent Pool
6. [ ] Work arrangement preferences
7. [ ] Mobile responsive audit
8. [ ] Deploy and full test
9. [ ] Update master TODO

---

## API KEYS NEEDED

| Service | Purpose | Status |
|---------|---------|--------|
| Postmark/SendGrid | Email delivery | NEEDED |
| LexisNexis | ID verification | NEEDED |
| TransUnion | Credit checks | NEEDED |
| Supabase Storage | Video/file uploads | CONFIGURED |

---

## ESTIMATED EFFORT

| Phase | Effort | Priority |
|-------|--------|----------|
| Phase 1 | ✓ Done | Critical |
| Phase 2 | 8-10 hours | High |
| Phase 3 | 12-15 hours | High |
| Phase 4 | 10-12 hours | High |
| Phase 5 | 6-8 hours | Medium |
| Phase 6 | 6-8 hours | Medium |
| Phase 7 | 4-6 hours | Medium |
| Phase 8 | 4-6 hours | High |
| Phase 9 | Blocked (APIs) | Low |
| Phase 10 | 8-10 hours | Low |

---

## SUCCESS CRITERIA

MVP is complete when:
1. Employer can post role and receive AI-screened candidates
2. Candidate can scan CV and opt into Talent Pool
3. Employer can browse pool and request connections
4. Reference checks can be sent and received
5. All flows work on mobile
6. Professional polish throughout
