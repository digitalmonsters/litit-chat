import type { Timestamp } from 'firebase/firestore';

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
  interests?: string[]; // User interests (from tags)
  provider?: 'google' | 'apple' | 'facebook' | 'phone' | 'email' | 'anonymous';
  verified?: boolean;
  bio?: string;
  location?: string | { address?: string; city?: string; country?: string };
  trialStartDate?: Timestamp | Date | null;
  trialEndDate?: Timestamp | Date | null;

  // Timestamps
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  lastLogin?: Timestamp;
  lastSeen?: Timestamp;

  // Metadata
  metadata?: Record<string, unknown>;
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
  metadata?: Record<string, unknown>;
}

// ============================================================================
// MESSAGES COLLECTION
// ============================================================================

export interface FirestoreMessage {
  id: string; // Document ID
  chatId: string; // Chat this message belongs to
  senderId: string; // User ID of sender
  content?: string; // Text content
  type: 'text' | 'image' | 'video' | 'audio' | 'file'; // Message type
  isLocked?: boolean; // Whether message is locked behind payment
  unlockPrice?: number; // Price in cents to unlock
  unlockCurrency?: string; // Default: 'USD'
  ghlInvoiceId?: string; // GHL invoice ID for payment
  unlockedBy?: string[] | Record<string, Timestamp>; // Array of user IDs or map of userId -> unlock timestamp
  replyToId?: string; // ID of message this is replying to
  editedAt?: Timestamp; // When message was last edited
  timestamp?: Timestamp; // Alias for createdAt
  isEdited?: boolean; // Whether message has been edited
  senderName?: string; // Cached sender display name
  senderAvatar?: string; // Cached sender avatar url
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  createdAt: Timestamp;
  updatedAt: Timestamp;

  // Attachments
  attachments?: Array<{
    id: string;
    type: 'image' | 'video' | 'audio' | 'file';
    url: string;
    filename?: string;
    name?: string; // alias used by UI
    size?: number;
    mimeType?: string;
  }>;

  // Metadata
  metadata?: Record<string, unknown>;
}

// ============================================================================
// WALLETS COLLECTION
// ============================================================================

export interface FirestoreWallet {
  id: string; // Document ID (same as user ID)
  userId: string; // User ID
  stars: number; // Virtual currency (stars)
  usd: number; // USD balance (in cents)
  totalEarned: number; // Total stars earned (in stars)
  totalSpent: number; // Total stars spent (in stars)
  totalUsdSpent: number; // Total USD spent (in cents)
  lastActivityAt?: Timestamp; // Last wallet activity
  metadata?: Record<string, unknown>;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================================================
// TRANSACTIONS COLLECTION
// ============================================================================

export interface FirestoreTransaction {
  id: string; // Document ID
  userId: string;
  type: 'deposit' | 'withdrawal' | 'spend' | 'earn' | 'refund' | 'subscription' | 'topup' | 'call_cost' | 'message_unlock' | 'party_entry' | 'tip' | 'battle_tip' | 'liveparty_tip' | 'battle_reward' | 'call' | 'liveparty_viewer' | 'liveparty_entry';
  amount: number; // Amount in stars or USD cents
  currency: 'USD' | 'STARS';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  description?: string;
  relatedEntityId?: string; // e.g., paymentId, callId, messageId, livestreamId
  callId?: string;
  battleId?: string;
  livepartyId?: string;
  livePartyId?: string; // alias casing used in some routes
  battleHostId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  metadata?: Record<string, unknown>;
}

export interface CreateTransactionData {
  userId: string;
  type: FirestoreTransaction['type'];
  amount: number;
  currency: FirestoreTransaction['currency'];
  description?: string;
  callId?: string;
  callDuration?: number;
  battleId?: string;
  battleHostId?: string;
  livepartyId?: string;
  livePartyId?: string; // alias casing used in some routes
  livePartyEntryFee?: number;
  livePartyViewerMinutes?: number;
  relatedEntityId?: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// TIPS COLLECTION
// ============================================================================

export interface FirestoreTip {
  id: string; // Document ID
  livestreamId?: string; // Live party ID
  hostId: string; // Host who received the tip
  tipperId: string; // User who sent the tip
  amount: number; // Tip amount in stars
  currency: 'USD' | 'STARS';
  battleId?: string; // Battle ID if tip is for battle
  createdAt: Timestamp;
  updatedAt: Timestamp;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// LIVE PARTIES COLLECTION
// ============================================================================

export interface FirestoreLiveParty {
  id: string; // Document ID
  hostId: string;
  roomId?: string; // 100ms room ID
  status: 'scheduled' | 'live' | 'ended' | 'cancelled';
  scheduledAt?: Timestamp;
  startedAt?: Timestamp;
  endedAt?: Timestamp;
  duration?: number; // Duration in seconds
  entryFee: number; // Entry fee in cents (USD) or stars
  entryFeeCurrency: 'USD' | 'STARS';
  viewerFeePerMinute?: number; // Optional per-minute viewer fee
  viewerFeeCurrency?: 'USD' | 'STARS';
  totalEntryRevenue: number;
  totalViewerRevenue: number;
  totalTips: number;
  viewers: string[]; // Array of viewer user IDs
  viewerMinutes: Record<string, number>; // userId -> minutes watched
  createdAt: Timestamp;
  updatedAt: Timestamp;
  metadata?: Record<string, unknown>;
}

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
  metadata?: Record<string, unknown>;
}

// ============================================================================
// MESSAGE CREATION DATA
// ============================================================================

export interface CreateMessageData {
  chatId: string;
  senderId: string;
  content?: string;
  type?: 'text' | 'image' | 'video' | 'audio' | 'file';
  replyToId?: string;
  senderName?: string; // Cached sender display name
  senderAvatar?: string; // Cached sender photo URL
  replyTo?: any; // Reply message data
  attachments?: Array<{
    id: string;
    type: 'image' | 'video' | 'audio' | 'file';
    url: string;
    filename?: string;
    size?: number;
    mimeType?: string;
  }>;
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
  callerId?: string; // Legacy fields for backward compatibility
  receiverId?: string; // Legacy fields for backward compatibility
  calleeId?: string; // Alias for receiverId
  sipEnabled?: boolean;
  sipPhoneNumber?: string;
  status: 'initiating' | 'initiated' | 'ringing' | 'active' | 'ended' | 'failed' | 'missed';

  // Timing and billing
  startedAt?: Timestamp;
  endedAt?: Timestamp;
  duration?: number; // Duration in minutes
  durationMins?: number; // Alias for duration
  ratePerMinute?: number; // Rate in cents per minute
  cost?: number; // Cost in cents
  costCurrency?: 'USD' | 'STARS';
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'free_trial';
  ghlInvoiceId?: string; // GHL invoice ID for payment

  // Timestamps
  createdAt?: Timestamp;
  updatedAt?: Timestamp;

  // Metadata
  metadata?: Record<string, unknown>;
}

// ============================================================================
// PAYMENTS COLLECTION
// ============================================================================

export interface FirestorePayment {
  id: string; // Document ID
  userId: string; // User who made the payment
  callId?: string; // Associated call ID (for call payments)
  chatId?: string; // Associated chat ID (for message unlocks)
  messageId?: string; // Associated message ID (for message unlocks)
  invoiceId?: string; // Invoice ID (alternative to callId)
  amount: number; // Amount in cents or dollars
  currency?: string; // Currency (USD, STARS, etc.)
  status: 'pending' | 'processing' | 'paid' | 'completed' | 'failed' | 'refunded' | 'cancelled';
  method?: string; // Payment method (ghl, stripe, wallet, etc.)
  paymentMethod?: string; // Alias for method
  paymentMethodId?: string; // Payment method ID

  // GHL integration fields
  ghlTransactionId?: string; // GHL transaction/invoice ID
  ghlContactId?: string; // GHL contact ID
  ghlLocationId?: string; // GHL location ID

  // Status timestamps
  completedAt?: Timestamp; // When payment was completed
  failedAt?: Timestamp; // When payment failed

  // Description and metadata
  description?: string;
  metadata?: Record<string, unknown>;

  // Timestamps
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// ============================================================================
// BATTLES COLLECTION
// ============================================================================

export interface FirestoreBattle {
  id: string; // Document ID
  hostId: string; // Primary host ID (for backward compatibility)
  host1Id: string; // First host ID
  host2Id?: string; // Second host ID (for battle mode)
  participants?: string[]; // Array of participant user IDs
  status: 'scheduled' | 'live' | 'ended' | 'cancelled';
  winnerId?: string; // Winner user ID (if battle ended)

  // Tips
  host1Tips?: number; // Tips for host 1 (in stars)
  host2Tips?: number; // Tips for host 2 (in stars)
  totalTips?: number; // Total tips (in stars)

  // Battle metrics
  duration?: number; // Duration in seconds
  peakViewers?: number; // Peak viewer count

  // Timestamps
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  startedAt?: Timestamp;
  endedAt?: Timestamp;

  // Metadata
  metadata?: Record<string, unknown>;
}

export interface CreateWalletData {
  userId: string;
  balance?: number;
  stars?: number;
}

export interface UpdateWalletData {
  userId: string;
  starsDelta?: number;
  usdDelta?: number;
}

export { CreateWalletData, UpdateWalletData };
