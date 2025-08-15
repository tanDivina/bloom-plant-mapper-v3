# PlantMapper Troubleshooting Guide

## 🚨 Common Issues & Solutions

### Issue: "Unable to read your package.json" Error

**Error Message:**
```
✖ Unable to read your package.json: Error: ENOENT: no such file or directory, stat 'package.json'
```

**Solutions:**

#### 1. Verify Current Directory
Make sure you're running Convex commands from the project root directory:
```bash
# Check current directory
pwd
# Should show: /path/to/your/plantmapper-project

# List files to confirm package.json exists
ls -la
# Should show package.json in the list
```

#### 2. Restart Convex Development Server
```bash
# Stop any running Convex processes (Ctrl+C)
# Then restart:
npx convex dev
```

#### 3. Clear Convex Cache
```bash
# Clear Convex cache and restart
rm -rf .convex
npx convex dev
```

#### 4. Reinstall Convex
```bash
# Reinstall Convex CLI
npm uninstall -g convex
npm install -g convex

# Or use npx (recommended)
npx convex dev
```

#### 5. Check Environment Variables
Ensure your `.env.local` file exists and contains:
```env
CONVEX_DEPLOYMENT=confident-lobster-242
EXPO_PUBLIC_CONVEX_URL=https://confident-lobster-242.convex.cloud
```

#### 6. Verify Convex Configuration
Check that `convex/convex.json` exists with:
```json
{
  "functions": "convex/",
  "generateCommonJSApi": false,
  "node": {
    "externalPackages": ["@google/generative-ai"]
  }
}
```

### Issue: TypeScript Errors in Convex Functions

**Solution:**
```bash
# Check TypeScript configuration
npx convex dev --verbose
```

### Issue: API Integration Not Working

**For PlantNet API:**
1. Get API key from [PlantNet API](https://my.plantnet.org/)
2. Add to Convex Dashboard → Settings → Environment Variables
3. Key: `PLANTNET_API_KEY`, Value: your API key

**For Gemini API:**
1. Get API key from [Google AI Studio](https://aistudio.google.com/)
2. Add to Convex Dashboard → Settings → Environment Variables
3. Key: `GEMINI_API_KEY`, Value: your API key

### Issue: Metro Bundler Errors

**Solution:**
```bash
# Clear Metro cache
npm run reset-cache
# or
npx expo start --clear
```

### Issue: React Native Maps Errors

**Solution:**
The app uses web-safe map components. If you see map-related errors:
```bash
# The app automatically handles map compatibility
# No action needed - maps work on web and will work on device
```

## 🔧 Complete Reset (Last Resort)

If all else fails, perform a complete reset:

```bash
# 1. Stop all processes
# Press Ctrl+C in all terminals

# 2. Clear all caches
rm -rf .convex
rm -rf node_modules
rm -rf .expo

# 3. Reinstall dependencies
npm install

# 4. Restart Convex
npx convex dev

# 5. In new terminal, restart Expo
npm start
```

## 📞 Getting Help

If you're still experiencing issues:

1. **Check the logs** - Look for specific error messages
2. **Verify file structure** - Ensure all files are in correct locations
3. **Check network** - Ensure internet connection for Convex sync
4. **Update dependencies** - Run `npm update` if needed

## ✅ Success Indicators

You'll know everything is working when:
- ✅ `npx convex dev` starts without errors
- ✅ `npm start` shows QR code for device testing
- ✅ App loads and shows PlantMapper interface
- ✅ Camera functionality works
- ✅ Plant identification processes (with or without API keys)

The app is designed to work even without API keys - it will show helpful messages about setting them up for full functionality.