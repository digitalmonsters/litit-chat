# Firebase Integration Setup

## Overview

Firebase integration has been set up for the Lit.it Chat MVP with the following components:

1. **Firebase Configuration** (`lib/firebase.ts`)
2. **Firestore Collection Schemas** (`lib/firestore-collections.ts`)
3. **GoHighLevel Webhook Handler** (`app/api/ghl/webhook/route.ts`)

## Firebase Configuration

### File: `lib/firebase.ts`

This file initializes Firebase services using singleton patterns:
- **Firebase App**: Main Firebase application instance
- **Firestore**: Database instance
- **Auth**: Authentication instance

**Key Functions:**
- `getFirebaseApp()`: Returns initialized Firebase app
- `getFirestoreInstance()`: Returns Firestore database instance
- `getAuthInstance()`: Returns Firebase Auth instance
- `initializeFirebase()`: Initializes all services (call on app startup)

**Environment Variables Required:**
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

## Firestore Collections

### File: `lib/firestore-collections.ts`

Defines TypeScript interfaces for all Firestore collections:

#### 1. **Users Collection** (`users`)
- User profile information
- GHL integration fields (`ghlContactId`, `ghlLocationId`)
- Status tracking (online/offline/away/busy)
- Metadata storage

#### 2. **Chats Collection** (`chats`)
- Direct and group chat rooms
- Participant management
- Last message tracking
- Unread counts per user
- GHL integration fields

#### 3. **Messages Collection** (`messages`)
- Individual chat messages
- Support for subcollections (messages under chats)
- Message types: text, image, file, system, payment
- Read receipts
- Reply threading
- File attachments

#### 4. **Payments Collection** (`payments`)
- Payment transaction records
- Stripe integration fields
- GHL transaction tracking
- Payment status lifecycle
- Error tracking

**Collection Helper:**
- `getCollectionPath`: Helper function to get collection paths

## GoHighLevel Webhook

### File: `app/api/ghl/webhook/route.ts`

**Endpoint:** `POST /api/ghl/webhook`

Handles incoming webhooks from GoHighLevel for:
- Contact updates (create/update users)
- Payment/transaction updates (create/update payments)

**Features:**
- Webhook signature verification (optional, configurable)
- Automatic user creation from GHL contacts
- Automatic payment record creation
- User and chat updates based on GHL data

**Webhook Events Supported:**
- `contact.created`, `contact.updated`, `contact.added`
- `transaction.created`, `transaction.updated`
- `payment.completed`, `payment.failed`, `payment.pending`

**Environment Variables:**
- `GHL_WEBHOOK_SECRET`: For webhook signature verification

**Webhook Verification:**
- GET endpoint supports challenge/response for webhook setup
- POST endpoint processes webhook payloads

## Setup Instructions

### 1. Install Dependencies
```bash
npm install firebase @firebase/app @firebase/firestore
```

### 2. Configure Environment Variables
Create `.env.local` file with Firebase and GHL credentials (see `lib/env.example.txt`)

### 3. Initialize Firebase in Your App
```typescript
import { initializeFirebase } from '@/lib/firebase';

// In your app initialization
const { app, firestore, auth } = initializeFirebase();
```

### 4. Configure GHL Webhook
1. Go to GoHighLevel webhook settings
2. Set webhook URL to: `https://yourdomain.com/api/ghl/webhook`
3. Select events: Contact updates, Payment/Transaction updates
4. Set webhook secret and add to `.env.local` as `GHL_WEBHOOK_SECRET`

## Usage Examples

### Accessing Firestore
```typescript
import { getFirestoreInstance, COLLECTIONS } from '@/lib/firebase';
import { collection, doc, getDoc } from 'firebase/firestore';

const firestore = getFirestoreInstance();
const userRef = doc(firestore, COLLECTIONS.USERS, userId);
const userSnap = await getDoc(userRef);
```

### Creating a User
```typescript
import { getFirestoreInstance, COLLECTIONS } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import type { CreateUserData } from '@/lib/firestore-collections';

const firestore = getFirestoreInstance();
const userRef = doc(firestore, COLLECTIONS.USERS);
await setDoc(userRef, {
  ...userData,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
});
```

### Creating a Payment
```typescript
import { getFirestoreInstance, COLLECTIONS } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import type { CreatePaymentData } from '@/lib/firestore-collections';

const firestore = getFirestoreInstance();
const paymentRef = doc(firestore, COLLECTIONS.PAYMENTS);
await setDoc(paymentRef, {
  ...paymentData,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
});
```

## Next Steps

1. **Firebase Console Setup:**
   - Create Firebase project
   - Enable Firestore Database
   - Enable Authentication
   - Get configuration values

2. **Firestore Rules:**
   - Set up security rules for collections
   - Configure user-based access controls

3. **Additional API Routes:**
   - Create `/api/chat/*` routes for chat operations
   - Create `/api/payments/*` routes for payment processing
   - Create `/api/stripe/webhook` for Stripe webhooks

4. **Frontend Integration:**
   - Initialize Firebase in client components
   - Set up real-time listeners for messages
   - Implement authentication flow

## Security Notes

- Keep `.env.local` out of version control
- Use Firebase Security Rules to restrict access
- Verify webhook signatures in production
- Use server-side API routes for sensitive operations
- Never expose Firebase admin SDK keys to client

