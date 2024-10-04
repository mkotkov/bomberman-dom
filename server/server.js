const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });
const players = [];
let map = generateMap(); // Генерируем карту один раз на сервере

// Функция генерации карты
function generateMap() {
    const MAP_SIZE = 13;
    const map = [];

    for (let row = 0; row < MAP_SIZE; row++) {
        const rowElements = [];
        for (let col = 0; col < MAP_SIZE; col++) {
            if (row === 0 || row === MAP_SIZE - 1 || col === 0 || col === MAP_SIZE - 1 || (row % 2 === 0 && col % 2 === 0)) {
                rowElements.push('wall');
            } else {
                rowElements.push(Math.random() > 0.3 ? 'block' : 'empty');
            }
        }
        map.push(rowElements);
    }
    return map;
}

wss.on('connection', (ws) => {
    console.log('Player connected');
    players.push(ws);

    // Обрабатываем сообщения от клиентов
    ws.on('message', (message) => {
        const parsedMessage = message.toString();
        console.log('Received message:', parsedMessage);

        try {
            const data = JSON.parse(parsedMessage);

            if (data.type === 'join') {
                const playerIndex = players.length - 1;
                const newPlayer = {
                    name: `Player ${playerIndex + 1}`,
                    x: playerIndex * 1, // начальная позиция
                    y: playerIndex * 1, // начальная позиция
                    lives: 3,
                    speed: 1,
                    bombPower: 1
                };

                ws.playerData = newPlayer;

                // Отправляем карту и текущих игроков новому клиенту
                ws.send(JSON.stringify({
                    type: 'map',
                    map: map
                }));

                ws.send(JSON.stringify({
                    type: 'players',
                    players: players.map(p => p.playerData)
                }));

                // Отправляем всем клиентам обновленные данные о новых игроках
                players.forEach(player => {
                    player.send(JSON.stringify({
                        type: 'players',
                        players: players.map(p => p.playerData)
                    }));
                });

                // Если подключились 2 игрока, запускаем игру
                if (players.length === 2) {
                    const startMessage = JSON.stringify({
                        type: 'startGame'
                    });
                    players.forEach(player => {
                        player.send(startMessage);
                    });
                }
            }

            // Логика для движения игроков
            if (data.type === 'move') {
                const player = ws.playerData;
                player.x = data.x;
                player.y = data.y;

                // Отправляем обновленное положение игрока всем остальным
                players.forEach(player => {
                    player.send(JSON.stringify({
                        type: 'players',
                        players: players.map(p => p.playerData)
                    }));
                });
            }

        } catch (error) {
            console.error('Error parsing message:', error);
        }
    });

    ws.on('close', () => {
        console.log('Player disconnected');
        const index = players.indexOf(ws);
        if (index > -1) {
            players.splice(index, 1);
        }

        // Обновляем количество игроков после отключения
        players.forEach(player => {
            player.send(JSON.stringify({
                type: 'players',
                players: players.map(p => p.playerData)
            }));
        });
    });
});

console.log('WebSocket server is running on ws://localhost:8080');
