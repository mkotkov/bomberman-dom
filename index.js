import { Map } from './components/map.js';
import { Player } from './components/player.js';
import { Bomb } from './components/bomb.js';
import { on } from './core/events.js';

const livesContainer = document.getElementById('lives-container');
let player;
let ws;
let sessionId;
let gameMap = {};
const mapContainer = document.getElementById('game');

// Initialize the WebSocket connection
function initializeWebSocket() {
    ws = new WebSocket('ws://localhost:8080');

    ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'getActiveSessions' }));
    };

    ws.onmessage = (event) => handleServerMessage(JSON.parse(event.data));
    ws.onclose = () => {
        console.log('Connection closed');
    };
}

// Handle messages from the server
function handleServerMessage(data) {
    console.log("Received data:", data);

    switch (data.type) {
        case 'mapUpdate':
            updateMap(data);
            break;
        case 'activeSessions':
            handleActiveSessions(data.sessions);
            break;
        case 'gameCreated':
        case 'joinedExistingGame':
            initializeGame(data);
            break;
        case 'playerPosition':
            renderPlayers(data.players);
            break;
        case 'bombPlaced':
            placeBomb(data.position, data.radius);
            break;
        case 'updatePlayerPosition':
            updatePlayerPosition(data.playerIndex, data.position);
            break;
        case 'updateLives':
            updatePlayerLives(data.playerIndex, data.lives);
            break;
        case 'gameStart':
            console.log(data.message);
            break;
        case 'error':
            console.error(data.message);
            break;
        default:
            console.warn("Unknown message type:", data.type);
    }
}

// Update game map with data from server
function updateMap(data) {
    console.log("Update Map Data Received:", data);

    if (data && data.position && typeof data.position.x === 'number' && typeof data.position.y === 'number' && typeof data.newValue === 'number') {
        const { x, y } = data.position;

        if (gameMap.mapData && gameMap.mapData[y] && gameMap.mapData[y][x] !== undefined) {
            gameMap.mapData[y][x] = data.newValue;
            gameMap.destroyWall(x, y);
            gameMap.render();
        } else {
            console.error("Invalid map coordinates or missing map data at:", { x, y });
        }
    } else {
        console.error("Received invalid data structure:", data);
    }
}

// Initialize game with received data
function initializeGame(data) {
    sessionId = data.sessionId;
    gameMap = new Map(mapContainer, data.map, ws);

    player = new Player(document.createElement('div'), 40, gameMap, ws);
    if (data.startingPosition) {
        player.setPosition(data.startingPosition.x, data.startingPosition.y);
        updateLivesDisplay(0, 3);
    } else {
        console.error("Starting position not found in data.");
    }
}

// Render all players on the map
function renderPlayers(players) {
    players.forEach(p => {
        console.log(`Rendering Player ${p.playerIndex}:`, p);
        const lives = typeof p.lives !== 'undefined' ? p.lives : 3;
        gameMap.renderPlayer(p.playerIndex, p.position.x, p.position.y);
        updateLivesDisplay(p.playerIndex, lives);
    });
}

// Place a bomb at the specified position
function placeBomb(position, radius) {
    new Bomb(position.x, position.y, radius, gameMap);
}

// Update a player's position on the map
function updatePlayerPosition(playerIndex, position) {
    gameMap.renderPlayer(playerIndex, position.x, position.y);
}

// Handle player lives updates
function updatePlayerLives(playerIndex, lives) {
    console.log(`Player ${playerIndex} lives updated to ${lives}`);
    updateLivesDisplay(playerIndex, lives);
}

// Update the lives display in the UI
function updateLivesDisplay(playerIndex, lives) {
    let playerLivesDisplay = document.getElementById(`player-${playerIndex}-lives`);

    if (!playerLivesDisplay) {
        playerLivesDisplay = document.createElement('div');
        playerLivesDisplay.id = `player-${playerIndex}-lives`;
        livesContainer.appendChild(playerLivesDisplay);
    
    }
    playerLivesDisplay.textContent = `Lives: ${lives}`;


    if (typeof lives === 'number') {
        playerLivesDisplay.textContent = `Player ${playerIndex} Lives: ${lives}`;
    } else {
        console.error(`Invalid lives value for player ${playerIndex}: ${lives}`);
        playerLivesDisplay.textContent = `Player ${playerIndex} Lives: 0`;
    }
}

// Handle active game sessions
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

// Event listener for keyboard input
on(document, 'keydown', (event) => {
    if (player) {
        const oldPosition = { x: player.x, y: player.y };
        player.move(event.key);

        if (event.key === ' ') {
            player.placeBomb();
        }

        if (oldPosition.x !== player.x || oldPosition.y !== player.y) {
            ws.send(JSON.stringify({ type: 'movePlayer', newPosition: { x: player.x, y: player.y } }));
        }
    }
});

document.addEventListener("DOMContentLoaded", () => {
    initializeWebSocket();
});
