# Lit.it Chat MVP - Project Memory

## Project Overview

**Project Name:** Lit.it Chat (FireChat)  
**Framework:** Next.js 16.0.1  
**UI Library:** React 19.2.0  
**Styling:** Tailwind CSS v4  
**Type Safety:** TypeScript 5  
**Primary Purpose:** Real-time chat application MVP with DM2Pay integration

## Technology Stack

### Core Dependencies
- **next**: 16.0.1 - React framework with App Router
- **react**: 19.2.0 - UI library
- **react-dom**: 19.2.0 - React DOM rendering
- **typescript**: ^5 - Type safety
- **tailwindcss**: ^4 - Utility-first CSS framework
- **clsx**: ^2.1.0 - Conditional class names
- **tailwind-merge**: ^2.2.0 - Merge Tailwind classes

### Development Tools
- **eslint**: ^9 - Code linting
- **eslint-config-next**: 16.0.1 - Next.js ESLint config
- **@types/node**: ^20 - Node.js type definitions
- **@types/react**: ^19 - React type definitions
- **@types/react-dom**: ^19 - React DOM type definitions

## Complete File Structure

```
litit-chat/
├── app/                          # Next.js App Router directory
│   ├── layout.tsx                # Root layout with metadata & fonts
│   ├── page.tsx                  # Home page (currently default Next.js)
│   ├── globals.css               # Global styles & Tailwind imports
│   └── favicon.ico               # Site favicon
│
├── components/                    # React components directory
│   ├── index.ts                  # Main component exports
│   │
│   ├── ui/                       # Core UI components
│   │   ├── index.ts              # UI component exports
│   │   ├── Button.tsx            # Button component (variants: primary, secondary, outline, ghost, danger)
│   │   ├── Input.tsx             # Form input with label, error, helper text
│   │   ├── Modal.tsx             # Modal dialog with backdrop
│   │   ├── Badge.tsx             # Status badge component
│   │   └── LoadingSpinner.tsx    # Loading indicator
│   │
│   ├── chat/                     # Chat-specific components
│   │   ├── index.ts              # Chat component exports
│   │   ├── Avatar.tsx            # User avatar with status indicator
│   │   ├── MessageBubble.tsx     # Individual message display
│   │   ├── MessageList.tsx       # Message list with auto-scroll
│   │   ├── MessageInput.tsx      # Message composition input
│   │   ├── TypingIndicator.tsx   # Typing animation indicator
│   │   ├── ConnectionStatus.tsx  # WebSocket connection status
│   │   └── EmptyState.tsx        # Empty chat state
│   │
│   ├── layout/                   # Layout components
│   │   ├── index.ts              # Layout component exports
│   │   ├── Sidebar.tsx           # Chat rooms sidebar
│   │   ├── Header.tsx            # Chat header with user info
│   │   └── ChatContainer.tsx     # Main chat container (orchestrator)
│   │
│   └── dm2pay-builder/           # DM2Pay integration utilities
│       ├── index.ts              # DM2Pay exports
│       ├── DM2PayBuilder.tsx     # Main DM2Pay builder component
│       ├── types.ts              # DM2Pay type definitions
│       ├── utils.ts              # DM2Pay utility functions
│       ├── init.ts               # DM2Pay initialization
│       └── README.md             # DM2Pay documentation
│
├── lib/                          # Utility libraries
│   └── utils.ts                  # Utility functions:
│                                 #   - cn() - Class name combiner
│                                 #   - formatDate() - Date formatting
│                                 #   - formatTime() - Time formatting
│                                 #   - truncate() - Text truncation
│                                 #   - generateId() - ID generation
│                                 #   - debounce() - Function debouncing
│
├── types/                        # TypeScript type definitions
│   └── chat.ts                   # Chat-related types:
│                                 #   - Message interface
│                                 #   - User interface
│                                 #   - ChatRoom interface
│                                 #   - ChatState interface
│
├── public/                       # Static assets
│   ├── icons/                    # Icon assets
│   │   ├── ghost-flame.svg
│   │   ├── ghost-flame-outline.svg
│   │   └── [other icon files]
│   ├── lottie/                   # Lottie animations
│   │   └── loader.json
│   └── [next.svg, vercel.svg, etc.]
│
├── .cursor/                      # Cursor IDE configuration
│   ├── agents.json               # Agent configuration
│   └── PROJECT_MEMORY.md         # This file
│
├── package.json                  # Dependencies & scripts
├── package-lock.json             # Locked dependency versions
├── tsconfig.json                 # TypeScript configuration
├── next.config.ts                # Next.js configuration
├── postcss.config.mjs            # PostCSS configuration
├── eslint.config.mjs             # ESLint configuration
├── next-env.d.ts                 # Next.js type definitions
├── README.md                     # Project README
└── COMPONENTS.md                 # Component documentation
```

## Component Architecture

### UI Components (`components/ui/`)

**Button.tsx**
- Variants: `primary`, `secondary`, `outline`, `ghost`, `danger`
- Sizes: `sm`, `md`, `lg`
- Props: `variant`, `size`, `isLoading`, standard button attributes
- Usage: Primary action buttons throughout the app

**Input.tsx**
- Features: Label, error state, helper text
- Props: `label`, `error`, `helperText`, standard input attributes
- Usage: Form inputs, message composition

**Modal.tsx**
- Features: Backdrop, keyboard support, size variants
- Props: `isOpen`, `onClose`, `title`, `size` (`sm`, `md`, `lg`, `xl`)
- Usage: Dialogs, confirmations, settings

**Badge.tsx**
- Variants: `default`, `success`, `warning`, `error`, `info`
- Sizes: `sm`, `md`
- Usage: Status indicators, notification counts

**LoadingSpinner.tsx**
- Sizes: `sm`, `md`, `lg`
- Usage: Loading states, async operations

### Chat Components (`components/chat/`)

**Avatar.tsx**
- Props: `src`, `alt`, `name`, `size` (`sm`, `md`, `lg`, `xl`), `status` (`online`, `offline`, `away`, `busy`)
- Features: Image with fallback to initials, status indicator
- Usage: User avatars in messages, sidebar, header

**MessageBubble.tsx**
- Props: `message` (Message object), `isOwn`, `showAvatar`, `showTimestamp`
- Features: Own vs others styling, timestamp display, avatar support
- Usage: Individual message rendering

**MessageList.tsx**
- Props: `messages`, `currentUserId`, `isTyping`, `typingUser`
- Features: Auto-scroll to bottom, message grouping, typing indicator integration
- Usage: Main message display area

**MessageInput.tsx**
- Props: `onSend`, `placeholder`, `disabled`
- Features: Send button, enter to send, disabled state
- Usage: Message composition area

**TypingIndicator.tsx**
- Props: `userName`
- Features: Animated typing dots
- Usage: Shows when other users are typing

**ConnectionStatus.tsx**
- Props: `isConnected`, `isConnecting`
- Features: Visual connection status indicator
- Usage: Connection state feedback

**EmptyState.tsx**
- Features: Empty chat state messaging
- Usage: When no messages exist

### Layout Components (`components/layout/`)

**Sidebar.tsx**
- Props: `rooms`, `currentRoomId`, `onRoomSelect`, `onNewChat`
- Features: Room list, active room highlighting, new chat button
- Usage: Left sidebar navigation

**Header.tsx**
- Props: `room`, `currentUser`, `isConnected`, `onSettingsClick`, `onProfileClick`
- Features: Room info, user menu, connection status
- Usage: Top header bar

**ChatContainer.tsx**
- Props: `rooms`, `currentRoom`, `messages`, `currentUser`, `isConnected`, `isTyping`, `typingUser`, `onSendMessage`, `onRoomSelect`, `onNewChat`, `onSettingsClick`, `onProfileClick`, `showSidebar`
- Features: Orchestrates all chat components, manages layout
- Usage: Main chat application container

### DM2Pay Builder (`components/dm2pay-builder/`)

**DM2PayBuilder.tsx**
- Main integration component for DM2Pay payment functionality
- See `README.md` for detailed usage

**types.ts**
- DM2Pay-specific type definitions

**utils.ts**
- DM2Pay utility functions

**init.ts**
- DM2Pay initialization logic

## Type Definitions (`types/chat.ts`)

### Message Interface
```typescript
interface Message {
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
```

### User Interface
```typescript
interface User {
  id: string;
  name: string;
  avatar?: string;
  status?: 'online' | 'offline' | 'away' | 'busy';
  lastSeen?: Date;
  isTyping?: boolean;
}
```

### ChatRoom Interface
```typescript
interface ChatRoom {
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
```

### ChatState Interface
```typescript
interface ChatState {
  currentRoom: ChatRoom | null;
  rooms: ChatRoom[];
  messages: Record<string, Message[]>;
  users: Record<string, User>;
  currentUser: User | null;
  isConnected: boolean;
  isLoading: boolean;
}
```

## Utility Functions (`lib/utils.ts`)

### cn()
Combines class names with Tailwind merge for conditional styling.
```typescript
cn('base-class', condition && 'conditional-class')
```

### formatDate()
Formats dates for display with relative time (e.g., "2m ago", "3h ago").

### formatTime()
Formats time in 12-hour format (e.g., "2:30 PM").

### truncate()
Truncates text to a maximum length with ellipsis.

### generateId()
Generates unique IDs using timestamp and random string.

### debounce()
Debounces function calls to limit execution frequency.

## Styling Architecture

### Tailwind CSS v4
- Custom CSS variables for theming
- Dark mode support via `prefers-color-scheme`
- Custom animations and transitions
- Responsive utilities
- Scrollbar styling

### Global Styles (`app/globals.css`)
- Tailwind imports
- CSS variable definitions
- Custom animations
- Dark mode styles

## Project Scripts

```json
{
  "dev": "next dev",        // Development server
  "build": "next build",    // Production build
  "start": "next start",    // Production server
  "lint": "eslint"          // Code linting
}
```

## Key Architectural Decisions

1. **App Router**: Using Next.js 16 App Router for modern React patterns
2. **Component Organization**: Grouped by feature (ui, chat, layout) with index exports
3. **Type Safety**: Full TypeScript coverage with exported types
4. **Utility-First Styling**: Tailwind CSS for rapid UI development
5. **Modular Design**: Components are self-contained with clear prop interfaces
6. **Dark Mode**: Built-in support throughout all components
7. **Responsive Design**: Mobile-first approach with breakpoint utilities

## Next Steps for MVP

### Frontend Requirements
- [ ] Implement WebSocket client connection
- [ ] Create API route handlers for chat operations
- [ ] Add authentication UI components
- [ ] Implement real-time message updates
- [ ] Add file upload functionality
- [ ] Create settings page
- [ ] Add user profile management

### Integration Points
- [ ] Backend API integration (hand off to Backend Architect)
- [ ] Database schema implementation
- [ ] WebSocket server setup
- [ ] Authentication flow
- [ ] DM2Pay payment flow integration

## Notes

- All components support dark mode via Tailwind classes
- Component props are fully typed with TypeScript
- Components use the `cn()` utility for conditional styling
- Message timestamps are handled via `formatDate()` and `formatTime()`
- Component exports are organized via index files for clean imports

