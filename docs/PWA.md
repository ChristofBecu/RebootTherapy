# PWA Implementation

## What's Been Added

Your Reboot Therapy blog is now a Progressive Web App (PWA)! This means users can install it as an app on their devices.

### Files Created:

1. **`src/public/manifest.json`** - Web app manifest with app metadata
2. **`src/public/sw.js`** - Service worker for offline functionality and caching
3. **`src/public/icon-192.png`** - 192x192 app icon
4. **`src/public/icon-512.png`** - 512x512 app icon

### Files Modified:

1. **`src/index.html`** - Added PWA manifest links and meta tags
2. **`src/scripts/main.js`** - Added service worker registration
3. **`netlify.toml`** - Added headers for service worker and manifest

## Features

- ✅ Installable on desktop and mobile devices
- ✅ Offline caching for faster loading
- ✅ App-like experience with standalone display mode
- ✅ Custom app icons
- ✅ Theme color matching your site's dark theme

## Testing After Deployment

1. Deploy to Netlify
2. Open your site in Chrome or Edge
3. Look for the install icon (⊕) in the address bar
4. Click it to install as an app!

### Testing Locally

You can also test the PWA locally:

```bash
# Install a local server if you don't have one
npm install -g http-server

# Serve the src directory
cd /home/bedawang/dev/projects/RebootTherapy
http-server src -p 8080

# Open http://localhost:8080 in Chrome
# Note: Service workers require HTTPS in production, but work on localhost for testing
```

### Lighthouse Audit

After deployment, you can check your PWA score:

1. Open Chrome DevTools (F12)
2. Go to "Lighthouse" tab
3. Select "Progressive Web App" category
4. Click "Generate report"

## Browser Support

- ✅ Chrome/Edge (Desktop & Mobile) - Full support with install prompt
- ✅ Safari iOS - Add to Home Screen available
- ✅ Firefox - Basic PWA support
- ✅ Samsung Internet - Full support

## Cache Strategy

The service worker uses a "Cache First" strategy:
- Static assets are cached on first visit
- Subsequent visits load instantly from cache
- New content is fetched in the background and cached for next time

## Updating the App

When you make changes:
1. Update the `CACHE_NAME` version in `src/public/sw.js` (e.g., 'reboot-therapy-v2')
2. This will force the service worker to update and clear old caches
3. Users will get the new version on their next visit

Enjoy your new installable blog! 🚀
