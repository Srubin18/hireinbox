import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

/* ===========================================
   PAYFAST ITN (INSTANT TRANSACTION NOTIFICATION)
   Webhook to receive payment confirmations
   =========================================== */

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// PayFast sandbox credentials
const PAYFAST_MERCHANT_ID = process.env.PAYFAST_MERCHANT_ID || '10000100';
const PAYFAST_PASSPHRASE = process.env.PAYFAST_PASSPHRASE || ''; // Empty for sandbox
const PAYFAST_SANDBOX = process.env.PAYFAST_SANDBOX !== 'false';

// PayFast validation URL
const PAYFAST_VALIDATE_URL = PAYFAST_SANDBOX
  ? 'https://sandbox.payfast.co.za/eng/query/validate'
  : 'https://www.payfast.co.za/eng/query/validate';

// Valid PayFast IPs (for production)
const PAYFAST_IPS = [
  '197.97.145.144',
  '197.97.145.145',
  '197.97.145.146',
  '197.97.145.147',
  '41.74.179.194',
  '41.74.179.195',
  '41.74.179.196',
  '41.74.179.197',
];

// Generate signature for validation
function generateSignature(data: Record<string, string>, passPhrase: string = ''): string {
  let pfOutput = '';
  for (const key in data) {
    if (data.hasOwnProperty(key) && key !== 'signature' && data[key] !== '') {
      pfOutput += `${key}=${encodeURIComponent(data[key].trim()).replace(/%20/g, '+')}&`;
    }
  }

  let getString = pfOutput.slice(0, -1);

  if (passPhrase !== '') {
    getString += `&passphrase=${encodeURIComponent(passPhrase.trim()).replace(/%20/g, '+')}`;
  }

  return crypto.createHash('md5').update(getString).digest('hex');
}

// Validate PayFast server confirmation
async function validateWithPayFast(pfParamString: string): Promise<boolean> {
  try {
    const response = await fetch(PAYFAST_VALIDATE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: pfParamString,
    });

    const result = await response.text();
    return result === 'VALID';
  } catch (error) {
    console.error('[PayFast ITN] Validation request failed:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get the raw body as text for validation
    const rawBody = await request.text();
    const params = new URLSearchParams(rawBody);
    const pfData: Record<string, string> = {};

    params.forEach((value, key) => {
      pfData[key] = value;
    });

    console.log('[PayFast ITN] Received notification:', {
      payment_id: pfData.m_payment_id,
      status: pfData.payment_status,
      amount: pfData.amount_gross,
      plan: pfData.custom_str1,
    });

    // 1. Verify the source IP (skip in sandbox)
    if (!PAYFAST_SANDBOX) {
      const forwardedFor = request.headers.get('x-forwarded-for');
      const clientIP = forwardedFor ? forwardedFor.split(',')[0].trim() : 'unknown';

      if (!PAYFAST_IPS.includes(clientIP)) {
        console.error('[PayFast ITN] Invalid source IP:', clientIP);
        return NextResponse.json({ error: 'Invalid source' }, { status: 403 });
      }
    }

    // 2. Verify the signature
    const signature = pfData.signature;
    const calculatedSignature = generateSignature(pfData, PAYFAST_PASSPHRASE);

    if (signature !== calculatedSignature) {
      console.error('[PayFast ITN] Signature mismatch');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // 3. Verify the merchant ID
    if (pfData.merchant_id !== PAYFAST_MERCHANT_ID) {
      console.error('[PayFast ITN] Invalid merchant ID:', pfData.merchant_id);
      return NextResponse.json({ error: 'Invalid merchant' }, { status: 400 });
    }

    // 4. Validate with PayFast servers (optional but recommended)
    // Skip in sandbox for faster testing
    if (!PAYFAST_SANDBOX) {
      const isValid = await validateWithPayFast(rawBody);
      if (!isValid) {
        console.error('[PayFast ITN] PayFast validation failed');
        return NextResponse.json({ error: 'Validation failed' }, { status: 400 });
      }
    }

    // 5. Process the payment based on status
    const paymentStatus = pfData.payment_status;
    const planId = pfData.custom_str1;
    const userId = pfData.custom_str2;
    const assessments = parseInt(pfData.custom_int1 || '0', 10);

    console.log('[PayFast ITN] Processing payment:', {
      status: paymentStatus,
      planId,
      userId,
      assessments,
    });

    switch (paymentStatus) {
      case 'COMPLETE':
        // Payment successful
        console.log('[PayFast ITN] Payment COMPLETE for:', planId);

        try {
          // Calculate expiry based on plan
          const calculateExpiry = (plan: string): string => {
            const now = new Date();
            if (plan.includes('annual')) {
              now.setFullYear(now.getFullYear() + 1);
            } else {
              now.setMonth(now.getMonth() + 1);
            }
            return now.toISOString();
          };

          // Get limits based on plan
          const getPlanLimits = (plan: string): { cv_limit: number; video_limit: number; role_limit: number } => {
            const limits: Record<string, { cv_limit: number; video_limit: number; role_limit: number }> = {
              'b2c-single': { cv_limit: 1, video_limit: 1, role_limit: 0 },
              'b2c-pack': { cv_limit: 3, video_limit: 3, role_limit: 0 },
              'b2c-full': { cv_limit: 5, video_limit: 5, role_limit: 0 },
              'b2b-starter': { cv_limit: 20, video_limit: 0, role_limit: 1 },
              'b2b-growth': { cv_limit: 50, video_limit: 0, role_limit: 3 },
              'b2b-business': { cv_limit: 100, video_limit: 0, role_limit: -1 }, // -1 = unlimited
            };
            return limits[plan] || { cv_limit: 0, video_limit: 0, role_limit: 0 };
          };

          if (assessments > 0) {
            // B2C One-time purchase - add credits
            const { error: creditError } = await supabase
              .from('user_credits')
              .upsert({
                user_id: userId,
                credits: assessments,
                plan: planId,
                payment_id: pfData.m_payment_id,
                created_at: new Date().toISOString()
              }, { onConflict: 'user_id' });

            if (creditError) {
              console.error('[PayFast ITN] Failed to add credits:', creditError);
            } else {
              console.log('[PayFast ITN] Added', assessments, 'credits for user:', userId);
            }
          } else if (planId.startsWith('b2b-')) {
            // B2B Subscription - activate plan
            const limits = getPlanLimits(planId);
            const { error: subError } = await supabase
              .from('subscriptions')
              .upsert({
                user_id: userId,
                plan: planId,
                status: 'active',
                payment_id: pfData.m_payment_id,
                cv_limit: limits.cv_limit,
                role_limit: limits.role_limit,
                started_at: new Date().toISOString(),
                expires_at: calculateExpiry(planId),
                updated_at: new Date().toISOString()
              }, { onConflict: 'user_id' });

            if (subError) {
              console.error('[PayFast ITN] Failed to create subscription:', subError);
            } else {
              console.log('[PayFast ITN] Activated subscription:', planId, 'for user:', userId);
            }
          }

          // Log the payment for audit
          await supabase.from('payment_logs').insert({
            user_id: userId,
            payment_id: pfData.m_payment_id,
            plan: planId,
            amount: parseFloat(pfData.amount_gross || '0'),
            status: 'complete',
            payfast_data: pfData,
            created_at: new Date().toISOString()
          });

        } catch (dbError) {
          console.error('[PayFast ITN] Database error:', dbError);
        }

        break;

      case 'FAILED':
        console.log('[PayFast ITN] Payment FAILED for:', pfData.m_payment_id);
        // Handle failed payment - maybe send notification
        break;

      case 'PENDING':
        console.log('[PayFast ITN] Payment PENDING for:', pfData.m_payment_id);
        // Payment is pending - wait for final status
        break;

      case 'CANCELLED':
        console.log('[PayFast ITN] Payment CANCELLED for:', pfData.m_payment_id);
        // User cancelled the payment
        break;

      default:
        console.log('[PayFast ITN] Unknown status:', paymentStatus);
    }

    // PayFast expects an empty 200 response
    return new NextResponse('OK', { status: 200 });

  } catch (error) {
    console.error('[PayFast ITN] Error processing notification:', error);
    // Still return 200 to prevent PayFast from retrying
    return new NextResponse('OK', { status: 200 });
  }
}

// Handle GET for testing
export async function GET() {
  return NextResponse.json({
    message: 'PayFast ITN webhook endpoint',
    status: 'active',
    sandbox: PAYFAST_SANDBOX,
  });
}
