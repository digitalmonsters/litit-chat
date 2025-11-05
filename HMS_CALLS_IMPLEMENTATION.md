# 100ms Calls + SIP Audio + Live Rooms Implementation

## Overview
This document describes the backend implementation for 100ms (HMS) video/audio calls, SIP audio bridging, and live party rooms in Firechat.

## Implementation Summary

### 1. Call Initiation Endpoint (`/api/call/initiate`)

**Location**: `app/api/call/initiate/route.ts`

**Functionality**:
- Creates 100ms room via REST API using HMS_ACCESS_KEY & SECRET
- Supports direct, group, and SIP call types
- Creates Firestore call record in `calls/{id}` collection
- Stores hostId, roomId, and participant information

**Request Body**:
```json
{
  "type": "direct" | "group" | "sip",
  "receiverId": "string", // For direct calls
  "participantIds": ["string"], // For group calls
  "sipPhoneNumber": "string" // For SIP calls
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
  "call": {
    "id": "callId",
    "roomId": "hmsRoomId",
    "type": "direct",
    "status": "initiated"
  },
  "room": {
    "id": "hmsRoomId",
    "name": "room-name"
  }
}
```

**Security**: ✅ Firebase Auth token required

### 2. Token Generation Endpoint (`/api/call/token`)

**Location**: `app/api/call/token/route.ts`

**Functionality**:
- Generates JWT token for participant to join 100ms room
- Verifies user is a participant in the call
- Returns HMS token for room access

**Request Body**:
```json
{
  "callId": "string",
  "role": "guest" // Optional, defaults to 'guest'
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
  "token": "hms-jwt-token",
  "roomId": "hmsRoomId",
  "userId": "userId",
  "role": "guest"
}
```

**Security**: ✅ Firebase Auth token required

### 3. SIP Audio Endpoint (`/api/call/sip`)

**Location**: `app/api/call/sip/route.ts`

**Functionality**:
- Starts SIP audio session (bridge to HMS_SIP_ENDPOINT)
- Only call host can initiate SIP audio
- Updates call record with SIP session information

**Request Body**:
```json
{
  "callId": "string",
  "phoneNumber": "string"
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
  "sip": {
    "id": "sipSessionId",
    "roomId": "hmsRoomId",
    "phoneNumber": "+1234567890",
    "status": "active"
  }
}
```

**Security**: ✅ Firebase Auth token required

### 4. Call Webhook (`/api/call/webhook`)

**Location**: `app/api/call/webhook/route.ts`

**Functionality**:
- Handles `room.start` and `room.end` events from 100ms
- Computes call duration and cost
- Creates payment (GHL invoice or wallet deduction) on call end
- Updates Firestore call record with duration, cost, and payment status

**Supported Events**:
- `room.start` / `room_started`: Marks call as active
- `room.end` / `room_ended`: Ends call, calculates cost, creates payment

**Webhook Payload**:
```json
{
  "event": "room.end",
  "room": {
    "id": "hmsRoomId"
  },
  "data": {
    "duration": 120,
    "started_at": "2024-01-01T00:00:00Z",
    "ended_at": "2024-01-01T00:02:00Z"
  }
}
```

**Payment Handling**:
- If `costCurrency` is `STARS`: Deducts from user's wallet
- If `costCurrency` is `USD`: Creates GHL invoice
- If wallet deduction fails, falls back to GHL invoice

**Logs**:
- `✅ Call {id} started (room: {roomId})`
- `✅ Call {id} ended (duration: {duration}s, cost: {cost} cents)`
- `✅ Wallet deduction successful for call {id}: {cost} stars`
- `✅ GHL invoice created for call {id}: {invoiceId}`

### 5. Party Initiation Endpoint (`/api/party/initiate`)

**Location**: `app/api/party/initiate/route.ts`

**Functionality**:
- Creates `group_live` 100ms room for live party
- Stores hostId and roomId in Firestore `livestreams/{id}` collection
- Supports entry fees (USD or STARS) and optional per-minute viewer fees
- Supports scheduled parties

**Request Body**:
```json
{
  "entryFee": 1000, // Entry fee in cents (USD) or stars
  "entryFeeCurrency": "STARS", // "USD" | "STARS"
  "viewerFeePerMinute": 50, // Optional per-minute viewer fee
  "viewerFeeCurrency": "STARS", // "USD" | "STARS"
  "scheduledAt": "2024-01-01T00:00:00Z" // Optional ISO timestamp
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
  "party": {
    "id": "livestreamId",
    "roomId": "hmsRoomId",
    "hostId": "userId",
    "status": "live",
    "entryFee": 1000,
    "entryFeeCurrency": "STARS"
  },
  "room": {
    "id": "hmsRoomId",
    "name": "room-name"
  }
}
```

**Security**: ✅ Firebase Auth token required

### 6. Party Webhook (`/api/party/webhook`)

**Location**: `app/api/party/webhook/route.ts`

**Functionality**:
- Tracks participant joins/leaves
- Tracks tips received
- Tracks battle scores
- Calculates viewer minutes and revenue
- Creates payment for entry fees on party end

**Supported Events**:
- `participant.joined` / `participant_joined`: Adds user to viewers list
- `participant.left` / `participant_left`: Removes user, calculates viewer minutes and revenue
- `tip` / `tip_received`: Creates tip record in `tips/{id}` collection
- `battle.score` / `battle_score`: Updates battle scores in metadata
- `room.end` / `room_ended`: Ends party, creates payment for entry fees

**Webhook Payload Examples**:

**Join Event**:
```json
{
  "event": "participant.joined",
  "room": { "id": "hmsRoomId" },
  "data": { "userId": "userId123" }
}
```

**Tip Event**:
```json
{
  "event": "tip",
  "room": { "id": "hmsRoomId" },
  "data": {
    "userId": "tipperId",
    "tipAmount": 500
  }
}
```

**Battle Score Event**:
```json
{
  "event": "battle.score",
  "room": { "id": "hmsRoomId" },
  "data": {
    "hostId": "hostId",
    "battleScore": 1000
  }
}
```

**Payment Handling**:
- Entry fees in `STARS`: Logged, no payment creation needed
- Entry fees in `USD`: Creates GHL invoice via `createPartyPayment()`

**Logs**:
- `✅ User {userId} joined party {partyId}`
- `✅ User {userId} left party {partyId} (watched: {minutes} min)`
- `✅ Tip received: {amount} stars from {userId} to party {partyId}`
- `✅ Battle score updated: {hostId} = {score} in party {partyId}`
- `✅ Party {partyId} ended (duration: {duration}s)`
- `✅ GHL invoice created for party {partyId}: {invoiceId}`

## Firestore Collections

### Calls Collection (`calls/{id}`)
```typescript
{
  id: string;
  roomId: string; // 100ms room ID
  hostId: string;
  participantIds: string[];
  type: 'direct' | 'group' | 'sip';
  status: 'initiated' | 'active' | 'ended' | 'failed';
  startedAt?: Timestamp;
  endedAt?: Timestamp;
  duration?: number; // seconds
  ratePerMinute?: number; // cents
  cost?: number; // cents
  costCurrency?: 'USD' | 'STARS';
  paymentStatus?: 'pending' | 'paid' | 'failed';
  transactionId?: string;
  sipEnabled?: boolean;
  sipPhoneNumber?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Livestreams Collection (`livestreams/{id}`)
```typescript
{
  id: string;
  hostId: string;
  roomId?: string; // 100ms room ID
  status: 'scheduled' | 'live' | 'ended' | 'cancelled';
  scheduledAt?: Timestamp;
  startedAt?: Timestamp;
  endedAt?: Timestamp;
  duration?: number; // seconds
  entryFee: number; // cents or stars
  entryFeeCurrency: 'USD' | 'STARS';
  viewerFeePerMinute?: number;
  viewerFeeCurrency?: 'USD' | 'STARS';
  totalEntryRevenue: number;
  totalViewerRevenue: number;
  totalTips: number;
  viewers: string[]; // user IDs
  viewerMinutes: Record<string, number>; // userId -> minutes
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Tips Collection (`tips/{id}`)
```typescript
{
  id: string;
  livestreamId?: string;
  hostId: string;
  tipperId: string;
  amount: number; // stars
  currency: 'USD' | 'STARS';
  battleId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  metadata?: Record<string, unknown>;
}
```

## Environment Variables

Required:
- `HMS_ACCESS_KEY`: 100ms API access key
- `HMS_SECRET`: 100ms API secret
- `HMS_SIP_ENDPOINT`: 100ms SIP endpoint URL
- `HMS_TEMPLATE_ID`: 100ms room template ID (optional)
- `HMS_GROUP_LIVE_TEMPLATE_ID`: 100ms group_live template ID (optional, defaults to 'group_live')
- `NEXT_PUBLIC_APP_URL`: Application URL for webhook callbacks (optional)

## Security

### All Endpoints Secured
✅ All endpoints require Firebase Auth token:
- `/api/call/initiate` - ✅ Secured
- `/api/call/token` - ✅ Secured
- `/api/call/sip` - ✅ Secured
- `/api/party/initiate` - ✅ Secured

### Webhook Endpoints
- `/api/call/webhook` - Public (100ms webhook)
- `/api/party/webhook` - Public (100ms webhook)

Note: Webhook endpoints should implement signature verification in production.

## Payment Integration

### Call Payments
When a call ends:
1. Calculate cost: `durationMinutes * ratePerMinute`
2. If `costCurrency === 'STARS'`: Deduct from wallet
3. If `costCurrency === 'USD'`: Create GHL invoice
4. Update call record with payment status

### Party Payments
When a party ends:
1. If `entryFeeCurrency === 'STARS'`: Revenue already in stars (no payment)
2. If `entryFeeCurrency === 'USD'`: Create GHL invoice for total entry revenue
3. Viewer fees are tracked per viewer and added to total viewer revenue

## Flow Diagrams

### Call Flow
```
1. User initiates call → POST /api/call/initiate
   ↓
2. Backend creates 100ms room
   ↓
3. Backend creates Firestore call record
   ↓
4. User gets token → POST /api/call/token
   ↓
5. User joins 100ms room with token
   ↓
6. 100ms sends room.start webhook
   ↓
7. Backend updates call status to 'active'
   ↓
8. Call ends (user leaves or timeout)
   ↓
9. 100ms sends room.end webhook
   ↓
10. Backend calculates duration & cost
    ↓
11. Backend creates payment (wallet or GHL invoice)
    ↓
12. Backend updates call with payment info
```

### SIP Call Flow
```
1. User initiates SIP call → POST /api/call/initiate (type: 'sip')
   ↓
2. Backend creates 100ms room
   ↓
3. User starts SIP audio → POST /api/call/sip
   ↓
4. Backend bridges to HMS_SIP_ENDPOINT
   ↓
5. SIP session active
   ↓
6. (Same as call flow from step 6)
```

### Live Party Flow
```
1. Host creates party → POST /api/party/initiate
   ↓
2. Backend creates group_live 100ms room
   ↓
3. Backend creates Firestore livestream record
   ↓
4. Viewers join (webhook: participant.joined)
   ↓
5. Viewers can tip (webhook: tip)
   ↓
6. Battle scores updated (webhook: battle.score)
   ↓
7. Viewers leave (webhook: participant.left)
   ↓
8. Party ends (webhook: room.end)
   ↓
9. Backend calculates total revenue
   ↓
10. Backend creates payment for entry fees (if USD)
```

## Files Modified/Created

1. `app/api/call/initiate/route.ts` - Call initiation (already implemented)
2. `app/api/call/token/route.ts` - Token generation (already implemented)
3. `app/api/call/sip/route.ts` - SIP audio (already implemented)
4. `app/api/call/webhook/route.ts` - Call webhook handler (enhanced)
5. `app/api/party/initiate/route.ts` - Party initiation (already implemented)
6. `app/api/party/webhook/route.ts` - Party webhook handler (enhanced)
7. `lib/hms-client.ts` - 100ms API client (already implemented)
8. `HMS_CALLS_IMPLEMENTATION.md` - This documentation (NEW)

## Testing

### Test Call Initiation
```bash
curl -X POST http://localhost:3000/api/call/initiate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <firebase-token>" \
  -d '{
    "type": "direct",
    "receiverId": "receiver123"
  }'
```

### Test Token Generation
```bash
curl -X POST http://localhost:3000/api/call/token \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <firebase-token>" \
  -d '{
    "callId": "call123",
    "role": "guest"
  }'
```

### Test SIP Audio
```bash
curl -X POST http://localhost:3000/api/call/sip \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <firebase-token>" \
  -d '{
    "callId": "call123",
    "phoneNumber": "+1234567890"
  }'
```

### Test Party Initiation
```bash
curl -X POST http://localhost:3000/api/party/initiate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <firebase-token>" \
  -d '{
    "entryFee": 1000,
    "entryFeeCurrency": "STARS"
  }'
```

### Test Call Webhook
```bash
curl -X POST http://localhost:3000/api/call/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event": "room.end",
    "room": {
      "id": "hmsRoomId"
    },
    "data": {
      "duration": 120,
      "started_at": "2024-01-01T00:00:00Z",
      "ended_at": "2024-01-01T00:02:00Z"
    }
  }'
```

## Future Enhancements

1. Implement webhook signature verification
2. Add call recording support
3. Add screen sharing support
4. Add call quality metrics tracking
5. Add call analytics dashboard
6. Add call history and replay
7. Add subscription-based call limits
8. Add call forwarding support
9. Add call waiting and hold features
10. Add multi-party conference calls

