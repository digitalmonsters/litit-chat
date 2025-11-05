# Firebase Cloud Messaging (FCM) Setup

## Overview
This document describes the FCM setup for push notifications in Firechat, including VAPID key configuration and token management.

## Configuration

### 1. VAPID Key Setup

1. **Get VAPID Key from Firebase Console**:
   - Go to Firebase Console > Project Settings > Cloud Messaging
   - Scroll to "Web configuration"
   - Copy the "Key pair" (VAPID key)

2. **Set Environment Variable**:
   ```env
   NEXT_PUBLIC_FIREBASE_VAPID_KEY=your_vapid_key_here
   ```

3. **Verify in Code**:
   - The VAPID key is used in `lib/firebase-messaging.ts`
   - Used when calling `getToken()` to register for push notifications

## Implementation

### 1. Client-Side FCM (`lib/firebase-messaging.ts`)

**Functions**:
- `requestNotificationPermission()`: Requests permission and gets FCM token
- `initializeFCM()`: Initializes FCM and saves token to Firestore
- `saveFCMTokenToFirestore()`: Saves token to `users/{uid}.fcmToken`
- `onMessageListener()`: Listens for foreground messages

**Auto-save on Login**:
- `AuthContext` automatically calls `initializeFCM()` after user signs in
- Token is saved to `users/{uid}.fcmToken` in Firestore

### 2. API Endpoints

#### `/api/push/token` (POST)
**Save FCM token to user document**

**Request**:
```json
{
  "fcmToken": "fcm-token-string"
}
```

**Headers**:
```
Authorization: Bearer <Firebase Auth Token>
```

**Response**:
```json
{
  "success": true,
  "message": "FCM token saved successfully"
}
```

#### `/api/push/token` (DELETE)
**Remove FCM token from user document**

**Headers**:
```
Authorization: Bearer <Firebase Auth Token>
```

#### `/api/push/send` (POST)
**Send push notification via FCM**

**Request**:
```json
{
  "userId": "target-user-id", // Optional, defaults to current user
  "userIds": ["user1", "user2"], // Optional, for multiple users
  "title": "Notification Title",
  "body": "Notification body text",
  "data": { // Optional
    "key": "value"
  },
  "image": "https://example.com/image.jpg" // Optional
}
```

**Headers**:
```
Authorization: Bearer <Firebase Auth Token>
```

**Response**:
```json
{
  "success": true,
  "sent": 1,
  "failed": 0,
  "results": [
    {
      "userId": "user-id",
      "success": true,
      "messageId": "fcm-message-id"
    }
  ]
}
```

## Firestore User Document

The `users/{uid}` document includes:
- `fcmToken`: string | null - FCM token for push notifications

**Updated automatically**:
- On login: `initializeFCM()` is called in `AuthContext`
- Token is saved to `users/{uid}.fcmToken`
- If token changes, it's updated automatically

## Cloud Function

The `onCreateUser` Cloud Function includes `fcmToken: null` in the initial user document, which will be populated when the user grants notification permission.

## Testing

### Test FCM Token Saving

```bash
npm install -D tsx firebase-admin
npx tsx scripts/test-fcm-token.ts
```

The test script will:
1. Create a test Firebase Auth user
2. Wait for Cloud Function to create Firestore user
3. Save an FCM token to the user document
4. Verify token is saved
5. Test token removal
6. Clean up test user

### Manual Testing

1. **Sign in with a new user** in your app
2. **Grant notification permission** when prompted
3. **Check Firestore**: `users/{uid}.fcmToken` should be populated
4. **Send test notification**:
   ```bash
   curl -X POST http://localhost:3000/api/push/send \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer <firebase-token>" \
     -d '{
       "title": "Test Notification",
       "body": "This is a test"
     }'
   ```

## Environment Variables

Required:
- `NEXT_PUBLIC_FIREBASE_VAPID_KEY`: VAPID key from Firebase Console
- `FIREBASE_SERVICE_ACCOUNT`: Service account JSON (for server-side FCM sending)

## Security

- All endpoints require Firebase Auth token
- Users can only save/remove their own FCM token
- Users can only send notifications to themselves by default (unless targeting specific users)

## Troubleshooting

### Token Not Saving
1. Check `NEXT_PUBLIC_FIREBASE_VAPID_KEY` is set
2. Check browser console for errors
3. Verify notification permission is granted
4. Check Firestore security rules allow user to update their own document

### Notifications Not Received
1. Check FCM token is saved in Firestore
2. Verify service worker is registered
3. Check browser notification settings
4. Verify Firebase Admin is initialized correctly
5. Check FCM logs: `firebase functions:log`

### Permission Denied
- Ensure notification permission is granted in browser
- Check browser notification settings
- Some browsers require HTTPS for notifications

## Files

- `lib/firebase-messaging.ts` - Client-side FCM implementation
- `app/api/push/token/route.ts` - Token save/remove endpoint
- `app/api/push/send/route.ts` - Push notification send endpoint
- `contexts/AuthContext.tsx` - Auto-initializes FCM on login
- `functions/src/index.ts` - Cloud Function (includes fcmToken field)
- `scripts/test-fcm-token.ts` - Test script

