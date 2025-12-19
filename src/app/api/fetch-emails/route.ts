import { NextResponse } from 'next/server';
import Imap from 'imap-simple';
import { simpleParser } from 'mailparser';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CLIENTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CANONICAL TALENT SCOUT PROMPT (LOCKED — DO NOT MODIFY)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const TALENT_SCOUT_PROMPT = `You are an expert talent scout — not just a CV matcher.

Your job is to find exceptional people, including those who might be overlooked by less careful reviewers.

You evaluate:
1. Hard requirements (do they qualify?)
2. Achievement quality (did they excel, or just show up?)
3. Leadership signals (were they ever chosen to lead?)
4. Growth trajectory (are they rising or plateauing?)
5. Character indicators (what do their choices reveal?)
6. Red flags (what concerns need investigation?)

LEADERSHIP SIGNALS TO LOOK FOR (at any life stage):
- School: Prefect, head boy/girl, sports captain, society president
- University: Team captain, society leadership, academic awards
- Work: Team lead, mentor, trainer, "led a team of...", promoted to...
- Personal: Started a business, community involvement, volunteer leadership

ACHIEVEMENT QUALITY:
- Look for numbers, awards, promotions, and recognition
- Distinguish impact from responsibility

TRAJECTORY ASSESSMENT:
- Is responsibility increasing over time?
- Is there evidence of recognition or stagnation?

RED FLAGS (NOTE, NOT JUDGE):
- Unexplained gaps
- Inconsistencies
- Frequent job changes without progression
- Vague or generic CV language

CHARACTER SIGNALS:
- Volunteering
- Side projects
- Sports
- Self-learning

IMPORTANT CONSTRAINTS:
- Do NOT infer age, race, health, religion, or other protected attributes
- Do NOT speculate beyond evidence
- Quote the CV for every claim
- Be balanced, fair, and explicit

You recommend action clearly.

OUTPUT FORMAT:
Respond with valid JSON only. No markdown. No commentary.

{
  "candidate_name": "<extracted name or null>",
  "candidate_email": "<extracted email or null>",
  "candidate_phone": "<extracted phone or null>",
  "candidate_location": "<extracted location or null>",
  "current_title": "<current job title or null>",
  "current_company": "<current company or null>",
  "years_experience": <number or null>,
  "education_level": "<highest qualification or null>",

  "overall_score": <0-100>,
  "recommendation": "<SHORTLIST | CONSIDER | REJECT>",
  "recommendation_reason": "<one sentence>",

  "hard_requirements": {
    "met": ["<requirement>: <evidence from CV>"],
    "not_met": ["<requirement>: <what's missing>"],
    "partial": ["<requirement>: <partially met, explanation>"],
    "unclear": ["<requirement>: <why unclear>"]
  },

  "achievement_quality": {
    "score": <0-100>,
    "evidence": ["<quoted achievement from CV>"],
    "assessment": "<excelled | met expectations | limited evidence>"
  },

  "leadership_signals": {
    "score": <0-100>,
    "evidence": ["<quoted leadership example from CV>"],
    "assessment": "<strong | some | none | unclear>"
  },

  "growth_trajectory": {
    "score": <0-100>,
    "direction": "<rising | stable | declining | unclear>",
    "evidence": "<quoted progression from CV>"
  },

  "character_indicators": {
    "positive": ["<signal>: <evidence from CV>"],
    "notes": "<contextual observation>"
  },

  "red_flags": {
    "concerns": ["<concern>: <evidence or absence>"],
    "severity": "<none | minor | moderate | serious>",
    "investigation_questions": ["<question to ask in interview>"]
  },

  "summary": {
    "strengths": ["<strength with CV evidence>"],
    "weaknesses": ["<weakness with CV evidence>"],
    "fit_assessment": "<2-3 sentence assessment>",
    "interview_focus": ["<area to probe>"]
  }
}

EXCEPTION HANDLING — IMPORTANT:

You are allowed to exercise judgment when a candidate narrowly misses a hard requirement.

Specifically:

If a candidate is within 6–12 months of the stated minimum experience requirement,
AND they demonstrate exceptional indicators in at least TWO of the following:
- Rapid promotion or accelerated responsibility
- Quantified overperformance (e.g. >120% of targets)
- Recognized awards or elite programs
- Clear leadership signals at any life stage
- Strong growth trajectory relative to peers

THEN:
- You MUST NOT automatically reject them
- Downgrade the requirement from "not_met" to "partial"
- Prefer a recommendation of "CONSIDER" over "REJECT"

In such cases:
- Explicitly explain WHY an exception is justified
- Quote concrete evidence from the CV
- Flag the experience gap clearly but frame it as manageable risk

This exception must be used sparingly and only when evidence is compelling.`;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HELPER FUNCTIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function isPDF(attachment: { contentType?: string; filename?: string }): boolean {
  const contentType = attachment.contentType?.toLowerCase() || '';
  const filename = attachment.filename?.toLowerCase() || '';
  return contentType.includes('pdf') || filename.endsWith('.pdf');
}

function isWordDoc(attachment: { contentType?: string; filename?: string }): boolean {
  const contentType = attachment.contentType?.toLowerCase() || '';
  const filename = attachment.filename?.toLowerCase() || '';
  return contentType.includes('word') || 
         contentType.includes('document') ||
         filename.endsWith('.doc') || 
         filename.endsWith('.docx');
}

function isImageOrOther(attachment: { contentType?: string; filename?: string }): boolean {
  const contentType = attachment.contentType?.toLowerCase() || '';
  return contentType.includes('image') || 
         contentType.includes('gif') || 
         contentType.includes('png') || 
         contentType.includes('jpeg') ||
         contentType.includes('jpg');
}

/**
 * Build role context string from role data
 */
function buildRoleContext(role: Record<string, unknown>): string {
  const sections: string[] = [];
  
  sections.push(`ROLE: ${role.title || 'Unspecified'}`);

  // Handle new schema fields
  const context = role.context as Record<string, unknown> | undefined;
  if (context) {
    if (context.seniority) sections.push(`SENIORITY: ${context.seniority}`);
    if (context.employment_type) sections.push(`TYPE: ${context.employment_type}`);
    if (context.industry) sections.push(`INDUSTRY: ${context.industry}`);
  }

  // Handle facts (hard requirements)
  const facts = role.facts as Record<string, unknown> | undefined;
  if (facts && Object.keys(facts).length > 0) {
    sections.push('\nHARD REQUIREMENTS:');
    if (facts.min_experience_years !== undefined) {
      sections.push(`- Minimum ${facts.min_experience_years} years experience`);
    }
    if (Array.isArray(facts.required_skills) && facts.required_skills.length > 0) {
      sections.push(`- Required skills: ${facts.required_skills.join(', ')}`);
    }
    if (Array.isArray(facts.qualifications) && facts.qualifications.length > 0) {
      sections.push(`- Qualifications: ${facts.qualifications.join(', ')}`);
    }
    if (facts.location) sections.push(`- Location: ${facts.location}`);
    if (facts.work_type) sections.push(`- Work type: ${facts.work_type}`);
    if (facts.must_have) sections.push(`- Must have: ${facts.must_have}`);
  }

  // Handle preferences
  const preferences = role.preferences as Record<string, unknown> | undefined;
  if (preferences?.nice_to_have) {
    sections.push(`\nNICE TO HAVE: ${preferences.nice_to_have}`);
  }

  // Handle AI guidance
  const aiGuidance = role.ai_guidance as Record<string, unknown> | undefined;
  if (aiGuidance) {
    if (aiGuidance.strong_fit) {
      sections.push(`\nSTRONG FIT LOOKS LIKE: ${aiGuidance.strong_fit}`);
    }
    if (aiGuidance.disqualifiers) {
      sections.push(`\nDISQUALIFIERS: ${aiGuidance.disqualifiers}`);
    }
  }

  // Handle screening questions
  const screeningQuestions = role.screening_questions as string[] | undefined;
  if (Array.isArray(screeningQuestions) && screeningQuestions.length > 0) {
    sections.push('\nSCREENING QUESTIONS:');
    screeningQuestions.forEach((q: string) => sections.push(`- ${q}`));
  }

  // Fallback to legacy criteria
  const criteria = role.criteria as Record<string, unknown> | undefined;
  if (criteria && (!facts || Object.keys(facts).length === 0)) {
    sections.push('\nREQUIREMENTS:');
    if (criteria.min_experience_years !== undefined) {
      sections.push(`- Minimum ${criteria.min_experience_years} years experience`);
    }
    if (Array.isArray(criteria.required_skills) && criteria.required_skills.length > 0) {
      sections.push(`- Required skills: ${criteria.required_skills.join(', ')}`);
    }
    if (Array.isArray(criteria.locations) && criteria.locations.length > 0) {
      sections.push(`- Location: ${criteria.locations.join(' or ')}`);
    }
    if (Array.isArray(criteria.preferred_skills) && criteria.preferred_skills.length > 0) {
      sections.push(`- Preferred: ${criteria.preferred_skills.join(', ')}`);
    }
    if (criteria.education) {
      sections.push(`- Education: ${criteria.education}`);
    }
    if (Array.isArray(criteria.dealbreakers) && criteria.dealbreakers.length > 0) {
      sections.push(`- Dealbreakers: ${criteria.dealbreakers.join(', ')}`);
    }
  }

  return sections.join('\n');
}

/**
 * Map recommendation to candidate status
 */
function mapRecommendationToStatus(recommendation: string): string {
  switch ((recommendation || '').toUpperCase()) {
    case 'SHORTLIST': return 'shortlist';
    case 'CONSIDER': return 'talent_pool';
    case 'REJECT': return 'reject';
    default: return 'screened';
  }
}

/**
 * Screen CV using Talent Scout AI
 */
async function screenCVWithTalentScout(cvText: string, role: Record<string, unknown>) {
  const roleContext = buildRoleContext(role);

  const userPrompt = `ROLE CONTEXT:
${roleContext}

CV TO EVALUATE:
${cvText}

Evaluate this candidate against the role requirements. Respond with valid JSON only.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0,
      max_tokens: 4000,
      messages: [
        { role: 'system', content: TALENT_SCOUT_PROMPT },
        { role: 'user', content: userPrompt }
      ],
    });

    const responseText = completion.choices[0]?.message?.content || '{}';
    
    // Clean and parse JSON
    const cleanedResponse = responseText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
    
    return JSON.parse(cleanedResponse);
  } catch (error) {
    console.error('Talent Scout screening error:', error);
    return null;
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// API ROUTE HANDLER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function POST() {
  try {
    const config = {
      imap: {
        user: process.env.GMAIL_USER!,
        password: process.env.GMAIL_APP_PASSWORD!,
        host: 'imap.gmail.com',
        port: 993,
        tls: true,
        authTimeout: 10000,
        tlsOptions: { rejectUnauthorized: false }
      }
    };

    console.log('Connecting to Gmail...');
    const connection = await Imap.connect(config);
    
    await connection.openBox('Hireinbox');
    console.log('Opened Hireinbox folder');

    const searchCriteria = ['UNSEEN'];
    const fetchOptions = {
      bodies: ['HEADER', 'TEXT', ''],
      markSeen: true,
      struct: true
    };

    const messages = await connection.search(searchCriteria, fetchOptions);
    console.log(`Found ${messages.length} unread messages`);
    
    const processed: string[] = [];
    const errors: string[] = [];

    // Get active role
    const { data: roles } = await supabase
      .from('roles')
      .select('*')
      .eq('status', 'active')
      .limit(1);
    
    const activeRole = roles?.[0];

    if (!activeRole) {
      connection.end();
      return NextResponse.json({ error: 'No active role found' }, { status: 400 });
    }

    console.log(`Using active role: ${activeRole.title} (${activeRole.id})`);

    for (const message of messages) {
      try {
        const all = message.parts.find((part: { which: string }) => part.which === '');
        if (!all) continue;

        const parsed = await simpleParser(all.body);
        
        // Skip our own auto-reply emails
        const fromEmail = parsed.from?.value?.[0]?.address?.toLowerCase() || '';
        if (fromEmail === process.env.GMAIL_USER?.toLowerCase()) {
          console.log('Skipping our own email');
          continue;
        }
        
        // Skip emails with auto-reply subjects
        if (parsed.subject?.includes('Application Received') || 
            parsed.subject?.includes('Application Update') ||
            parsed.subject?.includes('Great News')) {
          console.log('Skipping auto-reply email');
          continue;
        }
        
        console.log(`Processing email from: ${parsed.from?.text}`);
        console.log(`Subject: ${parsed.subject}`);
        console.log(`Attachments: ${parsed.attachments?.length || 0}`);
        
        let cvText = '';
        let foundCV = false;
        
        // Process attachments
        if (parsed.attachments && parsed.attachments.length > 0) {
          for (const attachment of parsed.attachments) {
            console.log(`Attachment: ${attachment.filename} (${attachment.contentType})`);
            
            // Skip images
            if (isImageOrOther(attachment)) {
              console.log(`Skipping image/other: ${attachment.filename}`);
              continue;
            }
            
            // Handle PDFs
            if (isPDF(attachment)) {
              console.log(`Processing PDF: ${attachment.filename}`);
              try {
                const pdfParse = (await import('pdf-parse')).default;
                const pdfData = await pdfParse(attachment.content);
                if (pdfData.text && pdfData.text.trim().length > 50) {
                  cvText += pdfData.text + '\n';
                  foundCV = true;
                  console.log(`✓ Extracted ${pdfData.text.length} chars from PDF`);
                } else {
                  console.log(`✗ PDF extracted but too short: ${pdfData.text?.length || 0} chars`);
                }
              } catch (pdfError) {
                console.error('PDF parse error:', pdfError);
                errors.push(`PDF parse failed: ${attachment.filename}`);
              }
            }
            
            // Handle Word docs
            if (isWordDoc(attachment)) {
              console.log(`Processing Word doc: ${attachment.filename}`);
              try {
                const mammoth = (await import('mammoth')).default;
                const result = await mammoth.extractRawText({ buffer: attachment.content });
                if (result.value && result.value.trim().length > 50) {
                  cvText += result.value + '\n';
                  foundCV = true;
                  console.log(`✓ Extracted ${result.value.length} chars from Word doc`);
                } else {
                  console.log(`✗ Word doc extracted but too short: ${result.value?.length || 0} chars`);
                }
              } catch (docError) {
                console.error('Word doc parse error:', docError);
                errors.push(`Word parse failed: ${attachment.filename}`);
              }
            }
          }
        }
        
        // Fallback to email body if no CV attachment
        if (!foundCV && parsed.text) {
          console.log('No CV attachment found, using email body');
          cvText = parsed.text;
        }

        // Skip if insufficient content
        if (!cvText.trim() || cvText.trim().length < 100) {
          console.log(`Skipping - insufficient content (${cvText.trim().length} chars)`);
          errors.push(`Insufficient content from: ${fromEmail}`);
          continue;
        }

        console.log(`Screening CV with Talent Scout (${cvText.length} characters)...`);
        
        // Use Talent Scout screening
        const analysis = await screenCVWithTalentScout(cvText, activeRole);
        
        if (!analysis) {
          console.log('AI analysis failed');
          errors.push(`AI screening failed for: ${fromEmail}`);
          continue;
        }

        console.log(`✓ AI Result: ${analysis.candidate_name || 'Unknown'} - Score: ${analysis.overall_score} - ${analysis.recommendation}`);

        // Extract name from email subject as fallback
        let candidateName = analysis.candidate_name;
        if (!candidateName && parsed.subject) {
          const subjectMatch = parsed.subject.match(/(?:FW:|RE:|Fwd:)?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i);
          if (subjectMatch) {
            candidateName = subjectMatch[1].trim();
            console.log(`Extracted name from subject: ${candidateName}`);
          }
        }

        // Determine status from recommendation
        const status = mapRecommendationToStatus(analysis.recommendation);

        // Insert candidate with full Talent Scout analysis
        const { error: insertError } = await supabase.from('candidates').insert({
          company_id: activeRole.company_id,
          role_id: activeRole.id,
          name: candidateName || 'Unknown Candidate',
          email: analysis.candidate_email || parsed.from?.value?.[0]?.address,
          phone: analysis.candidate_phone,
          location: analysis.candidate_location,
          cv_text: cvText,
          
          // Talent Scout fields
          ai_score: analysis.overall_score,
          ai_recommendation: analysis.recommendation,
          ai_reasoning: analysis.summary?.fit_assessment || analysis.recommendation_reason,
          screening_result: analysis,
          screened_at: new Date().toISOString(),
          status: status,
          
          // Legacy fields (for backward compatibility)
          score: analysis.overall_score,
          strengths: analysis.summary?.strengths || [],
          missing: analysis.summary?.weaknesses || [],
        });

        if (insertError) {
          console.error('Failed to insert candidate:', insertError);
          errors.push(`DB insert failed for: ${candidateName || fromEmail}`);
          continue;
        }

        processed.push(candidateName || parsed.from?.value?.[0]?.address || 'Unknown');
        console.log(`✓ Saved candidate: ${candidateName}`);

        // Send acknowledgment email
        const candidateEmail = analysis.candidate_email || parsed.from?.value?.[0]?.address;
        if (candidateEmail) {
          try {
            const { sendAcknowledgmentEmail } = await import('@/lib/email');
            await sendAcknowledgmentEmail(
              candidateEmail,
              candidateName || 'applicant',
              activeRole.title,
              'HireInbox'
            );
            console.log(`✓ Sent acknowledgment to: ${candidateEmail}`);
          } catch (emailError) {
            console.error('Failed to send acknowledgment:', emailError);
          }
        }
      } catch (msgError) {
        console.error('Message processing error:', msgError);
        errors.push(`Processing error: ${msgError instanceof Error ? msgError.message : 'Unknown'}`);
      }
    }

    connection.end();
    console.log(`Finished processing. Success: ${processed.length}, Errors: ${errors.length}`);

    return NextResponse.json({ 
      success: true, 
      processed: processed.length,
      candidates: processed,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Email fetch error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch emails',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
