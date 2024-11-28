import { Bomb } from "./bomb.js";
import { PlayerLives } from './PlayerLives.js';

export class Player {
    constructor(element, size, gameMap, ws) {
        this.element = element;
        this.size = size; // Tile size
        this.gameMap = gameMap; // Reference to the game map
        this.ws = ws; // WebSocket instance
        this.speed = size; // Movement increment equals tile size
        this.x = 0; // Initial x position
        this.y = 0; // Initial y position
        this.livesManager = new PlayerLives(this, 3); // Initialize with 3 lives
        this.index = gameMap.players.length; // Index in the players array
        this.hasTakenDamage = false; // Prevent multiple damage from a single event
        this.isGameOver = false; // Tracks if the game is over for this player

        // Set up the player element
        this.element.className = "player";
        this.element.style.width = `${size}px`;
        this.element.style.height = `${size}px`;

        // Append the player to the game map container
        this.gameMap.container.appendChild(this.element);
        this.gameMap.addPlayer(this); // Register the player in the map

        // Initial position update in the UI
        this.updatePosition();

        // Initial lives display
        this.updateLivesDisplay();
    }

    // Set the player's position
    setPosition(x, y) {
        this.x = x;
        this.y = y;
        this.updatePosition();
    }

    // Update the player's position in the UI
    updatePosition() {
        this.element.style.left = `${this.x}px`;
        this.element.style.top = `${this.y}px`;
    }

    // Place a bomb at the player's current location
    placeBomb() {
        if (this.isGameOver) return; // Prevent bomb placement if the game is over

        const col = Math.floor(this.x / this.size); // Determine column index
        const row = Math.floor(this.y / this.size); // Determine row index
        new Bomb(col, row, 1, this.gameMap); // Create a new bomb at this position

        // Notify the server about the bomb placement
        if (this.ws) {
            this.ws.send(JSON.stringify({
                type: 'placeBomb',
                position: { x: col, y: row }
            }));
        }
    }

    // Move the player based on input
    move(direction) {
        if (this.isGameOver) return; // Prevent movement if the game is over

        let newX = this.x;
        let newY = this.y;

        switch (direction) {
            case 'ArrowUp':
                newY -= this.speed;
                break;
            case 'ArrowDown':
                newY += this.speed;
                break;
            case 'ArrowLeft':
                newX -= this.speed;
                break;
            case 'ArrowRight':
                newX += this.speed;
                break;
            default:
                return;
        }

        // Check if the new position is walkable, then update
        if (this.gameMap.isTileWalkable(newX, newY)) {
            this.setPosition(newX, newY);

            // Notify the server about the move
            if (this.ws) {
                this.ws.send(JSON.stringify({
                    type: 'movePlayer',
                    newPosition: { x: newX, y: newY }
                }));
            }
        }
    }

    // Handle the player losing a life
        loseLife() {
            if (!this.hasTakenDamage) {
                const remainingLives = this.livesManager.loseLife();  // Prevent multiple damage
                console.log(`Player ${this.index + 1} lost a life. Lives remaining: ${remainingLives}`);
    
                // Notify the server about the updated lives
                this.notifyServerAboutLives(remainingLives);
    
                if (remainingLives === 0) {
                    console.log(`Player ${this.index + 1} has no lives left. Game over.`);
                    this.endGame(); // Trigger the game-over state
                }
    
                this.hasTakenDamage = true; // Set the damage flag
            }
        }

        notifyServerAboutLives(lives) {
            if (this.ws) {
                this.ws.send(JSON.stringify({
                    type: 'updateLives',
                    playerIndex: this.index,
                    lives: lives
                }));
            }
        }

    // Update the lives display in the UI
    updateLivesDisplay() {
        const livesContainer = document.getElementById('lives-container'); // Ensure this ID matches your HTML
        if (livesContainer) {
            // Clear existing displays
            livesContainer.innerHTML = '';
            // Update lives for all players
            this.gameMap.players.forEach((player, index) => {
                const playerLivesElement = document.createElement('div');
                playerLivesElement.id = `player-${index}-lives`;
                playerLivesElement.innerText = `Player ${index + 1} Lives: ${player.livesManager.getLives()}`;
                livesContainer.appendChild(playerLivesElement);
            });
        } else {
            console.warn("Lives container element not found");
        }
    }

    // Reset the damage flag to allow taking damage again
    resetDamageFlag() {
        this.hasTakenDamage = false;
    }

    handleLifeUpdate(playerIndex, lives) {
        const player = this.gameMap.players[playerIndex];
        if (player) {
            player.livesManager.setLives(lives);
        }
    }

    // Handle the game-over state
    endGame() {
        this.isGameOver = true; // Prevent further actions
        this.element.classList.add("game-over"); // Optional: Add a "game-over" class for styling

        // Display a game-over message
        const gameOverMessage = document.createElement("div");
        gameOverMessage.id = "game-over-message";
        gameOverMessage.innerText = "Game Over!";
        gameOverMessage.style.position = "absolute";
        gameOverMessage.style.top = "50%";
        gameOverMessage.style.left = "50%";
        gameOverMessage.style.transform = "translate(-50%, -50%)";
        gameOverMessage.style.fontSize = "2rem";
        gameOverMessage.style.color = "red";
        document.body.appendChild(gameOverMessage);
    }
}
