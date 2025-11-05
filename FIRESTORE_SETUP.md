# Firestore Setup and Initialization

## Overview
This document describes the Firestore collections, indexes, security rules, and seed data setup for the Firechat application.

## Collections

### 1. Users Collection (`users/{id}`)
**Fields** (matching DATA_MODEL.MD):
- `phone`: string - User phone number
- `audioCallEnabled`: boolean - Whether user has audio calls enabled
- `stars`: number - User's star balance
- `tier`: string - User subscription tier (free, basic, premium, enterprise, litplus)

**Additional fields** (for full functionality):
- `email`: string
- `displayName`: string
- `status`: 'online' | 'offline' | 'away' | 'busy'
- `createdAt`: Timestamp
- `updatedAt`: Timestamp
- `lastLogin`: Timestamp
- `lastSeen`: Timestamp

**Security Rules**:
- Users can read their own data
- Users can update their own data
- Users can create their own document

### 2. Calls Collection (`calls/{id}`)
**Fields** (matching DATA_MODEL.MD):
- `callerId`: string - User ID of caller
- `calleeId`: string - User ID of callee (for direct calls)
- `roomId`: string - 100ms room ID
- `startedAt`: Timestamp - When call started
- `endedAt`: Timestamp - When call ended
- `durationMins`: number - Call duration in minutes
- `cost`: number - Call cost in cents
- `status`: string - Call status (initiated, active, ended, failed, missed)
- `ghlInvoiceId`: string - GHL invoice ID for payment

**Additional fields**:
- `hostId`: string - Call host/initiator
- `participantIds`: string[] - All participants
- `type`: 'direct' | 'group' | 'sip'
- `paymentStatus`: 'pending' | 'paid' | 'failed' | 'free_trial'
- `costCurrency`: 'USD' | 'STARS'
- `createdAt`: Timestamp
- `updatedAt`: Timestamp

**Security Rules**:
- Users can read calls they participate in (host or participant)
- Users can create calls (must be the host)
- Host can update their own calls

**Indexes**:
- `startedAt` (DESCENDING) - For ordering calls by start time
- `status + startedAt` (ASCENDING + DESCENDING) - For filtering by status
- `hostId + startedAt` (ASCENDING + DESCENDING) - For user's call history

### 3. Livestreams Collection (`livestreams/{id}`)
**Fields** (matching DATA_MODEL.MD):
- `hostId`: string - User ID of livestream host
- `roomId`: string - 100ms room ID
- `viewers`: string[] - Array of viewer user IDs
- `entryFee`: number - Entry fee in cents or stars
- `tips`: number - Total tips received in stars
- `battleStars`: object - Battle scores by host ID (e.g., `{hostA: 1200, hostB: 900}`)
- `startedAt`: Timestamp - When livestream started
- `endedAt`: Timestamp - When livestream ended

**Additional fields**:
- `status`: 'scheduled' | 'live' | 'ended' | 'cancelled'
- `entryFeeCurrency`: 'USD' | 'STARS'
- `totalEntryRevenue`: number
- `totalViewerRevenue`: number
- `totalTips`: number
- `viewerMinutes`: Record<string, number> - Minutes watched per viewer
- `isBattleMode`: boolean
- `battleHostId`: string - Second host for battle mode
- `createdAt`: Timestamp
- `updatedAt`: Timestamp

**Security Rules**:
- All authenticated users can read livestreams (for discovery)
- Hosts can create livestreams
- Hosts can read/write their own livestreams
- Viewers can update viewer data (join/leave)

**Indexes**:
- `startedAt` (DESCENDING) - For ordering livestreams by start time
- `status + startedAt` (ASCENDING + DESCENDING) - For filtering by status
- `hostId + startedAt` (ASCENDING + DESCENDING) - For host's livestream history

### 4. Transactions Collection (`transactions/{id}`)
**Fields**:
- `userId`: string - User who made the transaction
- `type`: string - Transaction type (call, liveparty_entry, tip, topup, etc.)
- `amount`: number - Transaction amount
- `currency`: 'USD' | 'STARS'
- `status`: 'pending' | 'completed' | 'failed'
- `description`: string
- `createdAt`: Timestamp
- `updatedAt`: Timestamp

**Additional fields**:
- `callId`: string - If transaction is for a call
- `livestreamId`: string - If transaction is for a livestream
- `hostId`: string - If transaction is a tip
- `metadata`: Record<string, unknown>

**Security Rules**:
- Users can read their own transactions
- Users cannot create/update transactions directly (must use API)

**Indexes**:
- `createdAt` (DESCENDING) - For ordering transactions by time
- `userId + createdAt` (ASCENDING + DESCENDING) - For user's transaction history
- `type + createdAt` (ASCENDING + DESCENDING) - For filtering by transaction type

### 5. Wallets Collection (`wallets/{id}`)
**Fields**:
- `userId`: string - User ID (same as document ID)
- `stars`: number - Star balance
- `usd`: number - USD balance in cents
- `totalEarned`: number - Total stars earned
- `totalSpent`: number - Total stars spent
- `totalUsdSpent`: number - Total USD spent in cents
- `createdAt`: Timestamp
- `updatedAt`: Timestamp
- `lastActivityAt`: Timestamp

**Security Rules**:
- Users can read their own wallet
- Users cannot create/update wallets directly (must use API)

## Indexes

All indexes are defined in `firestore.indexes.json`:

1. **Calls indexes**:
   - `startedAt` (DESCENDING)
   - `status + startedAt` (ASCENDING + DESCENDING)
   - `hostId + startedAt` (ASCENDING + DESCENDING)

2. **Livestreams indexes**:
   - `startedAt` (DESCENDING)
   - `status + startedAt` (ASCENDING + DESCENDING)
   - `hostId + startedAt` (ASCENDING + DESCENDING)

3. **Transactions indexes**:
   - `createdAt` (DESCENDING)
   - `userId + createdAt` (ASCENDING + DESCENDING)
   - `type + createdAt` (ASCENDING + DESCENDING)

## Security Rules

Security rules are defined in `firestore.rules`:

### Key Rules:
1. **Users**: Can read/update/create their own documents
2. **Calls**: Can read calls they participate in, create calls as host
3. **Livestreams**: All users can read (discovery), hosts can read/write their own
4. **Transactions**: Users can read their own transactions
5. **Wallets**: Users can read their own wallets

### Helper Functions:
- `isAuthenticated()` - Checks if user is authenticated
- `currentUserId()` - Gets current user ID
- `isMessageUnlocked()` - Checks if message is unlocked for user

## Seed Data

Seed data script: `scripts/seed-firestore.ts`

### Seed Data Includes:
1. **Two Users**:
   - Alice (user_alice): tier='litplus', stars=1200, phone='+1-555-123-4567'
   - Bob (user_bob): tier='basic', stars=800, phone='+1-555-987-6543'

2. **One Active Call**:
   - Call between Alice and Bob
   - Status: 'active'
   - Room ID: 'hms_room_001'

3. **One Livestream Battle**:
   - Host: Alice
   - Battle Host: Bob
   - Status: 'live'
   - Battle stars: Alice=1200, Bob=900
   - Tips: 1200 stars
   - Entry fee: 500 stars each

4. **Wallets**:
   - One wallet per user with matching star balance

5. **Transactions**:
   - 2 entry fee transactions (500 stars each)
   - 2 tip transactions (300 + 900 stars)

## Setup Instructions

### 1. Deploy Security Rules
```bash
firebase deploy --only firestore:rules
```

### 2. Deploy Indexes
```bash
firebase deploy --only firestore:indexes
```

### 3. Seed Data
```bash
# Set FIREBASE_SERVICE_ACCOUNT in .env.local
# Get service account JSON from Firebase Console > Project Settings > Service Accounts

npx tsx scripts/seed-firestore.ts
```

### 4. Verify Data Model
```bash
npx tsx scripts/verify-data-model.ts
```

## Environment Variables

Required for seed scripts:
- `FIREBASE_SERVICE_ACCOUNT`: JSON string of Firebase service account key

## Data Model Verification

The data model matches `docs/DATA_MODEL.MD`:

✅ **Users**: phone, audioCallEnabled, stars, tier  
✅ **Calls**: callerId, calleeId, roomId, startedAt, endedAt, durationMins, cost, status, ghlInvoiceId  
✅ **Livestreams**: hostId, roomId, viewers, entryFee, tips, battleStars, startedAt, endedAt  

Additional fields are added for full application functionality but do not conflict with the core model.

## Files

- `firestore.rules` - Security rules
- `firestore.indexes.json` - Index definitions
- `scripts/seed-firestore.ts` - Seed data script
- `scripts/verify-data-model.ts` - Data model verification script
- `docs/DATA_MODEL.MD` - Data model specification

