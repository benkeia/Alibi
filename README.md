# Alibi - Jeu d'Interrogatoire WebSocket

Un jeu d'interrogatoire en temps réel utilisant WebSocket pour la communication entre accusés et enquêteurs.

## 🚀 Démarrage Rapide

### Prérequis
- Node.js (version 14 ou supérieure)
- Un réseau local pour jouer avec plusieurs appareils

### Installation et Lancement

1. **Démarrer le serveur :**
   ```bash
   ./start.sh
   ```
   
   Ou manuellement :
   ```bash
   npm install
   node server.js
   ```

2. **Accéder au jeu :**
   - Serveur local : `http://localhost:3000`
   - Réseau local : `http://[ADRESSE_IP]:3000` (l'IP s'affiche au démarrage)

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
test_alibi/
├── server.js              # Serveur WebSocket Node.js
├── package.json           # Dépendances Node.js
├── start.sh              # Script de démarrage
├── index.html            # Page d'accueil
├── accused.html          # Interface accusé
├── investigator.html     # Interface enquêteur
├── style.css             # Styles communs
└── css/
    ├── accuse.css        # Styles spécifiques accusé
    └── investigator.css  # Styles spécifiques enquêteur
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

## 🌍 Déploiement

### ✅ Render.com (Recommandé)
Ce jeu fonctionne parfaitement sur [Render.com](https://render.com) car il supporte les WebSockets et les processus Node.js persistants. Le fichier `render.yaml` est déjà configuré.

**Avantages :**
- Support complet des WebSockets
- Processus Node.js persistant
- Configuration automatique via `render.yaml`
- Plan gratuit disponible

### ⚠️ Vercel (Limité)
**Important :** Vercel a des limitations importantes pour ce projet :

1. **WebSockets non supportés** : Vercel ne supporte pas les connexions WebSocket persistantes
2. **Serverless uniquement** : Les fonctions Vercel sont éphémères et ne peuvent pas maintenir d'état entre les requêtes
3. **Fonctionnalités limitées** : Sur Vercel, seuls les fichiers statiques (HTML, CSS, JS) seront correctement servis

**Configuration Vercel :**
Le fichier `vercel.json` est fourni pour servir correctement les fichiers statiques, mais les fonctionnalités WebSocket ne fonctionneront pas. Les pages s'afficheront, mais la communication en temps réel entre joueurs ne sera pas disponible.

**Recommandation :** Utilisez Render.com ou un autre service supportant les WebSockets pour une expérience complète du jeu.

### Autres Options de Déploiement
- **Heroku** : Support complet des WebSockets (plan payant requis)
- **Railway** : Support complet des WebSockets
- **Fly.io** : Support complet des WebSockets
- **DigitalOcean App Platform** : Support complet des WebSockets

---

**Bon interrogatoire ! 🕵️‍♂️🎭**
