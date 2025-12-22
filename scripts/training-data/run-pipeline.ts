/**
 * HIREINBOX TRAINING DATA - Master Pipeline Runner
 * Runs the complete data generation and screening pipeline
 *
 * Usage: npx ts-node run-pipeline.ts
 *
 * This will:
 * 1. Generate 300 job posts
 * 2. Generate 1000 CVs
 * 3. Run AI screening on all pairs
 * 4. Export CSV for human review
 *
 * Estimated cost: ~$50-70
 * Estimated time: 2-3 hours
 */

import { execSync, spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');

async function runStep(name: string, script: string): Promise<void> {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`STEP: ${name}`);
  console.log(`${'='.repeat(50)}\n`);

  return new Promise((resolve, reject) => {
    const child = spawn('npx', ['ts-node', '--esm', script], {
      cwd: __dirname,
      stdio: 'inherit',
      shell: true
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log(`\n✓ ${name} completed successfully\n`);
        resolve();
      } else {
        reject(new Error(`${name} failed with code ${code}`));
      }
    });

    child.on('error', (err) => {
      reject(err);
    });
  });
}

async function main(): Promise<void> {
  const startTime = Date.now();

  console.log(`
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║   HIREINBOX - AI TRAINING DATA PIPELINE                  ║
║                                                          ║
║   This will generate:                                    ║
║   • 300 South African job posts                          ║
║   • 1,000 synthetic CVs (varied quality)                 ║
║   • 1,000 AI screening verdicts                          ║
║   • CSV export for human review                          ║
║                                                          ║
║   Estimated cost: ~$50-70                                ║
║   Estimated time: 2-3 hours                              ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
`);

  // Create data directory
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  try {
    // Step 1: Generate Jobs
    const jobsPath = path.join(DATA_DIR, 'jobs.json');
    if (fs.existsSync(jobsPath)) {
      const jobs = JSON.parse(fs.readFileSync(jobsPath, 'utf-8'));
      if (jobs.length >= 300) {
        console.log(`✓ Jobs already generated (${jobs.length} found), skipping...`);
      } else {
        await runStep('Generate 300 Job Posts', 'generate-jobs.ts');
      }
    } else {
      await runStep('Generate 300 Job Posts', 'generate-jobs.ts');
    }

    // Step 2: Generate CVs
    const cvsPath = path.join(DATA_DIR, 'cvs.json');
    if (fs.existsSync(cvsPath)) {
      const cvs = JSON.parse(fs.readFileSync(cvsPath, 'utf-8'));
      if (cvs.length >= 1000) {
        console.log(`✓ CVs already generated (${cvs.length} found), skipping...`);
      } else {
        await runStep('Generate 1000 CVs', 'generate-cvs.ts');
      }
    } else {
      await runStep('Generate 1000 CVs', 'generate-cvs.ts');
    }

    // Step 3: Run Screening
    const resultsPath = path.join(DATA_DIR, 'screening_results.json');
    if (fs.existsSync(resultsPath)) {
      const results = JSON.parse(fs.readFileSync(resultsPath, 'utf-8'));
      if (results.length >= 1000) {
        console.log(`✓ Screening already done (${results.length} found), skipping...`);
      } else {
        await runStep('Run AI Screening (1000 pairs)', 'run-screening.ts');
      }
    } else {
      await runStep('Run AI Screening (1000 pairs)', 'run-screening.ts');
    }

    // Step 4: Export for Review
    await runStep('Export for Human Review', 'export-review.ts');

    // Complete
    const elapsed = Math.round((Date.now() - startTime) / 1000 / 60);
    console.log(`
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║   ✅ PIPELINE COMPLETE                                   ║
║                                                          ║
║   Time elapsed: ${String(elapsed).padStart(3)} minutes                            ║
║                                                          ║
║   Output files:                                          ║
║   • data/jobs.json (300 job posts)                       ║
║   • data/cvs.json (1000 CVs)                             ║
║   • data/screening_results.json (1000 verdicts)          ║
║   • data/human_review.csv (for human review)             ║
║   • data/human_review_full.json (detailed data)          ║
║   • data/stats.json (summary statistics)                 ║
║                                                          ║
║   Next steps:                                            ║
║   1. Open human_review.csv in Google Sheets              ║
║   2. Review AI verdicts, mark agree/disagree             ║
║   3. Run analysis to find where AI fails                 ║
║   4. Refine prompts based on patterns                    ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
`);

  } catch (error) {
    console.error('\n❌ Pipeline failed:', error);
    console.log('\nThe pipeline saves progress, so you can re-run to continue from where it stopped.');
    process.exit(1);
  }
}

main();
