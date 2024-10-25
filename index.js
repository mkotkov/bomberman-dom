import { Map } from './components/map.js';
import { Player } from './components/player.js'; // Импорт класса Player
import { on } from './core/events.js';

let player;
let ws;
let sessionId;
let gameMap = {};
const mapContainer = document.getElementById('game');


function initializeWebSocket() {
    ws = new WebSocket('ws://localhost:8080'); // Убедитесь, что URL правильный

    ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'getActiveSessions' }));
    };

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log("Received data:", data);
        if (data.startingPosition) {
            player.setPosition(data.startingPosition.x, data.startingPosition.y);
        } else {
            console.error("Starting position not found in data.");
        }
        

        if (data.type === 'mapUpdate') {
            console.log(`Update gameMap: ${data.map}`);
            gameMap = new Map(mapContainer, data.map);
        }

        if (data.type === 'activeSessions') {
            handleActiveSessions(data.sessions);
        }

        if (data.type === 'gameCreated' || data.type === 'joinedExistingGame') {
            console.log(`Joined game with session ID: ${data.sessionId}`);
            sessionId = data.sessionId;

        
            // Предполагается, что data содержит playerIndex и startingPosition
            const map = new Map (mapContainer, data.map)
            player = new Player(document.createElement('div'), 40, map); // Передайте необходимые параметры
            player.setPosition(data.startingPosition.x, data.startingPosition.y);
        }
        

        if (data.type === 'playerPosition') {
            gameMap = new Map(mapContainer, data.map);
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

        // Отправляем новое положение игрока на сервер, если оно изменилось
        if (oldPosition.x !== player.x || oldPosition.y !== player.y) {
            ws.send(JSON.stringify({ type: 'movePlayer', newPosition: { x: player.x, y: player.y } }));
        }
    }
});


document.addEventListener("DOMContentLoaded", () => {
    initializeWebSocket();
 });
