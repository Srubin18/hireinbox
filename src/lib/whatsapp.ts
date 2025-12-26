// lib/whatsapp.ts
// HireInbox WhatsApp Integration via Twilio
// SA is mobile-first, 96% WhatsApp usage - this is where candidates live
//
// SETUP:
// 1. Get Twilio account: https://console.twilio.com
// 2. Enable WhatsApp: https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn
// 3. Add to .env.local:
//    TWILIO_ACCOUNT_SID=ACxxxx
//    TWILIO_AUTH_TOKEN=xxxxx
//    TWILIO_WHATSAPP_NUMBER=+14155238886 (or your own verified number)

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ============================================
// TYPES
// ============================================

export interface WhatsAppMessage {
  to: string;           // E.164 format: +27821234567
  body: string;
  mediaUrl?: string;    // Optional: URL to media (CV image, etc)
}

export interface WhatsAppResult {
  success: boolean;
  messageId?: string;
  error?: string;
  errorCode?: string;
}

export interface IncomingWhatsAppMessage {
  messageSid: string;
  from: string;         // +27821234567
  to: string;           // Twilio number
  body: string;
  numMedia: number;
  mediaUrls: string[];
  mediaContentTypes: string[];
  profileName?: string;
  timestamp: Date;
}

export interface ConversationState {
  candidatePhone: string;
  stage: 'initial' | 'collecting_cv' | 'knockout_questions' | 'complete' | 'opted_out';
  roleId?: string;
  candidateId?: string;
  responses: Record<string, string>;
  cvReceived: boolean;
  cvUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface KnockoutQuestion {
  id: string;
  question: string;
  type: 'text' | 'number' | 'yes_no' | 'location';
  required: boolean;
  validation?: (answer: string) => boolean;
  errorMessage?: string;
}

// ============================================
// CONFIGURATION
// ============================================

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER || '+14155238886';

// Format: whatsapp:+14155238886
const WHATSAPP_FROM = `whatsapp:${TWILIO_WHATSAPP_NUMBER}`;

// Twilio API endpoint
const TWILIO_API_URL = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;

// ============================================
// PHONE NUMBER UTILITIES
// ============================================

/**
 * Normalize SA phone number to E.164 format
 * Handles: 0821234567, +27821234567, 27821234567, 082 123 4567
 */
export function normalizePhoneNumber(phone: string): string {
  // Remove all non-digit characters except leading +
  let cleaned = phone.replace(/[^\d+]/g, '');

  // Handle South African numbers
  if (cleaned.startsWith('0')) {
    // Local format: 0821234567 -> +27821234567
    cleaned = '+27' + cleaned.substring(1);
  } else if (cleaned.startsWith('27') && !cleaned.startsWith('+')) {
    // Missing +: 27821234567 -> +27821234567
    cleaned = '+' + cleaned;
  } else if (!cleaned.startsWith('+')) {
    // Assume SA if no country code
    cleaned = '+27' + cleaned;
  }

  return cleaned;
}

/**
 * Validate phone number format
 */
export function isValidPhoneNumber(phone: string): boolean {
  const normalized = normalizePhoneNumber(phone);
  // E.164 format validation
  return /^\+[1-9]\d{6,14}$/.test(normalized);
}

/**
 * Format phone for display (SA format)
 */
export function formatPhoneDisplay(phone: string): string {
  const normalized = normalizePhoneNumber(phone);
  if (normalized.startsWith('+27')) {
    // +27821234567 -> 082 123 4567
    const local = '0' + normalized.substring(3);
    return local.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
  }
  return normalized;
}

// ============================================
// CORE WHATSAPP FUNCTIONS
// ============================================

/**
 * Send a WhatsApp message via Twilio
 */
export async function sendWhatsAppMessage(message: WhatsAppMessage): Promise<WhatsAppResult> {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    console.error('[WHATSAPP] Missing Twilio credentials');
    return {
      success: false,
      error: 'WhatsApp not configured. Add TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN to environment.'
    };
  }

  const toNumber = normalizePhoneNumber(message.to);
  if (!isValidPhoneNumber(toNumber)) {
    return {
      success: false,
      error: `Invalid phone number: ${message.to}`
    };
  }

  try {
    const formData = new URLSearchParams();
    formData.append('From', WHATSAPP_FROM);
    formData.append('To', `whatsapp:${toNumber}`);
    formData.append('Body', message.body);

    if (message.mediaUrl) {
      formData.append('MediaUrl', message.mediaUrl);
    }

    const response = await fetch(TWILIO_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[WHATSAPP] Twilio error:', data);
      return {
        success: false,
        error: data.message || 'Failed to send WhatsApp message',
        errorCode: data.code?.toString(),
      };
    }

    console.log(`[WHATSAPP] Message sent to ${toNumber}: ${data.sid}`);
    return {
      success: true,
      messageId: data.sid,
    };
  } catch (error) {
    console.error('[WHATSAPP] Send error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error sending WhatsApp message',
    };
  }
}

/**
 * Parse incoming Twilio webhook payload
 */
export function parseIncomingMessage(body: Record<string, string>): IncomingWhatsAppMessage {
  const mediaUrls: string[] = [];
  const mediaContentTypes: string[] = [];
  const numMedia = parseInt(body.NumMedia || '0', 10);

  for (let i = 0; i < numMedia; i++) {
    if (body[`MediaUrl${i}`]) {
      mediaUrls.push(body[`MediaUrl${i}`]);
    }
    if (body[`MediaContentType${i}`]) {
      mediaContentTypes.push(body[`MediaContentType${i}`]);
    }
  }

  return {
    messageSid: body.MessageSid || '',
    from: body.From?.replace('whatsapp:', '') || '',
    to: body.To?.replace('whatsapp:', '') || '',
    body: body.Body || '',
    numMedia,
    mediaUrls,
    mediaContentTypes,
    profileName: body.ProfileName,
    timestamp: new Date(),
  };
}

// ============================================
// CONVERSATION MANAGEMENT
// ============================================

/**
 * Get or create conversation state from Supabase
 */
export async function getConversationState(
  supabase: SupabaseClient,
  phone: string
): Promise<ConversationState | null> {
  const normalizedPhone = normalizePhoneNumber(phone);

  const { data, error } = await supabase
    .from('whatsapp_conversations')
    .select('*')
    .eq('candidate_phone', normalizedPhone)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    candidatePhone: data.candidate_phone,
    stage: data.stage,
    roleId: data.role_id,
    candidateId: data.candidate_id,
    responses: data.responses || {},
    cvReceived: data.cv_received || false,
    cvUrl: data.cv_url,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Create or update conversation state
 */
export async function updateConversationState(
  supabase: SupabaseClient,
  state: Partial<ConversationState> & { candidatePhone: string }
): Promise<boolean> {
  const normalizedPhone = normalizePhoneNumber(state.candidatePhone);

  const { error } = await supabase
    .from('whatsapp_conversations')
    .upsert({
      candidate_phone: normalizedPhone,
      stage: state.stage || 'initial',
      role_id: state.roleId,
      candidate_id: state.candidateId,
      responses: state.responses || {},
      cv_received: state.cvReceived || false,
      cv_url: state.cvUrl,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'candidate_phone',
    });

  if (error) {
    console.error('[WHATSAPP] Failed to update conversation state:', error);
    return false;
  }

  return true;
}

// ============================================
// KNOCKOUT QUESTIONS
// ============================================

const DEFAULT_KNOCKOUT_QUESTIONS: KnockoutQuestion[] = [
  {
    id: 'location',
    question: 'Where are you based? (City/Town)',
    type: 'location',
    required: true,
  },
  {
    id: 'experience_years',
    question: 'How many years of relevant experience do you have?',
    type: 'number',
    required: true,
    validation: (answer) => {
      const years = parseFloat(answer);
      return !isNaN(years) && years >= 0 && years <= 50;
    },
    errorMessage: 'Please enter a number (e.g., 3 or 2.5)',
  },
  {
    id: 'availability',
    question: 'When can you start? (Immediately / 1 month / Other)',
    type: 'text',
    required: true,
  },
  {
    id: 'salary_expectation',
    question: 'What is your expected monthly salary? (In Rands)',
    type: 'text',
    required: false,
  },
];

/**
 * Get knockout questions for a role
 */
export function getKnockoutQuestions(role?: { knockout_questions?: KnockoutQuestion[] }): KnockoutQuestion[] {
  if (role?.knockout_questions && role.knockout_questions.length > 0) {
    return role.knockout_questions;
  }
  return DEFAULT_KNOCKOUT_QUESTIONS;
}

/**
 * Get the next unanswered knockout question
 */
export function getNextQuestion(
  questions: KnockoutQuestion[],
  responses: Record<string, string>
): KnockoutQuestion | null {
  return questions.find(q => !(q.id in responses)) || null;
}

/**
 * Validate an answer to a knockout question
 */
export function validateAnswer(question: KnockoutQuestion, answer: string): boolean {
  if (!answer.trim() && question.required) {
    return false;
  }
  if (question.validation) {
    return question.validation(answer);
  }
  return true;
}

// ============================================
// MESSAGE TEMPLATES
// ============================================

export const MESSAGES = {
  // Initial greeting when someone messages us
  WELCOME: (roleName?: string) =>
    `Hi! Welcome to HireInbox.

${roleName
  ? `We're currently hiring for: *${roleName}*`
  : `We help match you with job opportunities.`}

To apply, please:
1. Send your CV (PDF or image)
2. Answer a few quick questions

Reply *APPLY* to get started, or *STOP* to opt out.`,

  // Prompt to send CV
  SEND_CV: `Great! Please send your CV now.

You can:
- Send a PDF document
- Take a photo of your printed CV
- Send a Word document

We'll review it and get back to you.`,

  // CV received confirmation
  CV_RECEIVED: (candidateName?: string) =>
    `Thanks${candidateName ? `, ${candidateName}` : ''}! We've received your CV.

Now, just a few quick questions to complete your application.`,

  // Generic error
  ERROR: `Sorry, something went wrong. Please try again or send us an email at careers@hireinbox.co.za`,

  // Opt out confirmation
  OPT_OUT: `You've been unsubscribed. You won't receive any more messages from us.

If you change your mind, just message us again.`,

  // Application complete
  APPLICATION_COMPLETE: (candidateName?: string) =>
    `Thanks${candidateName ? `, ${candidateName}` : ''}! Your application is complete.

A recruiter will review your details and be in touch if your profile matches.

Good luck!`,

  // CV processing failed
  CV_FAILED: `We couldn't read your CV. Please try:
- Sending a clearer photo
- Sending a PDF document
- Making sure the file isn't corrupted

Or paste your CV text directly.`,

  // Invalid answer
  INVALID_ANSWER: (errorMessage?: string) =>
    `That doesn't look right. ${errorMessage || 'Please try again.'}`,

  // Not understood
  NOT_UNDERSTOOD: `I didn't understand that.

Reply:
- *APPLY* to start your application
- *STOP* to unsubscribe
- Or send your CV to apply`,

  // Recruiter notifications
  NEW_CV_ALERT: (candidateName: string, roleName: string, score: number, recommendation: string) =>
    `*New Application*

Candidate: ${candidateName}
Role: ${roleName}
Score: ${score}/100
Recommendation: ${recommendation}

View in HireInbox dashboard to review.`,

  SHORTLIST_SUMMARY: (count: number, roleName: string) =>
    `*Shortlist Summary*

${count} candidate${count !== 1 ? 's' : ''} shortlisted for ${roleName} today.

Open HireInbox to review and take action.`,
};

// ============================================
// MEDIA HANDLING
// ============================================

/**
 * Download media from Twilio (CVs, images)
 */
export async function downloadMedia(mediaUrl: string): Promise<{ buffer: Buffer; contentType: string } | null> {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    console.error('[WHATSAPP] Missing Twilio credentials for media download');
    return null;
  }

  try {
    const response = await fetch(mediaUrl, {
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64'),
      },
    });

    if (!response.ok) {
      console.error('[WHATSAPP] Failed to download media:', response.status);
      return null;
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const buffer = Buffer.from(await response.arrayBuffer());

    return { buffer, contentType };
  } catch (error) {
    console.error('[WHATSAPP] Media download error:', error);
    return null;
  }
}

/**
 * Check if media is a valid CV format
 */
export function isValidCVFormat(contentType: string): boolean {
  const validTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'image/webp',
  ];
  return validTypes.some(type => contentType.toLowerCase().includes(type));
}

// ============================================
// TWILIO WEBHOOK RESPONSE HELPERS
// ============================================

/**
 * Generate TwiML response for WhatsApp
 * TwiML is Twilio's XML format for responses
 */
export function generateTwiMLResponse(message: string, mediaUrl?: string): string {
  let twiml = '<?xml version="1.0" encoding="UTF-8"?>';
  twiml += '<Response>';
  twiml += '<Message>';

  if (mediaUrl) {
    twiml += `<Media>${escapeXml(mediaUrl)}</Media>`;
  }

  twiml += `<Body>${escapeXml(message)}</Body>`;
  twiml += '</Message>';
  twiml += '</Response>';

  return twiml;
}

/**
 * Generate empty TwiML response (don't send a reply)
 */
export function generateEmptyTwiMLResponse(): string {
  return '<?xml version="1.0" encoding="UTF-8"?><Response></Response>';
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// ============================================
// WEBHOOK SIGNATURE VALIDATION
// ============================================

/**
 * Validate Twilio webhook signature
 * IMPORTANT: Always validate in production to prevent spoofing
 */
export async function validateTwilioSignature(
  signature: string,
  url: string,
  params: Record<string, string>
): Promise<boolean> {
  if (!TWILIO_AUTH_TOKEN) {
    console.warn('[WHATSAPP] Cannot validate signature: missing auth token');
    return false;
  }

  try {
    // Sort params and create validation string
    const sortedParams = Object.keys(params).sort();
    let data = url;
    for (const key of sortedParams) {
      data += key + params[key];
    }

    // HMAC-SHA1
    const crypto = await import('crypto');
    const hmac = crypto.createHmac('sha1', TWILIO_AUTH_TOKEN);
    hmac.update(data);
    const expectedSignature = hmac.digest('base64');

    return signature === expectedSignature;
  } catch (error) {
    console.error('[WHATSAPP] Signature validation error:', error);
    return false;
  }
}

// ============================================
// EXPORTS
// ============================================

export default {
  sendWhatsAppMessage,
  parseIncomingMessage,
  normalizePhoneNumber,
  isValidPhoneNumber,
  formatPhoneDisplay,
  getConversationState,
  updateConversationState,
  getKnockoutQuestions,
  getNextQuestion,
  validateAnswer,
  downloadMedia,
  isValidCVFormat,
  generateTwiMLResponse,
  generateEmptyTwiMLResponse,
  validateTwilioSignature,
  MESSAGES,
};
