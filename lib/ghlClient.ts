/**
 * GoHighLevel API Client with OAuth Token Support
 * 
 * Automatically injects OAuth tokens into requests
 * Handles token refresh when needed
 */

import { getValidAccessToken } from './ghl-tokens';

const GHL_API_BASE_URL = 'https://services.leadconnectorhq.com';
const GHL_API_VERSION = 'v1';

/**
 * GHL Client Options
 */
export interface GHLClientOptions {
  locationId?: string;
  useOAuth?: boolean; // Use OAuth tokens instead of API key
}

/**
 * Get default location ID from environment
 */
function getDefaultLocationId(): string | undefined {
  return process.env.GHL_LOCATION_ID;
}

/**
 * Make authenticated request to GHL API
 * Uses OAuth token if locationId provided, otherwise falls back to API key
 */
export async function ghlClientRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  clientOptions: GHLClientOptions = {}
): Promise<T> {
  const { locationId, useOAuth = true } = clientOptions;
  const finalLocationId = locationId || getDefaultLocationId();

  let authHeader: string;

  // Use OAuth token if locationId is provided and useOAuth is true
  if (finalLocationId && useOAuth) {
    try {
      const accessToken = await getValidAccessToken(finalLocationId);
      authHeader = `Bearer ${accessToken}`;
    } catch (error) {
      // Fallback to API key if token retrieval fails
      console.warn('Failed to get OAuth token, falling back to API key:', error);
      const apiKey = process.env.GHL_API_KEY;
      if (!apiKey) {
        throw new Error('No OAuth token available and GHL_API_KEY not set');
      }
      authHeader = `Bearer ${apiKey}`;
    }
  } else {
    // Use API key
    const apiKey = process.env.GHL_API_KEY;
    if (!apiKey) {
      throw new Error('GHL_API_KEY environment variable is not set. Please configure it in .env.local');
    }
    authHeader = `Bearer ${apiKey}`;
  }

  const url = `${GHL_API_BASE_URL}/${GHL_API_VERSION}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': authHeader,
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
 * Get current user information
 * GET /users/self
 */
export async function getCurrentUser(
  locationId?: string
): Promise<{
  id: string;
  email: string;
  name: string;
  locationId?: string;
  [key: string]: unknown;
}> {
  const response = await ghlClientRequest<{
    user: {
      id: string;
      email: string;
      name: string;
      locationId?: string;
      [key: string]: unknown;
    };
  }>('/users/self', {
    method: 'GET',
  }, { locationId, useOAuth: true });

  return (response.user || response) as {
    id: string;
    email: string;
    name: string;
    locationId?: string;
    [key: string]: unknown;
  };
}

/**
 * Get contact by ID
 */
export async function getContact(
  contactId: string,
  locationId?: string
): Promise<{
  contact: {
    id: string;
    email?: string;
    name?: string;
    [key: string]: unknown;
  };
}> {
  const finalLocationId = locationId || getDefaultLocationId();
  if (!finalLocationId) {
    throw new Error('Location ID is required. Set GHL_LOCATION_ID or pass locationId parameter.');
  }

  return ghlClientRequest(
    `/locations/${finalLocationId}/contacts/${contactId}`,
    { method: 'GET' },
    { locationId: finalLocationId, useOAuth: true }
  );
}

/**
 * Create a contact
 */
export async function createContact(
  contact: {
    email?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    [key: string]: unknown;
  },
  locationId?: string
): Promise<{
  contact: {
    id: string;
    [key: string]: unknown;
  };
}> {
  const finalLocationId = locationId || getDefaultLocationId();
  if (!finalLocationId) {
    throw new Error('Location ID is required. Set GHL_LOCATION_ID or pass locationId parameter.');
  }

  return ghlClientRequest(
    `/locations/${finalLocationId}/contacts`,
    {
      method: 'POST',
      body: JSON.stringify(contact),
    },
    { locationId: finalLocationId, useOAuth: true }
  );
}

/**
 * Update a contact
 */
export async function updateContact(
  contactId: string,
  contact: Partial<{
    email?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    [key: string]: unknown;
  }>,
  locationId?: string
): Promise<{
  contact: {
    id: string;
    [key: string]: unknown;
  };
}> {
  const finalLocationId = locationId || getDefaultLocationId();
  if (!finalLocationId) {
    throw new Error('Location ID is required. Set GHL_LOCATION_ID or pass locationId parameter.');
  }

  return ghlClientRequest(
    `/locations/${finalLocationId}/contacts/${contactId}`,
    {
      method: 'PUT',
      body: JSON.stringify(contact),
    },
    { locationId: finalLocationId, useOAuth: true }
  );
}

/**
 * Check if GHL client is configured (OAuth or API key)
 */
export function isGHLClientConfigured(locationId?: string): boolean {
  const finalLocationId = locationId || getDefaultLocationId();
  
  // Check if OAuth is configured (locationId exists)
  if (finalLocationId) {
    return true; // Assume OAuth is configured if locationId is available
  }

  // Fallback to API key check
  return !!process.env.GHL_API_KEY;
}

