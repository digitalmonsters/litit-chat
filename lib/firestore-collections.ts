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

// ... rest of existing code ...
