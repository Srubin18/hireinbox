// Upload training data and start fine-tuning job
import OpenAI from 'openai';
import fs from 'fs';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function runFineTuning() {
  console.log('=== HIREINBOX FINE-TUNING JOB ===\n');

  // Step 1: Upload training file
  console.log('Step 1: Uploading training file...');
  const file = await openai.files.create({
    file: fs.createReadStream('finetune_training.jsonl'),
    purpose: 'fine-tune'
  });
  console.log('File uploaded:', file.id);
  console.log('File status:', file.status);

  // Step 2: Create fine-tuning job
  console.log('\nStep 2: Creating fine-tuning job...');
  const job = await openai.fineTuning.jobs.create({
    training_file: file.id,
    model: 'gpt-4o-mini-2024-07-18',  // Best cost/performance for fine-tuning
    suffix: 'hireinbox-cv-screener',
    hyperparameters: {
      n_epochs: 3  // 3 epochs is usually optimal
    }
  });

  console.log('\n=== FINE-TUNING JOB CREATED ===');
  console.log('Job ID:', job.id);
  console.log('Status:', job.status);
  console.log('Model:', job.model);
  console.log('Training file:', job.training_file);

  console.log('\n=== MONITORING ===');
  console.log('To check status, run:');
  console.log(`  OPENAI_API_KEY="..." node -e "const OpenAI = require('openai'); const o = new OpenAI(); o.fineTuning.jobs.retrieve('${job.id}').then(j => console.log(j))"`);

  console.log('\n=== NEXT STEPS ===');
  console.log('1. Fine-tuning typically takes 30-60 minutes');
  console.log('2. Once complete, the model ID will be: ft:gpt-4o-mini-2024-07-18:...:hireinbox-cv-screener:...');
  console.log('3. Update src/app/api/fetch-emails/route.ts and src/app/api/analyze-cv/route.ts to use the new model');

  // Save job info for later
  fs.writeFileSync('finetune_job.json', JSON.stringify({
    job_id: job.id,
    file_id: file.id,
    created_at: new Date().toISOString(),
    status: job.status
  }, null, 2));
  console.log('\nJob info saved to finetune_job.json');

  return job;
}

// Monitor job status
async function checkStatus(jobId) {
  const job = await openai.fineTuning.jobs.retrieve(jobId);
  console.log('Status:', job.status);
  console.log('Fine-tuned model:', job.fine_tuned_model || 'Not ready yet');

  if (job.status === 'succeeded') {
    console.log('\n=== SUCCESS! ===');
    console.log('Your fine-tuned model is ready:', job.fine_tuned_model);
    console.log('\nUpdate your code to use this model ID.');
  } else if (job.status === 'failed') {
    console.log('\n=== FAILED ===');
    console.log('Error:', job.error);
  }

  return job;
}

// Run the fine-tuning
runFineTuning().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
