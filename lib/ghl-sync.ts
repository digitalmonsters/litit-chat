/**
 * GoHighLevel Contact Synchronization
 * 
 * Syncs Firebase users with GHL contacts
 */

import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { getFirestoreInstance } from './firebase';
import { COLLECTIONS } from './firebase';
import { ghlClientRequest } from './ghlClient';
import type { FirestoreUser } from './firestore-collections';

const GHL_API_BASE_URL = 'https://services.leadconnectorhq.com';
const GHL_API_VERSION = 'v1';

/**
 * GHL Contact Interface
 */
interface GHLContact {
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address1?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  customField?: Array<{
    key: string;
    value: string;
  }>;
  locationId?: string;
}

/**
 * Get GHL location ID from environment or user data
 */
function getLocationId(user?: FirestoreUser): string {
  const locationId = user?.ghlLocationId || process.env.GHL_LOCATION_ID;
  if (!locationId) {
    throw new Error('GHL_LOCATION_ID is required. Set it in .env.local or user.ghlLocationId');
  }
  return locationId;
}

/**
 * Convert Firestore user to GHL contact format
 */
function userToGHLContact(user: FirestoreUser, locationId: string): GHLContact {
  // Split displayName into firstName and lastName
  const nameParts = (user.displayName ?? '').trim().split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  // Build address from location with safe guards
  const loc =
    typeof user.location === 'string'
      ? { address: user.location, city: '', country: '' }
      : user.location ?? {};
  const address1 = loc.address ?? '';
  const city = loc.city ?? '';
  const country = loc.country ?? '';

  const contact: GHLContact = {
    firstName,
    lastName,
    email: user.email ?? undefined,
    phone: user.phone ?? (typeof user.metadata?.phone === 'string' ? user.metadata.phone : undefined),
    address1,
    city,
    country,
    locationId,
    customField: [
      {
        key: 'firebaseUid',
        value: user.id,
      },
    ],
  };

  // Add interests as tags if available
  if (user.interests && user.interests.length > 0) {
    // GHL uses tags field, but we'll add as custom field for now
    contact.customField?.push({
      key: 'interests',
      value: user.interests.join(','),
    });
  }

  return contact;
}

/**
 * Create or update contact in GHL
 */
async function createOrUpdateGHLContact(
  contact: GHLContact,
  locationId: string
): Promise<{ id: string }> {
  const endpoint = '/contacts';
  
  // If contact has an ID, update it
  if (contact.id) {
    try {
      const response = await ghlClientRequest<{ contact?: { id: string } }>(
        `${endpoint}/${contact.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify(contact),
        },
        {
          locationId,
          useOAuth: true, // Try OAuth first, fallback to API key
        }
      );
      
      return { id: response.contact?.id || contact.id };
    } catch (error) {
      // If update fails (contact might not exist), try creating
      // eslint-disable-next-line no-console
      console.warn(`Failed to update contact ${contact.id}, trying to create:`, error);
      // Remove ID and create new contact
      const { id: _removedId, ...contactWithoutId } = contact;
      return createOrUpdateGHLContact(contactWithoutId, locationId);
    }
  }

  // Create new contact
  const response = await ghlClientRequest<{ contact?: { id: string } }>(
    endpoint,
    {
      method: 'POST',
      body: JSON.stringify(contact),
    },
    {
      locationId,
      useOAuth: true,
    }
  );

  const contactId = response.contact?.id;
  if (!contactId) {
    throw new Error('GHL API did not return contact ID');
  }

  return { id: contactId };
}

/**
 * Find existing GHL contact by Firebase UID
 * 
 * Note: GHL API doesn't have a direct search by customField endpoint.
 * We'll rely on storing ghlId in Firestore and checking that first.
 * If contact doesn't exist, we'll create a new one.
 */
async function findContactByFirebaseUid(
  firebaseUid: string,
  locationId: string
): Promise<string | null> {
  // Since GHL doesn't have reliable search by customField,
  // we'll just return null and let the create flow handle it.
  // The contact will be created with the customField, and if it already exists
  // (rare case), GHL will handle it or return an error we can catch.
  return null;
}

/**
 * Sync Firebase user to GHL contact
 */
export async function syncUserToGHL(userId: string): Promise<{
  success: boolean;
  ghlContactId?: string;
  error?: string;
}> {
  try {
    const db = getFirestoreInstance();
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return {
        success: false,
        error: `Firebase user ${userId} not found`,
      };
    }

    const user = { id: userId, ...userSnap.data() } as FirestoreUser;
    const locationId = getLocationId(user);

    // Check if user already has a GHL contact ID
    let ghlContactId: string | undefined = user.ghlId || user.ghlContactId || undefined;

    // If no GHL contact ID, try to find existing contact by Firebase UID
    if (!ghlContactId) {
      ghlContactId = await findContactByFirebaseUid(userId, locationId) || undefined;
    }

    // Convert user to GHL contact format
    const ghlContact = userToGHLContact(user, locationId);
    
    // Add existing contact ID if found
    if (ghlContactId) {
      ghlContact.id = ghlContactId;
    }

    // Create or update contact in GHL
    const result = await createOrUpdateGHLContact(ghlContact, locationId);
    const finalContactId = result.id;

    // Update Firestore user with GHL contact ID
    await updateDoc(userRef, {
      ghlId: finalContactId,
      ghlContactId: finalContactId,
      ghlLocationId: locationId,
      updatedAt: serverTimestamp(),
    });

    // eslint-disable-next-line no-console
    console.log(`✅ Synced Firebase user ${userId} ↔ GHL contact ${finalContactId}`);

    return {
      success: true,
      ghlContactId: finalContactId,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    // eslint-disable-next-line no-console
    console.error(`❌ Failed to sync Firebase user ${userId} to GHL:`, errorMessage);
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Update GHL contact when Firebase user profile changes
 */
export async function updateGHLContactOnProfileChange(
  userId: string,
  updatedFields: Partial<FirestoreUser>
): Promise<void> {
  try {
    const db = getFirestoreInstance();
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      // eslint-disable-next-line no-console
      console.warn(`User ${userId} not found, skipping GHL update`);
      return;
    }

    const user = { id: userId, ...userSnap.data() } as FirestoreUser;
    const ghlContactId = user.ghlId || user.ghlContactId;

    if (!ghlContactId) {
      // No GHL contact yet, create one
      await syncUserToGHL(userId);
      return;
    }

    const locationId = getLocationId(user);
    const ghlContact = userToGHLContact(user, locationId);
    ghlContact.id = ghlContactId;

    // Update contact in GHL
    await ghlClientRequest(
      `/contacts/${ghlContactId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(ghlContact),
      },
      {
        locationId,
        useOAuth: true,
      }
    );

    // eslint-disable-next-line no-console
    console.log(`✅ Updated GHL contact ${ghlContactId} for Firebase user ${userId}`);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`❌ Failed to update GHL contact for user ${userId}:`, error);
    // Don't throw - this is a background sync, shouldn't block user flow
  }
}
