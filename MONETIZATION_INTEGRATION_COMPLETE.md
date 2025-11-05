# Monetization Integration - Calls & Battles

## Overview
Complete monetization system for 1-on-1 calls, LiveParty, and BattleMode with integrated wallet, GHL payments, and transaction tracking.

## ✅ Implementation Complete

### 1️⃣ 1-on-1 Calls Monetization

**Location**: `app/api/calls/bill/route.ts`

**Features**:
- **Duration-based billing**: `duration × ratePerMinute` (default: $1.00/min)
- **Payment options**:
  - Stars (deducted from wallet immediately)
  - USD via GHL invoice (payment confirmed via webhook)
- **Trial logic**: 
  - First 3 days free for calls ≤ 1 minute
  - Checks trial eligibility before billing
  - Prompts upgrade after trial expiration
- **Transaction sync**: All payments recorded in `transactions` collection

**Flow**:
```
Call Ends → Check Trial Eligibility
  ↓
If Trial Eligible → Free (record usage)
  ↓
If Trial Expired → Prompt Upgrade (402 Payment Required)
  ↓
Calculate Cost → Check Payment Method
  ↓
STARS → Deduct from wallet → Create transaction
  ↓
USD → Create GHL invoice → Create transaction → Webhook confirms
```

### 2️⃣ LiveParty Monetization

#### Entry Fee (Ticket)
**Location**: `app/api/liveparties/entry/route.ts`

- **Payment methods**: Stars or USD via GHL
- **Validation**: Checks if user already joined
- **Transaction sync**: Recorded in `transactions` with type `liveparty_entry`
- **Revenue tracking**: Updates `totalEntryRevenue` on LiveParty

#### Per-Minute Viewer Fee (Optional)
**Location**: `app/api/liveparties/viewer-fee/route.ts`

- **Billing**: Called periodically (e.g., every minute) while watching
- **Calculation**: `minutesWatched × viewerFeePerMinute`
- **Incremental billing**: Only bills new minutes since last check
- **Payment methods**: Stars or USD via GHL
- **Transaction sync**: Recorded with type `liveparty_viewer`

#### TipModal
**Location**: `components/monetization/TipModal.tsx`

- **Features**:
  - Supports both Stars and USD via GHL
  - Real-time wallet balance display
  - Preset tip amounts
  - Used in both LiveParty and BattleMode
- **Payment flow**: Stars deducted immediately, USD creates GHL invoice

### 3️⃣ BattleMode Monetization

#### Tip Tracking
**Location**: `app/api/battles/tip/route.ts`

- **Features**:
  - Tips tracked per host (`host1Tips`, `host2Tips`)
  - Total tips aggregated (`totalTips`)
  - Stars deducted from tipper's wallet
  - Transaction recorded with type `battle_tip`

#### Winner Determination & Rewards
**Location**: `app/api/streams/end/route.ts`

**After `stream_end` webhook**:

1. **Calculate total tips** from transaction records:
   - Queries `transactions` collection for `battle_tip` type
   - Sums tips per host (`host1TotalTips`, `host2TotalTips`)

2. **Determine winner**:
   - Host with most tips wins
   - Tie = no winner (both get 50% of their tips)

3. **Reward workflow**:
   - Winner receives 50% of total tips as reward
   - Reward added to winner's wallet via `addStars()`
   - Transaction created with type `battle_reward`
   - Battle record updated with `winnerId`, `rewardAmount`, `rewardTransactionId`

**Example**:
```javascript
// Battle ends with:
// Host1: 5000 stars in tips
// Host2: 3000 stars in tips
// Total: 8000 stars

// Winner: Host1
// Reward: 4000 stars (50% of total)
// Host1 wallet: +4000 stars
```

### 4️⃣ Payment & Transaction Sync

#### Transaction Creation
All monetization actions create transactions in `transactions` collection:

**Transaction Types**:
- `call` - 1-on-1 call billing
- `battle_tip` - Tip to battle host
- `battle_reward` - Winner reward
- `liveparty_entry` - Entry fee
- `liveparty_viewer` - Per-minute viewer fee
- `liveparty_tip` - Tip to LiveParty host

**Transaction Fields**:
- `userId` - User who paid
- `type` - Transaction type
- `amount` - Amount in cents (USD) or stars
- `currency` - 'USD' or 'STARS'
- `status` - 'pending' | 'completed' | 'failed'
- `paymentId` - GHL payment ID (if USD)
- `metadata` - Additional context (callId, battleId, etc.)

#### GHL Payment Webhook Integration
**Location**: `app/api/payments/webhook/route.ts`

**Enhanced to sync transactions**:
- When `InvoicePaid` webhook arrives:
  1. Checks payment metadata for `transactionId`
  2. Completes transaction via `completeTransaction()`
  3. Updates transaction status to 'completed'
  4. Links payment to transaction

**Transaction ID in Payment Metadata**:
```javascript
// When creating GHL payment:
{
  metadata: {
    transactionId: "tx_123",
    type: "call",
    callId: "call_456"
  }
}
```

### 5️⃣ LIT+ Trial Logic

**Location**: `lib/trial.ts`

**Trial Configuration**:
- **Duration**: 3 days
- **Max call minutes**: 1 minute per call
- **Max calls**: Unlimited (but each must be ≤ 1 min)

**Trial Flow**:
1. **User signs up** → `initializeTrial()` called
2. **Call starts** → Check trial eligibility
3. **Call ends** → If eligible:
   - Record as free trial
   - Track usage (`callTrialMinutesUsed`, `callTrialCallsUsed`)
4. **Trial expires** → Check expiration
   - If expired → Prompt upgrade (402 Payment Required)
   - Show `UpgradePrompt` component

**Upgrade Prompt**
**Location**: `components/monetization/UpgradePrompt.tsx`

- Displays when trial expires
- Shows LIT+ benefits
- Redirects to `/upgrade` page

## Data Flow

### Call Billing Flow
```
Call Ends
  ↓
/api/calls/bill
  ↓
Check Trial Eligibility
  ↓
If Eligible → Free (record usage)
If Not → Calculate Cost
  ↓
STARS: Deduct wallet → Create transaction
USD: Create GHL invoice → Create transaction → Webhook confirms
```

### Battle Reward Flow
```
Battle Ends (stream_end webhook)
  ↓
/api/streams/end
  ↓
Query transactions for battle_tip
  ↓
Sum tips per host
  ↓
Determine winner
  ↓
Add 50% of total tips to winner's wallet
  ↓
Create battle_reward transaction
```

### LiveParty Entry Flow
```
User Joins LiveParty
  ↓
/api/liveparties/entry
  ↓
Check if already joined
  ↓
STARS: Deduct wallet → Create transaction
USD: Create GHL invoice → Create transaction → Webhook confirms
  ↓
Add user to viewers
Update totalEntryRevenue
```

## Wallet Integration

**Location**: `lib/wallet.ts`

All monetization actions sync with wallet:
- **Spending**: `spendStars()` deducts from `wallets.stars`
- **Earning**: `addStars()` adds to `wallets.stars` (battle rewards)
- **Real-time updates**: `WalletContext` provides live balance via Firestore listener

## Transaction Sync

**Location**: `lib/transactions.ts`

**Functions**:
- `createTransaction()` - Create transaction record
- `createTransactionAndDeductWallet()` - Atomic transaction + wallet deduction
- `completeTransaction()` - Mark transaction as completed (via webhook)

**All transactions**:
- Recorded in `transactions` collection
- Linked to payments via `paymentId`
- Tracked in wallet via `totalSpent` and `totalEarned`

## Testing

### Test Call Billing
```bash
POST /api/calls/bill
{
  "callId": "call_123",
  "duration": 120, // 2 minutes
  "userId": "user_123",
  "receiverId": "user_456",
  "ratePerMinute": 100, // $1.00/min
  "currency": "STARS" // or "USD"
}
```

### Test Battle Tip
```bash
POST /api/battles/tip
{
  "battleId": "battle_123",
  "hostId": "host_123",
  "userId": "user_123",
  "amount": 1000 // stars
}
```

### Test LiveParty Entry
```bash
POST /api/liveparties/entry
{
  "livePartyId": "party_123",
  "userId": "user_123",
  "currency": "STARS" // or "USD"
}
```

### Test Stream End (Battle Winner)
```bash
POST /api/streams/end
{
  "streamId": "battle_123",
  "type": "battle",
  "duration": 3600, // 1 hour
  "viewerCount": 100
}
```

## Summary

✅ **1-on-1 Calls**: Duration-based billing with trial logic  
✅ **LiveParty**: Entry fees, viewer fees, tips  
✅ **BattleMode**: Tip tracking, winner determination, rewards  
✅ **Wallet Integration**: Real-time balance updates  
✅ **Transaction Sync**: All payments tracked in Firestore  
✅ **GHL Integration**: USD payments via invoices  
✅ **Trial Logic**: 3-day free trial with upgrade prompts

All monetization features are fully integrated and ready for production use!

