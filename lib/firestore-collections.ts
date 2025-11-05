import { Timestamp } from 'firebase/firestore';

// Add LiveStream interface if it doesn't exist
// ... existing code ...

// ============================================================================
// LIVESTREAMS COLLECTION
// ============================================================================

export interface FirestoreLiveStream {
  id: string; // Document ID
  hostId: string; // User ID of the host
  battleHostId?: string; // User ID of second host (for battle mode)
  
  // Stream status
  status: 'scheduled' | 'live' | 'ended' | 'cancelled';
  
  // Stream info
  title?: string;
  description?: string;
  thumbnailUrl?: string;
  
  // Viewer metrics
  viewerCount: number;
  peakViewerCount: number;
  
  // Battle mode
  isBattleMode: boolean;
  
  // 100ms room info
  roomId?: string; // 100ms room ID
  
  // Timestamps
  scheduledAt?: Timestamp;
  startedAt?: Timestamp;
  endedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  
  // Metadata
  metadata?: {
    tags?: string[];
    category?: string;
    [key: string]: unknown;
  };
}

// ============================================================================
// BATTLES COLLECTION
// ============================================================================

export interface FirestoreBattle {
  id: string; // Document ID
  host1Id: string; // User ID of first host
  host2Id: string; // User ID of second host
  
  // Battle status
  status: 'scheduled' | 'live' | 'ended' | 'cancelled';
  
  // Battle tips
  host1Tips: number;
  host2Tips: number;
  totalTips: number;
  
  // Battle winner
  winnerId?: string | null;
  rewardAmount?: number;
  rewardTransactionId?: string;
  
  // Battle metrics
  duration?: number; // Duration in seconds
  peakViewers?: number;
  
  // 100ms room info
  roomId?: string; // 100ms room ID
  
  // Timestamps
  startedAt?: Timestamp;
  endedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  
  // Metadata
  metadata?: {
    [key: string]: unknown;
  };
}

// ============================================================================
// CALLS COLLECTION
// ============================================================================

export interface FirestoreCall {
  id: string; // Document ID
  roomId: string; // 100ms room ID
  hostId: string; // Call host/initiator
  callerId: string; // User ID of caller
  receiverId?: string; // User ID of receiver (for direct calls)
  participantIds: string[]; // All participants
  
  // Call type
  type: 'direct' | 'group' | 'sip';
  
  // Call status
  status: 'initiated' | 'active' | 'ended' | 'failed' | 'missed';
  
  // SIP settings
  sipEnabled?: boolean;
  sipPhoneNumber?: string;
  
  // Call metrics
  duration?: number; // Duration in seconds
  durationMins?: number; // Duration in minutes
  
  // Pricing
  ratePerMinute?: number; // Rate in cents
  cost?: number; // Cost in cents
  costCurrency?: 'USD' | 'STARS';
  
  // Payment
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'free_trial';
  paymentId?: string;
  ghlInvoiceId?: string;
  transactionId?: string;
  
  // Timestamps
  startedAt?: Timestamp;
  endedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  
  // Metadata
  metadata?: {
    [key: string]: unknown;
  };
}

// ============================================================================
// LIVEPARTIES COLLECTION
// ============================================================================

export interface FirestoreLiveParty {
  id: string; // Document ID
  hostId: string; // User ID of the host
  
  // Party status
  status: 'scheduled' | 'live' | 'ended' | 'cancelled';
  
  // Entry fee
  entryFee: number; // Entry fee in cents or stars
  entryFeeCurrency: 'USD' | 'STARS';
  
  // Viewer fees
  viewerFeePerMinute?: number;
  viewerFeeCurrency?: 'USD' | 'STARS';
  
  // Revenue
  totalEntryRevenue: number;
  totalViewerRevenue: number;
  totalTips: number;
  
  // Viewers
  viewers: string[]; // Array of viewer user IDs
  viewerMinutes: Record<string, number>; // userId -> minutes watched
  
  // 100ms room info
  roomId?: string; // 100ms room ID
  
  // Timestamps
  scheduledAt?: Timestamp;
  startedAt?: Timestamp;
  endedAt?: Timestamp;
  duration?: number; // Duration in seconds
  createdAt: Timestamp;
  updatedAt: Timestamp;
  
  // Metadata
  metadata?: {
    [key: string]: unknown;
  };
}

// ============================================================================
// TRANSACTIONS COLLECTION
// ============================================================================

export interface FirestoreTransaction {
  id: string; // Document ID
  userId: string; // User who made the transaction
  type: string; // Transaction type (call, liveparty_entry, tip, topup, battle_tip, battle_reward, etc.)
  amount: number; // Transaction amount
  currency: 'USD' | 'STARS';
  status: 'pending' | 'completed' | 'failed';
  description?: string;
  
  // Call-related fields
  callId?: string;
  callDuration?: number;
  callRate?: number;
  
  // Battle-related fields
  battleId?: string;
  battleHostId?: string;
  
  // LiveParty-related fields
  livePartyId?: string;
  livePartyEntryFee?: number;
  livePartyViewerMinutes?: number;
  livePartyViewerRate?: number;
  
  // Payment fields
  paymentId?: string;
  ghlTransactionId?: string;
  
  // Timestamps
  completedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  
  // Metadata
  metadata?: {
    [key: string]: unknown;
  };
}

export interface CreateTransactionData {
  userId: string;
  type: string;
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
  metadata?: {
    [key: string]: unknown;
  };
}

// ============================================================================
// PAYMENTS COLLECTION
// ============================================================================

export interface FirestorePayment {
  id: string; // Document ID
  userId: string; // User who made the payment
  amount: number; // Payment amount in cents
  currency: 'USD' | 'STARS';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'cancelled';
  
  // Related entities
  callId?: string;
  livestreamId?: string;
  transactionId?: string;
  chatId?: string; // Chat room ID (for message unlock payments)
  messageId?: string; // Message ID (for message unlock payments)
  
  // GHL integration
  ghlInvoiceId?: string;
  ghlTransactionId?: string;
  ghlContactId?: string;
  ghlLocationId?: string;
  
  // Payment method
  paymentMethod?: string;
  paymentMethodId?: string; // Payment method ID from payment provider
  description?: string;
  
  // Timestamps
  completedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  
  // Metadata
  metadata?: {
    [key: string]: unknown;
  };
}

// ============================================================================
// TIPS COLLECTION
// ============================================================================

export interface FirestoreTip {
  id: string; // Document ID
  livestreamId?: string; // Livestream/LiveParty ID
  hostId: string; // Host receiving the tip
  tipperId: string; // User sending the tip
  amount: number; // Tip amount in stars
  currency: 'USD' | 'STARS';
  message?: string; // Optional tip message
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  
  // Metadata
  metadata?: {
    [key: string]: unknown;
  };
}

// ============================================================================
// USERS COLLECTION
// ============================================================================

export interface FirestoreUser {
  id: string; // Document ID (user UID)
  phone?: string; // User phone number
  email?: string;
  displayName?: string;
  photoURL?: string;
  audioCallEnabled?: boolean;
  stars: number; // User's star balance
  tier: 'free' | 'basic' | 'premium' | 'enterprise' | 'litplus';
  status?: 'online' | 'offline' | 'away' | 'busy';
  fcmToken?: string; // FCM token for push notifications
  ghlId?: string; // GHL contact ID
  ghlContactId?: string; // GHL contact ID (backward compatibility)
  ghlLocationId?: string; // GHL location ID
  
  // Timestamps
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  lastLogin?: Timestamp;
  lastSeen?: Timestamp;
  
  // Metadata
  metadata?: {
    [key: string]: unknown;
  };
}

// ============================================================================
// CHATS COLLECTION
// ============================================================================

export interface FirestoreChat {
  id: string; // Document ID
  name?: string; // Chat room name
  description?: string;
  avatar?: string;
  participantIds: string[]; // Array of participant user IDs
  unreadCounts: Record<string, number>; // userId -> unread count
  lastMessageId?: string; // ID of last message
  lastMessageAt?: Timestamp; // Timestamp of last message
  isGroup?: boolean; // Whether this is a group chat
  createdAt: Timestamp;
  updatedAt: Timestamp;
  
  // Metadata
  metadata?: {
    [key: string]: unknown;
  };
}

// ============================================================================
// MESSAGES COLLECTION
// ============================================================================

export interface FirestoreMessage {
  id: string; // Document ID
  chatId: string; // Chat room ID
  senderId: string; // User ID of sender
  senderName: string; // Display name of sender
  senderAvatar?: string; // Avatar URL of sender
  content: string; // Message content
  type: 'text' | 'image' | 'file' | 'system' | 'payment';
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: Timestamp; // Message timestamp
  replyTo?: string; // ID of message being replied to
  isEdited?: boolean; // Whether message was edited
  editedAt?: Timestamp; // When message was edited
  readBy?: Record<string, Timestamp>; // userId -> read timestamp
  
  // Lock/unlock functionality
  isLocked?: boolean; // Whether message is locked (requires payment)
  unlockPrice?: number; // Unlock price in cents
  unlockCurrency?: 'USD' | 'STARS'; // Unlock currency
  unlockedBy?: string[] | Record<string, unknown>; // Users who unlocked (array or map)
  ghlInvoiceId?: string; // GHL invoice ID for unlock payment
  attachments?: Array<{ url: string; type: string; name?: string; size?: number }>; // Message attachments

  createdAt: Timestamp;
  updatedAt?: Timestamp;
  
  // Metadata
  metadata?: {
    [key: string]: unknown;
  };
}

export interface CreateMessageData {
  chatId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  type?: 'text' | 'image' | 'file' | 'system' | 'payment';
  replyTo?: string;
}

// ... rest of existing code ...
