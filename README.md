# Alibi - Jeu d'Interrogatoire WebSocket

Un jeu d'interrogatoire en temps réel utilisant WebSocket pour la communication entre accusés et enquêteurs.

## 📦 Structure Monorepo (Compatible Vercel)

Ce projet est organisé en monorepo pour faciliter le déploiement:

```
Alibi/
├── apps/
│   ├── web/              # Frontend statique → Déployé sur Vercel
│   └── server/           # Serveur WebSocket → Déployé sur Railway/Render
├── VERCEL_DEPLOY.md      # Guide de déploiement détaillé
└── README.md             # Ce fichier
```

## 🚀 Déploiement

### Frontend (Vercel)
Le frontend peut être déployé sur Vercel en quelques clics. Voir [VERCEL_DEPLOY.md](VERCEL_DEPLOY.md) pour les instructions détaillées.

### Backend (Railway/Render)
Le serveur WebSocket doit être hébergé sur une plateforme supportant les WebSockets (Railway, Render, Fly.io, etc.)

📖 **Guide complet de déploiement**: [VERCEL_DEPLOY.md](VERCEL_DEPLOY.md)

## 🚀 Démarrage Rapide (Développement Local)

### Prérequis
- Node.js (version 14 ou supérieure)
- Un réseau local pour jouer avec plusieurs appareils

### Installation et Lancement

1. **Démarrer le serveur :**
   ```bash
   # Option 1: Script de démarrage legacy (racine)
   ./start.sh
   
   # Option 2: Depuis le monorepo
   cd apps/server
   npm install
   npm start
   ```
   
   Ou depuis la racine avec les scripts monorepo:
   ```bash
   npm run dev:server
   ```

2. **Accéder au jeu :**
   - Serveur local : `http://localhost:3000`
   - Réseau local : `http://[ADRESSE_IP]:3000` (l'IP s'affiche au démarrage)
   - Frontend séparé : Ouvrir `apps/web/index.html` dans un navigateur

## 🎮 Comment Jouer

### Configuration
1. **Enquêteur** : Se connecte à `/investigator` pour contrôler le jeu
2. **Accusés** : Se connectent à `/accused` pour participer à l'interrogatoire

### Rôles

#### 👮 Enquêteur
- Contrôle l'interrogatoire
- Pose des questions personnalisées ou prédéfinies
- Évalue les réponses (correct/incorrect)
- Gère les scores des équipes A et B
- Voit le journal des actions en temps réel

#### 🎭 Accusé
- Reçoit les questions en temps réel
- Voit les scores des équipes
- Reçoit un feedback visuel immédiat
- Expérience immersive avec effets visuels

### Fonctionnalités

#### 🎯 Gestion des Scores
- 2 équipes (A et B) avec 5 points maximum chacune
- Points corrects (vert) ou incorrects (rouge)
- Visualisation en temps réel avec cercles colorés

#### 💬 Questions
- 10 questions prédéfinies
- Possibilité de créer des questions personnalisées
- Changement de question en temps réel

#### 🎨 Effets Visuels
- Flash écran pour feedback
- Vibrations (si supportées)
- Animations de pulsation et de shake
- Interface cyberpunk avec effets de lueur

#### ⌨️ Raccourcis Clavier (Enquêteur)
- `Ctrl/Cmd + 1` : Feedback correct
- `Ctrl/Cmd + 2` : Feedback incorrect
- `Ctrl/Cmd + 3` : Question suivante
- `Ctrl/Cmd + 4` : Changer d'équipe active
- `Ctrl/Cmd + Enter` : Mettre à jour la question

## 🌐 Utilisation en Réseau Local

### Configuration Réseau

1. **Démarrer le serveur** sur une machine (ordinateur principal)
2. **Noter l'adresse IP** affichée dans la console
3. **Connecter les autres appareils** avec : `http://[IP]:3000`

### Exemple de Configuration
- **Machine principale** (enquêteur) : `192.168.1.100:3000/investigator`
- **Tablette/Phone 1** (accusé) : `192.168.1.100:3000/accused`
- **Tablette/Phone 2** (accusé) : `192.168.1.100:3000/accused`

## 🔧 Structure du Projet

```
Alibi/
├── apps/
│   ├── web/              # Frontend (Vercel-ready)
│   │   ├── *.html        # Pages du jeu
│   │   ├── config.js     # Configuration WebSocket
│   │   ├── style.css
│   │   └── css/          # Styles
│   └── server/           # Backend WebSocket
│       ├── server.js     # Serveur principal
│       └── package.json
├── vercel.json           # Configuration Vercel
├── VERCEL_DEPLOY.md      # Guide de déploiement
└── README.md             # Documentation

# Legacy (fichiers à la racine pour compatibilité)
├── server.js             # Serveur legacy
├── *.html                # Pages legacy
└── style.css             # Styles legacy
```

## 🛠 API WebSocket

### Messages Client → Serveur

- `register` : Enregistrement d'un client (accusé/enquêteur)
- `addPoint` : Ajouter un point à une équipe
- `resetTeam` : Reset d'une équipe
- `changeQuestion` : Changer de question
- `toggleActiveTeam` : Changer d'équipe active
- `startGame` / `endGame` : Contrôler l'état du jeu

### Messages Serveur → Client

- `gameState` : État complet du jeu
- `feedback` : Feedback visuel (correct/incorrect)
- `scoreUpdate` : Mise à jour de score
- `questionUpdate` : Nouvelle question
- `teamToggle` : Changement d'équipe active

## 🔄 Persistance des Données

### **Fonctionnalité Anti-Reload**
Le jeu sauvegarde automatiquement son état et le restaure même après :
- ❌ Rechargement de page (F5)
- ❌ Fermeture/réouverture du navigateur
- ❌ Redémarrage du serveur
- ❌ Déconnexion temporaire

### **Ce qui est Sauvegardé :**
- 📊 **Scores des équipes** A et B (avec historique correct/incorrect)
- 📝 **Question actuelle** et index de question
- 🎯 **Équipe active** en cours
- 🎮 **État du jeu** (attente/en cours/terminé)
- 📋 **Historique des réponses** pour chaque équipe

### **Sauvegarde Automatique :**
- 💾 Sauvegarde immédiate après chaque action
- 📂 Fichier `gamestate.json` créé automatiquement
- 🔄 Restauration transparente au démarrage
- 🔗 Synchronisation instantanée des nouveaux clients

### Couleurs et Style
Modifiez les variables CSS dans `style.css` :
```css
:root {
  --color-primary: #03FF98;    /* Vert cyber principal */
  --color-secondary: #02CC7A;  /* Vert secondaire */
  --color-accent: #04FF9A;     /* Accent */
}
```

### Questions
Ajoutez vos questions dans `server.js` :
```javascript
const questions = [
  "Votre question personnalisée ?",
  // ... autres questions
];
```

## 🐛 Dépannage

### Connexion WebSocket Échoue
- Vérifiez que le serveur est démarré
- Vérifiez l'adresse IP et le port
- Désactivez le firewall si nécessaire

### Pas de Communication Entre Appareils
- Vérifiez que tous les appareils sont sur le même réseau Wi-Fi
- Utilisez l'adresse IP locale (pas localhost) pour les autres appareils
- Vérifiez que le port 3000 n'est pas bloqué

### Performance
- Le jeu supporte plusieurs connexions simultanées
- Nettoyage automatique des connexions fermées
- Limitation du journal à 50 entrées

## 📱 Compatibilité

- **Navigateurs** : Chrome, Firefox, Safari, Edge (WebSocket requis)
- **Appareils** : Desktop, tablettes, smartphones
- **Réseau** : Wi-Fi local, pas besoin d'internet
- **Responsive** : Interface adaptative pour tous les écrans

## 🌐 Déploiement Production

### Vercel + Railway/Render (Recommandé)

1. **Frontend sur Vercel**: 
   - Déployez `apps/web` sur Vercel
   - Configuration automatique avec `vercel.json`
   
2. **Backend WebSocket sur Railway**:
   - Déployez `apps/server` sur Railway
   - Le serveur WebSocket nécessite une plateforme avec support WebSocket
   
3. **Configuration**:
   - Mettez à jour `apps/web/config.js` avec l'URL de votre serveur WebSocket
   - Voir [VERCEL_DEPLOY.md](VERCEL_DEPLOY.md) pour le guide complet

### Alternatives

- **Netlify** (frontend) + **Render** (backend)
- **GitHub Pages** (frontend) + **Fly.io** (backend)
- **Cloudflare Pages** (frontend) + **Railway** (backend)

📖 **Documentation complète**: [VERCEL_DEPLOY.md](VERCEL_DEPLOY.md)

---

**Bon interrogatoire ! 🕵️‍♂️🎭**
