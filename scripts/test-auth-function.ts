/**
 * Test Auth → Firestore User Creation Function
 * 
 * Tests that the Cloud Function creates a Firestore user document
 * when a Firebase Auth user is created.
 * 
 * Usage:
 *   npm install -D tsx firebase-admin
 *   npx tsx scripts/test-auth-function.ts
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Initialize Firebase Admin
if (!getApps().length) {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
  
  if (!serviceAccount) {
    console.error('❌ FIREBASE_SERVICE_ACCOUNT not found in environment variables');
    process.exit(1);
  }

  try {
    const serviceAccountKey = JSON.parse(serviceAccount);
    initializeApp({
      credential: cert(serviceAccountKey),
    });
  } catch (error) {
    console.error('❌ Failed to parse FIREBASE_SERVICE_ACCOUNT:', error);
    process.exit(1);
  }
}

const auth = getAuth();
const db = getFirestore();

/**
 * Create a test user and verify Firestore document is created
 */
async function testUserCreation() {
  console.log('🧪 Testing Auth → Firestore user creation...\n');
  
  const testEmail = `test-${Date.now()}@lit.it`;
  const testPassword = 'TestPassword123!';
  
  try {
    // Step 1: Create Firebase Auth user
    console.log('1️⃣ Creating Firebase Auth user...');
    const userRecord = await auth.createUser({
      email: testEmail,
      password: testPassword,
      displayName: 'Test User',
      emailVerified: false,
    });
    
    console.log(`   ✅ Auth user created: ${userRecord.uid}`);
    console.log(`   📧 Email: ${userRecord.email}`);
    
    // Step 2: Wait a moment for Cloud Function to trigger
    console.log('\n2️⃣ Waiting for Cloud Function to trigger (5 seconds)...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Step 3: Check Firestore user document
    console.log('\n3️⃣ Checking Firestore user document...');
    const userDoc = await db.collection('users').doc(userRecord.uid).get();
    
    if (!userDoc.exists) {
      console.error('   ❌ User document not found in Firestore!');
      console.error('   💡 Check Cloud Function logs: firebase functions:log');
      
      // Cleanup
      await auth.deleteUser(userRecord.uid);
      process.exit(1);
    }
    
    const userData = userDoc.data();
    console.log('   ✅ User document found!');
    console.log(`   📋 Data:`, {
      id: userData?.id,
      email: userData?.email,
      displayName: userData?.displayName,
      tier: userData?.tier,
      stars: userData?.stars,
      provider: userData?.provider,
    });
    
    // Verify required fields
    const requiredFields = ['id', 'email', 'displayName', 'tier', 'stars', 'createdAt'];
    const missingFields = requiredFields.filter(field => !(field in userData!));
    
    if (missingFields.length > 0) {
      console.error(`   ❌ Missing required fields: ${missingFields.join(', ')}`);
      await auth.deleteUser(userRecord.uid);
      process.exit(1);
    }
    
    // Step 4: Check wallet document
    console.log('\n4️⃣ Checking Firestore wallet document...');
    const walletDoc = await db.collection('wallets').doc(userRecord.uid).get();
    
    if (!walletDoc.exists) {
      console.error('   ❌ Wallet document not found in Firestore!');
      await auth.deleteUser(userRecord.uid);
      process.exit(1);
    }
    
    const walletData = walletDoc.data();
    console.log('   ✅ Wallet document found!');
    console.log(`   📋 Data:`, {
      id: walletData?.id,
      userId: walletData?.userId,
      stars: walletData?.stars,
      usd: walletData?.usd,
    });
    
    // Step 5: Test sign-in update
    console.log('\n5️⃣ Testing sign-in update...');
    await auth.updateUser(userRecord.uid, {
      emailVerified: true,
    });
    
    // Wait for function
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const updatedUserDoc = await db.collection('users').doc(userRecord.uid).get();
    const updatedUserData = updatedUserDoc.data();
    
    if (!updatedUserData?.lastLogin) {
      console.warn('   ⚠️  lastLogin not updated (this is expected if beforeSignIn hook is not deployed)');
    } else {
      console.log('   ✅ lastLogin updated!');
    }
    
    // Step 6: Cleanup
    console.log('\n6️⃣ Cleaning up test user...');
    await auth.deleteUser(userRecord.uid);
    await db.collection('users').doc(userRecord.uid).delete();
    await db.collection('wallets').doc(userRecord.uid).delete();
    console.log('   ✅ Test user deleted');
    
    console.log('\n✅ All tests passed!');
    console.log('\n📊 Summary:');
    console.log('   ✅ Firebase Auth user created');
    console.log('   ✅ Firestore user document auto-created');
    console.log('   ✅ Firestore wallet document auto-created');
    console.log('   ✅ Required fields present');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    
    // Try to cleanup on error
    try {
      const users = await auth.listUsers();
      const testUser = users.users.find(u => u.email === testEmail);
      if (testUser) {
        await auth.deleteUser(testUser.uid);
        await db.collection('users').doc(testUser.uid).delete().catch(() => {});
        await db.collection('wallets').doc(testUser.uid).delete().catch(() => {});
      }
    } catch (cleanupError) {
      console.error('Error during cleanup:', cleanupError);
    }
    
    process.exit(1);
  }
}

// Run test
testUserCreation();

