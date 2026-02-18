const express = require('express');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');
const { networkInterfaces } = require('os');

const app = express();
const PORT = process.env.PORT || 3000;
const STATE_FILE = path.join(__dirname, 'gamestate.json');

// Middleware
app.use(express.static(path.join(__dirname)));
app.use(express.json());

// ==================== SYSTÈME DE ROOMS ====================

const rooms = new Map();

// Questions du jeu
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
    "Où avez-vous garé votre voiture ?"
];

// Créer un état de jeu par défaut
function createDefaultGameState() {
    return {
        teams: {
            A: { score: 0, answers: [] },
            B: { score: 0, answers: [] }
        },
        activeTeam: 'A',
        currentQuestion: questions[0],
        questionIndex: 0,
        status: 'waiting',
        connections: {
            accused1: [],
            accused2: [],
            investigator1: [],
            investigator2: []
        },
        players: {
            investigator1: { connected: false, name: 'Enquêteur 1', team: 'A' },
            investigator2: { connected: false, name: 'Enquêteur 2', team: 'B' },
            accused1: { connected: false, name: 'Accusé 1', assignedTo: 'investigator1' },
            accused2: { connected: false, name: 'Accusé 2', assignedTo: 'investigator2' }
        },
        currentActiveInvestigator: 'investigator1',
        createdAt: new Date().toISOString(),
        lastActivity: new Date()
    };
}

// Générer un code de room unique
function generateRoomCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 4; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Créer une nouvelle room
function createRoom() {
    let roomCode;
    do {
        roomCode = generateRoomCode();
    } while (rooms.has(roomCode));
    
    const gameState = createDefaultGameState();
    rooms.set(roomCode, gameState);
    
    console.log(`🏠 Room créée: ${roomCode}`);
    return roomCode;
}

// ==================== FONCTIONS DE DIFFUSION ====================

// Mode global (legacy)
let gameState = createDefaultGameState();

function broadcastToType(type, message) {
    if (gameState.connections[type]) {
        gameState.connections[type].forEach(ws => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(message));
            }
        });
    }
}

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

function broadcastToInvestigators(message) {
    broadcastToType('investigator1', message);
    broadcastToType('investigator2', message);
}

function broadcastToInvestigatorsInRoom(roomCode, message) {
    broadcastToTypeInRoom(roomCode, 'investigator1', message);
    broadcastToTypeInRoom(roomCode, 'investigator2', message);
}

function broadcastToAccused(message) {
    broadcastToType('accused1', message);
    broadcastToType('accused2', message);
}

function broadcastToAccusedInRoom(roomCode, message) {
    broadcastToTypeInRoom(roomCode, 'accused1', message);
    broadcastToTypeInRoom(roomCode, 'accused2', message);
}

function broadcastToAll(message) {
    broadcastToAccused(message);
    broadcastToInvestigators(message);
}

function broadcastToAllInRoom(roomCode, message) {
    broadcastToAccusedInRoom(roomCode, message);
    broadcastToInvestigatorsInRoom(roomCode, message);
}

// ==================== GESTION DES MESSAGES ====================

function handleRoomMessage(roomCode, message, ws) {
    const room = rooms.get(roomCode);
    if (!room) {
        ws.send(JSON.stringify({
            type: 'error',
            message: 'Room not found'
        }));
        return;
    }
    
    room.lastActivity = new Date();
    
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
                data: {
                    question: room.currentQuestion,
                    questionIndex: room.questionIndex
                }
            });
            break;
            
        case 'changeQuestion':
            // Utiliser la question personnalisée fournie par l'enquêteur
            if (message.question && message.question.trim()) {
                room.currentQuestion = message.question.trim();
                // Ne pas changer questionIndex pour les questions personnalisées
                
                broadcastToAllInRoom(roomCode, {
                    type: 'questionUpdate',
                    data: {
                        question: room.currentQuestion,
                        questionIndex: room.questionIndex,
                        isCustom: true
                    }
                });
            }
            break;
            
        case 'resetGame':
        case 'resetAll':
            room.questionIndex = 0;
            room.currentQuestion = questions[0];
            room.teams.A.score = 0;
            room.teams.B.score = 0;
            room.teams.A.answers = [];
            room.teams.B.answers = [];
            room.activeTeam = 'A';
            
            broadcastToAllInRoom(roomCode, {
                type: 'gameReset',
                scoreA: room.teams.A.score,
                scoreB: room.teams.B.score,
                question: room.currentQuestion,
                questionIndex: room.questionIndex,
                activeTeam: room.activeTeam
            });
            break;
            
        case 'addPoint':
            const team = message.team;
            if (room.teams[team] && room.teams[team].score < 5) {
                room.teams[team].score++;
                room.teams[team].answers.push({
                    question: room.currentQuestion,
                    correct: message.isCorrect,
                    timestamp: new Date().toISOString()
                });
                
                broadcastToAllInRoom(roomCode, {
                    type: 'scoreUpdate',
                    data: {
                        team: team,
                        score: room.teams[team].score,
                        isCorrect: message.isCorrect,
                        answers: room.teams[team].answers
                    }
                });
                
                broadcastToAllInRoom(roomCode, {
                    type: 'feedback',
                    data: {
                        isCorrect: message.isCorrect,
                        team: team
                    }
                });
            }
            break;
            
        case 'resetTeam':
            const resetTeam = message.team;
            if (room.teams[resetTeam]) {
                room.teams[resetTeam].score = 0;
                room.teams[resetTeam].answers = [];
                
                broadcastToAllInRoom(roomCode, {
                    type: 'teamReset',
                    data: { team: resetTeam }
                });
            }
            break;
            
        case 'answer':
            const feedback = {
                type: 'feedback',
                data: {
                    isCorrect: message.isCorrect,
                    team: room.activeTeam
                }
            };
            broadcastToAllInRoom(roomCode, feedback);
            
            if (message.isCorrect !== undefined) {
                if (message.isCorrect) {
                    room.teams[room.activeTeam].score++;
                }
                room.teams[room.activeTeam].answers.push({
                    question: room.currentQuestion,
                    correct: message.isCorrect,
                    timestamp: new Date().toISOString()
                });
            }
            break;
            
        case 'toggleActiveTeam':
            room.activeTeam = room.activeTeam === 'A' ? 'B' : 'A';
            
            broadcastToAllInRoom(roomCode, {
                type: 'teamToggle',
                data: { activeTeam: room.activeTeam }
            });
            break;
            
        case 'startGame':
            room.status = 'playing';
            broadcastToAllInRoom(roomCode, {
                type: 'gameStart',
                data: { status: room.status }
            });
            break;
            
        case 'endGame':
            room.status = 'ended';
            broadcastToAllInRoom(roomCode, {
                type: 'gameEnd',
                data: { 
                    status: room.status,
                    finalScores: room.teams
                }
            });
            break;
            
        case 'startAlibiPhase':
            // Diffuser la phase alibi aux accusés
            broadcastToAccusedInRoom(roomCode, {
                type: 'startAlibiPhase',
                data: {
                    alibiText: message.alibiText,
                    questions: message.questions,
                    player1: message.player1,
                    player2: message.player2,
                    crime: message.crime
                }
            });
            break;
            
        case 'alibiQuestionsReady':
            // Transmettre aux enquêteurs que les questions d'alibi sont prêtes
            console.log('📋 Questions d\'alibi prêtes:', message.questions);
            broadcastToInvestigatorsInRoom(roomCode, {
                type: 'alibiQuestionsReady',
                questions: message.questions
            });
            break;
    }
}

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
                data: {
                    question: gameState.currentQuestion,
                    questionIndex: gameState.questionIndex
                }
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
            
        case 'addPoint':
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
            }
            break;
            
        case 'startAlibiPhase':
            // Diffuser la phase alibi aux accusés en mode global
            broadcastToAccused({
                type: 'startAlibiPhase',
                data: {
                    alibiText: message.alibiText,
                    questions: message.questions,
                    player1: message.player1,
                    player2: message.player2,
                    crime: message.crime
                }
            });
            break;
            
        case 'alibiQuestionsReady':
            // Transmettre aux enquêteurs que les questions d'alibi sont prêtes (mode global)
            console.log('📋 Questions d\'alibi prêtes (global):', message.questions);
            broadcastToInvestigators({
                type: 'alibiQuestionsReady',
                questions: message.questions
            });
            break;
    }
}

// ==================== ROUTES ====================

// Page d'accueil
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Page de configuration de partie
app.get('/setup', (req, res) => {
    res.sendFile(path.join(__dirname, 'setup.html'));
});

// Page de démo
app.get('/demo', (req, res) => {
    res.sendFile(path.join(__dirname, 'demo.html'));
});

// API pour créer une room
app.post('/api/create-room', (req, res) => {
    const roomCode = createRoom();
    res.json({ roomCode, success: true });
});

// API pour vérifier une room
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

// ==================== SERVEUR HTTP ====================

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Serveur démarré sur le port ${PORT}`);
    
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
    });
    console.log(`   http://localhost:${PORT}`);
});

// ==================== SERVEUR WEBSOCKET ====================

const wss = new WebSocket.Server({ server });

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

wss.on('connection', (ws, req) => {
    console.log('🔗 Nouvelle connexion WebSocket');

    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data);
            console.log('📨 Message reçu:', message);

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
                        
                        // Assigner automatiquement le rôle
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
                        }
                        
                        // Envoyer l'état de la room
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
                        }
                        
                        ws.send(JSON.stringify({
                            type: 'gameState',
                            data: {
                                ...gameState,
                                myRole: role,
                                connections: getConnectionCounts()
                            }
                        }));
                        
                        console.log(`✅ Client enregistré comme ${role} (mode global)`);
                        logConnections();
                    }
                    break;
                    
                default:
                    // Router les autres messages - utiliser roomCode du message ou de la connexion
                    const targetRoomCode = roomCode || ws.roomCode;
                    
                    if (targetRoomCode) {
                        console.log(`📨 Routage vers room ${targetRoomCode}:`, message);
                        handleRoomMessage(targetRoomCode, message, ws);
                    } else {
                        console.log(`📨 Routage global:`, message);
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
});

console.log('🎮 Serveur Alibi avec système de rooms démarré !');
