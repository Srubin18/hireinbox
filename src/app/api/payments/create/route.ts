import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

/* ===========================================
   PAYFAST PAYMENT CREATE ROUTE
   Creates a PayFast payment redirect URL
   =========================================== */

// PayFast sandbox credentials
const PAYFAST_MERCHANT_ID = process.env.PAYFAST_MERCHANT_ID || '10000100';
const PAYFAST_MERCHANT_KEY = process.env.PAYFAST_MERCHANT_KEY || '46f0cd694581a';
const PAYFAST_PASSPHRASE = process.env.PAYFAST_PASSPHRASE || ''; // Empty for sandbox
const PAYFAST_SANDBOX = process.env.PAYFAST_SANDBOX !== 'false'; // Default to sandbox

// PayFast URLs
const PAYFAST_URL = PAYFAST_SANDBOX
  ? 'https://sandbox.payfast.co.za/eng/process'
  : 'https://www.payfast.co.za/eng/process';

// Plan configurations
const PLANS: Record<string, {
  name: string;
  amount: number;
  type: 'once' | 'subscription';
  frequency?: number; // 3 = monthly, 4 = quarterly, 5 = biannually, 6 = annually
  cycles?: number; // 0 = indefinite
  assessments?: number;
}> = {
  'b2c-single': {
    name: 'CV Analysis',
    amount: 29.00,
    type: 'once',
    assessments: 1
  },
  'b2b-starter': {
    name: 'HireInbox Starter',
    amount: 299.00,
    type: 'subscription',
    frequency: 3, // Monthly
    cycles: 0
  },
  'b2b-starter-annual': {
    name: 'HireInbox Starter (Annual)',
    amount: 2868.00, // R239/month x 12
    type: 'subscription',
    frequency: 6, // Annually
    cycles: 0
  },
  'b2b-pro': {
    name: 'HireInbox Pro',
    amount: 999.00,
    type: 'subscription',
    frequency: 3, // Monthly
    cycles: 0
  },
  'b2b-pro-annual': {
    name: 'HireInbox Pro (Annual)',
    amount: 9588.00, // R799/month x 12
    type: 'subscription',
    frequency: 6, // Annually
    cycles: 0
  }
};

// Generate PayFast signature
function generateSignature(data: Record<string, string>, passPhrase: string = ''): string {
  // Create parameter string
  let pfOutput = '';
  for (const key in data) {
    if (data.hasOwnProperty(key) && data[key] !== '') {
      pfOutput += `${key}=${encodeURIComponent(data[key].trim()).replace(/%20/g, '+')}&`;
    }
  }

  // Remove last ampersand
  let getString = pfOutput.slice(0, -1);

  // Add passphrase if provided
  if (passPhrase !== '') {
    getString += `&passphrase=${encodeURIComponent(passPhrase.trim()).replace(/%20/g, '+')}`;
  }

  // Create MD5 hash
  return crypto.createHash('md5').update(getString).digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { planId, billingCycle, userEmail, userId } = body;

    // Determine plan with billing cycle
    let actualPlanId = planId;
    if (billingCycle === 'annual' && planId.startsWith('b2b-')) {
      actualPlanId = `${planId}-annual`;
    }

    const plan = PLANS[actualPlanId];
    if (!plan) {
      return NextResponse.json(
        { error: 'Invalid plan ID' },
        { status: 400 }
      );
    }

    // Generate unique payment ID
    const paymentId = `HI-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Get the host for return URLs
    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;

    // Build PayFast data
    const pfData: Record<string, string> = {
      // Merchant details
      merchant_id: PAYFAST_MERCHANT_ID,
      merchant_key: PAYFAST_MERCHANT_KEY,

      // Return URLs
      return_url: `${baseUrl}/pricing?payment=success&plan=${planId}`,
      cancel_url: `${baseUrl}/pricing?payment=cancelled`,
      notify_url: `${baseUrl}/api/payments/notify`,

      // Buyer details (optional, can be pre-filled)
      email_address: userEmail || '',

      // Transaction details
      m_payment_id: paymentId,
      amount: plan.amount.toFixed(2),
      item_name: plan.name,
      item_description: `${plan.name} - HireInbox`,

      // Custom fields to identify the transaction
      custom_str1: planId,
      custom_str2: userId || '',
      custom_int1: String(plan.assessments || 0),
    };

    // Add subscription details if applicable
    if (plan.type === 'subscription') {
      pfData.subscription_type = '1'; // Subscription
      pfData.billing_date = new Date().toISOString().split('T')[0]; // Start today
      pfData.recurring_amount = plan.amount.toFixed(2);
      pfData.frequency = String(plan.frequency);
      pfData.cycles = String(plan.cycles);
    }

    // Generate signature
    const signature = generateSignature(pfData, PAYFAST_PASSPHRASE);
    pfData.signature = signature;

    // Build the redirect URL
    const params = new URLSearchParams(pfData);
    const redirectUrl = `${PAYFAST_URL}?${params.toString()}`;

    console.log('[PayFast] Payment initiated:', {
      paymentId,
      plan: planId,
      amount: plan.amount,
      sandbox: PAYFAST_SANDBOX
    });

    return NextResponse.json({
      success: true,
      redirectUrl,
      paymentId,
      sandbox: PAYFAST_SANDBOX
    });

  } catch (error) {
    console.error('[PayFast] Error creating payment:', error);
    return NextResponse.json(
      { error: 'Failed to create payment' },
      { status: 500 }
    );
  }
}

// Handle GET requests with info
export async function GET() {
  return NextResponse.json({
    message: 'PayFast payment endpoint',
    plans: Object.keys(PLANS).map(id => ({
      id,
      name: PLANS[id].name,
      amount: `R${PLANS[id].amount.toFixed(2)}`,
      type: PLANS[id].type
    })),
    sandbox: PAYFAST_SANDBOX
  });
}
