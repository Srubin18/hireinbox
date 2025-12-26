// lib/calendar.ts
// HireInbox Google Calendar Integration
// Handles: OAuth, availability checking, event creation, invite sending

import { google, calendar_v3 } from 'googleapis';

// ============================================
// TYPES
// ============================================

export interface CalendarCredentials {
  access_token: string;
  refresh_token: string;
  expiry_date: number;
}

export interface TimeSlot {
  start: Date;
  end: Date;
}

export interface AvailabilityWindow {
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  startHour: number; // 0-23
  startMinute: number;
  endHour: number;
  endMinute: number;
}

export interface InterviewEvent {
  id?: string;
  summary: string;
  description: string;
  start: Date;
  end: Date;
  attendees: { email: string; name?: string }[];
  location?: string;
  meetingLink?: string;
  conferenceData?: boolean; // Auto-create Google Meet link
}

export interface CalendarConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export interface RecruiterAvailability {
  recruiterId: string;
  recruiterEmail: string;
  calendarId: string; // Usually 'primary'
  windows: AvailabilityWindow[];
  interviewDuration: number; // minutes
  bufferBetween: number; // minutes between interviews
  maxPerDay: number;
  timezone: string; // e.g., 'Africa/Johannesburg'
}

export interface ScheduleResult {
  success: boolean;
  eventId?: string;
  meetingLink?: string;
  error?: string;
  slot?: {
    start: string;
    end: string;
  };
}

// ============================================
// GOOGLE CALENDAR CLIENT
// ============================================

export class GoogleCalendarClient {
  private oauth2Client: InstanceType<typeof google.auth.OAuth2>;
  private calendar: calendar_v3.Calendar;
  private credentials: CalendarCredentials | null = null;

  constructor(config?: CalendarConfig) {
    const clientId = config?.clientId || process.env.GOOGLE_CALENDAR_CLIENT_ID;
    const clientSecret = config?.clientSecret || process.env.GOOGLE_CALENDAR_CLIENT_SECRET;
    const redirectUri = config?.redirectUri || process.env.GOOGLE_CALENDAR_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback';

    if (!clientId || !clientSecret) {
      console.warn('[CALENDAR] Missing Google Calendar credentials - calendar features will be limited');
    }

    this.oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
  }

  // ============================================
  // OAUTH FLOW
  // ============================================

  /**
   * Generate OAuth URL for user to authorize calendar access
   */
  getAuthUrl(state?: string): string {
    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: state,
      prompt: 'consent', // Force consent to get refresh_token
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  async getTokensFromCode(code: string): Promise<CalendarCredentials> {
    const { tokens } = await this.oauth2Client.getToken(code);

    if (!tokens.access_token || !tokens.refresh_token) {
      throw new Error('Failed to obtain tokens from authorization code');
    }

    this.credentials = {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: tokens.expiry_date || Date.now() + 3600000,
    };

    this.oauth2Client.setCredentials(tokens);
    return this.credentials;
  }

  /**
   * Set credentials for API calls
   */
  setCredentials(credentials: CalendarCredentials): void {
    this.credentials = credentials;
    this.oauth2Client.setCredentials({
      access_token: credentials.access_token,
      refresh_token: credentials.refresh_token,
      expiry_date: credentials.expiry_date,
    });
  }

  /**
   * Refresh access token if expired
   */
  async refreshTokenIfNeeded(): Promise<CalendarCredentials | null> {
    if (!this.credentials) return null;

    // Check if token expires in next 5 minutes
    if (this.credentials.expiry_date - Date.now() < 300000) {
      try {
        const { credentials } = await this.oauth2Client.refreshAccessToken();
        this.credentials = {
          access_token: credentials.access_token!,
          refresh_token: credentials.refresh_token || this.credentials.refresh_token,
          expiry_date: credentials.expiry_date || Date.now() + 3600000,
        };
        return this.credentials;
      } catch (error) {
        console.error('[CALENDAR] Token refresh failed:', error);
        return null;
      }
    }

    return this.credentials;
  }

  // ============================================
  // AVAILABILITY CHECKING
  // ============================================

  /**
   * Get free/busy information for a calendar
   */
  async getFreeBusy(
    calendarId: string,
    timeMin: Date,
    timeMax: Date
  ): Promise<TimeSlot[]> {
    await this.refreshTokenIfNeeded();

    const response = await this.calendar.freebusy.query({
      requestBody: {
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        items: [{ id: calendarId }],
      },
    });

    const busy = response.data.calendars?.[calendarId]?.busy || [];
    return busy.map((slot) => ({
      start: new Date(slot.start!),
      end: new Date(slot.end!),
    }));
  }

  /**
   * Find available slots based on recruiter availability windows
   */
  async findAvailableSlots(
    availability: RecruiterAvailability,
    startDate: Date,
    endDate: Date,
    slotDuration: number = 30 // minutes
  ): Promise<TimeSlot[]> {
    const busySlots = await this.getFreeBusy(
      availability.calendarId,
      startDate,
      endDate
    );

    const availableSlots: TimeSlot[] = [];
    const current = new Date(startDate);
    const buffer = availability.bufferBetween || 15;

    // Iterate through each day
    while (current < endDate) {
      const dayOfWeek = current.getDay();

      // Find matching availability window for this day
      const windows = availability.windows.filter(w => w.dayOfWeek === dayOfWeek);

      for (const window of windows) {
        // Create start and end times for this window
        const windowStart = new Date(current);
        windowStart.setHours(window.startHour, window.startMinute, 0, 0);

        const windowEnd = new Date(current);
        windowEnd.setHours(window.endHour, window.endMinute, 0, 0);

        // Generate slots within this window
        let slotStart = new Date(windowStart);

        while (slotStart < windowEnd) {
          const slotEnd = new Date(slotStart.getTime() + slotDuration * 60000);

          if (slotEnd > windowEnd) break;

          // Check if this slot overlaps with any busy period
          const isAvailable = !busySlots.some(busy =>
            (slotStart < busy.end && slotEnd > busy.start)
          );

          // Only include future slots
          if (isAvailable && slotStart > new Date()) {
            availableSlots.push({ start: new Date(slotStart), end: new Date(slotEnd) });
          }

          // Move to next slot (including buffer)
          slotStart = new Date(slotStart.getTime() + (slotDuration + buffer) * 60000);
        }
      }

      // Move to next day
      current.setDate(current.getDate() + 1);
      current.setHours(0, 0, 0, 0);
    }

    return availableSlots.slice(0, availability.maxPerDay * 7); // Limit results
  }

  // ============================================
  // EVENT CREATION
  // ============================================

  /**
   * Create a calendar event with optional Google Meet link
   */
  async createEvent(
    calendarId: string,
    event: InterviewEvent
  ): Promise<ScheduleResult> {
    await this.refreshTokenIfNeeded();

    try {
      const eventData: calendar_v3.Schema$Event = {
        summary: event.summary,
        description: event.description,
        start: {
          dateTime: event.start.toISOString(),
          timeZone: 'Africa/Johannesburg',
        },
        end: {
          dateTime: event.end.toISOString(),
          timeZone: 'Africa/Johannesburg',
        },
        attendees: event.attendees.map(a => ({
          email: a.email,
          displayName: a.name,
        })),
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 1440 }, // 24 hours before
            { method: 'popup', minutes: 30 },
          ],
        },
        guestsCanModify: false,
        guestsCanInviteOthers: false,
      };

      // Add location
      if (event.location) {
        eventData.location = event.location;
      }

      // Add Google Meet if requested
      if (event.conferenceData) {
        eventData.conferenceData = {
          createRequest: {
            requestId: `hireinbox-${Date.now()}`,
            conferenceSolutionKey: { type: 'hangoutsMeet' },
          },
        };
      }

      const response = await this.calendar.events.insert({
        calendarId,
        requestBody: eventData,
        conferenceDataVersion: event.conferenceData ? 1 : 0,
        sendUpdates: 'all',
      });

      const createdEvent = response.data;
      const meetLink = createdEvent.conferenceData?.entryPoints?.find(
        ep => ep.entryPointType === 'video'
      )?.uri;

      return {
        success: true,
        eventId: createdEvent.id || undefined,
        meetingLink: meetLink || undefined,
        slot: {
          start: event.start.toISOString(),
          end: event.end.toISOString(),
        },
      };
    } catch (error) {
      console.error('[CALENDAR] Failed to create event:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create calendar event',
      };
    }
  }

  /**
   * Update an existing calendar event
   */
  async updateEvent(
    calendarId: string,
    eventId: string,
    updates: Partial<InterviewEvent>
  ): Promise<ScheduleResult> {
    await this.refreshTokenIfNeeded();

    try {
      const eventData: calendar_v3.Schema$Event = {};

      if (updates.summary) eventData.summary = updates.summary;
      if (updates.description) eventData.description = updates.description;
      if (updates.location) eventData.location = updates.location;
      if (updates.start) {
        eventData.start = {
          dateTime: updates.start.toISOString(),
          timeZone: 'Africa/Johannesburg',
        };
      }
      if (updates.end) {
        eventData.end = {
          dateTime: updates.end.toISOString(),
          timeZone: 'Africa/Johannesburg',
        };
      }
      if (updates.attendees) {
        eventData.attendees = updates.attendees.map(a => ({
          email: a.email,
          displayName: a.name,
        }));
      }

      const response = await this.calendar.events.patch({
        calendarId,
        eventId,
        requestBody: eventData,
        sendUpdates: 'all',
      });

      return {
        success: true,
        eventId: response.data.id || undefined,
      };
    } catch (error) {
      console.error('[CALENDAR] Failed to update event:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update calendar event',
      };
    }
  }

  /**
   * Delete a calendar event
   */
  async deleteEvent(calendarId: string, eventId: string): Promise<ScheduleResult> {
    await this.refreshTokenIfNeeded();

    try {
      await this.calendar.events.delete({
        calendarId,
        eventId,
        sendUpdates: 'all',
      });

      return { success: true };
    } catch (error) {
      console.error('[CALENDAR] Failed to delete event:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete calendar event',
      };
    }
  }
}

// ============================================
// AUTO-SCHEDULING LOGIC
// ============================================

export interface AutoScheduleConfig {
  roleId: string;
  companyId: string;
  recruiterAvailability: RecruiterAvailability;
  interviewDuration: number; // minutes
  interviewType: 'video' | 'phone' | 'in-person';
  interviewAddress?: string;
  autoCreateMeet: boolean;
  lookAheadDays: number; // How many days ahead to look for slots
  minScoreToSchedule: number; // Minimum AI score to auto-schedule
}

export interface CandidateForScheduling {
  id: string;
  name: string;
  email: string;
  score: number;
  roleId: string;
  roleTitle: string;
}

/**
 * Auto-schedule interview for a candidate
 */
export async function autoScheduleInterview(
  client: GoogleCalendarClient,
  config: AutoScheduleConfig,
  candidate: CandidateForScheduling,
  companyName: string
): Promise<ScheduleResult> {
  // Check if candidate meets score threshold
  if (candidate.score < config.minScoreToSchedule) {
    return {
      success: false,
      error: `Candidate score ${candidate.score} below threshold ${config.minScoreToSchedule}`,
    };
  }

  // Find available slots
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + config.lookAheadDays);

  const availableSlots = await client.findAvailableSlots(
    config.recruiterAvailability,
    startDate,
    endDate,
    config.interviewDuration
  );

  if (availableSlots.length === 0) {
    return {
      success: false,
      error: 'No available interview slots found',
    };
  }

  // Take the first available slot
  const slot = availableSlots[0];

  // Create the interview event
  const event: InterviewEvent = {
    summary: `Interview: ${candidate.name} - ${candidate.roleTitle}`,
    description: `Interview for ${candidate.roleTitle} position at ${companyName}.

Candidate: ${candidate.name}
Email: ${candidate.email}
AI Score: ${candidate.score}/100

This interview was automatically scheduled by HireInbox.`,
    start: slot.start,
    end: slot.end,
    attendees: [
      { email: candidate.email, name: candidate.name },
      { email: config.recruiterAvailability.recruiterEmail, name: 'Interviewer' },
    ],
    conferenceData: config.autoCreateMeet && config.interviewType === 'video',
    location: config.interviewType === 'in-person' ? config.interviewAddress : undefined,
  };

  return client.createEvent(config.recruiterAvailability.calendarId, event);
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Create default availability windows (Mon-Fri, 9am-5pm SAST)
 */
export function createDefaultAvailabilityWindows(): AvailabilityWindow[] {
  const windows: AvailabilityWindow[] = [];

  // Monday to Friday
  for (let day = 1; day <= 5; day++) {
    windows.push({
      dayOfWeek: day,
      startHour: 9,
      startMinute: 0,
      endHour: 17,
      endMinute: 0,
    });
  }

  return windows;
}

/**
 * Format a time slot for display
 */
export function formatTimeSlot(slot: TimeSlot, timezone: string = 'Africa/Johannesburg'): string {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: timezone,
  };

  const startStr = slot.start.toLocaleString('en-ZA', options);
  const endStr = slot.end.toLocaleTimeString('en-ZA', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: timezone,
  });

  return `${startStr} - ${endStr}`;
}

/**
 * Calculate interview end time
 */
export function calculateEndTime(start: Date, durationMinutes: number): Date {
  return new Date(start.getTime() + durationMinutes * 60000);
}

/**
 * Check if a date is within business hours
 */
export function isWithinBusinessHours(
  date: Date,
  windows: AvailabilityWindow[]
): boolean {
  const dayOfWeek = date.getDay();
  const hour = date.getHours();
  const minute = date.getMinutes();
  const timeInMinutes = hour * 60 + minute;

  return windows.some(window => {
    if (window.dayOfWeek !== dayOfWeek) return false;

    const windowStart = window.startHour * 60 + window.startMinute;
    const windowEnd = window.endHour * 60 + window.endMinute;

    return timeInMinutes >= windowStart && timeInMinutes < windowEnd;
  });
}

// ============================================
// SINGLETON INSTANCE
// ============================================

let calendarClientInstance: GoogleCalendarClient | null = null;

export function getCalendarClient(): GoogleCalendarClient {
  if (!calendarClientInstance) {
    calendarClientInstance = new GoogleCalendarClient();
  }
  return calendarClientInstance;
}
