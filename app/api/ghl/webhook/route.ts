import { NextRequest, NextResponse } from 'next/server';
import { getFirestoreInstance } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

/**
 * GHL Contact Interface
 */
interface GHLContact {
  id: string;
  email?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  phoneNumber?: string;
  photo?: string;
  photoURL?: string;
  timezone?: string;
  customFields?: Record<string, unknown>;
  locationId?: string;
  tags?: string[];
  source?: string;
  address?: {
    address1?: string;
    address2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

/**
 * GHL Webhook Payload Interface
 */
interface GHLWebhookPayload {
  event?: string;
  type?: string;
  contact?: GHLContact;
  data?: {
    contact?: GHLContact;
  };
  payload?: {
    contact?: GHLContact;
  };
}

/**
 * GHL Public Key for signature verification
 * Set in .env.local as GHL_PUBLIC_KEY
 */
const GHL_PUBLIC_KEY = process.env.GHL_PUBLIC_KEY || '';
const GHL_WEBHOOK_SECRET = process.env.GHL_WEBHOOK_SECRET || '';

/**
 * Verify webhook signature
 * GoHighLevel uses HMAC-SHA256 with the webhook secret
 */
function verifyWebhookSignature(
  payload: string,
  signature: string | null
): boolean {
  // Use GHL_PUBLIC_KEY if available, fallback to GHL_WEBHOOK_SECRET
  const secret = GHL_PUBLIC_KEY || GHL_WEBHOOK_SECRET;

  if (!secret) {
    // In development, allow webhooks without verification
    // In production, always verify
    return process.env.NODE_ENV !== 'production';
  }

  if (!signature) {
    return false;
  }

  // TODO: Implement actual HMAC-SHA256 verification
  // For now, we'll allow in development mode
  // In production, implement proper signature verification
  if (process.env.NODE_ENV === 'production') {
    // Placeholder for actual verification
    // const crypto = require('crypto');
    // const hmac = crypto.createHmac('sha256', secret);
    // hmac.update(payload);
    // const expectedSignature = hmac.digest('hex');
    // return signature === expectedSignature;
    return true; // Placeholder - implement actual verification
  }

  return true;
}

/**
 * Save contact to Firestore "contacts" collection
 */
async function saveContactToFirestore(contact: GHLContact): Promise<void> {
  const firestore = getFirestoreInstance();
  
  if (!contact || (!contact.id && !contact.email)) {
    throw new Error('Contact missing required id or email');
  }

  // Use contact.id as primary document ID, fallback to email
  const docId = contact.id || contact.email || '';
  
  if (!docId) {
    throw new Error('Cannot determine document ID: contact must have id or email');
  }

  const contactsRef = doc(firestore, 'contacts', docId);

  // Prepare contact data for Firestore
  const contactData = {
    id: contact.id,
    email: contact.email || null,
    name: contact.name || contact.firstName + ' ' + contact.lastName || null,
    firstName: contact.firstName || null,
    lastName: contact.lastName || null,
    phone: contact.phone || contact.phoneNumber || null,
    photo: contact.photo || contact.photoURL || null,
    timezone: contact.timezone || null,
    locationId: contact.locationId || null,
    tags: contact.tags || [],
    source: contact.source || null,
    address: contact.address || null,
    customFields: contact.customFields || {},
    createdAt: contact.createdAt ? new Date(contact.createdAt) : serverTimestamp(),
    updatedAt: serverTimestamp(),
    // Store original GHL contact data
    ghlData: contact,
  };

  // Save to Firestore (setDoc with merge: true will update if exists)
  await setDoc(contactsRef, contactData, { merge: true });

  const contactEmail = contact.email || 'no-email';
  console.log(`🔥 Saved contact: ${contactEmail} (ID: ${docId})`);
}

/**
 * POST /api/ghl/webhook
 * 
 * Handles incoming webhooks from GoHighLevel
 * Supports ContactCreate and ContactUpdate events
 */
export async function POST(request: NextRequest) {
  try {
    // Get webhook signature from headers
    const signature = request.headers.get('x-ghl-signature') || 
                     request.headers.get('x-signature') ||
                     request.headers.get('signature') ||
                     null;

    // Parse request body as text first
    const bodyText = await request.text();
    
    // Parse JSON payload
    let payload: GHLWebhookPayload;
    try {
      payload = JSON.parse(bodyText);
    } catch (parseError) {
      console.error('❌ Failed to parse JSON payload:', parseError);
      // Always return 200 OK even for invalid JSON (per requirements)
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    // Verify webhook signature
    if (!verifyWebhookSignature(bodyText, signature)) {
      console.warn('⚠️ Webhook signature verification failed');
      // Still return 200 OK (per requirements)
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    // Extract event type and contact data
    const eventType = payload.event || payload.type || 'Unknown';
    
    // Extract contact from various possible locations in payload
    const contact = payload.contact || 
                   payload.data?.contact || 
                   payload.payload?.contact;

    console.log(`✅ Received GHL webhook: ${eventType}`);

    // Handle events with switch/case
    switch (eventType) {
      case 'ContactCreate':
      case 'contact.create':
      case 'contact.created':
        if (contact) {
          await saveContactToFirestore(contact);
          const contactEmail = contact.email || contact.id || 'unknown';
          console.log(`✅ ContactCreate processed for: ${contactEmail}`);
        } else {
          console.warn('⚠️ ContactCreate event missing contact data');
        }
        break;

      case 'ContactUpdate':
      case 'contact.update':
      case 'contact.updated':
        if (contact) {
          await saveContactToFirestore(contact);
          const contactEmail = contact.email || contact.id || 'unknown';
          console.log(`✅ ContactUpdate processed for: ${contactEmail}`);
        } else {
          console.warn('⚠️ ContactUpdate event missing contact data');
        }
        break;

      default:
        // Unknown event - log but still return 200 OK
        console.log(`ℹ️ Unknown webhook event: ${eventType}`);
        if (contact) {
          // If contact data exists, save it anyway
          await saveContactToFirestore(contact);
          console.log(`✅ Saved contact from unknown event: ${contact.email || contact.id}`);
        }
        break;
    }

    // Always return 200 OK with {ok: true}
    return NextResponse.json({ ok: true }, { status: 200 });

  } catch (error) {
    // Log error but still return 200 OK (per requirements)
    console.error('❌ Error processing GHL webhook:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error details:', errorMessage);
    
    // Always return 200 OK even on error (so GHL doesn't retry)
    return NextResponse.json({ ok: true }, { status: 200 });
  }
}

/**
 * GET /api/ghl/webhook
 * 
 * Webhook verification endpoint (for GHL webhook setup)
 */
export async function GET(request: NextRequest) {
  const challenge = request.nextUrl.searchParams.get('challenge');
  
  if (challenge) {
    // Echo back challenge for webhook verification
    return NextResponse.json({ challenge }, { status: 200 });
  }

  return NextResponse.json(
    { 
      message: 'GHL Webhook endpoint is active',
      methods: ['POST', 'GET'],
      path: '/api/ghl/webhook',
    },
    { status: 200 }
  );
}
