// /api/candidates - CRUD operations for candidates
import { NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase';
import { Errors, generateTraceId } from '@/lib/api-error';

export async function GET() {
  const traceId = generateTraceId();

  try {
    const supabase = getSupabaseServiceClient();

    const { data: candidates, error } = await supabase
      .from('candidates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error(`[${traceId}] Database error fetching candidates:`, error);
      return Errors.database('Failed to fetch candidates', error.message, traceId).toResponse();
    }

    return NextResponse.json({ candidates, traceId });
  } catch (error) {
    console.error(`[${traceId}] Error fetching candidates:`, error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Errors.internal(message, traceId).toResponse();
  }
}

export async function POST(request: Request) {
  const traceId = generateTraceId();

  try {
    const supabase = getSupabaseServiceClient();
    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.email || !body.role_id) {
      return Errors.validation('Missing required fields: name, email, role_id').toResponse();
    }

    const candidateData = {
      company_id: body.company_id,
      role_id: body.role_id,
      name: body.name,
      email: body.email,
      phone: body.phone || null,
      cv_text: body.cv_text || null,
      status: body.status || 'new',
      score: body.score || 0,
      strengths: body.strengths || [],
      missing: body.missing || [],
    };

    const { data: candidate, error } = await supabase
      .from('candidates')
      .insert(candidateData as never)
      .select()
      .single();

    if (error) {
      console.error(`[${traceId}] Database error creating candidate:`, error);
      return Errors.database('Failed to create candidate', error.message, traceId).toResponse();
    }

    return NextResponse.json({ candidate, traceId }, { status: 201 });
  } catch (error) {
    console.error(`[${traceId}] Error creating candidate:`, error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Errors.internal(message, traceId).toResponse();
  }
}

export async function PATCH(request: Request) {
  const traceId = generateTraceId();

  try {
    const supabase = getSupabaseServiceClient();
    const body = await request.json();

    if (!body.id) {
      return Errors.validation('Missing required field: id').toResponse();
    }

    const { id, ...updates } = body;

    const { data: candidate, error } = await supabase
      .from('candidates')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`[${traceId}] Database error updating candidate:`, error);
      return Errors.database('Failed to update candidate', error.message, traceId).toResponse();
    }

    if (!candidate) {
      return Errors.notFound('Candidate').toResponse();
    }

    return NextResponse.json({ candidate, traceId });
  } catch (error) {
    console.error(`[${traceId}] Error updating candidate:`, error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Errors.internal(message, traceId).toResponse();
  }
}

export async function DELETE(request: Request) {
  const traceId = generateTraceId();

  try {
    const supabase = getSupabaseServiceClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return Errors.validation('Missing required parameter: id').toResponse();
    }

    const { error } = await supabase
      .from('candidates')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`[${traceId}] Database error deleting candidate:`, error);
      return Errors.database('Failed to delete candidate', error.message, traceId).toResponse();
    }

    return NextResponse.json({ success: true, traceId });
  } catch (error) {
    console.error(`[${traceId}] Error deleting candidate:`, error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Errors.internal(message, traceId).toResponse();
  }
}
