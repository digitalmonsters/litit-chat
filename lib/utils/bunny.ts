/**
 * Bunny CDN Upload Utility
 * 
 * Provides reusable functions for uploading files to Bunny Storage
 * with retry logic and error handling.
 */

interface BunnyUploadOptions {
  folder?: string;
  filename?: string;
  contentType?: string;
  maxRetries?: number;
}

interface BunnyUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

const BUNNY_STORAGE_ZONE = process.env.BUNNY_STORAGE_ZONE || 'litit-chat-images';
const BUNNY_STORAGE_KEY = process.env.BUNNY_STORAGE_KEY;
const BUNNY_STORAGE_REGION = process.env.BUNNY_STORAGE_REGION || 'la';
const BUNNY_CDN_URL = process.env.BUNNY_CDN_URL || 'https://litit-chat-cdn.b-cdn.net';

/**
 * Sleep utility for retry delays
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Upload a file buffer to Bunny Storage with retry logic
 * 
 * @param buffer - File buffer to upload
 * @param filename - Target filename (e.g., "image.jpg")
 * @param folder - Target folder path (default: "uploads/messages")
 * @param contentType - MIME type of the file (default: "application/octet-stream")
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @returns Promise<BunnyUploadResult>
 */
export async function uploadToBunny(
  buffer: Buffer | ArrayBuffer,
  filename: string,
  folder: string = 'uploads/messages',
  contentType: string = 'application/octet-stream',
  maxRetries: number = 3
): Promise<BunnyUploadResult> {
  if (!BUNNY_STORAGE_KEY) {
    return {
      success: false,
      error: 'BUNNY_STORAGE_KEY is not configured',
    };
  }

  // Sanitize folder and filename
  const sanitizedFolder = folder.replace(/^\/+|\/+$/g, '');
  const sanitizedFilename = filename.replace(/^\/+/, '');
  const filePath = `${sanitizedFolder}/${sanitizedFilename}`;

  // Construct Bunny Storage API URL
  const storageUrl = `https://storage.bunnycdn.com/${BUNNY_STORAGE_ZONE}/${filePath}`;
  
  let lastError: Error | null = null;

  // Retry loop
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[Bunny Upload] Attempt ${attempt}/${maxRetries}: ${filePath}`);

      const response = await fetch(storageUrl, {
        method: 'PUT',
        headers: {
          'AccessKey': BUNNY_STORAGE_KEY,
          'Content-Type': contentType,
        },
        body: buffer as any, // Buffer is compatible with BodyInit
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Bunny Storage upload failed: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      // Success! Return CDN URL
      const cdnUrl = `${BUNNY_CDN_URL}/${filePath}`;
      console.log(`[Bunny Upload] ✅ Success: ${cdnUrl}`);

      return {
        success: true,
        url: cdnUrl,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`[Bunny Upload] ❌ Attempt ${attempt} failed:`, lastError.message);

      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries) {
        const delayMs = Math.pow(2, attempt) * 500; // 1s, 2s, 4s
        console.log(`[Bunny Upload] Retrying in ${delayMs}ms...`);
        await sleep(delayMs);
      }
    }
  }

  // All retries failed
  return {
    success: false,
    error: lastError?.message || 'Upload failed after all retry attempts',
  };
}

/**
 * Delete a file from Bunny Storage
 * 
 * @param filePath - Full path to file (e.g., "uploads/messages/image.jpg")
 * @returns Promise<boolean> - true if deleted successfully
 */
export async function deleteFromBunny(filePath: string): Promise<boolean> {
  if (!BUNNY_STORAGE_KEY) {
    console.error('[Bunny Delete] BUNNY_STORAGE_KEY is not configured');
    return false;
  }

  const sanitizedPath = filePath.replace(/^\/+/, '');
  const storageUrl = `https://storage.bunnycdn.com/${BUNNY_STORAGE_ZONE}/${sanitizedPath}`;

  try {
    const response = await fetch(storageUrl, {
      method: 'DELETE',
      headers: {
        'AccessKey': BUNNY_STORAGE_KEY,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `[Bunny Delete] Failed: ${response.status} ${response.statusText} - ${errorText}`
      );
      return false;
    }

    console.log(`[Bunny Delete] ✅ Deleted: ${filePath}`);
    return true;
  } catch (error) {
    console.error('[Bunny Delete] Error:', error);
    return false;
  }
}

/**
 * Get the CDN URL for a file
 * 
 * @param filePath - Full path to file (e.g., "uploads/messages/image.jpg")
 * @returns CDN URL
 */
export function getBunnyCdnUrl(filePath: string): string {
  const sanitizedPath = filePath.replace(/^\/+/, '');
  return `${BUNNY_CDN_URL}/${sanitizedPath}`;
}

/**
 * Validate file size
 * 
 * @param size - File size in bytes
 * @param maxSizeMB - Maximum allowed size in megabytes
 * @returns true if valid
 */
export function validateFileSize(size: number, maxSizeMB: number = 100): boolean {
  const maxBytes = maxSizeMB * 1024 * 1024;
  return size <= maxBytes;
}

/**
 * Validate MIME type
 * 
 * @param mimeType - File MIME type
 * @param allowedTypes - Array of allowed MIME type patterns (supports wildcards)
 * @returns true if valid
 */
export function validateMimeType(
  mimeType: string,
  allowedTypes: string[] = ['image/*', 'video/*', 'audio/*']
): boolean {
  return allowedTypes.some(pattern => {
    if (pattern.endsWith('/*')) {
      const prefix = pattern.slice(0, -2);
      return mimeType.startsWith(prefix + '/');
    }
    return mimeType === pattern;
  });
}

/**
 * Generate a unique filename with timestamp
 * 
 * @param originalName - Original filename
 * @returns Timestamped filename
 */
export function generateUniqueFilename(originalName: string): string {
  const timestamp = Date.now();
  const extension = originalName.split('.').pop() || '';
  const baseName = originalName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
  return `${timestamp}_${baseName}.${extension}`;
}
