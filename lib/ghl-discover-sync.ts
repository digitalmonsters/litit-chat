/**
 * GHL Discover Feed Sync
 * 
 * Syncs GHL contacts to Firestore users for Discover Feed
 */

import {
  collection,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { getFirestoreInstance } from './firebase';
import { COLLECTIONS } from './firebase';
import { ghlClientRequest } from './ghlClient';
import type { FirestoreUser } from './firestore-collections';

/**
 * GHL Contact Interface
 */
interface GHLContact {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  photo?: string;
  tags?: string[];
  customField?: Array<{
    key: string;
    value: string;
  }>;
  [key: string]: unknown;
}

/**
 * GHL Contacts List Response
 */
interface GHLContactsResponse {
  contacts?: GHLContact[];
  meta?: {
    total?: number;
    [key: string]: unknown;
  };
}

/**
 * Get GHL location ID from environment
 */
function getLocationId(): string {
  const locationId = process.env.GHL_LOCATION_ID;
  if (!locationId) {
    throw new Error('GHL_LOCATION_ID is required. Set it in .env.local');
  }
  return locationId;
}

/**
 * Fetch contacts from GHL with tags filter
 */
async function fetchGHLContacts(locationId: string): Promise<GHLContact[]> {
  const endpoint = `/locations/${locationId}/contacts`;
  
  // Fetch all contacts (GHL API doesn't support tag filtering in query, so we'll filter client-side)
  const response = await ghlClientRequest<GHLContactsResponse>(
    endpoint,
    {
      method: 'GET',
    },
    {
      locationId,
      useOAuth: true,
    }
  );

  const contacts = response.contacts || [];
  
  // Filter for active users with tags "Creator" or "Public"
  const activeContacts = contacts.filter((contact) => {
    const tags = contact.tags || [];
    return tags.includes('Creator') || tags.includes('Public');
  });

  return activeContacts;
}

/**
 * Convert GHL contact to Firestore user format
 */
function ghlContactToFirestoreUser(
  ghlContact: GHLContact,
  locationId: string
): Partial<FirestoreUser> {
  const firstName = ghlContact.firstName || '';
  const lastName = ghlContact.lastName || '';
  const displayName = `${firstName} ${lastName}`.trim() || ghlContact.email || 'Unknown User';
  
  // Extract Firebase UID from customField if available
  const firebaseUid = ghlContact.customField?.find(
    (field) => field.key === 'firebaseUid'
  )?.value;

  const userData: Partial<FirestoreUser> = {
    email: ghlContact.email || '',
    displayName,
    photoURL: ghlContact.photo,
    ghlId: ghlContact.id,
    ghlContactId: ghlContact.id,
    ghlLocationId: locationId,
    verified: true, // GHL contacts are considered verified
    tier: 'free', // Default tier
    status: 'offline',
    provider: 'email' as FirestoreUser['provider'], // GHL contacts are synced via email
    createdAt: serverTimestamp() as Timestamp,
    updatedAt: serverTimestamp() as Timestamp,
    lastSeen: serverTimestamp() as Timestamp,
    lastLogin: serverTimestamp() as Timestamp,
  };

  // Add tags as interests if available
  const tags = ghlContact.tags || [];
  const interests = tags.filter((tag) => tag !== 'Creator' && tag !== 'Public');
  if (interests.length > 0) {
    userData.interests = interests;
  }

  // Store Firebase UID if found
  if (firebaseUid) {
    userData.id = firebaseUid;
  }

  return userData;
}

/**
 * Sync GHL contacts to Firestore users
 */
export async function syncGHLContactsToFirestore(): Promise<{
  success: boolean;
  syncedCount: number;
  error?: string;
}> {
  try {
    const locationId = getLocationId();
    const db = getFirestoreInstance();
    const usersRef = collection(db, COLLECTIONS.USERS);

    // Fetch active contacts from GHL
    const ghlContacts = await fetchGHLContacts(locationId);
    
    let syncedCount = 0;

    // Process each contact
    for (const ghlContact of ghlContacts) {
      try {
        // Determine document ID
        // Priority: 1. Firebase UID from customField, 2. Email, 3. GHL contact ID
        const firebaseUid = ghlContact.customField?.find(
          (field) => field.key === 'firebaseUid'
        )?.value;

        let docId: string;
        if (firebaseUid) {
          docId = firebaseUid;
        } else if (ghlContact.email) {
          docId = ghlContact.email;
        } else {
          docId = `ghl_${ghlContact.id}`;
        }

        const userRef = doc(usersRef, docId);
        const userSnap = await getDoc(userRef);

        // Convert GHL contact to Firestore user format
        const userData = ghlContactToFirestoreUser(ghlContact, locationId);

        if (userSnap.exists()) {
          // Update existing user (preserve existing data, update with GHL data)
          const existingData = userSnap.data() as FirestoreUser;
          await setDoc(
            userRef,
            {
              ...userData,
              // Preserve existing fields that shouldn't be overwritten
              createdAt: existingData.createdAt || userData.createdAt,
              id: docId,
            },
            { merge: true }
          );
        } else {
          // Create new user
          await setDoc(userRef, {
            ...userData,
            id: docId,
          });
        }

        syncedCount++;
      } catch (contactError) {
        // eslint-disable-next-line no-console
        console.error(`Error syncing contact ${ghlContact.id}:`, contactError);
        // Continue with next contact
      }
    }

    // eslint-disable-next-line no-console
    console.log(`✅ Synced ${syncedCount} GHL contacts → Firestore users`);

    return {
      success: true,
      syncedCount,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    // eslint-disable-next-line no-console
    console.error(`❌ Failed to sync GHL contacts:`, errorMessage);
    
    return {
      success: false,
      syncedCount: 0,
      error: errorMessage,
    };
  }
}

