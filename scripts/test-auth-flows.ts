/**
 * Test Auth Flows Script
 * 
 * Tests Google, Apple, Phone, and Email login flows
 * Verifies users/{uid} document creation in Firestore
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, OAuthProvider, signInWithEmailLink } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

// Initialize Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

interface TestResult {
  method: string;
  success: boolean;
  userId?: string;
  userDocExists?: boolean;
  error?: string;
}

/**
 * Verify user document exists in Firestore
 */
async function verifyUserDocument(userId: string): Promise<boolean> {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    return userSnap.exists();
  } catch (error) {
    console.error('Error verifying user document:', error);
    return false;
  }
}

/**
 * Test Google Sign-In
 */
async function testGoogleSignIn(): Promise<TestResult> {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const userId = result.user.uid;
    
    // Wait a bit for Firestore document creation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const docExists = await verifyUserDocument(userId);
    
    return {
      method: 'Google',
      success: true,
      userId,
      userDocExists: docExists,
    };
  } catch (error) {
    return {
      method: 'Google',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Test Apple Sign-In
 */
async function testAppleSignIn(): Promise<TestResult> {
  try {
    const provider = new OAuthProvider('apple.com');
    const result = await signInWithPopup(auth, provider);
    const userId = result.user.uid;
    
    // Wait a bit for Firestore document creation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const docExists = await verifyUserDocument(userId);
    
    return {
      method: 'Apple',
      success: true,
      userId,
      userDocExists: docExists,
    };
  } catch (error) {
    return {
      method: 'Apple',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Test Email/Magic Link Sign-In
 */
async function testEmailSignIn(email: string, emailLink: string): Promise<TestResult> {
  try {
    const result = await signInWithEmailLink(auth, email, emailLink);
    const userId = result.user.uid;
    
    // Wait a bit for Firestore document creation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const docExists = await verifyUserDocument(userId);
    
    return {
      method: 'Email (Magic Link)',
      success: true,
      userId,
      userDocExists: docExists,
    };
  } catch (error) {
    return {
      method: 'Email (Magic Link)',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Main test function
 */
async function runTests() {
  console.log('🧪 Testing Auth Flows...\n');

  const results: TestResult[] = [];

  // Test Google Sign-In
  console.log('1️⃣  Testing Google Sign-In...');
  const googleResult = await testGoogleSignIn();
  results.push(googleResult);
  console.log(`   ${googleResult.success ? '✅' : '❌'} ${googleResult.method}`);
  if (googleResult.success) {
    console.log(`      User ID: ${googleResult.userId}`);
    console.log(`      Document exists: ${googleResult.userDocExists ? '✅' : '❌'}`);
  } else {
    console.log(`      Error: ${googleResult.error}`);
  }
  console.log('');

  // Test Apple Sign-In
  console.log('2️⃣  Testing Apple Sign-In...');
  const appleResult = await testAppleSignIn();
  results.push(appleResult);
  console.log(`   ${appleResult.success ? '✅' : '❌'} ${appleResult.method}`);
  if (appleResult.success) {
    console.log(`      User ID: ${appleResult.userId}`);
    console.log(`      Document exists: ${appleResult.userDocExists ? '✅' : '❌'}`);
  } else {
    console.log(`      Error: ${appleResult.error}`);
  }
  console.log('');

  // Phone and Email tests require user interaction
  console.log('3️⃣  Phone Sign-In: Requires manual testing');
  console.log('   📱 Test via UI: /auth/login → "Continue with Phone"');
  console.log('');

  console.log('4️⃣  Email/Magic Link: Requires manual testing');
  console.log('   📧 Test via UI: /auth/login → Enter email → Check inbox');
  console.log('');

  // Summary
  console.log('📊 Test Summary:');
  const successful = results.filter(r => r.success).length;
  const withDocs = results.filter(r => r.userDocExists).length;
  console.log(`   Total tests: ${results.length}`);
  console.log(`   Successful: ${successful}/${results.length}`);
  console.log(`   Documents created: ${withDocs}/${successful}`);
  console.log('');

  // Exit with error code if any test failed
  if (results.some(r => !r.success || !r.userDocExists)) {
    process.exit(1);
  }
}

// Run tests if executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

export { testGoogleSignIn, testAppleSignIn, testEmailSignIn, verifyUserDocument };

