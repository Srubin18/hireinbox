# INTERNAL BACKEND - HireInbox Team Operations

> **CRITICAL:** This is what YOU need to run the business, not what customers see.
> Without this, you're flying blind.

---

## WHY THIS MATTERS

```
┌─────────────────────────────────────────────────────────────────────┐
│  WITHOUT INTERNAL BACKEND:                                          │
│  • Can't see who's paying                                          │
│  • Can't debug customer issues                                     │
│  • Can't track AI quality                                          │
│  • Can't measure growth                                            │
│  • Can't handle POPIA requests                                     │
│  • Can't manage costs                                              │
│                                                                     │
│  = FLYING BLIND                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## ADMIN DASHBOARD (/admin)

### Authentication & Access Control
- [ ] 1. Admin login page (separate from customer auth)
- [ ] 2. Role-based access: Owner, Support, Viewer
- [ ] 3. 2FA for admin accounts
- [ ] 4. Audit log of all admin actions
- [ ] 5. IP allowlist for admin access (optional)

---

## CUSTOMER MANAGEMENT

### View All Customers
- [ ] 6. List all B2B accounts with: company, email, signup date, plan, status
- [ ] 7. List all B2C accounts with: name, email, signup date, assessments used
- [ ] 8. List all B2Recruiter accounts with: agency, email, plan, status
- [ ] 9. Search customers by email, company name, phone
- [ ] 10. Filter by: plan type, signup date, last active, status

### Customer Detail View
- [ ] 11. Full customer profile (all data we have)
- [ ] 12. Subscription history (upgrades, downgrades, cancellations)
- [ ] 13. Payment history (all transactions)
- [ ] 14. Usage history (CVs processed, features used)
- [ ] 15. Support ticket history
- [ ] 16. Login history (last 10 logins with IP)

### Customer Actions
- [ ] 17. Impersonate customer (see what they see for debugging)
- [ ] 18. Reset password manually
- [ ] 19. Extend trial / add free credits
- [ ] 20. Upgrade/downgrade subscription
- [ ] 21. Issue refund
- [ ] 22. Suspend account
- [ ] 23. Delete account (POPIA compliance)
- [ ] 24. Export customer data (POPIA compliance)
- [ ] 25. Add internal notes about customer

---

## FINANCIAL DASHBOARD

### Revenue Metrics
- [ ] 26. Total revenue (all time, this month, this week)
- [ ] 27. MRR (Monthly Recurring Revenue)
- [ ] 28. ARR (Annual Recurring Revenue)
- [ ] 29. Revenue by product (B2B vs B2C vs B2Recruiter)
- [ ] 30. Revenue by plan tier
- [ ] 31. Average revenue per user (ARPU)

### Subscription Metrics
- [ ] 32. Total active subscriptions
- [ ] 33. New subscriptions this period
- [ ] 34. Churned subscriptions this period
- [ ] 35. Churn rate (monthly/annual)
- [ ] 36. Net revenue retention
- [ ] 37. Trial → Paid conversion rate

### Payment Management
- [ ] 38. List all payments (successful, failed, pending)
- [ ] 39. Failed payment alerts
- [ ] 40. Retry failed payments
- [ ] 41. Manual invoice generation
- [ ] 42. Refund processing
- [ ] 43. Yoco dashboard integration/link

### Cost Tracking
- [ ] 44. OpenAI API spend (daily, monthly)
- [ ] 45. Cost per CV screening
- [ ] 46. Supabase usage/costs
- [ ] 47. Vercel usage/costs
- [ ] 48. Gross margin calculation

---

## AI QUALITY MONITORING

### Screening Quality
- [ ] 49. Daily AI accuracy score (vs human baseline)
- [ ] 50. View recent AI decisions with evidence
- [ ] 51. Flag bad AI decisions for review
- [ ] 52. Compare AI vs human decisions side-by-side
- [ ] 53. Track accuracy trends over time
- [ ] 54. Alert when accuracy drops below threshold

### AI Feedback Loop
- [ ] 55. Collect customer feedback on AI decisions
- [ ] 56. "Was this helpful?" on each screening
- [ ] 57. Track which decisions customers override
- [ ] 58. Export training data for model improvement

### Prompt Management
- [ ] 59. View current AI prompts (version controlled)
- [ ] 60. A/B test different prompts
- [ ] 61. Rollback to previous prompt version
- [ ] 62. Prompt performance metrics

---

## USAGE ANALYTICS

### Product Usage
- [ ] 63. Total CVs processed (all time, this month)
- [ ] 64. CVs by customer segment
- [ ] 65. Feature usage breakdown
- [ ] 66. Most active customers
- [ ] 67. Least active customers (churn risk)

### User Behavior
- [ ] 68. Daily/Weekly/Monthly active users
- [ ] 69. Session duration average
- [ ] 70. Feature adoption rates
- [ ] 71. Drop-off points in user flow
- [ ] 72. Time from signup to first CV upload

### Growth Metrics
- [ ] 73. New signups (daily, weekly, monthly)
- [ ] 74. Signup sources (direct, referral, campaign)
- [ ] 75. Activation rate (signup → first use)
- [ ] 76. Retention cohorts

---

## SYSTEM HEALTH

### Error Monitoring
- [ ] 77. Error rate dashboard
- [ ] 78. Recent errors with stack traces
- [ ] 79. Error trends over time
- [ ] 80. Alert on error spike
- [ ] 81. Sentry integration

### Performance
- [ ] 82. API response times
- [ ] 83. CV processing time average
- [ ] 84. Email fetch success rate
- [ ] 85. IMAP connection health
- [ ] 86. Database query performance

### Infrastructure
- [ ] 87. Vercel deployment status
- [ ] 88. Supabase connection status
- [ ] 89. OpenAI API status
- [ ] 90. Storage usage (CV files)
- [ ] 91. Database size/growth

---

## SUPPORT TOOLS

### Support Dashboard
- [ ] 92. Open support tickets
- [ ] 93. Ticket assignment
- [ ] 94. Ticket priority/status
- [ ] 95. Response time tracking
- [ ] 96. Customer satisfaction score

### Quick Actions
- [ ] 97. Look up customer by email (one-click)
- [ ] 98. View customer's recent activity
- [ ] 99. View customer's recent errors
- [ ] 100. Send password reset email
- [ ] 101. Add free credits to account

### Knowledge Base
- [ ] 102. Internal FAQ for support
- [ ] 103. Common issues and solutions
- [ ] 104. Escalation procedures

---

## COMPLIANCE & LEGAL

### POPIA Dashboard
- [ ] 105. Pending data access requests
- [ ] 106. Pending data deletion requests
- [ ] 107. Process deletion request (anonymize data)
- [ ] 108. Generate data export for customer
- [ ] 109. Consent audit log
- [ ] 110. Data retention status

### Audit Trail
- [ ] 111. All admin actions logged
- [ ] 112. All customer data access logged
- [ ] 113. All AI decisions logged with reasoning
- [ ] 114. Exportable audit reports

---

## CONTENT MANAGEMENT

### Pricing & Plans
- [ ] 115. Update pricing (without code deploy)
- [ ] 116. Create promotional codes
- [ ] 117. Manage discount campaigns
- [ ] 118. Feature flags by plan

### Communications
- [ ] 119. Send announcement to all users
- [ ] 120. Send targeted email to segment
- [ ] 121. In-app notification management
- [ ] 122. Maintenance mode toggle

### Content
- [ ] 123. Update FAQ content
- [ ] 124. Update help articles
- [ ] 125. Manage email templates

---

## REPORTING

### Scheduled Reports
- [ ] 126. Daily summary email (key metrics)
- [ ] 127. Weekly business report
- [ ] 128. Monthly investor report
- [ ] 129. Custom report builder

### Exports
- [ ] 130. Export customers to CSV
- [ ] 131. Export revenue data to CSV
- [ ] 132. Export usage data to CSV
- [ ] 133. Export for accountant (tax purposes)

---

## QUICK ACCESS LINKS

### External Dashboards
- [ ] 134. Yoco dashboard link
- [ ] 135. Supabase dashboard link
- [ ] 136. Vercel dashboard link
- [ ] 137. OpenAI usage link
- [ ] 138. Sentry dashboard link
- [ ] 139. Domain registrar link

---

## MVP BACKEND (Launch Requirement)

**MUST HAVE for launch:**
```
┌─────────────────────────────────────────────────────────────────────┐
│  LAUNCH BLOCKERS - Cannot launch without:                           │
│                                                                     │
│  □ Admin login (items 1-2)                                         │
│  □ View all customers (items 6-8)                                  │
│  □ Customer search (item 9)                                        │
│  □ View customer detail (item 11)                                  │
│  □ Revenue dashboard - basic (items 26-27)                         │
│  □ OpenAI cost tracking (item 44)                                  │
│  □ Error monitoring (items 77-80, Sentry)                          │
│  □ POPIA deletion request (item 107)                               │
│                                                                     │
│  TOTAL: ~15 items for MVP backend                                  │
└─────────────────────────────────────────────────────────────────────┘
```

**NICE TO HAVE for launch:**
- Impersonate customer
- AI quality dashboard
- Support ticket system
- Scheduled reports

**BUILD AFTER LAUNCH:**
- A/B testing
- Cohort analysis
- Advanced analytics
- Custom report builder

---

## TECH APPROACH

```
┌─────────────────────────────────────────────────────────────────────┐
│  RECOMMENDED STACK FOR ADMIN:                                       │
│                                                                     │
│  Option A: Built-in (Simple)                                       │
│  • Add /admin routes to existing Next.js app                       │
│  • Protect with separate admin auth                                │
│  • Query Supabase directly                                         │
│  • Pros: One codebase, fast to build                               │
│  • Cons: More code in main app                                     │
│                                                                     │
│  Option B: Separate Admin App (Scalable)                           │
│  • Separate Next.js app for admin                                  │
│  • Shares Supabase database                                        │
│  • Different Vercel project                                        │
│  • Pros: Clean separation, team access control                     │
│  • Cons: More infrastructure                                       │
│                                                                     │
│  Option C: Use Admin Tool (Fastest)                                │
│  • Retool, Airplane, or Forest Admin                               │
│  • Connect to Supabase                                             │
│  • Build dashboards visually                                       │
│  • Pros: Very fast to build                                        │
│  • Cons: Monthly cost, less customizable                           │
│                                                                     │
│  RECOMMENDATION: Option A for MVP, migrate to B later              │
└─────────────────────────────────────────────────────────────────────┘
```

---

## PRIORITY ORDER

1. **Week 1:** Admin login + customer list + customer detail
2. **Week 2:** Revenue dashboard + payment tracking
3. **Week 3:** Error monitoring (Sentry) + basic analytics
4. **Week 4:** POPIA compliance tools
5. **Ongoing:** Expand based on operational needs

---

*"You can't manage what you can't measure." - Peter Drucker*
*"The backend is where businesses are actually run." - Simon Rubin*
