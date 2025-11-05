# Firestore Setup Scripts

## Prerequisites

Install required dependencies:
```bash
npm install -D tsx firebase-admin dotenv
```

Or if using ts-node:
```bash
npm install -D ts-node firebase-admin dotenv
```

## Environment Setup

1. Get Firebase Service Account Key:
   - Go to Firebase Console > Project Settings > Service Accounts
   - Click "Generate new private key"
   - Copy the JSON content

2. Add to `.env.local`:
```env
FIREBASE_SERVICE_ACCOUNT='{"type":"service_account",...}'
```

## Scripts

### 1. Seed Firestore Data

Seeds initial test data:
- Two users (Alice and Bob)
- One active call
- One livestream battle
- Wallets and transactions

```bash
npx tsx scripts/seed-firestore.ts
```

### 2. Verify Data Model

Verifies that Firestore collections match `docs/DATA_MODEL.MD`:

```bash
npx tsx scripts/verify-data-model.ts
```

## Deployment

### Deploy Security Rules

```bash
firebase deploy --only firestore:rules
```

### Deploy Indexes

```bash
firebase deploy --only firestore:indexes
```

Or deploy both:
```bash
firebase deploy --only firestore
```

