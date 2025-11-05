import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/payments/webhook/test
 * 
 * Test endpoint for verifying GHL webhook payloads
 * Use this to test webhook handling without actually processing payments
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Log the payload for debugging
    console.log('🧪 Test Webhook Payload:', JSON.stringify(body, null, 2));

    const eventType = body.event || body.type || 'unknown';
    const invoice = body.invoice || body.data?.invoice;
    const payment = body.payment || body.data?.payment;
    const subscription = body.subscription || body.data?.subscription;

    // Validate payload structure
    const validation = {
      eventType,
      hasInvoice: !!invoice,
      hasPayment: !!payment,
      hasSubscription: !!subscription,
      invoiceId: invoice?.id,
      paymentId: payment?.id,
      subscriptionId: subscription?.id,
      contactId: invoice?.contactId || payment?.contactId || subscription?.contactId,
      amount: invoice?.amount || payment?.amount || subscription?.amount,
      currency: invoice?.currency || payment?.currency || subscription?.currency,
      status: invoice?.status || payment?.status || subscription?.status,
    };

    // Return validation results
    return NextResponse.json({
      success: true,
      message: 'Webhook payload received and validated',
      validation,
      payload: body,
      recommendations: {
        invoicePaid: eventType.includes('InvoicePaid') || eventType.includes('invoice.paid')
          ? '✅ This will trigger wallet top-up or subscription activation'
          : null,
        invoiceFailed: eventType.includes('InvoiceFailed') || eventType.includes('invoice.failed')
          ? '✅ This will set user tier to free and send reactivation link'
          : null,
        subscription: eventType.includes('Subscription') || eventType.includes('subscription')
          ? '✅ This will handle subscription cancellation'
          : null,
      },
    }, { status: 200 });
  } catch (error) {
    console.error('❌ Test webhook error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 400 });
  }
}

/**
 * GET /api/payments/webhook/test
 * 
 * Returns sample payloads for testing
 */
export async function GET() {
  const samples = {
    invoicePaid: {
      event: 'InvoicePaid',
      invoice: {
        id: 'inv_test_123',
        contactId: 'contact_123',
        amount: 1000, // $10.00 in cents
        currency: 'USD',
        status: 'paid',
        planName: 'litplus',
        interval: 'monthly',
      },
      data: {
        invoice: {
          id: 'inv_test_123',
          contactId: 'contact_123',
          amount: 1000,
          currency: 'USD',
          status: 'paid',
        },
      },
    },
    invoicePaidWalletTopup: {
      event: 'InvoicePaid',
      invoice: {
        id: 'inv_topup_123',
        contactId: 'contact_123',
        amount: 500, // $5.00 = 500 stars
        currency: 'USD',
        status: 'paid',
      },
      data: {
        invoice: {
          id: 'inv_topup_123',
          contactId: 'contact_123',
          amount: 500,
          currency: 'USD',
          status: 'paid',
        },
      },
    },
    invoicePaidSubscription: {
      event: 'InvoicePaid',
      invoice: {
        id: 'inv_sub_123',
        contactId: 'contact_123',
        amount: 2999, // $29.99
        currency: 'USD',
        status: 'paid',
        planName: 'litplus',
        interval: 'monthly',
      },
      data: {
        invoice: {
          id: 'inv_sub_123',
          contactId: 'contact_123',
          amount: 2999,
          currency: 'USD',
          status: 'paid',
          planName: 'litplus',
        },
      },
    },
    invoiceFailed: {
      event: 'InvoiceFailed',
      invoice: {
        id: 'inv_failed_123',
        contactId: 'contact_123',
        amount: 2999,
        currency: 'USD',
        status: 'failed',
        failureReason: 'Insufficient funds',
      },
      data: {
        invoice: {
          id: 'inv_failed_123',
          contactId: 'contact_123',
          amount: 2999,
          currency: 'USD',
          status: 'failed',
        },
      },
    },
    subscriptionCancelled: {
      event: 'SubscriptionCancelled',
      subscription: {
        id: 'sub_123',
        contactId: 'contact_123',
        planName: 'litplus',
        amount: 2999,
        currency: 'USD',
        status: 'cancelled',
        interval: 'monthly',
      },
      data: {
        subscription: {
          id: 'sub_123',
          contactId: 'contact_123',
          planName: 'litplus',
          amount: 2999,
          currency: 'USD',
          status: 'cancelled',
        },
      },
    },
  };

  return NextResponse.json({
    message: 'Sample webhook payloads for testing',
    samples,
    usage: {
      test: 'POST /api/payments/webhook/test with one of the sample payloads',
      production: 'POST /api/payments/webhook with actual GHL webhook payload',
    },
  }, { status: 200 });
}

