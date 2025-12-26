// Upload v2 training data and start fine-tuning job
import OpenAI from 'openai';
import fs from 'fs';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function runFineTuningV2() {
  console.log('=== HIREINBOX V2 FINE-TUNING JOB ===\n');

  // Step 1: Upload training file
  console.log('Step 1: Uploading v2 training file (5,060 examples)...');
  const file = await openai.files.create({
    file: fs.createReadStream('finetune_v2_combined.jsonl'),
    purpose: 'fine-tune'
  });
  console.log('File uploaded:', file.id);
  console.log('File status:', file.status);

  // Step 2: Create fine-tuning job
  console.log('\nStep 2: Creating v2 fine-tuning job...');
  const job = await openai.fineTuning.jobs.create({
    training_file: file.id,
    model: 'gpt-4o-mini-2024-07-18',
    suffix: 'hireinbox-v2',
    hyperparameters: {
      n_epochs: 3
    }
  });

  console.log('\n=== V2 FINE-TUNING JOB CREATED ===');
  console.log('Job ID:', job.id);
  console.log('Status:', job.status);
  console.log('Model:', job.model);
  console.log('Training file:', job.training_file);

  // Save job info
  fs.writeFileSync('finetune_v2_job.json', JSON.stringify({
    job_id: job.id,
    file_id: file.id,
    created_at: new Date().toISOString(),
    status: job.status,
    examples: 5060
  }, null, 2));
  console.log('\nJob info saved to finetune_v2_job.json');

  console.log('\n=== EXPECTED TIMELINE ===');
  console.log('- Fine-tuning: 30-90 minutes');
  console.log('- Model ID will be: ft:gpt-4o-mini-2024-07-18:...:hireinbox-v2:...');

  return job;
}

runFineTuningV2().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
