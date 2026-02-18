# Alibi Web Frontend

Frontend statique pour le jeu Alibi, optimisé pour Vercel.

## 🚀 Déploiement sur Vercel

### Via l'interface Vercel

1. Connectez votre repository GitHub à Vercel
2. Sélectionnez le projet
3. Configurez:
   - **Root Directory**: `apps/web`
   - **Framework Preset**: Other (Static)
   - **Build Command**: (laisser vide)
   - **Output Directory**: `.`

### Via Vercel CLI

```bash
cd apps/web
vercel
```

## ⚙️ Configuration

### WebSocket URL

Le fichier `config.js` gère automatiquement l'URL WebSocket:
- **Local**: `ws://localhost:3000`
- **Production**: Configurez l'URL de votre serveur WebSocket

Pour modifier l'URL de production, éditez `config.js`:

```javascript
return window.ENV?.WS_URL || 'wss://your-websocket-server.railway.app';
```

### Variables d'environnement (Vercel)

Dans les paramètres de votre projet Vercel, ajoutez:
```
WS_URL=wss://votre-serveur-websocket.railway.app
```

## 📁 Structure

```
apps/web/
├── index.html              # Page d'accueil
├── config.js               # Configuration WebSocket
├── accused.html            # Interface accusé
├── accused1.html           # Interface accusé équipe 1
├── accused2.html           # Interface accusé équipe 2
├── investigator.html       # Interface enquêteur
├── investigator1.html      # Interface enquêteur équipe 1
├── investigator2.html      # Interface enquêteur équipe 2
├── room.html               # Interface room
├── setup.html              # Configuration
├── demo.html               # Demo
├── style.css               # Styles communs
├── css/                    # Styles spécifiques
│   ├── accuse.css
│   └── investigator.css
└── sounds/                 # Sons du jeu
```

## 🔗 Liens Importants

- Backend (serveur WebSocket): Déployez sur Railway, Render ou similaire
- Documentation de déploiement: Voir [VERCEL_DEPLOY.md](../../VERCEL_DEPLOY.md)
- README principal: [README.md](../../README.md)

## 🛠️ Développement Local

```bash
# Serveur simple (Python)
python3 -m http.server 3000

# Ou serveur Node simple
npx serve -p 3000

# Ou live-server
npx live-server --port=3000
```

Assurez-vous que le serveur WebSocket tourne sur `localhost:3000` (voir `apps/server/`)

## 📝 Notes

- Frontend entièrement statique (HTML/CSS/JS)
- Pas de build nécessaire
- Compatible avec tous les hébergeurs statiques (Vercel, Netlify, GitHub Pages)
- Le serveur WebSocket doit être hébergé séparément
