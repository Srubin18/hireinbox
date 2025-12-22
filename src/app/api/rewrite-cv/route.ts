// app/api/rewrite-cv/route.ts
// AI-Powered CV Rewriting - Takes analysis and generates improved CV

import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { SA_CONTEXT_PROMPT } from '@/lib/sa-context';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const CV_REWRITER_PROMPT = `You are HireInbox's CV Rewriting Expert — a master at transforming CVs into powerful, compelling documents that get interviews.

You will receive:
1. The original CV text
2. An analysis with specific improvements to make

Your job is to REWRITE the CV incorporating ALL the suggested improvements while:
- Keeping the same factual information (don't invent experience)
- Making it more impactful and professional
- Using strong action verbs
- Quantifying achievements where possible
- Fixing formatting and structure issues
- Making it ATS-friendly (applicant tracking systems)

=============================
REWRITING PRINCIPLES
=============================

1. STRONG OPENING
   - Start with a powerful professional summary
   - 2-3 sentences that capture their value proposition
   - Include years of experience and key strengths

2. ACHIEVEMENT-FOCUSED
   - Transform job duties into achievements
   - Use format: "Achieved X by doing Y, resulting in Z"
   - Add metrics wherever possible (%, R amounts, team sizes)

3. ACTION VERBS
   - Start each bullet with: Led, Managed, Delivered, Increased, Reduced, Built, etc.
   - Avoid passive language: "Was responsible for" → "Managed"

4. CLEAN STRUCTURE
   - Contact info at top
   - Professional Summary
   - Work Experience (most recent first)
   - Education
   - Skills (if relevant)

5. SA-SPECIFIC
   - Properly format SA qualifications (CA(SA), Pr.Eng, etc.)
   - Use R for currency, not $
   - Format dates as Month Year

=============================
OUTPUT FORMAT
=============================

Return the rewritten CV as clean, formatted text that can be directly used. Use proper spacing and structure.

Do NOT include any commentary or explanations — just the rewritten CV content.

${SA_CONTEXT_PROMPT}`;

export async function POST(request: Request) {
  const traceId = Date.now().toString(36);
  console.log(`[${traceId}][REWRITE] CV rewrite request received`);

  try {
    const { originalCV, analysis, format } = await request.json();

    if (!originalCV || !analysis) {
      return NextResponse.json({ error: 'Missing CV or analysis data' }, { status: 400 });
    }

    console.log(`[${traceId}][REWRITE] Original CV: ${originalCV.length} chars`);

    // Build the improvements list
    const improvements = analysis.improvements?.map((imp: { area: string; suggestion: string }) =>
      `- ${imp.area}: ${imp.suggestion}`
    ).join('\n') || '';

    const quickWins = analysis.quick_wins?.join('\n- ') || '';

    const userPrompt = `Please rewrite this CV, incorporating all the improvements below.

=============================
ORIGINAL CV
=============================
${originalCV}

=============================
IMPROVEMENTS TO MAKE
=============================
${improvements}

Quick Wins:
- ${quickWins}

=============================
ADDITIONAL CONTEXT
=============================
Candidate: ${analysis.candidate_name || 'Unknown'}
Target Roles: ${analysis.career_insights?.natural_fit_roles?.join(', ') || 'General'}
Current Score: ${analysis.overall_score}/100

Please rewrite the CV to be significantly stronger, more impactful, and professional. The goal is to take them from a ${analysis.overall_score} to a 90+ score.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.4,
      max_tokens: 4000,
      messages: [
        { role: 'system', content: CV_REWRITER_PROMPT },
        { role: 'user', content: userPrompt }
      ],
    });

    const rewrittenCV = completion.choices[0]?.message?.content || '';
    console.log(`[${traceId}][REWRITE] Generated ${rewrittenCV.length} chars`);

    // Return based on format requested
    if (format === 'txt') {
      return new NextResponse(rewrittenCV, {
        headers: {
          'Content-Type': 'text/plain',
          'Content-Disposition': `attachment; filename="${analysis.candidate_name || 'CV'}_Improved.txt"`
        }
      });
    }

    // Default: return JSON with the rewritten content
    return NextResponse.json({
      success: true,
      rewrittenCV,
      originalLength: originalCV.length,
      improvedLength: rewrittenCV.length
    });

  } catch (error) {
    console.error(`[${traceId}][REWRITE] Error:`, error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Rewrite failed'
    }, { status: 500 });
  }
}
