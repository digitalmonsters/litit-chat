import { Timestamp } from 'firebase/firestore';
import { COLLECTIONS } from './firebase';

/**
 * Firestore Collection Type Definitions
 * These types match the Firestore document structure
 */

// ============================================================================
// USERS COLLECTION
// ============================================================================

export interface FirestoreUser {
  id: string; // Document ID
  email: string;
  displayName: string;
  photoURL?: string;
  status: 'online' | 'offline' | 'away' | 'busy';
  lastSeen: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  
  // Authentication
  provider: 'google' | 'apple' | 'facebook' | 'phone' | 'email' | 'anonymous';
  verified: boolean;
  lastLogin: Timestamp;
  
  // Profile
  bio?: string;
  location?: {
    latitude: number;
    longitude: number;
    city?: string;
    country?: string;
    address?: string;
  };
  interests?: string[];
  
  // GHL Integration
  ghlContactId?: string; // GHL contact ID (synced with ghlId)
  ghlId?: string; // GHL contact ID (primary sync field)
  ghlLocationId?: string;
  
  // Subscription/Tier
  tier?: 'free' | 'basic' | 'premium' | 'enterprise' | 'litplus';
  
  // Trial & Subscription
  trialStartDate?: Timestamp;
  trialEndDate?: Timestamp;
  trialUsed?: boolean;
  subscriptionExpiresAt?: Timestamp;
  
  // Additional metadata
  metadata?: {
    phone?: string;
    timezone?: string;
    preferences?: Record<string, unknown>;
    callTrialMinutesUsed?: number; // Track trial call minutes
    callTrialCallsUsed?: number; // Track trial call count
  };
}

export interface CreateUserData {
  email: string;
  displayName: string;
  photoURL?: string;
  ghlContactId?: string;
  ghlLocationId?: string;
  metadata?: FirestoreUser['metadata'];
}

// ============================================================================
// CHATS COLLECTION
// ============================================================================

export interface FirestoreChat {
  id: string; // Document ID
  name: string;
  description?: string;
  type: 'direct' | 'group';
  avatar?: string;
  
  // Participants
  participantIds: string[];
  participantDetails?: Record<string, {
    displayName: string;
    photoURL?: string;
    role?: 'admin' | 'member';
    joinedAt: Timestamp;
  }>;
  
  // Chat metadata
  lastMessageId?: string;
  lastMessageAt?: Timestamp;
  unreadCounts?: Record<string, number>; // userId -> count
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  
  // GHL Integration
  ghlContactId?: string;
  ghlLocationId?: string;
  
  // Additional metadata
  metadata?: Record<string, unknown>;
}

export interface CreateChatData {
  name: string;
  description?: string;
  type: 'direct' | 'group';
  avatar?: string;
  participantIds: string[];
  createdBy: string;
  ghlContactId?: string;
  ghlLocationId?: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// MESSAGES COLLECTION
// ============================================================================

export interface FirestoreMessage {
  id: string; // Document ID
  chatId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  
  // Message content
  content: string;
  type: 'text' | 'image' | 'file' | 'system' | 'payment';
  
  // Message status
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  
  // Timestamps
  timestamp: Timestamp;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  
  // Message features
  isEdited?: boolean;
  editedAt?: Timestamp;
  replyTo?: string; // messageId
  
  // File attachments
  attachments?: {
    url: string;
    type: string;
    name: string;
    size: number;
  }[];
  
  // Payment reference (if type is 'payment')
  paymentId?: string;
  
  // Locked media (requires payment to unlock)
  isLocked?: boolean;
  unlockPrice?: number; // Price in cents
  unlockCurrency?: string; // Default: 'USD'
  ghlInvoiceId?: string; // GHL invoice ID for payment
  unlockedBy?: string[] | Record<string, Timestamp>; // Array of user IDs or map of userId -> unlock timestamp
  
  // Read receipts
  readBy?: Record<string, Timestamp>; // userId -> timestamp
  
  // Additional metadata
  metadata?: Record<string, unknown>;
}

export interface CreateMessageData {
  chatId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  type?: FirestoreMessage['type'];
  replyTo?: string;
  attachments?: FirestoreMessage['attachments'];
  paymentId?: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// PAYMENTS COLLECTION
// ============================================================================

export interface FirestorePayment {
  id: string; // Document ID
  userId: string;
  chatId?: string;
  messageId?: string;
  
  // Payment details
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'cancelled';
  
  // Payment method
  paymentMethod: 'stripe' | 'ghl' | 'other';
  paymentMethodId?: string;
  
  // Stripe integration
  stripePaymentIntentId?: string;
  stripeCustomerId?: string;
  stripeChargeId?: string;
  
  // GHL integration
  ghlTransactionId?: string;
  ghlContactId?: string;
  ghlLocationId?: string;
  
  // Payment metadata
  description?: string;
  metadata?: Record<string, unknown>;
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  completedAt?: Timestamp;
  failedAt?: Timestamp;
  
  // Error tracking
  error?: {
    code: string;
    message: string;
    timestamp: Timestamp;
  };
}

export interface CreatePaymentData {
  userId: string;
  chatId?: string;
  messageId?: string;
  amount: number;
  currency: string;
  paymentMethod: FirestorePayment['paymentMethod'];
  description?: string;
  stripePaymentIntentId?: string;
  ghlTransactionId?: string;
  ghlContactId?: string;
  ghlLocationId?: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// WALLETS COLLECTION
// ============================================================================

export interface FirestoreWallet {
  id: string; // Document ID (same as userId)
  userId: string;
  
  // Balance fields
  stars: number; // Virtual currency (stars)
  usd: number; // USD balance (in cents)
  
  // Transaction history
  totalEarned: number; // Total stars earned (in stars)
  totalSpent: number; // Total stars spent (in stars)
  totalUsdSpent: number; // Total USD spent (in cents)
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastActivityAt?: Timestamp;
  
  // Metadata
  metadata?: Record<string, unknown>;
}

export interface CreateWalletData {
  userId: string;
  stars?: number;
  usd?: number;
  metadata?: Record<string, unknown>;
}

export interface UpdateWalletData {
  stars?: number;
  usd?: number;
  totalEarned?: number;
  totalSpent?: number;
  totalUsdSpent?: number;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Collection Helper Functions
// ============================================================================

// ============================================================================
// TRANSACTIONS COLLECTION
// ============================================================================

export interface FirestoreTransaction {
  id: string; // Document ID
  userId: string;
  
  // Transaction type
  type: 'call' | 'battle_tip' | 'liveparty_entry' | 'liveparty_viewer' | 'liveparty_tip' | 'battle_reward' | 'wallet_topup' | 'subscription';
  
  // Transaction details
  amount: number; // Amount in cents (USD) or stars
  currency: 'USD' | 'STARS';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  
  // Context-specific fields
  callId?: string;
  callDuration?: number; // Duration in seconds
  callRate?: number; // Rate per minute in cents
  
  battleId?: string;
  battleHostId?: string; // Host who received the tip
  battleTotalTips?: number; // Total tips for this battle
  
  livePartyId?: string;
  livePartyEntryFee?: number;
  livePartyViewerMinutes?: number;
  livePartyViewerRate?: number;
  
  // Payment reference
  paymentId?: string;
  ghlTransactionId?: string;
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  completedAt?: Timestamp;
  
  // Metadata
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface CreateTransactionData {
  userId: string;
  type: FirestoreTransaction['type'];
  amount: number;
  currency: 'USD' | 'STARS';
  callId?: string;
  callDuration?: number;
  callRate?: number;
  battleId?: string;
  battleHostId?: string;
  livePartyId?: string;
  livePartyEntryFee?: number;
  livePartyViewerMinutes?: number;
  livePartyViewerRate?: number;
  paymentId?: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// CALLS COLLECTION
// ============================================================================

export interface FirestoreCall {
  id: string; // Document ID
  roomId: string; // 100ms room ID
  hostId: string; // User ID of host/caller
  participantIds: string[]; // User IDs of participants
  type: 'direct' | 'group' | 'sip';
  
  // Legacy fields for backward compatibility
  callerId?: string;
  receiverId?: string;
  
  // SIP configuration
  sipEnabled?: boolean;
  sipPhoneNumber?: string;
  
  // Call status
  status: 'initiating' | 'initiated' | 'ringing' | 'active' | 'ended' | 'failed' | 'missed';
  
  // Call timing
  startedAt?: Timestamp;
  endedAt?: Timestamp;
  duration?: number; // Duration in seconds
  
  // Monetization
  ratePerMinute?: number; // Rate in cents
  cost?: number; // Total cost in cents (for 100ms calls)
  totalCost?: number; // Total cost in cents (legacy)
  costCurrency?: string;
  currency?: 'USD' | 'STARS';
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'free_trial';
  transactionId?: string;
  
  // Payment reference
  paymentId?: string;
  invoiceId?: string;
  
  // Trial info
  isTrialCall?: boolean;
  trialMinutesUsed?: number;
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  
  // Metadata
  metadata?: Record<string, unknown>;
}

// ============================================================================
// BATTLES COLLECTION
// ============================================================================

export interface FirestoreBattle {
  id: string; // Document ID
  host1Id: string;
  host2Id: string;
  
  // Battle status
  status: 'scheduled' | 'live' | 'ended' | 'cancelled';
  
  // Battle timing
  scheduledAt?: Timestamp;
  startedAt?: Timestamp;
  endedAt?: Timestamp;
  duration?: number; // Duration in seconds
  
  // Tips & Rewards
  host1Tips: number; // Total stars tipped to host1
  host2Tips: number; // Total stars tipped to host2
  totalTips: number; // Total stars tipped
  
  // Winner
  winnerId?: string;
  rewardAmount?: number; // Reward in stars
  rewardTransactionId?: string;
  
  // Viewer count
  peakViewers?: number;
  totalViewers?: number;
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  
  // Metadata
  metadata?: Record<string, unknown>;
}

// ============================================================================
// LIVEPARTIES COLLECTION
// ============================================================================

export interface FirestoreLiveParty {
  id: string; // Document ID
  hostId: string;
  
  // Party status
  status: 'scheduled' | 'live' | 'ended' | 'cancelled';
  
  // Party timing
  scheduledAt?: Timestamp;
  startedAt?: Timestamp;
  endedAt?: Timestamp;
  duration?: number; // Duration in seconds
  
  // Monetization
  entryFee: number; // Entry fee in cents (USD) or stars
  entryFeeCurrency: 'USD' | 'STARS';
  viewerFeePerMinute?: number; // Optional per-minute viewer fee
  viewerFeeCurrency?: 'USD' | 'STARS';
  
  // Revenue
  totalEntryRevenue: number;
  totalViewerRevenue: number;
  totalTips: number;
  
  // Viewer tracking
  viewers: string[]; // Array of viewer user IDs
  viewerMinutes: Record<string, number>; // userId -> minutes watched
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  
  // Metadata
  metadata?: Record<string, unknown>;
}

export const getCollectionPath = {
  users: () => COLLECTIONS.USERS,
  chats: () => COLLECTIONS.CHATS,
  messages: (chatId?: string) => 
    chatId 
      ? `${COLLECTIONS.CHATS}/${chatId}/${COLLECTIONS.MESSAGES}`
      : COLLECTIONS.MESSAGES,
  payments: () => COLLECTIONS.PAYMENTS,
  wallets: () => COLLECTIONS.WALLETS,
  transactions: () => COLLECTIONS.TRANSACTIONS,
  calls: () => COLLECTIONS.CALLS,
  battles: () => COLLECTIONS.BATTLES,
  liveparties: () => COLLECTIONS.LIVEPARTIES,
} as const;

