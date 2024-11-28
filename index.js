import { Map } from './components/map.js'; // Importing the Map class for game map management
import { Player } from './components/player.js'; // Importing the Player class for player management
import { Bomb } from './components/bomb.js'; // Importing the Bomb class for bomb management
import { on } from './core/events.js'; // Importing the event handling function

// for chat component
import { Chat } from './components/Chat/chat.js';
import { State } from './components/Chat/state.js';


let player; // Variable to hold the player instance
let ws; // Variable to hold the WebSocket connection
let sessionId; // Variable to hold the session ID
let gameMap = {}; // Object to hold the game map data
const mapContainer = document.getElementById('game'); // Get the game container element

// Function to initialize the WebSocket connection
function initializeWebSocket() {
    ws = new WebSocket('ws://localhost:8080'); // Create a new WebSocket connection

    ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'getActiveSessions' })); // Request active sessions when connection opens
    };

    // Handle incoming messages from the server
    ws.onmessage = (event) => handleServerMessage(JSON.parse(event.data));


    ws.onclose = () => {
        console.log('Connection closed'); // Log message when the connection is closed
    };
}

// Function to handle messages received from the server
function handleServerMessage(data) {
    console.log("Received data:", data); // Log the received data

    // Switch case to handle different message types
    switch (data.type) {
        case 'mapUpdate':
            updateMap(data); // Update the map based on received data
            break;
        case 'activeSessions':
            handleActiveSessions(data.sessions); // Handle the list of active sessions
            break;
        case 'gameCreated':
        case 'joinedExistingGame':
            initializeGame(data); // Initialize the game based on received data
            break;
        case 'playerPosition':
            renderPlayers(data.players); // Render the positions of players
            break;
        case 'bombPlaced':
            placeBomb(data.position, data.radius); // Place a bomb based on received data
            break;
        case 'updatePlayerPosition':
            updatePlayerPosition(data.playerIndex, data.position); // Update a player's position
            break;
        case 'gameStart':
            console.log(data.message); // Log a message indicating the game has started
            break;

        case 'CHAT_MESSAGE':
            chat.handleMessage(data); // Handle incoming chat messages
                break;

        case 'error':
            console.error(data.message); // Log any errors received from the server
            break;
        default:
            console.warn("Unknown message type:", data.type); // Warn for unknown message types
    }
}

// Function to update the game map based on server data
function updateMap({ x, y, newValue }) {
    gameMap.mapData[y][x] = newValue; // Update the map data at the specified coordinates
    gameMap.destroyWall(x, y); // Destroy the wall at the specified coordinates
    gameMap.render(); // Re-render the map
}

// Function to initialize the game with the received data
function initializeGame(data) {
    sessionId = data.sessionId; // Set the session ID from the data
    gameMap = new Map(mapContainer, data.map, ws); // Create a new map instance

    // Create a new player instance and set their position
    player = new Player(document.createElement('div'), 40, gameMap, ws);
    if (data.startingPosition) {
        player.setPosition(data.startingPosition.x, data.startingPosition.y); // Set player position
    } else {
        console.error("Starting position not found in data."); // Log error if position is not found
    }
}

// Function to render all players on the map
function renderPlayers(players) {
    players.forEach(p => {
        gameMap.renderPlayer(p.playerIndex, p.position.x, p.position.y); // Render each player's position
    });

    // Check if the starting position for the player is available
    if (data.startingPosition) {
        player.setPosition(data.startingPosition.x, data.startingPosition.y); // Set player position
    } else {
        console.error("Starting position not found in data."); // Log error if position is not found
    }
}

// Function to place a bomb at the specified position
function placeBomb(position, radius) {
    new Bomb(position.x, position.y, radius, gameMap); // Create a new bomb instance
}

// Function to update a player's position on the map
function updatePlayerPosition(playerIndex, position) {
    gameMap.renderPlayer(playerIndex, position.x, position.y); // Render the updated player position
}

// Function to handle active game sessions
function handleActiveSessions(sessions) {
    if (sessions.length > 0) {
        // If there are available sessions, prompt the user to join one
        const joinExisting = confirm(`Available sessions: ${sessions.join(', ')}. Join one?`);
        if (joinExisting) {
            sessionId = sessions[0]; // Set the session ID to the first available session
            ws.send(JSON.stringify({ type: 'createOrJoinGame', sessionId })); // Join the selected session
        } else {
            ws.send(JSON.stringify({ type: 'createOrJoinGame' })); // Create a new game session
        }
    } else {
        ws.send(JSON.stringify({ type: 'createOrJoinGame' })); // Create a new game session if no active sessions
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
