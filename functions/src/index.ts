/**
 * Cloud Functions for Firechat
 * 
 * Auto-creates Firestore user document when Firebase Auth user is created
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp();

/**
 * Create Firestore user document when Firebase Auth user is created
 */
async function createUserDocument(user: admin.auth.UserRecord): Promise<void> {
  const { uid, email, displayName, photoURL, phoneNumber } = user;
  
  // Get user data from custom claims or metadata
  const emailVerified = user.emailVerified || false;
  const providerData = user.providerData || [];
  
  // Determine provider from providerData
  let provider: string = 'email';
  if (providerData.length > 0) {
    const providerId = providerData[0].providerId || '';
    if (providerId.includes('google')) {
      provider = 'google';
    } else if (providerId.includes('facebook')) {
      provider = 'facebook';
    } else if (providerId.includes('apple')) {
      provider = 'apple';
    } else if (providerId.includes('phone')) {
      provider = 'phone';
    } else if (providerId.includes('anonymous')) {
      provider = 'anonymous';
    }
  }
  
  // Create user document in Firestore
  const userData = {
    id: uid,
    email: email || '',
    displayName: displayName || email?.split('@')[0] || 'User',
    photoURL: photoURL || null,
    phone: phoneNumber || null,
    status: 'offline',
    audioCallEnabled: true,
    stars: 0,
    tier: 'free',
    provider: provider as 'google' | 'apple' | 'facebook' | 'phone' | 'email' | 'anonymous',
    verified: emailVerified,
    fcmToken: null, // Will be set when user grants notification permission
    lastLogin: admin.firestore.FieldValue.serverTimestamp(),
    lastSeen: admin.firestore.FieldValue.serverTimestamp(),
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
  
  // Write to Firestore
  await admin.firestore().collection('users').doc(uid).set(userData);
  
  // Create wallet for user
  const walletData = {
    id: uid,
    userId: uid,
    stars: 0,
    usd: 0,
    totalEarned: 0,
    totalSpent: 0,
    totalUsdSpent: 0,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    lastActivityAt: admin.firestore.FieldValue.serverTimestamp(),
  };
  
  await admin.firestore().collection('wallets').doc(uid).set(walletData);
  
  console.log(`✅ Created Firestore user document for ${uid} (${email || phoneNumber || 'anonymous'})`);
}

/**
 * Cloud Function: Create Firestore user document when Firebase Auth user is created
 */
export const onCreateUser = functions.auth.user().onCreate(async (user) => {
  try {
    await createUserDocument(user);
    return null;
  } catch (error) {
    console.error(`❌ Error creating user document for ${user.uid}:`, error);
    throw error;
  }
});

/**
 * Update user lastLogin timestamp when user signs in
 * Note: beforeSignIn requires Firebase Auth Blaze plan
 * For Spark plan, use onUserSignIn with HTTP trigger or handle client-side
 */
export const onUserSignIn = functions.auth.user().beforeSignIn(async (user, context) => {
  try {
    const userRef = admin.firestore().collection('users').doc(user.uid);
    
    // Check if user document exists
    const userDoc = await userRef.get();
    
    if (userDoc.exists) {
      // Update lastLogin timestamp
      await userRef.update({
        lastLogin: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      
      console.log(`✅ Updated lastLogin for user ${user.uid}`);
    } else {
      // If user document doesn't exist, create it (fallback)
      console.log(`⚠️ User document not found for ${user.uid}, creating...`);
      await createUserDocument(user);
    }
    
    return null;
  } catch (error) {
    console.error(`❌ Error updating lastLogin for ${user.uid}:`, error);
    // Don't throw - we don't want to block sign-in
    return null;
  }
});
