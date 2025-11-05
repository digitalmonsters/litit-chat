/**
 * User Sync API Route
 * 
 * Syncs Firebase user to GoHighLevel contact
 * POST /api/users/sync
 */

import { NextRequest, NextResponse } from 'next/server';
import { syncUserToGHL } from '@/lib/ghl-sync';

/**
 * POST /api/users/sync
 * 
 * Syncs a Firebase user to GHL contact
 * 
 * Body: { userId: string } (optional, uses auth token if not provided)
 */
export async function POST(request: NextRequest) {
  try {
    // Get userId from request body or auth token
    let userId: string | null = null;

    try {
      const body = await request.json();
      userId = body.userId || null;
    } catch {
      // Body is optional
    }

    // If no userId in body, return error (we'll add token verification later if needed)
    // For now, require userId in request body

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required. Provide it in request body or use Bearer token.' },
        { status: 400 }
      );
    }

    // Sync user to GHL
    const result = await syncUserToGHL(userId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to sync user to GHL' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Synced Firebase user ${userId} ↔ GHL contact ${result.ghlContactId}`,
      ghlContactId: result.ghlContactId,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error in user sync API:', error);
    
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/users/sync?userId=xxx
 * 
 * Get sync status for a user
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId query parameter is required' },
        { status: 400 }
      );
    }

    // Check if user has GHL contact ID
    const { doc, getDoc } = await import('firebase/firestore');
    const { getFirestoreInstance } = await import('@/lib/firebase');
    const { COLLECTIONS } = await import('@/lib/firebase');
    
    const db = getFirestoreInstance();
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userData = userSnap.data();
    const ghlContactId = userData.ghlId || userData.ghlContactId;

    return NextResponse.json({
      userId,
      synced: !!ghlContactId,
      ghlContactId: ghlContactId || null,
      ghlLocationId: userData.ghlLocationId || null,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error in user sync status API:', error);
    
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

