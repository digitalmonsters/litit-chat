# AI Companion Implementation

## Overview

Intelligent, personality-based chatbots that engage users with OpenAI GPT-3.5 integration.

---

## Features

1. **AI Reply Endpoint** - `POST /api/ai/reply` - Generate AI responses
2. **AI Personalities** - Fun (Alex), Flirty (Riley), Supportive (Sam), Creative (Jordan)
3. **Auto-Match** - `POST /api/ai/auto-match` - Pair new users with AI companions
4. **Automatic Integration** - Chat API detects AI partners and generates replies automatically

---

## Setup

### 1. Install OpenAI

```bash
npm install openai --legacy-peer-deps
```

### 2. Add API Key

In `.env.local`:
```bash
OPENAI_API_KEY=sk-your_openai_api_key_here
```

### 3. Seed AI Companions

```bash
npx ts-node scripts/seed-ai-companions.ts
```

---

## API Usage

### Generate AI Reply

```bash
curl -X POST http://localhost:3000/api/ai/reply \
  -H "Content-Type: application/json" \
  -d '{
    "chatId": "chat_123",
    "aiUserId": "ai-fun-companion",
    "userMessage": "Hey, how are you?",
    "userName": "John"
  }'
```

### Auto-Match User

```bash
curl -X POST http://localhost:3000/api/ai/auto-match \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_123",
    "userName": "John",
    "preferredPersonality": "fun"
  }'
```

---

## Client Integration

### Send Message (AI replies automatically)

```typescript
await fetch('/api/chat', {
  method: 'POST',
  body: JSON.stringify({
    chatId,
    senderId,
    senderName,
    content: userMessage,
  }),
});
// AI reply generated automatically if partner is AI
```

### Auto-Match on Signup

```typescript
const { eligible } = await fetch(\`/api/ai/auto-match?userId=\${userId}\`).then(r => r.json());
if (eligible) {
  await fetch('/api/ai/auto-match', {
    method: 'POST',
    body: JSON.stringify({ userId, userName }),
  });
}
```

---

## Database Schema

### AI Companion User

```typescript
{
  id: "ai-fun-companion",
  displayName: "Alex",
  isAI: true,
  aiPersonality: "fun",
  tier: "PRO",
  status: "online"
}
```

### AI Chat

```typescript
{
  id: "chat_123",
  participantIds: ["user_123", "ai-fun-companion"],
  metadata: {
    isAIChat: true,
    aiPersonality: "fun",
    autoMatched: true
  }
}
```

---

## Cost Estimate

**GPT-3.5-turbo**: ~$0.0004 per message

| Users | Messages/Month | Cost  |
|-------|----------------|-------|
| 100   | 15,000         | $6    |
| 500   | 75,000         | $30   |
| 1,000 | 150,000        | $60   |

---

## Testing

1. Seed AI companions: `npx ts-node scripts/seed-ai-companions.ts`
2. Test reply endpoint (see API usage above)
3. Send message to AI in chat UI
4. Verify AI responds automatically

---

## Files Created

- `lib/ai-companion.ts` - Core AI logic
- `app/api/ai/reply/route.ts` - AI reply endpoint
- `app/api/ai/auto-match/route.ts` - Auto-match endpoint
- `scripts/seed-ai-companions.ts` - Seed script
- `app/api/chat/route.ts` - Modified for automatic AI replies
- `lib/env.example.txt` - Updated with OPENAI_API_KEY

---

## Summary

✅ AI reply generation with OpenAI GPT-3.5  
✅ 4 distinct personalities  
✅ Automatic reply in chat  
✅ Auto-match system  
✅ Fallback responses if API fails  
✅ Cost-efficient implementation
