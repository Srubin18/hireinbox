// lib/email-config.ts
// HireInbox Email Configuration and Multi-Account Support
// Handles IMAP configuration, connection testing, and email filtering

import Imap from 'imap-simple';

// ============================================
// TYPES
// ============================================

export interface ImapConfig {
  id: string;
  name: string;
  user: string;
  password: string;
  host: string;
  port: number;
  tls: boolean;
  folder?: string; // Default: 'INBOX'
  isActive: boolean;
  companyId?: string;
  lastSyncAt?: string;
  lastSyncStatus?: 'success' | 'error' | 'pending';
  lastSyncError?: string;
  emailsProcessed?: number;
}

export interface EmailFilterOptions {
  // Date filters
  sinceDate?: Date;
  beforeDate?: Date;

  // Sender filters
  allowedDomains?: string[]; // Only process emails from these domains
  blockedDomains?: string[]; // Never process emails from these domains

  // Subject filters
  subjectContains?: string[];
  subjectNotContains?: string[];

  // Attachment filters
  requireAttachment?: boolean;

  // Max emails to process per fetch
  maxEmails?: number;
}

export interface EmailProcessingQueueItem {
  id: string;
  messageUid: number;
  emailAccountId: string;
  fromEmail: string;
  subject: string;
  receivedAt: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'skipped';
  retryCount: number;
  maxRetries: number;
  lastError?: string;
  candidateId?: string;
  processedAt?: string;
  createdAt: string;
}

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  folderCount?: number;
  availableFolders?: string[];
  unreadCount?: number;
  error?: string;
}

export interface SyncStats {
  emailAccountId: string;
  syncStartedAt: string;
  syncCompletedAt?: string;
  emailsFound: number;
  emailsProcessed: number;
  emailsSkipped: number;
  emailsFailed: number;
  errors: string[];
}

// ============================================
// DEFAULT CONFIGURATIONS
// ============================================

export const GMAIL_IMAP_CONFIG = {
  host: 'imap.gmail.com',
  port: 993,
  tls: true,
  authTimeout: 10000,
  tlsOptions: { rejectUnauthorized: false }
};

export const OUTLOOK_IMAP_CONFIG = {
  host: 'outlook.office365.com',
  port: 993,
  tls: true,
  authTimeout: 10000,
  tlsOptions: { rejectUnauthorized: false }
};

export const YAHOO_IMAP_CONFIG = {
  host: 'imap.mail.yahoo.com',
  port: 993,
  tls: true,
  authTimeout: 10000,
  tlsOptions: { rejectUnauthorized: false }
};

// Common email providers for auto-detection
export const EMAIL_PROVIDER_CONFIGS: Record<string, { host: string; port: number; tls: boolean }> = {
  'gmail.com': GMAIL_IMAP_CONFIG,
  'googlemail.com': GMAIL_IMAP_CONFIG,
  'outlook.com': OUTLOOK_IMAP_CONFIG,
  'hotmail.com': OUTLOOK_IMAP_CONFIG,
  'live.com': OUTLOOK_IMAP_CONFIG,
  'yahoo.com': YAHOO_IMAP_CONFIG,
  'yahoo.co.za': YAHOO_IMAP_CONFIG,
};

// ============================================
// CONNECTION TESTING
// ============================================

/**
 * Test IMAP connection and return available folders
 */
export async function testImapConnection(config: ImapConfig): Promise<ConnectionTestResult> {
  const traceId = Date.now().toString(36);
  console.log(`[${traceId}][IMAP-TEST] Testing connection for: ${config.user}`);

  try {
    const connection = await Imap.connect({
      imap: {
        user: config.user,
        password: config.password,
        host: config.host,
        port: config.port,
        tls: config.tls,
        authTimeout: 10000,
        tlsOptions: { rejectUnauthorized: false }
      }
    });

    // Get list of available folders
    const boxes = await connection.getBoxes();
    const folderNames = Object.keys(boxes);

    // Try to open the configured folder or INBOX
    const targetFolder = config.folder || 'INBOX';
    let unreadCount = 0;

    try {
      const box = await connection.openBox(targetFolder);
      // Search for unread emails
      const unreadMessages = await connection.search(['UNSEEN'], { bodies: ['HEADER'] });
      unreadCount = unreadMessages.length;
    } catch (folderError) {
      console.log(`[${traceId}][IMAP-TEST] Could not open folder ${targetFolder}, trying INBOX`);
      try {
        await connection.openBox('INBOX');
        const unreadMessages = await connection.search(['UNSEEN'], { bodies: ['HEADER'] });
        unreadCount = unreadMessages.length;
      } catch {
        // Continue without unread count
      }
    }

    connection.end();

    console.log(`[${traceId}][IMAP-TEST] Connection successful. Folders: ${folderNames.length}, Unread: ${unreadCount}`);

    return {
      success: true,
      message: `Connected successfully. Found ${unreadCount} unread emails.`,
      folderCount: folderNames.length,
      availableFolders: folderNames,
      unreadCount
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[${traceId}][IMAP-TEST] Connection failed:`, errorMessage);

    // Provide helpful error messages
    let userMessage = 'Connection failed: ';
    if (errorMessage.includes('AUTHENTICATIONFAILED') || errorMessage.includes('Invalid credentials')) {
      userMessage += 'Invalid username or password. For Gmail, make sure you are using an App Password.';
    } else if (errorMessage.includes('ENOTFOUND') || errorMessage.includes('getaddrinfo')) {
      userMessage += 'Could not reach the email server. Check the host address.';
    } else if (errorMessage.includes('ETIMEDOUT') || errorMessage.includes('timeout')) {
      userMessage += 'Connection timed out. The server may be slow or blocked.';
    } else if (errorMessage.includes('ECONNREFUSED')) {
      userMessage += 'Connection refused. Check the port number.';
    } else {
      userMessage += errorMessage;
    }

    return {
      success: false,
      message: userMessage,
      error: errorMessage
    };
  }
}

/**
 * Auto-detect IMAP configuration from email address
 */
export function detectImapConfig(email: string): Partial<ImapConfig> | null {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return null;

  const config = EMAIL_PROVIDER_CONFIGS[domain];
  if (config) {
    return {
      host: config.host,
      port: config.port,
      tls: config.tls,
      user: email
    };
  }

  // For unknown domains, return generic IMAP settings
  return {
    host: `imap.${domain}`,
    port: 993,
    tls: true,
    user: email
  };
}

// ============================================
// EMAIL FILTERING
// ============================================

/**
 * Build IMAP search criteria from filter options
 */
export function buildSearchCriteria(filters: EmailFilterOptions): (string | string[])[] {
  const criteria: (string | string[])[] = ['UNSEEN'];

  if (filters.sinceDate) {
    // IMAP date format: DD-MMM-YYYY
    const dateStr = filters.sinceDate.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).replace(/,/g, '');
    criteria.push(['SINCE', dateStr]);
  }

  if (filters.beforeDate) {
    const dateStr = filters.beforeDate.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).replace(/,/g, '');
    criteria.push(['BEFORE', dateStr]);
  }

  return criteria;
}

/**
 * Check if email matches filter criteria (post-fetch filtering)
 */
export function emailMatchesFilters(
  fromEmail: string,
  subject: string,
  hasAttachment: boolean,
  filters: EmailFilterOptions
): { matches: boolean; reason: string } {
  const fromDomain = fromEmail.split('@')[1]?.toLowerCase() || '';
  const lowerSubject = subject.toLowerCase();

  // Check allowed domains
  if (filters.allowedDomains && filters.allowedDomains.length > 0) {
    const isAllowed = filters.allowedDomains.some(d => fromDomain.endsWith(d.toLowerCase()));
    if (!isAllowed) {
      return { matches: false, reason: `Domain ${fromDomain} not in allowed list` };
    }
  }

  // Check blocked domains
  if (filters.blockedDomains && filters.blockedDomains.length > 0) {
    const isBlocked = filters.blockedDomains.some(d => fromDomain.endsWith(d.toLowerCase()));
    if (isBlocked) {
      return { matches: false, reason: `Domain ${fromDomain} is blocked` };
    }
  }

  // Check subject contains
  if (filters.subjectContains && filters.subjectContains.length > 0) {
    const hasRequired = filters.subjectContains.some(s => lowerSubject.includes(s.toLowerCase()));
    if (!hasRequired) {
      return { matches: false, reason: 'Subject does not contain required keywords' };
    }
  }

  // Check subject not contains
  if (filters.subjectNotContains && filters.subjectNotContains.length > 0) {
    const hasForbidden = filters.subjectNotContains.some(s => lowerSubject.includes(s.toLowerCase()));
    if (hasForbidden) {
      return { matches: false, reason: 'Subject contains blocked keywords' };
    }
  }

  // Check attachment requirement
  if (filters.requireAttachment && !hasAttachment) {
    return { matches: false, reason: 'No attachment found' };
  }

  return { matches: true, reason: '' };
}

// ============================================
// PROCESSING QUEUE HELPERS
// ============================================

/**
 * Create a new processing queue item
 */
export function createQueueItem(
  messageUid: number,
  emailAccountId: string,
  fromEmail: string,
  subject: string,
  receivedAt: Date
): EmailProcessingQueueItem {
  return {
    id: `${emailAccountId}-${messageUid}-${Date.now()}`,
    messageUid,
    emailAccountId,
    fromEmail,
    subject,
    receivedAt: receivedAt.toISOString(),
    status: 'pending',
    retryCount: 0,
    maxRetries: 3,
    createdAt: new Date().toISOString()
  };
}

/**
 * Check if a queue item should be retried
 */
export function shouldRetry(item: EmailProcessingQueueItem): boolean {
  return item.status === 'failed' && item.retryCount < item.maxRetries;
}

/**
 * Calculate retry delay with exponential backoff
 */
export function getRetryDelay(retryCount: number): number {
  // 1 min, 5 min, 15 min
  const delays = [60000, 300000, 900000];
  return delays[Math.min(retryCount, delays.length - 1)];
}

// ============================================
// IMAP ERROR HANDLING
// ============================================

export interface ImapError {
  code: string;
  message: string;
  isRetryable: boolean;
  suggestedAction: string;
}

/**
 * Parse IMAP errors and provide actionable information
 */
export function parseImapError(error: Error | unknown): ImapError {
  const errorMessage = error instanceof Error ? error.message : String(error);

  // Authentication errors
  if (errorMessage.includes('AUTHENTICATIONFAILED') ||
      errorMessage.includes('Invalid credentials') ||
      errorMessage.includes('authentication failed')) {
    return {
      code: 'AUTH_FAILED',
      message: 'Authentication failed',
      isRetryable: false,
      suggestedAction: 'Check username and password. For Gmail, use an App Password.'
    };
  }

  // Connection errors
  if (errorMessage.includes('ENOTFOUND') || errorMessage.includes('getaddrinfo')) {
    return {
      code: 'HOST_NOT_FOUND',
      message: 'Email server not found',
      isRetryable: false,
      suggestedAction: 'Verify the IMAP host address is correct.'
    };
  }

  if (errorMessage.includes('ETIMEDOUT') || errorMessage.includes('timeout')) {
    return {
      code: 'TIMEOUT',
      message: 'Connection timed out',
      isRetryable: true,
      suggestedAction: 'The server is slow. Will retry automatically.'
    };
  }

  if (errorMessage.includes('ECONNREFUSED')) {
    return {
      code: 'CONNECTION_REFUSED',
      message: 'Connection refused',
      isRetryable: false,
      suggestedAction: 'Check the port number. IMAP typically uses port 993.'
    };
  }

  if (errorMessage.includes('ECONNRESET') || errorMessage.includes('socket hang up')) {
    return {
      code: 'CONNECTION_RESET',
      message: 'Connection was reset',
      isRetryable: true,
      suggestedAction: 'Network issue. Will retry automatically.'
    };
  }

  // Folder errors
  if (errorMessage.includes('Mailbox does not exist') ||
      errorMessage.includes('Unknown Mailbox')) {
    return {
      code: 'FOLDER_NOT_FOUND',
      message: 'Email folder not found',
      isRetryable: false,
      suggestedAction: 'The specified folder does not exist. Check folder name.'
    };
  }

  // Rate limiting
  if (errorMessage.includes('Too many') || errorMessage.includes('rate limit')) {
    return {
      code: 'RATE_LIMITED',
      message: 'Rate limited by email server',
      isRetryable: true,
      suggestedAction: 'Too many requests. Will wait and retry.'
    };
  }

  // SSL/TLS errors
  if (errorMessage.includes('SSL') || errorMessage.includes('TLS') ||
      errorMessage.includes('certificate')) {
    return {
      code: 'SSL_ERROR',
      message: 'SSL/TLS connection error',
      isRetryable: false,
      suggestedAction: 'Certificate issue. Try enabling TLS or check server settings.'
    };
  }

  // Generic error
  return {
    code: 'UNKNOWN',
    message: errorMessage,
    isRetryable: true,
    suggestedAction: 'An unexpected error occurred. Will retry.'
  };
}

// ============================================
// ATTACHMENT HELPERS
// ============================================

export interface AttachmentInfo {
  filename: string;
  contentType: string;
  size: number;
  isPDF: boolean;
  isWord: boolean;
  isCV: boolean;
  priority: number; // Lower is higher priority
}

/**
 * Analyze attachment and determine if it's likely a CV
 */
export function analyzeAttachment(attachment: {
  filename?: string;
  contentType?: string;
  content?: Buffer;
}): AttachmentInfo {
  const filename = attachment.filename?.toLowerCase() || '';
  const contentType = attachment.contentType?.toLowerCase() || '';
  const size = attachment.content?.length || 0;

  const isPDF = contentType.includes('pdf') || filename.endsWith('.pdf');
  const isWord = contentType.includes('word') ||
                 contentType.includes('document') ||
                 filename.endsWith('.doc') ||
                 filename.endsWith('.docx');

  // Check if filename suggests it's a CV
  const cvKeywords = ['cv', 'resume', 'curriculum', 'vitae', 'application'];
  const hasCV_Keyword = cvKeywords.some(kw => filename.includes(kw));

  // Determine if this is likely a CV
  const isCV = (isPDF || isWord) && (hasCV_Keyword || size > 10000);

  // Priority: PDF > Word, CV keywords boost priority
  let priority = 10;
  if (isPDF) priority -= 5;
  if (isWord && !isPDF) priority -= 3;
  if (hasCV_Keyword) priority -= 2;
  if (size > 50000 && size < 5000000) priority -= 1; // Reasonable file size

  return {
    filename: attachment.filename || 'unknown',
    contentType: contentType,
    size,
    isPDF,
    isWord,
    isCV,
    priority
  };
}

/**
 * Sort attachments by priority (best CV candidate first)
 */
export function sortAttachmentsByPriority(attachments: AttachmentInfo[]): AttachmentInfo[] {
  return [...attachments].sort((a, b) => a.priority - b.priority);
}

/**
 * Find the best CV attachment from a list
 */
export function findBestCVAttachment(attachments: Array<{
  filename?: string;
  contentType?: string;
  content?: Buffer;
}>): { index: number; info: AttachmentInfo } | null {
  const analyzed = attachments.map((att, index) => ({
    index,
    info: analyzeAttachment(att)
  }));

  // Filter to only CV-like attachments
  const cvAttachments = analyzed.filter(a => a.info.isCV || a.info.isPDF || a.info.isWord);

  if (cvAttachments.length === 0) return null;

  // Sort by priority and return best
  cvAttachments.sort((a, b) => a.info.priority - b.info.priority);
  return cvAttachments[0];
}

// ============================================
// SYNC STATISTICS
// ============================================

/**
 * Create initial sync stats
 */
export function createSyncStats(emailAccountId: string): SyncStats {
  return {
    emailAccountId,
    syncStartedAt: new Date().toISOString(),
    emailsFound: 0,
    emailsProcessed: 0,
    emailsSkipped: 0,
    emailsFailed: 0,
    errors: []
  };
}

/**
 * Format sync stats for display
 */
export function formatSyncStats(stats: SyncStats): string {
  const duration = stats.syncCompletedAt
    ? Math.round((new Date(stats.syncCompletedAt).getTime() - new Date(stats.syncStartedAt).getTime()) / 1000)
    : 0;

  return `Found: ${stats.emailsFound}, Processed: ${stats.emailsProcessed}, Skipped: ${stats.emailsSkipped}, Failed: ${stats.emailsFailed}, Duration: ${duration}s`;
}
