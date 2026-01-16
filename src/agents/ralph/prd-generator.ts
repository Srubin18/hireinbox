/**
 * RALPH - PRD Generator
 * Converts a feature description into a structured PRD using Claude
 */

import Anthropic from '@anthropic-ai/sdk';
import { RalphPRD } from './types';

const anthropic = new Anthropic();

/**
 * Generate a PRD from a feature description
 */
export async function generatePRD(
  featureDescription: string,
  context?: string
): Promise<RalphPRD> {
  const systemPrompt = `You are RALPH, an expert product manager for HotJupiter - a WhatsApp-based instant website builder for South African small businesses.

Your job is to take a feature description and create a clear, actionable PRD (Product Requirements Document).

CONTEXT ABOUT HOTJUPITER:
- Users message a WhatsApp number and get a website in 60 seconds
- Target audience: SA small businesses (spaza shops, salons, food vendors)
- Tech stack: Next.js, Vercel, Supabase, Claude AI, 360dialog WhatsApp API
- FREE model with R99 upsells

OUTPUT FORMAT (JSON only, no markdown):
{
  "id": "PRD-XXX",
  "title": "Short title",
  "description": "1-2 sentence description",
  "goal": "What success looks like",
  "successCriteria": ["Measurable criteria 1", "Criteria 2"],
  "outOfScope": ["What we're NOT doing"],
  "technicalNotes": ["Implementation hints"],
  "status": "draft"
}`;

  const userPrompt = `Create a PRD for this feature:

${featureDescription}

${context ? `Additional context:\n${context}` : ''}

Return ONLY valid JSON, no markdown formatting.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    // Parse JSON from response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const prd = JSON.parse(jsonMatch[0]) as Partial<RalphPRD>;

    // Add metadata
    return {
      id: prd.id || `PRD-${Date.now().toString(36).toUpperCase()}`,
      title: prd.title || featureDescription.slice(0, 50),
      description: prd.description || featureDescription,
      goal: prd.goal || 'Complete the feature successfully',
      successCriteria: prd.successCriteria || [],
      outOfScope: prd.outOfScope || [],
      technicalNotes: prd.technicalNotes || [],
      createdAt: new Date().toISOString(),
      status: 'draft',
    };
  } catch (error) {
    console.error('[RALPH] PRD generation failed:', error);

    // Return a basic PRD on failure
    return {
      id: `PRD-${Date.now().toString(36).toUpperCase()}`,
      title: featureDescription.slice(0, 50),
      description: featureDescription,
      goal: 'Complete the feature',
      successCriteria: ['Feature works as described'],
      outOfScope: [],
      technicalNotes: [],
      createdAt: new Date().toISOString(),
      status: 'draft',
    };
  }
}
