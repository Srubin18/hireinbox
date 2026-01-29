// ============================================
// TALENT POOL BROWSE API
// Query candidates from the talent pool
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { Errors, generateTraceId } from '@/lib/api-error';

// Demo data for when talent pool is empty
const DEMO_CANDIDATES = [
  {
    id: 'demo-1',
    name: 'T. Mokoena',
    currentRole: 'Senior Accountant',
    yearsExperience: 8,
    location: 'Johannesburg',
    skills: ['Financial Reporting', 'IFRS', 'SAP', 'Excel Advanced', 'Audit'],
    matchScore: 92,
    confidence: 'high' as const,
    matchReasons: [
      { reason: 'CA(SA) qualified with Big 4 experience', source: 'cv' as const, evidence: 'Completed articles at Deloitte' },
      { reason: 'Strong communication skills demonstrated', source: 'video' as const, evidence: 'Video pitch rated 4.5/5' },
      { reason: 'Leadership potential identified', source: 'interview' as const, evidence: 'AI interview highlighted team management' }
    ],
    intent: 'actively_looking' as const,
    workArrangement: 'hybrid' as const,
    salaryMin: 65000,
    salaryMax: 85000,
    hasVideo: true,
    hasInterview: true,
    profileCompleteness: 95,
    highlights: ['CA(SA) qualified', 'Big 4 trained', '3 years management experience']
  },
  {
    id: 'demo-2',
    name: 'S. Naidoo',
    currentRole: 'Software Developer',
    yearsExperience: 5,
    location: 'Cape Town',
    skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'AWS'],
    matchScore: 88,
    confidence: 'high' as const,
    matchReasons: [
      { reason: '5 years full-stack experience', source: 'cv' as const, evidence: 'Worked at 2 tech startups' },
      { reason: 'Clear technical communication', source: 'video' as const, evidence: 'Explained complex concepts simply' }
    ],
    intent: 'open' as const,
    workArrangement: 'remote' as const,
    salaryMin: 55000,
    salaryMax: 75000,
    hasVideo: true,
    hasInterview: false,
    profileCompleteness: 85,
    highlights: ['Full-stack developer', 'Startup experience', 'Open source contributor']
  },
  {
    id: 'demo-3',
    name: 'L. van der Merwe',
    currentRole: 'Marketing Manager',
    yearsExperience: 6,
    location: 'Durban',
    skills: ['Digital Marketing', 'SEO', 'Content Strategy', 'Google Ads', 'Analytics'],
    matchScore: 78,
    confidence: 'medium' as const,
    matchReasons: [
      { reason: '6 years in digital marketing', source: 'cv' as const, evidence: 'Led campaigns for FMCG brands' },
      { reason: 'Results-driven approach', source: 'cv' as const, evidence: 'Grew organic traffic 300% in 18 months' }
    ],
    intent: 'actively_looking' as const,
    workArrangement: 'flexible' as const,
    salaryMin: 45000,
    salaryMax: 60000,
    hasVideo: false,
    hasInterview: true,
    profileCompleteness: 75,
    highlights: ['FMCG experience', 'Team of 5', 'Google certified']
  },
  {
    id: 'demo-4',
    name: 'K. Dlamini',
    currentRole: 'HR Business Partner',
    yearsExperience: 7,
    location: 'Pretoria',
    skills: ['Talent Acquisition', 'Employee Relations', 'HRIS', 'Labour Law', 'Training'],
    matchScore: 85,
    confidence: 'medium' as const,
    matchReasons: [
      { reason: '7 years HR experience across industries', source: 'cv' as const, evidence: 'Manufacturing and retail sectors' },
      { reason: 'Strong stakeholder management', source: 'interview' as const, evidence: 'AI noted collaborative approach' }
    ],
    intent: 'open' as const,
    workArrangement: 'hybrid' as const,
    salaryMin: 50000,
    salaryMax: 65000,
    hasVideo: true,
    hasInterview: true,
    profileCompleteness: 90,
    highlights: ['SABPP registered', 'Change management certified', 'Multi-industry experience']
  },
  {
    id: 'demo-5',
    name: 'M. Patel',
    currentRole: 'Operations Coordinator',
    yearsExperience: 3,
    location: 'Johannesburg',
    skills: ['Project Coordination', 'Supply Chain', 'Excel', 'SAP', 'Process Improvement'],
    matchScore: 72,
    confidence: 'medium' as const,
    matchReasons: [
      { reason: '3 years operations experience', source: 'cv' as const, evidence: 'Logistics and warehousing background' }
    ],
    intent: 'actively_looking' as const,
    workArrangement: 'office' as const,
    salaryMin: 25000,
    salaryMax: 35000,
    hasVideo: false,
    hasInterview: false,
    profileCompleteness: 60,
    highlights: ['SAP proficient', 'Lean Six Sigma Yellow Belt']
  }
];

export async function GET(request: NextRequest) {
  // Apply rate limiting
  const rateLimited = withRateLimit(request, 'talent-pool-browse', RATE_LIMITS.standard);
  if (rateLimited) return rateLimited;

  const traceId = generateTraceId();

  try {
    const { searchParams } = new URL(request.url);
    const skill = searchParams.get('skill');
    const location = searchParams.get('location');
    const intent = searchParams.get('intent');
    const minExperience = searchParams.get('min_experience');
    const remoteOnly = searchParams.get('remote_only') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const supabase = getSupabaseServiceClient();

    // Build query
    let query = supabase
      .from('talent_pool_candidates')
      .select('*')
      .neq('visibility_level', 'hidden')
      .order('created_at', { ascending: false });

    // Filter by intent
    if (intent && intent !== 'all') {
      query = query.eq('intent', intent);
    }

    // Filter by location
    if (location) {
      query = query.ilike('location', `%${location}%`);
    }

    // Filter by remote preference
    if (remoteOnly) {
      query = query.eq('open_to_remote', true);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error(`[${traceId}][TalentPool Browse] Query error:`, error);
      // Return demo data if database query fails
      const allSkills = [...new Set(DEMO_CANDIDATES.flatMap(c => c.skills))].sort();
      return NextResponse.json({
        success: true,
        candidates: DEMO_CANDIDATES,
        count: DEMO_CANDIDATES.length,
        allSkills: allSkills,
        isDemo: true
      });
    }

    // If no real candidates, return demo data
    if (!data || data.length === 0) {
      const allSkills = [...new Set(DEMO_CANDIDATES.flatMap(c => c.skills))].sort();
      return NextResponse.json({
        success: true,
        candidates: DEMO_CANDIDATES,
        count: DEMO_CANDIDATES.length,
        allSkills: allSkills,
        isDemo: true
      });
    }

    // Transform data for the frontend
    const candidates = (data || []).map(candidate => {
      // Calculate match score based on profile completeness for now
      // In future, this would be based on job requirements matching
      const baseScore = candidate.profile_completeness || 50;
      const videoBonus = candidate.has_video ? 10 : 0;
      const interviewBonus = candidate.has_ai_interview ? 10 : 0;
      const matchScore = Math.min(baseScore + videoBonus + interviewBonus, 100);

      // Determine confidence level
      let confidence: 'high' | 'medium' | 'low' = 'low';
      if (candidate.has_video && candidate.has_ai_interview) {
        confidence = 'high';
      } else if (candidate.has_video || candidate.has_ai_interview || candidate.profile_completeness >= 70) {
        confidence = 'medium';
      }

      // Build match reasons from available data
      const matchReasons: { reason: string; source: string; evidence: string }[] = [];

      if (candidate.years_experience) {
        matchReasons.push({
          reason: `${candidate.years_experience} years experience`,
          source: 'cv',
          evidence: 'Profile information'
        });
      }

      if (candidate.job_title) {
        matchReasons.push({
          reason: `Current/target role: ${candidate.job_title}`,
          source: 'cv',
          evidence: 'Profile information'
        });
      }

      if (candidate.location) {
        matchReasons.push({
          reason: `Located in ${candidate.location}`,
          source: 'cv',
          evidence: 'Profile information'
        });
      }

      // Parse skills if available
      let skills: string[] = [];
      if (candidate.skills && Array.isArray(candidate.skills)) {
        skills = candidate.skills;
      }

      // Parse experience highlights
      let highlights: string[] = [];
      if (candidate.experience_highlights && Array.isArray(candidate.experience_highlights)) {
        highlights = candidate.experience_highlights;
      }

      // Determine work arrangement
      let workArrangement: 'remote' | 'hybrid' | 'office' | 'flexible' = 'flexible';
      if (candidate.open_to_remote) {
        workArrangement = 'remote';
      }

      return {
        id: candidate.id,
        name: candidate.visibility_level === 'anonymized'
          ? `${candidate.full_name.split(' ')[0][0]}. ${candidate.full_name.split(' ').slice(-1)[0][0]}.`
          : candidate.full_name,
        currentRole: candidate.job_title || 'Not specified',
        yearsExperience: parseYearsExperience(candidate.years_experience),
        location: candidate.location || 'Not specified',
        skills: skills,
        matchScore: matchScore,
        confidence: confidence,
        matchReasons: matchReasons,
        intent: candidate.intent as 'actively_looking' | 'open' | 'not_looking',
        workArrangement: workArrangement,
        salaryMin: parseSalary(candidate.salary_expectation, 'min'),
        salaryMax: parseSalary(candidate.salary_expectation, 'max'),
        hasVideo: candidate.has_video || false,
        hasInterview: candidate.has_ai_interview || false,
        profileCompleteness: candidate.profile_completeness || 20,
        highlights: highlights
      };
    });

    // Get all unique skills for filtering
    const allSkills = [...new Set(candidates.flatMap(c => c.skills))].sort();

    return NextResponse.json({
      success: true,
      candidates: candidates,
      count: candidates.length,
      allSkills: allSkills
    });

  } catch (error) {
    console.error(`[${traceId}][TalentPool Browse] Error:`, error);
    // Return demo data on any error
    const allSkills = [...new Set(DEMO_CANDIDATES.flatMap(c => c.skills))].sort();
    return NextResponse.json({
      success: true,
      candidates: DEMO_CANDIDATES,
      count: DEMO_CANDIDATES.length,
      allSkills: allSkills,
      isDemo: true
    });
  }
}

// Helper to parse years experience string to number
function parseYearsExperience(yearsStr: string | null): number {
  if (!yearsStr) return 0;

  const mapping: Record<string, number> = {
    '0-1': 1,
    '2-5': 3,
    '5-10': 7,
    '10+': 12
  };

  return mapping[yearsStr] || 0;
}

// Helper to parse salary string to numbers
function parseSalary(salaryStr: string | null, type: 'min' | 'max'): number | undefined {
  if (!salaryStr) return undefined;

  // Try to extract numbers from the string
  const numbers = salaryStr.match(/\d+/g);
  if (!numbers || numbers.length === 0) return undefined;

  if (numbers.length === 1) {
    // Single number - use for both min and max
    return parseInt(numbers[0]);
  }

  // Multiple numbers - first is min, second is max
  return type === 'min' ? parseInt(numbers[0]) : parseInt(numbers[1]);
}
