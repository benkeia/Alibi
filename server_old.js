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
app.use(express.json()); // Pour parser les requêtes POST JSON

// Système de rooms - chaque room a son propre état de jeu
const rooms = new Map();

// Fonction pour créer un état de jeu par défaut
function createDefaultGameState() {
    return {
        teams: {
            A: { score: 0, answers: [] },
            B: { score: 0, answers: [] }
        },
        activeTeam: 'A',
        currentQuestion: "Où étiez-vous le 15 mars entre 14h et 16h ?",
        questionIndex: 0,
        status: 'waiting',
        connections: {
            accused1: [],
            accused2: [],
            investigator1: [],
            investigator2: []
        },
        players: {
            investigator1: { connected: false, name: 'Enquêteur 1', currentQuestion: '', team: 'A' },
            investigator2: { connected: false, name: 'Enquêteur 2', currentQuestion: '', team: 'B' },
            accused1: { connected: false, name: 'Accusé 1', assignedTo: 'investigator1' },
            accused2: { connected: false, name: 'Accusé 2', assignedTo: 'investigator2' }
        },
        currentActiveInvestigator: 'investigator1',
        createdAt: new Date(),
        lastActivity: new Date()
    };
}

// Générer un code de room unique
function generateRoomCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code;
    do {
        code = '';
        for (let i = 0; i < 4; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
    } while (rooms.has(code));
    return code;
}

// Créer une nouvelle room
function createRoom() {
    const code = generateRoomCode();
    rooms.set(code, createDefaultGameState());
    console.log(`🏠 Nouvelle room créée: ${code}`);
    return code;
}

// Obtenir une room existante
function getRoom(roomCode) {
    if (!roomCode || !rooms.has(roomCode)) {
        return null;
    }
    const room = rooms.get(roomCode);
    room.lastActivity = new Date();
    return room;
}

// Routes principales
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Route pour créer une nouvelle room
app.post('/api/create-room', (req, res) => {
    const roomCode = createRoom();
    res.json({ roomCode, success: true });
});

// Route pour vérifier si une room existe
app.get('/api/room/:code', (req, res) => {
    const roomCode = req.params.code.toUpperCase();
    const room = rooms.get(roomCode);
    if (room) {
        res.json({ 
            exists: true, 
            playerCount: Object.values(room.connections).reduce((total, arr) => total + arr.length, 0),
            status: room.status,
            createdAt: room.createdAt
        });
    } else {
        res.json({ exists: false });
    }
});

// Routes avec room code
app.get('/room/:code', (req, res) => {
    const roomCode = req.params.code.toUpperCase();
    if (!rooms.has(roomCode)) {
        return res.redirect('/?error=room_not_found');
    }
    res.sendFile(path.join(__dirname, 'room.html'));
});

app.get('/room/:code/accused', (req, res) => {
    const roomCode = req.params.code.toUpperCase();
    if (!rooms.has(roomCode)) {
        return res.redirect('/?error=room_not_found');
    }
    res.sendFile(path.join(__dirname, 'accused.html'));
});

app.get('/room/:code/investigator', (req, res) => {
    const roomCode = req.params.code.toUpperCase();
    if (!rooms.has(roomCode)) {
        return res.redirect('/?error=room_not_found');
    }
    res.sendFile(path.join(__dirname, 'investigator.html'));
});

// Routes legacy (sans room)
app.get('/accused', (req, res) => {
    res.sendFile(path.join(__dirname, 'accused.html'));
});

app.get('/accused1', (req, res) => {
    res.sendFile(path.join(__dirname, 'accused1.html'));
});

app.get('/accused2', (req, res) => {
    res.sendFile(path.join(__dirname, 'accused2.html'));
});

app.get('/investigator', (req, res) => {
    res.sendFile(path.join(__dirname, 'investigator.html'));
});

app.get('/investigator1', (req, res) => {
    res.sendFile(path.join(__dirname, 'investigator1.html'));
});

app.get('/investigator2', (req, res) => {
    res.sendFile(path.join(__dirname, 'investigator2.html'));
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

// État du jeu multi-joueurs (2v2)
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
        accused1: [],
        accused2: [],
        investigator1: [],
        investigator2: []
    },
    players: {
        investigator1: { connected: false, name: 'Enquêteur 1', currentQuestion: '', team: 'A' },
        investigator2: { connected: false, name: 'Enquêteur 2', currentQuestion: '', team: 'B' },
        accused1: { connected: false, name: 'Accusé 1', assignedTo: 'investigator1' },
        accused2: { connected: false, name: 'Accusé 2', assignedTo: 'investigator2' }
    },
    currentActiveInvestigator: 'investigator1' // Qui contrôle actuellement
};

// Fonction pour sauvegarder l'état persistant
function getPersistentState() {
    return {
        teams: gameState.teams,
        activeTeam: gameState.activeTeam,
        currentQuestion: gameState.currentQuestion,
        questionIndex: gameState.questionIndex,
        status: gameState.status,
        players: gameState.players,
        currentActiveInvestigator: gameState.currentActiveInvestigator,
        connectionsCount: {
            accused1: gameState.connections.accused1.length,
            accused2: gameState.connections.accused2.length,
            investigator1: gameState.connections.investigator1.length,
            investigator2: gameState.connections.investigator2.length
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
        gameState.players = persistentData.players || gameState.players;
        gameState.currentActiveInvestigator = persistentData.currentActiveInvestigator || gameState.currentActiveInvestigator;
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
    if (gameState.connections[type]) {
        gameState.connections[type].forEach(ws => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(message));
            }
        });
    }
}

// Fonction pour diffuser un message à tous les clients d'un type dans une room
function broadcastToTypeInRoom(roomCode, type, message) {
    const room = rooms.get(roomCode);
    if (room && room.connections[type]) {
        room.connections[type].forEach(ws => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(message));
            }
        });
    }
}

// Fonction pour diffuser à tous les enquêteurs
function broadcastToInvestigators(message) {
    broadcastToType('investigator1', message);
    broadcastToType('investigator2', message);
}

// Fonction pour diffuser à tous les enquêteurs d'une room
function broadcastToInvestigatorsInRoom(roomCode, message) {
    broadcastToTypeInRoom(roomCode, 'investigator1', message);
    broadcastToTypeInRoom(roomCode, 'investigator2', message);
}

// Fonction pour diffuser à tous les accusés
function broadcastToAccused(message) {
    broadcastToType('accused1', message);
    broadcastToType('accused2', message);
}

// Fonction pour diffuser à tous les accusés d'une room
function broadcastToAccusedInRoom(roomCode, message) {
    broadcastToTypeInRoom(roomCode, 'accused1', message);
    broadcastToTypeInRoom(roomCode, 'accused2', message);
}

// Fonction pour diffuser à tous les clients
function broadcastToAll(message) {
    broadcastToAccused(message);
    broadcastToInvestigators(message);
}

// Fonction pour diffuser à tous les clients d'une room
function broadcastToAllInRoom(roomCode, message) {
    broadcastToAccusedInRoom(roomCode, message);
    broadcastToInvestigatorsInRoom(roomCode, message);
}

// Fonction pour diffuser à une paire spécifique (enquêteur + son accusé)
function broadcastToPair(investigatorNum, message) {
    broadcastToType(`investigator${investigatorNum}`, message);
    broadcastToType(`accused${investigatorNum}`, message);
}

// Fonctions utilitaires
// Fonction pour diffuser à tous les clients d'une room
function broadcastToAllInRoom(roomCode, message) {
    broadcastToAccusedInRoom(roomCode, message);
    broadcastToInvestigatorsInRoom(roomCode, message);
}

// Fonctions de gestion des messages pour les rooms
function handleRoomMessage(roomCode, message, ws) {
    const room = rooms.get(roomCode);
    if (!room) {
        ws.send(JSON.stringify({
            type: 'error',
            message: 'Room not found'
        }));
        return;
    }
    
    switch (message.type) {
        case 'scoreUpdate':
            if (message.team === 'A') {
                room.teams.A.score = message.score;
            } else if (message.team === 'B') {
                room.teams.B.score = message.score;
            }
            
            broadcastToAllInRoom(roomCode, {
                type: 'scoreUpdate',
                scoreA: room.teams.A.score,
                scoreB: room.teams.B.score
            });
            break;
            
        case 'accusedClick':
            broadcastToInvestigatorsInRoom(roomCode, {
                type: 'accusedClick',
                accused: message.accused
            });
            break;
            
        case 'nextQuestion':
            room.questionIndex = (room.questionIndex + 1) % questions.length;
            room.currentQuestion = questions[room.questionIndex];
            
            broadcastToAllInRoom(roomCode, {
                type: 'questionUpdate',
                question: room.currentQuestion,
                questionIndex: room.questionIndex
            });
            break;
            
        case 'resetGame':
            room.questionIndex = 0;
            room.currentQuestion = questions[0];
            room.teams.A.score = 0;
            room.teams.B.score = 0;
            
            broadcastToAllInRoom(roomCode, {
                type: 'gameReset',
                scoreA: room.teams.A.score,
                scoreB: room.teams.B.score,
                question: room.currentQuestion,
                questionIndex: room.questionIndex
            });
            break;
    }
}

// Fonction de gestion des messages globaux (mode legacy)
function handleGlobalMessage(message, ws) {
    switch (message.type) {
        case 'scoreUpdate':
            if (message.team === 'A') {
                gameState.teams.A.score = message.score;
            } else if (message.team === 'B') {
                gameState.teams.B.score = message.score;
            }
            
            broadcastToAll({
                type: 'scoreUpdate',
                scoreA: gameState.teams.A.score,
                scoreB: gameState.teams.B.score
            });
            break;
            
        case 'accusedClick':
            broadcastToInvestigators({
                type: 'accusedClick',
                accused: message.accused
            });
            break;
            
        case 'nextQuestion':
            gameState.questionIndex = (gameState.questionIndex + 1) % questions.length;
            gameState.currentQuestion = questions[gameState.questionIndex];
            
            broadcastToAll({
                type: 'questionUpdate',
                question: gameState.currentQuestion,
                questionIndex: gameState.questionIndex
            });
            break;
            
        case 'resetGame':
            gameState.questionIndex = 0;
            gameState.currentQuestion = questions[0];
            gameState.teams.A.score = 0;
            gameState.teams.B.score = 0;
            
            broadcastToAll({
                type: 'gameReset',
                scoreA: gameState.teams.A.score,
                scoreB: gameState.teams.B.score,
                question: gameState.currentQuestion,
                questionIndex: gameState.questionIndex
            });
            break;
    }
}

function getConnectionCounts() {
    return {
        accused1: gameState.connections.accused1.length,
        accused2: gameState.connections.accused2.length,
        investigator1: gameState.connections.investigator1.length,
        investigator2: gameState.connections.investigator2.length
    };
}

function logConnections() {
    const counts = getConnectionCounts();
    console.log(`📊 Connexions: Enquêteur1(${counts.investigator1}) + Accusé1(${counts.accused1}) | Enquêteur2(${counts.investigator2}) + Accusé2(${counts.accused2})`);
}

// Gestion des connexions WebSocket
wss.on('connection', (ws, req) => {
    console.log('🔗 Nouvelle connexion WebSocket');

    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data);
            console.log('📨 Message reçu:', message);

            // Extraire le code de room du message
            const roomCode = message.roomCode;

            switch (message.type) {
                case 'register':
                    if (roomCode) {
                        // Mode room
                        if (!rooms.has(roomCode)) {
                            ws.send(JSON.stringify({
                                type: 'error',
                                message: 'Room not found'
                            }));
                            return;
                        }
                        
                        const room = rooms.get(roomCode);
                        let role = message.role;
                        
                        // Gérer les rôles génériques et les assigner automatiquement
                        if (role === 'accused') {
                            if (room.connections.accused1.length === 0) {
                                role = 'accused1';
                            } else if (room.connections.accused2.length === 0) {
                                role = 'accused2';
                            } else {
                                role = room.connections.accused1.length <= room.connections.accused2.length ? 'accused1' : 'accused2';
                            }
                        } else if (role === 'investigator') {
                            if (room.connections.investigator1.length === 0) {
                                role = 'investigator1';
                            } else if (room.connections.investigator2.length === 0) {
                                role = 'investigator2';
                            } else {
                                role = room.connections.investigator1.length <= room.connections.investigator2.length ? 'investigator1' : 'investigator2';
                            }
                        }
                        
                        if (room.connections[role]) {
                            room.connections[role].push(ws);
                            ws.role = role;
                            ws.roomCode = roomCode;
                            
                            if (room.players[role]) {
                                room.players[role].connected = true;
                            }
                        } else {
                            console.log('⚠️ Rôle non reconnu:', role);
                            return;
                        }
                        
                        // Envoyer l'état initial de la room
                        const roomState = {
                            ...room,
                            myRole: role,
                            connections: {
                                accused1: room.connections.accused1.length,
                                accused2: room.connections.accused2.length,
                                investigator1: room.connections.investigator1.length,
                                investigator2: room.connections.investigator2.length
                            }
                        };
                        
                        ws.send(JSON.stringify({
                            type: 'gameState',
                            data: roomState
                        }));
                        
                        console.log(`✅ Client enregistré comme ${role} dans la room ${roomCode}`);
                        
                    } else {
                        // Mode global (legacy)
                        let role = message.role;
                        
                        // Gérer les rôles génériques et les assigner automatiquement
                        if (role === 'accused') {
                            if (gameState.connections.accused1.length === 0) {
                                role = 'accused1';
                            } else if (gameState.connections.accused2.length === 0) {
                                role = 'accused2';
                            } else {
                                role = gameState.connections.accused1.length <= gameState.connections.accused2.length ? 'accused1' : 'accused2';
                            }
                        } else if (role === 'investigator') {
                            if (gameState.connections.investigator1.length === 0) {
                                role = 'investigator1';
                            } else if (gameState.connections.investigator2.length === 0) {
                                role = 'investigator2';
                            } else {
                                role = gameState.connections.investigator1.length <= gameState.connections.investigator2.length ? 'investigator1' : 'investigator2';
                            }
                        }
                        
                        if (gameState.connections[role]) {
                            gameState.connections[role].push(ws);
                            ws.role = role;
                            
                            if (gameState.players[role]) {
                                gameState.players[role].connected = true;
                            }
                        } else {
                            console.log('⚠️ Rôle non reconnu:', role);
                            return;
                        }
                        
                        // Envoyer l'état initial global
                        const fullGameState = {
                            ...getPersistentState(),
                            myRole: role,
                            connections: getConnectionCounts()
                        };
                        
                        ws.send(JSON.stringify({
                            type: 'gameState',
                            data: fullGameState
                        }));
                        
                        console.log(`✅ Client enregistré comme ${role} (mode global)`);
                        logConnections();
                    }
                    break;
                    
                default:
                    // Router les autres messages
                    if (roomCode) {
                        handleRoomMessage(roomCode, message, ws);
                    } else {
                        handleGlobalMessage(message, ws);
                    }
                    break;
            }
        } catch (error) {
            console.error('❌ Erreur lors du traitement du message:', error);
        }
    });
                    
                    break;
                    
                default:
                    // Router les autres messages
                    if (roomCode) {
                        handleRoomMessage(roomCode, message, ws);
                    } else {
                        handleGlobalMessage(message, ws);
                    }
                    break;
            }
        } catch (error) {
            console.error('❌ Erreur lors du traitement du message:', error);
        }
    });

    ws.on('close', () => {
        console.log('🔌 Connexion WebSocket fermée');
        
        if (ws.roomCode) {
            // Mode room
            const room = rooms.get(ws.roomCode);
            if (room && ws.role && room.connections[ws.role]) {
                room.connections[ws.role] = room.connections[ws.role].filter(client => client !== ws);
                
                if (room.players[ws.role]) {
                    room.players[ws.role].connected = room.connections[ws.role].length > 0;
                }
                
                console.log(`🚪 Client ${ws.role} déconnecté de la room ${ws.roomCode}`);
            }
        } else {
            // Mode global
            if (ws.role && gameState.connections[ws.role]) {
                gameState.connections[ws.role] = gameState.connections[ws.role].filter(client => client !== ws);
                
                if (gameState.players[ws.role]) {
                    gameState.players[ws.role].connected = gameState.connections[ws.role].length > 0;
                }
                
                console.log(`🚪 Client ${ws.role} déconnecté (mode global)`);
                logConnections();
            }
        }
    });
});                case 'addPoint':
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

                case 'toggleTeam':
                    // Changer l'équipe active
                    const newActiveTeam = message.activeTeam;
                    if (newActiveTeam === 'A' || newActiveTeam === 'B') {
                        gameState.activeTeam = newActiveTeam;
                        
                        broadcastToAll({
                            type: 'teamToggle',
                            data: { activeTeam: newActiveTeam }
                        });
                        
                        console.log(`🔄 Équipe active changée vers: ${newActiveTeam}`);
                        
                        // Sauvegarder l'état après modification
                        saveStateToDisk();
                    }
                    break;

                default:
                    console.log('⚠️ Type de message non reconnu:', message.type);
            }
        } catch (error) {
            console.error('❌ Erreur lors du traitement du message:', error);
        }
    });

    ws.on('close', () => {
        // Nettoyer les connexions fermées selon le nouveau système de rôles
        if (ws.role === 'accused1') {
            gameState.connections.accused1 = gameState.connections.accused1.filter(client => client !== ws);
            gameState.players.accused1.connected = gameState.connections.accused1.length > 0;
        } else if (ws.role === 'accused2') {
            gameState.connections.accused2 = gameState.connections.accused2.filter(client => client !== ws);
            gameState.players.accused2.connected = gameState.connections.accused2.length > 0;
        } else if (ws.role === 'investigator1') {
            gameState.connections.investigator1 = gameState.connections.investigator1.filter(client => client !== ws);
            gameState.players.investigator1.connected = gameState.connections.investigator1.length > 0;
        } else if (ws.role === 'investigator2') {
            gameState.connections.investigator2 = gameState.connections.investigator2.filter(client => client !== ws);
            gameState.players.investigator2.connected = gameState.connections.investigator2.length > 0;
        }
        
        console.log(`🔌 Connexion fermée (${ws.role || 'inconnu'})`);
        console.log(`📊 Connexions restantes:`, {
            accused1: gameState.connections.accused1.length,
            accused2: gameState.connections.accused2.length,
            investigator1: gameState.connections.investigator1.length,
            investigator2: gameState.connections.investigator2.length
        });
        
        // Notifier tous les clients du changement de connexion
        const connectionStatus = {
            accused1: gameState.connections.accused1.length > 0,
            accused2: gameState.connections.accused2.length > 0,
            investigator1: gameState.connections.investigator1.length > 0,
            investigator2: gameState.connections.investigator2.length > 0
        };
        
        broadcastToAll({
            type: 'connectionUpdate',
            data: {
                connections: connectionStatus
            }
        });
    });

    ws.on('error', (error) => {
        console.error('❌ Erreur WebSocket:', error);
    });
});

// Nettoyage périodique des connexions fermées
setInterval(() => {
    gameState.connections.accused1 = gameState.connections.accused1.filter(ws => ws.readyState === WebSocket.OPEN);
    gameState.connections.accused2 = gameState.connections.accused2.filter(ws => ws.readyState === WebSocket.OPEN);
    gameState.connections.investigator1 = gameState.connections.investigator1.filter(ws => ws.readyState === WebSocket.OPEN);
    gameState.connections.investigator2 = gameState.connections.investigator2.filter(ws => ws.readyState === WebSocket.OPEN);
}, 30000);

console.log('🎮 Serveur de jeu Alibi démarré');

// Charger l'état précédent s'il existe
if (loadStateFromDisk()) {
    console.log('✅ État précédent restauré avec succès');
} else {
    console.log('🆕 Nouveau jeu initialisé');
}

console.log('📝 État initial du jeu:', getPersistentState());
