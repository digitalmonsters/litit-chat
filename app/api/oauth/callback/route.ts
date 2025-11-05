import { NextRequest, NextResponse } from 'next/server';
import { storeTokens } from '@/lib/ghl-tokens';

/**
 * GET /api/oauth/callback
 * 
 * Handles OAuth callback from GoHighLevel
 * Exchanges authorization code for access token
 * Stores tokens in Firestore
 * 
 * Query params:
 * - code: Authorization code from GHL
 * - state: Optional state parameter
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    // Handle OAuth errors
    if (error) {
      console.error('OAuth error:', error);
      return NextResponse.redirect(
        new URL(`/?error=${encodeURIComponent(error)}`, request.url)
      );
    }

    // Validate authorization code
    if (!code) {
      return NextResponse.redirect(
        new URL('/?error=missing_code', request.url)
      );
    }

    // Get OAuth configuration from environment
    const clientId = process.env.GHL_CLIENT_ID;
    const clientSecret = process.env.GHL_CLIENT_SECRET;
    const redirectUri = process.env.GHL_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      console.error('Missing OAuth configuration:', {
        hasClientId: !!clientId,
        hasClientSecret: !!clientSecret,
        hasRedirectUri: !!redirectUri,
      });
      return NextResponse.redirect(
        new URL('/?error=oauth_config_missing', request.url)
      );
    }

    // Exchange authorization code for access token
    const tokenUrl = 'https://services.leadconnectorhq.com/oauth/token';
    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json().catch(() => ({ message: 'Unknown error' }));
      console.error('Token exchange failed:', errorData);
      return NextResponse.redirect(
        new URL(`/?error=token_exchange_failed&message=${encodeURIComponent(errorData.message || 'Unknown error')}`, request.url)
      );
    }

    const tokenData = await tokenResponse.json();

    // Get location/user info to determine location_id
    let locationId: string | null = null;
    try {
      const userInfoUrl = 'https://services.leadconnectorhq.com/oauth/userinfo';
      const userInfoResponse = await fetch(userInfoUrl, {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Accept': 'application/json',
        },
      });

      if (userInfoResponse.ok) {
        const userInfo = await userInfoResponse.json();
        locationId = userInfo.locationId || userInfo.location?.id || null;
        
        if (locationId) {
          console.log(`✅ Retrieved location ID: ${locationId}`);
        } else {
          console.warn('⚠️ No location ID found in user info');
        }
      }
    } catch (userInfoError) {
      console.warn('Failed to fetch user info:', userInfoError);
    }

    // If no location ID from userinfo, try to get from token response
    if (!locationId && tokenData.locationId) {
      locationId = tokenData.locationId;
    }

    // Store tokens keyed by location_id in 'ghl_tokens' collection
    if (locationId) {
      await storeTokens(locationId, {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_in: tokenData.expires_in,
        token_type: tokenData.token_type,
        scope: tokenData.scope,
      });
      console.log(`✅ Stored tokens for location: ${locationId}`);
    } else {
      console.error('❌ Cannot store tokens: location ID not found');
      return NextResponse.redirect(
        new URL('/?error=no_location_id', request.url)
      );
    }

    // Redirect to success page
    return NextResponse.redirect(
      new URL('/?oauth_success=true', request.url)
    );
  } catch (error) {
    console.error('OAuth callback error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.redirect(
      new URL(`/?error=oauth_error&message=${encodeURIComponent(errorMessage)}`, request.url)
    );
  }
}

