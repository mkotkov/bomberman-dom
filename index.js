import { Map } from './components/map.js';
import { Player } from './components/player.js'; // Импорт класса Player
import { on } from './core/events.js';

let player;
let ws;
let sessionId;

function initializeWebSocket() {
    ws = new WebSocket('https://opulent-xylophone-7vqj75wvr6rfxgjx-8080.app.github.dev/'); // Убедитесь, что URL правильный

    ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'getActiveSessions' }));
    };

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === 'activeSessions') {
            handleActiveSessions(data.sessions);
        }

        if (data.type === 'gameCreated' || data.type === 'joinedExistingGame') {
            console.log(`Joined game with session ID: ${data.sessionId}`);
            sessionId = data.sessionId;
        
            // Предполагается, что data содержит playerIndex и startingPosition
            player = new Player(document.createElement('div'), 40, gameMap); // Передайте необходимые параметры
            player.setPosition(data.startingPosition.x, data.startingPosition.y);
        }
        

        if (data.type === 'playerPosition') {
            const mapContainer = document.getElementById('game');
            const gameMap = new Map(mapContainer, data.map);
            // Создаем игроков на карте
            data.players.forEach(p => {
                gameMap.renderPlayer(p.playerIndex, p.position.x, p.position.y);
            });
        }

        if (data.type === 'updatePlayerPosition') {
            // Обновляем позицию другого игрока
            const { playerIndex, position } = data;
            gameMap.renderPlayer(playerIndex, position.x, position.y);
        }

        if (data.type === 'gameStart') {
            console.log(data.message);
        }

        if (data.type === 'error') {
            console.error(data.message);
        }
    };

    ws.onclose = () => {
        console.log('Connection closed');
    };
}

function handleActiveSessions(sessions) {
    if (sessions.length > 0) {
        const joinExisting = confirm(`Available sessions: ${sessions.join(', ')}. Join one?`);
        if (joinExisting) {
            sessionId = sessions[0];
            ws.send(JSON.stringify({ type: 'createOrJoinGame', sessionId }));
        } else {
            ws.send(JSON.stringify({ type: 'createOrJoinGame' }));
        }
    } else {
        ws.send(JSON.stringify({ type: 'createOrJoinGame' }));
    }
}

on(document, 'keydown', (event) => {
    if (player) {
        const oldPosition = { x: player.x, y: player.y }; // Сохраняем старую позицию
        player.move(event.key);
        if (event.key === ' ') {
            player.placeBomb();
        }
        
        // Отправляем новое положение игрока
        if (oldPosition.x !== player.x || oldPosition.y !== player.y) {
            ws.send(JSON.stringify({ type: 'movePlayer', newPosition: { x: player.x, y: player.y } }));
        }
    }
});

initializeWebSocket();
