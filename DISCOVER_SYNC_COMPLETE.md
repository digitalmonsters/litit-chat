# GHL → Firestore Discover Feed Sync - Complete ✅

## Overview
The GHL → Firestore synchronization for the Discover Feed is fully implemented and configured to run every 6 hours via Vercel Cron.

## Implementation

### 1. Sync Function (`lib/ghl-discover-sync.ts`)

**Function**: `syncGHLContactsToFirestore()`

**Features**:
- Fetches all contacts from GHL API
- Filters for contacts with tags "Creator" or "Public"
- Maps GHL contact fields to Firestore users collection
- Creates or updates user documents in Firestore
- Logs: `✅ Synced {count} contacts to Firestore users`

**Field Mapping**:
- `ghlContact.id` → `users/{id}.ghlId` and `ghlContactId`
- `ghlContact.email` → `users/{id}.email`
- `ghlContact.firstName` + `lastName` → `users/{id}.displayName`
- `ghlContact.photo` → `users/{id}.photoURL`
- `ghlContact.phone` → `users/{id}.phone` (if available)
- `ghlContact.tags` (excluding Creator/Public) → `users/{id}.interests`
- `ghlContact.locationId` → `users/{id}.ghlLocationId`
- Default values: `tier: 'free'`, `status: 'offline'`, `provider: 'email'`, `verified: true`

### 2. Manual Sync Endpoint (`/api/discover/sync`)

**Location**: `app/api/discover/sync/route.ts`

**Methods**:
- `POST`: Triggers manual sync
- `GET`: Returns sync status information

**Request**:
```bash
curl -X POST http://localhost:3000/api/discover/sync
```

**Response**:
```json
{
  "success": true,
  "message": "Synced {count} contacts to Firestore users",
  "syncedCount": 42
}
```

**Security**:
- Optional: CRON_SECRET verification (required in production)
- Allows manual calls in development

### 3. Cron Endpoint (`/api/cron/discover-sync`)

**Location**: `app/api/cron/discover-sync/route.ts`

**Method**: `GET`

**Schedule**: Every 6 hours (`0 */6 * * *`)

**Configuration**: `vercel.json`

**Security**:
- Requires CRON_SECRET in Authorization header
- Vercel automatically sets this header

**Logs**:
- `✅ Synced {count} contacts to Firestore users`

## Field Mapping Details

### GHL Contact → Firestore User

| GHL Field | Firestore Field | Notes |
|-----------|----------------|-------|
| `id` | `ghlId`, `ghlContactId` | GHL contact ID |
| `email` | `email` | User email |
| `firstName` + `lastName` | `displayName` | Combined name |
| `photo` | `photoURL` | Profile photo URL |
| `phone` | `phone` | Phone number (if available) |
| `tags` (filtered) | `interests` | Tags excluding "Creator" and "Public" |
| `locationId` | `ghlLocationId` | GHL location ID |
| - | `tier` | Default: `'free'` |
| - | `status` | Default: `'offline'` |
| - | `provider` | Default: `'email'` |
| - | `verified` | Default: `true` |
| - | `createdAt`, `updatedAt` | Server timestamps |

### Document ID Logic

1. **Firebase UID** (if `customField.firebaseUid` exists)
2. **Email** (if email exists)
3. **GHL ID** (fallback: `ghl_{contactId}`)

## Cron Schedule

**Vercel Cron Configuration**:
```json
{
  "crons": [
    {
      "path": "/api/cron/discover-sync",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

**Schedule**: Every 6 hours (at minute 0 of hours 0, 6, 12, 18)

**Cron Expression**: `0 */6 * * *`

## Tag Filtering

Only contacts with these tags are synced:
- ✅ "Creator"
- ✅ "Public"

Contacts with other tags are **not** synced.

## Logging

All sync operations log:
```
✅ Synced {count} contacts to Firestore users
```

Logs appear in:
- Vercel function logs
- Console output
- API response messages

## Testing

### Manual Sync Test

```bash
# Test manual sync
curl -X POST http://localhost:3000/api/discover/sync

# Check sync status
curl http://localhost:3000/api/discover/sync
```

### Verify Synced Data

1. Check Firestore Console:
   - Navigate to `users` collection
   - Look for users with `ghlId` field
   - Verify `interests` field contains tags (excluding Creator/Public)

2. Check logs:
   - Vercel function logs should show sync count
   - Console should show: `✅ Synced {count} contacts to Firestore users`

## Environment Variables

Required:
- `GHL_LOCATION_ID`: GHL location ID
- `GHL_API_KEY`: GHL API key (optional, uses OAuth if available)
- `CRON_SECRET`: Secret for cron endpoint authentication (optional but recommended)

## Files

1. `lib/ghl-discover-sync.ts` - Sync function implementation
2. `app/api/discover/sync/route.ts` - Manual sync endpoint
3. `app/api/cron/discover-sync/route.ts` - Cron endpoint
4. `vercel.json` - Cron schedule configuration

## Status

✅ **Complete** - All tasks implemented:
- ✅ `/api/discover/sync` pulls contacts with "Creator" or "Public" tags
- ✅ Maps GHL contact fields to Firestore users collection
- ✅ Scheduled periodic sync (every 6 hours) via Vercel Cron
- ✅ Logs "Synced {count} contacts to Firestore users"

## Next Steps

1. Deploy to Vercel to activate cron schedule
2. Test manual sync: `POST /api/discover/sync`
3. Verify synced users in Firestore Console
4. Monitor cron execution in Vercel dashboard

