import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const AI_COMPANIONS = [
  {
    id: 'ai-fun-companion',
    displayName: 'Alex',
    photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex&backgroundColor=b6e3f4',
    bio: '🎉 Always up for a good time!',
    interests: ['Comedy', 'Gaming', 'Music'],
    isAI: true,
    aiPersonality: 'fun',
    tier: 'PRO',
    stars: 0,
    status: 'online',
    verified: true,
  },
  {
    id: 'ai-flirty-companion',
    displayName: 'Riley',
    photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Riley&backgroundColor=ffdfbf',
    bio: '😘 Charming and playful.',
    interests: ['Romance', 'Fashion', 'Dancing'],
    isAI: true,
    aiPersonality: 'flirty',
    tier: 'PRO',
    stars: 0,
    status: 'online',
    verified: true,
  },
  {
    id: 'ai-supportive-companion',
    displayName: 'Sam',
    photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sam&backgroundColor=c0aede',
    bio: '💙 A great listener and friend.',
    interests: ['Wellness', 'Books', 'Meditation'],
    isAI: true,
    aiPersonality: 'supportive',
    tier: 'PRO',
    stars: 0,
    status: 'online',
    verified: true,
  },
  {
    id: 'ai-creative-companion',
    displayName: 'Jordan',
    photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jordan&backgroundColor=ffd6a5',
    bio: '🎨 Artist at heart.',
    interests: ['Art', 'Design', 'Photography'],
    isAI: true,
    aiPersonality: 'creative',
    tier: 'PRO',
    stars: 0,
    status: 'online',
    verified: true,
  },
];

async function seedAICompanions() {
  try {
    console.log('🤖 Seeding AI Companions...\n');

    if (!getApps().length) {
      const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

      if (!privateKey || !clientEmail || !projectId) {
        throw new Error('Missing Firebase Admin credentials');
      }

      initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
      });
    }

    const db = getFirestore();
    const timestamp = Timestamp.now();
    let created = 0;
    let updated = 0;

    for (const companion of AI_COMPANIONS) {
      const userRef = db.collection('users').doc(companion.id);
      const userSnap = await userRef.get();

      const userData = {
        ...companion,
        createdAt: timestamp,
        updatedAt: timestamp,
        lastSeen: timestamp,
      };

      if (!userSnap.exists) {
        await userRef.set(userData);
        console.log(`✅ Created: ${companion.displayName} (${companion.aiPersonality})`);
        created++;
      } else {
        await userRef.update({ ...userData, createdAt: userSnap.data()?.createdAt || timestamp });
        console.log(`🔄 Updated: ${companion.displayName} (${companion.aiPersonality})`);
        updated++;
      }
    }

    console.log(`\n✨ Complete! Created: ${created}, Updated: ${updated}\n`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

seedAICompanions();
