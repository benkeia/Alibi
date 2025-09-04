const express = require('express');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');
const { networkInterfaces } = require('os');

const app = express();
const PORT = process.env.PORT || 3000;
const STATE_FILE = path.join(__dirname, 'gamestate.json');

// Fonction pour sauvegarder l'état sur disque
function saveStateToDisk() {
    try {
        const persistentState = getPersistentState();
        persistentState.lastSaved = new Date().toISOString();
        fs.writeFileSync(STATE_FILE, JSON.stringify(persistentState, null, 2));
        console.log('💾 État sauvegardé sur disque à', new Date().toLocaleTimeString());
    } catch (error) {
        console.error('❌ Erreur lors de la sauvegarde:', error);
    }
}

// Fonction pour charger l'état depuis le disque
function loadStateFromDisk() {
    try {
        if (fs.existsSync(STATE_FILE)) {
            const savedState = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
            restorePersistentState(savedState);
            if (savedState.lastSaved) {
                console.log('📂 État restauré depuis le disque (sauvé le', new Date(savedState.lastSaved).toLocaleString(), ')');
            } else {
                console.log('📂 État restauré depuis le disque');
            }
            return true;
        }
    } catch (error) {
        console.error('❌ Erreur lors du chargement:', error);
    }
    return false;
}

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname)));

// Routes principales
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/accused', (req, res) => {
    res.sendFile(path.join(__dirname, 'accused.html'));
});

app.get('/investigator', (req, res) => {
    res.sendFile(path.join(__dirname, 'investigator.html'));
});

// Créer le serveur HTTP
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Serveur démarré sur le port ${PORT}`);
    
    // Afficher toutes les adresses IP disponibles
    const nets = networkInterfaces();
    const results = [];
    
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            if (net.family === 'IPv4' && !net.internal) {
                results.push(net.address);
            }
        }
    }
    
    console.log('📱 Accès possible depuis le réseau local :');
    results.forEach(ip => {
        console.log(`   http://${ip}:${PORT}`);
        console.log(`   http://${ip}:${PORT}/accused`);
        console.log(`   http://${ip}:${PORT}/investigator`);
    });
    console.log(`   http://localhost:${PORT}`);
});

// Créer le serveur WebSocket
const wss = new WebSocket.Server({ server });

// État du jeu
let gameState = {
    teams: {
        A: { score: 0, answers: [] },
        B: { score: 0, answers: [] }
    },
    activeTeam: 'A',
    currentQuestion: "Où étiez-vous le 15 mars entre 14h et 16h ?",
    questionIndex: 0,
    status: 'waiting',
    connections: {
        accused: [],
        investigators: []
    }
};

// Fonction pour sauvegarder l'état persistant
function getPersistentState() {
    return {
        teams: gameState.teams,
        activeTeam: gameState.activeTeam,
        currentQuestion: gameState.currentQuestion,
        questionIndex: gameState.questionIndex,
        status: gameState.status,
        connectionsCount: {
            accused: gameState.connections.accused.length,
            investigators: gameState.connections.investigators.length
        }
    };
}

// Fonction pour restaurer l'état depuis les données persistantes
function restorePersistentState(persistentData) {
    if (persistentData) {
        gameState.teams = persistentData.teams || gameState.teams;
        gameState.activeTeam = persistentData.activeTeam || gameState.activeTeam;
        gameState.currentQuestion = persistentData.currentQuestion || gameState.currentQuestion;
        gameState.questionIndex = persistentData.questionIndex || gameState.questionIndex;
        gameState.status = persistentData.status || gameState.status;
    }
}

const questions = [
    "Où étiez-vous le 15 mars entre 14h et 16h ?",
    "Qui était avec vous ce jour-là ?",
    "Qu'avez-vous fait exactement ?",
    "À quelle heure êtes-vous parti de chez vous ?",
    "Avez-vous des témoins de votre présence ?",
    "Que portez-vous ce jour-là ?",
    "Quel moyen de transport avez-vous utilisé ?",
    "Qu'avez-vous mangé ce midi-là ?",
    "Qui avez-vous appelé dans l'après-midi ?",
    "À quelle heure êtes-vous rentré chez vous ?"
];

// Fonction pour diffuser un message à tous les clients d'un type
function broadcastToType(type, message) {
    gameState.connections[type].forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(message));
        }
    });
}

// Fonction pour diffuser à tous les clients
function broadcastToAll(message) {
    broadcastToType('accused', message);
    broadcastToType('investigators', message);
}

// Gestion des connexions WebSocket
wss.on('connection', (ws, req) => {
    console.log('🔗 Nouvelle connexion WebSocket');

    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data);
            console.log('📨 Message reçu:', message);

            switch (message.type) {
                case 'register':
                    // Enregistrer le client selon son rôle
                    if (message.role === 'accused') {
                        gameState.connections.accused.push(ws);
                        ws.role = 'accused';
                    } else if (message.role === 'investigator') {
                        gameState.connections.investigators.push(ws);
                        ws.role = 'investigator';
                    }
                    
                    // Envoyer l'état initial complet avec données persistantes
                    const fullGameState = {
                        ...getPersistentState(),
                        connections: {
                            accused: gameState.connections.accused.length,
                            investigators: gameState.connections.investigators.length
                        }
                    };
                    
                    ws.send(JSON.stringify({
                        type: 'gameState',
                        data: fullGameState
                    }));
                    
                    console.log(`✅ Client enregistré comme ${message.role}`);
                    console.log(`📊 Connexions: ${gameState.connections.accused.length} accusés, ${gameState.connections.investigators.length} enquêteurs`);
                    
                    // Notifier les autres clients du changement de connexion
                    broadcastToType('investigators', {
                        type: 'connectionUpdate',
                        data: {
                            accused: gameState.connections.accused.length,
                            investigators: gameState.connections.investigators.length
                        }
                    });
                    break;

                case 'answer':
                    // Traiter une réponse (pour les feedback)
                    const feedback = {
                        type: 'feedback',
                        data: {
                            isCorrect: message.isCorrect,
                            team: gameState.activeTeam
                        }
                    };
                    broadcastToAll(feedback);
                    
                    // Mettre à jour le score si spécifié
                    if (message.isCorrect !== undefined) {
                        if (message.isCorrect) {
                            gameState.teams[gameState.activeTeam].score++;
                        }
                        gameState.teams[gameState.activeTeam].answers.push({
                            question: gameState.currentQuestion,
                            correct: message.isCorrect,
                            timestamp: new Date().toISOString()
                        });
                    }
                    break;

                case 'addPoint':
                    // Ajouter un point à une équipe
                    const team = message.team;
                    if (gameState.teams[team] && gameState.teams[team].score < 5) {
                        gameState.teams[team].score++;
                        gameState.teams[team].answers.push({
                            question: gameState.currentQuestion,
                            correct: message.isCorrect,
                            timestamp: new Date().toISOString()
                        });
                        
                        broadcastToAll({
                            type: 'scoreUpdate',
                            data: {
                                team: team,
                                score: gameState.teams[team].score,
                                isCorrect: message.isCorrect,
                                answers: gameState.teams[team].answers
                            }
                        });
                        
                        // Sauvegarder l'état après modification
                        saveStateToDisk();
                        broadcastToAll({
                            type: 'feedback',
                            data: {
                                isCorrect: message.isCorrect,
                                team: team
                            }
                        });
                    }
                    break;

                case 'resetTeam':
                    // Reset d'une équipe
                    const resetTeam = message.team;
                    if (gameState.teams[resetTeam]) {
                        gameState.teams[resetTeam].score = 0;
                        gameState.teams[resetTeam].answers = [];
                        
                        broadcastToAll({
                            type: 'teamReset',
                            data: { team: resetTeam }
                        });
                        
                        // Sauvegarder l'état après modification
                        saveStateToDisk();
                    }
                    break;

                case 'changeQuestion':
                    // Changer de question
                    gameState.questionIndex = (gameState.questionIndex + 1) % questions.length;
                    gameState.currentQuestion = questions[gameState.questionIndex];
                    
                    broadcastToAll({
                        type: 'questionUpdate',
                        data: {
                            question: gameState.currentQuestion,
                            index: gameState.questionIndex
                        }
                    });
                    
                    // Sauvegarder l'état après modification
                    saveStateToDisk();
                    break;

                case 'toggleActiveTeam':
                    // Changer d'équipe active
                    gameState.activeTeam = gameState.activeTeam === 'A' ? 'B' : 'A';
                    
                    broadcastToAll({
                        type: 'teamToggle',
                        data: { activeTeam: gameState.activeTeam }
                    });
                    
                    // Sauvegarder l'état après modification
                    saveStateToDisk();
                    break;

                case 'resetAll':
                    // Reset complet
                    gameState.teams.A = { score: 0, answers: [] };
                    gameState.teams.B = { score: 0, answers: [] };
                    gameState.activeTeam = 'A';
                    gameState.questionIndex = 0;
                    gameState.currentQuestion = questions[0];
                    
                    broadcastToAll({
                        type: 'fullReset',
                        data: {
                            teams: gameState.teams,
                            activeTeam: gameState.activeTeam,
                            question: gameState.currentQuestion,
                            questionIndex: gameState.questionIndex
                        }
                    });
                    
                    // Sauvegarder l'état après modification
                    saveStateToDisk();
                    break;

                case 'startGame':
                    // Démarrer le jeu
                    gameState.status = 'playing';
                    broadcastToAll({
                        type: 'gameStart',
                        data: { status: gameState.status }
                    });
                    
                    // Sauvegarder l'état après modification
                    saveStateToDisk();
                    break;

                case 'endGame':
                    // Terminer le jeu
                    gameState.status = 'ended';
                    broadcastToAll({
                        type: 'gameEnd',
                        data: { 
                            status: gameState.status,
                            finalScores: gameState.teams
                        }
                    });
                    
                    // Sauvegarder l'état après modification
                    saveStateToDisk();
                    break;

                default:
                    console.log('⚠️ Type de message non reconnu:', message.type);
            }
        } catch (error) {
            console.error('❌ Erreur lors du traitement du message:', error);
        }
    });

    ws.on('close', () => {
        // Nettoyer les connexions fermées
        const wasAccused = ws.role === 'accused';
        const wasInvestigator = ws.role === 'investigator';
        
        if (wasAccused) {
            gameState.connections.accused = gameState.connections.accused.filter(client => client !== ws);
        } else if (wasInvestigator) {
            gameState.connections.investigators = gameState.connections.investigators.filter(client => client !== ws);
        }
        
        console.log(`🔌 Connexion fermée (${ws.role || 'inconnu'})`);
        console.log(`📊 Connexions restantes: ${gameState.connections.accused.length} accusés, ${gameState.connections.investigators.length} enquêteurs`);
        
        // Notifier les autres clients du changement de connexion
        if (wasAccused || wasInvestigator) {
            broadcastToType('investigators', {
                type: 'connectionUpdate',
                data: {
                    accused: gameState.connections.accused.length,
                    investigators: gameState.connections.investigators.length
                }
            });
        }
    });

    ws.on('error', (error) => {
        console.error('❌ Erreur WebSocket:', error);
    });
});

// Nettoyage périodique des connexions fermées
setInterval(() => {
    gameState.connections.accused = gameState.connections.accused.filter(ws => ws.readyState === WebSocket.OPEN);
    gameState.connections.investigators = gameState.connections.investigators.filter(ws => ws.readyState === WebSocket.OPEN);
}, 30000);

console.log('🎮 Serveur de jeu Alibi démarré');

// Charger l'état précédent s'il existe
if (loadStateFromDisk()) {
    console.log('✅ État précédent restauré avec succès');
} else {
    console.log('🆕 Nouveau jeu initialisé');
}

console.log('📝 État initial du jeu:', getPersistentState());
