'use client';

import { useState, useEffect } from 'react';

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
  auto_book_first_slot: boolean;
}

interface KnockoutRule {
  id: string;
  field: string;
  operator: 'equals' | 'contains' | 'gte' | 'lte' | 'exists';
  value: string | number | boolean;
  label: string;
  is_knockout: boolean;
}

interface RoleAutoActionsProps {
  roleId: string;
  roleTitle: string;
  currentConfig?: AutoScheduleConfig;
  knockoutRules?: KnockoutRule[];
  onSave: (config: AutoScheduleConfig, knockouts: KnockoutRule[]) => Promise<void>;
  onClose: () => void;
}

// ============================================
// STYLES
// ============================================

const styles = {
  overlay: {
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
  modal: {
    background: 'white',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '640px',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  },
  header: {
    padding: '24px 24px 0',
    borderBottom: '1px solid #e2e8f0',
  },
  title: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: '#0f172a',
    marginBottom: '4px',
  },
  subtitle: {
    fontSize: '0.875rem',
    color: '#64748b',
    marginBottom: '16px',
  },
  tabs: {
    display: 'flex',
    gap: '4px',
  },
  tab: {
    padding: '12px 16px',
    fontSize: '0.875rem',
    fontWeight: 500,
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    borderBottom: '2px solid transparent',
    color: '#64748b',
    transition: 'all 0.2s',
  },
  tabActive: {
    color: '#4F46E5',
    borderBottomColor: '#4F46E5',
  },
  content: {
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
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  toggle: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px',
    background: '#f8fafc',
    borderRadius: '12px',
    marginBottom: '16px',
  },
  toggleLabel: {
    fontSize: '0.9rem',
    fontWeight: 500,
    color: '#0f172a',
  },
  toggleDesc: {
    fontSize: '0.8rem',
    color: '#64748b',
    marginTop: '2px',
  },
  switch: {
    width: '48px',
    height: '28px',
    borderRadius: '14px',
    cursor: 'pointer',
    transition: 'background 0.2s',
    position: 'relative' as const,
    border: 'none',
    padding: 0,
  },
  switchKnob: {
    width: '22px',
    height: '22px',
    borderRadius: '11px',
    background: 'white',
    position: 'absolute' as const,
    top: '3px',
    transition: 'left 0.2s',
    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
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
    transition: 'border-color 0.2s',
  },
  select: {
    width: '100%',
    padding: '10px 12px',
    fontSize: '0.9rem',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    outline: 'none',
    background: 'white',
    cursor: 'pointer',
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  },
  knockoutCard: {
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    padding: '12px 16px',
    marginBottom: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  knockoutLabel: {
    fontSize: '0.875rem',
    color: '#0f172a',
    fontWeight: 500,
  },
  knockoutBadge: {
    fontSize: '0.7rem',
    fontWeight: 600,
    padding: '4px 8px',
    borderRadius: '6px',
    background: '#fef2f2',
    color: '#991b1b',
  },
  addButton: {
    width: '100%',
    padding: '12px',
    border: '2px dashed #e2e8f0',
    borderRadius: '10px',
    background: 'transparent',
    color: '#64748b',
    fontSize: '0.875rem',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  footer: {
    padding: '16px 24px',
    borderTop: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
  },
  button: {
    padding: '10px 20px',
    borderRadius: '8px',
    fontSize: '0.875rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
    border: 'none',
  },
  buttonSecondary: {
    background: '#f1f5f9',
    color: '#475569',
  },
  buttonPrimary: {
    background: '#4F46E5',
    color: 'white',
  },
  infoBox: {
    background: '#eff6ff',
    border: '1px solid #bfdbfe',
    borderRadius: '10px',
    padding: '16px',
    marginBottom: '16px',
  },
  infoText: {
    fontSize: '0.8rem',
    color: '#1e40af',
    lineHeight: 1.5,
  },
  removeBtn: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    fontSize: '1.2rem',
    padding: '4px',
  },
};

// ============================================
// COMPONENT
// ============================================

export default function RoleAutoActions({
  roleId,
  roleTitle,
  currentConfig,
  knockoutRules: initialKnockouts,
  onSave,
  onClose,
}: RoleAutoActionsProps) {
  const [activeTab, setActiveTab] = useState<'auto-actions' | 'knockouts'>('auto-actions');
  const [saving, setSaving] = useState(false);

  // Auto-schedule config state
  const [config, setConfig] = useState<AutoScheduleConfig>({
    enabled: currentConfig?.enabled ?? false,
    min_score_to_schedule: currentConfig?.min_score_to_schedule ?? 80,
    max_candidates_per_batch: currentConfig?.max_candidates_per_batch ?? 10,
    interview_duration: currentConfig?.interview_duration ?? 30,
    interview_type: currentConfig?.interview_type ?? 'video',
    interview_address: currentConfig?.interview_address,
    auto_create_meet: currentConfig?.auto_create_meet ?? true,
    look_ahead_days: currentConfig?.look_ahead_days ?? 14,
    send_invite_email: currentConfig?.send_invite_email ?? true,
    auto_book_first_slot: currentConfig?.auto_book_first_slot ?? false,
  });

  // Knockout rules state
  const [knockouts, setKnockouts] = useState<KnockoutRule[]>(
    initialKnockouts || []
  );

  const [newKnockout, setNewKnockout] = useState<Partial<KnockoutRule>>({
    field: 'years_experience',
    operator: 'gte',
    value: '',
    label: '',
    is_knockout: true,
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(config, knockouts);
      onClose();
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setSaving(false);
    }
  };

  const addKnockout = () => {
    if (!newKnockout.label || newKnockout.value === '') return;

    setKnockouts([
      ...knockouts,
      {
        id: Date.now().toString(),
        field: newKnockout.field || 'years_experience',
        operator: newKnockout.operator || 'gte',
        value: newKnockout.value!,
        label: newKnockout.label,
        is_knockout: true,
      },
    ]);

    setNewKnockout({
      field: 'years_experience',
      operator: 'gte',
      value: '',
      label: '',
      is_knockout: true,
    });
  };

  const removeKnockout = (id: string) => {
    setKnockouts(knockouts.filter(k => k.id !== id));
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <h2 style={styles.title}>Auto-Actions for {roleTitle}</h2>
          <p style={styles.subtitle}>
            Set rules that run automatically when candidates are screened
          </p>
          <div style={styles.tabs}>
            <button
              style={{
                ...styles.tab,
                ...(activeTab === 'auto-actions' ? styles.tabActive : {}),
              }}
              onClick={() => setActiveTab('auto-actions')}
            >
              Auto-Schedule
            </button>
            <button
              style={{
                ...styles.tab,
                ...(activeTab === 'knockouts' ? styles.tabActive : {}),
              }}
              onClick={() => setActiveTab('knockouts')}
            >
              Knockout Rules
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={styles.content}>
          {activeTab === 'auto-actions' ? (
            <>
              {/* Master Toggle */}
              <div style={styles.toggle}>
                <div>
                  <div style={styles.toggleLabel}>Enable Auto-Scheduling</div>
                  <div style={styles.toggleDesc}>
                    Automatically schedule interviews for top candidates
                  </div>
                </div>
                <button
                  style={{
                    ...styles.switch,
                    background: config.enabled ? '#4F46E5' : '#e2e8f0',
                  }}
                  onClick={() => setConfig({ ...config, enabled: !config.enabled })}
                >
                  <div
                    style={{
                      ...styles.switchKnob,
                      left: config.enabled ? '23px' : '3px',
                    }}
                  />
                </button>
              </div>

              {config.enabled && (
                <>
                  {/* Info Box */}
                  <div style={styles.infoBox}>
                    <p style={styles.infoText}>
                      When a candidate scores {config.min_score_to_schedule}+ after screening,
                      they will automatically receive an interview invitation email with available time slots.
                    </p>
                  </div>

                  {/* Score Threshold */}
                  <div style={styles.section}>
                    <div style={styles.sectionTitle}>
                      Scheduling Criteria
                    </div>
                    <div style={styles.row}>
                      <div style={styles.inputGroup}>
                        <label style={styles.label}>Minimum Score to Schedule</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={config.min_score_to_schedule}
                          onChange={e => setConfig({
                            ...config,
                            min_score_to_schedule: parseInt(e.target.value) || 80
                          })}
                          style={styles.input}
                        />
                      </div>
                      <div style={styles.inputGroup}>
                        <label style={styles.label}>Max Candidates Per Batch</label>
                        <input
                          type="number"
                          min="1"
                          max="50"
                          value={config.max_candidates_per_batch}
                          onChange={e => setConfig({
                            ...config,
                            max_candidates_per_batch: parseInt(e.target.value) || 10
                          })}
                          style={styles.input}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Interview Settings */}
                  <div style={styles.section}>
                    <div style={styles.sectionTitle}>
                      Interview Settings
                    </div>
                    <div style={styles.row}>
                      <div style={styles.inputGroup}>
                        <label style={styles.label}>Interview Type</label>
                        <select
                          value={config.interview_type}
                          onChange={e => setConfig({
                            ...config,
                            interview_type: e.target.value as 'video' | 'phone' | 'in-person'
                          })}
                          style={styles.select}
                        >
                          <option value="video">Video Call</option>
                          <option value="phone">Phone Call</option>
                          <option value="in-person">In-Person</option>
                        </select>
                      </div>
                      <div style={styles.inputGroup}>
                        <label style={styles.label}>Duration (minutes)</label>
                        <select
                          value={config.interview_duration}
                          onChange={e => setConfig({
                            ...config,
                            interview_duration: parseInt(e.target.value)
                          })}
                          style={styles.select}
                        >
                          <option value={15}>15 minutes</option>
                          <option value={30}>30 minutes</option>
                          <option value={45}>45 minutes</option>
                          <option value={60}>60 minutes</option>
                          <option value={90}>90 minutes</option>
                        </select>
                      </div>
                    </div>

                    {config.interview_type === 'in-person' && (
                      <div style={styles.inputGroup}>
                        <label style={styles.label}>Interview Address</label>
                        <input
                          type="text"
                          value={config.interview_address || ''}
                          onChange={e => setConfig({
                            ...config,
                            interview_address: e.target.value
                          })}
                          placeholder="123 Main Street, Cape Town"
                          style={styles.input}
                        />
                      </div>
                    )}
                  </div>

                  {/* Additional Options */}
                  <div style={styles.section}>
                    <div style={styles.sectionTitle}>
                      Additional Options
                    </div>

                    <div style={{ ...styles.toggle, marginBottom: '12px' }}>
                      <div>
                        <div style={styles.toggleLabel}>Auto-create Google Meet link</div>
                        <div style={styles.toggleDesc}>
                          Generate a video meeting link for each interview
                        </div>
                      </div>
                      <button
                        style={{
                          ...styles.switch,
                          background: config.auto_create_meet ? '#4F46E5' : '#e2e8f0',
                        }}
                        onClick={() => setConfig({ ...config, auto_create_meet: !config.auto_create_meet })}
                      >
                        <div
                          style={{
                            ...styles.switchKnob,
                            left: config.auto_create_meet ? '23px' : '3px',
                          }}
                        />
                      </button>
                    </div>

                    <div style={{ ...styles.toggle, marginBottom: '12px' }}>
                      <div>
                        <div style={styles.toggleLabel}>Send invitation emails</div>
                        <div style={styles.toggleDesc}>
                          Email candidates with booking links
                        </div>
                      </div>
                      <button
                        style={{
                          ...styles.switch,
                          background: config.send_invite_email ? '#4F46E5' : '#e2e8f0',
                        }}
                        onClick={() => setConfig({ ...config, send_invite_email: !config.send_invite_email })}
                      >
                        <div
                          style={{
                            ...styles.switchKnob,
                            left: config.send_invite_email ? '23px' : '3px',
                          }}
                        />
                      </button>
                    </div>

                    <div style={styles.toggle}>
                      <div>
                        <div style={styles.toggleLabel}>Auto-book first available slot</div>
                        <div style={styles.toggleDesc}>
                          Book automatically instead of sending booking link
                        </div>
                      </div>
                      <button
                        style={{
                          ...styles.switch,
                          background: config.auto_book_first_slot ? '#4F46E5' : '#e2e8f0',
                        }}
                        onClick={() => setConfig({ ...config, auto_book_first_slot: !config.auto_book_first_slot })}
                      >
                        <div
                          style={{
                            ...styles.switchKnob,
                            left: config.auto_book_first_slot ? '23px' : '3px',
                          }}
                        />
                      </button>
                    </div>
                  </div>

                  <div style={styles.row}>
                    <div style={styles.inputGroup}>
                      <label style={styles.label}>Look-ahead Days</label>
                      <input
                        type="number"
                        min="7"
                        max="60"
                        value={config.look_ahead_days}
                        onChange={e => setConfig({
                          ...config,
                          look_ahead_days: parseInt(e.target.value) || 14
                        })}
                        style={styles.input}
                      />
                    </div>
                  </div>
                </>
              )}
            </>
          ) : (
            <>
              {/* Knockout Rules Tab */}
              <div style={styles.infoBox}>
                <p style={styles.infoText}>
                  Knockout rules are hard requirements. Candidates who fail ANY knockout rule
                  will be automatically rejected, regardless of their overall score.
                </p>
              </div>

              <div style={styles.section}>
                <div style={styles.sectionTitle}>
                  Active Knockout Rules
                </div>

                {knockouts.length === 0 ? (
                  <p style={{ color: '#94a3b8', fontSize: '0.875rem', textAlign: 'center', padding: '20px' }}>
                    No knockout rules configured
                  </p>
                ) : (
                  knockouts.map(knockout => (
                    <div key={knockout.id} style={styles.knockoutCard}>
                      <div>
                        <span style={styles.knockoutLabel}>{knockout.label}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={styles.knockoutBadge}>KNOCKOUT</span>
                        <button
                          style={styles.removeBtn}
                          onClick={() => removeKnockout(knockout.id)}
                        >
                          x
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div style={styles.section}>
                <div style={styles.sectionTitle}>
                  Add New Knockout Rule
                </div>

                <div style={styles.row}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Field</label>
                    <select
                      value={newKnockout.field}
                      onChange={e => setNewKnockout({ ...newKnockout, field: e.target.value })}
                      style={styles.select}
                    >
                      <option value="years_experience">Years of Experience</option>
                      <option value="education_level">Education Level</option>
                      <option value="required_skill">Required Skill</option>
                      <option value="location">Location</option>
                      <option value="work_authorization">Work Authorization</option>
                      <option value="qualification">Qualification</option>
                    </select>
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Condition</label>
                    <select
                      value={newKnockout.operator}
                      onChange={e => setNewKnockout({
                        ...newKnockout,
                        operator: e.target.value as KnockoutRule['operator']
                      })}
                      style={styles.select}
                    >
                      <option value="gte">At least (&gt;=)</option>
                      <option value="lte">At most (&lt;=)</option>
                      <option value="equals">Equals</option>
                      <option value="contains">Contains</option>
                      <option value="exists">Must exist</option>
                    </select>
                  </div>
                </div>

                <div style={styles.row}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Value</label>
                    <input
                      type="text"
                      value={newKnockout.value?.toString() || ''}
                      onChange={e => setNewKnockout({ ...newKnockout, value: e.target.value })}
                      placeholder="e.g., 3, CA(SA), Cape Town"
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Display Label</label>
                    <input
                      type="text"
                      value={newKnockout.label || ''}
                      onChange={e => setNewKnockout({ ...newKnockout, label: e.target.value })}
                      placeholder="e.g., Must have 3+ years experience"
                      style={styles.input}
                    />
                  </div>
                </div>

                <button
                  style={{
                    ...styles.addButton,
                    ...(newKnockout.label && newKnockout.value !== ''
                      ? { borderColor: '#4F46E5', color: '#4F46E5' }
                      : {}),
                  }}
                  onClick={addKnockout}
                  disabled={!newKnockout.label || newKnockout.value === ''}
                >
                  + Add Knockout Rule
                </button>
              </div>

              {/* Common Knockout Templates */}
              <div style={styles.section}>
                <div style={styles.sectionTitle}>
                  Quick Add Common Knockouts
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {[
                    { label: '3+ years experience', field: 'years_experience', operator: 'gte', value: 3 },
                    { label: '5+ years experience', field: 'years_experience', operator: 'gte', value: 5 },
                    { label: 'Degree required', field: 'education_level', operator: 'exists', value: true },
                    { label: 'CA(SA) qualification', field: 'qualification', operator: 'contains', value: 'CA(SA)' },
                    { label: 'Based in SA', field: 'location', operator: 'contains', value: 'South Africa' },
                  ].map((template, idx) => (
                    <button
                      key={idx}
                      style={{
                        padding: '8px 12px',
                        background: '#f1f5f9',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        color: '#475569',
                        cursor: 'pointer',
                      }}
                      onClick={() => {
                        setKnockouts([
                          ...knockouts,
                          {
                            id: Date.now().toString(),
                            field: template.field,
                            operator: template.operator as KnockoutRule['operator'],
                            value: template.value,
                            label: template.label,
                            is_knockout: true,
                          },
                        ]);
                      }}
                    >
                      + {template.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <button
            style={{ ...styles.button, ...styles.buttonSecondary }}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            style={{ ...styles.button, ...styles.buttonPrimary }}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
