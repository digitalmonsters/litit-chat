/**
 * Discover Feed Sync API Route
 * 
 * Syncs GHL contacts to Firestore users for Discover Feed
 * POST /api/discover/sync
 */

import { NextRequest, NextResponse } from 'next/server';
import { syncGHLContactsToFirestore } from '@/lib/ghl-discover-sync';

/**
 * POST /api/discover/sync
 * 
 * Syncs GHL contacts (with tags "Creator" or "Public") to Firestore users
 * 
 * Can be called manually or via Vercel Cron
 */
export async function POST(request: NextRequest) {
  try {
    // Optional: Verify request is from Vercel Cron or has auth
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    // Check if this is a cron request (Vercel sets Authorization header with CRON_SECRET)
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      // Allow manual calls without auth for development, but log it
      const isDevelopment = process.env.NODE_ENV === 'development';
      if (!isDevelopment) {
        return NextResponse.json(
          { error: 'Unauthorized. Use CRON_SECRET for cron requests.' },
          { status: 401 }
        );
      }
    }

    // Sync GHL contacts to Firestore
    const result = await syncGHLContactsToFirestore();

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error || 'Failed to sync GHL contacts',
          syncedCount: result.syncedCount,
        },
        { status: 500 }
      );
    }

    console.log(`✅ Synced ${result.syncedCount} contacts to Firestore users`);
    
    return NextResponse.json({
      success: true,
      message: `Synced ${result.syncedCount} contacts to Firestore users`,
      syncedCount: result.syncedCount,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error in discover sync API:', error);
    
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/discover/sync
 * 
 * Get sync status (for debugging)
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Discover Feed Sync API',
    endpoint: '/api/discover/sync',
    method: 'POST',
    schedule: 'Every 6 hours via Vercel Cron',
    description: 'Syncs GHL contacts (tags: Creator or Public) to Firestore users',
  });
}

