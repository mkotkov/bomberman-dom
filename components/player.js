import { Bomb } from "./bomb.js";
import { PlayerLives } from './PlayerLives.js';

export class Player {
    constructor(element, speed, gameMap, ws) {
        this.element = element;
        this.speed = speed;
        this.gameMap = gameMap;
        this.ws = ws;
        this.x = 0;
        this.y = 0;
        this.livesManager = new PlayerLives(3); // Manages lives
        this.index = gameMap.players.length; // Player's index in game map
        this.gameMap.addPlayer(this); // Register player on game map
        this.updatePosition(); // Initial position update in the UI
        this.hasTakenDamage = false; // Flag to prevent multiple damage from a single explosion
    }

    // Set position and update visual representation
    setPosition(x, y) {
        this.x = x;
        this.y = y;
        this.updatePosition();
    }

    // Place a bomb and notify server
    placeBomb() {
        const col = Math.floor(this.x / 40); // Calculate grid column
        const row = Math.floor(this.y / 40); // Calculate grid row
        new Bomb(col, row, 1, this.gameMap); // Place bomb on the grid

        if (this.ws) {
            this.ws.send(JSON.stringify({
                type: 'placeBomb',
                position: { x: col, y: row }
            }));
        }
    }

    // Update the player's position in the DOM
    updatePosition() {
        this.element.style.left = `${this.x}px`;
        this.element.style.top = `${this.y}px`;
    }

    // Move player in a given direction
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
        
        // Check if the new position is passable, then update position
        if (this.gameMap.isPassable(newX, newY)) {
            this.setPosition(newX, newY);
        }
    }

    // Handle losing a life, notifying the server, and checking for game-over
    loseLife() {
        if (!this.hasTakenDamage) {  // Prevent multiple damage from the same explosion
            const remainingLives = this.livesManager.loseLife();
            console.log(`Player lost a life. Lives remaining: ${remainingLives}`);
            
            if (this.ws) {
                this.ws.send(JSON.stringify({ type: 'updateLives', playerIndex: this.index, lives: remainingLives }));
            }

            if (remainingLives === 0) {
                console.log("Player has no lives left.");
                // Additional game-over logic can be added here if needed
            }

            this.hasTakenDamage = true;  // Set the flag to true after taking damage
        }
    }

    // Reset the damage flag after each explosion to allow future damage
    resetDamageFlag() {
        this.hasTakenDamage = false;
    }
}
