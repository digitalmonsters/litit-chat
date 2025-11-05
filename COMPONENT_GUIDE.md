# Component Usage Guide

## Quick Reference

### DiscoverSidebar
```tsx
import { DiscoverSidebar } from '@/components/chat';

<DiscoverSidebar 
  maxProfiles={10}
  onProfileClick={(user) => console.log(user)}
/>
```

**Features:**
- Fetches `isAI: true` users from Firestore
- Story-style circular avatars with gradient borders
- Online indicators (green pulse)
- Opens ProfileModal on click

---

### ProfileModal
```tsx
import { ProfileModal } from '@/components/discover';

<ProfileModal
  user={selectedUser}
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  onMessage={(userId) => createOrOpenChat(userId)}
  onFollow={(userId) => followUser(userId)}
  onTip={(userId) => openTipModal(userId)}
/>
```

**Props:**
- `user`: FirestoreUser with dateOfBirth, countryCode, location
- `isOpen/onClose`: Modal visibility control
- `onMessage`: Handler to create/open DM
- `onFollow`: Handler for follow button
- `onTip`: Handler for tip button

**Displays:**
- Age (calculated from dateOfBirth)
- Country flag emoji (from countryCode)
- Location (city, country)
- Bio, interests, images carousel

---

### EmojiPicker
```tsx
import { EmojiPicker } from '@/components/chat';

<EmojiPicker 
  onEmojiSelect={(emoji) => setMessage(prev => prev + emoji)}
/>
```

**Features:**
- 4 categories: Smileys, Gestures, Hearts, Objects
- 8-column grid layout
- Hover scale animations
- Auto-focus back to input after selection

---

### MessageBubble (Enhanced)
```tsx
import { MessageBubble } from '@/components/chat';

<MessageBubble
  message={firestoreMessage}
  isOwn={message.senderId === user.uid}
  showAvatar={true}
  showTimestamp={true}
  onUnlock={(msg) => unlockMessage(msg)}
/>
```

**Styling:**
- Own messages: `bg-gradient-to-r from-[#FF5E3A] to-[#FF9E57]`
- Other messages: `bg-gray-800`
- Rounded corners: `rounded-3xl` with accent
- Avatar: 9x9 circular with ring
- Read receipts: ✓✓ in orange when read

---

### MessageInput (Enhanced)
```tsx
import { MessageInput } from '@/components/chat';

<MessageInput
  chatId={chatId}
  placeholder="Type a message..."
  disabled={false}
/>
```

**Features:**
- Emoji picker button (left side)
- Image upload (Bunny CDN)
- Camera capture (mobile)
- File preview before sending
- Price lock toggle for monetization
- Auto-resize textarea

---

## Layout Structure

### Desktop (lg+)
```
┌─────────────────────────────────────────────────────────┐
│ DiscoverSidebar │ ChatList      │ Conversation          │
│ (AI Profiles)   │ (DMs)         │ (Messages + Input)    │
│                 │               │                       │
│ 🔥 Discover     │ 💬 Chats      │ [Chat Header]         │
│                 │               │                       │
│ [Story Bubble]  │ [Chat Item 1] │ [Message Bubbles]     │
│ [Story Bubble]  │ [Chat Item 2] │ ...                   │
│ [Story Bubble]  │ ...           │ [Message Input]       │
│ ...             │               │ [😊][📷][📎][Send]    │
└─────────────────────────────────────────────────────────┘
```

### Mobile
```
┌───────────────────┐
│ [Chat or Discover]│
│                   │
│ [Messages]        │
│                   │
│ [Input]           │
│                   │
├───────────────────┤
│ 💬   🔍   ❤️     │ ← Bottom Nav
└───────────────────┘
```

---

## Firestore Schema

### User Document (with AI fields)
```typescript
{
  id: 'user123',
  displayName: 'Chloe',
  username: 'chichilicious',
  photoURL: 'https://litit-chat-cdn.b-cdn.net/seed/profiles/profile1.jpeg',
  bio: 'Filipina dancer & content creator...',
  dateOfBirth: '2003-04-15',  // For age calculation
  countryCode: 'PH',           // For flag emoji
  location: {
    city: 'Cebu City',
    country: 'Philippines'
  },
  isAI: true,                  // Shown in Discover
  aiPersonality: 'fun',
  status: 'online',
  tier: 'free',
  stars: 0,
  interests: ['dancing', 'music', 'beach'],
  createdAt: Timestamp,
  lastSeen: Timestamp
}
```

### Chat Document
```typescript
{
  id: 'chat456',
  participantIds: ['user123', 'ai789'],
  unreadCounts: {
    'user123': 0,
    'ai789': 2
  },
  lastMessageId: 'msg999',
  lastMessageAt: Timestamp,
  metadata: {
    isAIChat: true,
    aiPersonality: 'fun'
  }
}
```

### Message Document
```typescript
{
  id: 'msg999',
  chatId: 'chat456',
  senderId: 'user123',
  senderName: 'John',
  senderAvatar: 'https://...',
  content: 'Hey! 😊',
  type: 'text' | 'image' | 'video' | 'audio' | 'file',
  status: 'sent' | 'delivered' | 'read',
  timestamp: Timestamp,
  attachments: [{
    url: 'https://...',
    type: 'image/jpeg',
    name: 'photo.jpg',
    size: 123456
  }],
  isLocked: false,
  unlockPrice: 500,  // in cents
  unlockedBy: ['user456']
}
```

---

## Helper Functions

### Calculate Age
```typescript
function calculateAge(dateOfBirth: string): number {
  const today = new Date();
  const birth = new Date(dateOfBirth);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}
```

### Country Flag Emoji
```typescript
function getCountryFlag(countryCode: string): string {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}
```

---

## Animation Variants

### Flame Stagger (for lists)
```typescript
import { flameStagger, flameStaggerItem } from '@/lib/flame-transitions';

<motion.div variants={flameStagger}>
  {items.map(item => (
    <motion.div key={item.id} variants={flameStaggerItem}>
      {item.content}
    </motion.div>
  ))}
</motion.div>
```

### Slide Up (for modals)
```typescript
import { flameSlideUp } from '@/lib/flame-transitions';

<motion.div
  initial="hidden"
  animate="visible"
  exit="hidden"
  variants={flameSlideUp}
>
  Modal Content
</motion.div>
```

---

## Styling Utilities

### Gradient Button
```tsx
<button className="bg-gradient-to-r from-[#FF5E3A] to-[#FF9E57] text-white rounded-xl px-6 py-3 font-semibold hover:from-[#FF6E4A] hover:to-[#FFAE67] transition-all shadow-lg hover:shadow-[#FF5E3A]/50">
  Click Me
</button>
```

### Story Bubble Avatar
```tsx
<div className="relative w-14 h-14 rounded-full p-[3px] bg-gradient-to-br from-[#FF5E3A] to-[#FF9E57]">
  <img
    src={user.photoURL}
    alt={user.displayName}
    className="w-full h-full rounded-full object-cover border-2 border-[#1E1E1E]"
  />
  {/* Online indicator */}
  <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-[#1E1E1E] animate-pulse" />
</div>
```

---

## Testing Checklist

- [ ] AI profiles appear in Discover sidebar
- [ ] Clicking profile opens modal with age, flag, location
- [ ] "Message" button creates/opens chat
- [ ] Emoji picker opens and closes smoothly
- [ ] Emojis insert into message input
- [ ] Image upload works with camera/gallery
- [ ] Message bubbles have gradient for own messages
- [ ] Avatars show for other users
- [ ] Read receipts turn orange when read
- [ ] Mobile bottom nav works
- [ ] Responsive layout shifts at breakpoints
- [ ] All animations run at 60fps

