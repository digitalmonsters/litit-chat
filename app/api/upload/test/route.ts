import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/upload/test
 * 
 * Test endpoint to verify Bunny CDN upload configuration
 */
export async function GET(request: NextRequest) {
  const envVars = {
    BUNNY_STORAGE_ZONE: process.env.BUNNY_STORAGE_ZONE,
    BUNNY_STORAGE_KEY: process.env.BUNNY_STORAGE_KEY ? '✓ Set' : '✗ Not set',
    BUNNY_STORAGE_REGION: process.env.BUNNY_STORAGE_REGION,
    BUNNY_CDN_URL: process.env.BUNNY_CDN_URL,
  };

  const allConfigured = 
    process.env.BUNNY_STORAGE_ZONE &&
    process.env.BUNNY_STORAGE_KEY &&
    process.env.BUNNY_STORAGE_REGION &&
    process.env.BUNNY_CDN_URL;

  return NextResponse.json({
    success: true,
    message: allConfigured 
      ? '✅ Bunny CDN is properly configured'
      : '⚠️ Some Bunny CDN environment variables are missing',
    configured: allConfigured,
    environment: envVars,
    endpoints: {
      upload: '/api/upload',
      config: '/api/upload (GET)',
      storageUrl: `https://storage.bunnycdn.com/${envVars.BUNNY_STORAGE_ZONE}`,
      cdnUrl: envVars.BUNNY_CDN_URL,
    },
  });
}
