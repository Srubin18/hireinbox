'use client';

import { useState, useEffect } from 'react';

// ============================================
// TYPES
// ============================================

interface AvailabilityWindow {
  dayOfWeek: number;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
}

interface InterviewSlot {
  id: string;
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
  created_at: string;
}

interface RecruiterSettings {
  availability_windows: AvailabilityWindow[];
  interview_duration: number;
  buffer_between: number;
  max_per_day: number;
  auto_create_meet: boolean;
}

interface Role {
  id: string;
  title: string;
  status: string;
}

interface ScheduledInterview {
  id: string;
  candidate_id: string;
  candidate: {
    name: string;
    email: string;
    ai_score: number;
  };
  status: string;
  scheduled_at?: string;
  booking_link?: string;
}

// ============================================
// CONSTANTS
// ============================================

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

const DEFAULT_WINDOWS: AvailabilityWindow[] = [
  { dayOfWeek: 1, startHour: 9, startMinute: 0, endHour: 17, endMinute: 0 },
  { dayOfWeek: 2, startHour: 9, startMinute: 0, endHour: 17, endMinute: 0 },
  { dayOfWeek: 3, startHour: 9, startMinute: 0, endHour: 17, endMinute: 0 },
  { dayOfWeek: 4, startHour: 9, startMinute: 0, endHour: 17, endMinute: 0 },
  { dayOfWeek: 5, startHour: 9, startMinute: 0, endHour: 17, endMinute: 0 },
];

// ============================================
// STYLES
// ============================================

const styles = {
  page: {
    minHeight: '100vh',
    background: '#f8fafc',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  header: {
    background: 'white',
    borderBottom: '1px solid #e2e8f0',
    padding: '16px 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  backButton: {
    background: 'none',
    border: 'none',
    fontSize: '1.5rem',
    cursor: 'pointer',
    color: '#64748b',
    padding: '4px',
  },
  headerTitle: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: '#0f172a',
  },
  headerSubtitle: {
    fontSize: '0.875rem',
    color: '#64748b',
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '24px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '24px',
  },
  card: {
    background: 'white',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
  },
  cardHeader: {
    padding: '20px 24px',
    borderBottom: '1px solid #e2e8f0',
  },
  cardTitle: {
    fontSize: '1rem',
    fontWeight: 600,
    color: '#0f172a',
    marginBottom: '4px',
  },
  cardDesc: {
    fontSize: '0.8rem',
    color: '#64748b',
  },
  cardContent: {
    padding: '24px',
  },
  section: {
    marginBottom: '24px',
  },
  sectionTitle: {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: '#0f172a',
    marginBottom: '12px',
  },
  dayRow: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 0',
    borderBottom: '1px solid #f1f5f9',
    gap: '12px',
  },
  dayLabel: {
    width: '100px',
    fontSize: '0.875rem',
    fontWeight: 500,
    color: '#0f172a',
  },
  checkbox: {
    width: '20px',
    height: '20px',
    cursor: 'pointer',
  },
  timeSelect: {
    padding: '8px 12px',
    fontSize: '0.875rem',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    background: 'white',
    cursor: 'pointer',
  },
  inputGroup: {
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    fontSize: '0.8rem',
    fontWeight: 500,
    color: '#475569',
    marginBottom: '6px',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    fontSize: '0.9rem',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    outline: 'none',
  },
  select: {
    width: '100%',
    padding: '10px 12px',
    fontSize: '0.9rem',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    background: 'white',
    cursor: 'pointer',
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },
  button: {
    padding: '12px 24px',
    borderRadius: '8px',
    fontSize: '0.875rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
    border: 'none',
  },
  buttonPrimary: {
    background: '#4F46E5',
    color: 'white',
  },
  buttonSecondary: {
    background: '#f1f5f9',
    color: '#475569',
    border: '1px solid #e2e8f0',
  },
  slotList: {
    maxHeight: '400px',
    overflow: 'auto',
  },
  slotItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    borderBottom: '1px solid #f1f5f9',
  },
  slotTime: {
    fontSize: '0.875rem',
    fontWeight: 500,
    color: '#0f172a',
  },
  slotDate: {
    fontSize: '0.75rem',
    color: '#64748b',
  },
  slotBadge: {
    fontSize: '0.7rem',
    fontWeight: 600,
    padding: '4px 8px',
    borderRadius: '6px',
  },
  slotAvailable: {
    background: '#dcfce7',
    color: '#166534',
  },
  slotBooked: {
    background: '#fef3c7',
    color: '#92400e',
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: '40px 20px',
    color: '#64748b',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
    marginBottom: '24px',
  },
  statCard: {
    background: 'white',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    padding: '16px 20px',
  },
  statValue: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#0f172a',
    marginBottom: '4px',
  },
  statLabel: {
    fontSize: '0.75rem',
    color: '#64748b',
    fontWeight: 500,
  },
  interviewList: {
    maxHeight: '300px',
    overflow: 'auto',
  },
  interviewItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    borderBottom: '1px solid #f1f5f9',
  },
  candidateName: {
    fontSize: '0.875rem',
    fontWeight: 500,
    color: '#0f172a',
  },
  candidateEmail: {
    fontSize: '0.75rem',
    color: '#64748b',
  },
  scoreBadge: {
    fontSize: '0.75rem',
    fontWeight: 600,
    padding: '4px 8px',
    borderRadius: '6px',
    background: '#dcfce7',
    color: '#166534',
  },
  statusBadge: {
    fontSize: '0.7rem',
    fontWeight: 600,
    padding: '4px 8px',
    borderRadius: '6px',
  },
  pendingStatus: {
    background: '#fef3c7',
    color: '#92400e',
  },
  bookedStatus: {
    background: '#dcfce7',
    color: '#166534',
  },
  roleSelect: {
    padding: '8px 16px',
    fontSize: '0.875rem',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    background: 'white',
    cursor: 'pointer',
  },
  actionButtons: {
    display: 'flex',
    gap: '12px',
    marginTop: '16px',
  },
};

// ============================================
// COMPONENT
// ============================================

export default function SchedulePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [slots, setSlots] = useState<InterviewSlot[]>([]);
  const [interviews, setInterviews] = useState<ScheduledInterview[]>([]);
  const [stats, setStats] = useState({
    scheduled_interviews: 0,
    pending_booking: 0,
    booked: 0,
    available_slots: 0,
    eligible_candidates: 0,
  });

  // Recruiter settings
  const [settings, setSettings] = useState<RecruiterSettings>({
    availability_windows: DEFAULT_WINDOWS,
    interview_duration: 30,
    buffer_between: 15,
    max_per_day: 8,
    auto_create_meet: true,
  });

  // Recruiter info (would come from auth)
  const recruiterId = 'recruiter-1';
  const recruiterEmail = 'recruiter@hireinbox.co.za';
  const recruiterName = 'Hiring Manager';

  // Fetch roles on mount
  useEffect(() => {
    fetchRoles();
  }, []);

  // Fetch slots and interviews when role changes
  useEffect(() => {
    if (selectedRole) {
      fetchSlots();
      fetchAutoScheduleStatus();
    }
  }, [selectedRole]);

  const fetchRoles = async () => {
    try {
      const res = await fetch('/api/roles');
      const data = await res.json();
      if (data.roles) {
        setRoles(data.roles);
        if (data.roles.length > 0) {
          setSelectedRole(data.roles[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch roles:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSlots = async () => {
    try {
      const res = await fetch(`/api/schedule/slots?role_id=${selectedRole}`);
      const data = await res.json();
      if (data.slots) {
        setSlots(data.slots);
      }
    } catch (error) {
      console.error('Failed to fetch slots:', error);
    }
  };

  const fetchAutoScheduleStatus = async () => {
    try {
      const res = await fetch(`/api/schedule/auto?role_id=${selectedRole}`);
      const data = await res.json();
      if (data.stats) {
        setStats(data.stats);
      }
      if (data.interviews) {
        setInterviews(data.interviews);
      }
    } catch (error) {
      console.error('Failed to fetch auto-schedule status:', error);
    }
  };

  const saveAvailability = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/schedule/slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'availability',
          recruiter_id: recruiterId,
          recruiter_email: recruiterEmail,
          availability_windows: settings.availability_windows,
          interview_duration: settings.interview_duration,
          buffer_between: settings.buffer_between,
          max_per_day: settings.max_per_day,
          auto_create_meet: settings.auto_create_meet,
        }),
      });

      if (!res.ok) throw new Error('Failed to save');
      alert('Availability saved successfully!');
    } catch (error) {
      console.error('Failed to save availability:', error);
      alert('Failed to save availability');
    } finally {
      setSaving(false);
    }
  };

  const generateSlots = async () => {
    if (!selectedRole) {
      alert('Please select a role first');
      return;
    }

    setGenerating(true);
    try {
      // First save availability settings
      await saveAvailability();

      // Then generate slots
      const res = await fetch('/api/schedule/slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'generate',
          role_id: selectedRole,
          recruiter_id: recruiterId,
          days_ahead: 14,
        }),
      });

      const data = await res.json();
      if (data.slotsCreated > 0) {
        alert(`Generated ${data.slotsCreated} interview slots!`);
        fetchSlots();
      } else {
        alert('No new slots to generate');
      }
    } catch (error) {
      console.error('Failed to generate slots:', error);
      alert('Failed to generate slots');
    } finally {
      setGenerating(false);
    }
  };

  const triggerAutoSchedule = async () => {
    if (!selectedRole) return;

    try {
      const res = await fetch('/api/schedule/auto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role_id: selectedRole }),
      });

      const data = await res.json();
      if (data.scheduled > 0) {
        alert(`Scheduled ${data.scheduled} interviews!`);
        fetchAutoScheduleStatus();
        fetchSlots();
      } else {
        alert(data.message || 'No candidates to schedule');
      }
    } catch (error) {
      console.error('Failed to trigger auto-schedule:', error);
      alert('Failed to trigger auto-schedule');
    }
  };

  const toggleDay = (dayOfWeek: number) => {
    const exists = settings.availability_windows.some(w => w.dayOfWeek === dayOfWeek);

    if (exists) {
      setSettings({
        ...settings,
        availability_windows: settings.availability_windows.filter(w => w.dayOfWeek !== dayOfWeek),
      });
    } else {
      setSettings({
        ...settings,
        availability_windows: [
          ...settings.availability_windows,
          { dayOfWeek, startHour: 9, startMinute: 0, endHour: 17, endMinute: 0 },
        ],
      });
    }
  };

  const updateDayTime = (dayOfWeek: number, field: 'startHour' | 'endHour', value: number) => {
    setSettings({
      ...settings,
      availability_windows: settings.availability_windows.map(w =>
        w.dayOfWeek === dayOfWeek ? { ...w, [field]: value } : w
      ),
    });
  };

  const formatSlotTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const formatSlotDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={{ padding: '100px', textAlign: 'center', color: '#64748b' }}>
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <button style={styles.backButton} onClick={() => window.history.back()}>
            <span style={{ display: 'inline-block', transform: 'rotate(180deg)' }}>-&gt;</span>
          </button>
          <div>
            <h1 style={styles.headerTitle}>Interview Scheduling</h1>
            <p style={styles.headerSubtitle}>Manage your availability and schedule interviews</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <select
            value={selectedRole}
            onChange={e => setSelectedRole(e.target.value)}
            style={styles.roleSelect}
          >
            {roles.map(role => (
              <option key={role.id} value={role.id}>
                {role.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={styles.container}>
        {/* Stats */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{stats.available_slots}</div>
            <div style={styles.statLabel}>Available Slots</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{stats.pending_booking}</div>
            <div style={styles.statLabel}>Pending Booking</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{stats.booked}</div>
            <div style={styles.statLabel}>Interviews Booked</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{stats.eligible_candidates}</div>
            <div style={styles.statLabel}>Eligible Candidates</div>
          </div>
        </div>

        <div style={styles.grid}>
          {/* Left Column - Availability Settings */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>Your Availability</h2>
              <p style={styles.cardDesc}>Set when you're available for interviews</p>
            </div>
            <div style={styles.cardContent}>
              {/* Day Selection */}
              <div style={styles.section}>
                <div style={styles.sectionTitle}>Working Days</div>
                {DAYS.map((day, index) => {
                  const window = settings.availability_windows.find(w => w.dayOfWeek === index);
                  const isActive = !!window;

                  return (
                    <div key={day} style={styles.dayRow}>
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={() => toggleDay(index)}
                        style={styles.checkbox}
                      />
                      <span style={{
                        ...styles.dayLabel,
                        color: isActive ? '#0f172a' : '#94a3b8',
                      }}>
                        {day}
                      </span>
                      {isActive && (
                        <>
                          <select
                            value={window!.startHour}
                            onChange={e => updateDayTime(index, 'startHour', parseInt(e.target.value))}
                            style={styles.timeSelect}
                          >
                            {HOURS.map(h => (
                              <option key={h} value={h}>
                                {h.toString().padStart(2, '0')}:00
                              </option>
                            ))}
                          </select>
                          <span style={{ color: '#64748b' }}>to</span>
                          <select
                            value={window!.endHour}
                            onChange={e => updateDayTime(index, 'endHour', parseInt(e.target.value))}
                            style={styles.timeSelect}
                          >
                            {HOURS.map(h => (
                              <option key={h} value={h}>
                                {h.toString().padStart(2, '0')}:00
                              </option>
                            ))}
                          </select>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Interview Settings */}
              <div style={styles.section}>
                <div style={styles.sectionTitle}>Interview Settings</div>
                <div style={styles.row}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Duration</label>
                    <select
                      value={settings.interview_duration}
                      onChange={e => setSettings({
                        ...settings,
                        interview_duration: parseInt(e.target.value)
                      })}
                      style={styles.select}
                    >
                      <option value={15}>15 minutes</option>
                      <option value={30}>30 minutes</option>
                      <option value={45}>45 minutes</option>
                      <option value={60}>60 minutes</option>
                    </select>
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Buffer Between</label>
                    <select
                      value={settings.buffer_between}
                      onChange={e => setSettings({
                        ...settings,
                        buffer_between: parseInt(e.target.value)
                      })}
                      style={styles.select}
                    >
                      <option value={0}>No buffer</option>
                      <option value={5}>5 minutes</option>
                      <option value={10}>10 minutes</option>
                      <option value={15}>15 minutes</option>
                      <option value={30}>30 minutes</option>
                    </select>
                  </div>
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Max Interviews Per Day</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={settings.max_per_day}
                    onChange={e => setSettings({
                      ...settings,
                      max_per_day: parseInt(e.target.value) || 8
                    })}
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.actionButtons}>
                <button
                  style={{ ...styles.button, ...styles.buttonSecondary, flex: 1 }}
                  onClick={saveAvailability}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Availability'}
                </button>
                <button
                  style={{ ...styles.button, ...styles.buttonPrimary, flex: 1 }}
                  onClick={generateSlots}
                  disabled={generating}
                >
                  {generating ? 'Generating...' : 'Generate Slots'}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Slots & Interviews */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Available Slots */}
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <h2 style={styles.cardTitle}>Interview Slots</h2>
                <p style={styles.cardDesc}>Available times for candidates to book</p>
              </div>
              <div style={styles.slotList}>
                {slots.length === 0 ? (
                  <div style={styles.emptyState}>
                    <p>No slots generated yet</p>
                    <p style={{ fontSize: '0.8rem', marginTop: '8px' }}>
                      Set your availability and click "Generate Slots"
                    </p>
                  </div>
                ) : (
                  slots.slice(0, 10).map(slot => (
                    <div key={slot.id} style={styles.slotItem}>
                      <div>
                        <div style={styles.slotTime}>
                          {formatSlotTime(slot.start_time)} - {formatSlotTime(slot.end_time)}
                        </div>
                        <div style={styles.slotDate}>{formatSlotDate(slot.start_time)}</div>
                      </div>
                      <span style={{
                        ...styles.slotBadge,
                        ...(slot.is_booked ? styles.slotBooked : styles.slotAvailable),
                      }}>
                        {slot.is_booked ? 'Booked' : 'Available'}
                      </span>
                    </div>
                  ))
                )}
                {slots.length > 10 && (
                  <div style={{ padding: '12px', textAlign: 'center', color: '#64748b', fontSize: '0.8rem' }}>
                    + {slots.length - 10} more slots
                  </div>
                )}
              </div>
            </div>

            {/* Scheduled Interviews */}
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h2 style={styles.cardTitle}>Scheduled Interviews</h2>
                    <p style={styles.cardDesc}>Candidates with scheduled or pending interviews</p>
                  </div>
                  <button
                    style={{ ...styles.button, ...styles.buttonPrimary, padding: '8px 16px' }}
                    onClick={triggerAutoSchedule}
                  >
                    Auto-Schedule
                  </button>
                </div>
              </div>
              <div style={styles.interviewList}>
                {interviews.length === 0 ? (
                  <div style={styles.emptyState}>
                    <p>No interviews scheduled yet</p>
                    <p style={{ fontSize: '0.8rem', marginTop: '8px' }}>
                      Click "Auto-Schedule" to schedule eligible candidates
                    </p>
                  </div>
                ) : (
                  interviews.map(interview => (
                    <div key={interview.id} style={styles.interviewItem}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div>
                          <div style={styles.candidateName}>
                            {interview.candidate?.name || 'Unknown'}
                          </div>
                          <div style={styles.candidateEmail}>
                            {interview.candidate?.email}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={styles.scoreBadge}>
                          {interview.candidate?.ai_score || 0}/100
                        </span>
                        <span style={{
                          ...styles.statusBadge,
                          ...(interview.status === 'booked' ? styles.bookedStatus : styles.pendingStatus),
                        }}>
                          {interview.status === 'booked' ? 'Booked' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
