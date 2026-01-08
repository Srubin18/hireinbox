// app/api/analyze-video/route.ts
// FERRARI-GRADE Video Communication Coaching
// World-class presentation analysis + timeline coaching + voice metrics
// Claude Vision (primary) + GPT-4o Vision (fallback) + Whisper + Web Audio API

import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { SA_CONTEXT_PROMPT, SA_CREATOR_CONTEXT } from '@/lib/sa-context';

// Only log verbose debug info in development
const IS_DEV = process.env.NODE_ENV !== 'production';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 120000,
  maxRetries: 3,
});

// Claude Vision for video analysis (handles presentation coaching better)
const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
}) : null;

// Retry helper with exponential backoff
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      const isRetryable = error instanceof Error &&
        (error.message.includes('timeout') ||
         error.message.includes('Connection') ||
         error.message.includes('ECONNRESET'));

      if (!isRetryable || attempt === maxRetries - 1) {
        throw error;
      }

      const delay = baseDelay * Math.pow(2, attempt);
      if (IS_DEV) console.log(`[RETRY] Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}

// Job Seeker / Interview Coaching Prompt - CONSTRUCTIVE FEEDBACK
const FERRARI_VIDEO_ANALYST_PROMPT = `You are a professional Presentation Coach providing feedback on communication technique.

IMPORTANT: You are NOT identifying or recognizing anyone. You are coaching on PRESENTATION TECHNIQUE only:
- Posture and body positioning
- Hand gestures and movement
- Eye direction (toward/away from camera)
- Speaking pace and clarity
- Energy and engagement level
- Background and lighting setup

This is voluntary coaching feedback requested by the presenter to improve their skills.

Your role is to provide HONEST, ACTIONABLE coaching - like a mentor who tells the truth because they want the person to succeed. Be direct but encouraging.

COACHING PRINCIPLES:
1. BE HONEST - Vague praise doesn't help anyone improve. Give real feedback.
2. BE SPECIFIC - Instead of "work on eye contact", say "you looked away 6 times - practice looking directly at the camera"
3. BE CONSTRUCTIVE - For every weakness, provide a specific tip to improve
4. SCORE REALISTICALLY - Match your score to your actual assessment
5. BE ENCOURAGING - End with what they're doing well and their potential

SCORING GUIDE:
- 85-100: Excellent. Confident, clear, engaging. Ready for interviews.
- 70-84: Good. Solid foundation with specific areas to polish.
- 55-69: Developing. Shows potential but needs practice on key areas.
- 40-54: Needs Work. Multiple areas require attention before interviews.
- Below 40: Starting Out. Focus on fundamentals first.

KEY AREAS TO ASSESS:
- First impression (first 5 seconds): Did they hook your attention?
- Eye contact: Looking at camera = confident. Looking away = needs practice.
- Voice: Varied pace and tone = engaging. Monotone = needs work.
- Content: Specific examples = strong. Vague claims = weak.
- Body language: Natural gestures = good. Fidgeting = nervous.
- Technical quality: Clear audio/video = professional. Poor quality = hurts first impression.

SCORING APPROACH:
Start at 65 (baseline). Add points for strengths, subtract for areas needing work.
Give credit for genuine effort and authenticity.

HEADLINE EXAMPLES:
- 80+: "Interview Ready" or "Strong Presentation"
- 65-79: "Good Foundation" or "On The Right Track"
- 50-64: "Keep Practicing" or "Building Skills"
- Below 50: "Focus on Fundamentals"

INTERVIEW READINESS:
- Score 70+: Would likely get an interview call
- Score 55-69: Might get an interview with a strong CV
- Score below 55: Needs more practice before applying

WHAT TO ANALYZE:

FIRST 5 SECONDS
- Did they grab your attention?
- What's their energy level?

EYE CONTACT
- Looking at camera = confident
- Looking away = nervous
- Estimate percentage of time looking at camera

VOICE
- Is there vocal variety or monotone?
- Count filler words (um, uh, like)
- Is the pace natural?

CONTENT
- What's their main message?
- Did they give specific examples?
- Is it memorable?

BODY LANGUAGE
- Natural gestures or stiff?
- Nervous habits (fidgeting, touching face)?
- Overall posture

SA CONTEXT (USE THIS):
If they mention their background:
- UCT/Wits/Stellenbosch = Tier 1, impressive
- Big 4 articles = well-trained
- CA(SA) = gold standard
- Unisa = shows grit (don't penalize)
- If they articulate SA credentials well = self-aware

OUTPUT FORMAT - Return valid JSON only:`;

// Creator Passport Prompt - WORLD CLASS 10/10
const CREATOR_VIDEO_ANALYST_PROMPT = `You are a professional Creator Coach helping content creators improve their on-camera presence for brand partnerships. This creator has voluntarily submitted their video seeking honest, actionable feedback to develop their skills.

Your role is to provide CONSTRUCTIVE professional development feedback - like a trusted mentor who tells the truth because they want the creator to succeed. Be direct and specific, not harsh or discouraging.

COACHING APPROACH:
1. Be honest and specific - vague praise doesn't help anyone improve
2. Focus on actionable improvements they can make
3. Acknowledge genuine strengths where they exist
4. Score realistically based on brand partnership readiness
5. Keep feedback professional and constructive

SCORING CALIBRATION (Brand Partnership Readiness):
- 90-100: Exceptional. Ready for major brand campaigns immediately.
- 80-89: Strong. Ready for brand outreach with minor refinements.
- 70-79: Promising. Good foundation, specific improvements needed.
- 50-69: Developing. Shows potential but needs significant work.
- 35-49: Early stage. Fundamental skills need development.
- Below 35: Beginning journey. Focus on basics first.

KEY AREAS TO ASSESS:
- First impression / hook (did they grab attention immediately?)
- Energy and enthusiasm (engaging vs flat delivery)
- Eye contact and camera presence
- Clarity of message (what are they about?)
- Authenticity (genuine vs trying too hard)
- Technical quality (audio, lighting, framing)

SCORING GUIDANCE:
Start at 70 (baseline). Adjust based on strengths and areas for improvement.
Be honest - if there are multiple significant issues, the score should reflect that.

ASSESSMENT QUESTIONS:

HOOK (First 5 seconds)
- Would a brand manager keep watching?
- Did they open strong or generic?

PRESENCE
- What's their energy level? (flat, nervous, natural, magnetic)
- Do they command attention?

VOICE
- Distinctive or generic?
- Good vocal variety or monotone?

CONTENT
- Clear message or rambling?
- Anything memorable?

DIFFERENTIATION
- What makes them different?
- Would you remember them?

SA CREATOR CONTEXT:
- SA brands value authentic, relatable creators
- Local accent/culture is a plus when genuine
- Authenticity matters more than polish for SA market

OUTPUT FORMAT - Return valid JSON only:

{
  "overall_score": <0-100>,
  "overall_score_breakdown": "<honest breakdown of what drove the score - include negatives>",
  "score_headline": "<honest 3-5 word summary - e.g. 'Needs Work', 'Not Ready Yet', 'Strong Potential', 'Brand Ready'>",
  "vibe_check": "<honest one sentence - what's the real vibe? Flat? Nervous? Confident? Compelling?>",
  "creator_type": "<singer|voice_artist|speaker|comedian|lifestyle|educator|multi-talent>",
  "reality_check": {
    "would_watch_10_seconds": <true|false>,
    "brand_would_pay": <true|false>,
    "stands_out": <true|false>,
    "honest_assessment": "<1-2 sentences of honest feedback on their current readiness>"
  },
  "scores": {
    "energy": { "score": <0-100>, "note": "<be specific - flat, nervous, forced, natural, magnetic?>" },
    "authenticity": { "score": <0-100>, "note": "<genuine or performing? specific moments>" },
    "clarity": { "score": <0-100>, "note": "<could you summarize their point? did they even have one?>" },
    "camera_presence": { "score": <0-100>, "note": "<eye contact %, fidgeting, confidence level>" }
  },
  "problems_detected": {
    "filler_words": "<count of ums, likes, you knows - be specific>",
    "eye_contact_breaks": "<how many times they looked away>",
    "dead_moments": ["<timestamps where energy dropped or nothing happened>"],
    "generic_phrases": ["<cliche phrases they used that mean nothing>"],
    "technical_issues": "<audio, lighting, background problems>"
  },
  "talent_assessment": {
    "detected_talents": ["<specific talents observed - or 'none apparent' if none>"],
    "standout_skill": "<their strongest creative skill - or 'nothing stood out'>",
    "voice_quality": "<distinctive|forgettable|needs-work|monotone|dynamic>",
    "entertainment_value": "<high|medium|low|none>",
    "talent_note": "<honest assessment of their creative abilities>"
  },
  "what_brands_will_love": ["<specific things - if nothing, say 'Nothing yet - needs work'>"],
  "standout_moments": [
    { "timestamp": "<when>", "what": "<what was great - could be a vocal moment, joke, authentic reaction>", "why_brands_care": "<why this matters>" }
  ],
  "level_up_tips": [
    { "tip": "<friendly suggestion>", "why": "<how it helps land deals>", "priority": "<try this first|nice to have>" }
  ],
  "brand_fit": {
    "ideal_brand_types": ["<types of brands that would love them>"],
    "content_style": "<lifestyle|educational|entertaining|musical|inspirational|mixed>",
    "collab_potential": "<high|medium|growing>",
    "unique_angle": "<what makes them different from other creators>"
  },
  "first_impression": {
    "hook_strength": "<strong|good|needs work>",
    "would_watch_more": <true|false>,
    "memorable_factor": "<what sticks with you>"
  },
  "creator_badge": {
    "badge": "<honest badge - 'Needs Practice', 'Work In Progress', 'Rising Talent', 'Natural Performer', 'Brand Ready'>",
    "reason": "<why they earned it - be specific>"
  },
  "what_to_fix_first": "<the ONE thing that would most improve their video - be specific and actionable>",
  "encouragement": "<honest but supportive - acknowledge the gap between where they are and where they need to be>",
  "summary": "<3-4 sentence honest summary - what's working, what's not, and what they need to do next>"
}

Remember: Creators need HONEST feedback to improve. A mediocre video with a glowing review helps no one. Be the coach who tells them the truth, not the friend who lies to make them feel good. If the video is bad, SAY SO - then tell them exactly how to fix it.

${SA_CREATOR_CONTEXT}`;

const FERRARI_VIDEO_ANALYST_PROMPT_FULL = FERRARI_VIDEO_ANALYST_PROMPT + `

{
  "overall_score": <0-100>,
  "overall_score_breakdown": "<calculation explanation>",
  "score_headline": "<3-5 word summary>",
  "percentile_estimate": "<estimate>",
  "scores": {
    "clarity": { "score": <0-100>, "calculation": "<notes>" },
    "confidence": { "score": <0-100>, "calculation": "<notes>" },
    "engagement": { "score": <0-100>, "calculation": "<notes>" },
    "authenticity": { "score": <0-100>, "calculation": "<notes>" }
  },
  "expression_analysis": {
    "positive_expressions": ["<observations>"],
    "areas_to_improve": ["<suggestions>"],
    "warmth_indicators": { "genuine_smiles": true, "expression_consistency": "<notes>", "overall_warmth": "<high|moderate|low>" }
  },
  "timeline": {
    "journey_summary": "<summary>",
    "trajectory": "<ascending|descending|steady|volatile>",
    "frames": [{ "timestamp": "<time>", "dominant_emotion": "<emotion>", "energy_level": <1-10>, "eye_contact": "<camera|away|down>", "key_observation": "<note>" }],
    "peak_moment": { "timestamp": "<when>", "description": "<description>" },
    "dip_moment": { "timestamp": "<when>", "description": "<description>" }
  },
  "visual_analysis": {
    "eye_contact_percentage": <0-100>,
    "eye_contact_detail": "<observation>",
    "posture": "<confident|neutral|closed>",
    "posture_detail": "<observation>",
    "gestures": "<natural|stiff|minimal>",
    "gesture_detail": "<observation>",
    "facial_mobility": "<expressive|moderate|flat>",
    "background": "<professional|acceptable|distracting>",
    "lighting": "<excellent|good|poor>",
    "overall_visual_impression": "<observation>"
  },
  "voice_analysis": {
    "estimated_wpm": <number>,
    "wpm_assessment": "<assessment>",
    "filler_count": <number>,
    "fillers_detected": ["<fillers>"],
    "filler_density": "<low|moderate|high>",
    "power_words_used": ["<words>"],
    "weak_words_used": ["<words>"],
    "verbal_confidence_score": <0-100>,
    "verbal_confidence_detail": "<notes>"
  },
  "first_impression": {
    "first_5_seconds": "<observation>",
    "would_watch_more": true,
    "instant_credibility": "<high|moderate|low>",
    "memorability": "<forgettable|average|memorable|unforgettable>"
  },
  "coaching_tips": [{ "priority": <1-5>, "category": "<category>", "issue": "<issue>", "fix": "<suggestion>", "timestamp": "<when>", "impact": "<HIGH|MEDIUM|LOW>" }],
  "transcript_analysis": {
    "strongest_line": "<quote>",
    "weakest_line": "<quote>",
    "opening_hook": "<strong|moderate|weak>",
    "closing_impact": "<strong|moderate|weak|abrupt>",
    "key_message": "<message>",
    "message_clarity": "<crystal clear|somewhat clear|muddled>"
  },
  "employer_appeal": {
    "best_fit_roles": ["<roles>"],
    "best_fit_industries": ["<industries>"],
    "culture_match": "<startup|corporate|agency|consulting|flexible>",
    "seniority_signal": "<entry|mid|senior|executive>",
    "hire_signal": "<strong yes|yes|maybe|concern|no>"
  },
  "interview_decision": {
    "would_interview": <true|false>,
    "would_recommend_to_colleague": <true|false>,
    "concerns_for_hiring_meeting": ["<specific concerns you'd raise>"],
    "decision_reasoning": "<honest 2-3 sentence explanation of your decision>"
  },
  "red_flags": {
    "filler_word_count": <number>,
    "fillers_detected": ["<list each filler with count, e.g. 'um (5)', 'like (3)'>"],
    "eye_contact_issues": "<none|occasional breaks|frequent breaks|rarely looks at camera>",
    "nervous_habits": ["<specific habits observed with timestamps>"],
    "generic_phrases_used": ["<cliche phrases that added no value>"],
    "content_issues": "<clear and structured|somewhat rambling|no clear point|confusing>"
  },
  "passport_badge": { "badge_earned": "<be honest - 'Needs Work'|'Developing'|'Interview Ready'|'Strong Candidate'|'Exceptional'>", "badge_evidence": "<specific evidence>" },
  "comparison_insights": { "above_average": ["<strengths vs typical candidates>"], "below_average": ["<weaknesses vs typical candidates>"], "unique_differentiator": "<what makes them memorable, or 'nothing stood out'>" },
  "what_to_fix_first": "<the ONE thing that would most improve their chances - be specific>",
  "summary": "<4-5 sentence honest summary - would you interview them? why or why not?>"
}

${SA_CONTEXT_PROMPT}

${SA_CREATOR_CONTEXT}`;

export async function POST(request: Request) {
  const traceId = Date.now().toString(36);
  if (IS_DEV) console.log(`[${traceId}][VIDEO-FERRARI] Analysis request received`);

  try {
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json({
        error: 'Invalid request. Please record a video and try again.'
      }, { status: 400 });
    }
    const videoFile = formData.get('video') as File | null;
    const audioFile = formData.get('audio') as File | null;
    const framesJson = formData.get('frames') as string | null;
    const frameTimestampsJson = formData.get('frameTimestamps') as string | null;
    const directTranscript = formData.get('transcript') as string | null;
    const cvContextJson = formData.get('cvContext') as string | null;
    const voiceMetricsJson = formData.get('voiceMetrics') as string | null;
    const mode = formData.get('mode') as string | null; // 'creator' or null for job seeker

    const isCreatorMode = mode === 'creator';
    const isDemoMode = formData.get('demo') === 'true';
    if (IS_DEV) console.log(`[${traceId}][VIDEO] Mode: ${isCreatorMode ? 'CREATOR' : 'JOB_SEEKER'}${isDemoMode ? ' (DEMO)' : ''}`);

    // DEMO MODE - Return realistic mock data for investor demos
    if (isDemoMode) {
      if (IS_DEV) console.log(`[${traceId}][VIDEO] Returning demo data`);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing

      const demoAnalysis = isCreatorMode ? {
        overall_score: 78,
        score_headline: "Strong Creator Presence",
        creator_badge: { badge: "Authentic Voice", evidence: "Natural delivery, genuine personality" },
        creator_type: "lifestyle",
        vibe_check: "You've got natural screen presence - brands will notice you immediately.",
        scores: {
          energy: { score: 82, calculation: "High enthusiasm throughout" },
          authenticity: { score: 85, calculation: "Genuine, unscripted feel" },
          clarity: { score: 74, calculation: "Message was clear with minor rambling" },
          camera_presence: { score: 72, calculation: "Good eye contact, confident posture" }
        },
        reality_check: {
          would_watch_10_seconds: true,
          brand_would_pay: true,
          stands_out: true,
          honest_assessment: "You have the raw ingredients brands look for. Polish your hook and you're deal-ready."
        },
        what_brands_will_love: ["Authentic energy", "Relatable personality", "Clear communication"],
        brand_fit: {
          ideal_brand_types: ["Lifestyle", "Food & Beverage", "Fashion"],
          content_style: "conversational",
          unique_angle: "Your down-to-earth vibe makes product placement feel natural, not forced."
        },
        what_to_fix_first: "Start with a hook in the first 2 seconds - don't introduce yourself, jump straight into value.",
        level_up_tips: [
          { tip: "Hook first, intro later", why: "TikTok/Reels audiences scroll in 1.5 seconds. Grab them.", priority: "try this first" },
          { tip: "Vary your vocal energy", why: "You flatlined slightly in the middle. Peak-valley-peak keeps attention.", priority: "next session" }
        ],
        encouragement: "You're closer than you think. Most creators never find their authentic voice - you already have it. Now it's just polish.",
        summary: "Strong foundation. Natural presence. Ready for brand outreach with minor polish."
      } : {
        overall_score: 72,
        score_headline: "Solid Candidate",
        interview_decision: { would_interview: true, confidence: "medium", reasoning: "Good communication, needs more specific examples", key_factor: "Clear articulation" },
        summary: "Demo mode - shows a realistic job seeker analysis."
      };

      return NextResponse.json({
        success: true,
        version: 'demo',
        transcript: "Demo transcript - this is simulated data for investor demonstrations.",
        frameCount: 5,
        framesAnalyzed: 5,
        analysis: demoAnalysis
      });
    }

    let transcript = directTranscript;
    let frames: string[] = [];
    let frameTimestamps: number[] = [];
    let cvContext: { name?: string; roles?: string[]; strengths?: string[]; score?: number } | null = null;
    let voiceMetrics: { avgPitch?: number; pitchVariation?: number; silenceRatio?: number } | null = null;

    // Parse CV context if provided (for role-specific feedback)
    if (cvContextJson) {
      try {
        cvContext = JSON.parse(cvContextJson);
        if (IS_DEV) console.log(`[${traceId}][VIDEO-FERRARI] CV context provided - tailoring for: ${cvContext?.roles?.join(', ') || 'general'}`);
      } catch {
        if (IS_DEV) console.log(`[${traceId}][VIDEO-FERRARI] Could not parse CV context`);
      }
    }

    // Parse voice metrics if provided (from client-side Web Audio API analysis)
    if (voiceMetricsJson) {
      try {
        voiceMetrics = JSON.parse(voiceMetricsJson);
        if (IS_DEV) console.log(`[${traceId}][VIDEO-FERRARI] Voice metrics received - pitch: ${voiceMetrics?.avgPitch}Hz, variation: ${voiceMetrics?.pitchVariation}`);
      } catch {
        if (IS_DEV) console.log(`[${traceId}][VIDEO-FERRARI] Could not parse voice metrics`);
      }
    }

    // Parse frames if provided
    if (framesJson) {
      try {
        frames = JSON.parse(framesJson);
        if (IS_DEV) console.log(`[${traceId}][VIDEO-FERRARI] Received ${frames.length} frames for analysis`);
      } catch {
        if (IS_DEV) console.log(`[${traceId}][VIDEO-FERRARI] Could not parse frames`);
      }
    }

    // Parse frame timestamps if provided
    if (frameTimestampsJson) {
      try {
        frameTimestamps = JSON.parse(frameTimestampsJson);
        if (IS_DEV) console.log(`[${traceId}][VIDEO-FERRARI] Frame timestamps: ${frameTimestamps.map(t => `${t}s`).join(', ')}`);
      } catch {
        if (IS_DEV) console.log(`[${traceId}][VIDEO-FERRARI] Could not parse frame timestamps`);
      }
    }

    // Transcribe audio from video file
    const fileToTranscribe = videoFile || audioFile;
    if (fileToTranscribe && !transcript) {
      if (IS_DEV) console.log(`[${traceId}][VIDEO-FERRARI] Transcribing: ${fileToTranscribe.name} (${fileToTranscribe.size} bytes)`);

      try {
        const transcription = await openai.audio.transcriptions.create({
          file: fileToTranscribe,
          model: 'whisper-1',
          language: 'en',
          response_format: 'text'
        });

        transcript = transcription;
        if (IS_DEV) console.log(`[${traceId}][VIDEO-FERRARI] Transcription complete: ${transcript.length} chars`);
      } catch (transcriptError) {
        console.error(`[${traceId}][VIDEO-FERRARI] Transcription error:`, transcriptError);
        if (frames.length === 0) {
          return NextResponse.json({
            error: 'Could not transcribe audio. Please try again.'
          }, { status: 400 });
        }
        transcript = '[Transcript unavailable - analyzing visual only]';
      }
    }

    if ((!transcript || transcript.length < 10) && frames.length === 0) {
      return NextResponse.json({
        error: 'Could not process video. Please ensure you spoke clearly and your camera was working.'
      }, { status: 400 });
    }

    // Build messages for GPT-4o Vision coaching analysis
    if (IS_DEV) console.log(`[${traceId}][VIDEO-FERRARI] Starting video coaching analysis with GPT-4o Vision...`);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userContent: any[] = [];

    // Build CV context section if available
    const cvContextSection = cvContext ? `
=============================
CV CONTEXT (Personalize feedback for their goals)
=============================
Candidate: ${cvContext.name || 'Unknown'}
CV Score: ${cvContext.score || 'N/A'}/100
Target Roles: ${cvContext.roles?.join(', ') || 'General'}
Key Strengths from CV: ${cvContext.strengths?.join(', ') || 'Not specified'}

CRITICAL: Tailor ALL coaching to their target roles. A sales candidate needs different advice than a developer.
` : '';

    // Build voice metrics section if available
    const voiceMetricsSection = voiceMetrics ? `
=============================
VOICE METRICS (from audio analysis)
=============================
Average Pitch: ${voiceMetrics.avgPitch?.toFixed(0)}Hz ${voiceMetrics.avgPitch && voiceMetrics.avgPitch < 150 ? '(lower/deeper)' : voiceMetrics.avgPitch && voiceMetrics.avgPitch > 200 ? '(higher)' : '(mid-range)'}
Pitch Variation: ${voiceMetrics.pitchVariation?.toFixed(1)}% ${voiceMetrics.pitchVariation && voiceMetrics.pitchVariation < 15 ? '(monotone)' : voiceMetrics.pitchVariation && voiceMetrics.pitchVariation > 30 ? '(very expressive)' : '(normal variation)'}
Silence Ratio: ${((voiceMetrics.silenceRatio || 0) * 100).toFixed(0)}% ${voiceMetrics.silenceRatio && voiceMetrics.silenceRatio > 0.3 ? '(many pauses)' : '(good flow)'}
` : '';

    // Build frame description with timestamps
    let frameDescription = '';
    if (frames.length > 0) {
      frameDescription = `${frames.length} frames from the video at these timestamps:
${frames.map((_, i) => {
  const timestamp = frameTimestamps[i] || (i * 4);
  const mins = Math.floor(timestamp / 60);
  const secs = timestamp % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}).join(', ')}`;
    }

    // Add text prompt - IMPORTANT: Frame as presentation coaching to avoid OpenAI content policy blocks
    userContent.push({
      type: 'text',
      text: `This is a PRACTICE PRESENTATION VIDEO submitted voluntarily for coaching feedback. The person has consented to receive feedback on their presentation skills.

Please provide constructive coaching feedback on their PRESENTATION TECHNIQUE (not identifying them as a person):
- Speaking pace and clarity
- Use of pauses and emphasis
- Body language and gestures (open/closed posture, hand movements)
- Eye contact with camera (looking at lens vs away)
- Energy and enthusiasm level
- Background and lighting quality

TRANSCRIPT OF WHAT THEY SAID:
"${transcript || 'No transcript available'}"

${frameDescription ? `PRESENTATION FRAMES:\n${frameDescription}` : ''}
${voiceMetricsSection}

Provide encouraging, actionable coaching feedback in the JSON format specified. Focus on presentation technique, not personal identity.`
    });

    // Add frames as images - framed as presentation stills for coaching
    // Reduced to 3 frames for reliability
    const maxFrames = Math.min(frames.length, 3);
    for (let i = 0; i < maxFrames; i++) {
      // Select frames from start, middle, end
      const frameIndex = i === 0 ? 0 : i === 1 ? Math.floor(frames.length / 2) : frames.length - 1;
      const frame = frames[frameIndex];
      if (frame && frame.startsWith('data:image')) {
        const timestamp = frameTimestamps[frameIndex] || (frameIndex * 4);
        const mins = Math.floor(timestamp / 60);
        const secs = timestamp % 60;

        userContent.push({
          type: 'text',
          text: `[Presentation still at ${mins}:${secs.toString().padStart(2, '0')} - assess posture, gestures, camera angle, lighting, background]`
        });
        userContent.push({
          type: 'image_url',
          image_url: {
            url: frame,
            detail: 'low'
          }
        });
      }
    }

    if (IS_DEV) console.log(`[${traceId}][VIDEO-FERRARI] Sending ${maxFrames} presentation stills for analysis`);

    // Select prompt based on mode
    const systemPrompt = isCreatorMode ? CREATOR_VIDEO_ANALYST_PROMPT : FERRARI_VIDEO_ANALYST_PROMPT_FULL;
    if (IS_DEV) console.log(`[${traceId}][VIDEO] Using ${isCreatorMode ? 'Creator' : 'Job Seeker'} prompt`);

    let responseText = '';

    // Try Claude Vision first (better at presentation coaching), fallback to GPT-4o
    if (anthropic) {
      if (IS_DEV) console.log(`[${traceId}][VIDEO] Calling Claude Vision (primary)...`);
      try {
        // Build Claude Vision content
        const claudeContent: Anthropic.MessageParam['content'] = [];

        // Add text first
        const textContent = userContent.find((c: { type: string }) => c.type === 'text');
        if (textContent) {
          claudeContent.push({ type: 'text', text: textContent.text });
        }

        // Add images
        for (const item of userContent) {
          if (item.type === 'image_url' && item.image_url?.url) {
            const base64Match = item.image_url.url.match(/^data:image\/(.*?);base64,(.*)$/);
            if (base64Match) {
              claudeContent.push({
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: `image/${base64Match[1]}` as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                  data: base64Match[2],
                },
              });
            }
          } else if (item.type === 'text' && item.text.includes('Presentation still')) {
            claudeContent.push({ type: 'text', text: item.text });
          }
        }

        const claudeResponse = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4000,
          system: systemPrompt,
          messages: [{ role: 'user', content: claudeContent }],
        });

        responseText = claudeResponse.content[0].type === 'text' ? claudeResponse.content[0].text : '';
        if (IS_DEV) console.log(`[${traceId}][VIDEO-FERRARI] Claude Vision response length: ${responseText.length}`);
      } catch (claudeError) {
        console.error(`[${traceId}][VIDEO] Claude Vision failed:`, claudeError);
        // Fall through to GPT-4o
      }
    }

    // Fallback to GPT-4o if Claude failed or not available
    if (!responseText || responseText.includes("I can't") || responseText.includes("I cannot")) {
      if (IS_DEV) console.log(`[${traceId}][VIDEO] Calling GPT-4o Vision (fallback)...`);
      const completion = await withRetry(async () => {
        return openai.chat.completions.create({
          model: 'gpt-4o',
          temperature: 0.3,
          max_tokens: 4000,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userContent }
          ],
        });
      }, 3, 2000);

      responseText = completion.choices[0]?.message?.content || '';
      if (IS_DEV) console.log(`[${traceId}][VIDEO-FERRARI] GPT-4o response length: ${responseText.length}`);
    }

    // Parse JSON response
    const cleaned = responseText.replace(/```json\s*/gi, '').replace(/```/g, '').trim();
    let analysis;

    try {
      analysis = JSON.parse(cleaned);
    } catch {
      console.error(`[${traceId}][VIDEO-FERRARI] JSON parse failed. Response: ${cleaned.substring(0, 500)}`);
      return NextResponse.json({
        error: 'Analysis failed. Please try again.'
      }, { status: 500 });
    }

    if (IS_DEV) console.log(`[${traceId}][VIDEO-FERRARI] Analysis complete. Score: ${analysis.overall_score}`);
    if (IS_DEV) console.log(`[${traceId}][VIDEO-FERRARI] Score breakdown: ${analysis.overall_score_breakdown}`);

    // Log expression analysis
    if (IS_DEV && analysis.expression_analysis) {
      console.log(`[${traceId}][EXPRESSION] Positive: ${analysis.expression_analysis.positive_expressions?.join(', ')}`);
      console.log(`[${traceId}][EXPRESSION] Warmth: ${analysis.expression_analysis.warmth_indicators?.overall_warmth}`);
    }

    // Log timeline
    if (IS_DEV && analysis.timeline) {
      console.log(`[${traceId}][TIMELINE] Journey: ${analysis.timeline.journey_summary}`);
      console.log(`[${traceId}][TIMELINE] Trajectory: ${analysis.timeline.trajectory}`);
      console.log(`[${traceId}][TIMELINE] Peak: ${analysis.timeline.peak_moment?.timestamp} - ${analysis.timeline.peak_moment?.description}`);
      console.log(`[${traceId}][TIMELINE] Dip: ${analysis.timeline.dip_moment?.timestamp} - ${analysis.timeline.dip_moment?.description}`);
    }

    // Log visual analysis
    if (IS_DEV && analysis.visual_analysis) {
      console.log(`[${traceId}][VISUAL] Eye contact: ${analysis.visual_analysis.eye_contact_percentage}% - ${analysis.visual_analysis.eye_contact_detail}`);
      console.log(`[${traceId}][VISUAL] Posture: ${analysis.visual_analysis.posture} - ${analysis.visual_analysis.posture_detail}`);
      console.log(`[${traceId}][VISUAL] Facial mobility: ${analysis.visual_analysis.facial_mobility}`);
    }

    return NextResponse.json({
      success: true,
      version: 'ferrari',
      transcript,
      frameCount: frames.length,
      framesAnalyzed: maxFrames,
      analysis
    });

  } catch (error) {
    console.error(`[${traceId}][VIDEO-FERRARI] Error:`, error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Analysis failed'
    }, { status: 500 });
  }
}
