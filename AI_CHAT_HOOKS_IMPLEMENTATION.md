# AI Chat Hooks Implementation

## Overview

This document describes the implementation of AI chat auto-reply and intro DM system for the Firechat application. The system enables AI users to automatically respond to messages and send welcome messages to new users.

## Branch Information

- **Base Branch**: `develop`
- **Feature Branch**: `feature/ai-chat-hooks`
- **Commit**: `feat(ai): auto reply and intro DM system`

## Features Implemented

### 1. AI Auto-Reply System (`/app/api/chat/ai/route.ts`)

**Endpoint**: `POST /api/chat/ai`

Automatically generates and sends AI replies when a message is sent to an AI user.

**Features**:
- Uses OpenAI's `gpt-4o-mini` model
- Builds persona-based prompts from user's firstName and bio
- Maintains conversation history (last 10 messages) for context
- Automatically saves AI replies to Firestore
- Updates chat metadata and unread counts

**Request Body**:
```json
{
  "chatId": "string",
  "aiUserId": "string",
  "userMessage": "string",
  "senderId": "string"
}
```

**Response**:
```json
{
  "success": true,
  "message": {
    "id": "messageId",
    "chatId": "chatId",
    "senderId": "aiUserId",
    "content": "AI reply text",
    "timestamp": "2025-11-05T11:36:13.000Z"
  },
  "reply": "AI reply text"
}
```

### 2. Intro DM System (`/app/api/chat/intro/route.ts`)

**Endpoint**: `POST /api/chat/intro`

Sends random AI intro messages to new users on signup.

**Request Body**:
```json
{
  "userId": "string",
  "count": 3
}
```

### 3. Cloud Functions

#### `sendIntroMessages`
Triggered by `onCreateUser` to send 3 random intro DMs.

#### `keepAiUsersOnline`
Scheduled function (every 5 minutes) to keep AI users status = "online".

## Files Changed

- ✅ `app/api/chat/ai/route.ts` - New AI auto-reply endpoint
- ✅ `app/api/chat/intro/route.ts` - New intro DM endpoint
- ✅ `functions/src/index.ts` - Added intro DM hook and online status scheduler
- ✅ `scripts/seed/firestore-seed.ts` - Enhanced seeding script

## Environment Variables

```env
OPENAI_API_KEY=sk-your_openai_api_key_here
```

## Deployment

```bash
# Deploy Cloud Functions
cd litit-chat/functions
npm run build
npm run deploy

# Deploy Next.js API Routes
npm run build
npm run deploy
```

## Testing

```bash
# Test AI Auto-Reply
curl -X POST http://localhost:3000/api/chat/ai \
  -H "Content-Type: application/json" \
  -d '{"chatId":"test","aiUserId":"ai_1","userMessage":"Hey!","senderId":"user_1"}'

# Test Intro DMs
curl -X POST http://localhost:3000/api/chat/intro \
  -H "Content-Type: application/json" \
  -d '{"userId":"new_user_123","count":3}'
```
