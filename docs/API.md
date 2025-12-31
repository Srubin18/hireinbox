# HireInbox API Documentation

> Last updated: December 2024
> Version: 1.0

This document describes all API endpoints for the HireInbox platform.

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Error Handling](#error-handling)
4. [Rate Limiting](#rate-limiting)
5. [Core API Endpoints](#core-api-endpoints)
   - [Roles](#roles)
   - [Candidates](#candidates)
   - [Screening](#screening)
   - [CV Analysis (B2C)](#cv-analysis-b2c)
6. [Email Integration](#email-integration)
7. [Feedback & Appeals](#feedback--appeals)
8. [Scheduling](#scheduling)
9. [Analytics](#analytics)

---

## Overview

The HireInbox API is built on Next.js App Router with RESTful conventions. All endpoints return JSON responses and include a `traceId` for debugging purposes.

**Base URL:** `https://your-domain.com/api`

---

## Authentication

> **Note:** Authentication is pending implementation. When deployed, endpoints will require:
> - Bearer token in `Authorization` header
> - User must belong to the company accessing resources

```
Authorization: Bearer <supabase_access_token>
```

---

## Error Handling

All errors follow a standardized format:

```json
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": "Additional context (optional)",
  "traceId": "unique-trace-id"
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Missing or invalid auth |
| 403 | Forbidden - Not allowed to access resource |
| 404 | Not Found - Resource does not exist |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |

### Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Input validation failed |
| `NOT_FOUND` | Resource not found |
| `DATABASE_ERROR` | Database operation failed |
| `AI_ERROR` | AI processing failed |
| `AUTH_ERROR` | Authentication failed |
| `RATE_LIMIT` | Rate limit exceeded |

---

## Rate Limiting

Rate limits are applied per-user or per-IP for anonymous requests.

| Endpoint Type | Limit |
|---------------|-------|
| GET (read) | 100 requests/hour |
| POST/PATCH/DELETE (write) | 50 requests/hour |
| AI-powered endpoints | 10 requests/hour (B2C anonymous) |
| AI-powered endpoints | 100 requests/hour (B2B authenticated) |

> **Implementation:** Use Vercel KV or Upstash Redis for production rate limiting.

---

## Core API Endpoints

### Roles

Manage job roles for screening.

#### `GET /api/roles`

List all roles for the authenticated company.

**Response:**
```json
{
  "roles": [
    {
      "id": "uuid",
      "title": "Senior Accountant",
      "status": "active",
      "company_id": "uuid",
      "context": { "seniority": "senior", "industry": "finance" },
      "criteria": { "min_experience_years": 5 },
      "facts": { "required_skills": ["CA(SA)", "Excel"], "location": "Cape Town" },
      "preferences": { "nice_to_have": "CIMA qualification" },
      "ai_guidance": { "strong_fit": "Big 4 experience", "disqualifiers": "No CA(SA)" },
      "created_at": "2024-12-01T00:00:00Z"
    }
  ],
  "traceId": "abc123"
}
```

#### `POST /api/roles`

Create a new role.

**Request Body:**
```json
{
  "title": "Senior Accountant",  // Required, 2-200 chars
  "company_id": "uuid",          // Optional, UUID
  "status": "active",            // Optional: active|paused|closed|draft
  "context": {},                 // Optional: seniority, industry, etc.
  "criteria": {},                // Optional: min_experience_years, etc.
  "facts": {},                   // Optional: required_skills, location, etc.
  "preferences": {},             // Optional: nice_to_have, etc.
  "ai_guidance": {}              // Optional: strong_fit, disqualifiers
}
```

**Response:** `201 Created`
```json
{
  "role": { ... },
  "traceId": "abc123"
}
```

#### `PATCH /api/roles`

Update an existing role.

**Request Body:**
```json
{
  "id": "uuid",                  // Required
  "title": "Updated Title",      // Optional
  "status": "paused"             // Optional
  // ... any other fields to update
}
```

#### `DELETE /api/roles?id=<uuid>`

Delete a role by ID.

---

### Candidates

Manage candidate records.

#### `GET /api/candidates`

List all candidates.

**Response:**
```json
{
  "candidates": [
    {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+27821234567",
      "role_id": "uuid",
      "status": "shortlist",
      "score": 85,
      "strengths": ["CA(SA) qualified", "5 years Big 4 experience"],
      "missing": ["Industry-specific knowledge"],
      "cv_text": "...",
      "screening_result": { ... },
      "created_at": "2024-12-01T00:00:00Z"
    }
  ],
  "traceId": "abc123"
}
```

#### `POST /api/candidates`

Create a new candidate.

**Request Body:**
```json
{
  "name": "John Doe",            // Required, 1-200 chars
  "email": "john@example.com",   // Required, valid email
  "role_id": "uuid",             // Required, UUID
  "company_id": "uuid",          // Optional, UUID
  "phone": "+27821234567",       // Optional, max 50 chars
  "cv_text": "...",              // Optional, max 500k chars
  "status": "new",               // Optional: new|screened|shortlist|talent_pool|reject|interview|hired|unprocessed
  "score": 0,                    // Optional: 0-100
  "strengths": [],               // Optional: array of strings
  "missing": []                  // Optional: array of strings
}
```

#### `PATCH /api/candidates`

Update an existing candidate.

**Request Body:**
```json
{
  "id": "uuid",                  // Required
  "status": "interview",         // Optional
  "score": 90                    // Optional: 0-100
  // ... any other fields to update
}
```

#### `DELETE /api/candidates?id=<uuid>`

Delete a candidate by ID.

---

### Screening

AI-powered CV screening against a role.

#### `POST /api/screen`

Screen a CV against a role's requirements.

**Request Body:**
```json
{
  "roleId": "uuid",              // Required
  "candidateId": "uuid",         // Optional - update candidate record if provided
  "cvText": "..."                // Optional - CV text (use if candidateId not provided)
}
```

**Response:**
```json
{
  "success": true,
  "assessment": {
    "candidate_name": "John Doe",
    "overall_score": 85,
    "recommendation": "SHORTLIST",  // SHORTLIST|CONSIDER|REJECT
    "recommendation_reason": "Strong CA(SA) with Big 4 experience",
    "knockouts": {
      "all_passed": true,
      "checks": [
        {
          "requirement": "CA(SA) qualification",
          "status": "PASS",
          "evidence": "\"Admitted as CA(SA) in 2019\""
        }
      ]
    },
    "ranking": {
      "eligible": true,
      "weighted_score": 82,
      "factors": [...]
    },
    "summary": {
      "strengths": [
        { "label": "Big 4 experience", "evidence": "\"5 years at PwC\"" }
      ],
      "weaknesses": [
        { "label": "Industry exposure", "evidence": "Limited mining experience" }
      ],
      "fit_assessment": "Strong technical candidate with..."
    },
    "risk_register": [...],
    "interview_focus": [...]
  },
  "role": { "id": "uuid", "title": "Senior Accountant" },
  "traceId": "abc123"
}
```

---

### CV Analysis (B2C)

Analyze CV for job seekers without a specific role.

#### `POST /api/analyze-cv`

Analyze a CV and provide feedback.

**Request Body:** `multipart/form-data`

| Field | Type | Description |
|-------|------|-------------|
| `cv` | File | PDF, DOC, DOCX, or TXT file (max 10MB) |
| `cvText` | String | Pasted CV text (alternative to file, max 100k chars) |

**Response:**
```json
{
  "success": true,
  "analysis": {
    "candidate_name": "John Doe",
    "current_title": "Senior Accountant",
    "years_experience": 5,
    "education_level": "BCom Honours, UCT",
    "overall_score": 82,
    "score_explanation": "Strong CA(SA) with quantified achievements",
    "first_impression": "Experienced CA(SA) with Big 4 background...",
    "sa_context_highlights": [
      "CA(SA) - Gold standard SA qualification",
      "PwC - Big 4 training background"
    ],
    "strengths": [
      {
        "strength": "Quantified achievements",
        "evidence": "\"Reduced audit time by 30%\"",
        "impact": "Demonstrates measurable value"
      }
    ],
    "improvements": [
      {
        "area": "Industry keywords",
        "current_state": "Generic accounting terms",
        "suggestion": "Add specific industry terms for target roles",
        "priority": "MEDIUM"
      }
    ],
    "quick_wins": [
      "Add metrics to recent role description",
      "Include CA(SA) membership number"
    ],
    "career_insights": {
      "natural_fit_roles": ["Senior Accountant", "Finance Manager"],
      "industries": ["Financial Services", "FMCG"],
      "trajectory_observation": "On track for manager-level roles",
      "salary_positioning": "senior"
    },
    "ats_check": {
      "likely_ats_friendly": true,
      "issues": [],
      "recommendation": null
    },
    "recruiter_view": {
      "seven_second_impression": "CA(SA) with Big 4 - worth reviewing",
      "standout_element": "30% audit time reduction",
      "red_flag_check": "None detected"
    },
    "summary": "Strong CV with good evidence. Consider adding..."
  },
  "originalCV": "...",
  "traceId": "abc123"
}
```

---

## Email Integration

### `POST /api/fetch-emails`

Fetch and process CV applications from email inbox.

**Note:** This is an internal endpoint typically called by a cron job.

**Response:**
```json
{
  "success": true,
  "processed": 5,
  "traceId": "abc123",
  "listedCount": 10,
  "processedCount": 5,
  "storedCount": 5,
  "parsedCount": 5,
  "failedParseCount": 0,
  "skippedDuplicates": 2,
  "skippedSystem": 3,
  "skippedSpam": 0,
  "candidates": ["John Doe (85)", "Jane Smith (92)"],
  "errors": []
}
```

---

## Feedback & Appeals

### `GET /api/feedback/[token]`

Get candidate feedback by token (public endpoint for candidates).

### `POST /api/feedback/[token]/request-review`

Request human review of AI decision.

### `POST /api/appeal/request`

Submit an appeal for a rejected candidate.

### `GET /api/appeal/[id]`

Get appeal status.

---

## Scheduling

### `GET /api/schedule/slots?role_id=<uuid>`

Get available interview slots.

### `POST /api/schedule/auto`

Auto-schedule interviews for qualified candidates.

---

## Analytics

### `GET /api/analytics/bias`

Get bias analysis metrics for AI decisions.

### `GET /api/analytics/audit-export`

Export audit trail for POPIA compliance.

---

## Health Check

### `GET /api/health`

Check API health status.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-12-26T00:00:00Z",
  "database": "connected"
}
```

---

## Security Considerations

1. **Input Validation:**
   - All inputs are validated for type, length, and format
   - UUIDs are validated before database queries
   - File uploads are limited to 10MB and validated for type

2. **SQL Injection:**
   - All database queries use Supabase parameterized queries
   - No raw SQL is constructed from user input

3. **Sensitive Data:**
   - Internal error details are never exposed to clients
   - Stack traces are logged server-side only
   - No PII in error messages

4. **File Uploads:**
   - Allowed types: PDF, DOC, DOCX, TXT only
   - Filenames are sanitized (path traversal prevention)
   - File content is parsed server-side, never executed

---

## Development

### Local Development

```bash
npm run dev
```

### Environment Variables

Required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `GMAIL_USER`
- `GMAIL_APP_PASSWORD`
- `CONVERTAPI_SECRET` (for PDF parsing in production)

---

*This documentation is auto-generated and maintained by the HireInbox team.*
