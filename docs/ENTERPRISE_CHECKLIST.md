# HireInbox Enterprise Grade Checklist

> **Audit Date:** January 2026
> **Auditor:** RALPH #4 - Enterprise Architect
> **Target:** Enterprise-grade readiness for B2B clients
> **Status:** MVP with significant gaps to address

---

## Executive Summary

HireInbox has a solid foundation with basic security measures, POPIA compliance foundations, and working authentication. However, significant gaps exist in areas critical for enterprise deployment: monitoring/observability, comprehensive testing, SSO support, audit logging, and production infrastructure hardening.

### Current Maturity Level: **3/10 (MVP)**

| Category | Score | Status |
|----------|-------|--------|
| Security | 5/10 | Partial - Good middleware, missing encryption at rest |
| Compliance | 4/10 | Partial - POPIA policies exist, audit logging incomplete |
| Infrastructure | 2/10 | Not Started - No HA, DR, or auto-scaling |
| Monitoring | 2/10 | Not Started - No Sentry, APM, or alerting |
| Code Quality | 3/10 | Partial - Basic tests exist, low coverage |
| Production Readiness | 3/10 | Partial - Environment setup incomplete |
| Enterprise Features | 2/10 | Not Started - No SSO, basic RBAC |

---

## 1. Security

### 1.1 Authentication

| Item | Status | Priority | Effort | Notes |
|------|--------|----------|--------|-------|
| Email/password auth | Done | - | - | Supabase Auth implemented |
| Google OAuth | Done | - | - | Configured in auth-context.tsx |
| Magic link login | Done | - | - | Implemented |
| Password reset flow | Done | - | - | Working |
| Session management | Done | - | - | Auto-refresh via Supabase |
| Account lockout after failed attempts | Not Started | P1 | 2d | Prevent brute force |
| Password complexity requirements | Not Started | P1 | 1d | Minimum 8 chars, symbols, etc. |
| 2FA/MFA support | Not Started | P1 | 1w | TOTP or SMS verification |
| Session timeout configuration | Partial | P2 | 1d | Hardcoded, needs admin config |
| Concurrent session limits | Not Started | P2 | 2d | Limit active sessions per user |

### 1.2 Authorization (RBAC)

| Item | Status | Priority | Effort | Notes |
|------|--------|----------|--------|-------|
| Basic roles (admin/viewer) | Done | - | - | UI exists at /settings/team |
| Role-based route protection | Partial | P1 | 2d | Middleware checks auth, not role |
| API endpoint authorization | Partial | P1 | 3d | Some endpoints unprotected |
| Resource-level permissions | Not Started | P1 | 1w | e.g., only view own candidates |
| Permission inheritance | Not Started | P2 | 1w | Company > Team > User |
| Role management API | Not Started | P2 | 3d | CRUD for custom roles |
| Granular feature flags | Not Started | P2 | 1w | Per-feature access control |

### 1.3 API Security

| Item | Status | Priority | Effort | Notes |
|------|--------|----------|--------|-------|
| Rate limiting | Done | - | - | Middleware implements progressive blocking |
| Bot detection | Done | - | - | User-agent filtering in middleware |
| Input validation | Partial | P0 | 3d | Inconsistent across endpoints |
| API key management | Not Started | P0 | 1w | Needed for external integrations |
| Request signing | Not Started | P2 | 1w | For webhook validation |
| API versioning | Not Started | P2 | 3d | /api/v1/ prefixing |
| Webhook security | Partial | P1 | 2d | PayFast has signatures, others don't |
| Request size limits | Partial | P1 | 1d | Only in vercel.json |

### 1.4 Data Encryption

| Item | Status | Priority | Effort | Notes |
|------|--------|----------|--------|-------|
| HTTPS/TLS in transit | Done | - | - | Vercel provides |
| Database encryption at rest | Partial | P1 | 2d | Supabase default, verify settings |
| Sensitive field encryption | Not Started | P0 | 1w | IMAP passwords stored plaintext |
| API key encryption | Not Started | P0 | 3d | OpenAI/Anthropic keys in env |
| Backup encryption | Not Started | P1 | 2d | Verify Supabase backup encryption |
| Key rotation strategy | Not Started | P1 | 3d | Document and automate |

### 1.5 Security Testing

| Item | Status | Priority | Effort | Notes |
|------|--------|----------|--------|-------|
| Penetration testing | Not Started | P1 | External | Schedule with security firm |
| OWASP Top 10 audit | Not Started | P0 | 1w | SQL injection, XSS, etc. |
| Dependency vulnerability scan | Not Started | P0 | 1d | npm audit, Snyk, Dependabot |
| Static code analysis | Not Started | P1 | 2d | SonarQube or similar |
| Security headers audit | Done | - | - | X-Frame-Options, etc. in middleware |

### 1.6 CORS Configuration

| Item | Status | Priority | Effort | Notes |
|------|--------|----------|--------|-------|
| CORS policy defined | Not Started | P0 | 1d | No CORS headers found |
| Allowed origins whitelist | Not Started | P0 | 1d | Block unauthorized domains |
| Credentials handling | Not Started | P1 | 1d | Cookie/token transmission |
| Preflight caching | Not Started | P2 | 4h | Performance optimization |

---

## 2. Compliance (POPIA)

### 2.1 POPIA Compliance

| Item | Status | Priority | Effort | Notes |
|------|--------|----------|--------|-------|
| Privacy Policy | Done | - | - | /privacy page comprehensive |
| Terms of Service | Done | - | - | /terms page complete |
| Cookie consent banner | Done | - | - | CookieConsent component |
| Consent management UI | Partial | P1 | 3d | Basic, needs granular control |
| Consent versioning | Not Started | P1 | 2d | Track policy changes |
| AI decision transparency | Done | - | - | Evidence-based reasoning shown |
| Right to human review | Done | - | - | Appeals system implemented |

### 2.2 Data Retention

| Item | Status | Priority | Effort | Notes |
|------|--------|----------|--------|-------|
| Retention policy documented | Done | - | - | In privacy policy |
| Automated data purging | Not Started | P0 | 1w | No scheduled cleanup jobs |
| Retention period enforcement | Not Started | P0 | 3d | 12mo for CVs, 5yr for business |
| Archival strategy | Not Started | P2 | 1w | Cold storage for old data |
| Data classification | Not Started | P2 | 2d | PII, sensitive, public |

### 2.3 Right to Deletion

| Item | Status | Priority | Effort | Notes |
|------|--------|----------|--------|-------|
| Account deletion UI | Not Started | P0 | 2d | Mentioned in checklist, not built |
| Cascade delete implementation | Not Started | P0 | 3d | All related records |
| Deletion confirmation flow | Not Started | P1 | 1d | Email/SMS verification |
| Deletion audit trail | Not Started | P1 | 2d | Log who/when/what |
| Backup data handling | Not Started | P2 | 1w | Remove from backups too |

### 2.4 Audit Logging

| Item | Status | Priority | Effort | Notes |
|------|--------|----------|--------|-------|
| Database audit log table | Not Started | P0 | 2d | Planned but not created |
| API request logging | Partial | P0 | 2d | Console only, needs persistence |
| User action tracking | Partial | P1 | 3d | Some events logged, inconsistent |
| Admin action logging | Not Started | P0 | 2d | Role changes, deletions, etc. |
| AI decision logging | Partial | P1 | 2d | screening_result stored, needs indexing |
| Audit export API | Partial | P2 | 2d | /api/analytics/audit-export exists |
| Log retention policy | Not Started | P1 | 1d | POPIA requires 3-5 years |

---

## 3. Infrastructure

### 3.1 High Availability

| Item | Status | Priority | Effort | Notes |
|------|--------|----------|--------|-------|
| Multi-region deployment | Not Started | P1 | 1w | Vercel supports, not configured |
| Database replication | Not Started | P1 | 3d | Supabase Pro feature |
| Failover configuration | Not Started | P1 | 3d | Automatic region switching |
| Zero-downtime deployments | Partial | P2 | 2d | Vercel provides, needs testing |
| Health check endpoints | Done | - | - | /api/health implemented |
| Readiness probes | Not Started | P2 | 1d | For k8s if needed |

### 3.2 Load Balancing

| Item | Status | Priority | Effort | Notes |
|------|--------|----------|--------|-------|
| CDN configuration | Partial | P2 | 1d | Vercel Edge, needs tuning |
| Static asset caching | Not Started | P2 | 1d | Cache headers not set |
| API route distribution | Partial | P2 | 2d | Vercel handles, needs verification |
| Connection pooling | Partial | P1 | 2d | Mentioned in supabase.ts, verify |
| Database read replicas | Not Started | P2 | 3d | For read-heavy queries |

### 3.3 Auto-scaling

| Item | Status | Priority | Effort | Notes |
|------|--------|----------|--------|-------|
| Serverless auto-scale | Partial | - | - | Vercel provides by default |
| Database scaling | Not Started | P1 | 3d | Supabase Pro features |
| AI API rate management | Partial | P1 | 2d | Hardcoded limits, needs dynamic |
| Cost monitoring/alerts | Not Started | P1 | 1d | AWS/Vercel billing alerts |
| Traffic surge protection | Partial | P2 | 2d | Rate limiting helps, needs more |

### 3.4 Backup & Recovery

| Item | Status | Priority | Effort | Notes |
|------|--------|----------|--------|-------|
| Database backups | Partial | P0 | 1d | Supabase auto, verify frequency |
| Point-in-time recovery | Not Started | P0 | 2d | Supabase Pro feature |
| Backup testing | Not Started | P0 | 1d | Monthly restore tests |
| Data export capability | Partial | P1 | 2d | Admin export exists, incomplete |
| Cross-region backup | Not Started | P1 | 3d | Disaster recovery |
| Backup encryption | Not Started | P1 | 1d | Verify Supabase encryption |

### 3.5 Disaster Recovery

| Item | Status | Priority | Effort | Notes |
|------|--------|----------|--------|-------|
| DR plan documented | Not Started | P0 | 3d | Critical for enterprise |
| RTO/RPO defined | Not Started | P0 | 1d | Recovery time objectives |
| Runbook created | Not Started | P0 | 2d | Step-by-step recovery |
| DR testing schedule | Not Started | P1 | 1d | Quarterly tests |
| Communication plan | Not Started | P1 | 1d | Customer notification |
| Secondary region ready | Not Started | P1 | 1w | Standby environment |

---

## 4. Monitoring & Observability

### 4.1 Error Tracking

| Item | Status | Priority | Effort | Notes |
|------|--------|----------|--------|-------|
| Sentry integration | Not Started | P0 | 1d | Critical for production |
| Error categorization | Not Started | P1 | 2d | Group by type, severity |
| Error alerting | Not Started | P0 | 4h | Slack/email notifications |
| Source maps upload | Not Started | P1 | 4h | For readable stack traces |
| Error rate dashboards | Not Started | P1 | 1d | Trends and spikes |
| Client-side errors | Not Started | P1 | 1d | Browser error capture |

### 4.2 Performance Monitoring (APM)

| Item | Status | Priority | Effort | Notes |
|------|--------|----------|--------|-------|
| APM tool selection | Not Started | P0 | 1d | Datadog, New Relic, or Vercel Analytics |
| Response time tracking | Partial | P1 | 2d | Health endpoint has latency |
| Database query monitoring | Not Started | P1 | 2d | Slow query identification |
| AI call latency tracking | Not Started | P1 | 1d | OpenAI/Claude response times |
| Core Web Vitals | Not Started | P2 | 1d | LCP, FID, CLS |
| Custom metrics | Not Started | P2 | 2d | Business-specific KPIs |

### 4.3 Uptime Monitoring

| Item | Status | Priority | Effort | Notes |
|------|--------|----------|--------|-------|
| External uptime monitor | Not Started | P0 | 4h | UptimeRobot, Pingdom |
| Health endpoint monitoring | Partial | P0 | 2h | /api/health exists |
| SSL certificate monitoring | Not Started | P1 | 2h | Expiry alerts |
| Third-party service monitoring | Not Started | P1 | 1d | Supabase, OpenAI status |
| Status page | Not Started | P2 | 1d | Public status dashboard |

### 4.4 Alerting

| Item | Status | Priority | Effort | Notes |
|------|--------|----------|--------|-------|
| Alerting system setup | Not Started | P0 | 1d | PagerDuty or Opsgenie |
| Alert rules defined | Not Started | P0 | 1d | Error rates, latency, etc. |
| On-call rotation | Not Started | P1 | 1d | Team schedule |
| Escalation policies | Not Started | P1 | 4h | Auto-escalate if not ack'd |
| Alert fatigue prevention | Not Started | P2 | 2d | Smart grouping, thresholds |
| Incident management | Not Started | P1 | 2d | Runbooks, postmortems |

### 4.5 Logging

| Item | Status | Priority | Effort | Notes |
|------|--------|----------|--------|-------|
| Structured logging | Partial | P0 | 2d | logger.ts exists, needs structure |
| Log aggregation | Not Started | P0 | 1d | LogDNA, Datadog, or Vercel |
| Log retention policy | Not Started | P1 | 1d | 30 days hot, 1 year cold |
| Log searching/querying | Not Started | P1 | 1d | Depends on aggregation tool |
| Sensitive data masking | Not Started | P1 | 2d | PII in logs |
| Request tracing | Partial | P1 | 2d | traceId in api-error.ts |

---

## 5. Code Quality

### 5.1 Testing Coverage

| Item | Status | Priority | Effort | Notes |
|------|--------|----------|--------|-------|
| Unit tests | Partial | P1 | 2w | ~40% coverage, target 60% |
| API tests | Partial | P1 | 1w | Basic tests exist |
| Integration tests | Not Started | P1 | 2w | End-to-end flows |
| Component tests | Not Started | P2 | 2w | React Testing Library |
| E2E tests | Not Started | P1 | 2w | Playwright recommended |
| Visual regression tests | Not Started | P2 | 1w | Chromatic or Percy |
| Performance tests | Not Started | P2 | 1w | Lighthouse CI |
| Security tests | Not Started | P1 | 1w | OWASP ZAP |

### 5.2 CI/CD Pipeline

| Item | Status | Priority | Effort | Notes |
|------|--------|----------|--------|-------|
| GitHub Actions setup | Not Started | P0 | 1d | Automated builds |
| Automated testing | Not Started | P0 | 1d | Run on PR |
| Type checking | Partial | P0 | 4h | TSC in build, not CI |
| Linting | Partial | P1 | 4h | ESLint exists, not in CI |
| Build verification | Partial | P1 | 4h | Vercel builds, needs CI too |
| Preview deployments | Done | - | - | Vercel provides |
| Deployment approval gates | Not Started | P2 | 1d | For production |
| Rollback automation | Not Started | P1 | 1d | One-click rollback |

### 5.3 Code Review Process

| Item | Status | Priority | Effort | Notes |
|------|--------|----------|--------|-------|
| PR templates | Not Started | P1 | 2h | Checklist for reviewers |
| Required reviews | Not Started | P1 | 2h | Branch protection rules |
| CODEOWNERS file | Not Started | P2 | 1h | Auto-assign reviewers |
| Review guidelines | Not Started | P2 | 4h | Document expectations |
| Security review checklist | Not Started | P1 | 4h | For sensitive changes |

### 5.4 Documentation

| Item | Status | Priority | Effort | Notes |
|------|--------|----------|--------|-------|
| API documentation | Partial | P1 | 1w | docs/API.md exists, incomplete |
| Architecture docs | Done | - | - | docs/HIREINBOX_ARCHITECTURE.md |
| Database schema docs | Done | - | - | docs/DATABASE.md |
| Deployment docs | Not Started | P0 | 1d | How to deploy |
| Runbook | Not Started | P0 | 2d | Operational procedures |
| Onboarding guide | Not Started | P2 | 1d | For new developers |
| ADRs (Architecture Decision Records) | Not Started | P2 | Ongoing | Track major decisions |

---

## 6. Production Readiness

### 6.1 Environment Management

| Item | Status | Priority | Effort | Notes |
|------|--------|----------|--------|-------|
| Development environment | Done | - | - | npm run dev |
| Staging environment | Not Started | P0 | 1d | Separate Vercel project |
| Production environment | Partial | P0 | 1d | Vercel setup, needs hardening |
| Environment parity | Not Started | P1 | 2d | Same config across envs |
| Environment promotion flow | Not Started | P1 | 1d | dev > staging > prod |
| Feature flags | Not Started | P2 | 1w | LaunchDarkly or similar |

### 6.2 Secrets Management

| Item | Status | Priority | Effort | Notes |
|------|--------|----------|--------|-------|
| Vercel env vars | Done | - | - | Basic setup |
| Secret rotation | Not Started | P1 | 2d | Scheduled key rotation |
| Vault integration | Not Started | P2 | 1w | HashiCorp Vault |
| Secret scanning | Not Started | P0 | 4h | GitHub secret scanning |
| .env security | Partial | P0 | 2h | .env.local in .gitignore |
| Production secrets isolation | Partial | P1 | 1d | Verify no dev keys in prod |

**WARNING:** .env.local file contains actual API keys that should NEVER be committed!

### 6.3 Database Migrations

| Item | Status | Priority | Effort | Notes |
|------|--------|----------|--------|-------|
| Migration system | Partial | P0 | 2d | SQL files in docs/migrations |
| Migration versioning | Not Started | P0 | 1d | Numbered, timestamped |
| Rollback scripts | Not Started | P0 | 1d | Down migrations |
| Migration testing | Not Started | P1 | 2d | Test before production |
| Data seeding | Not Started | P2 | 2d | Test data generation |
| Schema validation | Not Started | P2 | 1d | Automated checks |

### 6.4 Rollback Procedures

| Item | Status | Priority | Effort | Notes |
|------|--------|----------|--------|-------|
| Deployment rollback | Partial | P0 | 1d | Vercel allows, not documented |
| Database rollback | Not Started | P0 | 2d | Migration down scripts |
| Feature toggle rollback | Not Started | P1 | 1d | Quick feature disable |
| Rollback testing | Not Started | P1 | 1d | Regular drills |
| Rollback runbook | Not Started | P0 | 4h | Step-by-step guide |

---

## 7. Enterprise Features

### 7.1 SSO Support

| Item | Status | Priority | Effort | Notes |
|------|--------|----------|--------|-------|
| SAML 2.0 support | Not Started | P1 | 2w | Enterprise requirement |
| OIDC support | Partial | P2 | 1w | Google OAuth exists |
| Azure AD integration | Not Started | P1 | 1w | Common enterprise IdP |
| Okta integration | Not Started | P1 | 1w | Common enterprise IdP |
| SCIM provisioning | Not Started | P2 | 2w | User sync |
| JIT provisioning | Not Started | P2 | 1w | Auto-create on first login |

### 7.2 Multi-tenancy

| Item | Status | Priority | Effort | Notes |
|------|--------|----------|--------|-------|
| Company/tenant isolation | Partial | P0 | 1w | RLS in Supabase, verify complete |
| Tenant-specific config | Not Started | P1 | 1w | Custom settings per company |
| Data isolation verification | Not Started | P0 | 2d | Audit and test |
| Tenant admin portal | Partial | P1 | 2w | Settings page exists |
| Cross-tenant reporting | Not Started | P2 | 1w | Admin super-user view |
| Tenant onboarding flow | Partial | P1 | 1w | Basic, needs improvement |

### 7.3 SLA Reporting

| Item | Status | Priority | Effort | Notes |
|------|--------|----------|--------|-------|
| SLA definitions | Not Started | P1 | 2d | 99.9% uptime, response times |
| Uptime tracking | Not Started | P0 | 1d | Historical availability |
| Response time tracking | Not Started | P1 | 2d | P50, P95, P99 latencies |
| SLA dashboards | Not Started | P1 | 1w | Customer-facing reports |
| SLA breach alerting | Not Started | P1 | 2d | Auto-notify when at risk |
| Incident reporting | Not Started | P1 | 2d | Track and report outages |

### 7.4 Custom Branding / White-label

| Item | Status | Priority | Effort | Notes |
|------|--------|----------|--------|-------|
| Logo customization | Not Started | P2 | 2d | Per-company logo |
| Color theme customization | Not Started | P2 | 1w | Brand colors |
| Email template branding | Not Started | P2 | 3d | Custom email headers |
| Custom domain support | Not Started | P2 | 1w | client.hireinbox.co.za |
| Remove HireInbox branding | Not Started | P2 | 1w | Full white-label |
| Custom login page | Not Started | P2 | 1w | Branded authentication |

---

## 8. P0 Priority Items Summary

**These items must be completed before enterprise deployment:**

### Security (Critical)
1. [ ] Input validation across all API endpoints - 3d
2. [ ] API key management system - 1w
3. [ ] CORS configuration - 1d
4. [ ] Sensitive field encryption (IMAP passwords) - 1w
5. [ ] OWASP Top 10 audit - 1w
6. [ ] Dependency vulnerability scanning - 1d

### Compliance (Critical)
1. [ ] Automated data purging - 1w
2. [ ] Retention period enforcement - 3d
3. [ ] Account deletion UI and cascade delete - 5d
4. [ ] Audit log table implementation - 2d
5. [ ] API request logging to persistent storage - 2d
6. [ ] Admin action logging - 2d

### Infrastructure (Critical)
1. [ ] Database backup verification - 1d
2. [ ] Point-in-time recovery setup - 2d
3. [ ] Backup testing schedule - 1d
4. [ ] DR plan documentation - 3d
5. [ ] RTO/RPO definitions - 1d
6. [ ] Recovery runbook - 2d

### Monitoring (Critical)
1. [ ] Sentry error tracking - 1d
2. [ ] Error alerting - 4h
3. [ ] APM tool selection and setup - 1d
4. [ ] External uptime monitoring - 4h
5. [ ] Alerting system setup - 1d
6. [ ] Log aggregation - 1d

### Production (Critical)
1. [ ] Staging environment - 1d
2. [ ] GitHub Actions CI pipeline - 1d
3. [ ] Secret scanning - 4h
4. [ ] Migration versioning system - 1d
5. [ ] Rollback runbook - 4h
6. [ ] Deployment documentation - 1d

### Enterprise (Critical)
1. [ ] Data isolation verification - 2d

---

## 9. Recommended Implementation Phases

### Phase 1: Security & Monitoring Foundation (2 weeks)
- Sentry integration
- CORS configuration
- Input validation audit
- Dependency scanning
- External uptime monitoring
- Basic alerting

### Phase 2: Compliance & Audit (2 weeks)
- Audit log table
- API request logging
- Data retention automation
- Account deletion flow
- Consent tracking

### Phase 3: Infrastructure Hardening (3 weeks)
- Staging environment
- CI/CD pipeline
- Backup testing
- DR plan and runbook
- Migration system

### Phase 4: Enterprise Features (4 weeks)
- SAML/SSO integration
- Multi-tenancy verification
- SLA reporting
- Enhanced RBAC

### Phase 5: Production Polish (2 weeks)
- Performance optimization
- Testing coverage
- Documentation
- Security audit

---

## 10. Estimated Total Effort

| Category | Effort |
|----------|--------|
| Security | 6-8 weeks |
| Compliance | 3-4 weeks |
| Infrastructure | 4-5 weeks |
| Monitoring | 2-3 weeks |
| Code Quality | 6-8 weeks |
| Production Readiness | 3-4 weeks |
| Enterprise Features | 8-10 weeks |
| **Total** | **32-42 weeks** |

Note: Many items can be parallelized with 2-3 developers.

---

## 11. Quick Wins (Can do immediately)

1. [ ] Enable GitHub secret scanning
2. [ ] Add npm audit to development workflow
3. [ ] Configure UptimeRobot for /api/health
4. [ ] Add Sentry (free tier gets you started)
5. [ ] Create staging environment on Vercel
6. [ ] Add CORS headers to middleware
7. [ ] Document current deployment process

---

*Last updated: January 2026*
*Generated by RALPH #4 - Enterprise Architect*
