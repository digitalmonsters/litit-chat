# Flame UI Implementation Guide

## Overview

The Lit.it Chat application now features flame-themed animations, transitions, and a responsive chat layout using Framer Motion and Lottie animations.

## Components Implemented

### 1. FlameLoader Component (`components/ui/FlameLoader.tsx`)

A full-featured loader component using Lottie animations with flame-themed effects.

**Features:**
- Lottie animation support with flame glow effects
- Multiple sizes: `sm`, `md`, `lg`, `xl`
- Full-screen mode option
- Custom loading messages
- Animated pulse dots
- Smooth fade in/out transitions

**Usage:**
```tsx
import { FlameLoader } from '@/components/ui';

// Full-screen loader
<FlameLoader fullScreen message="Loading chat..." />

// Inline loader
<FlameLoader size="md" message="Connecting..." />
```

### 2. Enhanced LoadingSpinner (`components/ui/LoadingSpinner.tsx`)

Updated spinner with flame variant option.

**Variants:**
- `default`: Standard spinner
- `flame`: Flame-themed spinner with gradient colors

**Usage:**
```tsx
import { LoadingSpinner } from '@/components/ui';

<LoadingSpinner variant="flame" size="md" />
```

### 3. Responsive ChatContainer (`components/layout/ChatContainer.tsx`)

Fully responsive chat layout with flame transitions.

**Features:**
- Mobile-responsive sidebar (slides in/out on mobile)
- Flame-themed page transitions
- Smooth room switching animations
- Mobile menu button support
- Overlay backdrop on mobile

**Responsive Breakpoints:**
- Mobile: `< 768px` - Sidebar hidden, accessible via menu button
- Desktop: `>= 768px` - Sidebar always visible

**Animations:**
- Sidebar slide-in/out
- Room content fade transitions
- Message input slide-up
- Empty state with flame gradient

### 4. Updated Header (`components/layout/Header.tsx`)

Header with mobile menu support and Lit.it branding.

**Features:**
- Mobile menu button (hamburger icon)
- Flame gradient logo text
- Updated color scheme to match Lit.it palette
- Hover effects with flame accent colors

### 5. Global Styles (`app/globals.css`)

Updated with Lit.it color palette and flame animations.

**Color Palette:**
- Background: `#1E1E1E` (dark)
- Flame Primary: `#FF5E3A`
- Flame Secondary: `#FF9E57`
- Gradient: `linear-gradient(135deg, #FF5E3A 0%, #FF9E57 100%)`

**Animation Classes:**
- `.animate-flame-flicker` - Flickering glow effect
- `.animate-flame-glow` - Pulsing glow
- `.animate-flame-slide` - Slide-in animation
- `.animate-flame-scale` - Scale-in animation

**Utility Classes:**
- `.gradient-flame` - Gradient text effect

### 6. Flame Transitions Library (`lib/flame-transitions.ts`)

Reusable Framer Motion transition variants.

**Available Transitions:**
- `flameTransition` - Main page/content transition
- `flameSlideIn` - Sidebar/menu slide-in
- `flameSlideUp` - Modal/input slide-up
- `flameFadeScale` - Card/message fade and scale
- `flameStagger` / `flameStaggerItem` - List stagger animation
- `flameGlow` - Glow effect
- `flameFlicker` - Flicker effect
- `pageTransition` - Page transition config

**Usage:**
```tsx
import { flameTransition, flameSlideUp } from '@/lib/flame-transitions';
import { motion } from 'framer-motion';

<motion.div variants={flameTransition} initial="initial" animate="animate" exit="exit">
  Content
</motion.div>
```

## Responsive Design

### Mobile (< 768px)
- Sidebar hidden by default
- Accessible via hamburger menu in header
- Full-width chat area
- Touch-friendly interactions
- Swipe gestures supported (via overlay)

### Desktop (>= 768px)
- Sidebar always visible (320px width)
- Multi-column layout
- Hover effects
- Keyboard navigation

## Animation Principles

1. **Smooth Transitions**: All transitions use cubic-bezier easing for natural motion
2. **Performance**: Animations use GPU-accelerated properties (transform, opacity)
3. **Accessibility**: Respects `prefers-reduced-motion` (can be added)
4. **Brand Consistency**: All animations use Lit.it flame colors

## Integration Points

### Using FlameLoader

Replace default loading states with FlameLoader:

```tsx
import { FlameLoader } from '@/components/ui';

{isLoading ? (
  <FlameLoader fullScreen message="Loading your chats..." />
) : (
  <ChatContainer {...props} />
)}
```

### Using Flame Transitions

Apply transitions to components:

```tsx
import { motion } from 'framer-motion';
import { flameTransition } from '@/lib/flame-transitions';

<motion.div
  variants={flameTransition}
  initial="initial"
  animate="animate"
  exit="exit"
>
  {children}
</motion.div>
```

### Responsive Chat Layout

The ChatContainer automatically handles responsive behavior:

```tsx
<ChatContainer
  rooms={rooms}
  currentRoom={currentRoom}
  messages={messages}
  currentUser={currentUser}
  isConnected={isConnected}
  onSendMessage={handleSendMessage}
  onRoomSelect={handleRoomSelect}
  showSidebar={true} // Auto-adjusts for mobile
/>
```

## Next Steps

1. **Add Reduced Motion Support**: Respect `prefers-reduced-motion` media query
2. **Performance Optimization**: Lazy load Lottie animations
3. **Additional Animations**: Add message send/receive animations
4. **Loading States**: Add skeleton loaders for better UX
5. **Gesture Support**: Add swipe gestures for mobile navigation

## Dependencies

- `framer-motion`: ^11.x - Animation library
- `lottie-react`: ^2.x - Lottie animation support

Both packages are installed and ready to use.

