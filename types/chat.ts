/**
 * Chat-related type definitions
 */

export interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  timestamp: Date;
  type?: 'text' | 'image' | 'file' | 'system';
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  isEdited?: boolean;
  editedAt?: Date;
  replyTo?: string;
}

export interface User {
  id: string;
  name: string;
  avatar?: string;
  status?: 'online' | 'offline' | 'away' | 'busy';
  lastSeen?: Date;
  isTyping?: boolean;
}

export interface ChatRoom {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  participants: User[];
  lastMessage?: Message;
  unreadCount?: number;
  isGroup?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatState {
  currentRoom: ChatRoom | null;
  rooms: ChatRoom[];
  messages: Record<string, Message[]>;
  users: Record<string, User>;
  currentUser: User | null;
  isConnected: boolean;
  isLoading: boolean;
}





