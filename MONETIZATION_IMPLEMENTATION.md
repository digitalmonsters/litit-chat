# Monetization Implementation

## Overview
Complete monetization system for calls, battles, and LiveParty with wallet integration, GHL payments, and LIT+ trial logic.

## Features Implemented

### 1. 1-on-1 Calls Monetization

**Endpoint**: `POST /api/calls/bill`

**Billing Logic**:
- **Trial Period**: First 3 days free, calls ≤ 1 minute
- **Post-Trial**: Duration × rate → wallet deduction or GHL invoice
- **Trial Expiration**: Prompts upgrade with 402 Payment Required status

**Payment Methods**:
- **Stars**: Direct wallet deduction
- **USD**: GHL invoice creation (confirmed via webhook)

**Rate**: Default $1.00/minute (100 cents), configurable per call

**Example**:
```json
POST /api/calls/bill
{
  "callId": "call_123",
  "duration": 120, // 2 minutes
  "userId": "user_123",
  "receiverId": "user_456",
  "ratePerMinute": 100,
  "currency": "USD"
}
```

**Response (Trial Expired)**:
```json
{
  "success": false,
  "requiresUpgrade": true,
  "message": "Trial period expired. Please upgrade to LIT+ to continue making calls.",
  "upgradeUrl": "/upgrade"
}
```

### 2. LiveParty Monetization

#### Entry Fee
**Endpoint**: `POST /api/liveparties/entry`

- **Entry Fee**: One-time ticket price (stars or USD)
- **Payment**: Stars (wallet) or USD (GHL invoice)
- **Tracking**: Adds user to viewers list, updates revenue

#### Per-Minute Viewer Fee (Optional)
**Endpoint**: `POST /api/liveparties/viewer-fee`

- **Billing**: Called periodically (every minute) while watching
- **Tracking**: Tracks minutes watched per user
- **Payment**: Stars or USD via GHL
- **Revenue**: Accumulates in `totalViewerRevenue`

**Example**:
```json
POST /api/liveparties/viewer-fee
{
  "livePartyId": "party_123",
  "userId": "user_123",
  "minutesWatched": 5,
  "currency": "STARS"
}
```

#### Tip Modal
**Component**: `components/monetization/TipModal.tsx`

- **Payment**: Stars or USD via GHL
- **Context**: Supports both BattleMode and LiveParty
- **Real-time**: Updates wallet balance immediately

### 3. BattleMode Monetization

#### Tip Tracking
**Endpoint**: `POST /api/battles/tip`

- **Tracking**: Total stars tipped to each host
- **Storage**: Synced to `transactions` collection
- **Real-time**: Updates battle tip totals immediately

**Tip Flow**:
1. User sends tip via TipModal
2. Stars deducted from wallet
3. Transaction created in `transactions`
4. Battle document updated with tip totals

#### Stream End Webhook
**Endpoint**: `POST /api/streams/end`

**Battle Winner Determination**:
1. Queries all `battle_tip` transactions for the battle
2. Calculates total tips per host from transaction records
3. Determines winner (host with most tips)
4. Awards 50% of total tips as reward
5. Updates wallet with reward stars

**Reward Workflow**:
```
stream_end webhook
  ↓
Query transaction records
  ↓
Calculate host1Tips vs host2Tips
  ↓
Determine winner
  ↓
Add 50% of total tips to winner's wallet
  ↓
Create battle_reward transaction
  ↓
Update battle with winnerId & rewardAmount
```

### 4. Payment Sync

**All Payments Sync To**:
- ✅ `Firestore.transactions` collection
- ✅ `users.wallet` (stars balance)
- ✅ `payments` collection (GHL payments)

**Transaction Types**:
- `call`: Call billing
- `battle_tip`: Tip to battle host
- `battle_reward`: Battle winner reward
- `liveparty_entry`: Entry fee
- `liveparty_viewer`: Per-minute viewer fee
- `liveparty_tip`: Tip to LiveParty host
- `wallet_topup`: Wallet top-up
- `subscription`: Subscription payment

**Transaction Flow**:
```
Payment Initiated
  ↓
Create transaction (status: 'pending')
  ↓
Deduct wallet (if stars) OR Create GHL invoice (if USD)
  ↓
Webhook confirms payment
  ↓
Update transaction (status: 'completed')
  ↓
Sync to wallet (if USD → stars conversion)
```

### 5. LIT+ Trial Logic

**Configuration** (`lib/trial.ts`):
- **Duration**: 3 days
- **Call Limit**: 1 minute per call
- **Call Count**: Unlimited (during trial period)

**Trial Check Flow**:
```
Call Ends
  ↓
Check trial eligibility
  ↓
┌─────────────────┬──────────────────┐
│  In Trial       │  Trial Expired   │
│  ≤ 1 min        │  or > 1 min      │
└─────────────────┴──────────────────┘
    ↓                      ↓
Free Call          Upgrade Prompt
Record Usage        (402 status)
```

**Trial Initialization**:
- Called when user signs up or upgrades
- Sets `trialStartDate` and `trialEndDate`
- Tracks `callTrialMinutesUsed` and `callTrialCallsUsed`

**Upgrade Prompt**:
- Component: `components/monetization/UpgradePrompt.tsx`
- Triggered when trial expires
- Shows benefits and upgrade CTA

### 6. Upgrade Prompt Component

**Component**: `components/monetization/UpgradePrompt.tsx`

**Features**:
- Flame-themed modal
- Trial info display
- LIT+ benefits list
- Upgrade CTA button

**Usage**:
```tsx
<UpgradePrompt
  isOpen={showUpgrade}
  onClose={() => setShowUpgrade(false)}
  message="Your free trial has expired."
  showTrialInfo={true}
  trialDaysRemaining={0}
/>
```

## API Endpoints

### Calls
- `POST /api/calls/bill` - Bill a call after it ends

### LiveParty
- `POST /api/liveparties/entry` - Pay entry fee
- `POST /api/liveparties/viewer-fee` - Bill per-minute viewer fee
- `POST /api/liveparties/tip` - Tip host

### Battles
- `POST /api/battles/tip` - Tip battle host

### Streams
- `POST /api/streams/end` - Handle stream end webhook

## Database Collections

### transactions
All monetary transactions stored here:
- Call billing
- Tips (battle & LiveParty)
- Entry fees
- Viewer fees
- Rewards
- Wallet top-ups

### wallets
User wallet balances:
- `stars`: Virtual currency balance
- `usd`: USD balance (in cents)
- Transaction history fields

### calls
Call records with billing info:
- `paymentStatus`: 'free_trial' | 'pending' | 'paid'
- `totalCost`: Billing amount
- `currency`: 'USD' | 'STARS'
- `transactionId`: Reference to transaction

### battles
Battle records:
- `host1Tips`: Total tips to host 1
- `host2Tips`: Total tips to host 2
- `totalTips`: Combined tips
- `winnerId`: Winner after stream ends
- `rewardAmount`: Reward awarded to winner

### liveparties
LiveParty records:
- `entryFee`: One-time entry fee
- `viewerFeePerMinute`: Optional per-minute fee
- `totalEntryRevenue`: Entry fee revenue
- `totalViewerRevenue`: Viewer fee revenue
- `totalTips`: Tip revenue
- `viewerMinutes`: Map of userId → minutes watched

## Monetization Flow Diagrams

### Call Billing Flow
```
Call Ends
  ↓
Check Trial Eligibility
  ↓
┌─────────────┬──────────────┐
│ In Trial    │ Post-Trial   │
│ ≤ 1 min     │              │
└─────────────┴──────────────┘
    ↓              ↓
Free Call    Check Trial Expired
    ↓              ↓
Record      Prompt Upgrade?
    ↓              ↓
Complete    ┌─────────────┬──────────────┐
            │ Expired     │ Active       │
            └─────────────┴──────────────┘
                ↓              ↓
            Return 402    Bill User
                ↓              ↓
            Upgrade URL   ┌──────────┬──────────┐
                         │ Stars    │ USD      │
                         └──────────┴──────────┘
                             ↓          ↓
                         Deduct    GHL Invoice
                         Wallet    (webhook)
```

### Battle Tip Flow
```
User Clicks Tip
  ↓
TipModal Opens
  ↓
Select Amount & Currency
  ↓
┌──────────┬──────────┐
│ Stars    │ USD     │
└──────────┴──────────┘
    ↓          ↓
Deduct    GHL Invoice
Wallet    (webhook)
    ↓          ↓
Create Transaction
    ↓
Update Battle Tips
    ↓
Update Wallet Balance
```

### Stream End Flow
```
stream_end Webhook
  ↓
Query Battle Transactions
  ↓
Calculate Tips Per Host
  ↓
Determine Winner
  ↓
Calculate Reward (50% of tips)
  ↓
Add Stars to Winner Wallet
  ↓
Create Reward Transaction
  ↓
Update Battle Status
```

## Testing

### Test Call Billing
```bash
curl -X POST http://localhost:3000/api/calls/bill \
  -H "Content-Type: application/json" \
  -d '{
    "callId": "test_call",
    "duration": 120,
    "userId": "test_user",
    "receiverId": "test_receiver",
    "ratePerMinute": 100,
    "currency": "USD"
  }'
```

### Test LiveParty Entry
```bash
curl -X POST http://localhost:3000/api/liveparties/entry \
  -H "Content-Type: application/json" \
  -d '{
    "livePartyId": "test_party",
    "userId": "test_user",
    "currency": "STARS"
  }'
```

### Test Viewer Fee
```bash
curl -X POST http://localhost:3000/api/liveparties/viewer-fee \
  -H "Content-Type: application/json" \
  -d '{
    "livePartyId": "test_party",
    "userId": "test_user",
    "minutesWatched": 5,
    "currency": "STARS"
  }'
```

### Test Battle Tip
```bash
curl -X POST http://localhost:3000/api/battles/tip \
  -H "Content-Type: application/json" \
  -d '{
    "battleId": "test_battle",
    "hostId": "test_host",
    "userId": "test_user",
    "amount": 1000
  }'
```

### Test Stream End
```bash
curl -X POST http://localhost:3000/api/streams/end \
  -H "Content-Type: application/json" \
  -d '{
    "streamId": "test_battle",
    "type": "battle",
    "duration": 3600,
    "viewerCount": 100
  }'
```

## Environment Variables

Required:
- `NEXT_PUBLIC_APP_URL`: Base URL for upgrade links
- `GHL_LOCATION_ID`: GHL location ID for payments

## Notes

- All transactions are recorded in `transactions` collection
- Wallet balances update in real-time via Firestore listeners
- Trial logic checks call duration (must be ≤ 1 minute)
- Upgrade prompt shown when trial expires
- Battle winner determined from transaction records (not battle document)
- Viewer fees billed incrementally (only new minutes)
- All USD payments create GHL invoices (confirmed via webhook)

