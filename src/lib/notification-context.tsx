'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

// ============================================
// Notification Context - In-app notification system
// Toast notifications + Notification center
// ============================================

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  timestamp: Date;
  read: boolean;
  autoDismiss?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface ToastNotification extends Notification {
  visible: boolean;
}

interface NotificationContextType {
  // Toast notifications (ephemeral, shown in corner)
  toasts: ToastNotification[];

  // Persistent notifications (shown in notification center)
  notifications: Notification[];
  unreadCount: number;

  // Actions
  notify: (options: {
    type: NotificationType;
    title: string;
    message?: string;
    autoDismiss?: boolean;
    persistent?: boolean; // Also save to notification center
    action?: { label: string; onClick: () => void };
  }) => string;

  dismissToast: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotification: (id: string) => void;
  clearAllNotifications: () => void;

  // Shorthand methods
  success: (title: string, message?: string, persistent?: boolean) => string;
  error: (title: string, message?: string, persistent?: boolean) => string;
  warning: (title: string, message?: string, persistent?: boolean) => string;
  info: (title: string, message?: string, persistent?: boolean) => string;
}

const STORAGE_KEY = 'hireinbox_notifications';
const AUTO_DISMISS_DURATION = 5000; // 5 seconds
const MAX_NOTIFICATIONS = 50; // Keep last 50 notifications

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

function generateId(): string {
  return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Load notifications from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert timestamp strings back to Date objects
        const restored = parsed.map((n: Notification) => ({
          ...n,
          timestamp: new Date(n.timestamp)
        }));
        setNotifications(restored);
      }
    } catch (error) {
      console.error('[Notifications] Failed to load notifications:', error);
    }
  }, []);

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    } catch (error) {
      console.error('[Notifications] Failed to save notifications:', error);
    }
  }, [notifications]);

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.read).length;

  // Main notify function
  const notify = useCallback(({
    type,
    title,
    message,
    autoDismiss = true,
    persistent = false,
    action
  }: {
    type: NotificationType;
    title: string;
    message?: string;
    autoDismiss?: boolean;
    persistent?: boolean;
    action?: { label: string; onClick: () => void };
  }): string => {
    const id = generateId();
    const timestamp = new Date();

    // Create toast notification
    const toast: ToastNotification = {
      id,
      type,
      title,
      message,
      timestamp,
      read: false,
      autoDismiss,
      action,
      visible: true
    };

    setToasts(prev => [...prev, toast]);

    // Auto-dismiss toast after duration
    if (autoDismiss) {
      setTimeout(() => {
        setToasts(prev =>
          prev.map(t => t.id === id ? { ...t, visible: false } : t)
        );
        // Remove from DOM after animation
        setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== id));
        }, 300);
      }, AUTO_DISMISS_DURATION);
    }

    // Also add to persistent notifications if requested
    if (persistent) {
      const notification: Notification = {
        id,
        type,
        title,
        message,
        timestamp,
        read: false,
        action
      };

      setNotifications(prev => {
        const updated = [notification, ...prev];
        // Keep only last MAX_NOTIFICATIONS
        return updated.slice(0, MAX_NOTIFICATIONS);
      });
    }

    console.log(`[Notification] ${type.toUpperCase()}: ${title}`);
    return id;
  }, []);

  // Dismiss a toast
  const dismissToast = useCallback((id: string) => {
    setToasts(prev =>
      prev.map(t => t.id === id ? { ...t, visible: false } : t)
    );
    // Remove from DOM after animation
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 300);
  }, []);

  // Mark notification as read
  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    );
  }, []);

  // Clear a notification
  const clearNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Clear all notifications
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Shorthand methods
  const success = useCallback((title: string, message?: string, persistent = false) => {
    return notify({ type: 'success', title, message, persistent });
  }, [notify]);

  const error = useCallback((title: string, message?: string, persistent = true) => {
    return notify({ type: 'error', title, message, persistent, autoDismiss: false });
  }, [notify]);

  const warning = useCallback((title: string, message?: string, persistent = false) => {
    return notify({ type: 'warning', title, message, persistent });
  }, [notify]);

  const info = useCallback((title: string, message?: string, persistent = false) => {
    return notify({ type: 'info', title, message, persistent });
  }, [notify]);

  const value: NotificationContextType = {
    toasts,
    notifications,
    unreadCount,
    notify,
    dismissToast,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllNotifications,
    success,
    error,
    warning,
    info
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

// Custom hook to use notifications
export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

// ============================================
// Notification Icons
// ============================================

export function NotificationIcon({ type, size = 20 }: { type: NotificationType; size?: number }) {
  const iconProps = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const
  };

  switch (type) {
    case 'success':
      return (
        <svg {...iconProps} stroke="#10B981">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      );
    case 'error':
      return (
        <svg {...iconProps} stroke="#EF4444">
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      );
    case 'warning':
      return (
        <svg {...iconProps} stroke="#F59E0B">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      );
    case 'info':
    default:
      return (
        <svg {...iconProps} stroke="#3B82F6">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      );
  }
}

// ============================================
// Toast Container Component
// ============================================

export function NotificationToastContainer() {
  const { toasts, dismissToast } = useNotifications();

  const getTypeStyles = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return {
          bg: '#ECFDF5',
          border: '#A7F3D0',
          iconBg: '#D1FAE5'
        };
      case 'error':
        return {
          bg: '#FEF2F2',
          border: '#FECACA',
          iconBg: '#FEE2E2'
        };
      case 'warning':
        return {
          bg: '#FFFBEB',
          border: '#FDE68A',
          iconBg: '#FEF3C7'
        };
      case 'info':
      default:
        return {
          bg: '#EFF6FF',
          border: '#BFDBFE',
          iconBg: '#DBEAFE'
        };
    }
  };

  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      maxWidth: '400px',
      width: '100%',
      pointerEvents: 'none'
    }}>
      <style>{`
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes slideOutRight {
          from {
            opacity: 1;
            transform: translateX(0);
          }
          to {
            opacity: 0;
            transform: translateX(100%);
          }
        }
      `}</style>

      {toasts.map(toast => {
        const styles = getTypeStyles(toast.type);

        return (
          <div
            key={toast.id}
            style={{
              backgroundColor: styles.bg,
              border: `1px solid ${styles.border}`,
              borderRadius: '12px',
              padding: '14px 16px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              animation: toast.visible
                ? 'slideInRight 0.3s ease-out forwards'
                : 'slideOutRight 0.3s ease-in forwards',
              pointerEvents: 'auto'
            }}
          >
            {/* Icon */}
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: styles.iconBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <NotificationIcon type={toast.type} size={18} />
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontWeight: 600,
                fontSize: '0.9375rem',
                color: '#0F172A',
                marginBottom: toast.message ? '4px' : 0
              }}>
                {toast.title}
              </div>
              {toast.message && (
                <div style={{
                  fontSize: '0.875rem',
                  color: '#64748B',
                  lineHeight: 1.5
                }}>
                  {toast.message}
                </div>
              )}
              {toast.action && (
                <button
                  onClick={toast.action.onClick}
                  style={{
                    marginTop: '8px',
                    padding: '6px 12px',
                    backgroundColor: '#4F46E5',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#4338CA'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#4F46E5'}
                >
                  {toast.action.label}
                </button>
              )}
            </div>

            {/* Dismiss button */}
            <button
              onClick={() => dismissToast(toast.id)}
              style={{
                background: 'none',
                border: 'none',
                padding: '4px',
                cursor: 'pointer',
                opacity: 0.5,
                transition: 'opacity 0.2s',
                flexShrink: 0
              }}
              onMouseOver={(e) => e.currentTarget.style.opacity = '1'}
              onMouseOut={(e) => e.currentTarget.style.opacity = '0.5'}
              aria-label="Dismiss notification"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ============================================
// Notification Center Component (Bell + Dropdown)
// ============================================

export function NotificationCenter() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllNotifications
  } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' });
  };

  const getTypeColor = (type: NotificationType) => {
    switch (type) {
      case 'success': return '#10B981';
      case 'error': return '#EF4444';
      case 'warning': return '#F59E0B';
      case 'info': return '#3B82F6';
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'relative',
          background: 'none',
          border: 'none',
          padding: '8px',
          cursor: 'pointer',
          borderRadius: '8px',
          transition: 'background-color 0.2s'
        }}
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F1F5F9'}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        aria-label={`Notifications (${unreadCount} unread)`}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>

        {/* Unread badge */}
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '4px',
            right: '4px',
            width: '18px',
            height: '18px',
            backgroundColor: '#EF4444',
            color: 'white',
            borderRadius: '50%',
            fontSize: '0.6875rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid white'
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 998
            }}
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown panel */}
          <div style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '8px',
            width: '380px',
            maxHeight: '480px',
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            border: '1px solid #E2E8F0',
            zIndex: 999,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <h3 style={{
                  margin: 0,
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: '#0F172A'
                }}>
                  Notifications
                </h3>
                {unreadCount > 0 && (
                  <p style={{
                    margin: '2px 0 0 0',
                    fontSize: '0.8125rem',
                    color: '#64748B'
                  }}>
                    {unreadCount} unread
                  </p>
                )}
              </div>

              {notifications.length > 0 && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#4F46E5',
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#EEF2FF'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      Mark all read
                    </button>
                  )}
                  <button
                    onClick={clearAllNotifications}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#64748B',
                      fontSize: '0.8125rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F1F5F9'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    Clear all
                  </button>
                </div>
              )}
            </div>

            {/* Notification list */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              maxHeight: '380px'
            }}>
              {notifications.length === 0 ? (
                <div style={{
                  padding: '40px 20px',
                  textAlign: 'center'
                }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 16px' }}>
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                  <p style={{
                    margin: 0,
                    fontSize: '0.9375rem',
                    color: '#94A3B8'
                  }}>
                    No notifications yet
                  </p>
                  <p style={{
                    margin: '4px 0 0 0',
                    fontSize: '0.8125rem',
                    color: '#CBD5E1'
                  }}>
                    We'll notify you when something happens
                  </p>
                </div>
              ) : (
                notifications.map(notification => (
                  <div
                    key={notification.id}
                    onClick={() => markAsRead(notification.id)}
                    style={{
                      padding: '14px 20px',
                      borderBottom: '1px solid #F1F5F9',
                      display: 'flex',
                      gap: '12px',
                      cursor: 'pointer',
                      backgroundColor: notification.read ? 'white' : '#F8FAFC',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F1F5F9'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = notification.read ? 'white' : '#F8FAFC'}
                  >
                    {/* Type indicator */}
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: notification.read ? '#CBD5E1' : getTypeColor(notification.type),
                      marginTop: '6px',
                      flexShrink: 0
                    }} />

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        gap: '8px'
                      }}>
                        <span style={{
                          fontWeight: notification.read ? 500 : 600,
                          fontSize: '0.875rem',
                          color: '#0F172A'
                        }}>
                          {notification.title}
                        </span>
                        <span style={{
                          fontSize: '0.75rem',
                          color: '#94A3B8',
                          whiteSpace: 'nowrap',
                          flexShrink: 0
                        }}>
                          {formatTime(notification.timestamp)}
                        </span>
                      </div>
                      {notification.message && (
                        <p style={{
                          margin: '4px 0 0 0',
                          fontSize: '0.8125rem',
                          color: '#64748B',
                          lineHeight: 1.5
                        }}>
                          {notification.message}
                        </p>
                      )}
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        clearNotification(notification.id);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: '4px',
                        cursor: 'pointer',
                        opacity: 0.3,
                        transition: 'opacity 0.2s',
                        flexShrink: 0
                      }}
                      onMouseOver={(e) => e.currentTarget.style.opacity = '1'}
                      onMouseOut={(e) => e.currentTarget.style.opacity = '0.3'}
                      aria-label="Delete notification"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ============================================
// Pre-built Notification Triggers
// ============================================

export function useNotificationTriggers() {
  const { notify } = useNotifications();

  return {
    // Candidate notifications
    candidateScreened: (candidateName: string, recommendation: string) => {
      const isShortlisted = recommendation === 'SHORTLIST';
      notify({
        type: isShortlisted ? 'success' : 'info',
        title: isShortlisted ? 'Candidate Shortlisted' : 'CV Screened',
        message: `${candidateName} has been ${recommendation.toLowerCase()}ed`,
        persistent: true
      });
    },

    candidateStatusChanged: (candidateName: string, newStatus: string) => {
      notify({
        type: 'info',
        title: 'Status Updated',
        message: `${candidateName} moved to ${newStatus}`,
        persistent: true
      });
    },

    bulkScreeningComplete: (count: number, shortlisted: number) => {
      notify({
        type: 'success',
        title: 'Screening Complete',
        message: `${count} CVs screened, ${shortlisted} shortlisted`,
        persistent: true
      });
    },

    // Payment notifications
    paymentReceived: (amount: string, plan: string) => {
      notify({
        type: 'success',
        title: 'Payment Successful',
        message: `${amount} received for ${plan}`,
        persistent: true
      });
    },

    paymentFailed: (reason: string) => {
      notify({
        type: 'error',
        title: 'Payment Failed',
        message: reason,
        persistent: true,
        autoDismiss: false
      });
    },

    subscriptionExpiring: (daysLeft: number) => {
      notify({
        type: 'warning',
        title: 'Subscription Expiring',
        message: `Your subscription expires in ${daysLeft} days`,
        persistent: true,
        action: {
          label: 'Renew Now',
          onClick: () => window.location.href = '/pricing'
        }
      });
    },

    // System notifications
    systemAlert: (title: string, message: string) => {
      notify({
        type: 'warning',
        title,
        message,
        persistent: true,
        autoDismiss: false
      });
    },

    welcomeMessage: (userName: string) => {
      notify({
        type: 'success',
        title: `Welcome, ${userName}!`,
        message: 'Your account is ready. Start screening CVs now.',
        persistent: true
      });
    },

    usageWarning: (remaining: number, tier: string) => {
      notify({
        type: 'warning',
        title: 'Usage Limit Alert',
        message: `Only ${remaining} ${tier} assessments remaining`,
        persistent: true,
        action: {
          label: 'Upgrade',
          onClick: () => window.location.href = '/pricing'
        }
      });
    },

    featureUnlocked: (featureName: string) => {
      notify({
        type: 'success',
        title: 'Feature Unlocked',
        message: `You now have access to ${featureName}`,
        persistent: true
      });
    },

    // Error notifications
    uploadError: (fileName: string) => {
      notify({
        type: 'error',
        title: 'Upload Failed',
        message: `Failed to upload ${fileName}. Please try again.`,
        persistent: true,
        autoDismiss: false
      });
    },

    networkError: () => {
      notify({
        type: 'error',
        title: 'Connection Error',
        message: 'Please check your internet connection',
        persistent: false,
        autoDismiss: true
      });
    }
  };
}
