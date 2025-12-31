# HireInbox Testing Guide

This document outlines the testing infrastructure, how to run tests, and critical flows that need testing.

---

## Quick Start

```bash
# Install test dependencies (if not already installed)
npm install -D vitest @vitejs/plugin-react jsdom

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npx vitest src/__tests__/lib/api-error.test.ts
```

---

## Test Structure

```
src/
├── __tests__/
│   ├── setup.ts              # Test configuration and global mocks
│   ├── lib/                   # Unit tests for utility functions
│   │   ├── api-error.test.ts  # Error handling utilities
│   │   ├── env.test.ts        # Environment variable handling
│   │   └── sa-context.test.ts # SA context data validation
│   ├── api/                   # API route tests
│   │   ├── health.test.ts     # Health check endpoint
│   │   └── analyze-cv.test.ts # CV analysis endpoint
│   └── smoke/                 # Smoke tests
│       ├── pages.test.ts      # Page export validation
│       └── integration.test.ts # System integration tests
```

---

## Test Categories

### 1. Unit Tests (`src/__tests__/lib/`)

Test individual utility functions in isolation.

**Covered:**
- `api-error.ts` - Error class creation, factory methods, response formatting
- `env.ts` - Environment validation, feature flag checks
- `sa-context.ts` - SA data structure validation

### 2. API Tests (`src/__tests__/api/`)

Test API route handlers and response formats.

**Covered:**
- `/api/health` - Health check responses
- `/api/analyze-cv` - CV analysis response format

### 3. Smoke Tests (`src/__tests__/smoke/`)

Verify that pages and routes can load without crashing.

**Covered:**
- Page component exports
- API route handler exports
- Integration between modules

---

## Critical User Flows (Manual Testing Checklist)

### B2C Flow (Job Seeker)

- [ ] **Upload page loads** - `/upload` renders without errors
- [ ] **Upload Word document** - .docx file processes correctly
- [ ] **Upload PDF** - PDF extraction works
- [ ] **Paste CV text** - Text input mode works
- [ ] **View analysis results** - Score, strengths, improvements display
- [ ] **SA context appears** - SA-specific feedback is shown
- [ ] **Error states** - Graceful handling of invalid files

### B2B Flow (Employer)

- [ ] **Dashboard loads** - `/` renders the dashboard
- [ ] **Create role** - New job role can be created
- [ ] **Connect email** - IMAP credentials work
- [ ] **Fetch emails** - CVs are fetched from inbox
- [ ] **View candidates** - Candidate cards display correctly
- [ ] **Candidate modal** - Detailed view opens
- [ ] **Send feedback** - Feedback email sends

### Authentication Flow

- [ ] **Login page loads** - `/login` renders
- [ ] **Signup page loads** - `/signup` renders
- [ ] **Login works** - Credentials authenticate
- [ ] **Logout works** - Session ends
- [ ] **Password reset** - Reset flow works

### API Health

- [ ] **Health endpoint** - `GET /api/health` returns 200
- [ ] **Database check** - Supabase connectivity verified
- [ ] **OpenAI check** - API key validation

---

## Environment Variables for Testing

The test setup (`src/__tests__/setup.ts`) automatically sets mock environment variables:

```typescript
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.OPENAI_API_KEY = 'test-openai-key';
process.env.NODE_ENV = 'test';
```

For integration tests with real services, create a `.env.test.local` file (not committed).

---

## Writing New Tests

### Unit Test Template

```typescript
import { describe, it, expect, vi } from 'vitest';

describe('ModuleName', () => {
  describe('functionName', () => {
    it('should do something when given valid input', () => {
      // Arrange
      const input = 'test';

      // Act
      const result = functionName(input);

      // Assert
      expect(result).toBe('expected');
    });

    it('should throw when given invalid input', () => {
      expect(() => functionName(null)).toThrow();
    });
  });
});
```

### API Test Template

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/endpoint/route';

// Mock external dependencies
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
  })),
}));

describe('/api/endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return expected response', async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toBeDefined();
  });
});
```

---

## Mocking Guidelines

### Supabase

```typescript
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      })),
    })),
  })),
}));
```

### OpenAI

```typescript
vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [{ message: { content: '{}' } }]
        })
      }
    }
  }))
}));
```

### Next.js Navigation

```typescript
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));
```

---

## Pre-Deployment Checklist

Before deploying to production, verify:

1. [ ] All tests pass: `npm test`
2. [ ] No TypeScript errors: `npm run build`
3. [ ] Health endpoint works: `curl http://localhost:3000/api/health`
4. [ ] Critical B2C flow works manually
5. [ ] Critical B2B flow works manually
6. [ ] Environment variables are set in Vercel

---

## Coverage Goals

| Category | Current | Target |
|----------|---------|--------|
| lib/ utilities | 80% | 90% |
| API routes | 60% | 70% |
| Components | 20% | 50% |
| Overall | 40% | 60% |

Run coverage report:
```bash
npm run test:coverage
```

---

## Troubleshooting

### "Module not found" errors
Ensure `@` alias is configured in `vitest.config.ts`:
```typescript
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
  },
},
```

### Environment variable issues
Check that `src/__tests__/setup.ts` is listed in `setupFiles` in `vitest.config.ts`.

### Mock not working
Ensure mocks are defined at the top level of the file, before imports that use them.

---

## Future Testing Improvements

1. **E2E Tests** - Add Playwright for full browser testing
2. **Component Tests** - Add React Testing Library for component testing
3. **Performance Tests** - Add Lighthouse CI for performance monitoring
4. **Visual Regression** - Add Percy or Chromatic for visual testing
5. **API Contract Tests** - Add tests to verify API response schemas

---

*Last updated: December 2024*
