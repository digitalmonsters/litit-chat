# WebSocket Service

Lightweight Node.js/Express + Socket.IO service for real-time chat events.

## Features

- **Typing Indicators**: Real-time typing status for users in chat rooms
- **Read Receipts**: Track when messages are read by recipients
- **Presence Updates**: User online/offline status synchronization
- **Firestore Sync**: All events are persisted to Firestore for durability

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the `websocket-service` directory:

```env
# Firebase Admin SDK Configuration
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_SERVICE_ACCOUNT_KEY_PATH=./serviceAccountKey.json
# OR use individual credentials:
# FIREBASE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
# FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# WebSocket Server Configuration
PORT=3001
CORS_ORIGIN=http://localhost:3000,https://yourdomain.com

# Environment
NODE_ENV=development
```

### 3. Get Firebase Service Account Key

1. Go to Firebase Console > Project Settings > Service Accounts
2. Click "Generate New Private Key"
3. Save the JSON file as `serviceAccountKey.json` in the `websocket-service` directory
4. **Important**: Add `serviceAccountKey.json` to `.gitignore`

### 4. Run the Service

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm run build
npm start
```

## API Events

### Client → Server

#### `joinChat`
Join a chat room to receive real-time events.

```typescript
socket.emit('joinChat', { chatId: 'chat123' });
```

#### `userTyping`
Send typing indicator to other users in the chat.

```typescript
socket.emit('userTyping', { 
  chatId: 'chat123', 
  userName: 'John Doe' 
});
```

#### `messageRead`
Mark message(s) as read.

```typescript
socket.emit('messageRead', {
  chatId: 'chat123',
  messageIds: ['msg1', 'msg2']
});
```

#### `presencePing`
Update user presence status.

```typescript
socket.emit('presencePing', { status: 'online' });
```

#### `leaveChat`
Leave a chat room.

```typescript
socket.emit('leaveChat', { chatId: 'chat123' });
```

### Server → Client

#### `userTyping`
Receive typing indicators from other users.

```typescript
socket.on('userTyping', (data) => {
  // data: { chatId: string, users: Array<{ userId: string, userName: string }> }
});
```

#### `userStoppedTyping`
User stopped typing.

```typescript
socket.on('userStoppedTyping', (data) => {
  // data: { chatId: string, userId: string }
});
```

#### `messageRead`
Message read receipt from another user.

```typescript
socket.on('messageRead', (data) => {
  // data: { chatId: string, messageIds: string[], readBy: string, timestamp: string }
});
```

#### `joinedChat`
Confirmation that chat room was joined.

```typescript
socket.on('joinedChat', (data) => {
  // data: { chatId: string }
});
```

#### `error`
Error event.

```typescript
socket.on('error', (data) => {
  // data: { message: string }
});
```

## Authentication

The service expects `userId` to be provided in the socket handshake:

```typescript
const socket = io('http://localhost:3001', {
  auth: {
    userId: 'user123'
  }
});
```

## Firestore Collections

The service syncs events to the following Firestore collections:

- **`chats`**: Chat room metadata (typing states, unread counts)
- **`messages`**: Message read receipts (`readBy` field)
- **`users`**: User presence status (`status`, `lastSeen`)

## Deployment

### Environment Variables

Set the following environment variables in your deployment platform:

- `FIREBASE_PROJECT_ID`
- `FIREBASE_SERVICE_ACCOUNT_KEY_PATH` (or `FIREBASE_CLIENT_EMAIL` + `FIREBASE_PRIVATE_KEY`)
- `PORT` (default: 3001)
- `CORS_ORIGIN` (comma-separated list of allowed origins)

### Health Check

The service exposes a health check endpoint:

```
GET /health
```

Returns:
```json
{
  "status": "ok",
  "service": "websocket-service",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Architecture

- **Express**: HTTP server and middleware
- **Socket.IO**: WebSocket communication
- **Firebase Admin SDK**: Firestore persistence
- **TypeScript**: Type safety

## Development

```bash
# Type checking
npm run type-check

# Build
npm run build

# Run in development mode (with watch)
npm run dev
```

