# Audio/Video Calling Implementation with 100ms & Snap AR

## Overview

This implementation provides 1:1 and group audio/video calling with:
- **100ms.live** integration for WebRTC infrastructure
- **Snap Camera Kit** for AR filters and effects
- **Per-minute billing** via wallet/stars system
- **GHL integration** for payment tracking

---

## Architecture

### Call Flow

```
1. User initiates call
   ├─ Check wallet balance (must have sufficient stars)
   ├─ Create 100ms room
   ├─ Create Firestore call record
   └─ Return callId + roomId

2. Participant joins call
   ├─ Request HMS token from /api/call/token
   ├─ Join 100ms room with token
   └─ Start billing timer when first participant joins

3. Call active
   ├─ Real-time video/audio streams via 100ms
   ├─ Optional Snap AR filters applied to video
   └─ Duration counter displayed with estimated cost

4. Call ends
   ├─ Leave 100ms room
   ├─ Calculate duration (rounded up to next minute)
   ├─ Charge caller: duration × ratePerMinute stars
   ├─ Create transaction record
   └─ Update call status to 'ended'
```

---

## API Routes

### POST `/api/call/initiate`

**Purpose**: Create a new call and 100ms room

**Request Body**:
```json
{
  "type": "direct" | "group" | "sip",
  "receiverId": "userId",           // For direct calls
  "participantIds": ["userId1", "userId2"],  // For group calls
  "sipPhoneNumber": "+1234567890"   // For SIP calls
}
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
    "name": "call-userId1-userId2"
  }
}
```

**Features**:
- ✅ Balance check (minimum 30 min worth of stars)
- ✅ Creates 100ms room via HMS API
- ✅ Sets default rate per minute (10 stars)
- ✅ Returns 402 if insufficient balance

---

### POST `/api/call/token`

**Purpose**: Generate HMS JWT token for participant

**Request Body**:
```json
{
  "callId": "callId",
  "role": "guest"  // Optional, default: 'guest'
}
```

**Response**:
```json
{
  "success": true,
  "token": "hms.jwt.token",
  "roomId": "hmsRoomId",
  "userId": "userId",
  "role": "guest"
}
```

**Features**:
- ✅ Verifies user is a participant
- ✅ Generates HMS JWT with signature
- ✅ Returns token for joining room

---

### POST `/api/call/start`

**Purpose**: Mark call as active and start billing

**Request Body**:
```json
{
  "callId": "callId"
}
```

**Response**:
```json
{
  "success": true,
  "callId": "callId",
  "status": "active",
  "message": "Call billing started"
}
```

**Features**:
- ✅ Sets call status to 'active'
- ✅ Records `startedAt` timestamp
- ✅ Initializes billing timer

---

### POST `/api/call/end`

**Purpose**: End call and process billing

**Request Body**:
```json
{
  "callId": "callId",
  "status": "ended" | "missed" | "failed"  // Default: 'ended'
}
```

**Response**:
```json
{
  "success": true,
  "callId": "callId",
  "duration": 15,  // minutes
  "cost": 150,     // stars
  "status": "ended"
}
```

**Features**:
- ✅ Calculates duration (rounded up to next minute)
- ✅ Charges caller: `duration × ratePerMinute` stars
- ✅ Creates transaction record
- ✅ No charge for missed/failed calls
- ✅ Updates call status and payment status

---

## Frontend Components

### `CallScreen.tsx`

**Full-featured video call UI with**:
- 100ms React SDK integration
- Remote peer video rendering
- Self preview (PiP style)
- Call duration counter with estimated cost
- Audio/video toggle controls
- **Snap AR filters toggle** (staging mode)
- Automatic billing on call end

**Props**:
```typescript
interface CallScreenProps {
  callId: string;
  onEndCall?: () => void;
  className?: string;
}
```

**Usage**:
```tsx
import CallScreen from '@/components/call/CallScreen';

<CallScreen
  callId={callId}
  onEndCall={() => router.push('/chat')}
/>
```

**Features**:
- ✅ Wrapped in `HMSRoomProvider`
- ✅ Auto-fetches HMS token
- ✅ Joins room on mount
- ✅ Displays remote peers in grid
- ✅ Shows duration & estimated cost
- ✅ Snap AR filters button (toggleable)
- ✅ Automatic billing API call on end

---

### `SelfPreview.tsx`

**Local video preview component**:
- Shows user's own video feed
- Displays mute/video off indicators
- Used in CallScreen as PiP overlay

**Props**:
```typescript
interface SelfPreviewProps {
  isMuted?: boolean;
  isVideoOff?: boolean;
  className?: string;
}
```

---

## Billing System

### Rate Structure

- **Default Rate**: 10 stars per minute
- **Charged To**: Call initiator (caller/hostId)
- **Rounding**: Duration rounded **up** to next minute
- **Free Cases**: Missed calls, failed calls

### Balance Check

Before initiating call:
```typescript
const balanceCheck = await checkCallBalance(userId);
// Returns: { canAfford: boolean, balance: number, estimatedCost: number }
```

### Transaction Flow

1. **Call Start**: No charge, just timestamp
2. **Call End**:
   - Calculate: `duration = ceil((endedAt - startedAt) / 60000)`
   - Calculate: `cost = duration × ratePerMinute`
   - Deduct stars: `spendStars(callerId, cost)`
   - Create transaction: `type: 'call_charge'`

### Transaction Record

```typescript
{
  userId: "callerId",
  type: "call_charge",
  amount: 150,  // stars
  currency: "STARS",
  status: "completed",
  metadata: {
    callId: "callId",
    duration: 15,  // minutes
    ratePerMinute: 10,
    receiverId: "receiverId",
    participantIds: ["userId1", "userId2"]
  }
}
```

---

## Snap Camera Kit Integration

### Staging Mode

- Uses **Snap staging API token** for testing
- Allows AR filters/effects during calls
- Toggle button in CallScreen UI

### Implementation (Placeholder)

```typescript
// In CallScreen.tsx
useEffect(() => {
  if (!snapFiltersEnabled) return;

  const initSnapCamera = async () => {
    // TODO: Full integration
    const snapCameraKit = await import('@snap/camera-kit');
    const cameraKit = await snapCameraKit.bootstrapCameraKit({
      apiToken: process.env.NEXT_PUBLIC_SNAP_API_TOKEN || '',
    });
    const session = await cameraKit.createSession();
    // Apply lens to video track
  };

  initSnapCamera();
}, [snapFiltersEnabled]);
```

**Environment Variable**:
```
NEXT_PUBLIC_SNAP_API_TOKEN=your_snap_staging_api_token_here
```

**Note**: Full Snap Camera Kit SDK integration requires additional setup. Current implementation includes UI toggle and initialization structure.

---

## GHL Integration

### Payment Tracking

When a call charge is completed:
1. Transaction record created in Firestore
2. Can be synced to GHL via webhook (existing integration)
3. GHL invoice can be generated for billing records

### Webhook Flow

```
Call End → Transaction Created → GHL Webhook → GHL Invoice
```

**Transaction metadata** includes:
- `callId`
- `duration`
- `ratePerMinute`
- `participantIds`

This can be used to create detailed invoices in GHL.

---

## Environment Variables

Add to `.env.local`:

```bash
# 100ms Configuration
HMS_ACCESS_KEY=your_hms_access_key_here
HMS_SECRET=your_hms_secret_here
HMS_TEMPLATE_ID=your_hms_template_id_here  # Optional
HMS_GROUP_LIVE_TEMPLATE_ID=group_live  # Optional
HMS_SIP_ENDPOINT=your_hms_sip_endpoint_here  # Optional

# Snap Camera Kit
NEXT_PUBLIC_SNAP_API_TOKEN=your_snap_staging_api_token_here
```

---

## Testing

### 1. Initiate Call
```bash
curl -X POST http://localhost:3000/api/call/initiate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -d '{
    "type": "direct",
    "receiverId": "receiverUserId"
  }'
```

### 2. Get Token
```bash
curl -X POST http://localhost:3000/api/call/token \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -d '{
    "callId": "callId"
  }'
```

### 3. End Call
```bash
curl -X POST http://localhost:3000/api/call/end \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -d '{
    "callId": "callId",
    "status": "ended"
  }'
```

---

## Firestore Schema

### Collection: `calls`

```typescript
interface FirestoreCall {
  id: string;
  roomId: string;  // 100ms room ID
  hostId: string;
  callerId: string;
  receiverId?: string;  // For direct calls
  participantIds: string[];
  type: 'direct' | 'group' | 'sip';
  status: 'initiated' | 'ringing' | 'active' | 'ended' | 'missed' | 'failed';
  
  // Billing
  startedAt?: Timestamp;
  endedAt?: Timestamp;
  duration?: number;  // minutes
  ratePerMinute: number;  // stars per minute
  cost?: number;  // total cost in stars
  costCurrency: 'STARS' | 'USD';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'free_trial';
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  
  // Metadata
  sipEnabled?: boolean;
  sipPhoneNumber?: string;
  ghlInvoiceId?: string;
  metadata?: Record<string, unknown>;
}
```

---

## File Structure

```
litit-chat/
├── app/api/call/
│   ├── initiate/route.ts    # Create call + room
│   ├── token/route.ts       # Generate HMS token
│   ├── start/route.ts       # Start billing (NEW)
│   └── end/route.ts         # End call + billing (NEW)
├── components/call/
│   ├── CallScreen.tsx       # Main call UI (UPDATED)
│   ├── SelfPreview.tsx      # Local preview
│   └── AudioCallModal.tsx   # Call modal overlay
├── lib/
│   ├── hms-client.ts        # 100ms API client
│   ├── call-billing.ts      # Billing utilities (NEW)
│   ├── wallet.ts            # Wallet operations
│   └── transactions.ts      # Transaction records
└── AV_CALLING_IMPLEMENTATION.md  # This doc (NEW)
```

---

## Dependencies

### Installed Packages

```json
{
  "@100mslive/react-sdk": "^0.10.39",
  "@100mslive/hms-video-store": "^0.12.x"
}
```

**Installation**:
```bash
npm install @100mslive/react-sdk @100mslive/hms-video-store --legacy-peer-deps
```

**Note**: Uses `--legacy-peer-deps` due to React 19 compatibility.

---

## Key Features Implemented

✅ **1:1 and group calls** via 100ms  
✅ **API routes**: `/api/call/initiate`, `/api/call/token`, `/api/call/start`, `/api/call/end`  
✅ **CallScreen.tsx**: Full 100ms integration with hooks  
✅ **SelfPreview.tsx**: Local video preview component  
✅ **Snap AR toggle**: UI button for AR filters (staging)  
✅ **Per-minute billing**: Automatic charge on call end  
✅ **Balance check**: Prevents calls if insufficient stars  
✅ **Transaction records**: Call charges tracked in Firestore  
✅ **Duration counter**: Real-time display with estimated cost  
✅ **GHL integration ready**: Webhook-compatible transaction metadata  

---

## Next Steps

1. **Get 100ms credentials**: Sign up at https://100ms.live
2. **Add to `.env.local`**: HMS_ACCESS_KEY, HMS_SECRET
3. **Get Snap API token**: https://camera-kit.snapchat.com (staging)
4. **Test calls**: Use frontend components or API directly
5. **Deploy**: Ensure environment variables are set in production

---

## Support & Documentation

- **100ms Docs**: https://www.100ms.live/docs
- **Snap Camera Kit**: https://docs.snap.com/snap-kit/camera-kit
- **Firestore Collections**: See `lib/firestore-collections.ts`
- **HMS Client**: See `lib/hms-client.ts`
- **Billing**: See `lib/call-billing.ts`

---

**Implementation Complete** ✅  
Commit: `feat(call): add audio/video calling with Snap AR and billing`
