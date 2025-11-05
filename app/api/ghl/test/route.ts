import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/ghlClient';

/**
 * GET /api/ghl/test
 * 
 * Test endpoint to verify GHL OAuth token is working
 * Fetches /users/self from GHL API and logs the response
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const locationId = searchParams.get('locationId') || undefined;

    if (!locationId && !process.env.GHL_LOCATION_ID) {
      return NextResponse.json(
        {
          error: 'Location ID required',
          message: 'Provide locationId as query parameter or set GHL_LOCATION_ID environment variable',
        },
        { status: 400 }
      );
    }

    console.log('🧪 Testing GHL OAuth token...');
    console.log(`📍 Location ID: ${locationId || process.env.GHL_LOCATION_ID}`);

    // Fetch current user from GHL API
    const user = await getCurrentUser(locationId || process.env.GHL_LOCATION_ID);

    console.log('✅ GHL API Response:');
    console.log(JSON.stringify(user, null, 2));

    return NextResponse.json(
      {
        success: true,
        message: 'GHL OAuth token is working',
        user,
        locationId: locationId || process.env.GHL_LOCATION_ID,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ GHL API Test Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      {
        error: 'GHL API test failed',
        message: errorMessage,
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

