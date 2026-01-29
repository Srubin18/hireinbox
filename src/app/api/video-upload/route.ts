import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ============================================
// VIDEO UPLOAD API
// Upload and manage candidate video intros
// ============================================

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Upload video
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('video') as File;
    const candidateId = formData.get('candidateId') as string;

    if (!file || !candidateId) {
      return NextResponse.json(
        { error: 'video and candidateId are required' },
        { status: 400 }
      );
    }

    // Validate file type
    const validTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload MP4, WebM, or MOV' },
        { status: 400 }
      );
    }

    // Max 50MB
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 50MB' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const ext = file.name.split('.').pop() || 'mp4';
    const filename = `${candidateId}/${Date.now()}.${ext}`;

    // Convert to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('candidate-videos')
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: true
      });

    if (uploadError) {
      console.error('Video upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload video' },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('candidate-videos')
      .getPublicUrl(filename);

    // Update candidate record
    const { error: updateError } = await supabase
      .from('candidates')
      .update({
        has_video_intro: true,
        video_url: urlData.publicUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', candidateId);

    if (updateError) {
      console.error('Candidate update error:', updateError);
    }

    // Recalculate profile completeness
    await updateProfileCompleteness(candidateId);

    return NextResponse.json({
      success: true,
      videoUrl: urlData.publicUrl,
      message: 'Video uploaded successfully'
    });

  } catch (error) {
    console.error('Video upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Delete video
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const candidateId = searchParams.get('candidateId');

    if (!candidateId) {
      return NextResponse.json(
        { error: 'candidateId is required' },
        { status: 400 }
      );
    }

    // Get current video path
    const { data: candidate } = await supabase
      .from('candidates')
      .select('video_url')
      .eq('id', candidateId)
      .single();

    if (candidate?.video_url) {
      // Extract filename from URL
      const url = new URL(candidate.video_url);
      const pathParts = url.pathname.split('/');
      const filename = pathParts.slice(-2).join('/');

      // Delete from storage
      await supabase.storage
        .from('candidate-videos')
        .remove([filename]);
    }

    // Update candidate
    await supabase
      .from('candidates')
      .update({
        has_video_intro: false,
        video_url: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', candidateId);

    // Recalculate profile completeness
    await updateProfileCompleteness(candidateId);

    return NextResponse.json({
      success: true,
      message: 'Video deleted'
    });

  } catch (error) {
    console.error('Video delete error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper: Update profile completeness
async function updateProfileCompleteness(candidateId: string) {
  const { data: candidate } = await supabase
    .from('candidates')
    .select('skills, experience_highlights, has_video_intro, has_ai_interview, salary_expectation_min')
    .eq('id', candidateId)
    .single();

  if (!candidate) return;

  let completeness = 20; // Base for CV
  if (candidate.skills?.length > 0) completeness += 20;
  if (candidate.experience_highlights?.length > 0) completeness += 15;
  if (candidate.has_video_intro) completeness += 20; // Video is important
  if (candidate.has_ai_interview) completeness += 15;
  if (candidate.salary_expectation_min) completeness += 10;

  await supabase
    .from('candidates')
    .update({ profile_completeness: Math.min(completeness, 100) })
    .eq('id', candidateId);
}
