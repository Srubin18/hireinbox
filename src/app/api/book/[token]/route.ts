// /api/book/[token] - Handle candidate interview booking
import { NextResponse, NextRequest } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase';
import { Errors, generateTraceId } from '@/lib/api-error';
import { sendInterviewConfirmationEmail } from '@/lib/email';

// ============================================
// GET - Fetch booking link info and available slots
// ============================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const traceId = generateTraceId();
  const { token } = await params;

  try {
    const supabase = getSupabaseServiceClient();

    // Get booking link
    const { data: bookingLink, error: linkError } = await supabase
      .from('booking_links')
      .select('*')
      .eq('token', token)
      .single();

    if (linkError || !bookingLink) {
      return NextResponse.json(
        { error: 'Invalid or expired booking link' },
        { status: 404 }
      );
    }

    // Check if expired
    const isExpired = new Date(bookingLink.expires_at) < new Date();

    // Check if already used
    const isUsed = !!bookingLink.used_at;

    // Get candidate info
    const { data: candidate, error: candidateError } = await supabase
      .from('candidates')
      .select('name, email')
      .eq('id', bookingLink.candidate_id)
      .single();

    if (candidateError || !candidate) {
      return NextResponse.json(
        { error: 'Candidate not found' },
        { status: 404 }
      );
    }

    // Get role info
    const { data: role, error: roleError } = await supabase
      .from('roles')
      .select('title, company_id')
      .eq('id', bookingLink.role_id)
      .single();

    if (roleError || !role) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      );
    }

    // Get company info (if company table exists)
    let companyName = 'HireInbox';
    try {
      const { data: company } = await supabase
        .from('companies')
        .select('name')
        .eq('id', role.company_id)
        .single();
      if (company?.name) companyName = company.name;
    } catch {
      // Company table might not exist
    }

    // Get available slots if not expired/used
    let slots: Array<{
      id: string;
      start_time: string;
      end_time: string;
      duration: number;
      location_type: string;
      recruiter_name: string;
      is_booked: boolean;
    }> = [];

    if (!isExpired && !isUsed) {
      const { data: availableSlots, error: slotsError } = await supabase
        .from('interview_slots')
        .select('id, start_time, end_time, duration, location_type, recruiter_name, is_booked')
        .eq('role_id', bookingLink.role_id)
        .eq('is_booked', false)
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })
        .limit(20);

      if (!slotsError && availableSlots) {
        slots = availableSlots;
      }
    }

    return NextResponse.json({
      candidateName: candidate.name,
      candidateEmail: candidate.email,
      roleTitle: role.title,
      companyName,
      slots,
      expiresAt: bookingLink.expires_at,
      isExpired,
      isUsed,
      traceId,
    });

  } catch (error) {
    console.error(`[${traceId}] Error:`, error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Errors.internal(message, traceId).toResponse();
  }
}

// ============================================
// POST - Book an interview slot
// ============================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const traceId = generateTraceId();
  const { token } = await params;

  try {
    const supabase = getSupabaseServiceClient();
    const body = await request.json();
    const { slot_id } = body;

    if (!slot_id) {
      return Errors.validation('slot_id is required').toResponse();
    }

    // Get and validate booking link
    const { data: bookingLink, error: linkError } = await supabase
      .from('booking_links')
      .select('*')
      .eq('token', token)
      .single();

    if (linkError || !bookingLink) {
      return NextResponse.json(
        { error: 'Invalid or expired booking link' },
        { status: 404 }
      );
    }

    // Check if expired
    if (new Date(bookingLink.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'This booking link has expired' },
        { status: 400 }
      );
    }

    // Check if already used
    if (bookingLink.used_at) {
      return NextResponse.json(
        { error: 'This booking link has already been used' },
        { status: 400 }
      );
    }

    // Get and validate slot
    const { data: slot, error: slotError } = await supabase
      .from('interview_slots')
      .select('*')
      .eq('id', slot_id)
      .eq('role_id', bookingLink.role_id)
      .single();

    if (slotError || !slot) {
      return NextResponse.json(
        { error: 'Invalid interview slot' },
        { status: 400 }
      );
    }

    if (slot.is_booked) {
      return NextResponse.json(
        { error: 'This slot has already been booked. Please select another time.' },
        { status: 400 }
      );
    }

    // Get candidate info
    const { data: candidate, error: candidateError } = await supabase
      .from('candidates')
      .select('name, email')
      .eq('id', bookingLink.candidate_id)
      .single();

    if (candidateError || !candidate) {
      return NextResponse.json(
        { error: 'Candidate not found' },
        { status: 404 }
      );
    }

    // Get role info
    const { data: role, error: roleError } = await supabase
      .from('roles')
      .select('title, company_id')
      .eq('id', bookingLink.role_id)
      .single();

    if (roleError || !role) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      );
    }

    // Book the slot
    const { error: bookError } = await supabase
      .from('interview_slots')
      .update({
        is_booked: true,
        booked_by_candidate_id: bookingLink.candidate_id,
        booked_at: new Date().toISOString(),
      })
      .eq('id', slot_id);

    if (bookError) {
      console.error(`[${traceId}] Failed to book slot:`, bookError);
      return NextResponse.json(
        { error: 'Failed to book interview slot' },
        { status: 500 }
      );
    }

    // Mark booking link as used
    const { error: updateLinkError } = await supabase
      .from('booking_links')
      .update({
        used_at: new Date().toISOString(),
        selected_slot_id: slot_id,
      })
      .eq('id', bookingLink.id);

    if (updateLinkError) {
      console.error(`[${traceId}] Failed to update booking link:`, updateLinkError);
    }

    // Update scheduled interview
    const { error: updateInterviewError } = await supabase
      .from('scheduled_interviews')
      .update({
        slot_id: slot_id,
        status: 'booked',
        scheduled_at: slot.start_time,
      })
      .eq('candidate_id', bookingLink.candidate_id)
      .eq('role_id', bookingLink.role_id)
      .eq('status', 'pending_booking');

    if (updateInterviewError) {
      console.error(`[${traceId}] Failed to update scheduled interview:`, updateInterviewError);
    }

    // Update candidate status
    await supabase
      .from('candidates')
      .update({ status: 'interview_scheduled' })
      .eq('id', bookingLink.candidate_id);

    // Get company name
    let companyName = 'HireInbox';
    try {
      const { data: company } = await supabase
        .from('companies')
        .select('name')
        .eq('id', role.company_id)
        .single();
      if (company?.name) companyName = company.name;
    } catch {
      // Company table might not exist
    }

    // Send confirmation email
    if (candidate.email) {
      try {
        await sendInterviewConfirmationEmail(
          candidate.email,
          candidate.name,
          role.title,
          {
            id: slot.id,
            companyId: role.company_id,
            roleId: bookingLink.role_id,
            interviewerId: slot.recruiter_id,
            interviewerName: slot.recruiter_name || 'Interviewer',
            interviewerEmail: slot.recruiter_email || '',
            startTime: slot.start_time,
            endTime: slot.end_time,
            duration: slot.duration,
            location: slot.location_type,
            meetingLink: slot.meeting_link,
            address: slot.address,
            isBooked: true,
          },
          { name: companyName }
        );
        console.log(`[${traceId}] Confirmation email sent to: ${candidate.email}`);
      } catch (emailErr) {
        console.error(`[${traceId}] Failed to send confirmation email:`, emailErr);
        // Don't fail the booking if email fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Interview booked successfully',
      interview: {
        date: slot.start_time,
        duration: slot.duration,
        location_type: slot.location_type,
        meeting_link: slot.meeting_link,
      },
      traceId,
    });

  } catch (error) {
    console.error(`[${traceId}] Error:`, error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Errors.internal(message, traceId).toResponse();
  }
}
