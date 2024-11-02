// core/game.js

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const socket = new WebSocket('ws://localhost:8080');

let playerIndex = null;
let players = {};
let mapData = [];
let bombs = [];

// Player settings
const playerSize = 30;
const bombRadius = 1; // Bomb radius in terms of grid units

// Connect to the server and create or join a game
socket.addEventListener('open', () => {
    console.log('Connected to the server');
    socket.send(JSON.stringify({ type: 'createOrJoinGame' }));
});

// Handle messages from the server
socket.addEventListener('message', (event) => {
    const data = JSON.parse(event.data);
    
    switch (data.type) {
        case 'playerPosition':
            playerIndex = data.position.playerIndex;
            players[playerIndex] = data.startingPosition;
            mapData = data.map;
            console.log('Map Data:', mapData);
            break;
        case 'updatePlayerPosition':
            const { playerIndex: index, position } = data;
            players[index] = position;
            break;
        case 'mapUpdate':
            mapData = data.map;
            break;
        case 'gameStart':
            console.log(data.message);
            break;
        case 'playerDisconnected':
            delete players[data.playerId];
            break;
        case 'bombPlaced':
            bombs.push(data);
            break;
        case 'bombDetonated':
            handleBombDetonation(data.position);
            break;
        // Add other case handlers as needed
    }
});

// Handle player movement
document.addEventListener('keydown', (event) => {
    let movement = { x: 0, y: 0 };
    
    switch (event.key) {
        case 'ArrowUp':
            movement.y = -playerSize;
            break;
        case 'ArrowDown':
            movement.y = playerSize;
            break;
        case 'ArrowLeft':
            movement.x = -playerSize;
            break;
        case 'ArrowRight':
            movement.x = playerSize;
            break;
        case 'b': // Place bomb
            placeBomb();
            return; // Exit the event
        default:
            return; // Exit if no valid key is pressed
    }

    // Calculate new position and send to server
    const newPosition = {
        x: players[playerIndex].x + movement.x,
        y: players[playerIndex].y + movement.y
    };

    // Check if the move is valid (within bounds and no collision)
    if (isValidMove(newPosition)) {
        players[playerIndex] = newPosition; // Update local position
        socket.send(JSON.stringify({ type: 'movePlayer', newPosition }));
    }
});

// Check if the move is valid
function isValidMove(position) {
    const bounds = {
        x: canvas.width,
        y: canvas.height
    };

    // Check for bounds
    if (
        position.x < 0 || 
        position.x + playerSize > bounds.x || 
        position.y < 0 || 
        position.y + playerSize > bounds.y
    ) {
        return false; // Move is out of bounds
    }

    // Check for wall collisions
    const mapX = Math.floor(position.x / playerSize);
    const mapY = Math.floor(position.y / playerSize);
    
    if (mapData[mapY] && mapData[mapY][mapX] === 1) {
        return false; // There is a wall at the new position
    }

    return true; // Move is valid
}

// Place a bomb at the player's current position
function placeBomb() {
    const position = {
        x: Math.floor(players[playerIndex].x / playerSize),
        y: Math.floor(players[playerIndex].y / playerSize)
    };
    socket.send(JSON.stringify({ type: 'placeBomb', position, radius: bombRadius }));
}

// Handle bomb detonation
function handleBombDetonation(position) {
    // Convert bomb position to grid coordinates
    const bombX = position.x;
    const bombY = position.y;

    // Update map data to destroy walls
    for (let i = -bombRadius; i <= bombRadius; i++) {
        for (let j = -bombRadius; j <= bombRadius; j++) {
            const targetX = bombX + j;
            const targetY = bombY + i;

            if (targetX >= 0 && targetY >= 0 && targetY < mapData.length && targetX < mapData[targetY].length) {
                if (mapData[targetY][targetX] === 1) {
                    mapData[targetY][targetX] = 0; // Destroy wall
                }
            }
        }
    }
}

// Draw the game state
function drawGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas

    // Draw map
    for (let y = 0; y < mapData.length; y++) {
        for (let x = 0; x < mapData[y].length; x++) {
            if (mapData[y][x] === 1) {
                ctx.fillStyle = 'black'; // Wall color
                ctx.fillRect(x * playerSize, y * playerSize, playerSize, playerSize);
            }
        }
    }

    // Draw players
    Object.entries(players).forEach(([index, position]) => {
        ctx.fillStyle = index == playerIndex ? 'blue' : 'green';
        ctx.fillRect(position.x, position.y, playerSize, playerSize);
    });

    // Draw bombs
    bombs.forEach(bomb => {
        ctx.fillStyle = 'red'; // Bomb color
        ctx.fillRect(bomb.position.x * playerSize, bomb.position.y * playerSize, playerSize, playerSize);
    });

    requestAnimationFrame(drawGame); // Keep redrawing
}

// Start the game loop
drawGame();

