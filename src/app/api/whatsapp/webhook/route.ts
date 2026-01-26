/**
 * HireInbox WhatsApp Webhook (360dialog)
 *
 * TWO FLOWS:
 * 1. RECRUITER FLOW: Authorized numbers get talent mapping
 * 2. JOB SEEKER FLOW: Anyone else can submit CV, get feedback, join talent pool
 *
 * This is our moat: Nobody else in SA does instant AI CV feedback via WhatsApp
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================================================
// SECURITY: Webhook signature verification (360dialog/Meta)
// ============================================================================
function verifyWebhookSignature(payload: string, signature: string | null): boolean {
  const appSecret = process.env.WHATSAPP_APP_SECRET || process.env.META_APP_SECRET;
  if (!appSecret) {
    console.warn('[HireInbox WA] No app secret configured');
    return true;
  }
  if (!signature) return false;

  const expectedSignature = signature.replace('sha256=', '');
  const hmac = crypto.createHmac('sha256', appSecret);
  hmac.update(payload, 'utf8');
  const computedSignature = hmac.digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(computedSignature, 'hex')
    );
  } catch {
    return false;
  }
}

// ============================================================================
// RATE LIMITING
// ============================================================================
const rateLimitMap = new Map<string, number[]>();
function checkRateLimit(sender: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(sender) || [];
  const recent = timestamps.filter(t => now - t < 60000);
  if (recent.length >= 5) return false;
  recent.push(now);
  rateLimitMap.set(sender, recent);
  return true;
}

// ============================================================================
// DEDUPLICATION
// ============================================================================
const processedMessages = new Map<string, number>();
function isDuplicate(messageId: string): boolean {
  const now = Date.now();
  for (const [key, timestamp] of processedMessages.entries()) {
    if (now - timestamp > 60000) processedMessages.delete(key);
  }
  if (processedMessages.has(messageId)) return true;
  processedMessages.set(messageId, now);
  return false;
}

// ============================================================================
// WHATSAPP API: Send message via 360dialog
// ============================================================================
async function sendWhatsAppMessage(to: string, message: string): Promise<boolean> {
  const apiKey = process.env.WHATSAPP_API_KEY || process.env.WHATSAPP_360_API_KEY || process.env.DIALOG_360_API_KEY;
  if (!apiKey) {
    console.error('[HireInbox WA] No API key');
    return false;
  }

  try {
    const response = await fetch('https://waba-v2.360dialog.io/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'D360-API-KEY': apiKey,
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: to,
        type: 'text',
        text: { body: message }
      })
    });

    if (!response.ok) {
      console.error('[HireInbox WA] Send failed:', await response.text());
    }
    return response.ok;
  } catch (error) {
    console.error('[HireInbox WA] Send error:', error);
    return false;
  }
}

// ============================================================================
// AUTHORIZATION: Check if phone number is whitelisted
// ============================================================================
async function isAuthorized(phoneNumber: string): Promise<boolean> {
  try {
    const { data } = await supabase
      .from('whatsapp_authorized_numbers')
      .select('phone_number')
      .eq('phone_number', phoneNumber)
      .eq('active', true)
      .single();
    return !!data;
  } catch {
    return false;
  }
}

// ============================================================================
// CONVERSATION STATE (in-memory for simplicity)
// ============================================================================
interface ConversationState {
  step: string;
  flow: 'recruiter' | 'jobseeker';
  // Recruiter flow
  lastSearch?: string;
  lastResults?: any;
  // Job seeker flow
  lastCVAnalysis?: any;
  candidateName?: string;
  cvText?: string;
  freeScansUsed?: number;
}

const conversationStates = new Map<string, ConversationState>();

function getState(sender: string): ConversationState {
  return conversationStates.get(sender) || { step: 'greeting', flow: 'jobseeker' };
}

function setState(sender: string, state: ConversationState): void {
  conversationStates.set(sender, state);
}

// ============================================================================
// CHECK FREE SCANS REMAINING (job seekers get 1 free)
// ============================================================================
async function getFreeScansUsed(phoneNumber: string): Promise<number> {
  try {
    const { count } = await supabase
      .from('whatsapp_cv_scans')
      .select('*', { count: 'exact', head: true })
      .eq('phone_number', phoneNumber);
    return count || 0;
  } catch {
    return 0;
  }
}

// ============================================================================
// WHATSAPP MEDIA: Download document from WhatsApp
// ============================================================================
async function downloadWhatsAppMedia(mediaId: string): Promise<Buffer | null> {
  const apiKey = process.env.WHATSAPP_API_KEY || process.env.WHATSAPP_360_API_KEY || process.env.DIALOG_360_API_KEY;
  if (!apiKey) return null;

  try {
    // Step 1: Get media URL
    const urlResponse = await fetch(`https://waba-v2.360dialog.io/v1/media/${mediaId}`, {
      headers: { 'D360-API-KEY': apiKey }
    });

    if (!urlResponse.ok) {
      console.error('[HireInbox WA] Media URL fetch failed:', await urlResponse.text());
      return null;
    }

    const { url } = await urlResponse.json();

    // Step 2: Download the file
    const fileResponse = await fetch(url, {
      headers: { 'D360-API-KEY': apiKey }
    });

    if (!fileResponse.ok) {
      console.error('[HireInbox WA] Media download failed');
      return null;
    }

    const arrayBuffer = await fileResponse.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error('[HireInbox WA] Media download error:', error);
    return null;
  }
}

// ============================================================================
// TALENT MAPPING: Call our API (Recruiter flow)
// ============================================================================
async function runTalentMapping(prompt: string): Promise<any> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://hireinbox.co.za';

  const response = await fetch(`${baseUrl}/api/talent-mapping`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt })
  });

  if (!response.ok) {
    throw new Error(`API returned ${response.status}`);
  }

  return await response.json();
}

// ============================================================================
// CV ANALYSIS: Call our API (Job seeker flow)
// ============================================================================
async function analyzeCVFromText(cvText: string): Promise<any> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://hireinbox.co.za';

  const formData = new FormData();
  formData.append('cvText', cvText);

  const response = await fetch(`${baseUrl}/api/analyze-cv`, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    throw new Error(`CV analysis returned ${response.status}`);
  }

  return await response.json();
}

async function analyzeCVFromBuffer(buffer: Buffer, filename: string): Promise<any> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://hireinbox.co.za';

  const formData = new FormData();
  // Create ArrayBuffer copy and cast to satisfy strict TypeScript
  const arrayBuffer = buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength
  ) as ArrayBuffer;
  const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
  formData.append('cv', blob, filename);

  const response = await fetch(`${baseUrl}/api/analyze-cv`, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    throw new Error(`CV analysis returned ${response.status}`);
  }

  return await response.json();
}

// ============================================================================
// FORMAT RESULTS FOR WHATSAPP
// ============================================================================
function formatCandidatesForWhatsApp(results: any): string {
  const candidates = results.candidates || [];

  if (candidates.length === 0) {
    return 'No candidates found. Try broadening your search.';
  }

  let message = `*Found ${candidates.length} candidates:*\n\n`;

  const maxShow = Math.min(candidates.length, 5);
  for (let i = 0; i < maxShow; i++) {
    const c = candidates[i];
    const moveEmoji = c.resignationPropensity?.score === 'High' ? '🔥' :
                      c.resignationPropensity?.score === 'Medium' ? '⚡' : '❄️';

    message += `*${i + 1}. ${c.name}* - ${c.matchScore}% match\n`;
    message += `${c.currentRole} at ${c.company}\n`;
    message += `📍 ${c.location}\n`;
    message += `${moveEmoji} ${c.resignationPropensity?.score || 'Medium'} move likelihood\n`;

    if (c.uniqueValue) {
      const short = c.uniqueValue.length > 80 ? c.uniqueValue.slice(0, 80) + '...' : c.uniqueValue;
      message += `_"${short}"_\n`;
    }
    message += '\n';
  }

  message += `Reply 1-${maxShow} for details`;
  if (candidates.length > 5) {
    message += ` | "more" for rest`;
  }

  return message;
}

function formatCandidateDetail(candidate: any): string {
  let message = `*${candidate.name}*\n`;
  message += `${candidate.currentRole} at ${candidate.company}\n`;
  message += `📍 ${candidate.location}\n\n`;

  message += `*Match:* ${candidate.matchScore}%\n`;
  message += `*Move Likelihood:* ${candidate.resignationPropensity?.score || 'Medium'}\n\n`;

  if (candidate.uniqueValue) {
    message += `*Why they match:*\n${candidate.uniqueValue}\n\n`;
  }

  if (candidate.resignationPropensity?.factors?.length > 0) {
    message += `*Move signals:*\n`;
    for (const f of candidate.resignationPropensity.factors) {
      const arrow = f.impact === 'positive' ? '↑' : f.impact === 'negative' ? '↓' : '→';
      message += `${arrow} ${f.factor}: ${f.evidence}\n`;
    }
    message += '\n';
  }

  if (candidate.personalizedHook?.connectionAngle) {
    message += `*Approach:* ${candidate.personalizedHook.connectionAngle}\n`;
  }

  if (candidate.sources?.[0]?.url) {
    message += `\n🔗 ${candidate.sources[0].url}`;
  }

  return message;
}

// ============================================================================
// FORMAT CV ANALYSIS FOR WHATSAPP (Job seeker flow)
// ============================================================================
function formatCVAnalysisForWhatsApp(analysis: any): string {
  const score = analysis.overall_score || 0;
  const scoreEmoji = score >= 80 ? '🟢' : score >= 60 ? '🟡' : '🔴';

  let message = `*Your CV Score: ${scoreEmoji} ${score}/100*\n\n`;

  // First impression
  if (analysis.first_impression) {
    message += `_${analysis.first_impression}_\n\n`;
  }

  // Top 3 strengths
  if (analysis.strengths?.length > 0) {
    message += `*Your Strengths:*\n`;
    const topStrengths = analysis.strengths.slice(0, 3);
    for (const s of topStrengths) {
      message += `✅ ${s.strength}\n`;
    }
    message += '\n';
  }

  // Top 3 improvements
  if (analysis.improvements?.length > 0) {
    message += `*To Improve:*\n`;
    const topImprovements = analysis.improvements.slice(0, 3);
    for (const imp of topImprovements) {
      const priority = imp.priority === 'HIGH' ? '🔴' : imp.priority === 'MEDIUM' ? '🟡' : '🟢';
      message += `${priority} ${imp.area}\n`;
    }
    message += '\n';
  }

  // Quick wins
  if (analysis.quick_wins?.length > 0) {
    message += `*Quick Wins:*\n`;
    for (const qw of analysis.quick_wins.slice(0, 2)) {
      message += `💡 ${qw}\n`;
    }
    message += '\n';
  }

  // Career fit
  if (analysis.career_insights?.natural_fit_roles?.length > 0) {
    message += `*Best Fit Roles:* ${analysis.career_insights.natural_fit_roles.slice(0, 3).join(', ')}\n\n`;
  }

  return message;
}

// ============================================================================
// TALENT POOL: Save candidate to pool
// ============================================================================
async function saveToTalentPool(
  phoneNumber: string,
  name: string,
  cvText: string,
  analysis: any
): Promise<boolean> {
  try {
    const { error } = await supabase.from('talent_pool').insert({
      phone_number: phoneNumber,
      name: name,
      cv_text: cvText,
      overall_score: analysis.overall_score,
      current_title: analysis.current_title,
      years_experience: analysis.years_experience,
      education_level: analysis.education_level,
      natural_fit_roles: analysis.career_insights?.natural_fit_roles || [],
      industries: analysis.career_insights?.industries || [],
      full_analysis: analysis,
      opted_in_at: new Date().toISOString(),
      source: 'whatsapp'
    });

    if (error) {
      console.error('[HireInbox WA] Talent pool insert error:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('[HireInbox WA] Talent pool error:', error);
    return false;
  }
}

// ============================================================================
// LOG CV SCAN (for free scan tracking)
// ============================================================================
async function logCVScan(phoneNumber: string, analysis: any): Promise<void> {
  try {
    await supabase.from('whatsapp_cv_scans').insert({
      phone_number: phoneNumber,
      candidate_name: analysis.candidate_name,
      overall_score: analysis.overall_score,
      scanned_at: new Date().toISOString()
    });
  } catch {
    // Non-critical, continue
  }
}

// ============================================================================
// MESSAGE HANDLER: RECRUITER FLOW
// ============================================================================
async function handleRecruiterMessage(sender: string, text: string): Promise<void> {
  const lowerText = text.toLowerCase().trim();
  const state = getState(sender);

  // Handle greetings
  const greetings = ['hi', 'hello', 'hey', 'start', 'howzit', 'help'];
  if (greetings.some(g => lowerText === g)) {
    setState(sender, { ...state, step: 'awaiting_search', flow: 'recruiter' });
    await sendWhatsAppMessage(sender,
      'Hey! 👋 *HireInbox Talent Mapping*\n\n' +
      'Describe the role you\'re hiring for:\n\n' +
      '_Example: "CFO for fintech in Joburg, CA(SA), 10+ years"_'
    );
    return;
  }

  // Handle "more" command
  if (lowerText === 'more' && state.lastResults?.candidates?.length > 5) {
    let message = '*More candidates:*\n\n';
    const remaining = state.lastResults.candidates.slice(5);
    for (let i = 0; i < remaining.length; i++) {
      const c = remaining[i];
      message += `*${i + 6}. ${c.name}* - ${c.matchScore}%\n`;
      message += `${c.currentRole} at ${c.company}\n\n`;
    }
    await sendWhatsAppMessage(sender, message);
    return;
  }

  // Handle number selection
  const num = parseInt(lowerText);
  if (!isNaN(num) && num >= 1 && num <= 10 && state.lastResults?.candidates) {
    const candidate = state.lastResults.candidates[num - 1];
    if (candidate) {
      await sendWhatsAppMessage(sender, formatCandidateDetail(candidate));
      return;
    }
  }

  // Handle new search
  if (['new', 'search', 'again'].includes(lowerText)) {
    setState(sender, { ...state, step: 'awaiting_search' });
    await sendWhatsAppMessage(sender, 'Ready! 🔍 Describe the role.');
    return;
  }

  // Assume it's a search query if long enough
  if (text.length > 10) {
    setState(sender, { ...state, step: 'searching', lastSearch: text });

    const shortPrompt = text.length > 100 ? text.slice(0, 100) + '...' : text;
    await sendWhatsAppMessage(sender,
      `🔍 Searching for:\n_"${shortPrompt}"_\n\n30-60 seconds...`
    );

    try {
      const results = await runTalentMapping(text);
      setState(sender, { ...state, step: 'results_shown', lastSearch: text, lastResults: results });
      await sendWhatsAppMessage(sender, formatCandidatesForWhatsApp(results));

      // Log usage (non-critical, ignore errors)
      try {
        await supabase.from('pilot_usage_log').insert({
          phone_number: sender,
          action: 'whatsapp_talent_mapping',
          details: { prompt: text, candidateCount: results.candidates?.length || 0 },
          estimated_cost: 0.72
        });
      } catch { /* ignore logging errors */ }

    } catch (error) {
      console.error('[HireInbox WA] Search failed:', error);
      await sendWhatsAppMessage(sender, 'Search failed. Try again or contact simon@hireinbox.co.za');
    }
    return;
  }

  // Default
  await sendWhatsAppMessage(sender,
    'Send a job description to search, or say "hi" for help.'
  );
}

// ============================================================================
// MESSAGE HANDLER: JOB SEEKER FLOW
// ============================================================================
async function handleJobSeekerMessage(sender: string, text: string): Promise<void> {
  const lowerText = text.toLowerCase().trim();
  const state = getState(sender);

  // Handle greetings - show menu
  const greetings = ['hi', 'hello', 'hey', 'start', 'howzit', 'help', 'menu'];
  if (greetings.some(g => lowerText === g)) {
    const scansUsed = await getFreeScansUsed(sender);
    const freeRemaining = scansUsed < 1 ? 1 : 0;

    setState(sender, { ...state, step: 'menu', flow: 'jobseeker', freeScansUsed: scansUsed });

    await sendWhatsAppMessage(sender,
      '*HireInbox CV Scanner* 📄\n\n' +
      'Get instant AI feedback on your CV!\n\n' +
      `🆓 Free scans remaining: *${freeRemaining}*\n\n` +
      '*How it works:*\n' +
      '1️⃣ Send your CV (PDF or paste text)\n' +
      '2️⃣ Get your score + feedback in 30 seconds\n' +
      '3️⃣ Optionally join our talent pool\n\n' +
      '_Recruiters search our pool daily for roles!_\n\n' +
      '👉 *Send your CV to get started*'
    );
    return;
  }

  // Handle talent pool opt-in confirmation
  if (state.step === 'awaiting_optin') {
    if (['yes', 'y', 'join', 'opt in', 'optin', '1'].includes(lowerText)) {
      const success = await saveToTalentPool(
        sender,
        state.candidateName || 'Unknown',
        state.cvText || '',
        state.lastCVAnalysis
      );

      if (success) {
        await sendWhatsAppMessage(sender,
          '✅ *You\'re in the talent pool!*\n\n' +
          'Recruiters can now find you for matching roles.\n\n' +
          'We\'ll WhatsApp you when there\'s a match. Good luck! 🍀\n\n' +
          '_Reply "hi" to scan another CV_'
        );
      } else {
        await sendWhatsAppMessage(sender,
          'Oops! Something went wrong. Please try again or contact simon@hireinbox.co.za'
        );
      }

      setState(sender, { ...state, step: 'complete', flow: 'jobseeker' });
      return;
    }

    if (['no', 'n', 'skip', '2'].includes(lowerText)) {
      await sendWhatsAppMessage(sender,
        'No problem! Your CV was NOT saved to our pool.\n\n' +
        'Want another scan? Just send your CV.\n\n' +
        '_Reply "hi" for the menu_'
      );
      setState(sender, { ...state, step: 'complete', flow: 'jobseeker' });
      return;
    }
  }

  // Handle pasted CV text (if it looks like a CV - long text with common CV keywords)
  const cvKeywords = ['experience', 'education', 'skills', 'employment', 'work history', 'qualifications', 'cv', 'resume', 'curriculum'];
  const looksLikeCV = text.length > 200 && cvKeywords.some(k => lowerText.includes(k));

  if (looksLikeCV) {
    // Check free scan limit
    const scansUsed = await getFreeScansUsed(sender);
    if (scansUsed >= 1) {
      await sendWhatsAppMessage(sender,
        '😅 You\'ve used your free scan!\n\n' +
        'Get unlimited CV scans at *hireinbox.co.za*\n\n' +
        'Or contact simon@hireinbox.co.za for access.'
      );
      return;
    }

    setState(sender, { ...state, step: 'analyzing', flow: 'jobseeker', cvText: text });
    await sendWhatsAppMessage(sender,
      '📄 *Analyzing your CV...*\n\nThis takes about 30 seconds.'
    );

    try {
      const result = await analyzeCVFromText(text);

      if (!result.success || !result.analysis) {
        throw new Error('Analysis failed');
      }

      const analysis = result.analysis;

      // Log the scan
      await logCVScan(sender, analysis);

      // Send results
      await sendWhatsAppMessage(sender, formatCVAnalysisForWhatsApp(analysis));

      // Offer talent pool
      setState(sender, {
        ...state,
        step: 'awaiting_optin',
        flow: 'jobseeker',
        lastCVAnalysis: analysis,
        candidateName: analysis.candidate_name,
        cvText: text
      });

      await sendWhatsAppMessage(sender,
        '*Join our Talent Pool?*\n\n' +
        'Recruiters search our pool for candidates daily.\n' +
        'We\'ll notify you when there\'s a match.\n\n' +
        'Reply *YES* to join or *NO* to skip.'
      );

    } catch (error) {
      console.error('[HireInbox WA] CV analysis failed:', error);
      await sendWhatsAppMessage(sender,
        'Analysis failed. Please try again or visit hireinbox.co.za\n\n' +
        'Tip: Make sure your CV text is complete.'
      );
    }
    return;
  }

  // Default: prompt for CV
  await sendWhatsAppMessage(sender,
    'I need your CV to analyze! 📄\n\n' +
    '*Options:*\n' +
    '• Send a PDF document\n' +
    '• Paste your CV text\n\n' +
    '_Reply "hi" for help_'
  );
}

// ============================================================================
// DOCUMENT HANDLER: CV uploads
// ============================================================================
async function handleDocument(sender: string, document: any): Promise<void> {
  const state = getState(sender);

  // Check if it's a recruiter
  const authorized = await isAuthorized(sender);
  if (authorized) {
    await sendWhatsAppMessage(sender,
      'Documents aren\'t needed for talent mapping.\n\n' +
      'Just describe the role you\'re hiring for!'
    );
    return;
  }

  // Job seeker - process CV
  const filename = document.filename || 'cv.pdf';
  const mimeType = document.mime_type || '';
  const mediaId = document.id;

  // Validate file type
  const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  const validExtensions = ['.pdf', '.doc', '.docx'];

  const hasValidMime = validTypes.some(t => mimeType.includes(t));
  const hasValidExt = validExtensions.some(e => filename.toLowerCase().endsWith(e));

  if (!hasValidMime && !hasValidExt) {
    await sendWhatsAppMessage(sender,
      'Please send a PDF or Word document (.pdf, .doc, .docx)\n\n' +
      'Or you can paste your CV text directly.'
    );
    return;
  }

  // Check free scan limit
  const scansUsed = await getFreeScansUsed(sender);
  if (scansUsed >= 1) {
    await sendWhatsAppMessage(sender,
      '😅 You\'ve used your free scan!\n\n' +
      'Get unlimited CV scans at *hireinbox.co.za*\n\n' +
      'Or contact simon@hireinbox.co.za for access.'
    );
    return;
  }

  setState(sender, { ...state, step: 'downloading', flow: 'jobseeker' });
  await sendWhatsAppMessage(sender,
    '📥 *Downloading your CV...*'
  );

  // Download the file
  const buffer = await downloadWhatsAppMedia(mediaId);
  if (!buffer) {
    await sendWhatsAppMessage(sender,
      'Couldn\'t download your file. Please try again or paste your CV text instead.'
    );
    return;
  }

  setState(sender, { ...state, step: 'analyzing', flow: 'jobseeker' });
  await sendWhatsAppMessage(sender,
    '📄 *Analyzing your CV...*\n\nThis takes about 30 seconds.'
  );

  try {
    const result = await analyzeCVFromBuffer(buffer, filename);

    if (!result.success || !result.analysis) {
      throw new Error('Analysis failed');
    }

    const analysis = result.analysis;
    const cvText = result.originalCV || '';

    // Log the scan
    await logCVScan(sender, analysis);

    // Send results
    await sendWhatsAppMessage(sender, formatCVAnalysisForWhatsApp(analysis));

    // Offer talent pool
    setState(sender, {
      ...state,
      step: 'awaiting_optin',
      flow: 'jobseeker',
      lastCVAnalysis: analysis,
      candidateName: analysis.candidate_name,
      cvText: cvText
    });

    await sendWhatsAppMessage(sender,
      '*Join our Talent Pool?*\n\n' +
      'Recruiters search our pool for candidates daily.\n' +
      'We\'ll notify you when there\'s a match.\n\n' +
      'Reply *YES* to join or *NO* to skip.'
    );

  } catch (error) {
    console.error('[HireInbox WA] CV document analysis failed:', error);
    await sendWhatsAppMessage(sender,
      'Couldn\'t read your CV. Please:\n' +
      '• Try a different PDF\n' +
      '• Or paste your CV text instead\n\n' +
      '_Some PDFs are image-only and can\'t be read_'
    );
  }
}

// ============================================================================
// MAIN MESSAGE ROUTER
// ============================================================================
async function handleMessage(sender: string, text: string): Promise<void> {
  // Check if recruiter or job seeker
  const authorized = await isAuthorized(sender);

  if (authorized) {
    await handleRecruiterMessage(sender, text);
  } else {
    await handleJobSeekerMessage(sender, text);
  }
}

// ============================================================================
// WEBHOOK HANDLERS
// ============================================================================

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const mode = params.get('hub.mode');
  const token = params.get('hub.verify_token');
  const challenge = params.get('hub.challenge');

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log('[HireInbox WA] Webhook verified');
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('X-Hub-Signature-256');

    if (!verifyWebhookSignature(rawBody, signature)) {
      console.error('[HireInbox WA] Invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
    }

    const payload = JSON.parse(rawBody);

    for (const entry of payload.entry || []) {
      for (const change of entry.changes || []) {
        const messages = change.value?.messages || [];

        for (const message of messages) {
          const sender = message.from;
          const messageId = message.id;

          if (isDuplicate(messageId)) {
            console.log(`[HireInbox WA] Duplicate: ${messageId.slice(0, 10)}...`);
            continue;
          }

          if (!checkRateLimit(sender)) {
            console.log(`[HireInbox WA] Rate limited: ${sender.slice(0, 6)}...`);
            continue;
          }

          console.log(`[HireInbox WA] Message from ${sender.slice(0, 6)}...: ${message.type}`);

          if (message.type === 'text' && message.text?.body) {
            await handleMessage(sender, message.text.body);
          }

          // Handle document uploads (CV PDFs)
          if (message.type === 'document' && message.document) {
            await handleDocument(sender, message.document);
          }

          // Handle images (sometimes people send CV screenshots)
          if (message.type === 'image') {
            await sendWhatsAppMessage(sender,
              'I can\'t read images of CVs yet.\n\n' +
              'Please send a *PDF* or *paste your CV text*.'
            );
          }

          if (message.type === 'audio') {
            await sendWhatsAppMessage(sender,
              'Got your voice note! 🎙️\n\n' +
              'For job seekers: Please send your CV as a PDF or paste the text.\n\n' +
              'For recruiters: Please type your search query.'
            );
          }
        }
      }
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('[HireInbox WA] Webhook error:', error);
    return NextResponse.json({ status: 'ok' }); // Always 200 to prevent retries
  }
}
