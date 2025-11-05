# Quick Start: Deploy Cloud Functions

## Step 1: Install Dependencies

```bash
cd functions
npm install
```

## Step 2: Configure Firebase Project

Update `.firebaserc` with your Firebase project ID:
```json
{
  "projects": {
    "default": "your-firebase-project-id"
  }
}
```

## Step 3: Build Functions

```bash
cd functions
npm run build
```

## Step 4: Deploy

```bash
# From project root
firebase deploy --only functions
```

Or use the deployment script:
```bash
./scripts/deploy-functions.sh
```

## Step 5: Test

### Option 1: Use Test Script
```bash
npm install -D tsx firebase-admin
npx tsx scripts/test-auth-function.ts
```

### Option 2: Manual Test
1. Create a new user via your app's sign-up flow
2. Check Firestore:
   - `users/{uid}` should exist
   - `wallets/{uid}` should exist

## Verify Deployment

```bash
# List deployed functions
firebase functions:list

# View logs
firebase functions:log

# View specific function logs
firebase functions:log --only onCreateUser
```

## Troubleshooting

### Function not triggering?
1. Check Firebase project: `firebase use`
2. Verify deployment: `firebase functions:list`
3. Check logs: `firebase functions:log`

### Build errors?
```bash
cd functions
rm -rf node_modules lib
npm install
npm run build
```

### Permission errors?
Ensure Cloud Functions service account has:
- Cloud Datastore User role
- Firebase Admin SDK Administrator Service Agent

