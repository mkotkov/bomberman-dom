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
        this.lives = Array(maxPlayers).fill(3); // Add this line to initialize lives
        console.log(`Creating GameSession with id: ${id}`);
        this.mapData = this.generateMap();
        console.log('Map Data:', this.mapData);
    }

     // Add this loseLife method inside the GameSession class
    loseLife(playerIndex) {
        if (this.lives[playerIndex] > 0) {
            this.lives[playerIndex]--;

            // Notify all players about the updated lives
            this.players.forEach(player => {
                player.send(JSON.stringify({
                    type: 'updateLives',
                    playerIndex: playerIndex + 1,
                    lives: this.lives[playerIndex],
                }));
            });

            // Check if the player has run out of lives
            if (this.lives[playerIndex] === 0) {
                console.log(`Player ${playerIndex + 1} is out of lives!`);
                // Optional: Add logic for game over or disconnection
            }
        }
    }
    generateMap() {
        const map = [
            [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
            [0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0],
            [1, 0, 1, 2, 0, 1, 0, 1, 2, 1, 0, 1, 0, 1, 0, 1],
            [0, 0, 0, 0, 2, 0, 1, 0, 0, 2, 0, 0, 0, 0, 0, 0],
            [1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [0, 2, 0, 2, 0, 1, 0, 2, 0, 1, 0, 2, 0, 1, 2, 0],
            [1, 0, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1],
            [0, 0, 2, 2, 0, 2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0],
            [1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 2, 1, 1, 1, 1, 1],
            [0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0],
            [1, 0, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1],
            [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
            [1, 1, 2, 1, 1, 1, 2, 1, 1, 0, 1, 1, 2, 1, 1, 1],
            [0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0],
            [1, 0, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        ];

        // Random generation of indestructible walls
        for (let i = 0; i < map.length; i++) {
            for (let j = 0; j < map[i].length; j++) {
                // Generate an indestructible wall with a 10% probability
                if (Math.random() < 0.1 && map[i][j] === 0) {
                    map[i][j] = 2; // Indestructible wall
                }
            }
        }
        return map;
    }

    addPlayer(player) {
        if (this.players.length < this.maxPlayers) {
            this.players.push(player);
            const playerIndex = this.players.length - 1;
    
            const position = startingPositions[playerIndex];
            this.positions[playerIndex] = position;
    
            player.send(JSON.stringify({
                type: 'playerPosition',
                startingPosition: position,
                position: { playerIndex: playerIndex + 1, position },
                map: this.mapData,
                players: this.getPlayersPositions(),
                lives: this.lives, // Include lives data
            }));
    
            this.players.forEach(p => {
                if (p !== player) {
                    p.send(JSON.stringify({
                        type: 'mapUpdate',
                        map: this.mapData,
                    }));
                }
            });
    
            if (this.players.length === this.maxPlayers) {
                this.startGame();
            }
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
        this.players.forEach((player, index) => {
            player.send(JSON.stringify({
                type: 'gameStart',
                message: `Game started! You are Player ${index + 1}`,
            }));
        });
    }

    getPlayersPositions() {
        // Return the players' positions from the startingPositions array
        return this.players.map((player, index) => ({
            playerIndex: index + 1,
            position: startingPositions[index], // Use a fixed position from an array
        }));
    }

    updatePlayerPosition(player, newPosition) {
        const playerIndex = this.players.indexOf(player);
        if (playerIndex !== -1) {
            // Update the player's position in the startingPositions array or use a separate array to store positions
            startingPositions[playerIndex] = newPosition; // Updating the position

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

    broadcastToPlayers(message) {
        this.players.forEach(player => {
            if (player.ws && player.ws.readyState === WebSocket.OPEN) {
                player.ws.send(JSON.stringify(message));
            }
        });
    }
}

const wss = new WebSocket.Server({ port: 8080 });
const gameSessions = [];

wss.on('connection', (ws) => {
    ws.on('message', (message) => {
        const data = JSON.parse(message);
    
        if (data.type === 'createOrJoinGame') {
            let session = gameSessions.find(session => session.players.length < session.maxPlayers);
    
            if (!session) {
                const sessionId = gameSessions.length + 1;
                session = new GameSession(sessionId);
                gameSessions.push(session);
                ws.sessionId = sessionId;  // Save sessionId for player
                ws.send(JSON.stringify({ type: 'gameCreated', sessionId, map: session.mapData}));
            } else {
                ws.sessionId = session.id;  // Save sessionId for player
                ws.send(JSON.stringify({ type: 'joinedExistingGame', sessionId: session.id, map: session.mapData }));
            }
    
            session.addPlayer(ws);
        }
        
        if (data.type === 'updateMap') {
            const mapUpdate = {
                type: 'mapUpdate',
                position: data.position,
                newValue: data.newValue
            };
    
            // Find a player's session by sessionId
            const session = gameSessions.find(session => session.id === ws.sessionId);
            
            if (session) {
                session.players.forEach(player => player.send(JSON.stringify(mapUpdate)));
            } else {
                console.error('Session not found for updateMap');
            }
        }

        if (data.type === 'movePlayer') {
            //Handling player movement
            const { newPosition } = data;
            
            // Find a player's session by sessionId
            const session = gameSessions.find(session => session.id === ws.sessionId);
            
            if (session) {
                session.updatePlayerPosition(ws, newPosition);
            } else {
                console.error('Session not found for player');
            }
        }
    
        if (data.type === 'placeBomb') {
            // We send data about the new bomb to all players in the session
            const bombData = {
                type: 'bombPlaced',
                position: data.position,
                radius: data.radius
            };
        
            // Find a player's session by sessionId
            const session = gameSessions.find(session => session.id === ws.sessionId);
            
            // Check that the session exists before sending data
            if (session) {
                session.players.forEach(player => player.send(JSON.stringify(bombData)));
            } else {
                console.error('Session not found for placing bomb');
            }
        }
        

        if (data.type === 'getActiveSessions') {
            const availableSessions = gameSessions.filter(session => session.players.length < session.maxPlayers);
            ws.send(JSON.stringify({ type: 'activeSessions', sessions: availableSessions.map(session => session.id) }));
        }
    });
    

    ws.on('close', () => {
        console.log('Player disconnected');
        const session = gameSessions.find(session => session.id === ws.sessionId);
        if (session) {
            session.players = session.players.filter(player => player !== ws);
            session.positions = session.positions.filter((_, index) => index !== session.players.indexOf(ws));
    
            // We are sending updated information to all remaining players.
            session.players.forEach(p => {
                p.send(JSON.stringify({
                    type: 'playerDisconnected',
                    playerId: ws.sessionId,
                }));
            });
        }
    });
});

console.log('WebSocket server is running on ws://localhost:8080');
