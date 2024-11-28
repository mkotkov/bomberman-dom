const WebSocket = require('ws');

const startingPositions = [
    { x: 40, y: 40 },       
    { x: 600, y: 40 },      
    { x: 40, y: 600 },      
    { x: 600, y: 600 },     
];  

class GameSession {
    constructor(id, maxPlayers = 4) {
        this.id = id;
        this.maxPlayers = maxPlayers;
        this.players = [];
        this.positions = [];
        this.bombs = [];
        console.log(`Creating GameSession with id: ${id}`);
        this.mapData = this.generateMap();
        console.log('Map Data:', this.mapData);
    }

    generateMap() {
        const map = [
            [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
            [0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0],
            [1, 0, 1, 2, 0, 1, 0, 1, 2, 1, 0, 1, 0, 1, 0, 1],
            [0, 0, 0, 0, 2, 0, 1, 0, 0, 2, 0, 0, 0, 0, 0, 0],
            [1, 1, 2, 1, 0, 2, 1, 1, 1, 1, 1, 2, 0, 1, 1, 1],
            [0, 2, 0, 2, 0, 1, 0, 2, 0, 1, 0, 2, 0, 1, 2, 0],
            [1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1],
            [0, 0, 2, 2, 0, 2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0],
            [1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 2, 1, 1, 1, 1, 1],
            [0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0],
            [1, 0, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1],
            [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
            [1, 1, 2, 1, 1, 1, 2, 1, 1, 0, 1, 1, 2, 1, 1, 1],
            [0, 0, 2, 2, 0, 2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0],
            [1, 0, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1],
            [0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0],
        ];

        // Random generation of destructible walls
        for (let i = 0; i < map.length; i++) {
            for (let j = 0; j < map[i].length; j++) {
                if (Math.random() < 0.1 && map[i][j] === 0) {
                    map[i][j] = 1; 
                }
            }
        }
        return map;
    }

    addPlayer(player) {
        if (this.players.length < this.maxPlayers) {
            this.players.push(player);
            const playerIndex = this.players.length - 1;
            // Use a fixed position from an array
            const position = startingPositions[playerIndex];
            this.positions[playerIndex] = position; // Сохраняем начальную позицию
            console.log('PlayerId Data:', playerIndex);
            console.log('Position Data:', position);
    
            // Initialize player attributes
            player.playerIndex = playerIndex + 1;
            player.color = ['blue', 'red', 'green', 'yellow'][playerIndex];
            player.lives = 3;
            player.bombCount = 1;
            player.explosionRange = 1;
            player.speed = 1;

            console.log('PlayerId Data:', playerIndex);
            console.log('Position Data:', position);

            // Send initial data to the new player
            player.send(JSON.stringify({
            type: 'playerPosition',
            startingPosition: position,
            position: { playerIndex: playerIndex + 1, position },
                map: this.mapData,
                players: this.getPlayersPositions(),
            }));
    
            // Sending updated map data to all players
            this.players.forEach(p => {
                if (p !== player) {
                    p.send(JSON.stringify({
                        type: 'mapUpdate',
                        map: this.mapData,
                    }));
                }
            });
        } else {
            player.send(JSON.stringify({ type: 'error', message: 'Game is full' }));
        }
    }
    

    destroyWall(x, y) {
        // Updating the map on the server
        this.mapData[y][x] = 0;


        const updateMessage = JSON.stringify({
            type: 'mapUpdate',
            position: { x, y },
            newValue: 0
        });
        this.players.forEach(player => player.ws.send(updateMessage));
        this.broadcastToPlayers(updateMessage);
    }

    startGame() {
        const startingPositions = this.getPlayersPositions();
        this.players.forEach((player, index) => {
            player.send(JSON.stringify({
                type: 'gameStart',
                message: `Game started! You are Player ${index + 1}`,
                map: this.mapData,
                players: startingPositions, 
                yourIndex: index + 1,       // Индекс текущего игрока
            }));
        });
    }
    

    getPlayersPositions() {
        return this.players.map((player, index) => ({
            playerIndex: index + 1,
            name: player.playerName,
            color: player.color,
            lives: player.lives,
            bombCount: player.bombCount,
            explosionRange: player.explosionRange,
            speed: player.speed,
            position: startingPositions[index],
        }));
    }

    updatePlayerPosition(player, newPosition) {
        const playerIndex = this.players.indexOf(player);
        if (playerIndex !== -1) {
            startingPositions[playerIndex] = newPosition; // 
            // We send updated positions to all players
            this.players.forEach(p => {
                p.send(JSON.stringify({
                    type: 'updatePlayerPosition',
                    playerIndex: playerIndex + 1,
                    position: newPosition,
                }));
            });
        }
    }
    getSessionByPlayer(player) {
        return this.players.includes(player) ? this : null;
    }
    
    broadcastToPlayers(message) {
        this.players.forEach(player => {
            if (player.ws && player.ws.readyState === WebSocket.OPEN) {
                player.ws.send(JSON.stringify(message));
            }
        });
    }

    removePlayer(player) {
        const index = this.players.indexOf(player);
        if (index !== -1) {
            this.players.splice(index, 1); 
            this.positions.splice(index, 1);
            console.log(`Player removed. Players left: ${this.players.length}`);
            this.checkGameOver();
        }
    }

    checkGameOver() {
        if (this.players.length === 1) {
            const winner = this.players[0];
            console.log(`Game Over! Winner: ${winner.playerName}`);
            this.broadcastToPlayers({
                type: 'gameOver',
                winner: {
                    name: winner.playerName,
                    color: winner.color,
                },
            });
            this.players.forEach(player => player.close());
            const index = gameSessions.indexOf(this);
            if (index !== -1) {
                gameSessions.splice(index, 1);
            }
        }
    }
}

const wss = new WebSocket.Server({ port: 8080 });
const gameSessions = [];

wss.on('connection', (ws) => {
    ws.on('message', (message) => {
        const data = JSON.parse(message);
        switch (data.type) {
            case 'getActiveSessions': {
                const availableSessions = gameSessions.filter(session => session.players.length < session.maxPlayers);
                ws.send(JSON.stringify({ 
                    type: 'activeSessions', 
                    sessions: availableSessions.map(session => session.id),
                    players: availableSessions.map(session => session.players)
                }));
                break;
            }
            case 'setName': {
                if (data.name && data.name.trim() !== '') {
                    ws.playerName = data.name.trim();
                    ws.send(JSON.stringify({ 
                        type: 'nameAcknowledged', 
                        message: `Welcome, ${ws.playerName}!`
                    }));
            
                    const session = gameSessions.find(session => session.players.includes(ws));
                    if (session) {
                        const sessionData = {
                            type: 'sessionUpdate',
                            sessionId: session.id,
                            players: session.players.map(player => ({
                                name: player.playerName,
                                position: session.positions[session.players.indexOf(player)],
                            })),
                            map: session.mapData,
                        };

                        session.players.forEach(player => player.send(JSON.stringify(sessionData)));
                    }
                } else {
                    ws.send(JSON.stringify({ 
                        type: 'error', 
                        message: 'Invalid name. Please provide a valid name.' 
                    }));
                }
                break;
            }
            
            case 'createOrJoinGame': {
                let session = gameSessions.find(session => session.players.length <= session.maxPlayers);
            
                if (!session) {
                    const sessionId = gameSessions.length + 1;
                    session = new GameSession(sessionId);
                    gameSessions.push(session);
                    ws.sessionId = sessionId;  // Сохраняем sessionId для игрока
                    ws.send(JSON.stringify({ 
                        type: 'gameCreated', 
                        sessionId, 
                        map: session.mapData 
                    }));
                } else {
                    ws.sessionId = session.id;  
                    ws.send(JSON.stringify({ 
                        type: 'joinedExistingGame', 
                        sessionId: session.id, 
                        map: session.mapData 
                    }));
                }
            
                // Добавляем игрока в сессию
                session.addPlayer(ws);
                break;
            }
            
            case 'startGame': {
                const session = gameSessions.find(session => session.id === ws.sessionId);
                if (session) {
                    session.startGame();
                } else {
                    ws.send(JSON.stringify({ type: 'error', message: 'Game session not found' }));
                }
                break;
            }
            
            case 'updateMap': {
                const mapUpdate = {
                    type: 'mapUpdate',
                    position: data.position,
                    newValue: data.newValue
                };

                const session = gameSessions.find(session => session.id === ws.sessionId);

                if (session) {
                    session.players.forEach(player => player.send(JSON.stringify(mapUpdate)));
                } else {
                    console.error('Session not found for updateMap');
                }
                break;
            }

            case 'movePlayer': {
                const { newPosition } = data;

                const session = gameSessions.find(session => session.id === ws.sessionId);

                if (session) {
                    session.updatePlayerPosition(ws, newPosition);
                } else {
                    console.error('Session not found for player');
                }
                break;
            }

            case 'placeBomb': {
                console.log(`Received 'placeBomb' event with data:`, data);
            
                const bombData = {
                    type: 'bombPlaced',
                    position: data.position,
                    radius: data.radius
                };
            
                console.log(`Bomb placed at position (${bombData.position.x}, ${bombData.position.y}) with radius ${bombData.radius}`);
            
                const session = gameSessions.find(session => session.id === ws.sessionId);
            
                if (session) {
                    console.log(`Session found for bomb placement. Session ID: ${ws.sessionId}`);
            
                    session.players.forEach(player => {
                        const playerIndex = session.players.indexOf(player);
                        const playerPosition = session.positions[playerIndex];
            
                        console.log(`Checking player ${player.playerName} at position (${playerPosition.x}, ${playerPosition.y})`);
            
                        // Вычисление расстояния между игроком и взрывом
                        const dx = playerPosition.x - (bombData.position.x*40);
                        const dy = playerPosition.y - (bombData.position.y*40);
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        
                        console.log(`Distance from bomb to player ${player.playerName}: ${distance}`);
            
                        // Проверка попадания в радиус взрыва
                        if (distance <=  40) { // 40 — размер клетки (например)
                            player.lives -= 1; // Уменьшаем количество жизней
                            console.log(`Player ${player.playerName} hit! Lives left: ${player.lives}`);
                            
                            // Проверяем, остались ли у игрока жизни
                            if (player.lives <= 0) {
                                console.log(`Player ${player.playerName} eliminated!`);
                                session.removePlayer(player);
                            }
                        } else {
                            console.log(`Player ${player.playerName} is safe from the explosion.`);
                        }
                    });
            
                    console.log(`Broadcasting bomb explosion to players in session ${ws.sessionId}`);
                    session.broadcastToPlayers({
                        type: 'bombExploded',
                        position: bombData.position,
                        radius: bombData.radius,
                    });
            
                    session.players.forEach(player => {
                        player.send(JSON.stringify(bombData));
                        console.log(`Bomb data sent to player ${player.playerName}`);
                    });
                } else {
                    console.error('Session not found for placing bomb');
                }
                break;
            }
            
            

            case 'updatePlayerStats':
                const { playerIndex, stats } = data;
                const session = gameSessions.find(session => session.id === ws.sessionId);
                    if (session) {
                        const player = session.players[playerIndex];
                        if (player) {
                        player.lives = stats.lives;
                        player.bombCount = stats.bombCount;
                        player.explosionRange = stats.explosionRange;
                        player.speed = stats.speed;

                        session.broadcastToPlayers({
                            type: 'updatePlayerStats',
                            playerIndex,
                            stats
            });
        }
    }
    break;

            default:
                console.error('Unknown message type:', data.type);
                break;
        }
    });

    ws.on('close', () => {
        console.log('Player disconnected');
        const session = gameSessions.find(session => session.id === ws.sessionId);
        if (session) {
            const playerIndex = session.players.indexOf(ws);
            session.players.splice(playerIndex, 1);
            session.positions.splice(playerIndex, 1);
    
            // Уведомляем остальных игроков
            session.players.forEach(player => {
                player.send(JSON.stringify({
                    type: 'playerDisconnected',
                    playerIndex: playerIndex + 1,
                    players: session.players,
                }));
            });
    
            // Удаляем сессию, если в ней не осталось игроков
            if (session.players.length === 0) {
                gameSessions.splice(gameSessions.indexOf(session), 1);
            }
            session.removePlayer(ws);
        }
    });
});

console.log('WebSocket server is running on ws://localhost:8080');
