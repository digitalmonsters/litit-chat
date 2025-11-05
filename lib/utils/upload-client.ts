/**
 * Client-side Upload Utility
 * 
 * Provides functions for uploading files from the browser to Bunny CDN
 * via the Next.js /api/upload endpoint.
 */

export interface UploadOptions {
  folder?: string;
  filename?: string;
  onProgress?: (progress: number) => void;
}

export interface UploadResult {
  success: boolean;
  url?: string;
  filename?: string;
  folder?: string;
  size?: number;
  type?: string;
  error?: string;
}

/**
 * Upload a file to Bunny CDN via the API
 * 
 * @param file - The file to upload
 * @param options - Upload options (folder, filename, onProgress callback)
 * @returns Promise<UploadResult>
 * 
 * @example
 * ```typescript
 * const result = await uploadFile(file, {
 *   folder: 'uploads/avatars',
 *   onProgress: (progress) => console.log(`${progress}%`)
 * });
 * 
 * if (result.success) {
 *   console.log('Uploaded:', result.url);
 * }
 * ```
 */
export async function uploadFile(
  file: File,
  options: UploadOptions = {}
): Promise<UploadResult> {
  const { folder = 'uploads/messages', filename, onProgress } = options;

  try {
    // Create form data
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);
    if (filename) {
      formData.append('filename', filename);
    }

    // Upload with XMLHttpRequest for progress tracking
    if (onProgress) {
      return await uploadWithProgress(formData, onProgress);
    }

    // Upload with fetch (no progress tracking)
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || `Upload failed with status ${response.status}`,
      };
    }

    return result;
  } catch (error) {
    console.error('[Upload Client] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

/**
 * Upload with progress tracking using XMLHttpRequest
 */
function uploadWithProgress(
  formData: FormData,
  onProgress: (progress: number) => void
): Promise<UploadResult> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();

    // Track upload progress
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const progress = Math.round((event.loaded / event.total) * 100);
        onProgress(progress);
      }
    });

    // Handle completion
    xhr.addEventListener('load', () => {
      try {
        const result = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(result);
        } else {
          resolve({
            success: false,
            error: result.error || `Upload failed with status ${xhr.status}`,
          });
        }
      } catch (error) {
        resolve({
          success: false,
          error: 'Failed to parse server response',
        });
      }
    });

    // Handle errors
    xhr.addEventListener('error', () => {
      resolve({
        success: false,
        error: 'Network error occurred during upload',
      });
    });

    xhr.addEventListener('abort', () => {
      resolve({
        success: false,
        error: 'Upload was aborted',
      });
    });

    // Send request
    xhr.open('POST', '/api/upload');
    xhr.send(formData);
  });
}

/**
 * Upload multiple files sequentially
 * 
 * @param files - Array of files to upload
 * @param options - Upload options (applied to all files)
 * @returns Promise<UploadResult[]>
 */
export async function uploadMultipleFiles(
  files: File[],
  options: UploadOptions = {}
): Promise<UploadResult[]> {
  const results: UploadResult[] = [];

  for (const file of files) {
    const result = await uploadFile(file, options);
    results.push(result);
  }

  return results;
}

/**
 * Validate file before upload
 * 
 * @param file - File to validate
 * @param maxSizeMB - Maximum file size in MB (default: 100)
 * @returns Validation result with error message if invalid
 */
export function validateFileBeforeUpload(
  file: File,
  maxSizeMB: number = 100
): { valid: boolean; error?: string } {
  // Check file size
  const maxBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxBytes) {
    return {
      valid: false,
      error: `File size (${(file.size / (1024 * 1024)).toFixed(2)} MB) exceeds maximum of ${maxSizeMB} MB`,
    };
  }

  // Check MIME type
  const allowedTypes = ['image/', 'video/', 'audio/'];
  const isValidType = allowedTypes.some(type => file.type.startsWith(type));
  
  if (!isValidType) {
    return {
      valid: false,
      error: `File type "${file.type}" is not allowed. Only image, video, and audio files are accepted.`,
    };
  }

  return { valid: true };
}

/**
 * Get file preview URL (for images)
 * 
 * @param file - File to preview
 * @returns Promise<string> - Data URL for preview
 */
export function getFilePreview(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('File is not an image'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        resolve(e.target.result as string);
      } else {
        reject(new Error('Failed to read file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Format file size to human-readable string
 * 
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "2.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
