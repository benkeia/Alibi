# Alibi WebSocket Server

Serveur WebSocket Node.js pour le jeu Alibi.

⚠️ **Important**: Ce serveur ne peut PAS être déployé sur Vercel car Vercel ne supporte pas les WebSockets persistants.

## 🚀 Déploiement Recommandé

### Railway (Recommandé)

1. Créez un compte sur [Railway](https://railway.app)
2. Créez un nouveau projet
3. Connectez votre repository GitHub
4. Configurez:
   - **Root Directory**: `apps/server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Railway générera automatiquement un domaine HTTPS

### Render

1. Créez un compte sur [Render](https://render.com)
2. Créez un nouveau Web Service
3. Connectez votre repository
4. Configurez:
   - **Root Directory**: `apps/server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

### Autres Options

- **Fly.io**: Excellente performance, support WebSocket natif
- **Heroku**: Support WebSocket (plan payant)
- **DigitalOcean App Platform**: Support WebSocket
- **VPS (DigitalOcean, Linode)**: Contrôle complet

## 🔧 Configuration

### Variables d'environnement

```env
PORT=3000
NODE_ENV=production
```

### Installation locale

```bash
cd apps/server
npm install
npm start
```

## 📝 Fichiers

- `server.js` - Serveur WebSocket principal
- `gamestate.json` - État du jeu sauvegardé (créé automatiquement)
- `presets.json` - Préconfigurations du jeu

## 🔒 Sécurité

Pour la production, ajoutez CORS:

```bash
npm install cors
```

Puis dans `server.js`:

```javascript
const cors = require('cors');
app.use(cors({
  origin: ['https://your-frontend.vercel.app', 'http://localhost:3000'],
  credentials: true
}));
```

## 📚 Documentation

Voir le [README principal](../../README.md) pour plus d'informations sur le jeu.
