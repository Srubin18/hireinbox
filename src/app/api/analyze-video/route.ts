// app/api/analyze-video/route.ts
// FERRARI-GRADE Video Communication Coaching
// World-class presentation analysis + timeline coaching + voice metrics
// GPT-4o Vision + Whisper + Web Audio API

import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { SA_CONTEXT_PROMPT } from '@/lib/sa-context';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const FERRARI_VIDEO_ANALYST_PROMPT = `You are writing a presentation feedback report. The user has recorded a practice video and wants constructive feedback.

Your task: Write a helpful feedback report in JSON format based on what you observe in the video frames and transcript.

Be encouraging and specific. Point out what's working well and suggest improvements.

OUTPUT FORMAT - Return valid JSON only:

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
    "hire_signal": "<strong yes|yes|maybe|concern>"
  },
  "passport_badge": { "badge_earned": "<badge>", "badge_evidence": "<evidence>" },
  "comparison_insights": { "above_average": ["<strengths>"], "below_average": ["<areas>"], "unique_differentiator": "<differentiator>" },
  "summary": "<4-5 sentence summary>"
}

${SA_CONTEXT_PROMPT}`;

export async function POST(request: Request) {
  const traceId = Date.now().toString(36);
  console.log(`[${traceId}][VIDEO-FERRARI] Analysis request received`);

  try {
    const formData = await request.formData();
    const videoFile = formData.get('video') as File | null;
    const audioFile = formData.get('audio') as File | null;
    const framesJson = formData.get('frames') as string | null;
    const frameTimestampsJson = formData.get('frameTimestamps') as string | null;
    const directTranscript = formData.get('transcript') as string | null;
    const cvContextJson = formData.get('cvContext') as string | null;
    const voiceMetricsJson = formData.get('voiceMetrics') as string | null;

    let transcript = directTranscript;
    let frames: string[] = [];
    let frameTimestamps: number[] = [];
    let cvContext: { name?: string; roles?: string[]; strengths?: string[]; score?: number } | null = null;
    let voiceMetrics: { avgPitch?: number; pitchVariation?: number; silenceRatio?: number } | null = null;

    // Parse CV context if provided (for role-specific feedback)
    if (cvContextJson) {
      try {
        cvContext = JSON.parse(cvContextJson);
        console.log(`[${traceId}][VIDEO-FERRARI] CV context provided - tailoring for: ${cvContext?.roles?.join(', ') || 'general'}`);
      } catch {
        console.log(`[${traceId}][VIDEO-FERRARI] Could not parse CV context`);
      }
    }

    // Parse voice metrics if provided (from client-side Web Audio API analysis)
    if (voiceMetricsJson) {
      try {
        voiceMetrics = JSON.parse(voiceMetricsJson);
        console.log(`[${traceId}][VIDEO-FERRARI] Voice metrics received - pitch: ${voiceMetrics?.avgPitch}Hz, variation: ${voiceMetrics?.pitchVariation}`);
      } catch {
        console.log(`[${traceId}][VIDEO-FERRARI] Could not parse voice metrics`);
      }
    }

    // Parse frames if provided
    if (framesJson) {
      try {
        frames = JSON.parse(framesJson);
        console.log(`[${traceId}][VIDEO-FERRARI] Received ${frames.length} frames for analysis`);
      } catch {
        console.log(`[${traceId}][VIDEO-FERRARI] Could not parse frames`);
      }
    }

    // Parse frame timestamps if provided
    if (frameTimestampsJson) {
      try {
        frameTimestamps = JSON.parse(frameTimestampsJson);
        console.log(`[${traceId}][VIDEO-FERRARI] Frame timestamps: ${frameTimestamps.map(t => `${t}s`).join(', ')}`);
      } catch {
        console.log(`[${traceId}][VIDEO-FERRARI] Could not parse frame timestamps`);
      }
    }

    // Transcribe audio from video file
    const fileToTranscribe = videoFile || audioFile;
    if (fileToTranscribe && !transcript) {
      console.log(`[${traceId}][VIDEO-FERRARI] Transcribing: ${fileToTranscribe.name} (${fileToTranscribe.size} bytes)`);

      try {
        const transcription = await openai.audio.transcriptions.create({
          file: fileToTranscribe,
          model: 'whisper-1',
          language: 'en',
          response_format: 'text'
        });

        transcript = transcription;
        console.log(`[${traceId}][VIDEO-FERRARI] Transcription complete: ${transcript.length} chars`);
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
    console.log(`[${traceId}][VIDEO-FERRARI] Starting video coaching analysis with GPT-4o Vision...`);

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

    // Add text prompt
    userContent.push({
      type: 'text',
      text: `Please write a feedback report for this practice presentation video.

TRANSCRIPT:
"${transcript || 'No transcript available'}"

${frameDescription ? `VIDEO FRAMES:\n${frameDescription}` : ''}
${voiceMetricsSection}

Write an encouraging feedback report following the JSON format in your instructions.`
    });

    // Add frames as images with high detail for coaching analysis
    const maxFrames = Math.min(frames.length, 12); // Up to 12 frames for detailed timeline
    for (let i = 0; i < maxFrames; i++) {
      const frame = frames[i];
      if (frame && frame.startsWith('data:image')) {
        const timestamp = frameTimestamps[i] || (i * 4);
        const mins = Math.floor(timestamp / 60);
        const secs = timestamp % 60;

        userContent.push({
          type: 'text',
          text: `[Frame at ${mins}:${secs.toString().padStart(2, '0')}]`
        });
        userContent.push({
          type: 'image_url',
          image_url: {
            url: frame,
            detail: 'high' // HIGH detail critical for FACS analysis
          }
        });
      }
    }

    console.log(`[${traceId}][VIDEO-FERRARI] Sending ${maxFrames} timestamped frames to GPT-4o Vision`);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.3, // Lower temperature for more consistent analysis
      max_tokens: 4000, // More tokens for detailed analysis
      messages: [
        { role: 'system', content: FERRARI_VIDEO_ANALYST_PROMPT },
        { role: 'user', content: userContent }
      ],
    });

    const responseText = completion.choices[0]?.message?.content || '';
    console.log(`[${traceId}][VIDEO-FERRARI] Analysis response length: ${responseText.length}`);

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

    console.log(`[${traceId}][VIDEO-FERRARI] Analysis complete. Score: ${analysis.overall_score}`);
    console.log(`[${traceId}][VIDEO-FERRARI] Score breakdown: ${analysis.overall_score_breakdown}`);

    // Log expression analysis
    if (analysis.expression_analysis) {
      console.log(`[${traceId}][EXPRESSION] Positive: ${analysis.expression_analysis.positive_expressions?.join(', ')}`);
      console.log(`[${traceId}][EXPRESSION] Warmth: ${analysis.expression_analysis.warmth_indicators?.overall_warmth}`);
    }

    // Log timeline
    if (analysis.timeline) {
      console.log(`[${traceId}][TIMELINE] Journey: ${analysis.timeline.journey_summary}`);
      console.log(`[${traceId}][TIMELINE] Trajectory: ${analysis.timeline.trajectory}`);
      console.log(`[${traceId}][TIMELINE] Peak: ${analysis.timeline.peak_moment?.timestamp} - ${analysis.timeline.peak_moment?.description}`);
      console.log(`[${traceId}][TIMELINE] Dip: ${analysis.timeline.dip_moment?.timestamp} - ${analysis.timeline.dip_moment?.description}`);
    }

    // Log visual analysis
    if (analysis.visual_analysis) {
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
