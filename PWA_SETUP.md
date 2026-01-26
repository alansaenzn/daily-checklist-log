# PWA Setup Complete! 🎉

Your app now has full PWA (Progressive Web App) support with offline capabilities.

## What's Been Added

### 1. Service Worker (`src/sw.ts`)
- Caches static assets (images, Next.js files)
- NetworkFirst strategy for API calls
- CacheFirst strategy for images and static files

### 2. Manifest (`public/manifest.json`)
- App name and icons configured
- Standalone display mode (looks like a native app)
- App shortcuts for quick access

### 3. Service Worker Registration
- Auto-registers in production
- Checks for updates every minute
- Located in `src/components/ServiceWorkerRegister.tsx`

## How to Install on iPhone

### Safari (iPhone)
1. Open your deployed app in Safari
2. Tap the Share button (square with arrow)
3. Scroll down and tap "Add to Home Screen"
4. Tap "Add" in the top right
5. The app icon will appear on your home screen

### Testing Locally on iPhone
1. Make sure your iPhone and Mac are on the same WiFi
2. Find your Mac's local IP: `ipconfig getifaddr en0`
3. Build the app: `npm run build`
4. Start the server: `npm start`
5. On your iPhone, open Safari and go to `http://[YOUR_MAC_IP]:3000`
6. Follow the installation steps above

## Performance Improvements

The PWA provides:
- **Faster load times** - Assets are cached locally
- **Offline support** - Core features work without internet
- **Native feel** - Runs in standalone mode without browser chrome
- **Install prompts** - Users can add to home screen
- **Background updates** - Service worker updates automatically

## Build Commands

```bash
# Development (PWA disabled)
npm run dev

# Production build (with PWA)
npm run build

# Start production server
npm start
```

## Important Notes

1. **Service worker only works in production** - It's disabled in development mode
2. **HTTPS required for deployment** - Service workers require secure contexts (localhost is exempt)
3. **Webpack mode** - The build uses webpack instead of Turbopack because Serwist doesn't support Turbopack yet
4. **Cache updates** - Service worker checks for updates every 60 seconds

## Next Steps for Native iOS

If you want a true native app later:

1. **Use Capacitor** - Wraps your web app in a native container
   ```bash
   npm install @capacitor/ios
   npx cap init
   npx cap add ios
   npx cap sync
   npx cap open ios
   ```

2. **Deploy to App Store** - Submit through Xcode

## Caching Strategy

- **Supabase API**: NetworkFirst (tries network, falls back to cache)
- **Images**: CacheFirst (serves from cache, updates in background)
- **Next.js static files**: CacheFirst (long-term caching)
- **Dynamic routes**: Server-rendered on demand

## Troubleshooting

**Service worker not registering?**
- Check browser console for errors
- Ensure you're in production mode (`npm start`, not `npm run dev`)
- Clear browser cache and hard reload (Cmd+Shift+R)

**App not installable?**
- Make sure manifest.json is accessible at `/manifest.json`
- Icons must be present in `/icons/`
- HTTPS required (except localhost)

**Cache issues?**
- Unregister service worker in browser DevTools > Application > Service Workers
- Clear all caches in DevTools > Application > Cache Storage
- The service worker automatically updates, but you can force reload

## Testing PWA

1. Build and start: `npm run build && npm start`
2. Open Chrome DevTools > Lighthouse
3. Run PWA audit to check compliance
4. Check "Application" tab to view:
   - Service Worker status
   - Manifest details
   - Cache storage
