/**
 * Push Notifications Module
 * Handles Firebase Cloud Messaging notifications
 */

import { getFirestoreInstance, COLLECTIONS } from './firebase';
import { doc, getDoc } from 'firebase/firestore';

export async function sendMessageNotification(
  chatId: string,
  senderId: string,
  senderName: string,
  content: string,
  type: 'text' | 'image' | 'video' | 'audio' | 'file'
) {
  try {
    // Get chat participants
    const db = getFirestoreInstance();
    const chatRef = doc(db, COLLECTIONS.CHATS, chatId);
    const chatSnap = await getDoc(chatRef);
    
    if (!chatSnap.exists()) {
      console.warn('Chat not found for notification:', chatId);
      return;
    }
    
    const chatData = chatSnap.data();
    const participantIds = chatData.participantIds || [];
    
    // Get FCM tokens for all participants except sender
    const recipientIds = participantIds.filter((id: string) => id !== senderId);
    
    for (const recipientId of recipientIds) {
      const userRef = doc(db, COLLECTIONS.USERS, recipientId);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) continue;
      
      const userData = userSnap.data();
      const fcmToken = userData.fcmToken;
      
      if (!fcmToken) {
        console.log('No FCM token for user:', recipientId);
        continue;
      }
      
      // Send notification via FCM (would be handled by Cloud Functions in production)
      console.log('Would send FCM notification to:', {
        token: fcmToken,
        title: senderName,
        body: type === 'text' ? content : `Sent a ${type}`,
        data: { chatId, senderId, type }
      });
    }
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
}
