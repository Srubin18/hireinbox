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
                </div>
              )}
              <p style={{ ...styles.successText, marginTop: '16px' }}>
                A confirmation email has been sent to <strong>{bookingInfo?.candidateEmail}</strong>.
                Please add this to your calendar.
              </p>
            </div>
            <div style={styles.footer}>
              <p style={styles.footerText}>
                Powered by HireInbox
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
            <div style={styles.logo}>HireInbox</div>
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
              Powered by HireInbox - POPIA Compliant
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
