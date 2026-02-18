# Déploiement sur Vercel (Configuration Monorepo)

## 📁 Structure du Monorepo

Ce projet est maintenant organisé en monorepo compatible Vercel:

```
Alibi/
├── apps/
│   ├── web/          # Frontend statique (déployé sur Vercel)
│   └── server/       # Serveur WebSocket (déployé ailleurs)
├── packages/         # Packages partagés (si nécessaire)
├── vercel.json       # Configuration Vercel racine
└── package.json      # Configuration monorepo
```

## 🚀 Déploiement

### Option 1: Déploiement Frontend sur Vercel + Backend sur Render/Railway

**Frontend (Vercel):**
1. Connectez votre repo GitHub à Vercel
2. Lors de la configuration du projet:
   - **Framework Preset**: Other
   - **Root Directory**: `apps/web`
   - **Build Command**: (laisser vide)
   - **Output Directory**: `.` (ou laisser vide)
3. Vercel détectera automatiquement les fichiers statiques
4. Ajoutez une variable d'environnement (optionnelle):
   - Clé: `WS_URL`
   - Valeur: `wss://votre-serveur-websocket.railway.app` (après déploiement du backend)
5. Déployez!

**Backend (Railway/Render):**
1. Créez un nouveau service sur Railway ou Render
2. Configurez le répertoire racine: `apps/server`
3. Commande de build: `npm install`
4. Commande de démarrage: `npm start`
5. Notez l'URL générée (ex: `https://alibi-server.railway.app`)
6. Retournez sur Vercel et mettez à jour `WS_URL` avec cette URL

**Important**: Déployez d'abord le backend, puis mettez à jour `apps/web/config.js` avec l'URL du backend avant de déployer le frontend.

### Option 2: Configuration Vercel CLI

```bash
# Installer Vercel CLI
npm i -g vercel

# Se connecter
vercel login

# Déployer depuis la racine
vercel

# Ou déployer le frontend uniquement
cd apps/web
vercel
```

## 🔧 Configuration

### Variables d'environnement

**Frontend (apps/web):**
Créez un fichier `apps/web/.env` (ignoré par git):
```env
VITE_WS_URL=wss://votre-serveur-ws.railway.app
```

**Backend (apps/server):**
```env
PORT=3000
NODE_ENV=production
```

### WebSocket URL

Dans les fichiers HTML du frontend (`apps/web/*.html`), mettez à jour l'URL WebSocket:

```javascript
// Avant (développement local)
const wsUrl = 'ws://localhost:3000';

// Après (production)
const wsUrl = 'wss://votre-serveur-ws.railway.app';
```

Ou utilisez une détection automatique:
```javascript
const wsUrl = process.env.VITE_WS_URL || 
              (window.location.protocol === 'https:' 
                ? 'wss://votre-serveur-ws.railway.app'
                : 'ws://localhost:3000');
```

## 📝 Fichiers de Configuration

### vercel.json (racine)
Configure le routage pour servir le frontend depuis `apps/web`

### apps/web/vercel.json
Configuration spécifique au frontend statique

### apps/server/package.json
Configuration du serveur WebSocket

## 🔄 Workflow de Développement

### Développement Local

```bash
# Terminal 1: Backend
npm run dev:server

# Terminal 2: Frontend (serveur local simple)
npm run dev:web
```

### Production

1. **Frontend**: Poussez sur GitHub → Vercel déploie automatiquement
2. **Backend**: Poussez sur GitHub → Railway/Render redéploie automatiquement

## 🌐 URLs de Production Exemple

- Frontend: `https://alibi.vercel.app`
- Backend WebSocket: `wss://alibi-server.railway.app`

## ⚠️ Notes Importantes

1. **Vercel ne supporte pas WebSocket** directement car c'est une plateforme serverless
2. Le serveur WebSocket DOIT être hébergé ailleurs (Railway, Render, etc.)
3. Le frontend Vercel se connecte au serveur WebSocket distant
4. Configuration CORS nécessaire sur le serveur pour accepter les connexions depuis Vercel

## 🔒 Sécurité

Ajoutez la configuration CORS dans `apps/server/server.js`:

```javascript
const cors = require('cors');
app.use(cors({
  origin: ['https://alibi.vercel.app', 'http://localhost:3000'],
  credentials: true
}));
```

## 📚 Documentation Complète

Voir [README.md](../../README.md) pour les instructions de jeu complètes.
