const WebSocket = require('ws');

const startingPositions = [
    { x: 40, y: 40 },       // Верхний левый угол
    { x: 600, y: 40 },      // Верхний правый угол
    { x: 40, y: 600 },      // Нижний левый угол
    { x: 600, y: 600 },     // Нижний правый угол
];  

class GameSession {
    constructor(id, maxPlayers = 4) {
        this.id = id;
        this.maxPlayers = maxPlayers;
        this.players = [];
        console.log(`Creating GameSession with id: ${id}`);
        this.mapData = this.generateMap();
        console.log('Map Data:', this.mapData);
    }

    generateMap() {
        // Генерация карты с фиксированными разрушаемыми стенами и случайными неразрушаемыми стенами
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

            player.send(JSON.stringify({
                type: 'playerPosition',
                position: { playerIndex: playerIndex + 1, position },
                map: this.mapData,
                players: this.getPlayersPositions(),
            }));

            if (this.players.length === this.maxPlayers) {
                this.startGame();
            }
        } else {
            player.send(JSON.stringify({ type: 'error', message: 'Game is full' }));
        }
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
                session = new GameSession(sessionId); // Ensure this line runs without issues
                gameSessions.push(session);
                ws.send(JSON.stringify({ type: 'gameCreated', sessionId }));
            } else {
                ws.send(JSON.stringify({ type: 'joinedExistingGame', sessionId: session.id }));
            }

            session.addPlayer(ws);
        }

        if (data.type === 'movePlayer') {
            // Обработка перемещения игрока
            const { newPosition } = data; // Предполагается, что newPosition передается от клиента
            session.updatePlayerPosition(ws, newPosition);
        }

        if (data.type === 'getActiveSessions') {
            const availableSessions = gameSessions.filter(session => session.players.length < session.maxPlayers);
            ws.send(JSON.stringify({ type: 'activeSessions', sessions: availableSessions.map(session => session.id) }));
        }
    });

    ws.on('close', () => {
        console.log('Player disconnected');
    });
});

console.log('WebSocket server is running on ws://localhost:8080');
