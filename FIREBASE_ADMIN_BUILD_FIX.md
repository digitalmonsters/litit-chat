# Firebase Admin Build Fix - Complete ✅

## Problem
Netlify production build was failing with:
```
Module not found: Can't resolve 'firebase-admin'
```

This occurred because `firebase-admin` was not in dependencies and was being stripped out in production builds.

## Solution

### 1. ✅ Moved firebase-admin to dependencies

**File**: `package.json`

```json
"dependencies": {
  "firebase-admin": "^12.0.0",
  ...
}
```

### 2. ✅ Added server-only dynamic import guard

**File**: `app/api/push/send/route.ts`

**Changes**:
- Added module-level server-only guard:
  ```typescript
  if (typeof window !== 'undefined') {
    throw new Error('firebase-admin can only be used on the server');
  }
  ```

- Added function-level guard in `getAdminMessaging()`:
  ```typescript
  if (typeof window !== 'undefined') {
    throw new Error('firebase-admin can only be used on the server');
  }
  ```

- Updated type declarations:
  ```typescript
  let admin: typeof import('firebase-admin') | null = null;
  let messaging: any = null;
  ```

### 3. ✅ Updated package-lock.json

Ran `npm install` to update `package-lock.json` with firebase-admin as a production dependency.

## Verification

- ✅ `firebase-admin` is now in `dependencies` (not `devDependencies`)
- ✅ Server-only guards prevent client bundle inclusion
- ✅ Dynamic import ensures module is only loaded on server
- ✅ `package-lock.json` updated with firebase-admin

## Commit

```
fix(build): move firebase-admin to dependencies and add server-only dynamic import guard
```

## Next Steps

1. Push to main branch
2. Trigger Netlify production redeploy
3. Verify build completes successfully at https://lit.dm2pay.com

## Notes

- The server-only guards ensure `firebase-admin` is never included in client bundles
- Dynamic import (`await import('firebase-admin')`) loads the module only when needed
- This approach is compatible with Next.js server components and API routes

