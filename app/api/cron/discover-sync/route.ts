/**
 * Vercel Cron Endpoint for Discover Feed Sync
 * 
 * This endpoint is called by Vercel Cron every 4 hours
 * Vercel Cron automatically sets the Authorization header
 */

import { NextRequest, NextResponse } from 'next/server';
import { syncGHLContactsToFirestore } from '@/lib/ghl-discover-sync';

/**
 * GET /api/cron/discover-sync
 * 
 * Called by Vercel Cron (every 4 hours)
 * Vercel automatically sets Authorization header with CRON_SECRET
 */
export async function GET(request: NextRequest) {
  try {
    // Verify this is a cron request
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
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
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error in cron discover sync:', error);
    
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

