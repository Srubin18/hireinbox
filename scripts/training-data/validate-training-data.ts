#!/usr/bin/env npx ts-node

/**
 * RALPH Brain Data Validator
 *
 * Validates training data quality and identifies issues.
 * Run before fine-tuning to ensure data quality.
 *
 * Usage: npx ts-node scripts/training-data/validate-training-data.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface TrainingExample {
  messages: {
    role: 'system' | 'user' | 'assistant';
    content: string;
  }[];
}

interface ValidationIssue {
  line: number;
  issue: string;
  severity: 'critical' | 'warning' | 'info';
  sample?: string;
}

function validateTrainingData(filePath: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.trim().split('\n');

  console.log(`\nValidating ${lines.length} training examples...\n`);

  lines.forEach((line, index) => {
    const lineNum = index + 1;

    try {
      const example: TrainingExample = JSON.parse(line);
      const userContent = example.messages.find(m => m.role === 'user')?.content || '';
      const assistantContent = example.messages.find(m => m.role === 'assistant')?.content || '';

      // Check for [object Object]
      if (userContent.includes('[object Object]')) {
        issues.push({
          line: lineNum,
          issue: 'Education field not serialized: [object Object]',
          severity: 'critical',
          sample: userContent.substring(0, 100)
        });
      }

      // Check for zero experience
      if (userContent.includes('Experience: 0 years')) {
        issues.push({
          line: lineNum,
          issue: 'Experience always 0 years',
          severity: 'critical'
        });
      }

      // Check for unspecified role
      if (userContent.includes('Not specified at Not specified')) {
        issues.push({
          line: lineNum,
          issue: 'Current role not extracted',
          severity: 'critical'
        });
      }

      // Check for empty work history
      if (userContent.includes('WORK HISTORY:\n\n') || userContent.match(/WORK HISTORY:\s*$/)) {
        issues.push({
          line: lineNum,
          issue: 'Work history is empty',
          severity: 'warning'
        });
      }

      // Check for hallucination risk: assistant claims experience not in user content
      const experienceMatch = assistantContent.match(/(\d+)\s*years?\s*(of\s+)?experience/i);
      if (experienceMatch && userContent.includes('Experience: 0 years')) {
        const claimedYears = parseInt(experienceMatch[1]);
        if (claimedYears > 0) {
          issues.push({
            line: lineNum,
            issue: `Hallucination: Claims ${claimedYears} years experience but CV shows 0`,
            severity: 'critical',
            sample: experienceMatch[0]
          });
        }
      }

      // Check for missing evidence in strengths
      try {
        const response = JSON.parse(assistantContent);
        if (response.strengths && Array.isArray(response.strengths)) {
          response.strengths.forEach((strength: { evidence?: string }) => {
            if (strength.evidence) {
              // Check if evidence quote exists in user content
              const evidenceSnippet = strength.evidence.substring(0, 30);
              if (!userContent.toLowerCase().includes(evidenceSnippet.toLowerCase())) {
                issues.push({
                  line: lineNum,
                  issue: 'Evidence quote not found in source CV',
                  severity: 'warning',
                  sample: strength.evidence.substring(0, 50)
                });
              }
            }
          });
        }
      } catch {
        // Response not valid JSON
        issues.push({
          line: lineNum,
          issue: 'Assistant response is not valid JSON',
          severity: 'critical'
        });
      }

    } catch (e) {
      issues.push({
        line: lineNum,
        issue: `Parse error: ${e}`,
        severity: 'critical'
      });
    }
  });

  return issues;
}

function generateReport(issues: ValidationIssue[], totalLines: number): void {
  const criticalCount = issues.filter(i => i.severity === 'critical').length;
  const warningCount = issues.filter(i => i.severity === 'warning').length;
  const infoCount = issues.filter(i => i.severity === 'info').length;

  // Group by issue type
  const issuesByType: Record<string, number> = {};
  issues.forEach(issue => {
    const key = issue.issue.split(':')[0];
    issuesByType[key] = (issuesByType[key] || 0) + 1;
  });

  console.log('='.repeat(60));
  console.log('RALPH BRAIN DATA VALIDATION REPORT');
  console.log('='.repeat(60));
  console.log();
  console.log(`Total examples:    ${totalLines}`);
  console.log(`Critical issues:   ${criticalCount}`);
  console.log(`Warnings:          ${warningCount}`);
  console.log(`Info:              ${infoCount}`);
  console.log();
  console.log('Issues by Type:');
  console.log('-'.repeat(40));
  Object.entries(issuesByType)
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      const pct = ((count / totalLines) * 100).toFixed(1);
      console.log(`  ${type}: ${count} (${pct}%)`);
    });
  console.log();

  if (criticalCount > totalLines * 0.1) {
    console.log('STATUS: FAIL - Too many critical issues');
    console.log('ACTION: Fix data generation pipeline before V4 training');
  } else if (criticalCount > 0) {
    console.log('STATUS: WARNING - Some critical issues found');
    console.log('ACTION: Review and fix before production use');
  } else {
    console.log('STATUS: PASS - Data quality acceptable');
  }
  console.log();
}

// Main execution
const dataDir = path.join(__dirname, 'data');
const trainFile = path.join(dataDir, 'finetune_v3_train.jsonl');

if (fs.existsSync(trainFile)) {
  const issues = validateTrainingData(trainFile);
  const totalLines = fs.readFileSync(trainFile, 'utf-8').trim().split('\n').length;
  generateReport(issues, totalLines);
} else {
  console.error('Training file not found:', trainFile);
  process.exit(1);
}
