import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth, isAuthError, requireRateLimit } from '@/lib/api-auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/recruiter/clients - List all clients for the recruiter
export async function GET(request: NextRequest) {
  const rateLimitError = requireRateLimit(request, { maxRequests: 100, windowMs: 3600000 });
  if (rateLimitError) return rateLimitError;

  const authResult = await requireAuth(request);
  if (isAuthError(authResult)) return authResult;
  const { user } = authResult;

  try {
    const { data: clients, error } = await supabase
      .from('recruiter_clients')
      .select(`
        *,
        roles:recruiter_client_roles(id, title, status, candidates_submitted)
      `)
      .eq('recruiter_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching clients:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ clients: clients || [] });
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
  }
}

// POST /api/recruiter/clients - Create a new client
export async function POST(request: NextRequest) {
  const rateLimitError = requireRateLimit(request, { maxRequests: 50, windowMs: 3600000 });
  if (rateLimitError) return rateLimitError;

  const authResult = await requireAuth(request);
  if (isAuthError(authResult)) return authResult;
  const { user } = authResult;

  try {
    const body = await request.json();

    const clientData = {
      recruiter_id: user.id,
      company_name: body.company_name,
      contact_name: body.contact_name || null,
      contact_email: body.contact_email || null,
      contact_phone: body.contact_phone || null,
      industry: body.industry || null,
      notes: body.notes || null,
      contract_type: body.contract_type || 'contingency',
      fee_percentage: body.fee_percentage || 15.00,
      status: body.status || 'active',
    };

    if (!clientData.company_name) {
      return NextResponse.json({ error: 'Company name is required' }, { status: 400 });
    }

    const { data: client, error } = await supabase
      .from('recruiter_clients')
      .insert([clientData])
      .select()
      .single();

    if (error) {
      console.error('Error creating client:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ client });
  } catch (error) {
    console.error('Error creating client:', error);
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
  }
}

// PUT /api/recruiter/clients - Update a client
export async function PUT(request: NextRequest) {
  const rateLimitError = requireRateLimit(request, { maxRequests: 50, windowMs: 3600000 });
  if (rateLimitError) return rateLimitError;

  const authResult = await requireAuth(request);
  if (isAuthError(authResult)) return authResult;
  const { user } = authResult;

  try {
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (body.company_name !== undefined) updateData.company_name = body.company_name;
    if (body.contact_name !== undefined) updateData.contact_name = body.contact_name;
    if (body.contact_email !== undefined) updateData.contact_email = body.contact_email;
    if (body.contact_phone !== undefined) updateData.contact_phone = body.contact_phone;
    if (body.industry !== undefined) updateData.industry = body.industry;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.contract_type !== undefined) updateData.contract_type = body.contract_type;
    if (body.fee_percentage !== undefined) updateData.fee_percentage = body.fee_percentage;
    if (body.status !== undefined) updateData.status = body.status;

    const { data: client, error } = await supabase
      .from('recruiter_clients')
      .update(updateData)
      .eq('id', body.id)
      .eq('recruiter_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating client:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ client });
  } catch (error) {
    console.error('Error updating client:', error);
    return NextResponse.json({ error: 'Failed to update client' }, { status: 500 });
  }
}

// DELETE /api/recruiter/clients - Delete a client
export async function DELETE(request: NextRequest) {
  const rateLimitError = requireRateLimit(request, { maxRequests: 50, windowMs: 3600000 });
  if (rateLimitError) return rateLimitError;

  const authResult = await requireAuth(request);
  if (isAuthError(authResult)) return authResult;
  const { user } = authResult;

  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('id');

    if (!clientId) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('recruiter_clients')
      .delete()
      .eq('id', clientId)
      .eq('recruiter_id', user.id);

    if (error) {
      console.error('Error deleting client:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting client:', error);
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 });
  }
}
