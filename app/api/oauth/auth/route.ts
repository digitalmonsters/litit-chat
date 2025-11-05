import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/oauth/auth
 * 
 * Initiates OAuth flow with GoHighLevel
 * Redirects user to GHL authorization page
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_request: NextRequest) {
  try {
    // Get OAuth configuration from environment
    const clientId = process.env.GHL_CLIENT_ID;
    const redirectUri = process.env.GHL_REDIRECT_URI;

    if (!clientId || !redirectUri) {
      return NextResponse.json(
        {
          error: 'OAuth configuration missing',
          message: 'GHL_CLIENT_ID and GHL_REDIRECT_URI must be set in environment variables',
        },
        { status: 500 }
      );
    }

    // Validate redirect URI doesn't contain "ghl" (GHL requirement)
    if (redirectUri.includes('/ghl')) {
      return NextResponse.json(
        {
          error: 'Invalid redirect URI',
          message: 'GoHighLevel does not allow "ghl" in redirect URIs. Use /api/oauth/callback instead.',
        },
        { status: 400 }
      );
    }

    // Build authorization URL
    const authUrl = new URL('https://marketplace.gohighlevel.com/oauth/chooselocation');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'contacts.readonly contacts.write conversations.readonly conversations.write locations.readonly');
    
    // Optional: Add state parameter for CSRF protection
    const state = crypto.randomUUID();
    authUrl.searchParams.set('state', state);

    // Redirect to GHL authorization page
    return NextResponse.redirect(authUrl.toString());
  } catch (error) {
    console.error('OAuth initiation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'Failed to initiate OAuth flow',
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}

