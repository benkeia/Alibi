# 🚀 Quick Start - Alibi Monorepo

## Local Development (Both Frontend + Backend)

```bash
# Terminal 1: Start WebSocket Server
cd apps/server
npm install
npm start
# Server runs on http://localhost:3000

# Terminal 2: Start Frontend
cd apps/web
# Open index.html in browser or use:
python3 -m http.server 8000
# Or: npx serve -p 8000
# Frontend available at http://localhost:8000
```

Then open `http://localhost:8000` in your browser.

## Production Deployment

### Quick Deploy (5 minutes)

1. **Deploy Backend** (Railway/Render)
   - Root directory: `apps/server`
   - Get backend URL (e.g., `wss://alibi.railway.app`)

2. **Update Config**
   - Edit `apps/web/config.js`
   - Replace `YOUR-WEBSOCKET-SERVER-URL-HERE` with your backend URL

3. **Deploy Frontend** (Vercel)
   - Root directory: `apps/web`
   - Done!

📋 **Detailed Guide**: See [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)

## Project Structure

```
Alibi/
├── apps/
│   ├── web/       → Deploy to Vercel (static files)
│   └── server/    → Deploy to Railway/Render (WebSocket)
└── docs/
    ├── DEPLOYMENT_CHECKLIST.md  → Step-by-step deployment
    ├── VERCEL_DEPLOY.md         → Detailed Vercel guide
    └── README.md                → Full documentation
```

## Why Monorepo?

- ✅ **Vercel Compatible**: Frontend as static files
- ✅ **WebSocket Support**: Backend on Railway/Render
- ✅ **Easy Updates**: Change code, push, auto-deploy
- ✅ **Free Hosting**: Both platforms have free tiers

## Need Help?

- 📖 [Full Documentation](README.md)
- 📋 [Deployment Checklist](DEPLOYMENT_CHECKLIST.md)
- 🚀 [Vercel Deployment Guide](VERCEL_DEPLOY.md)
