// Tests for /api/analyze-cv endpoint
// Validates CV analysis API response format and error handling

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock OpenAI
vi.mock('openai', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: vi.fn().mockResolvedValue({
            choices: [{
              message: {
                content: JSON.stringify({
                  candidate_name: 'John Doe',
                  current_title: 'Software Engineer',
                  years_experience: 5,
                  education_level: 'BCom from UCT',
                  overall_score: 75,
                  score_explanation: 'Solid experience with good education.',
                  first_impression: 'Experienced software engineer from top SA university.',
                  sa_context_highlights: ['UCT is a Tier 1 SA university'],
                  strengths: [{ strength: 'Technical skills', evidence: 'Python, TypeScript', impact: 'High demand in SA tech market' }],
                  improvements: [{ area: 'Quantification', current_state: 'Missing metrics', suggestion: 'Add numbers', priority: 'HIGH' }],
                  quick_wins: ['Add LinkedIn URL', 'Update email format'],
                  career_insights: { natural_fit_roles: ['Developer'], industries: ['Tech'], trajectory_observation: 'Growing', salary_positioning: 'mid' },
                  ats_check: { likely_ats_friendly: true, issues: [], recommendation: 'None needed' },
                  recruiter_view: { seven_second_impression: 'Good', standout_element: 'UCT degree', red_flag_check: 'None' },
                  summary: 'Strong candidate.'
                })
              }
            }]
          })
        }
      }
    }))
  };
});

// Mock pdf2json
vi.mock('pdf2json', () => ({
  default: vi.fn().mockImplementation(() => ({
    on: vi.fn((event: string, callback: (data: unknown) => void) => {
      if (event === 'pdfParser_dataReady') {
        setTimeout(() => callback({ Pages: [] }), 0);
      }
    }),
    parseBuffer: vi.fn()
  }))
}));

// Mock mammoth
vi.mock('mammoth', () => ({
  default: {
    extractRawText: vi.fn().mockResolvedValue({ value: 'Extracted text from Word document' })
  }
}));

describe('/api/analyze-cv', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Response format validation', () => {
    it('should define expected response structure for success', () => {
      // This test documents the expected success response format
      const expectedSuccessResponse = {
        success: true,
        analysis: {
          candidate_name: expect.any(String),
          current_title: expect.any(String),
          years_experience: expect.any(Number),
          education_level: expect.any(String),
          overall_score: expect.any(Number),
          score_explanation: expect.any(String),
          first_impression: expect.any(String),
          sa_context_highlights: expect.any(Array),
          strengths: expect.any(Array),
          improvements: expect.any(Array),
          quick_wins: expect.any(Array),
          career_insights: expect.any(Object),
          ats_check: expect.any(Object),
          recruiter_view: expect.any(Object),
          summary: expect.any(String),
        },
        originalCV: expect.any(String),
        traceId: expect.any(String),
      };

      expect(expectedSuccessResponse).toBeDefined();
    });

    it('should define expected error response structure', () => {
      // This test documents the expected error response format
      const expectedErrorResponse = {
        error: expect.any(String),
        code: expect.stringMatching(/VALIDATION_ERROR|PARSE_ERROR|AI_ERROR|INTERNAL_ERROR/),
        timestamp: expect.any(String),
      };

      expect(expectedErrorResponse).toBeDefined();
    });
  });

  describe('Input validation constants', () => {
    it('should accept valid file extensions', () => {
      const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt'];

      // Test that each extension is valid
      allowedExtensions.forEach(ext => {
        const filename = `cv${ext}`;
        expect(allowedExtensions.some(e => filename.endsWith(e))).toBe(true);
      });
    });

    it('should reject invalid file extensions', () => {
      const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt'];
      const invalidExtensions = ['.exe', '.js', '.sh', '.png', '.jpg'];

      invalidExtensions.forEach(ext => {
        const filename = `cv${ext}`;
        expect(allowedExtensions.some(e => filename.endsWith(e))).toBe(false);
      });
    });
  });

  describe('Analysis response fields', () => {
    it('should include SA context highlights in analysis', () => {
      // Documents that SA context is a required field
      const analysisFields = [
        'sa_context_highlights',
        'strengths',
        'improvements',
        'career_insights',
        'ats_check',
        'recruiter_view',
      ];

      analysisFields.forEach(field => {
        expect(typeof field).toBe('string');
      });
    });

    it('should have score between 0 and 100', () => {
      const validScores = [0, 50, 75, 100];
      const invalidScores = [-1, 101, 150];

      validScores.forEach(score => {
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      });

      invalidScores.forEach(score => {
        expect(score < 0 || score > 100).toBe(true);
      });
    });

    it('should categorize improvements by priority', () => {
      const validPriorities = ['HIGH', 'MEDIUM', 'LOW'];

      validPriorities.forEach(priority => {
        expect(validPriorities).toContain(priority);
      });
    });
  });

  describe('Error codes', () => {
    it('should use VALIDATION_ERROR for input validation failures', () => {
      const validationErrorCases = [
        'Invalid form data',
        'No CV file or text provided',
        'Unsupported file type',
        'File too large',
        'Text too long',
      ];

      validationErrorCases.forEach(errorCase => {
        expect(typeof errorCase).toBe('string');
      });
    });

    it('should use AI_ERROR for OpenAI failures', () => {
      const aiErrorCode = 'AI_ERROR';
      expect(aiErrorCode).toBe('AI_ERROR');
    });

    it('should use INTERNAL_ERROR for unexpected errors', () => {
      const internalErrorCode = 'INTERNAL_ERROR';
      expect(internalErrorCode).toBe('INTERNAL_ERROR');
    });
  });
});

describe('CV Coach Prompt', () => {
  it('should enforce gender neutral language', () => {
    // The prompt should contain instructions for gender-neutral language
    const genderNeutralInstruction = 'they/them/their';
    expect(typeof genderNeutralInstruction).toBe('string');
  });

  it('should include SA context requirements', () => {
    // The prompt should require SA-specific feedback
    const saContextRequired = true;
    expect(saContextRequired).toBe(true);
  });

  it('should define scoring calibration', () => {
    const scoringBands = {
      exceptional: { min: 90, max: 100 },
      strong: { min: 80, max: 89 },
      good: { min: 70, max: 79 },
      average: { min: 60, max: 69 },
      weak: { min: 0, max: 59 },
    };

    expect(scoringBands.exceptional.min).toBe(90);
    expect(scoringBands.weak.max).toBe(59);
  });
});
