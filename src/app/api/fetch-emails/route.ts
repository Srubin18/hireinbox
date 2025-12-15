import { NextResponse } from 'next/server';
import Imap from 'imap-simple';
import { simpleParser } from 'mailparser';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function screenCV(cvText: string, roleId: string) {
  const { data: role } = await supabase
    .from('roles')
    .select('*')
    .eq('id', roleId)
    .single();

  if (!role) return null;

  const criteria = role.criteria;

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

Analyze this CV and respond with JSON only:
{
  "score": <number 0-100>,
  "status": "<SHORTLIST|TALENT_POOL|REJECT>",
  "reasoning": "<1-2 sentences>",
  "candidate_name": "<extracted full name or null>",
  "candidate_email": "<extracted email or null>",
  "candidate_phone": "<extracted phone or null>",
  "candidate_location": "<extracted city/location or null>",
  "years_experience": <estimated years as number or null>,
  "current_title": "<current job title or null>",
  "current_company": "<current company or null>",
  "notice_period": "<if mentioned, e.g. '1 month' or null>",
  "education_level": "<e.g. 'BSc', 'MBA', 'Matric' or null>",
  "strengths": ["<strength1>", "<strength2>"],
  "missing": ["<missing1>", "<missing2>"],
  "references": [
    {
      "name": "<reference name or null>",
      "title": "<their job title or null>",
      "company": "<their company or null>",
      "phone": "<phone number or null>",
      "email": "<email or null>",
      "relationship": "<e.g. 'Former Manager', 'Colleague' or null>"
    }
  ],
  "has_references": <true if references found, false if not>
}`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You are an expert HR screener. Always extract the candidate name from the CV. Respond only with valid JSON.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.3,
  });

  const responseText = completion.choices[0].message.content || '{}';
  
  try {
    return JSON.parse(responseText.replace(/```json\n?|\n?```/g, '').trim());
  } catch {
    console.error('Failed to parse AI response:', responseText);
    return null;
  }
}

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

    const { data: roles } = await supabase
      .from('roles')
      .select('*')
      .eq('status', 'active')
      .limit(1);
    
    const activeRoleId = roles?.[0]?.id;

    if (!activeRoleId) {
      connection.end();
      return NextResponse.json({ error: 'No active role found' }, { status: 400 });
    }

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
        
        // Skip emails with "Application Received" in subject (our auto-replies)
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
        
        // Check for PDF and Word attachments - skip images
        if (parsed.attachments && parsed.attachments.length > 0) {
          for (const attachment of parsed.attachments) {
            console.log(`Attachment: ${attachment.filename} (${attachment.contentType})`);
            
            // Skip images and other non-CV files
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
                  console.log(`Extracted ${pdfData.text.length} chars from PDF`);
                }
              } catch (pdfError) {
                console.error('PDF parse error:', pdfError);
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
                  console.log(`Extracted ${result.value.length} chars from Word doc`);
                }
              } catch (docError) {
                console.error('Word doc parse error:', docError);
              }
            }
          }
        }
        
        // If no CV attachment, use email body as fallback
        if (!foundCV && parsed.text) {
          console.log('No CV attachment found, using email body');
          cvText = parsed.text;
        }

        // Skip if no meaningful content
        if (!cvText.trim() || cvText.trim().length < 100) {
          console.log('Skipping - insufficient content');
          continue;
        }

        console.log(`Screening CV with ${cvText.length} characters...`);
        const analysis = await screenCV(cvText, activeRoleId);
        
        if (!analysis) {
          console.log('AI analysis failed');
          continue;
        }

        console.log(`AI Result: ${analysis.candidate_name} - Score: ${analysis.score} - Status: ${analysis.status}`);

        // Extract name from email subject as fallback
        let candidateName = analysis.candidate_name;
        if (!candidateName && parsed.subject) {
          // Try to extract name from subject like "FW: Melissa CV" or "John Smith - Application"
          const subjectMatch = parsed.subject.match(/(?:FW:|RE:|Fwd:)?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i);
          if (subjectMatch) {
            candidateName = subjectMatch[1].trim();
            console.log(`Extracted name from subject: ${candidateName}`);
          }
        }

        await supabase.from('candidates').insert({
          company_id: roles[0].company_id,
          role_id: activeRoleId,
          name: candidateName,
          email: analysis.candidate_email || parsed.from?.value?.[0]?.address,
          phone: analysis.candidate_phone,
          cv_text: cvText,
          score: analysis.score,
          status: analysis.status.toLowerCase(),
          ai_reasoning: analysis.reasoning,
          strengths: analysis.strengths,
          missing: analysis.missing,
          candidate_references: analysis.references || [],
          has_references: analysis.has_references || false,
        });

        processed.push(candidateName || parsed.from?.value?.[0]?.address || 'Unknown');
        console.log(`Saved candidate: ${candidateName}`);

        // Send acknowledgment email
        const candidateEmail = analysis.candidate_email || parsed.from?.value?.[0]?.address;
        if (candidateEmail) {
          try {
            const { sendAcknowledgmentEmail } = await import('@/lib/email');
            await sendAcknowledgmentEmail(
              candidateEmail,
              candidateName || 'Applicant',
              roles[0].title,
              'HireInbox'
            );
            console.log(`Sent acknowledgment to: ${candidateEmail}`);
          } catch (emailError) {
            console.error('Failed to send acknowledgment:', emailError);
          }
        }
      } catch (msgError) {
        console.error('Message processing error:', msgError);
      }
    }

    connection.end();
    console.log(`Finished processing. Total: ${processed.length}`);

    return NextResponse.json({ 
      success: true, 
      processed: processed.length,
      candidates: processed 
    });

  } catch (error) {
    console.error('Email fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch emails' }, { status: 500 });
  }
}