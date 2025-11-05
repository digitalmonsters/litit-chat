/**
 * GoHighLevel API Wrapper
 * 
 * Provides a clean interface for interacting with GoHighLevel API
 * Uses API key stored in environment variables
 */

const GHL_API_BASE_URL = 'https://services.leadconnectorhq.com';
const GHL_API_VERSION = 'v1';

/**
 * Get GoHighLevel API key from environment
 */
function getGHLAPIKey(): string {
  const apiKey = process.env.GHL_API_KEY;
  if (!apiKey) {
    throw new Error(
      'GHL_API_KEY environment variable is not set. Please configure it in .env.local'
    );
  }
  return apiKey;
}

/**
 * Get default location ID from environment
 */
function getDefaultLocationId(): string | undefined {
  return process.env.GHL_LOCATION_ID;
}

/**
 * Make authenticated request to GHL API
 */
async function ghlRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const apiKey = getGHLAPIKey();
  const url = `${GHL_API_BASE_URL}/${GHL_API_VERSION}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Version': '2021-07-28',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(
      `GHL API Error: ${response.status} ${response.statusText} - ${JSON.stringify(error)}`
    );
  }

  return response.json();
}

/**
 * GHL Contact Types
 */
export interface GHLContact {
  id?: string;
  email?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  phoneNumber?: string;
  photo?: string;
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
}

export interface GHLContactResponse {
  contact: GHLContact;
  meta?: {
    total?: number;
    page?: number;
  };
}

export interface GHLContactListResponse {
  contacts: GHLContact[];
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}

/**
 * GHL Transaction/Payment Types
 */
export interface GHLTransaction {
  id?: string;
  contactId?: string;
  locationId?: string;
  amount?: number;
  total?: number;
  currency?: string;
  status?: string;
  description?: string;
  notes?: string;
  paymentMethod?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface GHLTransactionResponse {
  transaction: GHLTransaction;
}

/**
 * Get a contact by ID
 */
export async function getContact(
  contactId: string,
  locationId?: string
): Promise<GHLContactResponse> {
  const locId = locationId || getDefaultLocationId();
  if (!locId) {
    throw new Error('Location ID is required. Set GHL_LOCATION_ID or pass locationId parameter.');
  }

  return ghlRequest<GHLContactResponse>(
    `/locations/${locId}/contacts/${contactId}`
  );
}

/**
 * Create a new contact
 */
export async function createContact(
  contact: GHLContact,
  locationId?: string
): Promise<GHLContactResponse> {
  const locId = locationId || contact.locationId || getDefaultLocationId();
  if (!locId) {
    throw new Error('Location ID is required. Set GHL_LOCATION_ID or pass locationId parameter.');
  }

  return ghlRequest<GHLContactResponse>(
    `/locations/${locId}/contacts`,
    {
      method: 'POST',
      body: JSON.stringify(contact),
    }
  );
}

/**
 * Update an existing contact
 */
export async function updateContact(
  contactId: string,
  contact: Partial<GHLContact>,
  locationId?: string
): Promise<GHLContactResponse> {
  const locId = locationId || contact.locationId || getDefaultLocationId();
  if (!locId) {
    throw new Error('Location ID is required. Set GHL_LOCATION_ID or pass locationId parameter.');
  }

  return ghlRequest<GHLContactResponse>(
    `/locations/${locId}/contacts/${contactId}`,
    {
      method: 'PUT',
      body: JSON.stringify(contact),
    }
  );
}

/**
 * Search for contacts
 */
export async function searchContacts(
  query: string,
  locationId?: string,
  limit: number = 50
): Promise<GHLContactListResponse> {
  const locId = locationId || getDefaultLocationId();
  if (!locId) {
    throw new Error('Location ID is required. Set GHL_LOCATION_ID or pass locationId parameter.');
  }

  return ghlRequest<GHLContactListResponse>(
    `/locations/${locId}/contacts?query=${encodeURIComponent(query)}&limit=${limit}`
  );
}

/**
 * Get transactions for a contact
 */
export async function getContactTransactions(
  contactId: string,
  locationId?: string
): Promise<GHLTransaction[]> {
  const locId = locationId || getDefaultLocationId();
  if (!locId) {
    throw new Error('Location ID is required. Set GHL_LOCATION_ID or pass locationId parameter.');
  }

  const response = await ghlRequest<{ transactions: GHLTransaction[] }>(
    `/locations/${locId}/contacts/${contactId}/transactions`
  );

  return response.transactions || [];
}

/**
 * Create a transaction
 */
export async function createTransaction(
  transaction: GHLTransaction,
  locationId?: string
): Promise<GHLTransactionResponse> {
  const locId = locationId || transaction.locationId || getDefaultLocationId();
  if (!locId) {
    throw new Error('Location ID is required. Set GHL_LOCATION_ID or pass locationId parameter.');
  }

  return ghlRequest<GHLTransactionResponse>(
    `/locations/${locId}/transactions`,
    {
      method: 'POST',
      body: JSON.stringify(transaction),
    }
  );
}

/**
 * Send a message to a contact
 */
export async function sendMessage(
  contactId: string,
  message: string,
  locationId?: string,
  channel: 'sms' | 'email' = 'sms'
): Promise<{ success: boolean; messageId?: string }> {
  const locId = locationId || getDefaultLocationId();
  if (!locId) {
    throw new Error('Location ID is required. Set GHL_LOCATION_ID or pass locationId parameter.');
  }

  const endpoint = channel === 'sms' 
    ? `/locations/${locId}/contacts/${contactId}/messages/sms`
    : `/locations/${locId}/contacts/${contactId}/messages/email`;

  const response = await ghlRequest<{ id?: string }>(
    endpoint,
    {
      method: 'POST',
      body: JSON.stringify({
        message,
        channel,
      }),
    }
  );

  return {
    success: true,
    messageId: response.id,
  };
}

/**
 * Get conversation/message history for a contact
 */
export async function getConversation(
  contactId: string,
  locationId?: string
): Promise<{ messages: Array<{
  id: string;
  message: string;
  direction: 'inbound' | 'outbound';
  channel: 'sms' | 'email' | 'chat';
  createdAt: string;
}> }> {
  const locId = locationId || getDefaultLocationId();
  if (!locId) {
    throw new Error('Location ID is required. Set GHL_LOCATION_ID or pass locationId parameter.');
  }

  return ghlRequest(
    `/locations/${locId}/contacts/${contactId}/conversations`
  );
}

/**
 * Add tags to a contact
 */
export async function addContactTags(
  contactId: string,
  tags: string[],
  locationId?: string
): Promise<GHLContactResponse> {
  const locId = locationId || getDefaultLocationId();
  if (!locId) {
    throw new Error('Location ID is required. Set GHL_LOCATION_ID or pass locationId parameter.');
  }

  return ghlRequest<GHLContactResponse>(
    `/locations/${locId}/contacts/${contactId}/tags`,
    {
      method: 'POST',
      body: JSON.stringify({ tags }),
    }
  );
}

/**
 * Remove tags from a contact
 */
export async function removeContactTags(
  contactId: string,
  tags: string[],
  locationId?: string
): Promise<GHLContactResponse> {
  const locId = locationId || getDefaultLocationId();
  if (!locId) {
    throw new Error('Location ID is required. Set GHL_LOCATION_ID or pass locationId parameter.');
  }

  return ghlRequest<GHLContactResponse>(
    `/locations/${locId}/contacts/${contactId}/tags`,
    {
      method: 'DELETE',
      body: JSON.stringify({ tags }),
    }
  );
}

/**
 * Utility function to check if GHL API is configured
 */
export function isGHLConfigured(): boolean {
  try {
    getGHLAPIKey();
    return true;
  } catch {
    return false;
  }
}

