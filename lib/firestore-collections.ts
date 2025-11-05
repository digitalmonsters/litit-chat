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

// ... rest of existing code ...
