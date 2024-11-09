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

// Function to update the game map based on server data
function updateMap({ x, y, newValue }) {
    gameMap.mapData[y][x] = newValue; // Update the map data at the specified coordinates
    gameMap.destroyWall(x, y); // Destroy the wall at the specified coordinates
    gameMap.render(); // Re-render the map
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

     // Check if the starting position for the player is available
    if (data.startingPosition) {
        player.setPosition(data.startingPosition.x, data.startingPosition.y); // Set player position
    } else {
        console.error("Starting position not found in data."); // Log error if position is not found
    }
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
        const oldPosition = { x: player.x, y: player.y }; // Store the old position of the player
        player.move(event.key); // Move the player based on the key pressed

        // Check if the spacebar is pressed to place a bomb
        if (event.key === ' ') {
            player.placeBomb(); // Place a bomb
        }

        // If the player's position has changed, notify the server
        if (oldPosition.x !== player.x || oldPosition.y !== player.y) {
            ws.send(JSON.stringify({ type: 'movePlayer', newPosition: { x: player.x, y: player.y } })); // Send new position to server
        }
    }
});

// Event listener for DOMContentLoaded to initialize the WebSocket connection
document.addEventListener("DOMContentLoaded", () => {
    initializeWebSocket(); // Call function to initialize WebSocket connection when DOM is fully loaded
});