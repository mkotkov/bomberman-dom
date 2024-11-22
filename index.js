import { Map } from './components/map.js';
import { Player } from './components/player.js';
import { Bomb } from './components/bomb.js';
import { PlayerLives } from './components/PlayerLives.js';
import { on } from './core/events.js';

const livesContainer = document.getElementById('lives-container');
let player;
let ws;
let sessionId;
let gameMap;
let playerLives;

// Initialize the WebSocket connection
function initializeWebSocket() {
    ws = new WebSocket('ws://localhost:8080');

    ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'getActiveSessions' }));
    };

    ws.onmessage = (event) => handleServerMessage(JSON.parse(event.data));
    ws.onclose = () => console.log('Connection closed');
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

// Update the game map based on server data
function updateMap({ x, y, newValue }) {
    if (!gameMap || !gameMap.mapData || !gameMap.mapData[y] || gameMap.mapData[y][x] === undefined) {
        console.error("Invalid map data or coordinates");
        return;
    }
    gameMap.mapData[y][x] = newValue;
    gameMap.destroyWall(x, y);
}

// Initialize game with received data
function initializeGame(data) {
    sessionId = data.sessionId;
    gameMap = new Map(document.getElementById('game'), data.map, ws);

    player = new Player(document.createElement('div'), 40, gameMap, ws);
    if (data.startingPosition) {
        player.setPosition(data.startingPosition.x, data.startingPosition.y);
        updateLivesDisplay(0, 3);
    } else {
        console.error("Starting position not found in data.");
    }

    initializePlayerLives();
}

// Initialize player lives
function initializePlayerLives(initialLives = 3) {
    playerLives = new PlayerLives(initialLives, (updatedLives) => {
        updateLivesDisplay(0, updatedLives);
    });
}

// Render all players on the map
function renderPlayers(players) {
    players.forEach(p => {
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

// Update player lives based on server data
function updatePlayerLives(playerIndex, lives) {
    console.log(`Player ${playerIndex} lives updated to ${lives}`);
    playerLives.setLives(lives);
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
    playerLivesDisplay.textContent = `Player ${playerIndex} Lives: ${lives}`;
}

// Handle active game sessions
function handleActiveSessions(sessions) {
    if (sessions.length > 0) {
        const joinExisting = confirm(`Available sessions: ${sessions.join(', ')}. Join one?`);
        sessionId = joinExisting ? sessions[0] : null;
        ws.send(JSON.stringify({ type: 'createOrJoinGame', sessionId }));
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

document.addEventListener("DOMContentLoaded", initializeWebSocket);
