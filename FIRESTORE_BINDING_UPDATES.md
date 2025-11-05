# Firestore Data Binding Updates ✅

## ✅ Updated Components to Use Correct Firestore Collections

### 1. CallScreen.tsx ✅
- **Updated**: Now reads from `calls/{id}` collection
- **Changes**:
  - Changed `roomId` prop to `callId` (Firestore document ID)
  - Added Firestore listener: `onSnapshot(doc(db, COLLECTIONS.CALLS, callId))`
  - Reads `call.roomId` from Firestore document for 100ms initialization
  - Uses `FirestoreCall` type for type safety

### 2. LivePartyScreen.tsx ✅
- **Updated**: Now reads/writes from `livestreams/{id}` collection
- **Changes**:
  - Changed `partyId` prop to `livestreamId` (Firestore document ID)
  - Added Firestore listener: `onSnapshot(doc(db, COLLECTIONS.LIVESTREAMS, livestreamId))`
  - Reads livestream data: `hostId`, `battleHostId`, `status`, `viewerCount`, `isBattleMode`
  - Comments read from subcollection: `livestreams/{id}/comments`
  - Comments write to subcollection: `addDoc(collection(db, 'livestreams/{id}/comments'))`
  - Real-time updates for viewer count and status

### 3. Wallet.tsx ✅
- **Updated**: Now reads from both `wallets/{uid}` and `users/{uid}.stars`
- **Changes**:
  - Primary source: `wallets/{uid}` via WalletContext
  - Fallback: `users/{uid}.stars` via Firestore listener
  - Added `onSnapshot` listener for `users/{uid}` to read `stars` field
  - Uses `wallet?.stars ?? userStars ?? 0` for balance

## 📊 Firestore Collections Used

### calls/{id}
```typescript
{
  id: string;
  roomId: string; // 100ms room ID
  hostId: string;
  participantIds: string[];
  type: 'direct' | 'group' | 'sip';
  status: 'initiating' | 'initiated' | 'ringing' | 'active' | 'ended' | 'failed' | 'missed';
  startedAt?: Timestamp;
  endedAt?: Timestamp;
  // ... other fields
}
```

### livestreams/{id}
```typescript
{
  id: string;
  hostId: string;
  battleHostId?: string;
  status: 'scheduled' | 'live' | 'ended' | 'cancelled';
  viewerCount: number;
  peakViewerCount: number;
  isBattleMode: boolean;
  roomId?: string; // 100ms room ID
  // ... other fields
}
```

### livestreams/{id}/comments (subcollection)
```typescript
{
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  message: string;
  timestamp: Timestamp;
  isTip?: boolean;
  tipAmount?: number;
  createdAt: Timestamp;
}
```

### wallets/{uid}
```typescript
{
  id: string; // Same as userId
  userId: string;
  stars: number;
  usd: number; // In cents
  totalEarned: number;
  totalSpent: number;
  // ... other fields
}
```

### users/{uid}
```typescript
{
  id: string;
  stars?: number; // Fallback if wallet doesn't exist
  // ... other user fields
}
```

## 🔄 Real-Time Listeners

### CallScreen
- Listens to `calls/{callId}` for call status and roomId updates
- Updates UI when call status changes
- Gets `roomId` from Firestore for 100ms initialization

### LivePartyScreen
- Listens to `livestreams/{livestreamId}` for stream data
- Listens to `livestreams/{livestreamId}/comments` for live chat
- Writes comments to subcollection
- Real-time viewer count updates

### Wallet
- Listens to `users/{uid}` for `stars` field (fallback)
- Primary balance from `wallets/{uid}` via WalletContext

## 📝 Usage Examples

### CallScreen
```tsx
<CallScreen
  callId="call123" // Firestore calls/{id}
  onEndCall={handleEndCall}
/>
```

### LivePartyScreen
```tsx
<LivePartyScreen
  livestreamId="stream123" // Firestore livestreams/{id}
  isHost={true}
/>
```

### Wallet
```tsx
<Wallet />
// Reads from wallets/{uid} (primary)
// Falls back to users/{uid}.stars if wallet doesn't exist
```

---

**Status**: ✅ Components updated to use correct Firestore collections

**Collections**:
- `calls/{id}` - Call data
- `livestreams/{id}` - Live stream data
- `livestreams/{id}/comments` - Live chat comments
- `wallets/{uid}` - Wallet balance (primary)
- `users/{uid}.stars` - User stars (fallback)

