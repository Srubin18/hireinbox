import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import crypto from 'crypto';

// ============================================
// REFERENCE CHECK API
// Extract refs from CV, send requests, receive responses
// ============================================

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || ''
});

// Extract references from CV text using AI
async function extractReferences(cvText: string): Promise<Array<{
  name: string;
  email?: string;
  phone?: string;
  relationship: string;
  company?: string;
}>> {
  const prompt = `Extract all references from this CV text. Look for:
- Names and contact details in a "References" section
- Managers or supervisors mentioned who could be contacted
- Any other professional references

CV TEXT:
${cvText.slice(0, 4000)}

Return a JSON array of references found:
[
  {
    "name": "Full Name",
    "email": "email@example.com or null",
    "phone": "+27 123 4567 or null",
    "relationship": "Manager at Company Name",
    "company": "Company Name or null"
  }
]

If no references are found, return an empty array [].
Only return the JSON array, no other text.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-3-5-20241022',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }]
    });

    const textContent = response.content.find(c => c.type === 'text');
    if (!textContent || textContent.type !== 'text') return [];

    const jsonMatch = textContent.text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Reference extraction error:', error);
    return [];
  }
}

// Generate secure token for reference form
function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Extract references from a candidate's CV
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    // Route to correct handler
    if (action === 'extract') {
      return handleExtract(body);
    } else if (action === 'send') {
      return handleSendRequest(body);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Reference check error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Extract references from CV
async function handleExtract(body: { candidateId: string; cvText: string }) {
  const { candidateId, cvText } = body;

  if (!candidateId || !cvText) {
    return NextResponse.json(
      { error: 'candidateId and cvText are required' },
      { status: 400 }
    );
  }

  // Extract references using AI
  const references = await extractReferences(cvText);

  if (references.length === 0) {
    return NextResponse.json({
      success: true,
      references: [],
      message: 'No references found in CV'
    });
  }

  // Save to database
  const savedRefs = [];
  for (const ref of references) {
    const { data, error } = await supabase
      .from('candidate_references')
      .insert({
        candidate_id: candidateId,
        name: ref.name,
        email: ref.email || null,
        phone: ref.phone || null,
        relationship: ref.relationship,
        company: ref.company || null,
        extracted_from: 'cv'
      })
      .select()
      .single();

    if (!error && data) {
      savedRefs.push(data);
    }
  }

  return NextResponse.json({
    success: true,
    references: savedRefs,
    message: `Extracted ${savedRefs.length} references`
  });
}

// Send reference request email
async function handleSendRequest(body: {
  referenceId: string;
  candidateId: string;
  roleId?: string;
  requestedBy: string;
  customQuestions?: string[];
}) {
  const { referenceId, candidateId, roleId, requestedBy, customQuestions } = body;

  if (!referenceId || !candidateId) {
    return NextResponse.json(
      { error: 'referenceId and candidateId are required' },
      { status: 400 }
    );
  }

  // Get reference details
  const { data: reference, error: refError } = await supabase
    .from('candidate_references')
    .select('*')
    .eq('id', referenceId)
    .single();

  if (refError || !reference) {
    return NextResponse.json({ error: 'Reference not found' }, { status: 404 });
  }

  if (!reference.email) {
    return NextResponse.json(
      { error: 'Reference has no email address' },
      { status: 400 }
    );
  }

  // Get default questions if no custom ones provided
  let questions = customQuestions;
  if (!questions) {
    const { data: template } = await supabase
      .from('reference_question_templates')
      .select('questions')
      .eq('is_default', true)
      .single();

    questions = template?.questions || [];
  }

  // Generate token and expiry
  const token = generateToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  // Create request record
  const { data: requestRecord, error: reqError } = await supabase
    .from('reference_requests')
    .insert({
      reference_id: referenceId,
      candidate_id: candidateId,
      role_id: roleId || null,
      requested_by: requestedBy,
      token,
      questions,
      status: 'sent',
      sent_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString()
    })
    .select()
    .single();

  if (reqError) {
    console.error('Create request error:', reqError);
    return NextResponse.json(
      { error: 'Failed to create reference request' },
      { status: 500 }
    );
  }

  // In production, send email here via Postmark/SendGrid
  // For now, return the form URL
  const formUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://hireinbox.co.za'}/reference/${token}`;

  return NextResponse.json({
    success: true,
    requestId: requestRecord.id,
    formUrl,
    message: `Reference request created. Form URL: ${formUrl}`
  });
}

// Get references for a candidate
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const candidateId = searchParams.get('candidateId');
    const token = searchParams.get('token');

    if (token) {
      // Get request by token (for reference form)
      const { data: requestData, error } = await supabase
        .from('reference_requests')
        .select(`
          *,
          candidate:candidates (name),
          reference:candidate_references (name, company)
        `)
        .eq('token', token)
        .single();

      if (error || !requestData) {
        return NextResponse.json({ error: 'Request not found' }, { status: 404 });
      }

      // Check if expired
      if (new Date(requestData.expires_at) < new Date()) {
        return NextResponse.json({ error: 'Request expired' }, { status: 410 });
      }

      // Mark as opened if first time
      if (requestData.status === 'sent') {
        await supabase
          .from('reference_requests')
          .update({ status: 'opened', opened_at: new Date().toISOString() })
          .eq('id', requestData.id);
      }

      return NextResponse.json({
        request: requestData,
        candidateName: requestData.candidate?.name,
        refereeName: requestData.reference?.name,
        company: requestData.reference?.company
      });
    }

    if (candidateId) {
      // Get all references for candidate
      const { data: references, error } = await supabase
        .from('candidate_references')
        .select(`
          *,
          requests:reference_requests (
            id,
            status,
            sent_at,
            completed_at
          )
        `)
        .eq('candidate_id', candidateId);

      if (error) {
        return NextResponse.json({ error: 'Failed to fetch references' }, { status: 500 });
      }

      return NextResponse.json({ references });
    }

    return NextResponse.json({ error: 'candidateId or token required' }, { status: 400 });
  } catch (error) {
    console.error('Get references error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
