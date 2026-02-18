# 📋 Deployment Checklist

Use this checklist to deploy Alibi to Vercel + Railway/Render.

## Prerequisites
- [ ] GitHub account
- [ ] Vercel account (free tier works)
- [ ] Railway or Render account (free tier works)
- [ ] Repository pushed to GitHub

## Step 1: Deploy Backend (WebSocket Server)

### Option A: Railway (Recommended)
- [ ] Go to [railway.app](https://railway.app)
- [ ] Create new project → Deploy from GitHub repo
- [ ] Select your `Alibi` repository
- [ ] Configure:
  - [ ] Root Directory: `apps/server`
  - [ ] Build Command: `npm install`
  - [ ] Start Command: `npm start`
- [ ] Deploy and wait for completion
- [ ] Copy the generated URL (e.g., `alibi-server.up.railway.app`)

### Option B: Render
- [ ] Go to [render.com](https://render.com)
- [ ] New → Web Service
- [ ] Connect GitHub repository
- [ ] Configure:
  - [ ] Name: `alibi-server`
  - [ ] Root Directory: `apps/server`
  - [ ] Environment: `Node`
  - [ ] Build Command: `npm install`
  - [ ] Start Command: `npm start`
  - [ ] Plan: Free
- [ ] Create Web Service
- [ ] Copy the generated URL (e.g., `alibi-server.onrender.com`)

## Step 2: Update Frontend Configuration

- [ ] Open `apps/web/config.js` in your code editor
- [ ] Find the line: `const productionWsUrl = 'wss://YOUR-WEBSOCKET-SERVER-URL-HERE.railway.app';`
- [ ] Replace with your backend URL:
  ```javascript
  const productionWsUrl = 'wss://alibi-server.up.railway.app';
  // or
  const productionWsUrl = 'wss://alibi-server.onrender.com';
  ```
- [ ] Save and commit changes
- [ ] Push to GitHub:
  ```bash
  git add apps/web/config.js
  git commit -m "Configure production WebSocket URL"
  git push
  ```

## Step 3: Deploy Frontend to Vercel

- [ ] Go to [vercel.com](https://vercel.com)
- [ ] Add New → Project
- [ ] Import your GitHub repository
- [ ] Configure Framework Preset:
  - [ ] Framework: Other
  - [ ] Root Directory: `apps/web`
  - [ ] Build Command: (leave empty)
  - [ ] Output Directory: `.` (or leave empty)
- [ ] Deploy!
- [ ] Copy your Vercel URL (e.g., `alibi.vercel.app`)

## Step 4: Test Deployment

- [ ] Open your Vercel URL in browser
- [ ] Open browser console (F12)
- [ ] Check for messages:
  - ✅ `🔧 Alibi Config loaded`
  - ✅ `📡 WebSocket URL: wss://your-server...`
  - ❌ Should NOT see: `Production WebSocket URL not configured`
- [ ] Test the game:
  - [ ] Open investigator page
  - [ ] Open accused page (in another tab/device)
  - [ ] Verify real-time communication works

## Step 5: Optional Optimizations

### Add Custom Domain (Vercel)
- [ ] Go to Vercel project settings → Domains
- [ ] Add your custom domain
- [ ] Follow DNS configuration instructions

### Add Custom Domain (Railway)
- [ ] Go to Railway service settings
- [ ] Add custom domain if needed

### Enable CORS on Backend (if needed)
If you get CORS errors:
- [ ] SSH into your backend or edit `apps/server/server.js`
- [ ] Add near the top:
  ```javascript
  const cors = require('cors');
  app.use(cors());
  ```
- [ ] Add `cors` to dependencies:
  ```bash
  cd apps/server
  npm install cors
  ```
- [ ] Commit and push changes

## Troubleshooting

### WebSocket connection fails
- [ ] Check backend is running (visit backend URL in browser)
- [ ] Verify `config.js` has correct backend URL
- [ ] Check browser console for error messages
- [ ] Ensure backend URL uses `wss://` (not `ws://`)

### CORS errors
- [ ] Install and configure CORS on backend (see above)
- [ ] Restart backend after changes

### Backend keeps sleeping (Render free tier)
- [ ] Render free tier has cold starts (takes ~30s to wake up)
- [ ] Consider upgrading to paid plan for instant connections
- [ ] Or use Railway which has better free tier performance

## 🎉 Success!

Once all checkboxes are complete, your Alibi game should be live!

- Frontend: `https://your-app.vercel.app`
- Backend: `https://your-server.railway.app` or `https://your-server.onrender.com`

Share the frontend URL with players to start playing!
