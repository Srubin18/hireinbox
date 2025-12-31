// /api/schedule/slots - CRUD for interview slots and availability
import { NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase';
import { Errors, generateTraceId } from '@/lib/api-error';
import {
  getCalendarClient,
  createDefaultAvailabilityWindows,
  type AvailabilityWindow
} from '@/lib/calendar';

// ============================================
// TYPES
// ============================================

interface InterviewSlot {
  id: string;
  company_id: string;
  role_id: string;
  recruiter_id: string;
  recruiter_name: string;
  recruiter_email: string;
  start_time: string;
  end_time: string;
  duration: number;
  location_type: 'video' | 'phone' | 'in-person';
  meeting_link?: string;
  address?: string;
  is_booked: boolean;
  booked_by_candidate_id?: string;
  booked_at?: string;
  calendar_event_id?: string;
  notes?: string;
  created_at: string;
}

interface RecruiterAvailabilitySettings {
  id: string;
  company_id: string;
  recruiter_id: string;
  recruiter_email: string;
  calendar_id: string;
  availability_windows: AvailabilityWindow[];
  interview_duration: number;
  buffer_between: number;
  max_per_day: number;
  timezone: string;
  auto_create_meet: boolean;
  calendar_connected: boolean;
  calendar_tokens?: {
    access_token: string;
    refresh_token: string;
    expiry_date: number;
  };
  created_at: string;
  updated_at: string;
}

// ============================================
// GET - Fetch interview slots or availability settings
// ============================================

export async function GET(request: Request) {
  const traceId = generateTraceId();
  const { searchParams } = new URL(request.url);

  const type = searchParams.get('type') || 'slots'; // 'slots' | 'availability' | 'available'
  const roleId = searchParams.get('role_id');
  const recruiterId = searchParams.get('recruiter_id');
  const startDate = searchParams.get('start_date');
  const endDate = searchParams.get('end_date');

  try {
    const supabase = getSupabaseServiceClient();

    if (type === 'availability') {
      // Get recruiter availability settings
      let query = supabase.from('recruiter_availability').select('*');

      if (recruiterId) {
        query = query.eq('recruiter_id', recruiterId);
      }

      const { data, error } = await query;

      if (error) {
        console.error(`[${traceId}] Database error:`, error);
        return Errors.database('Failed to fetch availability', error.message, traceId).toResponse();
      }

      return NextResponse.json({ availability: data, traceId });
    }

    if (type === 'available') {
      // Get available (unbooked) slots for a role
      if (!roleId) {
        return Errors.validation('role_id is required for available slots').toResponse();
      }

      let query = supabase
        .from('interview_slots')
        .select('*')
        .eq('role_id', roleId)
        .eq('is_booked', false)
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true });

      if (startDate) query = query.gte('start_time', startDate);
      if (endDate) query = query.lte('start_time', endDate);

      const { data, error } = await query.limit(50);

      if (error) {
        console.error(`[${traceId}] Database error:`, error);
        return Errors.database('Failed to fetch available slots', error.message, traceId).toResponse();
      }

      return NextResponse.json({ slots: data, traceId });
    }

    // Default: Get all slots
    let query = supabase.from('interview_slots').select('*').order('start_time', { ascending: true });

    if (roleId) query = query.eq('role_id', roleId);
    if (recruiterId) query = query.eq('recruiter_id', recruiterId);
    if (startDate) query = query.gte('start_time', startDate);
    if (endDate) query = query.lte('start_time', endDate);

    const { data, error } = await query;

    if (error) {
      console.error(`[${traceId}] Database error:`, error);
      return Errors.database('Failed to fetch slots', error.message, traceId).toResponse();
    }

    return NextResponse.json({ slots: data, traceId });

  } catch (error) {
    console.error(`[${traceId}] Error:`, error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Errors.internal(message, traceId).toResponse();
  }
}

// ============================================
// POST - Create interview slots or availability settings
// ============================================

export async function POST(request: Request) {
  const traceId = generateTraceId();

  try {
    const supabase = getSupabaseServiceClient();
    const body = await request.json();
    const type = body.type || 'slot'; // 'slot' | 'availability' | 'generate'

    if (type === 'availability') {
      // Create/update recruiter availability settings
      const {
        company_id,
        recruiter_id,
        recruiter_email,
        calendar_id = 'primary',
        availability_windows,
        interview_duration = 30,
        buffer_between = 15,
        max_per_day = 8,
        timezone = 'Africa/Johannesburg',
        auto_create_meet = true,
      } = body;

      if (!recruiter_id || !recruiter_email) {
        return Errors.validation('recruiter_id and recruiter_email are required').toResponse();
      }

      const windows = availability_windows || createDefaultAvailabilityWindows();

      const availabilityData = {
        company_id,
        recruiter_id,
        recruiter_email,
        calendar_id,
        availability_windows: windows,
        interview_duration,
        buffer_between,
        max_per_day,
        timezone,
        auto_create_meet,
        calendar_connected: false,
        updated_at: new Date().toISOString(),
      };

      // Upsert - update if exists, insert if not
      const { data, error } = await supabase
        .from('recruiter_availability')
        .upsert(availabilityData, { onConflict: 'recruiter_id' })
        .select()
        .single();

      if (error) {
        console.error(`[${traceId}] Database error:`, error);
        return Errors.database('Failed to save availability', error.message, traceId).toResponse();
      }

      return NextResponse.json({ availability: data, traceId }, { status: 201 });
    }

    if (type === 'generate') {
      // Auto-generate slots based on availability windows
      const { role_id, recruiter_id, days_ahead = 14 } = body;

      if (!role_id || !recruiter_id) {
        return Errors.validation('role_id and recruiter_id are required').toResponse();
      }

      // Get recruiter availability settings
      const { data: availability, error: avError } = await supabase
        .from('recruiter_availability')
        .select('*')
        .eq('recruiter_id', recruiter_id)
        .single();

      if (avError || !availability) {
        return Errors.notFound('Recruiter availability settings').toResponse();
      }

      // Get role info
      const { data: role, error: roleError } = await supabase
        .from('roles')
        .select('company_id')
        .eq('id', role_id)
        .single();

      if (roleError || !role) {
        return Errors.notFound('Role').toResponse();
      }

      // Generate slots
      const slots: Partial<InterviewSlot>[] = [];
      const windows = availability.availability_windows as AvailabilityWindow[];
      const duration = availability.interview_duration;
      const buffer = availability.buffer_between;

      const current = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + days_ahead);

      while (current < endDate) {
        const dayOfWeek = current.getDay();
        const matchingWindows = windows.filter(w => w.dayOfWeek === dayOfWeek);

        for (const window of matchingWindows) {
          const windowStart = new Date(current);
          windowStart.setHours(window.startHour, window.startMinute, 0, 0);

          const windowEnd = new Date(current);
          windowEnd.setHours(window.endHour, window.endMinute, 0, 0);

          let slotStart = new Date(windowStart);

          while (slotStart < windowEnd) {
            const slotEnd = new Date(slotStart.getTime() + duration * 60000);

            if (slotEnd > windowEnd) break;

            // Only create future slots
            if (slotStart > new Date()) {
              slots.push({
                company_id: role.company_id,
                role_id,
                recruiter_id,
                recruiter_name: availability.recruiter_name || 'Recruiter',
                recruiter_email: availability.recruiter_email,
                start_time: slotStart.toISOString(),
                end_time: slotEnd.toISOString(),
                duration,
                location_type: 'video',
                is_booked: false,
              });
            }

            slotStart = new Date(slotStart.getTime() + (duration + buffer) * 60000);
          }
        }

        current.setDate(current.getDate() + 1);
        current.setHours(0, 0, 0, 0);
      }

      // Insert slots
      if (slots.length > 0) {
        const { data: insertedSlots, error: insertError } = await supabase
          .from('interview_slots')
          .insert(slots)
          .select();

        if (insertError) {
          console.error(`[${traceId}] Database error inserting slots:`, insertError);
          return Errors.database('Failed to generate slots', insertError.message, traceId).toResponse();
        }

        return NextResponse.json({
          success: true,
          slotsCreated: insertedSlots?.length || 0,
          slots: insertedSlots,
          traceId
        }, { status: 201 });
      }

      return NextResponse.json({
        success: true,
        slotsCreated: 0,
        message: 'No slots to generate within the specified period',
        traceId
      });
    }

    // Default: Create a single slot
    const {
      company_id,
      role_id,
      recruiter_id,
      recruiter_name,
      recruiter_email,
      start_time,
      end_time,
      duration = 30,
      location_type = 'video',
      meeting_link,
      address,
      notes,
    } = body;

    if (!role_id || !start_time || !end_time) {
      return Errors.validation('role_id, start_time, and end_time are required').toResponse();
    }

    const slotData = {
      company_id,
      role_id,
      recruiter_id,
      recruiter_name,
      recruiter_email,
      start_time,
      end_time,
      duration,
      location_type,
      meeting_link,
      address,
      notes,
      is_booked: false,
    };

    const { data: slot, error } = await supabase
      .from('interview_slots')
      .insert([slotData])
      .select()
      .single();

    if (error) {
      console.error(`[${traceId}] Database error:`, error);
      return Errors.database('Failed to create slot', error.message, traceId).toResponse();
    }

    return NextResponse.json({ slot, traceId }, { status: 201 });

  } catch (error) {
    console.error(`[${traceId}] Error:`, error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Errors.internal(message, traceId).toResponse();
  }
}

// ============================================
// PATCH - Update slot (book, reschedule, etc.)
// ============================================

export async function PATCH(request: Request) {
  const traceId = generateTraceId();

  try {
    const supabase = getSupabaseServiceClient();
    const body = await request.json();
    const { id, action, ...updates } = body;

    if (!id) {
      return Errors.validation('id is required').toResponse();
    }

    if (action === 'book') {
      // Book a slot for a candidate
      const { candidate_id } = body;

      if (!candidate_id) {
        return Errors.validation('candidate_id is required for booking').toResponse();
      }

      // Check slot is still available
      const { data: slot, error: slotError } = await supabase
        .from('interview_slots')
        .select('*')
        .eq('id', id)
        .single();

      if (slotError || !slot) {
        return Errors.notFound('Interview slot').toResponse();
      }

      if (slot.is_booked) {
        return Errors.validation('This slot has already been booked').toResponse();
      }

      // Book the slot
      const { data: bookedSlot, error: bookError } = await supabase
        .from('interview_slots')
        .update({
          is_booked: true,
          booked_by_candidate_id: candidate_id,
          booked_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (bookError) {
        console.error(`[${traceId}] Database error:`, bookError);
        return Errors.database('Failed to book slot', bookError.message, traceId).toResponse();
      }

      // Create calendar event if calendar is connected
      let calendarEventId: string | undefined;
      let meetingLink: string | undefined;

      // Get candidate and role info for calendar event
      const { data: candidate } = await supabase
        .from('candidates')
        .select('name, email')
        .eq('id', candidate_id)
        .single();

      const { data: role } = await supabase
        .from('roles')
        .select('title, companies(name)')
        .eq('id', bookedSlot.role_id)
        .single();

      // Try to create calendar event (optional - fails silently if not configured)
      try {
        const calendarClient = getCalendarClient();

        // Check if recruiter has calendar credentials stored
        const { data: recruiterSettings } = await supabase
          .from('user_settings')
          .select('calendar_credentials')
          .eq('user_id', bookedSlot.recruiter_id)
          .single();

        if (recruiterSettings?.calendar_credentials) {
          calendarClient.setCredentials(recruiterSettings.calendar_credentials);

          const companyName = ((role?.companies as unknown) as { name: string } | null)?.name || 'HireInbox';

          const eventResult = await calendarClient.createEvent('primary', {
            summary: `Interview: ${candidate?.name || 'Candidate'} - ${role?.title || 'Position'}`,
            description: `Interview for ${role?.title || 'Position'} at ${companyName}.

Candidate: ${candidate?.name || 'Unknown'}
Email: ${candidate?.email || 'N/A'}

Scheduled via HireInbox.`,
            start: new Date(bookedSlot.start_time),
            end: new Date(bookedSlot.end_time),
            attendees: [
              { email: candidate?.email || '', name: candidate?.name },
              { email: bookedSlot.recruiter_email, name: bookedSlot.recruiter_name },
            ],
            conferenceData: bookedSlot.location_type === 'video',
            location: bookedSlot.location_type === 'in-person' ? bookedSlot.address : undefined,
          });

          if (eventResult.success) {
            calendarEventId = eventResult.eventId;
            meetingLink = eventResult.meetingLink;

            // Update slot with calendar event ID and meeting link
            await supabase
              .from('interview_slots')
              .update({
                calendar_event_id: calendarEventId,
                meeting_link: meetingLink || bookedSlot.meeting_link,
              })
              .eq('id', id);

            console.log(`[${traceId}] Calendar event created: ${calendarEventId}`);
          }
        }
      } catch (calendarError) {
        // Calendar integration is optional - log but don't fail
        console.warn(`[${traceId}] Calendar event creation skipped:`, calendarError);
      }

      return NextResponse.json({
        slot: {
          ...bookedSlot,
          calendar_event_id: calendarEventId,
          meeting_link: meetingLink || bookedSlot.meeting_link,
        },
        traceId
      });
    }

    if (action === 'unbook') {
      // Cancel a booking
      const { data: slot, error } = await supabase
        .from('interview_slots')
        .update({
          is_booked: false,
          booked_by_candidate_id: null,
          booked_at: null,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error(`[${traceId}] Database error:`, error);
        return Errors.database('Failed to unbook slot', error.message, traceId).toResponse();
      }

      return NextResponse.json({ slot, traceId });
    }

    // Default: Update slot fields
    const { data: slot, error } = await supabase
      .from('interview_slots')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`[${traceId}] Database error:`, error);
      return Errors.database('Failed to update slot', error.message, traceId).toResponse();
    }

    return NextResponse.json({ slot, traceId });

  } catch (error) {
    console.error(`[${traceId}] Error:`, error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Errors.internal(message, traceId).toResponse();
  }
}

// ============================================
// DELETE - Remove slots
// ============================================

export async function DELETE(request: Request) {
  const traceId = generateTraceId();

  try {
    const supabase = getSupabaseServiceClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const roleId = searchParams.get('role_id');
    const unbookedOnly = searchParams.get('unbooked_only') === 'true';

    if (!id && !roleId) {
      return Errors.validation('id or role_id is required').toResponse();
    }

    if (id) {
      // Delete single slot
      const { error } = await supabase
        .from('interview_slots')
        .delete()
        .eq('id', id);

      if (error) {
        console.error(`[${traceId}] Database error:`, error);
        return Errors.database('Failed to delete slot', error.message, traceId).toResponse();
      }

      return NextResponse.json({ success: true, traceId });
    }

    // Delete multiple slots for a role
    let query = supabase.from('interview_slots').delete().eq('role_id', roleId);

    if (unbookedOnly) {
      query = query.eq('is_booked', false);
    }

    const { error } = await query;

    if (error) {
      console.error(`[${traceId}] Database error:`, error);
      return Errors.database('Failed to delete slots', error.message, traceId).toResponse();
    }

    return NextResponse.json({ success: true, traceId });

  } catch (error) {
    console.error(`[${traceId}] Error:`, error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Errors.internal(message, traceId).toResponse();
  }
}
