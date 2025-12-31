import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// In-memory queue (in production, use database)
let processingQueue: Array<{
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
}> = [];

/**
 * GET /api/email-settings/queue
 * Returns processing queue items
 */
export async function GET() {
  try {
    // Try to get queue from database first
    let queue = processingQueue;

    try {
      const { data: dbQueue } = await supabase
        .from('email_processing_queue')
        .select('*')
        .in('status', ['pending', 'processing', 'failed'])
        .order('created_at', { ascending: false })
        .limit(50);

      if (dbQueue && dbQueue.length > 0) {
        queue = dbQueue.map(q => ({
          id: q.id,
          messageUid: q.message_uid,
          emailAccountId: q.email_account_id || 'primary',
          fromEmail: q.from_email,
          subject: q.subject,
          receivedAt: q.received_at,
          status: q.status,
          retryCount: q.retry_count || 0,
          maxRetries: q.max_retries || 3,
          lastError: q.last_error,
          candidateId: q.candidate_id,
          processedAt: q.processed_at,
          createdAt: q.created_at
        }));
      }
    } catch {
      // Use in-memory queue
    }

    // Filter to only show pending and failed items
    const filteredQueue = queue.filter(q =>
      q.status === 'pending' || q.status === 'processing' || q.status === 'failed'
    );

    return NextResponse.json({
      queue: filteredQueue.map(q => ({
        id: q.id,
        fromEmail: q.fromEmail,
        subject: q.subject,
        status: q.status,
        retryCount: q.retryCount,
        error: q.lastError,
        createdAt: q.createdAt
      }))
    });

  } catch (error) {
    console.error('[EMAIL-QUEUE] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to load queue', queue: [] },
      { status: 500 }
    );
  }
}

/**
 * POST /api/email-settings/queue
 * Add item to processing queue
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const queueItem = {
      id: body.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      messageUid: body.messageUid,
      emailAccountId: body.emailAccountId || 'primary',
      fromEmail: body.fromEmail,
      subject: body.subject,
      receivedAt: body.receivedAt || new Date().toISOString(),
      status: 'pending' as const,
      retryCount: 0,
      maxRetries: 3,
      createdAt: new Date().toISOString()
    };

    // Try to save to database
    try {
      await supabase.from('email_processing_queue').insert({
        id: queueItem.id,
        message_uid: queueItem.messageUid,
        email_account_id: queueItem.emailAccountId,
        from_email: queueItem.fromEmail,
        subject: queueItem.subject,
        received_at: queueItem.receivedAt,
        status: queueItem.status,
        retry_count: queueItem.retryCount,
        max_retries: queueItem.maxRetries,
        created_at: queueItem.createdAt
      });
    } catch {
      // Save to in-memory queue
      processingQueue.push(queueItem);
    }

    return NextResponse.json({ success: true, item: queueItem });

  } catch (error) {
    console.error('[EMAIL-QUEUE] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to add to queue' },
      { status: 500 }
    );
  }
}

// Export queue management functions
export function addToQueue(item: typeof processingQueue[0]) {
  processingQueue.push(item);
}

export function updateQueueItem(id: string, updates: Partial<typeof processingQueue[0]>) {
  const index = processingQueue.findIndex(q => q.id === id);
  if (index !== -1) {
    processingQueue[index] = { ...processingQueue[index], ...updates };
  }
}

export function getQueueItems() {
  return processingQueue;
}

export function clearCompletedItems() {
  processingQueue = processingQueue.filter(q => q.status !== 'completed');
}
