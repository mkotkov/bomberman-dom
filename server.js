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

        // Случайная генерация неразрушаемых стен
        for (let i = 0; i < map.length; i++) {
            for (let j = 0; j < map[i].length; j++) {
                // Генерируем неразрушаемую стену с вероятностью 10%
                if (Math.random() < 0.1 && map[i][j] === 0) {
                    map[i][j] = 2; // Неразрушаемая стена
                }
            }
        }
        return map;
    }

    addPlayer(player) {
        if (this.players.length < this.maxPlayers) {
            this.players.push(player);
            const playerIndex = this.players.length - 1;
    
            // Используем фиксированную позицию из массива
            const position = startingPositions[playerIndex];
            this.positions[playerIndex] = position; // Сохраняем начальную позицию
            console.log('PlayerId Data:', playerIndex);
            console.log('Position Data:', position);
    
            // Отправляем данные с ожидаемым полем startingPosition
            player.send(JSON.stringify({
                type: 'playerPosition',
                startingPosition: position,
                position: { playerIndex: playerIndex + 1, position },
                map: this.mapData,
                players: this.getPlayersPositions(),
            }));
    
            // Отправляем обновленные данные карты всем игрокам
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
        // Обновление карты на сервере
        this.mapData[y][x] = 0;

        // Рассылка обновлений карты всем игрокам
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
        // Возвращаем позиции игроков из массива startingPositions
        return this.players.map((player, index) => ({
            playerIndex: index + 1,
            position: startingPositions[index], // Используем фиксированную позицию из массива
        }));
    }

    updatePlayerPosition(player, newPosition) {
        const playerIndex = this.players.indexOf(player);
        if (playerIndex !== -1) {
            // Обновляем позицию игрока в массиве startingPositions или используем отдельный массив для хранения позиций
            startingPositions[playerIndex] = newPosition; // Обновляем позицию

            // Отправляем обновленные позиции всем игрокам
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
                ws.sessionId = sessionId;  // Сохраняем sessionId для игрока
                ws.send(JSON.stringify({ type: 'gameCreated', sessionId, map: session.mapData}));
            } else {
                ws.sessionId = session.id;  // Сохраняем sessionId для игрока
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
    
            // Найдите сессию игрока по sessionId
            const session = gameSessions.find(session => session.id === ws.sessionId);
            
            if (session) {
                session.players.forEach(player => player.send(JSON.stringify(mapUpdate)));
            } else {
                console.error('Session not found for updateMap');
            }
        }

        if (data.type === 'movePlayer') {
            // Обработка перемещения игрока
            const { newPosition } = data;
            
            // Найдите сессию игрока по sessionId
            const session = gameSessions.find(session => session.id === ws.sessionId);
            
            if (session) {
                session.updatePlayerPosition(ws, newPosition);
            } else {
                console.error('Session not found for player');
            }
        }
    
        if (data.type === 'placeBomb') {
            // Пересылаем данные о новой бомбе всем игрокам в сессии
            const bombData = {
                type: 'bombPlaced',
                position: data.position,
                radius: data.radius
            };
        
            // Найдите сессию игрока по sessionId
            const session = gameSessions.find(session => session.id === ws.sessionId);
            
            // Проверьте, что сессия существует перед отправкой данных
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
    
            // Отправляем всем оставшимся игрокам обновлённую информацию
            session.players.forEach(p => {
                p.send(JSON.stringify({
                    type: 'playerDisconnected',
                    playerId: ws.sessionId, // Можно использовать другой идентификатор
                }));
            });
        }
    });
});

console.log('WebSocket server is running on ws://localhost:8080');
