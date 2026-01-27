import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth, isAuthError, requireRateLimit } from '@/lib/api-auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/recruiter/commissions - List all commissions for the recruiter
export async function GET(request: NextRequest) {
  const rateLimitError = requireRateLimit(request, { maxRequests: 100, windowMs: 3600000 });
  if (rateLimitError) return rateLimitError;

  const authResult = await requireAuth(request);
  if (isAuthError(authResult)) return authResult;
  const { user } = authResult;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const year = searchParams.get('year');

    let query = supabase
      .from('recruiter_commissions')
      .select('*')
      .eq('recruiter_id', user.id)
      .order('placement_date', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (year) {
      const startDate = `${year}-01-01`;
      const endDate = `${year}-12-31`;
      query = query.gte('placement_date', startDate).lte('placement_date', endDate);
    }

    const { data: commissions, error } = await query;

    if (error) {
      console.error('Error fetching commissions:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Calculate totals
    const totals = {
      total_placements: commissions?.length || 0,
      total_pending: commissions?.filter(c => c.status === 'pending').reduce((sum, c) => sum + (c.fee_amount || 0), 0) || 0,
      total_invoiced: commissions?.filter(c => c.status === 'invoiced').reduce((sum, c) => sum + (c.fee_amount || 0), 0) || 0,
      total_paid: commissions?.filter(c => c.status === 'paid').reduce((sum, c) => sum + (c.fee_amount || 0), 0) || 0,
    };

    return NextResponse.json({ commissions: commissions || [], totals });
  } catch (error) {
    console.error('Error fetching commissions:', error);
    return NextResponse.json({ error: 'Failed to fetch commissions' }, { status: 500 });
  }
}

// POST /api/recruiter/commissions - Create a new commission record
export async function POST(request: NextRequest) {
  const rateLimitError = requireRateLimit(request, { maxRequests: 50, windowMs: 3600000 });
  if (rateLimitError) return rateLimitError;

  const authResult = await requireAuth(request);
  if (isAuthError(authResult)) return authResult;
  const { user } = authResult;

  try {
    const body = await request.json();

    // Calculate fee amount
    const salary = body.salary || 0;
    const feePercentage = body.fee_percentage || 15;
    const feeAmount = Math.round(salary * feePercentage / 100);

    const commissionData = {
      recruiter_id: user.id,
      client_id: body.client_id || null,
      role_id: body.role_id || null,
      talent_id: body.talent_id || null,
      candidate_name: body.candidate_name,
      role_title: body.role_title,
      client_name: body.client_name,
      placement_date: body.placement_date,
      start_date: body.start_date || null,
      salary: salary,
      fee_percentage: feePercentage,
      fee_amount: feeAmount,
      status: body.status || 'pending',
      invoice_number: body.invoice_number || null,
      invoice_date: body.invoice_date || null,
      payment_date: body.payment_date || null,
      guarantee_end_date: body.guarantee_end_date || null,
      notes: body.notes || null,
    };

    if (!commissionData.candidate_name || !commissionData.role_title || !commissionData.client_name || !commissionData.placement_date) {
      return NextResponse.json({ error: 'Candidate name, role title, client name, and placement date are required' }, { status: 400 });
    }

    const { data: commission, error } = await supabase
      .from('recruiter_commissions')
      .insert([commissionData])
      .select()
      .single();

    if (error) {
      console.error('Error creating commission:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ commission });
  } catch (error) {
    console.error('Error creating commission:', error);
    return NextResponse.json({ error: 'Failed to create commission' }, { status: 500 });
  }
}

// PUT /api/recruiter/commissions - Update a commission record
export async function PUT(request: NextRequest) {
  const rateLimitError = requireRateLimit(request, { maxRequests: 50, windowMs: 3600000 });
  if (rateLimitError) return rateLimitError;

  const authResult = await requireAuth(request);
  if (isAuthError(authResult)) return authResult;
  const { user } = authResult;

  try {
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json({ error: 'Commission ID is required' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (body.candidate_name !== undefined) updateData.candidate_name = body.candidate_name;
    if (body.role_title !== undefined) updateData.role_title = body.role_title;
    if (body.client_name !== undefined) updateData.client_name = body.client_name;
    if (body.placement_date !== undefined) updateData.placement_date = body.placement_date;
    if (body.start_date !== undefined) updateData.start_date = body.start_date;
    if (body.salary !== undefined) {
      updateData.salary = body.salary;
      // Recalculate fee if salary changes
      const feePercentage = body.fee_percentage || 15;
      updateData.fee_amount = Math.round(body.salary * feePercentage / 100);
    }
    if (body.fee_percentage !== undefined) {
      updateData.fee_percentage = body.fee_percentage;
      // Recalculate fee if percentage changes
      const salary = body.salary || 0;
      updateData.fee_amount = Math.round(salary * body.fee_percentage / 100);
    }
    if (body.status !== undefined) updateData.status = body.status;
    if (body.invoice_number !== undefined) updateData.invoice_number = body.invoice_number;
    if (body.invoice_date !== undefined) updateData.invoice_date = body.invoice_date;
    if (body.payment_date !== undefined) updateData.payment_date = body.payment_date;
    if (body.guarantee_end_date !== undefined) updateData.guarantee_end_date = body.guarantee_end_date;
    if (body.notes !== undefined) updateData.notes = body.notes;

    const { data: commission, error } = await supabase
      .from('recruiter_commissions')
      .update(updateData)
      .eq('id', body.id)
      .eq('recruiter_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating commission:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ commission });
  } catch (error) {
    console.error('Error updating commission:', error);
    return NextResponse.json({ error: 'Failed to update commission' }, { status: 500 });
  }
}

// DELETE /api/recruiter/commissions - Delete a commission record
export async function DELETE(request: NextRequest) {
  const rateLimitError = requireRateLimit(request, { maxRequests: 50, windowMs: 3600000 });
  if (rateLimitError) return rateLimitError;

  const authResult = await requireAuth(request);
  if (isAuthError(authResult)) return authResult;
  const { user } = authResult;

  try {
    const { searchParams } = new URL(request.url);
    const commissionId = searchParams.get('id');

    if (!commissionId) {
      return NextResponse.json({ error: 'Commission ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('recruiter_commissions')
      .delete()
      .eq('id', commissionId)
      .eq('recruiter_id', user.id);

    if (error) {
      console.error('Error deleting commission:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting commission:', error);
    return NextResponse.json({ error: 'Failed to delete commission' }, { status: 500 });
  }
}
