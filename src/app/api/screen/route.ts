import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { cvText, roleId } = await request.json();

    // Get the role criteria
    const { data: role, error: roleError } = await supabase
      .from('roles')
      .select('*, companies(*)')
      .eq('id', roleId)
      .single();

    if (roleError || !role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    const criteria = role.criteria;

    // Build the AI prompt
    const prompt = `You are screening CVs for: ${role.title}

MUST HAVE (fail without these):
- Minimum ${criteria.min_experience_years} years experience
- Required skills: ${criteria.required_skills?.join(', ') || 'None specified'}
- Location: ${criteria.locations?.join(' or ') || 'Any'}

NICE TO HAVE (boost score):
- Preferred skills: ${criteria.preferred_skills?.join(', ') || 'None specified'}
- Education: ${criteria.education || 'Not specified'}

DEALBREAKERS (auto-reject):
${criteria.dealbreakers?.map((d: string) => `- ${d}`).join('\n') || 'None specified'}

CV TEXT:
${cvText}

Analyze this CV and respond with JSON only (no other text):
{
  "score": <number 0-100>,
  "status": "<SHORTLIST|TALENT_POOL|REJECT>",
  "reasoning": "<1-2 sentences explaining the decision>",
  "candidate_name": "<extracted name or null>",
  "candidate_email": "<extracted email or null>",
  "candidate_phone": "<extracted phone or null>",
  "strengths": ["<strength1>", "<strength2>"],
  "missing": ["<missing1>", "<missing2>"]
}

Scoring guide:
- 70-100: SHORTLIST - Meets all must-haves, strong match
- 40-69: TALENT_POOL - Missing something but good for future roles
- 0-39: REJECT - Missing critical requirements`;

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are an expert HR screener. Respond only with valid JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
    });

    const responseText = completion.choices[0].message.content || '{}';
    
    // Parse the JSON response
    let analysis;
    try {
      analysis = JSON.parse(responseText.replace(/```json\n?|\n?```/g, '').trim());
    } catch {
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

    // Save candidate to database
    const { data: candidate, error: candidateError } = await supabase
      .from('candidates')
      .insert({
        company_id: role.company_id,
        role_id: roleId,
        name: analysis.candidate_name,
        email: analysis.candidate_email,
        phone: analysis.candidate_phone,
        cv_text: cvText,
        score: analysis.score,
        status: analysis.status.toLowerCase(),
        ai_reasoning: analysis.reasoning,
        strengths: analysis.strengths,
        missing: analysis.missing,
      })
      .select()
      .single();

    if (candidateError) {
      return NextResponse.json({ error: 'Failed to save candidate' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      candidate,
      analysis 
    });

  } catch (error) {
    console.error('Screening error:', error);
    return NextResponse.json({ error: 'Screening failed' }, { status: 500 });
  }
}