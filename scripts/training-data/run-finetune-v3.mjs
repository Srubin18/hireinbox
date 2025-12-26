#!/usr/bin/env node
/**
 * HireInbox V3 Fine-Tuning Job
 * Creates a world-class recruiter AI - 20x better than generic tools
 */

import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');

const openai = new OpenAI();

async function main() {
  console.log('[V3] Starting HireInbox V3 Fine-Tuning...\n');

  // 1. Upload training file
  console.log('[V3] Uploading training file...');
  const trainFile = await openai.files.create({
    file: fs.createReadStream(path.join(DATA_DIR, 'finetune_v3_train.jsonl')),
    purpose: 'fine-tune'
  });
  console.log(`[V3] Training file uploaded: ${trainFile.id}`);

  // 2. Upload validation file
  console.log('[V3] Uploading validation file...');
  const validFile = await openai.files.create({
    file: fs.createReadStream(path.join(DATA_DIR, 'finetune_v3_valid.jsonl')),
    purpose: 'fine-tune'
  });
  console.log(`[V3] Validation file uploaded: ${validFile.id}`);

  // 3. Create fine-tuning job
  console.log('[V3] Creating fine-tuning job...');
  const job = await openai.fineTuning.jobs.create({
    training_file: trainFile.id,
    validation_file: validFile.id,
    model: 'gpt-4o-mini-2024-07-18',
    suffix: 'hireinbox-v3',
    hyperparameters: {
      n_epochs: 3,
      batch_size: 'auto',
      learning_rate_multiplier: 'auto'
    }
  });

  console.log(`\n[V3] Fine-tuning job created!`);
  console.log(`[V3] Job ID: ${job.id}`);
  console.log(`[V3] Status: ${job.status}`);
  console.log(`[V3] Model: ${job.model}`);

  // Save job info
  const jobInfo = {
    job_id: job.id,
    training_file: trainFile.id,
    validation_file: validFile.id,
    model: job.model,
    status: job.status,
    created_at: new Date().toISOString(),
    suffix: 'hireinbox-v3',
    training_examples: 5400,
    validation_examples: 600
  };

  fs.writeFileSync(
    path.join(DATA_DIR, 'finetune_v3_job.json'),
    JSON.stringify(jobInfo, null, 2)
  );

  console.log(`\n[V3] Job info saved to finetune_v3_job.json`);
  console.log(`\n[V3] Monitor with: openai api fine_tuning.jobs.retrieve -i ${job.id}`);
  console.log(`[V3] Or check: https://platform.openai.com/finetune/${job.id}`);

  // Poll for initial status
  console.log('\n[V3] Waiting for job to start...');
  let currentJob = job;
  let attempts = 0;

  while (currentJob.status === 'validating_files' && attempts < 10) {
    await new Promise(r => setTimeout(r, 5000));
    currentJob = await openai.fineTuning.jobs.retrieve(job.id);
    console.log(`[V3] Status: ${currentJob.status}`);
    attempts++;
  }

  if (currentJob.status === 'running' || currentJob.status === 'queued') {
    console.log(`\n[V3] Job is ${currentJob.status}! This will take 1-2 hours.`);
    console.log(`[V3] The fine-tuned model will be: ft:gpt-4o-mini-2024-07-18:personal:hireinbox-v3:XXXXX`);
  } else if (currentJob.status === 'failed') {
    console.error(`\n[V3] Job failed!`);
    console.error(`[V3] Error: ${currentJob.error?.message || 'Unknown error'}`);
  }
}

main().catch(console.error);
