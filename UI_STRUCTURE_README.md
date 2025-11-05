# 🔥 Lit.it UI Structure & Components

## Overview

This document outlines the responsive, animated UI structure built with **Framer Motion**, **Firestore realtime listeners**, and **Firebase Cloud Messaging (FCM)** for push notifications.

## 🎨 Design System

### Brand Colors
- **Primary Gradient**: `#FF5E3A` → `#FF9E57`
- **Background**: `#1E1E1E`
- **Surface**: `#2A2A2A`
- **Border**: `#3A3A3A`

### Responsive Breakpoints
- **Mobile**: `< 768px`
- **Tablet**: `768px - 1023px`
- **Desktop**: `1024px+`
- **Wide**: `1280px+`

---

## 📦 Component Structure

### Layout Components (`components/layout/`)

#### `ResponsiveGrid`
Responsive grid system with configurable columns for different breakpoints.

```tsx
import { ResponsiveGrid } from '@/components/layout';

<ResponsiveGrid
  columns={{ mobile: 1, tablet: 2, desktop: 3 }}
  gap={4}
>
  {/* children */}
</ResponsiveGrid>
```

#### `ResponsiveContainer`
Main container with max-width and responsive padding.

```tsx
import { ResponsiveContainer } from '@/components/layout';

<ResponsiveContainer>
  {/* content */}
</ResponsiveContainer>
```

#### `TwoColumnLayout`
Sidebar + Main content layout for chat interfaces.

```tsx
import { TwoColumnLayout } from '@/components/layout';

<TwoColumnLayout
  sidebar={<Sidebar />}
  main={<MainContent />}
  sidebarCollapsed={false}
/>
```

#### `ThreeColumnLayout`
Sidebar + Main + Details panel for desktop.

```tsx
import { ThreeColumnLayout } from '@/components/layout';

<ThreeColumnLayout
  sidebar={<Sidebar />}
  main={<MainContent />}
  details={<DetailsPanel />}
  detailsOpen={true}
/>
```

---

### Chat Components (`components/chat/`)

#### `AnimatedMessageList`
Message list with Framer Motion stagger animations.

```tsx
import { AnimatedMessageList } from '@/components/chat';

<AnimatedMessageList
  messages={messages}
  currentUserId="user123"
  showAvatars={true}
  showTimestamps={true}
  onUnlock={(message) => console.log('Unlock:', message)}
/>
```

**Features:**
- Stagger animation on load
- Slide-in for new messages
- Auto-scroll to bottom
- Layout animations

#### `UserJoinLeaveIndicator`
Animated indicator for user presence changes.

```tsx
import { UserJoinLeaveIndicator, useUserJoinLeave } from '@/components/chat';

function MyComponent() {
  const { event, showJoinEvent, showLeaveEvent } = useUserJoinLeave();
  
  return (
    <>
      <button onClick={() => showJoinEvent('user1', 'Alice')}>
        Simulate Join
      </button>
      <UserJoinLeaveIndicator event={event} />
    </>
  );
}
```

---

### UI Components (`components/ui/`)

#### `MediaCard`
Lazy-loaded media card with Bunny CDN support.

```tsx
import { MediaCard } from '@/components/ui';

<MediaCard
  src="https://example.b-cdn.net/image.jpg"
  alt="Media"
  type="image"
  aspectRatio="portrait"
  locked={false}
  priority={false}
/>
```

**Props:**
- `type`: `'image' | 'video'`
- `aspectRatio`: `'square' | 'video' | 'portrait'`
- `locked`: Show lock overlay
- `priority`: Eager loading for above-the-fold images

#### `MediaGrid`
Grid layout for multiple media cards.

```tsx
import { MediaGrid, MediaCard } from '@/components/ui';

<MediaGrid columns={{ mobile: 2, tablet: 3, desktop: 4 }}>
  <MediaCard src="..." type="image" />
  <MediaCard src="..." type="video" />
</MediaGrid>
```

---

## 🔄 Realtime Features

### Hooks (`hooks/`)

#### `useRealtimeMessages`
Firestore onSnapshot listener for chat messages.

```tsx
import { useRealtimeMessages } from '@/hooks';

const { messages, loading, error, hasMore } = useRealtimeMessages({
  chatId: 'chat123',
  limit: 50,
  enabled: true,
});
```

#### `useRealtimeChats`
Firestore listener for user's chat list.

```tsx
import { useRealtimeChats } from '@/hooks';

const { chats, loading, error } = useRealtimeChats({
  userId: 'user123',
  enabled: true,
});
```

#### `useFCMNotifications`
Listen for foreground FCM push notifications.

```tsx
import { useFCMNotifications } from '@/hooks';

useFCMNotifications({
  enabled: true,
  onNotification: (payload) => {
    console.log('Push notification:', payload);
  },
});
```

---

### Contexts

#### `PresenceContext`
Track user presence across the app.

```tsx
import { PresenceProvider, usePresence } from '@/contexts/PresenceContext';

// Wrap your app
<PresenceProvider>
  <App />
</PresenceProvider>

// Use in components
function MyComponent() {
  const { presenceMap, setUserStatus, isUserOnline } = usePresence();
  
  return (
    <div>
      User online: {isUserOnline('user123') ? 'Yes' : 'No'}
    </div>
  );
}
```

---

## 🚀 Realtime Provider

Combines FCM, Presence, and Push Banners into one provider.

```tsx
import { RealtimeProvider } from '@/components';

<RealtimeProvider>
  <App />
</RealtimeProvider>
```

**Features:**
- Initializes FCM on user login
- Tracks user presence
- Displays push notification banners
- Auto-dismisses notifications after 5s

---

## 🎭 Framer Motion Transitions

### Available Variants (`lib/flame-transitions.ts`)

#### `flameTransition`
Main page/content transition with blur and scale.

```tsx
<motion.div
  variants={flameTransition}
  initial="initial"
  animate="animate"
  exit="exit"
>
  {/* content */}
</motion.div>
```

#### `flameSlideIn`
Slide-in from left (sidebars, menus).

#### `flameSlideUp`
Slide-up from bottom (modals, inputs).

#### `flameFadeScale`
Fade + scale (cards, messages).

#### `flameStagger` + `flameStaggerItem`
Stagger children animations (lists).

```tsx
<motion.div variants={flameStagger} initial="initial" animate="animate">
  {items.map((item) => (
    <motion.div key={item.id} variants={flameStaggerItem}>
      {item.content}
    </motion.div>
  ))}
</motion.div>
```

#### `flameGlow`
Glowing effect for flame-themed elements.

#### `flameFlicker`
Flicker animation for flame icons.

---

## 🖼️ Bunny CDN Integration

### Next.js Image Configuration

Configured in `next.config.ts`:

```typescript
images: {
  remotePatterns: [
    { protocol: 'https', hostname: '*.b-cdn.net' },
    { protocol: 'https', hostname: 'bunnycdn.com' },
  ],
  formats: ['image/webp'],
}
```

### Usage

```tsx
import Image from 'next/image';

<Image
  src="https://example.b-cdn.net/image.jpg"
  alt="Media"
  width={800}
  height={600}
  loading="lazy"
/>
```

Or use the `MediaCard` component for automatic lazy-loading and animations.

---

## 📱 Responsive Best Practices

### Mobile-First Approach

Always design for mobile first, then enhance for larger screens:

```tsx
<div className="
  px-4              {/* Mobile: 16px padding */}
  md:px-6           {/* Tablet: 24px padding */}
  lg:max-w-7xl lg:px-8  {/* Desktop: max width + 32px padding */}
">
  {/* content */}
</div>
```

### Touch Optimizations

Minimum touch target: `44x44px` (automatically applied in `globals.css`).

---

## 🎯 Usage Examples

### Complete Chat Page

```tsx
'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRealtimeChats, useRealtimeMessages } from '@/hooks';
import { TwoColumnLayout, AnimatedMessageList } from '@/components';
import { RealtimeProvider } from '@/components';

export default function ChatPage() {
  const { user } = useAuth();
  const { chats } = useRealtimeChats({ userId: user?.uid || '', enabled: !!user });
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const { messages } = useRealtimeMessages({ 
    chatId: currentChatId || '', 
    enabled: !!currentChatId 
  });

  return (
    <RealtimeProvider>
      <TwoColumnLayout
        sidebar={
          <ChatList 
            chats={chats} 
            onChatSelect={setCurrentChatId}
          />
        }
        main={
          <AnimatedMessageList
            messages={messages}
            currentUserId={user?.uid || ''}
          />
        }
      />
    </RealtimeProvider>
  );
}
```

---

## 🧪 Testing

Visit `/demo-ui` to see all components in action:

```
http://localhost:3000/demo-ui
```

---

## 📚 Documentation

For more details, see:
- `COMPONENTS.md` - Full component API reference
- `lib/flame-transitions.ts` - Animation variants
- `lib/responsive.ts` - Responsive utilities
- `lib/firebase-messaging.ts` - FCM setup

---

## 🎨 Flame UI Guidelines

1. **Always use the brand gradient** for primary actions
2. **Use Framer Motion** for all animations (no CSS transitions)
3. **Mobile-first responsive design** with breakpoints
4. **Lazy-load all media** with next/image
5. **Auto-scroll to bottom** for new messages
6. **Show presence indicators** for online users
7. **Display push banners** for foreground notifications

---

## 🔥 Created with Flame UI Designer

This UI structure was built following the **Lit.it** design system:
- Orange flame gradient (`#FF5E3A` → `#FF9E57`)
- Dark mode by default (`#1E1E1E` background)
- Snap-style transitions with Framer Motion
- Responsive grid layouts (mobile/tablet/desktop)
- Bunny CDN integration for media
- Firestore realtime listeners
- FCM push notifications

**Stay lit! 🔥**
