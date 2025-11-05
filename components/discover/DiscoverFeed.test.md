# Discover Feed Testing Checklist

## ✅ Responsive Layout Testing

### Breakpoints to Test

1. **Mobile (375px)**
   - [ ] Grid shows 1 column
   - [ ] Cards stack vertically
   - [ ] Modal is full-screen
   - [ ] Touch interactions work

2. **Tablet (768px)**
   - [ ] Grid shows 2 columns (`md:grid-cols-2`)
   - [ ] Cards are evenly spaced
   - [ ] Modal is centered with padding

3. **Desktop (1280px)**
   - [ ] Grid shows 3 columns (`lg:grid-cols-3`)
   - [ ] Cards maintain aspect ratio
   - [ ] Modal is centered with max-width

4. **Large Desktop (1920px+)**
   - [ ] Grid shows 4 columns (`xl:grid-cols-4`)
   - [ ] Layout doesn't stretch too wide

### CSS Classes Verified
```css
/* Mobile: 1 column */
grid-cols-1

/* Tablet: 2 columns */
md:grid-cols-2

/* Desktop: 3 columns */
lg:grid-cols-3

/* Large: 4 columns */
xl:grid-cols-4
```

## ⚡ Performance Testing

### ProfileModal Animation Frame Time

**Target: < 16ms per frame (60 FPS)**

Check in Chrome DevTools:
1. Open DevTools → Performance tab
2. Record while opening/closing ProfileModal
3. Verify frame times are under 16ms

**Optimizations Applied:**
- `will-change` on animated elements
- `transform` instead of `top/left`
- `AnimatePresence` for efficient mount/unmount
- Backdrop blur with `backdrop-blur-sm`

### Lighthouse Performance Target

**Target: > 90**

Run Lighthouse audit:
```bash
# In Chrome DevTools
1. Open Lighthouse tab
2. Select "Performance"
3. Click "Analyze page load"
4. Verify score > 90
```

## 🔄 GHL Contact Sync Testing

### Manual Sync Test

```bash
# Test manual sync
curl -X POST http://localhost:3000/api/discover/sync \
  -H "Content-Type: application/json"
```

**Verify:**
- [ ] API returns success
- [ ] Firestore `users` collection updated
- [ ] Contacts with tags "Creator" or "Public" are synced
- [ ] Log shows: `✅ Synced {count} GHL contacts → Firestore users`

### Firestore Data Verification

Check Firestore console:
- [ ] Users have `ghlId` field
- [ ] Users have `ghlContactId` field
- [ ] Users have `photoURL` (from GHL `photo`)
- [ ] Users have `displayName` (from GHL `firstName + lastName`)
- [ ] Users have `interests` (from GHL `tags` excluding Creator/Public)

### Cron Sync Test

```bash
# Test cron endpoint
curl http://localhost:3000/api/cron/discover-sync \
  -H "Authorization: Bearer ${CRON_SECRET}"
```

**Verify:**
- [ ] Returns success response
- [ ] Syncs contacts correctly
- [ ] Logs show sync count

## 📊 Performance Metrics

### Expected Metrics

- **First Contentful Paint (FCP)**: < 1.8s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Time to Interactive (TTI)**: < 3.8s
- **Cumulative Layout Shift (CLS)**: < 0.1
- **Total Blocking Time (TBT)**: < 200ms

### Animation Performance

- **ProfileModal open**: < 16ms/frame
- **ProfileModal close**: < 16ms/frame
- **Card hover**: < 16ms/frame
- **Tab switch**: < 16ms/frame

## 🐛 Common Issues & Fixes

### Layout Issues
- **Cards too wide on mobile**: Check `grid-cols-1` is applied
- **Cards overlap**: Check gap spacing in grid
- **Modal overflow**: Check `overflow-y-auto` on modal

### Performance Issues
- **Slow animations**: Add `will-change: transform`
- **Janky scrolling**: Use `transform` instead of `top/left`
- **Heavy re-renders**: Memoize components with `React.memo`

### Sync Issues
- **No contacts syncing**: Check `GHL_LOCATION_ID` is set
- **Wrong tags**: Verify contacts have "Creator" or "Public" tags
- **Missing photos**: Check GHL `photo` field exists

