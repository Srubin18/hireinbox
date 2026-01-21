# HIREINBOX - Partner Technical Overview
## For Strategic Partners & Stakeholders | January 2026

---

# DOCUMENT OVERVIEW

This document provides a technical overview of the HireInbox platform for partners and non-technical stakeholders. For detailed technical specifications (code, SQL, API specs), refer to the Technical PRD.

---

# TABLE OF CONTENTS

1. Platform Overview
2. Key Features
3. JOBIXAI Agent Platform
4. User Experience
5. Security & Compliance
6. Integrations
7. Technology Summary
8. Appendix

---

# 1. PLATFORM OVERVIEW

## System Architecture (Simplified)

```
┌─────────────────────────────────────────────────────────────┐
│                      HireInbox Platform                      │
├─────────────────┬─────────────────┬─────────────────────────┤
│   Employer      │   Job Seeker    │      Admin              │
│   Dashboard     │   Portal        │      Dashboard          │
└────────┬────────┴────────┬────────┴───────────┬─────────────┘
         │                 │                    │
         └─────────────────┼────────────────────┘
                           │
              ┌────────────▼────────────┐
              │    HireInbox Brain      │
              │    (AI Engine)          │
              │                         │
              │  • CV Analysis          │
              │  • Video Coaching       │
              │  • Interview AI         │
              │  • Talent Matching      │
              └────────────┬────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
    ┌────▼────┐      ┌─────▼─────┐     ┌─────▼─────┐
    │Database │      │  Storage  │     │ Payments  │
    │         │      │  (CVs,    │     │ (Yoco)    │
    │         │      │  Videos)  │     │           │
    └─────────┘      └───────────┘     └───────────┘
```

## How It Works

### For Employers

```
1. Forward CVs to your HireInbox email
         ↓
2. AI analyses each CV against your job requirements
         ↓
3. Candidates scored and ranked automatically
         ↓
4. Review shortlist in your dashboard
         ↓
5. Contact best candidates directly
```

### For Job Seekers

```
1. Upload your CV (free)
         ↓
2. AI analyses strengths and weaknesses
         ↓
3. Get specific improvement recommendations
         ↓
4. Optional: Purchase video coaching or CV rewrite
         ↓
5. Apply with confidence
```

---

# 2. KEY FEATURES

## Employer Features (B2B)

### CV Screening

| Feature | Description |
|---------|-------------|
| Inbox Integration | Forward CVs from any email to your HireInbox |
| Instant Analysis | Results in under 30 seconds per CV |
| Score 0-100 | Clear ranking with explanation |
| Evidence-Based | Every score backed by CV quotes |
| Knockout Criteria | Auto-reject candidates missing must-haves |
| Duplicate Detection | Never review the same CV twice |

### Candidate Management

| Feature | Description |
|---------|-------------|
| Pipeline View | Track candidates through stages |
| Shortlist | One-click to shortlist or reject |
| Notes & Tags | Add context for your team |
| Team Collaboration | Multiple users per company |
| Activity History | Full audit trail |

### Communication

| Feature | Description |
|---------|-------------|
| Auto-Acknowledgment | Automatically reply to applicants |
| Email Templates | Professional responses |
| WhatsApp Integration | Message candidates directly |
| Interview Scheduling | Book interviews easily |

### Reporting

| Feature | Description |
|---------|-------------|
| Dashboard Stats | CVs screened, shortlisted, hired |
| Time Saved | Calculate hours saved |
| Source Tracking | Which channels work best |
| Export | Download data to Excel |

## Job Seeker Features (B2C)

### Free Features

| Feature | Description |
|---------|-------------|
| CV Analysis | Detailed feedback on your CV |
| Score | See how recruiters might rate you |
| Improvement Tips | Specific suggestions |
| ATS Check | Will your CV pass automated systems? |

### Paid Features

| Feature | Description |
|---------|-------------|
| CV Rewrite | AI rewrites your CV professionally |
| Video Analysis | Interview coaching from your practice video |
| Premium Bundle | Rewrite + Video + 3 analyses |

### Video Coaching

- Record yourself answering interview questions
- AI analyses your communication, body language, confidence
- Get specific coaching tips
- Practice until you're confident

---

# 3. JOBIXAI AGENT PLATFORM

## What is JOBIXAI?

JOBIXAI is our AI Agent technology partner, founded by Shay Sinbeti and based in Cape Town, South Africa. JOBIXAI specializes in building and deploying AI agents and agentic systems for companies.

HireInbox partners with JOBIXAI to provide employers with "virtual staff members" - autonomous AI agents that handle recruitment tasks 24/7. This partnership also enables our **Boutique AI Agent offering** (R20,000/month) - custom-trained AI agents that understand a specific company's culture, processes, and needs.

## Available Agents

### SCOUT Agent - Talent Acquisition Specialist
**Status: Live**

What Scout does:
- Monitors your inbox for incoming CVs
- Screens every CV against your job requirements
- Scores and ranks candidates automatically
- Sends acknowledgment emails to applicants
- Flags exceptional candidates for immediate review

Benefits:
- Works 24/7, even on weekends
- Consistent screening (no tired Fridays)
- Processes CVs in seconds, not minutes
- Never misses a great candidate

### SCHEDULER Agent - Interview Coordinator
**Status: Coming Q2 2026**

What Scheduler does:
- Checks your calendar availability
- Sends interview invitations to candidates
- Handles rescheduling requests
- Sends reminders before interviews
- Creates video call links automatically

### INTERVIEWER Agent - AI Screening Interviewer
**Status: Coming Q4 2026**

What Interviewer does:
- Conducts initial screening interviews
- Asks role-specific questions
- Evaluates responses in real-time
- Produces summary reports
- Identifies top candidates for human interviews

### OUTREACH Agent - Candidate Engagement
**Status: Coming Q3 2026**

What Outreach does:
- Sends personalized emails to candidates
- Follows up with unresponsive applicants
- Answers common questions
- Manages communication sequences
- Tracks engagement metrics

### CHECKER Agent - Background Verification
**Status: Coming Q3 2026**

What Checker does:
- Initiates ID verification
- Requests criminal record checks
- Collects references
- Verifies qualifications
- Compiles verification reports

### ONBOARD Agent - New Hire Onboarding
**Status: Future**

What Onboard does:
- Sends offer letters
- Collects signed documents
- Gathers tax and bank details
- Schedules orientation
- Assigns onboarding buddy

## Human + AI Collaboration

```
AI Agent works autonomously
        ↓
Encounters complex situation
        ↓
Escalates to human with context
        ↓
Human makes decision
        ↓
AI learns and continues
```

**You're always in control:**
- Pause any agent at any time
- Override any AI decision
- Set your own rules and thresholds
- Review all agent activity logs

## Agent Capabilities Matrix

| Capability | Scout | Scheduler | Interviewer | Outreach | Checker | Onboard |
|------------|:-----:|:---------:|:-----------:|:--------:|:-------:|:-------:|
| Read candidates | Y | Y | Y | Y | Y | Y |
| Update candidates | Y | Y | Y | Y | Y | Y |
| Move pipeline | Y | - | Y | - | - | Y |
| Send emails | Y | Y | - | Y | Y | Y |
| Send WhatsApp | - | Y | - | Y | - | - |
| Access calendar | - | Y | - | - | - | - |
| Conduct interview | - | - | Y | - | - | - |
| Initiate verification | - | - | - | - | Y | - |
| Create reports | Y | Y | Y | Y | Y | Y |

---

# 4. USER EXPERIENCE

## Employer Journey

```
Day 1: Sign Up
├── Create account (2 minutes)
├── Set up company profile
├── Create first job role
└── Get your HireInbox email address

Day 2: First CVs
├── Forward CVs to HireInbox
├── AI screens automatically
├── View results in dashboard
└── Shortlist best candidates

Week 1: Full Workflow
├── Team members invited
├── Pipeline customized
├── Templates configured
└── Time savings realized

Month 1: Measurable Results
├── 80% time saved on screening
├── Higher quality shortlists
├── Faster time to hire
└── Team collaboration improved
```

## Job Seeker Journey

```
Minute 1: Upload CV
├── Drag and drop CV
├── Select target role (optional)
└── Click "Analyze"

Minute 2: Get Results
├── Overall score (0-100)
├── Strengths highlighted
├── Improvements suggested
└── Quick wins identified

Minute 5: Improve
├── Read detailed feedback
├── Consider paid upgrades
├── Apply improvements
└── Re-analyze (optional)

Optional: Video Coaching
├── Record practice video
├── AI analyzes performance
├── Get coaching tips
└── Build confidence
```

## Dashboard Components

### Employer Dashboard
- Clean, modern interface
- Key stats at a glance (CVs today, shortlisted, interviews)
- Recent candidates list
- Quick actions (create role, check emails)
- Mobile responsive

### Candidate View
- Full CV analysis
- Score breakdown by category
- Evidence from CV for each point
- Interview questions suggested
- One-click actions (shortlist, reject, contact)

### Job Seeker Results
- Clear score visualization
- Strengths and weaknesses
- Specific improvement tips
- ATS compatibility check
- Upgrade options

---

# 5. SECURITY & COMPLIANCE

## Data Protection

| Measure | Description |
|---------|-------------|
| Encryption | All data encrypted in transit and at rest |
| Access Control | Role-based permissions |
| Audit Trail | Every action logged |
| Data Isolation | Companies can't see each other's data |
| Secure Storage | Enterprise-grade cloud infrastructure |

## POPIA Compliance

HireInbox is fully compliant with South Africa's Protection of Personal Information Act:

| Requirement | How We Comply |
|-------------|---------------|
| Consent | Explicit consent required at registration |
| Purpose | Clear explanation of how data is used |
| Access | Users can view all their data |
| Correction | Users can edit their information |
| Deletion | Users can request account deletion |
| Security | Industry-standard security measures |
| Breach Notification | 72-hour notification process |

## AI Ethics

| Principle | Implementation |
|-----------|----------------|
| No Discrimination | AI doesn't consider age, gender, race |
| Transparency | All AI decisions are explainable |
| Human Oversight | Humans make final hiring decisions |
| Bias Monitoring | Regular audits of AI outputs |
| Right to Explanation | Candidates can request decision explanation |

## Security Features

| Feature | Description |
|---------|-------------|
| Two-Factor Authentication | Optional MFA for all users |
| Session Management | Automatic timeout, device tracking |
| IP Whitelisting | Restrict access by location (Enterprise) |
| SSO Support | Single sign-on for corporates (planned) |
| Penetration Testing | Annual security audits |

## Data Retention

| Data Type | Retention Period |
|-----------|------------------|
| User accounts | Until deletion requested |
| CVs | 2 years after last activity |
| Analysis results | 2 years |
| Audit logs | 7 years |
| Payment records | 7 years (tax compliance) |

---

# 6. INTEGRATIONS

## Current Integrations

| System | Integration Type | Status |
|--------|------------------|--------|
| Gmail | Email forwarding | Live |
| Outlook | Email forwarding | Live |
| PDF Processing | CV text extraction | Live |
| DOC/DOCX Processing | CV text extraction | Live |

## Planned Integrations

| System | Purpose | Timeline |
|--------|---------|----------|
| Google Calendar | Interview scheduling | Q2 2026 |
| Outlook Calendar | Interview scheduling | Q2 2026 |
| WhatsApp Business | Candidate messaging | Q2 2026 |
| Calendly | Interview booking | Q2 2026 |
| Zoom | Video interviews | Q3 2026 |
| Microsoft Teams | Video interviews | Q3 2026 |
| Google Meet | Video interviews | Q3 2026 |
| Sage HR | Employee data sync | Q3 2026 |
| BambooHR | ATS sync | Q3 2026 |
| Slack | Notifications | Q4 2026 |
| LinkedIn | Profile import | 2027 |

## API Access

For companies wanting to integrate HireInbox into their own systems:

| Feature | Description |
|---------|-------------|
| REST API | Full API access to all features |
| Webhooks | Real-time event notifications |
| Documentation | Comprehensive API docs |
| Sandbox | Test environment for development |
| Rate Limits | Fair usage policies |
| Authentication | API keys with scopes |

## Webhook Events

| Event | When Triggered |
|-------|----------------|
| candidate.created | New CV received |
| candidate.analyzed | AI analysis complete |
| candidate.status_changed | Pipeline stage changed |
| candidate.shortlisted | Moved to shortlist |
| interview.scheduled | Interview booked |
| interview.completed | Interview finished |

---

# 7. TECHNOLOGY SUMMARY

## Infrastructure

| Component | Provider | Purpose |
|-----------|----------|---------|
| Hosting | Vercel | Application hosting, auto-scaling |
| Database | Supabase | PostgreSQL database |
| Storage | Supabase | CV and video file storage |
| AI Engine | OpenAI | CV analysis, chat |
| Vision AI | Anthropic | Video analysis |
| Payments | Yoco | South African payments |
| Email | SendGrid | Transactional email |
| Security | Cloudflare | DDoS protection, CDN |

## AI Models

| Purpose | Technology | Details |
|---------|------------|---------|
| CV Screening | GPT-4o-mini | Fine-tuned on 6,000+ SA examples |
| Video Analysis | Claude Vision | Body language, communication |
| Interview AI | GPT-4o | Conversational interviews |
| Transcription | Whisper | Audio to text |

## Performance Specifications

| Metric | Target |
|--------|--------|
| Page Load Time | Under 2 seconds |
| CV Analysis Time | Under 30 seconds |
| Video Analysis Time | Under 60 seconds |
| API Response Time | Under 300ms (p95) |
| Uptime SLA | 99.5% |

## Scalability

| Metric | Capacity |
|--------|----------|
| CVs per month | 1 million+ |
| Concurrent users | 10,000+ |
| Storage | Unlimited (cloud) |
| API requests | 50,000/day per company |

## Multi-Tenancy

- Complete data isolation between companies
- Row-level security at database level
- Separate storage folders per company
- No cross-tenant data access possible

---

# 8. APPENDIX

## Glossary

| Term | Definition |
|------|------------|
| ATS | Applicant Tracking System - software to manage job applications |
| B2B | Business-to-Business - employer product |
| B2C | Business-to-Consumer - job seeker product |
| CV | Curriculum Vitae / Resume |
| Knockout | A must-have requirement that disqualifies if missing |
| Pipeline | Stages a candidate moves through (new → interview → hired) |
| POPIA | Protection of Personal Information Act - SA's data protection law |
| Shortlist | Candidates selected for further consideration |
| Talent Pool | Database of candidates available for matching |
| Webhook | Automated notification sent when an event occurs |

## Technical FAQ

**Q: How does the AI screening work?**
A: CVs are processed through our fine-tuned AI model trained on 6,000+ South African recruitment examples. The AI extracts key information, matches against job requirements, and produces a score with evidence from the CV.

**Q: Is candidate data secure?**
A: Yes. All data is encrypted at rest and in transit. Companies have complete data isolation. We're POPIA compliant with full audit trails.

**Q: Can we integrate with our existing systems?**
A: Yes. We offer a REST API, webhooks for real-time events, and are building native integrations with popular HR systems.

**Q: What file formats are supported?**
A: PDF, DOC, DOCX, and TXT for CVs. MP4, WebM, and MOV for videos.

**Q: How accurate is the AI?**
A: Our AI achieves 90%+ correlation with human recruiter decisions. All scores include evidence from the CV so you can verify the reasoning.

**Q: What happens if the AI is unsure?**
A: Low-confidence results are flagged for human review. The AI explains its uncertainty and provides context for the human to decide.

**Q: Can we customize the AI criteria?**
A: Yes. Each job role has configurable criteria, knockout requirements, and weighting. Enterprise plans can have custom-trained models.

**Q: Is there an SLA?**
A: Standard plans include 99.5% uptime. Enterprise plans have custom SLAs with dedicated support.

---

*Document Version: 1.0*
*Last Updated: January 2026*
*Classification: Partner Confidential*

---

# END OF DOCUMENT
