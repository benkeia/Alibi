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

---

**Bon interrogatoire ! 🕵️‍♂️🎭**
