/**
 * Verify Data Model Script
 * 
 * Verifies that Firestore collections match DATA_MODEL.MD
 * 
 * Usage: npx tsx scripts/verify-data-model.ts
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Initialize Firebase Admin
if (!getApps().length) {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
  
  if (!serviceAccount) {
    console.error('❌ FIREBASE_SERVICE_ACCOUNT not found');
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
 * Expected data model from DATA_MODEL.MD
 */
const EXPECTED_MODEL = {
  users: {
    phone: 'string',
    audioCallEnabled: 'boolean',
    stars: 'number',
    tier: 'string',
  },
  calls: {
    callerId: 'string',
    calleeId: 'string',
    roomId: 'string',
    startedAt: 'timestamp',
    endedAt: 'timestamp',
    durationMins: 'number',
    cost: 'number',
    status: 'string',
    ghlInvoiceId: 'string',
  },
  livestreams: {
    hostId: 'string',
    roomId: 'string',
    viewers: 'array',
    entryFee: 'number',
    tips: 'number',
    battleStars: 'object',
    startedAt: 'timestamp',
    endedAt: 'timestamp',
  },
};

/**
 * Verify collection structure
 */
async function verifyCollection(collectionName: string, expectedFields: Record<string, string>) {
  console.log(`\n📋 Verifying ${collectionName} collection...`);
  
  try {
    const snapshot = await db.collection(collectionName).limit(1).get();
    
    if (snapshot.empty) {
      console.log(`  ⚠️  Collection ${collectionName} is empty - cannot verify structure`);
      return { valid: true, warnings: [`Collection ${collectionName} is empty`] };
    }
    
    const doc = snapshot.docs[0];
    const data = doc.data();
    
    const missingFields: string[] = [];
    const extraFields: string[] = [];
    
    // Check expected fields
    for (const [field, expectedType] of Object.entries(expectedFields)) {
      if (!(field in data)) {
        missingFields.push(field);
      } else {
        const actualType = getFieldType(data[field]);
        if (expectedType !== 'any' && actualType !== expectedType) {
          console.log(`  ⚠️  Field ${field}: expected ${expectedType}, got ${actualType}`);
        }
      }
    }
    
    // Check for unexpected fields (optional - just log)
    for (const field in data) {
      if (!(field in expectedFields) && field !== 'id' && field !== 'createdAt' && field !== 'updatedAt') {
        extraFields.push(field);
      }
    }
    
    if (missingFields.length > 0) {
      console.log(`  ❌ Missing fields: ${missingFields.join(', ')}`);
      return { valid: false, missingFields, extraFields };
    }
    
    if (extraFields.length > 0) {
      console.log(`  ℹ️  Extra fields (not in DATA_MODEL.MD): ${extraFields.join(', ')}`);
    }
    
    console.log(`  ✅ Collection ${collectionName} structure matches DATA_MODEL.MD`);
    return { valid: true, extraFields };
  } catch (error) {
    console.error(`  ❌ Error verifying ${collectionName}:`, error);
    return { valid: false, error };
  }
}

/**
 * Get field type
 */
function getFieldType(value: any): string {
  if (value === null || value === undefined) return 'null';
  if (Array.isArray(value)) return 'array';
  if (value instanceof Date || (value.toDate && typeof value.toDate === 'function')) return 'timestamp';
  if (typeof value === 'object') return 'object';
  return typeof value;
}

/**
 * Main verification function
 */
async function verify() {
  console.log('🔍 Verifying Firestore data model against DATA_MODEL.MD...\n');
  
  const results = {
    users: await verifyCollection('users', EXPECTED_MODEL.users),
    calls: await verifyCollection('calls', EXPECTED_MODEL.calls),
    livestreams: await verifyCollection('livestreams', EXPECTED_MODEL.livestreams),
  };
  
  console.log('\n📊 Verification Summary:');
  console.log(`  Users: ${results.users.valid ? '✅' : '❌'}`);
  console.log(`  Calls: ${results.calls.valid ? '✅' : '❌'}`);
  console.log(`  Livestreams: ${results.livestreams.valid ? '✅' : '❌'}`);
  
  const allValid = Object.values(results).every(r => r.valid);
  
  if (allValid) {
    console.log('\n✅ All collections match DATA_MODEL.MD!');
    process.exit(0);
  } else {
    console.log('\n❌ Some collections do not match DATA_MODEL.MD');
    process.exit(1);
  }
}

// Run verification
verify();

