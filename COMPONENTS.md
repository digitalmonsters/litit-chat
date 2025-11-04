# FireChat Components Documentation

This document provides an overview of all components created for the FireChat application.

## Component Structure

```
components/
├── ui/                    # Core UI components
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Modal.tsx
│   ├── Badge.tsx
│   ├── LoadingSpinner.tsx
│   └── index.ts
├── chat/                  # Chat-specific components
│   ├── Avatar.tsx
│   ├── MessageBubble.tsx
│   ├── MessageList.tsx
│   ├── MessageInput.tsx
│   ├── TypingIndicator.tsx
│   ├── ConnectionStatus.tsx
│   ├── EmptyState.tsx
│   └── index.ts
├── layout/                # Layout components
│   ├── Sidebar.tsx
│   ├── Header.tsx
│   ├── ChatContainer.tsx
│   └── index.ts
├── dm2pay-builder/        # DM2Pay integration
│   ├── DM2PayBuilder.tsx
│   ├── types.ts
│   ├── utils.ts
│   ├── init.ts
│   └── index.ts
└── index.ts              # Main exports
```

## UI Components

### Button
A versatile button component with multiple variants and sizes.

**Props:**
- `variant`: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
- `size`: 'sm' | 'md' | 'lg'
- `isLoading`: boolean
- Standard button HTML attributes

### Input
A form input component with label, error, and helper text support.

**Props:**
- `label`: string
- `error`: string
- `helperText`: string
- Standard input HTML attributes

### Modal
A modal dialog component with backdrop and keyboard support.

**Props:**
- `isOpen`: boolean
- `onClose`: () => void
- `title`: string
- `size`: 'sm' | 'md' | 'lg' | 'xl'
- `children`: ReactNode

### Badge
A badge component for displaying status indicators.

**Props:**
- `variant`: 'default' | 'success' | 'warning' | 'error' | 'info'
- `size`: 'sm' | 'md'

### LoadingSpinner
A loading spinner component.

**Props:**
- `size`: 'sm' | 'md' | 'lg'

## Chat Components

### Avatar
A user avatar component with status indicator support.

**Props:**
- `src`: string (image URL)
- `alt`: string
- `name`: string (for initials fallback)
- `size`: 'sm' | 'md' | 'lg' | 'xl'
- `status`: 'online' | 'offline' | 'away' | 'busy'

### MessageBubble
A message bubble component for displaying chat messages.

**Props:**
- `message`: Message object
- `isOwn`: boolean
- `showAvatar`: boolean
- `showTimestamp`: boolean

### MessageList
A component for displaying a list of messages with auto-scroll.

**Props:**
- `messages`: Message[]
- `currentUserId`: string
- `isTyping`: boolean
- `typingUser`: string

### MessageInput
A message input component with send functionality.

**Props:**
- `onSend`: (message: string) => void
- `placeholder`: string
- `disabled`: boolean

### TypingIndicator
A component that displays when someone is typing.

**Props:**
- `userName`: string

### ConnectionStatus
A component that displays connection status.

**Props:**
- `isConnected`: boolean
- `isConnecting`: boolean

## Layout Components

### Sidebar
A sidebar component for displaying chat rooms.

**Props:**
- `rooms`: ChatRoom[]
- `currentRoomId`: string
- `onRoomSelect`: (roomId: string) => void
- `onNewChat`: () => void

### Header
A header component for the chat interface.

**Props:**
- `room`: ChatRoom | null
- `currentUser`: User | null
- `isConnected`: boolean
- `onSettingsClick`: () => void
- `onProfileClick`: () => void

### ChatContainer
The main container component that combines all chat components.

**Props:**
- `rooms`: ChatRoom[]
- `currentRoom`: ChatRoom | null
- `messages`: Message[]
- `currentUser`: User
- `isConnected`: boolean
- `isTyping`: boolean
- `typingUser`: string
- `onSendMessage`: (message: string) => void
- `onRoomSelect`: (roomId: string) => void
- `onNewChat`: () => void
- `onSettingsClick`: () => void
- `onProfileClick`: () => void
- `showSidebar`: boolean

## Type Definitions

All types are defined in `types/chat.ts`:

- `Message`: Chat message structure
- `User`: User information
- `ChatRoom`: Chat room/group structure
- `ChatState`: Overall chat state

## Utilities

Utilities are located in `lib/utils.ts`:

- `cn()`: Class name utility (combines clsx and tailwind-merge)
- `formatDate()`: Format dates for display
- `formatTime()`: Format time for display
- `truncate()`: Truncate text
- `generateId()`: Generate unique IDs
- `debounce()`: Debounce function calls

## Tailwind Configuration

The Tailwind CSS setup includes:

- Custom color variables for chat theme
- Dark mode support
- Custom animations
- Scrollbar styling
- Responsive utilities

All components are fully responsive and support dark mode.

## Usage Example

```tsx
import { ChatContainer } from '@/components';
import type { ChatRoom, Message, User } from '@/types/chat';

export default function ChatPage() {
  const rooms: ChatRoom[] = [];
  const messages: Message[] = [];
  const currentUser: User = {
    id: '1',
    name: 'John Doe',
    status: 'online',
  };

  return (
    <ChatContainer
      rooms={rooms}
      messages={messages}
      currentUser={currentUser}
      isConnected={true}
      onSendMessage={(msg) => console.log(msg)}
      onRoomSelect={(id) => console.log(id)}
    />
  );
}
```

## Styling

All components use Tailwind CSS v4 with:
- Custom CSS variables for theming
- Dark mode support via `prefers-color-scheme`
- Consistent spacing and typography
- Smooth animations and transitions






