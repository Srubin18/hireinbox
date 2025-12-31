# HireInbox Database Schema

> **Last Updated:** December 2024
> **Database:** Supabase (PostgreSQL)
> **Schema:** public

---

## Overview

HireInbox uses Supabase as its database backend. The schema supports three product lines:
- **B2B:** Employer CV screening dashboard
- **B2C:** Job seeker CV upload and feedback
- **B2Recruiter:** Professional recruiter tools (planned)

All tables use UUIDs as primary keys and include `created_at` timestamps.

---

## Entity Relationship Diagram

```
                                    +---------------+
                                    |   companies   |
                                    +---------------+
                                          |
                      +-------------------+-------------------+
                      |                                       |
                      v                                       v
                +----------+                            +----------+
                |  users   |                            |   roles  |
                +----------+                            +----------+
                      |                                       |
                      |                                       |
                      v                                       v
          +-----------------+                        +-------------+
          |     usage       |                        |  candidates |
          +-----------------+                        +-------------+
          |    payments     |                              |
          +-----------------+               +--------------+--------------+
                                            |              |              |
                                            v              v              v
                                     +----------+   +----------+   +----------+
                                     | appeals  |   |interview |   |  talent  |
                                     |          |   | sessions |   |   pool   |
                                     +----------+   +----------+   +----------+
```

---

## Core Tables

### 1. companies

Stores company/organization information for B2B customers.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Primary key |
| name | TEXT | NO | - | Company name |
| logo_url | TEXT | YES | NULL | Logo image URL |
| industry | TEXT | YES | NULL | Industry category |
| size | TEXT | YES | NULL | Company size (e.g., '1-10', '11-50', '51-200') |
| website | TEXT | YES | NULL | Company website |
| settings | JSONB | YES | '{}' | Company-specific settings |
| created_at | TIMESTAMPTZ | NO | NOW() | Record creation time |
| updated_at | TIMESTAMPTZ | YES | NULL | Last update time |

**Indexes:**
- `companies_pkey` on `id`
- `idx_companies_name` on `name`

---

### 2. users

Stores user accounts for authentication and authorization.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Primary key (matches Supabase Auth) |
| email | TEXT | NO | - | User email (unique) |
| role | TEXT | NO | 'recruiter' | User role: 'admin', 'recruiter', 'viewer', 'candidate' |
| company_id | UUID | YES | NULL | FK to companies (NULL for B2C users) |
| name | TEXT | YES | NULL | Display name |
| avatar_url | TEXT | YES | NULL | Profile image URL |
| metadata | JSONB | YES | '{}' | Additional user data |
| created_at | TIMESTAMPTZ | NO | NOW() | Record creation time |
| updated_at | TIMESTAMPTZ | YES | NULL | Last update time |

**Indexes:**
- `users_pkey` on `id`
- `idx_users_email` UNIQUE on `email`
- `idx_users_company_id` on `company_id`

**Foreign Keys:**
- `users_company_id_fkey` REFERENCES `companies(id)` ON DELETE SET NULL

---

### 3. roles

Stores job roles/positions that candidates apply for.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Primary key |
| company_id | UUID | YES | NULL | FK to companies |
| title | TEXT | NO | - | Job title |
| status | TEXT | NO | 'active' | Role status: 'active', 'paused', 'closed' |
| context | JSONB | YES | '{}' | Role context (seniority, employment_type, etc.) |
| criteria | JSONB | YES | '{}' | Scoring criteria and weights |
| facts | JSONB | YES | '{}' | Required facts (skills, qualifications, experience) |
| preferences | JSONB | YES | '{}' | Nice-to-have preferences |
| ai_guidance | JSONB | YES | '{}' | AI screening guidance |
| auto_schedule_config | JSONB | YES | NULL | Auto-scheduling settings |
| imap_config | JSONB | YES | NULL | IMAP connection settings for email screening |
| created_at | TIMESTAMPTZ | NO | NOW() | Record creation time |
| updated_at | TIMESTAMPTZ | YES | NULL | Last update time |

**Indexes:**
- `roles_pkey` on `id`
- `idx_roles_company_id` on `company_id`
- `idx_roles_status` on `status`

**Foreign Keys:**
- `roles_company_id_fkey` REFERENCES `companies(id)` ON DELETE CASCADE

**JSONB Structure Examples:**

```json
// context
{
  "seniority": "senior",
  "employment_type": "permanent",
  "location": "Cape Town",
  "remote_option": true
}

// facts
{
  "min_experience_years": 3,
  "required_skills": ["Python", "SQL", "Machine Learning"],
  "qualifications": ["BSc Computer Science", "BCom Informatics"],
  "salary_range": { "min": 400000, "max": 600000, "currency": "ZAR" }
}

// criteria
{
  "experience_weight": 30,
  "skills_weight": 25,
  "education_weight": 20,
  "culture_weight": 15,
  "trajectory_weight": 10
}
```

---

### 4. candidates

Stores candidate applications and screening results.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Primary key |
| company_id | UUID | YES | NULL | FK to companies |
| role_id | UUID | YES | NULL | FK to roles |
| name | TEXT | NO | - | Candidate name |
| email | TEXT | NO | - | Candidate email |
| phone | TEXT | YES | NULL | Phone number |
| cv_text | TEXT | YES | NULL | Extracted CV text |
| cv_url | TEXT | YES | NULL | URL to uploaded CV file |
| cv_summary | TEXT | YES | NULL | AI-generated CV summary |
| status | TEXT | NO | 'new' | Application status |
| score | INTEGER | YES | 0 | Overall match score (0-100) |
| ai_score | INTEGER | YES | NULL | AI screening score |
| ai_recommendation | TEXT | YES | NULL | SHORTLIST, CONSIDER, or REJECT |
| ai_reasoning | TEXT | YES | NULL | Explanation for AI decision |
| screening_result | JSONB | YES | NULL | Full AI screening output |
| screened_at | TIMESTAMPTZ | YES | NULL | When AI screening completed |
| strengths | TEXT[] | YES | '{}' | Array of identified strengths |
| missing | TEXT[] | YES | '{}' | Array of missing requirements |
| experience_years | INTEGER | YES | NULL | Years of experience |
| education | TEXT | YES | NULL | Education summary |
| interview_feedback | JSONB | YES | NULL | AI interview results |
| appeal_requested | BOOLEAN | YES | FALSE | Whether appeal was requested |
| appeal_status | TEXT | YES | NULL | pending, reviewed, upheld, overturned |
| appeal_id | UUID | YES | NULL | FK to appeals |
| feedback_token | TEXT | YES | NULL | Token for candidate feedback page |
| created_at | TIMESTAMPTZ | NO | NOW() | Record creation time |
| updated_at | TIMESTAMPTZ | YES | NULL | Last update time |

**Status Values:**
- `new` - Just received, not yet processed
- `unprocessed` - CV parsing failed
- `shortlist` - AI recommends for interview (score 80+)
- `consider` - AI suggests review (score 60-79)
- `rejected` - AI recommends rejection (score <60)
- `interviewing` - Currently in interview process
- `hired` - Candidate was hired
- `archived` - Application closed

**Indexes:**
- `candidates_pkey` on `id`
- `idx_candidates_role_id` on `role_id`
- `idx_candidates_company_id` on `company_id`
- `idx_candidates_email` on `email`
- `idx_candidates_status` on `status`
- `idx_candidates_created_at` on `created_at DESC`
- `idx_candidates_feedback_token` on `feedback_token`

**Foreign Keys:**
- `candidates_company_id_fkey` REFERENCES `companies(id)` ON DELETE SET NULL
- `candidates_role_id_fkey` REFERENCES `roles(id)` ON DELETE CASCADE
- `candidates_appeal_id_fkey` REFERENCES `appeals(id)` ON DELETE SET NULL

---

### 5. appeals

Stores human review requests for AI screening decisions (POPIA compliance).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Primary key |
| candidate_id | UUID | YES | NULL | FK to candidates |
| role_id | UUID | YES | NULL | FK to roles |
| company_id | UUID | YES | NULL | FK to companies |
| candidate_name | TEXT | NO | - | Denormalized for audit trail |
| candidate_email | TEXT | NO | - | Denormalized for audit trail |
| role_title | TEXT | NO | 'Unknown Role' | Denormalized for audit trail |
| reason | TEXT | YES | NULL | Candidate's appeal reason |
| status | TEXT | NO | 'pending' | pending, reviewed, upheld, overturned |
| ai_score | INTEGER | YES | NULL | Original AI score snapshot |
| ai_recommendation | TEXT | YES | NULL | Original AI recommendation |
| ai_decision_data | JSONB | YES | NULL | Full AI decision snapshot |
| reviewer_name | TEXT | YES | NULL | Who reviewed the appeal |
| reviewer_email | TEXT | YES | NULL | Reviewer's email |
| reviewer_notes | TEXT | YES | NULL | Notes shared with candidate |
| outcome | TEXT | YES | NULL | upheld or overturned |
| outcome_reason | TEXT | YES | NULL | Explanation of outcome |
| next_steps | TEXT | YES | NULL | What happens next |
| created_at | TIMESTAMPTZ | NO | NOW() | Appeal submission time |
| updated_at | TIMESTAMPTZ | YES | NOW() | Last update time |
| reviewed_at | TIMESTAMPTZ | YES | NULL | When review completed |
| ip_address | TEXT | YES | NULL | Audit: submitter IP |
| user_agent | TEXT | YES | NULL | Audit: submitter browser |

**Indexes:**
- `appeals_pkey` on `id`
- `idx_appeals_candidate_id` on `candidate_id`
- `idx_appeals_status` on `status`
- `idx_appeals_company_id` on `company_id`
- `idx_appeals_created_at` on `created_at DESC`

**Foreign Keys:**
- `appeals_candidate_id_fkey` REFERENCES `candidates(id)` ON DELETE CASCADE
- `appeals_role_id_fkey` REFERENCES `roles(id)` ON DELETE SET NULL
- `appeals_company_id_fkey` REFERENCES `companies(id)` ON DELETE SET NULL

---

### 6. usage

Tracks API and feature usage for billing and limits.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Primary key |
| user_id | UUID | YES | NULL | FK to users |
| company_id | UUID | YES | NULL | FK to companies |
| type | TEXT | NO | - | Usage type (cv_screen, interview, etc.) |
| count | INTEGER | NO | 1 | Usage count |
| period | TEXT | NO | - | Billing period (e.g., '2024-12') |
| metadata | JSONB | YES | '{}' | Additional usage data |
| created_at | TIMESTAMPTZ | NO | NOW() | Record creation time |

**Usage Types:**
- `cv_screen` - B2B CV screening
- `cv_analysis` - B2C CV analysis
- `interview` - AI interview session
- `email_sent` - Outbound email
- `whatsapp_sent` - WhatsApp notification

**Indexes:**
- `usage_pkey` on `id`
- `idx_usage_user_id` on `user_id`
- `idx_usage_company_id` on `company_id`
- `idx_usage_type_period` on `(type, period)`

**Foreign Keys:**
- `usage_user_id_fkey` REFERENCES `users(id)` ON DELETE CASCADE
- `usage_company_id_fkey` REFERENCES `companies(id)` ON DELETE CASCADE

---

### 7. payments

Stores payment transactions and subscription data.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Primary key |
| user_id | UUID | YES | NULL | FK to users |
| company_id | UUID | YES | NULL | FK to companies |
| amount | INTEGER | NO | - | Amount in cents (ZAR) |
| currency | TEXT | NO | 'ZAR' | Currency code |
| status | TEXT | NO | 'pending' | pending, completed, failed, refunded |
| provider | TEXT | NO | - | Payment provider (payfast, stripe) |
| provider_ref | TEXT | YES | NULL | External transaction reference |
| description | TEXT | YES | NULL | Payment description |
| metadata | JSONB | YES | '{}' | Additional payment data |
| created_at | TIMESTAMPTZ | NO | NOW() | Transaction time |
| updated_at | TIMESTAMPTZ | YES | NULL | Last update time |

**Indexes:**
- `payments_pkey` on `id`
- `idx_payments_user_id` on `user_id`
- `idx_payments_company_id` on `company_id`
- `idx_payments_status` on `status`
- `idx_payments_provider_ref` on `provider_ref`

**Foreign Keys:**
- `payments_user_id_fkey` REFERENCES `users(id)` ON DELETE SET NULL
- `payments_company_id_fkey` REFERENCES `companies(id)` ON DELETE SET NULL

---

## Interview & Scheduling Tables

### 8. interview_sessions

Stores AI voice interview sessions and results.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | TEXT | NO | - | Session ID (interview_timestamp_random) |
| candidate_id | UUID | NO | - | FK to candidates |
| role_id | UUID | YES | NULL | FK to roles |
| status | TEXT | NO | 'created' | created, in_progress, completed, cancelled |
| interview_plan | JSONB | YES | NULL | Generated interview questions |
| transcript | JSONB | YES | NULL | Full conversation transcript |
| analysis | JSONB | YES | NULL | AI analysis of responses |
| scores | JSONB | YES | NULL | Competency scores |
| duration_seconds | INTEGER | YES | NULL | Interview duration |
| created_at | TIMESTAMPTZ | NO | NOW() | Session created |
| started_at | TIMESTAMPTZ | YES | NULL | Interview started |
| completed_at | TIMESTAMPTZ | YES | NULL | Interview completed |

**Indexes:**
- `interview_sessions_pkey` on `id`
- `idx_interview_sessions_candidate_id` on `candidate_id`
- `idx_interview_sessions_status` on `status`

---

### 9. interview_slots

Stores available interview time slots.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Primary key |
| company_id | UUID | NO | - | FK to companies |
| role_id | UUID | NO | - | FK to roles |
| recruiter_id | UUID | YES | NULL | FK to users |
| recruiter_name | TEXT | YES | NULL | Recruiter display name |
| recruiter_email | TEXT | YES | NULL | Recruiter email |
| start_time | TIMESTAMPTZ | NO | - | Slot start time |
| end_time | TIMESTAMPTZ | NO | - | Slot end time |
| duration | INTEGER | NO | 30 | Duration in minutes |
| location_type | TEXT | NO | 'video' | video, phone, in-person |
| meeting_link | TEXT | YES | NULL | Video meeting URL |
| address | TEXT | YES | NULL | In-person address |
| is_booked | BOOLEAN | NO | FALSE | Whether slot is booked |
| booked_by_candidate_id | UUID | YES | NULL | FK to candidates |
| booked_at | TIMESTAMPTZ | YES | NULL | When booked |
| calendar_event_id | TEXT | YES | NULL | External calendar event ID |
| notes | TEXT | YES | NULL | Slot notes |
| created_at | TIMESTAMPTZ | NO | NOW() | Record creation time |

**Indexes:**
- `interview_slots_pkey` on `id`
- `idx_interview_slots_role_id` on `role_id`
- `idx_interview_slots_start_time` on `start_time`
- `idx_interview_slots_is_booked` on `is_booked`

---

### 10. scheduled_interviews

Stores confirmed interview bookings.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Primary key |
| slot_id | UUID | NO | - | FK to interview_slots |
| candidate_id | UUID | NO | - | FK to candidates |
| role_id | UUID | NO | - | FK to roles |
| status | TEXT | NO | 'scheduled' | scheduled, completed, cancelled, no_show |
| reminder_sent | BOOLEAN | NO | FALSE | Whether reminder was sent |
| created_at | TIMESTAMPTZ | NO | NOW() | Record creation time |
| updated_at | TIMESTAMPTZ | YES | NULL | Last update time |

---

### 11. booking_links

Stores candidate booking link tokens.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Primary key |
| token | TEXT | NO | - | Unique booking token |
| candidate_id | UUID | NO | - | FK to candidates |
| role_id | UUID | NO | - | FK to roles |
| expires_at | TIMESTAMPTZ | NO | - | Link expiration time |
| used_at | TIMESTAMPTZ | YES | NULL | When link was used |
| created_at | TIMESTAMPTZ | NO | NOW() | Record creation time |

**Indexes:**
- `booking_links_pkey` on `id`
- `idx_booking_links_token` UNIQUE on `token`
- `idx_booking_links_candidate_id` on `candidate_id`

---

### 12. recruiter_availability

Stores recruiter availability settings.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Primary key |
| company_id | UUID | NO | - | FK to companies |
| recruiter_id | UUID | NO | - | FK to users |
| recruiter_email | TEXT | NO | - | Recruiter email |
| calendar_id | TEXT | YES | NULL | Google Calendar ID |
| availability_windows | JSONB | NO | '[]' | Weekly availability windows |
| interview_duration | INTEGER | NO | 30 | Default duration (minutes) |
| buffer_between | INTEGER | NO | 15 | Buffer between interviews |
| max_per_day | INTEGER | NO | 8 | Max interviews per day |
| timezone | TEXT | NO | 'Africa/Johannesburg' | Recruiter timezone |
| auto_create_meet | BOOLEAN | NO | TRUE | Auto-create Google Meet |
| calendar_connected | BOOLEAN | NO | FALSE | Calendar integration active |
| calendar_tokens | JSONB | YES | NULL | OAuth tokens (encrypted) |
| created_at | TIMESTAMPTZ | NO | NOW() | Record creation time |
| updated_at | TIMESTAMPTZ | YES | NOW() | Last update time |

---

## Communication Tables

### 13. email_history

Stores sent email records.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Primary key |
| candidate_id | UUID | YES | NULL | FK to candidates |
| role_id | UUID | YES | NULL | FK to roles |
| email_type | TEXT | NO | - | Type of email sent |
| recipient | TEXT | NO | - | Recipient email |
| subject | TEXT | NO | - | Email subject |
| body | TEXT | YES | NULL | Email body |
| status | TEXT | NO | 'sent' | sent, delivered, bounced, failed |
| message_id | TEXT | YES | NULL | Email provider message ID |
| created_at | TIMESTAMPTZ | NO | NOW() | Record creation time |

**Email Types:**
- `acknowledgment` - Application received
- `outcome` - Application decision
- `interview_invite` - Interview scheduling
- `interview_confirmation` - Interview booked
- `feedback` - Candidate feedback
- `reminder` - Interview reminder

---

### 14. whatsapp_conversations

Stores WhatsApp conversation state.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Primary key |
| phone_number | TEXT | NO | - | WhatsApp phone number |
| state | TEXT | NO | 'initial' | Conversation state |
| context | JSONB | YES | '{}' | Conversation context |
| last_message_at | TIMESTAMPTZ | YES | NULL | Last message time |
| created_at | TIMESTAMPTZ | NO | NOW() | Record creation time |
| updated_at | TIMESTAMPTZ | YES | NULL | Last update time |

---

### 15. whatsapp_optouts

Stores WhatsApp opt-out preferences.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Primary key |
| phone_number | TEXT | NO | - | Phone number (unique) |
| opted_out_at | TIMESTAMPTZ | NO | NOW() | When they opted out |
| reason | TEXT | YES | NULL | Opt-out reason |

---

### 16. whatsapp_notifications

Stores sent WhatsApp notifications.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Primary key |
| candidate_id | UUID | YES | NULL | FK to candidates |
| phone_number | TEXT | NO | - | Recipient phone |
| message_type | TEXT | NO | - | Notification type |
| message_id | TEXT | YES | NULL | WhatsApp message ID |
| status | TEXT | NO | 'sent' | sent, delivered, read, failed |
| created_at | TIMESTAMPTZ | NO | NOW() | Record creation time |

---

### 17. whatsapp_cv_cache

Temporary cache for CVs received via WhatsApp.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Primary key |
| phone_number | TEXT | NO | - | Sender phone |
| cv_text | TEXT | YES | NULL | Extracted CV text |
| cv_url | TEXT | YES | NULL | CV file URL |
| role_id | UUID | YES | NULL | Target role |
| expires_at | TIMESTAMPTZ | NO | - | Cache expiration |
| created_at | TIMESTAMPTZ | NO | NOW() | Record creation time |

---

## Talent Management Tables

### 18. talent_pool

Stores candidates saved for future opportunities.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Primary key |
| company_id | UUID | NO | - | FK to companies |
| candidate_id | UUID | NO | - | FK to candidates |
| original_role_id | UUID | YES | NULL | Role they applied for |
| status | TEXT | NO | 'active' | active, contacted, archived |
| rejection_reason | TEXT | YES | NULL | Why they weren't selected |
| ai_recommended_roles | TEXT[] | YES | '{}' | AI-suggested future roles |
| ai_talent_notes | TEXT | YES | NULL | AI assessment notes |
| talent_category | TEXT | YES | NULL | Category tag |
| seniority_level | TEXT | YES | NULL | junior, mid, senior, lead |
| share_with_network | BOOLEAN | NO | FALSE | Share with network |
| shared_at | TIMESTAMPTZ | YES | NULL | When shared |
| notes | TEXT | YES | NULL | Recruiter notes |
| added_at | TIMESTAMPTZ | NO | NOW() | Added to pool |
| contacted_at | TIMESTAMPTZ | YES | NULL | Last contacted |

**Indexes:**
- `talent_pool_pkey` on `id`
- `idx_talent_pool_company_id` on `company_id`
- `idx_talent_pool_candidate_id` on `candidate_id`
- `idx_talent_pool_status` on `status`
- `idx_talent_pool_talent_category` on `talent_category`

---

## Row Level Security (RLS)

All tables have RLS enabled. Key policies:

### Service Role Access
```sql
-- Service role bypasses RLS (for API routes)
CREATE POLICY "Service role full access" ON public.{table}
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);
```

### Company Data Isolation
```sql
-- Users can only see their company's data
CREATE POLICY "Users can view company data" ON public.candidates
    FOR SELECT TO authenticated
    USING (
        company_id IN (
            SELECT company_id FROM public.users WHERE id = auth.uid()
        )
    );
```

### Candidate Self-Access
```sql
-- Candidates can view their own records via feedback token
CREATE POLICY "Candidate self access" ON public.candidates
    FOR SELECT TO anon
    USING (feedback_token = current_setting('request.headers')::json->>'x-feedback-token');
```

---

## Migration Notes

1. **Initial Setup:** Run `001_initial_schema.sql` first
2. **Appeals System:** Run `APPEALS_MIGRATION.sql` to add appeal tables
3. **Always test migrations** in a development project first
4. **Backup before migrations** using Supabase dashboard

---

## Common Queries

### Get candidates for a role with status counts
```sql
SELECT
    r.title,
    c.status,
    COUNT(*) as count,
    AVG(c.ai_score) as avg_score
FROM candidates c
JOIN roles r ON c.role_id = r.id
WHERE r.id = 'role-uuid'
GROUP BY r.title, c.status;
```

### Get monthly usage for billing
```sql
SELECT
    type,
    SUM(count) as total_usage
FROM usage
WHERE company_id = 'company-uuid'
    AND period = to_char(NOW(), 'YYYY-MM')
GROUP BY type;
```

### Get pending appeals for company
```sql
SELECT
    a.*,
    c.cv_text
FROM appeals a
JOIN candidates c ON a.candidate_id = c.id
WHERE a.company_id = 'company-uuid'
    AND a.status = 'pending'
ORDER BY a.created_at ASC;
```

---

## Performance Considerations

1. **Candidates table** can grow large - ensure indexes are maintained
2. **cv_text column** can be large - consider compression or external storage
3. **screening_result JSONB** - use GIN indexes if querying frequently
4. **Archive old data** - move completed roles to archive after 90 days

---

## Future Schema Changes (Planned)

1. **Assessments table** - Detailed scoring breakdowns
2. **Teams table** - Team-based access control
3. **Subscriptions table** - Recurring billing
4. **Audit log table** - Comprehensive activity logging
5. **Integrations table** - Third-party connections

---

*This document is part of the HireInbox project. See CLAUDE.md for full context.*
