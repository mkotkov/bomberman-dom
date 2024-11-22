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
        this.livesManager = new PlayerLives(3); // Initialize with 3 lives
        this.index = gameMap.players.length; // Index in the players array
        this.hasTakenDamage = false; // Prevent multiple damage from a single event

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
        if (!this.hasTakenDamage) { // Prevent multiple damage
            const remainingLives = this.livesManager.loseLife();
            console.log(`Player lost a life. Lives remaining: ${remainingLives}`);

            // Notify the server about the updated lives
            if (this.ws) {
                this.ws.send(JSON.stringify({
                    type: 'updateLives',
                    playerIndex: this.index,
                    lives: remainingLives
                }));
            }

            // Update the lives display in the UI
            this.updateLivesDisplay();

            if (remainingLives === 0) {
                console.log("Player has no lives left. Game over.");
                // Additional game-over logic can go here
            }

            this.hasTakenDamage = true; // Set the damage flag
        }
    }

    // Update the lives display in the UI
    updateLivesDisplay() {
        const livesDisplay = document.getElementById('lives-display'); // Ensure this ID matches your HTML
        if (livesDisplay) {
            const currentLives = this.livesManager.getLives();
            livesDisplay.innerText = `Player ${this.index + 1} Lives: ${currentLives}`;
        } else {
            console.warn("Lives display element not found");
        }
    }

    // Reset the damage flag to allow taking damage again
    resetDamageFlag() {
        this.hasTakenDamage = false;
    }
}

