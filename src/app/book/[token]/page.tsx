'use client';

import { useState, useEffect, use } from 'react';

// ============================================
// TYPES
// ============================================

interface InterviewSlot {
  id: string;
  start_time: string;
  end_time: string;
  duration: number;
  location_type: 'video' | 'phone' | 'in-person';
  recruiter_name: string;
  recruiter_email?: string;
  meeting_link?: string;
  address?: string;
  is_booked: boolean;
}

interface BookingInfo {
  candidateName: string;
  candidateEmail: string;
  roleTitle: string;
  companyName: string;
  slots: InterviewSlot[];
  expiresAt: string;
  isExpired: boolean;
  isUsed: boolean;
}

interface BookedInterview {
  date: string;
  duration: number;
  location_type: string;
  meeting_link?: string;
  address?: string;
  recruiter_name?: string;
  recruiter_email?: string;
}

// ============================================
// STYLES
// ============================================

const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
  },
  container: {
    width: '100%',
    maxWidth: '500px',
  },
  card: {
    background: 'white',
    borderRadius: '20px',
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)',
    overflow: 'hidden',
  },
  header: {
    background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
    padding: '32px 24px',
    color: 'white',
    textAlign: 'center' as const,
  },
  logo: {
    fontSize: '1.25rem',
    fontWeight: 700,
    marginBottom: '16px',
    opacity: 0.9,
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 700,
    marginBottom: '8px',
  },
  subtitle: {
    fontSize: '0.9rem',
    opacity: 0.9,
  },
  content: {
    padding: '24px',
  },
  infoBox: {
    background: '#f8fafc',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '24px',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
  },
  infoLabel: {
    fontSize: '0.8rem',
    color: '#64748b',
  },
  infoValue: {
    fontSize: '0.875rem',
    fontWeight: 500,
    color: '#0f172a',
  },
  sectionTitle: {
    fontSize: '0.9rem',
    fontWeight: 600,
    color: '#0f172a',
    marginBottom: '12px',
  },
  slotList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
    marginBottom: '24px',
    maxHeight: '300px',
    overflow: 'auto',
  },
  slot: {
    padding: '16px',
    border: '2px solid #e2e8f0',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  slotSelected: {
    borderColor: '#4F46E5',
    background: '#eef2ff',
  },
  slotDate: {
    fontSize: '0.9rem',
    fontWeight: 600,
    color: '#0f172a',
    marginBottom: '2px',
  },
  slotTime: {
    fontSize: '0.8rem',
    color: '#64748b',
  },
  slotDuration: {
    fontSize: '0.75rem',
    color: '#4F46E5',
    background: '#eef2ff',
    padding: '4px 8px',
    borderRadius: '6px',
  },
  radio: {
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    border: '2px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  radioSelected: {
    borderColor: '#4F46E5',
    background: '#4F46E5',
  },
  radioDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: 'white',
  },
  button: {
    width: '100%',
    padding: '16px',
    borderRadius: '12px',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
    border: 'none',
    background: '#4F46E5',
    color: 'white',
  },
  buttonDisabled: {
    background: '#e2e8f0',
    color: '#94a3b8',
    cursor: 'not-allowed',
  },
  success: {
    textAlign: 'center' as const,
    padding: '40px 24px',
  },
  successIcon: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    background: '#dcfce7',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 24px',
    fontSize: '2.5rem',
  },
  successTitle: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#0f172a',
    marginBottom: '8px',
  },
  successText: {
    fontSize: '0.9rem',
    color: '#64748b',
    lineHeight: 1.6,
  },
  error: {
    textAlign: 'center' as const,
    padding: '40px 24px',
  },
  errorIcon: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    background: '#fef2f2',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 24px',
    fontSize: '2.5rem',
  },
  errorTitle: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#0f172a',
    marginBottom: '8px',
  },
  errorText: {
    fontSize: '0.9rem',
    color: '#64748b',
    lineHeight: 1.6,
  },
  loading: {
    textAlign: 'center' as const,
    padding: '60px 24px',
    color: '#64748b',
  },
  footer: {
    padding: '16px 24px',
    borderTop: '1px solid #f1f5f9',
    textAlign: 'center' as const,
  },
  footerText: {
    fontSize: '0.75rem',
    color: '#94a3b8',
  },
  // Calendar buttons
  calendarButtons: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
    marginTop: '20px',
  },
  calendarButtonsTitle: {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: '#0f172a',
    marginBottom: '8px',
  },
  calendarButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px 16px',
    borderRadius: '8px',
    fontSize: '0.875rem',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s',
    border: '1px solid #e2e8f0',
    background: 'white',
    color: '#0f172a',
    width: '100%',
  },
  calendarButtonPrimary: {
    background: '#4F46E5',
    color: 'white',
    border: 'none',
  },
  calendarButtonGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px',
  },
  meetingLinkBox: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '12px',
    marginTop: '16px',
  },
  meetingLinkLabel: {
    fontSize: '0.75rem',
    color: '#64748b',
    marginBottom: '4px',
  },
  meetingLinkValue: {
    fontSize: '0.875rem',
    color: '#4F46E5',
    wordBreak: 'break-all' as const,
  },
};

// ============================================
// COMPONENT
// ============================================

export default function BookingPage({ params }: { params: Promise<{ token: string }> }) {
  const resolvedParams = use(params);
  const { token } = resolvedParams;

  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [bookingInfo, setBookingInfo] = useState<BookingInfo | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [bookedInterview, setBookedInterview] = useState<BookedInterview | null>(null);

  // Generate .ics file content
  const generateICS = (slot: InterviewSlot) => {
    const startDate = new Date(slot.start_time);
    const endDate = new Date(slot.end_time);

    const formatICSDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    };

    // Generate a unique ID
    const uid = `hireinbox-${slot.id}-${Date.now()}@hireinbox.co.za`;

    // Determine location
    let location = '';
    if (slot.location_type === 'video' && slot.meeting_link) {
      location = slot.meeting_link;
    } else if (slot.location_type === 'in-person' && slot.address) {
      location = slot.address;
    } else if (slot.location_type === 'phone') {
      location = 'Phone Call';
    } else {
      location = 'Video Call';
    }

    // Create description
    let description = `Interview for ${bookingInfo?.roleTitle} at ${bookingInfo?.companyName}\\n\\n`;
    description += `Interviewer: ${slot.recruiter_name}\\n`;
    if (slot.meeting_link) {
      description += `Meeting Link: ${slot.meeting_link}\\n`;
    }
    if (slot.address) {
      description += `Address: ${slot.address}\\n`;
    }
    description += `\\nBooked via Hyred`;

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Hyred//Interview Booking//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:REQUEST',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${formatICSDate(new Date())}`,
      `DTSTART:${formatICSDate(startDate)}`,
      `DTEND:${formatICSDate(endDate)}`,
      `SUMMARY:Interview - ${bookingInfo?.roleTitle} at ${bookingInfo?.companyName}`,
      `DESCRIPTION:${description}`,
      `LOCATION:${location}`,
      'STATUS:CONFIRMED',
      'SEQUENCE:0',
      'BEGIN:VALARM',
      'TRIGGER:-PT1H',
      'ACTION:DISPLAY',
      'DESCRIPTION:Interview reminder - 1 hour',
      'END:VALARM',
      'BEGIN:VALARM',
      'TRIGGER:-PT15M',
      'ACTION:DISPLAY',
      'DESCRIPTION:Interview reminder - 15 minutes',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    return icsContent;
  };

  // Download .ics file
  const downloadCalendarFile = () => {
    if (!selectedSlot || !bookingInfo) return;

    const slot = bookingInfo.slots.find(s => s.id === selectedSlot);
    if (!slot) return;

    const icsContent = generateICS(slot);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `interview-${bookingInfo.companyName.replace(/\s+/g, '-').toLowerCase()}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  // Add to Google Calendar
  const addToGoogleCalendar = () => {
    if (!selectedSlot || !bookingInfo) return;

    const slot = bookingInfo.slots.find(s => s.id === selectedSlot);
    if (!slot) return;

    const startDate = new Date(slot.start_time);
    const endDate = new Date(slot.end_time);

    const formatGoogleDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z/, 'Z');
    };

    let location = '';
    if (slot.location_type === 'video' && slot.meeting_link) {
      location = slot.meeting_link;
    } else if (slot.address) {
      location = slot.address;
    }

    let details = `Interview for ${bookingInfo.roleTitle} at ${bookingInfo.companyName}\n\n`;
    details += `Interviewer: ${slot.recruiter_name}\n`;
    if (slot.meeting_link) {
      details += `Meeting Link: ${slot.meeting_link}\n`;
    }

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: `Interview - ${bookingInfo.roleTitle} at ${bookingInfo.companyName}`,
      dates: `${formatGoogleDate(startDate)}/${formatGoogleDate(endDate)}`,
      details: details,
      location: location,
    });

    window.open(`https://calendar.google.com/calendar/render?${params.toString()}`, '_blank');
  };

  // Add to Outlook Calendar
  const addToOutlookCalendar = () => {
    if (!selectedSlot || !bookingInfo) return;

    const slot = bookingInfo.slots.find(s => s.id === selectedSlot);
    if (!slot) return;

    const startDate = new Date(slot.start_time);
    const endDate = new Date(slot.end_time);

    let location = '';
    if (slot.location_type === 'video' && slot.meeting_link) {
      location = slot.meeting_link;
    } else if (slot.address) {
      location = slot.address;
    }

    let body = `Interview for ${bookingInfo.roleTitle} at ${bookingInfo.companyName}%0A%0A`;
    body += `Interviewer: ${slot.recruiter_name}%0A`;
    if (slot.meeting_link) {
      body += `Meeting Link: ${slot.meeting_link}%0A`;
    }

    const params = new URLSearchParams({
      subject: `Interview - ${bookingInfo.roleTitle} at ${bookingInfo.companyName}`,
      startdt: startDate.toISOString(),
      enddt: endDate.toISOString(),
      body: body,
      location: location,
    });

    window.open(`https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`, '_blank');
  };

  useEffect(() => {
    fetchBookingInfo();
  }, [token]);

  const fetchBookingInfo = async () => {
    try {
      const res = await fetch(`/api/book/${token}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Invalid booking link');
        return;
      }

      setBookingInfo(data);

      if (data.isExpired) {
        setError('This booking link has expired');
      } else if (data.isUsed) {
        setError('This booking link has already been used');
      }
    } catch (err) {
      setError('Failed to load booking information');
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async () => {
    if (!selectedSlot) return;

    setBooking(true);
    try {
      const res = await fetch(`/api/book/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slot_id: selectedSlot }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to book interview');
        return;
      }

      // Store the booked interview data
      if (data.interview) {
        setBookedInterview(data.interview);
      }

      setSuccess(true);
    } catch (err) {
      setError('Failed to book interview. Please try again.');
    } finally {
      setBooking(false);
    }
  };

  const formatSlotDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-ZA', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  const formatSlotTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-ZA', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Loading state
  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.card}>
            <div style={styles.loading}>
              <p>Loading available times...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !bookingInfo) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.card}>
            <div style={styles.error}>
              <div style={styles.errorIcon}>!</div>
              <h2 style={styles.errorTitle}>Unable to Load</h2>
              <p style={styles.errorText}>{error}</p>
            </div>
            <div style={styles.footer}>
              <p style={styles.footerText}>
                Please contact the hiring team if you believe this is an error.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    const bookedSlot = bookingInfo?.slots.find(s => s.id === selectedSlot);
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.card}>
            <div style={styles.success}>
              <div style={styles.successIcon}>&#10003;</div>
              <h2 style={styles.successTitle}>Interview Booked!</h2>
              <p style={styles.successText}>
                Your interview for <strong>{bookingInfo?.roleTitle}</strong> at{' '}
                <strong>{bookingInfo?.companyName}</strong> has been confirmed.
              </p>
              {bookedSlot && (
                <>
                  <div style={{ ...styles.infoBox, marginTop: '24px', textAlign: 'left' }}>
                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}>Date</span>
                      <span style={styles.infoValue}>{formatSlotDate(bookedSlot.start_time)}</span>
                    </div>
                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}>Time</span>
                      <span style={styles.infoValue}>
                        {formatSlotTime(bookedSlot.start_time)} - {formatSlotTime(bookedSlot.end_time)}
                      </span>
                    </div>
                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}>Format</span>
                      <span style={styles.infoValue}>
                        {bookedSlot.location_type === 'video' ? 'Video Call' :
                         bookedSlot.location_type === 'phone' ? 'Phone Call' : 'In Person'}
                      </span>
                    </div>
                    <div style={{ ...styles.infoRow, marginBottom: 0 }}>
                      <span style={styles.infoLabel}>With</span>
                      <span style={styles.infoValue}>{bookedSlot.recruiter_name}</span>
                    </div>
                  </div>

                  {/* Meeting Link */}
                  {bookedSlot.location_type === 'video' && bookedSlot.meeting_link && (
                    <div style={styles.meetingLinkBox}>
                      <div style={styles.meetingLinkLabel}>Meeting Link</div>
                      <a
                        href={bookedSlot.meeting_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={styles.meetingLinkValue}
                      >
                        {bookedSlot.meeting_link}
                      </a>
                    </div>
                  )}

                  {/* Address for in-person */}
                  {bookedSlot.location_type === 'in-person' && bookedSlot.address && (
                    <div style={styles.meetingLinkBox}>
                      <div style={styles.meetingLinkLabel}>Interview Location</div>
                      <div style={{ fontSize: '0.875rem', color: '#0f172a' }}>
                        {bookedSlot.address}
                      </div>
                    </div>
                  )}

                  {/* Add to Calendar Buttons */}
                  <div style={styles.calendarButtons}>
                    <div style={styles.calendarButtonsTitle}>Add to Your Calendar</div>
                    <button
                      style={{ ...styles.calendarButton, ...styles.calendarButtonPrimary }}
                      onClick={downloadCalendarFile}
                    >
                      Download Calendar File (.ics)
                    </button>
                    <div style={styles.calendarButtonGrid}>
                      <button
                        style={styles.calendarButton}
                        onClick={addToGoogleCalendar}
                      >
                        Google Calendar
                      </button>
                      <button
                        style={styles.calendarButton}
                        onClick={addToOutlookCalendar}
                      >
                        Outlook Calendar
                      </button>
                    </div>
                  </div>
                </>
              )}
              <p style={{ ...styles.successText, marginTop: '20px' }}>
                A confirmation email has been sent to <strong>{bookingInfo?.candidateEmail}</strong>.
              </p>
            </div>
            <div style={styles.footer}>
              <p style={styles.footerText}>
                Powered by Hyred - POPIA Compliant
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main booking view
  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.card}>
          {/* Header */}
          <div style={styles.header}>
            <div style={styles.logo}>Hyred</div>
            <h1 style={styles.title}>Schedule Your Interview</h1>
            <p style={styles.subtitle}>
              Select a time that works best for you
            </p>
          </div>

          <div style={styles.content}>
            {/* Interview Info */}
            <div style={styles.infoBox}>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Position</span>
                <span style={styles.infoValue}>{bookingInfo?.roleTitle}</span>
              </div>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Company</span>
                <span style={styles.infoValue}>{bookingInfo?.companyName}</span>
              </div>
              <div style={{ ...styles.infoRow, marginBottom: 0 }}>
                <span style={styles.infoLabel}>Candidate</span>
                <span style={styles.infoValue}>{bookingInfo?.candidateName}</span>
              </div>
            </div>

            {/* Slot Selection */}
            <div style={styles.sectionTitle}>Available Times</div>

            {bookingInfo?.slots && bookingInfo.slots.length > 0 ? (
              <div style={styles.slotList}>
                {bookingInfo.slots.filter(s => !s.is_booked).map(slot => (
                  <div
                    key={slot.id}
                    style={{
                      ...styles.slot,
                      ...(selectedSlot === slot.id ? styles.slotSelected : {}),
                    }}
                    onClick={() => setSelectedSlot(slot.id)}
                  >
                    <div>
                      <div style={styles.slotDate}>{formatSlotDate(slot.start_time)}</div>
                      <div style={styles.slotTime}>
                        {formatSlotTime(slot.start_time)} - {formatSlotTime(slot.end_time)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={styles.slotDuration}>{slot.duration} min</span>
                      <div
                        style={{
                          ...styles.radio,
                          ...(selectedSlot === slot.id ? styles.radioSelected : {}),
                        }}
                      >
                        {selectedSlot === slot.id && <div style={styles.radioDot} />}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
                No available slots at the moment. Please contact the hiring team.
              </div>
            )}

            {/* Book Button */}
            <button
              style={{
                ...styles.button,
                ...(!selectedSlot || booking ? styles.buttonDisabled : {}),
              }}
              onClick={handleBook}
              disabled={!selectedSlot || booking}
            >
              {booking ? 'Booking...' : 'Confirm Interview Time'}
            </button>
          </div>

          <div style={styles.footer}>
            <p style={styles.footerText}>
              Powered by Hyred - POPIA Compliant
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
