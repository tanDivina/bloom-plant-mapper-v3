# Convex Setup Guide

## 🚨 Fix for "_generated/api" Module Error

The error you're seeing occurs because Convex hasn't generated the required API files yet. Here's how to fix it:

## 1. Initialize Convex

Run this command in your terminal:

```bash
npx convex dev
```

This will:
- Generate the `convex/_generated/` directory
- Create `api.ts` and `dataModel.ts` files
- Start the Convex development server

## 2. If First Time Setup

If you haven't set up Convex yet:

```bash
# Install Convex CLI globally (optional)
npm install -g convex

# Initialize Convex in your project
npx convex dev --configure
```

Follow the prompts to:
- Create a Convex account (if needed)
- Set up your project
- Choose your team/organization

## 3. Environment Variables

After Convex generates your deployment URL, update your `.env.local`:

```env
EXPO_PUBLIC_CONVEX_URL=https://your-deployment-url.convex.cloud
```

## 4. API Keys (Optional)

For real plant identification, add these to Convex Dashboard → Settings → Environment Variables:

- `PLANTNET_API_KEY` - Get from [PlantNet API](https://my.plantnet.org/)
- `GEMINI_API_KEY` - Get from [Google AI Studio](https://aistudio.google.com/)

## 5. Start Development

Once Convex is running:

```bash
# Terminal 1: Keep Convex running
npx convex dev

# Terminal 2: Start Expo
npm start
```

## 6. Create Sample Data (Optional)

In the Convex Dashboard:
1. Go to Functions tab
2. Run `sampleData:createSampleData`
3. Arguments: `{}`

This creates demo plants and tours for testing.

## Troubleshooting

### If you still get import errors:
1. Make sure `npx convex dev` is running
2. Check that `convex/_generated/api.ts` exists
3. Restart your Expo development server

### If Convex won't start:
1. Check your internet connection
2. Make sure you're logged into Convex: `npx convex login`
3. Try: `npx convex dev --configure` to reconfigure

The app should work perfectly once Convex generates the API files! 🚀