/**
 * Firebase Storage Utilities
 * 
 * Handles file uploads (avatars, images, etc.)
 */

import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { getStorage } from 'firebase/storage';
import { getApps } from 'firebase/app';

let storageInstance: ReturnType<typeof getStorage> | null = null;

/**
 * Get Firebase Storage instance
 */
function getStorageInstance() {
  if (storageInstance) {
    return storageInstance;
  }
  
  // Get Firebase app (same as firebase.ts)
  const apps = getApps();
  if (apps.length === 0) {
    throw new Error('Firebase app not initialized. Call initializeFirebase() first.');
  }
  
  storageInstance = getStorage(apps[0]);
  return storageInstance;
}

/**
 * Upload avatar image
 */
export async function uploadAvatar(
  userId: string,
  file: File
): Promise<string> {
  const storage = getStorageInstance();
  
  // Validate file type
  if (!file.type.startsWith('image/')) {
    throw new Error('File must be an image');
  }
  
  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    throw new Error('Image size must be less than 5MB');
  }
  
  // Create storage reference
  const timestamp = Date.now();
  const fileName = `avatar_${timestamp}_${file.name}`;
  const storageRef = ref(storage, `avatars/${userId}/${fileName}`);
  
  // Upload file
  const snapshot = await uploadBytes(storageRef, file);
  
  // Get download URL
  const downloadURL = await getDownloadURL(snapshot.ref);
  
  return downloadURL;
}

/**
 * Upload image to chat
 */
export async function uploadChatImage(
  chatId: string,
  file: File
): Promise<string> {
  const storage = getStorageInstance();
  
  if (!file.type.startsWith('image/')) {
    throw new Error('File must be an image');
  }
  
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    throw new Error('Image size must be less than 10MB');
  }
  
  const timestamp = Date.now();
  const fileName = `image_${timestamp}_${file.name}`;
  const storageRef = ref(storage, `chats/${chatId}/${fileName}`);
  
  const snapshot = await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(snapshot.ref);
  
  return downloadURL;
}

/**
 * Upload video to chat (uses Bunny Stream for transcoding)
 */
export async function uploadChatVideo(
  chatId: string,
  file: File,
  userId?: string
): Promise<{ 
  guid: string; 
  urls: {
    hls: string;
    mp4: Record<string, string>;
    thumbnail: string;
    playbackUrl: string;
  };
  status: string;
  thumbnail: string;
}> {
  // Validate file type
  const validTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
  if (!validTypes.some(type => file.type.startsWith(type))) {
    throw new Error('File must be a video (MP4, WebM, MOV, or AVI)');
  }

  // Validate file size (max 500MB)
  const maxSize = 500 * 1024 * 1024; // 500MB
  if (file.size > maxSize) {
    throw new Error('Video size must be less than 500MB');
  }

  // Upload to Bunny Stream via API
  const formData = new FormData();
  formData.append('video', file);
  formData.append('chatId', chatId);
  if (userId) {
    formData.append('userId', userId);
  }
  formData.append('title', `chat-video-${chatId}-${Date.now()}`);

  const response = await fetch('/api/media/upload-video', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to upload video');
  }

  const result = await response.json();
  return {
    guid: result.guid,
    urls: result.urls,
    status: result.status,
    thumbnail: result.urls.thumbnail,
  };
}

/**
 * Check video encoding status
 */
export async function checkVideoStatus(guid: string): Promise<{
  success: boolean;
  guid: string;
  status: string;
  statusCode: number;
  ready: boolean;
  encodeProgress: number;
  urls: {
    hls: string;
    mp4: Record<string, string>;
    thumbnail: string;
    playbackUrl: string;
  };
  metadata: {
    title: string;
    width: number;
    height: number;
    length: number;
    availableResolutions: string;
    storageSize: number;
    dateUploaded: string;
  };
}> {
  const response = await fetch(`/api/media/video-status?guid=${guid}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to check video status');
  }

  return response.json();
}

/**
 * Set video thumbnail from timestamp
 */
export async function setVideoThumbnail(
  guid: string,
  thumbnailTime: number
): Promise<void> {
  const formData = new FormData();
  formData.append('guid', guid);
  formData.append('thumbnailTime', thumbnailTime.toString());

  const response = await fetch('/api/media/set-thumbnail', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to set thumbnail');
  }
}

/**
 * Upload custom thumbnail for video
 */
export async function uploadVideoThumbnail(
  guid: string,
  thumbnailFile: File
): Promise<void> {
  const formData = new FormData();
  formData.append('guid', guid);
  formData.append('thumbnail', thumbnailFile);

  const response = await fetch('/api/media/set-thumbnail', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to upload thumbnail');
  }
}

/**
 * Delete file from storage
 */
export async function deleteFile(url: string): Promise<void> {
  const storage = getStorageInstance();
  const storageRef = ref(storage, url);
  await deleteObject(storageRef);
}

/**
 * Compress image before upload
 */
export function compressImage(file: File, maxWidth: number = 800, quality: number = 0.8): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Calculate new dimensions
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }
            
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            
            resolve(compressedFile);
          },
          file.type,
          quality
        );
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      
      if (e.target?.result) {
        img.src = e.target.result as string;
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

