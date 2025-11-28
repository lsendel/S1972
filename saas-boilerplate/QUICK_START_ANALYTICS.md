# 🚀 Quick Start: SEO & Analytics Setup

## Immediate Next Steps (15 minutes)

### Step 1: Install Dependencies (2 min)
```bash
cd saas-boilerplate/frontend
npm install
```

This will install:
- `react-helmet-async` - SEO meta tags
- `react-cookie-consent` - GDPR compliance
- `react-snap` - Pre-rendering for SEO

### Step 2: Set Up Google Tag Manager (5 min)

1. **Go to**: https://tagmanager.google.com
2. **Create Account**: Enter your company name
3. **Create Container**:
   - Container name: Your App Name
   - Target platform: Web
4. **Get Container ID**: Look for `GTM-XXXXXXX` in the top right
5. **Copy the ID** for the next step

### Step 3: Configure Environment (1 min)

```bash
# In saas-boilerplate/frontend directory
cp .env.example .env

# Edit .env and add your GTM ID:
VITE_GTM_ID=GTM-XXXXXXX  # Replace with your actual ID
```

### Step 4: Test Locally (5 min)

```bash
# Start development server
npm run dev

# Open browser and check console
# You should see: "GTM initialized: GTM-XXXXXXX"
# You should see: "First-touch UTM saved" or similar logs
```

**Test the following:**
1. Visit http://localhost:5173/signup
2. Open browser DevTools → Console
3. Fill out signup form and submit
4. Check console for: `🎯 Analytics Event: user_signup`
5. Cookie consent banner should appear at bottom

### Step 5: Build with Pre-rendering (2 min)

```bash
npm run build

# Check pre-rendered files were created:
ls -la dist/*.html
# Should see: index.html, login.html, signup.html, forgot-password.html
```

---

## Quick GTM Configuration (10 minutes)

### Add GA4 Tag in GTM

1. **In GTM Dashboard** → New Tag
2. **Tag Configuration** → Google Analytics: GA4 Configuration
3. **Measurement ID**: Enter your GA4 ID (G-XXXXXXXXXX)
   - Get from: https://analytics.google.com → Admin → Data Streams
4. **Triggering**: All Pages
5. **Save**

### Add Event Tag

1. **New Tag** → Google Analytics: GA4 Event
2. **Configuration Tag**: Select the GA4 tag you just created
3. **Event Name**: `{{Event}}`
4. **Trigger**: Custom Event
   - Event name: `.*` (matches all events)
5. **Save**

### Publish Container

1. **Submit** button (top right)
2. **Version Name**: "Initial setup with GA4"
3. **Publish**

---

## Test Analytics (5 minutes)

### Enable GTM Preview Mode

1. **In GTM** → Preview button (top right)
2. **Enter URL**: `http://localhost:5173`
3. **Connect**

### Perform Test Actions

1. Navigate to `/signup`
2. Fill out form
3. Click "Sign Up"

### Verify in GTM Debugger

You should see:
- ✅ `page_view` event fired
- ✅ `user_signup` event fired
- ✅ `signup_with_attribution` event fired

### Check GA4 Real-Time

1. Open **GA4** → Reports → Real-time
2. Should see active user (you)
3. Events should appear within 30 seconds

---

## Test with UTM Parameters (2 minutes)

Visit with UTM params:
```
http://localhost:5173/signup?utm_source=test&utm_medium=testing&utm_campaign=qa
```

**Check:**
1. Open DevTools → Application → Local Storage
2. Look for `first_touch_utm` key
3. Should contain: `{"utm_source":"test",...}`

**Sign up and check:**
1. GTM debugger shows UTM data in event
2. GA4 shows attribution data

---

## Production Deployment Checklist

Before deploying to production:

- [ ] GTM Container published
- [ ] GA4 property created and linked
- [ ] Environment variables set in production
- [ ] Build succeeds: `npm run build`
- [ ] Pre-rendered files generated
- [ ] nginx.conf updated (already done)
- [ ] Test signup flow end-to-end
- [ ] Cookie banner appears on first visit
- [ ] Events showing in GA4 real-time

---

## Quick Reference: Common Commands

```bash
# Development
npm run dev                    # Start dev server
npm run build                  # Production build with pre-rendering
npm run preview                # Preview production build

# Testing
npm test                       # Run unit tests
npm run test:e2e              # Run E2E tests

# Analytics Testing
# Open GTM → Preview → Enter URL → Test
# Open GA4 → Admin → DebugView → Test events
```

---

## Common Issues & Quick Fixes

### "GTM_ID not configured"
**Fix**: Set `VITE_GTM_ID` in `.env` file

### Events not showing in GA4
**Fix**:
1. Check GTM Preview - are tags firing?
2. Verify GA4 measurement ID is correct
3. Wait 24-48 hours for data (or use DebugView for real-time)

### Cookie banner not appearing
**Fix**: Clear cookies and localStorage, reload page

### Pre-rendering fails
**Fix**: Check for runtime errors in console, ensure public pages don't require auth

---

## Need Help?

- **GTM Issues**: Check GTM Preview mode for tag firing
- **GA4 Issues**: Use DebugView for real-time debugging
- **SEO Issues**: Run Lighthouse audit in Chrome DevTools
- **Build Issues**: Check build logs for errors

---

## What's Next?

After completing the quick start:

1. **Add Meta Tags to All Public Pages**
   - Copy pattern from Signup.tsx
   - Add unique title, description, keywords

2. **Configure Facebook Pixel** (Optional)
   - Add Custom HTML tag in GTM
   - Set up conversion events

3. **Create UTM Campaign Links**
   - Use pattern: `?utm_source=X&utm_medium=Y&utm_campaign=Z`
   - Test with different campaigns

4. **Monitor Analytics**
   - Check GA4 daily for user behavior
   - Review UTM attribution reports
   - Track conversion funnels

---

**Ready to start?** → `npm install` in the frontend directory!
