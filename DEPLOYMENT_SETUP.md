# PlantMapper Deployment Setup

## 🚀 Convex Configuration Complete!

You've successfully configured PlantMapper with:
- **Team**: tandivina
- **Project**: plantmapper-mobile

## 📋 Next Steps

### 1. Complete Convex Setup
After running `npx convex dev --configure=existing --team tandivina --project plantmapper-mobile`:

1. **Copy the deployment URL** that appears in your terminal
2. **Create `.env.local`** file in your project root:
   ```bash
   cp .env.example .env.local
   ```
3. **Update `.env.local`** with your actual deployment URL:
   ```
   EXPO_PUBLIC_CONVEX_URL=https://your-actual-deployment-url.convex.cloud
   ```

### 2. Set Up API Keys

#### PlantNet API (Plant Photo Identification):
1. Visit [PlantNet API](https://my.plantnet.org/)
2. Create free account (500 identifications/day)
3. Generate API key
4. Add to Convex Dashboard → Settings → Environment Variables:
   - Key: `PLANTNET_API_KEY`
   - Value: your PlantNet API key

#### Gemini AI (Enhanced Plant Information):
1. Visit [Google AI Studio](https://aistudio.google.com/)
2. Create free account (1,500 requests/day)
3. Generate API key
4. Add to Convex Dashboard → Settings → Environment Variables:
   - Key: `GEMINI_API_KEY`
   - Value: your Gemini API key

### 3. Initialize Sample Data (Optional)
To populate your app with sample plants and tours:

1. **Open Convex Dashboard**
2. **Go to Functions tab**
3. **Run**: `sampleData:createSampleData`
4. **Arguments**: `{}`

This creates:
- Demo user account
- Sample plant profiles (Oak, Maple, Rose)
- Example plant sightings
- Sample tour with multiple stops

### 4. Start Development

```bash
# Terminal 1: Start Convex backend
npx convex dev

# Terminal 2: Start Expo app
npm start
```

## 🔧 Environment Variables Summary

**In your `.env.local` file:**
```
EXPO_PUBLIC_CONVEX_URL=https://your-deployment-url.convex.cloud
```

**In Convex Dashboard → Settings → Environment Variables:**
- `PLANTNET_API_KEY` → Your PlantNet API key
- `GEMINI_API_KEY` → Your Gemini API key

## 🌱 Features Ready to Test

### Plant Identification:
- **Manual Entry**: Type plant names with AI validation
- **Photo ID**: Real PlantNet API identification
- **AI Enhancement**: Gemini-powered plant descriptions

### Plant Management:
- **Sightings**: Record and track plant locations
- **Profiles**: Detailed plant information with care instructions
- **Tours**: Create guided plant tours with multiple stops

### Smart Features:
- **Typo Correction**: "Did you mean..." suggestions
- **Location Tracking**: GPS coordinates with address lookup
- **Real-time Sync**: Convex handles all data synchronization

## 🎯 Testing Your Setup

1. **Open the app** → Should show PlantMapper welcome screen
2. **Try "Demo Mode"** → Explore without account creation
3. **Add Plant Sighting** → Test camera and identification
4. **Create Tour** → Build guided plant experiences

Your PlantMapper app is now connected to production-ready APIs and ready for real plant identification! 🌿✨