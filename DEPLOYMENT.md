# Vercel Deployment Guide

## Pre-Deployment Checklist

### ✅ Build Verification
- [x] Linting passes (`npm run lint`)
- [x] Build completes successfully (`npm run build`)
- [x] TypeScript compilation passes
- [x] No runtime errors

### Environment Variables

The following environment variables must be configured in Vercel:

#### Firebase Configuration (Required)
```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

#### GoHighLevel Webhook (Required)
```
GHL_WEBHOOK_SECRET=your_webhook_secret
```

#### Stripe Configuration (Optional - for payments)
```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

#### GoHighLevel API (Optional)
```
GHL_API_KEY=your_ghl_api_key
GHL_LOCATION_ID=your_location_id
```

## Deployment Steps

### 1. Vercel CLI Deployment

```bash
# Install Vercel CLI (if not already installed)
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

### 2. Vercel Dashboard Deployment

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Import your Git repository
3. Configure project settings:
   - **Framework Preset**: Next.js
   - **Root Directory**: `litit-chat` (if monorepo)
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
4. Add environment variables in Project Settings → Environment Variables
5. Deploy

### 3. Environment Variables Setup

1. Navigate to Project Settings → Environment Variables
2. Add each environment variable:
   - **Key**: Variable name (e.g., `NEXT_PUBLIC_FIREBASE_API_KEY`)
   - **Value**: Variable value
   - **Environment**: Select all (Production, Preview, Development)
3. Save and redeploy

### 4. Webhook Configuration

After deployment, configure GoHighLevel webhook:

1. Get your deployment URL: `https://your-project.vercel.app`
2. Set webhook URL in GoHighLevel: `https://your-project.vercel.app/api/ghl/webhook`
3. Set webhook secret in Vercel environment variables
4. Test webhook with GHL webhook tester

## Build Configuration

### Next.js Config
- Framework: Next.js 16.0.1
- Node.js Version: 18.x or 20.x (recommended)
- Build Command: `npm run build`
- Output Directory: `.next`

### Dependencies
All dependencies are installed via `package.json`:
- Next.js 16.0.1
- React 19.2.0
- Firebase SDK
- Framer Motion
- Lottie React
- Tailwind CSS v4

## Post-Deployment Verification

### 1. Health Checks
- [ ] Home page loads successfully
- [ ] API route `/api/ghl/webhook` responds to GET requests
- [ ] No console errors in browser
- [ ] Firebase initializes correctly (check browser console)

### 2. Webhook Testing
```bash
# Test webhook endpoint
curl https://your-project.vercel.app/api/ghl/webhook

# Expected response:
# {"message":"GHL Webhook endpoint is active","methods":["POST","GET"]}
```

### 3. Firebase Integration
- [ ] Check browser console for Firebase initialization
- [ ] Verify Firestore connection (if authentication is set up)
- [ ] Test Firebase Auth (if implemented)

### 4. Performance
- [ ] Lighthouse score > 90
- [ ] Page load time < 2s
- [ ] First Contentful Paint < 1.5s

## Troubleshooting

### Build Fails
1. Check build logs in Vercel dashboard
2. Verify all environment variables are set
3. Ensure Node.js version is compatible (18.x or 20.x)
4. Check for missing dependencies in `package.json`

### Environment Variables Not Working
1. Ensure `NEXT_PUBLIC_*` variables are prefixed correctly
2. Redeploy after adding new environment variables
3. Check variable names match exactly (case-sensitive)

### Webhook Not Receiving Data
1. Verify webhook URL is correct in GHL settings
2. Check webhook secret matches in both Vercel and GHL
3. Review Vercel function logs for errors
4. Test webhook with curl or Postman

### Firebase Connection Issues
1. Verify Firebase config environment variables
2. Check Firebase project settings
3. Ensure Firestore is enabled in Firebase Console
4. Review browser console for Firebase errors

## Continuous Deployment

### Git Integration
- Push to `main` branch → Auto-deploys to production
- Push to other branches → Creates preview deployments
- Pull requests → Creates preview deployments

### Preview Deployments
Every push to a branch creates a preview URL:
- Format: `https://your-project-git-branch.vercel.app`
- Useful for testing before merging to main

## Monitoring

### Vercel Analytics
- Enable Vercel Analytics in project settings
- Monitor performance metrics
- Track errors and exceptions

### Logs
- View function logs in Vercel dashboard
- Check API route logs for webhook activity
- Monitor build logs for deployment issues

## Security Checklist

- [ ] All secrets stored in Vercel environment variables (not in code)
- [ ] Webhook secret is strong and unique
- [ ] Firebase rules configured for production
- [ ] CORS configured if needed
- [ ] Rate limiting implemented for API routes (if needed)

## Rollback Plan

If deployment fails:
1. Go to Vercel dashboard → Deployments
2. Find last successful deployment
3. Click "..." → "Promote to Production"
4. Investigate and fix issues
5. Redeploy when ready

## Support

- Vercel Documentation: https://vercel.com/docs
- Next.js Documentation: https://nextjs.org/docs
- Firebase Documentation: https://firebase.google.com/docs

