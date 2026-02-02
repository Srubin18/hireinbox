import { NextResponse } from 'next/server';

// ============================================
// TEXT EXTRACTION API
// /api/extract-text
// Extracts text from uploaded files (PDF, DOCX, TXT)
// ============================================

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const fileName = file.name.toLowerCase();
    let text = '';

    // Handle different file types
    if (fileName.endsWith('.txt')) {
      text = await file.text();
    } else if (fileName.endsWith('.pdf')) {
      // For PDFs, use pdf-parse
      try {
        const buffer = Buffer.from(await file.arrayBuffer());
        const pdfParse = (await import('pdf-parse')).default;
        const pdfData = await pdfParse(buffer);
        text = pdfData.text;
      } catch (pdfError) {
        console.error('[ExtractText] PDF parsing error:', pdfError);
        return NextResponse.json({
          error: 'Could not parse PDF. Please try copying and pasting the text instead.',
          text: ''
        }, { status: 200 }); // Return 200 so frontend can handle gracefully
      }
    } else if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
      // For DOCX, use mammoth
      try {
        const buffer = Buffer.from(await file.arrayBuffer());
        const mammoth = await import('mammoth');
        const result = await mammoth.extractRawText({ buffer });
        text = result.value;
      } catch (docError) {
        console.error('[ExtractText] DOCX parsing error:', docError);
        return NextResponse.json({
          error: 'Could not parse document. Please try copying and pasting the text instead.',
          text: ''
        }, { status: 200 });
      }
    } else {
      return NextResponse.json({
        error: 'Unsupported file type. Please use PDF, DOCX, or TXT.',
        text: ''
      }, { status: 400 });
    }

    // Clean up the text
    text = text
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    if (!text) {
      return NextResponse.json({
        error: 'No text could be extracted from the file.',
        text: ''
      }, { status: 200 });
    }

    console.log(`[ExtractText] Extracted ${text.length} characters from ${fileName}`);

    return NextResponse.json({
      text,
      fileName: file.name,
      charCount: text.length
    });

  } catch (error) {
    console.error('[ExtractText] Error:', error);
    return NextResponse.json({
      error: 'Failed to process file',
      text: ''
    }, { status: 500 });
  }
}
