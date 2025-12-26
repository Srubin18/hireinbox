// /api/schedule/auto - Auto-schedule interviews for shortlisted candidates
import { NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase';
import { Errors, generateTraceId } from '@/lib/api-error';
import {
  getCalendarClient,
  autoScheduleInterview,
  type RecruiterAvailability,
  type CandidateForScheduling
} from '@/lib/calendar';
import { sendInterviewInviteEmail, sendInterviewConfirmationEmail, generateBookingToken, generateBookingLinkUrl } from '@/lib/email';

// ============================================
// TYPES
// ============================================

interface AutoScheduleConfig {
  enabled: boolean;
  min_score_to_schedule: number;
  max_candidates_per_batch: number;
  interview_duration: number;
  interview_type: 'video' | 'phone' | 'in-person';
  interview_address?: string;
  auto_create_meet: boolean;
  look_ahead_days: number;
  send_invite_email: boolean;
  auto_book_first_slot: boolean; // If true, auto-book. If false, send booking link
}

interface ScheduledInterview {
  id: string;
  candidate_id: string;
  role_id: string;
  company_id: string;
  slot_id?: string;
  booking_token?: string;
  booking_link?: string;
  status: 'pending_booking' | 'booked' | 'completed' | 'cancelled' | 'no_show';
  calendar_event_id?: string;
  meeting_link?: string;
  scheduled_at?: string;
  notes?: string;
  created_at: string;
}

// ============================================
// POST - Trigger auto-scheduling for a role
// ============================================

export async function POST(request: Request) {
  const traceId = generateTraceId();
  console.log(`[${traceId}] === AUTO-SCHEDULE START ===`);

  try {
    const supabase = getSupabaseServiceClient();
    const body = await request.json();
    const {
      role_id,
      candidate_ids, // Optional: specific candidates to schedule
      force = false, // Force re-schedule even if already scheduled
    } = body;

    if (!role_id) {
      return Errors.validation('role_id is required').toResponse();
    }

    // Get role with auto-schedule config
    const { data: role, error: roleError } = await supabase
      .from('roles')
      .select('*')
      .eq('id', role_id)
      .single();

    if (roleError || !role) {
      return Errors.notFound('Role').toResponse();
    }

    // Get auto-schedule config from role
    const autoConfig: AutoScheduleConfig = role.auto_schedule_config || {
      enabled: false,
      min_score_to_schedule: 80,
      max_candidates_per_batch: 10,
      interview_duration: 30,
      interview_type: 'video',
      auto_create_meet: true,
      look_ahead_days: 14,
      send_invite_email: true,
      auto_book_first_slot: false,
    };

    if (!autoConfig.enabled && !force) {
      return NextResponse.json({
        success: false,
        message: 'Auto-scheduling is not enabled for this role',
        traceId
      });
    }

    // Get candidates to schedule
    let candidateQuery = supabase
      .from('candidates')
      .select('*')
      .eq('role_id', role_id)
      .gte('ai_score', autoConfig.min_score_to_schedule)
      .in('status', ['shortlist', 'screened'])
      .order('ai_score', { ascending: false });

    if (candidate_ids && candidate_ids.length > 0) {
      candidateQuery = candidateQuery.in('id', candidate_ids);
    }

    candidateQuery = candidateQuery.limit(autoConfig.max_candidates_per_batch);

    const { data: candidates, error: candidatesError } = await candidateQuery;

    if (candidatesError) {
      console.error(`[${traceId}] Database error:`, candidatesError);
      return Errors.database('Failed to fetch candidates', candidatesError.message, traceId).toResponse();
    }

    if (!candidates || candidates.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No candidates meet the criteria for auto-scheduling',
        scheduled: 0,
        traceId
      });
    }

    console.log(`[${traceId}] Found ${candidates.length} candidates to schedule`);

    // Check which candidates already have interviews scheduled
    const { data: existingInterviews } = await supabase
      .from('scheduled_interviews')
      .select('candidate_id')
      .in('candidate_id', candidates.map(c => c.id))
      .in('status', ['pending_booking', 'booked']);

    const alreadyScheduled = new Set(existingInterviews?.map(i => i.candidate_id) || []);

    // Get available slots for this role
    const { data: availableSlots, error: slotsError } = await supabase
      .from('interview_slots')
      .select('*')
      .eq('role_id', role_id)
      .eq('is_booked', false)
      .gte('start_time', new Date().toISOString())
      .order('start_time', { ascending: true })
      .limit(autoConfig.max_candidates_per_batch * 3); // Get extra slots in case some are taken

    if (slotsError) {
      console.error(`[${traceId}] Database error:`, slotsError);
    }

    const results: {
      candidate_id: string;
      candidate_name: string;
      success: boolean;
      status: string;
      booking_link?: string;
      error?: string;
    }[] = [];

    let slotIndex = 0;

    for (const candidate of candidates) {
      // Skip if already scheduled (unless force)
      if (alreadyScheduled.has(candidate.id) && !force) {
        results.push({
          candidate_id: candidate.id,
          candidate_name: candidate.name,
          success: false,
          status: 'already_scheduled',
          error: 'Interview already scheduled'
        });
        continue;
      }

      // Skip if no email
      if (!candidate.email) {
        results.push({
          candidate_id: candidate.id,
          candidate_name: candidate.name,
          success: false,
          status: 'no_email',
          error: 'Candidate has no email address'
        });
        continue;
      }

      try {
        if (autoConfig.auto_book_first_slot && availableSlots && slotIndex < availableSlots.length) {
          // Auto-book the next available slot
          const slot = availableSlots[slotIndex];
          slotIndex++;

          // Book the slot
          const { error: bookError } = await supabase
            .from('interview_slots')
            .update({
              is_booked: true,
              booked_by_candidate_id: candidate.id,
              booked_at: new Date().toISOString(),
            })
            .eq('id', slot.id);

          if (bookError) {
            throw new Error(`Failed to book slot: ${bookError.message}`);
          }

          // Create scheduled interview record
          const { data: interview, error: interviewError } = await supabase
            .from('scheduled_interviews')
            .insert({
              candidate_id: candidate.id,
              role_id: role_id,
              company_id: role.company_id,
              slot_id: slot.id,
              status: 'booked',
              scheduled_at: slot.start_time,
            })
            .select()
            .single();

          if (interviewError) {
            throw new Error(`Failed to create interview record: ${interviewError.message}`);
          }

          // Send confirmation email
          if (autoConfig.send_invite_email) {
            await sendInterviewConfirmationEmail(
              candidate.email,
              candidate.name,
              role.title,
              {
                id: slot.id,
                companyId: role.company_id,
                roleId: role_id,
                interviewerId: slot.recruiter_id,
                interviewerName: slot.recruiter_name,
                interviewerEmail: slot.recruiter_email,
                startTime: slot.start_time,
                endTime: slot.end_time,
                duration: slot.duration,
                location: slot.location_type,
                meetingLink: slot.meeting_link,
                address: slot.address,
                isBooked: true,
              },
              { name: role.company_name || 'HireInbox' }
            );
          }

          // Update candidate status
          await supabase
            .from('candidates')
            .update({ status: 'interview_scheduled' })
            .eq('id', candidate.id);

          results.push({
            candidate_id: candidate.id,
            candidate_name: candidate.name,
            success: true,
            status: 'booked',
          });

        } else {
          // Generate booking link for candidate to self-schedule
          const token = generateBookingToken();
          const bookingLink = generateBookingLinkUrl(token);
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 7); // 7 day expiry

          // Create booking link record
          const { error: linkError } = await supabase
            .from('booking_links')
            .insert({
              candidate_id: candidate.id,
              role_id: role_id,
              company_id: role.company_id,
              token: token,
              expires_at: expiresAt.toISOString(),
            });

          if (linkError) {
            throw new Error(`Failed to create booking link: ${linkError.message}`);
          }

          // Create scheduled interview record
          const { error: interviewError } = await supabase
            .from('scheduled_interviews')
            .insert({
              candidate_id: candidate.id,
              role_id: role_id,
              company_id: role.company_id,
              booking_token: token,
              booking_link: bookingLink,
              status: 'pending_booking',
            });

          if (interviewError) {
            throw new Error(`Failed to create interview record: ${interviewError.message}`);
          }

          // Send invite email with booking link
          if (autoConfig.send_invite_email) {
            await sendInterviewInviteEmail(
              candidate.email,
              candidate.name,
              role.title,
              bookingLink,
              { name: role.company_name || 'HireInbox' }
            );
          }

          // Update candidate status
          await supabase
            .from('candidates')
            .update({ status: 'interview_invited' })
            .eq('id', candidate.id);

          results.push({
            candidate_id: candidate.id,
            candidate_name: candidate.name,
            success: true,
            status: 'invite_sent',
            booking_link: bookingLink,
          });
        }

      } catch (error) {
        console.error(`[${traceId}] Error scheduling ${candidate.name}:`, error);
        results.push({
          candidate_id: candidate.id,
          candidate_name: candidate.name,
          success: false,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`[${traceId}] === AUTO-SCHEDULE END === Scheduled: ${successCount}/${candidates.length}`);

    return NextResponse.json({
      success: true,
      scheduled: successCount,
      total: candidates.length,
      results,
      traceId
    });

  } catch (error) {
    console.error(`[${traceId}] Fatal error:`, error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Errors.internal(message, traceId).toResponse();
  }
}

// ============================================
// GET - Get auto-schedule status for a role
// ============================================

export async function GET(request: Request) {
  const traceId = generateTraceId();
  const { searchParams } = new URL(request.url);
  const roleId = searchParams.get('role_id');

  if (!roleId) {
    return Errors.validation('role_id is required').toResponse();
  }

  try {
    const supabase = getSupabaseServiceClient();

    // Get role config
    const { data: role, error: roleError } = await supabase
      .from('roles')
      .select('id, title, auto_schedule_config')
      .eq('id', roleId)
      .single();

    if (roleError || !role) {
      return Errors.notFound('Role').toResponse();
    }

    // Get scheduled interviews for this role
    const { data: interviews, error: intError } = await supabase
      .from('scheduled_interviews')
      .select(`
        *,
        candidate:candidates(id, name, email, ai_score)
      `)
      .eq('role_id', roleId)
      .order('created_at', { ascending: false });

    if (intError) {
      console.error(`[${traceId}] Database error:`, intError);
    }

    // Get available slots count
    const { count: availableSlots } = await supabase
      .from('interview_slots')
      .select('*', { count: 'exact', head: true })
      .eq('role_id', roleId)
      .eq('is_booked', false)
      .gte('start_time', new Date().toISOString());

    // Get candidates eligible for scheduling
    const autoConfig = role.auto_schedule_config || { min_score_to_schedule: 80 };
    const { count: eligibleCandidates } = await supabase
      .from('candidates')
      .select('*', { count: 'exact', head: true })
      .eq('role_id', roleId)
      .gte('ai_score', autoConfig.min_score_to_schedule)
      .in('status', ['shortlist', 'screened']);

    return NextResponse.json({
      role: {
        id: role.id,
        title: role.title,
        auto_schedule_config: role.auto_schedule_config,
      },
      stats: {
        scheduled_interviews: interviews?.length || 0,
        pending_booking: interviews?.filter(i => i.status === 'pending_booking').length || 0,
        booked: interviews?.filter(i => i.status === 'booked').length || 0,
        available_slots: availableSlots || 0,
        eligible_candidates: eligibleCandidates || 0,
      },
      interviews,
      traceId
    });

  } catch (error) {
    console.error(`[${traceId}] Error:`, error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Errors.internal(message, traceId).toResponse();
  }
}

// ============================================
// PATCH - Update auto-schedule config for a role
// ============================================

export async function PATCH(request: Request) {
  const traceId = generateTraceId();

  try {
    const supabase = getSupabaseServiceClient();
    const body = await request.json();
    const { role_id, auto_schedule_config } = body;

    if (!role_id) {
      return Errors.validation('role_id is required').toResponse();
    }

    // Validate config
    const validConfig: AutoScheduleConfig = {
      enabled: auto_schedule_config.enabled ?? false,
      min_score_to_schedule: auto_schedule_config.min_score_to_schedule ?? 80,
      max_candidates_per_batch: auto_schedule_config.max_candidates_per_batch ?? 10,
      interview_duration: auto_schedule_config.interview_duration ?? 30,
      interview_type: auto_schedule_config.interview_type ?? 'video',
      interview_address: auto_schedule_config.interview_address,
      auto_create_meet: auto_schedule_config.auto_create_meet ?? true,
      look_ahead_days: auto_schedule_config.look_ahead_days ?? 14,
      send_invite_email: auto_schedule_config.send_invite_email ?? true,
      auto_book_first_slot: auto_schedule_config.auto_book_first_slot ?? false,
    };

    const { data: role, error } = await supabase
      .from('roles')
      .update({ auto_schedule_config: validConfig })
      .eq('id', role_id)
      .select()
      .single();

    if (error) {
      console.error(`[${traceId}] Database error:`, error);
      return Errors.database('Failed to update auto-schedule config', error.message, traceId).toResponse();
    }

    return NextResponse.json({ role, traceId });

  } catch (error) {
    console.error(`[${traceId}] Error:`, error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Errors.internal(message, traceId).toResponse();
  }
}
