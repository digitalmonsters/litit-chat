# FCM Deployment Checklist

## Prerequisites

1. **Install firebase-admin in main package** (for API routes):
   ```bash
   npm install firebase-admin
   ```

2. **Set VAPID Key**:
   ```env
   NEXT_PUBLIC_FIREBASE_VAPID_KEY=your_vapid_key_here
   ```

3. **Set Firebase Service Account** (for server-side FCM):
   ```env
   FIREBASE_SERVICE_ACCOUNT='{"type":"service_account",...}'
   ```

## Testing

### Test FCM Token Saving

```bash
npm install -D tsx firebase-admin
npx tsx scripts/test-fcm-token.ts
```

### Manual Test Flow

1. **Sign in with a new user** in your app
2. **Check browser console** - should see "✅ FCM token obtained"
3. **Check Firestore** - `users/{uid}.fcmToken` should be populated
4. **Send test notification**:
   ```bash
   curl -X POST http://localhost:3000/api/push/send \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer <firebase-token>" \
     -d '{
       "title": "Test",
       "body": "Test notification"
     }'
   ```

## Verification

✅ FCM token is saved to `users/{uid}.fcmToken` after login  
✅ Token can be updated via `/api/push/token` endpoint  
✅ Push notifications can be sent via `/api/push/send` endpoint  
✅ Cloud Function includes `fcmToken: null` in initial user document

