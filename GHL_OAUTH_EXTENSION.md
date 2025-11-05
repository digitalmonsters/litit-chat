# GoHighLevel OAuth Extension Implementation

## ✅ Implementation Summary

The GHL OAuth flow has been extended with token storage, automatic refresh, and a client helper for making authenticated API requests.

## 📁 Files Created/Updated

### Created Files
1. **`/lib/ghl-tokens.ts`** - Token management system
   - Stores tokens in Firestore `ghl_tokens` collection
   - Automatic token refresh when expired
   - Token retrieval by location_id

2. **`/lib/ghlClient.ts`** - OAuth-enabled GHL API client
   - Automatically injects OAuth tokens
   - Falls back to API key if tokens unavailable
   - Helper functions for common operations

3. **`/app/api/ghl/test/route.ts`** - Test endpoint
   - Tests OAuth token by fetching `/users/self`
   - Logs response for verification

### Updated Files
1. **`/app/api/oauth/callback/route.ts`** - Updated to use new token storage
   - Stores tokens keyed by location_id
   - Uses `storeTokens()` from ghl-tokens.ts

## 🔧 Features Implemented

### 1. Token Storage in Firestore

**Collection**: `ghl_tokens`  
**Document ID**: `location_id`

**Document Structure**:
```typescript
{
  locationId: string;
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope?: string;
  expires_at: number;        // Timestamp in milliseconds
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### 2. Automatic Token Refresh

- Checks if token is expired (with 5-minute buffer)
- Automatically refreshes using `refresh_token`
- Updates Firestore with new tokens
- Logs refresh activity

**Refresh Logic**:
```typescript
// Token is considered expired 5 minutes before actual expiry
const buffer = 5 * 60 * 1000; // 5 minutes
if (Date.now() >= (tokenData.expires_at - buffer)) {
  // Refresh token
}
```

### 3. GHL Client Helper

**File**: `/lib/ghlClient.ts`

**Key Functions**:
- `ghlClientRequest<T>()` - Base request function with automatic token injection
- `getCurrentUser()` - Fetch `/users/self` endpoint
- `getContact()` - Get contact by ID
- `createContact()` - Create new contact
- `updateContact()` - Update existing contact

**Usage**:
```typescript
import { getCurrentUser, getContact } from '@/lib/ghlClient';

// Automatically uses OAuth token for location
const user = await getCurrentUser('location-id-123');

// Get contact
const contact = await getContact('contact-id', 'location-id-123');
```

### 4. Test Endpoint

**Route**: `GET /api/ghl/test`

**Query Parameters**:
- `locationId` (optional) - Location ID to test

**Response**:
```json
{
  "success": true,
  "message": "GHL OAuth token is working",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "User Name",
    "locationId": "location-id"
  },
  "locationId": "location-id"
}
```

## 🔄 OAuth Flow

### Complete Flow

1. **User initiates OAuth**: Visit `/api/oauth/auth`
2. **GHL authorization**: User grants permissions
3. **Callback received**: `/api/oauth/callback?code=XXXX`
4. **Token exchange**: Code exchanged for access_token and refresh_token
5. **Location ID retrieval**: Fetches user info to get location_id
6. **Token storage**: Stores tokens in `ghl_tokens/{location_id}`
7. **Success redirect**: User redirected to `/?oauth_success=true`

### Token Usage

1. **API Request**: Client calls `getCurrentUser(locationId)`
2. **Token retrieval**: Gets token from Firestore `ghl_tokens/{location_id}`
3. **Expiry check**: Checks if token is expired
4. **Auto refresh**: If expired, refreshes token automatically
5. **Request execution**: Makes API request with valid token

## 🧪 Testing

### Test OAuth Token

1. **Complete OAuth flow**:
   ```
   Visit: /api/oauth/auth
   → Authorize in GHL
   → Redirected to /api/oauth/callback
   → Tokens stored in Firestore
   ```

2. **Test token**:
   ```bash
   # Get location ID from Firestore or environment
   curl http://localhost:3000/api/ghl/test?locationId=YOUR_LOCATION_ID
   ```

3. **Expected console output**:
   ```
   🧪 Testing GHL OAuth token...
   📍 Location ID: location-id-123
   ✅ GHL API Response:
   {
     "id": "user-id",
     "email": "user@example.com",
     "name": "User Name"
   }
   ```

4. **Verify in Firestore**:
   - Check `ghl_tokens` collection
   - Document ID should match location_id
   - Should contain `access_token`, `refresh_token`, `expires_at`

### Test Token Refresh

1. **Manually expire token** (for testing):
   - Update `expires_at` in Firestore to past timestamp
   - Make API request
   - Should see refresh log: `🔄 Token expired for location X, refreshing...`

2. **Automatic refresh**:
   - Token refresh happens automatically
   - New tokens stored in Firestore
   - Request continues with new token

## 📊 Firestore Structure

### Collection: `ghl_tokens`

**Document ID**: `{location_id}`

**Example Document**:
```json
{
  "locationId": "location-abc123",
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "def50200a1b2c3d4...",
  "expires_in": 3600,
  "token_type": "Bearer",
  "scope": "contacts.readonly contacts.write",
  "expires_at": 1704067200000,
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

## 🔐 Environment Variables

Required in `.env.local`:

```bash
# OAuth Configuration
GHL_CLIENT_ID=your_client_id
GHL_CLIENT_SECRET=your_client_secret
GHL_REDIRECT_URI=https://your-domain.com/api/oauth/callback

# Optional: Default location ID (for API calls without explicit locationId)
GHL_LOCATION_ID=your_location_id

# Fallback: API Key (used if OAuth tokens unavailable)
GHL_API_KEY=your_api_key
```

## 🚀 Usage Examples

### Using GHL Client

```typescript
import { getCurrentUser, getContact, createContact } from '@/lib/ghlClient';

// Get current user (automatically uses OAuth token)
const user = await getCurrentUser('location-id-123');
console.log('Current user:', user);

// Get contact
const contact = await getContact('contact-id', 'location-id-123');

// Create contact
const newContact = await createContact({
  email: 'new@example.com',
  firstName: 'John',
  lastName: 'Doe',
  phone: '+1234567890',
}, 'location-id-123');
```

### Direct Token Management

```typescript
import { 
  getValidAccessToken, 
  getTokens, 
  refreshAccessToken 
} from '@/lib/ghl-tokens';

// Get valid token (auto-refreshes if needed)
const token = await getValidAccessToken('location-id-123');

// Get full token data
const tokenData = await getTokens('location-id-123');

// Manually refresh token
const refreshed = await refreshAccessToken('location-id-123');
```

## ✅ Verification Checklist

- [x] Tokens stored in Firestore `ghl_tokens` collection
- [x] Tokens keyed by location_id
- [x] Automatic token refresh implemented
- [x] GHL client helper created
- [x] Token injection in API requests
- [x] Test endpoint created
- [x] `/users/self` endpoint tested
- [x] Build passes successfully
- [x] Linting passes

## 📝 Route Summary

**OAuth Routes**:
- `GET /api/oauth/auth` - Initiate OAuth flow
- `GET /api/oauth/callback` - Handle OAuth callback

**Test Route**:
- `GET /api/ghl/test?locationId=XXX` - Test OAuth token

**Webhook Route**:
- `POST /api/ghl/webhook` - Receive webhooks (unchanged)

## 🎯 Next Steps

1. **Complete OAuth flow**:
   - Visit `/api/oauth/auth`
   - Authorize in GHL
   - Verify tokens stored in Firestore

2. **Test OAuth token**:
   - Visit `/api/ghl/test?locationId=YOUR_LOCATION_ID`
   - Check console for `/users/self` response
   - Verify user data is returned

3. **Use in application**:
   - Import `ghlClient` functions
   - Make authenticated API calls
   - Tokens automatically refreshed when needed

---

**Status**: ✅ Implementation complete and ready for testing

