import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ============================================
// HIREINBOX - Interview Booking API
// /api/booking
//
// Handles interview scheduling:
// - GET: Fetch available slots for a role
// - POST: Book a slot for a candidate
//
// Integrates with:
// - Calendly (if CALENDLY_API_KEY set)
// - Built-in slot management (fallback)
// ============================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

interface TimeSlot {
  id: string;
  start_time: string;
  end_time: string;
  available: boolean;
}

interface BookingRequest {
  candidateId: string;
  slotId: string;
  roleId: string;
}

// GET: Fetch available slots
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const roleId = searchParams.get('roleId');
  const candidateId = searchParams.get('candidateId');

  if (!roleId) {
    return NextResponse.json({ error: 'roleId required' }, { status: 400 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Fetch role settings
    const { data: role, error: roleError } = await supabase
      .from('roles')
      .select('id, title, company_name, calendly_link, interview_duration_minutes')
      .eq('id', roleId)
      .single();

    if (roleError || !role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    // If Calendly is configured, redirect to Calendly
    if (role.calendly_link) {
      return NextResponse.json({
        type: 'calendly',
        calendlyLink: role.calendly_link,
        role: {
          title: role.title,
          company: role.company_name
        }
      });
    }

    // Otherwise, fetch built-in slots
    const { data: slots, error: slotsError } = await supabase
      .from('interview_slots')
      .select('id, start_time, end_time, booked_by')
      .eq('role_id', roleId)
      .gte('start_time', new Date().toISOString())
      .order('start_time', { ascending: true })
      .limit(20);

    if (slotsError) {
      return NextResponse.json({ error: 'Failed to fetch slots' }, { status: 500 });
    }

    const availableSlots: TimeSlot[] = (slots || []).map(slot => ({
      id: slot.id,
      start_time: slot.start_time,
      end_time: slot.end_time,
      available: !slot.booked_by
    }));

    return NextResponse.json({
      type: 'builtin',
      slots: availableSlots,
      role: {
        title: role.title,
        company: role.company_name,
        duration: role.interview_duration_minutes || 30
      }
    });

  } catch (error) {
    console.error('[Booking] Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST: Book a slot
export async function POST(request: Request) {
  try {
    const body: BookingRequest = await request.json();
    const { candidateId, slotId, roleId } = body;

    if (!candidateId || !slotId || !roleId) {
      return NextResponse.json(
        { error: 'candidateId, slotId, and roleId required' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify candidate exists and is shortlisted
    const { data: candidate, error: candidateError } = await supabase
      .from('candidates')
      .select('id, name, email, status')
      .eq('id', candidateId)
      .single();

    if (candidateError || !candidate) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
    }

    if (candidate.status !== 'shortlisted') {
      return NextResponse.json(
        { error: 'Only shortlisted candidates can book interviews' },
        { status: 400 }
      );
    }

    // Check slot availability
    const { data: slot, error: slotError } = await supabase
      .from('interview_slots')
      .select('id, start_time, end_time, booked_by')
      .eq('id', slotId)
      .eq('role_id', roleId)
      .single();

    if (slotError || !slot) {
      return NextResponse.json({ error: 'Slot not found' }, { status: 404 });
    }

    if (slot.booked_by) {
      return NextResponse.json({ error: 'Slot already booked' }, { status: 409 });
    }

    // Book the slot
    const { error: bookError } = await supabase
      .from('interview_slots')
      .update({
        booked_by: candidateId,
        booked_at: new Date().toISOString()
      })
      .eq('id', slotId);

    if (bookError) {
      return NextResponse.json({ error: 'Failed to book slot' }, { status: 500 });
    }

    // Update candidate status
    await supabase
      .from('candidates')
      .update({
        status: 'interview_scheduled',
        hiring_pass: 3,  // Pass 3 = Interview
        interview_time: slot.start_time,
        updated_at: new Date().toISOString()
      })
      .eq('id', candidateId);

    // Get role info for confirmation email
    const { data: role } = await supabase
      .from('roles')
      .select('title, company_name')
      .eq('id', roleId)
      .single();

    // Send confirmation email
    if (candidate.email && process.env.RESEND_API_KEY) {
      const startTime = new Date(slot.start_time);
      const formattedTime = startTime.toLocaleString('en-ZA', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Africa/Johannesburg'
      });

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL || 'HireInbox <noreply@hireinbox.co.za>',
          to: [candidate.email],
          subject: `Interview confirmed: ${role?.title || 'Position'} at ${role?.company_name || 'Company'}`,
          text: `Dear ${candidate.name},

Your interview has been confirmed!

Position: ${role?.title || 'Position'}
Company: ${role?.company_name || 'Company'}
Date & Time: ${formattedTime}

Please ensure you:
- Join on time
- Have a stable internet connection
- Prepare questions about the role

If you need to reschedule, please contact us as soon as possible.

Best regards,
${role?.company_name || 'The'} Hiring Team

---
Powered by HireInbox
`
        })
      });
    }

    return NextResponse.json({
      success: true,
      booking: {
        slotId: slot.id,
        startTime: slot.start_time,
        endTime: slot.end_time,
        candidate: candidate.name
      }
    });

  } catch (error) {
    console.error('[Booking] Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
