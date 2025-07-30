# 🔥 Firebase Setup for CMI

## Quick Setup

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create a project"
3. Enter project name: `cmi-interview-app`
4. Enable Google Analytics (optional)
5. Click "Create project"

### 2. Enable Services
1. **Firestore Database**: Go to Firestore Database → Create database → Start in test mode
2. **Authentication**: Go to Authentication → Get started → Enable Email/Password
3. **Storage**: Go to Storage → Get started → Start in test mode

### 3. Get Configuration
1. Go to Project Settings (gear icon)
2. Scroll to "Your apps" → Click "Web app" icon
3. Register app name: `CMI Web App`
4. Copy the config object

### 4. Update Environment Variables
Update your `.env` file with:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id_here
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id_here
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id_here

# OpenAI & ElevenLabs (keep your existing keys)
OPENAI_API_KEY=your_openai_key
ELEVENLABS_API_KEY=your_elevenlabs_key
```

### 5. Initialize Sample Data
```bash
npm run init-firebase
```

### 6. Run the App
```bash
npm run dev
```

## What Changed from Supabase

✅ **Removed:**
- Complex WebSocket server
- Supabase dependencies
- Manual database setup

✅ **Added:**
- Firebase real-time listeners
- Simpler authentication
- Built-in file storage
- Auto-scaling functions

## Benefits

🚀 **Simpler**: No separate WebSocket server needed
🔄 **Real-time**: Built-in real-time updates
📱 **Mobile Ready**: Firebase works great on mobile
🛡️ **Secure**: Built-in security rules
⚡ **Fast**: Global CDN and caching

Your CMI app is now powered by Firebase! 🎉 