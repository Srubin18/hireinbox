// app/api/analyze-cv/route.ts
// B2C API: Analyze CV for job seekers (no role required)
// Returns general feedback, strengths, weaknesses, and improvement suggestions
//
// RATE LIMITING: Should be rate-limited to:
// - 10 requests per hour per IP (anonymous)
// - 50 requests per hour per authenticated user
// - Implement with Vercel KV or Upstash Redis in production

import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { SA_CONTEXT_PROMPT, SA_RECRUITER_CONTEXT } from '@/lib/sa-context';
import { Errors, generateTraceId } from '@/lib/api-error';

// Only log verbose debug info in development
const IS_DEV = process.env.NODE_ENV !== 'production';

// ============================================
// INPUT VALIDATION CONSTANTS
// ============================================

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB max file size
const MAX_TEXT_LENGTH = 100000; // 100k characters max for pasted text
const MIN_TEXT_LENGTH = 50; // Minimum meaningful CV content
const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.txt'];

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ============================================
// VALIDATION HELPERS
// ============================================

function validateFileType(filename: string): boolean {
  const lowerName = filename.toLowerCase();
  return ALLOWED_EXTENSIONS.some(ext => lowerName.endsWith(ext));
}

function sanitizeFilename(filename: string): string {
  // Remove any path traversal attempts and limit length
  return filename
    .replace(/[/\\]/g, '')
    .replace(/\.\./g, '')
    .slice(0, 255);
}

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
    if (IS_DEV) console.log(`[PDF] Extracting from ${filename}, size: ${buffer.length}, production: ${isProduction}`);

    let extractedText = '';

    // Method 1: ConvertAPI (production with API key)
    if (process.env.CONVERTAPI_SECRET) {
      try {
        if (IS_DEV) console.log('[PDF] Trying ConvertAPI extraction');
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
        if (response.ok) {
          const result = await response.json();
          if (result.Files?.[0]?.Url) {
            const textResponse = await fetch(result.Files[0].Url);
            extractedText = await textResponse.text();
            if (IS_DEV) console.log(`[PDF] ConvertAPI extracted ${extractedText.length} chars`);
          }
        }
      } catch (e) {
        console.warn('[PDF] ConvertAPI failed:', e);
      }
    }

    // Method 2: pdf2json (local/fallback)
    if (!extractedText || extractedText.length < 100) {
      try {
        if (IS_DEV) console.log('[PDF] Trying pdf2json extraction');
        const PDFParser = (await import('pdf2json')).default;

        extractedText = await new Promise((resolve) => {
          const pdfParser = new PDFParser();
          const timeout = setTimeout(() => {
            console.warn('[PDF] pdf2json timeout');
            resolve('');
          }, 30000); // 30s timeout

          pdfParser.on('pdfParser_dataReady', (pdfData: { Pages?: Array<{ Texts?: Array<{ R?: Array<{ T?: string }> }> }> }) => {
            clearTimeout(timeout);
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
            if (IS_DEV) console.log(`[PDF] pdf2json extracted ${text.length} chars`);
            resolve(text.trim());
          });

          pdfParser.on('pdfParser_dataError', (errData: { parserError?: Error }) => {
            clearTimeout(timeout);
            console.error('[PDF] Parser error:', errData.parserError?.message || errData.parserError);
            resolve('');
          });

          pdfParser.parseBuffer(buffer);
        });
      } catch (e) {
        console.warn('[PDF] pdf2json failed:', e);
      }
    }

    // Method 3: OpenAI Vision (for scanned/image PDFs)
    if ((!extractedText || extractedText.length < 100) && process.env.OPENAI_API_KEY) {
      try {
        if (IS_DEV) console.log('[PDF] Trying OpenAI Vision for OCR');
        const base64PDF = buffer.toString('base64');
        const response = await openai.chat.completions.create({
          model: 'gpt-4o',
          max_tokens: 4000,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Extract ALL text from this PDF/document image. Return ONLY the text content, preserving the structure as much as possible. Include all names, dates, job titles, companies, education, skills, and contact information.'
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:application/pdf;base64,${base64PDF}`,
                    detail: 'high'
                  }
                }
              ]
            }
          ]
        });
        extractedText = response.choices[0]?.message?.content || '';
        if (IS_DEV) console.log(`[PDF] OpenAI Vision extracted ${extractedText.length} chars`);
      } catch (e) {
        console.warn('[PDF] OpenAI Vision failed:', e);
      }
    }

    return extractedText;
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
  const traceId = generateTraceId();
  if (IS_DEV) console.log(`[${traceId}][B2C] CV Analysis request received`);

  try {
    // ============================================
    // PARSE AND VALIDATE INPUT
    // ============================================

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return Errors.validation('Invalid form data. Please upload a CV file or paste text.').toResponse();
    }

    const file = formData.get('cv') as File | null;
    const pastedText = formData.get('cvText') as string | null;

    let cvText = '';

    // Handle pasted text (no file upload needed)
    if (pastedText && pastedText.length > MIN_TEXT_LENGTH) {
      // Validate text length
      if (pastedText.length > MAX_TEXT_LENGTH) {
        return Errors.validation(
          `Text too long. Maximum ${MAX_TEXT_LENGTH.toLocaleString()} characters allowed.`,
          `Received ${pastedText.length.toLocaleString()} characters`
        ).toResponse();
      }
      cvText = pastedText;
      if (IS_DEV) console.log(`[${traceId}][B2C] Processing pasted text: ${cvText.length} characters`);
    }
    // Handle file upload
    else if (file) {
      // Validate file name
      const safeFilename = sanitizeFilename(file.name);
      if (!safeFilename) {
        return Errors.validation('Invalid filename').toResponse();
      }

      // Validate file type
      if (!validateFileType(safeFilename)) {
        return Errors.validation(
          'Unsupported file type. Please upload a PDF, Word document (.doc, .docx), or text file.',
          `Allowed types: ${ALLOWED_EXTENSIONS.join(', ')}`
        ).toResponse();
      }

      // Validate file size BEFORE reading content
      if (file.size > MAX_FILE_SIZE_BYTES) {
        return Errors.validation(
          `File too large. Maximum size is ${MAX_FILE_SIZE_BYTES / 1024 / 1024}MB.`,
          `Received ${(file.size / 1024 / 1024).toFixed(2)}MB`
        ).toResponse();
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const filename = safeFilename.toLowerCase();

      if (IS_DEV) console.log(`[${traceId}][B2C] Processing: ${safeFilename} (${buffer.length} bytes)`);

      if (buffer.length === 0) {
        return Errors.validation(
          'File appears to be empty. Please try uploading again or use paste mode.'
        ).toResponse();
      }

      if (filename.endsWith('.pdf')) {
        cvText = await extractPDFText(buffer, safeFilename);
      } else if (filename.endsWith('.doc') || filename.endsWith('.docx')) {
        cvText = await extractWordText(buffer);
      } else if (filename.endsWith('.txt')) {
        cvText = buffer.toString('utf-8');
      }
    }
    // No input provided
    else {
      return Errors.validation('No CV file or text provided').toResponse();
    }

    if (cvText.length < MIN_TEXT_LENGTH) {
      return Errors.validation(
        'Could not extract meaningful text from your CV.',
        'Please ensure it is not an image-only PDF or paste your CV text directly.'
      ).toResponse();
    }

    if (IS_DEV) console.log(`[${traceId}][B2C] Extracted ${cvText.length} characters`);

    // Use base gpt-4o-mini with JSON mode for reliability
    const completion = await openai.chat.completions.create({
      model: 'ft:gpt-4o-mini-2024-07-18:personal:hireinbox-v3:CqlakGfJ', // V3 BRAIN
      temperature: 0.3,
      max_tokens: 3000,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: CV_COACH_PROMPT },
        { role: 'user', content: `Please analyze this CV and provide detailed feedback. Return valid JSON only:\n\n${cvText}` }
      ],
    });

    const responseText = completion.choices[0]?.message?.content || '';
    if (IS_DEV) console.log(`[${traceId}][B2C] AI response length: ${responseText.length}`);

    // Parse JSON response
    const cleaned = responseText.replace(/```json\s*/gi, '').replace(/```/g, '').trim();
    let analysis;

    try {
      analysis = JSON.parse(cleaned);
    } catch {
      console.error(`[${traceId}][B2C] JSON parse failed`);
      return Errors.ai('Analysis failed due to parsing error. Please try again.', undefined, traceId).toResponse();
    }

    if (IS_DEV) console.log(`[${traceId}][B2C] Analysis complete for: ${analysis.candidate_name}`);

    return NextResponse.json({
      success: true,
      analysis,
      originalCV: cvText,  // Return for CV rewriting feature
      traceId,
    });

  } catch (error) {
    console.error(`[${traceId}][B2C] Error:`, error);
    // SECURITY: Do not expose internal error details to client
    const isOpenAIError = error instanceof Error && error.message.includes('OpenAI');
    const userMessage = isOpenAIError
      ? 'AI service temporarily unavailable. Please try again.'
      : 'Analysis failed. Please try again.';
    return Errors.internal(userMessage, traceId).toResponse();
  }
}
