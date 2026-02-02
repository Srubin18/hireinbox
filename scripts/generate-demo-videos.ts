/**
 * D-ID Demo Video Generator for HireInbox
 *
 * Generates 3 demo videos:
 * 1. Business/Employer journey (60s)
 * 2. Recruiter journey (60s)
 * 3. Candidate/Job Seeker journey (60s)
 *
 * Uses D-ID API with South African accent
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DID_API_KEY = process.env.DID_API_KEY || 'c3NydWJpbjE4QGdtYWlsLmNvbQ:XzfDwmcB_a3w_IqMbQeRv';
const DID_API_URL = 'https://api.d-id.com';

// Video scripts - upbeat, tutorial style, ~60 seconds each
const VIDEO_SCRIPTS = {
  business: {
    name: 'HireInbox for Employers',
    script: `Welcome to HireInbox! I'm here to show you how easy it is to screen candidates.

Here's how it works: You post a job, CVs come into your inbox, and our AI does the heavy lifting.

Step one: Create your role. Tell us what you're looking for - the job title, requirements, and must-haves.

Step two: Receive applications. CVs arrive in your email as usual - nothing changes for candidates.

Step three: AI screening. Our AI reads every CV, scores each candidate, and tells you exactly WHY - with quotes from their CV as evidence.

In seconds, you'll see your shortlist ranked from best to least suitable. No more reading hundreds of CVs manually.

The best part? You stay in control. The AI recommends, but you decide who gets interviewed.

Ready to save hours on every hire? Start your free trial at hireinbox.co.za. Less noise. More hires.`
  },

  recruiter: {
    name: 'HireInbox for Recruiters',
    script: `Hey recruiters! Let me show you how HireInbox supercharges your workflow.

You're juggling multiple roles, hundreds of CVs, and demanding clients. Sound familiar?

With HireInbox, you get AI-powered screening that actually explains its decisions. Every recommendation comes with evidence - direct quotes from the CV.

Create role profiles in seconds. Our AI understands South African qualifications - CA SA, BCom, your local companies and institutions.

When CVs arrive, they're automatically ranked. High potential candidates rise to the top. Mismatches are flagged with clear reasons.

Need to send candidates for AI interviews? One click. The system handles scheduling, conducts the interview, and delivers a full transcript with insights.

Your clients get faster shortlists. You spend less time on admin and more time on relationships.

Join the recruiters already saving 10 hours per role. Visit hireinbox.co.za today.`
  },

  candidate: {
    name: 'HireInbox for Job Seekers',
    script: `Job hunting? Let me show you how to stand out with HireInbox.

First, upload your CV for a free AI analysis. In seconds, you'll know exactly how recruiters see you.

Our AI checks your CV against thousands of job requirements. It highlights your strengths and spots gaps you might have missed.

Want to go further? Record a 60-second video pitch. This is your chance to show personality - something a CV can't do.

Our AI coaching gives you real-time feedback. Are you speaking clearly? Making eye contact? Showing enthusiasm? We'll tell you.

When employers search our talent pool, candidates with videos get noticed first. Your face, your voice, your story - that's what gets you interviews.

The CV scan is completely free. Video coaching starts at just 99 rand.

Ready to land your next role? Visit hireinbox.co.za and upload your CV now. Your dream job is waiting.`
  }
};

// D-ID presenter image - using a professional presenter
const PRESENTER_IMAGE = 'https://create-images-results.d-id.com/DefaultPresenters/Noelle_f/thumbnail.jpeg';

// Voice settings - South African English
const VOICE_CONFIG = {
  type: 'microsoft',
  voice_id: 'en-ZA-LeahNeural', // South African female voice
  // Alternative: 'en-ZA-LukeNeural' for male
};

interface TalkResponse {
  id: string;
  status: string;
  result_url?: string;
}

async function createTalkingVideo(name: string, script: string): Promise<string> {
  console.log(`\nCreating video: ${name}`);
  console.log(`Script length: ${script.length} characters`);

  const response = await fetch(`${DID_API_URL}/talks`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${DID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      source_url: PRESENTER_IMAGE,
      script: {
        type: 'text',
        input: script,
        provider: VOICE_CONFIG,
      },
      config: {
        fluent: true,
        pad_audio: 0.5,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`D-ID API error: ${response.status} - ${error}`);
  }

  const data = await response.json() as TalkResponse;
  console.log(`Video creation started. ID: ${data.id}`);

  return data.id;
}

async function checkVideoStatus(talkId: string): Promise<TalkResponse> {
  const response = await fetch(`${DID_API_URL}/talks/${talkId}`, {
    headers: {
      'Authorization': `Basic ${DID_API_KEY}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`D-ID API error: ${response.status} - ${error}`);
  }

  return response.json() as Promise<TalkResponse>;
}

async function waitForVideo(talkId: string, maxWaitMs: number = 300000): Promise<string> {
  const startTime = Date.now();
  const pollInterval = 5000; // 5 seconds

  while (Date.now() - startTime < maxWaitMs) {
    const status = await checkVideoStatus(talkId);
    console.log(`  Status: ${status.status}`);

    if (status.status === 'done' && status.result_url) {
      return status.result_url;
    }

    if (status.status === 'error') {
      throw new Error(`Video generation failed for ${talkId}`);
    }

    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }

  throw new Error(`Timeout waiting for video ${talkId}`);
}

async function downloadVideo(url: string, filename: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download video: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const outputDir = path.join(__dirname, '../public/videos');

  // Ensure directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, filename);
  fs.writeFileSync(outputPath, buffer);
  console.log(`  Saved to: ${outputPath}`);
}

async function main() {
  console.log('='.repeat(50));
  console.log('HireInbox Demo Video Generator');
  console.log('Using D-ID API with South African accent');
  console.log('='.repeat(50));

  const results: { name: string; talkId: string; url?: string; error?: string }[] = [];

  // Create all videos
  for (const [key, video] of Object.entries(VIDEO_SCRIPTS)) {
    try {
      const talkId = await createTalkingVideo(video.name, video.script);
      results.push({ name: key, talkId });
    } catch (error) {
      console.error(`Failed to create ${key} video:`, error);
      results.push({ name: key, talkId: '', error: String(error) });
    }
  }

  // Wait for all videos and download
  console.log('\n' + '='.repeat(50));
  console.log('Waiting for videos to complete...');
  console.log('='.repeat(50));

  for (const result of results) {
    if (result.error || !result.talkId) continue;

    try {
      console.log(`\nProcessing: ${result.name}`);
      const videoUrl = await waitForVideo(result.talkId);
      result.url = videoUrl;

      // Download the video
      await downloadVideo(videoUrl, `demo-${result.name}.mp4`);
      console.log(`  Complete!`);
    } catch (error) {
      console.error(`Failed to process ${result.name}:`, error);
      result.error = String(error);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('SUMMARY');
  console.log('='.repeat(50));

  for (const result of results) {
    const status = result.url ? 'SUCCESS' : 'FAILED';
    console.log(`${result.name}: ${status}`);
    if (result.url) {
      console.log(`  URL: ${result.url}`);
      console.log(`  Local: /public/videos/demo-${result.name}.mp4`);
    }
    if (result.error) {
      console.log(`  Error: ${result.error}`);
    }
  }
}

main().catch(console.error);
