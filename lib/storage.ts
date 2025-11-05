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

