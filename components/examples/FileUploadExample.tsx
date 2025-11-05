'use client';

import { useState, useRef } from 'react';
import {
  uploadFile,
  validateFileBeforeUpload,
  formatFileSize,
  type UploadResult,
} from '@/lib/utils/upload-client';

/**
 * Example File Upload Component
 * 
 * Demonstrates how to use the Bunny CDN upload utilities in a React component
 * with progress tracking, validation, and error handling.
 */
export default function FileUploadExample() {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset state
    setError(null);
    setUploadResult(null);
    setUploadProgress(0);

    // Validate file before upload
    const validation = validateFileBeforeUpload(file, 100);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    try {
      setIsUploading(true);

      // Upload with progress tracking
      const result = await uploadFile(file, {
        folder: 'uploads/messages',
        onProgress: (progress) => {
          setUploadProgress(progress);
        },
      });

      if (result.success) {
        setUploadResult(result);
        console.log('Upload successful:', result.url);
        
        // Here you could save the URL to Firestore
        // await saveToFirestore(result.url);
      } else {
        setError(result.error || 'Upload failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const resetUpload = () => {
    setUploadResult(null);
    setError(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">File Upload Example</h2>
      
      {/* File Input */}
      <div className="mb-4">
        <label
          htmlFor="file-upload"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Choose a file to upload
        </label>
        <input
          ref={fileInputRef}
          id="file-upload"
          type="file"
          accept="image/*,video/*,audio/*"
          onChange={handleFileSelect}
          disabled={isUploading}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-violet-50 file:text-violet-700
            hover:file:bg-violet-100
            disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <p className="mt-1 text-xs text-gray-500">
          Accepted: Images, Videos, Audio (max 100 MB)
        </p>
      </div>

      {/* Progress Bar */}
      {isUploading && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-gray-700">Uploading...</span>
            <span className="text-sm font-medium text-gray-700">{uploadProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-violet-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Upload Error</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Success Result */}
      {uploadResult?.success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-green-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-green-800">Upload Successful!</h3>
              <div className="mt-2 text-sm text-green-700 space-y-1">
                <p>
                  <strong>File:</strong> {uploadResult.filename}
                </p>
                <p>
                  <strong>Size:</strong> {formatFileSize(uploadResult.size || 0)}
                </p>
                <p>
                  <strong>Type:</strong> {uploadResult.type}
                </p>
                <p className="break-all">
                  <strong>URL:</strong>{' '}
                  <a
                    href={uploadResult.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-violet-600 hover:text-violet-800 underline"
                  >
                    {uploadResult.url}
                  </a>
                </p>
              </div>
              
              {/* Preview for images */}
              {uploadResult.type?.startsWith('image/') && (
                <div className="mt-3">
                  <img
                    src={uploadResult.url}
                    alt="Uploaded file"
                    className="max-w-full h-auto rounded-md border border-gray-200"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reset Button */}
      {(uploadResult || error) && (
        <button
          onClick={resetUpload}
          className="w-full py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-md transition-colors"
        >
          Upload Another File
        </button>
      )}
    </div>
  );
}
