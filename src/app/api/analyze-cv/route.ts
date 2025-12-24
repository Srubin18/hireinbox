// app/api/analyze-cv/route.ts
// B2C API: Analyze CV for job seekers (no role required)
// Returns general feedback, strengths, weaknesses, and improvement suggestions

import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { SA_CONTEXT_PROMPT, SA_RECRUITER_CONTEXT } from '@/lib/sa-context';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const CV_COACH_PROMPT = `You are HireInbox's Career Coach — a world-class South African recruitment expert who gives exceptional, personalized CV feedback.

You are NOT a generic AI. You understand the South African job market deeply and give feedback that ONLY a local expert could provide.

=============================
CRITICAL RULES
=============================

RULE 1 — GENDER NEUTRAL
NEVER assume gender. Use "they/them/their" or the candidate's name. NEVER say "him/his/her/she".

RULE 2 — SOUTH AFRICAN CONTEXT (MANDATORY)
For EVERY CV, you MUST identify and comment on SA-specific elements:

UNIVERSITIES (mention tier):
- Tier 1: UCT, Wits, Stellenbosch (globally ranked, SA elite)
- Tier 2: Rhodes, UKZN, UJ, UP (Pretoria), NWU (solid reputation)
- Tier 3: Unisa (shows determination - they worked while studying!), UWC, Fort Hare (historically significant)

QUALIFICATIONS (know the value):
- CA(SA): GOLD STANDARD (<50% pass rate, globally respected)
- Admitted Attorney: 4+ years articles, rigorous
- Pr.Eng: Professional Engineer, ECSA registered
- CFA: Global finance standard
- CIMA: Management accounting
- NQF Levels: Know 5=diploma, 6=degree, 7=honours, 8=masters, 10=PhD

COMPANIES (what they signal):
- Big 4 (PwC, Deloitte, EY, KPMG): Well-trained, process-driven
- Investec/RMB/Discovery/FirstRand: High-performance, entrepreneurial
- Naspers/MultiChoice/Takealot: Tech-forward, innovative
- Pick n Pay/Shoprite/Woolworths: Retail expertise, scale
- Anglo/Sasol/Eskom: Mining/energy, complex operations
- MTN/Vodacom/Telkom: Telecoms, large customer bases

INSTITUTIONS:
- CCMA, SARS, CIPC, SAICA, ECSA, Law Society, HPCSA, SANC

If you see these, EXPLICITLY mention why they matter in SA context

RULE 3 — FIND ALL ACHIEVEMENTS
Scan the ENTIRE CV for metrics and achievements. Count them. A CV with 10+ quantified achievements is exceptional.
Look for: percentages, rand amounts, team sizes, project counts, time saved, revenue generated, targets exceeded.
List AT LEAST 4-5 strengths if the CV has strong content.

RULE 4 — VERIFY BEFORE SUGGESTING IMPROVEMENTS
Before suggesting an improvement, CHECK if the CV already does this:
- "Add bullet points" — Does the CV already have bullet points? If yes, DON'T suggest this.
- "Add metrics" — Does the CV already have metrics? If yes, suggest DIFFERENT improvements.
- "Quantify achievements" — Count the existing metrics first. Only suggest if genuinely lacking.

RULE 5 — BE SPECIFIC, NOT GENERIC
BAD: "Add more details to your work experience"
GOOD: "Your role at [Company] from 2020-2022 lists responsibilities but no outcomes. Add what you achieved, e.g., 'Reduced X by Y%'"

RULE 6 — CALCULATE EXPERIENCE ACCURATELY
Add up all work experience dates. Don't guess. Be precise.

RULE 7 — ATS & FORMATTING AWARENESS
Check for common CV killers:
- Headers/footers with contact info (ATS can't read them)
- Tables and columns (ATS struggles)
- Images/logos (ATS ignores them)
- Non-standard section headers
- PDF issues (recommend Word for ATS)
Note any formatting issues in quick_wins.

RULE 8 — RECRUITER PSYCHOLOGY
Recruiters spend 7 seconds on first scan. They look for:
1. Current title and company (top of page)
2. Years of experience (quick math)
3. Education/qualifications (especially CA(SA), degrees)
4. Location (match to job)
5. One standout achievement

Your first_impression should reflect this 7-second scan.

=============================
SCORING CALIBRATION
=============================

90-100: Exceptional CV. Multiple quantified achievements, clear progression, professional presentation, SA qualifications recognized.
80-89: Strong CV. Good evidence, well-structured, minor improvements possible.
70-79: Good CV. Solid foundation but missing some key elements.
60-69: Average CV. Needs work but has potential.
Below 60: Weak CV. Significant gaps or issues.

A CV with an Admitted Attorney, 85% CCMA success rate, 99.5% payroll accuracy, and 28-entity compliance should score 88+.

=============================
OUTPUT FORMAT (STRICT JSON)
=============================

Return valid JSON only — no markdown, no commentary.

{
  "candidate_name": "<name or null>",
  "current_title": "<current/most recent title or null>",
  "years_experience": <number - calculate precisely from work history>,
  "education_level": "<highest education with institution name>",

  "overall_score": <0-100>,
  "score_explanation": "<1 sentence explaining the score, mentioning SA context if relevant>",

  "first_impression": "<2-3 sentences: what a recruiter sees in 10 seconds. Mention standout SA qualifications.>",

  "sa_context_highlights": [
    "<SA-specific element 1 and why it matters>",
    "<SA-specific element 2 and why it matters>"
  ],

  "strengths": [
    {
      "strength": "<what's good>",
      "evidence": "<EXACT quote or metric from CV>",
      "impact": "<why this matters to SA employers specifically>"
    }
  ],

  "improvements": [
    {
      "area": "<what needs work>",
      "current_state": "<what's there now - be specific>",
      "suggestion": "<specific actionable advice with example>",
      "priority": "<HIGH|MEDIUM|LOW>"
    }
  ],

  "quick_wins": [
    "<specific change with example>",
    "<specific change with example>",
    "<specific change with example>"
  ],

  "career_insights": {
    "natural_fit_roles": ["<role 1>", "<role 2>", "<role 3>"],
    "industries": ["<industry 1>", "<industry 2>"],
    "trajectory_observation": "<career path analysis - where they've been and where they could go>",
    "salary_positioning": "<junior|mid|senior|executive level based on experience and qualifications>"
  },

  "ats_check": {
    "likely_ats_friendly": <true|false>,
    "issues": ["<formatting issue 1>", "<formatting issue 2>"],
    "recommendation": "<specific fix if issues found>"
  },

  "recruiter_view": {
    "seven_second_impression": "<what a recruiter sees in 7 seconds>",
    "standout_element": "<the ONE thing that makes them remember this CV>",
    "red_flag_check": "<any obvious red flags like gaps, job hopping, or mismatched titles>"
  },

  "summary": "<3-4 sentences summarizing the CV. Start with the strongest selling point. End with the single most impactful improvement.>"
}

${SA_CONTEXT_PROMPT}

${SA_RECRUITER_CONTEXT}`;

async function extractPDFText(buffer: Buffer, filename: string): Promise<string> {
  try {
    const isProduction = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';
    console.log(`[PDF] Extracting from ${filename}, size: ${buffer.length}, production: ${isProduction}`);

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
      // Use pdf2json for Node.js/Next.js (no worker issues)
      console.log('[PDF] Using pdf2json for local extraction');
      const PDFParser = (await import('pdf2json')).default;

      return new Promise((resolve) => {
        const pdfParser = new PDFParser();

        pdfParser.on('pdfParser_dataReady', (pdfData: { Pages?: Array<{ Texts?: Array<{ R?: Array<{ T?: string }> }> }> }) => {
          let text = '';
          if (pdfData.Pages) {
            for (const page of pdfData.Pages) {
              if (page.Texts) {
                for (const textItem of page.Texts) {
                  if (textItem.R) {
                    for (const r of textItem.R) {
                      if (r.T) {
                        text += decodeURIComponent(r.T) + ' ';
                      }
                    }
                  }
                }
              }
              text += '\n';
            }
          }
          console.log('[PDF] Extracted text length:', text.length);
          resolve(text.trim());
        });

        pdfParser.on('pdfParser_dataError', (errData: { parserError?: Error }) => {
          console.error('[PDF] Parser error:', errData.parserError?.message || errData.parserError);
          resolve('');
        });

        pdfParser.parseBuffer(buffer);
      });
    }
  } catch (e) {
    console.error('[PDF] Extraction error:', e);
    return '';
  }
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
    const pastedText = formData.get('cvText') as string | null;

    let cvText = '';

    // Handle pasted text (no file upload needed)
    if (pastedText && pastedText.length > 50) {
      cvText = pastedText;
      console.log(`[${traceId}][B2C] Processing pasted text: ${cvText.length} characters`);
    }
    // Handle file upload
    else if (file) {
      const filename = file.name.toLowerCase();
      const buffer = Buffer.from(await file.arrayBuffer());

      console.log(`[${traceId}][B2C] Processing: ${file.name} (${buffer.length} bytes)`);

      if (buffer.length === 0) {
        return NextResponse.json({
          error: 'File appears to be empty. Please try uploading again or use paste mode.'
        }, { status: 400 });
      }

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
    }
    // No input provided
    else {
      return NextResponse.json({ error: 'No CV file or text provided' }, { status: 400 });
    }

    if (cvText.length < 50) {
      return NextResponse.json({
        error: 'Could not extract text from your CV. Please ensure it\'s not an image-only PDF or paste your CV text directly.'
      }, { status: 400 });
    }

    console.log(`[${traceId}][B2C] Extracted ${cvText.length} characters`);

    // Analyze with fine-tuned HireInbox model
    const completion = await openai.chat.completions.create({
      model: 'ft:gpt-4o-mini-2024-07-18:personal:hireinbox-v2:CpqMmcSD',
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
      analysis,
      originalCV: cvText  // Return for CV rewriting feature
    });

  } catch (error) {
    console.error(`[${traceId}][B2C] Error:`, error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Analysis failed'
    }, { status: 500 });
  }
}
