# PlantMapper Development Setup

## 🚀 Starting PlantMapper

### 1. Start Convex Backend
First, start the Convex development server:
```bash
npx convex dev
```

This will:
- Generate the `_generated` API files
- Start the backend server
- Watch for changes in your Convex functions

### 2. Start Expo Development Server
In a new terminal, start the Expo app:
```bash
npm start
```

This will:
- Start the Metro bundler
- Show QR code for device testing
- Enable web preview

## 📱 Testing Options

### On Device:
1. Install Expo Go app on your phone
2. Scan the QR code from `npm start`
3. App will load on your device

### On Web:
1. Press `w` in the terminal after `npm start`
2. Opens in your browser
3. Note: Camera features work better on mobile

### On Simulator:
- **iOS**: Press `i` (requires Xcode)
- **Android**: Press `a` (requires Android Studio)

## 🔧 Environment Setup

### Required Environment Variables:
Create `.env.local` file with:
```env
EXPO_PUBLIC_CONVEX_URL=https://your-deployment-url.convex.cloud
```

### Optional API Keys (for real plant identification):
In Convex Dashboard → Settings → Environment Variables:
- `PLANTNET_API_KEY` - For photo identification
- `GEMINI_API_KEY` - For AI-enhanced descriptions

## 🌱 Demo Features Ready to Test

### Plant Identification:
- **Manual Entry**: Type plant names with AI validation
- **Photo ID**: Real PlantNet API identification
- **AI Enhancement**: Gemini-powered descriptions

### Plant Management:
- **Sightings**: Record and track plant locations
- **Profiles**: Detailed plant information
- **Tours**: Create guided plant experiences

### Smart Features:
- **Location Tracking**: GPS coordinates with addresses
- **Real-time Sync**: All data synced via Convex
- **Offline Ready**: Core features work without internet

## 🎯 First Steps

1. **Welcome Screen** → Auto-navigates to Discover tab
2. **Add Plant Sighting** → Test camera and identification
3. **View Map** → See your plant locations
4. **Create Tour** → Build guided experiences

## 🔍 Troubleshooting

### If Convex errors:
```bash
npx convex dev --configure
```

### If Metro bundler issues:
```bash
npm run reset-cache
```

### If TypeScript errors:
```bash
npx expo install --fix
```

Your PlantMapper app is ready to explore! 🌿✨