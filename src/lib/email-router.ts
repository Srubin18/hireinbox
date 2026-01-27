import Anthropic from '@anthropic-ai/sdk';

// ============================================
// OPTION D: HYBRID MULTI-ROLE EMAIL ROUTING
//
// Single inbox: jobs@acmecorp.hireinbox.co.za
// AI reads subject line to match role
// Unclear → "Needs Assignment" queue
// Employer manually assigns if needed
// ============================================

export interface Role {
  id: string;
  title: string;
  department?: string;
  keywords?: string[];
}

export interface RoutingResult {
  matchedRoleId: string | null;
  confidence: 'high' | 'medium' | 'low' | 'none';
  reason: string;
  suggestedRoles?: { roleId: string; confidence: number }[];
  needsAssignment: boolean;
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || ''
});

/**
 * Route an incoming email to the correct role based on subject and content
 */
export async function routeEmail(
  subject: string,
  emailBody: string,
  roles: Role[]
): Promise<RoutingResult> {
  // If no roles or empty subject, needs assignment
  if (roles.length === 0) {
    return {
      matchedRoleId: null,
      confidence: 'none',
      reason: 'No active roles to match against',
      needsAssignment: true
    };
  }

  // If only one role, auto-assign with high confidence
  if (roles.length === 1) {
    return {
      matchedRoleId: roles[0].id,
      confidence: 'high',
      reason: 'Only one active role - auto-assigned',
      needsAssignment: false
    };
  }

  // Build role context for AI
  const roleContext = roles.map(r =>
    `- Role ID: ${r.id}, Title: "${r.title}"${r.department ? `, Dept: ${r.department}` : ''}${r.keywords?.length ? `, Keywords: ${r.keywords.join(', ')}` : ''}`
  ).join('\n');

  // Use AI to match
  const prompt = `You are an email router for a recruitment system. Your job is to match incoming job applications to the correct role.

AVAILABLE ROLES:
${roleContext}

INCOMING EMAIL:
Subject: ${subject}
Body excerpt: ${emailBody.slice(0, 500)}

TASK:
Determine which role this application is for. Look for:
1. Direct mention of job title in subject or body
2. Keywords matching role requirements
3. Department mentions
4. Role IDs if included

Respond with JSON only:
{
  "matchedRoleId": "role_id or null if uncertain",
  "confidence": "high" | "medium" | "low" | "none",
  "reason": "brief explanation",
  "suggestedRoles": [{"roleId": "id", "confidence": 0.0-1.0}] // top 2-3 if uncertain
}`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-3-5-20241022',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }]
    });

    const textContent = response.content.find(c => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No response from AI');
    }

    // Parse JSON response
    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON in response');
    }

    const result = JSON.parse(jsonMatch[0]);

    // Validate matched role exists
    if (result.matchedRoleId) {
      const roleExists = roles.some(r => r.id === result.matchedRoleId);
      if (!roleExists) {
        result.matchedRoleId = null;
        result.confidence = 'none';
        result.reason = 'AI suggested unknown role';
      }
    }

    return {
      matchedRoleId: result.matchedRoleId,
      confidence: result.confidence,
      reason: result.reason,
      suggestedRoles: result.suggestedRoles,
      needsAssignment: result.confidence === 'none' || result.confidence === 'low'
    };

  } catch (error) {
    console.error('Email routing error:', error);
    // Fallback: try simple keyword matching
    return simpleKeywordMatch(subject, emailBody, roles);
  }
}

/**
 * Simple fallback: keyword matching without AI
 */
function simpleKeywordMatch(subject: string, body: string, roles: Role[]): RoutingResult {
  const combined = `${subject} ${body}`.toLowerCase();

  let bestMatch: { role: Role; score: number } | null = null;

  for (const role of roles) {
    let score = 0;

    // Check title match
    if (combined.includes(role.title.toLowerCase())) {
      score += 10;
    }

    // Check title words
    const titleWords = role.title.toLowerCase().split(/\s+/);
    for (const word of titleWords) {
      if (word.length > 3 && combined.includes(word)) {
        score += 2;
      }
    }

    // Check keywords
    if (role.keywords) {
      for (const keyword of role.keywords) {
        if (combined.includes(keyword.toLowerCase())) {
          score += 3;
        }
      }
    }

    // Check department
    if (role.department && combined.includes(role.department.toLowerCase())) {
      score += 5;
    }

    if (!bestMatch || score > bestMatch.score) {
      bestMatch = { role, score };
    }
  }

  if (bestMatch && bestMatch.score >= 5) {
    return {
      matchedRoleId: bestMatch.role.id,
      confidence: bestMatch.score >= 10 ? 'high' : 'medium',
      reason: `Keyword match (score: ${bestMatch.score})`,
      needsAssignment: false
    };
  }

  return {
    matchedRoleId: null,
    confidence: 'none',
    reason: 'No clear role match found',
    needsAssignment: true
  };
}

/**
 * Get emails that need manual assignment
 */
export interface UnassignedEmail {
  id: string;
  subject: string;
  fromEmail: string;
  receivedAt: string;
  suggestedRoles?: { roleId: string; confidence: number }[];
}

/**
 * Manually assign an email to a role
 */
export async function assignEmailToRole(
  emailId: string,
  roleId: string,
  assignedBy: string
): Promise<{ success: boolean; error?: string }> {
  // This would update the candidate record in the database
  // For now, return success
  console.log(`[Router] Assigning email ${emailId} to role ${roleId} by ${assignedBy}`);
  return { success: true };
}
