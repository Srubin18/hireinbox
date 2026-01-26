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
    const response = await fetch('https://waba-v2.360dialog.io/messages', {
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
  // Owner pending document (when they need to choose 1 or 2)
  pendingDocument?: any;
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

/**
 * Transform Facebook CDN URL to 360dialog proxy URL
 *
 * 360dialog returns URLs like:
 * https://lookaside.fbsbx.com\/whatsapp_business\/attachments\/?mid=...&ext=...&hash=...
 *
 * We need to convert to:
 * https://waba-v2.360dialog.io/whatsapp_business/attachments/?mid=...&ext=...&hash=...
 */
function transformMediaUrl(originalUrl: string): string {
  if (!originalUrl) {
    console.log('[HireInbox WA] transformMediaUrl: Empty URL');
    return originalUrl;
  }

  console.log('[HireInbox WA] transformMediaUrl INPUT:', originalUrl);

  // Already transformed
  if (originalUrl.includes('waba-v2.360dialog.io')) {
    console.log('[HireInbox WA] transformMediaUrl: Already 360dialog URL');
    return originalUrl;
  }

  // Step 1: Remove escaped backslashes (JSON escaping from 360dialog response)
  let cleanUrl = originalUrl.replace(/\\/g, '');
  console.log('[HireInbox WA] transformMediaUrl after backslash removal:', cleanUrl);

  // Step 2: Replace Facebook CDN host with 360dialog proxy
  if (cleanUrl.includes('lookaside.fbsbx.com')) {
    cleanUrl = cleanUrl.replace('https://lookaside.fbsbx.com', 'https://waba-v2.360dialog.io');
    console.log('[HireInbox WA] transformMediaUrl OUTPUT:', cleanUrl);
    return cleanUrl;
  }

  // Unknown URL format - log and return as-is
  console.log('[HireInbox WA] transformMediaUrl: Unknown URL format, returning as-is');
  return cleanUrl;
}

async function downloadWhatsAppMedia(mediaId: string): Promise<Buffer | null> {
  const apiKey = process.env.WHATSAPP_API_KEY || process.env.WHATSAPP_360_API_KEY || process.env.DIALOG_360_API_KEY;
  if (!apiKey) {
    console.error('[HireInbox WA] FATAL: No API key configured');
    return null;
  }

  console.log('[HireInbox WA] ====== MEDIA DOWNLOAD START ======');
  console.log('[HireInbox WA] Media ID:', mediaId);
  console.log('[HireInbox WA] API Key (first 10 chars):', apiKey.slice(0, 10) + '...');

  try {
    // Wait for media to propagate (not immediately available after webhook)
    console.log('[HireInbox WA] Waiting 2s for media propagation...');
    await new Promise(r => setTimeout(r, 2000));

    // Step 1: Get media info (URL + mime type)
    const mediaInfoUrl = `https://waba-v2.360dialog.io/${mediaId}`;
    console.log('[HireInbox WA] Step 1: Fetching media info from:', mediaInfoUrl);

    const urlResponse = await fetch(mediaInfoUrl, {
      headers: { 'D360-API-KEY': apiKey }
    });

    console.log('[HireInbox WA] Media info response status:', urlResponse.status);
    console.log('[HireInbox WA] Media info response headers:', JSON.stringify(Object.fromEntries(urlResponse.headers.entries())));

    if (!urlResponse.ok) {
      const errorText = await urlResponse.text();
      console.error('[HireInbox WA] Step 1 FAILED - Media URL fetch error');
      console.error('[HireInbox WA] Status:', urlResponse.status);
      console.error('[HireInbox WA] Error body:', errorText);
      return null;
    }

    const mediaInfoText = await urlResponse.text();
    console.log('[HireInbox WA] Raw media info response:', mediaInfoText.slice(0, 500));

    let mediaInfo;
    try {
      mediaInfo = JSON.parse(mediaInfoText);
    } catch (parseError) {
      console.error('[HireInbox WA] Failed to parse media info JSON:', parseError);
      return null;
    }

    console.log('[HireInbox WA] Parsed media info:', JSON.stringify(mediaInfo));

    if (!mediaInfo.url) {
      console.error('[HireInbox WA] Step 1 FAILED - No URL in media response');
      console.error('[HireInbox WA] Full response:', JSON.stringify(mediaInfo));
      return null;
    }

    // Step 2: Transform URL (Facebook CDN -> 360dialog proxy)
    console.log('[HireInbox WA] Step 2: Transforming URL...');
    const downloadUrl = transformMediaUrl(mediaInfo.url);
    console.log('[HireInbox WA] Final download URL:', downloadUrl);

    // Step 3: Download the actual file
    console.log('[HireInbox WA] Step 3: Downloading file...');

    const fileResponse = await fetch(downloadUrl, {
      headers: {
        'D360-API-KEY': apiKey,
        'Accept': '*/*'
      },
      redirect: 'follow'  // Follow 308 redirects
    });

    console.log('[HireInbox WA] Download response status:', fileResponse.status);
    console.log('[HireInbox WA] Download response headers:', JSON.stringify(Object.fromEntries(fileResponse.headers.entries())));

    if (!fileResponse.ok) {
      const errorText = await fileResponse.text();
      console.error('[HireInbox WA] Step 3 FAILED - Media download error');
      console.error('[HireInbox WA] Status:', fileResponse.status);
      console.error('[HireInbox WA] Error body:', errorText.slice(0, 500));

      // Try alternative: direct download from Facebook CDN (may work in some cases)
      if (mediaInfo.url && !mediaInfo.url.includes('waba-v2.360dialog.io')) {
        console.log('[HireInbox WA] Attempting direct Facebook CDN download as fallback...');
        const directUrl = mediaInfo.url.replace(/\\/g, '');
        console.log('[HireInbox WA] Direct URL:', directUrl);

        const directResponse = await fetch(directUrl, {
          headers: { 'Authorization': `Bearer ${apiKey}` },
          redirect: 'follow'
        });

        console.log('[HireInbox WA] Direct download status:', directResponse.status);

        if (directResponse.ok) {
          const arrayBuffer = await directResponse.arrayBuffer();
          console.log(`[HireInbox WA] Direct download SUCCESS: ${arrayBuffer.byteLength} bytes`);
          console.log('[HireInbox WA] ====== MEDIA DOWNLOAD END (via direct) ======');
          return Buffer.from(arrayBuffer);
        } else {
          console.error('[HireInbox WA] Direct download also failed:', directResponse.status);
        }
      }

      return null;
    }

    const contentType = fileResponse.headers.get('content-type');
    console.log('[HireInbox WA] Content-Type:', contentType);

    const arrayBuffer = await fileResponse.arrayBuffer();
    console.log(`[HireInbox WA] Downloaded ${arrayBuffer.byteLength} bytes`);

    // Validate we got actual file content (not an error page)
    if (arrayBuffer.byteLength < 100) {
      console.error('[HireInbox WA] Downloaded file too small, likely an error');
      const text = new TextDecoder().decode(arrayBuffer);
      console.error('[HireInbox WA] Content:', text);
      return null;
    }

    console.log('[HireInbox WA] ====== MEDIA DOWNLOAD END (SUCCESS) ======');
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error('[HireInbox WA] Media download EXCEPTION:', error);
    console.error('[HireInbox WA] Error stack:', error instanceof Error ? error.stack : 'No stack');
    console.log('[HireInbox WA] ====== MEDIA DOWNLOAD END (ERROR) ======');
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

  // Reminder to view other candidates
  message += '\n\n---\n_Reply 1-5 for other candidates | "new" for new search_';

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
    // Use whatsapp_talent_pool table (separate from B2B talent_pool which requires company_id)
    const { error } = await supabase.from('whatsapp_talent_pool').upsert({
      phone_number: phoneNumber,
      name: name,
      cv_text: cvText,
      overall_score: analysis.overall_score,
      current_title: analysis.current_title,
      years_experience: String(analysis.years_experience || ''),
      education_level: analysis.education_level,
      natural_fit_roles: analysis.career_insights?.natural_fit_roles || [],
      industries: analysis.career_insights?.industries || [],
      full_analysis: analysis,
      opted_in_at: new Date().toISOString(),
      source: 'whatsapp'
    }, {
      onConflict: 'phone_number',
      ignoreDuplicates: false // Update existing record
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
      `🔍 Searching for:\n_"${shortPrompt}"_\n\n1-3 minutes...`
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
// EXTRACT TEXT FROM PDF (for job specs)
// ============================================================================
async function extractTextFromPDF(buffer: Buffer): Promise<string | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://hireinbox.co.za';
    const formData = new FormData();
    const arrayBuffer = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength
    ) as ArrayBuffer;
    const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
    formData.append('file', blob, 'jobspec.pdf');

    const response = await fetch(`${baseUrl}/api/extract-text`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data.text || null;
  } catch {
    return null;
  }
}

// ============================================================================
// DOCUMENT HANDLER: CV uploads (job seekers) & Job specs (recruiters)
// ============================================================================
async function handleDocument(sender: string, document: any): Promise<void> {
  const state = getState(sender);
  const isSuperOwnerUser = isSuperOwner(sender);
  const isRecruiterTesterUser = isRecruiterTester(sender);
  const authorized = await isAuthorized(sender);

  console.log(`[HireInbox WA] handleDocument - superOwner: ${isSuperOwnerUser}, recruiterTester: ${isRecruiterTesterUser}, authorized: ${authorized}, flow: ${state.flow}`);

  // Determine if document should be processed as job spec (recruiter) or CV (jobseeker)
  // - Super owner (Simon): respect their explicit flow choice (they chose 1 or 2)
  // - Recruiter testers: ALWAYS job spec (recruiter mode only)
  // - DB authorized: job spec
  // - Everyone else: CV (jobseeker)
  let shouldProcessAsJobSpec: boolean;
  if (isSuperOwnerUser) {
    shouldProcessAsJobSpec = state.flow === 'recruiter';
  } else if (isRecruiterTesterUser) {
    shouldProcessAsJobSpec = true; // Recruiter testers ONLY get recruiter mode
  } else {
    shouldProcessAsJobSpec = authorized;
  }

  if (shouldProcessAsJobSpec) {
    const filename = document.filename || 'jobspec.pdf';
    const mediaId = document.id;

    await sendWhatsAppMessage(sender, '📥 *Downloading your document...*');

    const buffer = await downloadWhatsAppMedia(mediaId);
    if (!buffer) {
      await sendWhatsAppMessage(sender,
        'Couldn\'t download the file. Please paste the text instead.'
      );
      return;
    }

    await sendWhatsAppMessage(sender, '📄 *Extracting job requirements...*');

    const jobSpecText = await extractTextFromPDF(buffer);
    if (!jobSpecText || jobSpecText.length < 50) {
      await sendWhatsAppMessage(sender,
        'Couldn\'t read the PDF. Please paste the job description as text instead.\n\n' +
        '_Some PDFs are image-only and can\'t be read._'
      );
      return;
    }

    // Now run talent mapping with the extracted text
    setState(sender, { ...state, step: 'searching', lastSearch: jobSpecText, flow: 'recruiter' });

    const shortPrompt = jobSpecText.length > 100 ? jobSpecText.slice(0, 100) + '...' : jobSpecText;
    await sendWhatsAppMessage(sender,
      `🔍 *Searching for candidates matching:*\n_"${shortPrompt}"_\n\n1-3 minutes...`
    );

    try {
      const results = await runTalentMapping(jobSpecText);
      setState(sender, { ...state, step: 'results_shown', lastSearch: jobSpecText, lastResults: results, flow: 'recruiter' });
      await sendWhatsAppMessage(sender, formatCandidatesForWhatsApp(results));

      // Log usage
      try {
        await supabase.from('pilot_usage_log').insert({
          phone_number: sender,
          action: 'whatsapp_talent_mapping_pdf',
          details: { promptLength: jobSpecText.length, candidateCount: results.candidates?.length || 0 },
          estimated_cost: 0.72
        });
      } catch { /* ignore */ }

    } catch (error) {
      console.error('[HireInbox WA] PDF talent mapping failed:', error);
      await sendWhatsAppMessage(sender, 'Search failed. Try again or paste the job description as text.');
    }
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
  console.log(`[HireInbox WA] Starting media download for job seeker CV: ${mediaId}`);
  const buffer = await downloadWhatsAppMedia(mediaId);
  if (!buffer) {
    console.error(`[HireInbox WA] Media download failed for: ${mediaId}`);
    await sendWhatsAppMessage(sender,
      'Couldn\'t download your file. Please try again or paste your CV text instead.\n\n' +
      '_Tip: You can also copy-paste your CV text directly into the chat._'
    );
    return;
  }
  console.log(`[HireInbox WA] Media download successful: ${buffer.length} bytes`);

  setState(sender, { ...state, step: 'analyzing', flow: 'jobseeker' });
  await sendWhatsAppMessage(sender,
    '📄 *Analyzing your CV...*\n\nThis takes about 30 seconds.'
  );

  try {
    const result = await analyzeCVFromBuffer(buffer, filename);

    if (!result.success || !result.analysis) {
      console.error('[HireInbox WA] CV analysis returned no result:', result);
      throw new Error('Analysis returned no result');
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Provide more specific error messages
    let userMessage = 'Couldn\'t read your CV. Please:\n' +
      '- Try a different PDF\n' +
      '- Or paste your CV text instead\n\n' +
      '_Some PDFs are image-only and can\'t be read_';

    if (errorMessage.includes('Rate limit') || errorMessage.includes('429')) {
      userMessage = 'We\'re experiencing high demand. Please try again in a minute.';
    } else if (errorMessage.includes('timeout') || errorMessage.includes('Timeout')) {
      userMessage = 'Analysis took too long. Please try again with a smaller CV file.';
    }

    await sendWhatsAppMessage(sender, userMessage);
  }
}

// ============================================================================
// ACCESS CONTROL
// ============================================================================

// SUPER OWNER: Simon only - gets both recruiter AND jobseeker modes
const SUPER_OWNER = '27721172137'; // Simon

// TESTER NUMBERS: These get recruiter mode ONLY (talent mapping)
const RECRUITER_TESTERS = [
  '27827832892',  // Tester 1
  '27829245253',  // Tester 2
  '27721441733',  // Tester 3
  '27823093387',  // Marcel
  '27814877909',  // Bernard
  '27728103109',  // Modicai
];

// Super owner gets both modes with menu
function isSuperOwner(phoneNumber: string): boolean {
  return phoneNumber === SUPER_OWNER;
}

// Recruiter testers get recruiter mode only (no menu, no jobseeker)
function isRecruiterTester(phoneNumber: string): boolean {
  return RECRUITER_TESTERS.includes(phoneNumber);
}

// Legacy function - now only returns true for super owner
function isOwner(phoneNumber: string): boolean {
  return isSuperOwner(phoneNumber);
}

// ============================================================================
// OWNER MENU HANDLER
// ============================================================================
async function handleOwnerMessage(sender: string, text: string): Promise<void> {
  const lowerText = text.toLowerCase().trim();
  const state = getState(sender);

  // Handle pending document choice (owner uploaded a doc and needs to choose 1 or 2)
  if (state.step === 'pending_document' && state.pendingDocument) {
    const pendingDoc = state.pendingDocument; // Save before clearing!

    if (lowerText === '1' || lowerText === 'job spec' || lowerText === 'jobspec') {
      // Process as job spec (recruiter mode)
      console.log('[HireInbox WA] Owner chose 1 (Job Spec) for pending document');
      setState(sender, { ...state, step: 'processing', flow: 'recruiter', pendingDocument: undefined });
      await handleDocument(sender, pendingDoc);
      return;
    }
    if (lowerText === '2' || lowerText === 'cv' || lowerText === 'my cv') {
      // Process as CV (job seeker mode)
      console.log('[HireInbox WA] Owner chose 2 (CV) for pending document');
      setState(sender, { ...state, step: 'processing', flow: 'jobseeker', pendingDocument: undefined });
      await handleDocument(sender, pendingDoc);
      return;
    }
    // Invalid response - ask again
    await sendWhatsAppMessage(sender,
      'Please reply *1* (Job Spec) or *2* (My CV)'
    );
    return;
  }

  // IMPORTANT: If already in a flow with results, route to that handler FIRST
  // This allows viewing multiple candidates without mode switching
  if (state.flow === 'recruiter' && state.lastResults?.candidates) {
    // Check if it's a number for candidate selection (1-10)
    const num = parseInt(lowerText);
    if (!isNaN(num) && num >= 1 && num <= 10) {
      await handleRecruiterMessage(sender, text);
      return;
    }
    // Also handle "more" and "new" in recruiter mode
    if (['more', 'new', 'search', 'again'].includes(lowerText)) {
      await handleRecruiterMessage(sender, text);
      return;
    }
  }

  // Handle "menu" to show options again
  if (lowerText === 'menu' || lowerText === 'hi' || lowerText === 'hello' || lowerText === 'start') {
    setState(sender, { step: 'owner_menu', flow: 'jobseeker' }); // Reset state
    await sendWhatsAppMessage(sender,
      '*HireInbox Test Menu* 🧪\n\n' +
      'You have access to both modes:\n\n' +
      '*1.* Recruiter - Talent Mapping\n' +
      '*2.* Job Seeker - CV Scanner\n\n' +
      'Reply *1* or *2* to choose.'
    );
    return;
  }

  // Handle mode selection (only when not in a flow with results)
  if (lowerText === '1' || lowerText === 'recruiter' || lowerText === 'talent') {
    setState(sender, { ...state, flow: 'recruiter', step: 'awaiting_search' });
    await sendWhatsAppMessage(sender,
      '*Recruiter Mode* 🔍\n\n' +
      'Describe the role you\'re hiring for:\n\n' +
      '_Example: "CFO for fintech in Joburg, CA(SA), 10+ years"_\n\n' +
      'Or send a PDF job spec!\n\n' +
      '_Reply "menu" to switch modes_'
    );
    return;
  }

  if (lowerText === '2' || lowerText === 'jobseeker' || lowerText === 'cv') {
    setState(sender, { ...state, flow: 'jobseeker', step: 'menu' });
    await sendWhatsAppMessage(sender,
      '*Job Seeker Mode* 📄\n\n' +
      'Send your CV (PDF or paste text) for instant AI feedback!\n\n' +
      '_Reply "menu" to switch modes_'
    );
    return;
  }

  // If already in a flow, route to that handler
  if (state.flow === 'recruiter') {
    await handleRecruiterMessage(sender, text);
    return;
  }

  if (state.flow === 'jobseeker') {
    await handleJobSeekerMessage(sender, text);
    return;
  }

  // Default: show menu
  setState(sender, { ...state, step: 'owner_menu' });
  await sendWhatsAppMessage(sender,
    '*HireInbox Test Menu* 🧪\n\n' +
    'You have access to both modes:\n\n' +
    '*1.* Recruiter - Talent Mapping\n' +
    '*2.* Job Seeker - CV Scanner\n\n' +
    'Reply *1* or *2* to choose.'
  );
}

// ============================================================================
// MAIN MESSAGE ROUTER
// ============================================================================
async function handleMessage(sender: string, text: string): Promise<void> {
  // Super owner (Simon) gets dual-mode access with menu
  if (isSuperOwner(sender)) {
    await handleOwnerMessage(sender, text);
    return;
  }

  // Recruiter testers get recruiter mode only (no menu)
  if (isRecruiterTester(sender)) {
    await handleRecruiterMessage(sender, text);
    return;
  }

  // Check if recruiter (from database) or job seeker
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

          // Handle document uploads (CV PDFs for job seekers, Job specs for recruiters)
          if (message.type === 'document' && message.document) {
            // SUPER OWNER (Simon) only: Ask what the document is for (both modes)
            if (isSuperOwner(sender)) {
              const state = getState(sender);
              // Save the document info and ask what it's for
              setState(sender, {
                ...state,
                step: 'pending_document',
                pendingDocument: message.document
              });
              await sendWhatsAppMessage(sender,
                '📄 Got your document!\n\n' +
                'What would you like to do?\n\n' +
                '*1.* Analyze as *Job Spec* (find matching candidates)\n' +
                '*2.* Analyze as *My CV* (get feedback)\n\n' +
                'Reply *1* or *2*'
              );
              continue;
            }
            // Everyone else: process document normally (recruiters → job spec, others → CV)
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
