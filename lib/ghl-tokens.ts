/**
 * GoHighLevel OAuth Token Management
 * 
 * Handles storing, retrieving, and refreshing GHL OAuth tokens
 */

import { getFirestoreInstance } from './firebase';
import { doc, getDoc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';

const TOKENS_COLLECTION = 'ghl_tokens';
const GHL_API_BASE_URL = 'https://services.leadconnectorhq.com';

/**
 * GHL Token Data Structure
 */
export interface GHLTokenData {
  locationId: string;
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope?: string;
  expires_at: number; // Timestamp in milliseconds
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Store tokens in Firestore keyed by location_id
 */
export async function storeTokens(
  locationId: string,
  tokenData: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type?: string;
    scope?: string;
  }
): Promise<void> {
  const firestore = getFirestoreInstance();
  const expiresAt = Date.now() + (tokenData.expires_in * 1000);

  const tokenDoc: GHLTokenData = {
    locationId,
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token,
    expires_in: tokenData.expires_in,
    token_type: tokenData.token_type || 'Bearer',
    scope: tokenData.scope,
    expires_at: expiresAt,
    createdAt: serverTimestamp() as Timestamp,
    updatedAt: serverTimestamp() as Timestamp,
  };

  const tokenRef = doc(firestore, TOKENS_COLLECTION, locationId);
  await setDoc(tokenRef, tokenDoc);

  console.log(`✅ Stored GHL tokens for location: ${locationId}`);
}

/**
 * Get tokens from Firestore by location_id
 */
export async function getTokens(locationId: string): Promise<GHLTokenData | null> {
  const firestore = getFirestoreInstance();
  const tokenRef = doc(firestore, TOKENS_COLLECTION, locationId);
  const tokenSnap = await getDoc(tokenRef);

  if (!tokenSnap.exists()) {
    return null;
  }

  return tokenSnap.data() as GHLTokenData;
}

/**
 * Check if token is expired (with 5 minute buffer)
 */
export function isTokenExpired(tokenData: GHLTokenData): boolean {
  const buffer = 5 * 60 * 1000; // 5 minutes in milliseconds
  return Date.now() >= (tokenData.expires_at - buffer);
}

/**
 * Refresh access token using refresh_token
 */
export async function refreshAccessToken(locationId: string): Promise<GHLTokenData> {
  const tokenData = await getTokens(locationId);

  if (!tokenData) {
    throw new Error(`No tokens found for location: ${locationId}`);
  }

  const clientId = process.env.GHL_CLIENT_ID;
  const clientSecret = process.env.GHL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('GHL_CLIENT_ID and GHL_CLIENT_SECRET must be set for token refresh');
  }

  const refreshUrl = `${GHL_API_BASE_URL}/oauth/token`;
  const response = await fetch(refreshUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      grant_type: 'refresh_token',
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: tokenData.refresh_token,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(`Token refresh failed: ${errorData.message || response.statusText}`);
  }

  const newTokenData = await response.json();
  const expiresAt = Date.now() + (newTokenData.expires_in * 1000);

  const updatedTokenData: GHLTokenData = {
    ...tokenData,
    access_token: newTokenData.access_token,
    refresh_token: newTokenData.refresh_token || tokenData.refresh_token,
    expires_in: newTokenData.expires_in,
    expires_at: expiresAt,
    updatedAt: serverTimestamp() as Timestamp,
  };

  // Update tokens in Firestore
  const firestore = getFirestoreInstance();
  const tokenRef = doc(firestore, TOKENS_COLLECTION, locationId);
  await setDoc(tokenRef, updatedTokenData);

  console.log(`✅ Refreshed GHL tokens for location: ${locationId}`);

  return updatedTokenData;
}

/**
 * Get valid access token, refreshing if needed
 */
export async function getValidAccessToken(locationId: string): Promise<string> {
  let tokenData = await getTokens(locationId);

  if (!tokenData) {
    throw new Error(`No tokens found for location: ${locationId}. Please complete OAuth flow.`);
  }

  // Check if token needs refresh
  if (isTokenExpired(tokenData)) {
    console.log(`🔄 Token expired for location ${locationId}, refreshing...`);
    tokenData = await refreshAccessToken(locationId);
  }

  return tokenData.access_token;
}

