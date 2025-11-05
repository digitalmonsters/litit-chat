import { NextRequest, NextResponse } from 'next/server';
import {
  uploadToBunny,
  validateFileSize,
  validateMimeType,
  generateUniqueFilename,
} from '@/lib/utils/bunny';

/**
 * POST /api/upload
 * 
 * Upload a file to Bunny CDN Storage
 * 
 * Form Data:
 * - file: File (required) - The file to upload
 * - folder: string (optional) - Target folder (default: "uploads/messages")
 * - filename: string (optional) - Custom filename (default: auto-generated with timestamp)
 * 
 * Returns:
 * {
 *   success: true,
 *   url: string,
 *   filename: string,
 *   folder: string,
 *   size: number,
 *   type: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'uploads/messages';
    let filename = formData.get('filename') as string | null;

    // Validate file presence
    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: 'No file provided. Please upload a file.',
        },
        { status: 400 }
      );
    }

    // Validate file size (max 100 MB)
    if (!validateFileSize(file.size, 100)) {
      return NextResponse.json(
        {
          success: false,
          error: 'File size exceeds the maximum allowed size of 100 MB.',
          maxSize: '100 MB',
          fileSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        },
        { status: 400 }
      );
    }

    // Validate MIME type (image/*, video/*, audio/*)
    if (!validateMimeType(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid file type. Only image, video, and audio files are allowed.',
          fileType: file.type,
          allowedTypes: ['image/*', 'video/*', 'audio/*'],
        },
        { status: 400 }
      );
    }

    // Generate filename if not provided
    if (!filename) {
      filename = generateUniqueFilename(file.name);
    } else {
      // Sanitize provided filename
      filename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Bunny CDN
    console.log(`[Upload API] Uploading ${filename} to ${folder} (${file.type}, ${file.size} bytes)`);
    
    const result = await uploadToBunny(
      buffer,
      filename,
      folder,
      file.type || 'application/octet-stream'
    );

    if (!result.success) {
      console.error('[Upload API] Upload failed:', result.error);
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Upload failed',
        },
        { status: 500 }
      );
    }

    console.log('[Upload API] ✅ Upload successful:', result.url);

    return NextResponse.json(
      {
        success: true,
        url: result.url,
        filename,
        folder,
        size: file.size,
        type: file.type,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Upload API] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to upload file',
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/upload
 * 
 * Get upload configuration and limits
 */
export async function GET() {
  return NextResponse.json(
    {
      success: true,
      config: {
        maxFileSize: '100 MB',
        maxFileSizeBytes: 100 * 1024 * 1024,
        allowedTypes: ['image/*', 'video/*', 'audio/*'],
        defaultFolder: 'uploads/messages',
        cdnUrl: process.env.BUNNY_CDN_URL || 'https://litit-chat-cdn.b-cdn.net',
      },
    },
    { status: 200 }
  );
}
