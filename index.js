import { Map } from './components/map.js';
import { Player } from './components/player.js';
import { Bomb } from './components/bomb.js';
import { PlayerLives } from './components/PlayerLives.js';
import { on } from './core/events.js';

const livesContainer = document.getElementById('lives-container');
let player;
let ws;
let sessionId;
let gameMap = {};
const mapContainer = document.getElementById('game');
let playerLives; // Declare playerLives variable to hold the PlayerLives instance

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

// Update the game map based on server data
function updateMap({ x, y, newValue }) {
    gameMap.mapData[y][x] = newValue;
    gameMap.destroyWall(x, y);
    gameMap.render();
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

    // Initialize the player lives
    initializePlayerLives();
}

// Initialize player lives
function initializePlayerLives(initialLives = 3) {
    playerLives = new PlayerLives(initialLives, (updatedLives) => {
        console.log("Lives updated callback triggered.");
        updateLivesDisplay(0, updatedLives); // Update lives display when lives change
    });
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

// Update player lives based on server data
function updatePlayerLives(playerIndex, lives) {
    console.log(`Player ${playerIndex} lives updated to ${lives}`);
    // Here we assume that the `loseLife` function should be triggered and that it will handle the decrement
    playerLives.loseLife();
    updateLivesDisplay(playerIndex, playerLives.getLives());
}

// Update the lives display in the UI
function updateLivesDisplay(playerIndex, lives) {
    let playerLivesDisplay = document.getElementById(`player-${playerIndex}-lives`);

    if (!playerLivesDisplay) {
        playerLivesDisplay = document.createElement('div');
        playerLivesDisplay.id = `player-${playerIndex}-lives`;
        livesContainer.appendChild(playerLivesDisplay);
    }

    // Update text content for lives or display an error if invalid
    if (typeof lives === 'number') {
        playerLivesDisplay.textContent = `Player ${playerIndex} Lives: ${lives}`;
        console.log(`Updated lives display for player ${playerIndex} on the webpage: Player ${playerIndex} Lives: ${lives}`);
    } else {
        console.error(`Invalid lives value for player ${playerIndex}: ${lives}`);
        playerLivesDisplay.textContent = `Player ${playerIndex} Lives: 0`;
    }
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

        // Place a bomb if spacebar is pressed
        if (event.key === ' ') {
            player.placeBomb();
        }

        // Send new position to the server if it changed
        if (oldPosition.x !== player.x || oldPosition.y !== player.y) {
            ws.send(JSON.stringify({ type: 'movePlayer', newPosition: { x: player.x, y: player.y } }));
        }
    }
});

// Initialize WebSocket connection on DOM load
document.addEventListener("DOMContentLoaded", initializeWebSocket);
