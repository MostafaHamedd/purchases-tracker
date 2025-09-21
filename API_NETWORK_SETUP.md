# API Network Setup Guide

This guide explains how to handle API connectivity when using Expo from different networks.

## 🚨 The Problem

When you're on a **non-local network** (different WiFi, mobile data, etc.), your device can't reach your computer's local IP address (`10.0.0.55:3000`). This causes "Network request failed" errors.

## ✅ Solutions

### **Option 1: ngrok (Recommended for Development)**

ngrok creates a secure tunnel to your local server, making it accessible from anywhere.

#### Setup:
1. **Install ngrok** (if not already installed):
   ```bash
   # macOS
   brew install ngrok
   
   # Or download from https://ngrok.com/download
   ```

2. **Start your backend server**:
   ```bash
   # In your backend directory
   npm start  # or whatever starts your server on port 3000
   ```

3. **Start ngrok tunnel**:
   ```bash
   ngrok http 3000
   ```

4. **Update API configuration**:
   ```bash
   # Use the script to switch to ngrok
   node scripts/switch-api-env.js ngrok
   ```

#### Benefits:
- ✅ Works from any network (WiFi, mobile data, etc.)
- ✅ Secure HTTPS tunnel
- ✅ Free tier available
- ✅ Easy to set up

#### Drawbacks:
- ❌ Free tier has limitations (connections, bandwidth)
- ❌ URL changes when ngrok restarts
- ❌ Requires internet connection

### **Option 2: Environment Variables**

You can set the API URL via environment variables:

```bash
# In your .env file or terminal
export EXPO_PUBLIC_API_URL="https://your-ngrok-url.ngrok-free.app/api"
```

### **Option 3: Local Network Only**

If you're always on the same network as your development machine:

```bash
# Switch to local environment
node scripts/switch-api-env.js local
```

## 🔧 Configuration Management

### **Available Environments:**

- **`local`**: `http://10.0.0.55:3000/api` (same network only)
- **`ngrok`**: `https://your-ngrok-url.ngrok-free.app/api` (external access)
- **`production`**: `https://your-backend-domain.com/api` (deployed backend)

### **Switch Environments:**

```bash
# Check current environment
node scripts/switch-api-env.js status

# List all environments
node scripts/switch-api-env.js list

# Switch to ngrok
node scripts/switch-api-env.js ngrok

# Switch to local
node scripts/switch-api-env.js local

# Switch to production
node scripts/switch-api-env.js production
```

### **Dynamic ngrok URL:**

If your ngrok URL changes frequently, you can get it dynamically:

```typescript
import { getNgrokUrl } from '@/data/config/apiConfig';

// Get current ngrok URL
const ngrokUrl = await getNgrokUrl();
console.log('Current ngrok URL:', ngrokUrl);
```

## 🚀 Quick Setup for External Access

1. **Start your backend**:
   ```bash
   # In your backend directory
   npm start
   ```

2. **Start ngrok**:
   ```bash
   ngrok http 3000
   ```

3. **Copy the ngrok URL** (e.g., `https://abc123.ngrok-free.app`)

4. **Update your app**:
   ```bash
   node scripts/switch-api-env.js ngrok
   ```

5. **Restart your Expo app**:
   ```bash
   npx expo start
   ```

## 🔍 Troubleshooting

### **"Network request failed" Error:**
- ✅ Check if ngrok is running: `curl http://localhost:4040/api/tunnels`
- ✅ Verify backend is running: `curl http://localhost:3000/api/health`
- ✅ Test ngrok URL: `curl https://your-ngrok-url.ngrok-free.app/api/health`

### **ngrok URL Changes:**
- ✅ Update the URL in `data/config/apiConfig.ts`
- ✅ Or use the environment variable: `EXPO_PUBLIC_API_URL`

### **CORS Issues:**
- ✅ Make sure your backend allows CORS for all origins
- ✅ Check if your backend is configured for ngrok headers

## 📱 Testing

Test your setup:

```bash
# Test local
curl http://10.0.0.55:3000/api/health

# Test ngrok
curl https://your-ngrok-url.ngrok-free.app/api/health

# Test from your app
# Check the console logs for API requests
```

## 🎯 Best Practices

1. **Development**: Use ngrok for external testing
2. **Local Testing**: Use local IP when on same network
3. **Production**: Use your deployed backend URL
4. **Environment Variables**: Use `EXPO_PUBLIC_API_URL` for quick overrides
5. **Error Handling**: The app now includes retry logic and better error messages

## 🔄 Current Status

Your app is now configured to use **ngrok** by default, which means it will work from any network as long as:
- Your backend server is running on port 3000
- ngrok is running and tunneling to port 3000
- You have an internet connection

**Current ngrok URL**: `https://1723a3e83cd3.ngrok-free.app/api`
