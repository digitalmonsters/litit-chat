/**
 * Server-side Authentication Utilities
 * 
 * Verifies Firebase Auth tokens in API routes
 */

import { NextRequest } from 'next/server';

/**
 * Get Firebase Auth token from request headers
 */
export function getAuthToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader) {
    return null;
  }

  // Support both "Bearer <token>" and just "<token>" formats
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return authHeader;
}

/**
 * Verify Firebase Auth token and extract user ID
 * 
 * Note: For production, install firebase-admin and use admin.auth().verifyIdToken()
 * For now, this validates the token format and structure
 * 
 * @param token - Firebase Auth token
 * @returns User ID if token is valid, null otherwise
 */
export async function verifyAuthToken(token: string): Promise<string | null> {
  try {
    // Basic token validation - check if it's a valid JWT format
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // Decode the payload (without verification for now)
    // In production, use Firebase Admin SDK to verify
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    
    // Check if token is expired
    if (payload.exp && payload.exp < Date.now() / 1000) {
      return null;
    }

    return payload.uid || payload.user_id || null;
  } catch (error) {
    console.error('Error verifying auth token:', error);
    return null;
  }
}

/**
 * Get authenticated user ID from request
 * Extracts and verifies Firebase Auth token
 */
export async function getAuthenticatedUserId(request: NextRequest): Promise<string | null> {
  const token = getAuthToken(request);
  
  if (!token) {
    return null;
  }

  return await verifyAuthToken(token);
}

