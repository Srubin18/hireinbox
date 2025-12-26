// app/api/whatsapp/webhook/route.ts
// WhatsApp Webhook for HireInbox - Candidate Screening via WhatsApp
//
// Phase 2: Full Conversational Screening
// - Receives incoming WhatsApp messages from Twilio
// - Handles CV uploads (PDF, images)
// - Asks knockout questions
// - Auto-screens using GPT-4o
// - Forwards results to recruiter
//
// SETUP:
// 1. Configure Twilio webhook URL: https://your-domain.com/api/whatsapp/webhook
// 2. Set to HTTP POST
// 3. Enable signature validation in production

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import {
  parseIncomingMessage,
  getConversationState,
  updateConversationState,
  getKnockoutQuestions,
  getNextQuestion,
  validateAnswer,
  downloadMedia,
  isValidCVFormat,
  generateTwiMLResponse,
  generateEmptyTwiMLResponse,
  sendWhatsAppMessage,
  normalizePhoneNumber,
  MESSAGES,
  type ConversationState,
  type IncomingWhatsAppMessage,
  type KnockoutQuestion,
} from '@/lib/whatsapp';
import { SA_CONTEXT_PROMPT, SA_RECRUITER_CONTEXT } from '@/lib/sa-context';

// ============================================
// CONFIG
// ============================================

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ============================================
// CV EXTRACTION (from incoming media)
// ============================================

async function extractTextFromMedia(
  buffer: Buffer,
  contentType: string,
  traceId: string
): Promise<string> {
  try {
    // PDF extraction
    if (contentType.includes('pdf')) {
      console.log(`[${traceId}][EXTRACT] Processing PDF...`);
      const isProduction = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';

      if (isProduction && process.env.CONVERTAPI_SECRET) {
        const base64PDF = buffer.toString('base64');
        const response = await fetch(`https://v2.convertapi.com/convert/pdf/to/txt?Secret=${process.env.CONVERTAPI_SECRET}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            Parameters: [
              { Name: 'File', FileValue: { Name: 'cv.pdf', Data: base64PDF } },
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
        const pdfParseModule = await import('pdf-parse');
        const pdfParse = pdfParseModule.default || pdfParseModule;
        const data = await pdfParse(buffer);
        return data.text || '';
      }
    }

    // Word document extraction
    if (contentType.includes('word') || contentType.includes('document')) {
      console.log(`[${traceId}][EXTRACT] Processing Word document...`);
      const mammoth = (await import('mammoth')).default;
      const result = await mammoth.extractRawText({ buffer });
      return result.value || '';
    }

    // Image OCR (for photos of CVs)
    if (contentType.includes('image')) {
      console.log(`[${traceId}][EXTRACT] Processing image with OCR...`);
      // Use GPT-4o vision for OCR
      const base64Image = buffer.toString('base64');
      const mimeType = contentType.includes('jpeg') ? 'image/jpeg' :
                       contentType.includes('png') ? 'image/png' : 'image/webp';

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extract ALL text from this CV/resume image. Return the complete text content, preserving structure where possible. Include all contact details, work experience, education, and skills. Output only the extracted text, no commentary.',
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`,
                  detail: 'high',
                },
              },
            ],
          },
        ],
      });

      return completion.choices[0]?.message?.content || '';
    }

    return '';
  } catch (error) {
    console.error(`[${traceId}][EXTRACT] Error:`, error);
    return '';
  }
}

// ============================================
// AI SCREENING (simplified for WhatsApp)
// ============================================

const WHATSAPP_SCREENING_PROMPT = `You are HireInbox's AI Recruiter screening a CV received via WhatsApp.

Evaluate this CV against the role requirements and provide a quick assessment.

IMPORTANT RULES:
1. Be concise - this will be sent via WhatsApp
2. Every strength MUST have evidence from the CV
3. Use SA context for qualifications (CA(SA), Big 4, etc.)
4. Return valid JSON only

${SA_CONTEXT_PROMPT}

${SA_RECRUITER_CONTEXT}

OUTPUT FORMAT:
{
  "candidate_name": "<name or null>",
  "candidate_email": "<email or null>",
  "candidate_phone": "<phone or null>",
  "years_experience": <number or null>,
  "overall_score": <0-100>,
  "recommendation": "SHORTLIST|CONSIDER|REJECT",
  "summary": "<2-3 sentences: key strengths, concerns, fit assessment>",
  "top_strengths": ["<strength 1 with evidence>", "<strength 2 with evidence>"],
  "concerns": ["<concern 1>", "<concern 2>"],
  "knockout_results": {
    "experience_met": <true|false|null>,
    "skills_met": <true|false|null>,
    "location_suitable": <true|false|null>
  }
}`;

async function screenCVForWhatsApp(
  cvText: string,
  role: Record<string, unknown>,
  knockoutResponses: Record<string, string>,
  traceId: string
): Promise<Record<string, unknown> | null> {
  // Cast facts to proper type
  const facts = role.facts as {
    min_experience_years?: number;
    required_skills?: string[];
    location?: string;
  } | undefined;

  const roleContext = `
ROLE: ${role.title || 'General Position'}
${facts?.min_experience_years ? `MINIMUM EXPERIENCE: ${facts.min_experience_years} years` : ''}
${facts?.required_skills?.length ? `REQUIRED SKILLS: ${facts.required_skills.join(', ')}` : ''}
${facts?.location ? `LOCATION: ${facts.location}` : ''}

CANDIDATE KNOCKOUT RESPONSES:
${Object.entries(knockoutResponses).map(([k, v]) => `- ${k}: ${v}`).join('\n')}`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0,
      max_tokens: 1500,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: WHATSAPP_SCREENING_PROMPT },
        { role: 'user', content: `${roleContext}\n\nCV TEXT:\n${cvText}` }
      ],
    });

    const text = completion.choices[0]?.message?.content || '';
    const cleaned = text.replace(/```json\s*/gi, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.error(`[${traceId}][SCREEN] AI screening failed:`, error);
    return null;
  }
}

// ============================================
// CONVERSATION HANDLERS
// ============================================

async function handleInitialMessage(
  message: IncomingWhatsAppMessage,
  traceId: string
): Promise<string> {
  // Check for opt-out
  const lowerBody = message.body.toLowerCase().trim();
  if (['stop', 'unsubscribe', 'optout', 'opt out', 'cancel'].includes(lowerBody)) {
    await supabase.from('whatsapp_optouts').upsert({
      phone: normalizePhoneNumber(message.from),
      opted_out_at: new Date().toISOString(),
    });
    return MESSAGES.OPT_OUT;
  }

  // Get active role for initial message
  const { data: roles } = await supabase
    .from('roles')
    .select('id, title')
    .eq('status', 'active')
    .limit(1);

  const activeRole = roles?.[0];
  const roleName = activeRole?.title;

  // Check if they want to apply
  if (['apply', 'yes', 'start', 'hi', 'hello', 'hey'].includes(lowerBody)) {
    // Create conversation state
    await updateConversationState(supabase, {
      candidatePhone: message.from,
      stage: 'collecting_cv',
      roleId: activeRole?.id,
      responses: {},
      cvReceived: false,
    });

    return MESSAGES.SEND_CV;
  }

  // Check if they sent media (CV) right away
  if (message.numMedia > 0) {
    return await handleCVUpload(message, traceId, undefined);
  }

  // Default welcome
  return MESSAGES.WELCOME(roleName);
}

async function handleCVUpload(
  message: IncomingWhatsAppMessage,
  traceId: string,
  existingState?: ConversationState | null
): Promise<string> {
  if (message.numMedia === 0) {
    return MESSAGES.SEND_CV;
  }

  const mediaUrl = message.mediaUrls[0];
  const contentType = message.mediaContentTypes[0] || '';

  // Validate format
  if (!isValidCVFormat(contentType)) {
    return MESSAGES.CV_FAILED;
  }

  // Download media
  console.log(`[${traceId}][CV] Downloading media: ${contentType}`);
  const media = await downloadMedia(mediaUrl);
  if (!media) {
    return MESSAGES.CV_FAILED;
  }

  // Extract text
  console.log(`[${traceId}][CV] Extracting text...`);
  const cvText = await extractTextFromMedia(media.buffer, contentType, traceId);

  if (cvText.length < 50) {
    console.log(`[${traceId}][CV] Extraction failed or too short: ${cvText.length} chars`);
    return MESSAGES.CV_FAILED;
  }

  console.log(`[${traceId}][CV] Extracted ${cvText.length} characters`);

  // Store CV and move to knockout questions
  const state: Partial<ConversationState> & { candidatePhone: string } = {
    candidatePhone: message.from,
    stage: 'knockout_questions',
    cvReceived: true,
    cvUrl: mediaUrl,
    responses: existingState?.responses || {},
  };

  // Get active role
  const { data: roles } = await supabase
    .from('roles')
    .select('*')
    .eq('status', 'active')
    .limit(1);

  const activeRole = roles?.[0];
  state.roleId = activeRole?.id;

  await updateConversationState(supabase, state);

  // Store CV text temporarily for screening
  await supabase.from('whatsapp_cv_cache').upsert({
    phone: normalizePhoneNumber(message.from),
    cv_text: cvText,
    received_at: new Date().toISOString(),
  });

  // Try to extract name from CV for personalization
  let candidateName: string | undefined;
  const nameMatch = cvText.match(/^([A-Z][a-z]+ [A-Z][a-z]+)/m);
  if (nameMatch) {
    candidateName = nameMatch[1];
  }

  // Get first knockout question
  const questions = getKnockoutQuestions(activeRole);
  const firstQuestion = questions[0];

  if (firstQuestion) {
    return `${MESSAGES.CV_RECEIVED(candidateName)}

${firstQuestion.question}`;
  }

  return MESSAGES.CV_RECEIVED(candidateName);
}

async function handleKnockoutQuestion(
  message: IncomingWhatsAppMessage,
  state: ConversationState,
  traceId: string
): Promise<string> {
  // Get role
  const { data: role } = await supabase
    .from('roles')
    .select('*')
    .eq('id', state.roleId)
    .single();

  const questions = getKnockoutQuestions(role);

  // Find current question (the one we're waiting for answer to)
  const currentQuestion = getNextQuestion(questions, state.responses);

  if (!currentQuestion) {
    // All questions answered - proceed to screening
    return await completeApplication(message, state, role, traceId);
  }

  // Validate answer
  const answer = message.body.trim();
  if (!validateAnswer(currentQuestion, answer)) {
    return MESSAGES.INVALID_ANSWER(currentQuestion.errorMessage);
  }

  // Store answer
  const updatedResponses = {
    ...state.responses,
    [currentQuestion.id]: answer,
  };

  // Get next question
  const nextQuestion = getNextQuestion(questions, updatedResponses);

  if (nextQuestion) {
    // Update state and ask next question
    await updateConversationState(supabase, {
      candidatePhone: message.from,
      stage: 'knockout_questions',
      responses: updatedResponses,
    });

    return nextQuestion.question;
  }

  // All questions answered
  await updateConversationState(supabase, {
    candidatePhone: message.from,
    stage: 'complete',
    responses: updatedResponses,
  });

  return await completeApplication(message, { ...state, responses: updatedResponses }, role, traceId);
}

async function completeApplication(
  message: IncomingWhatsAppMessage,
  state: ConversationState,
  role: Record<string, unknown>,
  traceId: string
): Promise<string> {
  console.log(`[${traceId}][COMPLETE] Processing complete application`);

  // Get cached CV text
  const { data: cvCache } = await supabase
    .from('whatsapp_cv_cache')
    .select('cv_text')
    .eq('phone', normalizePhoneNumber(message.from))
    .single();

  if (!cvCache?.cv_text) {
    console.error(`[${traceId}][COMPLETE] No CV text found`);
    return MESSAGES.ERROR;
  }

  // Screen the CV
  console.log(`[${traceId}][COMPLETE] Running AI screening...`);
  const screening = await screenCVForWhatsApp(cvCache.cv_text, role, state.responses, traceId);

  if (!screening) {
    console.error(`[${traceId}][COMPLETE] Screening failed`);
    return MESSAGES.APPLICATION_COMPLETE(message.profileName);
  }

  console.log(`[${traceId}][COMPLETE] Screening result: ${screening.recommendation} (${screening.overall_score})`);

  // Map recommendation to status
  const status = {
    'SHORTLIST': 'shortlist',
    'CONSIDER': 'talent_pool',
    'REJECT': 'reject',
  }[String(screening.recommendation)] || 'screened';

  // Create candidate record
  const candidateData = {
    company_id: role.company_id,
    role_id: state.roleId,
    name: String(screening.candidate_name || message.profileName || 'WhatsApp Applicant'),
    email: screening.candidate_email ? String(screening.candidate_email) : null,
    phone: normalizePhoneNumber(message.from),
    whatsapp_number: normalizePhoneNumber(message.from),
    cv_text: cvCache.cv_text,
    ai_score: Math.round(Number(screening.overall_score) || 0),
    ai_recommendation: String(screening.recommendation),
    ai_reasoning: String(screening.summary || ''),
    screening_result: screening,
    screened_at: new Date().toISOString(),
    status,
    score: Math.round(Number(screening.overall_score) || 0),
    strengths: screening.top_strengths || [],
    missing: screening.concerns || [],
    source: 'whatsapp',
    knockout_responses: state.responses,
  };

  const { data: candidate, error: insertError } = await supabase
    .from('candidates')
    .insert(candidateData)
    .select()
    .single();

  if (insertError) {
    console.error(`[${traceId}][COMPLETE] Failed to create candidate:`, insertError);
    return MESSAGES.APPLICATION_COMPLETE(String(screening.candidate_name));
  }

  // Update conversation state with candidate ID
  await updateConversationState(supabase, {
    candidatePhone: message.from,
    stage: 'complete',
    candidateId: candidate.id,
    responses: state.responses,
  });

  // Clean up CV cache
  await supabase.from('whatsapp_cv_cache').delete()
    .eq('phone', normalizePhoneNumber(message.from));

  // Notify recruiter (if configured)
  if (status === 'shortlist' || status === 'talent_pool') {
    // Get recruiter's WhatsApp number if configured
    const { data: company } = await supabase
      .from('companies')
      .select('recruiter_whatsapp')
      .eq('id', role.company_id)
      .single();

    if (company?.recruiter_whatsapp) {
      // Send notification asynchronously
      sendWhatsAppMessage({
        to: company.recruiter_whatsapp,
        body: MESSAGES.NEW_CV_ALERT(
          String(screening.candidate_name || 'New Candidate'),
          String(role.title || 'Open Position'),
          Number(screening.overall_score || 0),
          String(screening.recommendation || 'REVIEW')
        ),
      }).catch(err => {
        console.error(`[${traceId}][COMPLETE] Failed to notify recruiter:`, err);
      });
    }
  }

  return MESSAGES.APPLICATION_COMPLETE(String(screening.candidate_name));
}

// ============================================
// MAIN WEBHOOK HANDLER
// ============================================

export async function POST(request: Request) {
  const traceId = Date.now().toString(36);
  console.log(`[${traceId}][WHATSAPP-WEBHOOK] Incoming message`);

  try {
    // Parse form data from Twilio
    const formData = await request.formData();
    const body: Record<string, string> = {};
    formData.forEach((value, key) => {
      body[key] = String(value);
    });

    // TODO: Validate Twilio signature in production
    // const signature = request.headers.get('X-Twilio-Signature') || '';
    // const url = request.url;
    // if (!await validateTwilioSignature(signature, url, body)) {
    //   return new NextResponse('Unauthorized', { status: 401 });
    // }

    // Parse message
    const message = parseIncomingMessage(body);
    console.log(`[${traceId}][WHATSAPP-WEBHOOK] From: ${message.from}, Body: "${message.body.substring(0, 50)}...", Media: ${message.numMedia}`);

    // Get conversation state
    const state = await getConversationState(supabase, message.from);
    console.log(`[${traceId}][WHATSAPP-WEBHOOK] State: ${state?.stage || 'new'}`);

    let responseMessage: string;

    // Handle based on conversation stage
    if (!state || state.stage === 'initial') {
      responseMessage = await handleInitialMessage(message, traceId);
    } else if (state.stage === 'collecting_cv') {
      // They should be sending CV
      if (message.numMedia > 0) {
        responseMessage = await handleCVUpload(message, traceId, state);
      } else if (message.body.toLowerCase().trim() === 'stop') {
        responseMessage = MESSAGES.OPT_OUT;
        await updateConversationState(supabase, {
          candidatePhone: message.from,
          stage: 'opted_out',
        });
      } else {
        responseMessage = MESSAGES.SEND_CV;
      }
    } else if (state.stage === 'knockout_questions') {
      // Handle knockout question responses or media
      if (message.numMedia > 0 && !state.cvReceived) {
        responseMessage = await handleCVUpload(message, traceId, state);
      } else {
        responseMessage = await handleKnockoutQuestion(message, state, traceId);
      }
    } else if (state.stage === 'complete') {
      // Already completed - acknowledge
      responseMessage = 'Thanks! Your application has already been submitted. A recruiter will be in touch if your profile matches.';
    } else if (state.stage === 'opted_out') {
      // Opted out - check if they want to re-subscribe
      if (['apply', 'subscribe', 'start'].includes(message.body.toLowerCase().trim())) {
        await supabase.from('whatsapp_optouts').delete()
          .eq('phone', normalizePhoneNumber(message.from));
        await updateConversationState(supabase, {
          candidatePhone: message.from,
          stage: 'initial',
          responses: {},
          cvReceived: false,
        });
        responseMessage = await handleInitialMessage(message, traceId);
      } else {
        responseMessage = 'You are currently unsubscribed. Reply APPLY to start a new application.';
      }
    } else {
      responseMessage = MESSAGES.NOT_UNDERSTOOD;
    }

    // Return TwiML response
    console.log(`[${traceId}][WHATSAPP-WEBHOOK] Responding: "${responseMessage.substring(0, 50)}..."`);
    const twiml = generateTwiMLResponse(responseMessage);

    return new NextResponse(twiml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
      },
    });

  } catch (error) {
    console.error(`[${traceId}][WHATSAPP-WEBHOOK] Error:`, error);

    // Return error response in TwiML format
    const twiml = generateTwiMLResponse(MESSAGES.ERROR);
    return new NextResponse(twiml, {
      status: 200, // Twilio expects 200 even for errors
      headers: {
        'Content-Type': 'application/xml',
      },
    });
  }
}

// ============================================
// GET: Webhook verification
// ============================================

export async function GET() {
  return NextResponse.json({
    service: 'whatsapp-webhook',
    status: 'ready',
    message: 'Configure this URL in Twilio Console for WhatsApp webhook',
  });
}
