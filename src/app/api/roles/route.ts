// /api/roles - CRUD operations for roles
import { NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase';
import { Errors, generateTraceId } from '@/lib/api-error';

export async function GET() {
  const traceId = generateTraceId();

  try {
    const supabase = getSupabaseServiceClient();

    const { data: roles, error } = await supabase
      .from('roles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error(`[${traceId}] Database error fetching roles:`, error);
      return Errors.database('Failed to fetch roles', error.message, traceId).toResponse();
    }

    return NextResponse.json({ roles, traceId });
  } catch (error) {
    console.error(`[${traceId}] Error fetching roles:`, error);
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
    if (!body.title) {
      return Errors.validation('Missing required field: title').toResponse();
    }

    const roleData = {
      company_id: body.company_id || null,
      title: body.title,
      status: body.status || 'active',
      context: body.context || {},
      criteria: body.criteria || {},
      facts: body.facts || {},
      preferences: body.preferences || {},
      ai_guidance: body.ai_guidance || {},
    };

    const { data: role, error } = await supabase
      .from('roles')
      .insert([roleData])
      .select()
      .single();

    if (error) {
      console.error(`[${traceId}] Database error creating role:`, error);
      return Errors.database('Failed to create role', error.message, traceId).toResponse();
    }

    return NextResponse.json({ role, traceId }, { status: 201 });
  } catch (error) {
    console.error(`[${traceId}] Error creating role:`, error);
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

    const { data: role, error } = await supabase
      .from('roles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`[${traceId}] Database error updating role:`, error);
      return Errors.database('Failed to update role', error.message, traceId).toResponse();
    }

    if (!role) {
      return Errors.notFound('Role').toResponse();
    }

    return NextResponse.json({ role, traceId });
  } catch (error) {
    console.error(`[${traceId}] Error updating role:`, error);
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
      .from('roles')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`[${traceId}] Database error deleting role:`, error);
      return Errors.database('Failed to delete role', error.message, traceId).toResponse();
    }

    return NextResponse.json({ success: true, traceId });
  } catch (error) {
    console.error(`[${traceId}] Error deleting role:`, error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Errors.internal(message, traceId).toResponse();
  }
}
