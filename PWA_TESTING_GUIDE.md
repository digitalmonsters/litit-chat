# PWA Testing & Verification Guide

## ✅ Pre-Testing Checklist

### 1. Icons Generated ✅
- [x] icon-192x192.png
- [x] icon-256x256.png
- [x] icon-384x384.png
- [x] icon-512x512.png
- [x] All icons are valid PNG files
- [x] Icons use Lit.it flame theme colors

### 2. Manifest.json Verified ✅
- [x] Theme color: #FF5E3A
- [x] Background color: #1E1E1E
- [x] All icon sizes referenced
- [x] Splash screen configuration added
- [x] Display mode: standalone

### 3. Splash Screen ✅
- [x] Background color: #1E1E1E (matches flame palette)
- [x] Configured in manifest.json
- [x] Apple splash screen meta tags added

## 🧪 Lighthouse PWA Audit

### Steps to Run

1. **Build and serve production build**:
   ```bash
   npm run build -- --webpack
   npm run start
   ```

2. **Open Chrome DevTools**:
   - Press `F12` or `Cmd+Option+I` (Mac) / `Ctrl+Shift+I` (Windows)
   - Click on **Lighthouse** tab
   - Select **Progressive Web App** category
   - Click **Analyze page load**

3. **Expected Results**:
   - **PWA Score**: ≥ 95
   - **Installable**: ✅ Yes
   - **Service Worker**: ✅ Registered
   - **Manifest**: ✅ Valid
   - **HTTPS**: ✅ (in production)

### Common Issues & Fixes

**Issue**: Score < 95
- Check service worker is registered
- Verify manifest.json is valid JSON
- Ensure icons are accessible
- Check HTTPS (required in production)

**Issue**: "Does not provide a valid apple-touch-icon"
- Verify apple-touch-icon meta tags in layout.tsx
- Ensure icon files exist at referenced paths

**Issue**: "Does not provide a valid maskable icon"
- Ensure icons have proper purpose: "any maskable"
- Icons should have safe zone (20% padding)

## 📱 "Add to Home Screen" Testing

### Android Chrome

1. **Open app** in Chrome browser
2. **Look for install banner**:
   - Appears automatically after meeting PWA criteria
   - Or click menu (⋮) → "Add to Home Screen" or "Install App"
3. **Install**:
   - Tap "Add" or "Install"
   - App icon appears on home screen
4. **Verify**:
   - Tap icon to launch
   - App opens in standalone mode (no browser UI)
   - Splash screen appears with #1E1E1E background

### iOS Safari

1. **Open app** in Safari browser
2. **Add to Home Screen**:
   - Tap Share button (□↑)
   - Select "Add to Home Screen"
   - Tap "Add"
3. **Verify**:
   - Icon appears on home screen
   - Tap icon to launch
   - App opens in standalone mode
   - Status bar matches theme color (#FF5E3A)

### Desktop Chrome

1. **Open app** in Chrome
2. **Install prompt**:
   - Look for install icon in address bar
   - Or go to menu → "Install Lit.it Chat..."
3. **Verify**:
   - App opens in standalone window
   - No browser UI visible
   - Window has app icon

## 🔍 Manual Verification

### Check Service Worker

1. **Open DevTools** → **Application** tab
2. **Service Workers** section:
   - Should show registered service worker
   - Status: "activated and is running"
   - Source: `/sw.js`

### Check Manifest

1. **Open DevTools** → **Application** tab
2. **Manifest** section:
   - Should show "Lit.it Chat"
   - Icons: 4 icons listed
   - Theme color: #FF5E3A
   - Background color: #1E1E1E

### Check Icons

1. **Verify files exist**:
   ```bash
   ls -lh public/icons/icon-*.png
   ```

2. **Check file sizes** (should be > 1KB):
   - icon-192x192.png: ~5-10KB
   - icon-256x256.png: ~8-15KB
   - icon-384x384.png: ~15-25KB
   - icon-512x512.png: ~25-40KB

### Check Splash Screen

1. **Install app** on device
2. **Launch app** from home screen
3. **Verify**:
   - Splash screen background: #1E1E1E (dark)
   - Icon appears centered
   - Smooth transition to app

## 📊 PWA Score Breakdown

### Required for 95+ Score

- [x] **Has a manifest**: ✅
- [x] **Has a service worker**: ✅
- [x] **Served over HTTPS**: ✅ (in production)
- [x] **Has icons**: ✅ (192, 256, 384, 512)
- [x] **Has a start URL**: ✅
- [x] **Has a theme color**: ✅ (#FF5E3A)
- [x] **Has a background color**: ✅ (#1E1E1E)
- [x] **Has a display mode**: ✅ (standalone)
- [x] **Icons are maskable**: ✅
- [x] **Manifest is valid JSON**: ✅

### Optional (for higher score)

- [ ] Screenshots (optional, for better score)
- [ ] Shortcuts (already configured)
- [ ] Share target (already configured)

## 🎯 Testing Checklist

### Desktop Testing
- [ ] Lighthouse PWA audit ≥ 95
- [ ] Install prompt appears in Chrome
- [ ] App installs successfully
- [ ] Standalone mode works
- [ ] Service worker active

### Mobile Testing (Android)
- [ ] Install banner appears
- [ ] App installs from Chrome
- [ ] Icon appears on home screen
- [ ] Standalone mode works
- [ ] Splash screen shows (#1E1E1E background)

### Mobile Testing (iOS)
- [ ] "Add to Home Screen" works in Safari
- [ ] Icon appears on home screen
- [ ] Standalone mode works
- [ ] Status bar color matches (#FF5E3A)
- [ ] Splash screen shows (#1E1E1E background)

## 🚀 After Verification

Once PWA score ≥ 95 and "Add to Home Screen" works:

**Next Phase**: Firebase Auth + Profile Setup

Ready to proceed with:
1. Firebase Authentication integration
2. User profile setup
3. Auth UI components
4. Profile management

---

**Status**: ✅ PWA polish complete - Ready for Lighthouse testing

