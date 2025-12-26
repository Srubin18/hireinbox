# Human Available Badge + 1-Click Appeal System

**POPIA Compliance Feature for HireInbox**

This feature addresses the regulatory requirement for human review of automated decisions under South Africa's Protection of Personal Information Act (POPIA), while also building trust with candidates.

---

## What Was Built

### 1. HumanAvailableBadge Component
**File:** `/src/components/HumanAvailableBadge.tsx`

A reusable React component that:
- Shows "AI Assisted | Human Review Available" on all AI decisions
- Supports three variants: `inline`, `card`, and `compact`
- Includes a 1-click appeal request modal
- Displays appeal status (pending, reviewed, upheld, overturned)
- Provides visual feedback for successful submissions

**Usage:**
```tsx
import HumanAvailableBadge from '@/components/HumanAvailableBadge';

// Basic usage
<HumanAvailableBadge
  candidateId="uuid"
  candidateName="John Doe"
  candidateEmail="john@example.com"
  roleTitle="Software Developer"
/>

// With appeal status
<HumanAvailableBadge
  candidateId="uuid"
  appealStatus="pending"
/>

// Compact variant for card headers
<HumanAvailableBadge variant="compact" />
```

---

### 2. Appeal Request API
**File:** `/src/app/api/appeal/request/route.ts`

Endpoints:
- `POST /api/appeal/request` - Create a new appeal
- `GET /api/appeal/request` - List all appeals (with filters)

Features:
- Validates candidate exists
- Prevents duplicate pending appeals
- Snapshots AI decision data for audit trail
- Sends email notifications (employer + candidate confirmation)
- Updates candidate record with appeal status

---

### 3. Appeal Management API
**File:** `/src/app/api/appeal/[id]/route.ts`

Endpoints:
- `GET /api/appeal/[id]` - Get appeal details with candidate data
- `PATCH /api/appeal/[id]` - Update appeal (employer review)
- `DELETE /api/appeal/[id]` - Delete appeal (admin only)

Features:
- Validates status transitions
- Records reviewer information
- Sends outcome notification to candidate
- Updates candidate status if decision overturned

---

### 4. Appeals Dashboard
**File:** `/src/app/appeals/page.tsx`

A full-featured employer dashboard for managing appeals:
- Stats overview (total, pending, overturned, upheld)
- Filter by status
- Appeal cards with candidate info and AI decision summary
- Detailed review modal with:
  - Candidate's appeal reason
  - AI decision snapshot
  - CV preview (if available)
  - Review form (name, notes, next steps)
  - Uphold/Overturn action buttons
- POPIA compliance notice

Access at: `/appeals`

---

### 5. Database Migration
**File:** `/docs/APPEALS_MIGRATION.sql`

Creates:
- `appeals` table with full schema
- Indexes for common queries
- Updates `candidates` table with appeal tracking columns
- Row Level Security policies
- Audit trigger for `updated_at`

**Run in Supabase SQL Editor before using the feature.**

---

## Email Notifications

Three automated emails are sent:

1. **To Employer** (on appeal request):
   - Subject: "Human Review Requested: [Name] for [Role]"
   - Includes candidate info, AI score, appeal reason
   - Link to review in dashboard

2. **To Candidate** (confirmation):
   - Subject: "Your Review Request Has Been Received"
   - Confirms appeal was submitted
   - Sets expectation for 2 business day response

3. **To Candidate** (outcome):
   - Subject varies by outcome
   - Explains the decision
   - Includes reviewer notes and next steps

---

## Appeal Flow

```
Candidate clicks "Request Review"
         |
         v
    Appeal created (status: pending)
         |
         v
    Employer notified via email
         |
         v
    Candidate receives confirmation
         |
         v
Employer reviews in /appeals dashboard
         |
    +----+----+
    |         |
    v         v
 Uphold    Overturn
    |         |
    v         v
Decision   Candidate moves
 stands    to reconsider
    |         |
    +----+----+
         |
         v
Candidate notified of outcome
```

---

## Status Values

| Status | Meaning |
|--------|---------|
| `pending` | Awaiting employer review |
| `reviewed` | Under active review |
| `upheld` | AI decision confirmed |
| `overturned` | AI decision changed |

---

## Integration Points

### CandidateCard
Add the badge to candidate cards:
```tsx
import HumanAvailableBadge, { TrustBadge } from '@/components/HumanAvailableBadge';

// In card header
<TrustBadge />

// In card footer for rejected candidates
{candidate.ai_recommendation === 'REJECT' && (
  <HumanAvailableBadge
    variant="inline"
    candidateId={candidate.id}
    candidateName={candidate.name}
    candidateEmail={candidate.email}
    roleTitle={roleTitle}
    appealStatus={candidate.appeal_status}
  />
)}
```

### B2C Upload Page
Show the badge after CV analysis:
```tsx
<HumanAvailableBadge
  variant="card"
  candidateId={analysisResult.candidateId}
  showAppealButton={true}
/>
```

---

## POPIA Compliance

This feature helps HireInbox comply with POPIA Section 71:
- Data subjects have the right to not be subject to automated decisions
- Human review must be available on request
- All decisions and reviews are logged for audit
- Clear communication about AI involvement

---

## Configuration

Required environment variables (for email notifications):
- `GMAIL_USER` - Gmail address for sending
- `GMAIL_APP_PASSWORD` - Gmail app password
- `NEXT_PUBLIC_APP_URL` - Base URL for dashboard links

---

## Files Created

```
src/
  components/
    HumanAvailableBadge.tsx    # Badge component with appeal modal
  app/
    appeals/
      page.tsx                  # Employer dashboard
    api/
      appeal/
        request/
          route.ts              # Create/list appeals
        [id]/
          route.ts              # Get/update/delete appeal
docs/
  APPEALS_MIGRATION.sql         # Database schema
  APPEALS_SYSTEM_README.md      # This file
```

---

*Built for HireInbox - POPIA-compliant AI recruitment*
