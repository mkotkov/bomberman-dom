import { Map } from './components/map.js'; // Importing the Map class for game map management
import { Player } from './components/player.js'; // Importing the Player class for player management
import { Bomb } from './components/bomb.js'; // Importing the Bomb class for bomb management
import { on } from './core/events.js'; // Importing the event handling function
import {createElement, renderElements} from './core/dom.js'

let player; // Variable to hold the player instance
let ws; // Variable to hold the WebSocket connection
let sessionId; // Variable to hold the session ID
let gameMap = {}; // Object to hold the game map data
const Container = document.getElementById('game');// Get the game container element
let countdownTimer;
let countdownElement;
let waitingTimer = null;
let waitingTimerActive = false;


let lastTimestamp = 0;

function gameLoop(timestamp) {
    const deltaTime = timestamp - lastTimestamp;
    lastTimestamp = timestamp;

    // Обновляем состояние игрока
    player.update(deltaTime);

    // Обновляем карту
    gameMap.update(deltaTime);

    // Рендерим всё
    gameMap.render();

    requestAnimationFrame(gameLoop);
}


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
        case 'activeSessions':
            handleActiveSessions(data.sessions);
            break;
        case 'sessionUpdate':
            console.log('Session Update:', data);
            updateLobbyAndChat(data.players); // Pass updated players info to updateLobby
            break; // Добавьте break, чтобы избежать попадания в следующие случаи
        case 'gameCreated':
        case 'joinedExistingGame':
            console.log('Session Update:', data);
            updateLobbyAndChat(data.players);
            break;
        case 'gameStart':
            console.log('Game Start:', data);
            initializeGame(data);
            break;
        case 'chatMessage':
            displayChatMessage(data.sender, data.message);
            break;
        case 'mapUpdate':
            updateMap(data);
            break;
        case 'bombPlaced':
            placeBomb(data.position, data.radius);
            break;
        case 'updatePlayerPosition':
            updatePlayerPosition(data.playerIndex, data.position);
            break;
        case 'updatePlayerStats':
            console.log('Game update Player Stats:', data);
            updatePlayerStats(data);
            break;
        case 'playerDisconnected':
        case 'removePlayer':
            console.log('Removing player:', data.playerIndex);
            removePlayer(data.playerIndex);
            checkForWinner(data.players);
            break;
        case 'gameOver':
            console.log(`Game Over! Winner: ${data.name}`);
            displayWinnerMessage(data.winner.name);
            break;
        case 'error':
            console.error(data.message);
            break;
        default:
            console.warn("Unknown message type:", data.type);
    }
}


function promptPlayerName() {

    const namePromptContainer = createElement('div', { id: `namePrompt`});
    const h1 = createElement('h1', { id: `header`}, );
    h1.textContent = 'Bomberman';
    const nameInput = createElement('input', { type: `text`, placeholder: `Enter your name`});

    const submitButton = createElement('button', {});
    submitButton.textContent = 'Join the game';

    renderElements(namePromptContainer, [h1, nameInput, submitButton]);
    document.body.appendChild(namePromptContainer);

    submitButton.addEventListener('click', () => {
        const playerName = nameInput.value.trim();
        if (playerName) {
            sessionStorage.setItem('playerName', playerName); // Store the name
            ws.send(JSON.stringify({ type: 'setName', name: playerName }));
            document.body.removeChild(namePromptContainer);
        } else {
            alert('Please enter a valid name!');
        }
    });
}

// Function to update lobby with player information
function renderLobby(players) {
    const lobbyContainer = createElement('div', { class: 'lobby-container' });
    lobbyContainer.innerHTML = ''; // Clear existing content

    const playerTable = createElement('table');
    const tableHeader = createElement('tr');

    ['#', 'Name', 'Color', 'Lives', 'Bombs', 'Range', 'Speed', 'Position'].forEach(headerText => {
        const th = createElement('th');
        th.textContent = headerText;
        tableHeader.appendChild(th);
    });

    playerTable.appendChild(tableHeader);

    const positions = [
        'Top left corner',
        'Top right corner',
        'Bottom left corner',
        'Bottom right corner'
    ];

    players
        .filter(player => player.name && player.name.trim() !== '')
        .forEach((player, index) => {
            const playerRow = createElement('tr');

            const indexCell = createElement('td');
            indexCell.textContent = `${index + 1}`;
            const nameCell = createElement('td');
            nameCell.textContent = player.name;

            const colorCell = createElement('td');
            colorCell.style.backgroundColor = player.color;
            colorCell.style.width = '20px';
            colorCell.style.height = '20px';

            const livesCell = createElement('td');
            livesCell.textContent = player.lives || 3;

            const bombsCell = createElement('td');
            bombsCell.textContent = player.bombCount || 5;

            const rangeCell = createElement('td');
            rangeCell.textContent = player.explosionRange || 1;

            const speedCell = createElement('td');
            speedCell.textContent = player.speed || 1;

            const positionCell = createElement('td');
            positionCell.textContent = positions[index] || 'Position not set';

            playerRow.append(
                indexCell,
                nameCell,
                colorCell,
                livesCell,
                bombsCell,
                rangeCell,
                speedCell,
                positionCell
            );

            playerTable.appendChild(playerRow);
        });

    lobbyContainer.appendChild(playerTable);
    return lobbyContainer;
}

function renderChat(players) {
    console.log("players---", players)
    const chatContainer = createElement('div', { class: 'chat-container' });

    const chatMessages = createElement('div', { class: 'chat-messages' });
    const chatForm = createElement('form', { class: 'chat-form' });
    const chatInput = createElement('input', {
        class: 'chat-input',
        type: 'text',
        placeholder: 'Enter your message',
    });
    const sendButton = createElement('button', { type: 'submit' });
    sendButton.textContent = 'Send';

    chatForm.append(chatInput, sendButton);
    chatContainer.append(chatMessages, chatForm);

    players.forEach(player => {
        if (player.name) {
            const messageElement = createElement('div', { class: 'chat-message' });
            messageElement.textContent = `Player ${player.name} has joined the chat.`;
            chatMessages.appendChild(messageElement);
            chatMessages.scrollTop = chatMessages.scrollHeight;
            player.messageDisplayed = true;
        }
    });


    sendButton.addEventListener('click', (event) => {
        event.preventDefault(); // Prevent form submission from reloading the page
        const message = chatInput.value.trim();
        if (message) {
            const playerName = sessionStorage.getItem('playerName');
            ws.send(JSON.stringify({
                type: 'chatMessage',
                sender: playerName, // Replace with the actual sender name
                message: message,
            }));
            chatInput.value = ''; // Clear the input field after sending the message
        }
    });


    return chatContainer;
}

function updateLobbyAndChat(players, ws) {
    Container.innerHTML = ''; // Clear container

    const lobbyContent = renderLobby(players);
    const chatContent = renderChat(players, ws);

    // Append both sections to the main container
    Container.append(lobbyContent, chatContent);

    // Additional logic for starting the game
    const allPlayersHaveNames = players.every(player => player.name && player.name.trim() !== '');
    const hasEnoughPlayers = players.length >= 2;

    if (hasEnoughPlayers && allPlayersHaveNames && !waitingTimerActive) {
        waitingTimerActive = true;
        startWaitingPhase(
            () => players.length >= 4 && allPlayersHaveNames,
            () => {
                waitingTimerActive = false;
                console.log('Game Started!');
            }
        );
    } else if (!hasEnoughPlayers || !allPlayersHaveNames) {
        waitingTimerActive = false;
        stopCountdown();
    }
}

function displayChatMessage(sender, message) {
    const chatMessages = document.querySelector('.chat-messages');
    if (chatMessages) {
        const messageElement = createElement('div', { class: 'chat-message' });
        messageElement.textContent = `${sender}: ${message}`;
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight; 
    }
}

function startWaitingPhase(checkUsersReady, startGame) {
    if (waitingTimer) return; // Прерываем, если таймер уже запущен

    let waitingTimeLeft = 30; // Время ожидания двух пользователей
    const waitingElement = document.createElement('div');
    waitingElement.className = 'waiting';
    waitingElement.textContent = `Waiting for players: ${waitingTimeLeft}s`;
    document.body.appendChild(waitingElement);

    waitingTimer = setInterval(() => {
        waitingTimeLeft--;
        waitingElement.textContent = `Waiting for players: ${waitingTimeLeft}s`;

        if (waitingTimeLeft <= 0 || checkUsersReady()) {
            clearInterval(waitingTimer);
            waitingTimer = null;
            document.body.removeChild(waitingElement);
            startCountdown(startGame);
        }
    }, 1000);
}


function startCountdown() {
    if (countdownTimer) return; // Прерываем, если таймер уже запущен

    let secondsLeft = 10; // Количество секунд для обратного отсчёта

    if (!countdownElement) {
        countdownElement = document.createElement('div');
        countdownElement.className = 'countdown';
        document.body.appendChild(countdownElement);
    }

    countdownElement.textContent = `Game starts in: ${secondsLeft}s`;

    countdownTimer = setInterval(() => {
        secondsLeft--;
        countdownElement.textContent = `Game starts in: ${secondsLeft}s`;

        if (secondsLeft <= 0) {
            clearInterval(countdownTimer);
            countdownTimer = null;
            document.body.removeChild(countdownElement);
            countdownElement = null;
            startGame(); // Запускаем игру, когда таймер достигает 0
        }
    }, 1000);
}


function stopCountdown() {
    if (countdownTimer) {
        clearInterval(countdownTimer); // Останавливаем таймер
        countdownTimer = null;

        // Убираем элемент обратного отсчёта с экрана
        if (countdownElement) {
            countdownElement.textContent = '';
        }
    }
}


function startGame() {
    console.log("Starting the game...");
    ws.send(JSON.stringify({ type: 'startGame' }));
    requestAnimationFrame(gameLoop);
}

// Function to update the game map based on server data
function updateMap({ x, y, newValue }) {
    gameMap.mapData[x][y] = newValue; // Update the map data at the specified coordinates
    gameMap.destroyWall(x, y); // Destroy the wall at the specified coordinates
    gameMap.render(); // Re-render the map
}


// Function to initialize the game with the received data
function initializeGame(data) {
    console.log('Player initializeGame data:', data);
    Container.innerHTML = ''; // Очищаем контейнер
    const MapContainer = createElement('div', { class: 'map-container' });
    Container.appendChild(MapContainer);

    // Проверяем, существует ли HUD, и удаляем старый
    let hudContainer = document.querySelector('.hud-container');
    if (hudContainer) {
        document.body.removeChild(hudContainer);
    }

    // Создаем новый HUD
    hudContainer = createElement('div', { class: 'hud-container' });
    document.body.appendChild(hudContainer);

    sessionId = data.sessionId; // Устанавливаем ID сессии
    gameMap = new Map(MapContainer, data.map, ws);

    const playerName = sessionStorage.getItem('playerName');
    player = new Player(document.createElement('div'), 40, gameMap, ws, playerName, data.yourIndex, data.players.lives);

    if (data.position) {
        console.log('Player data.position:', data.position);
        player.setPosition(data.position.x, data.position.y);
    } else {
        console.error("Starting position not found in data.");
    }

    if (Array.isArray(data.players) && data.players.length > 0) {
        console.log('Player render:', data.players);
        renderPlayers(data.players, data.yourIndex);
    } else {
        console.warn("Players data not found or invalid during initialization.");
    }

    // Добавляем HUD информацию для игроков
    data.players.forEach((playerData, index) => {
        const playerInfo = createElement('div', { class: 'player-info', 'data-id': index});

        const nameElement = createElement('span', { class: 'player-name' });
        nameElement.textContent = playerData.name;
        nameElement.style.color = playerData.color;

        const statsElement = createElement('div', { class: 'player-stats' });
        statsElement.innerHTML = `
          Lives: ${playerData.lives}
          Bombs: ${playerData.bombCount}
          Range: ${playerData.explosionRange}
          Speed: ${playerData.speed}
        `;

        playerInfo.appendChild(nameElement);
        playerInfo.appendChild(statsElement);
        hudContainer.appendChild(playerInfo);
    });
}

// Function to render all players on the map
function renderPlayers(players, yourIndex) {
    if (!Array.isArray(players) || players.length === 0) {
        console.error('Invalid players data received.');
        return;
    }

    players.forEach(p => {
        console.log('Player position:', p.position);
        if (p.position) {
            gameMap.renderPlayer(p.playerIndex, p.position.x, p.position.y); // Render each player's position
        } else {
            console.error(`Position not found for player ${p.playerIndex}`);
        }
    });

    // Check if the starting position for the current player is available
    const currentPlayer = players.find(p => p.playerIndex === yourIndex); // Find the current player
    if (currentPlayer && currentPlayer.position) {
        console.log('Current player position:', currentPlayer.position);
        player.setPosition(currentPlayer.position.x, currentPlayer.position.y); // Set player position
    } else {
        console.error("Starting position not found for the current player.");
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

function updatePlayerStats(data) {
    // Пройдемся по каждому игроку в массиве данных
    console.log(data.stats)
    data.stats.forEach(playerData => {
        // Ищем соответствующий элемент игрока по data-id
        const playerInfo = document.querySelector(`.player-info[data-id="${playerData.playerIndex-1}"]`);
        
        if (playerInfo) {
            const statsElement = playerInfo.querySelector('.player-stats');
            if (statsElement) {
                statsElement.innerHTML = `
                    Lives: ${playerData.lives}
                    Bombs: ${playerData.bombCount}
                    Range: ${playerData.explosionRange}
                    Speed: ${playerData.speed}
                `;
            }

            // Обновляем имя игрока и цвет, если нужно
            const nameElement = playerInfo.querySelector('.player-name');
            if (nameElement) {
                nameElement.textContent = playerData.playerName;  // Обновляем имя игрока
                nameElement.style.color = playerData.color;  // Устанавливаем цвет
            }
        }
    });
}



// function updateHUD(players) {
//     const hudContainer = document.querySelector('.hud-container');
//     if (!hudContainer) return;
    
//     // Очищаем текущие данные в HUD
//     hudContainer.innerHTML = ''; 
    
//     players.forEach(player => {
//         // Находим элемент игрока по data-id
//         const playerInfo = document.querySelector(`.player-info[data-id="${player.index}"]`);
//         if (playerInfo) {
//             // Обновляем информацию об игроке
//             const statsElement = playerInfo.querySelector('.player-stats');
//             if (statsElement) {
//                 statsElement.innerHTML = `
//                     Lives: ${player.lives}
//                     Bombs: ${player.bombCount}
//                     Range: ${player.explosionRange}
//                     Speed: ${player.speed}
//                 `;
//             }

//             // Обновляем имя игрока
//             const nameElement = playerInfo.querySelector('.player-name');
//             if (nameElement) {
//                 nameElement.textContent = player.name;  // Предполагаем, что name уже есть в данных игрока
//             }
//         }
//     });
// }

// Function to handle active game sessions
function handleActiveSessions(sessions) {
    if (sessions.length > 0) {
            sessionId = sessions[0]; // Set the session ID to the first available session
            ws.send(JSON.stringify({ 
                type: 'createOrJoinGame', 
                sessionId })); // Join the selected session
    } else {
        ws.send(JSON.stringify({ 
            type: 'createOrJoinGame' 
        })); // Create a new game session if no active sessions
    }
}

function removePlayer(playerId) {

    // Удалить визуальное представление игрока
    const playerElement = document.querySelector(`.player[data-index="${playerId-1}"]`);
    const playerHUB = document.querySelector(`.player-info[data-id="${playerId-1}"]`);
    console.log(`playerElement: ${playerElement}`);
    console.log(`playerHUB: ${playerHUB}`);
    if (playerElement) {
        playerElement.remove();
        playerHUB.remove();
    }

    console.log(`Player ${playerId} removed from the game.`);
}

function displayWinnerMessage(winnerName) {
    Container.innerHTML = ''; 
    const HUB = document.querySelector('.hud-container');
    HUB.remove();
    const messageElement = createElement('div', { class: 'game-over-message' });
    messageElement.textContent = `Game Over! Winner: ${winnerName}`;
    Container.appendChild(messageElement);
}

function checkForWinner(players) {
    const remainingPlayers = players;

    if (remainingPlayers.length === 1) {
        const winner = remainingPlayers[0];
        ws.send(JSON.stringify({ type: 'gameOver', winnerId: winner.playerIndex }));
        displayWinnerMessage(winner.playerName)
    }
}

// Event listener for keyboard input
on(document, 'keydown', (event) => {
    if (player) {
        const oldPosition = { x: player.x, y: player.y }; // Store the old position of the player
        player.move(event.key); // Move the player based on the key pressed

        // Check if the spacebar is pressed to place a bomb
        if (event.key === ' ') {
            if(player.bombCount>0){
                player.placeBomb();
              player.bombCount--;
            }
        }

        // If the player's position has changed, notify the server
        if (oldPosition.x !== player.x || oldPosition.y !== player.y) {
            ws.send(JSON.stringify({ type: 'movePlayer', newPosition: { x: player.x, y: player.y } })); // Send new position to server
        }
    }
});

// Event listener for DOMContentLoaded to initialize the WebSocket connection
document.addEventListener("DOMContentLoaded", () => {
    promptPlayerName();
    initializeWebSocket(); // Call function to initialize WebSocket connection when DOM is fully loaded
});
