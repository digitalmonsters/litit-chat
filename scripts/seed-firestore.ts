/**
 * Firestore Seed Data Script
 * 
 * Seeds initial data for testing:
 * - Two users
 * - One active call
 * - One livestream battle
 * 
 * Usage:
 *   npm install -D tsx firebase-admin
 *   npx tsx scripts/seed-firestore.ts
 * 
 * Or with ts-node:
 *   npm install -D ts-node firebase-admin
 *   npx ts-node scripts/seed-firestore.ts
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Initialize Firebase Admin
if (!getApps().length) {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
  
  if (!serviceAccount) {
    console.error('❌ FIREBASE_SERVICE_ACCOUNT not found in environment variables');
    console.log('💡 You can get service account JSON from Firebase Console > Project Settings > Service Accounts');
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

const db = getFirestore();

/**
 * Seed users collection
 */
async function seedUsers() {
  console.log('📝 Seeding users...');
  
  const users = [
    {
      id: 'user_alice',
      email: 'alice@lit.it',
      displayName: 'Alice',
      photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice',
      phone: '+1-555-123-4567',
      audioCallEnabled: true,
      stars: 1200,
      tier: 'litplus',
      status: 'online',
      provider: 'email',
      verified: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      lastLogin: Timestamp.now(),
      lastSeen: Timestamp.now(),
    },
    {
      id: 'user_bob',
      email: 'bob@lit.it',
      displayName: 'Bob',
      photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob',
      phone: '+1-555-987-6543',
      audioCallEnabled: true,
      stars: 800,
      tier: 'basic',
      status: 'online',
      provider: 'email',
      verified: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      lastLogin: Timestamp.now(),
      lastSeen: Timestamp.now(),
    },
  ];

  for (const user of users) {
    await db.collection('users').doc(user.id).set(user);
    console.log(`  ✅ Created user: ${user.id} (${user.displayName})`);
  }
  
  return users;
}

/**
 * Seed wallets collection
 */
async function seedWallets(users: any[]) {
  console.log('📝 Seeding wallets...');
  
  for (const user of users) {
    const wallet = {
      id: user.id,
      userId: user.id,
      stars: user.stars,
      usd: 0,
      totalEarned: user.stars,
      totalSpent: 0,
      totalUsdSpent: 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      lastActivityAt: Timestamp.now(),
    };
    
    await db.collection('wallets').doc(user.id).set(wallet);
    console.log(`  ✅ Created wallet for ${user.id}: ${user.stars} stars`);
  }
}

/**
 * Seed calls collection
 */
async function seedCalls(users: any[]) {
  console.log('📝 Seeding calls...');
  
  const call = {
    id: 'call_alice_bob_001',
    roomId: 'hms_room_001',
    callerId: users[0].id,
    calleeId: users[1].id,
    hostId: users[0].id,
    participantIds: [users[0].id, users[1].id],
    type: 'direct',
    status: 'active',
    startedAt: Timestamp.now(),
    durationMins: 0,
    cost: 0,
    costCurrency: 'STARS',
    paymentStatus: 'free_trial',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
  
  await db.collection('calls').doc(call.id).set(call);
  console.log(`  ✅ Created active call: ${call.id} (${call.callerId} → ${call.calleeId})`);
  
  return call;
}

/**
 * Seed livestreams collection
 */
async function seedLivestreams(users: any[]) {
  console.log('📝 Seeding livestreams...');
  
  const livestream = {
    id: 'livestream_battle_001',
    hostId: users[0].id,
    battleHostId: users[1].id,
    roomId: 'hms_room_battle_001',
    viewers: [users[0].id, users[1].id],
    entryFee: 500, // 500 stars or $5.00
    entryFeeCurrency: 'STARS',
    tips: 1200,
    battleStars: {
      [users[0].id]: 1200,
      [users[1].id]: 900,
    },
    status: 'live',
    startedAt: Timestamp.now(),
    viewerCount: 2,
    peakViewerCount: 2,
    isBattleMode: true,
    totalEntryRevenue: 1000, // Both hosts paid
    totalViewerRevenue: 0,
    totalTips: 1200,
    viewerMinutes: {
      [users[0].id]: 5,
      [users[1].id]: 5,
    },
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
  
  await db.collection('livestreams').doc(livestream.id).set(livestream);
  console.log(`  ✅ Created livestream battle: ${livestream.id} (${users[0].displayName} vs ${users[1].displayName})`);
  
  return livestream;
}

/**
 * Seed transactions collection
 */
async function seedTransactions(users: any[], livestream: any) {
  console.log('📝 Seeding transactions...');
  
  const transactions = [
    {
      id: 'txn_entry_fee_alice',
      userId: users[0].id,
      type: 'liveparty_entry',
      amount: 500,
      currency: 'STARS',
      status: 'completed',
      livestreamId: livestream.id,
      description: 'Entry fee for livestream battle',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    },
    {
      id: 'txn_entry_fee_bob',
      userId: users[1].id,
      type: 'liveparty_entry',
      amount: 500,
      currency: 'STARS',
      status: 'completed',
      livestreamId: livestream.id,
      description: 'Entry fee for livestream battle',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    },
    {
      id: 'txn_tip_001',
      userId: users[0].id,
      type: 'tip',
      amount: 300,
      currency: 'STARS',
      status: 'completed',
      livestreamId: livestream.id,
      hostId: users[0].id,
      description: 'Tip to livestream host',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    },
    {
      id: 'txn_tip_002',
      userId: users[1].id,
      type: 'tip',
      amount: 900,
      currency: 'STARS',
      status: 'completed',
      livestreamId: livestream.id,
      hostId: users[0].id,
      description: 'Tip to livestream host',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    },
  ];
  
  for (const txn of transactions) {
    await db.collection('transactions').doc(txn.id).set(txn);
    console.log(`  ✅ Created transaction: ${txn.id} (${txn.type})`);
  }
}

/**
 * Main seed function
 */
async function seed() {
  try {
    console.log('🌱 Starting Firestore seed...\n');
    
    // Seed users
    const users = await seedUsers();
    console.log('');
    
    // Seed wallets
    await seedWallets(users);
    console.log('');
    
    // Seed calls
    const call = await seedCalls(users);
    console.log('');
    
    // Seed livestreams
    const livestream = await seedLivestreams(users);
    console.log('');
    
    // Seed transactions
    await seedTransactions(users, livestream);
    console.log('');
    
    console.log('✅ Seed completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`  - Users: ${users.length}`);
    console.log(`  - Wallets: ${users.length}`);
    console.log(`  - Calls: 1 (active)`);
    console.log(`  - Livestreams: 1 (battle)`);
    console.log(`  - Transactions: 4`);
  } catch (error) {
    console.error('❌ Error seeding Firestore:', error);
    process.exit(1);
  }
}

// Run seed
seed();
