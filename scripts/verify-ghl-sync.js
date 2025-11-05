/**
 * Verify GHL Contact Sync to Firestore
 * 
 * Tests that GHL contacts are correctly synced to Firestore users
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, where } = require('firebase/firestore');

// Initialize Firebase (you'll need to set these from env)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

async function verifyGHLSync() {
  try {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    console.log('🔍 Checking Firestore users for GHL sync...\n');

    // Get all users with GHL IDs
    const usersRef = collection(db, 'users');
    const ghlUsersQuery = query(usersRef, where('ghlId', '!=', null));
    const snapshot = await getDocs(ghlUsersQuery);

    let syncedCount = 0;
    let withPhotos = 0;
    let withInterests = 0;
    let verified = 0;

    snapshot.forEach((doc) => {
      const data = doc.data();
      syncedCount++;

      if (data.photoURL) withPhotos++;
      if (data.interests && data.interests.length > 0) withInterests++;
      if (data.verified) verified++;
    });

    console.log(`✅ Found ${snapshot.size} users with GHL IDs`);
    console.log(`   - With photos: ${withPhotos}`);
    console.log(`   - With interests: ${withInterests}`);
    console.log(`   - Verified: ${verified}`);

    if (syncedCount === 0) {
      console.log('\n⚠️  No GHL-synced users found. Run sync first:');
      console.log('   POST /api/discover/sync');
    } else {
      console.log('\n✅ GHL sync verification complete!');
    }
  } catch (error) {
    console.error('❌ Error verifying GHL sync:', error.message);
    process.exit(1);
  }
}

verifyGHLSync();

