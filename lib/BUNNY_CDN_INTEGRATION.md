# Bunny CDN Upload Integration

## Overview

This integration provides seamless file upload functionality to Bunny CDN for user-generated content including images, audio, and video files.

## Architecture

### Components

1. **API Route** (`/app/api/upload/route.ts`)
   - Handles multipart form-data uploads
   - Validates file size and MIME types
   - Returns CDN URLs for uploaded files

2. **Server Utility** (`/lib/utils/bunny.ts`)
   - Reusable upload function with retry logic
   - Helper functions for validation and URL generation
   - Delete functionality for file management

3. **Client Utility** (`/lib/utils/upload-client.ts`)
   - Browser-side upload functions
   - Progress tracking support
   - File validation before upload

## Configuration

### Environment Variables

Add the following to `.env.local`:

```env
BUNNY_STORAGE_ZONE=litit-chat-images
BUNNY_STORAGE_KEY=your-storage-key
BUNNY_STORAGE_REGION=la
BUNNY_CDN_URL=https://litit-chat-cdn.b-cdn.net
```

### Validation Rules

- **Maximum file size**: 100 MB
- **Allowed MIME types**: 
  - `image/*` (PNG, JPEG, GIF, WebP, etc.)
  - `video/*` (MP4, WebM, MOV, etc.)
  - `audio/*` (MP3, WAV, OGG, etc.)

## API Usage

### Upload Endpoint

**POST** `/api/upload`

**Request** (multipart/form-data):
```typescript
FormData {
  file: File;           // Required - The file to upload
  folder?: string;      // Optional - Target folder (default: "uploads/messages")
  filename?: string;    // Optional - Custom filename (default: auto-generated)
}
```

**Success Response** (201):
```json
{
  "success": true,
  "url": "https://litit-chat-cdn.b-cdn.net/uploads/messages/1699123456_image.jpg",
  "filename": "1699123456_image.jpg",
  "folder": "uploads/messages",
  "size": 245678,
  "type": "image/jpeg"
}
```

**Error Response** (400/500):
```json
{
  "success": false,
  "error": "Error message here"
}
```

### Configuration Endpoint

**GET** `/api/upload`

Returns upload configuration and limits.

### Test Endpoint

**GET** `/api/upload/test`

Verifies that all Bunny CDN environment variables are properly configured.

## Client Usage

### Basic Upload

```typescript
import { uploadFile } from '@/lib/utils/upload-client';

const file = document.querySelector('input[type="file"]').files[0];
const result = await uploadFile(file);

if (result.success) {
  console.log('Uploaded:', result.url);
} else {
  console.error('Upload failed:', result.error);
}
```

### Upload with Progress Tracking

```typescript
import { uploadFile } from '@/lib/utils/upload-client';

const result = await uploadFile(file, {
  folder: 'uploads/avatars',
  onProgress: (progress) => {
    console.log(`Upload progress: ${progress}%`);
    // Update UI progress bar
  }
});
```

### Upload to Custom Folder

```typescript
const result = await uploadFile(file, {
  folder: 'uploads/flames',
  filename: 'custom-name.jpg'
});
```

### Multiple Files

```typescript
import { uploadMultipleFiles } from '@/lib/utils/upload-client';

const files = Array.from(document.querySelector('input[type="file"]').files);
const results = await uploadMultipleFiles(files, {
  folder: 'uploads/gallery'
});

results.forEach((result, index) => {
  if (result.success) {
    console.log(`File ${index + 1} uploaded:`, result.url);
  }
});
```

### Pre-upload Validation

```typescript
import { validateFileBeforeUpload, formatFileSize } from '@/lib/utils/upload-client';

const validation = validateFileBeforeUpload(file);
if (!validation.valid) {
  alert(validation.error);
  return;
}

console.log('File size:', formatFileSize(file.size));
// Proceed with upload
```

## Server-Side Usage

### Direct Upload from API Route

```typescript
import { uploadToBunny } from '@/lib/utils/bunny';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  
  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await uploadToBunny(
    buffer,
    'my-file.jpg',
    'uploads/custom-folder',
    file.type
  );
  
  if (result.success) {
    // Store result.url in Firestore
    return NextResponse.json({ url: result.url });
  }
}
```

### Delete File

```typescript
import { deleteFromBunny } from '@/lib/utils/bunny';

const deleted = await deleteFromBunny('uploads/messages/old-file.jpg');
if (deleted) {
  console.log('File deleted successfully');
}
```

## Folder Structure

Recommended folder structure for uploads:

```
uploads/
├── messages/         # Chat attachments
├── avatars/          # User profile pictures
├── flames/           # Flame videos
├── gallery/          # User gallery content
├── streams/          # Live stream content
└── test/             # Test uploads
```

## Retry Logic

The server utility includes automatic retry logic with exponential backoff:

- **Maximum retries**: 3 attempts
- **Backoff delays**: 1s, 2s, 4s
- **Total timeout**: ~7 seconds

## Integration with Firestore

### Storing Upload URLs

After successful upload, store the CDN URL in Firestore:

```typescript
import { doc, setDoc } from 'firebase/firestore';
import { uploadFile } from '@/lib/utils/upload-client';

const result = await uploadFile(file, { folder: 'uploads/avatars' });

if (result.success) {
  await setDoc(doc(firestore, 'users', userId), {
    photoURL: result.url,
    updatedAt: serverTimestamp()
  }, { merge: true });
}
```

### Chat Messages with Media

```typescript
const result = await uploadFile(file, { folder: 'uploads/messages' });

if (result.success) {
  await setDoc(doc(collection(firestore, 'messages')), {
    chatId,
    senderId,
    content: result.url,
    type: file.type.startsWith('image/') ? 'image' : 'file',
    mediaUrl: result.url,
    timestamp: serverTimestamp()
  });
}
```

## Testing

### Run QA Tests

```bash
# Start development server
npm run dev

# Run test suite
./scripts/test-bunny-upload.sh

# Or test against staging
BASE_URL=https://staging.litit.app ./scripts/test-bunny-upload.sh
```

### Manual Testing

1. **Test Configuration**:
   ```bash
   curl http://localhost:3000/api/upload/test
   ```

2. **Upload Test Image**:
   ```bash
   curl -X POST http://localhost:3000/api/upload \
     -F "file=@/path/to/image.jpg" \
     -F "folder=uploads/test"
   ```

3. **Verify CDN URL**:
   ```bash
   curl -I https://litit-chat-cdn.b-cdn.net/uploads/test/your-file.jpg
   ```

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `BUNNY_STORAGE_KEY is not configured` | Missing env var | Add to `.env.local` |
| `File size exceeds maximum` | File > 100 MB | Compress or split file |
| `Invalid file type` | Unsupported MIME | Use image/video/audio only |
| `Upload failed after all retry attempts` | Network/API issue | Check Bunny dashboard, verify API key |

### Client-Side Error Handling

```typescript
const result = await uploadFile(file);

if (!result.success) {
  switch(true) {
    case result.error?.includes('size'):
      alert('File is too large. Maximum size is 100 MB.');
      break;
    case result.error?.includes('type'):
      alert('Invalid file type. Only images, videos, and audio are allowed.');
      break;
    default:
      alert('Upload failed. Please try again.');
  }
}
```

## Performance Considerations

### Client-Side

- Validate files before uploading to save bandwidth
- Show progress indicators for large files
- Consider compressing images before upload
- Use `uploadMultipleFiles` sequentially, not parallel (to avoid overwhelming the server)

### Server-Side

- Files are streamed to Bunny, not stored on disk
- Retry logic prevents transient failures
- Automatic filename sanitization prevents path issues

## Security

- Files are validated on the server (never trust client validation)
- Filenames are sanitized to prevent path traversal
- MIME type validation prevents malicious uploads
- Size limits prevent abuse

## Monitoring

### Check Bunny Dashboard

- Monitor storage usage
- View uploaded files
- Check bandwidth usage
- Review access logs

### Server Logs

All uploads are logged with the `[Bunny Upload]` prefix:

```
[Bunny Upload] Attempt 1/3: uploads/messages/1699123456_image.jpg
[Bunny Upload] ✅ Success: https://litit-chat-cdn.b-cdn.net/...
```

## Troubleshooting

### Upload Succeeds but File Not Accessible

- **Cause**: CDN purge cache or propagation delay
- **Solution**: Wait 1-2 minutes, or purge CDN cache in Bunny dashboard

### 403 Forbidden Error

- **Cause**: Invalid `BUNNY_STORAGE_KEY`
- **Solution**: Verify API key in Bunny dashboard

### Network Timeout

- **Cause**: Large file or slow connection
- **Solution**: Increase timeout or implement chunked upload

## Future Enhancements

- [ ] Chunked uploads for files > 100 MB
- [ ] Image optimization (resize, compress)
- [ ] Video transcoding integration
- [ ] Thumbnail generation
- [ ] Direct browser-to-Bunny upload (signed URLs)
- [ ] Upload queue with retry mechanism

## Support

For issues related to Bunny CDN:
- Documentation: https://docs.bunny.net/
- Dashboard: https://dash.bunny.net/

For application-specific issues, contact the development team.
