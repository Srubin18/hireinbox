// Production-safe logging utility
// Only logs in development unless explicitly marked as important

const IS_DEV = process.env.NODE_ENV !== 'production';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogOptions {
  always?: boolean; // Log even in production
  traceId?: string;
}

function formatMessage(prefix: string, message: string, traceId?: string): string {
  if (traceId) {
    return `[${traceId}][${prefix}] ${message}`;
  }
  return `[${prefix}] ${message}`;
}

export const logger = {
  // Debug logs - only in development
  debug: (prefix: string, message: string, data?: unknown, options?: LogOptions) => {
    if (IS_DEV || options?.always) {
      const formattedMsg = formatMessage(prefix, message, options?.traceId);
      if (data !== undefined) {
        console.log(formattedMsg, data);
      } else {
        console.log(formattedMsg);
      }
    }
  },

  // Info logs - only in development by default
  info: (prefix: string, message: string, data?: unknown, options?: LogOptions) => {
    if (IS_DEV || options?.always) {
      const formattedMsg = formatMessage(prefix, message, options?.traceId);
      if (data !== undefined) {
        console.log(formattedMsg, data);
      } else {
        console.log(formattedMsg);
      }
    }
  },

  // Warn logs - always log
  warn: (prefix: string, message: string, data?: unknown, options?: LogOptions) => {
    const formattedMsg = formatMessage(prefix, message, options?.traceId);
    if (data !== undefined) {
      console.warn(formattedMsg, data);
    } else {
      console.warn(formattedMsg);
    }
  },

  // Error logs - always log
  error: (prefix: string, message: string, error?: unknown, options?: LogOptions) => {
    const formattedMsg = formatMessage(prefix, message, options?.traceId);
    console.error(formattedMsg, error || '');
  },

  // Audit logs - always log (for payments, security, etc.)
  audit: (prefix: string, message: string, data?: unknown) => {
    const formattedMsg = formatMessage(prefix, message);
    if (data !== undefined) {
      console.log(formattedMsg, typeof data === 'object' ? JSON.stringify(data) : data);
    } else {
      console.log(formattedMsg);
    }
  },
};

// Shorthand for common prefixes
export const log = {
  email: (message: string, data?: unknown, options?: LogOptions) =>
    logger.info('EMAIL', message, data, options),

  pdf: (message: string, data?: unknown, options?: LogOptions) =>
    logger.debug('PDF', message, data, options),

  ai: (message: string, data?: unknown, options?: LogOptions) =>
    logger.debug('AI', message, data, options),

  auth: (message: string, data?: unknown) =>
    logger.audit('AUTH', message, data),

  payment: (message: string, data?: unknown) =>
    logger.audit('PAYMENT', message, data),

  security: (message: string, data?: unknown) =>
    logger.audit('SECURITY', message, data),

  whatsapp: (message: string, data?: unknown, options?: LogOptions) =>
    logger.info('WHATSAPP', message, data, options),

  video: (message: string, data?: unknown, options?: LogOptions) =>
    logger.debug('VIDEO', message, data, options),

  interview: (message: string, data?: unknown, options?: LogOptions) =>
    logger.debug('INTERVIEW', message, data, options),
};
