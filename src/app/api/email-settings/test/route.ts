import { NextResponse } from 'next/server';
import { testImapConnection } from '@/lib/email-config';

/**
 * POST /api/email-settings/test
 * Test IMAP connection
 */
export async function POST() {
  try {
    // Use environment variables for connection test
    const config = {
      id: 'primary',
      name: 'Primary Inbox',
      user: process.env.GMAIL_USER!,
      password: process.env.GMAIL_APP_PASSWORD!,
      host: 'imap.gmail.com',
      port: 993,
      tls: true,
      folder: 'Hireinbox',
      isActive: true
    };

    if (!config.user || !config.password) {
      return NextResponse.json({
        success: false,
        message: 'Email credentials not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD in environment variables.'
      });
    }

    const result = await testImapConnection(config);

    return NextResponse.json(result);

  } catch (error) {
    console.error('[EMAIL-TEST] Error:', error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Connection test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
