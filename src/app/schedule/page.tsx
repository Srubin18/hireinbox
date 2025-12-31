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

interface BlockedDate {
  date: string; // YYYY-MM-DD
  reason?: string;
}

interface OneOffSlot {
  date: string; // YYYY-MM-DD
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
  booked_at?: string;
  created_at: string;
}

interface RecruiterSettings {
  availability_windows: AvailabilityWindow[];
  blocked_dates: BlockedDate[];
  one_off_slots: OneOffSlot[];
  interview_duration: number;
  buffer_between: number;
  max_per_day: number;
  auto_create_meet: boolean;
  default_location_type: 'video' | 'phone' | 'in-person';
  default_meeting_link?: string;
  default_address?: string;
}

interface Role {
  id: string;
  title: string;
  status: string;
}

interface ScheduledInterview {
  id: string;
  candidate_id: string;
  slot_id?: string;
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
const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

const DEFAULT_WINDOWS: AvailabilityWindow[] = [
  { dayOfWeek: 1, startHour: 9, startMinute: 0, endHour: 17, endMinute: 0 },
  { dayOfWeek: 2, startHour: 9, startMinute: 0, endHour: 17, endMinute: 0 },
  { dayOfWeek: 3, startHour: 9, startMinute: 0, endHour: 17, endMinute: 0 },
  { dayOfWeek: 4, startHour: 9, startMinute: 0, endHour: 17, endMinute: 0 },
  { dayOfWeek: 5, startHour: 9, startMinute: 0, endHour: 17, endMinute: 0 },
];

type ViewTab = 'availability' | 'calendar' | 'interviews';

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
  // Tab navigation
  tabBar: {
    display: 'flex',
    gap: '4px',
    background: '#f1f5f9',
    padding: '4px',
    borderRadius: '10px',
    marginBottom: '24px',
  },
  tab: {
    flex: 1,
    padding: '10px 16px',
    borderRadius: '8px',
    fontSize: '0.875rem',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s',
    border: 'none',
    background: 'transparent',
    color: '#64748b',
  },
  tabActive: {
    background: 'white',
    color: '#0f172a',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  },
  // Calendar view
  calendarContainer: {
    background: 'white',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
  },
  calendarHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    borderBottom: '1px solid #e2e8f0',
  },
  calendarNav: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  calendarNavBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    background: 'white',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1rem',
    color: '#64748b',
  },
  calendarTitle: {
    fontSize: '1rem',
    fontWeight: 600,
    color: '#0f172a',
  },
  calendarWeekHeader: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    borderBottom: '1px solid #e2e8f0',
    background: '#f8fafc',
  },
  calendarWeekDay: {
    padding: '12px 8px',
    textAlign: 'center' as const,
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#64748b',
    textTransform: 'uppercase' as const,
  },
  calendarGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
  },
  calendarDay: {
    minHeight: '100px',
    padding: '8px',
    borderRight: '1px solid #f1f5f9',
    borderBottom: '1px solid #f1f5f9',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  calendarDayOther: {
    background: '#fafafa',
  },
  calendarDayToday: {
    background: '#eef2ff',
  },
  calendarDayBlocked: {
    background: '#fef2f2',
  },
  calendarDayNumber: {
    fontSize: '0.8rem',
    fontWeight: 500,
    color: '#0f172a',
    marginBottom: '4px',
  },
  calendarDayNumberOther: {
    color: '#94a3b8',
  },
  calendarEvent: {
    fontSize: '0.7rem',
    padding: '2px 4px',
    borderRadius: '4px',
    marginBottom: '2px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  calendarEventBooked: {
    background: '#dcfce7',
    color: '#166534',
  },
  calendarEventAvailable: {
    background: '#dbeafe',
    color: '#1e40af',
  },
  calendarEventBlocked: {
    background: '#fee2e2',
    color: '#991b1b',
  },
  // Interview details modal
  modal: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
  },
  modalContent: {
    background: 'white',
    borderRadius: '16px',
    maxWidth: '500px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'auto',
  },
  modalHeader: {
    padding: '20px 24px',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: '1.125rem',
    fontWeight: 600,
    color: '#0f172a',
  },
  modalClose: {
    background: 'none',
    border: 'none',
    fontSize: '1.5rem',
    color: '#64748b',
    cursor: 'pointer',
    padding: '4px',
    lineHeight: 1,
  },
  modalBody: {
    padding: '24px',
  },
  modalFooter: {
    padding: '16px 24px',
    borderTop: '1px solid #e2e8f0',
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
  },
  // Blocked dates list
  blockedDateItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 0',
    borderBottom: '1px solid #f1f5f9',
  },
  blockedDateText: {
    fontSize: '0.875rem',
    color: '#0f172a',
  },
  blockedDateReason: {
    fontSize: '0.75rem',
    color: '#64748b',
    marginTop: '2px',
  },
  removeBtn: {
    background: 'none',
    border: 'none',
    color: '#dc2626',
    cursor: 'pointer',
    fontSize: '0.8rem',
    padding: '4px 8px',
  },
  // Interview card
  interviewCard: {
    background: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '12px',
  },
  interviewCardHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: '12px',
  },
  interviewCardTitle: {
    fontSize: '0.95rem',
    fontWeight: 600,
    color: '#0f172a',
    marginBottom: '4px',
  },
  interviewCardSubtitle: {
    fontSize: '0.8rem',
    color: '#64748b',
  },
  interviewCardDetails: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    marginBottom: '12px',
  },
  interviewCardDetail: {
    fontSize: '0.8rem',
  },
  interviewCardLabel: {
    color: '#64748b',
    marginBottom: '2px',
  },
  interviewCardValue: {
    color: '#0f172a',
    fontWeight: 500,
  },
  interviewCardActions: {
    display: 'flex',
    gap: '8px',
    paddingTop: '12px',
    borderTop: '1px solid #f1f5f9',
  },
  buttonSmall: {
    padding: '6px 12px',
    fontSize: '0.75rem',
    fontWeight: 500,
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    border: 'none',
  },
  buttonDanger: {
    background: '#fee2e2',
    color: '#dc2626',
  },
  buttonOutline: {
    background: 'white',
    color: '#475569',
    border: '1px solid #e2e8f0',
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

  // View state
  const [activeTab, setActiveTab] = useState<ViewTab>('calendar');
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState<InterviewSlot | null>(null);
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [showBlockDateModal, setShowBlockDateModal] = useState(false);
  const [showAddSlotModal, setShowAddSlotModal] = useState(false);

  // New blocked date form
  const [newBlockedDate, setNewBlockedDate] = useState('');
  const [newBlockedReason, setNewBlockedReason] = useState('');

  // New one-off slot form
  const [newSlotDate, setNewSlotDate] = useState('');
  const [newSlotStart, setNewSlotStart] = useState('09:00');
  const [newSlotEnd, setNewSlotEnd] = useState('17:00');

  // Recruiter settings
  const [settings, setSettings] = useState<RecruiterSettings>({
    availability_windows: DEFAULT_WINDOWS,
    blocked_dates: [],
    one_off_slots: [],
    interview_duration: 30,
    buffer_between: 15,
    max_per_day: 8,
    auto_create_meet: true,
    default_location_type: 'video',
    default_meeting_link: '',
    default_address: '',
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

  const formatFullDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-ZA', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Calendar helpers
  const getCalendarDays = () => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days: Date[] = [];
    const current = new Date(startDate);

    while (days.length < 42) { // 6 weeks
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return days;
  };

  const getSlotsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return slots.filter(slot => slot.start_time.startsWith(dateStr));
  };

  const isDateBlocked = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return settings.blocked_dates.some(b => b.date === dateStr);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === calendarMonth.getMonth();
  };

  // Add blocked date
  const addBlockedDate = () => {
    if (!newBlockedDate) return;

    const newBlocked: BlockedDate = {
      date: newBlockedDate,
      reason: newBlockedReason || undefined,
    };

    setSettings({
      ...settings,
      blocked_dates: [...settings.blocked_dates, newBlocked],
    });

    setNewBlockedDate('');
    setNewBlockedReason('');
    setShowBlockDateModal(false);
  };

  const removeBlockedDate = (dateStr: string) => {
    setSettings({
      ...settings,
      blocked_dates: settings.blocked_dates.filter(b => b.date !== dateStr),
    });
  };

  // Add one-off slot
  const addOneOffSlot = () => {
    if (!newSlotDate) return;

    const [startHour, startMinute] = newSlotStart.split(':').map(Number);
    const [endHour, endMinute] = newSlotEnd.split(':').map(Number);

    const newSlot: OneOffSlot = {
      date: newSlotDate,
      startHour,
      startMinute: startMinute || 0,
      endHour,
      endMinute: endMinute || 0,
    };

    setSettings({
      ...settings,
      one_off_slots: [...settings.one_off_slots, newSlot],
    });

    setNewSlotDate('');
    setNewSlotStart('09:00');
    setNewSlotEnd('17:00');
    setShowAddSlotModal(false);
  };

  const removeOneOffSlot = (dateStr: string) => {
    setSettings({
      ...settings,
      one_off_slots: settings.one_off_slots.filter(s => s.date !== dateStr),
    });
  };

  // Cancel interview
  const cancelInterview = async (slotId: string) => {
    if (!confirm('Are you sure you want to cancel this interview? The candidate will be notified.')) {
      return;
    }

    try {
      const res = await fetch('/api/schedule/slots', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: slotId,
          action: 'unbook',
        }),
      });

      if (!res.ok) throw new Error('Failed to cancel');

      alert('Interview cancelled. The candidate has been notified.');
      fetchSlots();
      fetchAutoScheduleStatus();
      setShowSlotModal(false);
      setSelectedSlot(null);
    } catch (error) {
      console.error('Failed to cancel interview:', error);
      alert('Failed to cancel interview');
    }
  };

  // Delete slot
  const deleteSlot = async (slotId: string) => {
    if (!confirm('Are you sure you want to delete this slot?')) {
      return;
    }

    try {
      const res = await fetch(`/api/schedule/slots?id=${slotId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete');

      fetchSlots();
      setShowSlotModal(false);
      setSelectedSlot(null);
    } catch (error) {
      console.error('Failed to delete slot:', error);
      alert('Failed to delete slot');
    }
  };

  // Navigate calendar
  const prevMonth = () => {
    const newDate = new Date(calendarMonth);
    newDate.setMonth(newDate.getMonth() - 1);
    setCalendarMonth(newDate);
  };

  const nextMonth = () => {
    const newDate = new Date(calendarMonth);
    newDate.setMonth(newDate.getMonth() + 1);
    setCalendarMonth(newDate);
  };

  const goToToday = () => {
    setCalendarMonth(new Date());
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

        {/* Tab Bar */}
        <div style={styles.tabBar}>
          <button
            style={{ ...styles.tab, ...(activeTab === 'calendar' ? styles.tabActive : {}) }}
            onClick={() => setActiveTab('calendar')}
          >
            Calendar View
          </button>
          <button
            style={{ ...styles.tab, ...(activeTab === 'availability' ? styles.tabActive : {}) }}
            onClick={() => setActiveTab('availability')}
          >
            Availability Settings
          </button>
          <button
            style={{ ...styles.tab, ...(activeTab === 'interviews' ? styles.tabActive : {}) }}
            onClick={() => setActiveTab('interviews')}
          >
            Scheduled Interviews
          </button>
        </div>

        {/* Calendar View Tab */}
        {activeTab === 'calendar' && (
          <div style={styles.calendarContainer}>
            <div style={styles.calendarHeader}>
              <div style={styles.calendarNav}>
                <button style={styles.calendarNavBtn} onClick={prevMonth}>&lt;</button>
                <button style={{ ...styles.calendarNavBtn, width: 'auto', padding: '0 12px' }} onClick={goToToday}>
                  Today
                </button>
                <button style={styles.calendarNavBtn} onClick={nextMonth}>&gt;</button>
              </div>
              <h2 style={styles.calendarTitle}>
                {MONTHS[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}
              </h2>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  style={{ ...styles.button, ...styles.buttonSecondary, padding: '8px 12px', fontSize: '0.8rem' }}
                  onClick={() => setShowBlockDateModal(true)}
                >
                  Block Date
                </button>
                <button
                  style={{ ...styles.button, ...styles.buttonPrimary, padding: '8px 12px', fontSize: '0.8rem' }}
                  onClick={generateSlots}
                  disabled={generating}
                >
                  {generating ? 'Generating...' : 'Generate Slots'}
                </button>
              </div>
            </div>

            {/* Week header */}
            <div style={styles.calendarWeekHeader}>
              {DAYS_SHORT.map(day => (
                <div key={day} style={styles.calendarWeekDay}>{day}</div>
              ))}
            </div>

            {/* Calendar grid */}
            <div style={styles.calendarGrid}>
              {getCalendarDays().map((date, index) => {
                const dateSlots = getSlotsForDate(date);
                const blocked = isDateBlocked(date);
                const today = isToday(date);
                const currentMonth = isCurrentMonth(date);
                const bookedSlots = dateSlots.filter(s => s.is_booked);
                const availableSlots = dateSlots.filter(s => !s.is_booked);

                return (
                  <div
                    key={index}
                    style={{
                      ...styles.calendarDay,
                      ...(!currentMonth ? styles.calendarDayOther : {}),
                      ...(today ? styles.calendarDayToday : {}),
                      ...(blocked ? styles.calendarDayBlocked : {}),
                    }}
                    onClick={() => {
                      if (dateSlots.length > 0) {
                        // Show first slot details
                        setSelectedSlot(dateSlots[0]);
                        setShowSlotModal(true);
                      }
                    }}
                  >
                    <div style={{
                      ...styles.calendarDayNumber,
                      ...(!currentMonth ? styles.calendarDayNumberOther : {}),
                    }}>
                      {date.getDate()}
                    </div>
                    {blocked && (
                      <div style={{ ...styles.calendarEvent, ...styles.calendarEventBlocked }}>
                        Blocked
                      </div>
                    )}
                    {bookedSlots.length > 0 && (
                      <div style={{ ...styles.calendarEvent, ...styles.calendarEventBooked }}>
                        {bookedSlots.length} booked
                      </div>
                    )}
                    {availableSlots.length > 0 && (
                      <div style={{ ...styles.calendarEvent, ...styles.calendarEventAvailable }}>
                        {availableSlots.length} available
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Availability Settings Tab */}
        {activeTab === 'availability' && (
          <div style={styles.grid}>
            {/* Left Column - Weekly Availability */}
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <h2 style={styles.cardTitle}>Weekly Recurring Availability</h2>
                <p style={styles.cardDesc}>Set your regular working hours</p>
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
                  <div style={styles.row}>
                    <div style={styles.inputGroup}>
                      <label style={styles.label}>Max Interviews/Day</label>
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
                    <div style={styles.inputGroup}>
                      <label style={styles.label}>Default Location</label>
                      <select
                        value={settings.default_location_type}
                        onChange={e => setSettings({
                          ...settings,
                          default_location_type: e.target.value as 'video' | 'phone' | 'in-person'
                        })}
                        style={styles.select}
                      >
                        <option value="video">Video Call</option>
                        <option value="phone">Phone Call</option>
                        <option value="in-person">In Person</option>
                      </select>
                    </div>
                  </div>

                  {settings.default_location_type === 'video' && (
                    <div style={styles.inputGroup}>
                      <label style={styles.label}>Default Meeting Link (optional)</label>
                      <input
                        type="url"
                        placeholder="https://meet.google.com/... or https://zoom.us/..."
                        value={settings.default_meeting_link || ''}
                        onChange={e => setSettings({
                          ...settings,
                          default_meeting_link: e.target.value
                        })}
                        style={styles.input}
                      />
                    </div>
                  )}

                  {settings.default_location_type === 'in-person' && (
                    <div style={styles.inputGroup}>
                      <label style={styles.label}>Default Address</label>
                      <input
                        type="text"
                        placeholder="123 Main Street, Cape Town"
                        value={settings.default_address || ''}
                        onChange={e => setSettings({
                          ...settings,
                          default_address: e.target.value
                        })}
                        style={styles.input}
                      />
                    </div>
                  )}
                </div>

                <div style={styles.actionButtons}>
                  <button
                    style={{ ...styles.button, ...styles.buttonSecondary, flex: 1 }}
                    onClick={saveAvailability}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save Settings'}
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

            {/* Right Column - Blocked Dates & One-Off Availability */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Blocked Dates */}
              <div style={styles.card}>
                <div style={styles.cardHeader}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h2 style={styles.cardTitle}>Blocked Dates</h2>
                      <p style={styles.cardDesc}>Days when you are not available</p>
                    </div>
                    <button
                      style={{ ...styles.button, ...styles.buttonSecondary, padding: '8px 12px', fontSize: '0.8rem' }}
                      onClick={() => setShowBlockDateModal(true)}
                    >
                      + Add
                    </button>
                  </div>
                </div>
                <div style={styles.cardContent}>
                  {settings.blocked_dates.length === 0 ? (
                    <div style={styles.emptyState}>
                      <p>No blocked dates</p>
                      <p style={{ fontSize: '0.8rem', marginTop: '8px' }}>
                        Block specific days like holidays or vacations
                      </p>
                    </div>
                  ) : (
                    settings.blocked_dates.map((blocked) => (
                      <div key={blocked.date} style={styles.blockedDateItem}>
                        <div>
                          <div style={styles.blockedDateText}>
                            {new Date(blocked.date + 'T00:00:00').toLocaleDateString('en-ZA', {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </div>
                          {blocked.reason && (
                            <div style={styles.blockedDateReason}>{blocked.reason}</div>
                          )}
                        </div>
                        <button
                          style={styles.removeBtn}
                          onClick={() => removeBlockedDate(blocked.date)}
                        >
                          Remove
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* One-Off Availability */}
              <div style={styles.card}>
                <div style={styles.cardHeader}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h2 style={styles.cardTitle}>One-Off Availability</h2>
                      <p style={styles.cardDesc}>Special availability outside regular hours</p>
                    </div>
                    <button
                      style={{ ...styles.button, ...styles.buttonSecondary, padding: '8px 12px', fontSize: '0.8rem' }}
                      onClick={() => setShowAddSlotModal(true)}
                    >
                      + Add
                    </button>
                  </div>
                </div>
                <div style={styles.cardContent}>
                  {settings.one_off_slots.length === 0 ? (
                    <div style={styles.emptyState}>
                      <p>No one-off availability</p>
                      <p style={{ fontSize: '0.8rem', marginTop: '8px' }}>
                        Add special availability for weekends or holidays
                      </p>
                    </div>
                  ) : (
                    settings.one_off_slots.map((slot) => (
                      <div key={slot.date} style={styles.blockedDateItem}>
                        <div>
                          <div style={styles.blockedDateText}>
                            {new Date(slot.date + 'T00:00:00').toLocaleDateString('en-ZA', {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'long'
                            })}
                          </div>
                          <div style={styles.blockedDateReason}>
                            {slot.startHour.toString().padStart(2, '0')}:{slot.startMinute.toString().padStart(2, '0')} - {slot.endHour.toString().padStart(2, '0')}:{slot.endMinute.toString().padStart(2, '0')}
                          </div>
                        </div>
                        <button
                          style={styles.removeBtn}
                          onClick={() => removeOneOffSlot(slot.date)}
                        >
                          Remove
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Interviews Tab */}
        {activeTab === 'interviews' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0f172a' }}>
                Scheduled Interviews
              </h2>
              <button
                style={{ ...styles.button, ...styles.buttonPrimary, padding: '10px 20px' }}
                onClick={triggerAutoSchedule}
              >
                Auto-Schedule Eligible Candidates
              </button>
            </div>

            {interviews.length === 0 ? (
              <div style={{ ...styles.card, padding: '60px 24px' }}>
                <div style={styles.emptyState}>
                  <p style={{ fontSize: '1rem', marginBottom: '8px' }}>No interviews scheduled</p>
                  <p style={{ fontSize: '0.85rem' }}>
                    Click "Auto-Schedule" to invite eligible candidates to book interviews
                  </p>
                </div>
              </div>
            ) : (
              <div>
                {interviews.map(interview => {
                  const bookedSlot = slots.find(s => s.id === interview.slot_id);
                  return (
                    <div key={interview.id} style={styles.interviewCard}>
                      <div style={styles.interviewCardHeader}>
                        <div>
                          <div style={styles.interviewCardTitle}>
                            {interview.candidate?.name || 'Unknown Candidate'}
                          </div>
                          <div style={styles.interviewCardSubtitle}>
                            {interview.candidate?.email}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span style={styles.scoreBadge}>
                            {interview.candidate?.ai_score || 0}/100
                          </span>
                          <span style={{
                            ...styles.statusBadge,
                            ...(interview.status === 'booked' ? styles.bookedStatus : styles.pendingStatus),
                          }}>
                            {interview.status === 'booked' ? 'Confirmed' : 'Awaiting Booking'}
                          </span>
                        </div>
                      </div>

                      {interview.status === 'booked' && bookedSlot && (
                        <div style={styles.interviewCardDetails}>
                          <div style={styles.interviewCardDetail}>
                            <div style={styles.interviewCardLabel}>Date</div>
                            <div style={styles.interviewCardValue}>
                              {formatFullDate(bookedSlot.start_time)}
                            </div>
                          </div>
                          <div style={styles.interviewCardDetail}>
                            <div style={styles.interviewCardLabel}>Time</div>
                            <div style={styles.interviewCardValue}>
                              {formatSlotTime(bookedSlot.start_time)} - {formatSlotTime(bookedSlot.end_time)}
                            </div>
                          </div>
                          <div style={styles.interviewCardDetail}>
                            <div style={styles.interviewCardLabel}>Format</div>
                            <div style={styles.interviewCardValue}>
                              {bookedSlot.location_type === 'video' ? 'Video Call' :
                               bookedSlot.location_type === 'phone' ? 'Phone Call' : 'In Person'}
                            </div>
                          </div>
                          {bookedSlot.meeting_link && (
                            <div style={styles.interviewCardDetail}>
                              <div style={styles.interviewCardLabel}>Meeting Link</div>
                              <div style={styles.interviewCardValue}>
                                <a href={bookedSlot.meeting_link} target="_blank" rel="noopener noreferrer" style={{ color: '#4F46E5' }}>
                                  Join Call
                                </a>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {interview.status === 'pending_booking' && interview.booking_link && (
                        <div style={{ marginBottom: '12px' }}>
                          <div style={{ ...styles.interviewCardLabel, marginBottom: '4px' }}>Booking Link</div>
                          <div style={{
                            background: '#f8fafc',
                            padding: '8px 12px',
                            borderRadius: '6px',
                            fontSize: '0.8rem',
                            color: '#4F46E5',
                            wordBreak: 'break-all'
                          }}>
                            <a href={interview.booking_link} target="_blank" rel="noopener noreferrer">
                              {interview.booking_link}
                            </a>
                          </div>
                        </div>
                      )}

                      <div style={styles.interviewCardActions}>
                        {interview.status === 'booked' && bookedSlot && (
                          <>
                            <button
                              style={{ ...styles.buttonSmall, ...styles.buttonDanger }}
                              onClick={() => cancelInterview(bookedSlot.id)}
                            >
                              Cancel Interview
                            </button>
                            <button
                              style={{ ...styles.buttonSmall, ...styles.buttonOutline }}
                              onClick={() => {
                                setSelectedSlot(bookedSlot);
                                setShowSlotModal(true);
                              }}
                            >
                              View Details
                            </button>
                          </>
                        )}
                        {interview.status === 'pending_booking' && (
                          <button
                            style={{ ...styles.buttonSmall, ...styles.buttonOutline }}
                            onClick={() => {
                              if (interview.booking_link) {
                                navigator.clipboard.writeText(interview.booking_link);
                                alert('Booking link copied to clipboard!');
                              }
                            }}
                          >
                            Copy Booking Link
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Slot Details Modal */}
      {showSlotModal && selectedSlot && (
        <div style={styles.modal} onClick={() => setShowSlotModal(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>
                {selectedSlot.is_booked ? 'Interview Details' : 'Slot Details'}
              </h3>
              <button style={styles.modalClose} onClick={() => setShowSlotModal(false)}>x</button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Date & Time</label>
                <div style={{ fontSize: '0.95rem', color: '#0f172a', fontWeight: 500 }}>
                  {formatFullDate(selectedSlot.start_time)}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                  {formatSlotTime(selectedSlot.start_time)} - {formatSlotTime(selectedSlot.end_time)} ({selectedSlot.duration} min)
                </div>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Location Type</label>
                <div style={{ fontSize: '0.95rem', color: '#0f172a' }}>
                  {selectedSlot.location_type === 'video' ? 'Video Call' :
                   selectedSlot.location_type === 'phone' ? 'Phone Call' : 'In Person'}
                </div>
              </div>

              {selectedSlot.meeting_link && (
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Meeting Link</label>
                  <a href={selectedSlot.meeting_link} target="_blank" rel="noopener noreferrer" style={{ color: '#4F46E5', fontSize: '0.9rem' }}>
                    {selectedSlot.meeting_link}
                  </a>
                </div>
              )}

              {selectedSlot.address && (
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Address</label>
                  <div style={{ fontSize: '0.9rem', color: '#0f172a' }}>
                    {selectedSlot.address}
                  </div>
                </div>
              )}

              <div style={styles.inputGroup}>
                <label style={styles.label}>Status</label>
                <span style={{
                  ...styles.slotBadge,
                  ...(selectedSlot.is_booked ? styles.slotBooked : styles.slotAvailable),
                }}>
                  {selectedSlot.is_booked ? 'Booked' : 'Available'}
                </span>
              </div>

              {selectedSlot.is_booked && selectedSlot.booked_at && (
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Booked At</label>
                  <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
                    {new Date(selectedSlot.booked_at).toLocaleString('en-ZA')}
                  </div>
                </div>
              )}
            </div>
            <div style={styles.modalFooter}>
              {selectedSlot.is_booked ? (
                <button
                  style={{ ...styles.button, ...styles.buttonDanger, background: '#fee2e2', color: '#dc2626' }}
                  onClick={() => cancelInterview(selectedSlot.id)}
                >
                  Cancel Interview
                </button>
              ) : (
                <button
                  style={{ ...styles.button, ...styles.buttonDanger, background: '#fee2e2', color: '#dc2626' }}
                  onClick={() => deleteSlot(selectedSlot.id)}
                >
                  Delete Slot
                </button>
              )}
              <button
                style={{ ...styles.button, ...styles.buttonSecondary }}
                onClick={() => setShowSlotModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Block Date Modal */}
      {showBlockDateModal && (
        <div style={styles.modal} onClick={() => setShowBlockDateModal(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Block a Date</h3>
              <button style={styles.modalClose} onClick={() => setShowBlockDateModal(false)}>x</button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Date</label>
                <input
                  type="date"
                  value={newBlockedDate}
                  onChange={e => setNewBlockedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Reason (optional)</label>
                <input
                  type="text"
                  placeholder="e.g., Public Holiday, Vacation"
                  value={newBlockedReason}
                  onChange={e => setNewBlockedReason(e.target.value)}
                  style={styles.input}
                />
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button
                style={{ ...styles.button, ...styles.buttonSecondary }}
                onClick={() => setShowBlockDateModal(false)}
              >
                Cancel
              </button>
              <button
                style={{ ...styles.button, ...styles.buttonPrimary }}
                onClick={addBlockedDate}
                disabled={!newBlockedDate}
              >
                Block Date
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add One-Off Slot Modal */}
      {showAddSlotModal && (
        <div style={styles.modal} onClick={() => setShowAddSlotModal(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Add One-Off Availability</h3>
              <button style={styles.modalClose} onClick={() => setShowAddSlotModal(false)}>x</button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Date</label>
                <input
                  type="date"
                  value={newSlotDate}
                  onChange={e => setNewSlotDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  style={styles.input}
                />
              </div>
              <div style={styles.row}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Start Time</label>
                  <input
                    type="time"
                    value={newSlotStart}
                    onChange={e => setNewSlotStart(e.target.value)}
                    style={styles.input}
                  />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>End Time</label>
                  <input
                    type="time"
                    value={newSlotEnd}
                    onChange={e => setNewSlotEnd(e.target.value)}
                    style={styles.input}
                  />
                </div>
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button
                style={{ ...styles.button, ...styles.buttonSecondary }}
                onClick={() => setShowAddSlotModal(false)}
              >
                Cancel
              </button>
              <button
                style={{ ...styles.button, ...styles.buttonPrimary }}
                onClick={addOneOffSlot}
                disabled={!newSlotDate}
              >
                Add Availability
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
