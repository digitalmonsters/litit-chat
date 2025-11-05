# Cloud Functions Deployment Guide

## Overview

This project includes Cloud Functions that automatically create Firestore user documents when Firebase Auth users are created.

## Functions

### `onCreateUser`
- **Trigger**: Firebase Auth user creation
- **Action**: Creates user document in `users/{uid}` and wallet in `wallets/{uid}`
- **Fields Created**:
  - User document with email, displayName, photoURL, phone, tier, stars, etc.
  - Wallet document with initial balance (0 stars)

### `onUserSignIn`
- **Trigger**: User sign-in (beforeSignIn hook)
- **Action**: Updates `lastLogin` timestamp in user document

## Prerequisites

1. **Firebase CLI installed**:
   ```bash
   npm install -g firebase-tools
   ```

2. **Firebase project initialized**:
   ```bash
   firebase login
   firebase use --add  # Select your Firebase project
   ```

3. **Update `.firebaserc`** with your project ID:
   ```json
   {
     "projects": {
       "default": "your-firebase-project-id"
     }
   }
   ```

## Installation

1. **Install function dependencies**:
   ```bash
   cd functions
   npm install
   ```

2. **Build functions**:
   ```bash
   npm run build
   ```

## Deployment

### Deploy All Functions
```bash
firebase deploy --only functions
```

### Deploy Specific Function
```bash
firebase deploy --only functions:onCreateUser
firebase deploy --only functions:onUserSignIn
```

### Deploy Functions with Firestore Rules/Indexes
```bash
firebase deploy --only functions,firestore
```

## Local Testing

### Start Firebase Emulators
```bash
firebase emulators:start --only functions,auth,firestore
```

### Test with Emulator
Use the Firebase Admin SDK or Auth REST API to create a test user:
```bash
# Using Firebase CLI
firebase auth:export users.json
```

Or use the test script:
```bash
npm run test:functions
```

## Verification

After deployment, test by:

1. **Creating a new user** via Firebase Auth (web app, mobile app, or Admin SDK)
2. **Check Firestore**:
   - `users/{uid}` document should exist
   - `wallets/{uid}` document should exist
   - Both should have correct initial values

### Manual Verification Script

```bash
# Create test user via Firebase Console or Admin SDK
# Then check Firestore:
firebase firestore:get users/TEST_USER_ID
firebase firestore:get wallets/TEST_USER_ID
```

## Function Logs

View function logs:
```bash
firebase functions:log
```

View specific function logs:
```bash
firebase functions:log --only onCreateUser
```

## Troubleshooting

### Function Not Triggering
1. Check Firebase project is correctly set: `firebase use`
2. Verify function is deployed: `firebase functions:list`
3. Check function logs for errors
4. Verify IAM permissions for Cloud Functions

### Permission Errors
Ensure Cloud Functions service account has:
- Cloud Datastore User role
- Firebase Admin SDK Administrator Service Agent

### Build Errors
```bash
cd functions
rm -rf node_modules lib
npm install
npm run build
```

## Files

- `functions/src/index.ts` - Function source code
- `functions/package.json` - Function dependencies
- `functions/tsconfig.json` - TypeScript configuration
- `firebase.json` - Firebase project configuration
- `.firebaserc` - Firebase project aliases

