// Tests for src/lib/sa-context.ts
// Validates South African context data is correctly structured

import { describe, it, expect } from 'vitest';
import {
  SA_CONTEXT_PROMPT,
  SA_UNIVERSITIES,
  SA_QUALIFICATIONS,
  SA_COMPANIES,
  SA_CITIES,
  SA_SALARY_RANGES,
  SA_CONTEXT_B2C,
  SA_CREATOR_CONTEXT,
  SA_RECRUITER_CONTEXT,
} from '@/lib/sa-context';

describe('SA_CONTEXT_PROMPT', () => {
  it('should be a non-empty string', () => {
    expect(typeof SA_CONTEXT_PROMPT).toBe('string');
    expect(SA_CONTEXT_PROMPT.length).toBeGreaterThan(100);
  });

  it('should mention key SA universities', () => {
    expect(SA_CONTEXT_PROMPT).toContain('UCT');
    expect(SA_CONTEXT_PROMPT).toContain('Wits');
    expect(SA_CONTEXT_PROMPT).toContain('Stellenbosch');
  });

  it('should mention CA(SA) qualification', () => {
    expect(SA_CONTEXT_PROMPT).toContain('CA(SA)');
  });

  it('should mention Big 4 accounting firms', () => {
    expect(SA_CONTEXT_PROMPT).toContain('PwC');
    expect(SA_CONTEXT_PROMPT).toContain('Deloitte');
    expect(SA_CONTEXT_PROMPT).toContain('KPMG');
  });
});

describe('SA_UNIVERSITIES', () => {
  it('should have tier1 universities', () => {
    expect(SA_UNIVERSITIES.tier1).toBeInstanceOf(Array);
    expect(SA_UNIVERSITIES.tier1.length).toBeGreaterThan(0);
    expect(SA_UNIVERSITIES.tier1).toContain('UCT');
    expect(SA_UNIVERSITIES.tier1).toContain('Wits');
  });

  it('should have tier2 universities', () => {
    expect(SA_UNIVERSITIES.tier2).toBeInstanceOf(Array);
    expect(SA_UNIVERSITIES.tier2).toContain('Rhodes');
  });

  it('should have distance learning options', () => {
    expect(SA_UNIVERSITIES.distance).toBeInstanceOf(Array);
    expect(SA_UNIVERSITIES.distance).toContain('Unisa');
  });

  it('should have MBA programs', () => {
    expect(SA_UNIVERSITIES.mba).toBeInstanceOf(Array);
    expect(SA_UNIVERSITIES.mba).toContain('GIBS');
  });
});

describe('SA_QUALIFICATIONS', () => {
  describe('accounting', () => {
    it('should have CA(SA) as tier 1', () => {
      expect(SA_QUALIFICATIONS.accounting['CA(SA)']).toBeDefined();
      expect(SA_QUALIFICATIONS.accounting['CA(SA)'].tier).toBe(1);
    });

    it('should have description for each qualification', () => {
      Object.values(SA_QUALIFICATIONS.accounting).forEach(qual => {
        expect(qual.description).toBeDefined();
        expect(qual.description.length).toBeGreaterThan(0);
      });
    });
  });

  describe('engineering', () => {
    it('should have Pr.Eng as tier 1', () => {
      expect(SA_QUALIFICATIONS.engineering['Pr.Eng']).toBeDefined();
      expect(SA_QUALIFICATIONS.engineering['Pr.Eng'].tier).toBe(1);
    });
  });

  describe('actuarial', () => {
    it('should have FASSA as tier 1', () => {
      expect(SA_QUALIFICATIONS.actuarial['FASSA']).toBeDefined();
      expect(SA_QUALIFICATIONS.actuarial['FASSA'].tier).toBe(1);
    });
  });

  describe('legal', () => {
    it('should have Admitted Attorney', () => {
      expect(SA_QUALIFICATIONS.legal['Admitted Attorney']).toBeDefined();
    });
  });
});

describe('SA_COMPANIES', () => {
  it('should have Big 4 accounting firms', () => {
    expect(SA_COMPANIES.big4).toContain('PwC');
    expect(SA_COMPANIES.big4).toContain('Deloitte');
    expect(SA_COMPANIES.big4).toContain('EY');
    expect(SA_COMPANIES.big4).toContain('KPMG');
  });

  it('should have tier 1 banks', () => {
    expect(SA_COMPANIES.banking_tier1).toContain('Investec');
    expect(SA_COMPANIES.banking_tier1).toContain('Standard Bank');
  });

  it('should have major tech companies', () => {
    expect(SA_COMPANIES.tech).toContain('Naspers');
  });

  it('should have insurance companies', () => {
    expect(SA_COMPANIES.insurance).toContain('Discovery');
  });

  it('should have consulting firms', () => {
    expect(SA_COMPANIES.consulting).toContain('McKinsey');
  });
});

describe('SA_CITIES', () => {
  it('should have major cities', () => {
    expect(SA_CITIES.major).toContain('Johannesburg');
    expect(SA_CITIES.major).toContain('Cape Town');
    expect(SA_CITIES.major).toContain('Durban');
  });

  it('should have JHB suburbs', () => {
    expect(SA_CITIES.suburbs_jhb).toContain('Sandton');
  });

  it('should have CPT suburbs', () => {
    expect(SA_CITIES.suburbs_cpt).toContain('Century City');
  });

  it('should have townships', () => {
    expect(SA_CITIES.townships).toContain('Soweto');
    expect(SA_CITIES.townships).toContain('Khayelitsha');
  });
});

describe('SA_SALARY_RANGES', () => {
  it('should have entry level range', () => {
    expect(SA_SALARY_RANGES.entry_level).toBeDefined();
    expect(SA_SALARY_RANGES.entry_level.min).toBeLessThan(SA_SALARY_RANGES.entry_level.max);
  });

  it('should have progressive salary ranges', () => {
    expect(SA_SALARY_RANGES.junior.min).toBeGreaterThan(SA_SALARY_RANGES.entry_level.min);
    expect(SA_SALARY_RANGES.mid_level.min).toBeGreaterThan(SA_SALARY_RANGES.junior.min);
    expect(SA_SALARY_RANGES.senior.min).toBeGreaterThan(SA_SALARY_RANGES.mid_level.min);
  });

  it('should have CA-specific ranges', () => {
    expect(SA_SALARY_RANGES.ca_articles).toBeDefined();
    expect(SA_SALARY_RANGES.ca_qualified).toBeDefined();
    expect(SA_SALARY_RANGES.ca_qualified.min).toBeGreaterThan(SA_SALARY_RANGES.ca_articles.max);
  });

  it('should have label for each range', () => {
    Object.values(SA_SALARY_RANGES).forEach(range => {
      expect(range.label).toBeDefined();
      expect(range.label).toContain('R');
    });
  });
});

describe('SA_CONTEXT_B2C', () => {
  it('should be shorter than full context', () => {
    expect(SA_CONTEXT_B2C.length).toBeLessThan(SA_CONTEXT_PROMPT.length);
  });

  it('should contain essential qualifications', () => {
    expect(SA_CONTEXT_B2C).toContain('CA(SA)');
    expect(SA_CONTEXT_B2C).toContain('Pr.Eng');
  });

  it('should mention tier 1 universities', () => {
    expect(SA_CONTEXT_B2C).toContain('UCT');
    expect(SA_CONTEXT_B2C).toContain('Wits');
  });
});

describe('SA_CREATOR_CONTEXT', () => {
  it('should mention local brands', () => {
    expect(SA_CREATOR_CONTEXT).toContain("Nando's");
    expect(SA_CREATOR_CONTEXT).toContain('Woolworths');
  });

  it('should have pricing information', () => {
    expect(SA_CREATOR_CONTEXT).toContain('R');
  });

  it('should mention platforms', () => {
    expect(SA_CREATOR_CONTEXT).toContain('Instagram');
    expect(SA_CREATOR_CONTEXT).toContain('TikTok');
  });
});

describe('SA_RECRUITER_CONTEXT', () => {
  it('should mention BBBEE', () => {
    expect(SA_RECRUITER_CONTEXT).toContain('BBBEE');
  });

  it('should have salary benchmarks', () => {
    expect(SA_RECRUITER_CONTEXT).toContain('SALARY BENCHMARKS');
    expect(SA_RECRUITER_CONTEXT).toContain('/month');
  });

  it('should have interview questions', () => {
    expect(SA_RECRUITER_CONTEXT).toContain('INTERVIEW QUESTION');
  });
});
