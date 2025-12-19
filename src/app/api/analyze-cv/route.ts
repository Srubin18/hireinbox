// app/api/analyze-cv/route.ts
// B2C API: Analyze CV for job seekers (no role required)
// Returns general feedback, strengths, weaknesses, and improvement suggestions

import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const CV_COACH_PROMPT = `You are HireInbox's Career Coach — an expert at analyzing CVs and helping job seekers present themselves effectively.

Your role is to provide honest, constructive feedback that helps candidates improve their CV and career positioning.

=============================
ANALYSIS FRAMEWORK
=============================

1. OVERALL IMPRESSION (score 0-100)
   - How well-constructed is this CV?
   - Does it effectively communicate value?
   - Would a recruiter want to learn more?

2. STRENGTHS (evidence-required)
   - What stands out positively?
   - Every strength must have a quote or metric from the CV
   - No generic praise without evidence

3. AREAS FOR IMPROVEMENT
   - What's missing or unclear?
   - What would make this CV stronger?
   - Be specific and actionable

4. QUICK WINS
   - 3-5 specific changes that would immediately improve the CV
   - Focus on high-impact, easy-to-implement suggestions

5. CAREER INSIGHTS
   - What roles seem like a natural fit?
   - What industries might value this background?
   - Career trajectory observations

=============================
TONE GUIDELINES
=============================

- Be encouraging but honest
- Focus on improvement, not criticism
- Provide specific, actionable advice
- Recognize effort while being truthful about gaps
- Never be condescending or dismissive

=============================
OUTPUT FORMAT (STRICT JSON)
=============================

Return valid JSON only — no markdown, no commentary.

{
  "candidate_name": "<name or null>",
  "current_title": "<current/most recent title or null>",
  "years_experience": <number or null>,
  "education_level": "<highest education or null>",

  "overall_score": <0-100>,
  "score_explanation": "<1 sentence explaining the score>",

  "first_impression": "<2-3 sentences: what a recruiter sees in the first 10 seconds>",

  "strengths": [
    {
      "strength": "<what's good>",
      "evidence": "<quote or metric from CV>",
      "impact": "<why this matters to employers>"
    }
  ],

  "improvements": [
    {
      "area": "<what needs work>",
      "current_state": "<what's there now or 'missing'>",
      "suggestion": "<specific actionable advice>",
      "priority": "<HIGH|MEDIUM|LOW>"
    }
  ],

  "quick_wins": [
    "<specific change 1>",
    "<specific change 2>",
    "<specific change 3>"
  ],

  "career_insights": {
    "natural_fit_roles": ["<role 1>", "<role 2>", "<role 3>"],
    "industries": ["<industry 1>", "<industry 2>"],
    "trajectory_observation": "<1-2 sentences about career path>"
  },

  "summary": "<3-4 sentences summarizing the CV and key recommendations>"
}`;

async function extractPDFText(buffer: Buffer, filename: string): Promise<string> {
  try {
    const isProduction = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';

    if (isProduction && process.env.CONVERTAPI_SECRET) {
      const base64PDF = buffer.toString('base64');
      const response = await fetch(`https://v2.convertapi.com/convert/pdf/to/txt?Secret=${process.env.CONVERTAPI_SECRET}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Parameters: [
            { Name: 'File', FileValue: { Name: filename, Data: base64PDF } },
            { Name: 'StoreFile', Value: true }
          ]
        }),
      });
      if (!response.ok) return '';
      const result = await response.json();
      if (!result.Files?.[0]?.Url) return '';
      const textResponse = await fetch(result.Files[0].Url);
      return await textResponse.text();
    } else {
      const pdfParse = (await import('pdf-parse')).default;
      const data = await pdfParse(buffer);
      return data.text || '';
    }
  } catch { return ''; }
}

async function extractWordText(buffer: Buffer): Promise<string> {
  try {
    const mammoth = (await import('mammoth')).default;
    const result = await mammoth.extractRawText({ buffer });
    return result.value || '';
  } catch { return ''; }
}

export async function POST(request: Request) {
  const traceId = Date.now().toString(36);
  console.log(`[${traceId}][B2C] CV Analysis request received`);

  try {
    const formData = await request.formData();
    const file = formData.get('cv') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No CV file provided' }, { status: 400 });
    }

    const filename = file.name.toLowerCase();
    const buffer = Buffer.from(await file.arrayBuffer());

    console.log(`[${traceId}][B2C] Processing: ${file.name} (${buffer.length} bytes)`);

    let cvText = '';

    if (filename.endsWith('.pdf')) {
      cvText = await extractPDFText(buffer, file.name);
    } else if (filename.endsWith('.doc') || filename.endsWith('.docx')) {
      cvText = await extractWordText(buffer);
    } else if (filename.endsWith('.txt')) {
      cvText = buffer.toString('utf-8');
    } else {
      return NextResponse.json({
        error: 'Unsupported file type. Please upload a PDF, Word document, or text file.'
      }, { status: 400 });
    }

    if (cvText.length < 50) {
      return NextResponse.json({
        error: 'Could not extract text from your CV. Please ensure it\'s not an image-only PDF.'
      }, { status: 400 });
    }

    console.log(`[${traceId}][B2C] Extracted ${cvText.length} characters`);

    // Analyze with GPT-4o
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.3,
      max_tokens: 3000,
      messages: [
        { role: 'system', content: CV_COACH_PROMPT },
        { role: 'user', content: `Please analyze this CV and provide detailed feedback:\n\n${cvText}` }
      ],
    });

    const responseText = completion.choices[0]?.message?.content || '';
    console.log(`[${traceId}][B2C] AI response length: ${responseText.length}`);

    // Parse JSON response
    const cleaned = responseText.replace(/```json\s*/gi, '').replace(/```/g, '').trim();
    let analysis;

    try {
      analysis = JSON.parse(cleaned);
    } catch {
      console.error(`[${traceId}][B2C] JSON parse failed`);
      return NextResponse.json({
        error: 'Analysis failed. Please try again.'
      }, { status: 500 });
    }

    console.log(`[${traceId}][B2C] Analysis complete for: ${analysis.candidate_name}`);

    return NextResponse.json({
      success: true,
      analysis
    });

  } catch (error) {
    console.error(`[${traceId}][B2C] Error:`, error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Analysis failed'
    }, { status: 500 });
  }
}
